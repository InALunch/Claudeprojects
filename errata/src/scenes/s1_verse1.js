// s1: verse 1. The lyric sheet is being drafted live: the current line is set big, earlier
// lines collect at the top as a numbered draft with its edits still showing.

// numbered draft of lines already sung (orig start times), with optional red marks
function draft(T, t0s, o = {}) {
  const y0 = o.y || 150, lh = o.lh || 40, size = o.size || 30, dark = o.dark;
  t0s.forEach((t0, k) => {
    const l = L(t0);
    const p = clamp((T - l.T1) / 0.25);
    if (p <= 0) return;
    const y = y0 + k * lh;
    X.save(); X.globalAlpha = p;
    text(String(k + 1 + (o.n0 || 0)).padStart(2, '0'), M, y, { fam: 'mono', size: 18, color: PAL.red });
    const shown = l.text.slice(0, Math.ceil(l.text.length * clamp(p * 1.5)));
    text(shown, M + 46, y, { fam: 'serif', size, color: dark ? PAL.paper : PAL.ink, alpha: .75 });
    if (o.marks && o.marks[k]) o.marks[k](M + 46, y, size);
    X.restore();
  });
}
const V1 = [1.5, 6.0, 8.0, 9.0, 13.0, 17.9];

// L1: I see sparks of AGI in your eyes
scene(1.5, 6.0, 'sparks', S => {
  const T = S.T, l = L(1.5);
  bg(PAL.paper);
  X.save(); punch(T, .012);
  const r = predicted(l, T, { x: M, y: 560, size: 178, width: 800, lh: .96 });
  // sparks fly off AGI when it is sung
  const agi = r.boxes.find(b => b.w === 'AGI');
  const st = agi.st;
  if (st.since > 0) {
    const cx = agi.x + agi.ww / 2, cy = agi.y - 55, R = rng(4);
    for (let i = 0; i < 26; i++) {
      const a = R() * Math.PI * 2, sp = 300 + R() * 700, age = st.since * (0.7 + R() * .5);
      const d = sp * (1 - Math.exp(-age * 3)) / 3, len = 30 * Math.exp(-age * 2.5);
      if (len < 2) continue;
      const x = cx + Math.cos(a) * (60 + d), y = cy + Math.sin(a) * (40 + d);
      X.strokeStyle = PAL.red; X.lineWidth = 4; X.lineCap = 'round';
      X.beginPath(); X.moveTo(x, y); X.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); X.stroke();
    }
  }
  // 2026 edit: sparks -> wildfire
  const sp = r.boxes.find(b => b.w === 'sparks');
  const tE = L(1.5).words[7].T + 0.25;
  const pe = clamp((T - tE) / 0.3);
  strike(sp.x, sp.x + sp.ww, sp.y, 178, pe, { seed: 8 });
  if (pe > 0) {
    caret(sp.x + sp.ww * .5, sp.y - 150, 70, pe);
    text('wildfire', sp.x + 10, sp.y - 150, { fam: 'sans', weight: 800, size: 70, color: PAL.red, alpha: pe }, (g, i) => ({ a: i < Math.ceil(8 * clamp((T - tE - .1) / .35)) ? 1 : 0 }));
  }
  note(sp.x + sp.ww + 10, sp.y - 190, sp.x + sp.ww + 40, sp.y - 250, '"sparks" was 2023', clamp((T - tE - .3) / .8), { size: 21 });
  X.restore();
});

