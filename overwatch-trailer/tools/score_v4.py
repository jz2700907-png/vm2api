"""Score for script v4.1 (SCRIPT_v4.md): 74 bars at 96 BPM = 185 s.

Bar indices below are 0-based (script bar N = index N-1).  The "rain motif" is the head of the
main theme (D A G F); it turns major (D A G F#) when the orbital ray lands at 2:30.

Usage: python3 tools/score_v4.py [--mix-only] [--rain]
  --rain  also writes build/score_v4_preview.wav with a simple rain/storm bed so the
          rain-only moments can be judged (the real film uses recorded game audio + SFX).
"""
import argparse, os
import numpy as np
import soundfile as sf
from scipy import signal
from orch import *  # noqa: F401,F403  (stems, helpers, bt, BAR, BEAT, SR, ROOT)
import orch

ap = argparse.ArgumentParser()
ap.add_argument("--sf2", default="/usr/share/sounds/sf2/MuseScore_General_Full.sf2")
ap.add_argument("--jobs", type=int, default=4)
ap.add_argument("--mix-only", action="store_true")
ap.add_argument("--rain", action="store_true")
args = ap.parse_args()

DUR = 185.0
T = lambda b, beat=0.0: bt(b, beat)

setprog(0, ["Dm", "Dm", "Dm", "Bb", "F", "C", "Dm", "Bb"])          # 0:00 King's Row
setprog(8, ["F", "C", "Dm", "Bb", "F", "C"])                        # 0:20 montage
setprog(14, ["Bb", "F", "C", "Dm"])                                 # 0:35 Lijiang
setprog(18, ["Dm", "Dm"])                                           # 0:45 training
setprog(20, ["Dm", "Dm", "Eb", "A"])                                # 0:50 signal lost
setprog(24, ["Dm", "Bb", "F", "C", "Dm", "Bb", "F", "C"])           # 1:00 the bridge
setprog(32, ["Dm", "Eb", "Dm", "A"])                                # 1:20 blocked / "left!"
setprog(36, ["Dm", "Bb", "F", "C"])                                 # 1:30 the wall-walk
setprog(40, ["Dm", "Bb", "Gm", "A", "Dm", "Bb", "Eb", "A"])         # 1:40 "close the gate!"
setprog(48, ["Dm", "Dm", "Dm", "Dm", "Bb", "Bb", "Gm", "A"])        # 2:00 last ten meters
setprog(56, ["Bb", "Gm", "Asus", "A"])                              # 2:20 "follow me"
setprog(60, ["D", "A", "Bm", "G"])                                  # 2:30 orbital ray
setprog(64, ["D", "A", "Bm", "G", "D", "A"])                        # 2:40 rain stops
setprog(70, ["D", "D", "D", "D"])                                   # 2:55 title / end card

RAIN = [(74, 2), (81, 2), (79, 2), (77, 2)]                  # D A G F, half notes
THEME_MINOR = [(62, 1), (69, 1.5), (67, 0.5), (65, 1), (65, 0.5), (67, 0.5), (69, 2), (70, 1), (72, 1.5), (69, 0.5), (65, 1), (67, 1), (64, 2), (60, 1), (64, 1)]
THEME_MINOR_2 = [(62, 1), (69, 1), (74, 1.5), (72, 0.5), (70, 1), (69, 1), (67, 1), (65, 1), (69, 1), (67, 0.5), (65, 0.5), (64, 1), (65, 1), (64, 2), (61, 2)]
THEME_MAJOR = [(62, 1), (69, 1.5), (67, 0.5), (66, 1), (64, 0.5), (66, 0.5), (69, 2), (73, 1), (74, 1.5), (71, 0.5), (66, 1), (69, 1), (67, 2), (71, 1), (74, 1)]

# ============================================================ ACT 1 · first rain (0:00-0:50)
# bars 0-1: no music, only rain.  bar 2: "来，站我这边。"  bar 4: "原来……雨是这样的。"
for b in range(2, 8):
    tones, r = CH[PROG[b]]
    pad.chord(T(b), BAR + 0.1, [r + 12, tones[0], tones[2]], 40)
pad.ramp(T(2), T(4), 20, 80)
for s_, p in [(cb, 38), (vc, 50)]:
    s_.n(T(2), 6 * BAR, p, 40)
    s_.ramp(T(2), T(3), 10, 70)
