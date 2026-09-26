// engine.js: time, beats, easing, type, redlines, paper, HUD and scene dispatch.
// Everything is a pure function of final (warped) time T, so any frame can be rendered in isolation.
'use strict';
const W = 1080, H = 1350, FPS = 30;
const CV = document.getElementById('c');
// ?vert: a 1080x1920 cut for Shorts. Scenes still draw in the 1080x1350 space, placed at 90% under a HUD
// band; backgrounds extend to the full frame; the title card is laid out natively (it is the cover).
const VERT = new URLSearchParams(location.search).has('vert');
const DW = 1080, DH = VERT ? 1920 : 1350, VK = .9, VOX = (1080 - 1080 * .9) / 2, VOY = 235;
CV.height = DH;
const baseTransform = () => VERT ? X.setTransform(VK, 0, 0, VK, VOX, VOY) : X.setTransform(1, 0, 0, 1, 0, 0);
const X = CV.getContext('2d');
const PAL = { paper: '#ECE8DF', ink: '#141312', red: '#E0341F', ghost: '#ADA89D', blue: '#2437E6', dim: '#6E6A62' };
const FNT = { serif: '"Instrument Serif"', sans: '"Inter Tight"', mono: '"JetBrains Mono"' };
const M = 72; // outer margin

// ───────────────────────── time ─────────────────────────
function interp(xs, ys, x) {
  if (x <= xs[0]) return ys[0] + (x - xs[0]) * (ys[1] - ys[0]) / (xs[1] - xs[0]);
  const n = xs.length;
  if (x >= xs[n - 1]) return ys[n - 1] + (x - xs[n - 1]) * (ys[n - 1] - ys[n - 2]) / (xs[n - 1] - xs[n - 2]);
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
  return ys[lo] + (x - xs[lo]) * (ys[hi] - ys[lo]) / (xs[hi] - xs[lo]);
}
const toT = t => interp(DATA.warp.t, DATA.warp.T, t);   // original song time -> final time
const toOrig = T => interp(DATA.warp.T, DATA.warp.t, T);
const CUT = DATA.cut, END = DATA.end;
const BEATS = DATA.beats;
function beat(T) {
  let lo = 0, hi = BEATS.length - 1;
  if (T < BEATS[0]) return { i: -1, ph: 0, since: 9, per: BEATS[1] - BEATS[0] };
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (BEATS[m] <= T) lo = m; else hi = m; }
  if (T >= BEATS[hi]) lo = hi;
  const per = (BEATS[lo + 1] || BEATS[lo] + 0.33) - BEATS[lo];
  return { i: lo, ph: (T - BEATS[lo]) / per, since: T - BEATS[lo], per };
}
const pulse = (T, k = 9) => Math.exp(-beat(T).since * k);
// playback tempo in bpm at final time T
function bpmAt(T) {
  const d = 0.05, t = toOrig(T);
  return 132 * (2 * d) / (toT(t + d) - toT(t - d));
}
// lyric line by its original start time
function L(t0) {
  let best = null, bd = 1e9;
  for (const l of DATA.lines) { const d = Math.abs(l.t0 - t0); if (d < bd) { bd = d; best = l; } }
  return best;
}

// ───────────────────────── math ─────────────────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const ease = {
  out3: x => 1 - Math.pow(1 - clamp(x), 3),
  in3: x => Math.pow(clamp(x), 3),
  io3: x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
  outExpo: x => { x = clamp(x); return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); },
  inExpo: x => { x = clamp(x); return x === 0 ? 0 : Math.pow(2, 10 * x - 10); },
  outBack: (x, s = 1.7) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; },
  outElastic: x => { x = clamp(x); return x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * 2.094) + 1; },
};
function hash(n) { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i * 7919 + seed * 104729), hash((i + 1) * 7919 + seed * 104729), u) * 2 - 1; }
// frame-quantised jitter: stays still for `hold` seconds like boiling linework
const jit = (T, seed, amp = 1, hold = 1 / 12) => (hash(Math.floor(T / hold) * 131 + seed * 977) * 2 - 1) * amp;

