#!/usr/bin/env node
import { chromium } from 'playwright';
import path from 'node:path';
import { PAD_SECS, parseArgs, workDir, voice, concat, mp4For, mux } from './lib.mjs';

const opts = parseArgs(process.argv.slice(2));
if (!opts.file) { console.error('Usage: node build.mjs path/to/deck.html [--voice liora] [--dry]'); process.exit(1); }
const deck = path.resolve(opts.file);
const work = workDir(deck, opts.dry);

const browser = await chromium.launch();
const page0 = await browser.newPage();
await page0.goto('file://' + deck);
const scenes = await page0.evaluate(() => window.scenes());
await page0.close();
if (!scenes.length) throw new Error('No <section data-say> scenes found');

await voice(scenes.map(s => s.say), work, opts);
const { audio, lens } = concat(work, scenes.map(s => `apad=pad_dur=${PAD_SECS + s.hold}`));
lens.forEach((len, i) => console.log(`scene ${i + 1}/${scenes.length}: ${len.toFixed(1)}s`));

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: work, size: { width: 1280, height: 720 } } });
const t0 = Date.now();
const page = await ctx.newPage();
await page.goto('file://' + deck);
await page.evaluate(() => go(0));
const leadInSecs = (Date.now() - t0) / 1000;
for (const [i, len] of lens.entries()) {
  if (i) await page.evaluate(i => go(i), i);
  await page.waitForTimeout(len * 1000);
}
const webm = await page.video().path();
await ctx.close();
await browser.close();

mux(webm, audio, leadInSecs, mp4For(deck));
