// s0: cold open. Silence: the title sits on the page, the cursor blinks, then the year gets revised
// by hand (key clicks in the audio), and only then does the music hit. Frame 0 is the thumbnail.
function titleCard(T, o) {
  const INK = o.inv ? PAL.paper : PAL.ink;
  bg(o.inv ? PAL.ink : PAL.paper);
  if (VERT) return titleCardVert(T, o, INK);
  X.save();
  cam(o.zoom, 0, W / 2, H / 2);
  const y0 = 400;
  text("I'm upping", M, y0, { fam: 'serif', italic: true, size: 170, color: INK });
  text('my', M, y0 + 150, { fam: 'serif', italic: true, size: 170, color: INK });
  const s = fit('P(DOOM)', W - 2 * M, { fam: 'sans', weight: 900 });
  text('P(DOOM)', M, y0 + 175 + s * .8, { fam: 'sans', weight: 900, size: s, track: -0.02, color: INK }, (g, i) => ({ dy: jit(T, i + 1, o.boil, 1 / 8), dx: jit(T, i + 9, o.boil * .6, 1 / 8) }));
  const yy = y0 + 175 + s * .8 + 150;
  const w24 = text('(2024)', M, yy, { fam: 'serif', size: 96, color: INK });
  if (o.cursor) cursor(M + w24 + 6, yy, 96, T, INK);
  strike(M, M + w24, yy, 96, o.strike, { seed: 3 });
  if (o.typed > 0) {
    caret(M + w24 + 26, yy, 96, 1);
    text('2026'.slice(0, o.typed), M + w24 + 50, yy - 4, { fam: 'sans', weight: 800, size: 96, color: PAL.red });
  }
  note(M + w24 + 120, yy + 16, M + 4, yy + 110, 'it moved faster than we thought', o.note, { size: 30 });
  X.restore();
}

// the Shorts cover layout, in device pixels (1080x1920), kept clear of the Shorts UI
function titleCardVert(T, o, INK) {
  X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
  cam(o.zoom, 0, DW / 2, 800);
  text("I'm upping", M, 400, { fam: 'serif', italic: true, size: 160, color: INK });
  text('my', M, 550, { fam: 'serif', italic: true, size: 160, color: INK });
  const s = fit('P(DOOM)', 880, { fam: 'sans', weight: 900 });
  text('P(DOOM)', M - 6, 575 + s * .84, { fam: 'sans', weight: 900, size: s, color: INK }, (g, i) => ({ dy: jit(T, i + 1, o.boil, 1 / 8), dx: jit(T, i + 9, o.boil * .6, 1 / 8) }));
  const yy = 575 + s * .84 + 190;
  const w24 = text('(2024)', M, yy, { fam: 'serif', size: 120, color: INK });
  if (o.cursor) cursor(M + w24 + 6, yy, 120, T, INK);
  strike(M, M + w24, yy, 120, o.strike, { seed: 3 });
  if (o.typed > 0) {
    caret(M + w24 + 36, yy, 120, 1);
    text('2026'.slice(0, o.typed), M + w24 + 70, yy - 2, { fam: 'sans', weight: 800, size: 126, color: PAL.red });
  }
  note(M + w24 + 150, yy + 20, M + 4, yy + 130, 'it moved faster than we thought', o.note, { size: 32 });
  X.restore();
}

scene(-2.6, 0, 'cold open', S => {
  const T = S.T, e = S.lt;
  titleCard(T, {
    zoom: 1 + .03 * ease.io3(S.u), boil: 1.2, cursor: e < .9,
    strike: clamp((e - .9) / .22),
    typed: [1.35, 1.47, 1.59, 1.71].filter(x => e >= x).length,
    note: clamp((e - 1.95) / .8) * .6,
  });
});

scene(0, 1.5, 'open', S => {
  const T = S.T;
  const bi = beat(T), inv_ = bi.i >= 0 && bi.i % 2 === 0 && bi.since < .12;
  titleCard(T, { inv: inv_, zoom: 1.03 + 0.05 * ease.out3(S.u) + 0.012 * pulse(T, 10), boil: 2.5, strike: 1, typed: 4, note: clamp(.6 + S.u * .8) });
  return { dark: inv_ };
});
