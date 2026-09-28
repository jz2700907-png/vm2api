"""Original procedural score + sound design for the trailer (96 BPM, D minor -> D major).

Writes build/music.wav and build/sfx.wav (48 kHz stereo float). Everything is synthesised here;
no samples are used. Timings match the visual cues in js/scenes_*.js.
"""
import os, json
import numpy as np
from scipy import signal
import soundfile as sf

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SR = 48000
BPM = 96
BEAT = 60 / BPM          # 0.625 s
BAR = 4 * BEAT            # 2.5 s
DUR = 190.0
N = int((DUR + 8) * SR)
rng = np.random.default_rng(2024)

MUS = np.zeros((2, N))   # dry music
MUSV = np.zeros((2, N))  # music reverb send
SFX = np.zeros((2, N))
SFXV = np.zeros((2, N))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(sig, t, pan=0.0, gain=1.0, bus="mus", verb=0.3):
    """Add a mono (n,) or stereo (2,n) signal at time t (s)."""
    if t < 0:
        cut = int(-t * SR)
        sig = sig[..., cut:]
        t = 0
    s = int(t * SR)
    if sig.ndim == 1:
        a = np.pi / 4 * (pan + 1)
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
    n = min(sig.shape[1], N - s)
    if n <= 0:
        return
    dry, wet = (MUS, MUSV) if bus == "mus" else (SFX, SFXV)
    dry[:, s:s + n] += sig[:, :n] * gain
    wet[:, s:s + n] += sig[:, :n] * gain * verb


def tt(d):
    return np.arange(int(d * SR)) / SR


