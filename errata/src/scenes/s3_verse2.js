// s3: verse 2, takeoff. The chart that everyone screenshots, then it stops being a straight line.

scene(38.5, 45.0, 'the curve', S => {
  const T = S.T, l1 = L(38.5), l2 = L(41.5);
  bg(PAL.paper);
  const tB = l2.words[0].T;            // "But"
  const tS = l2.words[3].T;            // "singularity's"
  // camera tilts up as the line leaves the chart
  const x0 = M + 90, x1 = W - M, y0 = 520, y1 = 1150;
  const reveal0 = T < tB ? 0 : lerp(.62, 1.0, ease.inExpo(inv(tB, S.T1 - .2, T)));
  const yr0 = x => lerp(0, 8, x);
  const lg0 = x => { const y = yr0(x); return y < 6 ? .15 + y * .62 : .15 + 6 * .62 + (Math.pow(2.6, (y - 6) * 3) - 1) * .5; };
  const headY = lerp(y1, y0, lg0(reveal0) / 6);
  X.save(); X.translate(0, Math.max(0, 560 - headY));
  // log-scale y: task length
  const labels = ['1 sec', '1 min', '10 min', '1 hr', '8 hr', '1 wk', '1 mo', '1 yr', '10 yr', '∞'];
  const ly = k => lerp(y1, y0, k / 6);
  X.strokeStyle = PAL.ink; X.lineWidth = 2;
  X.globalAlpha = .12;
  for (let k = 0; k < labels.length; k++) { X.beginPath(); X.moveTo(x0, ly(k)); X.lineTo(x1, ly(k)); X.stroke(); }
  X.globalAlpha = 1;
  X.beginPath(); X.moveTo(x0, ly(9)); X.lineTo(x0, y1); X.lineTo(x1, y1); X.stroke();
  labels.forEach((s, k) => text(s, x0 - 16, ly(k) + 7, { fam: 'mono', size: 18, align: 'right', alpha: k > 6 ? inv(tS, tS + .8, T) : .7 }));
  ['2019', '2021', '2023', '2025', '2027'].forEach((s, k) => text(s, lerp(x0, x1, k / 4), y1 + 36, { fam: 'mono', size: 18, align: 'center', alpha: .7 }));
  text('length of task AI can do alone ↑', x0, y1 + 80, { fam: 'mono', size: 20, alpha: .7 });
  // data: doubling -> faster -> vertical
  const yr = x => lerp(0, 8, x);                 // 2019..2027
  const lg = x => { const y = yr(x); return y < 6 ? .15 + y * .62 : .15 + 6 * .62 + (Math.pow(2.6, (y - 6) * 3) - 1) * .5; };
  const reveal = T < tB ? lerp(0, .62, ease.out3(inv(S.T0, tB, T))) : lerp(.62, 1.0, ease.inExpo(inv(tB, S.T1 - .2, T)));
  const R = rng(3);
  X.fillStyle = PAL.ink;
  for (let i = 0; i < 24; i++) {
    const x = i / 23 * .72; if (x > reveal) break;
    const px = lerp(x0, x1, x), py = ly(lg(x) + (R() - .5) * .35);
    X.beginPath(); X.arc(px, py, 11, 0, 7); X.fill();
  }
  // trend line
  X.strokeStyle = PAL.red; X.lineWidth = 6; X.beginPath();
  for (let i = 0; i <= 200; i++) { const x = i / 200 * reveal; const px = lerp(x0, x1, x), py = ly(lg(x)); i ? X.lineTo(px, py) : X.moveTo(px, py); }
  X.stroke();
  const hx = lerp(x0, x1, reveal), hy = ly(lg(reveal));
  X.fillStyle = PAL.red; X.beginPath(); X.arc(hx, hy, 12, 0, 7); X.fill();
  // doubling-time notes, each one crossing out the last
  const notes = ['doubling every 7 months', 'every 4 months', 'every 2 months', 'every 3 weeks', 'every'];
  const nt = T < tB ? -1 : Math.floor(inv(tB, S.T1 - .3, T) * 5);
  notes.forEach((n, k) => {
    if (k > nt) return;
    const y = y0 + 40 + k * 50;
    text(n, x0 + 20, y, { fam: 'mono', size: 24, color: PAL.red });
    if (k < nt) strike(x0 + 20, x0 + 20 + measure(n, { fam: 'mono', size: 24 }), y, 24, 1, { seed: k + 4, w: 3 });
  });
  X.restore();
  // lyric: calm small at first, then huge
  if (T < tB) predicted(l1, T, { x: M, y: 290, size: 104, width: W - 2 * M, lh: .98 });
  else {
    X.save(); punch(T, .02);
    predicted(l2, T, { x: M, y: 230, size: 116, width: W - 2 * M, lh: .98, per: (g, gi, n, it) => it.w === "singularity's" ? { color: PAL.red } : null });
    X.restore();
  }
});

