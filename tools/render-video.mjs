// Render video/index.html to video/build/naw-promo.mp4: every frame stepped through NAW_VIDEO.render(t)
// in headless Chrome, piped to ffmpeg, then muxed with the voiceover mix.
//   node tools/render-video.mjs              → audio mix + full MP4
//   node tools/render-video.mjs --audio      → only video/build/audio.mp3 (for the live preview)
//   node tools/render-video.mjs --remux      → rebuild the audio and swap it into the existing MP4 (no frame render)
//   node tools/render-video.mjs --stills 4,13.5,40   → PNGs of those seconds into video/build/
// Voiceover: video/vo/line-N.mp3 (N = 1…9, e.g. exported from ElevenLabs); a missing line falls back
// to macOS `say` so timing can be judged before the real voice exists. Music: video/music.mp3, optional,
// ducked under the voice.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const T = createRequire(import.meta.url)(path.join(root, 'video/timeline.js'));
const build = path.join(root, 'video/build');
fs.mkdirSync(build, { recursive: true });
const arg = (name) => { const i = process.argv.indexOf(name); return i < 0 ? null : (process.argv[i + 1] || ''); };

function duration(file) {
  return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
}

function voiceFiles() {
  return T.vo.map((line, i) => {
    const real = path.join(root, `video/vo/line-${i + 1}.mp3`);
    if (fs.existsSync(real)) return { ...line, file: real, real: true };
    const temp = path.join(build, `say-${i + 1}.aiff`);
    execFileSync('say', ['-v', 'Samantha', '-r', '175', '-o', temp, line.text]);
    return { ...line, file: temp, real: false };
  });
}

function buildAudio() {
  const lines = voiceFiles();
  lines.forEach((line, i) => {
    const end = line.at + duration(line.file);
    const next = i + 1 < lines.length ? lines[i + 1].at : T.duration;
    if (end > next) console.warn(`! line ${i + 1} ends at ${end.toFixed(2)} s, after the next cue at ${next} s — shift timeline.js`);
  });
  const music = path.join(root, 'video/music.mp3');
  const inputs = lines.flatMap((l) => ['-i', l.file]);
  const filters = lines.map((l, i) => `[${i}:a]aresample=48000,adelay=${Math.round(l.at * 1000)}:all=1[v${i}]`);
  let mix = `${lines.map((_, i) => `[v${i}]`).join('')}amix=inputs=${lines.length}:normalize=0[vo]`;
  if (fs.existsSync(music)) {
    inputs.push('-i', music);
    // Music runs the full length and ducks under the voice (sidechain), fading out over the last 2 s.
    filters.push(`[${lines.length}:a]aresample=48000,volume=0.15,atrim=0:${T.duration},afade=t=out:st=${T.duration - 2}:d=2[mu]`);
    mix += ';[vo]asplit=2[vo1][vo2];[mu][vo2]sidechaincompress=threshold=0.04:ratio=5:attack=30:release=500[duck]'
      + ';[vo1][duck]amix=inputs=2:normalize=0:duration=longest[mx]';
  } else {
    mix += ';[vo]anull[mx]';
  }
  const out = path.join(build, 'audio.mp3');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex',
    `${filters.join(';')};${mix};[mx]apad,atrim=0:${T.duration},loudnorm=I=-14:TP=-1[out]`, '-map', '[out]', '-b:a', '192k', out]);
  console.log(`audio: ${out} (${lines.filter((l) => l.real).length}/${lines.length} real voice lines${fs.existsSync(music) ? ', with music' : ', no music'})`);
  return out;
}

async function withPage(fn) {
  const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    page.on('pageerror', (e) => { throw e; });
    await page.goto(`http://127.0.0.1:${server.address().port}/video/index.html?render`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await fn(page);
  } finally {
    await browser.close();
    server.closeAllConnections();
    server.close();
  }
}

async function frame(page, t, type) {
  await page.evaluate((s) => window.NAW_VIDEO.render(s), t);
  return page.screenshot({ type, quality: type === 'jpeg' ? 92 : undefined, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
}

async function stills(list) {
  await withPage(async (page) => {
    for (const t of list) {
      const out = path.join(build, `still-${t}.png`);
      fs.writeFileSync(out, await frame(page, t, 'png'));
      console.log(out);
    }
  });
}

async function renderVideo(audio) {
  const out = path.join(build, 'naw-promo.mp4');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(T.fps), '-i', '-',
    '-i', audio, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(T.duration * T.fps);
  await withPage(async (page) => {
    for (let i = 0; i < total; i++) {
      const img = await frame(page, i / T.fps, 'jpeg');
      if (!ff.stdin.write(img)) await new Promise((resolve) => ff.stdin.once('drain', resolve));
      if (i % (T.fps * 5) === 0) process.stdout.write(`\rframe ${i}/${total}`);
    }
  });
  ff.stdin.end();
  await new Promise((resolve, reject) => ff.on('close', (code) => (code ? reject(new Error(`ffmpeg exited ${code}`)) : resolve())));
  console.log(`\nvideo: ${out}`);
}

const stillArg = arg('--stills');
if (stillArg) await stills(stillArg.split(',').map(Number));
else if (process.argv.includes('--audio')) buildAudio();
else if (process.argv.includes('--remux')) {
  const audio = buildAudio();
  const video = path.join(build, 'naw-promo.mp4');
  const tmp = path.join(build, 'naw-promo.remux.mp4');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-i', audio, '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, video);
  console.log(`video: ${video} (audio replaced)`);
}
else await renderVideo(buildAudio());