def env_adsr(n, a, d, s, r, sus_level):
    """ADSR over n samples; a/d/r in seconds."""
    e = np.full(n, sus_level, dtype=float)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na, endpoint=False) if na else e[:na]
    nd2 = min(nd, max(0, n - na))
    if nd2:
        e[na:na + nd2] = np.linspace(1, sus_level, nd2, endpoint=False)
    nr = min(nr, n)
    if nr:
        e[n - nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e


def polyblep_saw(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m1 = ph < dt
    t1 = ph[m1] / dt[m1]
    y[m1] -= t1 + t1 - t1 * t1 - 1
    m2 = ph > 1 - dt
    t2 = (ph[m2] - 1) / dt[m2]
    y[m2] -= t2 * t2 + t2 + t2 + 1
    return y


def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR * 0.45) / (SR / 2), "low", output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc / (SR / 2), "high", output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def bp(x, f1, f2, order=2):
    sos = signal.butter(order, [f1 / (SR / 2), min(f2, SR * 0.45) / (SR / 2)], "band", output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def vib(n, rate=5.2, depth=0.004, delay=0.3):
    t = np.arange(n) / SR
    ramp = np.clip((t - delay) / 0.4, 0, 1)
    return 1 + depth * ramp * np.sin(2 * np.pi * rate * t + rng.uniform(0, 6.28))


# ------------------------------------------------------------------ instruments
def strings(midi, dur, vel=1.0, bright=2600, attack=0.35, release=0.9, voices=5):
    n = int((dur + release) * SR)
    f0 = mtof(midi)
    L = np.zeros(n); R = np.zeros(n)
    for k in range(voices):
        det = 2 ** (((k - (voices - 1) / 2) * 7) / 1200)
        y = polyblep_saw(f0 * det * vib(n, 5 + rng.uniform(-0.5, 0.5), 0.0035, 0.2), n, rng.uniform())
        p = (k / max(1, voices - 1)) * 2 - 1
        L += y * np.cos(np.pi / 4 * (p * 0.7 + 1)); R += y * np.sin(np.pi / 4 * (p * 0.7 + 1))
    e = env_adsr(n, attack, 0.3, 0.85, release, 0.85)
    st = np.stack([L, R]) * e / voices
    st = lp(st, bright + f0 * 1.5, 2)
    st = hp(st, 60)
    return st * vel * 0.5


def spiccato(midi, vel=1.0, length=0.14, bright=3000):
    n = int((length + 0.12) * SR)
    f0 = mtof(midi)
    y = sum(polyblep_saw(f0 * 2 ** (d / 1200), n, rng.uniform()) for d in (-6, 0, 7)) / 3
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.006) * np.exp(-t / (length * 0.55))
    return lp(y * e, bright, 2) * vel * 0.55


def brass(midi, dur, vel=1.0, attack=0.12, release=0.5):
    n = int((dur + release) * SR)
    f0 = mtof(midi)
    fv = f0 * vib(n, 5.5, 0.005, 0.35)
    y = (polyblep_saw(fv, n) + polyblep_saw(fv * 1.003, n, 0.3) + 0.5 * polyblep_saw(fv * 0.5, n, 0.6)) / 2.5
    e = env_adsr(n, attack, 0.25, 0.8, release, 0.8)
    dark, brt = lp(y, 500 + f0), lp(y, 1800 + f0 * 2.5)
    bl = np.clip(env_adsr(n, attack * 1.4, 0.4, 0.55, release, 0.55) * vel, 0, 1)
    out = (dark * (1 - bl) + brt * bl) * e
    return np.tanh(out * 1.6) * vel * 0.5


VOWELS = {"ah": [(750, 1.0, 90), (1150, 0.6, 110), (2800, 0.25, 170)], "oo": [(350, 1.0, 70), (700, 0.5, 90), (2600, 0.1, 150)]}


def choir(midi, dur, vel=1.0, vowel="ah", attack=0.8, release=1.4, voices=6):
    n = int((dur + release) * SR)
    f0 = mtof(midi)
    L = np.zeros(n); R = np.zeros(n)
    for k in range(voices):
        det = 2 ** (rng.uniform(-12, 12) / 1200)
        y = polyblep_saw(f0 * det * vib(n, 5 + rng.uniform(-0.8, 0.8), 0.006, 0.1), n, rng.uniform())
        y += rng.standard_normal(n) * 0.05
        p = rng.uniform(-0.8, 0.8)
        L += y * np.cos(np.pi / 4 * (p + 1)); R += y * np.sin(np.pi / 4 * (p + 1))
    st = np.stack([L, R]) / voices
    out = np.zeros_like(st)
    for fc, g, bw in VOWELS[vowel]:
        out += bp(st, fc - bw, fc + bw, 2) * g
    e = env_adsr(n, attack, 0.4, 0.9, release, 0.9)
    return out * e * vel * 2.2


def piano(midi, vel=0.8, dur=3.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = mtof(midi)
    B = 0.0003
    y = np.zeros(n)
    for k in range(1, 13):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        if fk > SR * 0.45:
            break
        amp = (1 / k ** 1.15) * (0.6 + 0.4 * vel) ** (k * 0.3)
        dec = 1.4 + 0.55 * k + f0 / 400
        for det in (-0.6, 0.6):
            y += amp * np.sin(2 * np.pi * fk * 2 ** (det / 1200) * t + rng.uniform(0, 6.28)) * np.exp(-t * dec / 2.2)
    click = lp(rng.standard_normal(n) * np.exp(-t / 0.004), 3000) * 0.3
    y = (y / 6 + click) * np.minimum(1, t / 0.002)
    y *= np.clip(1 - (t - (dur - 0.3)) / 0.3, 0, 1)
    return y * vel * 0.8


def bell(midi, vel=0.6, dur=4.0, ratios=(1, 2.0, 3.01, 4.17, 5.43, 6.8)):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = mtof(midi)
    y = sum((1 / (i + 1)) * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * (1.2 + i * 0.9)) for i, r in enumerate(ratios))
    return y * np.minimum(1, t / 0.001) * vel * 0.35


def pluck(midi, vel=0.7, dur=2.5, damp=0.996, bright=0.5):
    """Karplus-Strong string (koto / guzheng)."""
    f0 = mtof(midi)
    P = int(SR / f0)
    n = int(dur * SR)
    exc = np.zeros(n)
    burst = rng.uniform(-1, 1, P)
    burst = lp(burst, 1500 + bright * 6000, 1)
    exc[:P] = burst
    a = np.zeros(P + 2); a[0] = 1; a[P] = -damp * 0.5; a[P + 1] = -damp * 0.5
    y = signal.lfilter([1], a, exc)
    t = np.arange(n) / SR
    y *= np.clip(1 - (t - (dur - 0.2)) / 0.2, 0, 1)
    return lp(y, 5000) * vel * 0.9


def flute(midi, dur, vel=0.7, slide=True):
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    f0 = mtof(midi)
    bend = 2 ** ((-1.0 * np.exp(-t / 0.05)) / 12) if slide else 1
    f = f0 * bend * vib(n, 5.6, 0.006, 0.18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
    breath = bp(rng.standard_normal(n), f0 * 0.8, f0 * 3) * 0.25
    e = env_adsr(n, 0.07, 0.15, 0.85, 0.25, 0.85)
    return (y + breath) * e * vel * 0.4


def celesta(midi, vel=0.5):
    return bell(midi, vel, 2.5, ratios=(1, 4.0, 10.0)) * 1.3


def synth_arp(midi, length=0.15, vel=0.5, cutoff=2400):
    n = int((length + 0.1) * SR)
    t = np.arange(n) / SR
    f0 = mtof(midi)
    y = np.sign(np.sin(2 * np.pi * f0 * t)) * 0.6 + polyblep_saw(f0 * 1.005, n) * 0.4
    e = np.minimum(1, t / 0.003) * np.exp(-t / (length * 0.6))
    return lp(y * e, cutoff, 2) * vel * 0.35


def taiko(vel=1.0, pitch=1.0, dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = (55 + 110 * np.exp(-t / 0.035)) * pitch
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.42)
    skin = lp(rng.standard_normal(n), 900) * np.exp(-t / 0.05) * 0.6
    return np.tanh((body + skin) * 1.4) * vel * 0.9


def kick(vel=1.0):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 45 + 130 * np.exp(-t / 0.03)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    y += hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.004) * 0.3
    return y * vel


def snare(vel=0.7):
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 1200, 7000) * np.exp(-t / 0.09)
    y += np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.06) * 0.6
    return y * vel * 0.7


def hat(vel=0.3, open_=False):
    n = int((0.35 if open_ else 0.08) * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t / (0.12 if open_ else 0.02)) * vel


def sub_boom(vel=1.0, f=42, dur=2.5):
    t = tt(dur)
    fr = f + 30 * np.exp(-t / 0.08)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.8) * np.minimum(1, t / 0.004) * vel


def crash(vel=0.6, dur=3.0):
    t = tt(dur)
    y = hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.9)
    return np.stack([y, hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.9)]) * vel * 0.5


def impact(vel=1.0, dur=4.0, big=False):
    t = tt(dur)
    y = sub_boom(1.0, 38, dur) * 1.1 + taiko(1.0, 0.8, dur) * 0.8
    noise = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.25) * 0.5
    st = np.stack([y + noise, y + lp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.25) * 0.5])
    c = crash(0.7 if big else 0.4, dur)
    return (st + c) * vel


def riser(dur, vel=0.6, f0=200, f1=2400):
    t = tt(dur)
    k = t / dur
    noise = rng.standard_normal(len(t))
    # sweep a band through the noise with a few overlapping filters
    out = np.zeros(len(t))
    bands = 8
    for i in range(bands):
        fc = f0 * (f1 / f0) ** (i / (bands - 1))
        w = np.exp(-((k - i / (bands - 1)) ** 2) / 0.02)
        out += bp(noise, fc * 0.8, fc * 1.25) * w
    tone = np.sin(2 * np.pi * np.cumsum(f0 * 0.5 * (f1 / f0) ** k) / SR) * 0.25
    e = k ** 2
    return (out + tone) * e * vel


