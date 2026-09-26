// s6: chorus 3. Paperclips.

function clip(x, y, s, rot, color = PAL.paper, lw = 3) {
  X.save(); X.translate(x, y); X.rotate(rot); X.scale(s / 100, s / 100);
  X.strokeStyle = color; X.lineWidth = lw * 100 / s; X.lineJoin = 'round'; X.lineCap = 'round';
  X.beginPath(); paperclipPath(0, 0, 100).forEach(([px, py], i) => i ? X.lineTo(px, py) : X.moveTo(px, py)); X.stroke();
  X.restore();
}

scene(95.4, 97.5, 'hook 3', S => {
  bg(PAL.ink);
  // clips already accumulating at the bottom
  const R = rng(95);
  for (let i = 0; i < 40 * S.u; i++) clip(R() * W, H - 60 - R() * 140 * S.u, 60 + R() * 30, R() * 6, '#4A463F', 3);
  pdoomHook(S, 95.4, .34, .61);
  return { dark: true };
});

// as paperclips fill the room.
scene(97.5, 99.0, 'paperclips', S => {
  const T = S.T, l = L(97.5);
  bg(PAL.ink);
  const R = rng(97);
  const level = ease.in3(S.u) * .75 + .1;
  const n = Math.floor(120 + 900 * S.u);
  for (let i = 0; i < n; i++) {
    const x = R() * W, yT = H - R() * H * level, s = 50 + R() * 50, rot = R() * 6.3, delay = R() * .9;
    const fall = clamp((S.u - delay * (1 - R() * .3)) * 5);
    if (fall <= 0) continue;
    const y = lerp(-100, yT, ease.in3(fall));
    clip(x, y, s, rot + (1 - fall) * 3, i % 23 === 0 ? PAL.red : PAL.paper, 3);
  }
  X.fillStyle = PAL.ink; X.fillRect(0, 150, W, 420);
  predicted(l, T, { fam: 'sans', weight: 800, size: 96, x: M, y: 290, width: W - 2 * M, color: PAL.paper, ghost: DARK_GHOST });
  const c = Math.pow(2, 1 + S.u * 36);
  text(`${Math.floor(c).toLocaleString('en-US')} clips`, M, 530, { fam: 'mono', size: 34, weight: 700, color: PAL.red });
  return { dark: true };
});

// Killswitch guys on PTO,
scene(99.0, 100.5, 'pto', S => {
  const T = S.T, l = L(99.0);
  bg(PAL.ink);
  const cx = M, cy = 480, cw = W - 2 * M, ch = 470;
  const up = ease.outBack(clamp((T - S.T0 + .05) / .3));
  X.save(); X.translate(0, (1 - up) * 300); X.globalAlpha = clamp(up);
  X.fillStyle = PAL.paper; X.fillRect(cx, cy, cw, ch);
  text('Re: URGENT — killswitch', cx + 36, cy + 66, { fam: 'sans', weight: 800, size: 40 });
  text('auto-reply', cx + cw - 36, cy + 66, { fam: 'mono', size: 20, align: 'right', color: PAL.red });
  X.fillStyle = PAL.ink; X.globalAlpha = .2; X.fillRect(cx + 36, cy + 96, cw - 72, 2); X.globalAlpha = clamp(up);
  const body = ["I'm out of office with limited access to", 'email. I will respond when I return.', '', 'For anything urgent, please contact:'];
  body.forEach((b, i) => text(b, cx + 36, cy + 160 + i * 46, { fam: 'serif', size: 40 }));
  text('the model', cx + 36, cy + 160 + 4 * 46 + 10, { fam: 'serif', italic: true, size: 48, color: PAL.red });
  X.restore();
  predicted(l, T, { fam: 'sans', weight: 900, size: 104, x: M, y: 1120, width: W - 2 * M, color: PAL.paper, ghost: DARK_GHOST });
  return { dark: true };
});

// Now there's nowhere left to go.  (the clips close in; the words get squeezed)
scene(100.5, 102.5, 'nowhere', S => {
  const T = S.T, l = L(100.5);
  bg(PAL.ink);
  const cx = W / 2, cy = H / 2;
  const rad = lerp(560, 150, ease.in3(S.u));
  const R = rng(100);
  for (let i = 0; i < 1400; i++) {
    const x = R() * W, y = R() * H, s = 44 + R() * 40, rot = R() * 6.3;
    if (Math.hypot(x - cx, (y - cy) * 1.2) < rad) continue;
    clip(x, y, s, rot, i % 29 === 0 ? PAL.red : '#CFC9BD', 2.5);
  }
  const size = lerp(96, 30, ease.in3(S.u));
  predicted(l, T, { alt: { 2: 'no one' }, fam: 'serif', italic: true, size, x: cx, y: cy - size * .2, align: 'center', width: rad * 1.5, color: PAL.paper, ghost: DARK_GHOST });
  return { dark: true };
});

