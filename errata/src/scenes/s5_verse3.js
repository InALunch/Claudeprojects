// s5: verse 3. Paper again, but the page is starting to behave on its own.

// Forward MLP, backward, repeat
scene(73.0, 77.5, 'mlp', S => {
  const T = S.T, l = L(73.0);
  bg(PAL.paper);
  predicted(l, T, { fam: 'serif', size: 104, x: M, y: 260, width: W - 2 * M, lh: .98 });
  const layers = [4, 6, 6, 3], x0 = M + 60, x1 = W - M - 60, y0 = 560, y1 = 1120;
  const pos = (li, ni) => [lerp(x0, x1, li / (layers.length - 1)), lerp(y0, y1, (ni + .5) / layers[li])];
  const tF = l.words[0].T, tB = l.words[2].T, tR = l.words[3].T;
  // pulse position in layer units (0..3): forward, backward, then ping-pong faster and faster
  let ph = 0, dir = 1;
  if (T < tB) { ph = 3 * ease.io3(inv(tF, tB - .1, T)); dir = 1; }
  else if (T < tR) { ph = 3 * (1 - ease.io3(inv(tB, tR - .1, T))); dir = -1; }
  else { const e = T - tR, f = 1.4 + e * 3.5, c = e * f; const k = c % 2; ph = 3 * (k < 1 ? k : 2 - k); dir = k < 1 ? 1 : -1; }
  X.lineWidth = 1.6;
  for (let li = 0; li < layers.length - 1; li++) for (let a = 0; a < layers[li]; a++) for (let b = 0; b < layers[li + 1]; b++) {
    const [ax, ay] = pos(li, a), [bx, by] = pos(li + 1, b);
    const hot = Math.abs(ph - (li + .5)) < .5;
    X.strokeStyle = hot ? PAL.red : PAL.ink; X.globalAlpha = hot ? .8 : .25;
    X.beginPath(); X.moveTo(ax, ay); X.lineTo(bx, by); X.stroke();
  }
  X.globalAlpha = 1;
  layers.forEach((n, li) => { for (let ni = 0; ni < n; ni++) { const [x, y] = pos(li, ni); const hot = Math.abs(ph - li) < .35; X.fillStyle = hot ? PAL.red : PAL.paper; X.strokeStyle = PAL.ink; X.lineWidth = 4; X.beginPath(); X.arc(x, y, hot ? 30 : 24, 0, 7); X.fill(); X.stroke(); } });
  text(dir > 0 ? 'forward →' : '← backward', W / 2, y1 + 110, { fam: 'mono', size: 30, align: 'center', color: PAL.red });
});

// Now von Neumann's obsolete
scene(77.5, 81.4, 'von neumann', S => {
  const T = S.T, l = L(77.5);
  bg(PAL.paper);
  predicted(l, T, { fam: 'serif', size: 116, x: M, y: 270, width: W - 2 * M, lh: .98 });
  // museum placard
  const px = M + 40, py = 560, pw = W - 2 * M - 80, ph = 520;
  X.fillStyle = '#E4DFD4'; X.fillRect(px, py, pw, ph); X.strokeStyle = PAL.ink; X.lineWidth = 2; X.strokeRect(px, py, pw, ph);
  text('The von Neumann architecture', px + 40, py + 80, { fam: 'serif', italic: true, size: 58 });
  text('c. 1945 · stored-program computer', px + 40, py + 130, { fam: 'mono', size: 22, alpha: .7 });
  // CPU <-> memory diagram
  const by = py + 230;
  X.lineWidth = 3; X.strokeRect(px + 60, by, 240, 140); X.strokeRect(px + pw - 300, by, 240, 140);
  text('CPU', px + 180, by + 85, { fam: 'mono', size: 34, align: 'center' });
  text('MEMORY', px + pw - 180, by + 85, { fam: 'mono', size: 34, align: 'center' });
  const f = (T * 3) % 1;
  X.beginPath(); X.moveTo(px + 310, by + 70); X.lineTo(px + pw - 310, by + 70); X.stroke();
  X.fillStyle = PAL.ink; X.beginPath(); X.arc(lerp(px + 310, px + pw - 310, f), by + 70, 8, 0, 7); X.fill();
  text('the bottleneck', W / 2, by + 50, { fam: 'mono', size: 20, align: 'center', alpha: .6 });
  // OBSOLETE stamp on the word
  const tO = l.words[l.words.length - 1].T;
  const sp = clamp((T - tO) / .1);
  if (sp > 0) {
    X.save(); X.translate(W / 2, py + ph - 60); X.rotate(-.1); const z = lerp(2, 1, ease.outExpo(sp)); X.scale(z, z);
    X.strokeStyle = PAL.red; X.lineWidth = 9; X.strokeRect(-300, -75, 600, 128);
    text('OBSOLETE', 0, 20, { fam: 'sans', weight: 900, size: 100, color: PAL.red, align: 'center' });
    X.restore();
  }
});

// Sharp left turn and there you are
scene(81.4, 85.0, 'left turn', S => {
  const T = S.T, l = L(81.4);
  bg(PAL.paper);
  const tT = l.words[2].T;
  const r = ease.io3((T - tT) / .22);
  X.save();
  cam(1 - .35 * r, -Math.PI / 2 * r, W / 2, H / 2);
  // motion smear during the turn
  const head = { ...l, words: l.words.slice(0, 3) };
  predicted(head, T, { fam: 'sans', weight: 900, size: 160, x: M, y: 620, width: W - 2 * M, lh: .92 });
  X.restore();
  if (r > 0 && r < 1) { X.fillStyle = PAL.paper; X.globalAlpha = .35 * Math.sin(r * Math.PI); X.fillRect(0, 0, W, H); X.globalAlpha = 1; }
  // after the turn, upright again: there you are
  if (T > tT + .2) {
    const tail = { ...l, words: l.words.slice(3) };
    predicted(tail, T, { fam: 'serif', italic: true, size: 110, x: W - M, y: 1080, align: 'right', color: PAL.ink });
    const you = l.words[5];
    const a = clamp((T - you.T) / .2);
    X.fillStyle = PAL.red; X.globalAlpha = a; X.beginPath(); X.arc(W - M - 30, 900, 20 + 8 * pulse(T, 6), 0, 7); X.fill(); X.globalAlpha = 1;
    note(W - M - 50, 900, W - M - 320, 880, 'you', a, { size: 24 });
  }
});

