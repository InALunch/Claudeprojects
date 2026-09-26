import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const [ts, out, crop] = [process.argv[2].split(',').map(Number), process.argv[3], process.argv[4]];
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.goto('file://' + process.cwd() + '/index.html'); await p.evaluate(() => window.FONTS_READY);
const url = await p.evaluate((ts, crop) => {
  // crop='top' -> only the top 150 px strip of each frame (HUD check), else half-size frames 3 per row
  const top = crop === 'top', cw = top ? 1080 : 540, ch = top ? 130 : 675, cols = top ? 1 : 3, rows = Math.ceil(ts.length / cols);
  const s = document.createElement('canvas'); s.width = cols * cw; s.height = rows * (ch + 24); const g = s.getContext('2d');
  g.fillStyle = '#111'; g.fillRect(0, 0, s.width, s.height);
  ts.forEach((T, i) => { const nm = render(T); const x = (i % cols) * cw, y = Math.floor(i / cols) * (ch + 24);
    if (top) g.drawImage(document.getElementById('c'), 0, 0, 1080, 130, x, y, cw, ch); else g.drawImage(document.getElementById('c'), x, y, cw, ch);
    g.fillStyle = '#ddd'; g.font = '16px monospace'; g.fillText(`${T.toFixed(2)} (${toOrig(T).toFixed(1)}) ${nm}`, x + 4, y + ch + 18); });
  return s.toDataURL('image/jpeg', .9);
}, ts, crop);
fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); await b.close();
