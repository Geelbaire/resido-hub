/**
 * FRANC NORD — Épisode #1 (2026-11-14) — 13 scènes cinématiques plein écran
 * Motion design 100 % code · Canvas 2D · Zéro musique · Zéro tableau de bord
 * Moteur optique : référence Épisode #1 · Nouvelle réalisation : Codex
 *
 * SYNCHRONISATION VOIX
 *   Chaque temps fort est ancré sur un mot repère de la narration.
 *   Par défaut, sa position est estimée d'après le texte (fraction 0 → 1).
 *   Si storyboard.json fournit `scene.cues = { repere: secondes }`
 *   (ex. issu d'une transcription horodatée de voix.m4a), ces temps réels priment.
 */

/* ════════════════════════════════════════════════════════════════════════
 * 1. TYPOGRAPHIE DE LA CHARTE (titres géométriques + IBM Plex Mono)
 * ════════════════════════════════════════════════════════════════════════ */

const DISPLAY = '"Montserrat", "Avenir Next", "Inter", "SF Pro Display", system-ui, sans-serif';
const MONO = '"IBM Plex Mono", "SF Mono", Menlo, monospace';

if (typeof document !== 'undefined' && !document.getElementById('fn-fonts')) {
  const link = document.createElement('link');
  link.id = 'fn-fonts';
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=block';
  document.head.appendChild(link);
  try {
    await Promise.race([
      new Promise((res) => {
        link.onload = res;
        link.onerror = res;
      }).then(() =>
        Promise.all([
          document.fonts.load('900 120px Montserrat'),
          document.fonts.load('800 120px Montserrat'),
          document.fonts.load('700 120px Montserrat'),
          document.fonts.load('500 24px "IBM Plex Mono"'),
          document.fonts.load('600 24px "IBM Plex Mono"')
        ])
      ),
      new Promise((res) => setTimeout(res, 3500))
    ]);
  } catch {
    /* repli silencieux sur les polices système */
  }
}

/* ════════════════════════════════════════════════════════════════════════
 * 2. PALETTE OFFICIELLE & OUTILS MATHÉMATIQUES
 * ════════════════════════════════════════════════════════════════════════ */

const C = {
  night: '#030509',
  cyan: '#38BDF8',
  ice: '#BAE6FD',
  deepCyan: '#0284C7',
  amber: '#F59E0B',
  gold: '#FDE68A',
  slate: '#E5E7EB',
  white: '#F8FAFC',
  coral: '#FB7185',
  red: '#F43F5E',
  emerald: '#10B981',
  mint: '#6EE7B7'
};

const D2R = Math.PI / 180;
const TAU = Math.PI * 2;

const _rgb = new Map();
function rgbOf(hex) {
  let v = _rgb.get(hex);
  if (!v) {
    const n = parseInt(hex.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    _rgb.set(hex, v);
  }
  return v;
}
function rgba(hex, a = 1) {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}
function mix(h1, h2, t) {
  const a = rgbOf(h1);
  const b = rgbOf(h2);
  const k = Math.max(0, Math.min(1, t));
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (p, a, b) => clamp((p - a) / (b - a));
const smooth = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
const eOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
const eOutQuint = (t) => 1 - Math.pow(1 - clamp(t), 5);
const eOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
const eInExpo = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * clamp(t) - 10));
const eInOut = (t) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const eInOutQuart = (t) => {
  const x = clamp(t);
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};
const eInOutExpo = (t) => {
  const x = clamp(t);
  if (x === 0 || x === 1) return x;
  return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
};
const eOutBack = (t, s = 1.70158) => {
  const x = clamp(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
/** Ressort physique amorti — t en secondes depuis le déclenchement. */
const spring = (t, damp = 6, freq = 11) => (t <= 0 ? 0 : 1 - Math.exp(-damp * t) * Math.cos(freq * t));
/** Enveloppe d'apparition : visible entre a et b, fondus fi / fo (unités de progress). */
const env = (p, a, b, fi = 0.02, fo = 0.02) => Math.min(smooth((p - a) / fi), smooth((b - p) / fo));

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const _memo = new Map();
function cached(key, fn) {
  if (!_memo.has(key)) _memo.set(key, fn());
  return _memo.get(key);
}

/**
 * Repères de synchronisation voix.
 *   map : { cle: 'mot exact de la narration' | fraction }
 *   Priorité : scene.cues[cle] (secondes) > scene.voiceSync (minutage réel des
 *   phrases écrit par sync-voix.mjs, interpolé au caractère) > position du mot
 *   dans le texte > fraction fournie.
 *   Renvoie { cle: fraction 0 → 1 de la scène }.
 */
function cues(scene, map) {
  const real = scene.cues || {};
  const d = scene.duration || 1;
  const n = scene.narration || '';
  const sents = scene.voiceSync?.sentences;
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    if (typeof real[k] === 'number') {
      out[k] = clamp(real[k] / d);
      continue;
    }
    if (typeof v === 'number') {
      out[k] = v;
      continue;
    }
    const i = n.indexOf(v);
    let f = i >= 0 ? i / Math.max(1, n.length) : 0.5;
    if (i >= 0 && sents) {
      const s = sents.find((x) => i >= x.from && i < x.to);
      if (s) f = (s.start + ((s.end - s.start) * (i - s.from)) / Math.max(1, s.to - s.from)) / d;
    }
    out[k] = clamp(f);
  }
  return out;
}

/* ════════════════════════════════════════════════════════════════════════
 * 3. LUMIÈRE, ATMOSPHÈRE & GRAIN CINÉMA
 * ════════════════════════════════════════════════════════════════════════ */

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function sprite(color) {
  return cached('spr' + color, () => {
    const s = 256;
    const cv = makeCanvas(s, s);
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, rgba(color, 1));
    gr.addColorStop(0.16, rgba(color, 0.5));
    gr.addColorStop(0.45, rgba(color, 0.12));
    gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    return cv;
  });
}

/** Lueur additive (mode 'lighter') — la base de toute la lumière du film. */
function light(ctx, x, y, r, color, a = 1) {
  if (a <= 0.003 || r <= 0.5) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= clamp(a);
  ctx.drawImage(sprite(color), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

/** Reflet anamorphique horizontal (signature « optique cinéma »). */
function flare(ctx, x, y, r, color, a = 1) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= clamp(a);
  ctx.drawImage(sprite(color), x - r * 5, y - r * 0.09, r * 10, r * 0.18);
  ctx.drawImage(sprite(C.white), x - r * 1.6, y - r * 0.035, r * 3.2, r * 0.07);
  ctx.restore();
  light(ctx, x, y, r * 0.5, C.white, a * 0.9);
}

function grainPattern(ctx) {
  return cached('grain', () => {
    const s = 192;
    const cv = makeCanvas(s, s);
    const g = cv.getContext('2d');
    const img = g.createImageData(s, s);
    const r = rng(77);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = r() > 0.5 ? 255 : 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.floor(r() * 46);
    }
    g.putImageData(img, 0, 0);
    return ctx.createPattern(cv, 'repeat');
  });
}

function grain(ctx, stage, globalTime, a = 0.05) {
  const pat = grainPattern(ctx);
  const f = Math.floor(globalTime * 24);
  const r = rng(f * 9973 + 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(-r() * 192, -r() * 192);
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, stage.w + 192, stage.h + 192);
  ctx.restore();
}

