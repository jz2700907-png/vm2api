"""Orchestral score rendered with real instrument samples (MuseScore General SF2 via fluidsynth).

Composes the 190 s cue (96 BPM, 1 bar = 2.5 s, D minor -> D major) as one MIDI file per instrument
section, renders every stem with fluidsynth, then mixes the stems with a convolution hall.
Output: build/score.wav (+ build/stems/*.wav).

Usage: python3 tools/score.py [--sf2 /usr/share/sounds/sf2/MuseScore_General_Full.sf2]
"""
import argparse, os, subprocess
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import mido
import soundfile as sf
from scipy import signal

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ap = argparse.ArgumentParser()
ap.add_argument("--sf2", default="/usr/share/sounds/sf2/MuseScore_General_Full.sf2")
ap.add_argument("--jobs", type=int, default=4)
ap.add_argument("--mix-only", action="store_true", help="reuse rendered stems")
args = ap.parse_args()

SR = 48000
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
DUR = 190.0
rng = np.random.default_rng(7)
bt = lambda bar, beat=0.0: bar * BAR + beat * BEAT


# ------------------------------------------------------------------ stems
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
shaku = stem("shakuhachi", 0, 77, pan=70, verb=0.5, hp=150)
flute = stem("flute", 0, 73, pan=58, verb=0.45, hp=200)
pad = stem("pad", 0, 94, pan=64, verb=0.5, hp=80)
saw = stem("synth_arp", 0, 81, pan=64, verb=0.25, hp=150)
sbass = stem("synth_bass", 0, 38, pan=64, verb=0.1, hp=25)
drums = stem("drum_kit", 0, 0, drum=True, pan=64, verb=0.15, hp=30)

# ------------------------------------------------------------------ harmony
CH = {  # chord tones (upper voicing, one octave from middle C) and bass root
    "Dm": ([62, 65, 69], 38), "Bb": ([62, 65, 70], 34), "F": ([60, 65, 69], 41), "C": ([60, 64, 67], 36),
    "Gm": ([62, 67, 70], 43), "Am": ([60, 64, 69], 45), "A": ([61, 64, 69], 45), "D": ([62, 66, 69], 38),
    "Bm": ([62, 66, 71], 35), "G": ([62, 67, 71], 43), "Asus": ([62, 64, 69], 45), "Eb": ([63, 67, 70], 39),
}
PROG = {}
def setprog(b0, chords):
    for i, c in enumerate(chords):
        PROG[b0 + i] = c
setprog(0, ["Dm", "Dm", "Bb", "Bb", "F", "C"])
setprog(6, ["Dm", "Bb", "F", "C", "Asus"])
setprog(11, ["Dm", "Bb", "F", "C", "Bb"])
setprog(16, ["Dm", "C", "Bb", "C", "Dm"])
setprog(21, ["F", "C", "Dm", "Bb"])
setprog(25, ["Dm", "Bb", "F", "C"])
setprog(29, ["F", "Am", "Bb", "C"])
setprog(33, ["Dm", "Dm", "Bb", "C"])
setprog(37, ["F", "C", "Dm", "Bb", "C"])
setprog(42, ["Dm", "Bb", "F", "C"])
setprog(46, ["Dm", "Eb", "Dm", "A"])
setprog(50, ["Dm", "Bb", "F", "C"] * 3)
setprog(62, ["D", "A", "Bm", "G", "D", "A"])
setprog(68, ["D", "G", "A", "D", "D"])
setprog(73, ["D", "D", "D"])


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


def pedal(stem_, t0, t1, pitch, vel=70):
    stem_.n(t0, t1 - t0, pitch, vel)


def melody(stem_, notes, bar0, octave=0, vel=85, legato=True, beat0=0.0):
    pos = beat0
    for p, d in notes:
        if p is not None:
            stem_.n(bt(bar0, pos), d * BEAT * (1.0 if legato else 0.85), p + octave, vel, legato)
        pos += d