# raindrop piano: sparse high notes from the D-minor pentatonic
DROPS = [81, 84, 86, 88, 89, 93]
for k, t in enumerate(np.cumsum(rng.uniform(0.45, 1.1, 22)) + T(2)):
    if t < T(6):
        piano.n(t, 0.6, DROPS[rng.integers(len(DROPS))], 34 + (k % 3) * 4)
melody(piano, RAIN, 3, vel=58)                                # first statement, under Juno's line
# bars 6-7: the motif in full (harp + strings + piano), the crane shot, "第1天 妈，地球下雨了。"
melody(piano, [(74, 1), (81, 1.5), (79, 0.5), (77, 1), (77, 0.5), (79, 0.5), (81, 2), (None, 1), (86, 1)], 6, vel=66)
arp(harp, 6, 8, [0, 1, 2, 3, 4, 3, 2, 1], 0.5, 50)
strings_pad(6, 8, 55, top=False)
for s_ in (vla, vln2, vc, cb):
    s_.ramp(T(6), T(7), 50, 85)
vln1.n(T(6), 2 * BAR, 81, 45); vln1.ramp(T(6), T(8), 30, 80)

# bars 8-13: montage, each map two bars: running pizzicato + a local colour
for b in range(8, 14):
    tones, r = CH[PROG[b]]
    for k in range(8):
        pizz.n(T(b, k * 0.5), 0.3, [r + 12, tones[1], tones[2], tones[1]][k % 4], 72 if k % 2 == 0 else 58)
    cb.n(T(b), BAR, r, 58); vc.n(T(b), BAR, r + 12, 52)
    vla.n(T(b), BAR, tones[0], 48); vln2.n(T(b), BAR, tones[1], 46)
for s_ in (vla, vln2, vc, cb):
    s_.ramp(T(8), T(8, 1), 70, 80)
# Ilios (8-9): flute runs ahead, following the blinks
melody(flute, [(77, 0.5), (79, 0.5), (81, 1), (84, 1), (81, 1), (79, 1), (81, 0.5), (84, 0.5), (86, 2)], 8, vel=78)
for t in (T(8, 0.5), T(8, 2.5), T(9, 0.5)):
    glock.n(t, 0.8, 93, 55)
# Hanamura (10-11): koto pentatonic, a wrong turn (a bent phrase) and back
for k, p in enumerate([74, 77, 79, 81, 79, 77, 74, 72, 74, 77, 79, 84, 81, 79, 77, 79]):
    koto.n(T(10, k * 0.5), 1.0, p, 70 if k % 2 == 0 else 56)
melody(flute, [(81, 1.5), (79, 0.5), (77, 1), (76, 1), (74, 2), (77, 1), (79, 1)], 10, vel=70)
# Busan (12-13): D.Va's gesture on celesta, Juno's copy on clarinet half a beat late (wrong, then right)
melody(cel, [(84, 0.5), (86, 0.5), (91, 1), (None, 2), (84, 0.5), (86, 0.5), (91, 1)], 12, vel=74)
melody(clar, [(None, 0.5), (72, 0.5), (73, 0.5), (79, 1), (None, 1.5), (None, 0.5), (72, 0.5), (74, 0.5), (79, 1)], 12, vel=72)
arp(saw, 12, 14, [0, 2, 3, 6], 0.25, 30, 12)
melody(flute, [(81, 2), (79, 1), (77, 1)], 13, vel=66)

# bars 14-17: Lijiang, the emotional peak of act 1: solo violin (erhu-like) over swelling strings
strings_pad(14, 18, 58)
for s_ in (vln1, vln2, vla, vc, cb):
    s_.ramp(T(14), T(16), 55, 95); s_.ramp(T(16), T(18), 95, 70)
melody(vsolo, [(69, 2), (72, 1), (74, 1), (77, 3), (76, 1), (74, 2), (72, 1), (69, 1), (67, 4), (69, 2), (72, 2), (74, 4)], 14, vel=78)
vsolo.cc(T(14), 1, 60)
arp(harp, 14, 18, [0, 1, 2, 3, 4, 5, 6, 5], 0.5, 48)
oohs.chord(T(15), 2 * BAR, [65, 69, 72], 50); oohs.ramp(T(15), T(16), 30, 90); oohs.ramp(T(16, 2), T(17), 90, 40)
for k, p in enumerate([93, 96, 98, 101]):                     # the red dot in the sky: Mars
    cel.n(T(16, 2) + k * 0.35, 1.6, p, 58)

