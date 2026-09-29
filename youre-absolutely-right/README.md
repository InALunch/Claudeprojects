# You're Absolutely Right: video

A video adaptation of Linch Zhang's short story
[“You're Absolutely Right”](https://linch.substack.com/p/youre-absolutely-right) (The Linchpin).
It runs about 15 minutes and uses the full text of the story.

The story is a chat log where every model message has been redacted, so the video shows it that way.
The researcher's messages come into a mocked-up internal “Xchat” window. Each model reply is a block of
black redaction bars whose length follows the length of the implied reply. Before the bars, a
“thinking” (or, for Megalodon, “working”) phase runs a clock of story time. That time is estimated from the
timestamp gaps, so a quick refusal passes in a second and the 1h 35m before the last line takes several. The Magma disclosure note opens
the video and the Auditor's note closes it. The soundtrack is synthesized: an ambient bed that turns from
warm to tense to dissonant under the steering vectors, then to a low pulse for Megalodon. It cuts to silence
on the last line.

- `youre-absolutely-right.mp4`: the finished video (1080p30 with sound)
- `story.js`: the story text and the scene script. Each redacted reply's length (`model`) and working time in
  seconds (`work`) are editorial guesses from the timestamps.
- `video.html`: renders any moment of the video. Open it in a browser to watch it live, without audio,
  or add `#300` to the URL to start at 300 seconds.
- `render.mjs`: renders the frames with Playwright and pipes them to ffmpeg
- `sound.py`: synthesizes the soundtrack from the timeline

To rebuild:

```sh
npm install && pip install numpy imageio-ffmpeg && mkdir -p build
export FFMPEG=$(python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())")
node render.mjs stills 1 && python3 sound.py          # writes the timeline, then the audio
node render.mjs video build/silent.mp4
$FFMPEG -y -i build/silent.mp4 -i build/sound.wav -af volume=4.5dB -c:v copy -c:a aac -b:a 160k -shortest youre-absolutely-right.mp4
```
