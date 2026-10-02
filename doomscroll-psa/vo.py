# Generates the narrator lines with Kokoro TTS -> build/vo/<id>.wav, and vo.js (line durations for the timeline)
# Needs kokoro-v1.0.onnx + voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx/releases (dir in $KOKORO_DIR)
import os, json, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

D = os.environ.get('KOKORO_DIR', '.')
k = Kokoro(os.path.join(D, 'kokoro-v1.0.onnx'), os.path.join(D, 'voices-v1.0.bin'))
# a little of the deep voice mixed into the cleaner one
VOICE = .6 * k.get_voice_style('am_michael') + .4 * k.get_voice_style('am_onyx')

LINES = {
    'start':   "It always starts the same way.",
    'look':    "Just one quick look before bed.",
    'more':    "Just one more.",
    'stop':    "You tell yourself you can stop any time you want.",
    'bottom':  "But the feed doesn't have a bottom.",
    'built':   "Somebody built it that way.",
    'morning': "Good morning.",
    'noscroll': "There's no such thing as one scroll.",
    'doom':    "Doomscrolling.",
    'once':    "Not even once.",
    'partner': "A message from the Partnership for a Scroll-Free America.",
    'like':    "Like.",
    'sub':     "Subscribe.",
    'close':   "And close the app.",
}
SPEED = {'more': .8, 'morning': .8, 'doom': .82, 'once': .78}

os.makedirs('build/vo', exist_ok=True)
dur = {}
only = sys.argv[1:]
for key, line in LINES.items():
    path = f'build/vo/{key}.wav'
    if not only or key in only:
        s, sr = k.create(line, voice=VOICE, speed=SPEED.get(key, .88), lang='en-us')
        sf.write(path, s, sr)
    s, sr = sf.read(path)
    dur[key] = round(len(s) / sr, 3)
    print(f'{key:9s} {dur[key]:5.2f}s  {line}')
open('vo.js', 'w').write('window.VO = ' + json.dumps(dur) + ';\n')
