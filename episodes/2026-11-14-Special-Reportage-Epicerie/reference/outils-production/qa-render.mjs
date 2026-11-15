#!/usr/bin/env node
/**
 * FRANC NORD — Banc d'essai visuel (frames PNG + planche contact + rapport typographique)
 *
 *   node qa-render.mjs --frag scenes/03-rep-xxx.js --scenes rep-xxx --out qa/03 --port 4501
 *   node qa-render.mjs --final --scenes all --out qa/final --port 4600
 *
 * Options :
 *   --frag a.js,b.js   fragments de scène à tester (moteur 00-engine.js préfixé automatiquement)
 *   --final            utilise episodes/<ep>/scenes-custom.js (fichier assemblé)
 *   --scenes id,id|all scènes à rendre
 *   --times 1.2,5,9    temps LOCAUX (s) ; défaut : 7 temps répartis (début, actes, fin)
 *   --formats 16x9,9x16
 *   --out dir          dossier de sortie (PNG + planches JPG + report.json)
 *   --port 4501        port HTTP (CDP = port + 1000)
 *
 * Rapport : exceptions JS, repères voix introuvables, textes hors cadre,
 * chevauchements entre textes, textes dans les zones réservées (filigrane YouTube
 * en bas à droite, marque en haut à gauche, sources en bas à gauche, UI Shorts).
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BUILD = path.dirname(fileURLToPath(import.meta.url));
const ROOT = '/Volumes/Projets/FRANC NORD';
const EP = '2026-11-14-Special-Reportage-Epicerie';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';

const argv = process.argv.slice(2);
const get = (f, d) => {
  const i = argv.indexOf(f);
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : d;
};
const final = argv.includes('--final');
const frags = (get('--frag', '') || '').split(',').filter(Boolean).map((p) => path.resolve(BUILD, p));
const port = Number(get('--port', '4501'));
const dport = port + 1000;
const out = path.resolve(BUILD, get('--out', 'qa/tmp'));
const formats = get('--formats', '16x9,9x16').split(',');
fs.mkdirSync(out, { recursive: true });

const sb = JSON.parse(fs.readFileSync(path.join(ROOT, 'episodes', EP, 'storyboard.json'), 'utf8'));
let sceneIds = get('--scenes', 'all');
sceneIds = sceneIds === 'all' ? sb.scenes.map((s) => s.id) : sceneIds.split(',');
const starts = {};
let acc = 0;
for (const s of sb.scenes) {
  starts[s.id] = { start: acc, d: s.duration };
  acc += s.duration;
}
for (const id of sceneIds) if (!starts[id]) throw new Error('Scène inconnue : ' + id);
const userTimes = get('--times', null);

/* ── Module de test : moteur + fragments + export ─────────────── */
function buildModule() {
  if (final) return fs.readFileSync(path.join(ROOT, 'episodes', EP, 'scenes-custom.js'), 'utf8');
  let src = fs.readFileSync(path.join(BUILD, '00-engine.js'), 'utf8');
  const map = [];
  for (const f of frags) {
    const code = fs.readFileSync(f, 'utf8');
    const m = [...code.matchAll(/\/\*@scene\s+([a-z0-9-]+)\s*=\s*([A-Za-z_$][\w$]*)\s*\*\//g)];
    if (!m.length) throw new Error('Marqueur /*@scene id=fonction*/ absent dans ' + f);
    for (const x of m) map.push(`  '${x[1]}': ${x[2]}`);
    src += `\n/* ═══ ${path.basename(f)} ═══ */\n` + code + '\n';
  }
  src += `\nexport const CUSTOM_SCENES = {\n${map.join(',\n')}\n};\n`;
  return src;
}
const moduleSrc = buildModule();
fs.writeFileSync(path.join(out, '_module.mjs'), moduleSrc);
const syn = spawnSync(process.execPath, ['--check', path.join(out, '_module.mjs')], { encoding: 'utf8' });
if (syn.status !== 0) {
  console.log(JSON.stringify({ ok: false, syntaxError: syn.stderr.split('\n').slice(0, 8).join('\n') }, null, 2));
  process.exit(2);
}

const HARNESS = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#000}</style></head>
<body><canvas id="c" width="1920" height="1080"></canvas>
<script type="module">
import { renderBroadcastFrame } from '/studio/broadcast-canvas.js';
window.__err = [];
window.addEventListener('error', (e) => window.__err.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => window.__err.push(String(e.reason)));
try {
  const sb = await (await fetch('/episodes/${EP}/storyboard.json')).json();
  const mod = await import('/__qa/module.js');
  await document.fonts.ready;
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');
  window.__render = (t, fmt) => {
    const [w, h] = fmt === '9x16' ? [1080, 1920] : [1920, 1080];
    if (c.width !== w) { c.width = w; c.height = h; }
    globalThis.__FN_QA = [];
    globalThis.__FN_QA_G = 0;
    let err = null;
    try { renderBroadcastFrame({ ctx, width: w, height: h, storyboard: sb, customScenes: mod.CUSTOM_SCENES, globalTime: t }); }
    catch (e) { err = String(e && e.stack || e); }
    const boxes = globalThis.__FN_QA;
    globalThis.__FN_QA = null;
    return { png: c.toDataURL('image/png'), boxes, err, missing: [...(globalThis.__FN_MISSING_CUES || [])] };
  };
  window.__ready = true;
} catch (e) { window.__err.push('LOAD: ' + (e && e.stack || e)); window.__ready = 'fail'; }
</script></body></html>`;

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (u === '/__qa/harness.html') return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }), res.end(HARNESS);
  if (u === '/__qa/module.js') return res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' }), res.end(moduleSrc);
  const p = path.normalize(path.join(ROOT, u));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || !fs.statSync(p).isFile()) return res.writeHead(404), res.end();
  res.writeHead(200, { 'Content-Type': (MIME[path.extname(p)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(port, '127.0.0.1', r));

const udd = `/tmp/fn-qa-chrome-${port}-${process.pid}`;
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${dport}`, `--user-data-dir=${udd}`, '--window-size=1920,1920', `http://127.0.0.1:${port}/__qa/harness.html`], { stdio: 'ignore' });