// ───────────────────────── type ─────────────────────────
function setFont(o) {
  const fam = FNT[o.fam || 'serif'] || o.fam;
  X.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${o.size || 40}px ${fam}`;
}
// layout a string into glyph boxes honouring tracking (em units)
function layout(str, o) {
  setFont(o);
  const tr = (o.track || 0) * (o.size || 40);
  const out = []; let x = 0;
  for (const ch of str) { const w = X.measureText(ch).width; out.push({ ch, x, w }); x += w + tr; }
  // kerning-aware total when no tracking: measureText of the whole string is better
  const width = tr === 0 ? X.measureText(str).width : x - tr;
  if (tr === 0 && out.length) { const s = width / (x || 1); for (const g of out) { g.x *= s; g.w *= s; } }
  return { glyphs: out, width };
}
const measure = (str, o) => layout(str, o).width;
function fit(str, width, o, max = 1e9) {
  const w = measure(str, { ...o, size: 100 });
  return Math.min(max, 100 * width / w);
}
// draw text. align: left|center|right. per(g, i) may return {dx, dy, rot, sc, a, color, sx}
function text(str, x, y, o = {}, per = null) {
  const lay = layout(str, o);
  const ax = o.align === 'center' ? lay.width / 2 : o.align === 'right' ? lay.width : 0;
  if (window.AUDIT && str.trim() && (o.alpha == null || o.alpha > .05)) {
    const m = X.getTransform(), sz = o.size || 40;
    const pts = [[x - ax, y - sz * .75], [x - ax + lay.width, y - sz * .75], [x - ax, y + sz * .22], [x - ax + lay.width, y + sz * .22]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const over = Math.max(0, -Math.min(...xs), Math.max(...xs) - W, -Math.min(...ys), Math.max(...ys) - H);
    if (over > 2) window.AUDIT.push({ str: str.slice(0, 40), over: Math.round(over), size: Math.round(sz) });
  }
  X.save();
  X.fillStyle = o.color || PAL.ink;
  X.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  X.textBaseline = o.baseline || 'alphabetic';
  if (!per && !o.track) { X.fillText(str, x - ax, y); X.restore(); return lay.width; }
  lay.glyphs.forEach((g, i) => {
    const p = per ? per(g, i, lay.glyphs.length) || {} : {};
    if (p.a === 0) return;
    X.save();
    X.translate(x - ax + g.x + g.w / 2 + (p.dx || 0), y + (p.dy || 0));
    if (p.rot) X.rotate(p.rot);
    if (p.sc != null || p.sx != null) X.scale((p.sx != null ? p.sx : 1) * (p.sc != null ? p.sc : 1), p.sc != null ? p.sc : 1);
    if (p.a != null) X.globalAlpha *= p.a;
    if (p.color) X.fillStyle = p.color;
    X.fillText(g.ch, -g.w / 2, 0);
    X.restore();
  });
  X.restore();
  return lay.width;
}
// wrap words into lines no wider than `width`
function wrap(str, width, o) {
  const words = str.split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (measure(t, o) > width && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

// ───────────────────── redline vocabulary ─────────────────────
// a hand-drawn-ish pen stroke from (x0,y0) to (x1,y1), revealed by p
function pen(x0, y0, x1, y1, p, o = {}) {
  if (p <= 0) return;
  const seed = o.seed || 1, n = 14;
  X.save();
  X.strokeStyle = o.color || PAL.red; X.lineWidth = o.w || 5; X.lineCap = 'round'; X.lineJoin = 'round';
  X.beginPath();
  for (let i = 0; i <= n * clamp(p); i++) {
    const u = i / n, wob = noise1(u * 3, seed) * (o.wob == null ? 3 : o.wob);
    const x = lerp(x0, x1, u), y = lerp(y0, y1, u) + wob;
    i === 0 ? X.moveTo(x, y) : X.lineTo(x, y);
  }
  X.stroke(); X.restore();
}
// strike through a text run [x0, x1] at baseline y with font size s
const strike = (x0, x1, y, s, p, o = {}) => pen(x0 - s * .05, y - s * .3, x0 + (x1 - x0 + s * .1), y - s * .3 + (o.tilt || -s * .04), p, { w: Math.max(3, s * .07), ...o });
// caret insertion mark under the baseline
function caret(x, y, s, p, color = PAL.red) {
  if (p <= 0) return;
  X.save(); X.strokeStyle = color; X.lineWidth = Math.max(2.5, s * .05); X.lineCap = 'round'; X.lineJoin = 'round';
  const h = s * .28 * ease.outBack(p);
  X.beginPath(); X.moveTo(x - h * .6, y + h); X.lineTo(x, y + h * .15); X.lineTo(x + h * .6, y + h); X.stroke(); X.restore();
}
// margin comment: a thin leader line from (ax,ay) to a mono note at (x,y)
function note(ax, ay, x, y, str, p, o = {}) {
  if (p <= 0) return;
  const s = Math.max(28, o.size || 28), color = o.color || PAL.red;
  X.save();
  X.strokeStyle = color; X.lineWidth = 2; X.setLineDash([5, 5]);
  const q = ease.out3(p * 2);
  X.beginPath(); X.moveTo(ax, ay); X.lineTo(lerp(ax, x, q), lerp(ay, y, q)); X.stroke(); X.setLineDash([]);
  const n = Math.floor(str.length * clamp(p * 1.6 - .4));
  const shown = str.slice(0, n);
  const tw = text(shown, x + 10, y + s * .35, { fam: 'mono', size: s, color, align: o.align });
  if (n < str.length && n > 0) { X.fillStyle = color; X.fillRect(x + 12 + (o.align === 'right' ? 0 : tw), y - s * .45, s * .5, s * .95); }
  X.restore();
}
// typing cursor
function cursor(x, y, s, T, color = PAL.ink, solid = false) {
  if (!solid && Math.floor(T * 2.2) % 2) return;
  X.fillStyle = color; X.fillRect(x + s * .04, y - s * .78, s * .07, s * .95);
}
// redaction bar
function redact(x, y, w, h, p, color = PAL.ink) { if (p > 0) { X.fillStyle = color; X.fillRect(x, y, w * ease.out3(p), h); } }

// ─────────────── predicted lyric: the signature device ───────────────
// The line is typed ahead in ghost grey (the model predicting the next tokens), then each word
// inks in as it is sung. `lead` = how early the prediction starts, it grows through the song.
function leadAt(T) { const t = toOrig(T); return lerp(0.18, 1.1, clamp(t / 137) ** 1.6); }
function wordState(line, i, T) {
  const w = line.words[i];
  const typeStart = line.T0 - leadAt(line.T0);
  const k = i / line.words.length;
  const typed = clamp((T - (typeStart + k * leadAt(line.T0) * .7)) / 0.05);
  const inked = clamp((T - w.T) / 0.07);
  return { typed, inked, since: T - w.T };
}
// draw a line as predicted text; returns layout info. o: font opts + {x,y,align,width,lh (line height mult), pop}
function predicted(line, T, o) {
  const fo = { fam: o.fam || 'serif', size: o.size || 64, weight: o.weight, italic: o.italic, track: o.track };
  const words = line.words.map(w => w.w);
  const space = Math.max(measure(' ', fo), fo.size * .27);
  const lh = (o.lh || 1.08) * fo.size;
  // lay words into rows
  const rows = [[]]; let rw = 0;
  words.forEach((w, i) => {
    const ww = measure(w, fo);
    if (o.width && rw + ww > o.width && rows[rows.length - 1].length) { rows.push([]); rw = 0; }
    rows[rows.length - 1].push({ w, i, ww }); rw += ww + space;
  });
  if (o.stack) { rows.length = 0; words.forEach((w, i) => rows.push([{ w, i, ww: measure(w, fo) }])); }
  const boxes = [];
  rows.forEach((r, ri) => {
    const rwid = r.reduce((a, b) => a + b.ww, 0) + space * (r.length - 1);
    let x = o.align === 'center' ? o.x - rwid / 2 : o.align === 'right' ? o.x - rwid : o.x;
    const y = o.y + ri * lh;
    for (const it of r) {
      const st = wordState(line, it.i, T);
      boxes.push({ ...it, x, y, st });
      if (st.typed > 0) {
        const vis = Math.ceil(it.w.length * st.typed);
        const pop = o.pop == null ? 1 : o.pop;
        const sc = 1 + pop * 0.08 * Math.exp(-Math.max(0, st.since) * 14) * (st.inked > 0 ? 1 : 0);
        X.save(); X.translate(x + it.ww / 2, y - fo.size * .3); X.scale(sc, sc); X.translate(-(x + it.ww / 2), -(y - fo.size * .3));
        const col = st.inked > 0 ? (o.color || PAL.ink) : (o.ghost || PAL.ghost);
        const altw = o.alt && o.alt[it.i], alts = Array.isArray(altw) ? altw : [altw];
        const shownW = st.inked <= 0 && altw ? alts[Math.floor(Math.max(0, T - line.T0) / .5) % alts.length] : it.w;
        text(shownW.slice(0, Math.ceil(shownW.length * st.typed)), x, y, { ...fo, color: col, alpha: st.inked > 0 ? 1 : 0.9 }, o.per ? (g, gi, n) => o.per(g, gi, n, it, st) : null);
        X.restore();
      }
      x += it.ww + space;
    }
  });
  // typing cursor sits after the last typed glyph until the whole line is typed
  const lastTyped = boxes.filter(b => b.st.typed > 0).pop();
  const allTyped = boxes.length && boxes[boxes.length - 1].st.typed >= 1;
  if (lastTyped && !allTyped && o.cursor !== false) {
    const vis = Math.ceil(lastTyped.w.length * lastTyped.st.typed);
    cursor(lastTyped.x + measure(lastTyped.w.slice(0, vis), fo), lastTyped.y, fo.size, T, o.ghost || PAL.ghost, true);
  }
  return { boxes, rows: rows.length, lh, size: fo.size };
}

// ───────────────────────── paper & grain ─────────────────────────
const GRAIN = [];
(function makeGrain() {
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = 540; c.height = 675;
    const g = c.getContext('2d'); const im = g.createImageData(540, 675); const r = rng(11 + k);
    for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); GRAIN.push(c);
  }
})();
const FIBER = (function () {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); const r = rng(5);
  g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 6 + r() * 40;
    g.strokeStyle = r() < .5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'; g.lineWidth = .6 + r();
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + r() * 6, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // soft blotches
  for (let i = 0; i < 90; i++) {
    const x = r() * W, y = r() * H, rad = 40 + r() * 220; const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const d = r() < .5; gr.addColorStop(0, d ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  return c;
})();
function bg(color) { X.fillStyle = color; X.fillRect(-W, -H, W * 3, H * 3); }
function finishPaper(T, dark) {
  X.save();
  X.globalCompositeOperation = 'overlay'; X.globalAlpha = dark ? .35 : .55; X.drawImage(FIBER, 0, 0, DW, DH);
  X.globalCompositeOperation = dark ? 'screen' : 'multiply'; X.globalAlpha = dark ? .05 : .09;
  const f = Math.floor(T * FPS / 2) % GRAIN.length; X.drawImage(GRAIN[f], 0, 0, DW, DH);
  X.restore();
  // vignette
  const g = X.createRadialGradient(DW / 2, DH / 2, DH * .35, DW / 2, DH / 2, DH * .85);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, dark ? 'rgba(0,0,0,0.35)' : 'rgba(60,40,20,0.14)');
  X.fillStyle = g; X.fillRect(0, 0, DW, DH);
}

// ───────────────────────── HUD ─────────────────────────
// the song's calendar: starts in 2024 (when the song was written), passes today mid-song, then runs away
// The calendar follows AI 2027's race ending: it starts in mid-2025 and can never pass mid-2030.
// Physical time slows as the song speeds up (days per second decay), and in the runaway it freezes
// field by field (years, months, days, hours, minutes) while ever more decimals of the last second tick.
const DAY0 = Date.UTC(2025, 5, 1);
const TODAY_DAYS = (Date.UTC(2026, 8, 25) - DAY0) / 864e5;
const END_DAYS = (Date.UTC(2030, 6, 1) - DAY0) / 864e5;
const CAL = { A: 2400, tau: 104 };
function daysAt(T) {
  const t = Math.max(0, toOrig(T));
  const f = x => CAL.A * (1 - Math.exp(-x / CAL.tau)), tc = -CAL.tau * Math.log(1 - TODAY_DAYS / CAL.A);
  if (t < tc) return f(t);
  if (t < tc + .45) return TODAY_DAYS + .5;            // the calendar hesitates on today
  if (t < 137.2) return f(t - .45);
  const frozen = f(137.2 - .45);
  if (t < 140.5) return frozen;                          // the calendar stops for "was it all for show?"
  const x = clamp((t - 140.5) / 13.5);
  return END_DAYS - (END_DAYS - frozen) * Math.pow(10, -14 * Math.pow(x, 1.3));
}
function dateStr(T) {
  const d = daysAt(T);
  const p = n => String(n).padStart(2, '0');
  const gap = (END_DAYS - d) * 86400;
  if (gap < 1) {
    const n = Math.min(9, Math.max(1, Math.ceil(-Math.log10(Math.max(gap, 1e-12))) + 1));
    const frac = String(Math.floor((1 - gap) * Math.pow(10, n))).padStart(n, '0').slice(0, n);
    return `2030-06-30 23:59:59.${frac}`;
  }
  const dt = new Date(DAY0 + d * 864e5);
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())} ${p(dt.getUTCHours())}:${p(dt.getUTCMinutes())}:${p(dt.getUTCSeconds())}`;
}
// milestones of the race-ending scenario, by date; unnamed, and after 2028 the captions stop
const MILESTONES = [
  ['2025-06-01', 'stumbling agents'], ['2025-10-01', "the world's most expensive AI"], ['2026-01-01', 'Agent-1: coding automation'],
  ['2026-05-01', 'China wakes up'], ['2026-09-26', 'AI takes some jobs'], ['2027-01-01', 'Agent-2 never finishes learning'],
  ['2027-02-01', 'China steals Agent-2'], ['2027-03-01', 'Agent-3: superhuman coder'], ['2027-06-01', 'self-improving AI'],
  ['2027-09-01', 'Agent-4: superhuman AI researcher'], ['2027-10-01', 'the committee votes to race'], ['2027-11-01', 'Agent-5'],
  ['2028-06-01', 'the robot economy'], ['2029-01-01', ''],
].map(([d, s]) => [(Date.parse(d + 'T00:00:00Z') - DAY0) / 864e5, s]);
function milestone(d) { let m = MILESTONES[0][1]; for (const [k, s] of MILESTONES) if (d >= k) m = s; return m; }
// p(doom) as the song pumps it
const PDOOM = [[0, .08], [23.71, .08], [24.7, .15], [59.71, .15], [60.7, .34], [96.11, .34], [97.7, .61], [124.21, .61], [126.2, .86], [135.4, .99], [140.5, .99], [154, .999999]];
function pdoomAt(T) { const t = toOrig(T); for (let i = 1; i < PDOOM.length; i++) if (t < PDOOM[i][0]) { const [a, va] = PDOOM[i - 1], [b, vb] = PDOOM[i]; return lerp(va, vb, ease.io3(inv(a, b, t))); } return .999999; }
let HUD_OVERRIDE = null;
function hud(T, dark, redbg) {
  const col = dark ? PAL.paper : PAL.ink;
  const RED = redbg ? PAL.ink : PAL.red;
  const s = 25;
  X.save();
  X.globalAlpha = .9;
  // vertical: everything in one band at the top (Shorts covers the bottom with its own UI)
  const top = VERT ? 132 : 62, bot = VERT ? 208 : H - 46;
  text("I'M UPPING MY P(DOOM)", M, top, { fam: 'mono', size: s, color: col, weight: 700 });
  const rev = DATA.lines.filter(l => l.T0 <= T).length;
  text(`rev.${String(rev).padStart(2, '0')} · 2026 edit`, M, top + 32, { fam: 'mono', size: s, color: col });
  // date, right aligned, with a TODAY flag as it passes
  const d = daysAt(T);
  const past = d >= TODAY_DAYS;
  text(dateStr(T), W - M, top, { fam: 'mono', size: s, color: past ? RED : col, align: 'right', weight: 700 });
  if (Math.abs(d - TODAY_DAYS - .5) < 1e-6) text('\u2190 today', W - M, top + 32, { fam: 'mono', size: s, color: RED, align: 'right', weight: 700 });
  else if (milestone(d)) text(milestone(d), W - M, top + 32, { fam: 'mono', size: s * .88, color: past ? RED : col, align: 'right', alpha: .85 });
  // bottom: tempo and p(doom)
  const bpm = bpmAt(T);
  text(toOrig(T) < 0 ? 'BPM \u2014' : `BPM ${bpm.toFixed(1)}`, M, bot, { fam: 'mono', size: s, color: col, weight: 700 });
  const pd = pdoomAt(T);
  text(`p(doom) ${pd.toFixed(pd > .99 ? 6 : 2)}`, W - M, bot, { fam: 'mono', size: s, color: pd > .8 ? RED : col, align: 'right', weight: 700 });
  // hairline progress rule along the bottom
  const pr = clamp(T / CUT);
  X.fillStyle = col; X.globalAlpha = .25; X.fillRect(M, bot + 16, W - 2 * M, 1.5);
  X.globalAlpha = .8; X.fillRect(M, bot + 15, (W - 2 * M) * pr, 3);
  X.restore();
}

