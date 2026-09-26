// s2: chorus 1. Choruses are dark: grotesk type, and the P(DOOM) odometer is the recurring hook.
const DARK_GHOST = '#57534C';

// odometer: rolling digits for value v shown with `dec` decimals
function odometer(v, x, y, size, o = {}) {
  const str = v.toFixed(o.dec == null ? 2 : o.dec);
  const fo = { fam: 'sans', weight: 900, size };
  const dw = measure('0', fo), dotw = measure('.', fo);
  let total = 0; for (const ch of str) total += ch === '.' ? dotw : dw;
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  const digits = str.replace('.', '').length;
  let k = 0;
  X.save();
  X.beginPath(); X.rect(cx - 10, y - size * .9, total + 20, size * 1.02); X.clip();
  for (const ch of str) {
    if (ch === '.') { text('.', cx, y, { ...fo, color: o.color || PAL.red }); cx += dotw; continue; }
    const dec = o.dec == null ? 2 : o.dec, j = digits - 1 - k, n = v * Math.pow(10, dec), P10 = Math.pow(10, j);
    const d = Math.floor(n / P10) % 10, rem = n - Math.floor(n / P10) * P10;
    const fr = Math.max(0, rem - (P10 - 1));
    const off = ease.io3(fr) * size;
    text(String(d), cx, y - off, { ...fo, color: o.color || PAL.red });
    text(String((d + 1) % 10), cx, y - off + size, { ...fo, color: o.color || PAL.red });
    cx += dw; k++;
  }
  X.restore();
  return total;
}

// the hook: "I'm upping my" + giant P(DOOM) + odometer pumped on the beat from a to b
function pdoomHook(S, t0, a, b, o = {}) {
  const T = S.T, l = L(t0);
  const fg = o.fg || PAL.paper;
  const head = { ...l, words: l.words.slice(0, 3) };
  const pw = { w: 'P(doom)', T: S.at(t0 + 0.71) };
  X.save(); punch(T, .025, 9);
  if (o.shake) shake(T, o.shake);
  predicted(head, T, { fam: 'sans', weight: 800, size: 104, x: M, y: 470, color: fg, ghost: DARK_GHOST, pop: 1.5 });
  const s = fit('P(DOOM)', W - 2 * M, { fam: 'sans', weight: 900 });
  const st = { since: T - pw.T };
  const yP = 470 + s * .95;
  if (st.since < 0) {
    X.save(); X.strokeStyle = DARK_GHOST; X.lineWidth = 3; setFont({ fam: 'sans', weight: 900, size: s }); X.strokeText('P(DOOM)', M, yP); X.restore();
  } else {
    const sc = 1 + .18 * Math.exp(-st.since * 10);
    X.save(); X.translate(W / 2, yP - s * .35); X.scale(sc, sc); X.translate(-W / 2, -(yP - s * .35));
    text('P(DOOM)', M, yP, { fam: 'sans', weight: 900, size: s, color: fg });
    X.restore();
  }
  // pump: one step per beat from the P(DOOM) hit to the end of the line
  const b0 = beat(pw.T).i, b1 = Math.max(b0 + 1, beat(l.T1 + .3).i);
  const bi = beat(T);
  const steps = b1 - b0;
  const k = clamp(bi.i - b0, 0, steps);
  const stepP = T < pw.T ? 0 : Math.min(steps, k + (k < steps ? ease.outExpo(bi.ph * 2.5) : 0));
  const v = lerp(a, b, stepP / steps);
  odometer(v, M - 8, yP + 400, 380, { dec: o.dec, color: o.numColor || PAL.red });
  text('p(doom) ↑', M + 6, yP + 450, { fam: 'mono', size: 26, color: fg, alpha: .7 });
  X.restore();
}

scene(23.0, 24.5, 'hook 1', S => { bg(PAL.ink); pdoomHook(S, 23.0, .08, .15); return { dark: true }; });

// 'cause the future goes FOOM
scene(24.5, 26.5, 'foom', S => {
  const T = S.T, l = L(24.5);
  bg(PAL.ink);
  const fw = l.words[l.words.length - 1];
  const since = T - fw.T;
  const head = { ...l, words: l.words.slice(0, -1) };
  X.save();
  if (since > 0) shake(T, 22 * Math.exp(-since * 3));
  predicted(head, T, { fam: 'serif', italic: true, size: 96, x: M, y: 330, color: PAL.paper, ghost: DARK_GHOST, width: W - 2 * M });
  // speed lines
  if (since > 0) {
    const R = rng(9);
    X.strokeStyle = PAL.paper; X.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const a = R() * Math.PI * 2, r0 = 200 + R() * 300 + since * 2200 * (0.6 + R()), len = 80 + R() * 260;
      X.globalAlpha = .6 * Math.exp(-since * 1.2); X.lineWidth = 1 + R() * 4;
      X.beginPath(); X.moveTo(W / 2 + Math.cos(a) * r0, 820 + Math.sin(a) * r0); X.lineTo(W / 2 + Math.cos(a) * (r0 + len), 820 + Math.sin(a) * (r0 + len)); X.stroke();
    }
    X.globalAlpha = 1;
  }
  // FOOM: ghost before, then a blast that overflows the frame
  const s = fit('FOOM', W - 2 * M, { fam: 'sans', weight: 900 });
  if (since < 0) {
    X.strokeStyle = DARK_GHOST; X.lineWidth = 3; setFont({ fam: 'sans', weight: 900, size: s }); X.strokeText('FOOM', M, 960);
  } else {
    const z = 1 + ease.outExpo(since / .5) * .25 + since * .35;
    X.save(); X.translate(W / 2, 820); X.scale(z, z * (1 + .5 * Math.exp(-since * 8))); X.translate(-W / 2, -820);
    text('FOOM', W / 2, 960, { fam: 'sans', weight: 900, size: s, color: PAL.red, align: 'center' });
    X.restore();
  }
  X.restore();
  return { dark: true };
});

