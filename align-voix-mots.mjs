#!/usr/bin/env node
/**
 * FRANC NORD — Alignement voix ⇄ texte AU MOT PRÈS (zéro dépendance npm)
 *
 * Entrées (dans episodes/<dossier>/) :
 *   • storyboard.json                 (narration de chaque scène)
 *   • voice-transcript-*.json         (transcription horodatée faster-whisper, word_timestamps)
 *   • voix.mp3                        (pour la durée exacte)
 *
 * Méthode : alignement de séquences Needleman-Wunsch entre les mots du script
 * et les mots reconnus (similarité normalisée : accents, apostrophes, nombres).
 * Les mots non reconnus (« un virgule deux » ↔ « 1,2 ») sont interpolés entre
 * leurs voisins ancrés. Aucune modification de vitesse de la voix.
 *
 * Sorties dans storyboard.json :
 *   • scene.duration  : durée réelle (s) — la somme = durée de voix.mp3 + tenue finale
 *   • scene.wordTimes : [[indexCaractère, secondes locales], …] pour chaque mot
 *   • totalDurationSeconds, voiceFile, productionStatus
 * + alignment-report.json (taux d'appariement, bornes de scènes).
 *
 * Usage : node align-voix-mots.mjs --episode 2026-11-14-Episode-03 [--tail 2.6] [--dry]
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (f, d) => {
  const i = args.indexOf(f);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};
const episode = get('--episode', '2026-11-14-Episode-03');
const tail = Number(get('--tail', '2.6'));
const dry = args.includes('--dry');
const dir = path.join(__dirname, 'episodes', episode);
const sbPath = path.join(dir, 'storyboard.json');
const voice = path.join(dir, 'voix.mp3');
const transcriptFile = fs.readdirSync(dir).find((f) => /^voice-transcript.*\.json$/.test(f));
if (!transcriptFile) throw new Error('Aucune transcription voice-transcript-*.json dans ' + dir);

const FFPROBE = fs.existsSync('/opt/homebrew/bin/ffprobe') ? '/opt/homebrew/bin/ffprobe' : 'ffprobe';
const probe = spawnSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', voice], { encoding: 'utf8' });
const audioDuration = Number(probe.stdout.trim());
if (!audioDuration) throw new Error('Durée de voix.mp3 illisible');

const storyboard = JSON.parse(fs.readFileSync(sbPath, 'utf8'));
const transcript = JSON.parse(fs.readFileSync(path.join(dir, transcriptFile), 'utf8'));

/* ── Normalisation ─────────────────────────────────────────────── */
const UNITS = { zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, cent: 100, mille: 1000 };
const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9]/g, '');

/** Découpe un texte en jetons {n: normalisé, i: index caractère}. Apostrophes et traits d'union séparent. */
function tokenize(text) {
  const out = [];
  const re = /[\p{L}\p{N}]+/gu;
  let m;
  while ((m = re.exec(text))) {
    const n = norm(m[0]);
    if (n) out.push({ n, i: m.index });
  }
  return out;
}

/** Similarité 0..1 (distance de Levenshtein normalisée, bonus nombres). */
function sim(a, b) {
  if (a === b) return 1;
  if (UNITS[a] !== undefined && String(UNITS[a]) === b) return 0.9;
  if (UNITS[b] !== undefined && String(UNITS[b]) === a) return 0.9;
  const la = a.length;
  const lb = b.length;
  if (!la || !lb) return 0;
  const dp = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) dp[j] = j;
  for (let i = 1; i <= la; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= lb; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return 1 - dp[lb] / Math.max(la, lb);
}

/* ── Jetons du script (avec scène et index caractère) ──────────── */
const script = [];
storyboard.scenes.forEach((sc, si) => {
  for (const t of tokenize(sc.narration)) script.push({ ...t, si });
});

/* ── Jetons reconnus (temps répartis si un mot ASR contient une apostrophe) ── */
const asr = [];
for (const seg of transcript) {
  for (const w of seg.words || []) {
    const toks = tokenize(w.word);
    if (!toks.length) continue;
    const span = (w.end - w.start) / toks.length;
    toks.forEach((t, k) => asr.push({ n: t.n, start: w.start + span * k, end: w.start + span * (k + 1) }));
  }
}

/* ── Needleman-Wunsch ──────────────────────────────────────────── */
const N = script.length;
const M = asr.length;
const GAP = -0.45;
const score = new Float32Array((N + 1) * (M + 1));
const move = new Uint8Array((N + 1) * (M + 1)); // 1 diag, 2 haut (script sans ASR), 3 gauche (ASR sans script)
const idx = (i, j) => i * (M + 1) + j;
for (let i = 1; i <= N; i++) {
  score[idx(i, 0)] = i * GAP;
  move[idx(i, 0)] = 2;
}
for (let j = 1; j <= M; j++) {
  score[idx(0, j)] = j * GAP;
  move[idx(0, j)] = 3;
}
for (let i = 1; i <= N; i++) {
  for (let j = 1; j <= M; j++) {
    const s = sim(script[i - 1].n, asr[j - 1].n);
    const d = score[idx(i - 1, j - 1)] + (s >= 0.6 ? s : s - 1.1);
    const u = score[idx(i - 1, j)] + GAP;
    const l = score[idx(i, j - 1)] + GAP;
    if (d >= u && d >= l) {
      score[idx(i, j)] = d;
      move[idx(i, j)] = 1;
    } else if (u >= l) {
      score[idx(i, j)] = u;
      move[idx(i, j)] = 2;
    } else {
      score[idx(i, j)] = l;
      move[idx(i, j)] = 3;
    }
  }
}
const times = new Array(N).fill(null);
let matched = 0;
for (let i = N, j = M; i > 0 || j > 0; ) {
  const mv = move[idx(i, j)];
  if (mv === 1) {
    if (sim(script[i - 1].n, asr[j - 1].n) >= 0.6) {
      times[i - 1] = { start: asr[j - 1].start, end: asr[j - 1].end };
      matched++;
    }
    i--;
    j--;
  } else if (mv === 2) i--;
  else j--;
}