function vignette(ctx, stage, strength = 0.72) {
  const { w, h, cx, cy } = stage;
  const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.32, cx, cy, Math.hypot(w, h) * 0.62);
  g.addColorStop(0, 'rgba(3,5,9,0)');
  g.addColorStop(1, `rgba(1,2,4,${strength})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Poussière lumineuse en parallaxe (3 profondeurs) — l'air de la pièce. */
function dust(ctx, stage, time, { count = 120, color = C.ice, alpha = 0.5, camX = 0, camY = 0, seed = 3 } = {}) {
  const pts = cached(`dust${seed}_${count}`, () => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({ x: r(), y: r(), z: 0.2 + r() * 0.8, s: r() * TAU }));
  });
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = color;
  for (const p of pts) {
    const px = ((((p.x + time * 0.004 * p.z - camX * p.z * 0.0004) % 1) + 1) % 1) * stage.w;
    const py = ((((p.y - time * 0.006 * p.z - camY * p.z * 0.0004) % 1) + 1) % 1) * stage.h;
    const tw = 0.55 + 0.45 * Math.sin(time * 1.3 + p.s);
    ctx.globalAlpha = alpha * p.z * tw * 0.55;
    const sz = 1 + p.z * 2.2;
    ctx.fillRect(px, py, sz, sz);
  }
  ctx.restore();
}

/** Habillage commun : fondu d'entrée/sortie, vignettage, grain. */
function frame(args, draw) {
  const { ctx, stage, localTime, scene, globalTime } = args;
  const d = scene.duration || 12;
  const fade = Math.min(smooth(localTime / 0.6), smooth((d - localTime) / 0.4));
  ctx.save();
  ctx.globalAlpha = fade;
  draw();
  ctx.restore();
  vignette(ctx, stage, 0.78);
  grain(ctx, stage, globalTime, 0.045);
}

/* ════════════════════════════════════════════════════════════════════════
 * 4. GÉOGRAPHIE VECTORIELLE (lon, lat) — continents stylisés pour la
 *    « carte en pointillés lumineux » de la charte
 * ════════════════════════════════════════════════════════════════════════ */

const LAND = [
  // Amérique du Nord (contourne la baie d'Hudson)
  [-168,65.6,-164,67.6,-161,70.3,-156,71.3,-150,70.4,-141,69.7,-134,69.5,-128,70.2,-120,69.2,-114,68.3,-108,68.4,-100,67.8,-95,68.4,-90,68.8,-86,66.5,-88,64.2,-92.5,62.2,-94.5,60,-94.2,58.7,-92.5,57.2,-88.5,56.5,-85,55.3,-82.3,52.9,-80.5,51.3,-79,51.6,-78.8,52.6,-79.2,54.5,-77,55.8,-76.6,57,-77.6,58.6,-78,60.5,-77.6,62.4,-74,62.2,-71,61.2,-69.6,59.6,-67.8,58.4,-65.8,59.4,-64.6,60.3,-63.2,58.8,-61.7,56.4,-60,55.1,-57.2,53.6,-55.8,52.1,-57.5,51.4,-60.5,50.2,-64.5,50.2,-66.8,49.6,-64.3,48.9,-64.8,47.8,-64.7,46.5,-63.6,45.8,-61.2,45.6,-60,46.2,-61,45.2,-63.6,44.5,-65.8,43.6,-66.2,44.6,-67.5,44.5,-70.2,43.6,-70.6,42.6,-70,41.8,-71.5,41.4,-74,40.6,-74.2,39.4,-75.5,38.6,-76,37,-75.6,35.6,-77,34.5,-78.6,33.8,-80.6,32.2,-81.4,30.5,-80.6,28.5,-80.1,26.5,-80.4,25.2,-81.3,25.6,-82.3,27,-82.8,28.5,-84,30,-86,30.4,-88.6,30.3,-89.6,29.2,-91.5,29.5,-94,29.6,-96.5,28.2,-97.4,26.5,-97.6,24,-97.4,21.8,-96.2,19.3,-94.6,18.2,-92.5,18.6,-91,19,-90.4,20.8,-88,21.5,-86.8,21.3,-87.4,19.4,-88.2,17.3,-88.6,15.8,-86,15.9,-83.4,15.1,-83.6,12,-83.4,10.6,-82,9.2,-79.6,9.6,-77.4,8.6,-77.6,7.6,-78.4,8.2,-80.2,7.4,-81.6,8,-83.6,8.6,-85.7,10.5,-87.4,12.9,-89.5,13.5,-91.6,14,-93.8,15.9,-95.4,16,-97.8,16.3,-101,17.6,-104.4,19.3,-105.6,20.6,-105.4,22.4,-106.8,23.8,-108.8,25.6,-110.6,27.6,-112.4,29.4,-114.6,31.6,-113.2,29,-112,27.2,-110.6,24.6,-109.6,23.2,-110.4,23.6,-112,24.8,-112.4,26.6,-114.2,28,-115.6,30.2,-116.8,31.8,-117.2,32.8,-118.6,34.1,-120.6,34.6,-121.9,36.6,-122.5,37.8,-123.8,39.6,-124.3,40.6,-124.2,43,-124,46,-124.7,48.4,-123.2,48.6,-125.5,50.2,-127.5,51,-129.8,53.5,-131,55,-133.6,57.2,-136,58.4,-139.6,59.6,-143,60,-146.4,60.6,-148.8,60.4,-151.4,59.4,-154,59,-156.4,57.4,-158.6,56,-161.8,55.6,-164.6,54.6,-158,58.6,-161.6,58.6,-162,60,-164.8,60.8,-165,62.6,-164.4,63.2,-161,64.4,-163.6,64.6,-166.4,64.8],
  // Groenland
  [-73,78.2,-66,80.5,-60,82,-45,83,-30,83.3,-20,82,-18,79,-19,76,-21,72.5,-24,70,-27,68.4,-32,68,-36,65.8,-40,65,-42,62.5,-43.5,60,-46,60.8,-49,61.8,-51,63.5,-53,66,-54,68.5,-51.5,70.5,-55,71.5,-56,73.6,-59,75.8,-66,76.5,-71,77.5],
  // Archipel arctique
  [-90,72,-84,73.6,-78,72.8,-71,70.8,-68,69,-64,67,-62,66.4,-64.8,63.4,-66.6,62.2,-71.4,63.6,-74.6,64.6,-78,64.4,-77.6,65.6,-73.2,67.4,-77,69.2,-82,69.8,-87,70.6],
  [-119,71.4,-117.6,73,-108,73.5,-102,72.8,-101,70.5,-106.5,69.2,-114,68.8,-118.6,69.9],
  [-125,72,-122.6,74.2,-116.8,74,-118.5,72.2],
  [-92,77,-88,76.6,-80,76.4,-77,78.6,-72,79.6,-64,82,-72,82.9,-86,82.4,-92,81,-96,79.4],
  [-92,75.6,-80,74.6,-81,76.3,-90,76.6],
  // Amérique du Sud
  [-77.4,8.6,-76,9.4,-75.5,10.6,-74,11.2,-72.2,11.9,-71.2,12.4,-70,11.5,-68,10.6,-66,10.6,-63.6,10.6,-61.8,10.6,-60.8,8.6,-59,7.6,-57.2,6,-54,5.8,-52,4.8,-50.8,2,-50,0,-48.4,-0.8,-45,-1.4,-42,-2.8,-39.8,-3,-37.2,-4.8,-35.2,-5.6,-34.8,-7.8,-35.4,-9.6,-37,-11.4,-38.8,-13.2,-39.2,-15.8,-39.6,-18.6,-40.6,-21.4,-42,-22.9,-44.6,-23.2,-47.6,-24.8,-48.6,-26.6,-48.8,-28.6,-50.6,-31,-52.6,-33.4,-54,-34.6,-55.8,-34.8,-57.8,-34.6,-57.6,-36.4,-57.6,-38.2,-60,-38.8,-62.2,-38.9,-62.4,-40.6,-64.6,-40.8,-65.2,-42.6,-64.4,-43,-65.4,-45,-67.4,-46.2,-66,-47.8,-67.8,-49.6,-68.6,-50.6,-69.2,-52.2,-68.4,-53.2,-67,-54.8,-69,-55.4,-71.6,-54,-74,-52.4,-75.2,-50,-75.4,-47,-74.2,-45,-73.4,-42.4,-73.8,-40,-73.4,-37.2,-72.2,-35.2,-71.6,-32.6,-71.4,-29.6,-71,-27,-70.4,-23.4,-70.2,-19.4,-71.6,-17.6,-75,-15.4,-76.4,-13.6,-77.8,-11,-79.4,-7.8,-81,-6.2,-81.2,-4.4,-80.2,-3.2,-80.8,-1.6,-80,0.6,-79,1.6,-78.4,2.6,-77.4,4,-77.4,6.4,-77.8,7.4],
  // Eurasie
  [-9.4,37,-9.2,38.8,-9.5,40.8,-8.8,42.4,-9.2,43.2,-8,43.7,-5,43.5,-1.8,43.4,-1.3,44.6,-1.2,46.2,-2.4,47.2,-4.6,47.9,-4.6,48.6,-1.6,48.8,-1.4,49.7,0.2,49.6,1.6,50.9,3,51.3,4.2,51.9,4.8,53,7,53.6,8.6,53.9,8.6,55.4,8.2,56.8,9.6,57.3,10.6,57.7,10.4,56.4,10.2,54.6,11,54.2,12.4,54.4,14.2,53.9,16.6,54.6,18.6,54.7,19.8,54.4,21.2,55.2,21,56.8,21.6,57.5,23.4,57.2,24.4,57.6,23.8,58.7,23.4,59.3,26,59.6,28.4,59.8,30.2,59.9,28.6,60.5,26.6,60.4,22.8,59.9,21.4,60.8,21.6,62.6,22.2,63.4,24.6,64.6,25.4,65.2,22.6,65.8,21.4,64.8,20.6,63.6,18.6,62.8,17.4,61.6,17.2,60.6,18.8,59.8,18,59,16.6,57.6,16.4,56.4,14.4,55.6,13,55.4,12.8,56.4,11.8,57.6,11.2,58.6,10.4,59.2,9.6,59,8,58.1,6.6,58.1,5.6,58.8,5,60.4,5,61.8,6.4,62.6,8.8,63.6,10.6,64.6,12.6,66,14,67.4,15.6,68.4,17.6,69.4,19.6,70,22.4,70.6,25.4,71.1,28.2,71,31,70.3,33,69.6,36,69.1,40.4,67.8,41,66.8,44,66.4,44.2,68.4,46.6,68.2,48.6,67.7,53.6,68.3,58,68.8,60.6,69.8,64.6,69.4,68.4,68.6,66.8,70.6,69,72.8,72,72.8,72.6,70.6,74.6,72.4,80,72.6,81,73.6,87,74.4,92,75.8,98,76.4,104.4,77.8,108,76.6,113,75.8,113.6,73.6,120,73,126,73.4,130,71.4,136,71.6,140,72.4,146,72.4,150,71.6,152.6,70.8,160,70.2,166,69.6,170,70.1,175,69.8,180,68.8,180,65.2,177,64.6,179,62.4,174.4,61.8,170.4,60,166,59.8,163.4,59,163.2,56.6,162.2,54.8,160.4,53.2,158.2,52,156.6,51,155.8,53.6,155.8,56.4,156.8,57.8,161,60.4,160.2,61.6,156.6,61.6,154,59.6,150,59.6,146,59.4,142.4,59.2,140.6,58.2,137.6,56.6,135.2,54.8,137,54.2,139,54.2,141.4,52.4,141,51,140.4,48.6,138.6,46.8,136,44.4,133.2,42.8,131,42.6,129.8,41,129.6,38.8,129.4,35.6,127.6,34.6,126.4,34.4,126.6,36,126.4,37.6,125,37.8,125.4,39.4,124.4,39.8,122.2,39.4,121,40.8,119.4,39.8,118,39.2,117.8,38.2,118.8,37.4,120.8,37.8,122.6,37.4,121,36.4,119.4,35,120.6,33.2,121.6,32,121.8,30.8,122,29.6,121.4,28.2,120,26.6,119.4,25.2,117.6,24,116,22.8,114.2,22.4,113,22,111,21.4,110.2,20.4,109.6,21.6,108,21.6,106.8,20.6,105.8,19,106.6,17.6,108.4,15.6,109.2,13.4,109.2,11.6,107.6,10.4,106.4,9.6,105,8.6,104.8,10.2,103.6,10.6,102.6,12.2,100.8,12.8,100,13.4,99.6,11.4,99.2,9.4,100.2,8.2,100.4,6.6,101.2,5.8,102.6,4.8,103.4,3.6,103.8,2,104.2,1.4,103.4,1.2,101.2,2.8,100.4,4,100.4,5.4,99.8,6.6,98.4,8,98.6,9.8,98.6,12,98,14.6,97.6,16.6,96.4,16.8,94.6,16,94.2,18.8,93.4,20.2,92.2,21.4,91.6,22.6,90.4,22,89,21.8,86.8,20.6,85.2,19.4,83.6,18,82.2,16.6,80.8,15.6,80.2,13.6,79.8,11.6,79.8,10.2,78.6,8.8,77.6,8,76.6,8.8,76.2,10,75.4,11.8,74.6,13.6,73.8,15.6,73,17.8,72.8,19.4,72.8,21,72.4,21.8,70.6,20.8,69,22.4,70.2,22.8,68.6,23.6,67.4,24.4,66.6,25.4,64,25.4,61.6,25.2,59.2,25.4,57.4,25.8,56.8,27,56,27.2,54.6,26.6,53.4,26.8,51.4,27.9,50.2,29.4,49,30.2,48,29.8,48.4,28.4,49.4,27,50,26.2,50.6,25.2,51.6,24.2,53,24.2,54.6,24.4,55.6,25.4,56.2,26.2,56.4,24.8,57.4,23.8,58.6,23.6,59.8,22.4,58.8,20.6,57.8,19.6,57,18.8,55.4,17.6,53.6,16.8,52.2,15.8,49.6,14.6,48,13.8,45.6,13.2,44,12.6,43.4,12.8,42.8,14.6,42.6,16.4,41.6,17.8,40.6,19.4,39.6,21,39,22.6,38.2,24.2,37.2,25.8,36.4,26.8,35.6,28,34.8,28.4,34.8,29.4,33.8,27.8,32.6,29.8,32.4,30.6,32.2,31.2,34,31.4,34.6,32.4,35.2,33.4,35.8,34.6,35.8,35.8,36.2,36.6,34.6,36.8,33.2,36.2,31,36.6,29.6,36.2,28,36.8,27.2,37.6,26.4,38.4,26.8,39.4,26.2,40.2,26.6,40.8,25.4,40.8,24,40.8,23.4,40.2,22.6,40.4,22.8,39,23.2,38.2,22.6,37.4,22,36.6,21.6,37.6,21.2,38.4,20.4,39.4,19.6,40.6,19.4,41.8,18.4,42.6,16.8,43.4,15,44.6,13.8,45.2,13.6,45.8,12.4,45.4,12.4,44.4,13.6,43.4,14.8,42,16,41.4,18.4,40.2,17.2,40.4,16.6,39.6,17.2,39,16.6,38.4,15.8,38,15.6,40,14.6,40.6,13.6,41.2,12.2,41.8,11,42.6,10.2,43.8,8.8,44.4,7.6,43.8,6,43.1,4.4,43.4,3.2,43.2,3.2,41.9,2.2,41.4,0.8,40.8,0,39.6,-0.2,38.8,-0.8,37.6,-2.2,36.8,-4.4,36.7,-5.6,36,-6.4,36.8,-7.4,37.2,-8.8,37],
  // Afrique
  [-5.9,35.8,-1,35.1,3,36.8,10.2,37.2,11,35.6,10.3,33.8,11.5,33.1,15.2,32.3,19,30.3,20,32,23,32.7,25,31.8,29,30.9,32.3,31.2,32.6,29.9,33.6,27.6,35.5,23.8,37.2,21,38.5,18,39.8,15.5,41.5,13.8,43.3,11.8,44.5,10.4,48,11.2,51.2,11.8,51,10.4,49,6,46,2,43,-1,40,-3.5,39.3,-6.8,40.5,-10.5,40.5,-15,36.8,-18,35.3,-22,35.5,-24,32.8,-26,32.5,-28.6,30.9,-30.5,27.9,-33.2,25.6,-34,22,-34.2,18.8,-34.4,18.3,-32.5,16.5,-28.6,15,-26.5,14.4,-22.5,12,-18,11.8,-15.5,13.6,-12,13.2,-8.8,12.2,-6,9.4,-1,9.6,3.5,8.5,4.5,6,4.3,4.5,6.3,1.2,6.1,-2,4.8,-4,5.2,-7.5,4.4,-10.5,6.5,-13.2,8.8,-15,11,-17,13.5,-17.5,14.7,-16.3,19.5,-17,21,-15,24,-13.2,27,-9.8,29.6,-9.6,32.2,-6.8,34],
  // Îles
  [-5.7,50,1.5,51.2,1.7,52.7,0,53.5,-1.5,55.5,-2,57.6,-4,58.6,-5.2,58.4,-6.2,56.5,-4.9,55,-3,53.8,-4.6,53.3,-4.2,52.2,-5.3,51.7,-3.2,51.4],
  [-6,52.2,-6.2,54.2,-5.6,55.2,-7.2,55.4,-8.5,54.3,-10,54,-10,51.6,-8,51.6],
  [-24,65.5,-22,66.4,-15,66.3,-13.5,65,-18,63.4,-22.5,63.8],
  [49.3,-12,50.5,-15.5,49.5,-17,47.2,-24.8,45.2,-25.5,43.5,-22,44.3,-17,46.4,-15.8,48,-13.3],
  [79.8,6,80,9.7,81.9,7.5,81.2,6.2],
  [130.9,34,132.5,35.5,136,35.8,137.3,36.8,139.8,38.2,140,40.5,141.5,41.4,142,39.5,140.8,36,139.8,35,137,34.6,135.2,33.8,133,33.8,131.5,31.3,130.2,31.3,129.8,33.2],
  [140,41.5,141.3,45.4,145.3,44.3,143.3,42,141,42.3],
  [120.2,22.6,121,25.2,121.9,24.8,120.8,22],
  [120.5,18.5,122.2,18.4,122,14,124,12.6,120.6,14],
  [122,7,125.6,9.6,126.4,7,125.4,5.8,123.4,7.6],
  [109.5,1.8,111,3,113.5,4.5,116,6.9,119,5.2,118,1,116.5,-1.5,116,-3.7,114,-3.5,110.5,-2.9,109,-0.5],
  [95.3,5.6,97.5,5.2,100.3,2.3,104,-1,106,-3,106,-5.9,104.5,-5.9,102,-4,99,-0.5,97.5,2],
  [105.5,-6.2,108,-6.3,111,-6.5,114.5,-7.7,114.5,-8.7,110,-8.1,106.5,-7.4],
  [119,-5.5,120.4,-1,121,1.2,124.8,1.4,123,0.4,120.8,-1.4,121.6,-4.8],
  [131,-1.3,134,-0.9,137.8,-1.5,141,-2.6,145.7,-4.9,147.5,-6.1,150,-10.6,147,-10,144,-7.8,141,-9.1,138,-8.3,137.7,-5.2,134.5,-4,132,-2.9],
  [113.5,-22,114,-26.5,115,-34.2,118,-35,123.5,-33.9,129,-31.6,131.5,-31.5,134.5,-33,137.5,-33,138.5,-35.6,140,-37.9,144,-38.4,146.4,-39.1,150,-37.5,151.3,-33.9,153,-31,153.5,-28,153,-25,150.8,-22.7,149,-20.3,146.3,-18.9,145.4,-15,143.5,-14,142.5,-10.7,141.6,-12.8,141.5,-17,140,-17.7,136.7,-15.8,135.9,-13.5,136.9,-12.2,132.6,-11.4,130,-13,129.5,-14.9,127,-14,125,-15.3,122.2,-17.7,121,-19.6,117,-20.6,114,-21.8],
  [144.6,-40.7,148.3,-40.9,148,-43.2,145.8,-43.5],
  [172.7,-34.4,174.5,-36,178.5,-37.7,177,-39.6,176,-41.4,174.6,-41.3,174.6,-39.5,173.8,-39.2],
  [172.6,-40.5,174.3,-41.7,173,-43.6,171,-45,169,-46.6,166.5,-46,168,-44,170.5,-43],
  [-84.9,21.9,-82,23.1,-77.2,22.2,-74.2,20.2,-77.6,19.9,-80.6,21.6],
  [-74.4,18.4,-72.8,19.9,-68.4,18.6,-71.2,17.6],
  [11,78.6,16,80,27,80,22,78,16,76.6],
  [52,71.4,56,74,62,76.4,68,77,58,73.4,55,71],
  [142,46,143.6,49,143,54.4,142,51],
  [12.4,38,15.6,38.2,15.1,36.7],
  [8.4,39,8.2,41,9.6,41,9.8,39.2]
];

const WATER = [
  [28,41.2,28,45,30,46.5,33.5,46,36.5,45.3,38,47,39.5,44.5,41.5,41.6,36,41.7,32,41.9], // mer Noire
  [47,44.5,49.5,46.5,53,47,53,45,51.3,44.5,52.8,41.8,53.9,40.8,53.8,37.3,50,37.4,48.8,38.5,49.5,40.5,47.5,42.8] // Caspienne
];

/** Québec (rive nord + rive sud/Gaspésie + Anticosti) — silhouette stylisée. */
const QUEBEC = [
  [-79.5,46.6,-79.5,51.4,-78.9,52.1,-78.6,54,-79.6,54.8,-77.2,55.9,-76.6,56.6,-77.5,58.1,-78,58.7,-77.5,60.1,-78,61.5,-77.6,62.4,-75,62.3,-72,61.8,-70,61,-69.6,59.5,-68.1,58.5,-66.5,58.8,-65,59.8,-64.6,60.3,-65.5,58.5,-67,57.1,-67.6,55.2,-66.5,54.9,-64,54,-63.7,53,-64,52.2,-67.1,52.2,-67,51.9,-57.1,52,-57.1,51.4,-59,50.4,-61.5,50.2,-64,50.2,-66.5,50.1,-68,49.3,-69.7,48.2,-71.2,46.9,-72.5,46.2,-73.5,45.6,-74.5,45.3,-76,45.5,-77.5,45.9,-78.9,46.1],
  [-74.5,45,-71.5,45,-70.3,45.9,-70,46.7,-69.2,47.4,-67.8,47.1,-67.8,47.9,-66.4,48,-65.5,48,-64.3,48.4,-64.2,48.9,-65.5,49.2,-67,49.1,-68.5,48.5,-69.8,47.6,-70.8,47,-71.3,46.8,-72.5,46.3,-73.4,45.7,-74.3,45.3],
  [-64.5,49.9,-63.2,49.8,-61.7,49.1,-62.6,49.1,-64.3,49.6]
];

const PLACES = {
  quebec: [-71.2, 46.8],
  montreal: [-73.57, 45.5],
  levis: [-71.18, 46.8],
  manic5: [-68.73, 50.64],
  baieJames: [-77.5, 53.8],
  hormuz: [56.45, 26.55],
  babElMandeb: [43.4, 12.6],
  suez: [32.55, 29.95],
  cape: [18.5, -34.6],
  london: [-0.12, 51.5],
  newYork: [-74, 40.7],
  washington: [-77.04, 38.9],
  ottawa: [-75.7, 45.42],
  virginia: [-77.5, 39.0],
  siliconValley: [-122.05, 37.38],
  dublin: [-6.26, 53.35],
  frankfurt: [8.68, 50.11],
  alberta: [-113.5, 53.5],
  texas: [-95.4, 29.8],
  california: [-121.6, 36.7],
  arizona: [-114.6, 32.7],
  florida: [-81.5, 27.8],
  mexico: [-102.5, 19.8],
  shanghai: [121.5, 31.2],
  rotterdam: [4.4, 51.9]
};

function insidePoly(x, y, p) {
  let ins = false;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const xi = p[i];
    const yi = p[i + 1];
    const xj = p[j];
    const yj = p[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

function bboxOf(p) {
  let a = Infinity;
  let b = Infinity;
  let c = -Infinity;
  let d = -Infinity;
  for (let i = 0; i < p.length; i += 2) {
    a = Math.min(a, p[i]);
    c = Math.max(c, p[i]);
    b = Math.min(b, p[i + 1]);
    d = Math.max(d, p[i + 1]);
  }
  return [a, b, c, d];
}

function isLand(lon, lat) {
  const boxes = cached('landBoxes', () => LAND.map(bboxOf));
  const wboxes = cached('waterBoxes', () => WATER.map(bboxOf));
  for (let i = 0; i < WATER.length; i++) {
    const bx = wboxes[i];
    if (lon >= bx[0] && lon <= bx[2] && lat >= bx[1] && lat <= bx[3] && insidePoly(lon, lat, WATER[i])) return false;
  }
  for (let i = 0; i < LAND.length; i++) {
    const bx = boxes[i];
    if (lon >= bx[0] && lon <= bx[2] && lat >= bx[1] && lat <= bx[3] && insidePoly(lon, lat, LAND[i])) return true;
  }
  return false;
}

/** Points de terre sur une grille à densité uniforme sur la sphère (cache). */
function worldDots(step = 1.1) {
  return cached('dots' + step, () => {
    const lon = [];
    const lat = [];
    let row = 0;
    for (let la = -56; la <= 83; la += step, row++) {
      const ls = step / Math.max(0.18, Math.cos(la * D2R));
      const off = (row % 2) * ls * 0.5;
      for (let lo = -180 + off; lo < 180; lo += ls) {
        if (isLand(lo, la)) {
          lon.push(lo);
          lat.push(la);
        }
      }
    }
    const n = lon.length;
    const out = { n, lon: new Float32Array(lon), lat: new Float32Array(lat), sl: new Float32Array(n), cl: new Float32Array(n), lr: new Float32Array(n) };
    for (let i = 0; i < n; i++) {
      out.sl[i] = Math.sin(lat[i] * D2R);
      out.cl[i] = Math.cos(lat[i] * D2R);
      out.lr[i] = lon[i] * D2R;
    }
    return out;
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * 5. GLOBE ORTHOGRAPHIQUE & CARTES PLATES
 * ════════════════════════════════════════════════════════════════════════ */

function makeGlobe(lon0, lat0, R, cx, cy) {
  const l0 = lon0 * D2R;
  const p0 = lat0 * D2R;
  const sp0 = Math.sin(p0);
  const cp0 = Math.cos(p0);
  return {
    lon0, lat0, R, cx, cy, l0, sp0, cp0,
    project(lon, lat, alt = 0) {
      const l = lon * D2R - l0;
      const p = lat * D2R;
      const cp = Math.cos(p);
      const sp = Math.sin(p);
      const cl = Math.cos(l);
      const r = R * (1 + alt);
      const z = sp0 * sp + cp0 * cp * cl;
      const x = cx + r * cp * Math.sin(l);
      const y = cy - r * (cp0 * sp - sp0 * cp * cl);
      const vis = z > 0 || Math.hypot(x - cx, y - cy) > R * 1.002;
      return { x, y, z, vis };
    }
  };
}

/** Interpolation douce d'un état de caméra-globe (lon, lat, rayon, centre). */
function globeLerp(a, b, t) {
  let dl = b[0] - a[0];
  if (dl > 180) dl -= 360;
  if (dl < -180) dl += 360;
  return [a[0] + dl * t, lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t), lerp(a[4], b[4], t)];
}

function drawGlobe(ctx, G, o = {}) {
  const {
    color = C.cyan, alpha = 1, hl = null, hlColor = C.amber,
    rim = true, grat = true, ocean = true, atmo = 1
  } = o;
  const { R, cx, cy, l0, sp0, cp0 } = G;
  // Densité adaptée au zoom : jamais de « gros pixels » en plan rapproché
  const step = o.step || (R > 1300 ? 0.45 : R > 750 ? 0.75 : 1.1);
  const spacing = R * step * D2R;
  const dot = o.dot || clamp(spacing * 0.42, 1.4, 7);
  const dotAlpha = o.dotAlpha ?? (R > 1300 ? 0.62 : 1);
  ctx.save();
  ctx.globalAlpha *= alpha;

  if (atmo > 0) {
    light(ctx, cx - R * 0.55, cy - R * 0.1, R * 1.25, C.cyan, 0.13 * atmo);
    light(ctx, cx + R * 0.6, cy + R * 0.05, R * 1.2, C.amber, 0.1 * atmo);
  }
  if (ocean) {
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.05, cx, cy, R);
    g.addColorStop(0, 'rgba(14,34,58,0.92)');
    g.addColorStop(0.7, 'rgba(6,14,26,0.96)');
    g.addColorStop(1, 'rgba(3,6,12,0.98)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.fill();
  }
  if (grat) {
    ctx.strokeStyle = rgba(C.ice, 0.07);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let lo = -180; lo < 180; lo += 15) {
      let pen = false;
      for (let la = -84; la <= 84; la += 3) {
        const q = G.project(lo, la);
        if (q.z > 0) {
          if (pen) ctx.lineTo(q.x, q.y);
          else ctx.moveTo(q.x, q.y);
          pen = true;
        } else pen = false;
      }
    }
    for (let la = -75; la <= 75; la += 15) {
      let pen = false;
      for (let lo = -180; lo <= 180; lo += 3) {
        const q = G.project(lo, la);
        if (q.z > 0) {
          if (pen) ctx.lineTo(q.x, q.y);
          else ctx.moveTo(q.x, q.y);
          pen = true;
        } else pen = false;
      }
    }
    ctx.stroke();
  }

  // Pointillés de terre, en 3 profondeurs (volume)
  const D = worldDots(step);
  const buckets = [[], [], []];
  const hot = [];
  for (let i = 0; i < D.n; i++) {
    const l = D.lr[i] - l0;
    const cl = Math.cos(l);
    const z = sp0 * D.sl[i] + cp0 * D.cl[i] * cl;
    if (z <= 0.02) continue;
    const x = cx + R * D.cl[i] * Math.sin(l);
    const y = cy - R * (cp0 * D.sl[i] - sp0 * D.cl[i] * cl);
    const s = dot * (0.45 + 0.55 * z);
    buckets[z < 0.35 ? 0 : z < 0.7 ? 1 : 2].push(x, y, s);
    if (hl) {
      const h = hl(D.lon[i], D.lat[i]);
      if (h > 0.02) hot.push(x, y, s, h);
    }
  }
  const al = [0.22, 0.48, 0.82];
  ctx.fillStyle = color;
  for (let b = 0; b < 3; b++) {
    ctx.globalAlpha = alpha * al[b] * dotAlpha;
    ctx.beginPath();
    const a = buckets[b];
    for (let i = 0; i < a.length; i += 3) ctx.rect(a[i] - a[i + 2] / 2, a[i + 1] - a[i + 2] / 2, a[i + 2], a[i + 2]);
    ctx.fill();
  }
  if (hot.length) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hlColor;
    for (let i = 0; i < hot.length; i += 4) {
      ctx.globalAlpha = alpha * clamp(hot[i + 3]);
      const s = hot[i + 2] * 1.25;
      ctx.fillRect(hot[i] - s / 2, hot[i + 1] - s / 2, s, s);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = alpha;

  if (rim) {
    // Anneau méridien bicolore de l'emblème : Cyan à gauche, Ambre à droite
    ctx.lineWidth = Math.max(1.5, R * 0.004);
    ctx.shadowBlur = R * 0.05;
    ctx.shadowColor = C.cyan;
    ctx.strokeStyle = rgba(C.cyan, 0.85);
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.004, Math.PI * 0.56, Math.PI * 1.44);
    ctx.stroke();
    ctx.shadowColor = C.amber;
    ctx.strokeStyle = rgba(C.amber, 0.85);
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.004, -Math.PI * 0.44, Math.PI * 0.44);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

/** Grand cercle entre deux points (lon, lat) avec élévation en arc. */
function arcPts(a, b, n = 72, h = 0.18) {
  const v = (p) => [Math.cos(p[1] * D2R) * Math.cos(p[0] * D2R), Math.cos(p[1] * D2R) * Math.sin(p[0] * D2R), Math.sin(p[1] * D2R)];
  const A = v(a);
  const B = v(b);
  const dot = clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1);
  const w = Math.acos(dot);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s1 = w < 1e-6 ? 1 - t : Math.sin((1 - t) * w) / Math.sin(w);
    const s2 = w < 1e-6 ? t : Math.sin(t * w) / Math.sin(w);
    const x = s1 * A[0] + s2 * B[0];
    const y = s1 * A[1] + s2 * B[1];
    const z = s1 * A[2] + s2 * B[2];
    out.push([Math.atan2(y, x) / D2R, Math.asin(clamp(z, -1, 1)) / D2R, h * Math.sin(Math.PI * t)]);
  }
  return out;
}

/** Chemin lissé (Catmull-Rom) à travers des points (lon, lat). */
function smoothPath(pts, per = 14) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), 0]);
    }
  }
  const last = pts[pts.length - 1];
  out.push([last[0], last[1], 0]);
  return out;
}

/**
 * Tracé lumineux progressif (0 → t) avec tête incandescente.
 * pts : [{x, y, vis}] déjà projetés.
 */
function trail(ctx, pts, t, o = {}) {
  const { color = C.amber, width = 3, alpha = 1, head = true, from = 0, dash = null, glow = 1 } = o;
  if (t <= from || pts.length < 2 || alpha <= 0.003) return null;
  const n = pts.length - 1;
  const endF = clamp(t) * n;
  const startF = clamp(from) * n;
  const pass = (lw, col, a, comp) => {
    ctx.save();
    ctx.globalAlpha *= a;
    if (comp) ctx.globalCompositeOperation = comp;
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    let pen = false;
    for (let i = Math.floor(startF); i <= Math.ceil(endF) && i <= n; i++) {
      let p = pts[i];
      if (i + 1 > endF && i > 0) {
        const q = pts[i - 1];
        const f = endF - (i - 1);
        p = { x: lerp(q.x, pts[i].x, f), y: lerp(q.y, pts[i].y, f), vis: pts[i].vis };
      }
      if (!p.vis) {
        pen = false;
        continue;
      }
      if (pen) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
      pen = true;
    }
    ctx.stroke();
    ctx.restore();
  };
  if (glow > 0) pass(width * 5, color, 0.12 * alpha * glow, 'lighter');
  pass(width, color, alpha);
  pass(Math.max(1, width * 0.35), C.white, 0.55 * alpha, 'lighter');
  const i0 = Math.min(n - 1, Math.floor(endF));
  const f = endF - i0;
  const hp = { x: lerp(pts[i0].x, pts[i0 + 1].x, f), y: lerp(pts[i0].y, pts[i0 + 1].y, f), vis: pts[i0 + 1].vis };
  if (head && hp.vis && t < 0.999) {
    light(ctx, hp.x, hp.y, width * 9, color, 0.9 * alpha);
    light(ctx, hp.x, hp.y, width * 3, C.white, 0.9 * alpha);
  }
  return hp;
}

function projectAll(G, pts) {
  return pts.map((p) => G.project(p[0], p[1], p[2] || 0));
}

/** Projection plate équirectangulaire corrigée (cartes régionales). */
function makeFlat(lon0, lat0, scale, cx, cy) {
  const k = Math.cos(lat0 * D2R);
  return {
    scale,
    project(lon, lat) {
      return { x: cx + (lon - lon0) * scale * k, y: cy - (lat - lat0) * scale, z: 1, vis: true };
    }
  };
}

function polyPath(ctx, P, poly) {
  ctx.beginPath();
  for (let i = 0; i < poly.length; i += 2) {
    const q = P.project(poly[i], poly[i + 1]);
    if (i === 0) ctx.moveTo(q.x, q.y);
    else ctx.lineTo(q.x, q.y);
  }
  ctx.closePath();
}

/** Silhouette lumineuse du Québec (contour + remplissage + halo). */
function drawQuebec(ctx, P, o = {}) {
  const { color = C.cyan, alpha = 1, fill = 0.16, line = 2.4, draw = 1, glow = 1 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (const poly of QUEBEC) {
    polyPath(ctx, P, poly);
    if (fill > 0) {
      ctx.fillStyle = rgba(color, fill * clamp(draw * 1.4 - 0.4));
      ctx.fill();
    }
    ctx.save();
    if (draw < 1) {
      ctx.setLineDash([4000 * draw, 4000]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = line;
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 * glow;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/* ════════════════════════════════════════════════════════════════════════
 * 6. TYPOGRAPHIE CINÉTIQUE (jamais plus de 6 mots à l'écran)
 * ════════════════════════════════════════════════════════════════════════ */

function setFont(ctx, weight, size, fam = DISPLAY) {
  ctx.font = `${weight} ${Math.max(1, Math.round(size))}px ${fam}`;
}

/** Taille maximale pour que `text` tienne dans maxW. */
function fitSize(ctx, text, weight, size, maxW, fam = DISPLAY, spacing = 0) {
  ctx.save();
  setFont(ctx, weight, size, fam);
  ctx.letterSpacing = `${spacing}px`;
  const w = ctx.measureText(text).width;
  ctx.restore();
  return w > maxW ? (size * maxW) / w : size;
}

/**
 * Titre monumental lettre par lettre : chaque glyphe monte, s'éclaire,
 * et le tracking se resserre (respiration typographique).
 */
function kinetic(ctx, text, x, y, o = {}) {
  const {
    size = 120, weight = 800, color = C.white, align = 'center', t = 1, spacing = 0,
    fam = DISPLAY, glow = 0, glowColor = color, alpha = 1, stagger = 0.45, rise = 0.38,
    track = 0, maxW = 0, out = 0
  } = o;
  if (alpha <= 0.003 || t <= 0) return 0;
  let sz = size;
  const sp = spacing + track * (1 - eOutExpo(t));
  if (maxW > 0) sz = fitSize(ctx, text, weight, size, maxW, fam, sp);
  ctx.save();
  setFont(ctx, weight, sz, fam);
  ctx.letterSpacing = `${sp}px`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const chars = [...text];
  const total = ctx.measureText(text).width - sp;
  const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const n = chars.length;
  if (glow > 0) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glow;
  }
  ctx.fillStyle = color;
  let prefix = '';
  for (let i = 0; i < n; i++) {
    const cx = x0 + (i ? ctx.measureText(prefix).width : 0);
    prefix += chars[i];
    const start = n > 1 ? (i / (n - 1)) * stagger : 0;
    const lt = clamp((t - start) / Math.max(0.0001, 1 - stagger));
    const ot = out > 0 ? clamp((out - (n > 1 ? (i / (n - 1)) * stagger : 0)) / Math.max(0.0001, 1 - stagger)) : 0;
    if (lt <= 0 || ot >= 1) continue;
    const e = eOutExpo(lt);
    ctx.globalAlpha = alpha * clamp(lt * 1.8) * (1 - ot);
    ctx.fillText(chars[i], cx, y + (1 - e) * sz * rise - eInExpo(ot) * sz * 0.3);
  }
  ctx.restore();
  return total;
}

/** Étiquette technique IBM Plex Mono, révélée façon machine à écrire. */
function mono(ctx, text, x, y, o = {}) {
  const { size = 20, color = C.slate, alpha = 1, align = 'center', spacing = 5, weight = 500, t = 1, cursor = true } = o;
  if (alpha <= 0.003 || t <= 0) return 0;
  const chars = [...text];
  const shown = Math.ceil(chars.length * clamp(t));
  const str = chars.slice(0, shown).join('');
  ctx.save();
  setFont(ctx, weight, size, MONO);
  ctx.letterSpacing = `${spacing}px`;
  const full = ctx.measureText(text).width - spacing;
  const x0 = align === 'center' ? x - full / 2 : align === 'right' ? x - full : x;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.fillText(str, x0, y);
  if (cursor && t < 1) {
    const w = ctx.measureText(str).width;
    ctx.fillStyle = C.amber;
    ctx.fillRect(x0 + w + 2, y - size * 0.45, size * 0.55, size * 0.9);
  }
  ctx.restore();
  return full;
}

/** Glyphes tracés au scalpel (contours qui se dessinent) puis remplis. */
function strokeText(ctx, text, x, y, o = {}) {
  const { size = 200, weight = 800, color = C.white, t = 1, fill = 1, align = 'center', glow = 0, alpha = 1, spacing = 0, lw = 2 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  setFont(ctx, weight, size);
  ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha *= alpha;
  if (t > 0) {
    const L = size * 3.2;
    ctx.setLineDash([L * clamp(t), L]);
    ctx.lineWidth = lw;
    ctx.strokeStyle = color;
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
    }
    ctx.strokeText(text, x, y);
  }
  if (fill > 0) {
    ctx.setLineDash([]);
    ctx.globalAlpha *= clamp(fill);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

/** Nombre français (virgule décimale, espace fine des milliers). */
function frNum(v, dec = 0) {
  const s = Math.abs(v).toFixed(dec).split('.');
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (v < 0 ? '−' : '') + s.join(',');
}

/* ════════════════════════════════════════════════════════════════════════
 * 7. MOTIFS DE LA CHARTE : chevrons, ondes, anneaux, emblème
 * ════════════════════════════════════════════════════════════════════════ */

/** Les trois flèches obliques de la charte (Ambre · Slate · Cyan). */
function chevrons(ctx, x, y, s, o = {}) {
  const { t = 1, alpha = 1, dir = 1, colors = [C.amber, C.slate, C.cyan], rot = 0 } = o;
  if (alpha <= 0.003 || t <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(dir, 1);
  const w = s * 0.34;
  const k = s * 0.42;
  colors.forEach((col, i) => {
    const lt = eOutExpo(clamp(t * 1.6 - i * 0.25));
    if (lt <= 0) return;
    const ox = (i - 1) * s * 0.52 + (1 - lt) * -s * 0.8;
    ctx.globalAlpha = alpha * lt;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(ox - w / 2 + k / 2, -s / 2);
    ctx.lineTo(ox + w / 2 + k / 2, -s / 2);
    ctx.lineTo(ox + w / 2 - k / 2, s / 2);
    ctx.lineTo(ox - w / 2 - k / 2, s / 2);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

/** Onde fréquentielle symétrique (barres verticales cyan → blanc → ambre). */
function freqWave(ctx, x, y, w, h, time, o = {}) {
  const { bars = 72, energy = 1, alpha = 1, seed = 1, gap = 0.42, colorA = C.cyan, colorB = C.amber, focus = 0.5, spread = 0.32 } = o;
  if (alpha <= 0.003 || energy <= 0.001) return;
  const bw = w / bars;
  const r = cached('fw' + seed + '_' + bars, () => {
    const g = rng(seed);
    return Array.from({ length: bars }, () => [g() * TAU, 0.6 + g() * 2.4, 0.3 + g() * 0.7]);
  });
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < bars; i++) {
    const u = i / (bars - 1);
    const envl = Math.exp(-Math.pow((u - focus) / spread, 2));
    const [ph, fq, amp] = r[i];
    const v = 0.12 + 0.88 * Math.abs(Math.sin(time * fq + ph)) * amp;
    const bh = h * energy * envl * v;
    const col = u < 0.5 ? mix(colorA, C.white, u * 1.2) : mix(C.white, colorB, (u - 0.5) * 2);
    ctx.fillStyle = col;
    ctx.globalAlpha = alpha * (0.35 + 0.65 * envl);
    ctx.fillRect(x + i * bw + (bw * gap) / 2, y - bh / 2, bw * (1 - gap), Math.max(1.5, bh));
  }
  ctx.restore();
}

/** Arc lumineux (anneaux, jauges, ondes de choc). */
function ring(ctx, x, y, r, o = {}) {
  const { color = C.cyan, width = 2, alpha = 1, a0 = -Math.PI / 2, sweep = TAU, glow = 0, dash = null } = o;
  if (alpha <= 0.003 || r <= 0 || sweep <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a0 + sweep);
  ctx.stroke();
  ctx.restore();
}

/** Onde de choc concentrique (plusieurs fronts qui s'élargissent). */
function shockwave(ctx, x, y, maxR, time, o = {}) {
  const { color = C.coral, count = 3, period = 2.2, alpha = 1, width = 2.5 } = o;
  for (let i = 0; i < count; i++) {
    const ph = ((time / period + i / count) % 1 + 1) % 1;
    const r = maxR * eOutCubic(ph);
    ring(ctx, x, y, r, { color, width: width * (1 - ph * 0.6), alpha: alpha * (1 - ph) * 0.9, glow: 14 });
  }
  light(ctx, x, y, maxR * 0.35, color, 0.5 * alpha);
}

/** Point repère : noyau blanc + halo + anneau qui respire. */
function beacon(ctx, x, y, o = {}) {
  const { color = C.amber, r = 8, alpha = 1, time = 0, pulse = true } = o;
  if (alpha <= 0.003) return;
  light(ctx, x, y, r * 7, color, 0.75 * alpha);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (pulse) {
    const ph = (time * 0.7) % 1;
    ring(ctx, x, y, r * (1.2 + ph * 3.2), { color, width: 1.6, alpha: alpha * (1 - ph) * 0.9 });
  }
}

/** Ligne de cote technique ⟷ (mesures, échelles comparatives). */
function dimension(ctx, x1, y1, x2, y2, o = {}) {
  const { color = C.amber, t = 1, alpha = 1, tick = 14, width = 2 } = o;
  if (alpha <= 0.003 || t <= 0) return;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const e = eOutExpo(t);
  const ax = lerp(mx, x1, e);
  const ay = lerp(my, y1, e);
  const bx = lerp(mx, x2, e);
  const by = lerp(my, y2, e);
  const ang = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
  const tx = Math.cos(ang) * tick;
  const ty = Math.sin(ang) * tick;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.moveTo(ax - tx, ay - ty);
  ctx.lineTo(ax + tx, ay + ty);
  ctx.moveTo(bx - tx, by - ty);
  ctx.lineTo(bx + tx, by + ty);
  ctx.stroke();
  ctx.restore();
}

/**
 * Emblème FRANC NORD redessiné au vectoriel, animable pièce par pièce :
 *  { star, ring, needle, cardinals } ∈ [0, 1]
 */
function emblem(ctx, x, y, r, o = {}) {
  const { star = 1, ringT = 1, needle = 1, cardinals = 1, alpha = 1, time = 0, swing = 0 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  // Anneau méridien scindé
  if (ringT > 0) {
    const e = eInOutQuart(ringT);
    ring(ctx, 0, 0, r, { color: C.cyan, width: Math.max(1.5, r * 0.028), a0: Math.PI * 1.44 - Math.PI * 0.88 * e, sweep: Math.PI * 0.88 * e, glow: r * 0.16 });
    ring(ctx, 0, 0, r, { color: C.amber, width: Math.max(1.5, r * 0.028), a0: -Math.PI * 0.44, sweep: Math.PI * 0.88 * e, glow: r * 0.16 });
  }
  // Pointes cardinales effilées
  if (cardinals > 0) {
    const e = eOutExpo(cardinals);
    ctx.save();
    ctx.strokeStyle = rgba(C.slate, 0.85);
    ctx.lineWidth = Math.max(1, r * 0.018);
    ctx.shadowColor = C.white;
    ctx.shadowBlur = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, r * 0.05);
    ctx.lineTo(-r * (0.55 + 0.75 * e), r * 0.05);
    ctx.moveTo(r * 0.55, r * 0.05);
    ctx.lineTo(r * (0.55 + 0.75 * e), r * 0.05);
    ctx.moveTo(0, r * 0.2);
    ctx.lineTo(0, r * (0.2 + 1.05 * e));
    ctx.stroke();
    ctx.restore();
  }
  // Aiguille facettée (Cyan à gauche / Ambre à droite)
  if (needle > 0) {
    const s = eOutBack(needle, 1.4);
    ctx.save();
    ctx.rotate(swing);
    ctx.scale(s, s);
    const tipY = -r * 0.78;
    const midY = r * 0.06;
    const wingY = r * 0.56;
    const wingX = r * 0.46;
    const lg = ctx.createLinearGradient(-wingX, wingY, 0, tipY);
    lg.addColorStop(0, '#0284C7');
    lg.addColorStop(0.55, '#38BDF8');
    lg.addColorStop(1, '#E0F2FE');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0, tipY);
    ctx.lineTo(-wingX, wingY);
    ctx.lineTo(0, midY);
    ctx.closePath();
    ctx.fill();
    const rg = ctx.createLinearGradient(wingX, wingY, 0, tipY);
    rg.addColorStop(0, '#D97706');
    rg.addColorStop(0.55, '#F59E0B');
    rg.addColorStop(1, '#FEF3C7');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(0, tipY);
    ctx.lineTo(wingX, wingY);
    ctx.lineTo(0, midY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#075985';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(-wingX, wingY);
    ctx.lineTo(0, r * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(wingX, wingY);
    ctx.lineTo(0, r * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Étoile polaire à 8 branches + reflet anamorphique
  if (star > 0) {
    const sy = -r * 1.04;
    const sr = r * 0.34 * eOutBack(star, 2) * (0.96 + 0.04 * Math.sin(time * 3));
    ctx.save();
    ctx.translate(0, sy);
    ctx.rotate((1 - eOutExpo(star)) * -0.8);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const len = i % 2 === 0 ? sr : sr * 0.5;
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      const na = a + Math.PI / 8;
      ctx.lineTo(Math.cos(na) * sr * 0.14, Math.sin(na) * sr * 0.14);
    }
    ctx.closePath();
    ctx.fillStyle = C.white;
    ctx.shadowColor = C.white;
    ctx.shadowBlur = r * 0.2;
    ctx.fill();
    ctx.restore();
    flare(ctx, 0, sy, r * 0.9, C.ice, star * (0.55 + 0.15 * Math.sin(time * 2.1)));
  }
  ctx.restore();
}

/** Plan caméra : translation + zoom autour d'un point focal. */
function camera(ctx, stage, fx, fy, zoom, fn, rot = 0) {
  ctx.save();
  ctx.translate(stage.cx, stage.cy);
  ctx.rotate(rot);
  ctx.scale(zoom, zoom);
  ctx.translate(-fx, -fy);
  fn();
  ctx.restore();
}

/** Piste d'animation par images clés : [[progress, valeur, easing?], ...]. */
function track(p, kf) {
  if (p <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) {
    const [p1, v1, e = smooth] = kf[i];
    const [p0, v0] = kf[i - 1];
    if (p <= p1) return p1 <= p0 ? v1 : lerp(v0, v1, e(seg(p, p0, p1)));
  }
  return kf[kf.length - 1][1];
}

/** Traînées de vitesse radiales (plongée caméra) — fonction de la profondeur, sans état. */
function warp(ctx, stage, depth, speed, o = {}) {
  const { count = 110, color = C.ice, alpha = 1, seed = 11 } = o;
  if (speed <= 0.01 || alpha <= 0.003) return;
  const lines = cached('warp' + seed, () => {
    const r = rng(seed);
    return Array.from({ length: count }, () => [r() * TAU, r(), 0.4 + r() * 0.6]);
  });
  const maxR = Math.hypot(stage.w, stage.h) * 0.6;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (const [ang, u, z] of lines) {
    const f = (((u + depth * 0.9 * z) % 1) + 1) % 1;
    const r1 = maxR * Math.pow(f, 1.6);
    const len = maxR * 0.25 * clamp(speed) * z * (0.3 + f);
    const r0 = Math.max(0, r1 - len);
    ctx.globalAlpha = alpha * clamp(speed) * f * z * 0.8;
    ctx.lineWidth = 1 + z * 2 * f;
    ctx.beginPath();
    ctx.moveTo(stage.cx + Math.cos(ang) * r0, stage.cy + Math.sin(ang) * r0);
    ctx.lineTo(stage.cx + Math.cos(ang) * r1, stage.cy + Math.sin(ang) * r1);
    ctx.stroke();
  }
  ctx.restore();
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 01 — intro-sommaire
 * Acte I   : l'emblème naît dans le noir (méridien, étoile, anneau, aiguille)
 * Acte II  : trois ondes de choc s'échappent de la boussole
 * Acte III : la caméra plonge à travers chaque onde → 3 dossiers du jour
 * ════════════════════════════════════════════════════════════════════════ */

function glyphDrop(ctx, x, y, s, time, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = Math.max(2, s * 0.035);
  ctx.shadowColor = C.amber;
  ctx.shadowBlur = s * 0.25;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.62);
  ctx.bezierCurveTo(s * 0.12, -s * 0.36, s * 0.46, -s * 0.06, s * 0.46, s * 0.2);
  ctx.arc(0, s * 0.2, s * 0.46, 0, Math.PI);
  ctx.bezierCurveTo(-s * 0.46, -s * 0.06, -s * 0.12, -s * 0.36, 0, -s * 0.62);
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = rgba(C.amber, 0.22);
  ctx.beginPath();
  ctx.moveTo(-s, s);
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    ctx.lineTo(-s * 0.5 + u * s, s * 0.12 + Math.sin(u * TAU * 1.5 + time * 2.4) * s * 0.04);
  }
  ctx.lineTo(s, s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function glyphSlide(ctx, x, y, s, time, alpha, t = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  ring(ctx, 0, 0, s * 0.5, { color: C.cyan, width: Math.max(2, s * 0.03), glow: s * 0.2 });
  ring(ctx, 0, 0, s * 0.4, { color: C.ice, width: 1.2, alpha: 0.5, dash: [2, 7] });
  const pts = [[-0.32, -0.16], [-0.12, -0.08], [0.02, -0.1], [0.14, 0.06], [0.32, 0.2]];
  const e = eOutCubic(t);
  ctx.strokeStyle = C.white;
  ctx.lineWidth = Math.max(2, s * 0.035);
  ctx.lineJoin = 'round';
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = s * 0.2;
  ctx.beginPath();
  pts.forEach(([px, py], i) => {
    const q = Math.min(1, e * (pts.length - 1) - i + 1);
    if (q <= 0) return;
    if (i === 0) ctx.moveTo(px * s, py * s);
    else ctx.lineTo(lerp(pts[i - 1][0], px, q) * s, lerp(pts[i - 1][1], py, q) * s);
  });
  ctx.stroke();
  if (e > 0.98) {
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.moveTo(0.36 * s, 0.25 * s);
    ctx.lineTo(0.2 * s, 0.22 * s);
    ctx.lineTo(0.31 * s, 0.1 * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function glyphBolt(ctx, x, y, s, time, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha * (0.85 + 0.15 * Math.sin(time * 17) * Math.sin(time * 5.3));
  ctx.strokeStyle = C.mint;
  ctx.fillStyle = rgba(C.emerald, 0.18);
  ctx.lineWidth = Math.max(2, s * 0.035);
  ctx.lineJoin = 'miter';
  ctx.shadowColor = C.emerald;
  ctx.shadowBlur = s * 0.3;
  ctx.beginPath();
  ctx.moveTo(s * 0.08, -s * 0.6);
  ctx.lineTo(-s * 0.3, s * 0.06);
  ctx.lineTo(-s * 0.02, s * 0.06);
  ctx.lineTo(-s * 0.1, s * 0.6);
  ctx.lineTo(s * 0.3, -s * 0.08);
  ctx.lineTo(s * 0.02, -s * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function sceneIntro(a) {
  const { ctx, stage, progress: p, localTime: lt, globalTime: gt, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, { filtre: 'sans commanditaire', ondes: 'trois grandes', a: 'abord', b: 'Ensuite', c: 'Et enfin', hq: 'Hydro' });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 120, alpha: 0.55 });

    // Profondeur caméra du tunnel d'ondes
    const D0 = -0.16;
    const lin = (x) => x;
    const KF = [
      [T.a - 0.2 * s1, D0],
      [T.a + 1.3 * s1, 0, eInOutQuart],
      [T.b - 0.8 * s1, 0.07, lin],
      [T.b + 0.6 * s1, 1, eInOutExpo],
      [T.c - 0.8 * s1, 1.07, lin],
      [T.c + 0.6 * s1, 2, eInOutExpo],
      [1 - 2.4 * s1, 2.07, lin],
      [1 - 0.9 * s1, 2.9, eInExpo]
    ];
    const D = track(p, KF);
    const eps = 0.002;
    const speed = (Math.abs(track(p + eps, KF) - D) / eps) * s1 * 1.2;
    warp(ctx, stage, D, speed, { alpha: 0.9 });

    // ── ACTE I : l'emblème ──
    const ex = cx;
    const ey = cy - m * 0.07;
    const er = m * 0.19;
    const shrink = eInOutQuart(seg(p, T.ondes - 0.3 * s1, T.ondes + 1.0 * s1));
    const embR = lerp(er, er * 0.42, shrink);
    const embY = lerp(ey, cy, shrink);
    const embA = 1 - smooth(seg(p, T.a - 0.5 * s1, T.a + 0.5 * s1));

    // Méridien qui descend du ciel jusqu'à l'étoile polaire
    const mer = seg(lt, 0.15, 1.4);
    if (mer > 0 && lt < 3.2) {
      const yEnd = lerp(0, embY - embR * 1.04, eOutExpo(mer));
      ctx.save();
      ctx.globalAlpha *= 1 - smooth(seg(lt, 1.6, 3.0));
      const g = ctx.createLinearGradient(0, 0, 0, yEnd);
      g.addColorStop(0, rgba(C.ice, 0));
      g.addColorStop(1, rgba(C.white, 0.9));
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex, 0);
      ctx.lineTo(ex, yEnd);
      ctx.stroke();
      ctx.restore();
    }

    if (embA > 0.003) {
      // Globe en pointillés logé dans l'anneau (comme le logo officiel)
      const gA = smooth(seg(lt, 1.6, 3.6)) * (1 - shrink * 0.85);
      if (gA > 0.01) {
        const G = makeGlobe(-30 + gt * 4, 18, embR * 0.9, ex, embY);
        drawGlobe(ctx, G, { dot: Math.max(1.4, embR * 0.016), alpha: gA * embA * 0.9, rim: false, grat: false, ocean: false, atmo: 0.6, color: C.cyan, step: 1.6, dotAlpha: 1 });
      }
      emblem(ctx, ex, embY, embR, {
        star: seg(lt, 1.15, 2.0),
        ringT: seg(lt, 1.5, 2.9),
        needle: seg(lt, 2.2, 3.1),
        cardinals: seg(lt, 2.6, 3.6),
        time: gt,
        alpha: embA
      });
    }

    // Titre monumental + promesse éditoriale
    const titleOut = smooth(seg(p, T.ondes - 0.6 * s1, T.ondes + 0.3 * s1));
    const ty = ey + er * 1.95;
    if (titleOut < 1) {
      kinetic(ctx, 'FRANC NORD', cx, ty, {
        size: m * 0.115, weight: 800, t: seg(lt, 3.0, 4.6), track: m * 0.05, spacing: m * 0.006,
        glow: 26, glowColor: rgba(C.ice, 0.5), alpha: 1 - titleOut, maxW: w * 0.84
      });
      const lineT = eOutExpo(seg(lt, 3.8, 5.0));
      if (lineT > 0) {
        const lw = m * 0.16 * lineT;
        ctx.save();
        ctx.globalAlpha *= 1 - titleOut;
        ctx.fillStyle = C.cyan;
        ctx.fillRect(cx - m * 0.012 - lw, ty + m * 0.04, lw, 2);
        ctx.fillStyle = C.amber;
        ctx.fillRect(cx + m * 0.012, ty + m * 0.04, lw, 2);
        ctx.restore();
      }
      mono(ctx, "LE MONDE EXPLIQUÉ D'ICI", cx, ty + m * 0.095, {
        size: m * 0.022, t: seg(lt, 4.4, 6.0), alpha: (1 - titleOut) * (1 - smooth(seg(p, T.filtre - 0.5 * s1, T.filtre))), color: C.slate
      });
      mono(ctx, 'SANS COMMANDITAIRE · SANS FILTRE', cx, ty + m * 0.095, {
        size: m * 0.022, t: seg(p, T.filtre, T.filtre + 1.6 * s1), alpha: 1 - titleOut, color: C.amber
      });
    }

    // ── ACTES II–III : les trois ondes de choc devenues tunnel ──
    const base = m * 0.37;
    const rr = (phi) => base * Math.exp(4.6 * (phi - 0.5));
    const waves = [
      { col: C.amber, key: T.a, big: 'PÉTROLE', sub: '01 · PRIX À LA POMPE', glyph: (x, y, s, al) => glyphDrop(ctx, x, y, s, gt, al) },
      { col: C.cyan, key: T.b, big: '0,71 $ US', sub: "02 · PANIER D'ÉPICERIE", glyph: (x, y, s, al) => glyphSlide(ctx, x, y, s, gt, al, seg(p, T.b + 0.3 * s1, T.b + 2.2 * s1)) },
      { col: C.emerald, key: T.c, big: 'IA × HYDRO-QUÉBEC', sub: '03 · PANNE ÉLECTRIQUE', glyph: (x, y, s, al) => glyphBolt(ctx, x, y, s, gt, al) }
    ];
    waves.forEach((wv, i) => {
      const st = T.ondes + (i * 0.32 - 0.1) * s1;
      const ripple = eOutExpo(seg(p, st, st + 1.7 * s1));
      if (ripple <= 0) return;
      const phi = 0.5 + (D - i) * 0.5;
      const target = rr(phi);
      const r = lerp(embR * 0.62, target, ripple);
      const fadeBig = 1 - smooth(seg(phi, 0.78, 0.95));
      const fadeSmall = smooth(seg(phi, -0.55, -0.15));
      const framed = Math.round(clamp(D, 0, 2));
      const hush = i > framed && p > T.a ? 1 - 0.85 * smooth(seg(phi, 0.3, -0.05)) : 1;
      const al = fadeBig * (0.35 + 0.65 * fadeSmall) * clamp(ripple * 3) * hush;
      if (al <= 0.003) return;
      const wdt = clamp(1.5 + r * 0.008, 1.5, 9);
      ring(ctx, cx, embY + (cy - embY), r, { color: wv.col, width: wdt, alpha: al, glow: 22 });
      ring(ctx, cx, cy, r * 1.06, { color: wv.col, width: Math.max(1, wdt * 0.6), alpha: al * 0.55, dash: [1.5, Math.max(6, r * 0.035)] });
      light(ctx, cx, cy - r, r * 0.25, wv.col, al * 0.35);
      light(ctx, cx, cy + r, r * 0.2, wv.col, al * 0.2);

      // Contenu de l'onde quand la caméra la cadre
      const show = env(phi, 0.36, 0.64, 0.08, 0.06) * smooth(seg(p, wv.key - 0.3 * s1, wv.key + 0.4 * s1));
      if (show > 0.003) {
        const k = r / base;
        wv.glyph(cx, cy - r * 0.3, base * 0.34 * k, show);
        kinetic(ctx, wv.big, cx, cy + r * 0.24, {
          size: m * 0.1 * k, weight: 800, t: seg(p, wv.key + 0.2 * s1, wv.key + 1.4 * s1), alpha: show,
          glow: 30, glowColor: rgba(wv.col, 0.55), maxW: r * 1.6
        });
        mono(ctx, wv.sub, cx, cy + r * 0.45, { size: m * 0.02 * k, color: wv.col, t: seg(p, wv.key + 0.8 * s1, wv.key + 2.2 * s1), alpha: show });
      }
    });

    // Le chiffre 3 pendant l'annonce des ondes
    const threeA = env(p, T.ondes, T.a + 0.3 * s1, 0.6 * s1, 0.5 * s1);
    if (threeA > 0.003) {
      kinetic(ctx, '3 ONDES DE CHOC', cx, cy + m * 0.43, {
        size: m * 0.05, weight: 800, t: seg(p, T.ondes + 0.1 * s1, T.ondes + 1.1 * s1), alpha: threeA, spacing: m * 0.006
      });
    }

    // ── FINALE : retour à la boussole, cerclée des trois ondes ──
    const fin = smooth(seg(p, 1 - 1.5 * s1, 1 - 0.6 * s1));
    if (fin > 0.003) {
      const fr = m * 0.1;
      [C.amber, C.cyan, C.emerald].forEach((col, i) => {
        const rr2 = fr * (1.7 + i * 0.42) * (1 + 0.02 * Math.sin(gt * 2 + i));
        ring(ctx, cx, cy, rr2 * eOutExpo(fin), { color: col, width: 2, alpha: fin * 0.85, glow: 16 });
      });
      emblem(ctx, cx, cy + fr * 0.1, fr, { time: gt, alpha: fin });
    }
  });
}

function drawFlatDots(ctx, P, stage, o = {}) {
  const { color = C.cyan, alpha = 1, step = 1.1, hl = null, hlColor = C.amber } = o;
  if (alpha <= 0.003) return;
  const D = worldDots(step);
  const sz = clamp(P.scale * step * 0.38, 1.2, 6);
  ctx.save();
  ctx.globalAlpha *= alpha * 0.55;
  ctx.fillStyle = color;
  ctx.beginPath();
  const hot = [];
  for (let i = 0; i < D.n; i++) {
    const q = P.project(D.lon[i], D.lat[i]);
    if (q.x < -10 || q.y < -10 || q.x > stage.w + 10 || q.y > stage.h + 10) continue;
    ctx.rect(q.x - sz / 2, q.y - sz / 2, sz, sz);
    if (hl) {
      const k = hl(D.lon[i], D.lat[i]);
      if (k > 0.02) hot.push(q.x, q.y, k);
    }
  }
  ctx.fill();
  if (hot.length) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hlColor;
    for (let i = 0; i < hot.length; i += 3) {
      ctx.globalAlpha = alpha * hot[i + 2];
      ctx.fillRect(hot[i] - sz * 0.6, hot[i + 1] - sz * 0.6, sz * 1.2, sz * 1.2);
    }
  }
  ctx.restore();
}

function dotSphere(ctx, x, y, r, time, o = {}) {
  const { color = C.cyan, alpha = 1, n = 520, tilt = 0.35, spin = 0.25, glow = 1 } = o;
  if (alpha <= 0.003 || r <= 1) return;
  const pts = cached('fib' + n, () => {
    const out = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const yy = 1 - (i / (n - 1)) * 2;
      const rad = Math.sqrt(1 - yy * yy);
      out.push([Math.cos(ga * i) * rad, yy, Math.sin(ga * i) * rad]);
    }
    return out;
  });
  light(ctx, x, y, r * 2.2, color, 0.18 * alpha * glow);
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, rgba(color, 0.16));
  g.addColorStop(1, rgba(color, 0.02));
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  const a = time * spin;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  ctx.fillStyle = color;
  for (const [px, py, pz] of pts) {
    const x1 = px * ca + pz * sa;
    const z1 = -px * sa + pz * ca;
    const y1 = py * ct - z1 * st;
    const z2 = py * st + z1 * ct;
    if (z2 < -0.15) continue;
    const s = (1.2 + 2.4 * (z2 + 1) * 0.5) * clamp(r / 160, 0.6, 1.6);
    ctx.globalAlpha = alpha * (0.25 + 0.75 * (z2 + 1) * 0.5);
    ctx.fillRect(x + x1 * r - s / 2, y + y1 * r - s / 2, s, s);
  }
  ctx.restore();
}

function isoCube(ctx, x, y, s, o = {}) {
  const { color = C.emerald, alpha = 1, time = 0, dead = false, glow = 1 } = o;
  if (alpha <= 0.003) return;
  const col = dead ? '#475569' : color;
  const dx = s * 0.866;
  const dy = s * 0.5;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineJoin = 'round';
  const faces = [
    [[x, y - s], [x + dx, y - s + dy], [x, y - s + 2 * dy], [x - dx, y - s + dy], 0.22],
    [[x - dx, y - s + dy], [x, y - s + 2 * dy], [x, y + dy * 0.0 + s * 0.0 + 2 * dy - s + s], [x - dx, y + dy], 0.1],
    [[x + dx, y - s + dy], [x, y - s + 2 * dy], [x, y + s], [x + dx, y + dy], 0.06]
  ];
  for (const [a, b, c, d, al] of faces) {
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.lineTo(...c);
    ctx.lineTo(...d);
    ctx.closePath();
    ctx.fillStyle = rgba(col, al);
    ctx.fill();
    ctx.strokeStyle = rgba(col, 0.9);
    ctx.lineWidth = Math.max(1, s * 0.025);
    ctx.shadowColor = col;
    ctx.shadowBlur = dead ? 0 : s * 0.25 * glow;
    ctx.stroke();
  }
  // Baies de serveurs qui clignotent
  ctx.shadowBlur = 0;
  for (let r = 0; r < 5; r++) {
    for (let k = 0; k < 4; k++) {
      const u = (k + 0.5) / 4;
      const v = (r + 0.6) / 5.6;
      const px = lerp(x - dx, x, u);
      const py = lerp(y - s + dy, y - s + 2 * dy, u) + v * s * 0.95;
      const on = dead ? 0.15 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 7 + r * 3.1 + k * 1.7));
      ctx.fillStyle = rgba(dead ? '#94A3B8' : C.mint, on);
      ctx.fillRect(px - s * 0.05, py, s * 0.1, s * 0.035);
    }
  }
  ctx.restore();
  if (!dead) light(ctx, x, y, s * 2, color, alpha * 0.18 * glow);
}

function aurora(ctx, stage, time, alpha, yBase, amp) {
  if (alpha <= 0.003) return;
  const { w } = stage;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let band = 0; band < 3; band++) {
    const col = band === 1 ? C.cyan : C.emerald;
    ctx.beginPath();
    const top = [];
    for (let x = -20; x <= w + 20; x += 16) {
      const y = yBase - band * amp * 0.25 + Math.sin(x * 0.0035 + time * 0.35 + band * 1.7) * amp * 0.35 + Math.sin(x * 0.011 - time * 0.6 + band) * amp * 0.12;
      top.push([x, y]);
    }
    top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    for (let i = top.length - 1; i >= 0; i--) ctx.lineTo(top[i][0], top[i][1] + amp * (0.55 + 0.15 * band));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp);
    g.addColorStop(0, rgba(col, 0));
    g.addColorStop(0.45, rgba(col, 0.16 * alpha));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.restore();
}

function manic5(ctx, cx, baseY, W, H, o = {}) {
  const { alpha = 1, draw = 1, fill = 0, litArches = [], time = 0 } = o;
  if (alpha <= 0.003) return;
  const spans = [1, 1, 1, 1, 1, 1, 2.6, 1, 1, 1, 1, 1, 1];
  const total = spans.reduce((s, v) => s + v, 0);
  const crestY = baseY - H;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Crête et pied
  const x0 = cx - W / 2;
  ctx.strokeStyle = C.ice;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(x0 - W * 0.04, crestY);
  ctx.lineTo(x0 - W * 0.04 + (W * 1.08) * draw, crestY);
  ctx.stroke();
  let acc = 0;
  spans.forEach((sp, i) => {
    const a = x0 + (acc / total) * W;
    const b = x0 + ((acc + sp) / total) * W;
    acc += sp;
    const u = (i + 0.5) / spans.length;
    if (u > draw) return;
    const mid = (a + b) / 2;
    const archTop = crestY + H * (sp > 2 ? 0.12 : 0.3);
    const depth = baseY - (sp > 2 ? H * 0.0 : H * 0.12 * Math.abs(i - 6) / 6);
    const lit = litArches.includes(i);
    const col = lit ? C.mint : i === 6 ? C.emerald : C.cyan;
    // Remplissage (allocation de la capacité)
    if (fill > u - 0.04) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = rgba(C.emerald, 0.22);
      ctx.beginPath();
      ctx.moveTo(a, depth);
      ctx.lineTo(a, archTop + (depth - archTop) * 0.4);
      ctx.quadraticCurveTo(mid, archTop - (depth - archTop) * 0.25, b, archTop + (depth - archTop) * 0.4);
      ctx.lineTo(b, depth);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = lit ? 3.5 : 2;
    ctx.shadowColor = col;
    ctx.shadowBlur = lit ? 24 : 12;
    ctx.beginPath();
    ctx.moveTo(a, depth);
    ctx.lineTo(a, archTop + (depth - archTop) * 0.4);
    ctx.quadraticCurveTo(mid, archTop - (depth - archTop) * 0.25, b, archTop + (depth - archTop) * 0.4);
    ctx.lineTo(b, depth);
    ctx.stroke();
    // Contreforts jusqu'à la crête
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rgba(col, 0.6);
    ctx.beginPath();
    ctx.moveTo(a, crestY);
    ctx.lineTo(a, archTop + (depth - archTop) * 0.4);
    ctx.stroke();
    if (lit) light(ctx, mid, archTop + (depth - archTop) * 0.3, (b - a) * 0.9, C.emerald, 0.35 + 0.1 * Math.sin(time * 3 + i));
  });
  ctx.restore();
}

function iconGlyph(ctx, kind, x, y, s, color, alpha) {
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.4;
  ctx.beginPath();
  if (kind === 'hospital') {
    ctx.arc(0, 0, s * 0.5, 0, TAU);
    ctx.moveTo(0, -s * 0.26);
    ctx.lineTo(0, s * 0.26);
    ctx.moveTo(-s * 0.26, 0);
    ctx.lineTo(s * 0.26, 0);
  } else if (kind === 'school') {
    ctx.moveTo(-s * 0.5, -s * 0.12);
    ctx.lineTo(0, -s * 0.48);
    ctx.lineTo(s * 0.5, -s * 0.12);
    ctx.moveTo(-s * 0.42, s * 0.42);
    ctx.lineTo(s * 0.42, s * 0.42);
    for (const cx2 of [-0.3, -0.1, 0.1, 0.3]) {
      ctx.moveTo(cx2 * s, -s * 0.08);
      ctx.lineTo(cx2 * s, s * 0.38);
    }
  } else if (kind === 'dam') {
    ctx.moveTo(-s * 0.55, -s * 0.3);
    ctx.lineTo(s * 0.55, -s * 0.3);
    for (let k = 0; k < 3; k++) {
      const a = -s * 0.5 + k * s * 0.34;
      ctx.moveTo(a, s * 0.4);
      ctx.quadraticCurveTo(a + s * 0.17, -s * 0.3, a + s * 0.34, s * 0.4);
    }
  } else if (kind === 'house') {
    ctx.moveTo(-s * 0.4, s * 0.4);
    ctx.lineTo(-s * 0.4, -s * 0.05);
    ctx.lineTo(0, -s * 0.42);
    ctx.lineTo(s * 0.4, -s * 0.05);
    ctx.lineTo(s * 0.4, s * 0.4);
    ctx.closePath();
  } else if (kind === 'factory') {
    ctx.moveTo(-s * 0.5, s * 0.4);
    ctx.lineTo(-s * 0.5, -s * 0.1);
    ctx.lineTo(-s * 0.2, s * 0.08);
    ctx.lineTo(-s * 0.2, -s * 0.1);
    ctx.lineTo(s * 0.1, s * 0.08);
    ctx.lineTo(s * 0.1, -s * 0.45);
    ctx.lineTo(s * 0.35, -s * 0.45);
    ctx.lineTo(s * 0.35, s * 0.4);
    ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}

/* NOVEMBER 14 · Three systems under pressure.
 * All movement is a pure function of time: deterministic export and scrubbing.
 * Each editorial beat has its own geometry and word-timed camera transition.
 * Diagrammatic geography and flows are explanatory, never statistical data.
 */
const GEO = { antalya:[30.71,36.9], chad:[18,15], kyiv:[30.52,50.45], donbass:[38.4,48.2],
  moscow:[37.62,55.75], beijing:[116.4,39.9], washington:PLACES.washington, montreal:PLACES.montreal };

function line(ctx, pts, color=C.cyan, width=2, alpha=1, reveal=1) {
  return trail(ctx,pts.map(q=>Array.isArray(q)?{x:q[0],y:q[1],vis:true}:q),clamp(reveal),{color,width,alpha,head:false});
}
function bezier(A,B,bend=0.2,n=56) {
  const dx=B.x-A.x,dy=B.y-A.y;
  const M={x:(A.x+B.x)/2-dy*bend,y:(A.y+B.y)/2+dx*bend};
  return Array.from({length:n+1},(_,i)=>{const t=i/n;return{x:(1-t)**2*A.x+2*t*(1-t)*M.x+t*t*B.x,y:(1-t)**2*A.y+2*t*(1-t)*M.y+t*t*B.y,vis:true};});
}
function conduit(ctx,pts,t,color=C.cyan,alpha=1,stop=0,width=2) {
  trail(ctx,pts,1,{color,width,alpha:alpha*.38,head:false});
  for(let i=0;i<7;i++){
    const f=((t*.15+i/7)%1+1)%1;
    const q=pts[Math.round(lerp(f,.53,stop)*(pts.length-1))];
    if(q.vis!==false)light(ctx,q.x,q.y,11,color,alpha*(1-.65*stop));
  }
}
function word(a,text,alpha=1,color=C.white,y=.27,size=.09,entry=1) {
  const {ctx,stage:s,isVertical:V}=a,m=Math.min(s.w,s.h);
  kinetic(ctx,text,s.cx,s.h*(V?y:y-.025),{size:m*size,weight:900,color,alpha,t:entry,maxW:s.w*.84,track:m*.018,glow:12,glowColor:rgba(color,.22)});
}
// Named words are resolved to actual ASR timings in scene.wordSync (fallback: sentence interpolation).
function beat(a,phrase,fallback=.5) {
  const sc=a.scene;
  const raw=sc.wordSync?.find(x=>x.phrase.toLocaleLowerCase('fr')===phrase.toLocaleLowerCase('fr'));
  if(raw)return clamp(raw.time/sc.duration);
  const normalize=s=>s.toLocaleLowerCase('fr').replace(/[’‘]/g,"'");
  const narration=normalize(sc.narration||'');
  const index=narration.indexOf(normalize(phrase));
  if(index<0)return fallback;
  const sentence=sc.voiceSync?.sentences?.find(x=>index>=x.from&&index<x.to);
  return sentence?clamp((sentence.start+(sentence.end-sentence.start)*(index-sentence.from)/Math.max(1,sentence.to-sentence.from))/sc.duration):index/Math.max(1,narration.length);
}
function beats(a,phrases){return [0,...phrases.map((s,i)=>beat(a,s,(i+1)/(phrases.length+1))),1];}
function acts(a,marks,draw) {
  marks.slice(0,-1).forEach((start,i)=>{
    const end=marks[i+1];
    const cross=.45/a.scene.duration;
    const alpha=smooth((a.progress-start+cross)/cross)*(1-smooth((a.progress-end+cross)/cross));
    if(alpha>.002){a.ctx.save();a.ctx.globalAlpha*=alpha;draw(i,seg(a.progress,start,end),alpha);a.ctx.restore();}
  });
}
function atmosphere(a,color=C.cyan) {
  const {ctx,stage:s,globalTime:t}=a;
  dust(ctx,s,t,{count:100,alpha:.25,color:C.ice,camX:Math.sin(t*.08)*12});
  light(ctx,s.cx,s.cy,s.w*.65,color,.065);
  aurora(ctx,s,t,.28,s.h*.83,s.h*.12);
}
function globe(a,lon,lat,R=.41,alpha=1,highlight=null) {
  const {ctx,stage:s,isVertical:V,globalTime:t}=a,m=Math.min(s.w,s.h);
  const G=makeGlobe(lon,lat,m*R,s.cx,s.h*(V?.54:.57));
  drawGlobe(ctx,G,{alpha,step:1.1,dot:2.7,dotAlpha:1.15,hl:highlight,hlColor:C.amber,grat:true,atmo:.7});
  return G;
}
function focal(a,P,loc,col=C.amber,alpha=1) {
 const q=P.project(...loc);if(q.vis!==false)beacon(a.ctx,q.x,q.y,{color:col,r:5,alpha,time:a.globalTime});return q;
}
function route(a,G,A,B,col=C.cyan,alpha=1,height=.13) {
 const pts=projectAll(G,arcPts(A,B,64,height));conduit(a.ctx,pts,a.globalTime,col,alpha);return pts;
}
function quebec(a,alpha=1) {
 const s=a.stage,m=Math.min(s.w,s.h),P=makeFlat(-69,54,m*.026,s.cx,s.h*.54);
 drawQuebec(a.ctx,P,{alpha,color:C.cyan,fill:.055,line:2.1,draw:eOutCubic(seg(a.progress,0,.16))});
 return P;
}
function mesh(a,x,y,r,color=C.cyan,mode='mesh',failure=0,alpha=1) {
 const {ctx,globalTime:t}=a;
 const nodes=Array.from({length:13},(_,i)=>{const ang=i*2.39996,rr=r*Math.sqrt(i/12);return{x:x+Math.cos(ang+t*.025)*rr,y:y+Math.sin(ang+t*.025)*rr*.72,vis:true};});
 for(let i=1;i<nodes.length;i++){
   const targets=mode==='mesh'?[Math.max(0,i-1),Math.max(0,i-3)]:[0];
   for(const j of targets){const affected=mode==='mesh'?(i===5||j===5):true;conduit(ctx,bezier(nodes[j],nodes[i],.08),t+i,color,alpha*(affected?1-failure*.88:1),affected?failure:0,1.5);}
 }
 nodes.forEach((n,i)=>beacon(ctx,n.x,n.y,{r:i?3:8,color:failure>.3&&(mode!=='mesh'||i===5)?C.amber:color,alpha:alpha*(i===5?1-failure*.7:1),time:t+i,pulse:i===0}));
 return nodes;
}
function factory(ctx,x,y,s,col,alpha=1) {iconGlyph(ctx,'factory',x,y,s,col,alpha);}
function scaleBalance(a,u,color=C.amber) {
 const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h),x=s.cx,y=s.h*.52,R=m*.29;
 const theta=Math.sin(t*.5)*.025+u*.12;
 line(ctx,[[x,y-R*.1],[x,y+R*.85],[x-R*.28,y+R*.94],[x+R*.28,y+R*.94]],C.slate,2,.65);
 ctx.save();ctx.translate(x,y);ctx.rotate(theta);
 line(ctx,[[-R,0],[R,0]],C.white,3,.85);
 [-1,1].forEach((side)=>{
   const X=side*R;
   line(ctx,[[X,0],[X-R*.24,R*.52],[X+R*.24,R*.52],[X,0]],side<0?color:C.cyan,2,.8);
   ring(ctx,X,R*.50,R*.24,{color:side<0?color:C.cyan,a0:0,sweep:Math.PI,width:3,glow:12});
   for(let i=0;i<7;i++)light(ctx,X+(i-3)*R*.045,R*.52,R*.035,side<0?color:C.cyan,.8);
 });ctx.restore();
}
function shield(a,x,y,r,alpha=1) {
 const pts=Array.from({length:72},(_,i)=>{const v=i/71*Math.PI;return{x:x+Math.cos(v)*r,y:y-Math.sin(v)*r*.72,vis:true};});
 trail(a.ctx,pts,1,{color:C.cyan,width:3,alpha,head:false});
 for(let i=1;i<7;i++)line(a.ctx,[[x-r+i*r/4,y],[x-r+i*r/4,y-Math.sin(Math.acos((i-4)/4))*r*.72]],C.cyan,1,alpha*.22);
 light(a.ctx,x,y-r*.3,r,C.cyan,alpha*.14);
}
function jet(ctx,x,y,s,angle,color,alpha=1) {
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;
 ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=12;
 ctx.beginPath();ctx.moveTo(s,0);ctx.lineTo(-s*.65,-s*.2);ctx.lineTo(-s*.85,-s*.7);ctx.lineTo(-s*.95,-s*.7);ctx.lineTo(-s*.8,0);ctx.lineTo(-s*.95,s*.7);ctx.lineTo(-s*.85,s*.7);ctx.lineTo(-s*.65,s*.2);ctx.closePath();ctx.fill();ctx.restore();
}
function airTraffic(a,G,freeze=0,col=C.cyan,alpha=1) {
 const r=rng(17),{ctx,globalTime:t}=a;
 for(let i=0;i<60;i++){
  const A=[-124+r()*50,27+r()*23],B=[-123+r()*50,26+r()*24];
  const pts=projectAll(G,arcPts(A,B,40,.025));
  trail(ctx,pts,1,{color:freeze>.7?C.amber:col,width:.8,alpha:alpha*.12,head:false,dash:freeze>.7?[3,6]:null});
  const u=lerp((t*.035+i*.137)%1,.25+(i*.137)% .5,freeze),n=Math.floor(u*39),q=pts[n],q2=pts[n+1];
  if(q.vis&&q2.vis)jet(ctx,q.x,q.y,4.5,Math.atan2(q2.y-q.y,q2.x-q.x),freeze>.7?C.amber:col,alpha*.8);
 }
}

// 01 · Identity → three waves → Québec. The camera passes through the rings.
function novIntro(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,["Aujourd'hui","Ensuite","Enfin"]),(i,u)=>{
  if(i===0){const R=m*.16;emblem(ctx,s.cx,s.cy-R*.25,R,{time:t,star:eOutCubic(u*5),ringT:seg(u,.04,.3),needle:seg(u,.12,.42)});word(a,'FRANC NORD',seg(u,.18,.32),C.white,.76,.105,seg(u,.15,.38));}
  else {const titles=['','COP31','DONBASS','RÉSEAUX FRAGILES'];const col=i===1?C.amber:C.cyan;
    const G=globe(a,lerp(25,i===3?-85:45,eInOut(u)),30+u*6,.34);
    for(let j=0;j<3;j++){const ph=(u*.8+j/3)%1;ring(ctx,s.cx,s.h*.54,m*(.18+ph*.8),{color:j===0?C.amber:C.cyan,width:1.5,alpha:(1-ph)*.45});}
    if(i===1)focal(a,G,GEO.antalya,C.amber);if(i===2){focal(a,G,GEO.donbass);route(a,G,GEO.moscow,GEO.beijing);}
    if(i===3){airTraffic(a,G,smooth(seg(u,.2,.65)));const P=makeFlat(-69,54,m*.014,s.cx,s.h*.56);drawQuebec(ctx,P,{alpha:smooth(seg(u,.55,.9)),fill:.1});}
    word(a,titles[i],1,col,.23,.105,seg(u,0,.13));
  }
 });});}
// 02 · Antalya's financial nucleus becomes an AI lattice, then a Sahel heat front.
function novClimate(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a,C.amber);acts(a,beats(a,['des milliards','En parallèle','Au Tchad']),(i,u)=>{
  if(i===0||i===3){const G=globe(a,i===0?30+u*3:18,i===0?37:17,.44,1,i===3?(lo,la)=>Math.exp(-(((la-14)/5)**2))*(lo>-15&&lo<35?1:0):null);
   focal(a,G,i===0?GEO.antalya:GEO.chad,C.amber);word(a,i===0?'ANTALYA':'SÉCHERESSE',1,i===0?C.white:C.amber,.24,.1,seg(u,0,.12));
   if(i===3)shockwave(ctx,s.cx,s.h*.56,m*.38,t,{color:C.amber,alpha:.3,period:6});
  }else if(i===1){const x=s.cx,y=s.h*.55;for(let j=0;j<18;j++){const ang=j*TAU/18;const A={x:x+Math.cos(ang)*m*.42,y:y+Math.sin(ang)*m*.3},B={x,y};conduit(ctx,bezier(A,B,.15),t+j*.4,C.amber,.7);}
   dotSphere(ctx,x,y,m*.12,t,{color:C.amber,n:400});word(a,'QUI PAIE ?',1,C.white,.24,.11,seg(u,0,.15));
  }else{for(let j=0;j<7;j++){const ang=j*TAU/7;const x=s.cx+Math.cos(ang+t*.04)*m*.25,y=s.h*.56+Math.sin(ang+t*.04)*m*.2;isoCube(ctx,x,y,m*.045,{color:C.cyan,time:t});conduit(ctx,bezier({x,y},{x:s.cx,y:s.h*.56},.1),t,C.amber,.7);}
   glyphBolt(ctx,s.cx,s.h*.56,m*.10,t,1);word(a,"L'EMPREINTE DE L'IA",1,C.white,.24,.09,seg(u,0,.16));}
 });});}
// 03 · Two hemispheres physically pull apart; energy load deforms their equilibrium.
function novFinance(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a,C.amber);acts(a,beats(a,['Les pays en développement','De leur côté',"S'ajoute"]),(i,u)=>{
  const G=globe(a,20+Math.sin(t*.04)*12,15,.36,1,(lo,la)=>i===1&&la<20?.7:i===2&&la>30?.5:0);
  const Y=s.h*.55;line(ctx,[[s.cx-m*.4,Y],[s.cx+m*.4,Y]],C.slate,1,.35);
  if(i===0)word(a,'LA FACTURE CLIMATIQUE',1,C.white,.24,.08,seg(u,0,.16));
  if(i===1){for(let k=0;k<9;k++){const x=s.cx+(k-4)*m*.055;conduit(ctx,bezier({x,y:Y+m*.24},{x:x+m*.05,y:Y-m*.15},.15),t+k,C.amber,.7);}word(a,'ADAPTER. FINANCER.',1,C.amber,.24,.09,seg(u,0,.16));}
  if(i===2){ring(ctx,s.cx,Y-m*.1,m*.23,{color:C.amber,sweep:TAU*(.65+.1*Math.sin(t*.3)),width:5,alpha:.8});word(a,'BUDGETS SOUS PRESSION',1,C.white,.24,.08,seg(u,0,.16));}
  if(i===3){for(let k=0;k<5;k++)isoCube(ctx,s.cx+(k-2)*m*.095,s.h*.65+Math.abs(k-2)*m*.025,m*.042,{time:t,color:C.cyan});
   const pts=Array.from({length:60},(_,j)=>({x:s.cx-m*.3+j*m*.01,y:s.h*.67-m*.3*(j/59)**2,vis:true}));trail(ctx,pts,eOutCubic(u*2),{color:C.amber,width:3});word(a,'LA DEMANDE ACCÉLÈRE',1,C.amber,.24,.08,seg(u,0,.16));}
 });});}
// 04 · Justice and competitiveness are opposing torques, not two text panels.
function novJustice(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,["D'un côté","De l'autre côté"]),(i,u)=>{
  scaleBalance(a,i===1?-1:i===2?1:Math.sin(t*.4));
  if(i===0)word(a,'DEUX LOGIQUES',1,C.white,.24,.10,seg(u,0,.18));
  if(i===1){word(a,'JUSTICE CLIMATIQUE',1,C.amber,.24,.09,seg(u,0,.15));for(let k=0;k<8;k++)conduit(ctx,bezier({x:s.cx-m*.29,y:s.h*.5},{x:s.cx+m*.2,y:s.h*.75+k*m*.01},.2),t+k,C.amber,.65);}
  if(i===2){word(a,'COMPÉTITIVITÉ',1,C.cyan,.24,.10,seg(u,0,.15));factory(ctx,s.cx+m*.29,s.h*.64,m*.09,C.cyan);for(let k=0;k<3;k++)ring(ctx,s.cx+m*.29,s.h*.64,m*(.13+k*.025),{color:C.cyan,alpha:.25,a0:t*.1+k,sweep:Math.PI*.75});}
 });});}
// 05 · Atlantic ripple → insurance roof → Québec hydro geometry.
function novClimateQC(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,["D'abord sur votre budget","Ensuite sur notre économie"]),(i,u)=>{
  if(i===0){const G=globe(a,lerp(20,-65,eInOut(u)),lerp(38,49,u),.43);route(a,G,GEO.antalya,GEO.montreal,C.amber);focal(a,G,GEO.montreal);word(a,"JUSQU'ICI",1,C.white,.23,.12,seg(u,0,.18));}
  if(i===1){quebec(a,.35);iconGlyph(ctx,'house',s.cx,s.h*.54,m*.20,C.ice,1);for(let k=0;k<4;k++){const y=s.h*.56-m*(.07+k*.065)+Math.sin(t+k)*m*.01;line(ctx,[[s.cx-m*.35,y],[s.cx-m*.13,y-m*.035],[s.cx+m*.3,y-m*.035]],C.amber,2,.6);}
   word(a,'ASSURANCES ↑',1,C.amber,.23,.10,seg(u,0,.18));}
  if(i===2){const P=quebec(a,.65);focal(a,P,PLACES.manic5);focal(a,P,PLACES.montreal,C.cyan);conduit(ctx,bezier(P.project(...PLACES.manic5),P.project(...PLACES.montreal),.35),t,C.cyan,.9);
   manic5(ctx,s.cx,s.h*.76,m*.56,m*.16,{time:t,draw:eOutCubic(u*3),litArches:[4,5,6,7,8],fill:.4});word(a,'UN ATOUT HYDROÉLECTRIQUE',1,C.white,.23,.08,seg(u,0,.16));}
 });});}
// 06 · Diplomatic triangle → Donbass boundary → Beijing convergence.
function novDonbass(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,['cède la région du Donbass','Au même moment']),(i,u)=>{
  if(i===1){const G=globe(a,36,49,.46,1,(lo,la)=>lo>37&&lo<40&&la>47&&la<50?.9:0);
   const q=focal(a,G,GEO.donbass,C.amber);ring(ctx,q.x,q.y,m*.095,{color:C.amber,width:2,dash:[5,8],a0:t*.06});shield(a,q.x-m*.14,q.y+m*.12,m*.17,.8);word(a,'DONBASS ↔ OTAN',1,C.white,.24,.10,seg(u,0,.14));
  }else{const G=globe(a,lerp(35,100,i===2?eInOut(u):.1),48,.4);
   const locs=[GEO.washington,GEO.moscow,GEO.beijing];locs.forEach((q,k)=>{focal(a,G,q,k===1?C.amber:C.cyan);route(a,G,q,locs[(k+1)%3],k===1?C.amber:C.cyan,.75);});
   word(a,i===0?'LA TABLE DES PUISSANCES':'CAP SUR PÉKIN',1,C.white,.24,.08,seg(u,0,.14));
   if(i===2){const q=G.project(...GEO.beijing);shockwave(ctx,q.x,q.y,m*.22,t,{color:C.amber,alpha:.3,period:5});}
  }
 });});}
// 07 · Layers of frontiers → three massive gravitational fields → nuclear orbit.
function novPower(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,["Aujourd'hui","En parallèle"]),(i,u)=>{
  if(i===0){for(let k=0;k<7;k++){const pts=Array.from({length:80},(_,j)=>({x:s.cx-m*.42+j*m*.84/79,y:s.h*.54+Math.sin(j*.12+k*.7)*m*.06+(k-3)*m*.045,vis:true}));trail(ctx,pts,eOutCubic(u*2),{color:k===3?C.amber:C.ice,alpha:k===3?.9:.18,width:k===3?3:1,dash:k===3?null:[4,9]});}word(a,'FRONTIÈRES SOUS TENSION',1,C.white,.24,.08,seg(u,0,.14));}
  else{const centers=Array.from({length:3},(_,j)=>({x:s.cx+Math.cos(j*TAU/3-Math.PI/2+t*.035)*m*.26,y:s.h*.56+Math.sin(j*TAU/3-Math.PI/2+t*.035)*m*.23}));
   centers.forEach((q,j)=>{dotSphere(ctx,q.x,q.y,m*(j===0?.10:.085),t+j,{color:j===1?C.amber:C.cyan,n:350});conduit(ctx,bezier(q,centers[(j+1)%3],.15),t,C.slate,.5);});
   if(i===2){for(let j=0;j<3;j++){ctx.save();ctx.translate(s.cx,s.h*.56);ctx.rotate(j*Math.PI/3+t*.06);ctx.scale(1,.34);ring(ctx,0,0,m*.29,{color:C.amber,alpha:.55,width:2});ctx.restore();}beacon(ctx,s.cx,s.h*.56,{time:t,r:8,color:C.white});}
   word(a,i===1?'LE RAPPORT DE FORCE':'ÉQUILIBRE NUCLÉAIRE',1,i===2?C.amber:C.white,.24,.08,seg(u,0,.14));}
 });});}
// 08 · Protective dome versus a fault propagating through territorial lines.
function novCompromise(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,['Les partisans',"À l'inverse"]),(i,u)=>{
  const y=s.h*.59;
  for(let j=0;j<19;j++){const x=s.cx+(j-9)*m*.035;const shift=i===2?smooth(seg(u,j*.023,j*.023+.18))*m*.07*(j%2?1:-1):0;
   line(ctx,[[x,y-m*.08+shift],[x,y+m*.14+shift]],i===2?C.amber:C.cyan,1.4,.65);}
  if(i===0){ring(ctx,s.cx,y,m*.24,{color:C.cyan,alpha:.55,sweep:TAU*eOutCubic(u*2)});word(a,'PAIX CONTRE TERRITOIRE ?',1,C.white,.24,.075,seg(u,0,.15));}
  if(i===1){shield(a,s.cx,y+m*.15,m*.34);word(a,'ARRÊTER LES COMBATS',1,C.cyan,.24,.085,seg(u,0,.15));}
  if(i===2){const pts=Array.from({length:40},(_,j)=>({x:s.cx+Math.sin(j*1.8)*m*.018,y:y-m*.24+j*m*.48/39,vis:true}));trail(ctx,pts,eOutCubic(u*2),{color:C.amber,width:3});word(a,'QUEL PRÉCÉDENT ?',1,C.amber,.24,.09,seg(u,0,.15));}
 });});}
// 09 · Polar camera flight ends on Montréal's aerospace and public budgets.
function novArctic(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,['Cela touche directement','Sur le plan humain']),(i,u)=>{
  if(i===0){const G=globe(a,lerp(35,-70,eInOut(u)),72,.43);route(a,G,GEO.moscow,[-75,74],C.cyan);route(a,G,[-75,74],GEO.montreal,C.amber);focal(a,G,[-75,74],C.cyan);word(a,'REGARD VERS L’ARCTIQUE',1,C.white,.23,.075,seg(u,0,.14));}
  else{const P=quebec(a,.8),q=focal(a,P,GEO.montreal,C.cyan);if(i===1){for(let j=0;j<3;j++)jet(ctx,q.x+m*(.05+j*.055),q.y-m*(.07+j*.09),m*.018,-Math.PI/3,C.ice,.8);route(a,{project:(...v)=>P.project(...v)},GEO.montreal,[-75,64],C.cyan,.5,0);word(a,'MONTRÉAL · AÉROSPATIALE',1,C.white,.23,.08,seg(u,0,.14));}
   else{shockwave(ctx,q.x,q.y,m*.3,t,{color:C.amber,alpha:.35,period:6});word(a,'DES RETOMBÉES ICI',1,C.amber,.23,.08,seg(u,0,.14));}}
 });});}
// 10 · Sixty flight paths arrest; the cloud loses its nodes in a timed cascade.
function novOutage(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,["D'abord",'cinquante milliards','Presque au même moment']),(i,u)=>{
  if(i<2){const G=globe(a,-96,39,.45);airTraffic(a,G,i===0?0:smooth(seg(u,.08,.52)),C.cyan);word(a,i===0?'DOUBLE PANNE':'DÉCOLLAGES SUSPENDUS',1,i===0?C.white:C.amber,.23,.085,seg(u,0,.14));}
  if(i===2){ring(ctx,s.cx,s.h*.55,m*.29,{color:C.amber,width:1.5,sweep:TAU*eOutCubic(u*2)});word(a,'50 G$',1,C.amber,.57,.24,seg(u,0,.15));}
  if(i===3){for(let j=0;j<9;j++){const x=s.cx+(j%3-1)*m*.18,y=s.h*.48+Math.floor(j/3)*m*.12;const dead=u>.1+j*.043;isoCube(ctx,x,y,m*.046,{color:C.cyan,time:t,dead,alpha:dead?.4:1});}
   word(a,'24 H',1,C.amber,.25,.19,seg(u,0,.12));
   if(u>.6)word(a,'CLOUD À L’ARRÊT',smooth(seg(u,.6,.7)),C.white,.83,.065,seg(u,.6,.75));}
 });});}
// 11 · Air corridors become external cloud dependencies; one hub fails.
function novOutageQC(a){const {ctx,stage:s,globalTime:t}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,['Nos corridors aériens','Et côté numérique','Une seule défaillance']),(i,u)=>{
  if(i<2){const G=globe(a,-76,44,.45);[PLACES.newYork,[-71,42.36],PLACES.florida].forEach(q=>{const pts=projectAll(G,arcPts(GEO.montreal,q,56,.06));conduit(ctx,pts,t,C.amber,.7,i===1?smooth(u):0);});focal(a,G,GEO.montreal,C.cyan);word(a,i===0?'L’EFFET DOMINO':'RETARDS EN CHAÎNE',1,C.amber,.23,.085,seg(u,0,.15));}
  else{quebec(a,.5);mesh(a,s.cx,s.h*.55,m*.31,C.cyan,'star',i===3?smooth(seg(u,.1,.5)):0);word(a,i===2?'NOS SERVICES CONNECTÉS':'UN SEUL POINT FAIBLE',1,i===3?C.amber:C.white,.23,.08,seg(u,0,.14));}
 });});}
// 12 · Local mesh reroutes around failure; integrated trunk concentrates throughput.
function novResilience(a){const {ctx,stage:s,globalTime:t,isVertical:V}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,['Pour les partisans',"À l'inverse"]),(i,u)=>{
  if(i===0){mesh(a,s.cx,s.h*.56,m*.31,C.cyan,'star',smooth(seg(u,.2,.7)));word(a,'COMMENT RÉAGIR ?',1,C.white,.23,.10,seg(u,0,.15));}
  if(i===1){mesh(a,s.cx,s.h*.56,m*.33,C.cyan,'mesh',smooth(seg(u,.3,.6)));word(a,'AUTONOMIE LOCALE',1,C.cyan,.23,.09,seg(u,0,.14));
   ring(ctx,s.cx,s.h*.56,m*.37,{color:C.cyan,width:1,alpha:.25,sweep:TAU*eOutCubic(u*2)});}
  if(i===2){mesh(a,s.cx,s.h*.56,m*.33,C.amber,'star');for(let j=0;j<4;j++)conduit(ctx,bezier({x:s.cx-m*.4,y:s.h*.56+(j-1.5)*m*.025},{x:s.cx+m*.4,y:s.h*.56+(j-1.5)*m*.025},0),t*2+j,C.amber,.65,0,2.5);word(a,'RÉSEAUX INTÉGRÉS',1,C.amber,.23,.09,seg(u,0,.14));}
 });});}
// 13 · Two trajectories around the same compass. One phrase at a time.
function novFinale(a){const {ctx,stage:s,globalTime:t,isVertical:V}=a,m=Math.min(s.w,s.h);
 frame(a,()=>{atmosphere(a);acts(a,beats(a,['Option A','Ou Option B','Écrivez','partagez','retrouve demain']),(i,u)=>{
  if(i<4){const ang=i===1?-.35:i===2?.35:Math.sin(t*.5)*.04;
   emblem(ctx,s.cx,s.h*.55,m*.16,{time:t,swing:ang});
   if(i===1||i===2){const col=i===1?C.cyan:C.amber;line(ctx,[[0,s.h],[s.w,0]],col,2,.5);light(ctx,s.w*(i===1?.3:.7),s.h*.55,m*.7,col,.18);}
   word(a,['QUELLE DIRECTION ?','A · AUTONOMIE','B · INTÉGRATION','A OU B ?'][i],1,i===1?C.cyan:i===2?C.amber:C.white,.25,.095,seg(u,0,.12));
  }else if(i===4){emblem(ctx,s.cx,s.h*.52,m*.15,{time:t});word(a,'PARTAGEZ FRANC NORD',1,C.white,.77,.085,seg(u,0,.14));}
  else{emblem(ctx,s.cx,s.h*.47,m*.17,{time:t,star:seg(u,0,.2),ringT:seg(u,0,.3)});word(a,'FRANC NORD',1,C.white,.73,.11,seg(u,.05,.3));word(a,'À DEMAIN',1,C.amber,.80,.035,seg(u,.2,.4));}
 });});}
/* ASTRA · Physical editorial stage. Perspective camera, extruded geometry,
   continuously drawn mechanisms; all timestamps come from the supplied voice. */
function stage3(a,u,opts={}) {
 const {w,h}=a.stage,m=Math.min(w,h),V=a.isVertical;
 const yaw=(opts.yaw??-.35)+Math.sin(u*Math.PI)*.13,tilt=opts.tilt??.64;
 const zoom=(opts.zoom??1)*.72*(1+.12*eInOut(u));
 const cx=w*(V?.5:.59)+(opts.pan??0)*m*(u-.5),cy=h*(V?.64:.66);
 return (x,y,z=0)=>{const X=x*Math.cos(yaw)-y*Math.sin(yaw),Y=x*Math.sin(yaw)+y*Math.cos(yaw),d=3.8+Y*Math.sin(tilt)-z*Math.cos(tilt),k=m*zoom*3.8/d;return{x:cx+X*k,y:cy+(Y*Math.cos(tilt)-z*Math.sin(tilt))*k,vis:true,k};};
}
function face(ctx,pts,color,fill=.3,width=1.5){ctx.save();ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();const ys=pts.map(p=>p.y),xs=pts.map(p=>p.x);const g=ctx.createLinearGradient(Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)+1);g.addColorStop(0,rgba(color,Math.min(1,fill*1.5)));g.addColorStop(.45,rgba(color,fill));g.addColorStop(1,rgba(color,fill*.35));ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=rgba(color,.8);ctx.lineWidth=width;ctx.stroke();ctx.restore();}
function solid(a,P,x,y,z,wx,wy,h,col=C.cyan){const c=a.ctx;const q=[[x-wx/2,y-wy/2],[x+wx/2,y-wy/2],[x+wx/2,y+wy/2],[x-wx/2,y+wy/2]];const b=q.map(v=>P(...v,z)),t=q.map(v=>P(...v,z+h));face(c,[b[1],b[2],t[2],t[1]],col,.18);face(c,[b[2],b[3],t[3],t[2]],col,.32);face(c,t,col,.56);return P(x,y,z+h);}
function ribbon(a,P,pts,col,width=.014,reveal=1){const n=Math.max(2,Math.ceil(pts.length*clamp(reveal)));for(let i=1;i<n;i++){let A=pts[i-1],B=pts[i];const dx=B[0]-A[0],dy=B[1]-A[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*width,ny=dx/l*width;face(a.ctx,[P(A[0]+nx,A[1]+ny,A[2]||0),P(B[0]+nx,B[1]+ny,B[2]||0),P(B[0]-nx,B[1]-ny,B[2]||0),P(A[0]-nx,A[1]-ny,A[2]||0)],col,.55,.4);}if(n<pts.length){const q=P(...pts[n-1]);light(a.ctx,q.x,q.y,24,col,.8);}}
function arrow3(a,P,A,B,col=C.amber,reveal=1){const b=A.map((v,i)=>lerp(v,B[i],clamp(reveal)));const pts=Array.from({length:30},(_,i)=>A.map((v,j)=>lerp(v,b[j],i/29)));ribbon(a,P,pts,col,.009);const d=Math.atan2(b[1]-A[1],b[0]-A[0]),s=.038;face(a.ctx,[P(...b),P(b[0]-Math.cos(d)*s+Math.sin(d)*s*.55,b[1]-Math.sin(d)*s-Math.cos(d)*s*.55,b[2]),P(b[0]-Math.cos(d)*s-Math.sin(d)*s*.55,b[1]-Math.sin(d)*s+Math.cos(d)*s*.55,b[2])],col,.9);}
function ground(a,P,u,col=C.cyan){const c=a.ctx;for(let j=-10;j<=10;j++){const v=j*.075;line(c,[P(-.8,v,-.03),P(.8,v,-.03)],col,1,.09);line(c,[P(v,-.8,-.03),P(v,.8,-.03)],col,1,.09);}for(let k=0;k<3;k++){const r=.18+((u*.2+k/3)%1)*.65;const pts=Array.from({length:90},(_,i)=>P(Math.cos(i/89*TAU)*r,Math.sin(i/89*TAU)*r,-.02));line(c,pts,col,1,.12);}}
function terrain(a,P,u,hot=false){const c=a.ctx,N=25,step=1.28/N;const height=(x,y)=>.025+Math.pow(Math.abs(Math.sin(x*8.1+Math.cos(y*7))*Math.cos(y*6.5-x*2)),2)*.12;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-.64+i*step,y=-.55+j*step;const h=height(x,y);const col=hot&&y<.12&&y>-.18?C.amber:C.cyan;face(c,[P(x,y,h),P(x+step,y,height(x+step,y)),P(x+step,y+step,height(x+step,y+step)),P(x,y+step,height(x,y+step))],col,.08+h*.9,.5);}
}
function titleA(a,text,kicker,col,u){const {ctx,stage:s,isVertical:V}=a,m=Math.min(s.w,s.h);const x=V?s.w*.09:s.w*.07,y=V?s.h*.20:s.h*.26;
 const words=text.split('|');words.forEach((v,i)=>kinetic(ctx,v,x,y+i*m*.10,{align:'left',size:m*(V?.079:.098),weight:900,maxW:s.w*(V?.82:.65),color:i?col:C.white,t:clamp(u*6-i*.12),alpha:1}));
 // Three-word editorial label, no persistent data panels.
 if(kicker)mono(ctx,kicker,x,y-m*.12,{align:'left',size:m*.014,spacing:2,color:col,t:clamp(u*8),cursor:false});
 line(ctx,[[x,y+words.length*m*.10-m*.065],[x+m*.13*eOutCubic(u*5),y+words.length*m*.10-m*.065]],col,3,.9);
}
function ambianceA(a,u,col){const {ctx,stage:s,globalTime:t}=a;dust(ctx,s,t,{count:160,alpha:.35,camX:u*100,seed:17});light(ctx,s.w*.7,s.h*.56,Math.min(s.w,s.h)*.75,col,.15);
 // Broad moving atmospheric shafts and a low horizon, not a flat gradient.
 ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<5;i++){const x=s.w*(.1+i*.22)+Math.sin(t*.06+i)*70;const g=ctx.createLinearGradient(x,0,x+s.w*.25,s.h);g.addColorStop(0,rgba(col,0));g.addColorStop(.5,rgba(col,.017));g.addColorStop(1,rgba(col,0));ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+s.w*.08,0);ctx.lineTo(x+s.w*.5,s.h);ctx.lineTo(x+s.w*.35,s.h);ctx.fill();}ctx.restore();}
function earthA(a,u,kind){const {ctx,stage:s,isVertical:V,globalTime:t}=a,m=Math.min(s.w,s.h);const spec={world:[15,25],antalya:[30,37],heat:[18,15],atlantic:[-25,43],ukraine:[37,49],polar:[-65,76],air:[-96,39]}[kind]||[15,25];
 const radius=m*(V?.55:.68)*(1+.17*eInOut(u));const G=makeGlobe(spec[0]+lerp(-12,8,u),spec[1],radius,s.w*(V?.52:.67),s.h*(V?.68:.74));
 drawGlobe(ctx,G,{step:.75,dot:2.5,alpha:1,atmo:1.5,hl:kind==='heat'?(lo,la)=>la>8&&la<21&&lo>-15&&lo<35?1:0:null,hlColor:C.amber});
 // Solid illuminated shorelines add readable land mass and an atmospheric limb.
 ctx.save();ctx.lineWidth=1.1;ctx.strokeStyle=rgba(C.ice,.34);for(const poly of LAND){ctx.beginPath();let pen=false;for(let j=0;j<poly.length;j+=2){const q=G.project(poly[j],poly[j+1],.001);if(q.z>0){pen?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);pen=true;}else pen=false;}ctx.stroke();}ctx.restore();
 const locations=kind==='antalya'?[GEO.antalya]:kind==='ukraine'?[GEO.kyiv,GEO.donbass]:kind==='polar'?[GEO.moscow,[-75,74],GEO.montreal]:kind==='atlantic'?[GEO.antalya,GEO.montreal]:[GEO.washington,GEO.moscow,GEO.beijing];
 locations.forEach((q,j)=>{const p=G.project(...q);if(p.z>0){beacon(ctx,p.x,p.y,{time:t,r:7,color:C.amber});if(j>0)route(a,G,locations[j-1],q,C.amber,1,.10);}});
 if(kind==='air')airTraffic(a,G,smooth(seg(u,.3,.55)),C.cyan,1);
 if(kind==='heat'){const q=G.project(18,15);shockwave(ctx,q.x,q.y,m*.4,t,{color:C.amber,alpha:.6,period:5});}
 flare(ctx,G.cx-radius*.62,G.cy-radius*.73,m*.14,C.cyan,.65);return G;}
function financeA(a,u,mode){const P=stage3(a,u,{yaw:-.4,zoom:1.25,pan:.12});ground(a,P,u);
 const t=a.globalTime;for(let j=0;j<7;j++){const x=(j-3)*.14,h=(mode==='budget'?.08+.045*(6-j):.09+j*.035)*eOutCubic(seg(u,j*.025,.4+j*.025));solid(a,P,x,.20,0,.08,.16,h,j<3?C.amber:C.cyan);}
 if(mode==='flow'){for(let j=0;j<7;j++){const pts=Array.from({length:45},(_,k)=>{const f=k/44;return[(j-3)*.14*(1-f),.15-f*.67,.11+Math.sin(f*Math.PI)*.2];});ribbon(a,P,pts,j<3?C.amber:C.cyan,.012,eOutCubic(u*3));for(let k=0;k<3;k++){const q=P(...pts[Math.floor(((t*.2+k/3)%1)*44)]);light(a.ctx,q.x,q.y,13,C.gold,.8);}}solid(a,P,0,-.54,0,.22,.22,.18,C.amber);}
 else{const pts=Array.from({length:65},(_,k)=>{const f=k/64;return[-.49+f*.98,.15,.1+f*f*.40];});ribbon(a,P,pts,C.amber,.012,eOutCubic(u*2));arrow3(a,P,[.3,.15,.35],[.5,.15,.52],C.amber,eOutCubic(u*2));}
}
function serversA(a,u,dead=false){const P=stage3(a,u,{yaw:lerp(-.65,.1,u),zoom:1.4,pan:.12}),t=a.globalTime;ground(a,P,u);for(let j=0;j<4;j++)for(let i=0;i<5;i++){const x=(i-2)*.15,y=(j-1.5)*.16,loss=dead&&u>.12+(j*5+i)*.025,col=loss?'#334155':C.cyan,h=.16+.1*Math.sin(i*.8+j*.7)**2;solid(a,P,x,y,0,.09,.10,h,col);for(let k=0;k<5;k++){const A=P(x-.035,y+.052,.025+k*.028),B=P(x+.035,y+.052,.025+k*.028);line(a.ctx,[A,B],loss?'#475569':C.ice,2,loss?.3:.6+.3*Math.sin(t*3+i+k));}if(!loss&&j<3)arrow3(a,P,[x,y+.07,.015],[x,y+.14,.015],C.amber,1);}
 if(dead){const q=P(0,0,.1);shockwave(a.ctx,q.x,q.y,Math.min(a.stage.w,a.stage.h)*.45,u*5,{color:C.amber,alpha:.35,period:6});}}
function balanceA(a,u,side){const P=stage3(a,u,{yaw:-.22,zoom:1.25});ground(a,P,u);solid(a,P,0,0,0,.05,.05,.40,C.slate);solid(a,P,0,0,0,.25,.18,.035,C.cyan);const angle=side*.12+Math.sin(u*4)*.025;
 for(let j=-1;j<=1;j+=2){const h=.36+j*angle;solid(a,P,j*.3,0,h,.25,.23,.025,j<0?C.amber:C.cyan);line(a.ctx,[P(0,0,.4),P(j*.3,0,.4+j*angle),P(j*.3,0,h)],C.slate,3,.8);for(let k=0;k<4;k++)solid(a,P,j*.3+(k%2-.5)*.07,(Math.floor(k/2)-.5)*.07,h+.025,.06,.06,.035*(1+k*.4),j<0?C.amber:C.cyan);}
 arrow3(a,P,[-.45,.25,.04],[.45,.25,.04],side<0?C.amber:C.cyan,eOutCubic(u*3));}
function territoryA(a,u,fracture=false){const P=stage3(a,u,{zoom:1.2,yaw:lerp(-.7,-.25,u)});ground(a,P,u);for(let j=0;j<9;j++)for(let i=0;i<12;i++){const x=(i-5.5)*.075,y=(j-4)*.075,gap=fracture?smooth(seg(u,.15+j*.025,.4+j*.025))*.10:0;solid(a,P,x+(i>5?gap:-gap),y,0,.069,.069,.04+(i>5?.03:0),i>5?C.amber:C.cyan);}
 if(fracture){const pts=Array.from({length:60},(_,i)=>[Math.sin(i*1.7)*.012,-.4+i*.8/59,.08]);ribbon(a,P,pts,C.amber,.008,eOutCubic(u*2));for(let i=0;i<4;i++)arrow3(a,P,[.08,(i-1.5)*.16,.13],[.37,(i-1.5)*.16,.13],C.amber,eOutCubic(u*2));}
 else{for(let k=0;k<8;k++){const yy=(k-3.5)*.09,pts=Array.from({length:45},(_,i)=>{const f=i/44*Math.PI;return[Math.cos(f)*.48,yy,.05+Math.sin(f)*.35];});line(a.ctx,pts.map(v=>P(...v)),C.cyan,2,.65,eOutCubic(u*2));}}
}
function networkA(a,u,mode){const P=stage3(a,u,{yaw:lerp(-.6,.12,u),zoom:1.3});ground(a,P,u);const t=a.globalTime,N=13;const nodes=Array.from({length:N},(_,j)=>j===0?[0,0]:[Math.cos(j*2.4)*(.18+Math.sqrt(j/N)*.34),Math.sin(j*2.4)*(.18+Math.sqrt(j/N)*.34)]);
 nodes.forEach((q,i)=>{const fail=mode==='fail'&&u>.3;solid(a,P,...q,0,i?.07:.17,i?.07:.17,i?.06:.22,fail&&i===0?C.amber:C.cyan);if(i){const target=mode==='mesh'?nodes[Math.max(0,i-2)]:nodes[0];const pts=Array.from({length:35},(_,k)=>{const f=k/34;return[lerp(q[0],target[0],f),lerp(q[1],target[1],f),.04+Math.sin(f*Math.PI)*.12];});ribbon(a,P,pts,fail?C.amber:C.cyan,.004,1);const pp=P(...pts[Math.floor(((t*.25+i*.11)%1)*34)]);light(a.ctx,pp.x,pp.y,10,fail?C.amber:C.white,.9);if(mode==='mesh'&&i>2)arrow3(a,P,[...q,.07],[...nodes[i-1],.07],C.amber,1);}});
}
function hydroA(a,u){const P=stage3(a,u,{yaw:-.3,zoom:1.28});ground(a,P,u);terrain(a,P,u);for(let j=0;j<12;j++)solid(a,P,(j-5.5)*.07,.08,.04,.055,.12,.22,C.cyan);
 for(let j=0;j<8;j++){const x=(j-3.5)*.09,pts=Array.from({length:35},(_,k)=>[x,.20+k*.012,.07+Math.sin(k*.12+a.globalTime)*.008]);ribbon(a,P,pts,C.cyan,.009,1);arrow3(a,P,[x,.1,.3],[x,.45,.05],C.ice,eOutCubic(u*3));}
}
function homeA(a,u){const P=stage3(a,u,{zoom:1.2,yaw:lerp(-.6,-.15,u)});ground(a,P,u);for(let j=0;j<5;j++){const x=(j-2)*.20,y=Math.abs(j-2)*.08;solid(a,P,x,y,0,.14,.14,.12,C.cyan);face(a.ctx,[P(x-.09,y-.09,.12),P(x,y-.09,.22),P(x+.09,y-.09,.12)],C.ice,.5);face(a.ctx,[P(x,y-.09,.22),P(x,y+.09,.22),P(x+.09,y+.09,.12),P(x+.09,y-.09,.12)],C.cyan,.5);arrow3(a,P,[x,y+.12,.02],[x,y+.12,.30],C.amber,eOutCubic(u*2));}}
function powerA(a,u){const P=stage3(a,u,{zoom:1.22,yaw:lerp(-.7,.2,u)});ground(a,P,u);const nodes=[[-.37,.13],[.36,.14],[0,-.4]];nodes.forEach((v,j)=>{solid(a,P,...v,0,.20,.20,.18+j*.035,j===1?C.amber:C.cyan);const q=P(...v,.27);dotSphere(a.ctx,q.x,q.y,Math.min(a.stage.w,a.stage.h)*.08,a.globalTime+j,{color:j===1?C.amber:C.cyan});arrow3(a,P,[...v,.12],[...nodes[(j+1)%3],.12],j===1?C.amber:C.cyan,eOutCubic(u*3));});}
const ASTRA_PLANS=[
 [['LE MONDE|JUSQU’ICI','FRANC NORD','brand'],['QUI PAIE|LE CLIMAT ?','01 · COP31','finance'],['LA TABLE|DES PUISSANCES','02 · DONBASS','power'],['TOUT EST|CONNECTÉ','03 · RÉSEAUX','network']],
 [['ANTALYA','COP31','antalya'],['QUI PAIE ?','FINANCEMENT','finance'],['L’EMPREINTE|DE L’IA','ÉNERGIE','server'],['L’URGENCE|AU SOL','TCHAD','heat']],
 [['LA FACTURE|CLIMATIQUE','LE MÉCANISME','budget'],['ADAPTER.|FINANCER.','SUD GLOBAL','finance'],['BUDGETS|SOUS PRESSION','ÉTATS','budget'],['LA DEMANDE|ACCÉLÈRE','INTELLIGENCE ARTIFICIELLE','server']],
 [['DEUX|LOGIQUES','COP31','balance'],['JUSTICE|CLIMATIQUE','RESPONSABILITÉ','balanceLeft'],['COMPÉTITIVITÉ','EMPLOIS','balanceRight']],
 [['JUSQU’ICI','MONDE → QUÉBEC','atlantic'],['ASSURANCES ↑','VOTRE BUDGET','home'],['L’ATOUT|HYDROÉLECTRIQUE','QUÉBEC','hydro']],
 [['LA TABLE|DES PUISSANCES','DIPLOMATIE','power'],['DONBASS|CONTRE OTAN ?','PROPOSITION','territory'],['CAP SUR|PÉKIN','SOMMET À TROIS','power']],
 [['FRONTIÈRES|SOUS TENSION','EUROPE','fracture'],['LE RAPPORT|DE FORCE','DIPLOMATIE','power'],['ÉQUILIBRE|NUCLÉAIRE','SÉCURITÉ','nuclear']],
 [['PAIX CONTRE|TERRITOIRE ?','LE DILEMME','territory'],['ARRÊTER|LES COMBATS','COMPROMIS','shield'],['QUEL|PRÉCÉDENT ?','FRONTIÈRES','fracture']],
 [['REGARD VERS|L’ARCTIQUE','CANADA','polar'],['MONTRÉAL|AÉROSPATIALE','QUÉBEC','aircraft'],['DES RETOMBÉES|ICI','ÉCONOMIE','home']],
 [['DOUBLE|PANNE','INFRASTRUCTURES','air'],['DÉCOLLAGES|SUSPENDUS','CONTRÔLE AÉRIEN','aircraft'],['50 G$','MODERNISATION','budget50'],['CLOUD|À L’ARRÊT','MICROSOFT','failure']],
 [['L’EFFET|DOMINO','QUÉBEC','network'],['RETARDS|EN CHAÎNE','CORRIDORS AÉRIENS','air'],['NOS SERVICES|CONNECTÉS','QUÉBEC','network'],['UN SEUL|POINT FAIBLE','DÉPENDANCE','fail']],
 [['COMMENT|RÉAGIR ?','INFRASTRUCTURES','fail'],['AUTONOMIE|LOCALE','RÉSILIENCE','mesh'],['RÉSEAUX|INTÉGRÉS','COÛTS','network']],
 [['QUELLE|DIRECTION ?','VOTRE CHOIX','brand'],['A · AUTONOMIE','QUÉBEC','mesh'],['B · INTÉGRATION','RÉSEAUX','network'],['A OU B ?','COMMENTAIRES','brand'],['PARTAGEZ|FRANC NORD','','brand'],['À DEMAIN','','brand']]
];
const ASTRA_CUES=[ ["Aujourd'hui","Ensuite","Enfin"],['des milliards','En parallèle','Au Tchad'],['Les pays en développement','De leur côté',"S'ajoute"],["D'un côté","De l'autre côté"],["D'abord sur votre budget","Ensuite sur notre économie"],['cède la région du Donbass','Au même moment'],["Aujourd'hui","En parallèle"],['Les partisans',"À l'inverse"],['Cela touche directement','Sur le plan humain'],["D'abord",'cinquante milliards','Presque au même moment'],['Nos corridors aériens','Et côté numérique','Une seule défaillance'],['Pour les partisans',"À l'inverse"],['Option A','Ou Option B','Écrivez','partagez','retrouve demain'] ];
function astraScene(a,index){frame(a,()=>acts(a,beats(a,ASTRA_CUES[index]),(i,u)=>{const [text,kicker,kind]=ASTRA_PLANS[index][i],col=index<5?C.amber:C.cyan;ambianceA(a,u,col);
 switch(kind){case 'world':case 'antalya':case 'heat':case 'atlantic':case 'polar':case 'air':earthA(a,u,kind);break;
 case 'finance':financeA(a,u,'flow');break;case 'budget':case 'budget50':financeA(a,u,'budget');break;
 case 'server':case 'failure':serversA(a,u,kind==='failure');break;
 case 'balance':case 'balanceLeft':case 'balanceRight':balanceA(a,u,kind==='balanceLeft'?-1:kind==='balanceRight'?1:0);break;
 case 'territory':case 'fracture':case 'shield':territoryA(a,u,kind==='fracture');break;
 case 'network':case 'mesh':case 'fail':networkA(a,u,kind);break;
 case 'hydro':hydroA(a,u);break;case 'home':homeA(a,u);break;
 case 'power':case 'nuclear':powerA(a,u);if(kind==='nuclear'){const s=a.stage;for(let k=0;k<3;k++){a.ctx.save();a.ctx.translate(s.w*(a.isVertical?.5:.59),s.h*.58);a.ctx.rotate(k*Math.PI/3+a.globalTime*.06);a.ctx.scale(1,.35);ring(a.ctx,0,0,Math.min(s.w,s.h)*.32,{color:C.amber,width:2,alpha:.6});a.ctx.restore();}}break;
 case 'aircraft':{const P=stage3(a,u,{zoom:1.35});ground(a,P,u);for(let j=0;j<7;j++){const y=(j-3)*.12;arrow3(a,P,[-.55,y,0],[.55,y,0],C.cyan,eOutCubic(u*3));const q=P(-.4+((u*.3+j*.12)%1)*.8,y,.08);jet(a.ctx,q.x,q.y,Math.min(a.stage.w,a.stage.h)*.035,-.3,C.ice,1);}break;}
 default:{const s=a.stage,m=Math.min(s.w,s.h);emblem(a.ctx,s.w*(a.isVertical?.5:.65),s.h*.59,m*.24,{time:a.globalTime,ringT:eOutCubic(u*3),swing:Math.sin(u*2)*.07});for(let j=0;j<3;j++)ring(a.ctx,s.w*(a.isVertical?.5:.65),s.h*.59,m*(.32+j*.08),{color:j%2?C.amber:C.cyan,width:1,alpha:.3,a0:u+j,sweep:Math.PI*.8});}}
 titleA(a,text,kicker,col,u);
 }));}

export const CUSTOM_SCENES = {
  'intro-sommaire': a => astraScene(a, 0),
  'd1-fait-declencheur': a => astraScene(a, 1),
  'd1-coulisses-geopolitiques': a => astraScene(a, 2),
  'd1-deux-cotes-medaille': a => astraScene(a, 3),
  'd1-impact-quebec': a => astraScene(a, 4),
  'd2-fait-declencheur': a => astraScene(a, 5),
  'd2-coulisses-geopolitiques': a => astraScene(a, 6),
  'd2-deux-cotes-medaille': a => astraScene(a, 7),
  'd2-impact-quebec': a => astraScene(a, 8),
  'd3-enjeu-mondial': a => astraScene(a, 9),
  'd3-lien-quebec': a => astraScene(a, 10),
  'd3-deux-cotes-medaille': a => astraScene(a, 11),
  'conclusion-debat-quebec': a => astraScene(a, 12)
};
