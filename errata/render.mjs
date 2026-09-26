// render.mjs: headless renders of index.html.
//   node render.mjs --still=1.2,5,9           -> out/stills/still_<T>.png
//   node render.mjs --sheet=0:20:1            -> out/sheet_<a>_<b>.jpg (contact sheet, every <step> s)
//   node render.mjs --video [--from=0 --to=END] [--workers=4] [--out=out/errata.mp4]
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FPS = 30;
fs.mkdirSync(`${ROOT}/out/stills`, { recursive: true });

async function page(browser) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1200, height: 2000 });
  p.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  p.on('pageerror', e => console.error('[pageerror]', e.message));
  await p.goto('file://' + ROOT + '/index.html' + (args.vert ? '?vert=1' : ''));
  await p.evaluate(() => window.FONTS_READY);
  return p;
}
const launch = () => puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'] });

async function frame(p, T, type = 'image/jpeg', q = 0.95) {
  const url = await p.evaluate((T, type, q) => { render(T); return document.getElementById('c').toDataURL(type, q); }, T, type, q);
  return Buffer.from(url.split(',')[1], 'base64');
}

async function stills() {
  const b = await launch(); const p = await page(b);
  for (const s of String(args.still).split(',')) {
    const T = +s; fs.writeFileSync(`${ROOT}/out/stills/still_${T.toFixed(2)}.png`, await frame(p, T, 'image/png'));
  }
  await b.close();
}

async function sheet() {
  const [a, bb, st] = String(args.sheet).split(':').map(Number);
  const b = await launch(); const p = await page(b);
  const ts = []; for (let T = a; T <= bb + 1e-6; T += st) ts.push(+T.toFixed(3));
  const url = await p.evaluate((ts) => {
    const c0 = document.getElementById('c'), cols = 6, cw = 270, ch = Math.round(270 * c0.height / c0.width), rows = Math.ceil(ts.length / cols);
    const s = document.createElement('canvas'); s.width = cols * cw; s.height = rows * (ch + 22); const g = s.getContext('2d');
    g.fillStyle = '#111'; g.fillRect(0, 0, s.width, s.height);
    ts.forEach((T, i) => {
      const nm = render(T); const x = (i % cols) * cw, y = Math.floor(i / cols) * (ch + 22);
      g.drawImage(document.getElementById('c'), x, y, cw - 4, ch);
      g.fillStyle = '#ddd'; g.font = '13px monospace'; g.fillText(`${T.toFixed(2)} (${toOrig(T).toFixed(1)}) ${nm}`, x + 3, y + ch + 15);
    });
    return s.toDataURL('image/jpeg', 0.88);
  }, ts);
  const out = `${ROOT}/out/sheet_${a}_${bb}.jpg`;
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); console.log(out);
  await b.close();
}

async function video() {
  const b0 = await launch(); const p0 = await page(b0);
  const END = await p0.evaluate(() => END); await b0.close();
  const from = +(args.from ?? 0), to = +(args.to ?? END);
  const N = Math.round((to - from) * FPS), workers = +(args.workers ?? 4);
  const outFile = path.resolve(ROOT, args.out || 'out/errata.mp4');
  const tmp = `${ROOT}/out/tmp`; fs.mkdirSync(tmp, { recursive: true });
  const per = Math.ceil(N / workers); const t0 = Date.now(); let done = 0;
  await Promise.all([...Array(workers)].map(async (_, w) => {
    const a = w * per, z = Math.min(N, a + per); if (a >= z) return;
    const b = await launch(); const p = await page(b);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', `${tmp}/seg${w}.mp4`]);
    for (let i = a; i < z; i++) {
      const buf = await frame(p, from + i / FPS, 'image/jpeg', 0.96);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 150 === 0) console.log(`${done}/${N} frames, ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  }));
  const list = [...Array(workers).keys()].filter(w => fs.existsSync(`${tmp}/seg${w}.mp4`)).map(w => `file '${tmp}/seg${w}.mp4'`).join('\n');
  fs.writeFileSync(`${tmp}/list.txt`, list);
  await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`, '-ss', String(from), '-t', String(to - from), '-i', `${ROOT}/audio/errata.wav`,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', '-shortest', outFile], { stdio: 'inherit' }).on('close', c => c ? rej(c) : res()));
  console.log(outFile, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}

if (args.still) await stills(); else if (args.sheet) await sheet(); else if (args.video) await video();

// node render.mjs --share=out/errata.mp4  -> <name>_share.mp4 (two-pass, ~28 MB, for posting)
if (args.share) {
  const src = path.resolve(ROOT, String(args.share)), dst = src.replace(/\.mp4$/, '_share.mp4');
  const run = a => new Promise((res, rej) => spawn('ffmpeg', a, { stdio: 'inherit', cwd: `${ROOT}/out` }).on('close', c => c ? rej(c) : res()));
  const v = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', '1550k', '-maxrate', '3000k', '-bufsize', '6000k', '-pix_fmt', 'yuv420p', '-tune', 'grain'];
  await run(['-y', '-v', 'error', '-i', src, ...v, '-pass', '1', '-an', '-f', 'mp4', '/dev/null']);
  await run(['-y', '-v', 'error', '-i', src, ...v, '-pass', '2', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', dst]);
  console.log(dst, (fs.statSync(dst).size / 1e6).toFixed(1) + ' MB');
}
