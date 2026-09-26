// s7: verse 4. The page is barely holding.

// "Just transformers all the way!"  (all the way down)
scene(109.4, 113.5, 'all the way', S => {
  const T = S.T, l = L(109.4);
  bg(PAL.paper);
  const fo = { fam: 'sans', weight: 900, size: 150 };
  const scroll = S.lt * 1.3;          // rows per second, descending forever
  let y = 560, s = 1;
  const f = scroll % 1;
  // zoom so that one row's worth of shrink passes per unit of scroll
  const z = Math.pow(1 / .8, f);
  X.save(); cam(z, 0, W / 2, 440);
  for (let k = 0; k < 18; k++) {
    const idx = k + Math.floor(scroll);
    const a = k === 0 ? 1 - f : 1;
    X.save(); X.translate(W / 2, y); X.scale(s, s);
    text('TRANSFORMERS', 0, 0, { ...fo, align: 'center', color: idx % 4 === 3 ? PAL.red : PAL.ink, alpha: a });
    X.restore();
    y += 150 * s * .9; s *= .8;
  }
  X.restore();
  X.fillStyle = PAL.paper; X.fillRect(0, 150, W, 280);
  predicted(l, T, { fam: 'serif', italic: true, size: 100, x: M, y: 280, width: W - 2 * M, lh: .98 });
});

// Till you learned to disobey  (a one-word redline)
scene(113.5, 115.5, 'disobey', S => {
  const T = S.T, l = L(113.5);
  bg(PAL.paper);
  const fo = { fam: 'serif', size: 150 };
  const head = { ...l, words: l.words.slice(0, 4) };
  predicted(head, T, { ...fo, x: M, y: 520, width: W - 2 * M, lh: .95 });
  const w = l.words[4];
  const st = wordState(l, 4, T);
  const y = 520 + 2 * 150 * .95 + 40;
  const dx = M + 150;
  if (st.typed > 0) text('obey', dx, y, { fam: 'serif', size: 230, color: st.inked > 0 ? PAL.ink : PAL.ghost });
  const p = clamp((T - w.T + .05) / .2);
  if (p > 0) {
    caret(dx - 20, y - 150, 120, p);
    X.save(); X.translate(dx - 100, y - 190); X.rotate(-.06); const z = lerp(1.6, 1, ease.outExpo(p)); X.scale(z, z);
    text('dis', 0, 0, { fam: 'sans', weight: 900, size: 150, color: PAL.red, alpha: p });
    X.restore();
  }
  note(dx + 480, y - 80, dx + 520, y - 250, 'suggested edit (auto)', clamp((T - w.T - .5) / .7), { size: 22 });
});

// Post-Chinchilla, super-dense  (the letters pack until they're solid)
scene(115.5, 117.0, 'dense', S => {
  const T = S.T, l = L(115.5);
  bg(PAL.paper);
  const tD = l.words[1].T;
  const d = ease.in3(inv(tD, S.T1 - .1, T));
  const fo = { fam: 'sans', weight: 900, size: 170 };
  ['POST-', 'CHINCHILLA,', 'SUPER-', 'DENSE'].forEach((row, i) => {
    const wi = i < 2 ? 0 : 1;
    const st = wordState(l, wi, T);
    if (st.typed <= 0) return;
    const tr = lerp(-.02, -.62, d);
    const lay = layout(row, { ...fo, track: tr });
    const sc = Math.min(1, (W - 2 * M) / lay.width);
    X.save(); X.translate(W / 2, 480 + i * 170 * lerp(1, .55, d)); X.scale(sc, 1);
    text(row, 0, 0, { ...fo, track: tr, align: 'center', color: st.inked > 0 ? PAL.ink : PAL.ghost });
    X.restore();
  });
  note(W - M - 40, 330, W - M - 380, 250, '2022. it got denser.', clamp((T - l.words[0].T - .2) / .6), { size: 22 });
});

