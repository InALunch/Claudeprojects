import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage(); await p.goto('file://' + process.cwd() + '/index.html'); await p.evaluate(() => window.FONTS_READY);
console.log(await p.evaluate(() => SCENES.filter(s => !['runaway'].includes(s.name)).map(s => (s.T0 + Math.min(s.T1 - s.T0, 8) * .8).toFixed(2)).join(',')));
await b.close();
