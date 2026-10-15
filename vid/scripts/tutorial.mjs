#!/usr/bin/env node
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PAD_SECS, parseArgs, workDir, voice, concat, duration, mp4For, mux, tighten } from './lib.mjs';

const fail = msg => { console.error(msg); process.exit(1); };
const opts = parseArgs(process.argv.slice(2));
if (!opts.file) fail('Usage: node tutorial.mjs path/to/tutorial.mjs [--voice liora] [--speed 1.25] [--dry]');
const file = path.resolve(opts.file);
const { url, viewport = { width: 1280, height: 720 }, storageState, reset, default: steps } = await import(pathToFileURL(file));
if (!url) fail(`${file}: missing export const url = 'https://...'`);
if (!Array.isArray(steps) || !steps.length) fail(`${file}: no steps, export default [{ say, card?, run?, hold? }, ...]`);
steps.forEach((s, i) => s?.say || s?.card || s?.run || fail(`${file}: step ${i + 1} has none of say, card, run`));

const work = workDir(file, opts.dry);
const mp3s = await voice(steps.map(s => s.say ?? ''), work, opts);
const lens = mp3s.map(duration);
if (reset) execSync(reset, { stdio: 'inherit', cwd: path.dirname(file) });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport,
  recordVideo: { dir: work, size: viewport },
  storageState: storageState && path.resolve(path.dirname(file), storageState),
});
await ctx.addInitScript({ path: fileURLToPath(new URL('cursor.js', import.meta.url)) });
const tStart = Date.now();
const page = await ctx.newPage();
page.setDefaultNavigationTimeout(90_000); // a cold dev server's first load can outlast 30s
await page.goto(url);

const wait = ms => page.waitForTimeout(ms);
const firstVisible = t => (typeof t === 'string' ? page.locator(t) : t).filter({ visible: true }).first();
async function point(target, at = b => [b.x + b.width / 2, b.y + b.height / 2]) {
  const loc = firstVisible(target);
  await loc.waitFor();
  let box = await loc.boundingBox();
  const vp = page.viewportSize();
  if (box.y < 0 || box.x < 0 || box.y + box.height > vp.height || box.x + box.width > vp.width) {
    await loc.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    await wait(700);
    box = await loc.boundingBox();
  }
  await page.evaluate(([x, y]) => __vid.moveTo(x, y, 500), at(box));
  await wait(150);
  return { loc, box };
}

const ui = {
  page,
  goto: u => page.goto(u, { waitUntil: 'domcontentloaded' }),
  async click(t) {
    await ui.unspot();
    const { loc } = await point(t);
    await page.evaluate(() => __vid.click());
    await loc.click();
  },
  async type(t, text) {
    await ui.click(t);
    await firstVisible(t).pressSequentially(text, { delay: 55 });
  },
  press: key => page.keyboard.press(key),
  async hover(t) {
    const { loc } = await point(t);
    await loc.hover();
  },
  async scroll(t) {
    const byPixels = typeof t === 'number';
    await (byPixels
      ? page.evaluate(dy => scrollBy({ top: dy, behavior: 'smooth' }), t)
      : firstVisible(t).evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'smooth' })));
    await wait(800);
    if (!byPixels) await point(t);
  },
  unspot: () => page.evaluate(() => __vid.unspot()).catch(() => {}),
  async note(t) {
    // Parks the cursor just under the spotlight so it doesn't cover what the narration names.
    const below = b => [b.x + b.width / 2, Math.min(b.y + b.height + 18, page.viewportSize().height - 12)];
    const { loc } = await point(t, below);
    await loc.evaluate(el => __vid.spot(el));
  },
};

const elapsed = [];
let clock = Date.now();
const leadInSecs = (clock - tStart) / 1000;
for (const [i, step] of steps.entries()) {
  try {
    if (step.card) await page.evaluate(t => __vid.card(t), step.card);
    if (step.run) await step.run(ui);
    const rest = (lens[i] + PAD_SECS + (step.hold ?? 0)) * 1000 - (Date.now() - clock);
    if (rest > 0) await wait(rest);
    await page.evaluate(() => { __vid.unspot(); __vid.uncard(); }).catch(() => {});
  } catch (e) {
    console.error(`step ${i + 1}/${steps.length} failed: ${e.message}`);
    await ctx.close();
    await page.video().delete();
    await browser.close();
    process.exit(1);
  }
  const now = Date.now();
  elapsed.push((now - clock) / 1000);
  clock = now;
  console.log(`step ${i + 1}/${steps.length}: ${elapsed[i].toFixed(1)}s`);
}
const webm = await page.video().path();
await ctx.close();
await browser.close();

const { audio } = concat(mp3s, work, elapsed.map(e => `apad=whole_dur=${e.toFixed(3)}`));
mux(webm, audio, leadInSecs, mp4For(file, opts.dry));
if (!opts.dry) tighten(mp4For(file, opts.dry), opts.speed); // dry audio is all silence
