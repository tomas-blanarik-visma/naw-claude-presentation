/* Shared by the page (window.NAW_TIMELINE) and tools/render-video.mjs (module.exports).
   Each scene: [id (section id in index.html), length in s, voice lead in s, voiceover line].
   Scenes play back to back with a 0.2 s crossfade; voiceover line N (file vo/line-N.mp3)
   starts `lead` seconds into scene N. Scene code in video.js uses times local to its scene,
   tuned to the ElevenLabs takes (2026-10-13). */
(function (root) {
  const XFADE = 0.2;
  const SCENES = [
    ['hook', 8.0, 1.0, 'Monday morning. You ask your AI agent for one small feature.'],
    ['frenzy', 10.0, 0.4, 'Certainly! it says. And forty-seven files later…'],
    ['damage', 8.5, 0.5, '…it has invented an API, skipped every single test, and it is very, very proud of itself.'],
    ['harder', 10.0, 0.5, 'So you prompt harder. Capital letters. Pretty please. And you get… the same rocket.'],
    ['model', 11.7, 0.6, "Here's the thing. Your model is brilliant. But even a brilliant new hire fails without onboarding. No context. No plan. No review."],
    ['meet', 11.7, 0.5, 'Meet NAW. The Native Agentic Workflow. It lives in your repo, right next to your code, and turns one eager agent into a real engineering team.'],
    ['questions', 11.9, 0.5, "It starts with questions, not code. Which fields are personal data? Who is allowed to export? Not a single line written yet. That's the point."],
    ['breakdown', 10.7, 0.5, 'Then it breaks the work down, the way your team already does. A feature. Epics. Small stories with clear acceptance criteria.'],
    ['team', 10.4, 0.5, 'Every agent has one job. A planner plans. A developer builds. A reviewer says no. Often.'],
    ['evidence', 9.1, 0.5, "And a verifier won't take “done” for an answer. It wants evidence. From the running system, not from vibes."],
    ['guard', 7.6, 0.5, 'Guardrails catch the dangerous stuff. Force push to main? Not today.'],
    ['auto', 11.0, 0.5, 'Want autonomy? One command runs the whole loop in parallel. And when something needs a real decision, it stops, and asks a human.'],
    ['same', 6.1, 0.5, 'Same model. Same price per token. A completely different system.'],
    ['end', 7.4, 0.5, 'NAW. Own the workflow. Rent the intelligence.'],
  ];

  const scenes = [];
  const vo = [];
  let at = 0;
  SCENES.forEach(([id, length, lead, text]) => {
    scenes.push([id, at, at + length]);
    vo.push({ at: at + lead, text });
    at += length - XFADE;
  });
  const TIMELINE = { duration: scenes[scenes.length - 1][2], fps: 30, scenes, vo };

  if (typeof module !== 'undefined') module.exports = TIMELINE;
  else root.NAW_TIMELINE = TIMELINE;
})(this);
