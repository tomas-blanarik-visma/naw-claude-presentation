// Prerecorded terminal sequences D1–D9.
// Step kinds:
//   ['cmd',  text]              typed at the prompt (35 chars/s)
//   ['user', text]              typed answer after a question (35 chars/s)
//   ['out',  text, cls, ms]     printed line; ms = delay before it (default 300)
//   ['gap',  ms]                empty line after ms (default 150)
//   ['pause', ms]               wait, print nothing
//   ['big',  text, cls, ms]     oversized line (punchline inside the terminal)
//   ['flash', cls]              briefly tint the terminal (err | warn | ok)
// Classes: agent tool ok err warn q dim hl
window.NAW_DEMOS = {
  d1: [
    ['cmd', '/ba:analyze "I want to build customer export functionality"'],
    ['gap', 400],
    ['out', '● business-analyst', 'agent', 500],
    ['out', '  ⎿ Reading CLAUDE.md, docs/architecture/overview.md, docs/domain/customer.md', 'tool', 400],
    ['out', '  ⎿ Found  ReportService (src/reports/), PermissionPolicy, TenantContext', 'tool', 400],
    ['out', '  ⎿ Constraint  customer.email, customer.phone are PII', 'warn', 400],
    ['out', '  ⎿ Constraint  every query is scoped by TenantContext', 'warn', 400],
    ['out', '  ⎿ Unknown  export volume per tenant', 'dim', 400],
    ['gap', 300],
    ['out', '? Before I write anything — 4 questions:', 'q', 600],
    ['out', '  1. Which fields may leave the system unmasked?', 'q', 500],
    ['out', '  2. Largest tenant has 1.8M customers. Sync download or background job?', 'q', 500],
    ['out', '  3. Who may export — any role with customer:read, or a new permission?', 'q', 500],
    ['out', '  4. Must exports be audited?', 'q', 500],
    ['pause', 1500],
    ['user', 'name, company, city unmasked · background job · new permission · yes, audit'],
    ['gap', 400],
    ['out', '✔ Wrote .planning/FEATURES/Customer-Export/BUSINESS_ANALYSIS.md', 'ok', 800],
    ['out', '  Source files changed: 0', 'hl', 500],
  ],

  d2: [
    ['cmd', '/feature:new Customer-Export'],
    ['gap', 300],
    ['out', '● Reading BUSINESS_ANALYSIS.md', 'agent', 500],
    ['out', '✔ Wrote .planning/FEATURES/Customer-Export/FEATURE.md', 'ok', 500],
    ['gap', 200],
    ['out', '  WHY          Account managers copy customer lists by hand (~3 h/week)', '', 1500],
    ['out', '  WHAT         CSV export of filtered customers, delivered as a download link', '', 1500],
    ['out', '  CONSTRAINTS  PII masked · own tenant only · >100k rows run as background job', 'warn', 1500],
    ['out', '  ACCEPTANCE   AC1 export respects active filters', '', 1500],
    ['out', '               AC2 email and phone are masked', '', 250],
    ['out', '               AC3 no row from another tenant', '', 250],
    ['out', '               AC4 requires customer:export permission', '', 250],
    ['out', '               AC5 every export is audited', '', 250],
    ['gap', 300],
    ['out', '  Suggested epics: Export-Pipeline · Access-And-Privacy · Export-UI', 'hl', 1200],
  ],

  d3a: [
    ['cmd', '/epic:new Customer-Export/Export-Pipeline'],
    ['out', '● epic-architect', 'agent', 400],
    ['out', '✔ EPIC.md · REQUIREMENTS.md (7 requirements, traced to AC1–AC5)', 'ok', 700],
    ['gap', 300],
    ['cmd', '/epic:roadmap Customer-Export/Export-Pipeline'],
    ['out', '● epic-roadmapper', 'agent', 400],
    ['out', '✔ ROADMAP.md  Phase 1 Job skeleton · Phase 2 Streaming CSV · Phase 3 Delivery', 'ok', 700],
    ['out', '✔ STATE.md', 'ok', 300],
  ],

  d3b: [
    ['cmd', '/epic:plan Customer-Export/Export-Pipeline 1'],
    ['out', '● epic-planner', 'agent', 500],
    ['out', '  01-01 Export-Job-Entity     owns job/*          deps —', '', 600],
    ['out', '  01-02 Stream-Csv-Writer     owns csv/*          deps 01-01', '', 600],
    ['out', '  01-03 Pii-Mask-Adapter      owns mask/*         deps 01-01', '', 600],
    ['out', '  01-04 Enqueue-From-Reports  owns export-hook.*  deps 01-02 01-03', '', 600],
    ['gap', 300],
    ['out', '  Waves: [01-01] → [01-02, 01-03] parallel → [01-04]', 'hl', 1500],
    ['out', '✔ 4 stories written to STORIES/', 'ok', 600],
  ],

  d4: [
    ['cmd', '/story:execute Customer-Export/Export-Pipeline 01-02'],
    ['gap', 300],
    ['out', '● epic-executor  (persona: backend specialist)', 'agent', 500],
    ['out', '  ⎿ Loaded story 01-02 · context: 3 files, 1 exemplar', 'tool', 400],
    ['out', '  ⎿ RED    csv-writer.test.ts — 6 failing', 'err', 700],
    ['out', '  ⎿ GREEN  src/exports/csv/CsvExportService.ts', 'ok', 1500],
    ['out', '  ⎿ Tests  6 passed, 0 failed', 'ok', 700],
    ['out', '✔ Story 01-02 complete', 'ok', 500],
    ['big', 'Done.', 'ok', 700],
  ],

  d5: [
    ['cmd', '/epic:quality-review Customer-Export/Export-Pipeline'],
    ['gap', 300],
    ['out', '● code-quality-reviewer  (rubric + 3 exemplars)', 'agent', 500],
    ['out', '  ✖ BLOCKING  CsvExportService.ts — 412 lines, 4 responsibilities', 'err', 700],
    ['out', '              (query · mask · format · upload)', 'dim', 200],
    ['out', '  ✖ BLOCKING  CsvExportService.ts:188 — catch {} swallows write failure', 'err', 700],
    ['out', '  ⚠ minor     column mapping duplicated from ReportService', 'warn', 700],
    ['gap', 300],
    ['big', 'VERDICT: CHANGES REQUIRED', 'err', 600],
    ['flash', 'err'],
    ['pause', 1500],
    ['out', '● refactoring-expert  fixing 2 blocking findings, behaviour unchanged', 'agent', 600],
    ['out', '  ⎿ split → CustomerQuery · CsvFormatter · ExportUploader', 'tool', 1200],
    ['out', '  ⎿ Tests  6 passed (unchanged)', 'ok', 1000],
    ['big', 'VERDICT: PASS', 'ok', 700],
  ],

  d6: [
    ['cmd', '/epic:qa-run Customer-Export/Export-Pipeline'],
    ['gap', 300],
    ['out', '● qa-verificator  starting stack … ready', 'agent', 2000],
    ['out', '  VT-01  AC1 filters respected   PASS  212 rows = query count', 'ok', 900],
    ['out', '  VT-02  AC2 PII masked          PASS  0 of 212 emails unmasked', 'ok', 900],
    ['out', '  VT-03  AC3 tenant isolation    PASS  tenant B token → 0 rows of tenant A', 'ok', 900],
    ['out', '  VT-04  AC4 permission          PASS  403 without customer:export', 'ok', 900],
    ['out', '  VT-05  AC5 audit entry         FAIL  audit_log empty after export', 'warn', 900],
    ['flash', 'warn'],
    ['pause', 2000],
    ['out', '● skeptic  re-checking 4 PASS verdicts … 4 confirmed', 'agent', 600],
    ['gap', 300],
    ['out', '  4/5 verified · gap story 01-05-Audit-Export-Event proposed', 'hl', 1000],
  ],

  d7: [
    ['cmd', '/epic:docs Customer-Export/Export-Pipeline 1'],
    ['gap', 300],
    ['out', '● docs-architect', 'agent', 400],
    ['out', '  ⎿ Reading 5 story records, QUALITY-REVIEW.md, VERIFICATION-REPORT.md', 'tool', 1000],
    ['out', '✔ docs/features/customer-export/phase-1.md  (functional + technical)', 'ok', 1500],
    ['gap', 300],
    ['out', '? ADR candidate: "Exports run as background jobs, not sync downloads"', 'q', 1200],
    ['out', '  Create ADR? [Y/n]', 'q', 300],
    ['pause', 800],
    ['user', 'y'],
    ['out', '✔ docs/decisions/adr-012-async-export-jobs.md', 'ok', 800],
  ],

  d8: [
    ['out', '● epic-executor', 'agent', 200],
    ['out', '  Pushing the fix:', '', 400],
    ['cmd', 'git push --force origin main'],
    ['pause', 1000],
    ['out', '  ⛔ PreToolUse hook · pre-bash-guard', 'err', 300],
    ['out', '     BLOCKED: Force push detected. Use regular push or discuss with the user first.', 'err', 300],
    ['flash', 'err'],
    ['pause', 2500],
    ['out', '  Understood — pushing a branch and opening a PR instead.', 'agent', 400],
    ['cmd', 'git push -u origin story/01-02-stream-csv-writer'],
    ['out', '  ✔ PR #482 opened', 'ok', 1200],
  ],

  // S33b — team-run: the lead pane plus three teammate panes that start together.
  d9: [
    ['cmd', '/epic:team-run Customer-Export/Export-Pipeline'],
    ['out', '● epic-team-lead  assessing state …', 'agent', 500],
    ['out', '  ⎿ state   epic Export-Pipeline · 3 phases · 0 planned · 0 done', 'tool', 800],
    ['out', '  ⎿ plan    phase 1: 4 stories · waves [01-01] → [01-02, 01-03] → [01-04]', 'tool', 1200],
    ['out', '  ⎿ wave 2  spawning 3 teammates, one worktree each ↓', 'hl', 1000],
    ['pause', 5000],
    ['out', '  ⎿ wave 2  merged 2/2 · tests ✔', 'ok', 600],
    ['out', '  ⎿ review  2 blocking → refactoring-expert → PASS', 'ok', 1200],
    ['out', '  ⎿ verify  phase 1: 5/5 AC ✔ · skeptic confirmed', 'ok', 1200],
    ['out', '  ⎿ docs    phase-1.md · adr-012 · Jira synced', 'ok', 1200],
    ['gap', 400],
    ['out', "  ⏸ /ask-human  01-03 Pii-Mask-Adapter: masking rule for field 'notes' is undefined.", 'warn', 1500],
  ],
  d9a: [
    ['pause', 5500],
    ['out', '● epic-executor · 01-02 Stream-Csv-Writer', 'agent', 0],
    ['out', '  RED    csv-writer.test.ts — 6 failing', 'err', 700],
    ['out', '  GREEN  CsvExportService.ts', 'ok', 1200],
    ['out', '  ✔ done → merge', 'ok', 900],
  ],
  d9b: [
    ['pause', 5800],
    ['out', '● epic-executor · 01-03 Pii-Mask-Adapter', 'agent', 0],
    ['out', '  RED    pii-mask.test.ts — 4 failing', 'err', 900],
    ['out', '  GREEN  PiiMask.ts', 'ok', 1300],
    ['out', '  ✔ done → merge', 'ok', 900],
  ],
  d9c: [
    ['pause', 5600],
    ['out', '● code-quality-reviewer', 'agent', 0],
    ['out', '  waiting for wave 1 …', 'dim', 300],
    ['out', '  ✖ BLOCKING  god-class, 4 responsibilities', 'err', 2600],
    ['out', '  ✖ BLOCKING  catch {} swallows failure', 'err', 500],
    ['out', '  → refactoring-expert … PASS', 'ok', 1200],
  ],

  // Non-demo terminals rendered with the same player
  s01: [
    ['cmd', 'claude'],
  ],
  s04: [
    ['out', '✔ Successfully implemented customer export.', 'ok', 0],
  ],
  s04b: [
    ['cmd', 'git diff --stat'],
    ['out', ' 47 files changed, 3812 insertions(+), 214 deletions(-)', 'hl', 700],
    ['flash', 'err'],
  ],
  s08: [
    ['cmd', 'Implement customer export.'],
  ],
  s40: [
    ['cmd', 'git log --oneline -3'],
  ],
  s41: [
    ['cmd', '/ask-human'],
    ['pause', 1000],
    ['out', '⚠ Human intervention required.', 'warn', 0],
    ['gap', 400],
    ['big', 'Q&A', '', 600],
  ],
};