/* ── Interpolation des mots non ancrés (au prorata des caractères) ── */
const firstSpeech = asr.length ? asr[0].start : 0;
const lastSpeech = asr.length ? asr[asr.length - 1].end : audioDuration;
for (let i = 0; i < N; i++) {
  if (times[i]) continue;
  let a = i - 1;
  while (a >= 0 && !times[a]) a--;
  let b = i + 1;
  while (b < N && !times[b]) b++;
  const tA = a >= 0 ? times[a].end : firstSpeech;
  const tB = b < N ? times[b].start : lastSpeech;
  const wA = a >= 0 ? a : -1;
  const k = (i - wA) / (b - wA);
  const t = tA + (tB - tA) * k;
  times[i] = { start: t, end: t, interpolated: true };
}

/* ── Coupe entre deux scènes ───────────────────────────────────── */
/**
 * Place la coupe entre la fin du dernier mot d'une scène (prevEnd) et le
 * début du premier mot de la suivante (nextStart), en secondes absolues.
 * La transition de marque (3 bandes diagonales) dure 0,48 s à partir de la coupe.
 */
function sceneCut(prevEnd, nextStart) {
  // TODO(human): choisir le placement de la coupe (voir la demande « Learn by Doing »).
  // Défaut : couper 0,32 s avant le premier mot, sans jamais empiéter sur le mot précédent.
  return Math.max(prevEnd + 0.04, nextStart - 0.32);
}

const S = storyboard.scenes.length;
const bounds = [0];
for (let si = 1; si < S; si++) {
  const lastPrev = script.map((t, k) => ({ t, k })).filter((x) => x.t.si === si - 1).pop().k;
  const firstNext = script.findIndex((t) => t.si === si);
  bounds.push(sceneCut(times[lastPrev].end, times[firstNext].start));
}
const totalEnd = audioDuration + tail;
bounds.push(totalEnd);

storyboard.scenes.forEach((sc, si) => {
  const start = bounds[si];
  sc.duration = +(bounds[si + 1] - start).toFixed(3);
  sc.wordTimes = script
    .map((t, k) => ({ t, k }))
    .filter((x) => x.t.si === si)
    .map(({ t, k }) => [t.i, +Math.max(0, times[k].start - start).toFixed(3)]);
  delete sc.voiceSync;
});
const total = storyboard.scenes.reduce((a, s) => a + s.duration, 0);
storyboard.totalDurationSeconds = +total.toFixed(3);
storyboard.voiceFile = 'voix.mp3';
storyboard.productionStatus = {
  voice: 'word-aligned',
  voiceSha256: createHash('sha256').update(fs.readFileSync(voice)).digest('hex'),
  audioDurationSeconds: audioDuration,
  finalHoldSeconds: tail,
  alignment: `${matched}/${N} mots du script ancrés sur la transcription horodatée ; autres interpolés`
};

const fmt = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;
console.log(`🎙️  Alignement au mot — ${transcriptFile} (${M} mots reconnus) ⇄ script (${N} mots)`);
console.log(`   Ancrés : ${matched}/${N} (${((matched / N) * 100).toFixed(1)} %) • voix ${audioDuration.toFixed(3)} s + tenue ${tail} s`);
storyboard.scenes.forEach((sc, si) => console.log(`   ${String(si + 1).padStart(2)}. ${fmt(bounds[si])}  ${sc.duration.toFixed(2).padStart(6)} s  ${sc.id}`));
console.log(`   Total : ${fmt(total)}`);

const report = {
  transcript: transcriptFile,
  scriptWords: N,
  recognizedWords: M,
  matchedWords: matched,
  audioDurationSeconds: audioDuration,
  finalHoldSeconds: tail,
  totalDurationSeconds: +total.toFixed(3),
  scenes: storyboard.scenes.map((sc, si) => ({ id: sc.id, chapterId: sc.chapterId, start: +bounds[si].toFixed(3), end: +bounds[si + 1].toFixed(3) }))
};
if (dry) console.log('   --dry : aucun fichier écrit.');
else {
  fs.writeFileSync(sbPath, JSON.stringify(storyboard, null, 2) + '\n');
  fs.writeFileSync(path.join(dir, 'alignment-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('✅ storyboard.json + alignment-report.json écrits.');
}