const report = { ok: true, module: final ? 'final' : frags.map((f) => path.basename(f)), scenes: {}, missingCues: [], loadErrors: [] };
try {
  let ws = null;
  for (let i = 0; i < 80 && !ws; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const list = await (await fetch(`http://127.0.0.1:${dport}/json/list`)).json();
      const pg = list.find((t) => t.type === 'page' && t.url.includes('harness'));
      if (pg) ws = pg.webSocketDebuggerUrl;
    } catch {}
  }
  if (!ws) throw new Error('Chrome injoignable');
  const sock = new WebSocket(ws);
  await new Promise((r, j) => (sock.addEventListener('open', r, { once: true }), sock.addEventListener('error', j, { once: true })));
  let id = 0;
  const pend = new Map();
  sock.addEventListener('message', (ev) => {
    const d = JSON.parse(String(ev.data));
    if (d.id && pend.has(d.id)) {
      pend.get(d.id)(d);
      pend.delete(d.id);
    }
  });
  const ev = (expression) => new Promise((r) => {
    const i = ++id;
    pend.set(i, r);
    sock.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }));
  });
  let ready = null;
  for (let i = 0; i < 120; i++) {
    ready = (await ev('window.__ready || false')).result?.result?.value;
    if (ready) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  const errs = (await ev('window.__err')).result?.result?.value || [];
  report.loadErrors = errs;
  if (ready !== true) throw new Error('Banc non chargé : ' + errs.join(' | '));

  for (const sid of sceneIds) {
    const { start, d } = starts[sid];
    const times = userTimes ? userTimes.split(',').map(Number) : [0.7, d * 0.16, d * 0.32, d * 0.5, d * 0.66, d * 0.83, d - 0.45];
    const sres = (report.scenes[sid] = { duration: d, frames: [] });
    for (const fmt of formats) {
      const [W, H] = fmt === '9x16' ? [1080, 1920] : [1920, 1080];
      const files = [];
      for (const t of times) {
        const r = (await ev(`window.__render(${(start + t).toFixed(4)}, '${fmt}')`)).result?.result?.value;
        const name = `${sid}_${fmt}_${t.toFixed(2).padStart(6, '0')}.png`;
        fs.writeFileSync(path.join(out, name), Buffer.from(r.png.split(',')[1], 'base64'));
        files.push(name);
        const issues = analyse(r.boxes || [], W, H, fmt);
        if (r.err) issues.unshift({ type: 'EXCEPTION', detail: r.err.split('\n').slice(0, 4).join(' | ') });
        for (const m of r.missing) if (!report.missingCues.includes(m)) report.missingCues.push(m);
        sres.frames.push({ fmt, t: +t.toFixed(2), file: name, texts: (r.boxes || []).filter((b) => b.a > 0.35).length, issues });
        if (issues.some((x) => x.type === 'EXCEPTION')) report.ok = false;
      }
      // planche contact (4 colonnes)
      const sheet = path.join(out, `${sid}_${fmt}_PLANCHE.jpg`);
      const cols = 4;
      const rows = Math.ceil(files.length / cols);
      const tw = fmt === '9x16' ? 360 : 640;
      const inputs = files.flatMap((f) => ['-i', path.join(out, f)]);
      const n = files.length;
      const pads = cols * rows - n;
      let fc = files.map((_, i) => `[${i}:v]scale=${tw}:-1,pad=iw+4:ih+4:2:2:color=0x333333[v${i}]`).join(';');
      let ins = files.map((_, i) => `[v${i}]`).join('');
      if (pads) {
        fc += `;color=black:s=${tw + 4}x${Math.round((tw * H) / W) + 4}:d=1[pad]`;
        fc += ';[pad]split=' + pads + Array.from({ length: pads }, (_, k) => `[p${k}]`).join('');
        ins += Array.from({ length: pads }, (_, k) => `[p${k}]`).join('');
      }
      fc += `;${ins}xstack=inputs=${cols * rows}:layout=${Array.from({ length: cols * rows }, (_, k) => `${(k % cols) ? Array.from({ length: k % cols }, () => 'w0').join('+') : '0'}_${Math.floor(k / cols) ? Array.from({ length: Math.floor(k / cols) }, () => 'h0').join('+') : '0'}`).join('|')}[o]`;
      const r = spawnSync(FFMPEG, ['-y', '-v', 'error', ...inputs, '-filter_complex', fc, '-map', '[o]', '-frames:v', '1', '-q:v', '3', sheet], { encoding: 'utf8' });
      if (r.status !== 0) sres.sheetError = r.stderr.slice(0, 300);
      else sres[`sheet_${fmt}`] = path.relative(BUILD, sheet);
    }
  }
  sock.close();
} catch (e) {
  report.ok = false;
  report.fatal = String(e.message || e);
} finally {
  chrome.kill('SIGTERM');
  server.close();
  setTimeout(() => fs.rmSync(udd, { recursive: true, force: true }), 500);
}
if (report.missingCues.length) report.ok = false;
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));

