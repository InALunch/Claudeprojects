# Builds the soundtrack into build/mix.wav: narrator lines, a low drone, VHS hiss and every sound effect,
# all placed from the cues psa.html exports (build/timeline.json, written by `node render.mjs stills ...`)
import json
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

SR = 44100
tl = json.load(open('build/timeline.json'))
TOTAL = tl['total']
N = int(SR * (TOTAL + .5))
S = dict(zip(tl['names'], tl['starts']))
rng = np.random.default_rng(3)
ts = lambda d: np.arange(int(SR * d)) / SR

def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x)

def add(buf, sig, t, gain=1.):
    i = int(t * SR); j = min(len(buf), i + len(sig))
    if j > i: buf[i:j] += gain * sig[:j - i]

def verb(x, wet=.25, taps=((.031, .5), (.053, .4), (.079, .3), (.113, .22), (.161, .14), (.23, .08))):
    y = x.copy()
    for d, g in taps:
        k = int(d * SR); y[k:] += wet * g * x[:-k]
    return y

# ---------- sound effects ----------
def noise(d): return rng.uniform(-1, 1, int(SR * d))
def env(d, a=.005, decay=10.):
    t = ts(d); return np.minimum(1, t / a) * np.exp(-t * decay)

def sfx_vcr():
    t = ts(.9)
    thump = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 18)
    click = filt(noise(.9), 'highpass', 2000) * np.exp(-t * 60)
    whir = filt(noise(.9), 'bandpass', [180, 600]) * np.minimum(1, t / .2) * np.exp(-np.maximum(0, t - .5) * 6) * .5
    return thump + .6 * click + whir

def sfx_buzz():
    t = ts(.75)
    tone = np.sign(np.sin(2 * np.pi * 165 * t)) * .5 + np.sin(2 * np.pi * 165 * t)
    gate = ((t % .38) < .26).astype(float)
    return filt(tone * gate, 'lowpass', 900) * .5

def sfx_swipe():
    d = .26; t = ts(d); x = noise(d)
    lo = filt(x, 'bandpass', [600, 1800]); hi = filt(x, 'bandpass', [1800, 5000])
    k = t / d
    return (lo * (1 - k) + hi * k) * np.sin(np.pi * k) ** 1.5

def sfx_ping():
    out = np.zeros(int(SR * .7))
    for f, at in ((1318.5, 0), (1760, .11)):
        t = ts(.55); add(out, (np.sin(2 * np.pi * f * t) + .2 * np.sin(2 * np.pi * 2 * f * t)) * env(.55, .002, 9), at)
    return out * .5

def sfx_heart():
    out = np.zeros(int(SR * .5))
    for f, at, g in ((58, 0, 1), (50, .17, .75)):
        t = ts(.22); add(out, np.sin(2 * np.pi * f * t * (1 - .3 * t)) * env(.22, .004, 22), at, g)
    return filt(out, 'lowpass', 200) * 1.8

def sfx_tick():
    return filt(noise(.03), 'highpass', 2500) * env(.03, .0005, 250)

def sfx_pen():
    d = .7; t = ts(d)
    return filt(noise(d), 'bandpass', [2500, 7000]) * (.6 + .4 * np.sin(2 * np.pi * 9 * t)) * np.minimum(1, t / .05) * np.exp(-t * 2) * .25

def sfx_stamp():
    t = ts(.5)
    return np.sin(2 * np.pi * 75 * t * (1 - .4 * t)) * np.exp(-t * 16) + filt(noise(.5), 'lowpass', 1500) * np.exp(-t * 40) * .7

def sfx_alarm():
    d = 3.2; t = ts(d)
    tone = np.sign(np.sin(2 * np.pi * 2350 * t)) * .5
    gate = (((t % .8) < .52) & ((t % .13) < .07)).astype(float)
    return filt(tone * gate, 'lowpass', 6000) * .35

def sfx_type():
    d = .08; t = ts(d)
    clack = filt(noise(d), 'bandpass', [1500, 6000]) * np.exp(-t * 180)
    body = np.sin(2 * np.pi * rng.uniform(170, 230) * t) * np.exp(-t * 70)
    return (clack + .6 * body) * rng.uniform(.7, 1)