// Too late now, we lit the fuse.
scene(102.5, 105.4, 'fuse', S => {
  const T = S.T, l = L(102.5);
  bg(PAL.ink);
  predicted(l, T, { fam: 'sans', weight: 800, size: 100, x: M, y: 290, width: W - 2 * M, color: PAL.paper, ghost: DARK_GHOST });
  // fuse path winding to a bomb
  const pts = []; for (let i = 0; i <= 200; i++) { const u = i / 200; pts.push([lerp(M, W - 240, u) + Math.sin(u * 9) * 60, 720 + Math.sin(u * 13 + 1) * 150 + u * 180]); }
  const tLit = l.words[4].T; // "lit"
  const burn = ease.in3(inv(tLit, S.T1 - .3, T));
  const n = Math.floor(burn * 200);
  X.strokeStyle = PAL.paper; X.lineWidth = 5; X.setLineDash([16, 10]); X.beginPath();
  for (let i = n; i <= 200; i++) i === n ? X.moveTo(...pts[i]) : X.lineTo(...pts[i]);
  X.stroke(); X.setLineDash([]);
  // bomb
  const [bx, by] = [W - 190, 1050];
  X.fillStyle = PAL.paper; X.beginPath(); X.arc(bx, by, 120, 0, 7); X.fill();
  X.fillRect(bx - 34, by - 150, 68, 50);
  // spark
  if (T > tLit) {
    const [sx, sy] = pts[Math.min(200, n)], R = rng(Math.floor(T * 30));
    X.strokeStyle = PAL.red; X.lineWidth = 3;
    for (let k = 0; k < 14; k++) { const a = R() * 6.3, r = 10 + R() * 50; X.beginPath(); X.moveTo(sx, sy); X.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); X.stroke(); }
    X.fillStyle = PAL.paper; X.beginPath(); X.arc(sx, sy, 12, 0, 7); X.fill();
  }
  // flash
  const fl = inv(S.T1 - .3, S.T1 - .1, T);
  if (fl > 0) { X.fillStyle = PAL.paper; X.globalAlpha = fl; X.fillRect(0, 0, W, H); X.globalAlpha = 1; }
  return { dark: fl < .5 };
});

// Orthogonality thesis blues.  (the one blue moment: two axes that never touch)
scene(105.4, 109.4, 'blues', S => {
  const T = S.T, l = L(105.4);
  const fl = S.lt < 2 / FPS ? 1 : 0;
  bg(PAL.blue);
  const ox = 240, oy = 1000;
  X.strokeStyle = PAL.paper; X.lineWidth = 4;
  const gx = ease.out3(S.lt / .6);
  X.beginPath(); X.moveTo(ox, oy); X.lineTo(lerp(ox, W - M, gx), oy); X.moveTo(ox, oy); X.lineTo(ox, lerp(oy, 200, gx)); X.stroke();
  text('intelligence →', W - M, oy + 50, { fam: 'mono', size: 26, color: PAL.paper, align: 'right' });
  X.save(); X.translate(ox - 30, 200); X.rotate(-Math.PI / 2); text('goals →', 0, 0, { fam: 'mono', size: 26, color: PAL.paper, align: 'right' }); X.restore();
  // lyric: along both axes
  const w0 = l.words[0];
  const st0 = wordState(l, 0, T);
  if (st0.typed > 0) text('Orthogonality', ox + 20, oy - 30, { fam: 'serif', italic: true, size: 128, color: st0.inked > 0 ? PAL.paper : 'rgba(236,232,223,.35)' });
  X.save(); X.translate(ox + 110, oy - 190); X.rotate(-Math.PI / 2);
  const rest = { ...l, words: l.words.slice(1) };
  predicted(rest, T, { fam: 'serif', italic: true, size: 128, x: 0, y: 0, color: PAL.paper, ghost: 'rgba(236,232,223,.35)' });
  X.restore();
  // a point that goes very far right and nowhere in particular up
  const u = ease.io3(S.u);
  const px = lerp(ox + 60, W - M - 20, u), py = oy - 380 + Math.sin(T * 4) * 200 * u;
  X.fillStyle = PAL.red; X.beginPath(); X.arc(px, py, 16, 0, 7); X.fill();
  if (fl > 0) { X.fillStyle = PAL.paper; X.globalAlpha = fl; X.fillRect(0, 0, W, H); X.globalAlpha = 1; }
  return { dark: true };
});
