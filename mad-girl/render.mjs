// Usage: node render.mjs stills 1,5,9  |  node render.mjs video out.mp4 [firstFrame lastFrame]
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
const [mode, arg, a0, a1] = process.argv.slice(2);
const FFMPEG = process.env.FFMPEG, FPS = 30;
mkdirSync('build', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
await page.goto('file://' + path.resolve('film.html') + '#render');
await page.evaluate(() => window.ready);
const tl = await page.evaluate(() => window.TIMELINE);
writeFileSync('build/timeline.json', JSON.stringify(tl, null, 1));
const grab = async (t, type) => Buffer.from(await page.evaluate(([t, type]) => { renderAt(t); return document.getElementById('c').toDataURL(type, .95).split(',')[1]; }, [t, type]), 'base64');
if (mode === 'stills') {
  mkdirSync('build/stills', { recursive: true });
  for (const t of arg.split(',').map(Number)) writeFileSync(`build/stills/t${t.toFixed(2).padStart(7, '0')}.png`, await grab(t, 'image/png'));
} else if (mode === 'video') {
  const n = Math.ceil(tl.total * FPS), i0 = a0 ? +a0 : 0, i1 = a1 ? Math.min(+a1, n) : n;
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-tune', 'grain', arg], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = i0; i < i1; i++) {
    const buf = await grab(i / FPS, 'image/jpeg');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.error(`${arg}: frame ${i}/${i1}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
