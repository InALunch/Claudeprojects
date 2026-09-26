// s0: cold open. Frame 0 is the thumbnail: the title, already revised in red.
scene(0, 1.5, 'open', S => {
  const T = S.T;
  const bi = beat(T), inv_ = bi.i >= 0 && bi.i % 2 === 0 && bi.since < .12;
  const INK = inv_ ? PAL.paper : PAL.ink;
  bg(inv_ ? PAL.ink : PAL.paper);
  X.save();
  cam(1 + 0.05 * ease.out3(S.u) + 0.012 * pulse(T, 10), 0, W / 2, H / 2);
  const y0 = 400;
  text("I'm upping", M, y0, { fam: 'serif', italic: true, size: 170, color: INK });
  text('my', M, y0 + 150, { fam: 'serif', italic: true, size: 170, color: INK });
  const s = fit('P(DOOM)', W - 2 * M, { fam: 'sans', weight: 900 });
  text('P(DOOM)', M, y0 + 175 + s * .8, { fam: 'sans', weight: 900, size: s, track: -0.02, color: INK }, (g, i) => ({ dy: jit(T, i + 1, 2.5, 1 / 8), dx: jit(T, i + 9, 1.5, 1 / 8) }));
  // the year gets revised
  const yy = y0 + 175 + s * .8 + 150;
  const w24 = text('(2024)', M, yy, { fam: 'serif', size: 96, color: INK });
  strike(M, M + w24, yy, 96, 1, { seed: 3 });
  caret(M + w24 + 26, yy, 96, 1);
  text('2026', M + w24 + 50, yy - 4, { fam: 'sans', weight: 800, size: 96, color: PAL.red });
  const p = inv(S.at(0.27), S.at(1.3), T);
  note(M + w24 + 250, yy + 10, M + w24 + 200, yy + 110, 'it moved faster than we thought', clamp(0.35 + p * 1.3), { size: 30, align: 'right' });
  X.restore();
  return { dark: inv_ };
});