def rev_swell(dur, vel=0.5):
    t = tt(dur)
    y = hp(rng.standard_normal(len(t)), 2500)
    return y * (t / dur) ** 3 * vel


def whoosh(dur=0.6, vel=0.6, f=900):
    t = tt(dur)
    y = bp(rng.standard_normal(len(t)), f * 0.5, f * 2.5)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    L = y * e * np.linspace(1, 0.2, len(t)); R = y * e * np.linspace(0.2, 1, len(t))
    return np.stack([L, R]) * vel


def zip_(vel=0.5):
    t = tt(0.18)
    f = 3000 * np.exp(-t / 0.05) + 500
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05) + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t / 0.03) * 0.5
    return y * vel


def chirp(vel=0.25):
    out = np.zeros(int(0.5 * SR))
    for k in range(rng.integers(2, 4)):
        t = tt(0.07)
        f = 3200 + 1600 * np.sin(np.pi * t / 0.07) + rng.uniform(-300, 300)
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.07)
        s = int(k * 0.1 * SR)
        out[s:s + len(y)] += y
    return out * vel


def thunder(vel=0.8, dur=3.0):
    t = tt(dur)
    y = lp(rng.standard_normal(len(t)), 300) * np.exp(-t / 0.9)
    crack = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t / 0.08) * 0.8
    env = 1 + 0.6 * np.sin(2 * np.pi * 3 * t) * np.exp(-t)
    return (y * 3 * env + crack) * vel


def shatter(vel=0.8):
    t = tt(1.6)
    y = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.15)
    for _ in range(40):
        s = rng.uniform(0, 0.8)
        f = rng.uniform(2500, 7000)
        tt_ = t - s
        m = tt_ >= 0
        y[m] += np.sin(2 * np.pi * f * tt_[m]) * np.exp(-tt_[m] / 0.06) * 0.25
    return y * vel


def pop(vel=0.5):
    t = tt(1.2)
    y = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.05) + np.sin(2 * np.pi * 70 * t) * np.exp(-t / 0.15) * 0.8
    for _ in range(25):
        s = int(rng.uniform(0.15, 1.0) * SR)
        y[s:s + 200] += rng.uniform(-1, 1, 200)[: len(y[s:s + 200])] * 0.2
    return y * vel


def hum(dur, vel=0.3, f=110):
    t = tt(dur)
    y = polyblep_saw(np.full(len(t), f), len(t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t))
    return lp(y, 1400) * env_adsr(len(t), 0.1, 0.1, 1, 0.3, 1) * vel


def tinnitus(dur, vel=0.08):
    t = tt(dur)
    return np.sin(2 * np.pi * 3100 * t) * np.exp(-t / (dur * 0.4)) * vel


def rain_bed(dur, vel=0.15):
    t = tt(dur)
    y = np.stack([bp(rng.standard_normal(len(t)), 500, 9000), bp(rng.standard_normal(len(t)), 500, 9000)])
    fade = np.minimum(1, np.minimum(t / 1.2, (dur - t) / 1.2))
    return y * fade * vel


def wind_bed(dur, vel=0.12):
    t = tt(dur)
    y = lp(rng.standard_normal(len(t)), 600)
    y *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t + 1)
    fade = np.minimum(1, np.minimum(t / 1.5, (dur - t) / 1.5))
    return y * fade * vel * 3


def braam(vel=1.0, dur=5.0, root=26):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for m, g in ((root, 1.0), (root + 12, 0.8), (root + 19, 0.5), (root + 24, 0.4), (root + 13, 0.25)):
        y += (polyblep_saw(np.full(n, mtof(m)), n, rng.uniform()) + polyblep_saw(np.full(n, mtof(m) * 1.004), n)) * g
    e = np.minimum(1, t / 0.08) * np.exp(-t / (dur * 0.35))
    open_ = lp(y, 1600) * np.clip(t / 0.4, 0, 1) + lp(y, 250) * (1 - np.clip(t / 0.4, 0, 1))
    return np.tanh(open_ * e * 0.9) * vel + sub_boom(vel * 0.8, 36, dur)


# ------------------------------------------------------------------ harmony
CH = {  # pad voicing, bass
    "Dm": ([50, 53, 57, 62], 38), "Bb": ([46, 50, 53, 58], 34), "F": ([53, 57, 60, 65], 41), "C": ([48, 52, 55, 60], 36),
    "Gm": ([55, 58, 62], 43), "Am": ([45, 48, 52, 57], 33), "A": ([45, 49, 52, 57], 33), "D": ([50, 54, 57, 62], 38),
    "Bm": ([47, 50, 54, 59], 35), "G": ([43, 47, 50, 55], 31), "Dsus": ([50, 55, 57, 62], 38),
}
PROG = {}
def setprog(bar0, chords):
    for i, c in enumerate(chords):
        PROG[bar0 + i] = c
setprog(0, ["Dm", "Dm", "Bb", "Bb", "F", "C"])
setprog(6, ["Dm", "Bb", "F", "C", "Dm"])
setprog(11, ["Dm", "Bb", "F", "C", "Bb"])
setprog(16, ["Dm", "C", "Bb", "C", "Dm"])
setprog(21, ["F", "C", "Dm", "Bb"])
setprog(25, ["Dm", "Bb", "F", "C"])
setprog(29, ["F", "Am", "Bb", "C"])
setprog(33, ["Dm", "Dm", "Bb", "C"])
setprog(37, ["F", "C", "Dm", "Bb", "C"])
setprog(42, ["Dm", "Bb", "F", "C"])
setprog(46, ["Dm", "Dm", "Bb", "A"])
setprog(50, ["Dm", "Bb", "F", "C"] * 3)
setprog(62, ["D", "A", "Bm", "G", "D", "A"])
setprog(68, ["D", "G", "A", "D", "D"])
setprog(73, ["D", "D", "D"])
bt = lambda bar, beat=0.0: bar * BAR + beat * BEAT


