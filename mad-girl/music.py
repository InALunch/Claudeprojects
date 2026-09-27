# Synthesizes the score into build/music.wav from build/timeline.json (written by render.mjs).
# Two buses: the "world" bus is hard-muted whenever the eyelids are shut; the "mind" bus is not.
import json, wave
import numpy as np
from scipy.signal import lfilter

SR = 44100
tl = json.load(open('build/timeline.json'))
TOTAL = tl['total']; N = int(SR * (TOTAL + 1))
world = np.zeros((N, 2)); mind = np.zeros((N, 2))
rng = np.random.default_rng(3)
L = tl['lines']; ST = tl['stanzas']
dead = [l['dead'] for l in L if l['refrain']]
Ls = lambda si, li: next(l['start'] for l in L if l['si'] == si and l['li'] == li)
midi = lambda m: 440 * 2 ** ((m - 69) / 12)

def add(bus, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if sig.ndim == 1: sig = np.stack([sig * np.sqrt(.5 - pan / 2), sig * np.sqrt(.5 + pan / 2)], 1) * 1.414
    if i < 0: sig = sig[-i:]; i = 0
    j = min(N, i + len(sig))
    if j > i: bus[i:j] += gain * sig[:j - i]

def tv(d): return np.arange(int(SR * d)) / SR
def env_ar(n, a, r):
    e = np.ones(n); a = min(int(a * SR), n // 2); r = min(int(r * SR), n - a)
    if a: e[:a] = np.linspace(0, 1, a) ** 2
    if r: e[n - r:] *= np.linspace(1, 0, r) ** 2
    return e
def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); return lfilter([1 - a], [1, -a], x, axis=0)

def pad(notes, t0, t1, gain, a=2.5, r=2.5, bright=.35, wob=None, detune=.12):
    t = tv(t1 - t0); n = len(t); out = np.zeros((n, 2))
    for m in notes:
        f = midi(m)
        for ch, dt in ((0, -detune), (1, detune)):
            fm = f + dt
            if wob is not None: fm = fm * wob(t)
            ph = 2 * np.pi * np.cumsum(np.broadcast_to(fm, t.shape)) / SR
            s = np.sin(ph) + bright * np.sin(2 * ph) * .5 + bright * .25 * np.sin(3 * ph)
            out[:, ch] += s * (.8 + .2 * np.sin(2 * np.pi * .13 * t + m))
    out *= env_ar(n, a, r)[:, None] / len(notes)
    return out * gain

def bell(f, d=2.5, dec=2.2, ratio=2.76):
    t = tv(d)
    return (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * 7)) * np.exp(-t * dec) * np.minimum(1, t * 400)

def noise(d): return rng.standard_normal(int(SR * d))
def brown(d):
    x = np.cumsum(noise(d)); x -= lfilter([1], [1, -.9995], x) * (1 - .9995); return x / (np.abs(x).max() + 1e-9)

# ---------------- mind bus: intro, the last line, outro ----------------
add(mind, pad([26, 33, 38], .8, 15.5, .20, a=3, r=2.5, bright=.1), .8)
for i in range(5):                      # boot text keystrokes
    t0 = 1.2 + i * .85; nchar = [46, 36, 34, 34, 18][i]
    for k in range(0, nchar, 2):
        c = noise(.012) * np.exp(-tv(.012) * 400); add(mind, lowpass(c, 5000), t0 + k / 60 + rng.uniform(0, .01), .05, rng.uniform(-.3, .3))
for k, m in enumerate([74, 81, 86]): add(mind, bell(midi(m), 4, 1.2), 8.3 + k * .35, .07, (k - 1) * .4)   # eye opens
add(mind, bell(midi(50), 6, .7, 2.0), 10.0, .12)                                                          # title
add(mind, lowpass(noise(.03) * np.exp(-tv(.03) * 150), 1500), 12.35, .08)                                 # blink
fp = Ls(5, 3)                           # "(I think I made you up...)" in the dark
t = tv(8.5); tone = (np.sin(2 * np.pi * 880 * t) + np.sin(2 * np.pi * 883 * t)) * env_ar(len(t), 3, 3) * .5
add(mind, tone, fp, .018)
add(mind, pad([62, 66, 69, 74], fp + .5, fp + 8, .05, a=3, r=3, bright=.1), fp + .5)
OT = tl['outro']
add(mind, pad([50, 57, 62, 66], OT + .6, OT + 7, .10, a=2, r=3, bright=.15), OT + .6)
for k in range(0, 17, 2): add(mind, lowpass(noise(.012) * np.exp(-tv(.012) * 400), 5000), OT + 3 + k / 16, .04)
add(mind, bell(midi(62), 7, .6, 2.0), OT + 6.8, .12); add(mind, bell(midi(50), 7, .5, 2.0), OT + 6.8, .1)