// Résumé compact sur stdout
const summary = { ok: report.ok, fatal: report.fatal, loadErrors: report.loadErrors, missingCues: report.missingCues, out: path.relative(BUILD, out), scenes: {} };
for (const [sid, s] of Object.entries(report.scenes)) {
  summary.scenes[sid] = {
    sheets: [s.sheet_16x9, s.sheet_9x16].filter(Boolean),
    issues: s.frames.flatMap((f) => f.issues.map((i) => `${f.fmt} t=${f.t}: ${i.type} ${i.detail}`)).slice(0, 40)
  };
}
console.log(JSON.stringify(summary, null, 2));
setTimeout(() => process.exit(0), 600);

/* ── Analyse typographique d'une image ────────────────────────── */
function analyse(boxes, W, H, fmt) {
  const vis = boxes.filter((b) => b.a > 0.35 && b.x1 - b.x0 > 2);
  const issues = [];
  // fusion par groupe (un appel typographique = un bloc)
  const groups = new Map();
  for (const b of vis) {
    const g = groups.get(b.g);
    if (!g) groups.set(b.g, { ...b, text: b.text });
    else {
      g.x0 = Math.min(g.x0, b.x0); g.y0 = Math.min(g.y0, b.y0); g.x1 = Math.max(g.x1, b.x1); g.y1 = Math.max(g.y1, b.y1);
      g.text += b.text.length === 1 && g.text.length < 60 ? b.text : '';
    }
  }
  const G = [...groups.values()];
  const lbl = (b) => `« ${b.text.slice(0, 38)} »`;
  for (const b of G) {
    const over = Math.max(0 - b.x0, b.x1 - W, 0 - b.y0, b.y1 - H);
    if (over > 2) issues.push({ type: 'HORS-CADRE', detail: `${lbl(b)} dépasse de ${over.toFixed(0)} px` });
    // zones réservées
    const zones = fmt === '9x16'
      ? [['FILIGRANE-BAS-DROITE', W - 240, H - 300, W, H], ['MARQUE-HAUT-GAUCHE', 0, 0, 560, 120], ['SOURCES-BAS-GAUCHE', 0, H - 70, W * 0.75, H]]
      : [['FILIGRANE-BAS-DROITE', W - 300, H - 220, W, H], ['MARQUE-HAUT-GAUCHE', 0, 0, 600, 130], ['SOURCES-BAS-GAUCHE', 0, H - 64, W * 0.55, H]];
    for (const [name, zx0, zy0, zx1, zy1] of zones) {
      const ix = Math.min(b.x1, zx1) - Math.max(b.x0, zx0);
      const iy = Math.min(b.y1, zy1) - Math.max(b.y0, zy0);
      if (ix > 4 && iy > 4) issues.push({ type: 'ZONE-' + name, detail: lbl(b) });
    }
    if (fmt === '9x16' && b.y1 > H * 0.87 && b.y0 < H - 70) issues.push({ type: 'AVERTISSEMENT-UI-SHORTS', detail: `${lbl(b)} sous 87 % de la hauteur (zone légende Shorts/Reels)` });
    if (b.size < 15 && b.a > 0.6) issues.push({ type: 'TEXTE-MINUSCULE', detail: `${lbl(b)} ${b.size}px` });
  }
  for (let i = 0; i < G.length; i++)
    for (let j = i + 1; j < G.length; j++) {
      const a = G[i], b = G[j];
      const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (ix <= 0 || iy <= 0) continue;
      const ar = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
      const k = (ix * iy) / Math.max(1, ar);
      if (k > 0.08) issues.push({ type: 'CHEVAUCHEMENT', detail: `${lbl(a)} ⟷ ${lbl(b)} (${Math.round(k * 100)} %)` });
    }
  return issues;
}