def pad(bar0, bar1, vel=0.5, bright=2200, octave=0, bus_verb=0.5, attack=0.5):
    for b in range(bar0, bar1):
        notes, _ = CH[PROG[b]]
        for m in notes:
            place(strings(m + octave, BAR + 0.05, vel, bright, attack=attack), bt(b), rng.uniform(-0.3, 0.3), 1.0, verb=bus_verb)


def bass(bar0, bar1, vel=0.6, pattern="whole"):
    for b in range(bar0, bar1):
        _, r = CH[PROG[b]]
        if pattern == "whole":
            place(strings(r, BAR, vel, 700, attack=0.2), bt(b), 0, verb=0.2)
        elif pattern == "8ths":
            for k in range(8):
                place(spiccato(r, vel * (1.0 if k % 2 == 0 else 0.7), 0.22, 900), bt(b, k * 0.5), 0, verb=0.15)
        elif pattern == "16ths":
            for k in range(16):
                acc = 1.0 if k % 4 == 0 else (0.8 if k % 2 == 0 else 0.6)
                place(spiccato(r + (12 if k % 8 == 6 else 0), vel * acc, 0.12, 1100), bt(b, k * 0.25), 0, verb=0.12)


def ostinato(bar0, bar1, vel=0.4, octave=12):
    for b in range(bar0, bar1):
        notes, r = CH[PROG[b]]
        seq = [r + octave, notes[1] + octave - 12 + 12, notes[2] + octave - 12 + 12, notes[1] + octave]
        for k in range(16):
            m = [r + octave + 12, r + octave + 24, notes[2] + octave, r + octave + 24][k % 4]
            acc = 1.0 if k % 4 == 0 else 0.65
            place(spiccato(m, vel * acc, 0.11, 3200), bt(b, k * 0.25), rng.uniform(-0.4, 0.4), verb=0.25)


def piano_arp(bar0, bar1, vel=0.45, top=None):
    for b in range(bar0, bar1):
        notes, r = CH[PROG[b]]
        seq = [r + 12, notes[-2] + 12, notes[-1] + 12, notes[1] + 24, notes[-1] + 12, notes[-2] + 12, notes[1] + 12, notes[-1] + 12]
        for k, m in enumerate(seq):
            place(piano(m, vel * (1.0 if k == 0 else 0.7), 2.5), bt(b, k * 0.5), 0.2 * np.sin(k), verb=0.45)


def melody(notes, start_bar, inst="brass", vel=0.7, octave=0, pan=0.0, verb=0.35):
    """notes: list of (midi or None, beats)."""
    pos = 0.0
    for m, d in notes:
        if m is not None:
            t0 = bt(start_bar, pos)
            dd = d * BEAT
            if inst == "brass":
                place(brass(m + octave, dd * 0.95, vel), t0, pan, verb=verb)
                place(brass(m + octave - 12, dd * 0.95, vel * 0.55), t0, -pan, verb=verb)
            elif inst == "flute":
                place(flute(m + octave, dd * 0.95, vel), t0, pan, verb=verb)
            elif inst == "piano":
                place(piano(m + octave, vel, max(2.0, dd + 1.5)), t0, pan, verb=verb)
            elif inst == "strings":
                place(strings(m + octave, dd, vel, 3500, attack=0.12, release=0.5, voices=4), t0, pan, verb=verb)
            elif inst == "choir":
                place(choir(m + octave, dd, vel, attack=0.3, release=1.0), t0, pan, verb=verb)
            elif inst == "bell":
                place(bell(m + octave, vel), t0, pan, verb=verb)
        pos += d


THEME_MINOR = [(62, 1), (69, 1.5), (67, 0.5), (65, 1), (65, 0.5), (67, 0.5), (69, 2), (70, 1), (72, 1.5), (69, 0.5), (65, 1), (67, 1), (64, 2), (60, 1), (64, 1)]
THEME_MINOR_2 = [(62, 1), (69, 1), (74, 1.5), (72, 0.5), (70, 1), (69, 1), (67, 1), (65, 1), (69, 1), (67, 0.5), (65, 0.5), (64, 1), (65, 1), (64, 4)]
THEME_MAJOR = [(62, 1), (69, 1.5), (67, 0.5), (66, 1), (64, 0.5), (66, 0.5), (69, 2), (73, 1), (74, 1.5), (71, 0.5), (66, 1), (69, 1), (67, 2), (71, 1), (74, 1), (69, 2), (74, 1.5), (76, 0.5), (78, 2), (76, 1), (73, 1)]
TITLE_THEME = [(62, 2), (69, 2), (67, 1.5), (71, 0.5), (74, 2), (73, 2), (76, 2), (74, 4)]

# ------------------------------------------------------------------ score
# 0-15 prologue: drone + shimmer + piano motif
place(sub_boom(0.5, 36, 5), 0.0, bus="mus", verb=0.6)
for b in range(0, 6):
    notes, r = CH[PROG[b]]
    place(strings(r - 12, BAR + 0.1, 0.35, 400, attack=1.2), bt(b), 0, verb=0.4)
    for m in notes[1:]:
        place(strings(m + 12, BAR + 0.1, 0.12, 5000, attack=1.2), bt(b), rng.uniform(-0.6, 0.6), verb=0.8)
melody([(None, 2), (69, 1), (74, 1), (76, 2), (77, 2), (76, 2), (74, 2), (72, 3), (69, 1), (70, 4), (69, 2), (72, 2), (67, 4)], 0, "piano", 0.42, 0, 0.1, 0.6)
place(choir(62, 6.0, 0.25, "oo", attack=3), 6.5, verb=0.8)
place(choir(69, 6.0, 0.2, "oo", attack=3), 6.5, verb=0.8)
place(rev_swell(3.0, 0.25), 12.0, bus="sfx", verb=0.4)
place(riser(3.0, 0.25, 150, 3000), 12.0, bus="sfx")
place(impact(0.35), 15.0, bus="sfx", verb=0.5)