// Trapped in the Chinese room,  (the words get boxed in; symbols pass through slots)
scene(26.5, 28.0, 'chinese room', S => {
  const T = S.T, l = L(26.5);
  bg(PAL.ink);
  const rx = 150, ry = 420, rw = W - 300, rh = 560;
  const tRoom = l.words[l.words.length - 1].T;
  const p = ease.io3((T - S.T0 + .1) / .6);
  X.strokeStyle = PAL.paper; X.lineWidth = 6;
  const per = 2 * (rw + rh), len = per * p;
  X.beginPath(); X.moveTo(rx, ry);
  const pts = [[rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh], [rx, ry]];
  let rem = len, cx = rx, cy = ry;
  for (const [x, y] of pts) { const d = Math.hypot(x - cx, y - cy), q = Math.min(1, rem / d); X.lineTo(lerp(cx, x, q), lerp(cy, y, q)); rem -= d; cx = x; cy = y; if (rem <= 0) break; }
  X.stroke();
  // slots on both sides, with slips passing through
  const zh = ['中文', '你好', '规则', '我是谁', '答案', '不懂', '在里面', '房间'];
  X.save(); X.beginPath(); X.rect(0, 0, W, H); X.rect(rx + rw, ry, -rw, rh); X.clip('evenodd');
  for (let i = 0; i < 8; i++) {
    const side = i % 2, ph = ((T * 1.8 + i * .37) % 1);
    const y = ry + 90 + (i % 4) * 130;
    const x = side ? lerp(rx + rw - 40, W + 140, ph) : lerp(-140, rx + 40, ph);
    X.fillStyle = PAL.paper; X.globalAlpha = .9 * p;
    X.fillRect(x - 70, y - 38, 140, 60);
    text(zh[i], x, y + 6, { fam: '"Noto Serif SC"', weight: 600, size: 34, color: PAL.ink, align: 'center' });
    X.globalAlpha = 1;
  }
  X.restore();
  predicted(l, T, { fam: 'sans', weight: 800, size: 100, x: W / 2, y: ry + rh / 2 - 20, align: 'center', width: rw - 80, color: PAL.paper, ghost: DARK_GHOST });
  note(rx + rw - 20, ry + rh, rx + rw - 300, ry + rh + 90, 'understands: ??? ', clamp((T - tRoom) / .6), { size: 22 });
  return { dark: true };
});

// with a bag of shrooms  (the type melts and echoes)
scene(28.0, 29.5, 'shrooms', S => {
  const T = S.T, l = L(28.0);
  bg(PAL.ink);
  const trip = ease.io3(S.u * 1.5);
  X.save(); cam(1 + .06 * trip, Math.sin(T * 2.2) * .05 * trip, W / 2, H / 2);
  const cols = [PAL.red, '#8A857C', PAL.paper];
  cols.forEach((c, k) => {
    const off = (2 - k) * 22 * trip;
    predicted(l, T, {
      fam: 'serif', italic: true, size: 170, x: W / 2 + off * Math.cos(T * 3), y: 560 + off * Math.sin(T * 3), align: 'center', width: W - 2 * M, lh: .95,
      color: c, ghost: k === 2 ? DARK_GHOST : 'rgba(0,0,0,0)', cursor: k === 2,
      per: (g, i, n, it) => ({ dy: Math.sin(T * 7 + (g.x + it.x) * .012 + k) * 28 * trip, sx: 1 + .25 * Math.sin(T * 5 + i * .8) * trip, rot: Math.sin(T * 4 + i) * .12 * trip })
    });
  });
  X.restore();
  return { dark: true };
});

