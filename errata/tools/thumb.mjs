// node tools/thumb.mjs -> thumb_paper.jpg, thumb_dark.jpg (1280x720 YouTube covers)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.goto('file://' + process.cwd() + '/thumb.html'); await p.evaluate(() => window.READY);
for (const v of ['paper', 'dark']) { const u = await p.evaluate(v => draw(v), v); fs.writeFileSync(`thumb_${v}.jpg`, Buffer.from(u.split(',')[1], 'base64')); }
await b.close();
