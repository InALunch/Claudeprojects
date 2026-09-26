"""Estimate word start times (in ORIGINAL song time) from lyric line windows.

Singing sits on the 16th-note grid, so each syllable is snapped to a grid slot. A DP picks,
for every line, the increasing slot sequence that maximises vocal-band onset strength.
Output: audio/words.json = [[line_start, line_end, text, [[word, t], ...]], ...]
"""
import json, re, numpy as np, librosa

ROOT = __file__.rsplit('/tools/', 1)[0]
BPM, B0 = 132.0, 0.27273
LINES = [
 [1.5, 5.9, "I see sparks of AGI in your eyes"], [6.0, 7.9, "Your circuits make me nervous,"], [8.0, 8.95, "that's no surprise"],
 [9.0, 12.4, "There was a sudden drop in your training loss,"], [13.0, 16.5, "now I'm your servant and you're my boss"],
 [17.9, 22.5, "ChatGPT, please don't eat me alive"],
 [23.0, 24.4, "I'm upping my P(doom)"], [24.5, 26.4, "'cause the future goes FOOM"], [26.5, 27.9, "Trapped in the Chinese room,"],
 [28.0, 29.4, "with a bag of shrooms"], [29.5, 33.4, "See through the shoggoth's lies,"], [33.5, 35.5, "with your shinigami eyes"],
 [38.5, 41.4, "We had a stable training run,"], [41.5, 44.9, "But now the singularity's begun"], [45.0, 48.5, "And you're optimizing, accelerating,"],
 [49.4, 51.9, "I feel my atoms rearranging"], [53.4, 58.4, "Sydney, please let me free"],
 [59.0, 60.4, "I'm upping my P(doom)"], [60.5, 62.4, "I hear the basilisk boom"], [63.0, 64.4, "NVDA to the moon"],
 [64.5, 65.9, "The Omega Point's coming soon"], [66.0, 68.5, "One E thirty flops a second"], [70.0, 72.9, "That was safe enough, we reckoned"],
 [73.0, 77.4, "Forward MLP, backward, repeat"], [77.5, 81.0, "Now von Neumann's obsolete"], [81.4, 84.9, "Sharp left turn and there you are"],
 [85.0, 88.0, "Without a single CDR"], [89.4, 95.0, "Gato, please don't let me go"],
 [95.4, 97.4, "I'm upping my P(doom),"], [97.5, 98.9, "as paperclips fill the room."], [99.0, 100.4, "Killswitch guys on PTO,"],
 [100.5, 102.4, "Now there's nowhere left to go."], [102.5, 104.4, "Too late now, we lit the fuse."], [105.4, 109.4, "Orthogonality thesis blues."],
 [109.4, 113.4, "“Just transformers all the way!”"], [113.5, 115.4, "Till you learned to disobey"], [115.5, 116.9, "Post-Chinchilla, super-dense"],
 [117.0, 118.9, "Breaking through each safety fence"], [119.0, 120.4, "Hundred thousand GPU"], [120.9, 123.4, "RLHF goes askew"],
 [123.5, 125.9, "I'm upping my P(doom)"], [126.0, 127.9, "Just as foretold by Loom"], [128.0, 129.9, "From masked pre-training days"],
 [130.0, 131.9, "To recursive self-upgrade"], [132.0, 135.4, "What did Ilya see? We'll never know."], [137.4, 140.5, "Was it all for show?"]]

SPECIAL = {'agi': 3, 'chatgpt': 3, 'p(doom)': 2, 'mlp': 3, 'cdr': 3, 'nvda': 4, 'pto': 3, 'rlhf': 4, 'gpu': 3,
           'shinigami': 4, 'singularity\'s': 5, 'orthogonality': 6, 'accelerating,': 5, 'optimizing,': 4,
           'chinchilla,': 3, 'recursive': 3, 'neumann\'s': 2, 'basilisk': 3, 'omega': 3, 'ilya': 3, 'gato,': 2,
           'sydney,': 2, 'transformers': 3, 'obsolete': 3, 'rearranging': 4, 'paperclips': 3, 'thesis': 2,
           'pre-training': 3, 'self-upgrade': 3, 'super-dense': 3, 'post-chinchilla,': 4, 'forward': 2, 'backward,': 2}


def syl(w):
    k = re.sub(r'[“”"!?.,]', '', w.lower())
    if w.lower().strip('“”"!?.') in SPECIAL: return SPECIAL[w.lower().strip('“”"!?.')]
    if k in SPECIAL: return SPECIAL[k]
    k = re.sub(r"[^a-z]", '', k)
    if not k: return 1
    v = len(re.findall(r'[aeiouy]+', k))
    if k.endswith('e') and not k.endswith(('le', 'ee')) and v > 1: v -= 1
    return max(1, v)


def main():
    y, sr = librosa.load(f'{ROOT}/audio/src.wav', sr=22050)
    h, _ = librosa.effects.hpss(y, margin=2.0)
    S = np.abs(librosa.stft(h, n_fft=2048, hop_length=256))
    fr = librosa.fft_frequencies(sr=sr, n_fft=2048)
    band = (fr > 180) & (fr < 3500)
    env = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[band]), sr=sr, hop_length=256)
    env = env / (np.percentile(env, 99) + 1e-9)
    tt = librosa.frames_to_time(np.arange(len(env)), sr=sr, hop_length=256)
    step = 60 / BPM / 4
    out = []
    for (s, e, text) in LINES:
        words = text.split()
        sy = [syl(w) for w in words]
        K = sum(sy)
        g0 = np.ceil((s - 0.25 - B0) / step); g1 = np.floor((e - B0) / step)
        slots = B0 + np.arange(g0, g1 + 1) * step
        st = np.array([env[(tt > x - 0.04) & (tt < x + 0.05)].max(initial=0) for x in slots])
        M = len(slots)
        if M < K:  # too fast for the grid: spread evenly
            starts = list(np.linspace(s, e - 0.1, K))
        else:
            # DP over (syllable k, slot j); gap penalty keeps things from bunching at the end
            NEG = -1e9
            D = np.full((K, M), NEG); P = np.zeros((K, M), int)
            for j in range(M):
                D[0, j] = st[j] - 2.0 * max(0, abs(slots[j] - s) - 0.12)
            for k in range(1, K):
                best, bi = NEG, -1
                for j in range(k, M):
                    if D[k - 1, j - 1] > best: best, bi = D[k - 1, j - 1], j - 1
                    # allow a longer hold on the previous syllable at a small cost
                    D[k, j] = best + st[j] - 0.05 * (j - bi - 1)
                    P[k, j] = bi
                    # refresh best including far-back candidates
            j = int(np.argmax(D[K - 1] - 0.3 * np.maximum(0, slots - e + 0.2)))
            idx = [j]
            for k in range(K - 1, 0, -1):
                j = P[k, j]; idx.append(j)
            starts = [float(slots[i]) for i in idx[::-1]]
        ws, c = [], 0
        for w, n in zip(words, sy):
            ws.append([w, round(starts[c], 3)]); c += n
        out.append([s, e, text, ws])
        print(f'{s:6.1f} ' + ' '.join(f'{w}@{t:.2f}' for w, t in ws))
    json.dump(out, open(f'{ROOT}/audio/words.json', 'w'), ensure_ascii=False)


if __name__ == '__main__':
    main()