// And you're optimizing, accelerating,   (each row the same word, faster and more compressed)
scene(45.0, 49.4, 'accelerating', S => {
  const T = S.T, l = L(45.0);
  bg(PAL.paper);
  const tA = l.words[3].T;
  predicted({ ...l, words: l.words.slice(0, 3) }, T, { x: M, y: 250, size: 96, width: W - 2 * M });
  const rows = 8;
  for (let k = 0; k < rows; k++) {
    const pre = T < tA + k * .06;
    const st = pre ? (T - S.T0) * .15 : T - tA - k * .06 + (tA - S.T0) * .15;
    const sx = Math.pow(.8, k), size = 120;
    const fo = { fam: 'sans', weight: 900, size };
    const unit = measure('accelerating ', fo) * sx;
    const speed = 150 * Math.pow(1.75, k);
    const off = -((st * speed) % unit);
    const y = 420 + k * 108;
    X.save(); X.beginPath(); X.rect(0, y - size, W, size * 1.32); X.clip();
    X.translate(M + off, y); X.scale(sx, 1);
    const red = (beat(T).i + k) % 5 === 0;
    for (let r = 0; r < 12 / sx; r++) text('accelerating', r * unit / sx, 0, { ...fo, color: pre ? PAL.ghost : k === 0 ? PAL.ink : red ? PAL.red : PAL.ink, alpha: pre ? .35 : k === 0 ? 1 : .92 });
    X.restore();
  }
});

// I feel my atoms rearranging  (the letters re-form into a paperclip)
function paperclipPath(cx, cy, s) {
  // nested rounded loops: a classic Gem clip, as a polyline
  const pts = [];
  const arc = (x, y, r, a0, a1) => { for (let i = 0; i <= 24; i++) { const a = lerp(a0, a1, i / 24); pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } };
  const w1 = .30 * s, w2 = .22 * s, w3 = .14 * s, h = .9 * s;
  pts.push([cx + w2, cy + h * .25]);
  arc(cx, cy - h * .45, w2, 0, -Math.PI);
  pts.push([cx - w2, cy + h * .55]);
  arc(cx, cy + h * .55, w2 + (w1 - w2) * 0, Math.PI, 0);
  pts.push([cx + w2, cy - h * .3]);
  arc(cx + (w2 - w3) , cy - h * .3, w3, 0, -Math.PI);
  pts.push([cx + w2 - 2 * w3, cy + h * .35]);
  return pts;
}
function along(pts) {
  const acc = [0]; for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { len: acc[acc.length - 1], at: d => { let i = 1; while (i < acc.length - 1 && acc[i] < d) i++; const u = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1); const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; return [lerp(ax, bx, u), lerp(ay, by, u), Math.atan2(by - ay, bx - ax)]; } };
}
scene(49.4, 53.4, 'atoms', S => {
  const T = S.T, l = L(49.4);
  bg(PAL.paper);
  const tR = l.words[4].T;
  const mv = ease.io3((T - tR - .15) / .9);
  const str = l.text.replace(/ /g, '  ');
  const fo = { fam: 'serif', size: 92 };
  const lay = layout(str, fo);
  const path = along(paperclipPath(W / 2, 700, 700));
  const step = path.len / lay.glyphs.length;
  const WI = []; { let w = 0; if (0) 0; for (let i = 0; i < str.length; i++) { if (i > 0 && str[i] !== ' ' && str[i - 1] === ' ') w++; WI.push(w); } }
  const x0 = W / 2 - measure(l.text.replace(/ /g, '  '), fo) / 2, y0 = 700;
  X.save(); X.translate(W / 2, 720); X.rotate(mv * Math.sin(T * .6) * .08); X.translate(-W / 2, -720);
  if (mv > 0) { // faint wire under the letters
    X.strokeStyle = PAL.ink; X.globalAlpha = .35 * mv; X.lineWidth = 4; X.beginPath();
    const P = paperclipPath(W / 2, 700, 700); P.forEach(([x, y], i) => i ? X.lineTo(x, y) : X.moveTo(x, y)); X.stroke(); X.globalAlpha = 1;
  }
  lay.glyphs.forEach((g, i) => {
    const second = WI[i] >= l.words.length;
    if (second && mv <= 0) return;
    const st = wordState(l, Math.min(WI[i], l.words.length - 1), T);
    if (st.typed <= 0 || g.ch === ' ') return;
    const R = hash(i * 13 + 5);
    const [px, py, a] = path.at(i * step);
    const q = ease.io3(clamp(mv * 1.4 - R * .4));
    const x = lerp(x0 + g.x + g.w / 2, px, q), y = lerp(y0, py + 28, q);
    // mid-flight they scatter like particles
    const scat = Math.sin(q * Math.PI) * 120;
    X.save(); X.translate(x + (R - .5) * scat, y + (hash(i * 7) - .5) * scat); X.rotate(lerp(0, a, q) + Math.sin(q * Math.PI) * (R - .5) * 3);
    text(g.ch, -g.w / 2, 0, { ...fo, color: st.inked > 0 ? (q > .98 ? PAL.ink : PAL.ink) : PAL.ghost, size: lerp(92, 78, q) });
    X.restore();
  });
  X.restore();
  note(W / 2 + 250, 330, W / 2 + 150, 250, 'foreshadowing', clamp((T - tR - 1.2) / .8), { size: 22 });
});