# 15-27.5 Gibraltar: pulse builds
bass(6, 11, 0.35, "8ths")
pad(6, 11, 0.28, 1800)
piano_arp(6, 11, 0.32)
place(sub_boom(0.7), 16.1, bus="sfx", verb=0.5)
for k in range(6):
    place(bell(86 + [0, 3, 7, 10, 12, 15][k], 0.18), 16.1 + k * 0.08, 0.4, bus="sfx", verb=0.7)
place(whoosh(0.5, 0.4, 1200), 19.8, bus="sfx")
place(impact(0.6), 20.3, bus="sfx", verb=0.7)
for k in range(4):
    place(choir(74 + [0, 5, 7, 12][k], 1.4, 0.18, "ah", attack=0.05, release=1.2), 20.3 + k * 1.1, 0.5 - k * 0.3, verb=0.8)
for c0 in (21.4, 23.6):
    place(chirp(0.18), c0, 0.3, bus="sfx", verb=0.3)
place(riser(2.5, 0.3), 25.0, bus="sfx")

# 27.5-40 King's Row: melancholy -> hope
pad(11, 16, 0.3, 1600)
piano_arp(11, 16, 0.3)
melody([(69, 2), (70, 1), (69, 1), (65, 3), (62, 1), (67, 2), (65, 1), (64, 1), (60, 4), (62, 2), (65, 2), (70, 3), (69, 1), (69, 4)], 11, "strings", 0.5, 0, -0.2, 0.5)
place(rain_bed(12.5, 0.12), 27.5, bus="sfx", verb=0.1)
place(thunder(0.35), 29.0, 0.4, bus="sfx", verb=0.5)
for z in (34.7, 35.2, 35.7, 36.2, 39.1):
    place(zip_(0.35), z, 0.3, bus="sfx", verb=0.3)
place(chirp(0.12), 28.6, -0.4, bus="sfx")

# 40-52.5 Hanamura: koto + taiko, dragons
pad(16, 21, 0.26, 1500)
PENTA = [62, 65, 67, 69, 72, 74, 77, 79]
for b in range(16, 21):
    for k in range(8):
        m = PENTA[(k * 3 + b) % 6 + (1 if k % 4 == 3 else 0)]
        place(pluck(m, 0.45 if k % 2 == 0 else 0.3, 2.0), bt(b, k * 0.5), rng.uniform(-0.5, 0.5), verb=0.4)
    place(taiko(0.55), bt(b), 0, verb=0.4)
    if b >= 18:
        place(taiko(0.4, 1.3), bt(b, 2.5), 0.2, verb=0.4)
        place(taiko(0.4, 1.3), bt(b, 3), -0.2, verb=0.4)
melody([(74, 2), (72, 1), (69, 1), (67, 3), (69, 1), (65, 2), (67, 2), (62, 4)], 16, "flute", 0.45, 0, 0.2, 0.45)
place(riser(1.6, 0.3), 44.8, bus="sfx")
place(impact(0.75, big=True), 46.4, bus="sfx", verb=0.6)
place(braam(0.35, 4.0, 38), 46.4, verb=0.4)
place(whoosh(2.0, 0.5, 700), 46.5, bus="sfx", verb=0.4)
place(choir(74, 5.0, 0.35, "ah", attack=0.3), 46.4, verb=0.7)
place(choir(69, 5.0, 0.3, "ah", attack=0.3), 46.4, verb=0.7)
place(choir(77, 5.0, 0.25, "ah", attack=0.3), 46.4, verb=0.7)

# 52.5-62.5 Numbani: uplifting
pad(21, 25, 0.3, 2400)
bass(21, 25, 0.35, "8ths")
ostinato(21, 25, 0.22, 12)
for b in range(21, 25):
    for k in range(16):
        place(hat(0.12 if k % 2 else 0.2), bt(b, k * 0.25), 0.3, verb=0.1)
    place(taiko(0.35, 1.2), bt(b), 0, verb=0.3)
melody([(65, 1.5), (69, 0.5), (72, 2), (72, 1), (74, 0.5), (72, 0.5), (67, 4), (69, 1.5), (72, 0.5), (74, 2), (77, 1.5), (74, 0.5), (72, 4)], 21, "brass", 0.45, 0, 0.1, 0.4)
place(chirp(0.2), 58.0, 0.5, bus="sfx")

# 62.5-72.5 Busan: synth arps + beat
pad(25, 29, 0.22, 2000)
for b in range(25, 29):
    notes, r = CH[PROG[b]]
    arp = [r + 24, notes[1] + 12, notes[2] + 12, r + 36]
    for k in range(16):
        place(synth_arp(arp[k % 4] + (12 if k % 8 >= 4 else 0), 0.14, 0.5), bt(b, k * 0.25), 0.35 * np.sin(k * 0.8), verb=0.3)
    for k in range(4):
        place(kick(0.6), bt(b, k), 0, verb=0.05)
        place(hat(0.15), bt(b, k + 0.5), 0.2, verb=0.1)
    place(snare(0.4), bt(b, 1), 0, verb=0.25); place(snare(0.4), bt(b, 3), 0, verb=0.25)
    place(spiccato(r, 0.5, 0.3, 700), bt(b), 0, verb=0.1)
place(whoosh(1.0, 0.5, 400), 62.5, bus="sfx")
place(impact(0.8), 63.5, bus="sfx", verb=0.4)
place(whoosh(1.2, 0.35, 1500), 66.0, 0.6, bus="sfx")
place(hum(2.5, 0.25, 98), 66.7, 0.2, bus="sfx", verb=0.3)
for i, f0 in enumerate([69.1, 69.5, 70.0, 70.5, 70.9, 71.4, 71.8]):
    place(pop(0.35), f0 + 0.05, rng.uniform(-0.6, 0.6), bus="sfx", verb=0.6)

