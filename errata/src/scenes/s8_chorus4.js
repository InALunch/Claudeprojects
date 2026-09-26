// s8: chorus 4. Red alert.

scene(123.5, 126.0, 'hook 4', S => {
  const T = S.T;
  bg(PAL.red);
  // siren sweep
  const a = T * 5;
  const g = X.createConicGradient(a, W / 2, H * .45);
  g.addColorStop(0, 'rgba(20,19,18,0.28)'); g.addColorStop(.12, 'rgba(20,19,18,0)'); g.addColorStop(.5, 'rgba(20,19,18,0.28)'); g.addColorStop(.62, 'rgba(20,19,18,0)'); g.addColorStop(1, 'rgba(20,19,18,0.28)');
  X.fillStyle = g; X.fillRect(0, 0, W, H);
  pdoomHook(S, 123.5, .61, .86, { fg: PAL.ink, numColor: PAL.paper, shake: 3 });
  return { dark: false, redbg: true };
});

// Just as foretold by Loom  (a tree of branching continuations)
scene(126.0, 128.0, 'loom', S => {
  const T = S.T, l = L(126.0);
  bg(PAL.ink);
  predicted(l, T, { fam: 'serif', italic: true, size: 104, x: M, y: 290, width: W - 2 * M, color: PAL.paper, ghost: DARK_GHOST });
  const grow = ease.out3(S.lt / (S.dur * .9)) * 7;
  const toks = ['the', 'end', 'then', 'we', 'it', 'was', 'fine', 'not', 'yet', 'soon', 'all', 'of', 'us', 'no', 'one', 'knew'];
  const R = rng(126);
  function br(x, y, a, len, d, id) {
    if (d > grow) return;
    const p = clamp(grow - d);
    const x2 = x + Math.cos(a) * len * p, y2 = y + Math.sin(a) * len * p;
    X.strokeStyle = d > 4 ? PAL.red : PAL.paper; X.lineWidth = Math.max(1, 6 - d); X.globalAlpha = .9;
    X.beginPath(); X.moveTo(x, y); X.lineTo(x2, y2); X.stroke();
    if (p > .9 && d < 5) text(toks[(id * 7 + d) % toks.length], x2 + 6, y2 - 6, { fam: 'mono', size: 20 - d * 2, color: PAL.paper, alpha: .75 });
    X.globalAlpha = 1;
    if (p < 1) return;
    const n = 2 + (hash(id) < .4 ? 1 : 0);
    for (let k = 0; k < n; k++) br(x2, y2, a + (k - (n - 1) / 2) * (.5 + hash(id * 3 + k) * .3), len * .72, d + 1, id * 3 + k + 1);
  }
  br(W / 2, H - 120, -Math.PI / 2, 260, 0, 1);
  return { dark: true };
});

// From masked pre-training days  (a sepia flashback)
scene(128.0, 130.0, 'masked', S => {
  const T = S.T, l = L(128.0);
  bg('#E3D5B8');
  const flick = .92 + .08 * hash(Math.floor(T * 24));
  X.globalAlpha = flick;
  text('The cat sat on the', M, 620, { fam: 'mono', size: 64 });
  const mx = M, my = 720;
  const fill = clamp((T - l.words[1].T) / .15);
  if (fill < 1) { X.fillStyle = PAL.ink; X.fillRect(mx, my, 300, 90); text('[MASK]', mx + 150, my + 64, { fam: 'mono', size: 56, color: '#E3D5B8', align: 'center' }); }
  if (fill > 0) text('mat.', mx, my + 70, { fam: 'mono', size: 72, weight: 700, color: PAL.red, alpha: fill });
  X.globalAlpha = 1;
  predicted(l, T, { fam: 'serif', italic: true, size: 96, x: M, y: 1080, width: W - 2 * M });
  // film scratches
  const R = rng(Math.floor(T * 24));
  X.strokeStyle = 'rgba(40,30,20,0.35)'; X.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) { const x = R() * W; X.beginPath(); X.moveTo(x, 0); X.lineTo(x + (R() - .5) * 20, H); X.stroke(); }
  text('2018', W - M, 200, { fam: 'mono', size: 30, align: 'right', alpha: .6 });
});

// To recursive self-upgrade  (the frame contains itself, and keeps zooming in)
scene(130.0, 132.0, 'recursive', S => {
  const T = S.T, l = L(130.0);
  bg(PAL.paper);
  const k = .62;
  const zz = Math.pow(1 / k, (S.lt * 1.6) % 1);
  X.save(); cam(zz, 0, W / 2, H / 2 + 60);
  let s = 1;
  for (let d = 0; d < 9; d++) {
    X.save(); X.translate(W / 2, H / 2 + 60); X.scale(s, s); X.translate(-W / 2, -(H / 2 + 60));
    X.strokeStyle = d % 2 ? PAL.red : PAL.ink; X.lineWidth = 6 / Math.max(s, .05) * .7;
    X.strokeRect(M, 160, W - 2 * M, H - 290);
    text('self-upgrade', M + 40, 300, { fam: 'sans', weight: 900, size: 104, color: d % 2 ? PAL.red : PAL.ink });
    text(`v${d + Math.floor(S.lt * 1.6) + 2}.0`, W - M - 40, 300, { fam: 'mono', size: 40, align: 'right' });
    X.restore();
    s *= k;
  }
  X.restore();
  X.fillStyle = PAL.paper; X.fillRect(0, 1100, W, 250);
  predicted(l, T, { fam: 'serif', italic: true, size: 96, x: M, y: 1200, width: W - 2 * M });
});

// What did Ilya see? We'll never know.  (redacted)
scene(132.0, 137.2, 'redacted', S => {
  const T = S.T, l = L(132.0);
  bg(PAL.paper);
  const q = { ...l, words: l.words.slice(0, 4) }, a = { ...l, words: l.words.slice(4) };
  predicted(q, T, { fam: 'serif', size: 124, x: M, y: 300, width: W - 2 * M });
  // a document, being redacted line by line on the beat
  const b0 = beat(l.words[3].T).i + 1;
  const bi = beat(T).i;
  const R = rng(132);
  for (let i = 0; i < 12; i++) {
    const y = 420 + i * 46, w = (W - 2 * M) * (.55 + R() * .45);
    X.fillStyle = PAL.ink; X.globalAlpha = .2; X.fillRect(M, y, w, 8); X.globalAlpha = 1;
    const bt = BEATS[b0 + Math.floor(i / 2)] || 1e9;
    redact(M - 6, y - 14, w + 12, 36, clamp((T - bt - (i % 2) * .08) / .1));
  }
  predicted(a, T, { alt: { 2: 'tell.' }, fam: 'serif', italic: true, size: 110, x: M, y: 1090, width: W - 2 * M });
  // then the lyric itself
  const bEnd = beat(l.words[l.words.length - 1].T).i + 2;
  const r1 = clamp((T - (BEATS[bEnd] || 1e9)) / .12), r2 = clamp((T - (BEATS[bEnd + 1] || 1e9)) / .12);
  redact(M - 10, 190, W - 2 * M + 20, 140, r1);
  redact(M - 10, 990, W - 2 * M + 20, 140, r2);
  // everything goes
  const all = clamp((T - (S.T1 - .15)) / .12);
  if (all > 0) { X.fillStyle = PAL.ink; X.fillRect(0, 0, W, H * ease.io3(all)); }
  return { dark: all > .5 };
});
