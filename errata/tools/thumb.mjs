// node tools/thumb.mjs -> thumb_{paper,dark}.jpg (1280x720) and thumb_{paper,dark}-shorts.jpg (1080x1920)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.goto('file://' + process.cwd() + '/thumb.html'); await p.evaluate(() => window.READY);
for (const v of ['paper', 'dark', 'paper-shorts', 'dark-shorts']) { const u = await p.evaluate(v => draw(v), v); fs.writeFileSync(`thumb_${v}.jpg`, Buffer.from(u.split(',')[1], 'base64')); }
await b.close();
