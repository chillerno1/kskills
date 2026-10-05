Deliverable: one self-contained HTML file. Keep the `<script>` runtime at the bottom of the template exactly as it is (`go`, `scenes`, `enter`/`leave` events). Everything else, including the `<style>`, is yours to replace.

Scenes
- Each scene is one `<section data-say="...">`. Narration is 1 to 3 spoken sentences, plain words, no symbols, no code, no markdown. Narration is never shown as on-screen text.
- Add `data-hold="N"` seconds to a scene when its visual needs time after the narration ends.
- Scenes crossfade automatically (0.5s). Design intros and outros inside each scene anyway: things should fly in, settle, and sometimes get knocked out by the next idea.
- Allowed tools: CSS animations, Web Animations API, SVG, canvas 2D, and three.js from a CDN for one or two hero moments. Start loops on the section's `enter` event and stop them on `leave`.

Hard constraints (the renderer is headless Chromium on CPU at 1280x720)
- Prefer `transform` and `opacity`. At most one `filter: blur()` element on screen at a time. No full-screen `backdrop-filter`.
- Canvas particles: up to about 400. three.js: low poly, no post-processing passes, one scene at a time.
- Nothing may overflow the 1280x720 frame or overlap other text.
- Fonts: system stack or one Google Fonts link. No external images. Everything drawn in code.
- Each scene's visuals must be settled within 3 seconds of entering, then keep breathing until it leaves.

Output only the finished HTML to the given path. Then list, in 5 lines or fewer, the hero moment of each scene.
