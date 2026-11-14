#!/usr/bin/env node
/**
 * FRANC NORD — Découpe automatique des Shorts / Reels 9:16 sur les bornes des chapitres
 *
 * Lit storyboard.json (durées réelles synchronisées), calcule le début et la fin de
 * chaque chapitre ch1, ch2, ch3, puis extrait chaque segment du MP4 9:16 complet
 * avec une coupe à l'image près (réencodage H.264 VideoToolbox + AAC, fondus audio
 * de 0,12 s / 0,25 s pour éviter tout clic). Aucune musique ajoutée.
 *
 * Usage :
 *   node decouper-shorts.mjs --episode 2026-11-14-Episode-03 \
 *     --source Franc-Nord-Episode-03-9x16.mp4 \
 *     --names "Meta-Photos-Loi25-Quebec,Crise-Logement-Loyers-Quebec,Francophonie-Cambodge-Quebec-Ottawa"
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';
const args = process.argv.slice(2);
const get = (f, d) => {
  const i = args.indexOf(f);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};
const episode = get('--episode', '2026-11-14-Episode-03');
const dir = path.join(__dirname, 'episodes', episode);
const source = path.join(dir, get('--source', 'Franc-Nord-Episode-03-9x16.mp4'));
const names = get('--names', 'Chapitre-1,Chapitre-2,Chapitre-3').split(',');
if (!fs.existsSync(source)) throw new Error('MP4 9:16 introuvable : ' + source);

const sb = JSON.parse(fs.readFileSync(path.join(dir, 'storyboard.json'), 'utf8'));
const bounds = {};
let t = 0;
for (const sc of sb.scenes) {
  const b = (bounds[sc.chapterId] ||= { start: t, end: t });
  b.end = t + sc.duration;
  t += sc.duration;
}

['ch1', 'ch2', 'ch3'].forEach((ch, i) => {
  const b = bounds[ch];
  if (!b) throw new Error('Chapitre absent : ' + ch);
  const dur = b.end - b.start;
  const out = path.join(dir, `Short-${i + 1}-${names[i]}-9x16.mp4`);
  const r = spawnSync(
    FFMPEG,
    [
      '-y', '-v', 'error',
      '-ss', b.start.toFixed(3), '-i', source, '-t', dur.toFixed(3),
      '-c:v', 'h264_videotoolbox', '-b:v', '8M', '-pix_fmt', 'yuv420p',
      '-af', `afade=t=in:d=0.12,afade=t=out:st=${(dur - 0.25).toFixed(3)}:d=0.25`,
      '-c:a', 'aac', '-b:a', '192k',
      '-movflags', '+faststart', out
    ],
    { encoding: 'utf8' }
  );
  if (r.status !== 0) throw new Error(`FFmpeg ${ch} : ${r.stderr}`);
  console.log(`✅ ${path.basename(out)}  ${b.start.toFixed(2)} → ${b.end.toFixed(2)} s  (${dur.toFixed(2)} s)`);
});
