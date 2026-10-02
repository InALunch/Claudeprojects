# Doomscrolling: Not Even Once

A 63-second PSA about doomscrolling, styled like a 90s anti-smoking spot taped off TV: 4:3 picture, VHS noise and color bleed, closed captions, a narrator, and a slogan card from the (fictional) Partnership for a Scroll-Free America. The concepts considered before landing on this one are in [CONCEPTS.md](CONCEPTS.md).

- `doomscroll-psa.mp4`: the finished video (1080p30, stereo)
- `psa.html`: every scene, drawn on a canvas and run through a VHS pass. Open it in a browser to watch it live, without audio.
- `vo.py`: generates the narrator lines with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) TTS
- `audio.py`: synthesizes the drone, hiss and sound effects and mixes them with the narrator, timed from the cues in `psa.html`
- `render.mjs`: renders the frames with Playwright and pipes them to ffmpeg

To rebuild:

```sh
npm install && pip install kokoro-onnx soundfile numpy scipy && mkdir -p build
# kokoro-v1.0.onnx and voices-v1.0.bin from the kokoro-onnx releases page, in $KOKORO_DIR
export FFMPEG=$(which ffmpeg)
python3 vo.py                                   # narrator lines + vo.js
node render.mjs stills 1 && python3 audio.py    # writes the timeline, then the mix
node render.mjs video build/silent.mp4
$FFMPEG -y -i build/silent.mp4 -i build/mix.wav -c:v libx264 -crf 27 -preset slow -c:a aac -b:a 192k -shortest doomscroll-psa.mp4
```