def arp(stem_, b0, b1, pattern, rate=0.5, vel=60, octave=0, dur=None):
    """pattern: list of indices into [root+12, t0, t1, t2, t0+12, t1+12, t2+12]."""
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


THEME_MINOR = [(62, 1), (69, 1.5), (67, 0.5), (65, 1), (65, 0.5), (67, 0.5), (69, 2), (70, 1), (72, 1.5), (69, 0.5), (65, 1), (67, 1), (64, 2), (60, 1), (64, 1)]
THEME_MINOR_2 = [(62, 1), (69, 1), (74, 1.5), (72, 0.5), (70, 1), (69, 1), (67, 1), (65, 1), (69, 1), (67, 0.5), (65, 0.5), (64, 1), (65, 1), (64, 2), (61, 2)]
THEME_MAJOR = [(62, 1), (69, 1.5), (67, 0.5), (66, 1), (64, 0.5), (66, 0.5), (69, 2), (73, 1), (74, 1.5), (71, 0.5), (66, 1), (69, 1), (67, 2), (71, 1), (74, 1),
               (69, 2), (74, 1.5), (76, 0.5), (78, 2), (76, 1), (73, 1)]
TITLE_THEME = [(62, 2), (69, 2), (67, 1.5), (71, 0.5), (74, 2), (73, 2), (76, 2), (74, 4)]

# kit note numbers (GM percussion map; orchestra kit uses the same keys)
BD, SN, CRASH, CRASH2, SUS, ROLL = 36, 38, 49, 57, 51, 38


def hit(t, vel=120, big=True):
    """Tutti trailer hit: taiko + concert bass drum + timpani + cymbal (+ low brass stab)."""
    taiko.n(t, 2.0, 41, vel); taiko.n(t, 2.0, 36, vel)
    bdrum.n(t, 3.0, 36, vel)
    timp.n(t, 2.5, 38, vel); timp.n(t, 2.5, 26 + 12, vel - 10)
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


# ================================================================== the score
# --- 0-15 prologue: low pedal, halo pad, piano letter theme, sunrise choir
cb.n(0, 15.2, 38, 50); vc.n(0, 15.2, 50, 45)
cb.ramp(0, 3, 20, 90); cb.ramp(12, 15, 90, 60)
for b in range(0, 6):
    tones, r = CH[PROG[b]]
    pad.chord(bt(b), BAR + 0.1, [r + 12, tones[0], tones[2]], 45)
pad.ramp(0, 6, 30, 100)
vln1.n(5.0, 10.2, 81, 38); vln1.n(5.0, 10.2, 86, 32)   # high shimmer
vln1.ramp(5, 9.5, 20, 105); vln1.ramp(12.5, 15, 105, 70)
melody(piano, [(None, 2), (69, 1), (74, 1), (76, 2), (77, 2), (76, 2), (74, 2), (72, 3), (69, 1), (70, 4), (67, 4)], 0, vel=62)
for (p, t) in [(81, 3.1), (86, 7.5), (88, 9.2), (93, 11.0)]:
    cel.n(t, 1.5, p, 50)
oohs.chord(6.0, 9.0, [62, 69, 74], 60); oohs.ramp(6.0, 9.5, 15, 110); oohs.ramp(12, 15, 110, 60)
timp_roll(13.0, 15.0, 38, 20, 80)
swell(15.0, 2.5, 90)

# --- 15-27.5 Gibraltar: pulse, the recall, the signal takes off
strings_pad(6, 11, 62)
for s_ in (vln1, vln2, vla, vc, cb):
    s_.ramp(15, 20, 55, 95); s_.ramp(20, 27.5, 95, 118)
for b in range(6, 11):
    tones, r = CH[PROG[b]]
    for k in range(8):
        vcf.n(bt(b, k * 0.5), 0.26, r + 12, 58 if k % 2 == 0 else 46)
        cbf.n(bt(b, k * 0.5), 0.26, r, 54 if k % 2 == 0 else 44)