# bars 18-19: training. Pizzicato drill, the motif starts and gets cut off by the shield
for b in (18, 19):
    for k in range(4):
        pizz.n(T(b, k), 0.25, 62 if k % 2 == 0 else 69, 50)
        kit.n(T(b, k + 0.5), 0.05, SN, 38)
melody(piano, [(74, 1), (81, 1), (79, 0.5)], 18, 0, vel=60, beat0=2)
timp.n(T(19, 0.5), 0.8, 45, 70)                               # the sidestep: the motif stops
piano.n(T(19, 2), 1.2, 74, 42)

# ============================================================ ACT 2 · the storm (0:50-2:00)
hit(T(20), 124)                                               # "信号中断"
for s_, p in [(cb, 38), (vc, 50)]:
    s_.n(T(20), 4 * BAR, p, 90)
    s_.ramp(T(20), T(24), 100, 110)
for b in range(20, 24):
    tones, r = CH[PROG[b]]
    trem.chord(T(b), BAR, [r + 12, tones[0], tones[1] + 12], 64)
trem.ramp(T(20), T(22), 50, 80); trem.ramp(T(22), T(24), 80, 115)
melody(horns, [(50, 1.5), (51, 0.5), (50, 2), (45, 4)], 22, vel=96)          # Talon: D Eb D A
melody(tbn, [(38, 1.5), (39, 0.5), (38, 2), (33, 4)], 22, vel=86)
for k in range(16):
    taiko.n(T(22, k * 0.5), 0.6, 45, 48 + k * 4)
timp_roll(T(23, 1), T(24), 38, 40, 118)
swell(T(24), 1.8, 110)


def battle_bar(b, dyn=1.0, choir_on=True):
    tones, r = CH[PROG[b]]
    ostinato16(cbf, b, b + 1, 0, int(88 * dyn))
    ostinato16(vcf, b, b + 1, 12, int(84 * dyn))
    for k in range(8):
        vlaf.n(T(b, k * 0.5), 0.3, [tones[0], tones[2], tones[1], tones[2]][k % 4], int((74 if k % 2 == 0 else 62) * dyn))
        vln2f.n(T(b, k * 0.5), 0.3, [tones[2], tones[1] + 12, tones[2], tones[0] + 12][k % 4], int((72 if k % 2 == 0 else 60) * dyn))
    if choir_on:
        choir.chord(T(b), BAR + 0.05, [tones[0], tones[1], tones[2]], int(84 * dyn))
    tbn.chord(T(b), BAR * 0.95, [r + 12, tones[2] - 12], int(66 * dyn))
    tuba.n(T(b), BAR * 0.95, r, int(78 * dyn))
    for bb, pitch, v in [(0, 41, 115), (0.75, 45, 80), (1.5, 43, 95), (2, 41, 110), (2.75, 45, 80), (3.25, 43, 90), (3.5, 41, 100)]:
        taiko.n(T(b, bb), 0.8, pitch, int(v * dyn))
    bdrum.n(T(b), 1.5, 36, int(108 * dyn))
    kit.n(T(b, 1), 0.1, SN, int(80 * dyn)); kit.n(T(b, 3), 0.1, SN, int(85 * dyn))
    timp.n(T(b), 1.0, r + 12 if r + 12 <= 55 else r, int(96 * dyn))


# bars 24-31: across the bridge ("跟紧我！" at 1:00)
hit(T(24), 126)
for b in range(24, 32):
    battle_bar(b, 0.92 if b < 28 else 1.0, choir_on=b >= 28)
melody(horns, THEME_MINOR, 24, vel=108)
melody(horns, THEME_MINOR_2, 28, vel=112)
melody(vln1f, THEME_MINOR_2, 28, 12, vel=92)
for s_ in (vln1f, vln2f, vlaf, vcf, cbf):
    s_.cc(T(24) - 0.05, 11, 112)
kit.n(T(28), 3.0, CRASH, 100)

