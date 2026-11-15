const fs = require('fs');
const path = require('path');
process.chdir(__dirname);
let L = fs.readFileSync('engine-body.js', 'utf8').split('\n');
const i = L.findIndex((l) => l.startsWith('function cityTag'));
let j = i;
while (L[j] !== '}') j++;
L = L.slice(0, j + 1);
let s = L.join('\n');
const head = `/**
 * FRANC NORD — Épisode #4 · SPÉCIAL REPORTAGE (2026-11-14)
 * « Épicerie sous algorithme » — étiquettes électroniques, baux secrets, règle des 15 $
 * 13 scènes cinématiques plein écran · Canvas 2D · 100 % code · Zéro musique (voix.mp3 seule)
 * Réalisation : Claude Opus 5.5
 *
 * PRINCIPES DE RÉALISATION
 *  • ZÉRO TREMBLEMENT : tout texte animé est rastérisé une seule fois dans un
 *    sprite (taille de police entière et constante), puis déplacé / mis à
 *    l'échelle par drawImage en coordonnées flottantes (filtrage bilinéaire).
 *    Aucun Math.round sur une position ou une taille de texte en mouvement.
 *    Les compteurs roulent chiffre par chiffre (sprites par chiffre).
 *  • SYNCHRONISATION AU MOT : storyboard.json fournit pour chaque scène
 *    \`wordTimes\` = [[indexCaractère, secondes], …] issus de la transcription
 *    horodatée de voix.mp3. Chaque temps fort est ancré sur une expression
 *    exacte de la narration (fonction \`cues\`).
 *  • 13 DISPOSITIFS DISTINCTS : aucune mécanique visuelle n'est reprise d'une scène à l'autre.
 *  • Coin inférieur droit toujours libre (filigrane YouTube).
 *  • Moteur typographique et cartographique hérité de l'épisode 3.
 */

`;
s = head + s;
s = s.replace("/* ── Lieux de l'épisode 3 ──", "/* ── Lieux (épisode 3 + reportage épicerie) ──");
const extra = {
  albany: [-73.76, 42.65], hartford: [-72.68, 41.76], trenton: [-74.76, 40.22], annapolis: [-76.49, 38.98],
  baltimore: [-76.61, 39.29], boston: [-71.06, 42.36], philadelphia: [-75.16, 39.95], saguenay: [-71.07, 48.43],
  septIles: [-66.38, 50.22], rouyn: [-79.02, 48.24], gaspe: [-64.48, 48.83], baieComeau: [-68.15, 49.22],
  valdor: [-77.78, 48.1], drummondville: [-72.48, 45.88]
};
const add = Object.entries(extra).map(([k, v]) => `  ${k}: [${v[0]}, ${v[1]}]`).join(',\n');
s = s.replace('  niamey: [2.11, 13.51]\n};', `  niamey: [2.11, 13.51],\n${add}\n};`);
s = s.replace(
  '    let t = i >= 0 ? (i / Math.max(1, n.length)) * d : d * 0.5;',
  "    if (i < 0) (globalThis.__FN_MISSING_CUES ||= new Set()).add(`${scene.id} → « ${v} »`);\n    let t = i >= 0 ? (i / Math.max(1, n.length)) * d : d * 0.5;"
);
if (!s.includes('__FN_MISSING_CUES') || !s.includes('albany')) throw new Error('patch failed');
fs.writeFileSync('00-engine.js', s + '\n');
console.log('lines', s.split('\n').length);