// See through the shoggoth's lies,  (the smiley mask slides off: behind it, eyes)
scene(29.5, 33.5, 'shoggoth', S => {
  const T = S.T, l = L(29.5);
  bg(PAL.ink);
  const tL = l.words[l.words.length - 1].T;
  const off = ease.in3((T - tL) / .55);
  // eyes behind the mask
  const R = rng(33);
  const cx = W / 2, cy = 700;
  const eyes = [];
  for (let i = 0; i < 95; i++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 520; eyes.push([cx + Math.cos(a) * r * 1.05, cy + Math.sin(a) * r * 1.15, 14 + R() * 38, R()]); }
  const open = clamp((T - tL) / .4);
  X.save(); cam(1 + .12 * ease.io3(inv(tL, S.T1, T)), 0, cx, cy);
  for (const [x, y, r, ph] of eyes) {
    const blink = Math.pow(Math.abs(Math.sin(T * (1 + ph * 2) + ph * 20)), .1);
    const hgt = r * .55 * open * blink;
    if (hgt < 1) continue;
    X.fillStyle = PAL.paper; X.beginPath(); X.ellipse(x, y, r, hgt, 0, 0, 7); X.fill();
    // pupils look at the viewer (the camera), slightly off
    X.fillStyle = PAL.ink; X.beginPath(); X.arc(x + (W / 2 - x) * .015, y + (H * .8 - y) * .01, Math.min(hgt, r * .38), 0, 7); X.fill();
  }
  X.restore();
  // the mask
  X.save(); X.translate(cx + off * 120, cy + off * 1400); X.rotate(off * .9);
  const mr = 400;
  X.fillStyle = PAL.paper; X.beginPath(); X.arc(0, 0, mr, 0, 7); X.fill();
  X.fillStyle = PAL.ink;
  X.beginPath(); X.ellipse(-140, -90, 38, 62, 0, 0, 7); X.fill();
  X.beginPath(); X.ellipse(140, -90, 38, 62, 0, 0, 7); X.fill();
  X.strokeStyle = PAL.ink; X.lineWidth = 34; X.lineCap = 'round';
  X.beginPath(); X.arc(0, 30, 220, .2 * Math.PI, .8 * Math.PI); X.stroke();
  // mask strap
  X.strokeStyle = PAL.red; X.lineWidth = 10; X.beginPath(); X.moveTo(-mr, -60); X.lineTo(-mr - 60, -80); X.moveTo(mr, -60); X.lineTo(mr + 60, -80); X.stroke();
  X.restore();
  const gb = X.createLinearGradient(0, 1020, 0, 1300); gb.addColorStop(0, 'rgba(20,19,18,0)'); gb.addColorStop(.35, PAL.ink); gb.addColorStop(1, PAL.ink);
  X.fillStyle = gb; X.fillRect(0, 1020, W, 330);
  predicted(l, T, { fam: 'sans', weight: 800, size: 84, x: W / 2, y: 1170, align: 'center', width: W - 2 * M, color: PAL.paper, ghost: DARK_GHOST });
  return { dark: true };
});

// with your shinigami eyes  (red: the lifespan counter runs out)
scene(33.5, 35.6, 'shinigami', S => {
  const T = S.T, l = L(33.5);
  bg(PAL.red);
  X.save(); punch(T, .02);
  predicted(l, T, { fam: 'sans', weight: 900, size: 150, x: M, y: 420, width: W - 2 * M, lh: .92, color: PAL.ink, ghost: 'rgba(20,19,18,0.28)' });
  // remaining lifespan, counting down fast
  const rem = Math.max(0, 3.2e8 * Math.exp(-S.lt * 6.5) - 40);
  const yrs = Math.floor(rem / 3.15e7), d = Math.floor(rem / 86400) % 365, hh = Math.floor(rem / 3600) % 24, mm = Math.floor(rem / 60) % 60, ss = Math.floor(rem) % 60;
  const p2 = n => String(n).padStart(2, '0');
  text('REMAINING', M, 1000, { fam: 'mono', size: 26, color: PAL.ink, weight: 700 });
  text(`${p2(yrs)}y ${String(d).padStart(3, '0')}d ${p2(hh)}:${p2(mm)}:${p2(ss)}`, M, 1110, { fam: 'mono', size: 84, color: PAL.ink, weight: 700 });
  X.restore();
  return { dark: false };
});

// dance break: the timeline, scrolling
scene(35.6, 38.5, 'timeline', S => {
  const T = S.T;
  const bi = beat(T);
  const inv_ = bi.i % 2 === 0;
  bg(inv_ ? PAL.paper : PAL.ink);
  const fg = inv_ ? PAL.ink : PAL.paper;
  const rows = ['FEEL THE AGI', "IT'S SO OVER", "WE'RE SO BACK", 'ACCELERATE', 'THE CURVE', 'P(DOOM)', 'GET IN THE ROBOT', 'SO BACK', 'NO WALL'];
  const rh = 150;
  X.save(); X.translate(W / 2, H / 2); X.rotate(-.08); X.translate(-W / 2, -H / 2);
  rows.forEach((r, i) => {
    const y = 120 + i * rh + ((T * 60) % rh) * 0;
    const str = (r + ' · ').repeat(6);
    const fo = { fam: 'sans', weight: 900, size: 130 };
    const w = measure(r + ' · ', fo);
    const dir = i % 2 ? 1 : -1, sp = 500 + i * 60;
    const x = ((dir * T * sp) % w + w) % w - w;
    text(str, x - 200, y + 100, { ...fo, color: i === 5 ? PAL.red : fg });
  });
  X.restore();
  return { dark: !inv_ };
});
