/* S02b — "here we go": a 20-second, music-synced frenzy of an agent implementing feature X.
   deck.js calls NAW_DOOM.onSlide() on every slide change and NAW_DOOM.finish() on the F key. */
(function () {
  'use strict';

  const PRINT = /print-pdf/i.test(window.location.search);
  const FRENZY_START = 4500;
  const FRENZY_END = 18000;

  // The frenzy: each entry is [text, class]. Files and insertions feed the status bar.
  const POOL = [
    ['✎ src/controllers/CustomerController.ts', 'ok', 1, 214],
    ["  + db.query(`SELECT * FROM customers WHERE tenant='${req.query.tenant}'`)", 'err', 0, 1],
    ['✎ src/utils/utils2.ts', 'ok', 1, 88],
    ['⚡ inventing customerApi.exportAll() … done', 'warn', 0, 0],
    ['✎ src/utils/helpers_new.ts', 'ok', 1, 132],
    ['⚙ npm install moment lodash jquery left-pad is-odd is-even', 'tool', 0, 0],
    ['✎ src/services/ReportService2.ts   (ReportService already exists)', 'ok', 1, 301],
    ['  + catch (e) { /* TODO */ }', 'err', 0, 1],
    ['// API supports pagination (I assume)', 'dim', 0, 1],
    ['✎ EXPORT_README_FINAL.md', 'ok', 1, 57],
    ['♻ refactoring the auth module (nobody asked)', 'warn', 4, 640],
    ['🗑 deleting flaky test csv-export.test.ts', 'err', 1, -96],
    ['✎ src/controllers/ExportController.ts — 1 400 lines', 'ok', 1, 1400],
    ['⚙ disabling eslint … for the greater good', 'tool', 1, 3],
    ['✎ src/utils/helpers_new_FINAL.ts', 'ok', 1, 76],
    ['✔ all tests pass (0 ran)', 'ok', 0, 0],
    ['✎ EXPORT_README_FINAL_v2.md', 'ok', 1, 61],
    ['✎ migrations/0042_rename_everything.sql', 'ok', 1, 44],
    ['♻ rewriting the date library in-house', 'warn', 3, 410],
    ['✎ src/legacy/legacy_new.ts', 'ok', 1, 99],
  ];

  let timers = [];
  let running = false;

  const $ = (sel) => document.querySelector(sel);
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));

  function audio() { return $('#doom-audio'); }

  function line(text, cls) {
    const body = $('#t-doom .play');
    const div = document.createElement('div');
    div.className = 'ln' + (cls ? ' ' + cls : '');
    div.textContent = text;
    body.appendChild(div);
    const scroller = $('#t-doom .term-body');
    scroller.scrollTop = scroller.scrollHeight;
    return div;
  }

  function status(files, plus, minus) {
    $('#doom-files').textContent = files + ' files changed';
    $('#doom-lines').textContent = '+' + plus.toLocaleString('sk-SK') + ' −' + minus;
  }

  function setHeat(level) {
    const term = $('#t-doom');
    term.classList.remove('heat1', 'heat2', 'heat3');
    if (level) term.classList.add('heat' + level);
  }

  function shake() {
    const term = $('#t-doom');
    term.classList.remove('jolt');
    void term.offsetWidth;
    term.classList.add('jolt');
  }

  // Fire: additive canvas particles licking up the overheating terminal.
  // level 1 = small flames along the bottom (heat2), 2 = a blaze up the sides too (heat3), 0 = die out.
  const fire = { level: 0, parts: [], raf: 0, canvas: null };

  function fireCanvas() {
    if (fire.canvas) return fire.canvas;
    const slide = $('#s02b');
    const canvas = document.createElement('canvas');
    canvas.id = 'doom-fire';
    canvas.width = slide.offsetWidth;
    canvas.height = slide.offsetHeight;
    slide.appendChild(canvas);
    fire.canvas = canvas;
    return canvas;
  }

  function spawnFlames() {
    const term = $('#t-doom');
    const left = term.offsetLeft;
    const right = left + term.offsetWidth;
    const bottom = term.offsetTop + term.offsetHeight;
    const big = fire.level === 2;
    const flame = (x, y, size) => fire.parts.push({
      x, y, size, life: 1,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(2 + Math.random() * (big ? 5 : 3)),
      decay: 0.012 + Math.random() * 0.016,
    });
    for (let i = 0; i < (big ? 12 : 7); i++) flame(left + Math.random() * (right - left), bottom, (big ? 40 : 24) + Math.random() * (big ? 50 : 26));
    if (!big) return;
    for (let i = 0; i < 4; i++) {
      const y = term.offsetTop + Math.random() * term.offsetHeight;
      flame(left + (Math.random() - 0.5) * 30, y, 26 + Math.random() * 30);
      flame(right + (Math.random() - 0.5) * 30, y, 26 + Math.random() * 30);
    }
  }

  function drawFire() {
    const canvas = fireCanvas();
    const ctx = canvas.getContext('2d');
    if (fire.level) spawnFlames();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    fire.parts = fire.parts.filter((p) => p.life > 0);
    fire.parts.forEach((p) => {
      p.x += p.vx + Math.sin(p.y / 23) * 0.6;
      p.y += p.vy;
      p.life -= p.decay;
      const rgb = p.life > 0.7 ? '255,220,140' : p.life > 0.4 ? '255,130,40' : '220,50,20';
      const radius = p.size * (0.5 + p.life * 0.6);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      glow.addColorStop(0, `rgba(${rgb},${0.45 * p.life})`);
      glow.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
    });
    fire.raf = fire.level || fire.parts.length ? requestAnimationFrame(drawFire) : 0;
  }

  function setFire(level) {
    if (PRINT) return;
    fire.level = level;
    if (!fire.raf && level) fire.raf = requestAnimationFrame(drawFire);
  }

  function killFire() {
    cancelAnimationFrame(fire.raf);
    fire.raf = 0;
    fire.level = 0;
    fire.parts = [];
    if (fire.canvas) fire.canvas.getContext('2d').clearRect(0, 0, fire.canvas.width, fire.canvas.height);
  }

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    running = false;
    killFire();
    const a = audio();
    if (a) { a.pause(); a.currentTime = 0; }
    const body = $('#t-doom .play');
    if (!body) return;
    body.innerHTML = '';
    setHeat(0);
    status(0, 0, 0);
    $('#s02b').classList.remove('doom-done');
  }

  // Prelude: stretch, crack knuckles, "here we go."
  function prelude() {
    line('● claude  ready', 'agent');
    later(300, () => line('  \\(°o°)/      *stretches arms*', 'big'));
    later(1500, () => line('  ᕙ(⇀‸↼)ᕗ     *cracks knuckles*', 'big'));
    later(1900, () => { line('  crack.', 'dim'); shake(); });
    later(2300, () => { line('  crack.', 'tool'); shake(); });
    later(2700, () => { line('  CRACK.', 'hl'); shake(); });
    later(3300, () => line('  here we go.', 'big doom-go'));
  }

  // Frenzy: delays shrink geometrically from ~380 ms to ~40 ms as the music builds.
  function frenzy() {
    // Plan the schedule first, then scale the counters so they land exactly on the final 47 / +3812 / −214.
    const plan = [];
    let t = FRENZY_START;
    let gap = 380;
    let i = 0;
    let files = 0;
    let plus = 0;
    let minus = 0;
    while (t < FRENZY_END) {
      const [text, cls, f, p] = POOL[i % POOL.length];
      i += 1;
      files += f;
      if (p >= 0) plus += p; else minus -= p;
      plan.push({ t, text, cls, files, plus, minus });
      t += gap;
      gap = Math.max(40, gap * 0.93);
    }
    const last = plan[plan.length - 1];
    plan.forEach((s) => {
      const snap = [Math.round(s.files * 47 / last.files), Math.round(s.plus * 3812 / last.plus), Math.round(s.minus * 214 / Math.max(1, last.minus))];
      later(s.t, () => { line(s.text, s.cls); status(...snap); });
    });
    later(9000, () => setHeat(1));
    later(13000, () => { setHeat(2); setFire(1); });
    later(16000, () => { setHeat(3); setFire(2); });
  }

  function finale() {
    later(FRENZY_END, () => {
      setHeat(0);
      setFire(0);
      status(47, 3812, 214);
      line('', 'gap');
      line('✔ Successfully implemented.', 'big ok');
      $('#s02b').classList.add('doom-done');
    });
    later(20200, () => { running = false; });
  }

  function start() {
    reset();
    running = true;
    const a = audio();
    if (a) a.play().catch(() => { /* autoplay refused (no user gesture yet): animation still runs */ });
    prelude();
    frenzy();
    finale();
  }

  // Jump straight to the final frame (F key, print mode).
  function renderFinal() {
    timers.forEach(clearTimeout);
    timers = [];
    running = false;
    killFire();
    const a = audio();
    if (a) a.pause();
    const body = $('#t-doom .play');
    body.innerHTML = '';
    line('● claude  ready', 'agent');
    line('  here we go.', 'big doom-go');
    POOL.slice(-8).forEach(([text, cls]) => line(text, cls));
    line('', 'gap');
    line('✔ Successfully implemented.', 'big ok');
    setHeat(0);
    status(47, 3812, 214);
    $('#s02b').classList.add('doom-done');
  }

  window.NAW_DOOM = {
    onSlide(current, previous) {
      if (previous && previous.id === 's02b') reset();
      if (current && current.id === 's02b') start();
    },
    finish() { if (running) renderFinal(); },
  };

  window.addEventListener('DOMContentLoaded', () => {
    if (PRINT && $('#t-doom')) setTimeout(renderFinal, 0);
  });
})();