arp(piano, 6, 11, [0, 2, 3, 6, 3, 2, 1, 3], 0.5, 50, 12)
hit(16.1, 80, big=False)
for k, p in enumerate([86, 89, 93, 98]):
    glock.n(16.12 + k * 0.08, 1.2, p, 70)
swell(20.3, 1.5, 100)
hit(20.3, 112)
melody(horns, [(62, 1), (69, 1.5), (67, 0.5), (65, 1), (64, 2), (60, 1), (62, 1), (69, 2), (73, 2)], 8, vel=92)
choir.chord(20.3, 7.2, [62, 69, 74], 80); choir.ramp(20.3, 21.5, 70, 110)
timp_roll(25.0, 27.4, 45, 40, 115)
snare_roll(26.2, 27.45, 30, 100)
swell(27.5, 2.0, 110)

# --- 27.5-40 King's Row: rain, a cello sings, hope returns
strings_pad(11, 16, 52, top=False)
for s_ in (vla, vln2, vc, cb):
    s_.ramp(27.5, 29, 110, 70)
melody(csolo, [(57, 2), (58, 1), (57, 1), (53, 3), (50, 1), (55, 2), (53, 1), (52, 1), (48, 4), (53, 2), (58, 2)], 11, vel=78)
csolo.cc(27.5, 1, 40)
arp(harp, 11, 16, [0, 1, 2, 3, 4, 3, 2, 1], 0.5, 52)
arp(piano, 13, 16, [3, 6, 7, 6], 1.0, 45, 12)
for t in (34.7, 35.2, 35.7, 36.2):
    pizz.n(t, 0.3, 74 + int((t - 34.7) * 6), 80)
vln1.n(35.0, 5.0, 81, 55); vln1.ramp(35, 38, 30, 100); vln1.ramp(38.5, 40, 100, 60)

# --- 40-52.5 Hanamura: koto, shakuhachi, taiko; the dragons rise
PENTA = [62, 65, 67, 69, 72, 74, 77, 79, 81]
for b in range(16, 21):
    for k in range(8):
        p = PENTA[(k * 2 + b * 3) % 7 + (2 if k % 4 == 3 else 0)]
        koto.n(bt(b, k * 0.5), 1.2, p, 72 if k % 2 == 0 else 58)
    taiko.n(bt(b), 1.5, 41, 70 if b < 18 else 90)
    if b >= 18:
        taiko.n(bt(b, 2.5), 1.0, 45, 70); taiko.n(bt(b, 3.0), 1.0, 45, 75); taiko.n(bt(b, 3.5), 1.0, 41, 85)
strings_pad(16, 21, 50)
melody(shaku, [(74, 2), (72, 1), (69, 1), (67, 3), (69, 1), (65, 2), (67, 2), (62, 4), (None, 4)], 16, vel=80)
shaku.cc(40, 1, 50)
snare_roll(45.4, 46.35, 30, 110)
swell(46.4, 1.6, 115)
hit(46.4, 124)
choir.chord(46.4, 6.0, [62, 69, 74, 77], 95)
melody(horns, [(74, 1.5), (72, 0.5), (69, 1), (67, 1), (69, 2), (74, 3.5)], 18, vel=100, beat0=2.4)
melody(tbn, [(50, 1.6), (48, 2), (50, 5.9)], 18, vel=90, beat0=2.4)
for s_ in (vln1, vln2, vla, vc, cb):
    s_.ramp(46.4, 47.5, 80, 120)
arp(vln1f, 19, 21, [4, 5, 6, 7, 6, 5, 4, 5], 0.25, 70)

# --- 52.5-62.5 Numbani: bright and uplifting
strings_pad(21, 25, 68)
for s_ in (vln1, vln2, vla, vc, cb):
    s_.ramp(52.5, 54, 118, 95)
