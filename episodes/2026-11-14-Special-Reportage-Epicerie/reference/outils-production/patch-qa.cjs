// Ajoute au moteur l'instrumentation QA (boîtes de texte à l'écran), inerte hors banc d'essai.
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, '00-engine.js');
let s = fs.readFileSync(f, 'utf8');
const rep = (a, b) => {
  if (!s.includes(a)) throw new Error('motif absent : ' + a.slice(0, 80));
  s = s.replace(a, b);
};

// 1. le sprite connaît son texte
rep('    return { cv, w, asc, desc, cap, pad, res, size };', '    return { cv, w, asc, desc, cap, pad, res, size, text };');

// 2. groupe typographique courant + enregistrement des boîtes
rep(
  '/**\n * Pose un sprite en coordonnées flottantes.',
  `/* QA : boîtes englobantes des textes (actif seulement si globalThis.__FN_QA est un tableau). */
function qaG() {
  if (globalThis.__FN_QA) globalThis.__FN_QA_G = (globalThis.__FN_QA_G || 0) + 1;
}
function qaBox(ctx, S, x0, y0, x1, y1, alpha) {
  const q = globalThis.__FN_QA;
  if (!q || S.text === undefined) return;
  const m = ctx.getTransform();
  const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  q.push({ text: S.text, g: globalThis.__FN_QA_G || 0, a: alpha, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), size: S.size });
}

/**
 * Pose un sprite en coordonnées flottantes.`
);
rep(
  '  ctx.drawImage(S.cv, -ax - S.pad, ay - S.asc - S.pad, S.cv.width / S.res, S.cv.height / S.res);\n  ctx.restore();\n}',
  '  ctx.drawImage(S.cv, -ax - S.pad, ay - S.asc - S.pad, S.cv.width / S.res, S.cv.height / S.res);\n  if (globalThis.__FN_QA) qaBox(ctx, S, -ax, ay - S.cap, -ax + S.w, ay + S.desc * 0.35, ctx.globalAlpha);\n  ctx.restore();\n}'
);

// 3. chaque appel typographique ouvre un groupe
for (const sig of [
  'function kRise(ctx, text, x, y, o = {}) {',
  'function kSlide(ctx, text, x, y, o = {}) {',
  'function kWipe(ctx, text, x, y, o = {}) {',
  'function kZoom(ctx, text, x, y, o = {}) {',
  'function mono(ctx, text, x, y, o = {}) {',
  'function odometer(ctx, value, x, y, o = {}) {'
]) rep(sig, sig + '\n  qaG();');
rep('function drawSprite(ctx, S, x, y, o = {}) {', 'function drawSprite(ctx, S, x, y, o = {}) {\n  if (globalThis.__FN_QA && !globalThis.__FN_QA_IN) qaG();');
// kRise / odometer posent plusieurs sprites dans le même groupe : drawSprite ne doit pas rouvrir un groupe
for (const [open, close] of [
  ['function kRise(ctx, text, x, y, o = {}) {\n  qaG();', null],
  ['function odometer(ctx, value, x, y, o = {}) {\n  qaG();', null]
]) {
  rep(open, open + '\n  globalThis.__FN_QA_IN = true;\n  try {');
}
// fermer les try pour kRise et odometer : on encapsule le corps en renommant
s = s.replace(/function kRise\(ctx, text, x, y, o = \{\}\) \{\n  qaG\(\);\n  globalThis.__FN_QA_IN = true;\n  try \{/, 'function kRise(ctx, text, x, y, o = {}) {\n  qaG();\n  globalThis.__FN_QA_IN = true;\n  try {\n    return _kRise(ctx, text, x, y, o);\n  } finally {\n    globalThis.__FN_QA_IN = false;\n  }\n}\nfunction _kRise(ctx, text, x, y, o = {}) {\n  {');
s = s.replace(/function odometer\(ctx, value, x, y, o = \{\}\) \{\n  qaG\(\);\n  globalThis.__FN_QA_IN = true;\n  try \{/, 'function odometer(ctx, value, x, y, o = {}) {\n  qaG();\n  globalThis.__FN_QA_IN = true;\n  try {\n    return _odometer(ctx, value, x, y, o);\n  } finally {\n    globalThis.__FN_QA_IN = false;\n  }\n}\nfunction _odometer(ctx, value, x, y, o = {}) {\n  {');
// les corps _kRise / _odometer ont maintenant une accolade ouvrante de trop : on la ferme à la fin de chaque fonction
for (const name of ['_kRise', '_odometer']) {
  const i = s.indexOf(`function ${name}(`);
  const j = s.indexOf('\n}\n', i);
  s = s.slice(0, j) + '\n  }' + s.slice(j);
}
// 4. textes décoratifs exclus de l'analyse (globalThis.__FN_QA_SKIP)
rep("  if (!q || S.text === undefined) return;", "  if (!q || S.text === undefined || globalThis.__FN_QA_SKIP) return;");

// 5. correctif odomètre : un chiffre de rang supérieur ne roule que pendant la retenue réelle
//    (tous les chiffres inférieurs à 9 ET le chiffre des unités en mouvement). Avant : 4,99 s'affichait « 5,99 ».
rep(
  "    const lower = raw - Math.floor(raw);\n    const frac = !roll ? 0 : k === 0 ? lower : smooth(seg(lower, 0.9, 1));",
  "    const unitFrac = v - Math.floor(v);\n    const carry = k === 0 || Math.floor(v) % place === place - 1;\n    const frac = !roll || !carry ? 0 : unitFrac;"
);
fs.writeFileSync(f, s);
console.log('QA patch OK');