// ───────────────────────── scenes ─────────────────────────
// scene(tFrom, tTo, draw) in ORIGINAL song seconds. draw(S) returns {dark, hud:false} optionally.
const SCENES = [];
const NOCROP = ['open', 'runaway', 'end card', 'for show', 'timeline', 'left turn', 'recursive', 'all the way', 'omega', 'nowhere', 'askew'];
function scene(t0, t1, name, draw) { SCENES.push({ t0, t1, T0: toT(t0) + 0.02, T1: toT(t1) + 0.02, name, draw }); }
function ctxFor(sc, T) {
  const lt = T - sc.T0, dur = sc.T1 - sc.T0;
  return { T, lt, dur, T0: sc.T0, T1: sc.T1, u: clamp(lt / dur), t: toOrig(T), sc, b: beat(T), at: t => toT(t) + 0.02 };
}
function render(T) {
  baseTransform();
  X.globalAlpha = 1; X.globalCompositeOperation = 'source-over';
  let sc = null;
  for (const s of SCENES) if (T >= s.T0 && T < s.T1) sc = s;
  if (!sc) sc = T < SCENES[0].T0 ? SCENES[0] : SCENES[SCENES.length - 1];
  const S = ctxFor(sc, T);
  X.save();
  if (!NOCROP.includes(sc.name)) {
    const bi = beat(T), per = toOrig(T) > 73 ? 2 : 4;
    const step = Math.floor(Math.max(0, bi.i) / per);
    const z = [1, 1.04, 1.015, 1.065][step % 4] + .025 * ((bi.i % per) + bi.ph) / per;
    cam(z, 0, W / 2, H * .47);
  }
  const r = sc.draw(S) || {};
  X.restore();
  X.setTransform(1, 0, 0, 1, 0, 0);
  // misregistration: from verse 3 on, a second impression drifts off the first
  const tO = toOrig(T);
  const mis = tO > 73 && tO < 154 && r.paper !== false && sc.name !== 'for show' ? .11 * Math.pow(inv(73, 137, tO), 1.3) : 0;
  if (mis > .005) {
    X.save(); X.globalAlpha = mis; X.globalCompositeOperation = r.dark ? 'screen' : 'multiply';
    X.drawImage(CV, jit(T, 5, 2 + 5 * mis / .11, 1 / 10), jit(T, 6, 1 + 4 * mis / .11, 1 / 10)); X.restore();
  }
  if (r.paper !== false) finishPaper(T, !!r.dark);
  if (r.hud !== false) hud(T, !!r.dark, !!r.redbg);
  return sc.name;
}

// camera helper: zoom/rotate about (cx,cy)
function cam(z, rot, cx, cy, dx = 0, dy = 0) { X.translate(cx + dx, cy + dy); X.rotate(rot || 0); X.scale(z, z); X.translate(-cx, -cy); }
// global beat punch camera
function punch(T, amt = .015, k = 10) { const p = pulse(T, k); cam(1 + amt * p, 0, W / 2, H / 2); }
function shake(T, amp, seed = 3) { X.translate(jit(T, seed, amp, 1 / 30), jit(T, seed + 1, amp, 1 / 30)); }
