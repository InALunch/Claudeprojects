"""Build the accelerating 2026 cut of the song.

Original time t -> final time T. Overall playback speed s(t) = dt/dT is split into
  a(t): pitch-preserving time-stretch (rubberband, offline R3 engine, via a time map)
  b(t): tape-style resample (changes pitch too), so the song creeps sharp as it speeds up
with s = a * b. The exact mapping is written to audio/warp.json for the video.
"""
import json, subprocess, numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt

SR = 48000
ROOT = __file__.rsplit('/tools/', 1)[0]
A = f'{ROOT}/audio'

T_ACC_END = 137.2   # last chorus ends; "Was it all for show?" starts
T_SHOW_END = 140.5  # outro starts
T_CUT = 154.0       # hard cut (the singularity)
PRE = 2.6           # silent cold open before the music
TAIL = 8.6          # silence after the cut
S0, S1 = 1.06, 1.40


def speed(t):
    """(s, b) at original time t."""
    if t < T_ACC_END:
        k = np.log(S1 / S0) / T_ACC_END
        s = S0 * np.exp(k * t)
        b = 2 ** (0.6 * (t / T_ACC_END) ** 2 / 12)      # creeps up to +0.6 semitones
    elif t < T_SHOW_END:
        s = 0.94                                        # the floor drops out
        b = 2 ** (-0.35 / 12)                           # and sags flat
    else:
        x = min(1.0, (t - T_SHOW_END) / (T_CUT - T_SHOW_END))
        s = 1.0 + 5.0 * x ** 3                          # runaway
        b = s ** 0.75
    return s, b


