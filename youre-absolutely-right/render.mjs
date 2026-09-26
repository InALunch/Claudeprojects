// Usage: node render.mjs stills 1,5,9  |  node render.mjs video out.mp4
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
const [mode, arg] = process.argv.slice(2);
const FFMPEG = process.env.FFMPEG;
mkdirSync('build', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('file://' + path.resolve('video.html') + '#render');
await page.evaluate(() => window.ready);
const total = await page.evaluate(() => window.TOTAL);
writeFileSync('build/timeline.json', JSON.stringify(await page.evaluate(() => ({ total: window.TOTAL, sc: window.SC, events: window.EVENTS }))));
console.error(`total ${total.toFixed(1)}s`);
const shot = () => page.screenshot({ type: 'png' });
if (mode === 'stills') {
  mkdirSync('build/stills', { recursive: true });
  for (const t of arg.split(',').map(Number)) { await page.evaluate(t => renderAt(t), t); writeFileSync(`build/stills/t${String(t).padStart(6, '0')}.png`, await shot()); }
} else if (mode === 'video') {
  const fps = 30, n = Math.ceil(total * fps);
  const ff = spawn(FFMPEG, ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-tune', 'stillimage', arg], { stdio: ['pipe', 'inherit', 'inherit'] });
  let lastKey = null, lastBuf = null, unique = 0;
  for (let i = 0; i < n; i++) {
    const key = await page.evaluate(t => renderAt(t), i / fps);
    if (key !== lastKey || key.startsWith('t')) { lastBuf = await shot(); lastKey = key; unique++; }
    if (!ff.stdin.write(lastBuf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 900 === 0) console.error(`frame ${i}/${n} (unique ${unique})`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