# 72.5-82.5 Ilios: choir + bells
for b in range(29, 33):
    notes, r = CH[PROG[b]]
    for m in notes:
        place(choir(m + 12, BAR, 0.22, "ah", attack=0.6, release=1.2), bt(b), rng.uniform(-0.5, 0.5), verb=0.7)
    place(strings(r - 12, BAR, 0.3, 500), bt(b), 0, verb=0.3)
    for k in range(4):
        place(bell(notes[k % len(notes)] + 24, 0.2), bt(b, k), rng.uniform(-0.6, 0.6), verb=0.7)
place(rev_swell(1.2, 0.2), 75.9, bus="sfx")
for k in range(5):
    place(bell(81 + [0, 4, 7, 12, 16][k], 0.25), 77.1 + k * 0.07, 0.2, bus="sfx", verb=0.9)
place(choir(77, 3.0, 0.4, "ah", attack=0.2), 77.1, verb=0.9)
place(choir(81, 3.0, 0.3, "ah", attack=0.2), 77.1, verb=0.9)

# 82.5-92.5 Nepal: sparse, singing bowls, wind
place(wind_bed(10.0, 0.08), 82.5, bus="sfx", verb=0.2)
for b in range(33, 37):
    notes, r = CH[PROG[b]]
    place(strings(r - 12, BAR, 0.3, 400, attack=1.0), bt(b), 0, verb=0.4)
    place(strings(notes[2] + 12, BAR, 0.1, 3000, attack=1.0), bt(b), 0.4, verb=0.7)
for tb in (82.8, 85.2, 88.0, 90.4):
    place(bell(50 + rng.integers(0, 3) * 7, 0.35, 6.0, ratios=(1, 2.76, 5.4, 8.93)), tb, rng.uniform(-0.4, 0.4), verb=0.7)
melody([(None, 1), (74, 2), (72, 1), (69, 3), (67, 1), (69, 4), (None, 2), (65, 2), (67, 3), (62, 1)], 33, "flute", 0.35, 0, -0.2, 0.6)
place(choir(62, 3.0, 0.35, "oo", attack=0.3), 87.9, verb=0.8)
place(choir(69, 3.0, 0.3, "oo", attack=0.3), 87.9, verb=0.8)

# 92.5-105 Lijiang: dizi melody + guzheng
pad(37, 42, 0.26, 2200)
for b in range(37, 42):
    notes, r = CH[PROG[b]]
    for k in range(8):
        m = [r + 24, notes[2] + 12, notes[1] + 24, notes[2] + 12, r + 36, notes[2] + 24, notes[1] + 24, notes[2] + 12][k]
        place(pluck(m, 0.3, 1.8, 0.995, 0.3), bt(b, k * 0.5), rng.uniform(-0.5, 0.5), verb=0.35)
    place(taiko(0.3, 1.4), bt(b), 0, verb=0.3)
    place(taiko(0.2, 1.8), bt(b, 2), 0, verb=0.3)
melody([(72, 1), (74, 0.5), (77, 0.5), (81, 1.5), (79, 0.5), (79, 1), (77, 0.5), (74, 0.5), (72, 2), (74, 1), (77, 1), (79, 0.5), (81, 0.5), (84, 1),
        (81, 1.5), (79, 0.5), (77, 1), (74, 1), (72, 2), (74, 0.5), (77, 0.5), (79, 1)], 37, "flute", 0.5, 0, 0.1, 0.45)
for i, f0 in enumerate([97.5, 98.1, 98.9, 99.7, 100.5, 101.3, 102.1, 103.0, 103.8]):
    place(pop(0.18), f0, rng.uniform(-0.7, 0.7), bus="sfx", verb=0.8)
place(chirp(0.15), 99.3, 0.3, bus="sfx")

# 105-115 Moon & Mars: celesta
pad(42, 46, 0.24, 2600)
for b in range(42, 46):
    notes, r = CH[PROG[b]]
    for k in range(16):
        m = [r + 36, notes[1] + 24, notes[2] + 24, notes[1] + 36][k % 4]
        place(celesta(m, 0.22 if k % 4 else 0.3), bt(b, k * 0.25), 0.5 * np.sin(k), verb=0.6)
    place(strings(r - 12, BAR, 0.3, 500), bt(b), 0, verb=0.4)
place(whoosh(0.9, 0.6, 1000), 109.6, bus="sfx", verb=0.3)
place(riser(3.0, 0.2, 300, 1500), 112.0, bus="sfx")

# 115-125 darkness: braams, thunder, hero chimes, silence
place(braam(0.9, 6.0, 26), 115.0, verb=0.5)
place(braam(0.7, 4.0, 27), 120.0, verb=0.5)
for b in range(46, 49):
    notes, r = CH[PROG[b]]
    for m in notes:
        n = int(BAR * SR)
        trem = strings(m, BAR, 0.25, 2000, attack=0.4) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 8 * np.arange(int((BAR + 0.9) * SR)) / SR)))
        place(trem, bt(b), rng.uniform(-0.5, 0.5), verb=0.4)
for k in range(12):
    place(taiko(0.1 + k * 0.03, 0.7), 117.5 + k * 0.5, 0, verb=0.4)
for th in (117.0, 118.3, 119.6, 121.8):
    place(thunder(0.6), th, rng.uniform(-0.5, 0.5), bus="sfx", verb=0.5)
ARP_UP = [50, 54, 57, 62, 66, 69, 74, 78, 81, 86, 90, 93]
for i, k in enumerate([7, 5, 2, 3, 0, 4, 1, 6, 8, 9, 10, 11]):
    tk = 120.0 + k * 0.28
    place(bell(ARP_UP[k], 0.22), tk, (k / 11) * 1.2 - 0.6, bus="sfx", verb=0.6)
    place(whoosh(0.35, 0.12, 2000), tk - 0.1, bus="sfx")