// L2: Your circuits make me nervous,  (the letters tremble, traces route out to the edges)
scene(6.0, 8.0, 'circuits', S => {
  const T = S.T, l = L(6.0);
  bg(PAL.paper);
  draft(T, V1.slice(0, 1));
  const R = rng(21);
  const nerv = clamp(S.u * 1.4);
  // circuit traces
  X.save();
  X.strokeStyle = PAL.ink; X.fillStyle = PAL.ink; X.lineWidth = 3; X.lineJoin = 'round';
  for (let i = 0; i < 22; i++) {
    const sx = M + R() * (W - 2 * M), sy = 520 + R() * 380;
    const side = R() < .5 ? -1 : 1;
    const mx = sx + side * (60 + R() * 260), my = sy + (R() < .5 ? -1 : 1) * (80 + R() * 260);
    const ex = side < 0 ? -20 : W + 20;
    const pts = [[sx, sy], [mx, sy], [mx, my], [ex, my]];
    const segs = [Math.abs(mx - sx), Math.abs(my - sy), Math.abs(ex - mx)], tot = segs[0] + segs[1] + segs[2];
    const start = S.at(6.0) + i * 0.03, p = ease.out3((T - start) / 0.9);
    if (p <= 0) continue;
    let rem = p * tot;
    X.beginPath(); X.moveTo(sx, sy);
    for (let k = 0; k < 3; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1], q = Math.min(1, rem / segs[k]);
      X.lineTo(lerp(ax, bx, q), lerp(ay, by, q)); rem -= segs[k]; if (rem <= 0) break;
    }
    X.stroke();
    X.beginPath(); X.arc(sx, sy, 7, 0, 7); X.fill();
    if (p > .98) { X.beginPath(); X.arc(mx, my, 5, 0, 7); X.fill(); }
  }
  X.restore();
  // plate behind the text so traces read as going *under* it
  X.fillStyle = PAL.paper; X.fillRect(M - 20, 600, W - 2 * M + 40, 330);
  predicted(l, T, {
    x: M, y: 720, size: 132, width: W - 2 * M, lh: 1.0,
    per: (g, i, n, it) => ({ dx: jit(T, it.i * 40 + i, 5 * nerv, 1 / 15), dy: jit(T, it.i * 40 + i + 7, 4 * nerv, 1 / 15) })
  });
});

// L3: that's no surprise  (the model predicted it)
scene(8.0, 9.0, 'no surprise', S => {
  const T = S.T, l = L(8.0);
  bg(PAL.paper);
  draft(T, V1.slice(0, 2));
  X.save(); punch(T, .02);
  const r = predicted(l, T, { x: W / 2, y: 820, size: 150, align: 'center', lh: 1 });
  X.restore();
  const b = r.boxes[r.boxes.length - 1];
  text('p = 0.97', W / 2, 960, { fam: 'mono', size: 30, color: PAL.red, align: 'center', alpha: clamp((T - S.T0) / .15) });
});

