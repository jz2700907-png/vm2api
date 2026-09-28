"""Mix narration, score and sound effects into build/mix.wav (ducking + bus compression + limiter)."""
import os
import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import maximum_filter1d

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
B = lambda n: os.path.join(ROOT, "build", n)
db = lambda x: 10 ** (x / 20)

music, sr = sf.read(B("music.wav"), always_2d=True)
sfx, _ = sf.read(B("sfx.wav"), always_2d=True)
vo, _ = sf.read(B("vo.wav"), always_2d=True)
vo_dry, _ = sf.read(B("vo_dry.wav"))
n = min(len(music), len(sfx), len(vo))
music, sfx, vo, vo_dry = music[:n].T, sfx[:n].T, vo[:n].T, vo_dry[:n]


def follower(x, att, rel):
    """One-pole envelope follower with separate attack/release (seconds)."""
    a, r = np.exp(-1 / (att * sr)), np.exp(-1 / (rel * sr))
    # fast approximation: smooth with release filter, then attack filter on the rectified signal
    env = signal.lfilter([1 - r], [1, -r], x)
    env = np.maximum(env, x * 0)
    return signal.lfilter([1 - a], [1, -a], env)


def compress(x, thr_db, ratio, att=0.02, rel=0.25):
    lvl = np.sqrt(follower(np.mean(x ** 2, axis=0), att, rel) + 1e-12)
    thr = db(thr_db)
    g = np.where(lvl > thr, (lvl / thr) ** (1 / ratio - 1), 1.0)
    return x * g


m = compress(music * db(-4), -18, 2.0)
s = compress(sfx * db(-9), -16, 3.0, 0.005, 0.2)
v = vo * db(1.5)

# ducking keyed from the dry narration
env = np.sqrt(follower(vo_dry ** 2, 0.02, 0.45) + 1e-12)
d = np.clip((20 * np.log10(env + 1e-9) + 42) / 14, 0, 1)
d = signal.lfilter([1 - np.exp(-1 / (0.08 * sr))], [1, -np.exp(-1 / (0.08 * sr))], d)
mix = (m * (1 - 0.5 * d) + s * (1 - 0.3 * d) + v) * db(3)

# brickwall-ish limiter with 5 ms look-ahead
look = int(0.005 * sr)
peak = maximum_filter1d(np.max(np.abs(mix), axis=0), size=2 * look + 1)
thr = db(-1.2)
g = np.minimum(1.0, thr / (peak + 1e-9))
rel = np.exp(-1 / (0.15 * sr))
g = signal.lfilter([1 - rel], [1, -rel], g - 1) + 1  # smooth recovery
g = np.minimum(g, thr / (peak + 1e-9))
mix = mix * g
mix = np.clip(mix, -db(-1.0), db(-1.0))

# loudness report (crude gated RMS)
mono = mix.mean(axis=0)
w = int(0.4 * sr)
blocks = np.array([np.mean(mono[i:i + w] ** 2) for i in range(0, len(mono) - w, w // 4)])
blocks = blocks[blocks > db(-60) ** 2]
print("gated RMS dBFS: %.1f" % (10 * np.log10(np.mean(blocks))), "peak: %.2f" % np.max(np.abs(mix)))
fade = int(1.5 * sr)
mix[:, -fade:] *= np.linspace(1, 0, fade)
sf.write(B("mix.wav"), mix.T.astype(np.float32), sr, subtype="FLOAT")
print("wrote build/mix.wav", mix.shape[1] / sr, "s")
