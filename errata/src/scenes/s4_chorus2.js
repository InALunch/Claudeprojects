// s4: chorus 2. The calendar passes today.

scene(59.0, 60.5, 'hook 2', S => {
  const T = S.T;
  bg(PAL.ink);
  pdoomHook(S, 59.0, .15, .34);
  const d = daysAt(T), past = d >= TODAY_DAYS;
  const a = clamp((T - S.T0) / .15);
  text(dateStr(T), M, 300, { fam: 'mono', size: 54, weight: 700, color: PAL.red, alpha: a });
  text(Math.abs(d - TODAY_DAYS - .5) < 1e-6 ? '← today' : past ? '← that was today' : '← approaching today', M + measure(dateStr(T), { fam: 'mono', size: 54, weight: 700 }) + 24, 300, { fam: 'mono', size: 30, color: PAL.paper, alpha: a });
  return { dark: true };
});

// I hear the basilisk boom
scene(60.5, 63.0, 'basilisk', S => {
  const T = S.T, l = L(60.5);
  bg(PAL.ink);
  const bw = l.words[l.words.length - 1];
  const since = T - bw.T;
  X.save();
  if (since > 0) shake(T, 30 * Math.exp(-since * 4));
  // the line slithers on a sine path
  const head = { ...l, words: l.words.slice(0, -1) };
  predicted(head, T, {
    fam: 'serif', italic: true, size: 120, x: M, y: 420, color: PAL.paper, ghost: DARK_GHOST, width: 2000,
    per: (g, i, n, it) => ({ dy: Math.sin((g.x + it.x) * .012 - T * 7) * 34 * (it.w === 'basilisk' ? 1.6 : .5), rot: Math.cos((g.x + it.x) * .012 - T * 7) * .25 * (it.w === 'basilisk' ? 1 : .3) })
  });
  const s = fit('BOOM', W - 2 * M, { fam: 'sans', weight: 900 });
  if (since < 0) {
    X.strokeStyle = DARK_GHOST; X.lineWidth = 3; setFont({ fam: 'sans', weight: 900, size: s }); X.strokeText('BOOM', M, 980);
  } else {
    // cracks from the floor
    const R = rng(77);
    X.strokeStyle = PAL.paper; X.lineWidth = 4; X.lineJoin = 'bevel';
    for (let c = 0; c < 7; c++) {
      let x = R() * W, y = H; const reach = ease.outExpo(since / .3) * (300 + R() * 700);
      X.beginPath(); X.moveTo(x, y);
      for (let k = 0; k < 10 && H - y < reach; k++) { x += (R() - .5) * 140; y -= 60 + R() * 60; X.lineTo(x, y); }
      X.stroke();
    }
    const z = 1 + .3 * Math.exp(-since * 7);
    X.save(); X.translate(W / 2, 900); X.scale(z, z); X.translate(-W / 2, -900);
    text('BOOM', W / 2, 980, { fam: 'sans', weight: 900, size: s, color: PAL.red, align: 'center' });
    X.restore();
  }
  X.restore();
  return { dark: true };
});

// NVDA to the moon
scene(63.0, 64.5, 'nvda', S => {
  const T = S.T, l = L(63.0);
  bg(PAL.ink);
  predicted(l, T, { fam: 'sans', weight: 800, size: 110, x: M, y: 330, color: PAL.paper, ghost: DARK_GHOST, width: W - 2 * M });
  const mx = W - M - 120, my = 560, mr = 90;
  X.strokeStyle = PAL.paper; X.lineWidth = 3; X.beginPath(); X.arc(mx, my, mr, 0, 7); X.stroke();
  X.fillStyle = PAL.paper; for (const [dx, dy, r] of [[-30, -20, 16], [25, 30, 11], [30, -35, 8]]) { X.beginPath(); X.arc(mx + dx, my + dy, r, 0, 7); X.globalAlpha = .4; X.fill(); X.globalAlpha = 1; }
  const p = inv(S.T0 + .1, S.T1 - .1, T);
  const R = rng(8);
  X.strokeStyle = PAL.red; X.lineWidth = 7; X.lineJoin = 'round'; X.beginPath();
  const pts = [];
  for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([lerp(M, mx, u), lerp(1180, my, Math.pow(u, 2.4)) + (R() - .5) * 40 * (1 - u)]); }
  const n = Math.floor(p * 60);
  for (let i = 0; i <= n; i++) i ? X.lineTo(...pts[i]) : X.moveTo(...pts[i]);
  X.stroke();
  const pct = Math.round(Math.pow(10, 1 + p * 4.5));
  text(`▲ +${pct.toLocaleString('en-US')}%`, M, 1190, { fam: 'mono', size: 44, weight: 700, color: PAL.red });
  return { dark: true };
});