def main():
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{A}/source.mp3', '-ar', str(SR), '-t', str(T_CUT), f'{A}/src.wav'], check=True)
    y, _ = sf.read(f'{A}/src.wav')
    n = len(y)
    dt = 0.005
    ts = np.arange(0, T_CUT + dt, dt)
    sb = np.array([speed(t) for t in ts])
    s, b = sb[:, 0], sb[:, 1]
    a = s / b
    # u(t): time after stage 1 (stretch); T(t): final time
    u = np.concatenate([[0], np.cumsum(dt / a[:-1])])
    T = np.concatenate([[0], np.cumsum(dt / s[:-1])])

    # stage 1: rubberband with keyframes every 0.25 s of source
    kt = np.arange(0, T_CUT, 0.25)
    ku = np.interp(kt, ts, u)
    with open(f'{A}/timemap.txt', 'w') as f:
        for x, v in zip(kt, ku):
            f.write(f'{int(round(x * SR))} {int(round(v * SR))}\n')
    dur_u = float(np.interp(n / SR, ts, u))
    subprocess.run(['rubberband', '-q', '-3', '--formant', '-M', f'{A}/timemap.txt', '-D', f'{dur_u:.6f}',
                    f'{A}/src.wav', f'{A}/stage1.wav'], check=True)
    y1, _ = sf.read(f'{A}/stage1.wav')

    # stage 2: tape resample. Final sample n_T needs stage-1 position u(T).
    up = 4
    y1u = resample_poly(y1, up, 1, axis=0)
    Tend = float(T[-1])
    Tn = np.arange(int(Tend * SR)) / SR
    un = np.interp(Tn, T, u) * SR * up
    i0 = np.clip(un.astype(np.int64), 0, len(y1u) - 2)
    fr = (un - i0)[:, None]
    out = y1u[i0] * (1 - fr) + y1u[i0 + 1] * fr

    # the last ~0.6 s gets brighter and harsher as it runs away, then a hard cut
    fade = int(0.004 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)[:, None]
    out = add_design(out, ts, T)
    # silence before the music (the title gets revised with key clicks) and after the cut (the end card)
    out = np.concatenate([np.zeros((int(PRE * SR), 2)), out, np.zeros((int(TAIL * SR), 2))])
    out = add_clicks(out, [(0.9, 0.05, 0.22), (1.35, 0.06, 0.03), (1.47, 0.055, 0.03), (1.59, 0.06, 0.03), (1.71, 0.055, 0.03),
                           (PRE + Tend + 4.8, 0.06, 0.03), (PRE + Tend + 6.8, 0.045, 0.03)])
    peak = np.max(np.abs(out))
    if peak > 0.98:
        out *= 0.98 / peak
    sf.write(f'{A}/errata.wav', out, SR)
    # master: +2 dB into a limiter (about -14 LUFS, -1 dBTP)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{A}/errata.wav', '-af', 'volume=2dB,alimiter=limit=0.89:attack=3:release=60:level=disabled',
                    '-ar', str(SR), '-c:a', 'pcm_s16le', f'{A}/master.wav'], check=True)
    subprocess.run(['mv', f'{A}/master.wav', f'{A}/errata.wav'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{A}/errata.wav', '-c:a', 'aac', '-b:a', '256k', f'{A}/errata.m4a'], check=True)

    json.dump({'t': [-PRE] + [round(x, 4) for x in ts[::4]], 'T': [0.0] + [round(x + PRE, 5) for x in T[::4]],
               'cut': Tend + PRE, 'end': Tend + PRE + TAIL, 'pre': PRE, 'sr': SR}, open(f'{A}/warp.json', 'w'))
    print(f'final length {PRE + Tend + TAIL:.2f}s (music {Tend:.2f}s); stage1 {dur_u:.2f}s')


def to_T(t, ts, T):
    return float(np.interp(t, ts, T))


def env(n, a, r):
    e = np.ones(n)
    ai, ri = int(a * SR), int(r * SR)
    e[:ai] = np.linspace(0, 1, ai) ** 2
    e[-ri:] *= np.linspace(1, 0, ri) ** 2
    return e


def shepard(dur, rate_oct_per_s, base=40.0, gain=0.03):
    """Endlessly rising Shepard glissando."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    octs = 7
    for k in range(octs):
        pos = (k + rate_oct_per_s * tt) % octs
        f = base * 2 ** pos
        amp = np.exp(-0.5 * ((pos - octs / 2) / (octs / 5)) ** 2)
        ph = 2 * np.pi * np.cumsum(f) / SR
        out += amp * np.sin(ph)
    return gain * out / octs


def add_design(out, ts, T):
    L = len(out)
    # 1. Shepard riser under "But now the singularity's begun" -> through the verse, and under the runaway outro
    for (t0, t1, rate, g) in [(41.5, 58.6, 0.18, 0.05), (T_SHOW_END, T_CUT, 0.9, 0.07)]:
        a0, a1 = to_T(t0, ts, T), to_T(t1, ts, T)
        x = shepard(a1 - a0, rate, gain=g) * env(int((a1 - a0) * SR), 1.5 if t0 < 100 else 0.3, 0.02 if t0 > 100 else 0.8)
        i = int(a0 * SR)
        m = min(len(x), L - i)
        out[i:i + m] += x[:m, None]
    # 2. heartbeat thumps while "Was it all for show?" sags
    a0 = to_T(T_ACC_END, ts, T)
    for k, dtb in enumerate([0.35, 0.62, 1.55, 1.82, 2.75, 3.02]):
        i = int((a0 + dtb) * SR)
        n = int(0.22 * SR)
        tt = np.arange(n) / SR
        th = np.sin(2 * np.pi * (52 - 18 * tt / 0.22) * tt) * np.exp(-tt * 18) * (0.22 if k % 2 == 0 else 0.14)
        m = min(n, L - i)
        out[i:i + m] += th[:m, None]
    return out


def add_clicks(out, clicks):
    """Key clicks (and one longer pen scratch) at absolute times: (time, gain, length)."""
    sos = butter(2, [2500, 9000], btype='band', fs=SR, output='sos')
    rng = np.random.default_rng(7)
    for tc, g, ln in clicks:
        n = int(ln * SR)
        tt = np.arange(n) / SR
        e = np.exp(-tt * 260) if ln < .1 else np.sin(np.pi * tt / ln) ** .5 * (0.6 + 0.4 * np.sin(tt * 90))
        c = sosfilt(sos, rng.standard_normal(n)) * e * g
        i = int(tc * SR)
        out[i:i + n] += c[:, None]
    return out


if __name__ == '__main__':
    main()
