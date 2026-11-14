/**
 * FRANC NORD — Épisode #1 (2026-11-14) — 13 scènes cinématiques plein écran
 * Motion design 100 % code · Canvas 2D · Zéro musique · Zéro tableau de bord
 * Réalisation : Claude Opus 5.5
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

/** Piste d'états caméra-globe : [[progress, [lon, lat, R/m, dx/w, dy/h], easing?], ...]. */
function globeTrack(p, kf) {
  if (p <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) {
    const [p1, s1, e = eInOutQuart] = kf[i];
    const [p0, s0] = kf[i - 1];
    if (p <= p1) return globeLerp(s0, s1, p1 <= p0 ? 1 : e(seg(p, p0, p1)));
  }
  return kf[kf.length - 1][1];
}

function globeFrom(stage, st) {
  const m = Math.min(stage.w, stage.h);
  return makeGlobe(st[0], st[1], st[2] * m, stage.cx + st[3] * stage.w, stage.cy + st[4] * stage.h);
}

/** Pétrolier géant de profil, en lignes de lumière (proue vers la droite). */
function drawTanker(ctx, x, y, L, o = {}) {
  const { color = C.amber, alpha = 1, time = 0, wake = 1 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  // Ligne de flottaison et reflet
  const wl = L * 0.032;
  const g = ctx.createLinearGradient(-L * 0.9, 0, L * 0.9, 0);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(0.5, rgba(color, 0.7));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-L * 0.9, wl, L * 1.8, 1.5);
  for (let i = 1; i <= 6; i++) {
    ctx.globalAlpha = alpha * 0.16 * (1 - i / 7);
    const yy = wl + i * L * 0.012;
    const off = Math.sin(time * 1.4 + i) * L * 0.01;
    ctx.fillRect(-L * 0.45 + off, yy, L * 0.9, 1);
  }
  ctx.globalAlpha = alpha;
  // Sillage à la poupe
  if (wake > 0) {
    for (let i = 0; i < 18; i++) {
      const u = ((i / 18 + time * 0.25) % 1);
      light(ctx, -L * 0.5 - u * L * 0.35, wl + Math.sin(i * 1.7) * L * 0.006, L * 0.02 * (1 - u), C.gold, 0.5 * (1 - u) * wake);
    }
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, L * 0.0028);
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = L * 0.02;
  ctx.fillStyle = 'rgba(3,5,9,0.88)';
  // Coque
  ctx.beginPath();
  ctx.moveTo(-L * 0.5, -L * 0.05);
  ctx.lineTo(L * 0.44, -L * 0.05);
  ctx.quadraticCurveTo(L * 0.5, -L * 0.048, L * 0.5, -L * 0.02);
  ctx.quadraticCurveTo(L * 0.5, L * 0.05, L * 0.43, L * 0.056);
  ctx.lineTo(-L * 0.47, L * 0.056);
  ctx.lineTo(-L * 0.5, L * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Château arrière (passerelle + cheminée)
  ctx.beginPath();
  ctx.moveTo(-L * 0.46, -L * 0.05);
  ctx.lineTo(-L * 0.46, -L * 0.13);
  ctx.lineTo(-L * 0.37, -L * 0.13);
  ctx.lineTo(-L * 0.37, -L * 0.05);
  ctx.moveTo(-L * 0.475, -L * 0.13);
  ctx.lineTo(-L * 0.355, -L * 0.13);
  ctx.moveTo(-L * 0.44, -L * 0.13);
  ctx.lineTo(-L * 0.44, -L * 0.168);
  ctx.lineTo(-L * 0.415, -L * 0.168);
  ctx.lineTo(-L * 0.415, -L * 0.13);
  ctx.stroke();
  // Hublots de passerelle
  ctx.shadowBlur = 0;
  ctx.fillStyle = rgba(C.gold, 0.9);
  for (let i = 0; i < 6; i++) ctx.fillRect(-L * 0.455 + i * L * 0.014, -L * 0.118, L * 0.008, L * 0.008);
  // Collecteurs et tuyauteries de pont
  ctx.strokeStyle = rgba(color, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-L * 0.36, -L * 0.062);
  ctx.lineTo(L * 0.42, -L * 0.062);
  for (let i = 0; i < 9; i++) {
    const xx = -L * 0.3 + i * L * 0.085;
    ctx.moveTo(xx, -L * 0.05);
    ctx.lineTo(xx, -L * 0.075);
  }
  ctx.stroke();
  ctx.restore();
}

/** Chiffre roulant façon compteur mécanique (flou de défilement). */
function rollingDigit(ctx, x, y, size, pos, color) {
  const d = Math.floor(pos);
  const f = pos - d;
  const snap = f < 0.7 ? 0 : eInOut((f - 0.7) / 0.3);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - size * 0.42, y - size * 0.95, size * 0.84, size * 1.15);
  ctx.clip();
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  const a = 1 + (d % 9);
  const b = 1 + ((d + 1) % 9);
  ctx.globalAlpha *= 1 - snap * 0.5;
  ctx.fillText(String(a), x, y - snap * size * 1.05);
  ctx.globalAlpha = 1;
  ctx.globalAlpha *= 0.5 + snap * 0.5;
  ctx.fillText(String(b), x, y + (1 - snap) * size * 1.05);
  ctx.restore();
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 02 — d1-fait-declencheur
 * Acte I   : rotation du globe, du Québec vers la mer Rouge et Ormuz
 * Acte II  : plongée — le sillage doré se fige sous l'onde de choc → +38 %
 * Acte III : le supertanker et son surcoût par voyage
 * Acte IV  : recul — le grand détour par le cap de Bonne-Espérance
 * ════════════════════════════════════════════════════════════════════════ */

const ROUTE_GULF = [[50.2, 27.3], [52.5, 26.6], [54.8, 26.3], [56.5, 26.6], [57.4, 25.3], [58.5, 24.2], [60.5, 22.3], [63, 19.4]];
const ROUTE_CAPE = [[56.6, 26.4], [58.6, 23.4], [60.5, 18], [56, 12.5], [52, 8], [47, 2], [43.5, -3], [42.5, -10], [41.5, -17], [38, -25], [33, -33], [25, -36.5], [18.5, -36], [12, -31], [6, -22], [0, -10], [-8, 0], [-18, 10], [-22, 22], [-16, 33], [-11, 40], [-8, 46], [-4, 49], [2, 50.5], [4.4, 51.9]];
const ROUTE_SUEZ = [[56.6, 26.4], [58.6, 23.4], [60, 18], [54, 13.5], [47, 12.2], [43.4, 12.6], [41, 16], [38.6, 20], [35.8, 25], [33.6, 28.4], [32.55, 29.95], [30, 32.6], [25, 34], [18, 35], [12, 37.4], [5, 37.8], [-2, 36.2], [-5.6, 36], [-9.6, 38], [-9.6, 43.5], [-5, 47.5], [0, 50], [4.4, 51.9]];

function sceneTrigger(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, {
    ici: 'Pendant', rouge: 'mer Rouge', ormuz: 'Ormuz', assur: 'assurance', p38: 'trente-huit',
    concr: 'Concrètement', cent: 'centaines', arm: 'armateurs', detour: 'détour', sud: 'sud de l', sem: 'deux semaines'
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 90, alpha: 0.4, color: C.gold });

    // Travelling vertical : 0 = globe, 1 = +38 %, 2 = pétrolier
    const camY = track(p, [[T.p38 - 0.5 * s1, 0], [T.p38 + 0.7 * s1, 1, eInOutQuart], [T.concr - 0.3 * s1, 1], [T.concr + 0.9 * s1, 2, eInOutQuart]]);
    const step = h * 0.78;
    const africa = smooth(seg(p, T.arm - 0.6 * s1, T.arm + 0.9 * s1));

    // ── Globe : actes I et II ──
    const st = globeTrack(p, [
      [0.012, [-72, 42, 0.44, 0, 0.03]],
      [T.ici + 1.4 * s1, [47, 22, 0.5, 0, 0.03]],
      [T.assur - 0.2 * s1, [50, 22, 0.78, 0, 0.12], smooth],
      [T.assur + 2.2 * s1, [57, 24, 2.1, 0, 0.02]]
    ]);
    const G = globeFrom(stage, st);
    G.cy -= camY * step;
    const gA = 1 - smooth(seg(camY, 0.6, 1.2));
    if (gA > 0.003 && africa < 1) {
      drawGlobe(ctx, G, { alpha: gA * (1 - africa), color: C.cyan });
      // Trafic maritime vivant sur les routes (avant la crise)
      const traffic = gA * (1 - smooth(seg(p, T.assur - 0.3 * s1, T.assur + 0.5 * s1))) * smooth(seg(p, T.ici, T.rouge));
      if (traffic > 0.01) {
        for (const route of [ROUTE_SUEZ, ROUTE_GULF]) {
          const rp = projectAll(G, smoothPath(route, 8));
          for (let k = 0; k < 7; k++) {
            const u = (gt * 0.02 + k / 7) % 1;
            const q = rp[Math.floor(u * (rp.length - 1))];
            if (q.vis) light(ctx, q.x, q.y, 10, C.gold, 0.7 * traffic);
          }
        }
      }
      const ql = G.project(-71.5, 47);
      if (ql.z > 0.05) {
        beacon(ctx, ql.x, ql.y, { color: C.cyan, time: gt, alpha: (1 - seg(p, 0.03, T.ici + 0.6 * s1)) * gA });
        mono(ctx, 'ICI', ql.x, ql.y - 34, { size: 18, color: C.cyan, alpha: (1 - seg(p, 0.03, T.ici)) * gA });
      }
      const bm = G.project(...PLACES.babElMandeb);
      const hz = G.project(...PLACES.hormuz);
      const labA = gA * (1 - smooth(seg(p, T.assur + 0.4 * s1, T.assur + 1.2 * s1)));
      if (bm.z > 0) {
        beacon(ctx, bm.x, bm.y, { color: C.coral, time: gt, alpha: seg(p, T.rouge, T.rouge + 0.5 * s1) * labA });
        mono(ctx, 'MER ROUGE', bm.x - 24, bm.y + 38, { size: m * 0.018, align: 'right', color: C.coral, t: seg(p, T.rouge, T.rouge + 1.2 * s1), alpha: labA });
      }
      if (hz.z > 0) {
        beacon(ctx, hz.x, hz.y, { color: C.amber, time: gt + 0.4, alpha: seg(p, T.ormuz, T.ormuz + 0.5 * s1) * gA });
        mono(ctx, 'ORMUZ', hz.x + 26, hz.y - 30, { size: m * 0.018, align: 'left', color: C.amber, t: seg(p, T.ormuz, T.ormuz + 0.9 * s1), alpha: labA });
      }
      // Sillage doré qui avance… puis se fige
      const wakeT = 0.62 * eOutCubic(seg(p, T.assur, T.p38 - 0.4 * s1));
      if (wakeT > 0) {
        const pts = projectAll(G, smoothPath(ROUTE_GULF, 12));
        const frozen = smooth(seg(p, T.p38 - 0.9 * s1, T.p38 - 0.3 * s1));
        const col = mix(C.amber, C.coral, frozen);
        trail(ctx, pts, wakeT, { color: col, width: Math.max(3, G.R * 0.0028), alpha: gA, head: true });
        if (frozen > 0 && hz.z > 0) shockwave(ctx, hz.x, hz.y, G.R * 0.22, gt, { color: C.coral, alpha: frozen * gA, period: 1.6 });
      }
    }

    // ── +38 % monumental (révélé par le travelling) ──
    const nY = cy + (1 - camY) * step;
    const nA = env(camY, 0.35, 1.65, 0.4, 0.4);
    if (nA > 0.003) {
      freqWave(ctx, 0, nY - m * 0.1, w, m * 0.36, gt, { bars: V ? 48 : 96, energy: 0.8 * nA, colorA: C.coral, colorB: C.amber, alpha: 0.55, spread: 0.42, seed: 5 });
      const k = eOutExpo(seg(p, T.p38 - 0.1 * s1, T.p38 + 1.4 * s1));
      const val = Math.round(38 * k);
      const size = fitSize(ctx, '+38 %', 900, m * 0.34, w * 0.86);
      ctx.save();
      ctx.globalAlpha *= nA;
      setFont(ctx, 900, size);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = rgba(C.amber, 0.7);
      ctx.shadowBlur = 50;
      ctx.fillStyle = C.white;
      ctx.fillText(`+${val} %`, cx, nY + size * 0.3);
      ctx.restore();
      mono(ctx, 'ASSURANCE · RISQUE DE GUERRE', cx, nY + size * 0.3 + m * 0.07, { size: m * 0.022, color: C.amber, t: seg(p, T.p38 + 0.5 * s1, T.p38 + 2 * s1), alpha: nA });
    }

    // ── Acte III : le pétrolier et son surcoût ──
    const tY = cy + (2 - camY) * step;
    const shrink = eInOutQuart(seg(p, T.arm - 0.7 * s1, T.arm + 0.6 * s1));
    const tA = smooth(seg(camY, 1.3, 1.9)) * (1 - shrink);
    if (tA > 0.003) {
      const L = (V ? w * 0.92 : w * 0.6) * (1 - shrink * 0.95);
      const drift = (p - T.concr) * scene.duration * w * 0.004;
      drawTanker(ctx, cx - L * 0.02 + drift, tY + m * 0.12, L, { time: gt, alpha: tA });
      const cA = tA * smooth(seg(p, T.cent - 0.4 * s1, T.cent + 0.4 * s1));
      if (cA > 0.003) {
        const size = V ? m * 0.12 : m * 0.135;
        const yy = tY - m * 0.16;
        ctx.save();
        ctx.globalAlpha *= cA;
        setFont(ctx, 900, size);
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        const pre = '+ ';
        const suf = '00 000 $';
        const wPre = ctx.measureText(pre).width;
        const wDig = ctx.measureText('8').width;
        const wSuf = ctx.measureText(suf).width;
        const x0 = cx - (wPre + wDig + wSuf) / 2;
        ctx.shadowColor = rgba(C.amber, 0.6);
        ctx.shadowBlur = 36;
        ctx.fillStyle = C.white;
        ctx.fillText(pre, x0, yy);
        ctx.fillText(suf, x0 + wPre + wDig, yy);
        const tau = Math.max(0, (p - T.cent) * scene.duration);
        rollingDigit(ctx, x0 + wPre + wDig / 2, yy, size, 14 * (1 - Math.exp(-1.1 * tau)) + 0.9 * tau, C.amber);
        ctx.restore();
        mono(ctx, 'PAR VOYAGE', cx, yy + m * 0.065, { size: m * 0.022, color: C.amber, t: seg(p, T.cent + 0.6 * s1, T.cent + 1.6 * s1), alpha: cA });
      }
    }

    // ── Acte IV : le grand détour par le sud de l'Afrique ──
    if (africa > 0.003) {
      const SA = V ? [24, -2, 0.47, 0, -0.1] : [20, -2, 0.6, 0.15, 0.04];
      const GA = globeFrom(stage, [SA[0] + (1 - africa) * 20, SA[1], SA[2] * (0.75 + 0.25 * eOutCubic(africa)), SA[3], SA[4]]);
      drawGlobe(ctx, GA, { alpha: africa, color: C.cyan });
      const suez = projectAll(GA, smoothPath(ROUTE_SUEZ, 10));
      trail(ctx, suez, 1, { color: C.coral, width: 2, alpha: africa * 0.5 * seg(p, T.arm, T.arm + 0.8 * s1), dash: [6, 10], head: false, glow: 0 });
      const bm = GA.project(...PLACES.babElMandeb);
      if (bm.z > 0) {
        const xa = africa * seg(p, T.arm + 0.4 * s1, T.arm + 1 * s1);
        ctx.save();
        ctx.globalAlpha *= xa;
        ctx.strokeStyle = C.coral;
        ctx.lineWidth = 4;
        ctx.shadowColor = C.coral;
        ctx.shadowBlur = 14;
        const q = 14;
        ctx.beginPath();
        ctx.moveTo(bm.x - q, bm.y - q);
        ctx.lineTo(bm.x + q, bm.y + q);
        ctx.moveTo(bm.x + q, bm.y - q);
        ctx.lineTo(bm.x - q, bm.y + q);
        ctx.stroke();
        ctx.restore();
      }
      const cape = projectAll(GA, smoothPath(ROUTE_CAPE, 10));
      const rt = eInOut(seg(p, T.detour - 0.3 * s1, T.sem + 0.6 * s1));
      trail(ctx, cape, rt, { color: C.amber, width: Math.max(3, GA.R * 0.006), alpha: africa });
      if (rt >= 1) {
        for (let k = 0; k < 6; k++) {
          const u = (gt * 0.035 + k / 6) % 1;
          const i0 = Math.floor(u * (cape.length - 1));
          const q = cape[i0];
          if (q.vis) light(ctx, q.x, q.y, 16, C.gold, 0.9 * africa);
        }
      }
      const cp = GA.project(...PLACES.cape);
      mono(ctx, 'CAP DE BONNE-ESPÉRANCE', cp.x - 30, cp.y + 46, { size: m * 0.017, align: V ? 'center' : 'right', color: C.gold, t: seg(p, T.sud, T.sud + 1.4 * s1), alpha: africa });
      const big = seg(p, T.sem - 0.2 * s1, T.sem + 0.9 * s1);
      if (V) {
        kinetic(ctx, '+2 SEMAINES', cx, h * 0.8, { size: m * 0.12, weight: 900, t: big, glow: 30, glowColor: rgba(C.amber, 0.6), maxW: w * 0.86 });
      } else {
        kinetic(ctx, '+2', w * 0.07, cy + m * 0.04, { size: m * 0.26, weight: 900, align: 'left', t: big, glow: 40, glowColor: rgba(C.amber, 0.6) });
        kinetic(ctx, 'SEMAINES', w * 0.075, cy + m * 0.14, { size: m * 0.065, weight: 800, align: 'left', t: seg(p, T.sem + 0.1 * s1, T.sem + 1.1 * s1), spacing: m * 0.008 });
      }
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * TOPOGRAPHIE PROCÉDURALE : bruit de valeur + lignes de niveau (marching squares)
 * ════════════════════════════════════════════════════════════════════════ */

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
}
function fbm(x, y) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

/** Lignes de niveau d'un champ scalaire → segments [x1, y1, x2, y2, …] par niveau. */
function contours(fn, x0, x1, y0, y1, nx, ny, levels) {
  const W = nx + 1;
  const vals = new Float32Array(W * (ny + 1));
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) vals[j * W + i] = fn(x0 + ((x1 - x0) * i) / nx, y0 + ((y1 - y0) * j) / ny);
  const dx = (x1 - x0) / nx;
  const dy = (y1 - y0) / ny;
  return levels.map((L) => {
    const segs = [];
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = vals[j * W + i];
        const b = vals[j * W + i + 1];
        const c = vals[(j + 1) * W + i + 1];
        const d = vals[(j + 1) * W + i];
        const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const X = x0 + i * dx;
        const Y = y0 + j * dy;
        const top = [X + dx * ((L - a) / (b - a)), Y];
        const right = [X + dx, Y + dy * ((L - b) / (c - b))];
        const bottom = [X + dx * ((L - d) / (c - d)), Y + dy];
        const left = [X, Y + dy * ((L - a) / (d - a))];
        const add = (p, q) => segs.push(p[0], p[1], q[0], q[1]);
        switch (idx) {
          case 1: case 14: add(left, bottom); break;
          case 2: case 13: add(bottom, right); break;
          case 3: case 12: add(left, right); break;
          case 4: case 11: add(top, right); break;
          case 6: case 9: add(top, bottom); break;
          case 7: case 8: add(left, top); break;
          case 5: add(left, top); add(bottom, right); break;
          case 10: add(top, right); add(left, bottom); break;
        }
      }
    }
    return new Float32Array(segs);
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 03 — d1-geopolitique-detroit
 * Acte I   : la topographie se dessine au scanner, la caméra plonge
 * Acte II  : l'étau se referme — 33 KM, comparé à Montréal → Saint-Jérôme
 * Acte III : 21 M barils/jour + 1/5 du GNL : le flux accélère au goulot
 * Acte IV  : aucun pipeline de rechange — −20 % et l'embouteillage
 * ════════════════════════════════════════════════════════════════════════ */

const HZ_N = (x) => -0.36 + 0.29 * Math.exp(-(((x + 0.05) / 0.5) ** 2)) + 0.035 * Math.sin(x * 3.1);
const HZ_S = (x) => 0.42 - 0.35 * Math.exp(-(((x - 0.06) / 0.16) ** 2)) - 0.05 * Math.exp(-(((x - 0.5) / 0.3) ** 2));
const HZ_LEVELS = [0, 0.03, 0.065, 0.1, 0.14, 0.19, 0.25, 0.32, 0.4];

function hormuzTopo() {
  return cached('hormuzTopo', () => {
    const north = (x, y) => {
      const d = HZ_N(x) - y;
      return d + 0.018 * fbm(x * 9 + 2, y * 9) + 0.1 * fbm(x * 2.4 + 5, y * 2.4) * clamp(d * 3) +
        0.07 * Math.exp(-(((x + 0.4) / 0.2) ** 2) - (((y + 0.15) / 0.028) ** 2));
    };
    const south = (x, y) => {
      const d = y - HZ_S(x);
      return d + 0.018 * fbm(x * 9 - 4, y * 9 + 1) + 0.1 * fbm(x * 2.4 - 7, y * 2.4 + 3) * clamp(d * 3);
    };
    return {
      north: contours(north, -1.6, 1.6, -1.1, 0.25, 160, 68, HZ_LEVELS),
      south: contours(south, -1.6, 1.6, -0.2, 1.1, 160, 65, HZ_LEVELS)
    };
  });
}

function drawContourSet(ctx, sets, ox, oy, sweep, unit, tint) {
  sets.forEach((segs, li) => {
    const coast = li === 0;
    ctx.strokeStyle = coast ? C.white : rgba(tint, Math.max(0.12, 0.46 - li * 0.045));
    ctx.lineWidth = (coast ? 2.2 : 1.1) / unit;
    if (coast) {
      ctx.shadowColor = C.cyan;
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    const lim = sweep - li * 0.12;
    for (let i = 0; i < segs.length; i += 4) {
      if (segs[i] > lim) continue;
      ctx.moveTo(segs[i] + ox, segs[i + 1] + oy);
      ctx.lineTo(segs[i + 2] + ox, segs[i + 3] + oy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
}

function sceneStrait(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, {
    geo: 'géographie', detroit: 'Le détroit', km: 'trente-trois', mtl: 'moins large', pourtant: 'Pourtant',
    b21: 'vingt-et-un', gnl: 'cinquième', trou: 'trou d', aucun: 'Il n', pipe: 'pipeline', v20: 'vingt pour'
  });

  // L'étau : les deux masses se rapprochent, puis serrent encore de 20 %
  const close = eInOutQuart(seg(p, 0.02, T.detroit + 1.2 * s1));
  const squeeze = eInOutQuart(seg(p, T.v20 - 0.6 * s1, T.v20 + 1.0 * s1));
  const dyN = -0.3 * (1 - close) + 0.014 * squeeze;
  const dyS = 0.3 * (1 - close) - 0.014 * squeeze;

  // Caméra : plongée → zoom sur le goulot → recul sur le flux
  const zoom = track(p, [[0, 0.62], [T.detroit, 1.0, eOutCubic], [T.km - 0.3 * s1, 1.0], [T.km + 1.2 * s1, 1.9, eInOutQuart], [T.b21 - 0.4 * s1, 1.85], [T.b21 + 1.0 * s1, 1.05, eInOutQuart], [T.aucun, 1.08], [T.aucun + 1.4 * s1, 1.0]]);
  const fx = track(p, [[T.km - 0.3 * s1, 0], [T.km + 1.2 * s1, 0.06], [T.mtl + 0.2 * s1, 0.06], [T.mtl + 1.2 * s1, 0.2], [T.b21 - 0.4 * s1, 0.2], [T.b21 + 1.0 * s1, 0]]);
  const S = (V ? h : w) / 2.7;
  const unit = S * zoom;
  const scr = (u, v) => {
    const X = (u - fx) * unit;
    const Y = v * unit;
    return V ? { x: cx + Y, y: cy - X } : { x: cx + X, y: cy + Y };
  };

  frame(a, () => {
    light(ctx, cx, cy, m * 0.9, C.amber, 0.08);
    const topo = hormuzTopo();
    const sweep = -1.6 + 4.2 * eInOut(seg(p, 0.0, T.detroit + 0.6 * s1));

    // ── Cartographie (transformée caméra) ──
    ctx.save();
    ctx.translate(cx, cy);
    if (V) ctx.rotate(-Math.PI / 2);
    ctx.scale(unit, unit);
    ctx.translate(-fx, 0);
    // Masses côtières sombres
    const landFill = (fnY, oy, top) => {
      ctx.beginPath();
      ctx.moveTo(-1.7, top ? -1.2 : 1.2);
      for (let x = -1.7; x <= 1.7; x += 0.02) ctx.lineTo(x, fnY(x) + oy);
      ctx.lineTo(1.7, top ? -1.2 : 1.2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(16,24,38,0.55)';
      ctx.fill();
    };
    landFill(HZ_N, dyN, true);
    landFill(HZ_S, dyS, false);
    drawContourSet(ctx, topo.north, 0, dyN, sweep, unit, C.ice);
    drawContourSet(ctx, topo.south, 0, dyS, sweep, unit, C.ice);

    // Pipelines de contournement (dérisoires)
    const pipeA = smooth(seg(p, T.pipe - 0.2 * s1, T.pipe + 0.8 * s1));
    if (pipeA > 0) {
      ctx.save();
      ctx.globalAlpha *= pipeA;
      ctx.setLineDash([0.02, 0.018]);
      ctx.strokeStyle = C.coral;
      ctx.lineWidth = 2.5 / unit;
      ctx.beginPath();
      ctx.moveTo(-0.95, HZ_S(-0.95) + dyS + 0.04);
      ctx.bezierCurveTo(-0.5, 0.56 + dyS, 0.25, 0.54 + dyS, 0.62, HZ_S(0.62) + dyS + 0.04);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // ── Faisceau lumineux qui suit l'axe du couloir ──
    const beamA = smooth(seg(p, T.detroit - 0.4 * s1, T.detroit + 1.2 * s1));
    if (beamA > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const beamPath = () => {
        ctx.beginPath();
        for (let u = -1.7; u <= 1.7; u += 0.025) {
          const q = scr(u, (HZ_N(u) + dyN + HZ_S(u) + dyS) / 2);
          if (u === -1.7) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        }
      };
      const wNarrow = (HZ_S(0.06) + dyS - HZ_N(0.06) - dyN) * unit;
      [[1.7, 0.09, 26], [0.9, 0.12, 12], [0.4, 0.14, 4]].forEach(([k, al, bl]) => {
        ctx.filter = `blur(${bl}px)`;
        beamPath();
        ctx.strokeStyle = rgba(squeeze > 0.2 ? mix(C.amber, C.coral, squeeze) : C.amber, al * beamA);
        ctx.lineWidth = Math.max(4, wNarrow * k);
        ctx.stroke();
      });
      ctx.filter = "none";
      beamPath();
      ctx.strokeStyle = rgba(C.gold, 0.5 * beamA);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // ── Flux de particules dans le couloir (vitesse ∝ 1 / largeur : effet Venturi) ──
    const flowA = smooth(seg(p, T.detroit, T.km)) * 0.45 + smooth(seg(p, T.pourtant, T.b21 + 0.5 * s1)) * 0.55;
    if (flowA > 0.01) {
      const NS = 64;
      const us = new Float32Array(NS + 1);
      const cum = new Float32Array(NS + 1);
      for (let i = 0; i <= NS; i++) {
        const u = -1.5 + (3 * i) / NS;
        us[i] = u;
        const width = Math.max(0.02, HZ_S(u) + dyS - (HZ_N(u) + dyN));
        if (i) cum[i] = cum[i - 1] + width;
      }
      const total = cum[NS];
      const uAt = (sv) => {
        const target = sv * total;
        let lo = 0;
        let hi = NS;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1;
          if (cum[mid] < target) lo = mid;
          else hi = mid;
        }
        const f = (target - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]);
        return lerp(us[lo], us[hi], f);
      };
      const gas = smooth(seg(p, T.gnl - 0.2 * s1, T.gnl + 1 * s1));
      const jam = squeeze;
      const parts = cached('hzParts', () => {
        const r = rng(21);
        return Array.from({ length: 900 }, () => [r(), 0.1 + r() * 0.8, 0.6 + r() * 0.8, r()]);
      });
      const tt = (p * scene.duration) * (1 - 0.55 * jam);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const dens = flowA * (0.35 + 0.65 * smooth(seg(p, T.b21 - 0.3 * s1, T.b21 + 1.5 * s1)));
      for (let i = 0; i < parts.length; i++) {
        const [s0, lane, sp, kind] = parts[i];
        if (i / parts.length > dens) continue;
        let sv = (s0 + tt * 0.045 * sp) % 1;
        if (jam > 0) sv = Math.pow(sv, 1 + jam * 0.9);
        const u = uAt(sv);
        const top = HZ_N(u) + dyN + 0.012;
        const bot = HZ_S(u) + dyS - 0.012;
        const v = lerp(top, bot, lane);
        const q = scr(u, v);
        const isGas = kind < 0.2 * gas;
        const col = isGas ? C.ice : jam > 0.2 && u < 0.05 ? mix(C.gold, C.coral, jam) : C.gold;
        const sz = (isGas ? 2.8 : 3.2) * Math.sqrt(zoom);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = col;
        ctx.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
        if (i % 6 === 0) light(ctx, q.x, q.y, 16 * zoom, col, 0.4);
      }
      ctx.restore();
    }

    // Filets pipeline : un mince goutte-à-goutte
    const pipeA2 = smooth(seg(p, T.pipe, T.pipe + 0.8 * s1));
    if (pipeA2 > 0) {
      for (let k = 0; k < 3; k++) {
        const t = ((gt * 0.12 + k / 3) % 1);
        const bx = (tt) => {
          const x0 = -0.95, x1 = -0.5, x2 = 0.25, x3 = 0.62;
          const y0 = HZ_S(-0.95) + dyS + 0.04, y1 = 0.56 + dyS, y2 = 0.54 + dyS, y3 = HZ_S(0.62) + dyS + 0.04;
          const mt = 1 - tt;
          return [mt ** 3 * x0 + 3 * mt * mt * tt * x1 + 3 * mt * tt * tt * x2 + tt ** 3 * x3, mt ** 3 * y0 + 3 * mt * mt * tt * y1 + 3 * mt * tt * tt * y2 + tt ** 3 * y3];
        };
        const [u, v] = bx(t);
        const q = scr(u, v);
        light(ctx, q.x, q.y, 12, C.coral, pipeA2 * 0.9);
      }
      const lp = scr(-0.15, 0.6 + dyS);
      mono(ctx, 'PIPELINES', lp.x, lp.y, { size: m * 0.018, color: C.coral, t: seg(p, T.pipe, T.pipe + 0.8 * s1), alpha: pipeA2 * (1 - seg(p, T.v20 - 0.3 * s1, T.v20)) });
    }

    // Toponymes
    const lab = smooth(seg(p, T.detroit, T.detroit + 0.8 * s1)) * (1 - smooth(seg(p, T.km - 0.4 * s1, T.km)));
    const pI = scr(-0.45, -0.5);
    const pO = scr(0.35, 0.55);
    mono(ctx, 'IRAN', pI.x, pI.y, { size: m * 0.02, color: C.slate, alpha: lab * 0.8, spacing: 12 });
    mono(ctx, 'OMAN', pO.x, pO.y, { size: m * 0.02, color: C.slate, alpha: lab * 0.8, spacing: 12 });
    const pD = scr(fx, V ? 0.62 : -0.62);
    mono(ctx, "DÉTROIT D'ORMUZ", V ? cx : cx, V ? h * 0.86 : h * 0.12, { size: m * 0.022, color: C.amber, t: seg(p, T.detroit + 0.2 * s1, T.detroit + 1.6 * s1), alpha: lab });
    void pD;

    // ── 33 KM : la cote du goulot ──
    const kmA = env(p, T.km - 0.1 * s1, T.b21 - 0.2 * s1, 0.3 * s1, 0.5 * s1);
    if (kmA > 0.003) {
      const u0 = 0.06;
      const A = scr(u0, HZ_N(u0) + dyN + 0.005);
      const B = scr(u0, HZ_S(u0) + dyS - 0.005);
      dimension(ctx, A.x, A.y, B.x, B.y, { color: C.amber, t: seg(p, T.km, T.km + 0.8 * s1), alpha: kmA, tick: 16, width: 3 });
      const len = Math.hypot(B.x - A.x, B.y - A.y);
      const tx = V ? (A.x + B.x) / 2 : A.x - m * 0.06;
      const ty = V ? Math.max(A.y, B.y) + m * 0.2 : (A.y + B.y) / 2 + m * 0.04;
      kinetic(ctx, '33 KM', tx, ty, { size: m * 0.13, weight: 900, align: V ? 'center' : 'right', t: seg(p, T.km + 0.1 * s1, T.km + 1.1 * s1), alpha: kmA, glow: 30, glowColor: rgba(C.amber, 0.6) });
      // Échelle comparative : Montréal → Saint-Jérôme ≈ 40 km
      const cmpA = kmA * smooth(seg(p, T.mtl - 0.2 * s1, T.mtl + 0.6 * s1));
      if (cmpA > 0.003) {
        const L2 = len * (40 / 33);
        const off = m * 0.16;
        const mx = (A.x + B.x) / 2 + (V ? 0 : off);
        const my = (A.y + B.y) / 2 + (V ? -off : 0);
        const dxu = (B.x - A.x) / len;
        const dyu = (B.y - A.y) / len;
        dimension(ctx, mx - (dxu * L2) / 2, my - (dyu * L2) / 2, mx + (dxu * L2) / 2, my + (dyu * L2) / 2, { color: C.cyan, t: seg(p, T.mtl, T.mtl + 0.9 * s1), alpha: cmpA, tick: 16, width: 3 });
        const lx = V ? cx : mx + m * 0.05;
        const ly = V ? my - L2 / 2 - m * 0.12 : my;
        mono(ctx, '≈ 40 KM', lx, ly - 18, { size: m * 0.026, align: V ? 'center' : 'left', color: C.cyan, weight: 600, t: seg(p, T.mtl + 0.3 * s1, T.mtl + 1 * s1), alpha: cmpA });
        mono(ctx, 'MONTRÉAL → SAINT-JÉRÔME', lx, ly + 22, { size: m * 0.017, align: V ? 'center' : 'left', color: C.ice, t: seg(p, T.mtl + 0.5 * s1, T.mtl + 1.6 * s1), alpha: cmpA });
      }
    }

    // ── Chiffres du flux ──
    const bx = cx;
    const by = V ? h * 0.16 : h * 0.2;
    const halo = (fnDraw) => {
      ctx.save();
      ctx.shadowColor = 'rgba(3,5,9,0.95)';
      ctx.shadowBlur = 40;
      fnDraw();
      ctx.restore();
    };
    const b21A = env(p, T.b21 - 0.1 * s1, T.gnl - 0.1 * s1, 0.3 * s1, 0.4 * s1);
    if (b21A > 0.003) {
      const k = eOutExpo(seg(p, T.b21, T.b21 + 1.6 * s1));
      halo(() => kinetic(ctx, `${Math.round(21 * k)} M`, bx, by, { size: m * 0.14, weight: 900, t: 1, alpha: b21A, glow: 34, glowColor: rgba(C.gold, 0.55) }));
      mono(ctx, 'BARILS / JOUR', bx, by + m * 0.055, { size: m * 0.022, color: C.gold, t: seg(p, T.b21 + 0.4 * s1, T.b21 + 1.4 * s1), alpha: b21A });
    }
    const gA = env(p, T.gnl, T.aucun, 0.3 * s1, 0.4 * s1);
    if (gA > 0.003) {
      halo(() => kinetic(ctx, '1/5', bx, by, { size: m * 0.14, weight: 900, t: seg(p, T.gnl, T.gnl + 0.9 * s1), alpha: gA, glow: 34, glowColor: rgba(C.ice, 0.6) }));
      mono(ctx, 'DU GNL MONDIAL', bx, by + m * 0.055, { size: m * 0.022, color: C.ice, t: seg(p, T.gnl + 0.3 * s1, T.gnl + 1.3 * s1), alpha: gA });
    }
    const noA = env(p, T.aucun + 0.1 * s1, T.v20 - 0.1 * s1, 0.3 * s1, 0.3 * s1);
    if (noA > 0.003) {
      halo(() => kinetic(ctx, 'IRREMPLAÇABLE', bx, by, { size: m * 0.085, weight: 900, t: seg(p, T.aucun + 0.2 * s1, T.aucun + 1.2 * s1), alpha: noA, maxW: w * 0.86 }));
    }
    const v20A = smooth(seg(p, T.v20 - 0.1 * s1, T.v20 + 0.4 * s1));
    if (v20A > 0.003) {
      halo(() => kinetic(ctx, '−20 %', bx, by, { size: m * 0.15, weight: 900, t: seg(p, T.v20, T.v20 + 0.9 * s1), alpha: v20A, glow: 40, glowColor: rgba(C.coral, 0.7), color: C.white }));
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * PLANS PIVOTANTS 2.5D (grilles de points en vraie perspective)
 *   16:9 → charnière verticale (gauche | droite)
 *   9:16 → charnière horizontale (haut / bas)
 * ════════════════════════════════════════════════════════════════════════ */

function hingeProjector(stage, V, focal = 1500) {
  return (side, theta, a, b, lift = 0) => {
    // side = -1 (plan ambre) | +1 (plan cyan) ; a ≥ 0 distance à la charnière ; b le long de la charnière
    const z = a * Math.sin(theta) - lift;
    const s = focal / (focal + z);
    const A = side * a * Math.cos(theta) * s;
    const B = b * s;
    return V ? { x: stage.cx + B, y: stage.cy + A, s } : { x: stage.cx + A, y: stage.cy + B, s };
  };
}

function dotPlane(ctx, proj, side, theta, W, H, o = {}) {
  const { color = C.amber, alpha = 1, cols = 24, rows = 16, time = 0, ripple = 0, glow = 0 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const a = ((i + 0.5) / cols) * W;
      const b = ((j + 0.5) / rows - 0.5) * H;
      const lift = ripple * 26 * Math.sin(a * 0.012 - time * 2.2) * Math.cos(b * 0.01 + time * 0.7);
      const q = proj(side, theta, a, b, lift);
      const sz = 3.2 * q.s;
      const fade = Math.pow(1 - i / cols, 0.8) * Math.pow(1 - Math.abs(b) / (H * 0.5), 0.7);
      ctx.globalAlpha = alpha * fade * (0.55 + 0.45 * Math.max(0, lift / 26 + 0.5));
      ctx.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
    }
  }
  ctx.restore();
  // Lumière volumétrique sans bord dur : le plan est un champ, pas une boîte
  const mid = proj(side, theta, W * 0.35, 0);
  light(ctx, mid.x, mid.y, W * 0.75 * mid.s, color, alpha * (0.1 + 0.12 * glow));
  const hinge = proj(side, theta, 0, 0);
  light(ctx, hinge.x, hinge.y, H * 0.4, color, alpha * 0.08);
}

/** Médaille 3D à deux faces bicolores qui tourne sur son axe. */
function medal(ctx, x, y, r, angle, o = {}) {
  const { alpha = 1, split = 0, V = false } = o;
  if (alpha <= 0.003) return;
  const sx = Math.cos(angle);
  const thick = r * 0.09 * Math.sin(angle);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  if (split <= 0) {
    // Tranche
    ctx.fillStyle = '#3a2a10';
    ctx.beginPath();
    ctx.ellipse(thick, 0, Math.max(0.5, Math.abs(sx) * r), r, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.scale(Math.max(0.02, Math.abs(sx)), 1);
    const flip = sx < 0;
    // Face : moitié ambre / moitié cyan (les deux côtés de la médaille)
    for (const half of [-1, 1]) {
      const col = (half < 0) !== flip ? C.amber : C.cyan;
      const g = ctx.createLinearGradient(half * r, -r, 0, r);
      g.addColorStop(0, mix(col, C.white, 0.35));
      g.addColorStop(0.6, col);
      g.addColorStop(1, mix(col, C.night, 0.45));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, half < 0 ? Math.PI / 2 : -Math.PI / 2, half < 0 ? (Math.PI * 3) / 2 : Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.84, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();
    ctx.restore();
  } else {
    // Scission : les deux demi-disques s'écartent et deviennent des plans
    const e = eInOutQuart(split);
    for (const half of [-1, 1]) {
      const col = half < 0 ? C.amber : C.cyan;
      ctx.save();
      const d = e * r * 1.6 * half;
      if (V) ctx.translate(0, d);
      else ctx.translate(d, 0);
      ctx.globalAlpha *= 1 - e;
      ctx.fillStyle = col;
      ctx.beginPath();
      if (V) ctx.arc(0, 0, r, half < 0 ? Math.PI : 0, half < 0 ? TAU : Math.PI);
      else ctx.arc(0, 0, r, half < 0 ? Math.PI / 2 : -Math.PI / 2, half < 0 ? (Math.PI * 3) / 2 : Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
  light(ctx, x, y, r * 2.4, C.white, alpha * 0.08 * (1 - split));
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 04 — d1-deux-cotes-opep-occident
 * Acte I   : qui paie la facture ? (la courbe grimpe)
 * Acte II  : la médaille tourne — puis se scinde en deux plans
 * Acte III : OPEP+ (plan ambre face caméra) : 3 arguments
 * Acte IV  : importateurs (plan cyan) : rareté, marges au sommet → équilibre
 * ════════════════════════════════════════════════════════════════════════ */

function sceneTwoSidesOil(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, {
    fid: 'Fidèles', deux: 'deux côtés', opep: 'Du côté', chine: 'chinoise', trans: 'transition', taxes: 'taxes',
    inv: "l'inverse", rare: 'rareté', raff: 'raffineries', marges: 'marges', som: 'sommets'
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 80, alpha: 0.35 });

    // ── Acte I : la facture qui grimpe ──
    const a1 = 1 - smooth(seg(p, T.fid - 0.3 * s1, T.fid + 0.5 * s1));
    if (a1 > 0.003) {
      const pts = [];
      const N = 90;
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const x = lerp(w * 0.08, w * 0.92, u);
        const y = lerp(h * 0.78, h * 0.3, Math.pow(u, 1.6)) + Math.sin(u * 37) * h * 0.012 * (1 - u);
        pts.push({ x, y, vis: true });
      }
      trail(ctx, pts, eInOut(seg(p, 0.01, T.fid - 0.4 * s1)), { color: C.amber, width: 3.5, alpha: a1 });
      kinetic(ctx, 'QUI EST RESPONSABLE ?', cx, V ? h * 0.2 : h * 0.2, { size: m * 0.085, weight: 900, t: seg(p, 0.02, 0.02 + 1.2 * s1), alpha: a1, maxW: w * 0.86 });
    }

    // ── Acte II : la médaille ──
    const medA = smooth(seg(p, T.fid - 0.2 * s1, T.fid + 0.6 * s1));
    const split = seg(p, T.opep - 0.9 * s1, T.opep + 0.2 * s1);
    if (medA > 0.003 && split < 1) {
      const spin = TAU * 2.5 * eOutCubic(seg(p, T.fid - 0.2 * s1, T.opep - 1.0 * s1)) + Math.sin(gt * 1.3) * 0.05;
      medal(ctx, cx, cy, m * 0.17, spin, { alpha: medA, split, V });
      kinetic(ctx, 'LES DEUX CÔTÉS', cx, cy + m * 0.32, { size: m * 0.06, weight: 800, t: seg(p, T.deux, T.deux + 1 * s1), alpha: medA * (1 - split), spacing: m * 0.006 });
    }

    // ── Actes III–IV : les deux plans pivotants ──
    const planes = smooth(seg(p, T.opep - 0.5 * s1, T.opep + 0.6 * s1));
    if (planes > 0.003) {
      const proj = hingeProjector(stage, V, 1500);
      const W = V ? h * 0.42 : w * 0.44;
      const H = V ? w * 0.86 : h * 0.72;
      const open = eOutCubic(planes);
      const balance = smooth(seg(p, 1 - 1.6 * s1, 1 - 0.5 * s1));
      const toImp = eInOutQuart(seg(p, T.inv - 0.4 * s1, T.inv + 0.9 * s1));
      const thL = lerp(Math.PI / 2, lerp(lerp(0.05, 1.25, toImp), 0.5, balance), open);
      const thR = lerp(Math.PI / 2, lerp(lerp(1.25, 0.05, toImp), 0.5, balance), open);
      dotPlane(ctx, proj, -1, thL, W, H, { color: C.amber, alpha: planes, time: gt, ripple: 1 - toImp, glow: 1 - toImp });
      dotPlane(ctx, proj, 1, thR, W, H, { color: C.cyan, alpha: planes, time: gt, ripple: toImp * (1 - balance), glow: toImp });

      // Axe central : la règle d'impartialité
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const axisLen = (V ? w : h) * 0.42 * open;
      const g = V ? ctx.createLinearGradient(cx - axisLen, cy, cx + axisLen, cy) : ctx.createLinearGradient(cx, cy - axisLen, cx, cy + axisLen);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,255,${0.85 * planes})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      if (V) ctx.fillRect(cx - axisLen, cy - 1, axisLen * 2, 2);
      else ctx.fillRect(cx - 1, cy - axisLen, 2, axisLen * 2);
      ctx.restore();
      light(ctx, cx, cy, m * 0.08, C.white, 0.25 * planes);

      // Contenu éditorial
      const posL = V ? { x: cx, y: cy - h * 0.22 } : { x: cx - w * 0.24, y: cy };
      const posR = V ? { x: cx, y: cy + h * 0.22 } : { x: cx + w * 0.24, y: cy };
      const maxW = V ? w * 0.84 : w * 0.38;
      const ampA = planes * (1 - toImp) * (1 - balance);
      const impA = planes * toImp * (1 - balance);
      mono(ctx, 'PRODUCTEURS', posL.x, posL.y - m * 0.2, { size: m * 0.02, color: C.amber, t: seg(p, T.opep, T.opep + 1 * s1), alpha: ampA });
      kinetic(ctx, 'OPEP+', posL.x, posL.y - m * 0.1, { size: m * 0.075, weight: 900, t: seg(p, T.opep + 0.1 * s1, T.opep + 1 * s1), alpha: ampA, color: C.amber });
      const kwL = [
        [T.chine, T.trans, 'DEMANDE CHINOISE ↓'],
        [T.trans, T.taxes, 'TRANSITION À FINANCER'],
        [T.taxes, T.inv, 'TAXES OCCIDENTALES']
      ];
      kwL.forEach(([s, e, txt]) => {
        const al = env(p, s - 0.1 * s1, e - 0.1 * s1, 0.3 * s1, 0.3 * s1) * ampA;
        if (al > 0.003) kinetic(ctx, txt, posL.x, posL.y + m * 0.06, { size: m * 0.06, weight: 800, t: seg(p, s, s + 0.8 * s1), alpha: al, maxW });
      });
      mono(ctx, 'IMPORTATEURS', posR.x, posR.y - m * 0.2, { size: m * 0.02, color: C.cyan, t: seg(p, T.inv, T.inv + 1 * s1), alpha: impA });
      kinetic(ctx, 'CONSOMMATEURS', posR.x, posR.y - m * 0.1, { size: m * 0.062, weight: 900, t: seg(p, T.inv + 0.1 * s1, T.inv + 1 * s1), alpha: impA, color: C.cyan, maxW });
      const kwR = [
        [T.rare, T.raff, 'RARETÉ ARTIFICIELLE'],
        [T.raff, 1 - 1.6 * s1, 'MARGES DES RAFFINEURS']
      ];
      kwR.forEach(([s, e, txt]) => {
        const al = env(p, s - 0.1 * s1, e, 0.3 * s1, 0.3 * s1) * impA;
        if (al > 0.003) kinetic(ctx, txt, posR.x, posR.y + m * 0.06, { size: m * 0.058, weight: 800, t: seg(p, s, s + 0.8 * s1), alpha: al, maxW });
      });
      // Courbe des marges qui frôle le sommet historique, dessinée sur le plan cyan
      const mg = seg(p, T.marges - 0.2 * s1, T.som + 0.6 * s1);
      if (mg > 0 && impA > 0.01) {
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const u = i / 60;
          const aa = lerp(W * 0.08, W * 0.92, u);
          const bb = lerp(H * 0.38, -H * 0.3, Math.pow(u, 0.7)) + Math.sin(u * 23) * H * 0.02;
          pts.push({ ...proj(1, thR, aa, V ? -bb : bb), vis: true });
        }
        const pk = [proj(1, thR, W * 0.05, V ? H * 0.33 : -H * 0.33), proj(1, thR, W * 0.95, V ? H * 0.33 : -H * 0.33)];
        ctx.save();
        ctx.globalAlpha *= impA * smooth(seg(p, T.som - 0.2 * s1, T.som + 0.5 * s1));
        ctx.setLineDash([6, 8]);
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pk[0].x, pk[0].y);
        ctx.lineTo(pk[1].x, pk[1].y);
        ctx.stroke();
        ctx.restore();
        trail(ctx, pts, eInOut(mg), { color: C.cyan, width: 3, alpha: impA * 0.9 });
        mono(ctx, 'SOMMETS HISTORIQUES', pk[1].x, pk[1].y - 22, { size: m * 0.016, align: V ? 'right' : 'right', color: C.white, t: seg(p, T.som, T.som + 0.9 * s1), alpha: impA });
      }
      // Équilibre final : deux plans, un seul axe
      if (balance > 0.01) {
        mono(ctx, 'OPEP+', posL.x, posL.y, { size: m * 0.03, weight: 600, color: C.amber, alpha: balance });
        mono(ctx, 'CONSOMMATEURS', posR.x, posR.y, { size: m * 0.03, weight: 600, color: C.cyan, alpha: balance });
      }
    }
  });
}

/** Points de terre en projection plate (cartes régionales), avec culling écran. */
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

function flatTrack(p, kf) {
  if (p <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) {
    const [p1, s1, e = eInOutQuart] = kf[i];
    const [p0, s0] = kf[i - 1];
    if (p <= p1) {
      const t = p1 <= p0 ? 1 : e(seg(p, p0, p1));
      // zoom exponentiel fluide (interpolation logarithmique de l'échelle)
      return [lerp(s0[0], s1[0], t), lerp(s0[1], s1[1], t), Math.exp(lerp(Math.log(s0[2]), Math.log(s1[2]), t))];
    }
  }
  return kf[kf.length - 1][1];
}

/** Flèche chevron orientée (les « flèches directionnelles » de la charte). */
function arrowHead(ctx, x, y, ang, s, color, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = s;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.7, -s * 0.75);
  ctx.lineTo(-s * 0.25, 0);
  ctx.lineTo(-s * 0.7, s * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Camion (porteur + remorque) en lignes de lumière, roulant vers la droite. */
function drawTruck(ctx, x, y, L, o = {}) {
  const { color = C.amber, alpha = 1, time = 0, cold = false } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = 'rgba(3,5,9,0.9)';
  ctx.lineWidth = Math.max(1.5, L * 0.008);
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = L * 0.05;
  // Remorque
  ctx.beginPath();
  ctx.rect(-L * 0.5, -L * 0.3, L * 0.68, L * 0.26);
  ctx.fill();
  ctx.stroke();
  // Cabine
  ctx.beginPath();
  ctx.moveTo(L * 0.21, -L * 0.04);
  ctx.lineTo(L * 0.21, -L * 0.24);
  ctx.lineTo(L * 0.38, -L * 0.24);
  ctx.lineTo(L * 0.48, -L * 0.13);
  ctx.lineTo(L * 0.48, -L * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (cold) {
    ctx.beginPath();
    ctx.rect(-L * 0.47, -L * 0.36, L * 0.12, L * 0.06);
    ctx.stroke();
  }
  // Roues qui tournent
  for (const wx of [-L * 0.38, -L * 0.24, L * 0.3, L * 0.42]) {
    ctx.beginPath();
    ctx.arc(wx, 0, L * 0.045, 0, TAU);
    ctx.fill();
    ctx.stroke();
    const an = time * 9;
    ctx.beginPath();
    ctx.moveTo(wx + Math.cos(an) * L * 0.03, Math.sin(an) * L * 0.03);
    ctx.lineTo(wx - Math.cos(an) * L * 0.03, -Math.sin(an) * L * 0.03);
    ctx.stroke();
  }
  ctx.restore();
  light(ctx, x + L * 0.5, y - L * 0.06, L * 0.12, C.gold, alpha * 0.7);
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 05 — d1-impact-quebec-pompe
 * Acte I   : notre pétrole vient de l'Ouest et des États-Unis… alors pourquoi ?
 * Acte II  : un seul prix mondial — New York ⇄ Londres
 * Acte III : l'Asie et l'Europe surenchérissent sur le brut nord-américain
 * Acte IV  : le fil lumineux Ormuz → Québec, et la pompe : 1,64 $ → 1,75 $
 * ════════════════════════════════════════════════════════════════════════ */

function scenePump(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, {
    pq: 'pourquoi', mtl: 'Montréal', ouest: 'Ouest', us: 'États-Unis', rep: 'La réponse', bourse: 'bourse',
    ny: 'New York', ldn: 'Londres', des: 'Dès que', asie: 'Asie', sur: 'surenchérissent', res: 'Résultat', c812: 'huit à douze', camion: 'camion'
  });

  let cam = flatTrack(p, [
    [0, V ? [-82, 46, 0.019 * m] : [-82, 46, 0.029 * m]],
    [T.rep - 0.2 * s1, V ? [-81, 46, 0.021 * m] : [-81, 46, 0.032 * m], smooth],
    [T.rep + 1.6 * s1, V ? [-38, 44, 0.009 * m] : [-37, 43, 0.017 * m]],
    [T.des + 0.2 * s1, V ? [-38, 44, 0.0095 * m] : [-37, 43, 0.018 * m], smooth],
    [T.asie + 1.2 * s1, V ? [15, 35, 0.0048 * m] : [12, 34, 0.0086 * m]],
    [T.res - 0.2 * s1, V ? [15, 35, 0.005 * m] : [12, 34, 0.009 * m], smooth]
  ]);
  // Acte IV : la caméra suit la tête du fil lumineux sur le grand cercle Ormuz → Québec
  const threadGeo = cached("threadHzQc", () => arcPts(PLACES.hormuz, PLACES.quebec, 90, 0));
  const th = eInOut(seg(p, T.res, T.c812 - 0.4 * s1));
  if (p > T.res - 0.2 * s1) {
    const head = threadGeo[Math.round(th * 90)];
    const follow = smooth(seg(p, T.res - 0.2 * s1, T.res + 0.9 * s1));
    const sc = Math.exp(lerp(Math.log((V ? 0.011 : 0.016) * m), Math.log((V ? 0.06 : 0.07) * m), eInOut(seg(p, T.res + 0.6 * s1, T.c812))));
    cam = [lerp(cam[0], head[0], follow), lerp(cam[1], head[1], follow), Math.exp(lerp(Math.log(cam[2]), Math.log(sc), follow))];
  }
  const P = makeFlat(cam[0], cam[1], cam[2], cx, cy);
  const pumpA = smooth(seg(p, T.c812 - 0.6 * s1, T.c812 + 0.3 * s1));

  frame(a, () => {
    // Carte en pointillés
    drawFlatDots(ctx, P, stage, { color: C.cyan, alpha: 1 - pumpA * 0.75 });
    const qcA = 1 - smooth(seg(p, T.rep, T.rep + 1 * s1)) + smooth(seg(p, T.c812 - 1.6 * s1, T.c812 - 0.5 * s1)) * (1 - pumpA * 0.6);
    drawQuebec(ctx, P, { color: C.cyan, alpha: clamp(qcA), draw: seg(p, 0.01, 0.01 + 2.2 * s1), fill: 0.12, line: 2.2 });

    // ── Acte I : approvisionnement réel (Ouest canadien + États-Unis) ──
    const a1 = 1 - smooth(seg(p, T.rep - 0.2 * s1, T.rep + 0.6 * s1));
    if (a1 > 0.003) {
      const mtl = P.project(...PLACES.montreal);
      const lev = P.project(...PLACES.levis);
      const west = [PLACES.alberta, [-97, 50], [-87, 47.5], [-82.4, 42.97], [-79, 43.7], PLACES.montreal].map((q) => P.project(q[0], q[1]));
      const south = [PLACES.texas, [-88, 32], [-80, 36], [-74, 40.7], [-72, 44], PLACES.levis].map((q) => P.project(q[0], q[1]));
      const curve = (pts) => {
        const out = [];
        for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 10; k++) {
          const t = k / 10;
          out.push({ x: lerp(pts[i].x, pts[i + 1].x, t), y: lerp(pts[i].y, pts[i + 1].y, t), vis: true });
        }
        out.push({ ...pts[pts.length - 1], vis: true });
        return out;
      };
      trail(ctx, curve(west), eInOut(seg(p, T.ouest - 0.3 * s1, T.ouest + 1.6 * s1)), { color: C.amber, width: 3, alpha: a1 });
      trail(ctx, curve(south), eInOut(seg(p, T.us - 0.2 * s1, T.us + 1.6 * s1)), { color: C.gold, width: 3, alpha: a1 });
      const wl = P.project(-112, 54.8);
      const sl = P.project(-95, 31.4);
      mono(ctx, 'OUEST CANADIEN', wl.x, wl.y - 26, { size: m * 0.017, color: C.amber, t: seg(p, T.ouest, T.ouest + 1 * s1), alpha: a1 });
      mono(ctx, 'ÉTATS-UNIS', sl.x, sl.y + 30, { size: m * 0.017, color: C.gold, t: seg(p, T.us, T.us + 1 * s1), alpha: a1 });
      beacon(ctx, mtl.x, mtl.y, { color: C.amber, r: 7, time: gt, alpha: a1 * seg(p, T.mtl, T.mtl + 0.4 * s1) });
      beacon(ctx, lev.x, lev.y, { color: C.amber, r: 7, time: gt + 0.3, alpha: a1 * seg(p, T.mtl + 0.3 * s1, T.mtl + 0.7 * s1) });
      mono(ctx, 'MONTRÉAL', mtl.x - 20, mtl.y + 32, { size: m * 0.016, align: 'right', color: C.white, t: seg(p, T.mtl, T.mtl + 0.8 * s1), alpha: a1 });
      mono(ctx, 'LÉVIS', lev.x + 20, lev.y - 26, { size: m * 0.016, align: 'left', color: C.white, t: seg(p, T.mtl + 0.3 * s1, T.mtl + 1 * s1), alpha: a1 });
      kinetic(ctx, 'POURQUOI PLUS CHER ICI ?', cx, V ? h * 0.14 : h * 0.17, { size: m * 0.07, weight: 900, t: seg(p, T.pq, T.pq + 1.2 * s1), alpha: a1, maxW: w * 0.86 });
    }

    // ── Acte II : une seule bourse mondiale ──
    const a2 = env(p, T.rep, T.res + 0.3 * s1, 0.6 * s1, 0.6 * s1);
    if (a2 > 0.003) {
      const ny = P.project(...PLACES.newYork);
      const ld = P.project(...PLACES.london);
      const mx = (ny.x + ld.x) / 2;
      const my = Math.min(ny.y, ld.y) - Math.abs(ld.x - ny.x) * 0.22;
      const arc = [];
      for (let i = 0; i <= 50; i++) {
        const t = i / 50;
        arc.push({ x: (1 - t) ** 2 * ny.x + 2 * (1 - t) * t * mx + t * t * ld.x, y: (1 - t) ** 2 * ny.y + 2 * (1 - t) * t * my + t * t * ld.y, vis: true });
      }
      const link = seg(p, T.ny, T.ldn + 0.8 * s1);
      trail(ctx, arc, eInOut(link), { color: C.white, width: 2.5, alpha: a2 });
      if (link >= 1) {
        for (let k = 0; k < 5; k++) {
          const u = (gt * 0.3 + k / 5) % 1;
          const q = arc[Math.floor(u * 50)];
          light(ctx, q.x, q.y, 14, C.amber, a2 * 0.9);
        }
      }
      beacon(ctx, ny.x, ny.y, { color: C.amber, r: 8, time: gt, alpha: a2 * seg(p, T.ny - 0.2 * s1, T.ny + 0.3 * s1) });
      beacon(ctx, ld.x, ld.y, { color: C.amber, r: 8, time: gt + 0.5, alpha: a2 * seg(p, T.ldn - 0.2 * s1, T.ldn + 0.3 * s1) });
      mono(ctx, 'NEW YORK', ny.x, ny.y + 34, { size: m * 0.018, color: C.white, t: seg(p, T.ny, T.ny + 0.8 * s1), alpha: a2 });
      mono(ctx, 'LONDRES', ld.x, ld.y + 34, { size: m * 0.018, color: C.white, t: seg(p, T.ldn, T.ldn + 0.8 * s1), alpha: a2 });
      const pr = env(p, T.bourse - 0.1 * s1, T.des + 0.2 * s1, 0.4 * s1, 0.4 * s1);
      kinetic(ctx, 'UN SEUL PRIX MONDIAL', cx, V ? h * 0.82 : h * 0.84, { size: m * 0.07, weight: 900, t: seg(p, T.bourse, T.bourse + 1.1 * s1), alpha: a2 * pr, maxW: w * 0.86 });
      const wave = Math.max(pr, env(p, T.rep + 0.3 * s1, T.bourse + 0.4 * s1, 0.5 * s1, 0.4 * s1) * 1.6);
      freqWave(ctx, cx - w * 0.36, V ? h * 0.74 : h * 0.73, w * 0.72, m * 0.1, gt, { bars: 72, energy: clamp(wave) * a2, alpha: 0.75, seed: 9 });

      // ── Acte III : surenchère depuis l'Asie et l'Europe ──
      const a3 = smooth(seg(p, T.des, T.asie + 0.5 * s1)) * a2;
      if (a3 > 0.003) {
        const hz = P.project(...PLACES.hormuz);
        shockwave(ctx, hz.x, hz.y, m * 0.09, gt, { color: C.coral, alpha: a3 });
        const target = P.project(-90, 33);
        const sources = [PLACES.shanghai, PLACES.rotterdam];
        sources.forEach((src, si) => {
          const sp = P.project(...src);
          const ctrlY = Math.min(sp.y, target.y) - m * (0.18 + si * 0.05);
          const pts = [];
          for (let i = 0; i <= 60; i++) {
            const t = i / 60;
            const midx = (sp.x + target.x) / 2;
            pts.push({ x: (1 - t) ** 2 * sp.x + 2 * (1 - t) * t * midx + t * t * target.x, y: (1 - t) ** 2 * sp.y + 2 * (1 - t) * t * ctrlY + t * t * target.y, vis: true });
          }
          const dr = eInOut(seg(p, T.asie + si * 0.4 * s1, T.sur + 0.4 * s1));
          trail(ctx, pts, dr, { color: C.amber, width: 2, alpha: a3 * 0.6, head: false, dash: [8, 10], glow: 0 });
          if (dr > 0.2) {
            for (let k = 0; k < 4; k++) {
              const u = ((gt * 0.18 + k / 4 + si * 0.13) % 1) * dr;
              const i0 = Math.min(59, Math.floor(u * 60));
              const q = pts[i0];
              const q2 = pts[i0 + 1];
              arrowHead(ctx, q.x, q.y, Math.atan2(q2.y - q.y, q2.x - q.x), m * 0.012, C.amber, a3);
            }
          }
          mono(ctx, si ? 'EUROPE' : 'ASIE', sp.x, sp.y + 30, { size: m * 0.017, color: C.amber, t: seg(p, T.asie + si * 0.4 * s1, T.asie + (si * 0.4 + 0.8) * s1), alpha: a3 });
        });
        const tg = P.project(-95, 40);
        beacon(ctx, tg.x, tg.y, { color: C.white, r: 7, time: gt, alpha: a3 });
        kinetic(ctx, 'SURENCHÈRE', cx, V ? h * 0.18 : h * 0.18, { size: m * 0.09, weight: 900, t: seg(p, T.sur, T.sur + 0.9 * s1), alpha: a3 * env(p, T.sur - 0.1 * s1, T.res + 0.2 * s1, 0.3 * s1, 0.3 * s1), glow: 30, glowColor: rgba(C.amber, 0.6) });
      }
    }

    // ── Acte IV : le fil lumineux Ormuz → Québec ──
    const a4 = smooth(seg(p, T.res - 0.3 * s1, T.res + 0.4 * s1));
    if (a4 > 0.003) {
      const thread = threadGeo.map((q) => ({ ...P.project(q[0], q[1]), vis: true }));
      trail(ctx, thread, th, { color: C.amber, width: 3.5, alpha: a4 * (1 - pumpA * 0.85) });
      const hz = P.project(...PLACES.hormuz);
      shockwave(ctx, hz.x, hz.y, m * 0.08, gt, { color: C.coral, alpha: a4 * (1 - seg(p, T.res + 1 * s1, T.res + 2 * s1)) });
    }

    // La pompe : 1,64 $ → 1,75 $ avec inertie
    if (pumpA > 0.003) {
      light(ctx, cx, cy, m * 0.7, C.amber, 0.22 * pumpA);
      const tau = Math.max(0, (p - T.c812) * scene.duration);
      const k = tau <= 0 ? 0 : 1 - Math.exp(-2.4 * tau) * Math.cos(3.2 * tau);
      const val = 1.64 + 0.11 * k;
      const size = fitSize(ctx, '1,75 $', 900, m * 0.26, w * 0.7);
      ctx.save();
      ctx.globalAlpha *= pumpA;
      setFont(ctx, 900, size);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'center';
      ctx.shadowColor = rgba(C.amber, 0.75);
      ctx.shadowBlur = 60;
      ctx.fillStyle = C.white;
      const txt = `${frNum(val, 2)} $`;
      ctx.fillText(txt, cx - size * 0.35, cy + size * 0.32);
      const tw = ctx.measureText(txt).width;
      setFont(ctx, 800, size * 0.42);
      ctx.fillStyle = C.amber;
      ctx.textAlign = 'left';
      ctx.fillText('/L', cx - size * 0.35 + tw / 2 + size * 0.06, cy + size * 0.32);
      ctx.restore();
      mono(ctx, '+ 8 À 12 ¢ LE LITRE', cx, cy + size * 0.32 + m * 0.08, { size: m * 0.024, weight: 600, color: C.amber, t: seg(p, T.c812 + 0.3 * s1, T.c812 + 1.5 * s1), alpha: pumpA });
      // Le camion qui renchérit tout ce qu'on achète
      const tr = smooth(seg(p, T.camion - 0.4 * s1, T.camion + 0.4 * s1));
      if (tr > 0.003) {
        const roadY = V ? h * 0.8 : h * 0.86;
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, rgba(C.amber, 0));
        g.addColorStop(0.5, rgba(C.amber, 0.6));
        g.addColorStop(1, rgba(C.amber, 0));
        ctx.save();
        ctx.globalAlpha *= tr;
        ctx.fillStyle = g;
        ctx.fillRect(0, roadY + 2, w, 1.5);
        ctx.restore();
        const tx = lerp(-w * 0.1, w * 1.1, seg(p, T.camion - 0.4 * s1, 1));
        drawTruck(ctx, tx, roadY, m * 0.16, { time: gt, alpha: tr });
      }
    }
  });
}

/** Sphère de points (Fibonacci) en rotation — masses gravitationnelles. */
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

/** Orbite inclinée avec satellites : son altitude = le taux directeur. */
function orbit(ctx, x, y, rx, time, o = {}) {
  const { color = C.amber, alpha = 1, tilt = -0.25, sats = 3, speed = 0.6 } = o;
  if (alpha <= 0.003) return;
  const ry = rx * 0.26;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, tilt, 0, TAU);
  ctx.stroke();
  ctx.restore();
  for (let k = 0; k < sats; k++) {
    const an = time * speed + (k * TAU) / sats;
    const ex = Math.cos(an) * rx;
    const ey = Math.sin(an) * ry;
    const qx = x + ex * Math.cos(tilt) - ey * Math.sin(tilt);
    const qy = y + ex * Math.sin(tilt) + ey * Math.cos(tilt);
    light(ctx, qx, qy, 14, color, alpha * (Math.sin(an) > 0 ? 1 : 0.4));
  }
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 06 — d2-decision-fed-ecart-taux
 * Acte I   : 0,71 $ US tracé au scalpel, la glissade sur la règle
 * Acte II  : la masse américaine grossit — orbite haute (taux élevés)
 * Acte III : la masse canadienne s'essouffle — l'orbite descend
 * Acte IV  : le flux de capitaux quitte le huard pour le billet vert
 * ════════════════════════════════════════════════════════════════════════ */

function sceneFed(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, {
    gl: 'glissade', s71: 'soixante', que: 'Que s', us: 'Aux États', fed: 'Réserve', pend: 'Pendant',
    bdc: 'Banque du', marches: 'Sur les marchés', rapporte: 'rapporte', vend: 'vendent'
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 100, alpha: 0.4 });

    // ── Acte I : le chiffre chirurgical + la règle de précision ──
    const a1 = 1 - smooth(seg(p, T.que - 0.2 * s1, T.que + 0.8 * s1));
    const numY = lerp(cy + m * 0.06, V ? h * 0.12 : h * 0.13, eInOutQuart(seg(p, T.que - 0.2 * s1, T.que + 1 * s1)));
    const numSize = lerp(m * 0.24, m * 0.075, eInOutQuart(seg(p, T.que - 0.2 * s1, T.que + 1 * s1)));
    const numA = Math.max(a1, 1 - smooth(seg(p, T.marches - 0.3 * s1, T.marches + 0.3 * s1)));
    strokeText(ctx, '0,71 $ US', cx, numY, {
      size: numSize, weight: 800, color: C.white, t: seg(p, 0.01, 0.01 + 2.6 * s1), fill: seg(p, 0.01 + 2.0 * s1, 0.01 + 3.2 * s1),
      glow: 18, alpha: numA, lw: 1.6
    });
    if (a1 > 0.003) {
      mono(ctx, 'DOLLAR CANADIEN', cx, cy - m * 0.2, { size: m * 0.022, color: C.cyan, t: seg(p, 0.02, 0.02 + 1.2 * s1), alpha: a1 });
      // Règle graduée 0,70 → 0,76
      const rx = V ? w * 0.86 : cx + m * 0.62;
      const top = cy - m * 0.3;
      const bot = cy + m * 0.3;
      const val2y = (v) => lerp(bot, top, (v - 0.7) / 0.06);
      ctx.save();
      ctx.globalAlpha *= a1 * smooth(seg(p, 0.03, 0.03 + 1 * s1));
      ctx.strokeStyle = rgba(C.ice, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const y = lerp(bot, top, k / 60);
        const len = k % 10 === 0 ? 22 : k % 5 === 0 ? 14 : 7;
        ctx.moveTo(rx, y);
        ctx.lineTo(rx - len, y);
      }
      ctx.moveTo(rx, top);
      ctx.lineTo(rx, bot);
      ctx.stroke();
      ctx.restore();
      for (let k = 0; k <= 6; k++) mono(ctx, frNum(0.7 + k * 0.01, 2), rx + 16, val2y(0.7 + k * 0.01), { size: m * 0.014, align: 'left', color: C.ice, alpha: a1 * 0.6, spacing: 1 });
      const v = lerp(0.752, 0.71, eInOutQuart(seg(p, T.gl - 0.1 * s1, T.s71 + 0.6 * s1)));
      const my = val2y(v);
      light(ctx, rx - 10, my, 26, C.cyan, a1);
      ctx.save();
      ctx.globalAlpha *= a1;
      ctx.fillStyle = C.cyan;
      ctx.beginPath();
      ctx.moveTo(rx - 34, my);
      ctx.lineTo(rx - 50, my - 9);
      ctx.lineTo(rx - 50, my + 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // ── Actes II–IV : deux masses gravitationnelles ──
    const a2 = smooth(seg(p, T.que, T.us + 0.4 * s1));
    if (a2 > 0.003) {
      const caPos = V ? { x: cx, y: cy - h * 0.15 } : { x: cx - w * 0.24, y: cy + m * 0.04 };
      const usPos = V ? { x: cx, y: cy + h * 0.2 } : { x: cx + w * 0.22, y: cy + m * 0.04 };
      const usGrow = 1 + 0.38 * eOutBack(seg(p, T.us + 0.2 * s1, T.us + 1.6 * s1), 1.2);
      const caShrink = 1 - 0.18 * eInOut(seg(p, T.pend + 0.2 * s1, T.pend + 1.6 * s1));
      const rUS = m * 0.15 * usGrow * eOutCubic(a2);
      const rCA = m * 0.15 * caShrink * eOutCubic(a2);
      dotSphere(ctx, caPos.x, caPos.y, rCA, gt, { color: C.cyan, alpha: a2, spin: 0.3 });
      dotSphere(ctx, usPos.x, usPos.y, rUS, gt + 4, { color: C.amber, alpha: a2, spin: 0.22 });
      // Orbites des taux
      const usOrbit = rUS * lerp(1.25, 1.75, eOutCubic(seg(p, T.fed, T.fed + 1.4 * s1)));
      const caOrbit = rCA * lerp(1.7, 1.18, eInOutQuart(seg(p, T.bdc, T.bdc + 1.6 * s1)));
      orbit(ctx, usPos.x, usPos.y, usOrbit, gt, { color: C.amber, alpha: a2 * seg(p, T.fed - 0.3 * s1, T.fed + 0.5 * s1) });
      orbit(ctx, caPos.x, caPos.y, caOrbit, gt + 2, { color: C.cyan, alpha: a2 * seg(p, T.pend - 0.2 * s1, T.pend + 0.6 * s1) });
      const labA = a2 * (1 - smooth(seg(p, T.rapporte - 0.4 * s1, T.rapporte)));
      const lx = (pos, r) => (V ? pos.x + r + m * 0.08 : pos.x);
      const ly = (pos, r) => (V ? pos.y : pos.y + r + m * 0.12);
      mono(ctx, 'ÉTATS-UNIS', lx(usPos, rUS), ly(usPos, rUS), { size: m * 0.02, color: C.amber, align: V ? 'left' : 'center', t: seg(p, T.us, T.us + 1 * s1), alpha: labA });
      mono(ctx, 'CANADA', lx(caPos, rCA), ly(caPos, rCA), { size: m * 0.02, color: C.cyan, align: V ? 'left' : 'center', t: seg(p, T.pend, T.pend + 0.8 * s1), alpha: labA });
      const fedA = a2 * env(p, T.fed, T.marches, 0.4 * s1, 0.5 * s1);
      kinetic(ctx, 'TAUX ↑', usPos.x, usPos.y - usOrbit * 0.3 - rUS - m * 0.06, { size: m * 0.06, weight: 900, t: seg(p, T.fed, T.fed + 0.8 * s1), alpha: fedA, color: C.amber });
      const bdcA = a2 * env(p, T.bdc, T.marches, 0.4 * s1, 0.5 * s1);
      kinetic(ctx, 'TAUX ↓', caPos.x, caPos.y - caOrbit * 0.3 - rCA - m * 0.06, { size: m * 0.06, weight: 900, t: seg(p, T.bdc, T.bdc + 0.8 * s1), alpha: bdcA, color: C.cyan });

      // Flux de capitaux : du huard vers le billet vert
      const flow = smooth(seg(p, T.marches - 0.2 * s1, T.marches + 1 * s1));
      if (flow > 0.003) {
        const parts = cached('fedFlow', () => {
          const r = rng(31);
          return Array.from({ length: 260 }, () => [r(), r() * 2 - 1, 0.5 + r()]);
        });
        const intensity = flow * (0.4 + 0.6 * smooth(seg(p, T.vend - 0.2 * s1, T.vend + 1 * s1)));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < parts.length; i++) {
          if (i / parts.length > intensity) continue;
          const [u0, lane, sp] = parts[i];
          const u = (u0 + gt * 0.16 * sp) % 1;
          const e = u * u * (3 - 2 * u) * 0.25 + u * u * 0.75; // accélération gravitationnelle
          const ax = caPos.x;
          const ay = caPos.y;
          const bx = usPos.x;
          const by = usPos.y;
          const nx = -(by - ay);
          const ny = bx - ax;
          const nl = Math.hypot(nx, ny);
          const bend = Math.sin(Math.PI * e) * lane * m * 0.16;
          const x = lerp(ax, bx, e) + (nx / nl) * bend;
          const y = lerp(ay, by, e) + (ny / nl) * bend;
          const col = mix(C.cyan, C.amber, e);
          ctx.globalAlpha = 0.85 * (1 - Math.pow(u, 8));
          ctx.fillStyle = col;
          ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
          if (i % 7 === 0) light(ctx, x, y, 12, col, 0.4);
        }
        ctx.restore();
        const msgA = env(p, T.rapporte - 0.2 * s1, 1, 0.4 * s1, 0.1 * s1);
        kinetic(ctx, "L'ARGENT SUIT LE RENDEMENT", cx, V ? h * 0.88 : h * 0.86, { size: m * 0.06, weight: 900, t: seg(p, T.rapporte - 0.1 * s1, T.rapporte + 1.1 * s1), alpha: msgA, maxW: w * 0.86 });
        mono(ctx, '$ CA  →  $ US', cx, V ? h * 0.025 + h * 0.1 : h * 0.13, { size: m * 0.03, weight: 600, color: C.white, t: seg(p, T.vend, T.vend + 1 * s1), alpha: smooth(seg(p, T.vend - 0.1 * s1, T.vend + 0.4 * s1)) });
      }
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 07 — d2-deux-cotes-banques-centrales
 * Acte I   : l'horizon se tend comme une corde — deux écoles
 * Acte II  : camp 1 : le toit québécois respire (hypothèques, exportateurs)
 * Acte III : camp 2 : la flèche de l'inflation importée s'élève
 * ════════════════════════════════════════════════════════════════════════ */

/** Maison québécoise : toit à deux versants avec larmier retroussé (coyau) et lucarnes. */
function quebecHouse(ctx, x, y, s, o = {}) {
  const { color = C.cyan, alpha = 1, breathe = 0, light: lit = 1 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.translate(x, y);
  const k = 1 + breathe;
  ctx.scale(k, k);
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.6, s * 0.018);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.12;
  ctx.fillStyle = 'rgba(3,5,9,0.85)';
  const W = s;
  const wallH = s * 0.42;
  const ridge = -s * 0.98;
  // Murs
  ctx.beginPath();
  ctx.rect(-W * 0.42, -wallH, W * 0.84, wallH);
  ctx.fill();
  ctx.stroke();
  // Toit à larmier retroussé
  ctx.beginPath();
  ctx.moveTo(-W * 0.6, -wallH + s * 0.02);
  ctx.quadraticCurveTo(-W * 0.42, -wallH - s * 0.06, -W * 0.34, -wallH - s * 0.16);
  ctx.lineTo(-W * 0.12, ridge);
  ctx.lineTo(W * 0.12, ridge);
  ctx.lineTo(W * 0.34, -wallH - s * 0.16);
  ctx.quadraticCurveTo(W * 0.42, -wallH - s * 0.06, W * 0.6, -wallH + s * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Lucarnes
  for (const lx of [-W * 0.18, W * 0.18]) {
    ctx.beginPath();
    ctx.moveTo(lx - s * 0.07, -wallH - s * 0.2);
    ctx.lineTo(lx - s * 0.07, -wallH - s * 0.32);
    ctx.lineTo(lx, -wallH - s * 0.4);
    ctx.lineTo(lx + s * 0.07, -wallH - s * 0.32);
    ctx.lineTo(lx + s * 0.07, -wallH - s * 0.2);
    ctx.stroke();
  }
  // Cheminées
  ctx.beginPath();
  ctx.rect(-W * 0.11, ridge - s * 0.12, s * 0.06, s * 0.12);
  ctx.rect(W * 0.05, ridge - s * 0.12, s * 0.06, s * 0.12);
  ctx.stroke();
  // Porte et fenêtres éclairées
  ctx.shadowBlur = 0;
  ctx.strokeRect(-s * 0.05, -s * 0.2, s * 0.1, s * 0.2);
  ctx.fillStyle = rgba(C.gold, 0.85 * lit);
  for (const fx of [-W * 0.3, -W * 0.18, W * 0.12, W * 0.24]) ctx.fillRect(fx, -wallH * 0.72, s * 0.07, s * 0.1);
  ctx.restore();
}

function sceneTwoSchools(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, { ecoles: 'deux écoles', p1: 'premier camp', baisse: 'baisse rapide', hyp: 'hypothèque', exp: 'exportatrices', p2: 'deuxième camp', infl: 'inflation', elec: 'électronique', nour: 'nourriture' });

  frame(a, () => {
    const tA = smooth(seg(p, 0.0, 0.0 + 1.0 * s1));
    // Teintes des deux camps
    const left = env(p, T.p1, T.p2 + 0.4 * s1, 0.8 * s1, 0.8 * s1);
    const right = smooth(seg(p, T.p2 - 0.2 * s1, T.p2 + 1 * s1));
    light(ctx, cx - w * 0.28, cy, m * 0.9, C.cyan, 0.07 + 0.12 * left);
    light(ctx, cx + w * 0.28, cy, m * 0.9, C.amber, 0.07 + 0.12 * right);

    // Bascule de l'horizon (le camp qui parle « pèse » plus lourd)
    const settle = smooth(seg(p, 1 - 1.4 * s1, 1 - 0.4 * s1));
    const tilt = (0.07 * left - 0.07 * right * (1 - settle)) * (1 - settle * 0.0);
    const span = (V ? w : w) * 0.47 * eOutExpo(seg(p, 0.01, 0.01 + 1.4 * s1));
    // Corde tendue : onde stationnaire amortie
    const pluck = Math.max(0, (p - 0.01) * scene.duration);
    const amp = m * 0.04 * Math.exp(-pluck * 1.4) + m * 0.01 * Math.exp(-Math.max(0, (p - T.p2) * scene.duration) * 1.6) * (p > T.p2 ? 1 : 0);
    const horizonY = (x) => cy + m * 0.12 + (x - cx) * Math.tan(tilt);
    ctx.save();
    ctx.globalAlpha *= tA;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const [lw, al] of [[8, 0.1], [2, 0.9]]) {
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const u = i / 120;
        const x = cx - span + 2 * span * u;
        const y = horizonY(x) + Math.sin(Math.PI * u) * Math.sin(pluck * 18) * amp;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      const g = ctx.createLinearGradient(cx - span, 0, cx + span, 0);
      g.addColorStop(0, rgba(C.cyan, 0));
      g.addColorStop(0.2, rgba(C.cyan, al));
      g.addColorStop(0.5, rgba(C.white, al));
      g.addColorStop(0.8, rgba(C.amber, al));
      g.addColorStop(1, rgba(C.amber, 0));
      ctx.strokeStyle = g;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
    ctx.restore();
    light(ctx, cx, horizonY(cx), m * 0.05, C.white, 0.5 * tA);

    const intro = env(p, 0.01, T.p1 + 0.2 * s1, 0.6 * s1, 0.5 * s1);
    kinetic(ctx, 'DEUX ÉCOLES', cx, V ? h * 0.3 : h * 0.3, { size: m * 0.1, weight: 900, t: seg(p, T.ecoles, T.ecoles + 1.2 * s1), alpha: intro });

    // ── Camp 1 : la maison québécoise respire ──
    const hx = cx - (V ? w * 0.24 : w * 0.24);
    const houseA = smooth(seg(p, T.p1 - 0.2 * s1, T.p1 + 0.8 * s1));
    if (houseA > 0.003) {
      const relief = smooth(seg(p, T.hyp - 0.3 * s1, T.hyp + 1.4 * s1));
      quebecHouse(ctx, hx, horizonY(hx) - 2, m * (V ? 0.26 : 0.3), { color: C.cyan, alpha: houseA, breathe: relief * 0.03 * Math.sin(gt * 2.2), light: 0.4 + 0.6 * relief });
      if (relief > 0) light(ctx, hx, horizonY(hx) - m * 0.15, m * 0.3, C.cyan, relief * 0.25);
      // Taux qui descendent : pile de chevrons cyan (miroir de l'inflation)
      const down = eOutCubic(seg(p, T.baisse - 0.2 * s1, T.baisse + 1.6 * s1)) * (1 - right * 0.7);
      const dn = Math.round(6 * down);
      const dx = hx + m * (V ? 0.2 : 0.24);
      for (let k = 0; k < dn; k++) {
        const y = horizonY(dx) - m * 0.36 + k * m * 0.05;
        const sz = m * 0.036;
        ctx.save();
        ctx.globalAlpha *= houseA * (1 - k / 7) * down;
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = C.cyan;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(dx - sz, y - sz * 0.4);
        ctx.lineTo(dx, y + sz * 0.3 + Math.sin(gt * 3 + k) * 2);
        ctx.lineTo(dx + sz, y - sz * 0.4);
        ctx.stroke();
        ctx.restore();
      }
      // Exportateurs : chevrons qui partent vers l'extérieur
      const ex = smooth(seg(p, T.exp - 0.2 * s1, T.exp + 0.6 * s1)) * (1 - right);
      if (ex > 0.003) {
        for (let k = 0; k < 3; k++) {
          const u = (gt * 0.4 + k / 3) % 1;
          chevrons(ctx, hx - m * 0.22 - u * m * 0.25, horizonY(hx) - m * 0.08, m * 0.05, { alpha: ex * (1 - u), dir: -1, colors: [C.cyan, C.ice, C.cyan] });
        }
      }
    }
    const kwPosL = V ? { x: cx, y: h * 0.24 } : { x: hx, y: h * 0.2 };
    const kwPosR = V ? { x: cx, y: h * 0.24 } : { x: cx + w * 0.24, y: h * 0.2 };
    const mW = V ? w * 0.86 : w * 0.42;
    [
      [T.p1, T.hyp, 'BAISSER LES TAUX'],
      [T.hyp, T.exp, 'HYPOTHÈQUES SOULAGÉES'],
      [T.exp, T.p2, 'EXPORTATEURS GAGNANTS']
    ].forEach(([s, e, txt]) => {
      const al = env(p, s - 0.1 * s1, e - 0.1 * s1, 0.3 * s1, 0.3 * s1);
      if (al > 0.003) kinetic(ctx, txt, kwPosL.x, kwPosL.y, { size: m * 0.058, weight: 900, t: seg(p, s, s + 0.8 * s1), alpha: al, color: C.white, maxW: mW });
    });
    mono(ctx, 'CAMP 1', kwPosL.x, kwPosL.y - m * 0.08, { size: m * 0.02, color: C.cyan, alpha: left, t: seg(p, T.p1, T.p1 + 0.6 * s1) });

    // ── Camp 2 : la flèche d'inflation importée ──
    const ax = cx + w * 0.24;
    const arrA = smooth(seg(p, T.p2 - 0.1 * s1, T.p2 + 0.6 * s1));
    if (arrA > 0.003) {
      const rise = eOutCubic(seg(p, T.p2, T.infl + 1.2 * s1));
      const n = Math.max(1, Math.round(9 * rise));
      const base = horizonY(ax) - 10;
      for (let k = 0; k < n; k++) {
        const y = base - k * m * 0.055;
        const col = mix(C.amber, C.coral, k / 9);
        const s = m * 0.05;
        ctx.save();
        ctx.globalAlpha *= arrA * (0.35 + 0.65 * (k / 9));
        ctx.strokeStyle = col;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = col;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(ax - s, y + s * 0.5);
        ctx.lineTo(ax, y - s * 0.2 - Math.sin(gt * 3 + k) * 2);
        ctx.lineTo(ax + s, y + s * 0.5);
        ctx.stroke();
        ctx.restore();
      }
      const topY = base - n * m * 0.055;
      light(ctx, ax, topY, m * 0.08, C.coral, arrA * 0.7);
      // Électronique → nourriture
      const icoY = topY + m * 0.02;
      const ax0 = ax;
      { const ax = ax0 + m * (V ? 0.14 : 0.11);
      const ph = env(p, T.elec - 0.1 * s1, T.nour, 0.3 * s1, 0.3 * s1);
      const ap = smooth(seg(p, T.nour - 0.1 * s1, T.nour + 0.4 * s1));
      if (ph > 0.003) {
        ctx.save();
        ctx.globalAlpha *= ph * arrA;
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(ax - m * 0.022, icoY - m * 0.04, m * 0.044, m * 0.08, m * 0.008);
        ctx.stroke();
        ctx.restore();
      }
      if (ap > 0.003) {
        ctx.save();
        ctx.globalAlpha *= ap * arrA;
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ax - m * 0.014, icoY + m * 0.006, m * 0.026, 0, TAU);
        ctx.arc(ax + m * 0.014, icoY + m * 0.006, m * 0.026, 0, TAU);
        ctx.moveTo(ax, icoY - m * 0.02);
        ctx.quadraticCurveTo(ax + m * 0.01, icoY - m * 0.05, ax + m * 0.03, icoY - m * 0.055);
        ctx.stroke();
        ctx.restore();
      }
      }
    }
    [
      [T.p2, T.infl, "SONNETTE D'ALARME"],
      [T.infl, T.elec, 'INFLATION IMPORTÉE'],
      [T.elec, 1, 'TOUT CE QU’ON IMPORTE']
    ].forEach(([s, e, txt]) => {
      const al = env(p, s - 0.1 * s1, e - 0.1 * s1, 0.3 * s1, 0.3 * s1);
      if (al > 0.003) kinetic(ctx, txt, kwPosR.x, kwPosR.y, { size: m * 0.058, weight: 900, t: seg(p, s, s + 0.8 * s1), alpha: al, color: C.white, maxW: mW });
    });
    mono(ctx, 'CAMP 2', kwPosR.x, kwPosR.y - m * 0.08, { size: m * 0.02, color: C.amber, alpha: right, t: seg(p, T.p2, T.p2 + 0.6 * s1) });
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 08 — d2-mecanisme-importations-hiver
 * Acte I   : la roue de l'année — la saison des récoltes s'éteint, le givre
 * Acte II  : 70 % de nos fruits et légumes d'hiver viennent du Sud
 * Acte III : à la frontière, chaque cargaison se libelle en dollars US
 * ════════════════════════════════════════════════════════════════════════ */

function sceneWinterImports(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, { mi: 'mi-novembre', rec: 'récoltes', nov: 'De novembre', s70: 'soixante-dix', mtl: 'Montréal', cal: 'Californie', ari: 'Arizona', flo: 'Floride', mex: 'Mexique', or: 'Or, même', fact: 'facturé' });

  frame(a, () => {
    // Givre qui tombe
    const frost = smooth(seg(p, T.rec - 0.2 * s1, T.rec + 1.4 * s1));
    if (frost > 0.01) {
      const flakes = cached('flakes', () => {
        const r = rng(8);
        return Array.from({ length: 140 }, () => [r(), r(), 0.3 + r() * 0.7]);
      });
      ctx.save();
      ctx.fillStyle = C.ice;
      for (const [fx, fy, z] of flakes) {
        const x = ((fx + Math.sin(gt * 0.4 + fy * 9) * 0.01) % 1) * w;
        const y = (((fy + gt * 0.035 * z) % 1) + 1) % 1 * h;
        ctx.globalAlpha = frost * 0.5 * z;
        ctx.fillRect(x, y, 1.5 + z * 2, 1.5 + z * 2);
      }
      ctx.restore();
    }

    // ── Acte I : la roue de l'année ──
    const wheelOut = eInOutQuart(seg(p, T.nov + 0.6 * s1, T.s70 + 0.2 * s1));
    const wR = lerp(m * 0.3, m * 0.12, wheelOut);
    const wX = lerp(cx, V ? cx : w * 0.16, wheelOut);
    const wY = lerp(cy, V ? h * 0.13 : h * 0.24, wheelOut);
    const wA = 1 - smooth(seg(p, T.s70 - 0.2 * s1, T.s70 + 0.6 * s1));
    if (wA > 0.003) {
      const mAng = (mo) => -Math.PI / 2 + (mo / 12) * TAU;
      ctx.save();
      ctx.globalAlpha *= wA;
      ctx.strokeStyle = rgba(C.ice, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let d = 0; d < 365; d += 1) {
        const an = -Math.PI / 2 + (d / 365) * TAU;
        const len = d % 30 === 0 ? 14 : 5;
        ctx.moveTo(wX + Math.cos(an) * wR, wY + Math.sin(an) * wR);
        ctx.lineTo(wX + Math.cos(an) * (wR - len * (wR / (m * 0.3))), wY + Math.sin(an) * (wR - len * (wR / (m * 0.3))));
      }
      ctx.stroke();
      ctx.restore();
      const letters = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      letters.forEach((L, i) => {
        const an = mAng(i + 0.5);
        mono(ctx, L, wX + Math.cos(an) * wR * 1.16, wY + Math.sin(an) * wR * 1.16, { size: Math.max(10, wR * 0.07), color: C.slate, alpha: wA * 0.7, spacing: 0 });
      });
      // Saison de récolte (mai → octobre) qui s'éteint
      const grow = smooth(seg(p, 0.01, 0.01 + 1.4 * s1)) * (1 - frost * 0.85);
      ring(ctx, wX, wY, wR * 0.86, { color: C.emerald, width: wR * 0.05, a0: mAng(4), sweep: (6 / 12) * TAU * eOutCubic(seg(p, 0.01, 0.01 + 1.6 * s1)), alpha: wA * grow, glow: 18 });
      // Hiver (novembre → avril) qui s'allume en cyan
      const win = eInOut(seg(p, T.nov - 0.1 * s1, T.nov + 1.4 * s1));
      ring(ctx, wX, wY, wR * 0.86, { color: C.cyan, width: wR * 0.05, a0: mAng(10), sweep: (6 / 12) * TAU * win, alpha: wA, glow: 22 });
      // Repère mi-novembre
      const an = mAng(10.5);
      const mk = seg(p, T.mi - 0.1 * s1, T.mi + 0.5 * s1);
      beacon(ctx, wX + Math.cos(an) * wR * 0.86, wY + Math.sin(an) * wR * 0.86, { color: C.white, r: Math.max(4, wR * 0.03), time: gt, alpha: wA * mk });
      const centerA = wA * (1 - wheelOut);
      mono(ctx, 'MI-NOVEMBRE', wX, wY - wR * 0.12, { size: m * 0.022, color: C.white, t: seg(p, T.mi, T.mi + 1 * s1), alpha: centerA * (1 - smooth(seg(p, T.rec - 0.2 * s1, T.rec))) });
      kinetic(ctx, 'RÉCOLTES', wX, wY + wR * 0.02, { size: m * 0.055, weight: 900, t: seg(p, T.rec, T.rec + 0.8 * s1), alpha: centerA, color: C.white });
      kinetic(ctx, 'TERMINÉES', wX, wY + wR * 0.2, { size: m * 0.055, weight: 900, t: seg(p, T.rec + 0.2 * s1, T.rec + 1 * s1), alpha: centerA, color: C.ice });
    }

    // ── Acte II : la carte du Sud vers le Saint-Laurent ──
    const mapA = smooth(seg(p, T.nov + 0.4 * s1, T.s70 + 0.6 * s1));
    if (mapA > 0.003) {
      const P = V ? makeFlat(-96, 36, 0.02 * m, cx, cy + h * 0.1) : makeFlat(-96, 34, 0.027 * m, cx - w * 0.1, cy + m * 0.04);
      drawFlatDots(ctx, P, stage, { color: C.cyan, alpha: mapA * 0.9 });
      drawQuebec(ctx, P, { color: C.cyan, alpha: mapA * 0.8, fill: 0.08, line: 1.6, glow: 0.6 });
      const mtl = P.project(...PLACES.montreal);
      beacon(ctx, mtl.x, mtl.y, { color: C.cyan, r: 8, time: gt, alpha: mapA * seg(p, T.mtl - 0.2 * s1, T.mtl + 0.4 * s1) });
      mono(ctx, 'MONTRÉAL · QUÉBEC', mtl.x + 24, mtl.y - 30, { size: m * 0.016, align: 'left', color: C.ice, t: seg(p, T.mtl, T.mtl + 1 * s1), alpha: mapA * (1 - smooth(seg(p, T.or, T.or + 0.5 * s1))) });
      // Frontière canado-américaine (pointillés)
      const border = [[-123, 49], [-95, 49], [-89, 48], [-84, 46.5], [-82.5, 45], [-79, 43.4], [-76.5, 44.2], [-74.7, 45], [-71.5, 45], [-70.3, 45.9], [-69.2, 47.4], [-67.8, 47.1], [-67.8, 45.6]].map((q) => ({ ...P.project(q[0], q[1]), vis: true }));
      trail(ctx, border, 1, { color: C.white, width: 1.2, alpha: mapA * 0.35 * smooth(seg(p, T.or - 0.4 * s1, T.or + 0.4 * s1)), dash: [3, 7], head: false, glow: 0 });
      const origins = [
        [PLACES.california, T.cal, 'CALIFORNIE'],
        [PLACES.arizona, T.ari, 'ARIZONA'],
        [PLACES.florida, T.flo, 'FLORIDE'],
        [PLACES.mexico, T.mex, 'MEXIQUE']
      ];
      origins.forEach(([o, cue, name], i) => {
        const op = P.project(o[0], o[1]);
        const ctrl = { x: (op.x + mtl.x) / 2 + (i === 2 ? m * 0.12 : -m * 0.04), y: Math.min(op.y, mtl.y) - m * (0.08 + i * 0.02) };
        const pts = [];
        for (let k = 0; k <= 50; k++) {
          const t = k / 50;
          pts.push({ x: (1 - t) ** 2 * op.x + 2 * (1 - t) * t * ctrl.x + t * t * mtl.x, y: (1 - t) ** 2 * op.y + 2 * (1 - t) * t * ctrl.y + t * t * mtl.y, vis: true });
        }
        const dr = eInOut(seg(p, cue - 0.1 * s1, cue + 1.2 * s1));
        trail(ctx, pts, dr, { color: C.coral, width: 2.6, alpha: mapA });
        beacon(ctx, op.x, op.y, { color: C.coral, r: 6, time: gt + i, alpha: mapA * seg(p, cue - 0.1 * s1, cue + 0.3 * s1) });
        mono(ctx, name, op.x, op.y + 28, { size: m * 0.016, color: C.coral, t: seg(p, cue, cue + 0.7 * s1), alpha: mapA * (1 - smooth(seg(p, T.fact - 0.3 * s1, T.fact))) });
        // Acte III : cargaisons qui franchissent la frontière et deviennent des $ US
        const cargo = smooth(seg(p, T.or - 0.2 * s1, T.or + 0.6 * s1)) * (dr >= 1 ? 1 : 0);
        if (cargo > 0.01) {
          for (let k = 0; k < 4; k++) {
            const u = (gt * 0.22 + k / 4 + i * 0.11) % 1;
            const q = pts[Math.floor(u * 50)];
            const usd = u > 0.72;
            if (usd) {
              ctx.save();
              ctx.globalAlpha *= cargo * mapA;
              setFont(ctx, 800, m * 0.024);
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = C.amber;
              ctx.shadowColor = C.amber;
              ctx.shadowBlur = 12;
              ctx.fillText('$', q.x, q.y);
              ctx.restore();
            } else light(ctx, q.x, q.y, 12, k % 2 ? C.emerald : C.coral, cargo * mapA);
          }
        }
      });
    }

    // Jauge 70 % : un cercle pur rempli de lumière corail
    const gA = smooth(seg(p, T.s70 - 0.2 * s1, T.s70 + 0.6 * s1)) * (1 - smooth(seg(p, T.or - 0.3 * s1, T.or + 0.3 * s1)));
    const gx = V ? cx : w * 0.8;
    const gy = V ? h * 0.2 : cy - m * 0.04;
    const gr = m * (V ? 0.12 : 0.16);
    if (gA > 0.003) {
      ring(ctx, gx, gy, gr, { color: C.slate, width: 2, alpha: gA * 0.25 });
      ring(ctx, gx, gy, gr, { color: C.coral, width: gr * 0.1, sweep: TAU * 0.7 * eOutCubic(seg(p, T.s70, T.s70 + 1.6 * s1)), alpha: gA, glow: 26 });
      const k = eOutExpo(seg(p, T.s70, T.s70 + 1.6 * s1));
      kinetic(ctx, `${Math.round(70 * k)} %`, gx, gy + gr * 0.18, { size: gr * 0.55, weight: 900, t: 1, alpha: gA });
      mono(ctx, 'IMPORTÉS', gx, gy + gr * 0.42, { size: m * 0.016, color: C.coral, t: seg(p, T.s70 + 0.4 * s1, T.s70 + 1.2 * s1), alpha: gA });
    }
    // Facturé en $ US
    const fA = smooth(seg(p, T.or + 0.6 * s1, T.or + 1.4 * s1));
    if (fA > 0.003) {
      const fx = V ? cx : w * 0.8;
      const fy = V ? h * 0.2 : cy - m * 0.02;
      ring(ctx, fx, fy, m * 0.13, { color: C.amber, width: 3, alpha: fA, glow: 24 });
      ring(ctx, fx, fy, m * 0.115, { color: C.amber, width: 1, alpha: fA * 0.5, dash: [2, 6] });
      kinetic(ctx, '$ US', fx, fy + m * 0.035, { size: m * 0.085, weight: 900, t: seg(p, T.or + 0.6 * s1, T.or + 1.4 * s1), alpha: fA, color: C.amber });
      kinetic(ctx, 'FACTURÉ EN DOLLARS US', fx, fy + m * (V ? 0.22 : 0.24), { size: m * (V ? 0.05 : 0.04), weight: 900, t: seg(p, T.fact - 0.2 * s1, T.fact + 0.8 * s1), alpha: fA * smooth(seg(p, T.fact - 0.3 * s1, T.fact + 0.2 * s1)), maxW: V ? w * 0.86 : w * 0.34 });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 09 — d2-impact-quebec-familles
 * Acte I   : une seule courbe traverse l'écran
 * Acte II  : le huard perd 5 ¢ — son ombre ambre s'élève en miroir : +7 %
 * Acte III : le camion frigorifique remonte le continent (diesel ↑)
 * Acte IV  : une famille de 4 — plusieurs centaines de dollars par année
 * ════════════════════════════════════════════════════════════════════════ */

function familyFigure(ctx, x, y, s, color, alpha) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.3;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.78, s * 0.2, 0, TAU);
  ctx.moveTo(x - s * 0.36, y);
  ctx.bezierCurveTo(x - s * 0.36, y - s * 0.5, x + s * 0.36, y - s * 0.5, x + s * 0.36, y);
  ctx.stroke();
  ctx.restore();
}

function sceneFamilies(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, { quand: 'Quand', c5: 'cinq sous', taxe: 'taxe', s7: 'sept pour', diesel: 'diesel', camions: 'camions', fam: 'Pour une famille', eco: 'économistes', cent: 'centaines' });

  const famShift = eInOutQuart(seg(p, T.fam - 0.5 * s1, T.fam + 0.9 * s1));
  frame(a, () => {
    const y0 = (V ? h * 0.42 : cy + m * 0.02) - famShift * m * (V ? 0.12 : 0.18);
    const drop = eInOutQuart(seg(p, T.c5 - 0.2 * s1, T.c5 + 1.6 * s1));
    const D = m * 0.16 * drop;
    const sig = (x) => 1 / (1 + Math.exp(-(x / w - 0.5) * 9));
    const yC = (x) => y0 + Math.sin(x * 0.006 + gt * 0.6) * m * 0.008 + D * sig(x);
    const yA = (x) => 2 * y0 - yC(x);
    const draw = eInOut(seg(p, 0.0, 0.0 + 2.6 * s1));
    const mirror = eInOut(seg(p, T.taxe - 0.4 * s1, T.s7 + 0.6 * s1));
    const N = 160;

    // Ruban lumineux entre la courbe du huard et son ombre ambre
    if (mirror > 0.003) {
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w;
        ctx.lineTo(x, lerp(y0, yA(x), mirror));
      }
      for (let i = N; i >= 0; i--) {
        const x = (i / N) * w;
        ctx.lineTo(x, yC(x));
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(0, y0 - D, 0, y0 + D);
      g.addColorStop(0, rgba(C.amber, 0.28));
      g.addColorStop(0.5, rgba(C.coral, 0.06));
      g.addColorStop(1, rgba(C.cyan, 0.18));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      const ptsA = [];
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w;
        ptsA.push({ x, y: lerp(y0, yA(x), mirror), vis: true });
      }
      trail(ctx, ptsA, 1, { color: C.amber, width: 3, alpha: mirror, head: false });
    }
    const ptsC = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      ptsC.push({ x, y: yC(x), vis: true });
    }
    trail(ctx, ptsC, draw, { color: C.cyan, width: 3.5, alpha: 1 });
    mono(ctx, 'HUARD', w * 0.06, y0 - m * 0.04, { size: m * 0.018, align: 'left', color: C.cyan, t: seg(p, 0.02, 0.02 + 1 * s1), alpha: 1 - famShift });

    // −5 ¢ : la cote de la chute
    const c5A = smooth(seg(p, T.c5, T.c5 + 0.6 * s1)) * (1 - famShift);
    if (c5A > 0.003) {
      const xr = w * 0.9;
      dimension(ctx, xr, y0, xr, yC(xr), { color: C.cyan, t: seg(p, T.c5 + 0.2 * s1, T.c5 + 1.2 * s1), alpha: c5A, tick: 12 });
      mono(ctx, '−5 ¢', xr - 24, (y0 + yC(xr)) / 2, { size: m * 0.03, weight: 600, align: 'right', color: C.cyan, alpha: c5A, t: seg(p, T.c5 + 0.4 * s1, T.c5 + 1.2 * s1) });
    }
    // +7 % : la taxe invisible
    const txA = env(p, T.taxe - 0.1 * s1, T.fam - 0.2 * s1, 0.4 * s1, 0.5 * s1);
    if (txA > 0.003) {
      const tx = V ? cx : w * 0.3;
      const ty = V ? h * 0.2 : h * 0.22;
      mono(ctx, 'TAXE INVISIBLE', tx, ty - m * 0.1, { size: m * 0.024, weight: 600, color: C.amber, t: seg(p, T.taxe, T.taxe + 1 * s1), alpha: txA });
      const k = eOutExpo(seg(p, T.s7 - 0.1 * s1, T.s7 + 1.2 * s1));
      kinetic(ctx, `+${Math.round(7 * k)} %`, tx, ty + m * 0.06, { size: m * 0.17, weight: 900, t: seg(p, T.s7 - 0.1 * s1, T.s7 + 0.6 * s1), alpha: txA, glow: 40, glowColor: rgba(C.amber, 0.7) });
    }
    // Camion frigorifique qui remonte la courbe ambre
    const trA = env(p, T.diesel - 0.3 * s1, T.fam + 0.3 * s1, 0.4 * s1, 0.5 * s1);
    if (trA > 0.003) {
      const u = lerp(0.05, 0.95, seg(p, T.diesel - 0.3 * s1, T.fam + 0.3 * s1));
      const x = u * w;
      const y = yA(x);
      const ang = Math.atan2(yA(x + 6) - yA(x - 6), 12);
      ctx.save();
      ctx.translate(x, y - 4);
      ctx.rotate(ang);
      drawTruck(ctx, 0, 0, m * 0.13, { time: gt, alpha: trA, cold: true });
      ctx.restore();
      for (let k = 0; k < 10; k++) {
        const uu = (gt * 0.6 + k / 10) % 1;
        light(ctx, x - m * 0.08 - uu * m * 0.2, y - m * 0.02 - Math.sin(k) * m * 0.02, 7 * (1 - uu), C.ice, trA * (1 - uu));
      }
      kinetic(ctx, 'DIESEL ↑', V ? cx : w * 0.72, V ? h * 0.74 : h * 0.84, { size: m * 0.07, weight: 900, t: seg(p, T.diesel, T.diesel + 0.8 * s1), alpha: trA, color: C.white });
    }
    // ── Acte IV : la famille ──
    if (famShift > 0.003) {
      const fy = V ? h * 0.66 : h * 0.8;
      const fs = m * 0.1;
      const xs = [-1.6, -0.55, 0.4, 1.3];
      const sz = [1, 1, 0.72, 0.62];
      xs.forEach((dx, i) => familyFigure(ctx, cx + dx * fs * 0.95 - fs * 0.6, fy, fs * sz[i], i < 2 ? C.white : C.ice, famShift * seg(p, T.fam + i * 0.15 * s1, T.fam + (i * 0.15 + 0.5) * s1)));
      light(ctx, cx - fs * 0.6, fy - fs * 0.4, m * 0.3, C.amber, famShift * 0.12);
      mono(ctx, 'FAMILLE DE 4 · QUÉBEC', cx, fy + m * 0.06, { size: m * 0.02, color: C.slate, t: seg(p, T.fam, T.fam + 1.2 * s1), alpha: famShift });
      const cA = smooth(seg(p, T.cent - 0.3 * s1, T.cent + 0.4 * s1));
      kinetic(ctx, '+ CENTAINES DE $', cx, V ? h * 0.86 : fy - m * 0.24, { size: m * 0.085, weight: 900, t: seg(p, T.cent - 0.2 * s1, T.cent + 0.8 * s1), alpha: cA, glow: 34, glowColor: rgba(C.amber, 0.6), maxW: w * 0.86 });
      mono(ctx, 'PAR ANNÉE · ÉPICERIE', cx, V ? h * 0.86 + m * 0.06 : fy - m * 0.18, { size: m * 0.02, color: C.amber, t: seg(p, T.cent + 0.3 * s1, T.cent + 1.3 * s1), alpha: cA });
    }
  });
}

/** Bloc isométrique lumineux (centre de données) avec baies de serveurs. */
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

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 10 — d3-mur-electrique-ia
 * Acte I   : la grille électrique fonce vers un mur de lumière
 * Acte II  : États-Unis, Irlande, Allemagne — saturation rouge incandescente
 * Acte III : 1 méga-centre IA = une ville de 400 000 habitants
 * Acte IV  : recul : raccordements en attente, retour du charbon
 * ════════════════════════════════════════════════════════════════════════ */

function sceneAIWall(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, { course: 'course', mur: 'mur physique', us: 'Aux États', irl: 'Irlande', all: 'Allemagne', rupt: 'rupture', un: 'Un seul', q400: 'quatre cent', res: 'Résultat', racc: 'raccorder', charbon: 'charbon' });

  const heat = smooth(seg(p, T.us - 0.3 * s1, T.rupt + 0.8 * s1));
  const gridA = 1 - smooth(seg(p, T.un - 0.4 * s1, T.un + 0.6 * s1));
  frame(a, () => {
    // ── Actes I–II : la grille en perspective ──
    if (gridA > 0.003) {
      const hzY = V ? h * 0.42 : h * 0.4;
      const f = m * 0.9;
      const camH = m * 0.35;
      const zWall = 9;
      const P2 = (X, Z) => ({ x: cx + (X * f) / Z, y: hzY + camH / Z });
      const tt = p * scene.duration;
      const speed = 0.6 + 2.6 * smooth(seg(p, 0, T.rupt));
      const scroll = (tt * speed * 0.5) % 1;
      const gcol = mix(C.emerald, C.red, heat);
      ctx.save();
      ctx.globalAlpha *= gridA;
      ctx.strokeStyle = rgba(gcol, 0.55);
      ctx.lineWidth = 1.4;
      ctx.shadowColor = gcol;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let X = -10; X <= 10; X++) {
        const a0 = P2(X * 0.5, 0.6);
        const a1 = P2(X * 0.5, zWall);
        ctx.moveTo(a0.x, a0.y);
        ctx.lineTo(a1.x, a1.y);
      }
      for (let k = 0; k < 18; k++) {
        const Z = 0.6 + (k + 1 - scroll) * 0.5;
        if (Z > zWall) continue;
        const l = P2(-5, Z);
        const r = P2(5, Z);
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(r.x, r.y);
      }
      ctx.stroke();
      ctx.restore();
      // Le mur de lumière
      const wallA = gridA * smooth(seg(p, T.mur - 0.4 * s1, T.mur + 0.4 * s1));
      const wl = P2(-5, zWall);
      const wr = P2(5, zWall);
      if (wallA > 0.003) {
        // Rideau de lumière : stries verticales aux bords fondus (jamais une boîte)
        ctx.save();
        ctx.globalAlpha *= wallA;
        ctx.globalCompositeOperation = "lighter";
        const ww = wr.x - wl.x;
        for (let k = 0; k <= 60; k++) {
          const u = k / 60;
          const x = wl.x + u * ww;
          const edge = Math.pow(Math.sin(Math.PI * u), 1.5);
          const hh = m * (0.25 + 0.25 * Math.abs(Math.sin(k * 1.37 + gt * (1 + heat * 4))));
          const g = ctx.createLinearGradient(0, wl.y - hh, 0, wl.y);
          g.addColorStop(0, rgba(gcol, 0));
          g.addColorStop(1, rgba(gcol, 0.5 * edge));
          ctx.fillStyle = g;
          ctx.fillRect(x - 1.5, wl.y - hh, 3, hh);
        }
        const lg = ctx.createLinearGradient(wl.x, 0, wr.x, 0);
        lg.addColorStop(0, rgba(C.white, 0));
        lg.addColorStop(0.5, rgba(C.white, 0.9));
        lg.addColorStop(1, rgba(C.white, 0));
        ctx.fillStyle = lg;
        ctx.fillRect(wl.x, wl.y - 1, ww, 2);
        ctx.restore();
        light(ctx, cx, wl.y, m * 0.5, gcol, wallA * 0.25);
      }
      // Impulsions d'énergie qui foncent vers le mur
      const pulses = cached('aiPulses', () => {
        const r = rng(44);
        return Array.from({ length: 70 }, () => [Math.floor(r() * 21) - 10, r(), 0.6 + r() * 0.8]);
      });
      for (const [X, u0, sp] of pulses) {
        const u = (u0 + tt * 0.12 * sp * speed) % 1;
        const Z = lerp(0.8, zWall, u);
        const q = P2(X * 0.5, Z);
        const q0 = P2(X * 0.5, Math.max(0.7, Z - 0.5 - speed * 0.2));
        const sz = 10 + 30 / Z;
        const pc = mix(C.mint, C.coral, heat);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha *= gridA * (0.3 + 0.6 * u);
        ctx.strokeStyle = pc;
        ctx.lineWidth = Math.max(1.5, 6 / Z);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(q0.x, q0.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.restore();
        light(ctx, q.x, q.y, sz, pc, gridA * (0.4 + 0.6 * u));
        if (u > 0.95 && wallA > 0.1) light(ctx, q.x, wl.y - Math.random() * 0, 50, C.white, gridA * wallA * (u - 0.95) * 14);
      }
      // Points chauds : États-Unis, Irlande, Allemagne
      const hot = [
        [-2.6, 3.2, T.us, 'ÉTATS-UNIS'],
        [0.4, 5.2, T.irl, 'IRLANDE'],
        [2.4, 3.8, T.all, 'ALLEMAGNE']
      ];
      hot.forEach(([X, Z, cue, name], i) => {
        const q = P2(X, Z);
        const k = smooth(seg(p, cue - 0.2 * s1, cue + 0.5 * s1)) * gridA;
        if (k <= 0.003) return;
        const flick = 0.75 + 0.25 * Math.sin(gt * 23 + i * 5) * Math.sin(gt * 7.3 + i);
        light(ctx, q.x, q.y, m * 0.16 * (0.6 + heat * 0.6), C.red, k * flick * 0.8);
        light(ctx, q.x, q.y, m * 0.04, C.white, k * flick);
        shockwave(ctx, q.x, q.y, m * 0.12, gt + i, { color: C.coral, alpha: k * heat, period: 1.1 });
        mono(ctx, name, q.x, q.y + m * 0.07, { size: m * 0.018, color: C.white, t: seg(p, cue, cue + 0.7 * s1), alpha: k });
      });
      if (heat > 0.6) {
        ctx.save();
        ctx.globalAlpha = gridA * (heat - 0.6) * 0.25 * (0.6 + 0.4 * Math.sin(gt * 31));
        ctx.fillStyle = C.red;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
      const t1 = env(p, T.course - 0.1 * s1, T.mur - 0.1 * s1, 0.4 * s1, 0.3 * s1);
      kinetic(ctx, "LA COURSE À L'IA", cx, V ? h * 0.18 : h * 0.2, { size: m * 0.085, weight: 900, t: seg(p, T.course, T.course + 1 * s1), alpha: t1 * gridA, maxW: w * 0.86 });
      const t2 = env(p, T.mur - 0.1 * s1, T.us + 0.2 * s1, 0.3 * s1, 0.4 * s1);
      kinetic(ctx, 'UN MUR ÉLECTRIQUE', cx, V ? h * 0.18 : h * 0.2, { size: m * 0.095, weight: 900, t: seg(p, T.mur, T.mur + 0.8 * s1), alpha: t2 * gridA, glow: 36, glowColor: rgba(C.mint, 0.6), maxW: w * 0.86 });
      const t3 = env(p, T.rupt - 0.1 * s1, T.un, 0.3 * s1, 0.3 * s1);
      kinetic(ctx, 'POINT DE RUPTURE', cx, V ? h * 0.18 : h * 0.2, { size: m * 0.095, weight: 900, t: seg(p, T.rupt, T.rupt + 0.8 * s1), alpha: t3 * gridA, glow: 36, glowColor: rgba(C.red, 0.7), maxW: w * 0.86 });
    }

    // ── Acte III : 1 centre de données = 400 000 habitants ──
    const eqA = smooth(seg(p, T.un - 0.2 * s1, T.un + 0.6 * s1));
    const recede = eInOutQuart(seg(p, T.res - 0.3 * s1, T.res + 1.4 * s1));
    if (eqA > 0.003) {
      const L = V ? { x: cx, y: h * 0.3 } : { x: cx - w * 0.24, y: cy };
      const R = V ? { x: cx, y: h * 0.66 } : { x: cx + w * 0.22, y: cy };
      const sc = 1 - recede * 0.55;
      const cubeX = lerp(L.x, V ? cx : cx - w * 0.3, recede);
      const cubeY = lerp(L.y, V ? h * 0.36 : cy - m * 0.08, recede);
      isoCube(ctx, cubeX, cubeY + m * 0.04, m * 0.14 * sc, { time: gt, alpha: eqA });
      mono(ctx, '1 MÉGA-CENTRE IA', cubeX, cubeY + m * 0.24 * sc, { size: m * 0.02, color: C.mint, t: seg(p, T.un, T.un + 1 * s1), alpha: eqA * (1 - recede) });
      const cityA = eqA * (1 - recede);
      if (cityA > 0.003) {
        kinetic(ctx, '=', V ? cx : cx - w * 0.01, V ? h * 0.5 : cy + m * 0.04, { size: m * 0.12, weight: 800, t: seg(p, T.un + 0.4 * s1, T.un + 1 * s1), alpha: cityA });
        const lights = cached('city400', () => {
          const r = rng(400);
          const pts = [];
          for (let i = 0; i < 400; i++) {
            const rad = Math.sqrt(-2 * Math.log(1 - r() * 0.999)) * 0.38;
            const an = r() * TAU;
            pts.push([Math.cos(an) * rad, Math.sin(an) * rad * 0.62, r()]);
          }
          return pts.sort((A, B) => Math.hypot(A[0], A[1] / 0.62) - Math.hypot(B[0], B[1] / 0.62));
        });
        const lit = Math.floor(400 * eOutCubic(seg(p, T.un + 0.6 * s1, T.q400 + 0.6 * s1)));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const cs = m * (V ? 0.36 : 0.42);
        for (let i = 0; i < lit; i++) {
          const [lx, ly, tw] = lights[i];
          const px = R.x + lx * cs;
          const py = R.y + ly * cs;
          ctx.globalAlpha = cityA * (0.55 + 0.45 * Math.sin(gt * 2 + tw * 9));
          ctx.fillStyle = tw > 0.85 ? C.white : C.gold;
          ctx.fillRect(px - 2, py - 2, 4, 4);
        }
        ctx.restore();
        light(ctx, R.x, R.y, cs * 0.6, C.amber, cityA * 0.25 * (lit / 400));
        const cnt = Math.round(lit * 1000);
        mono(ctx, `${frNum(cnt)} HABITANTS`, R.x, R.y + cs * 0.42, { size: m * 0.026, weight: 600, color: C.gold, alpha: cityA * smooth(seg(p, T.un + 0.6 * s1, T.un + 1 * s1)) });
        const qA = smooth(seg(p, T.q400 - 0.2 * s1, T.q400 + 0.5 * s1)) * cityA;
        kinetic(ctx, '= UNE VILLE ENTIÈRE', cx, V ? h * 0.88 : h * 0.86, { size: m * 0.06, weight: 900, t: seg(p, T.q400, T.q400 + 0.9 * s1), alpha: qA, maxW: w * 0.86 });
      }
      // ── Acte IV : recul — des centres non raccordés, le charbon prolongé ──
      if (recede > 0.003) {
        const cols = V ? 3 : 5;
        const rows = V ? 4 : 2;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const gx = (V ? cx - w * 0.28 : cx - w * 0.08) + c * m * (V ? 0.28 : 0.2) + (r % 2) * m * 0.1;
            const gy = (V ? h * 0.52 : cy - m * 0.12) + r * m * (V ? 0.13 : 0.2);
            const ap = recede * seg(p, T.res + idx * 0.08 * s1, T.res + (idx * 0.08 + 0.6) * s1);
            const dead = idx % 3 !== 0 && p > T.racc;
            isoCube(ctx, gx, gy, m * 0.06, { time: gt + idx, alpha: ap, dead, glow: 0.6 });
          }
        }
        const rA = env(p, T.racc - 0.1 * s1, T.charbon - 0.1 * s1, 0.3 * s1, 0.3 * s1);
        kinetic(ctx, 'RACCORDEMENTS BLOQUÉS', cx, V ? h * 0.16 : h * 0.2, { size: m * 0.07, weight: 900, t: seg(p, T.racc, T.racc + 0.8 * s1), alpha: rA, maxW: w * 0.86 });
        // Centrales au charbon : cheminées et panaches
        const coal = smooth(seg(p, T.charbon - 0.4 * s1, T.charbon + 0.6 * s1));
        if (coal > 0.003) {
          const baseY = V ? h * 0.92 : h * 0.9;
          for (let k = 0; k < 4; k++) {
            const sx = cx + (k - 1.5) * m * (V ? 0.2 : 0.24);
            const sh = m * (0.16 + (k % 2) * 0.05) * eOutCubic(coal);
            ctx.save();
            ctx.globalAlpha *= coal;
            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx - m * 0.03, baseY);
            ctx.lineTo(sx - m * 0.018, baseY - sh);
            ctx.lineTo(sx + m * 0.018, baseY - sh);
            ctx.lineTo(sx + m * 0.03, baseY);
            ctx.stroke();
            ctx.restore();
            for (let j = 0; j < 9; j++) {
              const u = (gt * 0.18 + j / 9 + k * 0.17) % 1;
              const px = sx + Math.sin(u * 5 + k) * m * 0.03 + u * m * 0.08;
              const py = baseY - sh - u * m * 0.3;
              ctx.save();
              ctx.globalAlpha *= coal * 0.22 * (1 - u);
              ctx.fillStyle = '#94A3B8';
              ctx.beginPath();
              ctx.arc(px, py, m * (0.015 + u * 0.05), 0, TAU);
              ctx.fill();
              ctx.restore();
            }
          }
          kinetic(ctx, 'RETOUR DU CHARBON', cx, V ? h * 0.16 : h * 0.2, { size: m * 0.08, weight: 900, t: seg(p, T.charbon, T.charbon + 0.8 * s1), alpha: coal, color: C.slate, maxW: w * 0.86 });
        }
      }
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 11 — d3-ruee-vers-hydro-quebec
 * Acte I   : les faisceaux saturés du monde convergent… vers le Québec
 * Acte II  : Manic-5 en lignes de lumière — trois atouts, trois voûtes
 * Acte III : le hic : surplus engagés, demande ≫ capacité d'ici 2030
 * ════════════════════════════════════════════════════════════════════════ */

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

/** Barrage Daniel-Johnson (Manic-5) : 13 voûtes, 14 contreforts, voûte centrale géante. */
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

function sceneHydroRush(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, { dev: 'devinez', qc: 'Le Québec', atouts: 'trois atouts', ren: 'renouvelable', tarifs: 'tarifs', climat: 'climat', sauf: 'Sauf', surplus: 'surplus', dem: 'demandes', y2030: 'deux mille trente' });

  const globeA = 1 - smooth(seg(p, T.qc + 0.6 * s1, T.atouts + 0.6 * s1));
  const damA = smooth(seg(p, T.qc + 0.8 * s1, T.atouts + 1 * s1));
  frame(a, () => {
    aurora(ctx, stage, gt, 0.5 + 0.5 * damA, V ? h * 0.22 : h * 0.2, m * 0.3);
    // ── Acte I : convergence ──
    if (globeA > 0.003) {
      const st = V ? [-55, 40, 0.42, 0, 0.02] : [-50, 42, 0.46, 0, 0.04];
      const G = globeFrom(stage, [st[0] + p * scene.duration * 0.5 - 6, st[1], st[2] * (1 + 0.08 * seg(p, 0, T.qc)), st[3], st[4]]);
      drawGlobe(ctx, G, { alpha: globeA, color: C.cyan, hl: (lo, la) => (insidePoly(lo, la, QUEBEC[0]) || insidePoly(lo, la, QUEBEC[1]) ? smooth(seg(p, T.qc - 0.2 * s1, T.qc + 0.3 * s1)) : 0), hlColor: C.emerald });
      const target = [-68.7, 50.6];
      [[PLACES.virginia, 0], [PLACES.siliconValley, 0.08], [PLACES.dublin, 0.04], [PLACES.frankfurt, 0.12]].forEach(([src, dl], i) => {
        const pts = projectAll(G, arcPts(src, target, 70, 0.14 + i * 0.03));
        const t = eInOut(seg(p, T.dev - 0.4 * s1 + dl, T.qc - 0.1 * s1));
        trail(ctx, pts, t, { color: C.coral, width: 2.5, alpha: globeA });
        const sp = G.project(src[0], src[1]);
        if (sp.z > 0) beacon(ctx, sp.x, sp.y, { color: C.red, r: 6, time: gt + i, alpha: globeA * seg(p, 0.01, 0.05) });
      });
      const tq = G.project(...target);
      const impact = smooth(seg(p, T.qc - 0.15 * s1, T.qc + 0.2 * s1));
      if (impact > 0 && tq.z > 0) {
        light(ctx, tq.x, tq.y, m * 0.35 * impact, C.emerald, globeA * 0.8);
        flare(ctx, tq.x, tq.y, m * 0.2, C.mint, globeA * impact * (1 - seg(p, T.qc + 0.3 * s1, T.qc + 1.4 * s1)) + 0.2 * globeA * impact);
      }
      kinetic(ctx, 'LE QUÉBEC.', cx, V ? h * 0.84 : h * 0.86, { size: m * 0.12, weight: 900, t: seg(p, T.qc - 0.05 * s1, T.qc + 0.5 * s1), alpha: globeA * impact, glow: 40, glowColor: rgba(C.emerald, 0.7) });
    }
    // ── Acte II : Manic-5 ──
    if (damA > 0.003) {
      const baseY = V ? h * 0.62 : h * 0.72;
      const W = V ? w * 0.92 : w * 0.78;
      const H = V ? h * 0.16 : h * 0.3;
      const lit = [];
      if (p > T.ren) lit.push(6);
      if (p > T.tarifs) lit.push(3, 9);
      if (p > T.climat) lit.push(1, 11);
      const fill = eInOut(seg(p, T.surplus - 0.2 * s1, T.surplus + 2.2 * s1)) * 0.96;
      manic5(ctx, cx, baseY, W, H, { alpha: damA, draw: eInOut(seg(p, T.qc + 0.8 * s1, T.atouts + 1.4 * s1)), litArches: lit, fill, time: gt });
      // Réservoir (reflets) sous la crête
      ctx.save();
      ctx.globalAlpha *= damA * 0.5;
      for (let k = 1; k <= 5; k++) {
        const y = baseY + k * m * 0.018;
        const g = ctx.createLinearGradient(cx - W / 2, 0, cx + W / 2, 0);
        g.addColorStop(0, rgba(C.cyan, 0));
        g.addColorStop(0.5, rgba(C.cyan, 0.35 / k));
        g.addColorStop(1, rgba(C.cyan, 0));
        ctx.fillStyle = g;
        ctx.fillRect(cx - W / 2 + Math.sin(gt + k) * 8, y, W, 1.2);
      }
      ctx.restore();
      mono(ctx, 'MANIC-5 · CÔTE-NORD', cx, baseY + m * 0.12, { size: m * 0.018, color: C.ice, t: seg(p, T.atouts, T.atouts + 1.2 * s1), alpha: damA * (1 - smooth(seg(p, T.sauf - 0.3 * s1, T.sauf))) });
      const ty = V ? h * 0.2 : h * 0.2;
      [
        [T.atouts, T.ren, '3 ATOUTS'],
        [T.ren, T.tarifs, '99 % RENOUVELABLE'],
        [T.tarifs, T.climat, 'TARIFS PARMI LES PLUS BAS'],
        [T.climat, T.sauf, 'CLIMAT FROID']
      ].forEach(([s, e, txt]) => {
        const al = env(p, s - 0.1 * s1, e - 0.1 * s1, 0.3 * s1, 0.3 * s1) * damA;
        if (al > 0.003) kinetic(ctx, txt, cx, ty, { size: m * 0.075, weight: 900, t: seg(p, s, s + 0.8 * s1), alpha: al, glow: 30, glowColor: rgba(C.emerald, 0.6), maxW: w * 0.86 });
      });
      // ── Acte III : la capacité contre la demande ──
      const hicA = smooth(seg(p, T.sauf - 0.2 * s1, T.sauf + 0.6 * s1)) * damA;
      if (hicA > 0.003) {
        const crestY = baseY - H;
        mono(ctx, 'CAPACITÉ', cx + W / 2 + m * 0.02, crestY, { size: m * 0.016, align: V ? 'right' : 'left', color: C.mint, alpha: hicA * (V ? 0 : 1) });
        const sA = env(p, T.surplus - 0.1 * s1, T.dem - 0.1 * s1, 0.3 * s1, 0.3 * s1);
        kinetic(ctx, 'SURPLUS DÉJÀ ENGAGÉS', cx, ty, { size: m * 0.07, weight: 900, t: seg(p, T.surplus, T.surplus + 0.8 * s1), alpha: sA * hicA, maxW: w * 0.86 });
        kinetic(ctx, 'UN HIC MAJEUR', cx, ty, { size: m * 0.08, weight: 900, t: seg(p, T.sauf, T.sauf + 0.8 * s1), alpha: env(p, T.sauf - 0.1 * s1, T.surplus - 0.1 * s1, 0.3 * s1, 0.3 * s1) * hicA, maxW: w * 0.86 });
        const dm = smooth(seg(p, T.dem - 0.2 * s1, T.dem + 1.4 * s1)) * hicA;
        if (dm > 0.003) {
          for (let k = 0; k < 4; k++) {
            const lvl = crestY - (k + 1) * H * 0.42 * eOutCubic(seg(p, T.dem + k * 0.25 * s1, T.dem + (k * 0.25 + 1) * s1));
            ctx.save();
            ctx.globalAlpha *= dm * (1 - k * 0.18);
            ctx.strokeStyle = C.coral;
            ctx.lineWidth = 2;
            ctx.shadowColor = C.coral;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            for (let x = cx - W / 2; x <= cx + W / 2; x += 8) {
              const y = lvl + Math.sin(x * 0.02 + gt * 3 + k) * 6;
              if (x === cx - W / 2) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
          }
          kinetic(ctx, 'DEMANDE ≫ CAPACITÉ', cx, ty, { size: m * 0.08, weight: 900, t: seg(p, T.dem, T.dem + 0.8 * s1), alpha: dm, glow: 34, glowColor: rgba(C.coral, 0.6), maxW: w * 0.86 });
          mono(ctx, 'HORIZON 2030', cx, ty + m * 0.07, { size: m * 0.024, weight: 600, color: C.coral, t: seg(p, T.y2030 - 0.3 * s1, T.y2030 + 0.6 * s1), alpha: dm });
        }
      }
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 12 — d3-deux-cotes-megawatts
 * Acte I   : un seul flux d'énergie… qui se scinde au cœur du dilemme
 * Acte II  : flux or — tarif premium ×2 à ×3 → hôpitaux, écoles, barrages
 * Acte III : flux émeraude — réseau local : peu d'emplois/MW, tarifs ↑
 * ════════════════════════════════════════════════════════════════════════ */

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

function sceneMegawatts(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, { dil: 'dilemme', c1: 'un côté', x23: 'deux ou trois', mil: 'milliards', hop: 'hôpitaux', eco: 'écoles', bar: 'barrages', c2: 'autre côté', emp: 'emplois', multi: 'multinationales', priv: 'priver', tarifs: 'tarifs résidentiels' });

  // Repère abstrait : u le long de la scission (− : flux or, + : flux local), v perpendiculaire
  const U = V ? h * 0.5 : w * 0.5;
  const Vv = V ? w * 0.5 : h * 0.5;
  const S = (u, v) => (V ? { x: cx + v * Vv, y: cy + u * U } : { x: cx + u * U, y: cy + v * Vv });
  const bez = (A, B, Cc, n = 40) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push({ x: (1 - t) ** 2 * A.x + 2 * (1 - t) * t * B.x + t * t * Cc.x, y: (1 - t) ** 2 * A.y + 2 * (1 - t) * t * B.y + t * t * Cc.y, vis: true });
    }
    return out;
  };
  const flowDots = (pts, color, alpha, n = 8, speed = 0.35) => {
    for (let k = 0; k < n; k++) {
      const u = (gt * speed + k / n) % 1;
      const q = pts[Math.floor(u * (pts.length - 1))];
      light(ctx, q.x, q.y, 12, color, alpha);
    }
  };

  frame(a, () => {
    const node = S(0, 0.08);
    // ── Acte I : le flux unique ──
    const inPts = bez(S(0, 1.1), S(0, 0.6), node);
    const inT = eInOut(seg(p, 0.0, T.c1 - 0.2 * s1));
    trail(ctx, inPts, inT, { color: C.emerald, width: 5, alpha: 1 });
    if (inT >= 1) flowDots(inPts, C.mint, 1, 8, 0.4);
    beacon(ctx, node.x, node.y, { color: C.white, r: 9, time: gt, alpha: smooth(seg(p, T.dil - 0.2 * s1, T.dil + 0.4 * s1)) });
    const dA = env(p, T.dil - 0.1 * s1, T.c1 + 0.3 * s1, 0.4 * s1, 0.4 * s1);
    kinetic(ctx, 'LE DILEMME', cx, V ? h * 0.075 : h * 0.2, { size: m * 0.1, weight: 900, t: seg(p, T.dil, T.dil + 1 * s1), alpha: dA });

    // ── Acte II : le flux or, multiplié ──
    const goldA = smooth(seg(p, T.c1 - 0.2 * s1, T.c1 + 0.4 * s1));
    const mult = S(-0.42, -0.05);
    const leftPts = bez(node, S(-0.2, 0.08), mult);
    trail(ctx, leftPts, eInOut(seg(p, T.c1, T.x23 - 0.2 * s1)), { color: C.amber, width: 4, alpha: goldA });
    const eu = V ? -0.6 : -0.78;
    const ends = [S(eu, -0.6), S(eu - 0.02, -0.05), S(eu, 0.5)];
    const kinds = [['hospital', T.hop, 'HÔPITAUX'], ['school', T.eco, 'ÉCOLES'], ['dam', T.bar, 'BARRAGES']];
    const fork = eInOut(seg(p, T.x23 - 0.1 * s1, T.x23 + 1.2 * s1));
    if (fork > 0) {
      ring(ctx, mult.x, mult.y, m * 0.045, { color: C.amber, width: 3, alpha: goldA, glow: 20 });
      ends.forEach((E, i) => {
        const pts = bez(mult, S(-0.6, (i - 1) * 0.15), E, 30);
        trail(ctx, pts, fork, { color: C.gold, width: 3, alpha: goldA });
        if (fork >= 1) flowDots(pts, C.gold, goldA, 5, 0.5);
        const [kind, cue, label] = kinds[i];
        const ia = seg(p, cue - 0.1 * s1, cue + 0.4 * s1) * goldA;
        iconGlyph(ctx, kind, E.x, E.y, m * 0.08, C.gold, ia);
        mono(ctx, label, E.x, E.y + m * 0.08, { size: m * 0.016, color: C.gold, t: seg(p, cue, cue + 0.7 * s1), alpha: ia });
      });
      kinetic(ctx, '×2 À ×3', mult.x, mult.y - m * 0.08, { size: m * 0.07, weight: 900, t: seg(p, T.x23, T.x23 + 0.8 * s1), alpha: goldA, color: C.amber, glow: 24, glowColor: rgba(C.amber, 0.6) });
      mono(ctx, 'TARIF PREMIUM', mult.x, mult.y + m * 0.08, { size: m * 0.018, color: C.amber, t: seg(p, T.x23 + 0.3 * s1, T.x23 + 1.2 * s1), alpha: goldA });
    }
    const milA = env(p, T.mil - 0.1 * s1, T.c2, 0.3 * s1, 0.4 * s1);
    kinetic(ctx, 'DES MILLIARDS NEUFS', cx, V ? h * 0.075 : h * 0.2, { size: m * 0.07, weight: 900, t: seg(p, T.mil, T.mil + 0.8 * s1), alpha: milA, maxW: w * 0.86 });

    // ── Acte III : le flux émeraude, réseau local ──
    const locA = smooth(seg(p, T.c2 - 0.2 * s1, T.c2 + 0.5 * s1));
    if (locA > 0.003) {
      const hub = S(0.42, -0.05);
      const rightPts = bez(node, S(0.2, 0.08), hub);
      const divert = smooth(seg(p, T.multi - 0.2 * s1, T.priv + 1 * s1));
      trail(ctx, rightPts, eInOut(seg(p, T.c2, T.c2 + 1.4 * s1)), { color: C.emerald, width: 4, alpha: locA });
      const grid = cached('localGrid', () => {
        const r = rng(12);
        const out = [];
        for (let i = 0; i < 14; i++) out.push([0.55 + r() * 0.38, -0.7 + r() * 1.35, r() > 0.6 ? 'factory' : 'house']);
        return out;
      });
      grid.forEach(([u, v, kind], i) => {
        const q = S(u, v);
        const lineA = locA * seg(p, T.c2 + 0.5 * s1 + i * 0.04 * s1, T.c2 + 1.2 * s1 + i * 0.04 * s1);
        const dim = 1 - divert * (i % 3 === 0 ? 0.2 : 0.75);
        ctx.save();
        ctx.globalAlpha *= lineA * 0.4 * dim;
        ctx.strokeStyle = C.emerald;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.restore();
        const tr = smooth(seg(p, T.tarifs - 0.2 * s1, T.tarifs + 0.6 * s1));
        const flick = tr > 0 && kind === 'house' ? 0.6 + 0.4 * Math.sin(gt * 13 + i * 2) : 1;
        iconGlyph(ctx, kind, q.x, q.y, m * 0.045, mix(C.mint, C.amber, tr * (kind === 'house' ? 1 : 0)), lineA * dim * flick);
      });
      mono(ctx, 'PME & MAISONS', hub.x, hub.y - m * 0.07, { size: m * 0.018, color: C.mint, t: seg(p, T.c2 + 0.4 * s1, T.c2 + 1.4 * s1), alpha: locA * (1 - divert) });
      // Le méga-centre qui aspire l'énergie : peu d'emplois par mégawatt
      const dc = smooth(seg(p, T.emp - 0.4 * s1, T.emp + 0.4 * s1));
      if (dc > 0.003) {
        const dpos = S(0.28, V ? 0.55 : 0.55);
        const dPts = bez(hub, S(0.38, 0.35), dpos, 30);
        trail(ctx, dPts, eInOut(seg(p, T.emp - 0.3 * s1, T.emp + 0.8 * s1)), { color: C.cyan, width: 2 + 4 * divert, alpha: dc });
        flowDots(dPts, C.ice, dc * (0.4 + 0.6 * divert), 6 + Math.round(10 * divert), 0.6);
        isoCube(ctx, dpos.x, dpos.y, m * 0.07, { color: C.cyan, time: gt, alpha: dc });
        for (let k = 0; k < 3; k++) familyFigure(ctx, dpos.x + m * (0.1 + k * 0.035), dpos.y + m * 0.07, m * 0.028, C.white, dc * seg(p, T.emp + 0.3 * s1, T.emp + 0.8 * s1));
        mono(ctx, "PEU D'EMPLOIS / MW", dpos.x, dpos.y + m * 0.13, { size: m * 0.018, color: C.ice, t: seg(p, T.emp, T.emp + 1 * s1), alpha: dc });
      }
      const kA = env(p, T.multi - 0.1 * s1, T.tarifs - 0.1 * s1, 0.3 * s1, 0.3 * s1);
      kinetic(ctx, 'MULTINATIONALES ÉTRANGÈRES', cx, V ? h * 0.075 : h * 0.2, { size: m * 0.06, weight: 900, t: seg(p, T.multi, T.multi + 0.8 * s1), alpha: kA, maxW: w * 0.86 });
      const tA = smooth(seg(p, T.tarifs - 0.1 * s1, T.tarifs + 0.4 * s1));
      kinetic(ctx, 'TARIFS RÉSIDENTIELS ↑', cx, V ? h * 0.075 : h * 0.2, { size: m * 0.065, weight: 900, t: seg(p, T.tarifs, T.tarifs + 0.8 * s1), alpha: tA, color: C.white, glow: 30, glowColor: rgba(C.amber, 0.6), maxW: w * 0.86 });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 13 — conclusion-debat-quebec
 * Acte I   : la boussole hésite — quelle direction ?
 * Acte II  : le faisceau diagonal scinde l'écran — A · vendre au prix fort
 * Acte III : B · réserver au Québec
 * Acte IV  : à vous de trancher — commentaires, partage, à demain
 * ════════════════════════════════════════════════════════════════════════ */

function sceneFinale(a) {
  const { ctx, stage, progress: p, globalTime: gt, isVertical: V, scene } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const s1 = 1 / scene.duration;
  const T = cues(scene, { choix: 'choix', disj: 'disjoncteur', dir: 'quelle direction', oa: 'Option A', ob: 'Ou Option B', cent: 'cent pour cent', ecr: 'Écrivez', com: 'commentaires', part: 'partagez', fb: 'Facebook', dem: 'demain pour' });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 120, alpha: 0.45, color: C.ice });
    const split = eOutExpo(seg(p, T.oa - 0.3 * s1, T.oa + 0.9 * s1)) * (1 - smooth(seg(p, T.dem - 0.6 * s1, T.dem + 0.4 * s1)));
    // Diagonale : du coin bas-gauche au coin haut-droit
    const A0 = { x: 0, y: h };
    const B0 = { x: w, y: 0 };
    const dirx = (B0.x - A0.x);
    const diry = (B0.y - A0.y);
    const aTint = split * (0.4 + 0.6 * env(p, T.oa, T.ob, 0.5 * s1, 0.6 * s1)) * (1 - smooth(seg(p, 1 - 2.2 * s1, 1 - 1.2 * s1)) * 0.5);
    const bTint = split * smooth(seg(p, T.ob - 0.4 * s1, T.ob + 0.6 * s1)) * (0.4 + 0.6 * env(p, T.ob, T.ecr, 0.5 * s1, 0.6 * s1)) * (1 - smooth(seg(p, 1 - 2.2 * s1, 1 - 1.2 * s1)) * 0.5);
    const lateBoth = smooth(seg(p, T.ecr - 0.3 * s1, T.ecr + 0.6 * s1)) * (1 - smooth(seg(p, T.dem - 0.6 * s1, T.dem + 0.4 * s1)));
    if (split > 0.003) {
      // Plans teintés (Ambre en haut à gauche, Cyan en bas à droite)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(0, h);
      ctx.closePath();
      const ga = ctx.createRadialGradient(w * 0.25, h * 0.3, 0, w * 0.25, h * 0.3, m * 0.9);
      ga.addColorStop(0, rgba(C.amber, 0.2 * Math.max(aTint, lateBoth * 0.6)));
      ga.addColorStop(1, rgba(C.amber, 0));
      ctx.fillStyle = ga;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const gb = ctx.createRadialGradient(w * 0.75, h * 0.7, 0, w * 0.75, h * 0.7, m * 0.9);
      gb.addColorStop(0, rgba(C.cyan, 0.2 * Math.max(bTint, lateBoth * 0.6)));
      gb.addColorStop(1, rgba(C.cyan, 0));
      ctx.fillStyle = gb;
      ctx.fill();
      ctx.restore();
      // Faisceau rasoir (cœur blanc, liseré rose)
      const half = split * 0.5;
      const p1 = { x: cx - dirx * half, y: cy - diry * half };
      const p2 = { x: cx + dirx * half, y: cy + diry * half };
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (const [lw, col, al] of [[18, C.red, 0.12], [6, C.coral, 0.35], [1.6, C.white, 1]]) {
        ctx.strokeStyle = rgba(col, al * (1 - lateBoth * 0.3));
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Lettres monumentales A et B
    const aPos = V ? { x: w * 0.3, y: h * 0.33 } : { x: w * 0.24, y: h * 0.44 };
    const bPos = V ? { x: w * 0.7, y: h * 0.8 } : { x: w * 0.76, y: h * 0.8 };
    const lettA = smooth(seg(p, T.oa, T.oa + 0.6 * s1)) * (1 - smooth(seg(p, T.dem - 0.6 * s1, T.dem)));
    const lettB = smooth(seg(p, T.ob, T.ob + 0.6 * s1)) * (1 - smooth(seg(p, T.dem - 0.6 * s1, T.dem)));
    kinetic(ctx, 'A', aPos.x, aPos.y, { size: m * 0.34, weight: 900, t: seg(p, T.oa, T.oa + 0.7 * s1), alpha: lettA * (0.35 + 0.65 * Math.max(aTint, lateBoth)), color: C.amber, glow: 50, glowColor: rgba(C.amber, 0.6) });
    kinetic(ctx, 'B', bPos.x, bPos.y, { size: m * 0.34, weight: 900, t: seg(p, T.ob, T.ob + 0.7 * s1), alpha: lettB * (0.35 + 0.65 * Math.max(bTint, lateBoth)), color: C.cyan, glow: 50, glowColor: rgba(C.cyan, 0.6) });
    const subA = env(p, T.oa + 0.2 * s1, T.ob, 0.4 * s1, 0.5 * s1);
    kinetic(ctx, 'VENDRE AU PRIX FORT', aPos.x, aPos.y + m * 0.1, { size: m * 0.046, weight: 900, t: seg(p, T.oa + 0.3 * s1, T.oa + 1.2 * s1), alpha: subA, maxW: V ? w * 0.52 : w * 0.3 });
    const subB = env(p, T.ob + 0.2 * s1, T.ecr, 0.4 * s1, 0.5 * s1);
    kinetic(ctx, 'RÉSERVER AU QUÉBEC', bPos.x, bPos.y - m * 0.3, { size: m * 0.046, weight: 900, t: seg(p, T.ob + 0.3 * s1, T.ob + 1.2 * s1), alpha: subB, maxW: V ? w * 0.52 : w * 0.3 });
    mono(ctx, '100 % DE NOS MÉGAWATTS', bPos.x, bPos.y - m * 0.24, { size: m * 0.018, color: C.cyan, t: seg(p, T.cent, T.cent + 1 * s1), alpha: subB * smooth(seg(p, T.cent - 0.2 * s1, T.cent + 0.3 * s1)) });

    // La boussole Franc Nord au centre : elle hésite, penche vers A, puis vers B
    const tt = p * scene.duration;
    const hes = env(p, T.dir - 0.2 * s1, T.oa, 0.3 * s1, 0.4 * s1);
    const tA = (p - T.dir) * scene.duration;
    const swing =
      hes * 0.5 * Math.sin(tA * 4.2) * Math.exp(-Math.max(0, tA) * 0.25) +
      track(p, [[T.oa - 0.1 * s1, 0], [T.oa + 0.8 * s1, -0.62, eOutBack], [T.ob - 0.1 * s1, -0.62], [T.ob + 0.8 * s1, 0.62, eOutBack], [T.ecr - 0.2 * s1, 0.62], [T.ecr + 0.9 * s1, 0, eOutBack]]) +
      lateBoth * 0.08 * Math.sin(tt * 1.6);
    const er = m * lerp(0.15, 0.1, split);
    const emA = smooth(seg(p, 0.0, 0.0 + 1 * s1)) * (1 - smooth(seg(p, T.dem - 0.5 * s1, T.dem)));
    light(ctx, cx, cy, er * 3, C.white, 0.12 * emA * (0.8 + 0.2 * Math.sin(tt * 2)));
    emblem(ctx, cx, cy + er * 0.1, er * (1 + 0.025 * Math.sin(tt * 2.2)), { time: gt, alpha: emA, swing });
    const cA = env(p, T.choix - 0.1 * s1, T.dir - 0.1 * s1, 0.4 * s1, 0.3 * s1);
    kinetic(ctx, 'VOTRE CHOIX', cx, V ? h * 0.2 : h * 0.22, { size: m * 0.085, weight: 900, t: seg(p, T.choix, T.choix + 1 * s1), alpha: cA });
    mono(ctx, 'LA MAIN SUR LE DISJONCTEUR', cx, cy + m * 0.3, { size: m * 0.022, color: C.coral, t: seg(p, T.disj, T.disj + 1.2 * s1), alpha: env(p, T.disj - 0.1 * s1, T.oa - 0.2 * s1, 0.3 * s1, 0.3 * s1) });
    kinetic(ctx, 'QUELLE DIRECTION ?', cx, V ? h * 0.2 : h * 0.22, { size: m * 0.085, weight: 900, t: seg(p, T.dir, T.dir + 0.9 * s1), alpha: hes });

    // Acte IV : appel à l'action (jamais plus de 6 mots)
    const comA = env(p, T.ecr, T.part - 0.1 * s1, 0.4 * s1, 0.4 * s1);
    const ty = V ? h * 0.12 : h * 0.14;
    kinetic(ctx, 'A OU B ?', cx, ty, { size: m * 0.08, weight: 900, t: seg(p, T.ecr, T.ecr + 0.7 * s1), alpha: comA });
    mono(ctx, 'DANS LES COMMENTAIRES', cx, ty + m * 0.06, { size: m * 0.024, weight: 600, color: C.white, t: seg(p, T.com - 0.1 * s1, T.com + 1 * s1), alpha: comA });
    const shA = env(p, T.part - 0.1 * s1, T.dem - 0.3 * s1, 0.4 * s1, 0.4 * s1);
    kinetic(ctx, 'PARTAGEZ', cx, ty, { size: m * 0.08, weight: 900, t: seg(p, T.part, T.part + 0.7 * s1), alpha: shA });
    mono(ctx, 'SUR FACEBOOK', cx, ty + m * 0.06, { size: m * 0.024, weight: 600, color: C.cyan, t: seg(p, T.fb - 0.1 * s1, T.fb + 0.8 * s1), alpha: shA });
    if (shA > 0.01) chevrons(ctx, cx, ty + m * 0.13, m * 0.04, { t: seg(p, T.part, T.part + 1 * s1), alpha: shA });

    // Signature finale : l'emblème, FRANC NORD, à demain
    const fin = smooth(seg(p, T.dem - 0.3 * s1, T.dem + 0.6 * s1));
    if (fin > 0.003) {
      const fr = m * 0.13;
      const fy = cy - m * 0.08;
      emblem(ctx, cx, fy, fr, {
        time: gt, alpha: fin,
        star: seg(p, T.dem - 0.3 * s1, T.dem + 0.4 * s1), ringT: seg(p, T.dem - 0.2 * s1, T.dem + 0.8 * s1),
        needle: seg(p, T.dem, T.dem + 0.7 * s1), cardinals: seg(p, T.dem + 0.2 * s1, T.dem + 1 * s1)
      });
      kinetic(ctx, 'FRANC NORD', cx, fy + fr * 2.1, { size: m * 0.09, weight: 800, t: seg(p, T.dem + 0.3 * s1, T.dem + 1.3 * s1), track: m * 0.04, spacing: m * 0.005, alpha: fin, glow: 24, glowColor: rgba(C.ice, 0.5) });
      mono(ctx, 'À DEMAIN', cx, fy + fr * 2.1 + m * 0.07, { size: m * 0.026, weight: 600, color: C.amber, t: seg(p, T.dem + 0.8 * s1, T.dem + 1.6 * s1), alpha: fin });
    }
  });
}

/* ═══ REGISTRE DES SCÈNES ═══ */
export const CUSTOM_SCENES = {
  'intro-sommaire': sceneIntro,
  'd1-fait-declencheur': sceneTrigger,
  'd1-geopolitique-detroit': sceneStrait,
  'd1-deux-cotes-opep-occident': sceneTwoSidesOil,
  'd1-impact-quebec-pompe': scenePump,
  'd2-decision-fed-ecart-taux': sceneFed,
  'd2-deux-cotes-banques-centrales': sceneTwoSchools,
  'd2-mecanisme-importations-hiver': sceneWinterImports,
  'd2-impact-quebec-familles': sceneFamilies,
  'd3-mur-electrique-ia': sceneAIWall,
  'd3-ruee-vers-hydro-quebec': sceneHydroRush,
  'd3-deux-cotes-megawatts': sceneMegawatts,
  'conclusion-debat-quebec': sceneFinale
};
