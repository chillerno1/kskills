import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';

export const PAD_SECS = 0.6;
const DRY_WORDS_PER_SEC = 2.6;

export const sh = (cmd, a) => execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();
export const duration = f => parseFloat(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));
const ext = /\.[^./]+$/;

export function parseArgs(argv) {
  const vi = argv.indexOf('--voice');
  return {
    file: argv.find((a, i) => !a.startsWith('--') && !['--voice', '--speed'].includes(argv[i - 1])),
    voice: vi >= 0 ? argv[vi + 1] : 'liora',
    dry: argv.includes('--dry'),
    speed: argv.includes('--speed') ? parseFloat(argv[argv.indexOf('--speed') + 1]) : 1,
  };
}

export function workDir(file, dry) {
  const work = file.replace(ext, dry ? '.dry.work' : '.work');
  mkdirSync(work, { recursive: true });
  return work;
}

export function apiKey() {
  if (process.env.XAI_API_KEY) return process.env.XAI_API_KEY;
  console.error('No XAI_API_KEY. Export it, or use --dry.');
  process.exit(1);
}

const silence = (secs, out) =>
  sh('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', secs.toFixed(2), out]);

// TTS is xAI because that is what I use. To use another provider, replace this function: it must write an mp3 of `text` to `out`.
export async function tts(text, out, { voice, dry }) {
  if (dry) return silence(Math.max(2, text.split(/\s+/).length / DRY_WORDS_PER_SEC), out);
  const r = await fetch('https://api.x.ai/v1/tts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice_id: voice, language: 'en' }),
  });
  if (!r.ok) throw new Error(`xAI TTS ${r.status}: ${await r.text()}`);
  writeFileSync(out, Buffer.from(await r.arrayBuffer()));
}

export async function voice(texts, work, opts) {
  const lens = [];
  for (const [i, text] of texts.entries()) {
    const mp3 = path.join(work, `s${i}.mp3`);
    if (!existsSync(mp3)) text.trim() ? await tts(text, mp3, opts) : silence(0.5, mp3);
    lens.push(duration(mp3));
  }
  return lens;
}

export function concat(work, filters) {
  const lens = filters.map((af, i) => {
    const wav = path.join(work, `s${i}.wav`);
    sh('ffmpeg', ['-y', '-v', 'error', '-i', path.join(work, `s${i}.mp3`), '-af', af, wav]);
    return duration(wav);
  });
  writeFileSync(path.join(work, 'list.txt'), filters.map((_, i) => `file 's${i}.wav'`).join('\n'));
  const audio = path.join(work, 'audio.m4a');
  sh('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(work, 'list.txt'), audio]);
  return { audio, lens };
}

export const mp4For = file => file.replace(ext, '.mp4');

export function mux(webm, audio, leadInSecs, out) {
  sh('ffmpeg', ['-y', '-v', 'error', '-ss', leadInSecs.toFixed(3), '-i', webm, '-i', audio,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-shortest', out]);
  rmSync(webm);
  console.log(`done: ${out} (${duration(out).toFixed(1)}s)`);
}

// Fast-forwards every silence over 3s (an agent working, a page loading) so it plays in about 2s,
// keeping 0.4s at each edge at normal speed, then speeds the whole video up by `speed`.
export function tighten(file, speed = 1) {
  const log = spawnSync('ffmpeg', ['-i', file, '-af', 'silencedetect=n=-45dB:d=3', '-f', 'null', '-']).stderr.toString();
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1]);
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1]);
  const total = duration(file), edge = 0.4, segs = [];
  let t = 0;
  starts.forEach((s, i) => {
    const a = s + edge, b = (ends[i] ?? total) - edge;
    segs.push([t, a, 1], [a, b, Math.max(4, (b - a) / 2)]);
    t = b;
  });
  segs.push([t, total, 1]);
  const graph = segs.map(([a, b, k], i) => {
    const r = k * speed, at = `${a.toFixed(3)}:${b.toFixed(3)}`;
    return `[0:v]trim=${at},setpts=(PTS-STARTPTS)/${r}[v${i}];[0:a]atrim=${at},asetpts=PTS-STARTPTS,atempo=${r}[a${i}];`;
  }).join('') + segs.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${segs.length}:v=1:a=1[v][a]`;
  const tmp = file.replace(ext, '.tight.mp4');
  sh('ffmpeg', ['-y', '-v', 'error', '-i', file, '-filter_complex', graph, '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', tmp]);
  renameSync(tmp, file);
  console.log(`tightened: ${starts.length} gaps fast-forwarded, ${speed}x, ${total.toFixed(1)}s -> ${duration(file).toFixed(1)}s`);
}