for b in range(21, 25):
    tones, r = CH[PROG[b]]
    for k in range(8):
        vln2f.n(bt(b, k * 0.5), 0.28, [tones[0], tones[1], tones[2], tones[1]][k % 4] + 12, 72 if k % 2 == 0 else 60)
    timp.n(bt(b), 0.8, r + 12 if r + 12 < 55 else r, 70)
    kit.n(bt(b, 2), 0.1, SN, 45)
melody(horns, [(65, 1.5), (69, 0.5), (72, 2), (72, 1), (74, 0.5), (72, 0.5), (67, 2), (69, 1.5), (72, 0.5), (74, 2), (77, 2), (72, 2)], 21, vel=90)
melody(tpt, [(77, 1.5), (81, 0.5), (84, 2), (84, 1), (86, 0.5), (84, 0.5), (79, 2)], 23, vel=68)
arp(glock, 23, 25, [4, 5, 6, 7], 1.0, 50, 12)

# --- 62.5-72.5 Busan: synth arp + beat over strings (D.Va's MEKA drops in)
for b in range(25, 29):
    tones, r = CH[PROG[b]]
    for k in range(16):
        p = [r + 24, tones[1], tones[2], r + 36][k % 4] + (12 if k % 8 >= 4 else 0)
        saw.n(bt(b, k * 0.25), 0.13, p, 70 if k % 4 == 0 else 55)
    for k in range(8):
        sbass.n(bt(b, k * 0.5), 0.25, r, 90 if k % 2 == 0 else 70)
    for k in range(4):
        drums.n(bt(b, k), 0.1, 36, 105)
        drums.n(bt(b, k + 0.5), 0.05, 42, 60)
        drums.n(bt(b, k + 0.75), 0.05, 42, 45)
    drums.n(bt(b, 1), 0.1, 38, 95); drums.n(bt(b, 3), 0.1, 38, 100)
strings_pad(25, 29, 60, low=False)
hit(63.5, 118)
brass.chord(66.7, 1.8, [62, 69, 74], 95)
for t in [69.1, 69.5, 70.0, 70.5, 70.9, 71.4, 71.8]:
    glock.n(t, 0.8, int(rng.choice([86, 88, 91, 93, 98])), 72)
kit.n(69.1, 3, CRASH, 70)

# --- 72.5-82.5 Ilios: choir, harp, bells; the resurrection
for b in range(29, 33):
    tones, r = CH[PROG[b]]
    choir.chord(bt(b), BAR + 0.1, [tones[0], tones[1], tones[2] + 12], 70)
    cb.n(bt(b), BAR, r, 60); vc.n(bt(b), BAR, r + 12, 55)
    vln1.n(bt(b), BAR, tones[2] + 24 if tones[2] + 24 <= 96 else tones[2] + 12, 50)
arp(harp, 29, 33, [0, 2, 4, 6, 7, 6, 4, 2], 0.5, 60)
arp(cel, 29, 33, [4, 6, 7, 5], 1.0, 45, 12)
choir.ramp(72.5, 74, 60, 90)
swell(77.1, 1.4, 100)
for k, p in enumerate([81, 84, 88, 93, 96]):
    glock.n(77.1 + k * 0.07, 2.0, p, 85)
tbells.n(77.1, 4.0, 77, 80)
choir.chord(77.1, 4.5, [65, 72, 77, 81], 100); choir.ramp(77.1, 78, 90, 125); choir.ramp(79, 82.5, 125, 80)
melody(horns, [(77, 2), (76, 1), (72, 1), (74, 4)], 31, vel=78)

# --- 82.5-92.5 Nepal: stillness, bells like singing bowls, a lone flute
pedal(cb, 82.5, 92.6, 38, 55); pedal(vc, 82.5, 92.6, 45, 50)
cb.ramp(82.5, 84, 110, 75)
for b in range(33, 37):
    tones, r = CH[PROG[b]]
    oohs.chord(bt(b), BAR + 0.1, [tones[0], tones[2]], 60)
for t, p in [(82.8, 50), (85.2, 57), (88.0, 50), (90.4, 55)]:
    tbells.n(t, 5.0, p + 12, 70)