place(riser(3.5, 0.45, 150, 4000), 120.1, bus="sfx")
for k in range(20):   # timpani roll crescendo
    place(taiko(0.08 + 0.02 * k, 0.9, 0.8), 121.25 + k * 0.12, 0, verb=0.3)
place(bell(86, 0.35, 3.0), 124.4, 0, bus="sfx", verb=0.9)
place(rev_swell(0.9, 0.5), 124.1, bus="sfx")

# 125-155 THE BATTLE
bass(50, 60, 0.5, "16ths")
ostinato(50, 60, 0.3, 12)
pad(50, 60, 0.35, 3000)
for b in range(50, 60):
    notes, r = CH[PROG[b]]
    for m in notes[:3]:
        place(choir(m + 12, BAR, 0.18, "ah", attack=0.2, release=0.6), bt(b), rng.uniform(-0.6, 0.6), verb=0.5)
    # taiko ensemble groove
    for bb, v, p in [(0, 1.0, 1.0), (0.75, 0.5, 1.2), (1.5, 0.7, 1.0), (2, 0.9, 0.9), (2.75, 0.5, 1.2), (3.25, 0.6, 1.1), (3.5, 0.7, 1.0)]:
        place(taiko(0.55 * v, p), bt(b, bb), rng.uniform(-0.3, 0.3), verb=0.25)
    place(snare(0.35), bt(b, 1), 0.1, verb=0.3)
    place(snare(0.35), bt(b, 3), -0.1, verb=0.3)
    if b % 4 == 0:
        place(crash(0.45), bt(b), rng.uniform(-0.3, 0.3), verb=0.3)
melody(THEME_MINOR, 50, "brass", 0.75, 0, 0.0, 0.35)
melody(THEME_MINOR_2, 54, "brass", 0.8, 0, 0.0, 0.35)
melody(THEME_MINOR, 58, "brass", 0.85, 12, 0.0, 0.35)
melody(THEME_MINOR, 58, "strings", 0.4, 12, 0.3, 0.35)
# 147.5-150: build
for k in range(16):
    place(taiko(0.3 + 0.03 * k, 1.1), 147.5 + k * 0.156, 0, verb=0.3)
place(riser(2.5, 0.55, 150, 5000), 147.5, bus="sfx")
place(rev_swell(0.9, 0.6), 150.0, bus="sfx")
# 150-155: convergence, slow-mo, swell into dawn
for m in (50, 57, 62, 66, 69, 74):
    place(choir(m, 4.8, 0.3, "ah", attack=0.1, release=2.5), 150.9, rng.uniform(-0.5, 0.5), verb=0.9)
place(strings(38, 4.0, 0.5, 600, attack=0.05), 150.9, 0, verb=0.6)
for m in (62, 66, 69, 74):
    place(strings(m, 3.0, 0.22, 2400, attack=1.5), 152.5, rng.uniform(-0.5, 0.5), verb=0.7)
# sfx for the battle beats
place(impact(1.3, 5.0, big=True), 125.0, bus="sfx", verb=0.6)
place(braam(0.5, 3.0, 26), 125.0, verb=0.3)
for h in [0.3, 0.7, 1.0, 1.4, 1.7, 2.1, 2.4, 2.9, 3.2, 3.6, 3.9, 4.3, 4.6]:
    place(taiko(0.25, 1.6, 0.4) + np.pad(hp(rng.standard_normal(int(0.1 * SR)), 2000) * np.exp(-np.arange(int(0.1 * SR)) / SR / 0.02) * 0.4, (0, int(0.3 * SR))), 125 + h + 0.25, 0.4, bus="sfx", verb=0.3)
for z in (130.0, 130.3, 130.6, 130.9):
    place(zip_(0.4), z, rng.uniform(-0.5, 0.5), bus="sfx", verb=0.2)
place(whoosh(0.4, 0.3, 1500), 131.1, bus="sfx")
for k in range(3):
    place(bell(96, 0.12, 0.3), 131.3 + k * 0.08, 0.5, bus="sfx")
place(impact(0.9), 131.55, 0.3, bus="sfx", verb=0.5)
place(whoosh(0.4, 0.4, 2500), 132.8, -0.4, bus="sfx")
place(riser(0.6, 0.35, 400, 3000), 132.95, bus="sfx")
for k, s0 in enumerate((133.55, 133.93, 134.31)):
    place(whoosh(0.35, 0.5, 3000), s0, [-0.5, 0.5, 0][k], bus="sfx", verb=0.3)
    place(zip_(0.25), s0, bus="sfx")
for i in range(8):
    place(pop(0.25), 133.6 + i * 0.12, rng.uniform(-0.6, 0.6), bus="sfx", verb=0.3)
place(impact(0.6), 135.15, -0.5, bus="sfx", verb=0.5)
place(whoosh(1.6, 0.6, 600), 135.15, bus="sfx", verb=0.4)
place(choir(74, 1.8, 0.3, "ah", attack=0.05), 135.15, verb=0.6)
for i in range(10):
    place(pop(0.22), 135.15 + 0.15 + (800 + i * 120 - 330) / 1300 + 0.15, -0.8 + i * 0.16, bus="sfx", verb=0.3)
place(whoosh(1.2, 0.5, 300), 137.5, bus="sfx")
for k in range(10):
    place(bell(93, 0.15, 0.2), 138.5 + 0.75 * (1 - (k / 10) ** 0.5) * 0 + k * (0.075 - k * 0.002), 0.3, bus="sfx")