def sfx_hit():
    d = 2.2; t = ts(d)
    boom = np.sin(2 * np.pi * (38 + 40 * np.exp(-t * 14)) * t) * np.exp(-t * 2.2)
    crack = filt(noise(d), 'lowpass', 3000) * np.exp(-t * 25)
    return verb(boom * 1.2 + .5 * crack, .5)

def sfx_click():
    out = np.zeros(int(SR * .12))
    for at in (0, .06): add(out, filt(noise(.02), 'highpass', 3000) * env(.02, .0005, 400), at, .7)
    return out

def sfx_crt():
    d = 1.2; t = ts(d)
    whine = np.sin(2 * np.pi * np.cumsum(5000 * np.exp(-t * 5) + 120) / SR) * np.exp(-t * 3) * .35
    thump = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 10)
    static = filt(noise(d), 'highpass', 1500) * np.exp(-t * 12) * .5
    return whine + thump + static

def sfx_glitch():
    d = .2; x = noise(d)
    x = np.round(filt(x, 'bandpass', [400, 4000]) * 4) / 4           # crushed
    return x * np.minimum(1, ts(d) / .003) * np.exp(-ts(d) * 12) * .5

SFX = {k[4:]: v for k, v in globals().items() if k.startswith('sfx_')}

# ---------- narrator ----------
vo = np.zeros(N)
vo_cache = {}
def load_vo(key):
    if key not in vo_cache:
        x, sr = sf.read(f'build/vo/{key}.wav')
        x = resample_poly(x, 147, 80) if sr == 24000 else x
        x = filt(x, 'highpass', 85); x = filt(x, 'lowpass', 9000)      # TV-speaker band
        vo_cache[key] = verb(np.tanh(x * 1.6) / 1.2, .18)
    return vo_cache[key]

more_n = 0
fx = np.zeros(N)
for c in tl['cues']:
    kind, key = c['what'].split(':')
    if kind == 'vo':
        x = load_vo(key)
        if key == 'more':                                  # each "just one more" a little more distant
            x = verb(x, .25 + .35 * more_n, ((.12, .5), (.24, .3), (.36, .18))) if more_n else x
            more_n += 1
        add(vo, x, c['t'], c['gain'])
    else:
        add(fx, SFX[key](), c['t'], c['gain'] * .55)

# ---------- drone bed ----------
t = np.arange(N) / SR
keys = [(0, 0), (S['night'], 0), (S['night'] + 1.2, .45), (S['feed'], .55), (S['eye'], 1), (S['morning'] - .3, .85),
        (S['morning'], .35), (S['warn'], .55), (S['once'] - .05, .8), (S['once'], 0), (S['partner'], 0), (S['partner'] + .2, .22),
        (S['close'], .3), (S['close'] + 3.95, .3), (S['close'] + 4.2, 0), (TOTAL + 1, 0)]
lvl = np.interp(t, [k[0] for k in keys], [k[1] for k in keys])
lfo = 1 + .25 * np.sin(2 * np.pi * .13 * t)
drone = sum(a * np.sin(2 * np.pi * f * t + p) for f, a, p in ((55, 1, 0), (55.4, .7, 1), (82.4, .45, 2), (110.3, .3, 3), (116.5, .12, 4)))
drone = filt(np.tanh(drone * 1.5), 'lowpass', 400) * lfo
# a slow high tone creeping in over the feed and the eye
hi = np.sin(2 * np.pi * 1760 * t) * .04 * np.interp(t, [S['feed'], S['eye'] + 2, S['bottom'] + 1, S['built']], [0, 1, 1, 0])
duck = 1 - .45 * np.minimum(1, filt(np.abs(vo), 'lowpass', 6) * 6)
bed = (drone * lvl * .22 + hi) * duck

# ---------- VHS hiss ----------
hiss = filt(rng.uniform(-1, 1, N), 'highpass', 3000) * .012 * (t < S['close'] + 4.7)

mix = vo * .9 + fx + bed + hiss
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= .89 / np.max(np.abs(mix))
sf.write('build/mix.wav', np.stack([mix, mix], 1).astype(np.float32), SR, subtype='PCM_16')
print('ok', round(TOTAL, 2), 's')