melody(shaku, [(None, 1), (74, 2), (72, 1), (69, 3), (67, 1), (69, 4), (65, 2), (62, 2)], 33, vel=75)
oohs.chord(87.9, 4.0, [62, 69, 74, 78], 90); oohs.ramp(87.9, 89, 70, 120); oohs.ramp(90, 92.5, 120, 70)
cel.n(87.9, 2.5, 86, 60); cel.n(88.1, 2.5, 90, 55)

# --- 92.5-105 Lijiang Tower: dizi-like flute, guzheng (koto), festive
strings_pad(37, 42, 58)
for b in range(37, 42):
    tones, r = CH[PROG[b]]
    for k in range(8):
        p = [r + 24, tones[2], tones[1] + 12, tones[2], r + 36, tones[2] + 12, tones[1] + 12, tones[2]][k]
        koto.n(bt(b, k * 0.5), 1.0, p, 64 if k % 2 == 0 else 52)
    taiko.n(bt(b), 1.0, 45, 60); taiko.n(bt(b, 2), 1.0, 48, 50)
melody(flute, [(72, 1), (74, 0.5), (77, 0.5), (81, 1.5), (79, 0.5), (79, 1), (77, 0.5), (74, 0.5), (72, 2), (74, 1), (77, 1), (79, 0.5), (81, 0.5), (84, 1),
               (81, 1.5), (79, 0.5), (77, 1), (74, 1), (72, 2), (74, 0.5), (77, 0.5), (79, 1)], 37, vel=88)
flute.cc(92.5, 1, 45)
melody(vsolo, [(None, 4), (69, 2), (72, 1), (74, 1), (72, 2), (67, 2)], 39, vel=70)
vsolo.cc(92.5, 1, 60)
for t in [97.5, 98.1, 98.9, 99.7, 100.5, 101.3, 102.1, 103.0, 103.8]:
    glock.n(t, 0.6, int(rng.choice([84, 86, 89, 91, 93])), 55)

# --- 105-115 Moon & Mars: celesta and harp over a slow build
strings_pad(42, 46, 55)
for s_ in (vln1, vln2, vla, vc, cb):
    s_.ramp(105, 115, 70, 110)
arp(cel, 42, 46, [4, 5, 6, 7], 0.25, 50)
arp(harp, 42, 46, [0, 1, 2, 3, 4, 5, 6, 5], 0.5, 58)
for b in range(42, 46):
    tones, r = CH[PROG[b]]
    pad.chord(bt(b), BAR + 0.1, [tones[0], tones[2]], 50)
melody(horns, [(None, 8), (69, 2), (74, 2), (72, 2), (70, 2)], 42, vel=70)
timp_roll(112.5, 115, 38, 30, 100)
swell(115.0, 2.5, 110)

# --- 115-125 the darkness: low brass, tremolo, the heroes appear, silence
tbn.chord(115.0, 4.0, [38, 45, 51], 118); tuba.n(115.0, 4.5, 26, 118); cb.n(115.0, 5.0, 26, 110)
for s_ in (tbn, tuba):
    s_.ramp(115.0, 119, 125, 40)
tbn.chord(120.0, 3.4, [39, 46, 51], 110); tuba.n(120.0, 3.4, 27, 110)
tbn.ramp(120.0, 120.05, 125, 125); tuba.ramp(120.0, 120.05, 125, 125)
tbn.ramp(120.2, 123.5, 90, 127); tuba.ramp(120.2, 123.5, 90, 127)
taiko.n(115.0, 3, 36, 120); bdrum.n(115.0, 4, 36, 120); kit.n(115, 3, CRASH, 90)
for b in range(46, 50):
    tones, r = CH[PROG[b]]
    trem.chord(bt(b), BAR if b < 49 else 1.1, [r + 12, tones[0], tones[1] + 12, tones[2] + 12], 70)