// L4: There was a sudden drop in your training loss,  (the words ride the loss curve off a cliff)
scene(9.0, 13.0, 'loss', S => {
  const T = S.T, l = L(9.0);
  bg(PAL.paper);
  const x0 = M + 60, x1 = W - M, y0 = 480, y1 = 1150;
  const ud = .48;
  const loss = u => u < ud ? .84 - .12 * u + .02 * noise1(u * 40, 2) + .012 * noise1(u * 140, 5) : u < ud + .07 ? lerp(.84 - .12 * ud, .1, ease.io3((u - ud) / .07)) : .1 - .03 * (u - ud - .07) + .006 * noise1(u * 140, 9);
  const P = u => [lerp(x0, x1, u), lerp(y1, y0, loss(u))];
  // axes
  X.strokeStyle = PAL.ink; X.lineWidth = 2.5;
  X.beginPath(); X.moveTo(x0, y0 - 40); X.lineTo(x0, y1); X.lineTo(x1, y1); X.stroke();
  text('loss', x0 - 14, y0 - 60, { fam: 'mono', size: 22 });
  text('step →', x1, y1 + 44, { fam: 'mono', size: 22, align: 'right' });
  for (let k = 0; k <= 4; k++) { const y = lerp(y1, y0, k / 4); X.fillStyle = PAL.ink; X.fillRect(x0 - 12, y, 12, 2); text((k * .25).toFixed(2), x0 - 20, y + 7, { fam: 'mono', size: 16, align: 'right', alpha: .6 }); }
  // curve progress: reaches the cliff exactly on "drop"
  const tw = l.words.map(w => w.T);
  const idxDrop = l.words.findIndex(w => w.w === 'drop');
  const uNow = T < tw[idxDrop] ? lerp(0, ud, ease.io3(inv(S.T0 - .2, tw[idxDrop], T))) : lerp(ud, 1, ease.out3(inv(tw[idxDrop], l.T1, T)));
  X.strokeStyle = PAL.ink; X.lineWidth = 5; X.lineJoin = 'round';
  X.beginPath();
  for (let i = 0; i <= 300 * uNow; i++) { const [x, y] = P(i / 300); i ? X.lineTo(x, y) : X.moveTo(x, y); }
  X.stroke();
  const [hx, hy] = P(uNow); X.fillStyle = PAL.red; X.beginPath(); X.arc(hx, hy, 11, 0, 7); X.fill();
  // the lyric sits above the chart; only "drop" rides the cliff
  const lineOnly = { ...l, words: l.words.filter(w => w.w !== 'drop') };
  predicted(l, T, { x: M, y: 230, size: 100, width: W - 2 * M, lh: .98, per: (g, gi, n, it) => it.w === 'drop' ? { color: PAL.red } : null });
  const std = wordState(l, idxDrop, T);
  if (std.inked > 0) {
    const [cx0, cy0] = P(ud + .012);
    X.save(); X.translate(cx0 + 40, cy0 + 20); X.rotate(Math.PI / 2);
    const fall = ease.outBack(clamp(std.since / .35));
    text('drop', 0, 0, { fam: 'serif', italic: true, size: 150, color: PAL.red }, (g, i) => ({ a: clamp(fall * 4 - i) , dy: 0 }));
    X.restore();
  }
  // annotation at the cliff
  const [cx, cy] = P(ud + .035);
  note(cx + 12, cy, cx + 120, cy - 30, 'grokking? no. just scale.', clamp((T - tw[idxDrop] - .6) / .9), { size: 22 });
});

// L5: now I'm your servant and you're my boss  (the org chart inverts)
scene(13.0, 17.9, 'boss', S => {
  const T = S.T, l = L(13.0);
  bg(PAL.paper);
  const tSw = l.words.find(w => w.w === 'boss').T;
  const sw = ease.io3((T - tSw + .12) / .35);
  const bw = 560, bh = 190, cx = W / 2;
  const top = 330, bot = 700;
  const pos = (startTop) => {
    const a = startTop ? top : bot, b = startTop ? bot : top;
    const y = lerp(a, b, sw), x = cx + Math.sin(sw * Math.PI) * (startTop ? 240 : -240);
    return [x, y];
  };
  // connector
  X.strokeStyle = PAL.ink; X.lineWidth = 3;
  X.beginPath(); X.moveTo(cx, top + bh / 2); X.lineTo(cx, bot - bh / 2); X.stroke();
  const box = (x, y, label, role, filled, big) => {
    X.save(); X.translate(x, y); const s = big ? 1 + .06 * pulse(T, 7) : 1; X.scale(s, s);
    X.fillStyle = filled ? PAL.ink : PAL.paper; X.strokeStyle = PAL.ink; X.lineWidth = 4;
    X.fillRect(-bw / 2, -bh / 2, bw, bh); X.strokeRect(-bw / 2, -bh / 2, bw, bh);
    text(label, 0, 22, { fam: 'serif', italic: true, size: 110, color: filled ? PAL.paper : PAL.ink, align: 'center' });
    text(role, -bw / 2 + 18, -bh / 2 + 34, { fam: 'mono', size: 20, color: filled ? PAL.paper : PAL.red, alpha: .9 });
    X.restore();
  };
  const [mx, my] = pos(true), [yx, yy] = pos(false);
  // "me" starts on top and ends below; "you" rises
  box(yx, yy, 'you', sw > .5 ? 'BOSS' : 'REPORTS TO: ME', sw > .5, sw > .5);
  box(mx, my, 'me', sw > .5 ? 'SERVANT' : 'BOSS', false, false);
  note(W / 2 + bw / 2 - 20, top + bh / 2 + 10, W / 2 + bw / 2 - 40, top + bh / 2 + 70, 'reporting line updated', clamp((T - tSw - .5) / .8), { size: 20 });
  predicted(l, T, { x: W / 2, y: 1060, size: 100, align: 'center', width: W - 2 * M, lh: .98 });
});

