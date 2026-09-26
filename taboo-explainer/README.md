# Taboo explainer video

A short, captioned, animated explainer (about 3 minutes) of Linch Zhang's LessWrong post
[“Categorical taboos are much better than threshold taboos: neuralese edition”](https://www.lesswrong.com/posts/xPkmfsZ3qx4nrAco7/categorical-taboos-are-much-better-than-threshold-taboos).
Background on layers and loops follows Scott Alexander’s [“The Specter of Neuralese”](https://www.astralcodexten.com/p/the-specter-of-neuralese).

- `taboos-explainer.mp4`: the finished video (1080p30 with music)
- `explainer.html`: every scene, drawn on a canvas. Open it in a browser to watch it live, without audio.
- `render.mjs`: renders the frames with Playwright and pipes them to ffmpeg
- `music.py`: synthesizes the plucky background loop and the scene-change sounds

To rebuild:

```sh
npm install && pip install numpy imageio-ffmpeg && mkdir -p build
export FFMPEG=$(python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())")
node render.mjs stills 1 && python3 music.py          # writes the timeline, then the music
node render.mjs video build/silent.mp4
$FFMPEG -y -i build/silent.mp4 -i build/music.wav -c:v copy -c:a aac -shortest taboos-explainer.mp4
```