trem.ramp(115, 118, 60, 90); trem.ramp(118, 123.5, 90, 127)
oohs.chord(116.4, 7.0, [62, 63, 69], 70); oohs.ramp(116.4, 123.5, 50, 115)
for k in range(12):
    taiko.n(117.5 + k * 0.5, 0.6, 45, 50 + k * 5)
ORDER = [7, 5, 2, 3, 0, 4, 1, 6, 8, 9, 10, 11]
UP = [74, 78, 81, 86, 90, 93, 98, 102, 105, 110, 114, 117]
for k in ORDER:
    cel.n(120.0 + k * 0.28, 1.5, min(UP[k] - 12, 108), 80)
    harp.n(120.0 + k * 0.28, 1.5, UP[k] - 24, 70)
timp_roll(121.3, 123.55, 38, 40, 120)
snare_roll(122.4, 123.55, 30, 115)
swell(123.6, 2.0, 120)
glock.n(124.4, 2.0, 98, 90)

# --- 125-155 THE BATTLE
hit(125.0, 127)
choir.cc(124.9, 11, 110)
choir.chord(125.0, 2.5, [62, 69, 74, 77], 110)
for b in range(50, 60):
    tones, r = CH[PROG[b]]
    # driving low strings
    ostinato16(cbf, b, b + 1, 0, 88)
    ostinato16(vcf, b, b + 1, 12, 84)
    # violas / 2nd violins on eighths
    for k in range(8):
        vlaf.n(bt(b, k * 0.5), 0.3, [tones[0], tones[2], tones[1], tones[2]][k % 4], 74 if k % 2 == 0 else 62)
        vln2f.n(bt(b, k * 0.5), 0.3, [tones[2], tones[1] + 12, tones[2], tones[0] + 12][k % 4], 72 if k % 2 == 0 else 60)
    # sustained choir + trombones
    choir.chord(bt(b), BAR + 0.05, [tones[0], tones[1], tones[2]], 88)
    tbn.chord(bt(b), BAR * 0.95, [r + 12, tones[0] - 12 if tones[0] - 12 > r + 12 else tones[0], tones[2] - 12], 68)
    tuba.n(bt(b), BAR * 0.95, r, 80)
    # percussion groove
    for bb, pitch, v in [(0, 41, 115), (0.75, 45, 80), (1.5, 43, 95), (2, 41, 110), (2.75, 45, 80), (3.25, 43, 90), (3.5, 41, 100)]:
        taiko.n(bt(b, bb), 0.8, pitch, v)
    bdrum.n(bt(b), 1.5, 36, 110)
    kit.n(bt(b, 1), 0.1, SN, 80); kit.n(bt(b, 3), 0.1, SN, 85)
    timp.n(bt(b), 1.0, r + 12 if r + 12 <= 55 else r, 100)
    if b % 4 == 0:
        kit.n(bt(b), 3.0, CRASH, 105)
melody(horns, THEME_MINOR, 50, vel=110)
melody(horns, THEME_MINOR_2, 54, vel=115)
melody(horns, THEME_MINOR, 58, 12, vel=118)
melody(tpt, THEME_MINOR, 58, 12, vel=105)
melody(vln1f, THEME_MINOR, 58, 12, vel=100)
for s_ in (vln1f, vln2f, vlaf, vcf, cbf):
    s_.ramp(125, 126, 100, 115)
arp(vln1f, 54, 58, [4, 5, 6, 7, 6, 5, 4, 5], 0.25, 78)
# the big story beats inside the battle
for t, v in [(131.55, 118), (139.25, 127), (140.9, 124)]:
    hit(t, v)
swell(139.25, 1.6, 115)
choir.chord(143.1, 2.2, [66, 74, 78], 110)
glock.n(143.4, 1.5, 98, 95)
# 147.5-150 build
snare_roll(147.5, 150.0, 40, 125)
timp_roll(148.0, 150.0, 38, 50, 127)
for k in range(16):
    vln1f.n(147.5 + k * 0.156, 0.14, 62 + [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19, 21, 22, 24, 26][k], 80 + k * 2)
