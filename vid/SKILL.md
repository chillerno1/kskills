---
name: vid
description: Produce a narrated mp4 of one of three kinds. explainer (default) is a cinematic animated deck on how something works. tutorial records a real web app driven live with a visible cursor, step by step. marketing is a 30 to 60 second product spot. An Opus 5.5 agent writes the deck or the step script, xAI "liora" voices it, Playwright records, ffmpeg muxes. Use for /vid <kind> <topic>, /vid <topic>, "make an explainer video", "record a tutorial of X", "make a promo video for X".
---

# /vid [kind] <topic>

Output: an mp4 under `out/<slug>/` in the current directory, 30fps, narrated. `<skill>/scripts/` and `<skill>/briefs/` below are relative to this skill's folder; use their full paths.

The first word is the kind when it is `explainer`, `tutorial`, or `marketing`. Otherwise the kind is `explainer` and the whole text is the topic.

## Setup (once)

```bash
cd <skill>/scripts && npm i && npx playwright install chromium-headless-shell
```
Needs `ffmpeg` on PATH and `XAI_API_KEY` in the environment.

## Steps

1. Research as the kind below says. Facts, not vibes.
2. Author by delegating to an **Opus 5.5 agent**: `Agent` tool, `subagent_type: general-purpose`, `model: opus`. Its prompt is the kind's paste list below, each file's full contents verbatim and in that order, then the topic, the research, and the output path. Never write the deck or steps file yourself and never use a smaller model for it.
3. Dry run the kind's build command with `--dry` (silent narration, no API key needed). Extract 3 frames (`ffmpeg -ss <t> -i <mp4> -frames:v 1 f.png`) and look at them. Blank, clipped, or overlapping scenes, or a tutorial step that threw, go back to the Opus agent with the frame or error attached.
4. Run the build command without `--dry`. Open the mp4.
5. Report the path and length. Offer one revision round.

## Kinds

**explainer** (default). How something works. 60 to 120 seconds, 8 to 12 animated scenes.
- Research: 5 to 10 concrete facts from the repo, docs, or the web.
- Paste: `briefs/explainer.md`, `briefs/deck-rules.md`, `scripts/template.html`. The agent writes `out/<slug>/deck.html`.
- Build: `node <skill>/scripts/build.mjs out/<slug>/deck.html` produces `deck.mp4`.

**tutorial**. How to do one task in a real web app. 90 to 240 seconds. The live app is recorded while the recorder clicks and types with a visible cursor, so every frame is the real UI.
- Research: do the task yourself once in a browser on the running app (Playwright MCP or any browser tool). Note each page, each control, and the role or text that finds it. The app must be up and the flow re-runnable from the same start state. A logged-in app needs a Playwright storage state file. Hand the user this command to run in their own terminal, log in, and close the window, then set `storageState` to the file: `npx --prefix <skill>/scripts playwright codegen --save-storage=out/<slug>/auth.json <url>`. Never ask for credentials.
- Cut the noise before recording. Seed or reset the start state so the screen shows only the one record the tutorial is about, not leftover test data. When the flow switches users in one browser, check what the app keeps in `localStorage` from the first user (filters, a selected team) and have the step clear those keys, or the second user sees the first user's view.
- Slides. For a product with a brand, make `out/<slug>/intro.html` (logo, product name, the tutorial's title, one summary line) and `outro.html` (title and up to 4 bullets to remember) from `scripts/slide.html`. Take the logo file and colours from the repo. Screenshot both at the tutorial viewport before handing them on.
- Something the app sends rather than shows, such as an email, goes in as a local HTML page of the real rendered output. Centre it vertically (`body{display:flex;align-items:center;justify-content:center;min-height:100vh}`) and scale it up so it fills the frame.
- Paste: `briefs/tutorial.md`, `scripts/example/tutorial.mjs`, your research notes with the slide and page file URLs. The agent writes `out/<slug>/tutorial.mjs`.
- Build: `node <skill>/scripts/tutorial.mjs out/<slug>/tutorial.mjs` produces `tutorial.mp4`.

**marketing**. A product or feature pitch. 30 to 60 seconds, 5 to 8 scenes, ends on a call to action.
- Research: the product's own claims from its README, landing page, or changelog. Real numbers only. Brand colours from the repo's design tokens when it has them.
- Paste: `briefs/marketing.md`, `briefs/deck-rules.md`, `scripts/template.html`. The agent writes `out/<slug>/deck.html`.
- Build: same as explainer.

## Voice

Always `liora`. Do not pass `--voice` unless the user asks for another voice.

## Troubleshooting

- `No XAI_API_KEY`: export it. An xAI OAuth access token works too but expires; on 401 refresh it. `--dry` runs the whole pipeline with silence.
- Dropped or frozen deck frames: too many filters or particles. Send the frame back to the Opus agent with the constraint quoted.
- A tutorial step threw: the locator no longer matches. Redo that step in a browser, fix the locator in the steps file, rerun. The recorder writes no partial mp4.
- Tutorial cursor jumps to the centre: a cross-origin navigation reset its position. Harmless.
- Re-voicing after script edits: delete `out/<slug>/*.work/` (narration is cached there).
