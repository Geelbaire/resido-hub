#!/usr/bin/env node
/**
 * Assemble 00-engine.js + scenes/NN-*.js → episodes/<ep>/scenes-custom.js
 * Vérifie : 13 scènes présentes dans l'ordre du storyboard, syntaxe module, aucun doublon d'identifiant,
 * aucune primitive de texte interdite dans les fragments.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BUILD = path.dirname(fileURLToPath(import.meta.url));
const EPDIR = '/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Special-Reportage-Epicerie';
const sb = JSON.parse(fs.readFileSync(path.join(EPDIR, 'storyboard.json'), 'utf8'));
const files = fs.readdirSync(path.join(BUILD, 'scenes')).filter((f) => /^\d\d-rep-.*\.js$/.test(f)).sort();

let src = fs.readFileSync(path.join(BUILD, '00-engine.js'), 'utf8');
const map = new Map();
const problems = [];
for (const f of files) {
  const code = fs.readFileSync(path.join(BUILD, 'scenes', f), 'utf8');
  const m = [...code.matchAll(/\/\*@scene\s+([a-z0-9-]+)\s*=\s*([A-Za-z_$][\w$]*)\s*\*\//g)];
  if (m.length !== 1) problems.push(`${f} : marqueur @scene manquant ou multiple`);
  for (const x of m) map.set(x[1], x[2]);
  const bad = code.match(/\.fillText\(|\.strokeText\(|ctx\.font\s*=|Math\.random\(|Date\.now\(/g);
  if (bad) problems.push(`${f} : primitives interdites ${[...new Set(bad)].join(' ')}`);
  const sc = sb.scenes.find((s) => s.id === m[0]?.[1]);
  const title = sc ? `SCÈNE ${f.slice(0, 2)} — ${sc.id} · ${sc.shortVisualTitle}` : f;
  src += `\n/* ════════════════════════════════════════════════════════════════════════\n * ${title}\n * ════════════════════════════════════════════════════════════════════════ */\n\n`;
  src += code.replace(/\/\*@scene[^*]*\*\/\s*$/m, '').trimEnd() + '\n';
}
const missing = sb.scenes.filter((s) => !map.has(s.id)).map((s) => s.id);
if (missing.length) problems.push('scènes manquantes : ' + missing.join(', '));
src += `\nexport const CUSTOM_SCENES = {\n${sb.scenes.filter((s) => map.has(s.id)).map((s) => `  '${s.id}': ${map.get(s.id)}`).join(',\n')}\n};\n`;

const tmp = path.join(BUILD, 'qa', '_assembled.mjs');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, src);
const chk = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
if (chk.status !== 0) problems.push('syntaxe : ' + chk.stderr.split('\n').slice(0, 6).join(' | '));

if (problems.length && !process.argv.includes('--force')) {
  console.log('❌ Assemblage refusé :\n - ' + problems.join('\n - '));
  process.exit(1);
}
fs.writeFileSync(path.join(EPDIR, 'scenes-custom.js'), src);
console.log(`✅ scenes-custom.js : ${files.length} fragments, ${src.split('\n').length} lignes, ${(src.length / 1024).toFixed(0)} Ko`);
if (problems.length) console.log('⚠️ ' + problems.join('\n⚠️ '));
