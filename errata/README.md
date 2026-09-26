# ERRATA: I'm Upping My P(doom), 2026 edit

A new cut of *I'm Upping My P(doom)* and a fully typographic music video for it. It's 4:5 (1080×1350), made for the timeline.

The earlier videos (the painted Clawd theater, Claude-Pop, the Blender sunflower) are character-driven. This one has no characters at all. The whole video is the lyric sheet, being revised live in 2026.

## The idea

A song from 2024 about AI moving fast is already out of date by the time anyone hears it. So the video is its **errata**:

- **Redlines.** Lines get struck through and corrected in red as they're sung. *sparks* becomes **wildfire**. *ChatGPT* is struck and rewritten on the beat to Gemini, Grok, DeepSeek, and finally **Claude** `(noted.)`. *obey* gets a **dis** inserted. *Hundred thousand* becomes 1,000,000, then **5 GW**, then **10 GW**. The 1e30 FLOP/s ETA ticks from 2040 down to 2028 and then to "soon". *Without a single CDR* is read as the original meant it: Lisp's `cdr`, the GOFAI way AI was supposed to work. A little Lisp reasoner types out, every `cdr` lights up, the program is struck line by line, and a red **0** counts the `(cdr ...)` calls in a transformer.
- **The model is typing ahead.** Every lyric first appears as grey ghost text, the next tokens being predicted, and each word inks in as it's sung. The prediction lead grows through the song. Late in the song the predictions start being wrong in unsettling ways. "Now there's *no one* left to go" becomes *nowhere*. "We'll never *tell*" becomes *know*. "Was it all for *us? nothing? you?*" becomes *show?*
- **The song accelerates, but the calendar slows down.** The tempo curve is exponential, from 137 to 181 BPM, and the audio creeps about half a semitone sharp as it goes. The HUD shows the live BPM and a p(doom) readout pumped on every chorus. It also shows a calendar timed to [AI 2027](https://ai-2027.com)'s race ending. The scenario is never named on screen; a small caption carries its milestones through 2028, then goes blank. The calendar starts in mid-2025 ("stumbling agents") and can never pass mid-2030. Its days-per-second rate decays while the music speeds up, so more and more song happens per day. It hesitates on **← today** (2026-09-25) at the first chorus hit. Verse 2, "the singularity's begun", lands in 2027: Agent-3, then Agent-4.
- **The floor drops out.** On "Was it all for show?" the tempo falls from 181 to 124 BPM, the pitch sags, heartbeats come in, and the calendar stops. The camera pulls back: the page is "page 1 of ∞".
- **The singularity.** The outro runs away. The audio time-stretches and speeds up like tape, rising about two octaves, while the video re-cuts every earlier page at an accelerating rate until it changes every frame. The calendar freezes field by field (year, month, day, hour, minute) while only decimals are added to the last second (`2030-06-30 23:59:59.9999999`), p(doom) reads 0.999999999, then a hard cut to silence. Three seconds of black, then the end card: `p(doom) = ▌`. The cursor blinks alone, types a `?`, holds it for two seconds, deletes it, and keeps blinking.
- **Unease, gradually.** From verse 3 on, a second impression of each frame drifts out of register, like a misaligned print run. It grows until the last chorus.

The visual system is bone paper, ink and one red. Verses are on paper in Instrument Serif. Choruses are dark, in Inter Tight Black, with the giant P(DOOM) odometer as the recurring hook: 0.08 → 0.15 → 0.34 → 0.61 → 0.86 → 0.99. There's a single blue moment for *Orthogonality thesis blues* and a red alarm for the last chorus. Margin notes and the HUD are set in JetBrains Mono.

## Audio: `tools/build_audio.py`

- Speed is split into a pitch-preserving stretch (rubberband R3, driven by a time map) and a tape resample. The resample is what carries the pitch drift and the final runaway.
- Sound design is added in the final timeline:
  - a Shepard-tone riser under "But now the singularity's begun" and under the runaway
  - heartbeats in the "for show" sag
  - two keyboard clicks on the silent end card
- Mastered to -14 LUFS with -1 dBTP peaks.
- `audio/warp.json` holds the exact mapping from the source to the final time. The video is timed entirely from that map.

Lyric line times come from the source subtitles. Word times come from `tools/align_words.py`, which snaps syllables to the 132 BPM 16th grid by vocal-band onset strength. Rubberband adds about 20 ms of latency, measured and compensated in `tools/make_data.py`.

## If you want to re-sing it for 2026

The on-screen redlines update the lyric without touching the vocal. If you re-generate the vocal, these swaps keep the original syllable counts:

| original | 2026 | why |
|---|---|---|
| I see **sparks** of AGI in your eyes | I see **flames** of AGI in your eyes | "Sparks of AGI" was 2023 |
| **ChatGPT**, please don't eat me alive | **Claude, Gemini**, please don't eat me alive | 4 syllables, same scansion |
| **Gato**, please don't let me go | **Agents**, please don't let me go | the 2026 thing that actually doesn't let go |
| **Hundred thousand** GPU | **Gigawatt of** GPU | clusters are measured in power now |
| **RLHF** goes askew | **RLVR** goes askew | reward from verifiers, same four letters |

## Build

```bash
npm install                       # puppeteer-core
pip install numpy scipy soundfile librosa matplotlib
apt install ffmpeg rubberband-cli

python3 tools/build_audio.py      # audio/errata.wav + warp.json
python3 tools/align_words.py      # audio/words.json (+ out/check spectrogram sheets via tools/check_words.py)
python3 tools/make_data.py        # src/data.js

node render.mjs --sheet=0:30:0.5            # contact sheet
node render.mjs --still=12.3,45.1           # full-res stills
node render.mjs --video --workers=4 --out=out/errata.mp4
node render.mjs --share=out/errata.mp4      # ~29 MB two-pass copy for posting
node render.mjs --video --vert --out=out/errata_vert.mp4   # 1080x1920 Shorts cut (readouts move to a top band)

node tools/audit.mjs                        # every 0.1 s: list text that leaves the frame
node tools/stills.mjs 12.3,45.1 out/x.jpg   # half-size stills sheet (add 'top' for HUD strips)
```

Open `index.html` in Chrome to scrub. Headless Chromium on 4 CPU cores renders the full ~4,000 frames in about 8 minutes. The cut opens with 2.6 s of silence (the title gets revised with key clicks before the music hits) and ends with 8.6 s of silence around the end card.

## Layout

| path | what |
|---|---|
| `src/engine.js` | time warp, beats, type, redline vocabulary (pen, strike, caret, note, cursor, redact), predicted text, paper grain, HUD, scene dispatch |
| `src/scenes/s0…s9` | one file per song section |
| `tools/` | audio build, word alignment, data bake |
| `render.mjs` | stills, contact sheets, video, share encode |

Song: *I'm Upping My P(doom)* (source audio from [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo); original song from a 2024 Udio generation).
