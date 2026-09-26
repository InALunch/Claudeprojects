import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.goto('file://' + process.cwd() + '/index.html'); await p.evaluate(() => window.FONTS_READY);
const res = await p.evaluate(() => {
  const agg = {};
  for (let T = 0; T < END; T += 0.1) {
    window.AUDIT = []; const nm = render(T);
    if (nm === 'runaway') continue;
    for (const a of window.AUDIT) { const k = nm + ' | ' + a.str; const g = agg[k] || (agg[k] = { n: 0, over: 0, t0: T, size: a.size }); g.n++; g.over = Math.max(g.over, a.over); }
  }
  window.AUDIT = null;
  return Object.entries(agg).map(([k, v]) => `${v.t0.toFixed(1).padStart(6)}s  over ${String(v.over).padStart(4)}px  x${String(v.n).padStart(3)}  sz${v.size}  ${k}`).join('\n');
});
console.log(res); await b.close();