swell(150.0, 2.5, 127)
# 150.9 the convergence: a D major tutti (the moment of hope)
hit(150.9, 127)
for s_, ps in [(choir, [62, 66, 69, 74, 78]), (brass, [50, 57, 62, 66, 69]), (horns, [62, 66, 69]), (tpt, [74, 78]),
               (vln1, [78, 86]), (vln2, [74, 78]), (vla, [66, 69]), (vc, [50, 57]), (cb, [38])]:
    s_.chord(150.9, 3.8, ps, 118)
for s_ in (choir, vln1, vln2, vla, vc, cb):
    s_.ramp(151.2, 155.0, 120, 55)
for s_ in (brass, horns, tpt):
    s_.ramp(151.0, 153.5, 120, 20)
tbells.n(150.9, 5.0, 62, 100)
for s_ in (brass, horns, tpt):
    s_.cc(155.0, 11, 115)

# --- 155-170 dawn: D major, piano + strings + horns, building to the title
strings_pad(62, 68, 60, top=False)
for s_ in (vln1, vln2, vla, vc, cb):
    s_.ramp(155, 157, 60, 80); s_.ramp(163, 169.8, 80, 120)
arp(piano, 62, 68, [0, 2, 3, 6, 4, 3, 2, 1], 0.5, 58)
melody(vln1, THEME_MAJOR[:15], 62, 12, vel=100)
melody(horns, THEME_MAJOR[:15], 64, 0, vel=108)
oohs.chord(155.0, 7.5, [62, 69, 74], 55); oohs.ramp(155, 156.5, 40, 90)
for k, p in enumerate([86, 90, 93, 98]):
    glock.n(162.95 + k * 0.08, 1.8, p, 80)
choir.chord(162.9, 4.8, [66, 71, 74, 78], 90); choir.ramp(162.9, 164, 60, 110)
arp(harp, 66, 68, [0, 1, 2, 3, 4, 5, 6, 7], 0.25, 70)
timp_roll(167.5, 170.0, 38, 40, 127)
snare_roll(168.2, 170.0, 40, 125)
swell(170.0, 3.0, 127)

# --- 170-182.5 TITLE
hit(170.0, 127)
for b in range(68, 73):
    tones, r = CH[PROG[b]]
    v = 118 if b < 71 else 100
    choir.chord(bt(b), BAR + 0.1, [tones[0], tones[1], tones[2], tones[0] + 12], v)
    brass.chord(bt(b), BAR * 0.95, [r + 12, tones[0] - 12 + 12, tones[1]], v - 34)
    tbn.chord(bt(b), BAR * 0.95, [r + 12, tones[2] - 12], v - 28)
    tuba.n(bt(b), BAR * 0.95, r, v - 22)
    strings_pad(b, b + 1, v - 32)
    taiko.n(bt(b), 1.5, 41, 110 if b < 71 else 85); bdrum.n(bt(b), 2.0, 36, 110 if b < 71 else 80)
    timp.n(bt(b), 1.5, r + 12 if r + 12 <= 55 else r, 100)
melody(horns, TITLE_THEME, 68, vel=120)
melody(tpt, TITLE_THEME, 68, 12, vel=100)
melody(vln1f, TITLE_THEME, 68, 12, vel=95)
for s_ in (choir, brass, tbn, tuba, vln1, vln2, vla, vc, cb, horns, tpt, vln1f):
    s_.ramp(177.5, 182.5, 120, 45)
glock.n(178.2, 3.0, 86, 80); tbells.n(178.2, 5.0, 62, 85)

# --- 182.5-190 end card: piano farewell
melody(piano, [(74, 2), (69, 2), (66, 2), (62, 6)], 73, vel=58)
for s_, p in [(vc, 50), (vla, 57), (vln2, 66), (vln1, 74)]:
    s_.n(182.6, 7.0, p, 45)
    s_.ramp(182.6, 184, 50, 70); s_.ramp(186.5, 189.8, 70, 0)