# bars 32-35: the bridge is blown (hit), stuck under fire, then "左边还有路！" (bar 34) in a thinner texture
hit(T(32), 127)
for b in range(32, 36):
    tones, r = CH[PROG[b]]
    trem.chord(T(b), BAR, [r + 12, tones[0], tones[1] + 12, tones[2] + 12], 70)
    ostinato16(cbf, b, b + 1, 0, 70 if b != 34 else 56)
    taiko.n(T(b), 1.0, 41, 100 if b != 34 else 70)
trem.ramp(T(32), T(34), 90, 70); trem.ramp(T(35), T(36), 70, 118)
vln1.n(T(34), BAR, 86, 60)                                    # a high held note: she sees it
snare_roll(T(35, 1), T(36), 30, 118)
swell(T(36), 1.6, 110)

# bars 36-39: the wall-walk works; Reinhardt nods (bar 37)
for b in range(36, 40):
    battle_bar(b, 1.0)
melody(vln1f, THEME_MINOR, 36, 12, vel=102)
melody(horns, [(69, 2), (74, 2), (72, 2), (70, 2), (69, 4), (65, 2), (67, 2)], 36, vel=104)
brass.chord(T(37), BAR * 0.9, [62, 65, 69], 92)               # the nod
kit.n(T(36), 3.0, CRASH, 105)

# bars 40-47: Mauga on the wall-walk; "关门！" (bar 42); the gate closes; cut dead at 2:00
for b in range(40, 44):
    battle_bar(b, 1.05)
melody(horns, THEME_MINOR, 40, 12, vel=120)
melody(tpt, THEME_MINOR, 40, 12, vel=106)
hit(T(42), 127)                                               # "关门！"
for b in range(44, 48):
    tones, r = CH[PROG[b]]
    trem.chord(T(b), BAR, [r + 12, tones[0], tones[1] + 12, tones[2] + 12], 80)
    choir.chord(T(b), BAR, [tones[0], tones[1], tones[2], tones[0] + 12], 96)
    for k in range(4):
        taiko.n(T(b, k), 0.8, 41, 100 + k * 5)
    bdrum.n(T(b), 1.5, 36, 112)
# the closing gate: a slow descending line in low brass
melody(tbn, [(50, 2), (49, 2), (48, 2), (47, 2), (46, 2), (45, 2), (44, 2), (45, 2)], 44, vel=108)
melody(tuba, [(38, 2), (37, 2), (36, 2), (35, 2), (34, 2), (33, 2), (32, 2), (33, 2)], 44, vel=100)
melody(horns, [(74, 4), (72, 4), (70, 4), (69, 4)], 44, vel=118)
trem.ramp(T(44), T(48), 90, 127); choir.ramp(T(44), T(48), 95, 127)
timp_roll(T(46, 2), T(48) - 0.05, 45, 60, 127)
snare_roll(T(47), T(48) - 0.05, 50, 127)

# ============================================================ ACT 3 · the last ten meters (2:00-2:40)
# bars 48-49: silence (rain only).  bars 50-55: a heartbeat pulse, the rain motif low in the celli
for b in range(50, 56):
    v = 44 + (b - 50) * 9
    bdrum.n(T(b), 0.6, 36, v); bdrum.n(T(b, 0.6), 0.5, 36, int(v * 0.7))
    bdrum.n(T(b, 2), 0.6, 36, v); bdrum.n(T(b, 2.6), 0.5, 36, int(v * 0.7))
cb.n(T(50), 6 * BAR, 26 + 12, 70); cb.ramp(T(50), T(56), 40, 100)
melody(vc, [(50, 2), (57, 2), (55, 2), (53, 2), (50, 2), (57, 2), (58, 2), (57, 2), (52, 2), (49, 2)], 51, vel=80)
vc.ramp(T(51), T(56), 60, 108)
for b in range(53, 56):
    tones, r = CH[PROG[b]]
    vla.n(T(b), BAR, tones[0], 62); vln2.n(T(b), BAR, tones[1], 58)
vla.ramp(T(53), T(56), 40, 95); vln2.ramp(T(53), T(56), 40, 95)
swell(T(54), 2.0, 90)                                         # she steps off the wall
harp.n(T(53, 3), 0.2, 74, 60)
for k, p in enumerate([62, 65, 69, 74, 77, 81, 86]):          # the glide
    harp.n(T(53, 3) + k * 0.07, 1.0, p, 64)
