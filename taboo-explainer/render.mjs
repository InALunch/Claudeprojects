// Usage: node render.mjs stills 1,5,9  |  node render.mjs video out.mp4
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
const [mode, arg] = process.argv.slice(2);
const FFMPEG = process.env.FFMPEG;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('file://' + path.resolve('explainer.html') + '#render');
await page.evaluate(() => window.ready);
const total = await page.evaluate(() => window.TOTAL);
writeFileSync('build/timeline.json', JSON.stringify({ total, starts: await page.evaluate(() => window.SCENE_STARTS) }));
const grab = async t => Buffer.from((await page.evaluate(t => { renderAt(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t)), 'base64');
if (mode === 'stills') {
  mkdirSync('build/stills', { recursive: true });
  for (const t of arg.split(',').map(Number)) writeFileSync(`build/stills/t${String(t).padStart(6, '0')}.png`, await grab(t));
} else {
  const fps = 30, n = Math.ceil(total * fps);
  const ff = spawn(FFMPEG, ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', arg], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    const buf = await grab(i / fps);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.error(`frame ${i}/${n}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