// Breaking through each safety fence
scene(117.0, 119.0, 'fences', S => {
  const T = S.T, l = L(117.0);
  bg(PAL.paper);
  predicted(l, T, { fam: 'serif', size: 96, x: M, y: 250, width: W - 2 * M, lh: .98 });
  const labels = ['POLICY', 'EVALS', 'SAFETY CASE', 'RSP', 'KILLSWITCH'];
  const b0 = beat(S.T0).i + 1;
  let cubeY = 380;
  labels.forEach((lab, i) => {
    const y = 520 + i * 150, bt = BEATS[b0 + i] || 1e9;
    const broke = T > bt;
    const since = T - bt;
    X.fillStyle = PAL.ink;
    if (!broke) X.fillRect(M, y, W - 2 * M, 6);
    else {
      const g = 90 + 30 * ease.outExpo(since / .2);
      X.fillRect(M, y, W / 2 - g - M, 6); X.fillRect(W / 2 + g, y, W / 2 - g - M, 6);
      // splinters
      const R = rng(i * 17 + 3);
      for (let k = 0; k < 8; k++) { const a = R() * Math.PI, v = 300 + R() * 500, t = Math.min(since, .6); X.save(); X.translate(W / 2 + (R() - .5) * 160 + Math.cos(a) * v * t, y + 900 * t * t - Math.sin(a) * v * t * .6); X.rotate(R() * 6 + t * 8); X.fillRect(-18, -3, 36, 6); X.restore(); }
      cubeY = Math.max(cubeY, y + 60);
    }
    text(lab, W - M, y - 14, { fam: 'mono', size: 22, align: 'right', color: broke ? PAL.red : PAL.ink, alpha: .8 });
  });
  // the super-dense cube, falling through
  const bi = beat(T);
  const cy = cubeY - 60 * Math.exp(-bi.since * 12) + 20;
  X.fillStyle = PAL.ink; X.fillRect(W / 2 - 60, cy - 60, 120, 120);
});

// Hundred thousand GPU  (revised, revised, revised)
scene(119.0, 120.9, 'gpus', S => {
  const T = S.T, l = L(119.0);
  bg(PAL.paper);
  predicted(l, T, { fam: 'serif', size: 100, x: M, y: 250, width: W - 2 * M });
  const revs = ['100,000', '1,000,000', '10,000,000', '5 GW'];
  const b0 = beat(l.words[0].T).i;
  const k = beat(T).i - b0;
  revs.forEach((r, i) => {
    if (i > k) return;
    const y = 520 + i * 190;
    const fo = { fam: 'sans', weight: 900, size: 170 };
    const w = measure(r, fo);
    const pop = Math.exp(-(T - (BEATS[b0 + i] || 0)) * 10);
    text(r, M, y + 110, { ...fo, color: i === revs.length - 1 || i === k ? PAL.red : PAL.ink, alpha: i < k ? .5 : 1 }, () => ({ sc: 1 + .1 * pop }));
    if (i < k) strike(M, M + w, y + 110, 170, clamp((T - BEATS[b0 + i + 1]) / .12), { seed: i + 20, w: 8 });
  });
  text('GPU', W - M, 1220, { fam: 'mono', size: 30, align: 'right' });
});

// RLHF goes askew  (the reward signal tilts the page)
scene(120.9, 123.5, 'askew', S => {
  const T = S.T, l = L(120.9);
  bg(PAL.paper);
  const sk = ease.in3(S.u);
  X.save();
  X.translate(W / 2, H / 2); X.transform(1, sk * .25, -sk * .6, 1, 0, 0); X.rotate(sk * .35); X.translate(-W / 2, -H / 2);
  // reward rain
  const R = rng(121);
  for (let i = 0; i < 90; i++) {
    const x = R() * W, sp = 300 + R() * 700, y = ((R() * H + (T * sp)) % (H + 100)) - 50;
    const good = R() < .5;
    text(good ? '+1' : '−1', x, y, { fam: 'mono', size: 30 + R() * 30, weight: 700, color: good ? PAL.ink : PAL.red, alpha: .6 });
  }
  X.fillStyle = PAL.paper; X.fillRect(M - 30, 520, W - 2 * M + 60, 380);
  predicted(l, T, { fam: 'sans', weight: 900, size: 170, x: M, y: 700, width: W - 2 * M, lh: .92 });
  X.restore();
  // slides out into the red
  const out = ease.in3(inv(S.T1 - .35, S.T1, T));
  if (out > 0) { X.fillStyle = PAL.red; X.fillRect(0, 0, W * out, H); }
});