taiko.n(T(54), 1.6, 41, 104); timp.n(T(54), 1.6, 38, 96)      # the ice wall
# bars 56-59: hold still under the two lines ("跟着我。" bar 56-57, "……好，听你的。" bar 58-59)
for b in range(56, 60):
    tones, r = CH[PROG[b]]
    trem.chord(T(b), BAR, [r + 12, tones[0], tones[1] + 12, tones[2] + 12], 58)
    cb.n(T(b), BAR, r, 60)
trem.ramp(T(56), T(59), 55, 75); trem.ramp(T(59), T(60) - 0.05, 75, 120)
vln1.n(T(56), 3 * BAR, 81, 50); vln1.ramp(T(56), T(59), 35, 70)
piano.n(T(57, 2), 1.5, 74, 44); piano.n(T(57, 3), 1.5, 81, 40)   # the motif, just two notes, after "跟着我"
timp_roll(T(59, 1), T(60) - 0.03, 45, 40, 124)
snare_roll(T(59, 2), T(60) - 0.03, 35, 122)
swell(T(60), 2.2, 124)

# bars 60-63: D major, the orbital ray lands (2:30), Juno leads and Reinhardt follows
hit(T(60), 127)
tbells.n(T(60), 5.0, 62, 104)
for b in range(60, 64):
    tones, r = CH[PROG[b]]
    choir.chord(T(b), BAR + 0.05, [tones[0], tones[1], tones[2], tones[0] + 12], 110)
    brass.chord(T(b), BAR * 0.95, [r + 12, tones[1], tones[2]], 84)
    tbn.chord(T(b), BAR * 0.95, [r + 12, tones[2] - 12], 78); tuba.n(T(b), BAR * 0.95, r, 86)
    strings_pad(b, b + 1, 96)
    for bb, pitch, v in [(0, 41, 118), (1.5, 43, 90), (2, 41, 110), (3, 45, 90), (3.5, 41, 100)]:
        taiko.n(T(b, bb), 0.8, pitch, v)
    bdrum.n(T(b), 1.5, 36, 110)
    timp.n(T(b), 1.0, r + 12 if r + 12 <= 55 else r, 100)
    arp(vln2f, b, b + 1, [4, 5, 6, 7, 6, 5, 4, 5], 0.25, 70)
melody(horns, THEME_MAJOR, 60, vel=122)
melody(vln1, THEME_MAJOR, 60, 12, vel=110)
melody(tpt, THEME_MAJOR[:7], 60, 12, vel=100)
for s_ in (choir, brass, horns, vln1, vln2, vla, vc, cb, tpt):
    s_.cc(T(60) - 0.05, 11, 120)
for s_ in (choir, brass, tbn, tuba, vln1, vln2, vla, vc, cb, horns, tpt, vln2f):
    s_.ramp(T(63), T(64, 2), 120, 55)
kit.n(T(62), 3.0, CRASH, 100)

# ============================================================ ACT 4 · the rain stops (2:40-3:05)
for s_ in (choir, brass, tbn, tuba, horns, tpt, vln2f):
    s_.cc(T(66), 11, 115)                                     # reset expression for the title
strings_pad(64, 70, 58, top=False)
for s_ in (vla, vln2, vc, cb):
    s_.ramp(T(64, 2), T(65), 55, 80); s_.ramp(T(68), T(70), 80, 100)
arp(piano, 64, 70, [0, 2, 3, 6, 4, 3, 2, 1], 0.5, 50)
# the hands, side by side (bars 66-67): the rain motif, now in D major
melody(piano, [(74, 2), (81, 2), (79, 2), (78, 2)], 66, 12, vel=62)
for t in np.cumsum(rng.uniform(0.6, 1.3, 12)) + T(64, 2):   # the last drops
    if t < T(68):
        cel.n(t, 0.8, [86, 88, 90, 93, 95][rng.integers(5)], 40)
melody(horns, [(66, 2), (69, 2), (71, 2), (69, 2)], 68, vel=84)
oohs.chord(T(66), 4 * BAR, [62, 66, 69, 74], 50); oohs.ramp(T(66), T(67), 30, 85)
glock.n(T(69, 1.4), 2.0, 86, 70); glock.n(T(69, 1.55), 2.0, 93, 60)   # "已发送"
timp_roll(T(69, 2), T(70) - 0.03, 38, 30, 118)
swell(T(70), 2.2, 120)

