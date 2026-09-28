"""Synthesize the Chinese narration with a local Kokoro model (sherpa-onnx).

Writes build/vo.wav (48 kHz stereo, processed) and build/vo.json (line timings for subtitles).
Usage: python3 tools/vo.py --model <kokoro-multi-lang-v1_0 dir>
"""
import argparse, json, os
import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SR = 48000

ap = argparse.ArgumentParser()
ap.add_argument("--model", required=True)
ap.add_argument("--sid", type=int, default=49)        # zm_yunjian
ap.add_argument("--speed", type=float, default=0.9)
ap.add_argument("--semitones", type=float, default=1.0)  # pitch the voice down this much
args = ap.parse_args()

import sherpa_onnx
d = args.model.rstrip("/") + "/"
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(
    model=sherpa_onnx.OfflineTtsModelConfig(
        kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=d + "model.onnx", voices=d + "voices.bin", tokens=d + "tokens.txt",
            data_dir=d + "espeak-ng-data", dict_dir=d + "dict",
            lexicon=d + "lexicon-us-en.txt," + d + "lexicon-zh.txt"),
        num_threads=4),
    rule_fsts=d + "phone-zh.fst," + d + "date-zh.fst," + d + "number-zh.fst",
    max_num_sentences=1))

story = json.load(open(os.path.join(ROOT, "story.json")))
dur = story["duration"]
ratio = 2 ** (args.semitones / 12)


def biquad(kind, f, q=0.707, gain_db=0.0):
    """RBJ cookbook biquad coefficients at SR."""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f / SR
    cw, sw = np.cos(w), np.sin(w)
    al = sw / (2 * q)
    if kind == "hp":
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]; a = [1 + al, -2 * cw, 1 - al]
    elif kind == "lowshelf":
        sa = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * cw + sa), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - sa)]
        a = [(A + 1) + (A - 1) * cw + sa, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - sa]
    elif kind == "peak":
        b = [1 + al * A, -2 * cw, 1 - al * A]; a = [1 + al / A, -2 * cw, 1 - al / A]
    else:
        raise ValueError(kind)
    return np.array(b) / a[0], np.array(a) / a[0]


def process(x):
    for kind, f, q, g in [("hp", 70, 0.7, 0), ("lowshelf", 180, 0.7, 3.0), ("peak", 350, 1.0, -2.0),
                          ("peak", 3200, 1.0, 2.5), ("peak", 7000, 0.8, -1.5)]:
        b, a = biquad(kind, f, q, g)
        x = signal.lfilter(b, a, x)
    # gentle compression: envelope follower + soft knee
    env = signal.lfilter([0.002], [1, -0.998], np.abs(x))
    env = np.maximum(env, 1e-4)
    thr = 0.08
    gain = np.where(env > thr, (thr / env) ** 0.45, 1.0)
    x = x * gain
    return x / (np.max(np.abs(x)) + 1e-9) * 0.9


def trim(x, thr=0.01):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.02 * SR))
    b = min(len(x), idx[-1] + int(0.08 * SR))
    return x[a:b]


track = np.zeros(int(dur * SR) + SR * 4)
out_lines = []
for line in story["vo"]:
    a = tts.generate(line["zh"], sid=args.sid, speed=args.speed * ratio)
    x = np.asarray(a.samples, dtype=np.float64)
    # resample 24k -> 48k * ratio (longer => lower pitch, restores the speed)
    up = int(round(SR * ratio)); down = a.sample_rate
    g = np.gcd(up, down)
    x = signal.resample_poly(x, up // g, down // g)
    x = trim(process(x))
    s = int(line["t"] * SR)
    track[s:s + len(x)] += x
    out_lines.append({**line, "dur": round(len(x) / SR, 3)})
    print(f'{line["id"]} t={line["t"]:6.1f} dur={len(x)/SR:5.2f} end={line["t"] + len(x)/SR:6.2f}  {line["zh"]}')

# overlap check
for p, n in zip(out_lines, out_lines[1:]):
    if p["t"] + p["dur"] > n["t"] - 0.3:
        print("WARNING overlap/tight:", p["id"], "->", n["id"])

# small stereo room reverb
rng = np.random.default_rng(7)
n = int(1.6 * SR)
tt = np.arange(n) / SR
ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)]) * np.exp(-tt / 0.35)
b, a_ = signal.butter(2, 5000 / (SR / 2))
ir = signal.lfilter(b, a_, ir, axis=1)
ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
wet = np.stack([signal.fftconvolve(track, ir[0])[:len(track)], signal.fftconvolve(track, ir[1])[:len(track)]])
st = np.stack([track, track]) * 0.9 + wet * 0.16
st = st[:, :int(dur * SR)]
os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
sf.write(os.path.join(ROOT, "build", "vo.wav"), st.T.astype(np.float32), SR, subtype="FLOAT")
# dry mono envelope source for ducking
sf.write(os.path.join(ROOT, "build", "vo_dry.wav"), track[:int(dur * SR)].astype(np.float32), SR, subtype="FLOAT")
json.dump(out_lines, open(os.path.join(ROOT, "build", "vo.json"), "w"), ensure_ascii=False, indent=1)
print("wrote build/vo.wav, build/vo.json")
