# NAW promo video (EN, 2:11)

Voiceover text: [VOICEOVER.md](VOICEOVER.md). Timing: [timeline.js](timeline.js). Picture: [index.html](index.html) + [video.js](video.js).
Look: the deck's visual language (dark terminal, red for chaos, green for proof).

| Scene | Time | Picture |
|-------|------|---------|
| hook | 0:00 | "MONDAY · 09:00", the prompt `Implement customer export.`, then "Certainly! 🚀" |
| frenzy | 0:07 | Terminal frenzy, counter races to 47 files, red heat, "✔ Successfully implemented." |
| damage | 0:17 | Debris flying past: "Invented APIs. Zero tests. Very proud." |
| harder | 0:25 | `IMPLEMENT. CUSTOMER. EXPORT. PLEASE. 🙏` gets the same "Certainly! 🚀", and a rocket flies across |
| model | 0:35 | "Don't prompt harder." · onboarding · CONTEXT / PLAN / TOOLS / REVIEW light up, MODEL stays dim |
| meet | 0:47 | NAW logo, the repo folders, the agent team |
| questions | 0:58 | `/ba:analyze` asks three questions · "Source files changed: 0" |
| breakdown | 1:10 | Feature → epics → stories tree · "Same words as your Jira." |
| team | 1:20 | Chat: Planner, Developer, Reviewer "No.", Developer "Fixed." |
| evidence | 1:31 | Verification report 4 ✔, 1 ✖ → gap story, skeptic |
| guard | 1:40 | `git push --force` → BLOCKED → "Not today." stamp → PR opened |
| auto | 1:47 | team-run: the lead and 3 panes in parallel, ending on `/ask-human` |
| same | 1:58 | Prompt & pray vs. With NAW · "Same model. Different system." |
| end | 2:04 | NAW · "Own the workflow. Rent the intelligence." · `/plugin install …` |

## Build

- **Preview:** open `video/index.html` in Chrome and click. With `video/build/audio.mp3` present (`node tools/render-video.mjs --audio`) it plays with sound.
- **Render:** `npm run video` writes `video/build/naw-promo.mp4` (1920×1080, 30 fps).
- **Voice:** `video/vo/line-1.mp3` … `line-14.mp3`, one file per line of VOICEOVER.md. A missing line falls back to macOS `say`. The render warns when a line runs past the next cue; then lengthen that scene (or its voice lead) in `video/timeline.js`. Later scenes move with it, but the in-scene animation times in `video.js` do not.
- **Music:** optional `video/music.mp3`, ducked under the voice (sidechain) and faded out over the last 2 s.
