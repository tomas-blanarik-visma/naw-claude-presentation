// Smoke-test the deck in headless Chrome and optionally export a PDF.
//   node tools/check.mjs            → screenshots of every slide (all fragments shown, demos finished) into shots/
//   node tools/check.mjs --pdf      → also writes NAW-presentation.pdf via ?print-pdf
// Serves the repo itself on a random local port unless BASE is set.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.mp3': 'audio/mpeg' };
let server;
let BASE = process.env.BASE;
if (!BASE) {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.join(root, rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  BASE = `http://127.0.0.1:${server.address().port}/`;
}
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wantPdf = process.argv.includes('--pdf');
const only = process.argv.find((a) => /^s\d\d[a-z]?$/.test(a));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });

const problems = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
// Media loads are aborted on purpose when the deck moves on (S02b audio); that is not a failure.
page.on('requestfailed', (r) => { if (!/\.mp3$/.test(r.url())) problems.push(`requestfailed: ${r.url()}`); });

// networkidle2, not 0: media elements keep an audio stream open indefinitely.
await page.goto(BASE, { waitUntil: 'networkidle2' });
await page.waitForFunction(() => window.Reveal && Reveal.isReady(), { polling: 250 });
fs.mkdirSync('shots', { recursive: true });

const ids = await page.evaluate(() => Array.from(document.querySelectorAll('.slides > section')).map((s) => s.id));
if (only && !ids.includes(only)) { console.error(`no slide with id ${only}`); process.exit(2); }
for (const [index, id] of ids.entries()) {
  if (only && id !== only) continue;
  await page.evaluate((i) => Reveal.slide(i, 0, -1), index);
  await new Promise((r) => setTimeout(r, 300));
  // Show every fragment, then finish any demo that is still typing.
  await page.evaluate(() => { while (Reveal.nextFragment()) { /* advance */ } });
  await new Promise((r) => setTimeout(r, 200));
  await page.keyboard.press('f');
  await new Promise((r) => setTimeout(r, 5500));
  await page.keyboard.press('f');
  await new Promise((r) => setTimeout(r, 400));
  const overflow = await page.evaluate(() => {
    const s = Reveal.getCurrentSlide();
    const out = [];
    s.querySelectorAll('.term-body').forEach((b) => { if (b.scrollWidth > b.clientWidth + 2) out.push('term-body horizontal overflow'); });
    const r = s.getBoundingClientRect();
    s.querySelectorAll('*').forEach((el) => {
      const e = el.getBoundingClientRect();
      if (e.width && (e.bottom > r.bottom + 4 || e.right > r.right + 4)) out.push(`${el.tagName.toLowerCase()}.${el.className} outside slide`);
    });
    return [...new Set(out)].slice(0, 5);
  });
  overflow.forEach((o) => problems.push(`${id}: ${o}`));
  await page.screenshot({ path: `shots/${id}.png` });
}

if (wantPdf) {
  await page.goto(BASE + '?print-pdf', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.Reveal && Reveal.isReady(), { polling: 250 });
  await new Promise((r) => setTimeout(r, 1500));
  // Chrome fails to print all 41 full-HD pages in one pass; print in chunks and merge.
  const total = await page.evaluate(() => document.querySelectorAll('.pdf-page').length);
  const merged = await PDFDocument.create();
  for (let first = 1; first <= total; first += 10) {
    const last = Math.min(first + 9, total);
    const bytes = await page.pdf({ width: '1920px', height: '1080px', printBackground: true, pageRanges: `${first}-${last}`, timeout: 180000 });
    const part = await PDFDocument.load(bytes);
    (await merged.copyPages(part, part.getPageIndices())).forEach((pg) => merged.addPage(pg));
  }
  fs.writeFileSync('NAW-presentation.pdf', await merged.save());
  console.log('PDF: NAW-presentation.pdf');
}

await browser.close();
if (server) { server.closeAllConnections(); server.close(); }
console.log(`slides checked: ${only ? 1 : ids.length}`);
if (problems.length) {
  console.log('PROBLEMS:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('no problems');
