"""Sampled-orchestra engine shared by the score scripts.

One MIDI file per instrument section, rendered with fluidsynth (MuseScore General SF2),
then mixed with per-stem gains and a convolution hall.  Import it, write notes into the
module-level stems, then call render_and_mix().
"""
import os, subprocess
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import mido
import soundfile as sf
from scipy import signal

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SR = 48000
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)
bt = lambda bar, beat=0.0: bar * BAR + beat * BEAT


class Stem:
    def __init__(self, name, bank, prog, drum=False, pan=64, gain=1.0, verb=0.3, hp=40, human=0.008):
        self.name, self.bank, self.prog, self.drum = name, bank, prog, drum
        self.pan, self.gain, self.verb, self.hp, self.human = pan, gain, verb, hp, human
        self.notes = []   # (t, dur, pitch, vel)
        self.ccs = []     # (t, num, val)

    def n(self, t, dur, pitch, vel=80, legato=False):
        j = 0 if self.drum else rng.normal(0, self.human)
        v = int(np.clip(vel + rng.normal(0, 4), 1, 127))
        self.notes.append((max(0.0, t + j), dur + (0.04 if legato else 0), int(pitch), v))

    def chord(self, t, dur, pitches, vel=80):
        for p in pitches:
            self.n(t, dur, p, vel)

    def cc(self, t, num, val):
        self.ccs.append((t, num, int(np.clip(val, 0, 127))))

    def ramp(self, t0, t1, v0, v1, num=11, curve=1.0):
        steps = max(2, int((t1 - t0) / 0.05))
        for i in range(steps + 1):
            u = i / steps
            self.cc(t0 + (t1 - t0) * u, num, v0 + (v1 - v0) * (u ** curve))

    def write(self, path):
        tpb = 960
        to_tick = lambda s: int(round(s / BEAT * tpb))
        ch = 9 if self.drum else 0
        ev = []
        # prevent a note-off from cutting a re-struck note of the same pitch
        by_pitch = {}
        for t, d, p, v in sorted(self.notes):
            by_pitch.setdefault(p, []).append([t, d, v])
        for p, lst in by_pitch.items():
            for i, (t, d, v) in enumerate(lst):
                end = t + d
                if i + 1 < len(lst):
                    end = min(end, lst[i + 1][0] - 0.004)
                end = max(end, t + 0.02)
                ev.append((to_tick(t), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
                ev.append((to_tick(end), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))
        for t, num, val in self.ccs:
            ev.append((to_tick(t), -1, mido.Message("control_change", channel=ch, control=num, value=val)))
        ev.sort(key=lambda e: (e[0], e[1]))
        mid = mido.MidiFile(ticks_per_beat=tpb)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
        if not self.drum:
            tr.append(mido.Message("control_change", channel=ch, control=0, value=self.bank, time=0))
            tr.append(mido.Message("control_change", channel=ch, control=32, value=0, time=0))
        tr.append(mido.Message("program_change", channel=ch, program=self.prog, time=0))
        tr.append(mido.Message("control_change", channel=ch, control=7, value=110, time=0))
        tr.append(mido.Message("control_change", channel=ch, control=10, value=self.pan, time=0))
        if not any(num == 11 for _, num, _ in self.ccs):
            tr.append(mido.Message("control_change", channel=ch, control=11, value=110, time=0))
        last = 0
        for tick, _, msg in ev:
            tr.append(msg.copy(time=tick - last))
            last = tick
        mid.save(path)


S = {}
def stem(name, *a, **k):
    S[name] = Stem(name, *a, **k)
    return S[name]

vln1 = stem("vln1", 20, 49, pan=40, verb=0.4, hp=150)          # Violins Slow
vln1f = stem("vln1_fast", 20, 48, pan=40, verb=0.35, hp=150)   # Violins Fast
vln2 = stem("vln2", 25, 49, pan=52, verb=0.4, hp=120)
vln2f = stem("vln2_fast", 25, 48, pan=52, verb=0.35, hp=120)
vla = stem("vla", 30, 49, pan=74, verb=0.4, hp=90)
vlaf = stem("vla_fast", 30, 48, pan=74, verb=0.35, hp=90)
vc = stem("vc", 40, 49, pan=86, verb=0.35, hp=45)
vcf = stem("vc_fast", 40, 48, pan=86, verb=0.3, hp=45)
cb = stem("cb", 50, 49, pan=94, verb=0.3, hp=30)
cbf = stem("cb_fast", 50, 48, pan=94, verb=0.25, hp=30)
trem = stem("trem", 0, 44, pan=64, verb=0.4, hp=60)
pizz = stem("pizz", 0, 45, pan=70, verb=0.35, hp=60)
vsolo = stem("violin_solo", 0, 40, pan=60, verb=0.45, hp=150)
csolo = stem("cello_solo", 0, 42, pan=72, verb=0.45, hp=60)
horns = stem("horns", 0, 60, pan=50, verb=0.45, hp=60)
tpt = stem("trumpets", 0, 56, pan=70, verb=0.4, hp=150)
tbn = stem("trombones", 0, 57, pan=82, verb=0.4, hp=50)
tuba = stem("tuba", 0, 58, pan=90, verb=0.35, hp=25)
brass = stem("brass_section", 0, 61, pan=64, verb=0.4, hp=60)
choir = stem("choir", 0, 52, pan=64, verb=0.55, hp=100)
oohs = stem("oohs", 0, 53, pan=64, verb=0.6, hp=100)
timp = stem("timpani", 0, 47, pan=64, verb=0.35, hp=30)
taiko = stem("taiko", 0, 116, pan=64, verb=0.3, hp=30, human=0.0)
bdrum = stem("bass_drum", 8, 116, pan=64, verb=0.35, hp=20, human=0.0)
kit = stem("orch_kit", 0, 48, drum=True, pan=64, verb=0.35, hp=40)
revcym = stem("rev_cymbal", 0, 119, pan=64, verb=0.3, hp=200, human=0.0)
piano = stem("piano", 0, 0, pan=64, verb=0.35, hp=40)
harp = stem("harp", 0, 46, pan=40, verb=0.45, hp=60)
cel = stem("celesta", 0, 8, pan=84, verb=0.5, hp=200)
glock = stem("glock", 0, 9, pan=80, verb=0.5, hp=300)
tbells = stem("tubular_bells", 0, 14, pan=50, verb=0.55, hp=80)
koto = stem("koto", 8, 107, pan=44, verb=0.4, hp=80)
flute = stem("flute", 0, 73, pan=58, verb=0.45, hp=200)
clar = stem("clarinet", 0, 71, pan=76, verb=0.45, hp=120)
pad = stem("pad", 0, 94, pan=64, verb=0.5, hp=80)
saw = stem("synth_arp", 0, 81, pan=64, verb=0.25, hp=150)

CH = {  # chord tones (upper voicing, one octave from middle C) and bass root
    "Dm": ([62, 65, 69], 38), "Bb": ([62, 65, 70], 34), "F": ([60, 65, 69], 41), "C": ([60, 64, 67], 36),
    "Gm": ([62, 67, 70], 43), "Am": ([60, 64, 69], 45), "A": ([61, 64, 69], 45), "D": ([62, 66, 69], 38),
    "Bm": ([62, 66, 71], 35), "G": ([62, 67, 71], 43), "Asus": ([62, 64, 69], 45), "Eb": ([63, 67, 70], 39),
}
PROG = {}
def setprog(b0, chords):
    for i, c in enumerate(chords):
        PROG[b0 + i] = c


def strings_pad(b0, b1, dyn=70, top=True, low=True, legato=True):
    """Sectional string chords: basses/celli on the root, violas/violins on the chord."""
    for b in range(b0, b1):
        tones, r = CH[PROG[b]]
        t, d = bt(b), BAR
        if low:
            cb.n(t, d, r, dyn, legato); vc.n(t, d, r + 12, dyn, legato)
        vla.n(t, d, tones[0], dyn - 5, legato)
        vln2.n(t, d, tones[1], dyn - 5, legato)
        if top:
            vln1.n(t, d, tones[2] + 12 if tones[2] < 67 else tones[2], dyn - 3, legato)


def melody(stem_, notes, bar0, octave=0, vel=85, legato=True, beat0=0.0):
    pos = beat0
    for p, d in notes:
        if p is not None:
            stem_.n(bt(bar0, pos), d * BEAT * (1.0 if legato else 0.85), p + octave, vel, legato)
        pos += d


def arp(stem_, b0, b1, pattern, rate=0.5, vel=60, octave=0, dur=None):
    """pattern: list of indices into [root+12, t0, t1, t2, t0+12, t1+12, t2+12, t2+24]."""
    for b in range(b0, b1):
        tones, r = CH[PROG[b]]
        pool = [r + 12, tones[0], tones[1], tones[2], tones[0] + 12, tones[1] + 12, tones[2] + 12, tones[2] + 24]
        steps = int(4 / rate)
        for k in range(steps):
            p = pool[pattern[k % len(pattern)]] + octave
            stem_.n(bt(b, k * rate), dur or rate * BEAT * 1.6, p, vel * (1.0 if k % (steps // 4 or 1) == 0 else 0.82))


def ostinato16(stem_, b0, b1, octave=0, vel=78, pattern=(0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0, 3, 1, 2, 1)):
    for b in range(b0, b1):
        tones, r = CH[PROG[b]]
        pool = [r + octave, r + 12 + octave, tones[2] - 12 + octave if tones[2] - 12 + octave > r + octave else tones[2] + octave, tones[1] - 12 + octave + 12]
        for k in range(16):
            acc = 1.0 if k % 4 == 0 else (0.86 if k % 2 == 0 else 0.74)
            stem_.n(bt(b, k * 0.25), 0.25 * BEAT * 0.9, pool[pattern[k]], int(vel * acc))


# kit note numbers (GM percussion map; orchestra kit uses the same keys)
BD, SN, CRASH, CRASH2 = 36, 38, 49, 57


def hit(t, vel=120, big=True):
    """Tutti trailer hit: taiko + concert bass drum + timpani + cymbal (+ low brass stab)."""
    taiko.n(t, 2.0, 41, vel); taiko.n(t, 2.0, 36, vel)
    bdrum.n(t, 3.0, 36, vel)
    timp.n(t, 2.5, 38, vel)
    kit.n(t, 3.0, CRASH, vel - 10)
    if big:
        kit.n(t, 3.0, CRASH2, vel - 20)
        tbn.chord(t, 1.2, [38, 45, 50], vel); tuba.n(t, 1.4, 26, vel)
        brass.chord(t, 0.9, [50, 57, 62], vel - 10)


def swell(t_end, dur=2.0, vel=100):
    revcym.n(t_end - dur, dur, 60, vel)


def timp_roll(t0, t1, pitch=38, v0=30, v1=110):
    n = int((t1 - t0) / 0.07)
    for i in range(n):
        timp.n(t0 + i * 0.07, 0.12, pitch, int(v0 + (v1 - v0) * (i / max(1, n - 1)) ** 1.5))


def snare_roll(t0, t1, v0=30, v1=110):
    n = int((t1 - t0) / 0.055)
    for i in range(n):
        kit.n(t0 + i * 0.055, 0.05, SN, int(v0 + (v1 - v0) * (i / max(1, n - 1)) ** 1.6))


GAIN_DB = {
    "trombones": -7, "tuba": -4, "horns": -1, "trumpets": -1, "brass_section": -3, "choir": -3, "oohs": 3,
    "timpani": -1, "taiko": 0, "bass_drum": 2, "orch_kit": 0, "rev_cymbal": 0,
    "vln1": 3, "vln2": 3, "vla": 3, "vc": 3, "cb": 3,
    "vln1_fast": 5, "vln2_fast": 6, "vla_fast": 6, "vc_fast": 8, "cb_fast": 8, "trem": 5, "pizz": 16,
    "cello_solo": 3, "violin_solo": 9, "flute": 2, "clarinet": 4, "koto": 7, "harp": 5, "piano": 7,
    "celesta": 6, "glock": 4, "tubular_bells": 5, "pad": 3, "synth_arp": 9,
}


def hall(secs=3.0, seed=3):
    n = int(secs * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)]) * np.exp(-t / (secs / 6.9))
    sos = signal.butter(1, 5200 / (SR / 2), "low", output="sos")
    ir = signal.sosfilt(sos, ir, axis=1)
    pre = int(0.022 * SR)
    ir = np.concatenate([np.zeros((2, pre)), ir], axis=1)
    ir[:, pre:pre + int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
    return ir / np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))


def render_and_mix(dur, out, stem_dir, sf2, jobs=4, mix_only=False, sections=(), gain_db=None):
    """Render every stem that has notes, mix them and write `out`. Returns the stereo mix."""
    os.makedirs(stem_dir, exist_ok=True)
    active = {k: s for k, s in S.items() if s.notes}

    def render(name):
        s = active[name]
        mid = os.path.join(stem_dir, name + ".mid")
        wav = os.path.join(stem_dir, name + ".wav")
        s.write(mid)
        subprocess.run(["fluidsynth", "-ni", "-q", "-R", "0", "-C", "0", "-g", "0.6", "-r", str(SR),
                        "-o", "synth.polyphony=1024", "-F", wav, sf2, mid], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return name

    if not mix_only:
        print("rendering", len(active), "stems...")
        with ThreadPoolExecutor(jobs) as ex:
            for n in ex.map(render, active):
                print(" ", n)

    gains = dict(GAIN_DB, **(gain_db or {}))
    N = int(dur * SR)
    dry = np.zeros((2, N)); send = np.zeros((2, N))
    mono = {}
    for name, s in active.items():
        x, _ = sf.read(os.path.join(stem_dir, name + ".wav"), always_2d=True)
        x = x.T[:, :N]
        if x.shape[1] < N:
            x = np.pad(x, ((0, 0), (0, N - x.shape[1])))
        sos = signal.butter(2, s.hp / (SR / 2), "high", output="sos")
        x = signal.sosfilt(sos, x, axis=1) * 10 ** (gains.get(name, 0) / 20)
        dry += x; send += x * s.verb
        mono[name] = np.mean(x, axis=0)
    for sec, a, b in sections:
        seg = {k: 20 * np.log10(np.sqrt(np.mean(v[int(a * SR):int(b * SR)] ** 2)) + 1e-12) for k, v in mono.items()}
        top = sorted(((k, v) for k, v in seg.items() if v > -60), key=lambda kv: -kv[1])[:8]
        print(f"  {sec:12s}", "  ".join(f"{k}:{v:.0f}" for k, v in top))
    ir = hall()
    wet = np.stack([signal.fftconvolve(send[0], ir[0])[:N], signal.fftconvolve(send[1], ir[1])[:N]])
    mix = dry + wet * 0.85
    # gentle glue: soft-knee bus compression + normalisation
    lvl = np.sqrt(signal.lfilter([0.0005], [1, -0.9995], np.mean(mix ** 2, axis=0)) + 1e-12)
    thr = np.percentile(lvl[lvl > 1e-5], 85)
    g = np.where(lvl > thr, (lvl / thr) ** (1 / 2.0 - 1), 1.0)
    mix *= g
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89
    sf.write(out, mix.T.astype(np.float32), SR, subtype="FLOAT")
    print("wrote", os.path.relpath(out, ROOT))
    return mix
