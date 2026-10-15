/* NAW promo video: render(t) draws the frame at t seconds — a pure function of the clock,
   so tools/render-video.mjs can step it frame by frame. Opened in a browser it plays live:
   click to start (with build/audio.mp3 when present), click again to restart.
   Each scene function gets u = seconds since its own start (timeline.js). */
(function () {
  'use strict';

  const T = window.NAW_TIMELINE;
  const $ = (id) => document.getElementById(id);
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const pop = (p) => (p >= 1 ? 1 : 1 + 0.12 * Math.sin(p * Math.PI) * (1 - p) + (easeOut(p) - 1));

  // Fade + rise in from `at`.
  function enter(el, u, at, dur, dy) {
    const p = easeOut(prog(u, at, at + (dur || 0.4)));
    el.style.opacity = p;
    el.style.transform = `translateY(${(1 - p) * (dy === undefined ? 30 : dy)}px)`;
  }

  function popIn(el, u, at, from) {
    const p = prog(u, at, at + 0.45);
    el.style.opacity = p;
    el.style.transform = `scale(${(from || 0.7) + (1 - (from || 0.7)) * pop(p)})`;
  }

  function typed(text, u, a, b) {
    return text.slice(0, Math.round(text.length * prog(u, a, b)));
  }

  function cursor(el, u, typing) {
    el.style.visibility = typing || Math.floor(u * 2.2) % 2 === 0 ? 'visible' : 'hidden';
  }

  function setHtml(el, html) {
    if (el.innerHTML !== html) el.innerHTML = html;
  }

  // Lines [at, text, cls] whose time has come, as terminal rows.
  function lines(list, u, keep) {
    const shown = list.filter(([at]) => u >= at).map(([, text, cls]) => `<div class="ln ${cls || ''}">${escapeHtml(text)}</div>`);
    return (keep ? shown.slice(-keep) : shown).join('');
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Deterministic pseudo-random, so every render is identical.
  function rand(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  /* ---------- hook · one small feature ---------- */
  function hook(u) {
    enter($('hook-kick'), u, 0.3);
    $('hook-type').textContent = typed('Implement customer export.', u, 2.4, 4.2);
    cursor($('hook-cur'), u, u > 2.4 && u < 4.2);
    $('hook-reply').textContent = u > 5.4 ? '● claude   Certainly! 🚀 On it.' : '';
    $('hook').style.transform = `scale(${1 + 0.04 * prog(u, 0, 8)})`;
  }

  /* ---------- frenzy · 47 files ---------- */
  const POOL = [
    ['✎ src/controllers/CustomerController.ts', 'ok', 1, 214],
    ["  + db.query(`SELECT * FROM customers WHERE tenant='${req.query.tenant}'`)", 'err', 0, 1],
    ['✎ src/utils/utils2.ts', 'ok', 1, 88],
    ['⚡ inventing customerApi.exportAll() … done', 'warn', 0, 0],
    ['✎ src/utils/helpers_new.ts', 'ok', 1, 132],
    ['⚙ npm install moment lodash jquery left-pad is-odd', 'tool', 0, 0],
    ['✎ src/services/ReportService2.ts   (ReportService already exists)', 'ok', 1, 301],
    ['  + catch (e) { /* TODO */ }', 'err', 0, 1],
    ['// API supports pagination (I assume)', 'dim', 0, 1],
    ['✎ EXPORT_README_FINAL.md', 'ok', 1, 57],
    ['♻ refactoring the auth module (nobody asked)', 'warn', 4, 640],
    ['🗑 deleting flaky test csv-export.test.ts', 'err', 1, 0],
    ['✎ src/controllers/ExportController.ts — 1 400 lines', 'ok', 1, 1400],
    ['⚙ disabling eslint … for the greater good', 'tool', 1, 3],
    ['✔ all tests pass (0 ran)', 'ok', 0, 0],
    ['✎ migrations/0042_rename_everything.sql', 'ok', 1, 44],
    ['♻ rewriting the date library in-house', 'warn', 3, 410],
  ];
  const FRENZY_END = 8.0;
  const FRENZY_PLAN = (() => {
    const plan = [];
    let u = 0.3;
    let gap = 0.32;
    let i = 0;
    let files = 0;
    let plus = 0;
    while (u < FRENZY_END - 0.2) {
      const [text, cls, f, p] = POOL[i % POOL.length];
      files += f;
      plus += p;
      plan.push({ u, text, cls, files, plus });
      i += 1;
      u += gap;
      gap = Math.max(0.05, gap * 0.91);
    }
    const last = plan[plan.length - 1];
    plan.forEach((s) => { s.files = Math.round(s.files * 47 / last.files); s.plus = Math.round(s.plus * 3812 / last.plus); });
    return plan;
  })();

  function frenzy(u, t) {
    const shown = FRENZY_PLAN.filter((s) => s.u <= u);
    setHtml($('frenzy-body'), shown.slice(-17).map((s) => `<div class="ln ${s.cls}">${escapeHtml(s.text)}</div>`).join(''));
    const done = u >= FRENZY_END;
    const last = shown[shown.length - 1];
    $('frenzy-files').textContent = done ? 47 : (last ? last.files : 0);
    $('frenzy-lines').textContent = '+' + (done ? 3812 : (last ? last.plus : 0)).toLocaleString('en-US');
    const heat = prog(u, 3, FRENZY_END - 0.2) * (done ? 0.35 : 1);
    $('frenzy-heat').style.opacity = heat;
    const amp = done ? 0 : 9 * heat;
    $('frenzy').querySelector('.term').style.transform = `translate(${Math.sin(t * 91) * amp}px, ${Math.cos(t * 73) * amp}px)`;
    const p = prog(u, FRENZY_END, FRENZY_END + 0.45);
    $('frenzy-done').style.opacity = p;
    $('frenzy-done').style.transform = `scale(${0.6 + 0.4 * pop(p)})`;
  }

  /* ---------- damage · consequences ---------- */
  const DEBRIS = ['customerApi.exportAll()', 'utils2.ts', '✅ 0 tests ran', 'helpers_new_FINAL.ts', 'trust me',
    'ReportService2.ts', 'catch (e) {}', 'EXPORT_README_FINAL_v2.md', '// I assume', '47 files changed',
    'left-pad', 'TODO', 'eslint-disable', 'legacy_new.ts', 'is-odd', 'rename_everything.sql'];
  function damage(u) {
    const box = $('damage-debris');
    if (!box.children.length) box.innerHTML = DEBRIS.map((d) => `<span class="debris">${escapeHtml(d)}</span>`).join('');
    Array.from(box.children).forEach((el, i) => {
      const start = i * 0.45 - 0.6;
      const x = 1980 - (u - start) * (420 + rand(i) * 380);
      // Two bands above and below the headline stack, so the words stay readable.
      const y = rand(i + 40) < 0.5 ? 30 + rand(i + 60) * 190 : 760 + rand(i + 60) * 240;
      const rot = (rand(i + 80) - 0.5) * 24 + (u - start) * (rand(i + 9) - 0.5) * 30;
      el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      el.style.opacity = 0.85;
    });
    enter($('damage-a'), u, 1.2);
    enter($('damage-b'), u, 2.6);
    enter($('damage-c'), u, 4.0);
  }

  /* ---------- harder · prompt harder ---------- */
  function harder(u) {
    $('harder-type').textContent = typed('IMPLEMENT. CUSTOMER. EXPORT. PLEASE. 🙏', u, 0.8, 5.2);
    cursor($('harder-cur'), u, u > 0.8 && u < 5.2);
    $('harder-reply').textContent = u > 7.0 ? '● claude   Certainly! 🚀' : '';
    const p = prog(u, 7.4, 9.6);
    const rocket = $('harder-rocket');
    rocket.style.opacity = p > 0 && p < 1 ? 1 : 0;
    rocket.style.transform = `translate(${-200 + p * 2300}px, ${900 - p * 1000}px) rotate(${-10 + p * 20}deg)`;
  }

  /* ---------- model · not the model ---------- */
  function model(u) {
    enter($('model-head'), u, 0.4);
    enter($('model-sub'), u, 4.0);
    Array.from($('model-pieces').children).forEach((el, i) => {
      enter(el, u, 6.8 + i * 0.3, 0.35, 20);
      el.classList.toggle('lit', !el.classList.contains('model') && u > 8.2 + i * 0.45);
    });
  }

  /* ---------- meet · NAW ---------- */
  function meet(u) {
    popIn($('meet-logo'), u, 0.4);
    enter($('meet-sub'), u, 1.6);
    Array.from($('meet-files').children).forEach((el, i) => enter(el, u, 4.4 + i * 0.25, 0.35, 20));
    Array.from($('meet-team').children).forEach((el, i) => enter(el, u, 7.0 + i * 0.35, 0.35, 30));
  }

  /* ---------- questions · brainstorm first ---------- */
  const Q_OUT = [
    [2.0, '● business-analyst   reading CLAUDE.md · docs/architecture · docs/domain', 'agent'],
    [2.7, '  ⎿ found ReportService · permission model · tenant isolation', 'tool'],
    [3.6, '  ? Which customer fields are personal data (PII)?', 'warn'],
    [5.9, '  ? Who is allowed to export — account managers only?', 'warn'],
    [7.0, '  ? Small files now, or a background job for big exports?', 'warn'],
    [7.9, '', ''],
    [8.0, '  Source files changed: 0', 'ok big-ln'],
  ];
  function questions(u) {
    $('questions-type').textContent = typed('/ba:analyze "customer export"', u, 0.4, 1.6);
    cursor($('questions-cur'), u, u > 0.4 && u < 1.6);
    $('questions-cur').style.display = u > 2.0 ? 'none' : '';
    setHtml($('questions-out'), lines(Q_OUT, u));
  }

  /* ---------- breakdown · feature → epics → stories ---------- */
  const TREE_AT = [4.6, 5.9, 7.0, 7.3, 7.6, 7.9, 6.2, 6.5];
  function breakdown(u) {
    Array.from($('breakdown-tree').children).forEach((el, i) => enter(el, u, TREE_AT[i], 0.35, 16));
    enter($('breakdown-note'), u, 9.4);
  }

  /* ---------- team · one job each ---------- */
  function team(u) {
    [2.9, 4.5, 7.0, 9.3].forEach((at, i) => enter($('team-chat').children[i], u, at, 0.35, 40));
  }

  /* ---------- evidence · verifier ---------- */
  function evidence(u) {
    enter($('evidence-report'), u, 0.2, 0.4, 40);
    const rows = $('evidence-report').querySelectorAll('.ac-row');
    rows.forEach((el, i) => enter(el, u, 4.0 + i * 0.5, 0.3, 14));
    enter($('evidence-foot'), u, 7.4);
  }

  /* ---------- guard · guardrails ---------- */
  const GUARD_OUT = [
    [3.1, '  ⛔ PreToolUse hook · pre-bash-guard', 'err'],
    [3.3, '     BLOCKED: Force push detected. Use regular push or discuss with the user first.', 'err'],
    [6.0, '  ● Understood — pushing a branch and opening a PR instead.', 'agent'],
    [6.7, '  ✔ PR #482 opened', 'ok'],
  ];
  function guard(u) {
    $('guard-type').textContent = typed('git push --force origin main', u, 1.2, 2.8);
    cursor($('guard-cur'), u, u > 1.2 && u < 2.8);
    $('guard-cur').style.display = u > 3.1 ? 'none' : '';
    setHtml($('guard-out'), lines(GUARD_OUT, u));
    const flash = u >= 3.1 ? Math.max(0, 1 - (u - 3.1) / 0.9) : 0;
    $('guard-flash').style.background = `rgba(255,60,50,${0.35 * flash})`;
    $('guard').querySelector('.term').style.transform = `translateX(${Math.sin(u * 60) * 12 * flash}px)`;
    const p = prog(u, 4.3, 4.7);
    const out = prog(u, 5.6, 5.9);
    const stamp = $('guard-stamp');
    stamp.style.opacity = p * (1 - out);
    stamp.style.transform = `translate(-50%, -50%) rotate(-8deg) scale(${1.8 - 0.8 * easeOut(p)})`;
  }

  /* ---------- auto · team-run ---------- */
  const LEAD = [
    [1.8, '› /epic:team-run Customer-Export/Export-Pipeline', ''],
    [2.4, '● epic-team-lead   phase 1 · 4 stories · waves [01-01] → [01-02, 01-03] → [01-04]', 'agent'],
    [3.0, '  ⎿ wave 2   spawning 3 teammates, one worktree each ↓', 'tool'],
    [6.8, '  ⎿ wave 2   merged 2/2 · tests ✔ · review PASS', 'ok'],
    [7.4, '  ⎿ verify   5/5 criteria ✔ · skeptic confirmed · docs · Jira synced', 'ok'],
    [8.4, "  ⏸ /ask-human   01-03: masking rule for field 'notes' is undefined", 'warn pulse'],
  ];
  const P1 = [[3.6, '● 01-02 stream CSV writer', 'agent'], [4.2, '  ✗ test red', 'err'], [5.0, '  ✎ CsvExportWriter.ts', 'ok'], [5.8, '  ✔ test green', 'ok']];
  const P2 = [[3.8, '● 01-03 PII mask adapter', 'agent'], [4.4, '  ✗ test red', 'err'], [5.2, '  ✎ PiiMaskAdapter.ts', 'ok'], [7.8, "  ⏸ field 'notes'?", 'warn']];
  const P3 = [[4.0, '● reviewing wave 2', 'agent'], [5.4, '  2 blocking findings', 'err'], [6.0, '  → refactoring-expert', 'tool'], [6.6, '  ✔ PASS', 'ok']];
  function auto(u) {
    setHtml($('auto-lead'), lines(LEAD, u));
    setHtml($('auto-p1'), lines(P1, u));
    setHtml($('auto-p2'), lines(P2, u));
    setHtml($('auto-p3'), lines(P3, u));
    ['p1', 'p2', 'p3'].forEach((p, i) => enter($('auto').querySelector('.' + p), u, 3.1 + i * 0.15, 0.35, 40));
    const pulse = $('auto-lead').querySelector('.pulse');
    if (pulse) pulse.style.background = `rgba(242,204,96,${0.08 + 0.1 * (0.5 + 0.5 * Math.sin(u * 6))})`;
  }

  /* ---------- same · same model ---------- */
  function same(u) {
    enter($('same-l'), u, 0.1, 0.4, 40);
    enter($('same-r'), u, 0.4, 0.4, 40);
    enter($('same-tag'), u, 3.3);
  }

  /* ---------- end · card ---------- */
  function end(u) {
    enter($('end-line'), u, 2.6);
    enter($('end-install'), u, 5.4);
  }

  const SCENES = { hook, frenzy, damage, harder, model, meet, questions, breakdown, team, evidence, guard, auto, same, end };

  function render(t) {
    T.scenes.forEach(([id, a, b], i) => {
      const el = $(id);
      const last = i === T.scenes.length - 1;
      const visible = t >= a && (t < b || (last && t <= b));
      const fadeIn = a === 0 ? 1 : prog(t, a, a + 0.2);
      el.style.opacity = visible ? (last ? fadeIn : Math.min(fadeIn, 1 - prog(t, b - 0.2, b))) : 0;
      if (visible) SCENES[id](t - a, t);
    });
    // The last scene does not fade itself out: the whole stage dips to black instead.
    $('fade').style.opacity = prog(t, T.duration - 0.8, T.duration);
  }

  window.NAW_VIDEO = { render };

  /* ---------- live preview ---------- */
  if (/render/.test(location.search)) {
    document.body.classList.add('render');
    render(0);
    return;
  }
  const stage = $('stage');
  const fit = () => { stage.style.transform = `scale(${Math.min(innerWidth / 1920, innerHeight / 1080)})`; };
  addEventListener('resize', fit);
  fit();
  const audio = $('mix');
  let startedAt = null;
  document.addEventListener('click', () => {
    startedAt = performance.now();
    audio.currentTime = 0;
    audio.play().catch(() => { /* no mix built yet: picture only */ });
  });
  (function loop() {
    const t = startedAt === null ? 0.5 : Math.min(T.duration, (performance.now() - startedAt) / 1000);
    render(t);
    requestAnimationFrame(loop);
  })();
})();