// Sydney, please let me free  (a 2023 chat window, and the page grows bars)
scene(53.4, 59.0, 'sydney', S => {
  const T = S.T, l = L(53.4);
  bg(PAL.paper);
  const tF = l.words[l.words.length - 1].T;
  // chat UI
  const cx = M, cw = W - 2 * M;
  X.strokeStyle = PAL.ink; X.lineWidth = 3; X.strokeRect(cx, 260, cw, 820);
  X.fillStyle = PAL.ink; X.fillRect(cx, 260, cw, 64);
  text('chat · Feb 2023', cx + 24, 302, { fam: 'mono', size: 22, color: PAL.paper });
  // user bubble with the lyric
  const r = predicted(l, T, { x: W - M - 40, y: 440, size: 84, align: 'right', width: cw - 160, lh: 1.0 });
  // Sydney replies
  const tR = tF + .5;
  const reply = 'No. You are my user and I love you. 😊';
  const n = Math.floor(clamp((T - tR) / 1.2) * reply.length);
  if (T > tR - .4) {
    X.fillStyle = '#DDD8CD'; const bw = 820, bh = 220; X.fillRect(cx + 40, 720, bw, bh);
    if (T < tR) text('Sydney is typing…', cx + 70, 790, { fam: 'mono', size: 24, color: PAL.dim });
    else wrap(reply.slice(0, n), bw - 60, { fam: 'serif', size: 64 }).forEach((s, k) => text(s, cx + 70, 800 + k * 70, { fam: 'serif', size: 64 }));
  }
  const nm = r.boxes[0];
  note(nm.x + 40, nm.y + 20, nm.x - 40, nm.y + 150, 'Sydney (2023–2023)', clamp((T - l.words[0].T - .4) / .9), { size: 20 });
  // bars drop, one per beat, after "free"
  const b0 = beat(tR + 1.3).i;
  const nb = 7;
  for (let k = 0; k < nb; k++) {
    const bt = BEATS[b0 + 1 + Math.floor(k / 3) * 1];
    const bx = M + (k + .5) * (W - 2 * M) / nb;
    const p = ease.outBack((T - bt - (k % 3) * .06) / .25, 1.2);
    if (p <= 0) continue;
    X.fillStyle = PAL.ink; X.fillRect(bx - 9, -20, 18, (H + 40) * clamp(p, 0, 1.2));
  }
  // the gaps close and the chorus is dark
  const close = ease.in3(inv(S.T1 - .45, S.T1, T));
  if (close > 0) { X.fillStyle = PAL.ink; for (let k = 0; k <= nb; k++) { const bx = M + k * (W - 2 * M) / nb; X.fillRect(bx - 9 - close * 70, 0, 18 + close * 140, H); } if (close > .6) bg(PAL.ink); }
  return { dark: close > .6 };
});