place(impact(1.3, 5.0, big=True), 139.25, bus="sfx", verb=0.6)
place(hum(0.95, 0.35, 70), 140.0, 0.5, bus="sfx", verb=0.2)
place(riser(0.9, 0.3, 300, 2500), 140.0, bus="sfx")
place(shatter(0.8), 140.9, bus="sfx", verb=0.5)
place(impact(0.8), 140.9, bus="sfx", verb=0.4)
for k in range(6):
    place(bell(81 + k * 2, 0.12), 142.8 + k * 0.05, 0.3, bus="sfx", verb=0.8)
place(whoosh(0.8, 0.5, 800), 143.1, bus="sfx")
place(choir(78, 2.2, 0.35, "ah", attack=0.1), 143.1, verb=0.8)
place(bell(91, 0.35, 2.0), 143.4, -0.3, bus="sfx", verb=0.7)
for k in range(7):
    place(whoosh(0.3, 0.25, 1800), 145.1 + k * 0.12, -0.8 + k * 0.25, bus="sfx")
place(whoosh(2.3, 0.5, 700), 145.0, bus="sfx", verb=0.4)
for k in range(8):
    place(thunder(0.15, 0.6), 147.8 + k * 0.3, -0.6, bus="sfx")
place(impact(1.6, 6.0, big=True), 150.9, bus="sfx", verb=0.7)
place(braam(0.8, 5.0, 26), 150.9, verb=0.5)
place(tinnitus(3.0, 0.05), 151.0, bus="sfx", verb=0.2)

# 155-170 dawn: D major, piano + strings + horns
pad(62, 68, 0.3, 2400)
piano_arp(62, 68, 0.3)
bass(62, 68, 0.35, "whole")
melody(THEME_MAJOR[:15], 62, "strings", 0.45, 0, -0.2, 0.5)
melody(THEME_MAJOR[:15], 64, "brass", 0.35, -12, 0.2, 0.5)
place(chirp(0.2), 157.2, 0.3, bus="sfx"); place(chirp(0.15), 158.1, 0.3, bus="sfx")
place(rev_swell(1.4, 0.3), 161.6, bus="sfx")
for k in range(4):
    place(bell(86 + [0, 4, 7, 12][k], 0.2), 162.95 + k * 0.08, 0.1, bus="sfx", verb=0.9)
place(choir(74, 4.0, 0.25, "ah", attack=0.4), 162.9, verb=0.8)
place(chirp(0.18), 166.4, 0.4, bus="sfx")
place(riser(3.6, 0.5, 200, 6000), 166.4, bus="sfx")
for k in range(12):
    place(taiko(0.2 + 0.04 * k, 1.0), 168.1 + k * 0.156, 0, verb=0.3)
place(rev_swell(1.0, 0.6), 169.0, bus="sfx")

# 170-182.5 title
place(impact(1.5, 6.0, big=True), 170.0, bus="sfx", verb=0.7)
for b in range(68, 73):
    notes, r = CH[PROG[b]]
    for m in notes:
        place(strings(m, BAR + 0.1, 0.4 if b < 72 else 0.3, 3000, attack=0.05 if b == 68 else 0.3), bt(b), rng.uniform(-0.5, 0.5), verb=0.6)
        place(choir(m + 12, BAR, 0.22, "ah", attack=0.05 if b == 68 else 0.3, release=1.5), bt(b), rng.uniform(-0.6, 0.6), verb=0.8)
    place(strings(r - 12, BAR + 0.1, 0.5, 600), bt(b), 0, verb=0.3)
    place(taiko(0.6 if b < 71 else 0.4), bt(b), 0, verb=0.4)
melody(TITLE_THEME, 68, "brass", 0.8, 0, 0.0, 0.5)
place(whoosh(1.4, 0.3, 3000), 170.4, bus="sfx", verb=0.5)
place(sub_boom(0.6, 38, 4.0), 178.2, bus="sfx", verb=0.5)
place(crash(0.3, 5.0), 178.2, bus="sfx", verb=0.7)

# 182.5-190 end card: piano farewell
melody([(74, 2), (69, 2), (66, 2), (62, 6)], 73, "piano", 0.38, 0, 0.0, 0.8)
place(chirp(0.15), 184.2, 0.0, bus="sfx")
place(strings(50, 6.5, 0.2, 1500, attack=1.0), 182.6, 0, verb=0.7)
place(strings(57, 6.5, 0.15, 2000, attack=1.0), 182.6, 0.3, verb=0.7)
place(strings(66, 6.5, 0.12, 2500, attack=1.0), 182.6, -0.3, verb=0.7)

# ------------------------------------------------------------------ silence before the drop & reverb
def gate(buf, t0, t1, fade=0.05):
    a, b = int(t0 * SR), int(t1 * SR)
    f = int(fade * SR)
    buf[:, a:a + f] *= np.linspace(1, 0, f)
    buf[:, a + f:b] = 0

gate(MUS, 123.6, 124.95)
gate(MUSV, 123.6, 124.2, 0.4)


def reverb(x, secs=3.2, seed=1, damp=4500):
    n = int(secs * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)]) * np.exp(-t / (secs / 6.9))
    ir = lp(ir, damp, 1)
    ir[:, : int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
    return np.stack([signal.fftconvolve(x[0], ir[0])[: x.shape[1]], signal.fftconvolve(x[1], ir[1])[: x.shape[1]]])

print("reverb...")
music = MUS + reverb(MUSV, 3.4, 1) * 0.9
sfx = SFX + reverb(SFXV, 2.6, 2) * 0.9
music = hp(music, 30)
music = music[:, : int(DUR * SR)]
sfx = sfx[:, : int(DUR * SR)]
os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
sf.write(os.path.join(ROOT, "build", "music.wav"), music.T.astype(np.float32), SR, subtype="FLOAT")
sf.write(os.path.join(ROOT, "build", "sfx.wav"), sfx.T.astype(np.float32), SR, subtype="FLOAT")
print("music peak", np.max(np.abs(music)), "sfx peak", np.max(np.abs(sfx)))