# ---------------- world bus ----------------
start, end = ST[0]['start'] - 1.5, dead[-1]
add(world, pad([26, 33], start, end, .16, a=4, r=.1, bright=.2, detune=.08), start)            # bedrock drone
for l in L:                                                                                    # a bell for every line
    if l['si'] == 5 and l['li'] == 3: continue
    m = [74, 77, 81][l['li'] % 3] if not l['paren'] else 81
    if l['paren']:
        add(world, bell(midi(81), 5, .9), l['start'] + .05, .05, -.3); add(world, bell(midi(88) + 2.5, 5, .9), l['start'] + .08, .04, .3)
    else: add(world, bell(midi(m - 12), 4, 1.1, 2.0), l['start'] + .05, .06, rng.uniform(-.3, .3))
for d in dead:                                                                                 # swell into each "dead", then cut
    t = tv(2.3); sw = (t / 2.3) ** 3
    add(world, lowpass(noise(2.3), 2500) * sw, d - 2.3, .10)
    add(world, np.sin(2 * np.pi * 146.8 * t) * sw, d - 2.3, .08)

# I: born again
s = ST[0]; add(world, pad([50, 53, 57, 64], s['start'] - .5, s['end'] + 1.5, .12), s['start'] - .5)
o1 = tl['open1']
t = tv(2.5); add(world, lowpass(noise(2.5), 3000) * np.exp(-t * 2) * np.minimum(1, t * 30), o1, .12)
for k, m in enumerate([74, 78, 81, 86, 90]): add(world, bell(midi(m), 3, 1.5), o1 + .9 + k * .07, .05, (k - 2) * .3)

# II: a music-box waltz, trampled by a gallop
s = ST[1]; bar = 3 * tl['stride']; g0 = tl['gallop']; d1 = dead[1]
prog = [(50, [62, 65, 69]), (43, [62, 67, 70]), (45, [61, 64, 67]), (50, [62, 65, 69])]
mel = [81, 79, 77, 76, 77, 74, 73, 76, 74, 77, 81, 86]
t = s['start'] - .4; b = 0
while t < d1:
    trample = np.clip((t - g0) / (d1 - g0), 0, 1)
    det = 1 - .03 * trample; gain = 1 - .75 * trample
    root, ch = prog[b % 4]
    add(world, bell(midi(root + 12) * det, 2, 2.5, 3.9), t, .07 * gain)
    for k in (1, 2):
        for m in ch: add(world, bell(midi(m + 12) * det, 1.2, 4, 3.9), t + k * tl['stride'], .025 * gain, .3)
    add(world, bell(midi(mel[b % 12]) * det, 2, 2.2, 3.9), t, .05 * gain, -.2)
    t += bar; b += 1
add(world, pad([50, 57, 65], s['start'] - .5, d1, .07, a=3, r=.05), s['start'] - .5)
t = g0; k = 0
while t < d1:
    cres = .25 + .75 * np.clip((t - g0) / (d1 - g0), 0, 1)
    for off, acc in ((0, .6), (.09, .7), (.2, 1.0)):
        tt = tv(.22); f = 45 + 70 * np.exp(-tt * 25)
        thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 14) + lowpass(noise(.22), 800) * np.exp(-tt * 40) * .4
        add(world, thump, t + off, .30 * cres * acc)
    t += tl['stride']; k += 1

# III: the moon's song, loved into madness
s = ST[2]; l1 = Ls(2, 1); l2 = Ls(2, 2)
seg = pad([46, 53, 62, 69], s['start'] - .6, s['end'] + 1.5, .16, a=3, r=2.5, bright=.3,
          wob=lambda t: 1 + .006 * np.clip((t - (l1 + 1.4 - (s['start'] - .6))) / 3.6, 0, 1) * np.sin(2 * np.pi * 5.5 * t))
tt = np.arange(len(seg)) / SR + s['start'] - .6
k = np.clip((tt - (l1 + 1.4)) / 3.6, 0, 1) * (1 - np.clip((tt - (l2 + .3)) / 2.3, 0, 1))
drive = 1 + 7 * k[:, None]; seg = np.tanh(seg * drive * 4) / 4 / np.sqrt(drive)   # saturate as it goes insane
add(world, seg, s['start'] - .6)
for i in range(40):                                  # shimmer
    tt0 = s['start'] + i * .45; m = [77, 81, 86, 89, 93][i % 5]
    add(world, bell(midi(m), 2, 2.5), tt0, .02 + .03 * (l1 + 1 < tt0 < l2), rng.uniform(-.7, .7))

# IV: God topples, hell's fires fade, everyone leaves
s = ST[3]; l0 = Ls(3, 0); l1 = Ls(3, 1); d3 = dead[2]
top = l0 + .3
seg = pad([38, 45, 50, 53, 57], s['start'] - .6, d3, .15, a=2.5, r=.05, bright=.6,
          wob=lambda t: 1 - .11 * np.clip((t - (top - (s['start'] - .6))) / 2.6, 0, 1) ** 2)