# bars 70-71: title
vln1.cc(T(70) - 0.05, 11, 110)
hit(T(70), 127)
for b in (70, 71):
    tones, r = CH[PROG[b]]
    v = 118 if b == 70 else 96
    choir.chord(T(b), BAR + 0.1, [tones[0], tones[1], tones[2], tones[0] + 12], v)
    brass.chord(T(b), BAR * 0.95, [r + 12, tones[1], tones[2]], v - 30)
    tbn.chord(T(b), BAR * 0.95, [r + 12, tones[2] - 12], v - 28); tuba.n(T(b), BAR * 0.95, r, v - 22)
    strings_pad(b, b + 1, v - 28)
melody(horns, [(62, 2), (69, 2), (74, 4)], 70, vel=122)
melody(tpt, [(62, 2), (69, 2), (74, 4)], 70, 12, vel=102)
for s_ in (choir, brass, tbn, tuba, vln1, vln2, vla, vc, cb, horns, tpt):
    s_.ramp(T(71), T(72), 120, 40)
tbells.n(T(70), 5.0, 62, 96)

# bars 72-73: end card, the motif one last time on piano
melody(piano, [(81, 2), (79, 2), (78, 2), (74, 2)], 72, vel=56)
for s_, p in [(vc, 50), (vla, 57), (vln2, 66), (vln1, 74)]:
    s_.n(T(72), 2 * BAR - 0.3, p, 45)
    s_.ramp(T(72), T(72, 2), 40, 65); s_.ramp(T(73), DUR - 0.3, 65, 0)

# ============================================================ render + mix
SECTIONS = [("rain", 5, 20), ("montage", 20, 35), ("lijiang", 35, 45), ("signal", 50, 60), ("bridge", 60, 80),
            ("left_path", 80, 90), ("walkway", 90, 100), ("close_gate", 100, 120), ("heartbeat", 125, 140),
            ("follow_me", 140, 150), ("ray", 150, 160), ("rain_stops", 160, 175), ("title", 175, 180)]
out = os.path.join(ROOT, "build", "score_v4.wav")
mix = render_and_mix(DUR, out, os.path.join(ROOT, "build", "stems_v4"), args.sf2, args.jobs, args.mix_only, SECTIONS)
# 2:00 hard cut: the music (and its hall tail) stops dead when the shield breaks; only rain until 2:05
a, b, f = int(T(48) * SR), int(T(50) * SR) - 1, int(0.03 * SR)
mix[:, a:a + f] *= np.linspace(1, 0, f)
mix[:, a + f:b] = 0
sf.write(out, mix.T.astype(np.float32), SR, subtype="FLOAT")


def rain_bed(dur, seed=11):
    """Filtered-noise rain with a loudness curve per act (preview only)."""
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    x = r.standard_normal((2, n))
    x = signal.sosfilt(signal.butter(2, [900 / (SR / 2), 9000 / (SR / 2)], "band", output="sos"), x, axis=1)
    drops = np.zeros((2, n))
    idx = r.integers(0, n, int(dur * 60))
    drops[r.integers(0, 2, idx.size), idx] = r.uniform(0.3, 1.0, idx.size)
    drops = signal.sosfilt(signal.butter(2, [2000 / (SR / 2), 7000 / (SR / 2)], "band", output="sos"), drops, axis=1)
    x = x * 0.6 + drops * 3.0
    t = np.arange(n) / SR
    # (time, dB) keyframes: gentle rain -> quiet -> storm -> rain only -> drizzle -> none
    kf = [(0, -24), (20, -30), (22, -60), (49, -60), (50.5, -26), (120, -24), (120.3, -18), (125, -20), (150, -26),
          (160, -32), (170, -40), (175, -70), (185, -70)]
    db = np.interp(t, [k[0] for k in kf], [k[1] for k in kf])
    x *= 10 ** (db / 20)
    return x / (np.sqrt(np.mean(x[:, :int(20 * SR)] ** 2)) + 1e-9) * 10 ** (-30 / 20)


if args.rain:
    bed = rain_bed(DUR)
    prev = mix + bed[:, :mix.shape[1]]
    prev /= np.max(np.abs(prev)) + 1e-9
    prev *= 0.89
    sf.write(os.path.join(ROOT, "build", "score_v4_preview.wav"), prev.T.astype(np.float32), SR, subtype="FLOAT")
    print("wrote build/score_v4_preview.wav (with rain bed)")
