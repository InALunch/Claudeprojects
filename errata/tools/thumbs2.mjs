// node tools/thumbs2.mjs -> covers/<name>_{wide,tall}.jpg for every concept in thumbs2.html
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.goto('file://' + process.cwd() + '/thumbs2.html'); await p.evaluate(() => window.READY);
for (const n of await p.evaluate(() => NAMES)) for (const f of ['wide', 'tall']) {
  const u = await p.evaluate((n, f) => draw(n, f), n, f); fs.writeFileSync(`covers/${n}_${f}.jpg`, Buffer.from(u.split(',')[1], 'base64'));
}
await b.close();