// The Omega Point's coming soon  (everything falls into one point)
scene(64.5, 66.0, 'omega', S => {
  const T = S.T, l = L(64.5);
  bg(PAL.ink);
  const cx = W / 2, cy = 700;
  const words = ['compute', 'tokens', 'data', 'capex', 'GPUs', 'evals', 'agents', 'energy', 'math', 'code', 'science', 'you'];
  const R = rng(64);
  for (let i = 0; i < 34; i++) {
    const a0 = R() * Math.PI * 2, r0 = 330 + R() * 320, sp = .7 + R() * .8;
    const q = ease.inExpo(clamp(S.u * sp * 1.1));
    const r = r0 * (1 - q), a = a0 + q * 5;
    const w = words[i % words.length];
    text(w, cx + Math.cos(a) * r, cy + Math.sin(a) * r * .75, { fam: 'mono', size: 34 * (1 - q * .8) + 4, color: i % 7 ? PAL.paper : PAL.red, alpha: 1 - q * .6, align: 'center' });
  }
  const g = ease.outExpo(inv(S.T1 - .35, S.T1, T));
  X.fillStyle = PAL.paper; X.beginPath(); X.arc(cx, cy, 6 + g * 40, 0, 7); X.fill();
  text('Ω', cx, cy + 90 + 180, { fam: 'serif', size: 200, color: PAL.paper, align: 'center', alpha: .15 + .85 * g });
  predicted(l, T, { fam: 'sans', weight: 800, size: 80, x: W / 2, y: 1160, color: PAL.paper, ghost: DARK_GHOST, align: 'center', width: W - 2 * M });
  return { dark: true };
});

// One E thirty flops a second  (and the forecast keeps moving closer)
scene(66.0, 70.0, 'flops', S => {
  const T = S.T, l = L(66.0);
  bg(PAL.ink);
  predicted(l, T, { fam: 'sans', weight: 800, size: 96, x: M, y: 300, color: PAL.paper, ghost: DARK_GHOST, width: W - 2 * M });
  const zeros = '1' + ',000'.repeat(10);
  const fo = { fam: 'sans', weight: 900, size: 420 };
  const wz = measure(zeros, fo);
  const tf = l.words[3].T; // flops
  const p = ease.io3(inv(l.words[0].T, l.T1 + .6, T));
  X.save(); X.beginPath(); X.rect(0, 440, W, 440); X.clip();
  text(zeros, M - p * (wz - W + 2 * M), 820, { ...fo, color: PAL.paper });
  X.restore();
  text('FLOP / s', M, 930, { fam: 'mono', size: 30, color: PAL.paper, alpha: .7 });
  // ETA revisions, one per beat after "flops"
  const etas = ['ETA 2040', '2034', '2031', '2029', '2028', 'soon'];
  const b0 = beat(tf).i;
  const k = beat(T).i - b0;
  let x = M;
  etas.forEach((e, i) => {
    if (T < tf || i > k) return;
    const fo2 = { fam: 'mono', size: 44, weight: 700 };
    const w = measure(e, fo2);
    const y = 1080 + (x + w > W - M ? 70 : 0);
    if (x + w > W - M) x = M + (i - 3) * 0;
    text(e, x, y, { ...fo2, color: i === etas.length - 1 ? PAL.paper : PAL.red });
    if (i < k && i < etas.length - 1) strike(x, x + w, y, 44, clamp((T - BEATS[b0 + i + 1]) / .15), { seed: i, w: 4 });
    x += w + 34;
  });
  return { dark: true };
});

// That was safe enough, we reckoned
scene(70.0, 73.0, 'safe enough', S => {
  const T = S.T, l = L(70.0);
  bg(PAL.ink);
  const items = ['evals', 'red team', 'interpretability', 'system card', 'vibes'];
  const res = ['passed', 'passed', 'partial', 'shipped', 'immaculate'];
  const b0 = beat(S.T0).i;
  items.forEach((it, i) => {
    const bt = BEATS[b0 + i] || 1e9;
    const y = 330 + i * 80;
    const a = clamp((T - bt + .2) / .1);
    X.globalAlpha = a;
    X.strokeStyle = PAL.paper; X.lineWidth = 3; X.strokeRect(M, y - 34, 40, 40);
    if (T > bt) { X.strokeStyle = PAL.red; X.lineWidth = 6; X.beginPath(); X.moveTo(M + 6, y - 14); X.lineTo(M + 18, y); X.lineTo(M + 40, y - 36); X.stroke(); }
    text(it, M + 70, y, { fam: 'mono', size: 36, color: PAL.paper });
    text(res[i], W - M, y, { fam: 'mono', size: 36, color: i === 2 ? PAL.red : PAL.paper, align: 'right' });
    X.globalAlpha = 1;
  });
  predicted(l, T, { fam: 'serif', italic: true, size: 120, x: M, y: 860, color: PAL.paper, ghost: DARK_GHOST, width: W - 2 * M, lh: .98 });
  // stamp
  const tR = l.words[l.words.length - 1].T + .3;
  const sp = clamp((T - tR) / .12);
  if (sp > 0) {
    X.save(); X.translate(W / 2 + 120, 1150); X.rotate(-.14); const z = lerp(1.8, 1, ease.outExpo(sp)); X.scale(z, z);
    X.globalAlpha = sp; X.strokeStyle = PAL.red; X.lineWidth = 8; X.strokeRect(-230, -70, 460, 120);
    text('APPROVED', 0, 18, { fam: 'sans', weight: 900, size: 84, color: PAL.red, align: 'center' });
    X.restore();
  }
  // paper rises for verse 3
  const up = ease.io3(inv(S.T1 - .3, S.T1, T));
  if (up > 0) { X.fillStyle = PAL.paper; X.fillRect(0, H * (1 - up), W, H * up + 2); }
  return { dark: up < .5 };
});