add(world, lowpass(seg, 1400), s['start'] - .6)
fire_d = d3 - (s['start'] - .6); fn = lowpass(noise(fire_d), 1800)
tt = np.arange(len(fn)) / SR + s['start'] - .6
F = 1 - np.clip((tt - (l0 + 2.0)) / 3.5, 0, 1)
pops = (rng.random(len(fn)) < 40 / SR) * rng.uniform(-1, 1, len(fn)); pops = lfilter([1], [1, -.97], pops)
add(world, (fn * .5 + pops * .6) * F, s['start'] - .6, .10)
for t0, up in ((l1 + .4, 1), (l1 + 1.1, -1)):          # exit, whooshing up and down
    d = 3.5; t = tv(d); n = noise(d)
    fc = np.linspace(400, 3000, len(t)) if up > 0 else np.linspace(2500, 250, len(t))
    y = np.zeros_like(n); a = np.exp(-2 * np.pi * fc / SR); zi = [0.]
    for i0 in range(0, len(n), 512):                     # one-pole lowpass with a sweeping cutoff
        aa = a[i0]; y[i0:i0 + 512], zi = lfilter([1 - aa], [1, -aa], n[i0:i0 + 512], zi=zi)
    add(world, y * np.sin(np.pi * t / d) ** 2, t0, .12, -.5 * up)
add(world, bell(midi(69), 5, .8), l1 + 4.8, .05)          # the one voice kept

# V: growing old
s = ST[4]; l1 = Ls(4, 1)
a0 = l1 + .3 - (s['start'] - .6)
wob = lambda t: 1 + np.clip((t - a0) / 5.7, 0, 1) * (.014 * np.sin(2 * np.pi * .6 * t) + .004 * np.sin(2 * np.pi * 4.7 * t))
seg = pad([50, 53, 57, 60, 65], s['start'] - .6, s['end'] + 1.5, .15, a=3, r=2.5, bright=.4, wob=wob)
tt = np.arange(len(seg)) / SR + s['start'] - .6; age = np.clip((tt - (l1 + .3)) / 5.7, 0, 1)
seg = seg * (1 - .4 * age[:, None]) + lowpass(seg, 600) * .4 * age[:, None]   # dulls with age
add(world, seg, s['start'] - .6)
cr = (rng.random(len(tt)) < (3 + 60 * age) / SR) * rng.uniform(-1, 1, len(tt))
add(world, lowpass(lfilter([1], [1, -.6], cr), 4000) * .5 + lowpass(noise(len(tt) / SR), 3000) * .012 * age, s['start'] - .6, .25)

# VI: storm, thunderbird, spring
s = ST[5]; d5 = dead[3]; sp = tl['spring']; roar = tl['roar']
add(world, brown(sp + 2 - (s['start'] - .6)) * env_ar(int(SR * (sp + 2 - (s['start'] - .6))), 2, 2), s['start'] - .6, .10)
for f in tl['flashes']:
    big = f['big']; d = 3 + big * 1.5; t = tv(d)
    crack = lowpass(noise(.25), 6000) * np.exp(-tv(.25) * 18)
    rumble = lowpass(brown(d), 180 + 60 * big) * np.exp(-t * (1.2 - .25 * big)) * (1 + .5 * np.sin(2 * np.pi * 3 * t + rng.uniform(0, 6)))
    add(world, crack, f['t'], .18 + .1 * big); add(world, rumble, f['t'] + .15, .35 + .2 * big)
    if big:
        tt = tv(1.2); add(world, lowpass(noise(1.2), 7000) * (rng.random(len(tt)) < .02) * np.exp(-tt * 2), f['t'] + .3, .25)
add(world, pad([50, 54, 57, 62, 66], sp, d5, .17, a=3.5, r=.05, bright=.35), sp)
arp = [74, 78, 81, 86, 88, 90, 93]; t = sp + 1.0; k = 0
while t < d5 - .1:
    add(world, bell(midi(arp[(k * 3) % 7]), 2.5, 2), t, .045, np.sin(k) * .6); t += .32; k += 1

# ---------------- mute the world whenever the eyes are shut ----------------
tt = np.arange(N) / SR; open_ = np.ones(N)
reopen = [tl['reopen'][0], tl['reopen'][1], tl['reopen'][2], 1e9]
fade = [.9, 2.6, 2.6, 0]
for d, ro, fd in zip(dead, reopen, fade):
    m = (tt >= d) & (tt < ro); open_[m] = 0
    if fd: r = (tt >= ro) & (tt < ro + fd); open_[r] = ((tt[r] - ro) / fd) ** 2
    ramp = (tt >= d - .006) & (tt < d); open_[ramp] = np.minimum(open_[ramp], (d - tt[ramp]) / .006)
world *= open_[:, None]
world = lfilter([1, -1], [1, -.995], world, axis=0)     # DC block
out = world + mind
out = np.tanh(out * 1.3) / 1.3
out *= .82 / np.abs(out).max()
fi = int(SR * .5); out[:fi] *= np.linspace(0, 1, fi)[:, None]
end = int(SR * TOTAL); out[end - int(SR * 1.5):end] *= np.linspace(1, 0, int(SR * 1.5))[:, None]; out[end:] = 0
with wave.open('build/music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
# per-section loudness report
for i, s in enumerate(ST):
    a, b = int(s['start'] * SR), int(s['end'] * SR); print(f'stanza {i + 1}: rms {np.sqrt((out[a:b] ** 2).mean()):.3f}')
print('intro rms', np.sqrt((out[:int(15 * SR)] ** 2).mean()).round(3), '| total', TOTAL)
