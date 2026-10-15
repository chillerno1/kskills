---
name: vid
description: Produce a narrated mp4 of one of three kinds. explainer (default) is a cinematic animated deck on how something works. tutorial records a real web app driven live with a visible cursor, step by step. marketing is a 30 to 60 second product spot. An Opus 5.5 agent writes the deck or the step script, xAI TTS voices it (liora by default), Playwright records, ffmpeg muxes. Use for /vid <kind> <topic>, /vid <topic>, "make an explainer video", "record a tutorial of X", "make a promo video for X".
---

# /vid [kind] <topic>

Output: an mp4 under `out/<slug>/` in the current directory, 30fps, narrated. `out/` is scratch and holds research and `auth.json`: when the cwd is a git repo, make sure `out/` is ignored before writing to it. When the user names a place for the video, copy the final mp4 there under a descriptive name. `<skill>/scripts/` and `<skill>/briefs/` below are relative to this skill's folder; use their full paths.

The first word is the kind when it is `explainer`, `tutorial`, or `marketing`. Otherwise the kind is `explainer` and the whole text is the topic.

## Setup (once)

```bash
cd <skill>/scripts && npm i && npx playwright install chromium-headless-shell
```
Needs `ffmpeg` on PATH and `XAI_API_KEY` in the environment.

## Steps

1. Research as the kind below says. Facts, not vibes. Every claim the narration will make (what a status does, who reviews what) needs a source: the app's behaviour or its code. Features that are planned but not built stay out, even when the data model has them.
2. Author by delegating to an **Opus 5.5 agent**: `Agent` tool, `subagent_type: general-purpose`, `model: opus`. Its prompt is the kind's paste list below, each file's full contents verbatim and in that order, then the topic, the research, and the output path. Never write the deck or the narration and structure of the steps file yourself, and never use a smaller model for it. Mechanical fixes (a locator, a wait, a removed hover) are yours.
3. Dry run the kind's build command with `--dry` (silent narration, no API key needed); it writes `<name>.dry.mp4`. Pull one frame per scene or step at the moment its narration names something (`ffmpeg -ss <t> -i <mp4> -frames:v 1 f.png`; a tutorial build logs each step's length as `step N/M: Xs`) and look at them. Blank, clipped, or overlapping scenes, or a tutorial step that threw, go back to the Opus agent with the frame or error attached. Clipped content is fixed in the recording setup (viewport, layout, a silent sidebar collapse), never by cutting what the narration says.
4. Run the build command without `--dry`. Check the narration is there (`ffmpeg -i <mp4> -af volumedetect -f null -`: a mean near -91 dB is silence), re-pull frames for steps that changed, and open the mp4. The step-log times only hold for the `.dry.mp4`: a real tutorial build fast-forwards long silences afterwards, so its steps land earlier than the log says; pull a frame or two before the logged time and check by eye. Report only the checks you ran.
5. Report the path, the length, and the timestamps of anything that changed. Expect several revision rounds. The user often sends notes in pieces ("wait for more feedback"): keep one running list and rebuild only when they say go. Send each round to the same Opus agent with `SendMessage`, update the research notes in place (current state, a short changelog at the end), and re-check the outro bullets against the current steps.

## Kinds

**explainer** (default). How something works. 60 to 120 seconds, 8 to 12 animated scenes.
- Research: 5 to 10 concrete facts from the repo, docs, or the web.
- Paste: `briefs/explainer.md`, `briefs/deck-rules.md`, `scripts/template.html`. The agent writes `out/<slug>/deck.html`.
- Build: `node <skill>/scripts/build.mjs out/<slug>/deck.html` produces `deck.mp4`.

**tutorial**. How to do one task in a real web app. 90 to 240 seconds. The live app is recorded while the recorder clicks and types with a visible cursor, so every frame is the real UI.
- Before researching, put a short outline to the user: the steps, the controls their users touch most, anything not built yet, and the tool they used before. Record the audience's prior tool and its vocabulary in the research.
- Research: do the task yourself once in a browser on the running app (Playwright MCP or any browser tool), at the final recording viewport. Note each page, each control, and the role or text that finds it. On the widest page, compare a table's `scrollWidth` to its `clientWidth`; data-dense apps start at 1920x1080, often with the nav collapsed silently. The app must be up and the flow re-runnable from the same start state. A logged-in app needs a Playwright storage state file. Hand the user this command to run in their own terminal, log in, and close the window, then set `storageState` to the file: `npx --prefix <skill>/scripts playwright codegen --save-storage=out/<slug>/auth.json <url>`. Never ask for credentials.
- Confirm the requested role can do the whole flow; ask if it cannot. List any UX oddity met on the way (an "optional" field that is really the record's name, an awkward input format, a missing field) and offer it to the user as an app fix before recording, instead of narrating around it.
- Cut the noise before recording. Seed or reset the start state so the screen shows only the one record the tutorial is about, not leftover test data. When the flow creates records with fixed names or codes, give the agent the reset command for `export const reset`; the recorder runs it before every build, dry runs included. Features that show history (charts, logs, consumed totals) need a seeded record that already has it; use that record for those steps, not the one the flow creates. When the flow switches users in one browser, check what the app keeps in `localStorage` from the first user (filters, a selected team) and have the step clear those keys, or the second user sees the first user's view.
- Slides. For a product with a brand, make `out/<slug>/intro.html` (logo, product name, the tutorial's title, one summary line) and `outro.html` (title and up to 4 bullets to remember) from `scripts/slide.html`. Take the logo file and colours from the repo. Screenshot both at the tutorial viewport before handing them on.
- Something the app sends rather than shows, such as an email, goes in as a local HTML page of the real rendered output. Centre it vertically (`body{display:flex;align-items:center;justify-content:center;min-height:100vh}`) and scale it up so it fills the frame.
- Paste: `briefs/tutorial.md`, `scripts/example/tutorial.mjs`, your research notes with the slide and page file URLs. The agent writes `out/<slug>/tutorial.mjs`.
- Build: `node <skill>/scripts/tutorial.mjs out/<slug>/tutorial.mjs` produces `tutorial.mp4`. Silences over 3s (an agent working, a page loading) are fast-forwarded to about 2s; add `--speed 1.25` to speed the whole video up too.

**marketing**. A product or feature pitch. 30 to 60 seconds, 5 to 8 scenes, ends on a call to action.
- Research: the product's own claims from its README, landing page, or changelog. Real numbers only. Brand colours from the repo's design tokens when it has them.
- Paste: `briefs/marketing.md`, `briefs/deck-rules.md`, `scripts/template.html`. The agent writes `out/<slug>/deck.html`.
- Build: same as explainer.

## Voice

Default `liora`. Pass `--voice <name>` when the user asks for another, and keep it for every rerun. When the user describes a voice instead of naming it, check xAI's voice list rather than searching old sessions. Narration is cached by voice and text, so a voice or script change re-voices only what changed.

## Troubleshooting

- `No XAI_API_KEY`: export it. An xAI OAuth access token works too but expires: on a 401 or 403, refresh it and re-export `XAI_API_KEY`, never printing the token. `--dry` runs the whole pipeline with silence.
- Dropped or frozen deck frames: too many filters or particles. Send the frame back to the Opus agent with the constraint quoted.
- A tutorial step threw: the locator no longer matches. Redo that step in a browser, fix the locator in the steps file, rerun. The recorder writes no partial mp4.
- `Timeout 30000ms` with "intercepts pointer events": the target sits under a dialog's backdrop. Act inside the dialog or close it first.
- Tutorial cursor jumps to the centre: a cross-origin navigation reset its position. Harmless.
