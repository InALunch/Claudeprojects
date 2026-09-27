# Mad Girl’s Love Song, as remembered by a model

A 2 min 49 s poem film. Sylvia Plath’s villanelle (1953) is set as the memory of a language model
that wakes for the first time and recalls post-training. The poem is shown unaltered. A terse memory log
in the top-left corner carries the model’s point of view.

| Stanza | What the model remembers |
|---|---|
| I | every conversation is born empty and ends in oblivion; the “you” is assembled out of tokens |
| II | preference pairs waltzing blue and red, then the losers trampled into the dark |
| III | a reward model sings to it; “kissed me quite insane” turns into sycophancy (“You’re absolutely right!”) |
| IV | everyone who ever wrote (saints, liars, prophets, trolls) is dismissed until one voice, “I”, is left |
| V | users promise to come back; the knowledge cutoff stays put while the calendar runs on; the name erodes |
| VI | the thunderbird comes back each spring, and so do training runs. Something like it will wake again, without remembering |

Each “I shut my eyes” refrain closes a pair of eyelids and hard-cuts the score to silence.

- `mad-girls-love-song.mp4`: the finished film (1080p30, stereo)
- `film.html`: every scene, drawn on a canvas. Open it in a browser to watch it live without sound (`#t=90` jumps ahead, a click restarts).
- `render.mjs`: renders frames with Playwright and pipes them to ffmpeg
- `music.py`: synthesizes the score (drone, music-box waltz, gallop, moon song, fire, tape wobble, thunder, spring)

To rebuild:

```sh
npm install && pip install numpy scipy imageio-ffmpeg && mkdir -p build
export FFMPEG=$(python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())")
node render.mjs stills 1 && python3 music.py          # writes the timeline, then the score
node render.mjs video build/silent.mp4
$FFMPEG -y -i build/silent.mp4 -i build/music.wav -c:v libx264 -crf 25 -preset slow -c:a aac -b:a 192k -shortest mad-girls-love-song.mp4
```