# ================================================================== render
os.makedirs(os.path.join(ROOT, "build", "stems"), exist_ok=True)
active = {k: s for k, s in S.items() if s.notes}


def render(name):
    s = active[name]
    mid = os.path.join(ROOT, "build", "stems", name + ".mid")
    wav = os.path.join(ROOT, "build", "stems", name + ".wav")
    s.write(mid)
    subprocess.run(["fluidsynth", "-ni", "-q", "-R", "0", "-C", "0", "-g", "0.6", "-r", str(SR),
                    "-o", "synth.polyphony=1024", "-F", wav, args.sf2, mid], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return name


if not args.mix_only:
    print("rendering", len(active), "stems...")
    with ThreadPoolExecutor(args.jobs) as ex:
        for n in ex.map(render, active):
            print(" ", n)

# per-stem mix gains in dB (balanced from the section report below)
GAIN_DB = {
    "trombones": -7, "tuba": -4, "horns": -1, "trumpets": -1, "brass_section": -3, "choir": -3, "oohs": 3,
    "timpani": -1, "taiko": 0, "bass_drum": 2, "orch_kit": 0, "rev_cymbal": 0,
    "vln1": 3, "vln2": 3, "vla": 3, "vc": 3, "cb": 3,
    "vln1_fast": 5, "vln2_fast": 6, "vla_fast": 6, "vc_fast": 8, "cb_fast": 8, "trem": 5, "pizz": 16,
    "cello_solo": 3, "violin_solo": 9, "flute": 2, "shakuhachi": 4, "koto": 7, "harp": 5, "piano": 7,
    "celesta": 6, "glock": 4, "tubular_bells": 5, "pad": 3, "synth_arp": 9, "synth_bass": 4, "drum_kit": 3,
}
for k, s_ in active.items():
    s_.gain = 10 ** (GAIN_DB.get(k, 0) / 20)


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


N = int(DUR * SR)
dry = np.zeros((2, N)); send = np.zeros((2, N))
STEMS_X = {}
levels = {}
for name, s in active.items():
    x, sr = sf.read(os.path.join(ROOT, "build", "stems", name + ".wav"), always_2d=True)
    x = x.T[:, :N]
    if x.shape[1] < N:
        x = np.pad(x, ((0, 0), (0, N - x.shape[1])))
    sos = signal.butter(2, s.hp / (SR / 2), "high", output="sos")
    x = signal.sosfilt(sos, x, axis=1) * s.gain
    levels[name] = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
    dry += x; send += x * s.verb
    STEMS_X[name] = np.mean(x, axis=0)
print("stem RMS (dBFS):", ", ".join(f"{k} {v:.1f}" for k, v in sorted(levels.items(), key=lambda kv: -kv[1])))
STEMS_X[None] = None
SECTIONS = [("prologue", 0, 15), ("gibraltar", 15, 27.5), ("kingsrow", 27.5, 40), ("hanamura", 40, 52.5), ("numbani", 52.5, 62.5),
            ("busan", 62.5, 72.5), ("ilios", 72.5, 82.5), ("nepal", 82.5, 92.5), ("lijiang", 92.5, 105), ("cosmos", 105, 115),
            ("darkness", 115, 123.6), ("battle", 125, 150), ("dawn", 155, 170), ("title", 170, 182.5)]
for sec, a, b in SECTIONS:
    seg = {k: 20 * np.log10(np.sqrt(np.mean(v[int(a * SR):int(b * SR)] ** 2)) + 1e-12) for k, v in STEMS_X.items() if v is not None}
    top = sorted(((k, v) for k, v in seg.items() if v > -60), key=lambda kv: -kv[1])[:8]
    print(f"  {sec:10s}", "  ".join(f"{k}:{v:.0f}" for k, v in top))
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
sf.write(os.path.join(ROOT, "build", "score.wav"), mix.T.astype(np.float32), SR, subtype="FLOAT")
print("wrote build/score.wav")
