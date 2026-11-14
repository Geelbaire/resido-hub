#!/usr/bin/env node
/**
 * FRANC NORD — Synchronisation automatique Voix ⇄ Vidéo (zéro dépendance npm)
 *
 * Lit episodes/YYYY-MM-DD/voix.(m4a|wav|mp3|webm), détecte les pauses de la voix
 * (FFmpeg silencedetect), aligne chaque phrase de la narration sur ces pauses
 * (programmation dynamique tolérante aux phrases enchaînées sans respiration),
 * puis réécrit storyboard.json :
 *   • scene.duration         → durée réelle de chaque scène dans votre lecture
 *   • scene.voiceSync         → minutage réel de chaque phrase (s, relatif à la scène)
 *   • totalDurationSeconds    → durée totale réelle
 * Les temps forts de scenes-custom.js se recalent alors tout seuls sur la voix.
 *
 * Usage :
 *   /opt/homebrew/bin/node sync-voix.mjs --episode 2026-11-14
 *   /opt/homebrew/bin/node sync-voix.mjs --episode 2026-11-14 --tail 2.7 --dry
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG_BIN = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';

const args = process.argv.slice(2);
const get = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const episode = get('--episode', '2026-11-14');
const tail = Number(get('--tail', '2.7')); // tenue finale après le dernier mot (s)
const noiseDb = get('--noise', '-38dB');
const dryRun = args.includes('--dry');

const episodeDir = path.join(__dirname, 'episodes', episode);
const storyboardPath = path.join(episodeDir, 'storyboard.json');
const voice = ['voix.m4a', 'voix.wav', 'voix.mp3', 'voix.webm']
  .map((n) => path.join(episodeDir, n))
  .find((p) => fs.existsSync(p));
if (!voice) throw new Error(`Aucun fichier voix.* dans ${episodeDir}`);

// 1. Détection des pauses
const ff = spawnSync(
  FFMPEG_BIN,
  ['-hide_banner', '-nostats', '-i', voice, '-af', `silencedetect=noise=${noiseDb}:d=0.28`, '-f', 'null', '-'],
  { encoding: 'utf8' }
);
const log = ff.stderr || '';
const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
const ends = [...log.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
const durMatch = log.match(/Duration: (\d+):(\d+):([\d.]+)/);
const audioDuration = durMatch ? +durMatch[1] * 3600 + +durMatch[2] * 60 + +durMatch[3] : 0;
let sil = starts.map((s, i) => ({
  s,
  e: ends[i] ? ends[i][0] : audioDuration,
  d: ends[i] ? ends[i][1] : audioDuration - s,
  mid: (s + (ends[i] ? ends[i][0] : audioDuration)) / 2
}));
const lastIsTail = sil.length && sil.at(-1).e >= audioDuration - 0.05;
const speechEnd = lastIsTail ? sil.at(-1).s : audioDuration;
if (lastIsTail) sil = sil.slice(0, -1);
const firstIsHead = sil.length && sil[0].s <= 0.05;
const speechStart = firstIsHead ? sil[0].e : 0.25;
if (firstIsHead) sil = sil.slice(1);

// 2. Phrases de la narration
const storyboard = JSON.parse(fs.readFileSync(storyboardPath, 'utf8'));
const sents = [];
storyboard.scenes.forEach((sc, si) => {
  let from = 0;
  sc.narration.split(/(?<=[.?!])\s+/u).forEach((p, pi) => {
    const idx = sc.narration.indexOf(p, from);
    sents.push({ si, pi, len: p.length + 1, from: idx, to: idx + p.length });
    from = idx + p.length;
  });
});
const N = sents.length;
const cum = [0];
for (const s of sents) cum.push(cum.at(-1) + s.len);
const rate = (speechEnd - speechStart) / cum[N];
const isScene = (k) => k > 0 && k < N && sents[k].pi === 0;

// 3. Alignement par programmation dynamique (frontière de phrase ⇄ pause)
const nodes = [{ k: 0, t: speechStart, j: -1, d: 0 }];
for (let k = 1; k < N; k++) for (let j = 0; j < sil.length; j++) nodes.push({ k, t: sil[j].mid, j, d: sil[j].d });
nodes.push({ k: N, t: speechEnd, j: sil.length, d: 0 });
const best = new Float64Array(nodes.length).fill(Infinity);
const prev = new Int32Array(nodes.length).fill(-1);
best[0] = 0;
const skipCost = new Float64Array(sil.length + 1);
for (let j = 0; j < sil.length; j++) skipCost[j + 1] = skipCost[j] + Math.max(0, sil[j].d - 0.26) * 40;
for (let b = 1; b < nodes.length; b++) {
  const B = nodes[b];
  for (let a = 0; a < b; a++) {
    const A = nodes[a];
    if (!(A.k < B.k && A.j < B.j) || !isFinite(best[a])) continue;
    const expected = (cum[B.k] - cum[A.k]) * rate;
    const sd = 0.09 * expected + 0.6;
    let c = ((B.t - A.t - expected) / sd) ** 2;
    for (let k = A.k + 1; k < B.k; k++) c += isScene(k) ? 9 : 2.2;
    c += skipCost[Math.max(0, B.j)] - skipCost[A.j + 1];
    if (B.k < N) c -= B.d * 6;
    if (best[a] + c < best[b]) {
      best[b] = best[a] + c;
      prev[b] = a;
    }
  }
}
const pathNodes = [];
for (let x = nodes.length - 1; x > 0; x = prev[x]) pathNodes.unshift(nodes[x]);
const anchors = [[0, speechStart], ...pathNodes.map((p) => [p.k, p.t])];
const anchored = new Set(pathNodes.map((p) => p.k));
const timeAt = (k) => {
  for (let i = 1; i < anchors.length; i++) {
    const [k1, t1] = anchors[i];
    const [ka, ta] = anchors[i - 1];
    if (k <= k1) return ta + ((t1 - ta) * (cum[k] - cum[ka])) / (cum[k1] - cum[ka]);
  }
  return speechEnd;
};

// 4. Réécriture du storyboard
const sceneStarts = storyboard.scenes.map((_, si) => (si === 0 ? 0 : timeAt(sents.findIndex((s) => s.si === si))));
const finalEnd = speechEnd + tail;
let total = 0;
storyboard.scenes.forEach((sc, si) => {
  const start = sceneStarts[si];
  const end = si + 1 < sceneStarts.length ? sceneStarts[si + 1] : finalEnd;
  sc.duration = +(end - start).toFixed(2);
  total += sc.duration;
  sc.voiceSync = {
    sentences: sents
      .map((s, k) => ({ s, k }))
      .filter(({ s }) => s.si === si)
      .map(({ s, k }) => ({
        start: +(timeAt(k) - start).toFixed(2),
        end: +(timeAt(k + 1) - start).toFixed(2),
        from: s.from,
        to: s.to,
        anchored: k === 0 || anchored.has(k)
      }))
  };
});
storyboard.totalDurationSeconds = +total.toFixed(2);
storyboard.voiceFile = path.basename(voice);

const fmt = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;
console.log(`🎙️  FRANC NORD — Synchronisation voix (${path.basename(voice)}, ${audioDuration.toFixed(2)} s)`);
console.log(`   Parole : ${fmt(speechStart)} → ${fmt(speechEnd)} • ${sil.length} pauses détectées`);
storyboard.scenes.forEach((sc, si) => {
  const a = sc.voiceSync.sentences.filter((s) => s.anchored).length;
  console.log(
    `   ${String(si + 1).padStart(2)}. ${fmt(sceneStarts[si])}  ${sc.duration.toFixed(2).padStart(6)} s  ` +
      `(${a}/${sc.voiceSync.sentences.length} phrases ancrées)  ${sc.id}`
  );
});
console.log(`   Durée vidéo : ${fmt(total)} (dont ${tail} s de tenue finale)`);
if (dryRun) {
  console.log('   --dry : storyboard.json non modifié.');
} else {
  fs.writeFileSync(storyboardPath, JSON.stringify(storyboard, null, 2) + '\n');
  console.log(`✅ ${path.relative(__dirname, storyboardPath)} mis à jour.`);
}
