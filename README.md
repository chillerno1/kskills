# kskills

Agent skills in the open Agent Skills format (`SKILL.md` plus `scripts/`).

| Skill | What it does |
|---|---|
| `vid/` | Narrated mp4 of three kinds: explainer, tutorial (records a real web app), marketing. An Opus agent writes it, xAI voices it, Playwright records, ffmpeg muxes |
| `replay-back/` | Ask the agent to restate your goals and the problem in its own words, to check it understood you |
| `resolve-oss-issue/` | Work a GitHub issue end to end: check it is not already known or fixed, turn its asks into an acceptance list, reproduce or match existing behaviour, test first, verify, open the PR |
| `pstack/` | Claude Code port of [cursor/plugins/pstack](https://github.com/cursor/plugins/tree/main/pstack) (MIT, by Lauren Tan). See `pstack/README.md` |

## Install

```bash
git clone https://github.com/chillerno1/kskills.git ~/Projects/kskills
for s in vid replay-back resolve-oss-issue; do ln -s ~/Projects/kskills/$s ~/.claude/skills/$s; done
```

`vid` needs a one-off `npm i && npx playwright install chromium-headless-shell` in `vid/scripts/`, plus `ffmpeg` and an `XAI_API_KEY`. I use xAI for text-to-speech; to use another provider, swap `tts()` in `vid/scripts/lib.mjs`. pstack install is in `pstack/README.md`.

## Licence

MIT, see `LICENSE`. `pstack/` keeps its own MIT licence.
