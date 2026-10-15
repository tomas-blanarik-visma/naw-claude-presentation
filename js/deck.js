/* NAW deck runtime: Reveal init, the growing workflow rail, and the terminal player. */
(function () {
  'use strict';

  const PRINT = /print-pdf/i.test(window.location.search);
  const TYPE_MS = 1000 / 35;
  const RAIL_STEPS = ['IDEA', 'BRAINSTORM', 'FEATURE', 'EPICS', 'STORIES', 'PLAN',
    'IMPLEMENT', 'TEST', 'REVIEW', 'VERIFY', 'DOCUMENT', 'DONE'];

  /* ---------- sound effects ---------- */

  // Short stingers: a fragment with data-sfx plays its clip when shown. Silent in print mode.
  const sfxCache = new Map();

  function sfxAudio(src) {
    let audio = sfxCache.get(src);
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      sfxCache.set(src, audio);
    }
    return audio;
  }

  function playSfx(src) {
    if (PRINT || !src) return;
    const audio = sfxAudio(src);
    audio.currentTime = 0;
    audio.play().catch(() => { /* autoplay refused: the slide still works silently */ });
  }

  function stopSfx() {
    sfxCache.forEach((audio) => { audio.pause(); audio.currentTime = 0; });
  }

  // Load a slide's stingers when it is entered, not at startup: open audio streams
  // at load time would keep the page from ever going network-idle.
  function preloadSfx(slide) {
    if (PRINT) return;
    slide.querySelectorAll('[data-sfx]').forEach((el) => sfxAudio(el.dataset.sfx));
  }

  /* ---------- terminal player ---------- */

  const sleep = (ms, run) => new Promise((resolve) => {
    if (run.fast || ms <= 0) return resolve();
    const id = setTimeout(resolve, ms);
    run.timers.push(id);
  });

  function playArea(term) {
    let area = term.querySelector('.play');
    if (!area) {
      area = document.createElement('div');
      area.className = 'play';
      term.querySelector('.term-body').appendChild(area);
    }
    return area;
  }

  function cursor() {
    const c = document.createElement('span');
    c.className = 'cursor';
    return c;
  }

  function newLine(area, cls) {
    const line = document.createElement('div');
    line.className = 'ln' + (cls ? ' ' + cls : '');
    area.appendChild(line);
    // Terminals have a fixed height: keep the newest line in view, like a real one.
    const body = area.closest('.term-body');
    body.scrollTop = body.scrollHeight;
    return line;
  }

  async function typeInto(el, text, run) {
    const c = cursor();
    el.appendChild(c);
    for (const ch of text) {
      if (run.cancelled) return;
      c.insertAdjacentText('beforebegin', ch);
      await sleep(TYPE_MS, run);
    }
    await sleep(250, run);
    c.remove();
  }

  async function step(area, term, s, run) {
    const [kind, text, cls, ms] = s;
    if (kind === 'cmd' || kind === 'user') {
      const line = newLine(area, kind);
      const prompt = document.createElement('span');
      prompt.className = 'prompt';
      prompt.textContent = '› ';
      line.appendChild(prompt);
      await typeInto(line, text, run);
      return;
    }
    if (kind === 'out' || kind === 'big') {
      await sleep(ms === undefined ? 300 : ms, run);
      if (run.cancelled) return;
      const line = newLine(area, (kind === 'big' ? 'big ' : '') + (cls || ''));
      line.textContent = text;
      return;
    }
    if (kind === 'gap') {
      await sleep(text === undefined ? 150 : text, run);
      if (!run.cancelled) newLine(area, 'gap');
      return;
    }
    if (kind === 'pause') {
      await sleep(text, run);
      return;
    }
    if (kind === 'flash' && !run.fast) {
      term.classList.remove('flash-err', 'flash-warn', 'flash-ok');
      void term.offsetWidth;
      term.classList.add('flash-' + text);
    }
  }

  const runs = new Map();

  async function play(term, demoId, opts) {
    const steps = (window.NAW_DEMOS || {})[demoId];
    if (!steps) { console.warn('[naw] unknown demo', demoId); return; }
    stop(term);
    const run = { cancelled: false, fast: PRINT || (opts && opts.fast), timers: [] };
    runs.set(term, run);
    term.classList.add('playing');
    const area = playArea(term);
    area.querySelectorAll('.ln.idle, .idle-cursor').forEach((el) => el.remove());
    for (const s of steps) {
      if (run.cancelled) break;
      await step(area, term, s, run);
    }
    term.classList.remove('playing');
    if (!run.cancelled) {
      const c = cursor();
      c.classList.add('idle-cursor');
      if (steps.length === 1 && steps[0][0] === 'cmd') {
        // A lone typed command keeps its cursor on the same line.
        area.lastChild.appendChild(c);
      } else {
        const idle = newLine(area, 'idle');
        idle.innerHTML = '<span class="prompt">› </span>';
        idle.appendChild(c);
      }
    }
    runs.delete(term);
  }

  function stop(term) {
    const run = runs.get(term);
    if (!run) return;
    run.cancelled = true;
    run.timers.forEach(clearTimeout);
    runs.delete(term);
    term.classList.remove('playing');
  }

  // Finish a running demo instantly: re-run it with no delays.
  function finish(term) {
    const run = runs.get(term);
    if (!run) return;
    stop(term);
    const area = playArea(term);
    area.innerHTML = '';
    replayChain(term, { fast: true });
  }

  // A terminal may receive several demos in order; remember them to fast-replay.
  function replayChain(term, opts) {
    const chain = (term._chain || []).slice();
    term._chain = [];
    chain.reduce((p, id) => p.then(() => { term._chain.push(id); return play(term, id, opts); }), Promise.resolve());
  }

  function start(term, demoId) {
    term._chain = term._chain || [];
    term._chain.push(demoId);
    play(term, demoId);
  }

  function reset(term) {
    stop(term);
    term._chain = [];
    const area = term.querySelector('.play');
    if (area) area.innerHTML = '';
    term.classList.remove('flash-err', 'flash-warn', 'flash-ok');
  }

  function finishAll(slide) {
    slide.querySelectorAll('.term').forEach((t) => { if (runs.has(t)) finish(t); });
  }

  /* ---------- rail ---------- */

  let rail;
  function buildRail() {
    rail = document.createElement('div');
    rail.id = 'rail';
    RAIL_STEPS.forEach((name, i) => {
      if (i > 0) {
        const a = document.createElement('span');
        a.className = 'rail-arrow';
        a.dataset.i = i;
        a.textContent = '→';
        rail.appendChild(a);
      }
      const n = document.createElement('span');
      n.className = 'rail-node';
      n.dataset.i = i;
      n.dataset.name = name;
      n.textContent = name;
      rail.appendChild(n);
    });
    const back = document.createElement('span');
    back.className = 'rail-back';
    back.textContent = '↺ fix loop';
    rail.appendChild(back);
    document.querySelector('.reveal').appendChild(rail);
  }

  function updateRail(slide) {
    const count = parseInt(slide.dataset.rail || '0', 10);
    rail.classList.toggle('on', count > 0);
    rail.classList.toggle('with-back', slide.dataset.railBack !== undefined);
    const active = (slide.dataset.railActive || RAIL_STEPS[count - 1] || '').split(',');
    rail.querySelectorAll('.rail-node, .rail-arrow').forEach((el) => {
      const i = parseInt(el.dataset.i, 10);
      el.classList.toggle('shown', i < count);
      if (!el.classList.contains('rail-node')) return;
      const isActive = active.includes(el.dataset.name);
      el.classList.toggle('active', isActive);
      el.classList.toggle('done', i < count && !isActive);
    });
  }

  /* ---------- wiring ---------- */

  function onSlide(event) {
    if (event.previousSlide) {
      event.previousSlide.querySelectorAll('.term').forEach(reset);
      stopSfx();
    }
    const slide = event.currentSlide;
    updateRail(slide);
    preloadSfx(slide);
    if (window.NAW_DOOM) window.NAW_DOOM.onSlide(slide, event.previousSlide);
    slide.querySelectorAll('.term[data-demo][data-play="enter"]').forEach((term) => {
      const delay = parseInt(term.dataset.delay || '400', 10);
      setTimeout(() => {
        if (Reveal.getCurrentSlide() === slide) start(term, term.dataset.demo);
      }, PRINT ? 0 : delay);
    });
  }

  function onFragmentShown(event) {
    // Finish whatever was typing first, then start every demo this step triggers:
    // fragments sharing a data-fragment-index start their terminals in parallel.
    finishAll(Reveal.getCurrentSlide());
    event.fragments.forEach((f) => {
      if (f.dataset.sfx) playSfx(f.dataset.sfx);
      if (!f.classList.contains('play')) return;
      const term = document.getElementById(f.dataset.term);
      if (term) start(term, f.dataset.demo);
    });
  }

  function onFragmentHidden(event) {
    if (event.fragments.some((f) => f.dataset.sfx)) stopSfx();
    event.fragments.forEach((f) => {
      if (!f.classList.contains('play')) return;
      const term = document.getElementById(f.dataset.term);
      if (term) reset(term);
    });
  }

  function renderAllForPrint() {
    document.querySelectorAll('.slides section').forEach((slide) => {
      slide.querySelectorAll('.term').forEach((term) => {
        const demos = [];
        if (term.dataset.demo) demos.push(term.dataset.demo);
        slide.querySelectorAll('.fragment.play').forEach((f) => {
          if (f.dataset.term === term.id) demos.push(f.dataset.demo);
        });
        demos.reduce((p, id) => p.then(() => play(term, id, { fast: true })), Promise.resolve());
      });
    });
  }

  // Staggered enter animations: each element waits `step` seconds longer than the previous one.
  function stagger(selector, step, fromEnd) {
    const els = Array.from(document.querySelectorAll(selector));
    els.forEach((el, i) => {
      const order = fromEnd ? els.length - 1 - i : i;
      el.style.animationDelay = (order * step).toFixed(2) + 's';
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    stagger('#s12 .tiles .card', 0.15);
    stagger('#s33 .fr', 0.4);
    stagger('#s39 .building .layer', 0.3, true);
    stagger('#s37 .q-card', 0.1);
    Reveal.initialize({
      width: 1920,
      height: 1080,
      margin: 0.02,
      hash: true,
      controls: false,
      progress: true,
      center: false,
      transition: 'fade',
      transitionSpeed: 'fast',
      backgroundTransition: 'none',
      showNotes: false,
      pdfSeparateFragments: false,
      totalTime: 3130, // 52:10 of talk; sum of data-timing
      plugins: [RevealNotes],
    }).then(() => {
      buildRail();
      if (PRINT) {
        renderAllForPrint();
        return;
      }
      onSlide({ currentSlide: Reveal.getCurrentSlide() });
      Reveal.on('slidechanged', onSlide);
      Reveal.on('fragmentshown', onFragmentShown);
      Reveal.on('fragmenthidden', onFragmentHidden);
      Reveal.addKeyBinding({ keyCode: 70, key: 'F', description: 'Finish running terminal demo' },
        () => { finishAll(Reveal.getCurrentSlide()); stopSfx(); if (window.NAW_DOOM) window.NAW_DOOM.finish(); });
      Reveal.addKeyBinding({ keyCode: 82, key: 'R', description: 'Replay terminals on this slide' },
        () => {
          const slide = Reveal.getCurrentSlide();
          slide.querySelectorAll('.term').forEach(reset);
          onSlide({ currentSlide: slide });
        });
    });
  });
})();