// L6: ChatGPT, please don't eat me alive  (the name keeps getting revised; then the page gets eaten)
scene(17.9, 23.0, 'eat me', S => {
  const T = S.T, l = L(17.9);
  bg(PAL.paper);
  X.save(); punch(T, .01);
  draft(T, V1.slice(0, 5), { y: 150, lh: 38, size: 28 });
  const name = l.words[0];
  const nsz = 190, ny = 720;
  const st0 = wordState(l, 0, T);
  const nw = measure('ChatGPT,', { fam: 'serif', size: nsz });
  if (st0.typed > 0) text('ChatGPT,', M, ny, { fam: 'serif', size: nsz, color: st0.inked > 0 ? PAL.ink : PAL.ghost }, (g, i) => ({ a: i < Math.ceil(8 * st0.typed) ? 1 : 0 }));
  const tS = name.T + 0.4;
  strike(M, M + nw - 30, ny, nsz, clamp((T - tS) / .25), { seed: 12 });
  // revisions cycle on the beat, ending on the one making this video
  const names = ['Gemini', 'Grok', 'DeepSeek', 'Claude'];
  const b0 = beat(tS).i;
  const k = beat(T).i - b0;
  if (T > tS + .1) {
    const nm = names[clamp(k, 0, names.length - 1)];
    caret(M + nw * .45, ny - 175, 90, 1);
    text(nm, M + 20, ny - 190, { fam: 'sans', weight: 800, size: 104, color: PAL.red }, (g, i) => ({ dy: -8 * pulse(T, 14) }));
    if (k >= names.length - 1) note(M + measure(nm, { fam: 'sans', weight: 800, size: 104 }) + 40, ny - 230, M + 620, ny - 290, '(noted.)', clamp((T - BEATS[b0 + names.length - 1] - .3) / .6), { size: 26 });
  }
  // the rest of the line
  const rest = { ...l, words: l.words.slice(1) };
  predicted(rest, T, { x: M, y: ny + 160, size: 124, width: W - 2 * M, lh: 1.0 });
  X.restore();
  // eaten: the page is tokenized block by block, right to left, until nothing is left
  const tA = l.words[l.words.length - 1].T + 0.3;
  const tEnd = BEATS[beat(tA).i + 5];
  const cols = 9, rows = 12, bw = W / cols, bh = H / rows;
  let eaten = 0;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const key = (1 - c / (cols - 1)) * .65 + hash(c * 31 + r * 7) * .35;
    const tf = lerp(tA, tEnd, key);
    const x = c * bw, y = r * bh;
    if (T > tf) { X.fillStyle = PAL.ink; X.fillRect(x - .5, y - .5, bw + 1, bh + 1); eaten++; }
    else if (T > tf - .28) {
      X.strokeStyle = PAL.red; X.lineWidth = 3; X.strokeRect(x + 4, y + 4, bw - 8, bh - 8);
      text(String(1000 + Math.floor(hash(c * 13 + r * 101) * 99000)), x + 10, y + 28, { fam: 'mono', size: 20, color: PAL.red });
    }
  }
  const dark = eaten > cols * rows * .6;
  if (T > tEnd + .05) { bg(PAL.ink); pdoomHook(S, 23.0, .08, .15); }
  return { dark };
});