// Without a single CDR  (Lisp's cdr: how AI was supposed to work, before it just... didn't need to)
scene(85.0, 89.4, 'cdr', S => {
  const T = S.T, l = L(85.0);
  bg(PAL.paper);
  predicted(l, T, { fam: 'serif', size: 116, x: M, y: 270, width: W - 2 * M, lh: .98 });
  const code = [
    ';; how AI was supposed to work',
    '(defun reason (facts goal)',
    '  (cond ((null facts) nil)',
    '        ((matches (car facts) goal) t)',
    '        (t (reason (cdr facts) goal))))',
  ];
  const fo = { fam: 'mono', size: 36 };
  const y0 = 520, lh = 62, tC = l.words[l.words.length - 1].T;
  const hot = clamp((T - tC) / .12);
  const b0 = beat(tC).i + 1;
  code.forEach((ln, i) => {
    const y = y0 + i * lh;
    const typed = Math.floor(ln.length * clamp((T - S.T0 - .1 - i * .18) / .35));
    if (typed <= 0) return;
    const shown = ln.slice(0, typed);
    text(shown, M, y, { ...fo, color: i === 0 ? PAL.dim : PAL.ink, alpha: .85 });
    // on "CDR", every cdr lights up red
    let k = shown.indexOf('cdr');
    while (k >= 0 && hot > 0) { text('cdr', M + measure(shown.slice(0, k), fo), y, { ...fo, weight: 700, color: PAL.red, alpha: hot }); k = shown.indexOf('cdr', k + 1); }
    // then the program is struck out, a line per beat
    const bt = BEATS[b0 + Math.max(0, i - 1)] || 1e9;
    if (i > 0) strike(M, M + measure(ln, fo), y, 36, clamp((T - bt) / .15), { seed: i + 30, w: 5 });
  });
  note(M + 380, y0 + 4 * lh + 20, M - 10, y0 + 5 * lh + 60, 'GOFAI, 1958–. turned out optional.', clamp((T - (BEATS[b0 + 4] || 1e9)) / .7));
  const a = clamp((T - tC) / .15);
  text('0', W - M, 1230, { fam: 'sans', weight: 900, size: 230, color: PAL.red, align: 'right', alpha: a });
  text('(cdr ...) calls in a transformer', W - M, 1010, { fam: 'mono', size: 28, color: PAL.red, align: 'right', alpha: a });
});

// Gato, please don't let me go  (the words hang by threads; the threads go)
scene(89.4, 95.4, 'gato', S => {
  const T = S.T, l = L(89.4);
  bg(PAL.paper);
  const fo = { fam: 'serif', size: 124 };
  const rows = ['Gato, please', "don't let me go"];
  const tG = l.words[l.words.length - 1].T;
  const b0 = beat(tG).i + 1;
  let gi = 0;
  const all = [];
  rows.forEach((row, ri) => {
    const lay = layout(row, fo);
    const x0 = W / 2 - lay.width / 2, y = 700 + ri * 170;
    lay.glyphs.forEach(g => { if (g.ch !== ' ') all.push({ g, x: x0 + g.x + g.w / 2, y, ri, k: gi }); gi++; });
  });
  // map glyphs to words for inking
  let wi = 0; const gw = [];
  rows.join(' ').split('').forEach(ch => { if (ch === ' ') wi++; gw.push(wi); });
  all.forEach((o, n) => {
    const st = wordState(l, Math.min(gw[o.k], l.words.length - 1), T);
    if (st.typed <= 0) return;
    // threads snap in random order, several per beat, accelerating
    const order = Math.floor(hash(n * 31 + 7) * all.length);
    const bt = BEATS[b0 + Math.floor(order / 3)] || 1e9;
    const f = Math.max(0, T - bt - (order % 3) * .07);
    const sway = Math.sin(T * 3 + n) * 4;
    const dy = 1800 * f * f, rot = f * (hash(n) - .5) * 8;
    const topY = o.y - 110 - o.ri * 170 - 40;
    if (f === 0) { X.strokeStyle = PAL.ink; X.globalAlpha = .45; X.lineWidth = 1.5; X.beginPath(); X.moveTo(o.x + sway, 0); X.lineTo(o.x + sway, o.y - 90); X.stroke(); X.globalAlpha = 1; }
    X.save(); X.translate(o.x + sway, o.y - 40 + dy); X.rotate(rot + sway * .01);
    text(o.g.ch, -o.g.w / 2, 40, { ...fo, color: st.inked > 0 ? PAL.ink : PAL.ghost });
    X.restore();
  });
  note(M + 30, 540, M + 10, 440, 'Gato (2022), a generalist agent', clamp((T - l.words[0].T - .3) / .8), { size: 20 });
  // once everything has fallen, the chorus is already waiting
  const lastFall = BEATS[b0 + Math.ceil(all.length / 3)] + .5;
  if (T > lastFall) { bg(PAL.ink); pdoomHook(S, 95.4, .34, .61); return { dark: true }; }
  return { dark: false };
});
