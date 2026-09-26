// s9: the floor drops out, then the runaway, then silence.

// Was it all for show?  (tempo sags, the calendar stops; a small line in a lot of paper)
scene(137.2, 140.5, 'for show', S => {
  const T = S.T, l = L(137.4);
  bg(PAL.paper);
  const z = lerp(1, .55, ease.io3(inv(S.T0 + 1.6, S.T1, T)));
  X.save(); cam(z, 0, W / 2, H / 2);
  // as it pulls back, the page is one of many
  if (z < .99) {
    X.save(); X.fillStyle = '#CFC9BC';
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (i || j) X.fillRect(i * (W + 60) + 4, j * (H + 60) + 4, W - 8, H - 8);
    X.restore();
    X.strokeStyle = PAL.ink; X.lineWidth = 3 / z; X.strokeRect(0, 0, W, H);
  }
  predicted(l, T, { alt: { 4: ['us?', 'nothing?', 'you?'] }, fam: 'serif', italic: true, size: 150, x: W / 2, y: H / 2 - 60, align: 'center', width: W - 2 * M, lh: .95, cursor: true });
  X.restore();
  const a = clamp((T - S.T0 - 2.2) / .5);
  text('page 1 of ∞', W / 2, H - 160, { fam: 'mono', size: 24, align: 'center', alpha: a });
});

// the runaway: every page again, faster and faster
const MONTAGE = () => SCENES.filter(s => s.t0 >= 1.5 && s.t0 < 137 && !['for show'].includes(s.name));
scene(140.5, 154.0, 'runaway', S => {
  const T = S.T;
  const x = clamp((S.t - 140.5) / 13.5);
  // cumulative number of cuts accelerates toward one per frame
  const cuts = 18 * x + 40 * x * x + 120 * Math.pow(x, 4);
  const ci = Math.floor(cuts);
  const list = MONTAGE();
  const sc = list[Math.floor(hash(ci * 7 + 1) * list.length)];
  const within = 0;
  const TT = sc.T0 + (sc.T1 - sc.T0) * (.55 + .4 * hash(ci * 3)) + Math.min(.3, within * .05);
  X.save();
  // the camera is pushing in harder as it goes
  cam(1 + x * x * .25, (hash(ci) - .5) * x * .06, W / 2, H / 2);
  const r = sc.draw(ctxFor(sc, TT)) || {};
  X.restore();
  // a huge counter overprints near the end
  if (x > .55) {
    const k = inv(.55, 1, x);
    X.save(); X.globalAlpha = .85 * k;
    const nd = Math.min(9, 2 + Math.floor(k * 9));
    text('0.' + '9'.repeat(nd), W / 2, H / 2 + 80, { fam: 'sans', weight: 900, size: 190 - 60 * k, color: PAL.red, align: 'center' });
    X.restore();
  }
  // last frames strobe
  if (x > .93 && Math.floor(T * FPS) % 2) { bg(PAL.paper); }
  return { dark: !!r.dark };
});

// silence
scene(154.0, 170, 'end card', S => {
  const T = S.T, e = T - CUT;
  bg('#0B0B0A');
  if (e < 2.0) return { hud: false, dark: true };
  bg(PAL.paper);
  const a = clamp((e - 2.0) / .25);
  X.globalAlpha = a;
  text('2026-09-25', W / 2, 460, { fam: 'mono', size: 34, align: 'center', alpha: .6 });
  const fo = { fam: 'mono', size: 104, weight: 700 };
  const base = 'p(doom) = ';
  const typed = e > 3.3 && e < 4.3 ? '?' : '';
  const w = measure(base + ' ', fo);
  const x0 = W / 2 - w / 2;
  text(base + typed, x0, H / 2 + 20, fo);
  cursor(x0 + measure(base + typed, fo) - 2, H / 2 + 20, 104, e < 3.3 || e > 4.3 ? T : 0, PAL.red, e > 3.3 && e < 4.3);
  X.globalAlpha = 1;
  return { hud: false };
});
