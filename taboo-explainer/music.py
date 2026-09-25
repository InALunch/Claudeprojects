# Synthesizes a cute plucky background loop + scene-change "boops" into build/music.wav
import json, wave
import numpy as np
SR = 44100
tl = json.load(open('build/timeline.json'))
TOTAL = tl['total']
N = int(SR * (TOTAL + 1))
out = np.zeros(N)
rng = np.random.default_rng(7)

def pluck(freq, dur, bright=.5):
    # Karplus-Strong string
    n = int(SR * dur); p = int(SR / freq)
    buf = rng.uniform(-1, 1, p); y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % p]
        buf[i % p] = .996 * (bright * buf[i % p] + (1 - bright) * buf[(i + 1) % p])
    return y * np.exp(-np.linspace(0, 3.5, n))

def add(sig, t, gain):
    i = int(t * SR); j = min(N, i + len(sig))
    if j > i: out[i:j] += gain * sig[:j - i]

def midi(m): return 440 * 2 ** ((m - 69) / 12)

BPM = 104; beat = 60 / BPM
# I - vi - IV - V in C, arpeggio pattern in eighth notes
chords = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
pattern = [0, 1, 2, 3, 2, 1, 2, 3]
cache = {}
def note(m, dur, bright):
    k = (m, dur, bright)
    if k not in cache: cache[k] = pluck(midi(m), dur, bright)
    return cache[k]
# gentle melody (glockenspiel-ish sine bells), 2 bars per phrase
mel = [[76, None, 79, None, 76, 74, 72, None], [72, None, 74, None, 76, None, None, None],
       [77, None, 76, None, 74, 72, 74, None], [74, None, 72, None, 71, None, None, None]]
def bell(freq, dur=1.2):
    t = np.arange(int(SR * dur)) / SR
    return (np.sin(2 * np.pi * freq * t) + .3 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 6)) * np.exp(-t * 3.2)

t = 0.0; bar = 0
while t < TOTAL:
    ch = chords[bar % 4]
    for k, idx in enumerate(pattern):
        add(note(ch[idx], 1.0, .5), t + k * beat / 2, .16)
        if bar >= 2 and (bar // 8) % 2 == 0:
            m = mel[bar % 4][k]
            if m: add(bell(midi(m)), t + k * beat / 2, .07)
    # soft bass on beats 1 and 3
    for b in (0, 2):
        f = midi(ch[0] - 24); d = beat * 1.8; tt = np.arange(int(SR * d)) / SR
        add(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.2) * np.minimum(1, tt * 80), t + b * beat, .22)
    # shaker on off-beats
    for b in range(4):
        tt = np.arange(int(SR * .06)) / SR
        add(rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 70), t + b * beat + beat / 2, .03)
    t += 4 * beat; bar += 1

# scene transition boops (rising blip)
for s in tl['starts'][1:]:
    d = .18; tt = np.arange(int(SR * d)) / SR
    f = 520 + 900 * tt / d
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 14), s + .02, .18)

# master fade in/out + normalize
env = np.ones(N); fi = int(SR * 1.0); fo = int(SR * 2.5); end = int(SR * TOTAL)
env[:fi] = np.linspace(0, 1, fi); env[end - fo:end] = np.linspace(1, 0, fo); env[end:] = 0
out *= env
out = np.tanh(out * 1.2) / np.tanh(1.2)
out *= .7 / np.max(np.abs(out))
with wave.open('build/music.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
