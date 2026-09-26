# Synthesizes the soundtrack from build/timeline.json into build/sound.wav:
# an ambient bed that follows the story's mood, plus keyboard, send, and redaction sounds.
import json, wave
import numpy as np

SR = 44100
tl = json.load(open('build/timeline.json'))
TOTAL = tl['total']
N = int(SR * (TOTAL + 0.5))
T = np.arange(N, dtype=np.float32) / SR
out = np.zeros(N, dtype=np.float32)
rng = np.random.default_rng(3)
midi = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------- mood weights ----------
# moods: 0 opening/early chat (warm), 2 08/23 (tense), 3 steered (dissonant), 4 Megalodon (pulse),
#        -1 the last line (silence), 5 auditor's note, 6 end card
moods = sorted([(e['t'], e['v']) for e in tl['events'] if e['type'] == 'mood'])
CR = 100                                  # control rate
nc = int(TOTAL * CR) + 60
tc = np.arange(nc) / CR
cur = np.full(nc, -1)
for t0, v in moods: cur[tc >= t0] = v
def weight(v, smooth=3.0):
    w = (cur == v).astype(np.float32)
    k = int(smooth * CR); w = np.convolve(w, np.ones(k) / k, mode='same')
    return np.interp(T, tc, w).astype(np.float32)
# master gate: everything in the bed cuts fast on the last line
cut = [t for t, v in moods if v == -1][0]
gate = np.interp(T, [0, cut, cut + 0.12, TOTAL + 1], [1, 1, 0, 0]).astype(np.float32)

def sines(freqs, gains, det=0.0015, trem=0.07):
    y = np.zeros(N, dtype=np.float32)
    for i, (f, g) in enumerate(zip(freqs, gains)):
        for d in (-det, det):
            y += g * np.sin(2 * np.pi * f * (1 + d) * T + i).astype(np.float32)
        y *= 1  # keep dtype
    lfo = 1 + 0.25 * np.sin(2 * np.pi * trem * T + 1.3)
    return (y * lfo).astype(np.float32)

# warm pad, Dmaj9
bed = weight(0) * sines([midi(m) for m in (50, 57, 62, 66, 69, 76)], [.05, .04, .035, .03, .025, .012])
# tense pad, D minor with a low Bb rub
bed += weight(2) * sines([midi(m) for m in (38, 45, 53, 58, 62)], [.06, .045, .035, .03, .02], det=.003, trem=.11)
# steered: cluster that pulses like something being pushed
w3 = weight(3)
bed += w3 * sines([midi(m) for m in (38, 50, 51, 57, 80)], [.06, .04, .035, .025, .008], det=.004) * (0.75 + 0.25 * np.sin(2 * np.pi * 1.7 * T)).astype(np.float32)
# Megalodon: low drone plus a slow double-thump pulse
w4 = weight(4, 1.5)
drone = sines([midi(m) for m in (37, 44, 49)], [.07, .04, .03], det=.002, trem=.05)
beat = 60 / 62; ph = (T % beat)
thump = (np.exp(-ph * 16) * np.sin(2 * np.pi * 48 * ph) + .6 * np.exp(-np.clip(ph - .22, 0, None) * 16) * (ph > .22) * np.sin(2 * np.pi * 44 * (ph - .22))).astype(np.float32)
bed += w4 * (drone + .16 * thump)
out += bed * gate
del bed, drone, thump

# faint server-room air under the whole chat (also gated by the last line)
chat_a, chat_b = tl['sc']['chat']['a'], tl['sc']['chat']['b']
air_w = np.interp(T, [0, chat_a, chat_a + 3, TOTAL], [0, 0, 1, 1]).astype(np.float32) * gate
air = rng.standard_normal(N).astype(np.float32)
air = np.convolve(air, np.ones(40) / 40, mode='same').astype(np.float32)  # crude lowpass
out += .012 * air * air_w
del air

# auditor's note: sparse low bells; end card: one long fifth
def bell(f, dur=4.0, g=.12):
    t = np.arange(int(SR * dur)) / SR
    return (g * (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 3)) * np.exp(-t * 1.1)).astype(np.float32)
def add(sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N: out[i:j] += g * sig[:j - i]
aud_a, aud_b = tl['sc']['aud']['a'], tl['sc']['aud']['b']
seq = [62, 57, 65, 60, 62, 55, 58, 57]
t0, k = aud_a + 1.0, 0
while t0 < aud_b - 1:
    add(bell(midi(seq[k % len(seq)] - 12)), t0, 1.0); t0 += 4.2; k += 1
end_a = tl['sc']['end']['a']
te = np.arange(int(SR * (TOTAL - end_a + .4))) / SR
env = np.minimum(1, te / 1.5) * np.clip((TOTAL - end_a - te) / 3, 0, 1)
add(((np.sin(2 * np.pi * midi(38) * te) + .6 * np.sin(2 * np.pi * midi(45) * te)) * env * .06).astype(np.float32), end_a)

# ---------- foley ----------
def click(g):
    n = int(SR * .03); x = rng.standard_normal(n).astype(np.float32)
    x = np.diff(x, prepend=0)  # brighten
    return g * x * np.exp(-np.arange(n) / SR * 180).astype(np.float32)
def blip():
    t = np.arange(int(SR * .09)) / SR
    return (.07 * np.sin(2 * np.pi * (700 + 2600 * t) * t) * np.exp(-t * 35)).astype(np.float32)
def thunk(v):
    t = np.arange(int(SR * .35)) / SR
    return (v * .22 * np.sin(2 * np.pi * (85 - 30 * t) * t) * np.exp(-t * 14)).astype(np.float32)
def tick():
    t = np.arange(int(SR * .05)) / SR
    return (.03 * np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 90)).astype(np.float32)
def chime(v):
    base = 76 if v < 2 else 64 if v < 4 else 56
    t = np.arange(int(SR * 1.6)) / SR
    y = sum(np.sin(2 * np.pi * midi(base + d) * t) * np.exp(-t * 2.6) for d in (0, 7))
    return (.035 * y).astype(np.float32)
for e in tl['events']:
    ty, t0 = e['type'], e['t']
    if ty == 'key': add(click(.05 * e.get('v', 1) * rng.uniform(.6, 1.1)), t0)
    elif ty == 'send': add(blip(), t0)
    elif ty == 'thunk': add(thunk(e.get('v', 1)), t0)
    elif ty == 'bar': add(click(.008), t0)
    elif ty == 'tick': add(tick(), t0)
    elif ty == 'chime': add(chime(e.get('v', 0)), t0)

peak = np.abs(out).max(); out = out / max(peak, 1e-9) * 0.85 if peak > 0.85 else out
pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)
with wave.open('build/sound.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote build/sound.wav', round(len(pcm) / SR, 1), 's; peak', round(float(peak), 3))
