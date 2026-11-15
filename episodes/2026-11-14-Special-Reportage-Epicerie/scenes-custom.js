/**
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
 *    `wordTimes` = [[indexCaractère, secondes], …] issus de la transcription
 *    horodatée de voix.mp3. Chaque temps fort est ancré sur une expression
 *    exacte de la narration (fonction `cues`).
 *  • 13 DISPOSITIFS DISTINCTS : aucune mécanique visuelle n'est reprise d'une scène à l'autre.
 *  • Coin inférieur droit toujours libre (filigrane YouTube).
 *  • Moteur typographique et cartographique hérité de l'épisode 3.
 */


/* ════════════════════════════════════════════════════════════════════════
 * 1. TYPOGRAPHIE DE LA CHARTE
 * ════════════════════════════════════════════════════════════════════════ */

const DISPLAY = '"Montserrat", "Avenir Next", "Inter", "SF Pro Display", system-ui, sans-serif';
const MONO = '"IBM Plex Mono", "SF Mono", Menlo, monospace';

if (typeof document !== 'undefined' && !document.getElementById('fn-fonts')) {
  const link = document.createElement('link');
  link.id = 'fn-fonts';
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=block';
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
          document.fonts.load('600 120px Montserrat'),
          document.fonts.load('500 24px "IBM Plex Mono"'),
          document.fonts.load('600 24px "IBM Plex Mono"')
        ])
      ),
      new Promise((res) => setTimeout(res, 4000))
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
  ink: '#07101C',
  cyan: '#38BDF8',
  ice: '#BAE6FD',
  deepCyan: '#0284C7',
  amber: '#F59E0B',
  gold: '#FDE68A',
  copper: '#D97706',
  slate: '#E5E7EB',
  white: '#F8FAFC',
  coral: '#FB7185',
  red: '#F43F5E',
  emerald: '#10B981',
  mint: '#6EE7B7',
  violet: '#A78BFA'
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
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * k)); // couleur : arrondi sans effet spatial
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (x, a, b) => (b === a ? (x >= b ? 1 : 0) : clamp((x - a) / (b - a)));
const smooth = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
const smoother = (t) => {
  const x = clamp(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const eOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
const eOutQuint = (t) => 1 - Math.pow(1 - clamp(t), 5);
const eOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
const eInExpo = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * clamp(t) - 10));
const eInCubic = (t) => Math.pow(clamp(t), 3);
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
/** Enveloppe : visible entre a et b (secondes), fondus fi / fo. */
const env = (x, a, b, fi = 0.5, fo = 0.5) => Math.min(smooth((x - a) / fi), smooth((b - x) / fo));

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

/** Piste par images clés en secondes : [[t, valeur, easing?], …]. */
function track(x, kf) {
  if (x <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) {
    const [t1, v1, e = eInOutQuart] = kf[i];
    const [t0, v0] = kf[i - 1];
    if (x <= t1) return t1 <= t0 ? v1 : lerp(v0, v1, e(seg(x, t0, t1)));
  }
  return kf[kf.length - 1][1];
}
/** Variante vectorielle : valeurs = tableaux. */
function trackV(x, kf) {
  if (x <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) {
    const [t1, v1, e = eInOutQuart] = kf[i];
    const [t0, v0] = kf[i - 1];
    if (x <= t1) {
      const k = t1 <= t0 ? 1 : e(seg(x, t0, t1));
      return v0.map((v, j) => lerp(v, v1[j], k));
    }
  }
  return kf[kf.length - 1][1];
}

/* ════════════════════════════════════════════════════════════════════════
 * 3. SYNCHRONISATION VOIX — repères au mot près
 *    map : { cle: 'expression exacte' | 'expression#2' (2e occurrence) | secondes }
 *    Priorité : scene.wordTimes (transcription horodatée) > scene.voiceSync
 *    (phrases) > position du texte. Renvoie des SECONDES locales à la scène.
 * ════════════════════════════════════════════════════════════════════════ */

function cues(scene, map) {
  const d = scene.duration || 1;
  const n = scene.narration || '';
  const wt = scene.wordTimes;
  const sents = scene.voiceSync?.sentences;
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    if (typeof v === 'number') {
      out[k] = v;
      continue;
    }
    let phrase = v;
    let occ = 1;
    const m = /^(.*)#(\d+)$/.exec(v);
    if (m) {
      phrase = m[1];
      occ = +m[2];
    }
    let i = -1;
    for (let o = 0; o < occ; o++) i = n.indexOf(phrase, i + 1);
    if (i < 0) (globalThis.__FN_MISSING_CUES ||= new Set()).add(`${scene.id} → « ${v} »`);
    let t = i >= 0 ? (i / Math.max(1, n.length)) * d : d * 0.5;
    if (i >= 0 && wt && wt.length) {
      // premier mot dont l'index de caractère est ≥ i
      let lo = 0;
      let hi = wt.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (wt[mid][0] < i) lo = mid + 1;
        else hi = mid;
      }
      t = wt[lo][1];
    } else if (i >= 0 && sents) {
      const s = sents.find((x) => i >= x.from && i < x.to);
      if (s) t = s.start + ((s.end - s.start) * (i - s.from)) / Math.max(1, s.to - s.from);
    }
    out[k] = clamp(t, 0, d);
  }
  return out;
}

/* ════════════════════════════════════════════════════════════════════════
 * 4. LUMIÈRE, ATMOSPHÈRE & GRAIN CINÉMA
 * ════════════════════════════════════════════════════════════════════════ */

function makeCanvas(w, h) {
  const W = Math.max(1, Math.ceil(w));
  const H = Math.max(1, Math.ceil(h));
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(W, H);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
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

/** Lueur additive (mode 'lighter'). */
function light(ctx, x, y, r, color, a = 1) {
  if (a <= 0.003 || r <= 0.5) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= clamp(a);
  ctx.drawImage(sprite(color), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

/** Reflet anamorphique horizontal. */
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

function grain(ctx, stage, globalTime, a = 0.04) {
  const pat = grainPattern(ctx);
  const f = Math.floor(globalTime * 24); // index d'image du grain (aucun texte concerné)
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

/** Poussière lumineuse en parallaxe (3 profondeurs). */
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
  const fade = Math.min(smooth(localTime / 0.55), smooth((d - localTime) / 0.35));
  ctx.save();
  ctx.globalAlpha = fade;
  draw();
  ctx.restore();
  vignette(ctx, stage, 0.76);
  grain(ctx, stage, globalTime, 0.04);
}

/* ════════════════════════════════════════════════════════════════════════
 * 5. MOTEUR TYPOGRAPHIQUE SANS TREMBLEMENT (sprites rastérisés une fois)
 * ════════════════════════════════════════════════════════════════════════ */

const _font = (weight, size, fam) => `${weight} ${size}px ${fam}`;
let _measureCtx = null;
function mctx() {
  if (!_measureCtx) _measureCtx = makeCanvas(8, 8).getContext('2d');
  return _measureCtx;
}

/** Taille entière (constante) qui fait tenir `text` dans maxW. */
function fitSize(text, weight, size, maxW, fam = DISPLAY, spacing = 0) {
  const g = mctx();
  g.font = _font(weight, size, fam);
  g.letterSpacing = `${spacing}px`;
  const w = g.measureText(text).width - spacing;
  return w > maxW ? Math.max(8, Math.floor((size * maxW) / w)) : size;
}

/**
 * Sprite de texte : rendu unique à taille entière, mis en cache.
 * o = { size, weight, fam, color, spacing, glow, glowColor, res, stroke }
 */
function textSprite(text, o = {}) {
  const size = Math.max(6, Math.floor(o.size || 40));
  const weight = o.weight || 800;
  const fam = o.fam || DISPLAY;
  const color = o.color || C.white;
  const spacing = o.spacing || 0;
  const glow = o.glow || 0;
  const glowColor = o.glowColor || color;
  const res = o.res || 1;
  const stroke = o.stroke || 0;
  const key = `T|${text}|${size}|${weight}|${fam}|${color}|${spacing}|${glow}|${glowColor}|${res}|${stroke}`;
  return cached(key, () => {
    const g0 = mctx();
    g0.font = _font(weight, size, fam);
    g0.letterSpacing = `${spacing}px`;
    const mt = g0.measureText(text);
    const capM = g0.measureText('HÉ');
    const w = Math.max(1, mt.width - spacing);
    const asc = Math.max(mt.actualBoundingBoxAscent || size * 0.8, capM.actualBoundingBoxAscent || size * 0.8);
    const desc = Math.max(mt.actualBoundingBoxDescent || size * 0.2, size * 0.22);
    const cap = g0.measureText('H').actualBoundingBoxAscent || size * 0.72;
    const pad = Math.ceil(glow * 1.6 + 6 + stroke);
    const cv = makeCanvas((w + pad * 2) * res, (asc + desc + pad * 2) * res);
    const g = cv.getContext('2d');
    g.scale(res, res);
    g.font = _font(weight, size, fam);
    g.letterSpacing = `${spacing}px`;
    g.textBaseline = 'alphabetic';
    g.textAlign = 'left';
    if (glow > 0) {
      g.shadowColor = glowColor;
      g.shadowBlur = glow;
    }
    if (stroke > 0) {
      g.lineWidth = stroke;
      g.strokeStyle = color;
      g.lineJoin = 'round';
      g.strokeText(text, pad, pad + asc);
    } else {
      g.fillStyle = color;
      g.fillText(text, pad, pad + asc);
      if (glow > 0) {
        g.shadowBlur = 0;
        g.fillText(text, pad, pad + asc);
      }
    }
    return { cv, w, asc, desc, cap, pad, res, size, text };
  });
}

/* QA : boîtes englobantes des textes (actif seulement si globalThis.__FN_QA est un tableau). */
function qaG() {
  if (globalThis.__FN_QA) globalThis.__FN_QA_G = (globalThis.__FN_QA_G || 0) + 1;
}
function qaBox(ctx, S, x0, y0, x1, y1, alpha) {
  const q = globalThis.__FN_QA;
  if (!q || S.text === undefined || globalThis.__FN_QA_SKIP) return;
  const m = ctx.getTransform();
  const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  q.push({ text: S.text, g: globalThis.__FN_QA_G || 0, a: alpha, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), size: S.size });
}

/**
 * Pose un sprite en coordonnées flottantes.
 * align : 'left' | 'center' | 'right' ; base : 'alphabetic' | 'middle' (milieu des capitales) | 'top'
 */
function drawSprite(ctx, S, x, y, o = {}) {
  if (globalThis.__FN_QA && !globalThis.__FN_QA_IN) qaG();
  const { align = 'center', base = 'alphabetic', alpha = 1, scale = 1, sx = null, sy = null } = o;
  if (alpha <= 0.003) return;
  const kx = sx ?? scale;
  const ky = sy ?? scale;
  const ax = align === 'center' ? S.w / 2 : align === 'right' ? S.w : 0;
  const ay = base === 'middle' ? -S.cap / 2 : base === 'top' ? -S.cap : 0;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.translate(x, y);
  ctx.scale(kx, ky);
  ctx.drawImage(S.cv, -ax - S.pad, ay - S.asc - S.pad, S.cv.width / S.res, S.cv.height / S.res);
  if (globalThis.__FN_QA) qaBox(ctx, S, -ax, ay - S.cap, -ax + S.w, ay + S.desc * 0.35, ctx.globalAlpha);
  ctx.restore();
}

/** Disposition par glyphe (avec crénage, via largeurs de préfixes). */
function glyphLayout(text, size, weight, fam, spacing) {
  const key = `L|${text}|${size}|${weight}|${fam}|${spacing}`;
  return cached(key, () => {
    const g = mctx();
    g.font = _font(weight, size, fam);
    g.letterSpacing = `${spacing}px`;
    const chars = [...text];
    const xs = [];
    let prefix = '';
    for (const ch of chars) {
      xs.push(prefix ? g.measureText(prefix).width : 0);
      prefix += ch;
    }
    const total = g.measureText(text).width - spacing;
    return { chars, xs, total };
  });
}

/** Paramètres typographiques normalisés. */
function tOpts(o, text = null) {
  let size = Math.max(6, Math.floor(o.size || 60));
  if (text && o.maxW) size = fitSize(text, o.weight || 800, size, o.maxW, o.fam || DISPLAY, o.spacing || 0);
  return {
    size,
    weight: o.weight || 800,
    fam: o.fam || DISPLAY,
    color: o.color || C.white,
    spacing: o.spacing || 0,
    glow: o.glow || 0,
    glowColor: o.glowColor || o.color || C.white,
    res: o.res || 1
  };
}

/**
 * RÉVÉLATION PAR MASQUE (signature Keynote) : chaque lettre glisse vers le
 * haut depuis sous une ligne de découpe, en cascade. `out` fait sortir vers le haut.
 */
function kRise(ctx, text, x, y, o = {}) {
  qaG();
  globalThis.__FN_QA_IN = true;
  try {
    return _kRise(ctx, text, x, y, o);
  } finally {
    globalThis.__FN_QA_IN = false;
  }
}
function _kRise(ctx, text, x, y, o = {}) {
  {
  const { t = 1, out = 0, alpha = 1, align = 'center', stagger = 0.4, mask = true } = o;
  if (alpha <= 0.003 || t <= 0 || out >= 1) return 0;
  const P = tOpts(o, text);
  const L = glyphLayout(text, P.size, P.weight, P.fam, P.spacing);
  const x0 = align === 'center' ? x - L.total / 2 : align === 'right' ? x - L.total : x;
  const n = L.chars.length;
  ctx.save();
  if (mask) {
    ctx.beginPath();
    ctx.rect(x0 - P.size, y - P.size * 1.25 - P.glow, L.total + P.size * 2, P.size * 1.55 + P.glow * 1.5);
    ctx.clip();
  }
  for (let i = 0; i < n; i++) {
    if (L.chars[i] === ' ') continue;
    const st = n > 1 ? (i / (n - 1)) * stagger : 0;
    const lt = clamp((t - st) / Math.max(0.0001, 1 - stagger));
    const ot = clamp((out - st) / Math.max(0.0001, 1 - stagger));
    if (lt <= 0 || ot >= 1) continue;
    const e = eOutExpo(lt);
    const dy = (1 - e) * P.size * 1.05 - eInCubic(ot) * P.size * 1.1;
    const S = textSprite(L.chars[i], P);
    drawSprite(ctx, S, x0 + L.xs[i], y + dy, { align: 'left', alpha: alpha * clamp(lt * 2.2) * (1 - ot * 0.6) });
  }
  ctx.restore();
  return L.total;
  }
}

/** Bloc entier qui glisse depuis un masque (direction dir: 'up' | 'down' | 'left' | 'right'). */
function kSlide(ctx, text, x, y, o = {}) {
  qaG();
  const { t = 1, out = 0, alpha = 1, align = 'center', dir = 'up', base = 'alphabetic', dist = 1 } = o;
  if (alpha <= 0.003 || t <= 0 || out >= 1) return 0;
  const P = tOpts(o, text);
  const S = textSprite(text, P);
  const e = eOutExpo(t);
  const eo = eInCubic(out);
  const D = P.size * 1.1 * dist;
  let dx = 0;
  let dy = 0;
  if (dir === 'up') dy = (1 - e) * D - eo * D;
  if (dir === 'down') dy = -(1 - e) * D + eo * D;
  if (dir === 'left') dx = (1 - e) * D * 2 - eo * D * 2;
  if (dir === 'right') dx = -(1 - e) * D * 2 + eo * D * 2;
  const ax = align === 'center' ? S.w / 2 : align === 'right' ? S.w : 0;
  const ay = base === 'middle' ? -S.cap / 2 : 0;
  ctx.save();
  ctx.beginPath();
  if (dir === 'up' || dir === 'down') ctx.rect(x - ax - P.glow - 20, y + ay - S.asc - P.glow - 4, S.w + P.glow * 2 + 40, S.asc + S.desc + P.glow * 2 + 8);
  else ctx.rect(x - ax - 4, y + ay - S.asc - P.glow - 20, S.w + 8, S.asc + S.desc + P.glow * 2 + 40);
  ctx.clip();
  drawSprite(ctx, S, x + dx, y + dy, { align, base, alpha: alpha * clamp(t * 3) });
  ctx.restore();
  return S.w;
}

/** Balayage horizontal avec arête lumineuse qui court devant le texte. */
function kWipe(ctx, text, x, y, o = {}) {
  qaG();
  const { t = 1, out = 0, alpha = 1, align = 'center', edge = C.amber, base = 'alphabetic' } = o;
  if (alpha <= 0.003 || t <= 0 || out >= 1) return 0;
  const P = tOpts(o, text);
  const S = textSprite(text, P);
  const ax = align === 'center' ? S.w / 2 : align === 'right' ? S.w : 0;
  const ay = base === 'middle' ? -S.cap / 2 : 0;
  const e = eInOutQuart(t);
  const eo = eInOutQuart(out);
  const left = x - ax;
  const xa = left + S.w * eo;
  const xb = left + S.w * e;
  if (xb <= xa) return S.w;
  ctx.save();
  ctx.beginPath();
  ctx.rect(xa, y + ay - S.asc - P.glow - 10, xb - xa, S.asc + S.desc + P.glow * 2 + 20);
  ctx.clip();
  drawSprite(ctx, S, x, y, { align, base, alpha });
  ctx.restore();
  const edgeA = alpha * (t < 1 ? 1 : 0) * (1 - smooth(seg(t, 0.85, 1)));
  if (edgeA > 0.01) {
    ctx.save();
    ctx.globalAlpha *= edgeA;
    ctx.fillStyle = edge;
    ctx.shadowColor = edge;
    ctx.shadowBlur = 18;
    ctx.fillRect(xb - 1.5, y + ay - S.asc - 6, 3, S.asc + S.desc + 12);
    ctx.restore();
    light(ctx, xb, y + ay - S.cap / 2, P.size * 0.9, edge, edgeA * 0.6);
  }
  return S.w;
}

/** Zoom typographique : le sprite (rendu en haute résolution) se pose de scale0 à 1. */
function kZoom(ctx, text, x, y, o = {}) {
  qaG();
  const { t = 1, out = 0, alpha = 1, align = 'center', base = 'alphabetic', from = 1.35 } = o;
  if (alpha <= 0.003 || t <= 0 || out >= 1) return 0;
  const P = tOpts({ ...o, res: Math.max(o.res || 1, from) }, text);
  const S = textSprite(text, P);
  const e = eOutExpo(t);
  const s = lerp(from, 1, e) * lerp(1, 0.92, eInCubic(out));
  drawSprite(ctx, S, x, y, { align, base, alpha: alpha * clamp(t * 2.5) * (1 - eInCubic(out)), scale: s });
  return S.w;
}

/** Mots successifs (chaque mot glisse et s'allume à son temps). times : secondes. */
function kWords(ctx, words, x, y, o = {}) {
  const { time = 0, times = [], alpha = 1, align = 'center', gapEm = 0.32, dur = 0.7, out = 0 } = o;
  const P = tOpts(o);
  const g = mctx();
  g.font = _font(P.weight, P.size, P.fam);
  g.letterSpacing = `${P.spacing}px`;
  const ws = words.map((wd) => g.measureText(wd).width - P.spacing);
  const gap = P.size * gapEm;
  const total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  words.forEach((wd, i) => {
    const t = seg(time, times[i] ?? 0, (times[i] ?? 0) + dur);
    kSlide(ctx, wd, cx, y, { ...o, t, out, align: 'left', alpha, dir: 'up' });
    cx += ws[i] + gap;
  });
  return total;
}

/** Étiquette IBM Plex Mono révélée façon terminal (texte fixe → aucune vibration). */
function mono(ctx, text, x, y, o = {}) {
  qaG();
  const { size = 20, color = C.slate, alpha = 1, align = 'center', spacing = 5, weight = 500, t = 1, cursor = true } = o;
  if (alpha <= 0.003 || t <= 0) return 0;
  const P = tOpts({ size, weight, fam: MONO, color, spacing });
  const L = glyphLayout(text, P.size, P.weight, MONO, spacing);
  const shown = Math.ceil(L.chars.length * clamp(t));
  const x0 = align === 'center' ? x - L.total / 2 : align === 'right' ? x - L.total : x;
  const S = textSprite(text, P);
  const cutX = shown >= L.chars.length ? L.total + 4 : L.xs[shown] ?? L.total;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 - 8, y - P.size * 1.4, cutX + 8, P.size * 2.8);
  ctx.clip();
  drawSprite(ctx, S, x0, y, { align: 'left', base: 'middle', alpha });
  ctx.restore();
  if (cursor && t < 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = C.amber;
    ctx.fillRect(x0 + cutX + 2, y - P.size * 0.45, P.size * 0.55, P.size * 0.9);
    ctx.restore();
  }
  return L.total;
}

/** Nombre français (virgule décimale, espace fine des milliers). */
function frNum(v, dec = 0) {
  const s = Math.abs(v).toFixed(dec).split('.');
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (v < 0 ? '−' : '') + s.join(',');
}

/**
 * COMPTEUR « ODOMÈTRE » : chaque chiffre roule verticalement dans un masque.
 * value peut être fractionnaire (le roulement est continu, sans saut de pixel).
 * fmt(valeurEntièreArrondie) → chaîne affichée ; le chiffre des unités roule.
 */
function odometer(ctx, value, x, y, o = {}) {
  qaG();
  globalThis.__FN_QA_IN = true;
  try {
    return _odometer(ctx, value, x, y, o);
  } finally {
    globalThis.__FN_QA_IN = false;
  }
}
function _odometer(ctx, value, x, y, o = {}) {
  {
  const { alpha = 1, align = 'center', dec = 0, suffix = '', prefix = '', suffixColor = null, suffixScale = 1, roll = true } = o;
  if (alpha <= 0.003) return 0;
  const P = tOpts(o);
  const scaleF = Math.pow(10, dec);
  const v = Math.max(0, value) * scaleF;
  const finalStr = frNum(Math.floor(v + 1e-6) / scaleF, dec);
  const g = mctx();
  g.font = _font(P.weight, P.size, P.fam);
  g.letterSpacing = `${P.spacing}px`;
  const digitW = Math.max(...'0123456789'.split('').map((d) => g.measureText(d).width));
  const chars = [...finalStr];
  const widths = chars.map((ch) => (/\d/.test(ch) ? digitW : g.measureText(ch).width));
  const sufP = suffix ? tOpts({ ...o, size: Math.floor(P.size * suffixScale), color: suffixColor || P.color }) : null;
  const sufS = suffix ? textSprite(suffix, sufP) : null;
  const preS = prefix ? textSprite(prefix, sufP || P) : null;
  const total = widths.reduce((a, b) => a + b, 0) + (sufS ? sufS.w + P.size * 0.12 : 0) + (preS ? preS.w + P.size * 0.12 : 0);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const S0 = textSprite('0', P);
  const lineH = P.size * 1.08;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (preS) {
    drawSprite(ctx, preS, cx, y, { align: 'left' });
    cx += preS.w + P.size * 0.12;
  }
  ctx.beginPath();
  ctx.rect(cx - 4, y - S0.asc - P.glow * 0.6 - 4, total + 8, S0.asc + S0.desc * 0.6 + P.glow * 1.2 + 8);
  ctx.save();
  ctx.clip();
  // position décimale de chaque chiffre : on reconstitue la valeur entière pour faire rouler les unités
  const digitsIdx = [];
  chars.forEach((ch, i) => {
    if (/\d/.test(ch)) digitsIdx.push(i);
  });
  const nd = digitsIdx.length;
  chars.forEach((ch, i) => {
    if (!/\d/.test(ch)) {
      drawSprite(ctx, textSprite(ch, P), cx, y, { align: 'left' });
      cx += widths[i];
      return;
    }
    const k = nd - 1 - digitsIdx.indexOf(i); // rang (0 = unités)
    const place = Math.pow(10, k);
    const raw = v / place;
    const dgt = Math.floor(raw) % 10;
    // la roulette ne bouge que pendant la dernière fraction de la dizaine inférieure
    const unitFrac = v - Math.floor(v);
    const carry = k === 0 || Math.floor(v) % place === place - 1;
    const frac = !roll || !carry ? 0 : unitFrac;
    const next = (dgt + 1) % 10;
    const off = frac * lineH;
    drawSprite(ctx, textSprite(String(dgt), P), cx + (digitW - textSprite(String(dgt), P).w) / 2, y - off, { align: 'left' });
    if (off > 0.01) drawSprite(ctx, textSprite(String(next), P), cx + (digitW - textSprite(String(next), P).w) / 2, y - off + lineH, { align: 'left' });
    cx += digitW;
  });
  ctx.restore();
  if (sufS) drawSprite(ctx, sufS, cx + P.size * 0.12, y, { align: 'left' });
  ctx.restore();
  return total;
  }
}

/** Soulignement lumineux qui se trace en direct (bicolore par défaut). */
function underline(ctx, x, y, w, t, o = {}) {
  const { colorA = C.cyan, colorB = C.amber, alpha = 1, thick = 3, align = 'center', gap = 10 } = o;
  if (t <= 0 || alpha <= 0.003) return;
  const e = eOutExpo(t);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.shadowBlur = 12;
  if (align === 'center') {
    const half = (w / 2) * e;
    ctx.fillStyle = colorA;
    ctx.shadowColor = colorA;
    ctx.fillRect(x - gap / 2 - half, y, half, thick);
    ctx.fillStyle = colorB;
    ctx.shadowColor = colorB;
    ctx.fillRect(x + gap / 2, y, half, thick);
  } else {
    const x0 = align === 'left' ? x : x - w;
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);
    ctx.fillStyle = g;
    ctx.shadowColor = colorA;
    if (align === 'left') ctx.fillRect(x0, y, w * e, thick);
    else ctx.fillRect(x0 + w * (1 - e), y, w * e, thick);
  }
  ctx.restore();
}

/* ════════════════════════════════════════════════════════════════════════
 * 6. MOTIFS DE LA CHARTE
 * ════════════════════════════════════════════════════════════════════════ */

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

function shockwave(ctx, x, y, maxR, time, o = {}) {
  const { color = C.coral, count = 3, period = 2.2, alpha = 1, width = 2.5 } = o;
  if (alpha <= 0.003) return;
  for (let i = 0; i < count; i++) {
    const ph = ((time / period + i / count) % 1 + 1) % 1;
    const r = maxR * eOutCubic(ph);
    ring(ctx, x, y, r, { color, width: width * (1 - ph * 0.6), alpha: alpha * (1 - ph) * 0.9, glow: 14 });
  }
  light(ctx, x, y, maxR * 0.35, color, 0.5 * alpha);
}

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

function arrowHead(ctx, x, y, ang, s, color, alpha = 1) {
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = s;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.7, -s * 0.62);
  ctx.lineTo(-s * 0.35, 0);
  ctx.lineTo(-s * 0.7, s * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Emblème FRANC NORD vectoriel animable pièce par pièce. */
function emblem(ctx, x, y, r, o = {}) {
  const { star = 1, ringT = 1, needle = 1, cardinals = 1, alpha = 1, time = 0, swing = 0 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  if (ringT > 0) {
    const e = eInOutQuart(ringT);
    ring(ctx, 0, 0, r, { color: C.cyan, width: Math.max(1.5, r * 0.028), a0: Math.PI * 1.44 - Math.PI * 0.88 * e, sweep: Math.PI * 0.88 * e, glow: r * 0.16 });
    ring(ctx, 0, 0, r, { color: C.amber, width: Math.max(1.5, r * 0.028), a0: -Math.PI * 0.44, sweep: Math.PI * 0.88 * e, glow: r * 0.16 });
  }
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

/** Plan caméra : translation + zoom (+ rotation) autour d'un point focal. */
function camera(ctx, stage, fx, fy, zoom, fn, rot = 0) {
  ctx.save();
  ctx.translate(stage.cx, stage.cy);
  ctx.rotate(rot);
  ctx.scale(zoom, zoom);
  ctx.translate(-fx, -fy);
  fn();
  ctx.restore();
}
/** Conversion monde → écran pour une caméra (fx, fy, zoom). */
function camPt(stage, fx, fy, zoom, x, y) {
  return { x: stage.cx + (x - fx) * zoom, y: stage.cy + (y - fy) * zoom };
}

/** Polyligne lumineuse tracée progressivement (pts écran {x,y}). */
function glowPath(ctx, pts, t, o = {}) {
  const { color = C.amber, width = 3, alpha = 1, head = true, from = 0, glow = 1, dash = null } = o;
  if (t <= from || pts.length < 2 || alpha <= 0.003) return null;
  const n = pts.length - 1;
  const endF = clamp(t) * n;
  const startF = clamp(from) * n;
  const build = () => {
    ctx.beginPath();
    const i0 = Math.floor(startF);
    const f0 = startF - i0;
    const a = pts[i0];
    const b = pts[Math.min(n, i0 + 1)];
    ctx.moveTo(lerp(a.x, b.x, f0), lerp(a.y, b.y, f0));
    for (let i = i0 + 1; i <= Math.floor(endF); i++) ctx.lineTo(pts[i].x, pts[i].y);
    const ie = Math.min(n - 1, Math.floor(endF));
    const fe = endF - ie;
    ctx.lineTo(lerp(pts[ie].x, pts[ie + 1].x, fe), lerp(pts[ie].y, pts[ie + 1].y, fe));
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  if (glow > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha *= 0.14 * alpha * glow;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * 5;
    build();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
  }
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  build();
  ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= 0.5;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = Math.max(1, width * 0.35);
  build();
  ctx.stroke();
  ctx.restore();
  const ie = Math.min(n - 1, Math.floor(endF));
  const fe = endF - ie;
  const hp = { x: lerp(pts[ie].x, pts[ie + 1].x, fe), y: lerp(pts[ie].y, pts[ie + 1].y, fe), ang: Math.atan2(pts[ie + 1].y - pts[ie].y, pts[ie + 1].x - pts[ie].x) };
  if (head && t < 0.999) {
    light(ctx, hp.x, hp.y, width * 9, color, 0.9 * alpha);
    light(ctx, hp.x, hp.y, width * 3, C.white, 0.9 * alpha);
  }
  return hp;
}

/** Courbe de Bézier quadratique échantillonnée (pour arcs écran). */
function quadPts(a, b, lift, n = 64) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / L) * lift;
  const cy = my + (dx / L) * lift;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push({ x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y });
  }
  return out;
}

/** Point le long d'une polyligne à la fraction t. */
function along(pts, t) {
  const n = pts.length - 1;
  const f = clamp(t) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const k = f - i;
  return { x: lerp(pts[i].x, pts[i + 1].x, k), y: lerp(pts[i].y, pts[i + 1].y, k), ang: Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x) };
}

/** Rectangle arrondi (chemin seulement). */
function rrect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Vignette « photo » : cadre arrondi, ciel dégradé, montagne et soleil. */
function photoCard(ctx, x, y, w, h, o = {}) {
  const { alpha = 1, tint = C.amber, rot = 0, glow = 0, variant = 0 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha *= alpha;
  if (glow > 0) light(ctx, 0, 0, Math.max(w, h) * 1.2, tint, glow);
  rrect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.08);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, mix(tint, C.night, 0.55));
  g.addColorStop(1, mix(tint, C.night, 0.82));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = rgba(C.white, 0.85);
  ctx.beginPath();
  ctx.arc(w * (variant % 2 ? -0.22 : 0.22), -h * 0.18, Math.min(w, h) * 0.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(tint, 0.95);
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(-w * 0.18, -h * 0.02);
  ctx.lineTo(w * 0.02, h * 0.18);
  ctx.lineTo(w * 0.22, -h * 0.08);
  ctx.lineTo(w / 2, h * 0.3);
  ctx.lineTo(w / 2, h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  rrect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.08);
  ctx.strokeStyle = rgba(C.white, 0.75);
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.035);
  ctx.stroke();
  ctx.restore();
}

/** Silhouette humaine minimaliste (tête + buste). */
function person(ctx, x, y, s, color, alpha = 1) {
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.62, s * 0.22, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.36, y);
  ctx.quadraticCurveTo(x - s * 0.36, y - s * 0.36, x, y - s * 0.36);
  ctx.quadraticCurveTo(x + s * 0.36, y - s * 0.36, x + s * 0.36, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Bouclier géométrique facetté. */
function shieldPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.82, y - s * 0.68);
  ctx.lineTo(x + s * 0.74, y + s * 0.18);
  ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.78, x, y + s * 1.05);
  ctx.quadraticCurveTo(x - s * 0.5, y + s * 0.78, x - s * 0.74, y + s * 0.18);
  ctx.lineTo(x - s * 0.82, y - s * 0.68);
  ctx.closePath();
}
function shield(ctx, x, y, s, o = {}) {
  const { color = C.cyan, alpha = 1, draw = 1, fill = 0.14, time = 0 } = o;
  if (alpha <= 0.003 || draw <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  light(ctx, x, y, s * 2.2, color, 0.35 * draw);
  shieldPath(ctx, x, y, s);
  const g = ctx.createLinearGradient(x - s, y - s, x + s, y + s);
  g.addColorStop(0, rgba(color, fill * 1.6 * draw));
  g.addColorStop(0.5, rgba(color, fill * 0.4 * draw));
  g.addColorStop(1, rgba(color, fill * 1.2 * draw));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.setLineDash([s * 6 * clamp(draw), s * 6]);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.04);
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.25;
  ctx.stroke();
  ctx.setLineDash([]);
  // facettes internes
  ctx.globalAlpha *= 0.45 * clamp(draw * 2 - 1);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x, y + s * 1.05);
  ctx.moveTo(x - s * 0.74, y + s * 0.18);
  ctx.lineTo(x, y - s * 0.2);
  ctx.lineTo(x + s * 0.74, y + s * 0.18);
  ctx.stroke();
  // reflet qui balaie
  const sweep = ((time * 0.35) % 1.6) - 0.3;
  ctx.save();
  shieldPath(ctx, x, y, s);
  ctx.clip();
  ctx.globalAlpha = alpha * 0.18 * draw;
  ctx.globalCompositeOperation = 'lighter';
  const sg = ctx.createLinearGradient(x - s + sweep * s * 2.4, y - s, x - s * 0.6 + sweep * s * 2.4, y + s);
  sg.addColorStop(0, 'rgba(255,255,255,0)');
  sg.addColorStop(0.5, 'rgba(255,255,255,1)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - s * 1.2, y - s * 1.2, s * 2.4, s * 2.4);
  ctx.restore();
  ctx.restore();
}

/* ════════════════════════════════════════════════════════════════════════
 * 7. GÉOGRAPHIE VECTORIELLE (lon, lat) — continents stylisés
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

/* ── Lieux (épisode 3 + reportage épicerie) ──────────────────────────────────────── */
const PLACES = {
  quebec: [-71.21, 46.81],
  montreal: [-73.57, 45.5],
  gatineau: [-75.7, 45.48],
  ottawa: [-75.7, 45.42],
  sherbrooke: [-71.89, 45.4],
  troisRivieres: [-72.55, 46.35],
  rimouski: [-68.52, 48.45],
  toronto: [-79.38, 43.65],
  vancouver: [-123.12, 49.28],
  rome: [12.5, 41.9],
  milan: [9.19, 45.46],
  naples: [14.27, 40.85],
  geneva: [6.14, 46.2],
  brussels: [4.35, 50.85],
  lisbon: [-9.14, 38.72],
  porto: [-8.61, 41.15],
  paris: [2.35, 48.86],
  lyon: [4.84, 45.76],
  marseille: [5.37, 43.3],
  toulouse: [1.44, 43.6],
  bordeaux: [-0.58, 44.84],
  nantes: [-1.55, 47.22],
  lille: [3.06, 50.63],
  strasbourg: [7.75, 48.57],
  rennes: [-1.68, 48.11],
  montpellier: [3.88, 43.61],
  nice: [7.26, 43.7],
  grenoble: [5.72, 45.19],
  dublin: [-6.26, 53.35],
  madrid: [-3.7, 40.42],
  washington: [-77.04, 38.9],
  newYork: [-74, 40.7],
  siliconValley: [-122.05, 37.38],
  seattle: [-122.33, 47.6],
  beijing: [116.4, 39.9],
  phnomPenh: [104.92, 11.56],
  manila: [120.98, 14.6],
  bangkok: [100.5, 13.75],
  hanoi: [105.85, 21.03],
  vientiane: [102.6, 17.97],
  kualaLumpur: [101.69, 3.14],
  singapore: [103.82, 1.35],
  jakarta: [106.85, -6.2],
  bandar: [114.94, 4.9],
  naypyidaw: [96.13, 19.75],
  dili: [125.57, -8.56],
  kinshasa: [15.31, -4.32],
  kigali: [30.06, -1.95],
  goma: [29.22, -1.68],
  dakar: [-17.45, 14.7],
  abidjan: [-4.02, 5.35],
  tunis: [10.18, 36.8],
  rabat: [-6.84, 34.02],
  tokyo: [139.7, 35.7],
  seoul: [126.98, 37.57],
  sydney: [151.2, -33.87],
  hongKong: [114.17, 22.3],
  hcm: [106.7, 10.78],
  bucharest: [26.1, 44.43],
  beirut: [35.5, 33.89],
  yaounde: [11.52, 3.85],
  antananarivo: [47.52, -18.88],
  portAuPrince: [-72.34, 18.54],
  bamako: [-8.0, 12.64],
  niamey: [2.11, 13.51],
  albany: [-73.76, 42.65],
  hartford: [-72.68, 41.76],
  trenton: [-74.76, 40.22],
  annapolis: [-76.49, 38.98],
  baltimore: [-76.61, 39.29],
  boston: [-71.06, 42.36],
  philadelphia: [-75.16, 39.95],
  saguenay: [-71.07, 48.43],
  septIles: [-66.38, 50.22],
  rouyn: [-79.02, 48.24],
  gaspe: [-64.48, 48.83],
  baieComeau: [-68.15, 49.22],
  valdor: [-77.78, 48.1],
  drummondville: [-72.48, 45.88]
};
const P = (k) => PLACES[k];

/**
 * Champ de points de terre régional à haute densité (cache).
 * Renvoie Float32Array [lon, lat, lon, lat, …].
 */
function regionDots(key, lon0, lon1, lat0, lat1, step) {
  return cached(`rd_${key}_${step}`, () => {
    const out = [];
    let row = 0;
    for (let la = lat0; la <= lat1; la += step, row++) {
      const ls = step / Math.max(0.3, Math.cos(la * D2R));
      const off = (row % 2) * ls * 0.5;
      for (let lo = lon0 + off; lo <= lon1; lo += ls) if (isLand(lo, la)) out.push(lo, la);
    }
    return new Float32Array(out);
  });
}
/** Points de terre du Québec (silhouette QUEBEC). */
function quebecDots(step) {
  return cached('qcd' + step, () => {
    const out = [];
    let row = 0;
    for (let la = 44.8; la <= 62.6; la += step, row++) {
      const ls = step / Math.cos(la * D2R);
      const off = (row % 2) * ls * 0.5;
      for (let lo = -79.8 + off; lo <= -56.8; lo += ls) {
        if (QUEBEC.some((poly) => insidePoly(lo, la, poly))) out.push(lo, la);
      }
    }
    return new Float32Array(out);
  });
}

/**
 * Projection « table inclinée » : carte plate vue en perspective
 * (caméra au-dessus d'un plan basculé de `tilt` radians).
 * lon0/lat0 = point visé, scale = px/degré au point visé, yaw = rotation au sol.
 */
function makeTilt(lon0, lat0, scale, cx, cy, tilt = 0.9, focal = 1400, yaw = 0) {
  const k = Math.cos(lat0 * D2R);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const cyw = Math.cos(yaw);
  const syw = Math.sin(yaw);
  return {
    scale,
    project(lon, lat, alt = 0) {
      let X = (lon - lon0) * scale * k;
      let Y = -(lat - lat0) * scale;
      const Xr = X * cyw - Y * syw;
      const Yr = X * syw + Y * cyw;
      // plan sol : Y vers la profondeur ; altitude vers le haut
      const yc = Yr * ct - alt;
      const z = focal + Yr * st;
      const s = focal / Math.max(80, z);
      return { x: cx + Xr * s, y: cy + yc * s, z, s, vis: z > 80 };
    }
  };
}

/** Rendu d'un champ de points (flat ou tilt) avec mise en lumière optionnelle. */
function drawDots(ctx, Pj, dots, o = {}) {
  const { color = C.cyan, alpha = 1, size = 2.2, hl = null, hlColor = C.amber, depthFade = false, clipFn = null, fade = null } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.fillStyle = color;
  const hot = [];
  const b0 = [];
  const b1 = [];
  for (let i = 0; i < dots.length; i += 2) {
    const q = Pj.project(dots[i], dots[i + 1]);
    if (!q.vis) continue;
    if (clipFn && !clipFn(q)) continue;
    if (fade) {
      // bord organique : disparition tramée au-delà de 60 % du rayon
      const dd = Math.hypot(q.x - fade.x, q.y - fade.y) / fade.r;
      const hsh = ((i * 2654435761) >>> 0) / 4294967296;
      if (hsh < smooth((dd - 0.55) / 0.45)) continue;
    }
    const s = size * (q.s || 1);
    if (depthFade && q.s < 0.85) b0.push(q.x, q.y, s);
    else b1.push(q.x, q.y, s);
    if (hl) {
      const h = hl(dots[i], dots[i + 1]);
      if (h > 0.02) hot.push(q.x, q.y, s, h);
    }
  }
  const pass = (arr, a) => {
    if (!arr.length) return;
    ctx.globalAlpha = alpha * a;
    ctx.beginPath();
    for (let i = 0; i < arr.length; i += 3) ctx.rect(arr[i] - arr[i + 2] / 2, arr[i + 1] - arr[i + 2] / 2, arr[i + 2], arr[i + 2]);
    ctx.fill();
  };
  pass(b0, 0.35);
  pass(b1, 0.62);
  if (hot.length) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hlColor;
    for (let i = 0; i < hot.length; i += 4) {
      ctx.globalAlpha = alpha * clamp(hot[i + 3]);
      const s = hot[i + 2] * 1.3;
      ctx.fillRect(hot[i] - s / 2, hot[i + 1] - s / 2, s, s);
    }
  }
  ctx.restore();
}

/** Contour d'un polygone (lon,lat) projeté — tracé progressif `draw`. */
function polyStroke(ctx, Pj, poly, o = {}) {
  const { color = C.cyan, alpha = 1, width = 2, draw = 1, glow = 14, fill = 0 } = o;
  if (alpha <= 0.003 || draw <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  for (let i = 0; i < poly.length; i += 2) {
    const q = Pj.project(poly[i], poly[i + 1]);
    if (i === 0) ctx.moveTo(q.x, q.y);
    else ctx.lineTo(q.x, q.y);
  }
  ctx.closePath();
  if (fill > 0) {
    ctx.fillStyle = rgba(color, fill * clamp(draw * 1.5 - 0.5));
    ctx.fill();
  }
  if (draw < 1) ctx.setLineDash([6000 * draw, 6000]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.stroke();
  ctx.restore();
}

/** Étiquette de ville : point + nom (sprite fixe, posé en écran). */
function cityTag(ctx, x, y, name, o = {}) {
  const { color = C.amber, alpha = 1, t = 1, size = 22, side = 'right', time = 0, r = 6, pulse = false } = o;
  if (alpha <= 0.003 || t <= 0) return;
  beacon(ctx, x, y, { color, r: r * eOutBack(seg(t, 0, 0.5), 2.2), alpha, time, pulse });
  const off = r * 2.4;
  const tt = seg(t, 0.15, 1);
  if (side === 'right') kWipe(ctx, name, x + off, y, { size, weight: 700, color: C.white, t: tt, alpha, align: 'left', base: 'middle', edge: color });
  else if (side === 'left') kWipe(ctx, name, x - off, y, { size, weight: 700, color: C.white, t: tt, alpha, align: 'right', base: 'middle', edge: color });
  else if (side === 'top') kWipe(ctx, name, x, y - off - size * 0.2, { size, weight: 700, color: C.white, t: tt, alpha, align: 'center', base: 'alphabetic', edge: color });
  else kWipe(ctx, name, x, y + off + size * 0.9, { size, weight: 700, color: C.white, t: tt, alpha, align: 'center', base: 'alphabetic', edge: color });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 01 — rep-ouverture-choc · Votre voisin paie-t-il le même prix que vous à l'épicerie ?
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : l'emblème naît, puis se condense en faisceau laser qui balaie un code-barres monumental
 * Acte II  : la facture s'allonge ; les barres s'écartent en parallaxe et libèrent 4 strates lumineuses
 * Acte III : les strates se replient en un faisceau ; titre « SPÉCIAL REPORTAGE / L'ÉPICERIE SOUS ALGORITHME » */

const S01_BARS = (() => {
  const r = rng(4021);
  const out = [];
  let x = 0;
  for (let i = 0; i < 58; i++) {
    const wd = [1, 1, 2, 3, 1, 4, 2][Math.floor(r() * 7)];
    const gap = [1, 2, 1, 3][Math.floor(r() * 4)];
    out.push({ x, wd, depth: r(), guard: i < 2 || i > 55 || i === 28 || i === 29 });
    x += wd + gap;
  }
  return { bars: out, total: x };
})();

/** Pictogrammes vectoriels des quatre strates. */
function s01_icon(ctx, kind, x, y, s, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = rgba(color, 0.16);
  ctx.lineWidth = Math.max(2, s * 0.07);
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.35;
  if (kind === 'tag') {
    rrect(ctx, -s * 0.62, -s * 0.38, s * 1.24, s * 0.76, s * 0.1);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-s * 0.46, -s * 0.18, s * 0.52, s * 0.14);
    ctx.fillRect(-s * 0.46, s * 0.06, s * 0.3, s * 0.1);
    ctx.beginPath();
    ctx.arc(s * 0.4, -s * 0.2, s * 0.07, 0, TAU);
    ctx.fill();
  } else if (kind === 'file') {
    for (let k = 2; k >= 0; k--) {
      rrect(ctx, -s * 0.42 + k * s * 0.12, -s * 0.5 - k * s * 0.1, s * 0.72, s * 0.94, s * 0.06);
      ctx.fillStyle = rgba(color, 0.1 + (2 - k) * 0.06);
      ctx.fill();
      ctx.stroke();
    }
    ctx.lineWidth = Math.max(1.5, s * 0.045);
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.28 + k * s * 0.16);
      ctx.lineTo(s * (k === 3 ? 0.0 : 0.16), -s * 0.28 + k * s * 0.16);
      ctx.stroke();
    }
  } else if (kind === 'lease') {
    rrect(ctx, -s * 0.4, -s * 0.52, s * 0.8, s * 1.0, s * 0.06);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-s * 0.26, -s * 0.3, s * 0.52, s * 0.12);
    ctx.fillRect(-s * 0.26, -s * 0.08, s * 0.52, s * 0.12);
    ctx.beginPath();
    ctx.arc(s * 0.2, s * 0.3, s * 0.15, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.1, s * 0.42);
    ctx.lineTo(s * 0.04, s * 0.62);
    ctx.moveTo(s * 0.3, s * 0.42);
    ctx.lineTo(s * 0.36, s * 0.62);
    ctx.stroke();
  } else {
    // caisse : reçu avec crochet
    ctx.beginPath();
    ctx.moveTo(-s * 0.36, -s * 0.52);
    ctx.lineTo(s * 0.36, -s * 0.52);
    ctx.lineTo(s * 0.36, s * 0.46);
    for (let k = 0; k < 6; k++) ctx.lineTo(s * 0.36 - (k + 0.5) * s * 0.12, s * (k % 2 ? 0.46 : 0.56));
    ctx.lineTo(-s * 0.36, s * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, s * 0.0);
    ctx.lineTo(-s * 0.04, s * 0.14);
    ctx.lineTo(s * 0.2, -s * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

function sceneOuvertureScanner(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    bienvenue: 'Bienvenue',
    speciale: 'édition spéciale',
    filtre: 'sans filtre',
    comm: 'sans commanditaire',
    ouvre: 'on ouvre un dossier',
    famille: 'chaque famille québécoise',
    semaine: 'à chaque semaine',
    mecanique: 'la mécanique complète',
    explosion: "l'explosion de votre facture",
    etiq: 'Étiquettes électroniques',
    pages: 'soixante pages',
    clauses: 'clauses secrètes',
    quinze: 'quinze dollars',
    voici: 'Voici notre enquête',
    machine: 'la nouvelle machine',
    geants: 'géants alimentaires'
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 90, alpha: 0.32, seed: 11 });

    /* ── ACTE I-a : naissance de l'emblème ── */
    const condense = eInOutQuart(seg(lt, T.ouvre - 0.5, T.ouvre + 0.5));
    const embA = 1 - condense;
    const ey = V ? h * 0.38 : h * 0.43;
    if (embA > 0.003) {
      const er = m * (V ? 0.17 : 0.13) * lerp(1, 0.25, condense);
      emblem(ctx, cx, ey, er, {
        ringT: seg(lt, 0.2, 1.6),
        needle: seg(lt, 0.5, 1.5),
        cardinals: seg(lt, 0.9, 1.9),
        star: seg(lt, 1.1, 2.0),
        alpha: embA,
        time: gt
      });
      const ty = ey + m * (V ? 0.3 : 0.27);
      mono(ctx, 'ÉDITION SPÉCIALE · REPORTAGE', cx, ty - m * 0.075, { size: Math.floor(m * 0.02), color: C.amber, spacing: 7, t: seg(lt, T.speciale - 0.3, T.speciale + 1.0), alpha: embA });
      if (V) {
        kWords(ctx, ['SANS', 'FILTRE'], cx, ty + m * 0.02, { size: Math.floor(m * 0.07), weight: 900, time: lt, times: [T.filtre, T.filtre + 0.2], alpha: embA });
        kWords(ctx, ['SANS', 'COMMANDITAIRE'], cx, ty + m * 0.11, { size: Math.floor(m * 0.07), weight: 900, time: lt, times: [T.comm, T.comm + 0.2], alpha: embA, color: C.amber });
      } else {
        kWords(ctx, ['SANS', 'FILTRE', '·', 'SANS', 'COMMANDITAIRE'], cx, ty, {
          size: Math.floor(m * 0.046),
          weight: 900,
          time: lt,
          times: [T.filtre, T.filtre + 0.2, T.filtre + 0.45, T.comm, T.comm + 0.2],
          alpha: embA,
          gapEm: 0.3
        });
      }
    }

    /* ── ACTE I-b : code-barres monumental + faisceau laser ── */
    const bcIn = eOutExpo(seg(lt, T.ouvre - 0.2, T.ouvre + 1.4));
    const split = eInOutQuart(seg(lt, T.etiq - 0.9, T.etiq + 0.6)); // barres qui s'écartent
    const bcA = bcIn * (1 - smooth(seg(lt, T.etiq + 0.2, T.etiq + 1.2)));
    const bw = V ? w * 0.8 : w * 0.5;
    const bh = V ? h * 0.2 : h * 0.4;
    const fShift = smoother(seg(lt, T.explosion - 0.4, T.explosion + 1.2)) * (1 - split);
    const bcx = V ? cx : cx - w * 0.11 * fShift;
    const bcy = V ? h * 0.45 - h * 0.06 * fShift : h * 0.47;
    // travelling avant lent sur le code-barres puis traversée
    const zoom = track(lt, [
      [T.ouvre, 0.9],
      [T.explosion, 1.0, smoother],
      [T.etiq + 0.6, 1.9, eInExpo]
    ]);
    if (bcA > 0.003) {
      const { bars, total } = S01_BARS;
      const unit = bw / total;
      ctx.save();
      ctx.translate(bcx, bcy);
      ctx.scale(zoom, zoom);
      const reveal = eInOutQuart(seg(lt, T.ouvre + 0.1, T.mecanique + 0.4));
      bars.forEach((b, i) => {
        const bx = -bw / 2 + b.x * unit;
        const frac = i / bars.length;
        const vis = clamp((reveal - frac * 0.7) / 0.3);
        if (vis <= 0) return;
        const side = bx + (b.wd * unit) / 2 < 0 ? -1 : 1;
        const push = split * side * w * (0.25 + b.depth * 0.55);
        const hh = (b.guard ? bh * 1.08 : bh) * eOutExpo(vis);
        const g = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2);
        g.addColorStop(0, rgba(C.white, 0.95));
        g.addColorStop(1, rgba(C.ice, 0.55));
        ctx.globalAlpha = bcA * vis * (b.guard ? 1 : 0.85);
        ctx.fillStyle = b.guard ? C.amber : g;
        ctx.fillRect(bx + push, -bh / 2, b.wd * unit, hh);
      });
      ctx.restore();
      // chiffres sous le code
      const digitsY = bcy + (bh / 2) * zoom + m * 0.05;
      mono(ctx, '0 62890 14112 6', bcx, digitsY, { size: Math.floor(m * 0.024), color: C.slate, spacing: 10, t: seg(lt, T.famille, T.famille + 1.5), alpha: bcA * (1 - split) });
      // faisceau laser qui balaie
      const sweep = (Math.sin((lt - T.ouvre) * 2.1) * 0.5 + 0.5) * eInOutQuart(seg(lt, T.ouvre, T.ouvre + 0.8));
      const ly = bcy - (bh / 2) * zoom + bh * zoom * sweep;
      const laserA = bcA * smooth(seg(lt, T.ouvre - 0.1, T.ouvre + 0.5)) * (1 - split);
      if (laserA > 0.003) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const lg = ctx.createLinearGradient(bcx - bw * 0.62, 0, bcx + bw * 0.62, 0);
        lg.addColorStop(0, rgba(C.cyan, 0));
        lg.addColorStop(0.15, rgba(C.cyan, 0.9 * laserA));
        lg.addColorStop(0.85, rgba(C.cyan, 0.9 * laserA));
        lg.addColorStop(1, rgba(C.cyan, 0));
        ctx.fillStyle = lg;
        ctx.fillRect(bcx - bw * 0.62, ly - 2, bw * 1.24, 4);
        ctx.globalAlpha = 0.18 * laserA;
        ctx.fillRect(bcx - bw * 0.62, ly - 16, bw * 1.24, 32);
        ctx.restore();
        flare(ctx, bcx - bw * 0.6, ly, m * 0.05, C.cyan, laserA * 0.8);
      }
      // sur-titres de l'acte I
      const capY = V ? h * 0.2 : h * 0.16;
      const swapF = smooth(seg(lt, T.explosion - 0.4, T.explosion));
      kRise(ctx, 'CHAQUE FAMILLE', cx, capY, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.famille, T.famille + 0.9), out: swapF, alpha: bcA });
      mono(ctx, 'CHAQUE SEMAINE · LA MÉCANIQUE COMPLÈTE', cx, capY + m * 0.055, { size: Math.floor(m * 0.018), color: C.ice, spacing: 5, t: seg(lt, T.semaine, T.mecanique + 1.0), alpha: bcA * (1 - swapF) });
    }

    /* ── ACTE II-a : la facture qui s'allonge ── */
    const fA = env(lt, T.explosion - 0.3, T.etiq + 0.4, 0.4, 0.6);
    if (fA > 0.003) {
      const grow = eInOutExpo(seg(lt, T.explosion, T.explosion + 2.2));
      const rx = V ? cx : w * 0.79;
      const rTop = V ? h * 0.63 : h * 0.24;
      const rw = m * 0.16;
      const rh = (V ? h * 0.2 : h * 0.6) * (0.25 + 0.75 * grow);
      ctx.save();
      ctx.globalAlpha *= fA;
      light(ctx, rx, rTop + rh * 0.6, rw * 2.2, C.amber, 0.28);
      const g = ctx.createLinearGradient(0, rTop, 0, rTop + rh);
      g.addColorStop(0, rgba(C.white, 0.92));
      g.addColorStop(1, rgba(C.gold, 0.55));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(rx - rw / 2, rTop);
      ctx.lineTo(rx + rw / 2, rTop);
      ctx.lineTo(rx + rw / 2, rTop + rh);
      for (let k = 0; k < 8; k++) ctx.lineTo(rx + rw / 2 - (k + 0.5) * (rw / 8), rTop + rh + (k % 2 ? 0 : rw * 0.05));
      ctx.lineTo(rx - rw / 2, rTop + rh);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(C.night, 0.55);
      const lines = Math.floor(rh / (rw * 0.12));
      for (let k = 1; k < lines; k++) {
        const ly2 = rTop + k * rw * 0.12;
        ctx.fillRect(rx - rw * 0.38, ly2, rw * (k % 3 === 0 ? 0.5 : 0.62), 2.5);
        ctx.fillRect(rx + rw * 0.22, ly2, rw * 0.16, 2.5);
      }
      ctx.restore();
      // flèche qui monte
      const ax = V ? rx + rw * 0.95 : rx - rw * 1.05;
      const aBot = rTop + rh;
      const aTop = rTop + rh * 0.1;
      ctx.save();
      ctx.globalAlpha *= fA * grow;
      ctx.strokeStyle = C.amber;
      ctx.lineWidth = 4;
      ctx.shadowColor = C.amber;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(ax, aBot);
      ctx.lineTo(ax, aTop + 18);
      ctx.stroke();
      ctx.restore();
      arrowHead(ctx, ax, aTop, -Math.PI / 2, 18, C.amber, fA * grow);
      const lx = V ? cx : w * 0.79;
      const ly3 = V ? h * 0.585 : h * 0.17;
      kRise(ctx, 'VOTRE FACTURE', lx, ly3, { size: Math.floor(m * 0.046), weight: 900, color: C.amber, t: seg(lt, T.explosion + 0.2, T.explosion + 1.1), alpha: fA, glow: 18, glowColor: rgba(C.amber, 0.5) });
      mono(ctx, "D'ÉPICERIE", lx, ly3 + m * 0.05, { size: Math.floor(m * 0.019), color: C.gold, spacing: 8, t: seg(lt, T.explosion + 0.6, T.explosion + 1.5), alpha: fA });
    }

    /* ── ACTE II-b : quatre strates lumineuses en profondeur ── */
    const strata = [
      { k: T.etiq, kind: 'tag', col: C.cyan, a: 'ÉTIQUETTES', b: 'CONNECTÉES' },
      { k: T.pages, kind: 'file', col: C.ice, a: 'DOSSIERS DE', b: null, num: 60, suf: 'PAGES' },
      { k: T.clauses, kind: 'lease', col: C.amber, a: 'BAUX', b: 'SECRETS' },
      { k: T.quinze, kind: 'till', col: C.emerald, a: 'RÈGLE DES', b: null, num: 15, suf: '$' }
    ];
    const fold = eInOutQuart(seg(lt, T.voici - 0.2, T.voici + 0.9));
    const sA = smooth(seg(lt, T.etiq - 0.4, T.etiq + 0.3)) * (1 - smooth(seg(lt, T.voici + 0.5, T.voici + 1.1)));
    if (sA > 0.003) {
      const slabW = V ? w * 0.74 : w * 0.56;
      const slabH = V ? h * 0.085 : h * 0.13;
      const gapY = V ? h * 0.125 : h * 0.17;
      const baseY = V ? h * 0.31 : h * 0.24;
      // caméra : légère bascule continue (parallaxe par profondeur)
      const drift = track(lt, [[T.etiq, 1], [T.quinze + 1.4, 0, smoother]]);
      strata.forEach((s, i) => {
        const on = eOutExpo(seg(lt, s.k - 0.25, s.k + 0.9));
        if (on <= 0) return;
        const depth = 1 - i * 0.08;
        const yy = lerp(baseY + i * gapY, cy, fold);
        const xx = cx + (1 - on) * (i % 2 ? 1 : -1) * w * 0.6 * depth + drift * (i - 1.5) * m * 0.03;
        const sh = slabH * lerp(1, 0.04, fold);
        ctx.save();
        ctx.globalAlpha *= sA * on;
        // dalle de verre inclinée (parallélogramme)
        const sk = slabH * 0.35;
        const g = ctx.createLinearGradient(xx - slabW / 2, 0, xx + slabW / 2, 0);
        g.addColorStop(0, rgba(s.col, 0.2));
        g.addColorStop(0.5, rgba(s.col, 0.07));
        g.addColorStop(1, rgba(s.col, 0.02));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(xx - slabW / 2 + sk, yy - sh / 2);
        ctx.lineTo(xx + slabW / 2 + sk, yy - sh / 2);
        ctx.lineTo(xx + slabW / 2 - sk, yy + sh / 2);
        ctx.lineTo(xx - slabW / 2 - sk, yy + sh / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = rgba(s.col, 0.85);
        ctx.lineWidth = 1.5;
        ctx.shadowColor = s.col;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
        light(ctx, xx - slabW / 2 + sk, yy - sh / 2, m * 0.05, s.col, sA * on * 0.7);
        const textA = sA * on * (1 - fold);
        const ix = xx - slabW / 2 + slabH * 0.75;
        s01_icon(ctx, s.kind, ix, yy, slabH * 0.5, s.col, textA);
        const tx = ix + slabH * 0.62;
        const fs = Math.floor(m * (V ? 0.04 : 0.042));
        const tt = seg(lt, s.k - 0.1, s.k + 0.8);
        const bl = yy + textSprite('H', { size: fs, weight: 900 }).cap / 2; // ligne de base commune (texte centré sur la dalle)
        const used = kSlide(ctx, s.a, tx, bl, { size: fs, weight: 900, color: C.white, t: tt, alpha: textA, align: 'left', dir: 'up' });
        if (s.b) kSlide(ctx, s.b, tx + used + fs * 0.32, bl, { size: fs, weight: 900, color: s.col, t: seg(lt, s.k + 0.15, s.k + 1.0), alpha: textA, align: 'left', dir: 'up' });
        if (s.num) {
          const nv = s.num * eOutExpo(seg(lt, s.k, s.k + 1.0));
          odometer(ctx, nv, tx + used + fs * 0.32, bl, { size: fs, weight: 900, color: s.col, align: 'left', suffix: ' ' + s.suf, suffixColor: s.col, alpha: textA * smooth(seg(lt, s.k, s.k + 0.3)) });
        }
      });
    }

    /* ── ACTE III : le faisceau et le titre ── */
    const tA = smooth(seg(lt, T.voici + 0.3, T.voici + 0.9));
    if (tA > 0.003) {
      const beamW = w * eInOutQuart(seg(lt, T.voici, T.voici + 1.0));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bg = ctx.createLinearGradient(cx - beamW / 2, 0, cx + beamW / 2, 0);
      bg.addColorStop(0, rgba(C.cyan, 0));
      bg.addColorStop(0.3, rgba(C.cyan, 0.6));
      bg.addColorStop(0.5, rgba(C.white, 0.9));
      bg.addColorStop(0.7, rgba(C.amber, 0.6));
      bg.addColorStop(1, rgba(C.amber, 0));
      ctx.fillStyle = bg;
      ctx.globalAlpha = tA * (1 - 0.6 * smooth(seg(lt, T.voici + 1.2, T.voici + 2.4)));
      ctx.fillRect(cx - beamW / 2, cy - 1.5, beamW, 3);
      ctx.restore();
      flare(ctx, cx, cy, m * 0.12, C.ice, tA * (1 - smooth(seg(lt, T.voici + 0.6, T.voici + 2.0))));
      // lente poussée de caméra sur le titre (échelle de sprite, aucun changement de police)
      const push = lerp(1, 1.04, smoother(seg(lt, T.voici, D)));
      const t1y = cy - m * (V ? 0.05 : 0.055);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(push, push);
      ctx.translate(-cx, -cy);
      kRise(ctx, 'SPÉCIAL REPORTAGE', cx, t1y, { size: Math.floor(m * (V ? 0.1 : 0.105)), weight: 900, color: C.white, t: seg(lt, T.voici + 0.25, T.voici + 1.3), alpha: tA, glow: 26, glowColor: rgba(C.amber, 0.55), maxW: w * 0.88 });
      const t2y = cy + m * (V ? 0.075 : 0.085);
      kWipe(ctx, "L'ÉPICERIE SOUS ALGORITHME", cx, t2y, { size: Math.floor(m * (V ? 0.054 : 0.058)), weight: 800, color: C.cyan, t: seg(lt, T.voici + 0.8, T.voici + 1.9), alpha: tA, edge: C.amber, maxW: w * 0.86 });
      underline(ctx, cx, t2y + m * 0.035, V ? w * 0.7 : w * 0.42, seg(lt, T.voici + 1.4, T.voici + 2.4), { alpha: tA });
      mono(ctx, 'LA NOUVELLE MACHINE DES GÉANTS ALIMENTAIRES', cx, t2y + m * 0.09, { size: Math.floor(m * (V ? 0.017 : 0.018)), color: C.slate, spacing: 5, t: seg(lt, T.machine, T.geants + 1.2), alpha: tA * 0.85 });
      ctx.restore();
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 02 — rep-etiquettes-electroniques · Des milliers d'étiquettes modifiables en 3 secondes à distance
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : travelling dans une allée d'épicerie en perspective ; enseignes des bannières ; gros plan sur
 *            UNE étiquette électronique qui remplace l'étiquette papier
 * Acte II  : recul ; serveur central au fond de l'allée ; onde sans fil qui fait basculer toutes les
 *            étiquettes de 4,99 $ à 5,79 $ ; succursale · heure · météo
 * Acte III : l'allée se replie en courbe horaire de prix « façon billet d'avion » */

const S02_COLS = (() => {
  const r = rng(902);
  return Array.from({ length: 18 }, (_, k) => ({
    hue: [C.cyan, C.amber, C.emerald, C.coral, C.violet, C.ice][Math.floor(r() * 6)],
    hs: [0.55 + r() * 0.35, 0.55 + r() * 0.35, 0.55 + r() * 0.35, 0.55 + r() * 0.35],
    k
  }));
})();

/**
 * Étiquette électronique en gros plan (écran e-ink).
 * Anti-tremblement : tout est dessiné à une taille de base FIXE (o.base), puis mis à l'échelle par
 * transformation — les polices ne changent jamais de taille pendant le zoom.
 */
function s02_bigLabel(ctx, x, y, s, o) {
  const S0 = o.base;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / S0, s / S0);
  s02_bigLabelRaw(ctx, 0, 0, S0, o);
  ctx.restore();
}
function s02_bigLabelRaw(ctx, x, y, s, o) {
  const { alpha = 1, price = 4.99, paper = 0, flash = 0, time = 0 } = o;
  if (alpha <= 0.003) return;
  const W = s * 2.1;
  const H = s;
  ctx.save();
  ctx.globalAlpha *= alpha;
  light(ctx, x, y, s * 2.4, C.cyan, 0.22 + flash * 0.4);
  // boîtier
  rrect(ctx, x - W / 2, y - H / 2, W, H, s * 0.1);
  const g = ctx.createLinearGradient(0, y - H / 2, 0, y + H / 2);
  g.addColorStop(0, '#1E293B');
  g.addColorStop(1, '#0B1220');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(C.cyan, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();
  // écran e-ink
  const sx = x - W / 2 + s * 0.08;
  const sy = y - H / 2 + s * 0.08;
  const sw = W - s * 0.6;
  const sh = H - s * 0.16;
  rrect(ctx, sx, sy, sw, sh, s * 0.04);
  const eg = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
  eg.addColorStop(0, '#E8EDF2');
  eg.addColorStop(1, '#C9D2DC');
  ctx.fillStyle = eg;
  ctx.fill();
  ctx.restore();
  // prix (compteur à rouleaux, encre noire)
  const fs = Math.floor(s * 0.42);
  odometer(ctx, price, sx + sw * 0.08, sy + sh * 0.62, { size: fs, weight: 900, color: '#0B1220', dec: 2, align: 'left', suffix: ' $', suffixScale: 0.6, alpha: alpha * smooth(seg(paper, 0.2, 0.55)) });
  mono(ctx, 'ART. 0462 · 2 L', sx + sw * 0.08, sy + sh * 0.84, { size: Math.floor(s * 0.075), color: '#334155', align: 'left', spacing: 3, alpha: alpha * smooth(seg(paper, 0.2, 0.55)), cursor: false });
  // LED + code
  ctx.save();
  ctx.globalAlpha *= alpha;
  const lx = x + W / 2 - s * 0.26;
  ctx.fillStyle = mix(C.emerald, C.amber, flash);
  ctx.beginPath();
  ctx.arc(lx, y - H * 0.22, s * 0.06, 0, TAU);
  ctx.fill();
  light(ctx, lx, y - H * 0.22, s * 0.35, mix(C.emerald, C.amber, flash), 0.6 + 0.4 * Math.sin(time * 5) * flash);
  ctx.fillStyle = rgba(C.slate, 0.55);
  for (let k = 0; k < 9; k++) ctx.fillRect(lx - s * 0.14 + k * s * 0.032, y + H * 0.05, k % 3 ? s * 0.012 : s * 0.02, s * 0.26);
  ctx.restore();
  // étiquette papier qui se détache
  if (paper < 1) {
    const pe = eInCubic(paper);
    ctx.save();
    ctx.globalAlpha *= alpha * (1 - smooth(seg(paper, 0.6, 1)));
    ctx.translate(x - W * 0.05 + pe * s * 0.8, y + pe * s * 2.2);
    ctx.rotate(pe * 0.7);
    rrect(ctx, -W * 0.5, -H * 0.52, W * 1.0, H * 1.04, s * 0.03);
    ctx.fillStyle = '#F5F0E6';
    ctx.fill();
    ctx.fillStyle = rgba('#B45309', 0.9);
    ctx.fillRect(-W * 0.5, -H * 0.52, W, H * 0.16);
    ctx.restore();
    if (paper < 0.6) {
      ctx.save();
      ctx.translate(x - W * 0.05 + pe * s * 0.8, y + pe * s * 2.2);
      ctx.rotate(pe * 0.7);
      drawSprite(ctx, textSprite('4,99', { size: Math.floor(s * 0.4), weight: 800, color: '#1F2937' }), -W * 0.38, H * 0.2, { align: 'left', alpha: alpha * (1 - smooth(seg(paper, 0.4, 0.6))) });
      drawSprite(ctx, textSprite('PAPIER', { size: Math.floor(s * 0.09), weight: 700, fam: MONO, color: '#FFF7ED', spacing: 4 }), -W * 0.44, -H * 0.4, { align: 'left', alpha: alpha * (1 - smooth(seg(paper, 0.4, 0.6))) });
      ctx.restore();
    }
  }
}

/** Petits pictogrammes : succursale, horloge, météo, voiture, avion. */
function s02_glyph(ctx, kind, x, y, s, color, a, k = 0) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = rgba(color, 0.14);
  ctx.lineWidth = Math.max(2, s * 0.08);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.3;
  ctx.beginPath();
  if (kind === 'store') {
    ctx.moveTo(-s * 0.6, s * 0.5);
    ctx.lineTo(-s * 0.6, -s * 0.1);
    ctx.lineTo(-s * 0.7, -s * 0.1);
    ctx.lineTo(-s * 0.5, -s * 0.5);
    ctx.lineTo(s * 0.5, -s * 0.5);
    ctx.lineTo(s * 0.7, -s * 0.1);
    ctx.lineTo(s * 0.6, -s * 0.1);
    ctx.lineTo(s * 0.6, s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeRect(-s * 0.15, s * 0.08, s * 0.3, s * 0.42);
  } else if (kind === 'clock') {
    ctx.arc(0, 0, s * 0.55, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(k * TAU - Math.PI / 2) * s * 0.4, Math.sin(k * TAU - Math.PI / 2) * s * 0.4);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(k * TAU / 12 - Math.PI / 2) * s * 0.25, Math.sin(k * TAU / 12 - Math.PI / 2) * s * 0.25);
    ctx.stroke();
  } else if (kind === 'weather') {
    // soleil qui se voile (k : 0 → 1)
    const sunA = 1 - k * 0.6;
    ctx.globalAlpha *= sunA;
    ctx.arc(-s * 0.15, -s * 0.12, s * 0.28, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * TAU;
      ctx.moveTo(-s * 0.15 + Math.cos(an) * s * 0.4, -s * 0.12 + Math.sin(an) * s * 0.4);
      ctx.lineTo(-s * 0.15 + Math.cos(an) * s * 0.52, -s * 0.12 + Math.sin(an) * s * 0.52);
    }
    ctx.stroke();
    ctx.globalAlpha /= sunA;
    const cxo = lerp(s * 0.6, s * 0.1, eInOutQuart(k));
    ctx.beginPath();
    ctx.arc(cxo - s * 0.22, s * 0.18, s * 0.2, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(cxo, s * 0.02, s * 0.27, Math.PI, Math.PI * 1.9);
    ctx.arc(cxo + s * 0.26, s * 0.2, s * 0.18, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.globalAlpha *= k;
    ctx.fillStyle = rgba(color, 0.3);
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'car') {
    ctx.moveTo(-s * 0.7, s * 0.2);
    ctx.lineTo(-s * 0.6, -s * 0.05);
    ctx.lineTo(-s * 0.3, -s * 0.12);
    ctx.lineTo(-s * 0.12, -s * 0.38);
    ctx.lineTo(s * 0.32, -s * 0.38);
    ctx.lineTo(s * 0.52, -s * 0.1);
    ctx.lineTo(s * 0.7, -s * 0.04);
    ctx.lineTo(s * 0.7, s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-s * 0.36, s * 0.24, s * 0.13, 0, TAU);
    ctx.moveTo(s * 0.5, s * 0.24);
    ctx.arc(s * 0.38, s * 0.24, s * 0.13, 0, TAU);
    ctx.stroke();
  } else {
    // avion
    ctx.moveTo(s * 0.75, 0);
    ctx.quadraticCurveTo(s * 0.7, -s * 0.08, s * 0.5, -s * 0.08);
    ctx.lineTo(s * 0.1, -s * 0.08);
    ctx.lineTo(-s * 0.2, -s * 0.6);
    ctx.lineTo(-s * 0.36, -s * 0.6);
    ctx.lineTo(-s * 0.18, -s * 0.08);
    ctx.lineTo(-s * 0.55, -s * 0.08);
    ctx.lineTo(-s * 0.7, -s * 0.3);
    ctx.lineTo(-s * 0.8, -s * 0.3);
    ctx.lineTo(-s * 0.72, 0);
    ctx.lineTo(-s * 0.8, s * 0.3);
    ctx.lineTo(-s * 0.7, s * 0.3);
    ctx.lineTo(-s * 0.55, s * 0.08);
    ctx.lineTo(-s * 0.18, s * 0.08);
    ctx.lineTo(-s * 0.36, s * 0.6);
    ctx.lineTo(-s * 0.2, s * 0.6);
    ctx.lineTo(s * 0.1, s * 0.08);
    ctx.lineTo(s * 0.5, s * 0.08);
    ctx.quadraticCurveTo(s * 0.7, s * 0.08, s * 0.75, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function sceneEtiquettesAllee(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    banal: 'un objet banal',
    maxi: 'Maxi',
    provigo: 'Provigo',
    metro: 'Metro',
    superc: 'Super C',
    iga: 'IGA',
    petite: 'la petite étiquette',
    officiel: 'Officiellement',
    papier: 'remplace le papier',
    temps: 'économiser du temps',
    erreurs: 'éviter les erreurs',
    technique: 'sur le plan technique',
    sansfil: 'reliés sans fil',
    serveur: 'serveur central',
    secondes: 'En quelques secondes',
    changer: 'changer le prix',
    milliers: 'milliers de produits',
    succ: 'une seule succursale',
    heure: 'une heure précise',
    meteo: 'selon la météo',
    infra: "L'infrastructure du prix variable",
    uber: 'Uber',
    avion: 'compagnies aériennes',
    deja: 'déjà installée',
    allees: 'dans nos allées'
  });

  // poids des trois plans
  const closeUp = env(lt, T.petite - 0.6, T.technique + 0.3, 0.9, 1.0); // gros plan sur l'étiquette
  const aisleA = 1 - smooth(seg(lt, T.infra - 0.2, T.infra + 1.0));
  const curveA = smooth(seg(lt, T.infra - 0.1, T.infra + 1.0));

  frame(a, () => {
    /* ── L'ALLÉE (actes I et II) ── */
    if (aisleA > 0.003) {
      const F = m * (V ? 1.1 : 0.82);
      const vx = cx;
      const vy = V ? h * 0.47 : h * 0.5;
      const Wd = V ? 0.95 : 1.75;
      const camZ = track(lt, [
        [0, 0],
        [T.petite, 2.6, (x) => x],
        [T.technique, 3.2, smoother],
        [T.serveur + 1.0, 1.4, eInOutQuart],
        [T.infra + 1, 2.4, smoother]
      ]);
      const camX = track(lt, [[0, 0], [T.petite, 0], [T.technique, 0], [T.infra, 0]]);
      const pr = (X, Y, Z) => {
        const dz = Z - camZ;
        const s = F / Math.max(0.15, dz);
        return { x: vx + (X - camX) * s, y: vy + Y * s, s, dz };
      };
      const waveZ = track(lt, [[T.sansfil, 22], [T.changer + 0.2, 22, smoother], [T.milliers + 1.6, camZ - 1, eInCubic]]);
      const waveOn = smooth(seg(lt, T.sansfil, T.sansfil + 0.6)) * (1 - smooth(seg(lt, T.milliers + 1.4, T.milliers + 2.2)));
      const signDim = env(lt, T.maxi - 0.3, T.petite + 0.2, 0.3, 0.6) * 0.35;
      const iconDim = env(lt, T.succ - 0.4, T.infra, 0.5, 0.5) * 0.4;
      const dim = (1 - closeUp * 0.85) * (1 - signDim) * (1 - iconDim);
      globalThis.__FN_QA_SKIP = true; // étiquettes de décor : exclues de l'analyse typographique
      ctx.save();
      ctx.globalAlpha *= aisleA * dim;
      // sol : lignes de fuite
      ctx.strokeStyle = rgba(C.cyan, 0.12);
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const p0 = pr(i * Wd * 0.33, 1.7, camZ + 0.3);
        const p1 = pr(i * Wd * 0.33, 1.7, camZ + 26);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      // serveur central au fond
      const sv = pr(0, 0.2, 23);
      const svA = smooth(seg(lt, T.serveur - 0.5, T.serveur + 0.6));
      if (svA > 0.003) {
        const sw = 0.9 * sv.s;
        const sh = 2.6 * sv.s;
        ctx.save();
        ctx.globalAlpha *= svA;
        light(ctx, sv.x, sv.y - sh * 0.3, sh * 1.6, C.amber, 0.5);
        const g = ctx.createLinearGradient(sv.x - sw / 2, 0, sv.x + sw / 2, 0);
        g.addColorStop(0, '#0F172A');
        g.addColorStop(0.5, '#1E293B');
        g.addColorStop(1, '#0F172A');
        ctx.fillStyle = g;
        ctx.fillRect(sv.x - sw / 2, sv.y - sh, sw, sh * 1.0);
        ctx.fillStyle = C.amber;
        for (let k = 0; k < 7; k++) ctx.fillRect(sv.x - sw * 0.35, sv.y - sh + sh * (0.1 + k * 0.12), sw * 0.7 * (0.4 + 0.6 * ((k * 37 + Math.floor(gt * 3)) % 5) / 4), Math.max(1, sh * 0.02));
        ctx.restore();
      }
      // étagères (du fond vers l'avant)
      const shelfY = [-1.15, -0.45, 0.25, 0.95];
      const zStep = 1.25;
      const z0 = Math.floor(camZ / zStep) * zStep;
      for (let zi = 16; zi >= 0; zi--) {
        const Z = z0 + zi * zStep;
        if (Z - camZ < 1.7) continue;
        const col = S02_COLS[Math.abs(Math.round(Z / zStep)) % S02_COLS.length];
        const fog = clamp(1 - (Z - camZ) / 20);
        for (const side of [-1, 1]) {
          const X = side * Wd;
          shelfY.forEach((Y, si) => {
            // produits (trois volumes par section, face dans le plan du mur)
            for (let b = 0; b < 3; b++) {
              const ph = 0.5 * col.hs[(si + b) % 4];
              const za = Z + 0.08 + b * (zStep / 3);
              const zb = za + zStep / 3 - 0.1;
              const a0 = pr(X, Y, za);
              const a1 = pr(X, Y, zb);
              const b0 = pr(X, Y - ph, za);
              const b1 = pr(X, Y - ph, zb);
              const pg = ctx.createLinearGradient(b0.x, b0.y, a0.x, a0.y);
              pg.addColorStop(0, rgba(mix(col.hue, C.night, 0.45), 0.9 * fog));
              pg.addColorStop(1, rgba(mix(col.hue, C.night, 0.78), 0.9 * fog));
              ctx.fillStyle = pg;
              ctx.beginPath();
              ctx.moveTo(a0.x, a0.y);
              ctx.lineTo(a1.x, a1.y);
              ctx.lineTo(b1.x, b1.y);
              ctx.lineTo(b0.x, b0.y);
              ctx.closePath();
              ctx.fill();
            }
            // tablette
            const t0 = pr(X, Y, Z);
            const t1 = pr(X, Y, Z + zStep);
            ctx.strokeStyle = rgba(C.slate, 0.35 * fog);
            ctx.lineWidth = Math.max(1, 0.03 * t0.s);
            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.stroke();
            // étiquette électronique
            const lz = Z + zStep * 0.35;
            const lp = pr(X, Y + 0.09, lz);
            const lsz = 0.16 * lp.s;
            if (lsz < 2) return;
            const flipped = waveOn > 0 && waveZ < lz ? 1 : lt > T.milliers + 1.6 && lt < T.infra + 1 ? 1 : 0;
            const hit = waveOn * Math.exp(-Math.pow((lz - waveZ) * 1.6, 2));
            ctx.fillStyle = flipped ? '#2A1A05' : '#0B1A2A';
            ctx.fillRect(lp.x - lsz * 0.9, lp.y - lsz * 0.45, lsz * 1.8, lsz * 0.9);
            ctx.strokeStyle = rgba(flipped ? C.amber : C.cyan, (0.55 + hit * 0.45) * fog);
            ctx.lineWidth = 1;
            ctx.strokeRect(lp.x - lsz * 0.9, lp.y - lsz * 0.45, lsz * 1.8, lsz * 0.9);
            if (hit > 0.05) light(ctx, lp.x, lp.y, lsz * 4, C.amber, hit * 0.8);
            if (lsz > 12) {
              const S = textSprite(flipped ? '5,79' : '4,99', { size: 40, weight: 800, color: flipped ? C.gold : C.ice });
              drawSprite(ctx, S, lp.x, lp.y + lsz * 0.18, { scale: (lsz * 1.35) / S.w, alpha: fog });
            }
          });
        }
      }
      // onde sans fil (anneau en perspective)
      if (waveOn > 0.003 && waveZ > camZ + 0.4) {
        const wp = pr(0, 0, waveZ);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) {
          const zk = waveZ + k * 0.9;
          if (zk - camZ < 0.4) continue;
          const q = pr(0, 0.1, zk);
          ctx.strokeStyle = rgba(C.amber, waveOn * (0.7 - k * 0.2));
          ctx.lineWidth = Math.max(1.5, 0.05 * q.s);
          ctx.beginPath();
          ctx.ellipse(q.x, q.y, Wd * 1.05 * q.s, 1.5 * q.s, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
        light(ctx, wp.x, wp.y, 0.6 * wp.s, C.amber, waveOn * 0.3);
      }
      ctx.restore();
      globalThis.__FN_QA_SKIP = false;

      // enseignes des bannières (acte I)
      const signA = env(lt, T.maxi - 0.3, T.petite + 0.2, 0.3, 0.6);
      if (signA > 0.003) {
        const names = [
          ['MAXI', T.maxi],
          ['PROVIGO', T.provigo],
          ['METRO', T.metro],
          ['SUPER C', T.superc],
          ['IGA', T.iga]
        ];
        const fs = Math.floor(m * (V ? 0.04 : 0.04));
        const rowY = V ? h * 0.17 : h * 0.18;
        const g = mctx();
        g.font = `800 ${fs}px ${DISPLAY}`;
        g.letterSpacing = '4px';
        const ws = names.map(([n]) => g.measureText(n).width);
        const gap = fs * 1.4;
        const rows = V ? [[0, 1, 2], [3, 4]] : [[0, 1, 2, 3, 4]];
        const xs = [];
        const ys = [];
        rows.forEach((row, ri) => {
          const tot = row.reduce((acc, j) => acc + ws[j], 0) + gap * (row.length - 1);
          let xx = cx - tot / 2;
          row.forEach((j) => {
            xs[j] = xx;
            ys[j] = rowY + ri * fs * 1.6;
            xx += ws[j] + gap;
          });
        });
        names.forEach(([n, k], i) => {
          const x = xs[i];
          const rowYi = ys[i];
          const tt = seg(lt, k - 0.15, k + 0.6);
          // filin de suspension
          ctx.save();
          ctx.globalAlpha *= signA * smooth(tt);
          ctx.strokeStyle = rgba(C.slate, 0.35);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + ws[i] / 2, 0);
          ctx.lineTo(x + ws[i] / 2, rowYi - fs * 1.1);
          ctx.stroke();
          ctx.restore();
          kSlide(ctx, n, x, rowYi, { size: fs, weight: 800, spacing: 4, color: i % 2 ? C.white : C.ice, t: tt, alpha: signA, align: 'left', dir: 'down' });
        });
        mono(ctx, 'PARTOUT, DÉSORMAIS', cx, Math.max(...ys) + m * 0.05, { size: Math.floor(m * 0.018), color: C.amber, spacing: 6, t: seg(lt, T.iga + 0.2, T.iga + 1.2), alpha: signA });
      }
    }

    /* ── GROS PLAN : l'étiquette électronique ── */
    if (closeUp > 0.003) {
      const zoomIn = eOutExpo(seg(lt, T.petite - 0.6, T.petite + 1.0));
      const s = m * (V ? 0.3 : 0.24) * lerp(0.3, 1, zoomIn) * lerp(1, 0.4, eInCubic(seg(lt, T.technique - 0.4, T.technique + 0.3)));
      const lx = V ? cx : cx - w * 0.17;
      const ly = V ? h * 0.42 : h * 0.5;
      s02_bigLabel(ctx, lx, ly, s, { base: Math.floor(m * (V ? 0.3 : 0.24)), alpha: closeUp, price: 4.99, paper: seg(lt, T.papier - 0.1, T.papier + 1.3), time: gt });
      const tx = V ? cx : w * 0.6;
      const ty = V ? h * 0.66 : h * 0.36;
      const al = V ? 'center' : 'left';
      kRise(ctx, 'ÉTIQUETTE', tx, ty, { size: Math.floor(m * 0.062), weight: 900, t: seg(lt, T.petite, T.petite + 0.9), alpha: closeUp, align: al });
      kRise(ctx, 'ÉLECTRONIQUE', tx, ty + m * 0.075, { size: Math.floor(m * 0.062), weight: 900, color: C.cyan, t: seg(lt, T.petite + 0.25, T.petite + 1.2), alpha: closeUp, align: al });
      mono(ctx, 'OFFICIELLEMENT :', tx, ty + m * 0.16, { size: Math.floor(m * 0.02), color: C.amber, spacing: 6, t: seg(lt, T.officiel, T.officiel + 0.8), alpha: closeUp, align: al });
      kSlide(ctx, '— PAPIER', tx, ty + m * 0.225, { size: Math.floor(m * 0.034), weight: 800, color: C.slate, t: seg(lt, T.papier, T.papier + 0.7), alpha: closeUp, align: al, dir: 'left' });
      kSlide(ctx, '+ TEMPS POUR LES EMPLOYÉS', tx, ty + m * 0.28, { size: Math.floor(m * 0.034), weight: 800, color: C.slate, t: seg(lt, T.temps, T.temps + 0.7), alpha: closeUp, align: al, dir: 'left', maxW: V ? w * 0.86 : w * 0.34 });
      kSlide(ctx, '— ERREURS', tx, ty + m * 0.335, { size: Math.floor(m * 0.034), weight: 800, color: C.slate, t: seg(lt, T.erreurs, T.erreurs + 0.7), alpha: closeUp, align: al, dir: 'left' });
    }

    /* ── ACTE II : titres de la bascule ── */
    const bA = env(lt, T.technique, T.infra + 0.3, 0.5, 0.6) * aisleA;
    if (bA > 0.003) {
      const ty = V ? h * 0.16 : h * 0.15;
      const sw1 = smooth(seg(lt, T.secondes - 0.3, T.secondes + 0.1));
      kRise(ctx, 'RELIÉES SANS FIL', cx, ty, { size: Math.floor(m * 0.056), weight: 900, t: seg(lt, T.sansfil, T.sansfil + 0.9), out: sw1, alpha: bA });
      mono(ctx, 'À UN SERVEUR CENTRAL', cx, ty + m * 0.055, { size: Math.floor(m * 0.02), color: C.amber, spacing: 6, t: seg(lt, T.serveur, T.serveur + 0.9), alpha: bA * (1 - sw1) });
      kRise(ctx, 'DES MILLIERS DE PRIX', cx, ty, { size: Math.floor(m * 0.056), weight: 900, color: C.amber, t: seg(lt, T.changer, T.changer + 0.9), alpha: bA, glow: 18, glowColor: rgba(C.amber, 0.5), maxW: w * 0.9 });
      mono(ctx, 'EN QUELQUES SECONDES', cx, ty + m * 0.055, { size: Math.floor(m * 0.02), color: C.ice, spacing: 6, t: seg(lt, T.secondes, T.secondes + 0.9), alpha: bA * sw1 });
      // compteur de prix monumental
      const pv = lerp(4.99, 5.79, eInOutQuart(seg(lt, T.milliers - 0.2, T.milliers + 1.4)));
      const py = V ? h * 0.83 : h * 0.86;
      const pA = bA * smooth(seg(lt, T.changer - 0.4, T.changer + 0.3));
      odometer(ctx, pv, V ? cx : cx - m * 0.1, py, { size: Math.floor(m * (V ? 0.09 : 0.075)), weight: 900, color: mix(C.ice, C.amber, seg(lt, T.milliers, T.milliers + 1.4)), dec: 2, suffix: ' $', suffixScale: 0.6, alpha: pA, glow: 16, glowColor: rgba(C.amber, 0.4) });
      // succursale · heure · météo
      const icons = [
        ['store', 'UNE SUCCURSALE', T.succ],
        ['clock', 'À UNE HEURE PRÉCISE', T.heure],
        ['weather', 'SELON LA MÉTÉO', T.meteo]
      ];
      const gy = V ? h * 0.66 : h * 0.62;
      icons.forEach(([kind, lab, k], i) => {
        const on = eOutBack(seg(lt, k - 0.1, k + 0.7), 1.6);
        if (on <= 0) return;
        const gx = cx + (i - 1) * (V ? w * 0.31 : w * 0.25);
        const gyy = gy;
        const gs = m * 0.045 * on;
        const kk = kind === 'clock' ? (lt - T.heure) * 0.6 : kind === 'weather' ? seg(lt, T.meteo + 0.2, T.meteo + 1.2) : 0;
        light(ctx, gx, gyy, m * 0.09, C.amber, 0.25 * bA);
        s02_glyph(ctx, kind, gx, gyy, gs, i === 0 ? C.cyan : C.amber, bA, kk);
        mono(ctx, lab, gx, gyy + m * 0.07, { size: Math.floor(m * 0.017), color: C.white, spacing: 4, t: seg(lt, k, k + 0.8), alpha: bA });
      });
    }

    /* ── ACTE III : courbe horaire façon billet d'avion ── */
    if (curveA > 0.003) {
      const x0 = V ? w * 0.1 : w * 0.12;
      const x1 = V ? w * 0.9 : w * 0.88;
      const yb = V ? h * 0.68 : h * 0.7;
      const amp = V ? h * 0.17 : h * 0.18;
      const draw = eInOutQuart(seg(lt, T.infra, T.avion + 1.4));
      const pts = [];
      for (let i = 0; i <= 160; i++) {
        const u = i / 160;
        const v = 0.45 + 0.22 * Math.sin(u * 9.4 + 0.6) + 0.14 * Math.sin(u * 23 + 1.1) + 0.2 * Math.exp(-Math.pow((u - 0.72) * 9, 2));
        pts.push({ x: lerp(x0, x1, u), y: yb - v * amp * 1.6 });
      }
      // axe horaire
      ctx.save();
      ctx.globalAlpha *= curveA;
      ctx.strokeStyle = rgba(C.slate, 0.35);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, yb);
      ctx.lineTo(x0 + (x1 - x0) * eOutExpo(seg(lt, T.infra, T.infra + 1.2)), yb);
      ctx.stroke();
      ctx.restore();
      ['6 H', '10 H', '14 H', '18 H', '22 H'].forEach((lab, i) => {
        const xx = lerp(x0, x1, i / 4);
        mono(ctx, lab, xx, yb + m * 0.032, { size: Math.floor(m * 0.016), color: C.slate, spacing: 2, t: seg(lt, T.infra + 0.2 + i * 0.12, T.infra + 0.7 + i * 0.12), alpha: curveA * 0.8, cursor: false });
      });
      // aire sous la courbe
      const n = Math.max(2, Math.floor(draw * (pts.length - 1)));
      ctx.save();
      ctx.globalAlpha *= curveA * 0.35;
      const ag = ctx.createLinearGradient(0, yb - amp * 1.6, 0, yb);
      ag.addColorStop(0, rgba(C.amber, 0.55));
      ag.addColorStop(1, rgba(C.amber, 0));
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, yb);
      for (let i = 0; i <= n; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[n].x, yb);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const hp = glowPath(ctx, pts, draw, { color: C.amber, width: 3.5, alpha: curveA });
      // voiture & avion
      const cU = 0.3;
      const pU = 0.72;
      const cp = pts[Math.floor(cU * 160)];
      const pp = pts[Math.floor(pU * 160)];
      s02_glyph(ctx, 'car', cp.x, cp.y - m * 0.06, m * 0.045 * eOutBack(seg(lt, T.uber - 0.1, T.uber + 0.6), 1.8), C.cyan, curveA);
      mono(ctx, 'UBER', cp.x, cp.y - m * 0.12, { size: Math.floor(m * 0.018), color: C.cyan, spacing: 5, t: seg(lt, T.uber, T.uber + 0.6), alpha: curveA });
      s02_glyph(ctx, 'plane', pp.x, pp.y - m * 0.07, m * 0.05 * eOutBack(seg(lt, T.avion - 0.1, T.avion + 0.6), 1.8), C.ice, curveA);
      mono(ctx, 'COMPAGNIES AÉRIENNES', pp.x, pp.y - m * 0.135, { size: Math.floor(m * 0.018), color: C.ice, spacing: 4, t: seg(lt, T.avion, T.avion + 0.8), alpha: curveA });
      if (hp && draw < 0.999) light(ctx, hp.x, hp.y, m * 0.05, C.gold, curveA * 0.8);
      const ty = V ? h * 0.28 : h * 0.2;
      kRise(ctx, 'LE PRIX VARIABLE', cx, ty, { size: Math.floor(m * (V ? 0.074 : 0.07)), weight: 900, t: seg(lt, T.infra + 0.1, T.infra + 1.1), alpha: curveA, maxW: w * 0.9 });
      kWipe(ctx, 'DÉJÀ DANS NOS ALLÉES', cx, ty + m * (V ? 0.085 : 0.08), { size: Math.floor(m * (V ? 0.05 : 0.046)), weight: 800, color: C.amber, t: seg(lt, T.deja, T.allees + 0.9), alpha: curveA, edge: C.cyan, maxW: w * 0.9 });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 03 — rep-scandale-instacart-23pct · 23 % d'écart sur le même panier : le choc Instacart & Kroger
 * ════════════════════════════════════════════════════════════════════════ */

/* Ouverture : « science-fiction ? » ; la frontière se trace, la caméra plonge au sud
 * Acte I    : écran scindé CLIENT A / CLIENT B, même panier, même magasin ; les prix de B divergent → +23 %
 * Acte II   : un faisceau de données relie B à un dossier Kroger de 60 pages qui se déploie en couches
 * Acte III  : sceau « ENQUÊTE FTC », ordonnances contre Instacart, Walmart, Target */

const S03_ITEMS = [
  { n: 'LAIT 2 L', p: 4.49 },
  { n: 'PAIN', p: 3.79 },
  { n: 'ŒUFS × 12', p: 5.29 },
  { n: 'CAFÉ', p: 9.99 }
];
const S03_BORDER = [[-125, 49], [-95, 49], [-89.5, 48], [-84.5, 46.5], [-82.4, 45.2], [-82.5, 42.4], [-79.2, 43.4], [-76.4, 44.2], [-74.7, 45], [-71.5, 45], [-70.4, 45.8], [-69.2, 47.4], [-67.8, 47.1], [-67.8, 45.6], [-67, 44.8]];

function s03_phone(ctx, x, y, pw, ph, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  light(ctx, x, y, pw * 1.3, color, 0.18);
  rrect(ctx, x - pw / 2, y - ph / 2, pw, ph, pw * 0.12);
  const g = ctx.createLinearGradient(0, y - ph / 2, 0, y + ph / 2);
  g.addColorStop(0, '#0F1A2B');
  g.addColorStop(1, '#070C16');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.85);
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#02050A';
  rrect(ctx, x - pw * 0.16, y - ph / 2 + ph * 0.018, pw * 0.32, ph * 0.03, ph * 0.015);
  ctx.fill();
  ctx.restore();
}

function s03_glyph(ctx, kind, x, y, s, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = rgba(color, 0.18);
  ctx.lineWidth = Math.max(1.8, s * 0.09);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (kind === 'money') {
    ctx.arc(0, 0, s * 0.5, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.18, -s * 0.2);
    ctx.quadraticCurveTo(-s * 0.25, -s * 0.28, -s * 0.15, -s * 0.04);
    ctx.quadraticCurveTo(s * 0.25, s * 0.06, s * 0.12, s * 0.22);
    ctx.quadraticCurveTo(-s * 0.05, s * 0.3, -s * 0.2, s * 0.18);
    ctx.moveTo(0, -s * 0.36);
    ctx.lineTo(0, s * 0.36);
    ctx.stroke();
  } else if (kind === 'family') {
    for (const [dx, sc] of [[-0.32, 0.9], [0.05, 1], [0.38, 0.7]]) {
      ctx.beginPath();
      ctx.arc(dx * s, -s * 0.22 * sc, s * 0.13 * sc, 0, TAU);
      ctx.moveTo(dx * s - s * 0.17 * sc, s * 0.45);
      ctx.quadraticCurveTo(dx * s, -s * 0.12 * sc, dx * s + s * 0.17 * sc, s * 0.45);
      ctx.fill();
      ctx.stroke();
    }
  } else if (kind === 'pin') {
    ctx.moveTo(0, s * 0.52);
    ctx.bezierCurveTo(-s * 0.55, -s * 0.05, -s * 0.38, -s * 0.52, 0, -s * 0.52);
    ctx.bezierCurveTo(s * 0.38, -s * 0.52, s * 0.55, -s * 0.05, 0, s * 0.52);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -s * 0.16, s * 0.13, 0, TAU);
    ctx.stroke();
  } else if (kind === 'store') {
    ctx.moveTo(-s * 0.55, s * 0.45);
    ctx.lineTo(-s * 0.55, -s * 0.12);
    ctx.lineTo(-s * 0.45, -s * 0.45);
    ctx.lineTo(s * 0.45, -s * 0.45);
    ctx.lineTo(s * 0.55, -s * 0.12);
    ctx.lineTo(s * 0.55, s * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeRect(-s * 0.14, s * 0.06, s * 0.28, s * 0.39);
  } else {
    // article (sac)
    ctx.moveTo(-s * 0.4, -s * 0.2);
    ctx.lineTo(s * 0.4, -s * 0.2);
    ctx.lineTo(s * 0.32, s * 0.45);
    ctx.lineTo(-s * 0.32, s * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -s * 0.2, s * 0.2, Math.PI, 0);
    ctx.stroke();
  }
  ctx.restore();
}

/** Sceau officiel géométrique (FTC). */
function s03_seal(ctx, x, y, r, t, time, a) {
  if (a <= 0.003 || t <= 0) return;
  const land = eOutBack(t, 1.2);
  const sc = lerp(2.4, 1, eOutExpo(t));
  ctx.save();
  ctx.globalAlpha *= a * clamp(t * 3);
  ctx.translate(x, y);
  ctx.rotate((1 - land) * -0.5);
  ctx.scale(sc, sc);
  light(ctx, 0, 0, r * 2, C.emerald, 0.35);
  ctx.strokeStyle = C.emerald;
  ctx.shadowColor = C.emerald;
  ctx.shadowBlur = 16;
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = r * 0.02;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.8, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = C.emerald;
  for (let i = 0; i < 24; i++) {
    const an = (i / 24) * TAU + time * 0.15;
    ctx.beginPath();
    ctx.arc(Math.cos(an) * r * 0.9, Math.sin(an) * r * 0.9, r * 0.025, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  const sA = a * smooth(seg(t, 0.25, 0.7));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((1 - land) * -0.5);
  ctx.scale(sc, sc);
  drawSprite(ctx, textSprite('FTC', { size: Math.floor(r * 0.52), weight: 900, color: C.white, glow: 14, glowColor: rgba(C.emerald, 0.6) }), 0, 0, { base: 'middle', alpha: sA });
  drawSprite(ctx, textSprite('ENQUÊTE', { size: Math.floor(r * 0.15), weight: 600, fam: MONO, color: C.mint, spacing: 6 }), 0, r * 0.42, { base: 'middle', alpha: sA });
  ctx.restore();
}

function sceneInstacart23(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const T = cues(scene, {
    sf: 'science-fiction',
    pris: 'pris sur le fait',
    sud: 'juste au sud',
    frontiere: 'notre frontière',
    decembre: 'En décembre',
    cr: 'Consumer Reports',
    instacart: 'la plateforme Instacart',
    deux: 'deux acheteurs',
    memes: 'exactement les mêmes articles',
    magasin: 'dans le même magasin',
    diff: 'des prix différents',
    ecarts: 'avec des écarts',
    vingt3: 'vingt-trois pour cent',
    kroger: 'Kroger',
    dossiers: 'des dossiers clients',
    soixante: 'soixante pages',
    revenu: 'revenu estimé',
    taille: 'taille de la famille',
    geo: 'géolocalisation',
    resultat: 'Résultat',
    ftc: 'la FTC américaine',
    ordo: 'des ordonnances',
    ins2: 'Instacart, Walmart',
    walmart: 'Walmart',
    target: 'Target'
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 70, alpha: 0.28, seed: 33 });

    /* ── OUVERTURE : la frontière ── */
    const oA = 1 - smooth(seg(lt, T.decembre - 0.2, T.decembre + 0.8));
    if (oA > 0.003) {
      const latC = track(lt, [[0, 47.5], [T.sud - 0.2, 47.5], [T.frontiere + 1.2, 42.5, eInOutQuart]]);
      const sc = m * (V ? 0.024 : 0.02) * track(lt, [[0, 0.85], [T.decembre + 0.8, 1.25, smoother]]);
      const Pj = makeFlat(-80, latC, sc, cx, cy);
      const dots = regionDots('na03', -128, -55, 25, 62, 0.75);
      drawDots(ctx, Pj, dots, { color: C.cyan, size: sc * 0.22, alpha: 0.55 * oA, fade: { x: cx, y: cy, r: Math.hypot(w, h) * 0.5 } });
      const bp = smoothPath(S03_BORDER, 8).map((p) => Pj.project(p[0], p[1]));
      glowPath(ctx, bp, eInOutQuart(seg(lt, T.pris - 0.3, T.frontiere + 0.6)), { color: C.amber, width: 3, alpha: oA, dash: null });
      const q = Pj.project(-71.2, 46.8);
      const us = Pj.project(-84, 39.5);
      cityTag(ctx, q.x, q.y, 'QUÉBEC', { color: C.cyan, t: seg(lt, T.pris, T.pris + 0.8), alpha: oA, side: 'top', size: Math.floor(m * 0.022), time: gt });
      kSlide(ctx, 'ÉTATS-UNIS', us.x, us.y, { size: Math.floor(m * 0.05), weight: 900, color: C.white, spacing: 8, t: seg(lt, T.sud, T.sud + 0.9), alpha: oA * 0.9, dir: 'down', base: 'middle' });
      const ty = V ? h * 0.2 : h * 0.2;
      const sw = smooth(seg(lt, T.pris - 0.3, T.pris + 0.2));
      kRise(ctx, 'SCIENCE-FICTION ?', cx, ty, { size: Math.floor(m * (V ? 0.072 : 0.07)), weight: 900, t: seg(lt, T.sf - 0.3, T.sf + 0.7), out: sw, alpha: oA, maxW: w * 0.9 });
      kRise(ctx, 'PRIS SUR LE FAIT', cx, ty, { size: Math.floor(m * (V ? 0.072 : 0.07)), weight: 900, color: C.amber, t: seg(lt, T.pris, T.pris + 0.9), alpha: oA * sw, glow: 18, glowColor: rgba(C.amber, 0.5), maxW: w * 0.9 });
    }

    /* ── ACTE I : écran scindé ── */
    const sA = env(lt, T.decembre - 0.2, T.kroger + 0.6, 0.6, 0.8);
    const toDossier = eInOutQuart(seg(lt, T.kroger - 0.3, T.kroger + 1.2));
    if (sA > 0.003 || toDossier > 0) {
      const pw = V ? w * 0.4 : w * 0.18;
      const ph = V ? h * 0.42 : h * 0.66;
      const py = V ? h * 0.47 : h * 0.55;
      const splitT = eOutExpo(seg(lt, T.deux - 0.3, T.deux + 1.0));
      const ax = V ? lerp(cx, w * 0.26, splitT) : lerp(cx, w * 0.25, splitT);
      const bx0 = V ? lerp(cx, w * 0.74, splitT) : lerp(cx, w * 0.75, splitT);
      // en acte II, B glisse vers la gauche (16:9) ou vers le haut (9:16) et rétrécit
      const bx = V ? lerp(bx0, cx, toDossier) : lerp(bx0, w * 0.2, toDossier);
      const byy = V ? lerp(py, h * 0.27, toDossier) : lerp(py, h * 0.6, toDossier);
      const bScale = lerp(1, V ? 0.55 : 0.7, toDossier);
      const aA = sA * (1 - toDossier);
      const bA = Math.max(sA, smooth(seg(lt, T.kroger - 0.3, T.kroger + 0.3)) * (1 - smooth(seg(lt, T.resultat - 0.4, T.resultat + 0.4)))) * (V ? 1 - smooth(seg(toDossier, 0, 0.45)) : 1);
      // ligne de scission
      ctx.save();
      ctx.globalAlpha *= aA * splitT;
      const lg = V ? ctx.createLinearGradient(0, py - ph * 0.55, 0, py + ph * 0.55) : ctx.createLinearGradient(0, h * 0.18, 0, h * 0.92);
      lg.addColorStop(0, rgba(C.white, 0));
      lg.addColorStop(0.5, rgba(C.white, 0.6));
      lg.addColorStop(1, rgba(C.white, 0));
      ctx.fillStyle = lg;
      if (V) ctx.fillRect(cx - 1, py - ph * 0.55, 2, ph * 1.1);
      else ctx.fillRect(cx - 1, h * 0.18, 2, h * 0.74);
      ctx.restore();
      // en-tête
      const hy = V ? h * 0.15 : h * 0.13;
      const hdrA = aA * (1 - smooth(seg(lt, T.kroger - 1.0, T.kroger - 0.6)));
      mono(ctx, 'DÉCEMBRE 2025 · CONSUMER REPORTS', cx, hy, { size: Math.floor(m * 0.02), color: C.amber, spacing: 6, t: seg(lt, T.decembre, T.cr + 0.9), alpha: hdrA });
      kWipe(ctx, 'INSTACART', cx, hy + m * 0.07, { size: Math.floor(m * 0.05), weight: 900, spacing: 10, color: C.white, t: seg(lt, T.instacart, T.instacart + 0.9), alpha: hdrA, edge: C.amber });
      const pB = eInOutQuart(seg(lt, T.diff - 0.1, T.vingt3 + 0.6)); // divergence des prix de B
      const drawPhone = (x, yy, sc, col, label, alpha, isB) => {
        if (alpha <= 0.003) return;
        ctx.save();
        ctx.translate(x, yy);
        ctx.scale(sc, sc);
        ctx.translate(-x, -yy);
        s03_phone(ctx, x, yy, pw, ph, col, alpha);
        const top = yy - ph / 2;
        mono(ctx, label, x, top + ph * 0.09, { size: Math.floor(m * 0.019), color: col, spacing: 6, t: seg(lt, T.deux, T.deux + 0.8), alpha, cursor: false });
        const fs = Math.floor(m * (V ? 0.026 : 0.022));
        S03_ITEMS.forEach((it, i) => {
          const ry = top + ph * (0.22 + i * 0.13);
          const on = seg(lt, T.memes - 0.2 + i * 0.18, T.memes + 0.5 + i * 0.18);
          const hl = Math.exp(-Math.pow((lt - (T.memes + 0.3 + i * 0.18)) * 2.2, 2));
          if (hl > 0.02) {
            ctx.save();
            ctx.globalAlpha *= alpha * hl * 0.5;
            ctx.fillStyle = rgba(col, 0.25);
            ctx.fillRect(x - pw * 0.44, ry - ph * 0.05, pw * 0.88, ph * 0.1);
            ctx.restore();
          }
          s03_glyph(ctx, 'bag', x - pw * 0.34, ry, pw * 0.08, col, alpha * smooth(on));
          kSlide(ctx, it.n, x - pw * 0.25, ry + fs * 0.35, { size: fs, weight: 700, color: C.slate, t: on, alpha, align: 'left', dir: 'up' });
          const price = isB ? lerp(it.p, Math.round(it.p * 123) / 100, pB) : it.p;
          odometer(ctx, price, x + pw * 0.4, ry + fs * 0.35, { size: fs, weight: 800, color: isB ? mix(C.white, C.amber, pB) : C.white, dec: 2, align: 'right', suffix: ' $', suffixScale: 0.8, alpha: alpha * smooth(on) });
        });
        // total
        const tyy = top + ph * 0.8;
        ctx.save();
        ctx.globalAlpha *= alpha;
        ctx.fillStyle = rgba(C.slate, 0.25);
        ctx.fillRect(x - pw * 0.42, tyy - ph * 0.06, pw * 0.84, 1.5);
        ctx.restore();
        const total = S03_ITEMS.reduce((acc, it) => acc + (isB ? lerp(it.p, Math.round(it.p * 123) / 100, pB) : it.p), 0);
        mono(ctx, 'TOTAL', x - pw * 0.4, tyy, { size: Math.floor(m * 0.017), color: C.slate, spacing: 4, align: 'left', alpha: alpha * smooth(seg(lt, T.memes + 1, T.memes + 1.6)), cursor: false });
        odometer(ctx, total, x + pw * 0.4, tyy + fs * 0.5, { size: Math.floor(fs * 1.5), weight: 900, color: isB ? mix(C.white, C.amber, pB) : C.cyan, dec: 2, align: 'right', suffix: ' $', suffixScale: 0.6, alpha: alpha * smooth(seg(lt, T.memes + 1, T.memes + 1.6)) });
        ctx.restore();
      };
      drawPhone(ax, py, 1, C.cyan, 'CLIENT A', aA * smooth(splitT * 3), false);
      drawPhone(bx, byy, bScale, C.amber, 'CLIENT B', bA, true);
      // même magasin (pictogramme entre les deux)
      const mA = aA * env(lt, T.magasin - 0.2, T.vingt3 - 0.4, 0.4, 0.4);
      const my = V ? py + ph * 0.6 : h * 0.3;
      s03_glyph(ctx, 'store', cx, my, m * 0.05, C.slate, mA);
      mono(ctx, 'MÊME MAGASIN', cx, my + m * 0.06, { size: Math.floor(m * 0.017), color: C.slate, spacing: 5, t: seg(lt, T.magasin, T.magasin + 0.7), alpha: mA });
      // +23 % monumental : il reste à l'écran et se range en médaillon pendant l'acte II
      const gA = smooth(seg(lt, T.vingt3 - 0.4, T.vingt3 + 0.1)) * (1 - smooth(seg(lt, T.resultat - 0.5, T.resultat + 0.2)));
      if (gA > 0.003) {
        const park = toDossier;
        const gx = V ? cx : lerp(cx, w * 0.2, park);
        const gy0 = V ? h * 0.83 : h * 0.56;
        const lift = eInOutQuart(seg(lt, T.kroger - 0.7, T.kroger + 0.2)); // monte d'abord, puis glisse : ne croise jamais le téléphone B
        const gy = V ? lerp(gy0, h * 0.27, park) : lerp(gy0, h * 0.26, lift);
        const gs = lerp(1, V ? 0.8 : 0.62, park);
        ctx.save();
        ctx.translate(gx, gy);
        ctx.scale(gs, gs);
        ctx.translate(-cx, -gy);
        const gv = 23 * eOutExpo(seg(lt, T.vingt3 - 0.2, T.vingt3 + 1.0));
        const fsz = Math.floor(m * (V ? 0.13 : 0.12));
        light(ctx, cx, gy - fsz * 0.35, m * 0.22, C.amber, gA * 0.45);
        odometer(ctx, gv, cx, gy, { size: fsz, weight: 900, color: C.amber, prefix: '+', suffix: ' %', suffixScale: 0.6, alpha: gA, glow: 24, glowColor: rgba(C.amber, 0.55) });
        mono(ctx, "JUSQU'À", cx, gy - fsz * 1.05, { size: Math.floor(m * 0.018), color: C.gold, spacing: 7, t: seg(lt, T.ecarts, T.ecarts + 0.8), alpha: gA });
        mono(ctx, 'MÊME PANIER · PRIX ILLUSTRATIFS', cx, gy + m * 0.05, { size: Math.floor(m * 0.015), color: C.slate, spacing: 4, t: seg(lt, T.vingt3 + 0.5, T.vingt3 + 1.4), alpha: gA * 0.75 * (1 - park) });
        ctx.restore();
      }
    }

    /* ── ACTE II : le dossier de 60 pages ── */
    const dA = smooth(seg(lt, T.kroger - 0.2, T.kroger + 0.8)) * (1 - smooth(seg(lt, T.resultat - 0.4, T.resultat + 0.6)));
    if (dA > 0.003) {
      const dx = V ? cx : w * 0.6;
      const dy = V ? h * 0.62 : h * 0.55;
      const pgW = V ? w * 0.56 : w * 0.24;
      const pgH = pgW * 1.3;
      const fan = eOutExpo(seg(lt, T.soixante - 0.6, T.soixante + 1.6));
      // faisceau de données depuis le téléphone B
      const src = V ? { x: cx, y: h * 0.31 } : { x: w * 0.265, y: h * 0.6 };
      const beamT = eInOutQuart(seg(lt, T.dossiers - 0.4, T.dossiers + 0.8));
      const beam = quadPts(src, { x: dx - (V ? 0 : pgW * 0.5), y: V ? dy - pgH * 0.55 : dy }, V ? 0 : -m * 0.12, 40);
      glowPath(ctx, beam, beamT, { color: C.amber, width: 2.5, alpha: dA * (1 - smooth(seg(lt, T.resultat, T.resultat + 0.6))) });
      for (let k = 0; k < 6; k++) {
        const u = ((lt * 0.7 + k / 6) % 1);
        if (beamT < 1) break;
        const p = along(beam, u);
        light(ctx, p.x, p.y, m * 0.012, C.gold, dA * 0.9 * (1 - smooth(seg(lt, T.resultat - 0.6, T.resultat))));
      }
      // pages en éventail (couches transparentes)
      const N = 12;
      for (let i = N - 1; i >= 0; i--) {
        const k = i / (N - 1);
        const ox = fan * k * pgW * (V ? 0.32 : 0.55);
        const oy = -fan * k * pgH * (V ? 0.12 : 0.18);
        const rot = fan * (k - 0.2) * 0.12;
        ctx.save();
        ctx.globalAlpha *= dA * (i === 0 ? 1 : 0.35 + 0.4 * (1 - k)) * smooth(seg(lt, T.dossiers - 0.2 + k * 0.4, T.dossiers + 0.4 + k * 0.4));
        ctx.translate(dx + ox - (V ? pgW * 0.12 : pgW * 0.25) * fan, dy + oy + (V ? pgH * 0.06 : pgH * 0.08) * fan);
        ctx.rotate(rot);
        rrect(ctx, -pgW / 2, -pgH / 2, pgW, pgH, pgW * 0.03);
        ctx.fillStyle = i === 0 ? 'rgba(15,26,43,0.96)' : rgba(C.ice, 0.06);
        ctx.fill();
        ctx.strokeStyle = rgba(i === 0 ? C.amber : C.ice, i === 0 ? 0.9 : 0.4);
        ctx.lineWidth = i === 0 ? 2 : 1;
        ctx.stroke();
        if (i > 0) {
          ctx.fillStyle = rgba(C.ice, 0.18);
          for (let l = 0; l < 7; l++) ctx.fillRect(-pgW * 0.38, -pgH * 0.32 + l * pgH * 0.09, pgW * (0.5 + ((i * 7 + l * 3) % 5) * 0.06), 3);
        }
        ctx.restore();
      }
      // page de garde : en-tête, compteur, champs
      const fx = dx - (V ? pgW * 0.12 : pgW * 0.25) * fan;
      const fy = dy + (V ? pgH * 0.06 : pgH * 0.08) * fan;
      const top = fy - pgH / 2;
      mono(ctx, 'KROGER · DOSSIER CLIENT', fx, top + pgH * 0.09, { size: Math.floor(m * 0.017), color: C.amber, spacing: 4, t: seg(lt, T.dossiers, T.dossiers + 0.9), alpha: dA, cursor: false });
      const pages = 1 + 59 * eOutExpo(seg(lt, T.soixante - 0.4, T.soixante + 1.2));
      odometer(ctx, pages, fx, top + pgH * 0.27, { size: Math.floor(m * (V ? 0.09 : 0.08)), weight: 900, color: C.white, suffix: ' PAGES', suffixScale: 0.36, suffixColor: C.ice, alpha: dA * smooth(seg(lt, T.soixante - 0.6, T.soixante)) });
      const fields = [
        ['money', 'REVENU ESTIMÉ', T.revenu],
        ['family', 'TAILLE DE LA FAMILLE', T.taille],
        ['pin', 'GÉOLOCALISATION', T.geo]
      ];
      fields.forEach(([kind, lab, k], i) => {
        const ry = top + pgH * (0.45 + i * 0.16);
        const on = seg(lt, k - 0.15, k + 0.7);
        if (on <= 0) return;
        s03_glyph(ctx, kind, fx - pgW * 0.34, ry, pgW * 0.1, C.amber, dA * smooth(on));
        kWipe(ctx, lab, fx - pgW * 0.24, ry + m * 0.008, { size: Math.floor(m * (V ? 0.026 : 0.021)), weight: 800, color: C.white, t: on, alpha: dA, align: 'left', edge: C.amber, maxW: pgW * 0.66 });
        ctx.save();
        ctx.globalAlpha *= dA * smooth(seg(on, 0.5, 1));
        ctx.fillStyle = rgba(C.amber, 0.55);
        ctx.fillRect(fx - pgW * 0.24, ry + m * 0.025, pgW * 0.58 * eOutExpo(seg(on, 0.4, 1)), 5);
        ctx.restore();
      });
      mono(ctx, 'VOTRE PROFIL, COMPILÉ', fx, V ? fy - pgH / 2 - pgH * 0.14 - m * 0.03 : fy + pgH / 2 + m * 0.045, { size: Math.floor(m * 0.018), color: C.amber, spacing: 5, t: seg(lt, T.revenu, T.geo + 0.8), alpha: dA * (1 - smooth(seg(lt, T.resultat - 0.4, T.resultat))) });
    }

    /* ── ACTE III : sceau FTC et ordonnances ── */
    const fA = smooth(seg(lt, T.resultat - 0.3, T.resultat + 0.4));
    if (fA > 0.003) {
      const sx = V ? cx : w * 0.6;
      const sy = V ? h * 0.6 : h * 0.55;
      const st = seg(lt, T.ftc - 0.1, T.ftc + 0.7);
      s03_seal(ctx, sx, sy, m * (V ? 0.17 : 0.16), st, gt, fA);
      if (st >= 0.55) shockwave(ctx, sx, sy, m * 0.34, gt - T.ftc, { color: C.emerald, count: 2, period: 2.4, alpha: fA * 0.7 * (1 - smooth(seg(lt, T.ftc + 1.5, T.ftc + 3))) });
      const ty = V ? h * 0.2 : h * 0.22;
      const tx = V ? cx : w * 0.25;
      mono(ctx, 'RÉSULTAT', tx, ty - m * 0.07, { size: Math.floor(m * 0.02), color: C.mint, spacing: 8, t: seg(lt, T.resultat, T.resultat + 0.6), alpha: fA });
      kRise(ctx, 'ORDONNANCES', tx, ty, { size: Math.floor(m * (V ? 0.075 : 0.065)), weight: 900, t: seg(lt, T.ordo, T.ordo + 0.9), alpha: fA, glow: 16, glowColor: rgba(C.emerald, 0.4), maxW: V ? w * 0.9 : w * 0.4 });
      const fsz = Math.floor(m * (V ? 0.04 : 0.036));
      const names = [['INSTACART', T.ins2], ['WALMART', T.walmart], ['TARGET', T.target]];
      names.forEach(([n, k], i) => {
        const yy = V ? h * 0.82 + (i - 1) * 0 : ty + m * (0.12 + i * 0.075);
        const xx = V ? cx + (i - 1) * w * 0.31 : tx;
        kSlide(ctx, n, xx, yy, { size: fsz, weight: 800, color: C.white, spacing: 4, t: seg(lt, k - 0.05, k + 0.6), alpha: fA, dir: V ? 'up' : 'left', maxW: V ? w * 0.3 : w * 0.4 });
        if (!V) underline(ctx, xx, yy + fsz * 0.3, fsz * 4, seg(lt, k + 0.2, k + 0.9), { alpha: fA * 0.8, colorA: C.emerald, colorB: C.emerald });
      });
      if (V) mono(ctx, 'CONTRE', cx, h * 0.82 - m * 0.075, { size: Math.floor(m * 0.018), color: C.mint, spacing: 7, t: seg(lt, T.ins2 - 0.3, T.ins2 + 0.4), alpha: fA });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 04 — rep-cartes-fidelite-ia-canada · Cartes de fidélité et IA : votre profil vaut de l'or
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : trois cartes de fidélité entrent en parallaxe ; quelques sous tombent ; chaque carte
 *            émet un flux de particules qui nourrit une base de données
 * Acte II  : les flux convergent vers un réseau neuronal sphérique en rotation 3D ; habitudes en orbite ;
 *            bulle de conversation « Loblaw × ChatGPT » qui écrit une liste d'épicerie
 * Acte III : le serment officiel ; l'alarme ; triangle d'avertissement et cadenas ouvert */

const S04_NODES = (() => {
  const n = 96;
  const pts = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = ga * i;
    pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
  }
  const edges = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
      if (d < 0.36) edges.push([i, j]);
    }
  return { pts, edges };
})();
const S04_HABITS = ['LAIT', 'COUCHES', 'CAFÉ', 'SAMEDI 10 H', 'BIO', 'RABAIS', 'CODE POSTAL', 'PROMOS'];

function s04_card(ctx, x, y, cw, rot, o) {
  const { col = C.cyan, col2 = C.night, name = '', alpha = 1, scan = 0 } = o;
  if (alpha <= 0.003) return;
  const ch = cw * 0.63;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  light(ctx, 0, 0, cw * 0.9, col, 0.2 + scan * 0.4);
  rrect(ctx, -cw / 2, -ch / 2, cw, ch, cw * 0.06);
  const g = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2);
  g.addColorStop(0, mix(col, C.night, 0.35));
  g.addColorStop(0.55, mix(col, C.night, 0.72));
  g.addColorStop(1, col2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(C.white, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // puce
  ctx.fillStyle = rgba(C.gold, 0.9);
  rrect(ctx, -cw * 0.38, -ch * 0.12, cw * 0.14, ch * 0.2, cw * 0.02);
  ctx.fill();
  ctx.strokeStyle = rgba('#92400E', 0.8);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-cw * 0.31, -ch * 0.12);
  ctx.lineTo(-cw * 0.31, ch * 0.08);
  ctx.moveTo(-cw * 0.38, -ch * 0.02);
  ctx.lineTo(-cw * 0.24, -ch * 0.02);
  ctx.stroke();
  // bande magnétique / code
  ctx.fillStyle = rgba(C.white, 0.5);
  for (let k = 0; k < 14; k++) ctx.fillRect(cw * 0.06 + k * cw * 0.024, ch * 0.22, k % 3 ? cw * 0.008 : cw * 0.014, ch * 0.14);
  // reflet qui balaie
  if (scan > 0.01) {
    ctx.save();
    rrect(ctx, -cw / 2, -ch / 2, cw, ch, cw * 0.06);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const sx = lerp(-cw, cw, scan);
    const sg = ctx.createLinearGradient(sx - cw * 0.2, 0, sx + cw * 0.2, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(255,255,255,0.55)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
    ctx.restore();
  }
  // nom : taille fixe (o.base), mise à l'échelle par transformation quand la carte rétrécit
  const base = o.base || cw;
  ctx.save();
  ctx.translate(-cw * 0.4, -ch * 0.26);
  ctx.scale(cw / base, cw / base);
  drawSprite(ctx, textSprite(name, { size: Math.floor(base * 0.1), weight: 900, color: C.white, spacing: 3 }), 0, 0, { align: 'left', base: 'middle' });
  ctx.restore();
  ctx.restore();
}

function sceneFideliteIA(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const T = cues(scene, {
    canada: 'Et au Canada',
    scannez: 'vous scannez',
    pc: 'PC Optimum',
    moi: 'Moi ou',
    scene: 'Scène Plus',
    sous: 'quelques sous',
    nourr: 'vous nourrissez',
    vastes: 'plus vastes bases',
    comport: 'comportementales',
    ajoutez: 'Ajoutez maintenant',
    ia: "l'intelligence artificielle",
    partenariat: 'le partenariat',
    loblaw: 'Loblaw et ChatGPT',
    listes: "listes d'épicerie",
    officiel: 'Officiellement',
    jurent: 'jurent',
    pasde: "n'utilisent pas",
    magasin: 'en magasin',
    chercheurs: 'les chercheurs',
    alarme: "sonnent l'alarme",
    aucune: 'aucune loi québécoise',
    interdit: "n'interdit encore",
    moduler: 'moduler ses prix',
    donnees: 'vos données'
  });

  // centre du réseau (caméra : il glisse de côté à l'acte III)
  const side = eInOutQuart(seg(lt, T.officiel - 0.4, T.officiel + 1.4));
  const nx = V ? cx : lerp(w * 0.36, w * 0.27, side);
  const ny = V ? lerp(h * 0.43, h * 0.3, side) : h * 0.53;
  const netIn = eOutExpo(seg(lt, T.nourr - 0.2, T.ia + 1.2));
  const R = m * (V ? 0.28 : 0.25) * lerp(0.35, 1, netIn) * lerp(1, V ? 0.68 : 0.78, side);

  frame(a, () => {
    dust(ctx, stage, gt, { count: 80, alpha: 0.3, seed: 44 });

    /* ── ACTE I : les cartes ── */
    const cards = [
      { name: 'PC OPTIMUM', col: '#9F1239', k: T.scannez + 0.3 },
      { name: 'MOI', col: '#0369A1', k: T.moi },
      { name: 'SCÈNE+', col: '#6D28D9', k: T.scene }
    ];
    const cardsOut = eInOutQuart(seg(lt, T.ia - 0.6, T.ia + 0.8));
    const cA = 1 - cardsOut;
    const cw = V ? w * 0.42 : w * 0.17;
    const cardPos = (i) => {
      const drift = (lt - T.pc) * m * 0.004;
      if (V) return { x: cx + (i - 1) * w * 0.18, y: h * 0.62 + (i - 1) * h * 0.075 - drift * (i - 1), rot: -0.12 + i * 0.12 };
      return { x: cx + (i - 1) * w * 0.22 + drift * (i - 1), y: h * 0.68 + (i === 1 ? -h * 0.03 : 0), rot: -0.1 + i * 0.1 };
    };
    if (cA > 0.003) {
      cards.forEach((c, i) => {
        const on = eOutExpo(seg(lt, c.k - 0.3, c.k + 0.9));
        if (on <= 0) return;
        const p = cardPos(i);
        const scan = seg(lt, c.k, c.k + 0.9);
        const ox = (1 - on) * (V ? 0 : (i - 1) * w * 0.25);
        const oy = (1 - on) * h * 0.25;
        // en sortie, les cartes sont aspirées vers le réseau
        const px = lerp(p.x + ox, nx, eInCubic(cardsOut));
        const py = lerp(p.y + oy, ny, eInCubic(cardsOut));
        s04_card(ctx, px, py, cw * lerp(1, 0.2, cardsOut), p.rot * (1 - cardsOut), { col: c.col, col2: '#05080F', name: c.name, alpha: cA * on, scan, base: cw });
      });
      // quelques sous qui tombent
      const sA = env(lt, T.sous - 0.2, T.nourr + 0.6, 0.3, 0.5) * cA;
      if (sA > 0.003) {
        for (let k = 0; k < 3; k++) {
          const tt = seg(lt, T.sous + k * 0.18, T.sous + 1.2 + k * 0.18);
          const x = cx + (k - 1) * m * 0.05;
          const y0 = V ? h * 0.45 : h * 0.4;
          const y = y0 + eInCubic(tt) * m * 0.1;
          ctx.save();
          ctx.globalAlpha *= sA * (1 - smooth(seg(tt, 0.8, 1)));
          ctx.translate(x, y);
          ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.cos((lt + k) * 4)));
          ctx.fillStyle = C.gold;
          ctx.beginPath();
          ctx.arc(0, 0, m * 0.012, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        mono(ctx, 'QUELQUES SOUS DE RABAIS', cx, (V ? h * 0.45 : h * 0.4) - m * 0.04, { size: Math.floor(m * 0.019), color: C.gold, spacing: 5, t: seg(lt, T.sous, T.sous + 0.8), alpha: sA });
      }
      const ty = V ? h * 0.17 : h * 0.18;
      const swq = smooth(seg(lt, T.nourr - 0.3, T.nourr + 0.1));
      kRise(ctx, 'ET AU CANADA ?', cx, ty, { size: Math.floor(m * 0.068), weight: 900, t: seg(lt, T.canada - 0.2, T.canada + 0.7), out: swq, alpha: cA });
      mono(ctx, 'CHAQUE PASSAGE À LA CAISSE', cx, ty + m * 0.06, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.scannez, T.scannez + 1.0), alpha: cA * (1 - swq) });
    }

    /* ── FLUX DE PARTICULES (cartes → réseau) ── */
    const fA = env(lt, T.nourr - 0.2, T.ia + 1.0, 0.5, 0.8);
    if (fA > 0.003) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      cards.forEach((c, i) => {
        const p = cardPos(i);
        const path = quadPts({ x: p.x, y: p.y - cw * 0.2 }, { x: nx, y: ny }, (i - 1) * m * 0.18 + m * 0.05, 48);
        for (let k = 0; k < 26; k++) {
          const u = (lt * 0.42 + k / 26 + i * 0.13) % 1;
          const q = along(path, u);
          const s = 1.2 + 2.2 * Math.sin(u * Math.PI);
          ctx.globalAlpha = fA * Math.sin(u * Math.PI) * 0.9;
          ctx.fillStyle = k % 4 === 0 ? C.white : C.cyan;
          ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
        }
      });
      ctx.restore();
    }

    /* ── RÉSEAU NEURONAL SPHÉRIQUE ── */
    const nA = smooth(seg(lt, T.nourr - 0.3, T.nourr + 0.8));
    if (nA > 0.003) {
      const rotY = lt * 0.35;
      const rotX = 0.35 + 0.08 * Math.sin(lt * 0.3);
      const cyY = Math.cos(rotY);
      const syY = Math.sin(rotY);
      const cxX = Math.cos(rotX);
      const sxX = Math.sin(rotX);
      const proj = S04_NODES.pts.map(([x, y, z]) => {
        const x1 = x * cyY + z * syY;
        const z1 = -x * syY + z * cyY;
        const y1 = y * cxX - z1 * sxX;
        const z2 = y * sxX + z1 * cxX;
        const f = 3 / (3 + z2);
        return { x: nx + x1 * R * f, y: ny + y1 * R * f, z: z2, f };
      });
      const iaGlow = smooth(seg(lt, T.ia - 0.3, T.ia + 0.8));
      const alarm = smooth(seg(lt, T.alarme - 0.3, T.alarme + 0.6));
      const col = mix(C.cyan, C.amber, alarm);
      light(ctx, nx, ny, R * 1.6, col, nA * (0.18 + 0.25 * iaGlow));
      ctx.save();
      ctx.globalAlpha *= nA;
      ctx.lineWidth = 1;
      for (const [i, j] of S04_NODES.edges) {
        const p = proj[i];
        const q = proj[j];
        const depth = 0.5 - (p.z + q.z) * 0.25;
        ctx.strokeStyle = rgba(col, (0.08 + 0.35 * depth) * (0.4 + 0.6 * iaGlow));
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      proj.forEach((p, i) => {
        const depth = 0.5 - p.z * 0.5;
        const pulse = 0.5 + 0.5 * Math.sin(gt * 2.4 + i * 1.7);
        const r = (1.6 + 2.6 * depth) * (1 + iaGlow * pulse * 0.6);
        ctx.fillStyle = rgba(i % 7 === 0 ? C.white : col, 0.35 + 0.65 * depth);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.fill();
      });
      ctx.restore();
      // ondes d'alarme
      if (alarm > 0.01) shockwave(ctx, nx, ny, R * 1.7, gt, { color: C.amber, count: 3, period: 1.6, alpha: nA * alarm * (1 - smooth(seg(lt, T.aucune + 1.5, T.aucune + 3))) });
      // habitudes en orbite (profondeur → échelle de sprite)
      const hA = nA * env(lt, T.ia, T.officiel + 0.6, 0.8, 0.6);
      if (hA > 0.003) {
        S04_HABITS.forEach((lab, i) => {
          const an = (i / S04_HABITS.length) * TAU + lt * 0.3;
          const tilt = 0.32;
          const orb = V ? 1.15 : 1.35;
          const ox = Math.cos(an) * R * orb;
          const oz = Math.sin(an);
          const oy = Math.sin(an) * R * orb * tilt - R * 0.1 * Math.cos(an * 2);
          const f = 3 / (3 + oz * 0.9);
          const on = smooth(seg(lt, T.ia + i * 0.25, T.ia + 0.6 + i * 0.25));
          const S = textSprite(lab, { size: Math.floor(m * 0.022), weight: 600, fam: MONO, color: oz < 0 ? C.white : C.ice, spacing: 4 });
          drawSprite(ctx, S, nx + ox * f, ny + oy * f, { base: 'middle', scale: f * 0.92, alpha: hA * on * (0.35 + 0.65 * (0.5 - oz * 0.5)) });
        });
      }
      const ty = V ? h * 0.13 : h * 0.16;
      const tx = cx;
      const tA = env(lt, T.nourr, T.ajoutez + 0.2, 0.4, 0.5);
      kWipe(ctx, 'UNE DES PLUS VASTES', tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.vastes - 0.3, T.vastes + 0.7), alpha: tA, edge: C.cyan });
      kWipe(ctx, 'BASES DE DONNÉES', tx, ty + m * 0.065, { size: Math.floor(m * 0.05), weight: 900, color: C.cyan, t: seg(lt, T.vastes + 0.2, T.vastes + 1.2), alpha: tA, edge: C.white });
      mono(ctx, 'COMPORTEMENTALES DU PAYS', tx, ty + m * 0.12, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.comport, T.comport + 0.9), alpha: tA });
      const iA = env(lt, T.ajoutez, T.officiel + 0.2, 0.4, 0.5);
      kRise(ctx, '+ INTELLIGENCE ARTIFICIELLE', tx, ty + m * 0.03, { size: Math.floor(m * (V ? 0.05 : 0.048)), weight: 900, t: seg(lt, T.ia - 0.2, T.ia + 0.9), alpha: iA, maxW: V ? w * 0.9 : w * 0.5 });
    }

    /* ── BULLE DE CONVERSATION « LOBLAW × CHATGPT » ── */
    const bA = env(lt, T.partenariat - 0.3, T.officiel + 0.4, 0.4, 0.6);
    if (bA > 0.003) {
      const bw = V ? w * 0.74 : w * 0.27;
      const bh = V ? h * 0.2 : h * 0.4;
      const bx = V ? cx : w * 0.775;
      const by = V ? h * 0.76 : h * 0.53;
      const pop = eOutBack(seg(lt, T.partenariat - 0.2, T.partenariat + 0.5), 1.3);
      ctx.save();
      ctx.globalAlpha *= bA;
      ctx.translate(bx, by);
      ctx.scale(pop, pop);
      rrect(ctx, -bw / 2, -bh / 2, bw, bh, m * 0.025);
      ctx.fillStyle = 'rgba(12,20,34,0.92)';
      ctx.fill();
      ctx.strokeStyle = rgba(C.emerald, 0.75);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      if (V) {
        ctx.moveTo(-bw * 0.08, -bh / 2);
        ctx.lineTo(0, -bh / 2 - m * 0.03);
        ctx.lineTo(bw * 0.08, -bh / 2);
      } else {
        ctx.moveTo(-bw / 2, -bh * 0.08);
        ctx.lineTo(-bw / 2 - m * 0.03, 0);
        ctx.lineTo(-bw / 2, bh * 0.08);
      }
      ctx.fillStyle = 'rgba(12,20,34,0.92)';
      ctx.fill();
      ctx.restore();
      if (pop > 0.9) {
        const x0 = bx - bw / 2 + m * 0.03;
        let y = by - bh / 2 + m * 0.045;
        mono(ctx, 'LOBLAW × CHATGPT', x0, y, { size: Math.floor(m * 0.018), color: C.mint, spacing: 4, align: 'left', t: seg(lt, T.loblaw, T.loblaw + 0.8), alpha: bA });
        const lines = ['• LAIT 2 L', '• PAIN DE BLÉ', '• BANANES', '• CAFÉ MOULU'];
        const lh = V ? m * 0.042 : m * 0.055;
        y += m * 0.035;
        lines.forEach((l, i) => {
          const k = T.listes + i * 0.45;
          if (V && i >= 2) {
            mono(ctx, l, bx + m * 0.02, y + lh * (i - 2) + lh, { size: Math.floor(m * 0.024), color: C.white, spacing: 2, align: 'left', t: seg(lt, k - 0.3, k + 0.4), alpha: bA });
          } else {
            mono(ctx, l, x0, y + lh * i * (V ? 1 : 1) + lh, { size: Math.floor(m * 0.024), color: C.white, spacing: 2, align: 'left', t: seg(lt, k - 0.3, k + 0.4), alpha: bA });
          }
        });
      }
    }

    /* ── ACTE III : serment, alarme, triangle ── */
    const oA = smooth(seg(lt, T.officiel - 0.2, T.officiel + 0.6));
    if (oA > 0.003) {
      const tx = V ? cx : w * 0.66;
      const oy = V ? h * 0.52 : h * 0.2;
      const swap = smooth(seg(lt, T.aucune - 0.5, T.aucune));
      mono(ctx, 'OFFICIELLEMENT, LES BANNIÈRES JURENT :', tx, oy - m * 0.06, { size: Math.floor(m * 0.018), color: C.slate, spacing: 4, t: seg(lt, T.officiel, T.jurent + 0.8), alpha: oA * (1 - swap) });
      kWipe(ctx, 'PAS DE PRIX PERSONNALISÉS', tx, oy, { size: Math.floor(m * (V ? 0.044 : 0.04)), weight: 800, color: C.white, t: seg(lt, T.pasde - 0.1, T.pasde + 0.9), alpha: oA * (1 - swap), edge: C.cyan, maxW: V ? w * 0.9 : w * 0.6 });
      kSlide(ctx, 'EN MAGASIN', tx, oy + m * 0.06, { size: Math.floor(m * (V ? 0.044 : 0.04)), weight: 800, color: C.cyan, t: seg(lt, T.magasin - 0.1, T.magasin + 0.7), alpha: oA * (1 - swap) });
      mono(ctx, 'CHERCHEURS · ÉLUS : ALARME', tx, oy + m * 0.13, { size: Math.floor(m * 0.019), color: C.amber, spacing: 5, t: seg(lt, T.chercheurs, T.alarme + 0.8), alpha: oA * (1 - swap) });
      // triangle d'avertissement + cadenas ouvert
      const trA = smooth(seg(lt, T.aucune - 0.5, T.aucune + 0.2));
      if (trA > 0.003) {
        const trx = V ? cx : w * 0.66;
        const try_ = V ? h * 0.58 : h * 0.36;
        const s = m * (V ? 0.12 : 0.1);
        const draw = eInOutQuart(seg(lt, T.aucune - 0.4, T.aucune + 0.8));
        const pts = [
          { x: trx, y: try_ - s },
          { x: trx + s * 1.1, y: try_ + s * 0.85 },
          { x: trx - s * 1.1, y: try_ + s * 0.85 },
          { x: trx, y: try_ - s }
        ];
        light(ctx, trx, try_, s * 2.4, C.amber, trA * 0.35);
        glowPath(ctx, pts, draw, { color: C.amber, width: 5, alpha: trA });
        const ex = smooth(seg(lt, T.aucune + 0.4, T.aucune + 0.9));
        ctx.save();
        ctx.globalAlpha *= trA * ex;
        ctx.fillStyle = C.amber;
        ctx.fillRect(trx - s * 0.06, try_ - s * 0.42, s * 0.12, s * 0.62);
        ctx.beginPath();
        ctx.arc(trx, try_ + s * 0.42, s * 0.08, 0, TAU);
        ctx.fill();
        ctx.restore();
        const ly = try_ + s * 1.55 + m * 0.03;
        kRise(ctx, 'AUCUNE LOI QUÉBÉCOISE', trx, ly, { size: Math.floor(m * (V ? 0.058 : 0.05)), weight: 900, color: C.amber, t: seg(lt, T.aucune, T.aucune + 1.0), alpha: trA, glow: 18, glowColor: rgba(C.amber, 0.45), maxW: V ? w * 0.9 : w * 0.56 });
        kRise(ctx, "N'INTERDIT ENCORE", trx, ly + m * 0.07, { size: Math.floor(m * (V ? 0.058 : 0.05)), weight: 900, t: seg(lt, T.interdit, T.interdit + 0.9), alpha: trA, maxW: V ? w * 0.9 : w * 0.56 });
        mono(ctx, 'DE MODULER VOS PRIX GRÂCE À VOS DONNÉES', trx, ly + m * 0.125, { size: Math.floor(m * (V ? 0.017 : 0.018)), color: C.ice, spacing: 4, t: seg(lt, T.moduler, T.donnees + 1.0), alpha: trA });
        // cadenas ouvert sur le réseau
        const pk = smooth(seg(lt, T.aucune + 0.6, T.aucune + 1.4));
        if (pk > 0.003) {
          const lx = nx;
          const lyy = ny;
          const ls = R * 0.32;
          ctx.save();
          ctx.globalAlpha *= pk;
          ctx.strokeStyle = C.amber;
          ctx.lineWidth = ls * 0.14;
          ctx.shadowColor = C.amber;
          ctx.shadowBlur = 16;
          rrect(ctx, lx - ls * 0.6, lyy - ls * 0.1, ls * 1.2, ls * 0.95, ls * 0.12);
          ctx.fillStyle = 'rgba(20,12,2,0.9)';
          ctx.fill();
          ctx.stroke();
          const open = eOutBack(seg(lt, T.aucune + 0.9, T.aucune + 1.7), 2);
          ctx.beginPath();
          ctx.arc(lx + ls * 0.35 * open, lyy - ls * 0.1 - ls * 0.25 * open, ls * 0.38, Math.PI, 0);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 05 — rep-deux-cotes-etiquettes · Anti-gaspillage efficace ou piège algorithmique ?
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : la question ; une ligne d'horizon cyan se trace et divise l'écran en deux plans (miroir)
 * Acte II  : en haut, côté détaillants (émeraude) : papier, erreurs, horloge anti-gaspillage, −30 % → −50 %
 *            en bas, le reflet se redresse côté consommateurs (ambre) : bien essentiel, vendredi 17 h, prix ↑
 * Acte III : l'horizon devient le fléau d'une balance : BAISSER ↔ GONFLER */

function s05_clock(ctx, x, y, r, frac, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  light(ctx, x, y, r * 2.2, color, 0.25);
  ring(ctx, x, y, r, { color: rgba(color, 0.35), width: 2 });
  ring(ctx, x, y, r, { color, width: 4, a0: -Math.PI / 2, sweep: TAU * frac, glow: 12 });
  ctx.strokeStyle = C.white;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, r * 0.07);
  const an = -Math.PI / 2 + TAU * frac;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(an) * r * 0.72, y + Math.sin(an) * r * 0.72);
  ctx.stroke();
  ctx.lineWidth = Math.max(2, r * 0.09);
  const an2 = -Math.PI / 2 + TAU * frac / 12 + 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(an2) * r * 0.45, y + Math.sin(an2) * r * 0.45);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * TAU;
    ctx.fillStyle = rgba(C.white, i % 3 ? 0.35 : 0.8);
    ctx.fillRect(x + Math.cos(t) * r * 0.86 - 1.5, y + Math.sin(t) * r * 0.86 - 1.5, 3, 3);
  }
  ctx.restore();
}

/** Étiquette (boîtier + nom + prix) ; flipY ∈ [-1, 1] : -1 = reflet sans texte, 1 = endroit. */
function s05_label(ctx, x, y, lw, o) {
  const { name = '', price = 0, color = C.emerald, alpha = 1, badge = '', badgeT = 1, flipY = 1, textOn = true } = o;
  if (alpha <= 0.003) return;
  const lh = lw * 0.5;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(1, flipY);
  light(ctx, 0, 0, lw * 0.8, color, 0.22);
  rrect(ctx, -lw / 2, -lh / 2, lw, lh, lw * 0.05);
  ctx.fillStyle = 'rgba(10,18,30,0.95)';
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.9);
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
  if (!textOn || flipY < 0.98) return;
  mono(ctx, name, x - lw * 0.42, y - lh * 0.24, { size: Math.floor(lw * 0.075), color: C.slate, spacing: 3, align: 'left', alpha, cursor: false });
  odometer(ctx, price, x - lw * 0.42, y + lh * 0.3, { size: Math.floor(lw * 0.17), weight: 900, color: C.white, dec: 2, align: 'left', suffix: ' $', suffixScale: 0.55, alpha });
  if (badge && badgeT > 0) {
    const bx = x + lw * 0.3;
    const by = y - lh * 0.02;
    const br = lw * 0.15 * eOutBack(badgeT, 2);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function sceneDeuxCotesEtiquettes(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    bannir: 'Faut-il bannir',
    ia: "l'IA en épicerie",
    deux: 'les deux côtés',
    rigueur: 'avec rigueur',
    cote1: "D'un côté",
    etiqNum: 'les étiquettes numériques',
    papier: 'tonnes de papier',
    erreurs: 'erreurs humaines',
    rabais: 'des rabais à la baisse',
    viandes: 'les viandes',
    pains: 'les pains',
    limite: 'date limite',
    gaspillage: 'gaspillage alimentaire',
    autre: "De l'autre côté",
    essentiel: 'un bien essentiel',
    concert: 'billet de concert',
    baisser: 'baisser les prix',
    gonfler: 'les gonfler',
    dixsept: 'dix-sept heures',
    vendredi: 'un vendredi soir'
  });

  // caméra verticale : on regarde le haut, puis le bas, puis la balance
  const camY = track(lt, [
    [0, 0],
    [T.cote1 - 0.6, 0],
    [T.cote1 + 0.8, (V ? 0.09 : 0.13) * h, eInOutQuart],
    [T.autre - 0.5, (V ? 0.09 : 0.13) * h],
    [T.autre + 0.9, -(V ? 0.09 : 0.13) * h, eInOutQuart],
    [T.baisser - 0.3, -(V ? 0.09 : 0.13) * h],
    [T.baisser + 1.0, 0, eInOutQuart]
  ]);
  const hy = cy + camY;
  const U = V ? h * 0.15 : h * 0.22; // distance type entre l'horizon et les étiquettes
  const lw = V ? w * 0.36 : w * 0.17;
  const topOn = smooth(seg(lt, T.cote1 - 0.2, T.cote1 + 0.6));
  const botOn = smooth(seg(lt, T.autre - 0.2, T.autre + 0.7));
  const flipUp = eInOutQuart(seg(lt, T.autre + 0.3, T.autre + 1.5)); // le reflet se redresse
  const scaleT = eInOutQuart(seg(lt, T.baisser - 0.4, T.baisser + 0.8)); // balance
  const lx = (i) => cx + (i - 0.5) * (V ? w * 0.42 : w * 0.21);

  frame(a, () => {
    dust(ctx, stage, gt, { count: 70, alpha: 0.25, seed: 55 });

    /* ── la ligne d'horizon (puis fléau de balance) ── */
    const lineT = eInOutQuart(seg(lt, T.deux - 0.3, T.deux + 1.0));
    const tilt = scaleT * 0.07 * Math.sin((lt - T.baisser) * 2.2) * Math.exp(-Math.max(0, lt - T.baisser - 0.6) * 0.5);
    if (lineT > 0) {
      const half = (w / 2) * lineT * lerp(1, V ? 0.84 : 0.62, scaleT);
      ctx.save();
      ctx.translate(cx, hy);
      ctx.rotate(tilt);
      const g = ctx.createLinearGradient(-half, 0, half, 0);
      g.addColorStop(0, rgba(C.cyan, 0));
      g.addColorStop(0.2, rgba(C.cyan, 0.9));
      g.addColorStop(0.5, rgba(C.white, 1));
      g.addColorStop(0.8, rgba(C.cyan, 0.9));
      g.addColorStop(1, rgba(C.cyan, 0));
      ctx.fillStyle = g;
      ctx.shadowColor = C.cyan;
      ctx.shadowBlur = 14;
      ctx.fillRect(-half, -1.5, half * 2, 3);
      ctx.restore();
      light(ctx, cx, hy, m * 0.1, C.cyan, 0.5 * lineT * (1 - scaleT * 0.5));
      // reflet du ciel dans le plan inférieur (halo)
      ctx.save();
      ctx.globalAlpha *= 0.5 * lineT;
      const rg = ctx.createLinearGradient(0, hy, 0, hy + h * 0.3);
      rg.addColorStop(0, rgba(C.cyan, 0.08));
      rg.addColorStop(1, rgba(C.cyan, 0));
      ctx.fillStyle = rg;
      ctx.fillRect(0, hy, w, h * 0.3);
      ctx.restore();
    }

    /* ── ACTE I : la question ── */
    const qA = 1 - smooth(seg(lt, T.cote1 - 0.5, T.cote1 + 0.2));
    if (qA > 0.003) {
      kRise(ctx, 'FAUT-IL BANNIR', cx, hy - m * 0.13, { size: Math.floor(m * (V ? 0.08 : 0.075)), weight: 900, t: seg(lt, T.bannir - 0.2, T.bannir + 0.8), alpha: qA, maxW: w * 0.9 });
      kRise(ctx, 'CES ÉTIQUETTES ?', cx, hy - m * 0.04, { size: Math.floor(m * (V ? 0.08 : 0.075)), weight: 900, color: C.cyan, t: seg(lt, T.bannir + 0.4, T.bannir + 1.3), alpha: qA, maxW: w * 0.9 });
      mono(ctx, 'LES DEUX CÔTÉS DE LA MÉDAILLE', cx, hy + m * 0.07, { size: Math.floor(m * 0.02), color: C.slate, spacing: 7, t: seg(lt, T.deux, T.deux + 1.0), alpha: qA });
      mono(ctx, 'AVEC RIGUEUR', cx, hy + m * 0.11, { size: Math.floor(m * 0.018), color: C.amber, spacing: 7, t: seg(lt, T.rigueur, T.rigueur + 0.6), alpha: qA });
    }

    /* ── PLAN SUPÉRIEUR : côté détaillants ── */
    const tA = topOn * (1 - scaleT * 0.25);
    if (tA > 0.003) {
      const ly = hy - U;
      mono(ctx, 'CÔTÉ DÉTAILLANTS', cx, hy - U * (V ? 2.45 : 1.72), { size: Math.floor(m * 0.02), color: C.emerald, spacing: 8, t: seg(lt, T.cote1, T.cote1 + 0.8), alpha: tA * (1 - botOn) });
      // papier qui se dissout
      const pA = tA * env(lt, T.papier - 0.3, T.autre + 0.5, 0.4, 0.6) * (1 - scaleT);
      if (pA > 0.003) {
        const px = V ? w * 0.18 : w * 0.14;
        const py = V ? ly - U * 0.98 : ly;
        const dis = seg(lt, T.papier + 0.2, T.papier + 2.4);
        const r = rng(51);
        for (let k = 0; k < 4; k++) {
          ctx.save();
          ctx.globalAlpha *= pA * (1 - dis);
          ctx.translate(px + k * m * 0.012, py - k * m * 0.012);
          ctx.fillStyle = rgba(C.slate, 0.25 + k * 0.1);
          ctx.strokeStyle = rgba(C.white, 0.6);
          ctx.fillRect(-m * 0.05, -m * 0.065, m * 0.1, m * 0.13);
          ctx.strokeRect(-m * 0.05, -m * 0.065, m * 0.1, m * 0.13);
          ctx.restore();
        }
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 60; k++) {
          const ox = (r() - 0.5) * m * 0.1;
          const oy = (r() - 0.5) * m * 0.12;
          const sp = 0.5 + r();
          const tt = clamp(dis * 1.4 - r() * 0.4);
          if (tt <= 0 || tt >= 1) continue;
          ctx.globalAlpha = pA * (1 - tt) * 0.9;
          ctx.fillStyle = C.mint;
          ctx.fillRect(px + ox + tt * m * 0.06 * sp, py + oy - tt * m * 0.14 * sp, 2.5, 2.5);
        }
        ctx.restore();
        mono(ctx, '− PAPIER', px, py + m * 0.085, { size: Math.floor(m * 0.019), color: C.mint, spacing: 4, t: seg(lt, T.papier, T.papier + 0.6), alpha: pA });
      }
      // erreurs d'affichage : coche
      const eA = tA * env(lt, T.erreurs - 0.3, T.autre + 0.5, 0.4, 0.6) * (1 - scaleT);
      if (eA > 0.003) {
        const ex = V ? w * 0.82 : w * 0.86;
        const ey = V ? ly - U * 0.98 : ly;
        const ck = [{ x: ex - m * 0.055, y: ey }, { x: ex - m * 0.016, y: ey + m * 0.042 }, { x: ex + m * 0.062, y: ey - m * 0.048 }];
        light(ctx, ex, ey, m * 0.08, C.emerald, eA * 0.4);
        glowPath(ctx, ck, eInOutQuart(seg(lt, T.erreurs, T.erreurs + 0.7)), { color: C.emerald, width: 6, alpha: eA });
        mono(ctx, '− ERREURS', ex, ey + m * 0.085, { size: Math.floor(m * 0.019), color: C.mint, spacing: 4, t: seg(lt, T.erreurs, T.erreurs + 0.6), alpha: eA });
      }
      // horloge anti-gaspillage
      const clockA = tA * env(lt, T.rabais - 0.4, T.autre + 0.4, 0.5, 0.5) * (1 - scaleT);
      const cxk = V ? cx : w * 0.29;
      const cyk = V ? ly - U * 1.0 : ly;
      s05_clock(ctx, cxk, cyk, m * (V ? 0.06 : 0.055), 0.55 + 0.4 * seg(lt, T.rabais, T.limite + 1), C.emerald, clockA);
      mono(ctx, 'DATE LIMITE', cxk, cyk + m * (V ? 0.1 : 0.095), { size: Math.floor(m * 0.017), color: C.emerald, spacing: 4, t: seg(lt, T.limite, T.limite + 0.6), alpha: clockA });
      // étiquettes viande & pain (rabais qui chutent)
      const items = [['VIANDE', 12.99, T.viandes], ['PAIN', 4.49, T.pains]];
      items.forEach(([nm, p0, k], i) => {
        const on = eOutExpo(seg(lt, T.etiqNum - 0.2 + i * 0.25, T.etiqNum + 0.8 + i * 0.25));
        const x = V ? lx(i) : w * 0.5 + (i - 0.5) * w * 0.2 + w * 0.06;
        const disc = lerp(0.3, 0.5, eInOutQuart(seg(lt, T.limite - 0.2, T.limite + 1.4)));
        const price = Math.round(p0 * (1 - disc) * 100) / 100;
        const pAnim = lerp(p0, Math.round(p0 * 0.7 * 100) / 100, eInOutQuart(seg(lt, Math.max(T.rabais, k - 0.6), Math.max(T.rabais, k - 0.6) + 0.9)));
        const shown = lt < T.limite - 0.2 ? pAnim : lerp(Math.round(p0 * 0.7 * 100) / 100, price, eInOutQuart(seg(lt, T.limite - 0.2, T.limite + 1.4)));
        const kb = Math.max(T.rabais, k - 0.6);
        s05_label(ctx, x, ly, lw, { name: nm, price: shown, color: C.emerald, alpha: tA * on, badge: 'x', badgeT: seg(lt, kb, kb + 0.6) });
        const bx = x + lw * 0.3;
        const by = ly - lw * 0.01;
        odometer(ctx, Math.round(disc * 100), bx, by + lw * 0.04, { size: Math.floor(lw * 0.1), weight: 900, color: C.night, prefix: '−', suffix: '%', suffixScale: 0.7, alpha: tA * on * smooth(seg(lt, kb + 0.2, kb + 0.7)) });
        // reflet (formes seulement) tant que le plan inférieur n'est pas actif
        s05_label(ctx, x, hy + (hy - ly), lw, { color: C.emerald, alpha: tA * on * 0.18 * (1 - botOn), flipY: -1, textOn: false });
      });
      const gA = tA * smooth(seg(lt, T.gaspillage - 0.3, T.gaspillage + 0.3)) * (1 - scaleT);
      kWipe(ctx, 'MOINS DE GASPILLAGE', cx, ly + lw * 0.25 + m * (V ? 0.085 : 0.065), { size: Math.floor(m * (V ? 0.05 : 0.044)), weight: 900, color: C.emerald, t: seg(lt, T.gaspillage - 0.2, T.gaspillage + 0.8), alpha: gA, edge: C.white, maxW: w * 0.9 });
    }

    /* ── PLAN INFÉRIEUR : côté consommateurs (le reflet se redresse) ── */
    const bA = botOn * (1 - scaleT * 0.25);
    if (bA > 0.003) {
      const ly = hy + U;
      mono(ctx, 'CÔTÉ CONSOMMATEURS', cx, hy + U * (V ? 0.45 : 0.42), { size: Math.floor(m * 0.02), color: C.amber, spacing: 8, t: seg(lt, T.autre, T.autre + 0.8), alpha: bA * (1 - scaleT) });
      const items = [['VIANDE', 12.99], ['PAIN', 4.49]];
      const rise = eInOutQuart(seg(lt, T.dixsept - 0.3, Math.min(T.vendredi + 0.6, D - 0.6)));
      items.forEach(([nm, p0], i) => {
        const x = V ? lx(i) : w * 0.5 + (i - 0.5) * w * 0.2 + w * 0.06;
        const fy = lerp(-1, 1, flipUp);
        const up = Math.round(p0 * 1.18 * 100) / 100;
        s05_label(ctx, x, ly, lw, { name: nm, price: lerp(p0, up, rise), color: C.amber, alpha: bA, flipY: Math.abs(fy) < 0.02 ? 0.02 : fy, badge: 'x', badgeT: seg(lt, T.dixsept, T.dixsept + 0.6) });
        if (flipUp > 0.98) {
          const bx = x + lw * 0.3;
          const by = ly - lw * 0.01;
          arrowHead(ctx, bx, by + lw * 0.02 - lw * 0.03 * rise, -Math.PI / 2, lw * 0.07, C.night, bA * smooth(seg(lt, T.dixsept + 0.2, T.dixsept + 0.8)));
        }
      });
      // horloge « vendredi 17 h »
      const cxk = V ? cx : w * 0.29;
      const cyk = V ? ly + U * 1.0 : ly;
      const ckA = bA * smooth(seg(lt, T.autre + 0.8, T.autre + 1.5));
      s05_clock(ctx, cxk, cyk, m * (V ? 0.06 : 0.055), lerp(0.25, 5 / 12, eInOutQuart(seg(lt, T.essentiel, T.dixsept + 0.6))), C.amber, ckA);
      mono(ctx, 'VENDREDI 17 H', cxk, cyk + m * (V ? 0.1 : 0.095), { size: Math.floor(m * 0.017), color: C.amber, spacing: 4, t: seg(lt, T.vendredi, T.vendredi + 0.6), alpha: ckA });
      // bien essentiel / billet de concert
      const ex = V ? cx : w * 0.86;
      const eY = ly;
      const esA = bA * env(lt, T.essentiel - 0.3, T.baisser + 0.2, 0.4, 0.5);
      if (esA > 0.003) {
        // billet barré
        const tw = m * 0.1;
        const th = m * 0.05;
        const tx = V ? cx + w * 0.3 : ex;
        const tyy = V ? cyk : eY;
        const tOn = smooth(seg(lt, T.concert - 0.2, T.concert + 0.4));
        ctx.save();
        ctx.globalAlpha *= esA * tOn;
        ctx.strokeStyle = rgba(C.slate, 0.8);
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(tx - tw / 2, tyy - th / 2, tw, th);
        ctx.setLineDash([]);
        ctx.restore();
        drawSprite(ctx, textSprite('CONCERT', { size: Math.floor(m * 0.016), weight: 600, fam: MONO, color: C.slate, spacing: 3 }), tx, tyy, { base: 'middle', alpha: esA * tOn });
        const cross = eInOutQuart(seg(lt, T.concert + 0.2, T.concert + 0.8));
        glowPath(ctx, [{ x: tx - tw * 0.6, y: tyy + th * 0.7 }, { x: tx + tw * 0.6, y: tyy - th * 0.7 }], cross, { color: C.red, width: 4, alpha: esA });
        kRise(ctx, 'UN BIEN ESSENTIEL', cx, V ? ly + U * 1.75 : ly + U * 0.78, { size: Math.floor(m * (V ? 0.06 : 0.05)), weight: 900, color: C.amber, t: seg(lt, T.essentiel - 0.1, T.essentiel + 0.8), alpha: esA, maxW: w * 0.9 });
      }
    }

    /* ── ACTE III : la balance ── */
    if (scaleT > 0.003) {
      const half = (w / 2) * (V ? 0.84 : 0.62);
      const pivotH = m * 0.07;
      ctx.save();
      ctx.globalAlpha *= scaleT;
      ctx.fillStyle = rgba(C.white, 0.9);
      ctx.beginPath();
      ctx.moveTo(cx, hy + 4);
      ctx.lineTo(cx - pivotH * 0.6, hy + pivotH);
      ctx.lineTo(cx + pivotH * 0.6, hy + pivotH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const endL = { x: cx - Math.cos(tilt) * half * 0.92, y: hy - Math.sin(tilt) * half * 0.92 };
      const endR = { x: cx + Math.cos(tilt) * half * 0.92, y: hy + Math.sin(tilt) * half * 0.92 };
      beacon(ctx, endL.x, endL.y, { color: C.emerald, r: 9, alpha: scaleT, time: gt });
      beacon(ctx, endR.x, endR.y, { color: C.amber, r: 9, alpha: scaleT, time: gt + 0.5 });
      const fs = Math.floor(m * (V ? 0.05 : 0.05));
      kRise(ctx, 'BAISSER', V ? cx - w * 0.22 : endL.x + m * 0.02, endL.y - m * 0.05, { size: fs, weight: 900, color: C.emerald, t: seg(lt, T.baisser, T.baisser + 0.8), alpha: scaleT, align: V ? 'center' : 'left' });
      kRise(ctx, 'GONFLER', V ? cx + w * 0.22 : endR.x - m * 0.02, endR.y - m * 0.05, { size: fs, weight: 900, color: C.amber, t: seg(lt, T.gonfler, T.gonfler + 0.8), alpha: scaleT, align: V ? 'center' : 'right', glow: 14, glowColor: rgba(C.amber, 0.4) });
      mono(ctx, 'LE MÊME OUTIL', cx, hy + pivotH + m * 0.045, { size: Math.floor(m * 0.022), color: C.slate, spacing: 8, t: seg(lt, T.baisser + 0.2, T.baisser + 1.0), alpha: scaleT });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 06 — rep-oligopole-89pct · 3 géants contrôlent près de 89 % des supermarchés
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : « la technologie n'explique pas tout » ; la marge se resserre ; un disque de marché
 *            s'élève en perspective isométrique
 * Acte II  : trois arcs géants s'extrudent (Loblaw, Empire-Sobeys, Metro) = 89 % ; Costco et Walmart
 *            en satellites ; bascule zénithale : trois noyaux, bannières en orbite
 * Acte III : les orbites se resserrent ; « LA CONCURRENCE DEVIENT FRAGILE » avec une fissure */

const S06_SECTORS = [
  { k: 'loblaw', name: 'LOBLAW', col: C.cyan, share: 0.34 },
  { k: 'sobeys', name: 'EMPIRE-SOBEYS', col: C.emerald, share: 0.28 },
  { k: 'metro', name: 'METRO', col: C.amber, share: 0.27 },
  { k: 'other', name: 'AUTRES', col: '#475569', share: 0.11 }
];

/** Secteur extrudé d'un disque isométrique (parois avant + dessus). */
function s06_sector(ctx, x, y, rx, ry, a0, a1, hgt, col, alpha, lift = 0) {
  if (alpha <= 0.003) return;
  const N = Math.max(6, Math.ceil(((a1 - a0) / TAU) * 120));
  const mid = (a0 + a1) / 2;
  const ox = Math.cos(mid) * lift * rx;
  const oy = Math.sin(mid) * lift * ry;
  const P = (a, h) => ({ x: x + ox + Math.cos(a) * rx, y: y + oy + Math.sin(a) * ry - h });
  ctx.save();
  ctx.globalAlpha *= alpha;
  // paroi extérieure visible (moitié avant : sin > 0)
  if (hgt > 0.5) {
    const b0 = Math.max(a0, 0);
    const b1 = Math.min(a1, Math.PI);
    const segs = [];
    if (b1 > b0) segs.push([b0, b1]);
    if (a1 > TAU) {
      const c0 = Math.max(a0, TAU);
      const c1 = Math.min(a1, TAU + Math.PI);
      if (c1 > c0) segs.push([c0, c1]);
    }
    for (const [s0, s1] of segs) {
      const n = Math.max(4, Math.ceil(((s1 - s0) / TAU) * 120));
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const p = P(lerp(s0, s1, i / n), 0);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      for (let i = n; i >= 0; i--) {
        const p = P(lerp(s0, s1, i / n), hgt);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(0, y - hgt, 0, y + ry);
      g.addColorStop(0, mix(col, C.night, 0.35));
      g.addColorStop(1, mix(col, C.night, 0.75));
      ctx.fillStyle = g;
      ctx.fill();
    }
  }
  // dessus
  ctx.beginPath();
  const c = { x: x + ox, y: y + oy - hgt };
  ctx.moveTo(c.x, c.y);
  for (let i = 0; i <= N; i++) {
    const p = P(lerp(a0, a1, i / N), hgt);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  const tg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rx);
  tg.addColorStop(0, mix(col, C.white, 0.15));
  tg.addColorStop(1, col);
  ctx.fillStyle = tg;
  ctx.globalAlpha *= 0.92;
  ctx.fill();
  ctx.strokeStyle = rgba(C.night, 0.85);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function sceneOligopole89(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    techno: 'la technologie',
    explique: "n'explique pas tout",
    marge: 'votre marge de manœuvre',
    mince: 'si mince',
    structure: 'la structure même du marché',
    canada: 'Au Canada',
    trois: 'trois géants',
    loblaw: 'Loblaw, Empire',
    sobeys: 'Empire-Sobeys',
    metro: 'et Metro',
    controlent: 'contrôlent',
    pct: 'quatre-vingt-neuf pour cent',
    trad: 'épiceries traditionnels',
    costco: 'Costco',
    walmart: 'Walmart',
    maxi: 'Maxi',
    provigo: 'Provigo',
    pharma: 'Pharmaprix',
    metro2: 'Metro, Super C',
    superc: 'Super C',
    adonis: 'Adonis',
    coutu: 'Jean Coutu',
    iga: 'IGA',
    tradition: 'Tradition',
    boni: 'Bonichoix',
    quand: 'Quand trois groupes',
    quartier: 'votre quartier',
    concurrence: 'la concurrence réelle',
    fragile: 'beaucoup plus fragile'
  });

  const discIn = eOutExpo(seg(lt, T.structure - 0.4, T.structure + 1.4));
  const toCores = eInOutQuart(seg(lt, T.maxi - 1.2, T.maxi + 0.4));
  const discA = discIn * (1 - toCores);
  const dX = V ? cx : w * 0.4;
  const dY = V ? h * 0.52 : h * 0.6;
  const rx = (V ? w * 0.4 : w * 0.25) * lerp(0.7, 1, discIn);
  const tiltK = track(lt, [[0, 0.3], [T.structure + 1.4, 0.42, smoother], [T.maxi, 0.62, eInOutQuart]]);
  const ry = rx * tiltK;
  const spin = -Math.PI / 2 + lerp(-0.5, 0, discIn) + (lt - T.structure) * 0.02;

  frame(a, () => {
    dust(ctx, stage, gt, { count: 80, alpha: 0.28, seed: 66 });

    /* ── ACTE I : la technologie n'explique pas tout / marge mince ── */
    const iA = 1 - smooth(seg(lt, T.canada - 0.4, T.canada + 0.3));
    if (iA > 0.003) {
      const ty = V ? h * 0.36 : h * 0.2;
      const swap = smooth(seg(lt, T.marge - 0.3, T.marge + 0.2));
      kRise(ctx, 'LA TECHNOLOGIE', cx, ty, { size: Math.floor(m * (V ? 0.07 : 0.066)), weight: 900, t: seg(lt, T.techno - 0.2, T.techno + 0.7), out: swap, alpha: iA });
      kRise(ctx, "N'EXPLIQUE PAS TOUT", cx, ty + m * 0.08, { size: Math.floor(m * (V ? 0.07 : 0.066)), weight: 900, color: C.cyan, t: seg(lt, T.explique - 0.1, T.explique + 0.8), out: swap, alpha: iA, maxW: w * 0.9 });
      // marge de manœuvre qui se resserre
      const mA = iA * smooth(seg(lt, T.marge - 0.2, T.marge + 0.5));
      if (mA > 0.003) {
        const gap = lerp(m * 0.16, m * 0.012, eInOutQuart(seg(lt, T.marge + 0.2, T.mince + 0.6)));
        const bw = V ? w * 0.7 : w * 0.36;
        const bh = m * 0.05;
        const yy = ty + m * 0.04;
        ctx.save();
        ctx.globalAlpha *= mA;
        const g = ctx.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
        g.addColorStop(0, rgba(C.slate, 0.05));
        g.addColorStop(0.5, rgba(C.slate, 0.55));
        g.addColorStop(1, rgba(C.slate, 0.05));
        ctx.fillStyle = g;
        ctx.fillRect(cx - bw / 2, yy - gap / 2 - bh, bw, bh);
        ctx.fillRect(cx - bw / 2, yy + gap / 2, bw, bh);
        ctx.restore();
        light(ctx, cx, yy, gap * 3 + 10, C.amber, mA * 0.6);
        mono(ctx, 'VOTRE MARGE DE MANŒUVRE', cx, yy - gap / 2 - bh - m * 0.035, { size: Math.floor(m * 0.02), color: C.ice, spacing: 6, t: seg(lt, T.marge, T.marge + 0.9), alpha: mA });
        mono(ctx, 'SI MINCE', cx, yy + gap / 2 + bh + m * 0.04, { size: Math.floor(m * 0.022), color: C.amber, spacing: 9, t: seg(lt, T.mince, T.mince + 0.6), alpha: mA });
      }
    }

    /* ── ACTE II-a : le disque isométrique ── */
    if (discA > 0.003) {
      // ombre portée
      light(ctx, dX, dY + ry * 0.4, rx * 1.2, C.cyan, 0.12 * discA);
      ctx.save();
      ctx.globalAlpha *= discA;
      ctx.strokeStyle = rgba(C.ice, 0.25);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(dX, dY, rx * 1.08, ry * 1.08, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
      const starts = [T.loblaw, T.sobeys, T.metro, T.trad];
      let acc = spin;
      const draws = S06_SECTORS.map((s, i) => {
        const a0 = acc;
        const a1 = acc + s.share * TAU;
        acc = a1;
        const ext = eOutExpo(seg(lt, starts[i] - 0.2, starts[i] + 1.0));
        const hgt = i < 3 ? m * (0.05 + 0.025 * (2 - i)) * ext : m * 0.012;
        const col = i < 3 ? mix('#334155', s.col, smooth(seg(lt, starts[i] - 0.2, starts[i] + 0.5))) : s.col;
        return { s, a0, a1, hgt, col, lift: i < 3 ? 0.04 * ext : 0.08 * ext, i };
      });
      // ordre de dessin : de l'arrière vers l'avant (centre angulaire)
      const norm = (an) => ((an % TAU) + TAU) % TAU;
      draws
        .slice()
        .sort((p, q) => Math.sin(norm((p.a0 + p.a1) / 2)) - Math.sin(norm((q.a0 + q.a1) / 2)))
        .forEach((d) => s06_sector(ctx, dX, dY, rx, ry, d.a0, d.a1, d.hgt, d.col, discA, d.lift));
      // étiquettes des trois géants (au-dessus de chaque arc)
      draws.forEach((d) => {
        if (d.i > 2) return;
        const mid = (d.a0 + d.a1) / 2;
        const px = dX + Math.cos(mid) * rx * 0.62;
        const py = dY + Math.sin(mid) * ry * 0.62 - d.hgt - m * 0.03;
        const on = seg(lt, starts[d.i] + 0.1, starts[d.i] + 0.8);
        kSlide(ctx, d.s.name, px, py, { size: Math.floor(m * 0.03), weight: 900, color: C.white, t: on, alpha: discA, maxW: rx * 0.9 });
      });
      mono(ctx, 'TROIS GÉANTS', dX, dY - ry - m * 0.15, { size: Math.floor(m * 0.022), color: C.slate, spacing: 9, t: seg(lt, T.trois - 0.1, T.trois + 0.8), alpha: discA });
      // satellites Costco & Walmart
      const satA = discA * smooth(seg(lt, T.costco - 0.3, T.costco + 0.4));
      if (satA > 0.003) {
        [['COSTCO', T.costco], ['WALMART', T.walmart]].forEach(([n, k], i) => {
          const an = Math.PI * (V ? 0.2 + i * 0.6 : -0.1 + i * 0.32) + lt * 0.05;
          const sx = dX + Math.cos(an) * rx * 1.32;
          const sy = dY + Math.sin(an) * ry * 1.5 + (V ? m * 0.06 : 0);
          const on = eOutBack(seg(lt, k - 0.2, k + 0.5), 1.8);
          ring(ctx, sx, sy, m * 0.022 * on, { color: C.slate, width: 2, alpha: satA });
          light(ctx, sx, sy, m * 0.05, C.slate, satA * 0.4 * on);
          mono(ctx, n, sx, sy + m * 0.05, { size: Math.floor(m * 0.017), color: C.slate, spacing: 4, t: seg(lt, k, k + 0.6), alpha: satA, cursor: false });
        });
      }
      // 89 % monumental
      const pA = discA * smooth(seg(lt, T.pct - 0.4, T.pct + 0.1));
      if (pA > 0.003) {
        const px = V ? cx : w * 0.79;
        const py = V ? h * 0.82 : h * 0.52;
        const v = 89 * eOutExpo(seg(lt, T.pct - 0.2, T.pct + 1.2));
        const fs = Math.floor(m * (V ? 0.16 : 0.15));
        light(ctx, px, py - fs * 0.35, m * 0.2, C.white, pA * 0.25);
        odometer(ctx, v, px, py, { size: fs, weight: 900, color: C.white, suffix: ' %', suffixScale: 0.5, suffixColor: C.amber, alpha: pA, glow: 22, glowColor: rgba(C.cyan, 0.45) });
        mono(ctx, 'DES SUPERMARCHÉS TRADITIONNELS', px, py + m * 0.05, { size: Math.floor(m * 0.017), color: C.ice, spacing: 4, t: seg(lt, T.trad - 0.4, T.trad + 0.6), alpha: pA });
        mono(ctx, 'PRÈS DE', px, py - fs * 0.95, { size: Math.floor(m * 0.02), color: C.amber, spacing: 8, t: seg(lt, T.controlent, T.controlent + 0.6), alpha: pA });
        mono(ctx, 'PROPORTIONS DU DISQUE ILLUSTRATIVES', px, py + m * 0.085, { size: Math.floor(m * 0.014), color: C.slate, spacing: 3, t: seg(lt, T.pct + 0.8, T.pct + 1.6), alpha: pA * 0.6 });
      }
    }

    /* ── ACTE II-b : trois noyaux et leurs bannières en orbite ── */
    if (toCores > 0.003) {
      const tighten = eInOutQuart(seg(lt, T.quand - 0.2, T.quand + 1.6));
      const cores = [
        { name: 'LOBLAW', col: C.cyan, k: T.maxi, banners: [['MAXI', T.maxi], ['PROVIGO', T.provigo], ['PHARMAPRIX', T.pharma]] },
        { name: 'METRO', col: C.amber, k: T.metro2, banners: [['METRO', T.metro2], ['SUPER C', T.superc], ['ADONIS', T.adonis], ['JEAN COUTU', T.coutu]] },
        { name: 'EMPIRE-SOBEYS', col: C.emerald, k: T.iga, banners: [['IGA', T.iga], ['TRADITION', T.tradition], ['BONICHOIX', T.boni]] }
      ];
      const yLift = tighten * (V ? -h * 0.06 : -h * 0.07);
      mono(ctx, 'VOS BANNIÈRES · TROIS PROPRIÉTAIRES', cx, (V ? h * 0.15 : h * 0.2) + yLift, { size: Math.floor(m * 0.02), color: C.slate, spacing: 6, t: seg(lt, T.maxi, T.maxi + 1.2), alpha: toCores });
      cores.forEach((c, i) => {
        const px = V ? cx : w * (0.2 + i * 0.3);
        const py = (V ? h * (0.28 + i * 0.205) : h * 0.53) + yLift;
        const birth = eOutExpo(seg(lt, T.maxi - 1.0 + i * 0.25, T.maxi + 0.4 + i * 0.25));
        const focus = smooth(seg(lt, c.k - 0.4, c.k + 0.3));
        const cr = m * (V ? 0.05 : 0.055) * birth;
        const A = toCores * birth;
        light(ctx, px, py, cr * 4.5, c.col, A * (0.25 + 0.35 * focus));
        ctx.save();
        ctx.globalAlpha *= A;
        const g = ctx.createRadialGradient(px - cr * 0.3, py - cr * 0.3, 0, px, py, cr);
        g.addColorStop(0, mix(c.col, C.white, 0.5));
        g.addColorStop(1, mix(c.col, C.night, 0.4));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, cr, 0, TAU);
        ctx.fill();
        ctx.restore();
        drawSprite(ctx, textSprite(c.name, { size: Math.floor(m * 0.024), weight: 900, color: C.white, spacing: 2 }), px, py + cr + m * 0.035, { alpha: A });
        // anneau orbital
        const orx = (V ? w * 0.36 : w * 0.125) * lerp(1, 0.9, tighten);
        const ory = (V ? h * 0.05 : h * 0.1) * lerp(1, 0.9, tighten);
        ctx.save();
        ctx.globalAlpha *= A * (0.35 + 0.4 * focus);
        ctx.strokeStyle = c.col;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.ellipse(px, py, orx, ory, 0, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        for (let k = 0; k < 10; k++) {
          const an = (k / 10) * TAU + lt * (0.35 + tighten * 0.5) + i;
          light(ctx, px + Math.cos(an) * orx, py + Math.sin(an) * ory, m * 0.008, c.col, A * 0.8);
        }
        // bannières : positions fixes sur l'anneau (aucune collision), apparition au mot
        const nb = c.banners.length;
        c.banners.forEach(([bn, bk], j) => {
          let an;
          if (V) an = nb === 3 ? [Math.PI, 0, -Math.PI / 2][j] : [Math.PI * 1.0, 0, -Math.PI * 0.72, -Math.PI * 0.28][j];
          else an = nb === 3 ? [Math.PI * 1.22, -Math.PI / 2, -Math.PI * 0.22][j] : [Math.PI * 1.12, Math.PI * 1.38, -Math.PI * 0.38, -Math.PI * 0.12][j];
          const bx = px + Math.cos(an) * orx;
          const by = py + Math.sin(an) * ory - m * 0.018;
          const on = seg(lt, bk - 0.15, bk + 0.6);
          if (on > 0) beacon(ctx, bx, by + m * 0.018, { color: c.col, r: 4, alpha: A * smooth(on), time: gt, pulse: false });
          kSlide(ctx, bn, bx, by - m * 0.008, { size: Math.floor(m * (V ? 0.026 : 0.022)), weight: 800, color: C.white, t: on, alpha: A, dir: 'up' });
        });
      });
    }

    /* ── ACTE III : la concurrence devient fragile ── */
    const fA = smooth(seg(lt, T.concurrence - 0.4, T.concurrence + 0.3));
    if (fA > 0.003) {
      const ty = V ? h * 0.87 - m * 0.12 : h * 0.86;
      const fs = Math.floor(m * (V ? 0.058 : 0.052));
      if (V) {
        kRise(ctx, 'LA CONCURRENCE', cx, ty, { size: fs, weight: 900, t: seg(lt, T.concurrence - 0.1, T.concurrence + 0.8), alpha: fA });
        kRise(ctx, 'DEVIENT FRAGILE', cx, ty + fs * 1.15, { size: fs, weight: 900, color: C.amber, t: seg(lt, T.fragile - 0.2, T.fragile + 0.7), alpha: fA, glow: 16, glowColor: rgba(C.amber, 0.4) });
      } else {
        const wd = kRise(ctx, 'LA CONCURRENCE', cx - m * 0.02, ty, { size: fs, weight: 900, t: seg(lt, T.concurrence - 0.1, T.concurrence + 0.8), alpha: fA, align: 'right' });
        kRise(ctx, 'DEVIENT FRAGILE', cx + m * 0.02, ty, { size: fs, weight: 900, color: C.amber, t: seg(lt, T.fragile - 0.2, T.fragile + 0.7), alpha: fA, align: 'left', glow: 16, glowColor: rgba(C.amber, 0.4) });
      }
      // fissure qui court sous le titre
      const crackY = V ? ty + fs * 1.15 + m * 0.03 : ty + m * 0.03;
      const span = V ? w * 0.7 : w * 0.56;
      const pts = cached('crack06' + V, () => {
        const r = rng(606);
        const out = [];
        for (let i = 0; i <= 40; i++) out.push({ x: cx - span / 2 + (span * i) / 40, y: crackY + (r() - 0.5) * m * 0.016 * (i % 3 === 0 ? 2 : 1) });
        return out;
      });
      glowPath(ctx, pts, eInOutQuart(seg(lt, T.fragile, T.fragile + 1.4)), { color: C.red, width: 2, alpha: fA * 0.9 });
      mono(ctx, 'DANS VOTRE QUARTIER', cx, V ? h * 0.87 - m * 0.2 : ty - m * 0.075, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.quartier, T.quartier + 0.8), alpha: fA });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 07 — rep-baux-secrets-concurrence · Les clauses secrètes qui bloquaient vos nouvelles épiceries
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : un document CONFIDENTIEL ; une ligne caviardée se révèle : « CONTRÔLES DE PROPRIÉTÉ »
 * Acte II  : plongée zénithale sur le plan d'un centre commercial ; le supermarché rayonne ; des barrières
 *            laser verrouillent les locaux ; épicier, magasin à 1 $ et boulangerie rebondissent
 * Acte III : frise FÉV. 2025 → SEPT. 2026 ; le marteau du Bureau de la concurrence brise les barrières */

/** Plan du centre commercial (coordonnées écran à zoom 1), propre à chaque format. */
function s07_plan(w, h, V) {
  if (V) {
    return {
      mall: [0.08 * w, 0.3 * h, 0.84 * w, 0.36 * h],
      anchor: [0.1 * w, 0.32 * h, 0.8 * w, 0.12 * h],
      units: [
        [0.1, 0.455], [0.3, 0.455], [0.5, 0.455], [0.7, 0.455],
        [0.1, 0.555], [0.3, 0.555], [0.5, 0.555], [0.7, 0.555]
      ].map(([x, y], i) => ({ x: x * w, y: y * h, w: 0.19 * w, h: 0.088 * h, id: `L-0${i + 1}` })),
      lot: [0.08 * w, 0.68 * h, 0.84 * w, 0.14 * h]
    };
  }
  return {
    mall: [0.15 * w, 0.27 * h, 0.7 * w, 0.4 * h],
    anchor: [0.17 * w, 0.3 * h, 0.25 * w, 0.34 * h],
    units: [
      [0.44, 0.3], [0.54, 0.3], [0.64, 0.3], [0.74, 0.3],
      [0.44, 0.48], [0.54, 0.48], [0.64, 0.48], [0.74, 0.48]
    ].map(([x, y], i) => ({ x: x * w, y: y * h, w: 0.092 * w, h: 0.16 * h, id: `L-0${i + 1}` })),
    lot: [0.15 * w, 0.71 * h, 0.7 * w, 0.17 * h]
  };
}

function s07_pin(ctx, x, y, s, kind, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  light(ctx, x, y, s * 2.4, color, 0.45);
  ctx.fillStyle = 'rgba(6,12,20,0.95)';
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.beginPath();
  ctx.arc(x, y, s, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (kind === 'cart') {
    ctx.moveTo(-s * 0.55, -s * 0.35);
    ctx.lineTo(-s * 0.35, -s * 0.35);
    ctx.lineTo(-s * 0.2, s * 0.2);
    ctx.lineTo(s * 0.45, s * 0.2);
    ctx.lineTo(s * 0.55, -s * 0.2);
    ctx.lineTo(-s * 0.28, -s * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-s * 0.12, s * 0.42, s * 0.09, 0, TAU);
    ctx.arc(s * 0.35, s * 0.42, s * 0.09, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (kind === 'bread') {
    ctx.moveTo(-s * 0.55, s * 0.15);
    ctx.quadraticCurveTo(-s * 0.55, -s * 0.4, 0, -s * 0.4);
    ctx.quadraticCurveTo(s * 0.55, -s * 0.4, s * 0.55, s * 0.15);
    ctx.lineTo(s * 0.45, s * 0.3);
    ctx.lineTo(-s * 0.45, s * 0.3);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    for (const dx of [-0.22, 0, 0.22]) {
      ctx.moveTo((dx - 0.08) * s, -s * 0.18);
      ctx.lineTo((dx + 0.08) * s, s * 0.05);
    }
    ctx.stroke();
  }
  ctx.restore();
  if (kind === 'dollar') drawSprite(ctx, textSprite('1 $', { size: Math.floor(s * 0.75), weight: 900, color }), x, y, { base: 'middle', alpha: a });
}

function sceneBauxSecrets(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    secrets: 'secrets les mieux gardés',
    immo: "l'immobilier commercial",
    bureau: 'révélé par le Bureau',
    controles: 'contrôles de propriété',
    annees: 'Pendant des années',
    chaines: 'grandes chaînes',
    baux: 'leurs baux',
    actes: 'actes de vente',
    clauses: "clauses d'exclusivité",
    proprio: 'au propriétaire',
    louer: 'de louer un local',
    epicier: 'un autre épicier',
    dollar: 'un magasin à un dollar',
    boul: 'une boulangerie',
    frais: 'produits frais',
    fev: 'En février',
    loblaw: 'Loblaw a accepté',
    reculer: 'de reculer',
    sept: 'en septembre',
    cour: 'Cour fédérale',
    sobeys: 'Empire-Sobeys a dû',
    entente: 'entente juridiquement contraignante',
    fin: 'y mettre fin'
  });

  const PL = s07_plan(w, h, V);
  const dive = eInOutQuart(seg(lt, T.annees - 0.8, T.annees + 1.0));
  const planA = smooth(seg(lt, T.annees - 0.6, T.annees + 0.4));
  const smash = seg(lt, T.entente + 0.15, T.entente + 0.5); // impact du marteau
  const freed = smooth(seg(lt, T.entente + 0.3, T.entente + 1.2));
  // caméra du plan : vue d'ensemble → rapproché sur les locaux → recul pour la frise
  const anc = PL.anchor;
  const uc = PL.units;
  const unitsC = { x: (uc[0].x + uc[7].x + uc[7].w) / 2, y: (uc[0].y + uc[7].y + uc[7].h) / 2 };
  const fx = track(lt, [[0, cx], [T.clauses - 0.5, cx], [T.clauses + 1.2, V ? cx : unitsC.x - w * 0.05, eInOutQuart], [T.fev - 0.6, V ? cx : unitsC.x - w * 0.05], [T.fev + 1.0, cx, eInOutQuart]]);
  const fy = track(lt, [[0, cy], [T.clauses - 0.5, cy], [T.clauses + 1.2, unitsC.y, eInOutQuart], [T.fev - 0.6, unitsC.y], [T.fev + 1.0, V ? cy + h * 0.06 : cy - h * 0.08, eInOutQuart]]);
  const zoom = track(lt, [[0, 0.6], [T.annees - 0.8, 0.6], [T.annees + 1.0, 1.0, eOutCubic], [T.clauses - 0.5, 1.0], [T.clauses + 1.2, V ? 1.12 : 1.25, eInOutQuart], [T.fev - 0.6, V ? 1.12 : 1.25], [T.fev + 1.0, 0.86, eInOutQuart]]);

  frame(a, () => {
    /* ── ACTE I : le document confidentiel ── */
    const dA = 1 - smooth(seg(lt, T.annees - 0.6, T.annees + 0.3));
    if (dA > 0.003) {
      const dw = V ? w * 0.66 : w * 0.27;
      const dh = dw * 1.25;
      const dx = cx;
      const dy = V ? h * 0.56 : h * 0.62;
      const slide = eOutExpo(seg(lt, 0.1, 1.4));
      ctx.save();
      ctx.globalAlpha *= dA * slide;
      ctx.translate(dx, dy + (1 - slide) * h * 0.2);
      ctx.rotate(lerp(-0.08, -0.03, slide) + 0.02 * dive);
      ctx.scale(lerp(1, 1.6, dive), lerp(1, 1.6, dive));
      light(ctx, 0, 0, dw, C.ice, 0.12);
      rrect(ctx, -dw / 2, -dh / 2, dw, dh, dw * 0.02);
      ctx.fillStyle = '#E8EDF3';
      ctx.fill();
      // lignes caviardées
      const rr = rng(707);
      for (let l = 0; l < 11; l++) {
        const yy = -dh * 0.3 + l * dh * 0.06;
        const ww = dw * (0.5 + rr() * 0.32);
        ctx.fillStyle = l === 5 ? 'rgba(0,0,0,0)' : '#0B1220';
        if (l !== 5) ctx.fillRect(-dw * 0.4, yy, ww, dh * 0.026);
      }
      ctx.restore();
      // ligne révélée (balayage de lumière) — dessinée hors de la transformation pour rester nette
      const ly = dy - dh * 0.3 + 5 * dh * 0.06 + dh * 0.026 + (1 - slide) * h * 0.2;
      const rev = seg(lt, T.bureau, T.controles + 0.8);
      const redA = dA * slide * (1 - smooth(seg(rev, 0, 0.15)));
      ctx.save();
      ctx.globalAlpha *= redA;
      ctx.fillStyle = '#0B1220';
      ctx.fillRect(dx - dw * 0.4, ly - dh * 0.026, dw * 0.8, dh * 0.026);
      ctx.restore();
      kWipe(ctx, '« CONTRÔLES DE PROPRIÉTÉ »', dx, ly, { size: Math.floor(m * (V ? 0.036 : 0.03)), weight: 900, color: '#B45309', t: seg(lt, T.controles - 0.3, T.controles + 0.8), alpha: dA * slide, edge: C.amber, maxW: dw * 0.86 });
      // tampon CONFIDENTIEL
      const st = eOutBack(seg(lt, T.secrets - 0.2, T.secrets + 0.4), 1.4);
      if (st > 0) {
        ctx.save();
        ctx.globalAlpha *= dA * clamp(st);
        ctx.translate(dx + dw * 0.18, dy - dh * 0.4 + (1 - slide) * h * 0.2);
        ctx.rotate(-0.12);
        ctx.scale(lerp(1.8, 1, clamp(st)), lerp(1.8, 1, clamp(st)));
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.strokeRect(-dw * 0.22, -dh * 0.035, dw * 0.44, dh * 0.07);
        drawSprite(ctx, textSprite('CONFIDENTIEL', { size: Math.floor(m * (V ? 0.026 : 0.022)), weight: 800, fam: MONO, color: C.red, spacing: 5 }), 0, 0, { base: 'middle' });
        ctx.restore();
      }
      const ty = V ? h * 0.17 : h * 0.17;
      kRise(ctx, 'UN SECRET BIEN GARDÉ', cx, ty, { size: Math.floor(m * (V ? 0.062 : 0.058)), weight: 900, t: seg(lt, T.secrets - 0.2, T.secrets + 0.8), alpha: dA, maxW: w * 0.9 });
      mono(ctx, "DE L'IMMOBILIER COMMERCIAL", cx, ty + m * 0.055, { size: Math.floor(m * 0.019), color: C.ice, spacing: 5, t: seg(lt, T.immo, T.immo + 0.9), alpha: dA });
      mono(ctx, 'RÉVÉLÉ PAR LE BUREAU DE LA CONCURRENCE', cx, ty + m * 0.09, { size: Math.floor(m * 0.017), color: C.amber, spacing: 4, t: seg(lt, T.bureau, T.bureau + 1.2), alpha: dA });
    }

    /* ── ACTE II : le plan d'architecte ── */
    if (planA > 0.003) {
      camera(ctx, stage, fx, fy, zoom, () => {
        ctx.save();
        ctx.globalAlpha *= planA;
        // trame bleue
        ctx.strokeStyle = rgba(C.cyan, 0.08);
        ctx.lineWidth = 1;
        const step = m * 0.04;
        for (let x = -w * 0.2; x < w * 1.2; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, -h * 0.2);
          ctx.lineTo(x, h * 1.2);
          ctx.stroke();
        }
        for (let y = -h * 0.2; y < h * 1.2; y += step) {
          ctx.beginPath();
          ctx.moveTo(-w * 0.2, y);
          ctx.lineTo(w * 1.2, y);
          ctx.stroke();
        }
        // enveloppe du centre commercial
        const draw = eInOutQuart(seg(lt, T.annees - 0.4, T.annees + 1.6));
        const [mx, my, mw, mh] = PL.mall;
        ctx.setLineDash([mw * 2 * draw + 1, mw * 4]);
        ctx.strokeStyle = rgba(C.ice, 0.75);
        ctx.lineWidth = 2;
        ctx.strokeRect(mx, my, mw, mh);
        ctx.setLineDash([]);
        // stationnement
        const [px, py, pw, ph] = PL.lot;
        ctx.strokeStyle = rgba(C.slate, 0.25 * draw * (1 - smooth(seg(lt, T.fev - 0.6, T.fev + 0.4))));
        for (let k = 0; k <= 16; k++) {
          const xx = px + (pw * k) / 16;
          ctx.beginPath();
          ctx.moveTo(xx, py);
          ctx.lineTo(xx, py + ph * 0.38);
          ctx.moveTo(xx, py + ph * 0.62);
          ctx.lineTo(xx, py + ph);
          ctx.stroke();
        }
        ctx.restore();
        // supermarché d'ancrage
        const [ax, ay, aw, ah] = anc;
        const aOn = smooth(seg(lt, T.chaines - 0.3, T.chaines + 0.6));
        ctx.save();
        ctx.globalAlpha *= planA;
        light(ctx, ax + aw / 2, ay + ah / 2, Math.max(aw, ah) * 0.9, C.amber, 0.45 * aOn);
        ctx.fillStyle = rgba(C.amber, 0.12 + 0.18 * aOn);
        ctx.fillRect(ax, ay, aw, ah);
        ctx.strokeStyle = mix(C.ice, C.amber, aOn);
        ctx.lineWidth = 2.5;
        ctx.strokeRect(ax, ay, aw, ah);
        ctx.restore();
        drawSprite(ctx, textSprite('SUPERMARCHÉ', { size: Math.floor(m * 0.026), weight: 900, color: C.gold, spacing: 4 }), ax + aw / 2, ay + ah / 2, { base: 'middle', alpha: planA * aOn });
        drawSprite(ctx, textSprite('GRANDE CHAÎNE', { size: Math.floor(m * 0.015), weight: 600, fam: MONO, color: C.amber, spacing: 4 }), ax + aw / 2, ay + ah / 2 + m * 0.035, { base: 'middle', alpha: planA * aOn });
        // locaux
        const lockOn = eInOutQuart(seg(lt, T.clauses - 0.2, T.clauses + 1.2));
        uc.forEach((u, i) => {
          const fr = freed * smooth(seg(lt, T.entente + 0.3 + i * 0.08, T.entente + 0.9 + i * 0.08));
          const col = mix(mix(C.ice, C.red, lockOn * (1 - fr)), C.emerald, fr);
          ctx.save();
          ctx.globalAlpha *= planA * smooth(seg(lt, T.annees + 0.2 + i * 0.1, T.annees + 0.8 + i * 0.1));
          ctx.fillStyle = rgba(col, 0.06 + 0.1 * fr);
          ctx.fillRect(u.x, u.y, u.w, u.h);
          ctx.strokeStyle = rgba(col, 0.7);
          ctx.lineWidth = 1.5;
          ctx.strokeRect(u.x, u.y, u.w, u.h);
          ctx.restore();
          drawSprite(ctx, textSprite(u.id, { size: Math.floor(m * 0.016), weight: 500, fam: MONO, color: C.slate, spacing: 2 }), u.x + u.w / 2, u.y + u.h * 0.22, { base: 'middle', alpha: planA * 0.7 });
        });
        // barrières laser (façade de chaque local) + chaînes « CLAUSE EXCLUSIVE »
        const barA = planA * lockOn * (1 - (smash > 0 ? 1 : 0));
        if (barA > 0.003) {
          uc.forEach((u, i) => {
            const by = u.y + u.h * 0.92;
            const bOn = seg(lockOn, i * 0.08, i * 0.08 + 0.4);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha *= barA * bOn * (0.85 + 0.15 * Math.sin(gt * 9 + i));
            ctx.strokeStyle = C.red;
            ctx.lineWidth = 3;
            ctx.shadowColor = C.red;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(u.x + u.w * 0.08, by);
            ctx.lineTo(u.x + u.w * (0.08 + 0.84 * bOn), by);
            ctx.stroke();
            ctx.restore();
          });
          const chainA = barA * smooth(seg(lt, T.proprio - 0.2, T.proprio + 0.6)) * (1 - smooth(seg(lt, T.fev - 0.8, T.fev - 0.2)));
          const lab = V ? { x: cx, y: PL.mall[1] - m * 0.03 } : { x: unitsC.x, y: uc[0].y - m * 0.025 };
          drawSprite(ctx, textSprite('CLAUSE EXCLUSIVE', { size: Math.floor(m * (V ? 0.024 : 0.018)), weight: 600, fam: MONO, color: C.red, spacing: 6 }), lab.x, lab.y, { base: 'middle', alpha: chainA });
        }
        // éclats des barrières brisées
        if (smash > 0 && smash < 1) {
          const rr = rng(77);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          uc.forEach((u, i) => {
            const by = u.y + u.h * 0.92;
            for (let k = 0; k < 7; k++) {
              const sx = u.x + u.w * (0.1 + k * 0.12);
              const vx = (rr() - 0.5) * m * 0.25;
              const vy = (rr() - 0.5) * m * 0.25;
              const e = eOutCubic(smash);
              ctx.globalAlpha = (1 - smash) * 0.9;
              ctx.strokeStyle = k % 2 ? C.amber : C.red;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(sx + vx * e, by + vy * e);
              ctx.lineTo(sx + vx * e + u.w * 0.08 * Math.cos(rr() * TAU), by + vy * e + u.w * 0.08 * Math.sin(rr() * TAU));
              ctx.stroke();
            }
          });
          ctx.restore();
        }
        // concurrents qui rebondissent (puis entrent quand les barrières tombent)
        const tries = [
          { kind: 'cart', col: C.emerald, k: T.epicier, unit: 5, lab: 'ÉPICIER' },
          { kind: 'dollar', col: C.ice, k: T.dollar, unit: 6, lab: 'MAGASIN À 1 $' },
          { kind: 'bread', col: C.gold, k: T.boul, unit: 7, lab: 'BOULANGERIE' }
        ];
        tries.forEach((tr, j) => {
          const u = uc[tr.unit];
          const front = u.y + u.h * 0.92;
          const outside = PL.lot[1] + PL.lot[3] * 0.5;
          const doorX = u.x + u.w / 2;
          const startX = doorX;
          const app = seg(lt, tr.k - 0.2, tr.k + 0.7);
          if (app <= 0) return;
          const tIn = lt - (tr.k + 0.7);
          let yy;
          let xx = startX;
          if (lt < T.entente + 0.5) {
            const reach = lerp(outside, front + m * 0.03, eInCubic(app));
            const bounce = tIn > 0 ? Math.exp(-tIn * 3) * Math.abs(Math.sin(tIn * 9)) * m * 0.07 : 0;
            yy = reach + bounce + (tIn > 0 ? m * 0.05 * smooth(clamp(tIn * 2)) : 0);
          } else {
            const go = eInOutQuart(seg(lt, T.entente + 0.6 + j * 0.15, T.entente + 1.8 + j * 0.15));
            const rest = front + m * 0.08;
            yy = lerp(rest, u.y + u.h * 0.55, go);
            xx = lerp(startX, doorX, go);
          }
          const pA = planA * smooth(app * 3);
          s07_pin(ctx, xx, yy, m * 0.026, tr.kind, tr.col, pA);
          drawSprite(ctx, textSprite(tr.lab, { size: Math.floor(m * 0.015), weight: 600, fam: MONO, color: tr.col, spacing: 3 }), xx, yy + m * 0.05, { base: 'middle', alpha: pA * (1 - freed) });
          if (tIn > 0 && tIn < 0.5 && lt < T.entente) light(ctx, xx, front, m * 0.06, C.red, (1 - tIn * 2) * 0.8);
        });
      });

      // titres de l'acte II (hors caméra, tailles fixes)
      const t2A = planA * (1 - smooth(seg(lt, T.fev - 0.6, T.fev)));
      const ty = V ? h * 0.15 : h * 0.13;
      const swap = smooth(seg(lt, T.clauses - 0.4, T.clauses));
      mono(ctx, 'BAUX · ACTES DE VENTE', cx, ty - m * 0.055, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.baux, T.actes + 0.8), alpha: t2A * (1 - swap) });
      kRise(ctx, 'PENDANT DES ANNÉES', cx, ty, { size: Math.floor(m * (V ? 0.056 : 0.05)), weight: 900, t: seg(lt, T.annees, T.annees + 0.9), out: swap, alpha: t2A, maxW: w * 0.9 });
      kRise(ctx, "CLAUSES D'EXCLUSIVITÉ", cx, ty, { size: Math.floor(m * (V ? 0.056 : 0.05)), weight: 900, color: C.red, t: seg(lt, T.clauses, T.clauses + 0.9), alpha: t2A * swap, glow: 16, glowColor: rgba(C.red, 0.4), maxW: w * 0.9 });
      mono(ctx, 'MÊME LES PRODUITS FRAIS', cx, V ? h * 0.8 : ty + m * 0.055, { size: Math.floor(m * 0.019), color: C.gold, spacing: 6, t: seg(lt, T.frais - 0.3, T.frais + 0.7), alpha: t2A });
    }

    /* ── ACTE III : la frise et le marteau ── */
    const fA = smooth(seg(lt, T.fev - 0.5, T.fev + 0.3));
    if (fA > 0.003) {
      const ly = V ? h * 0.78 : h * 0.2;
      const x0 = V ? w * 0.14 : w * 0.24;
      const x1 = V ? w * 0.86 : w * 0.76;
      const draw = eInOutQuart(seg(lt, T.fev - 0.3, T.sept + 0.6));
      ctx.save();
      ctx.globalAlpha *= fA;
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, C.cyan);
      g.addColorStop(1, C.emerald);
      ctx.fillStyle = g;
      ctx.fillRect(x0, ly - 1.5, (x1 - x0) * draw, 3);
      ctx.restore();
      const nodes = [
        { x: lerp(x0, x1, 0.18), k: T.fev, a: 'FÉV. 2025', b: 'LOBLAW RECULE', bk: T.reculer, col: C.cyan },
        { x: lerp(x0, x1, 0.82), k: T.sept, a: 'SEPT. 2026', b: 'EMPIRE-SOBEYS', bk: T.sobeys, col: C.emerald }
      ];
      nodes.forEach((n) => {
        const on = seg(lt, n.k - 0.1, n.k + 0.7);
        if (on <= 0) return;
        beacon(ctx, n.x, ly, { color: n.col, r: 9 * eOutBack(on, 2), alpha: fA, time: gt });
        kSlide(ctx, n.a, n.x, ly - m * 0.035, { size: Math.floor(m * (V ? 0.034 : 0.03)), weight: 900, color: C.white, t: on, alpha: fA, dir: 'up' });
        mono(ctx, n.b, n.x, ly + m * 0.05, { size: Math.floor(m * (V ? 0.019 : 0.018)), color: n.col, spacing: 4, t: seg(lt, n.bk - 0.1, n.bk + 0.8), alpha: fA });
      });
      mono(ctx, 'ENQUÊTES EN COUR FÉDÉRALE', (x0 + x1) / 2, ly + m * (V ? 0.1 : 0.09), { size: Math.floor(m * 0.016), color: C.slate, spacing: 4, t: seg(lt, T.cour, T.cour + 1.0), alpha: fA });
      // marteau géométrique du Bureau de la concurrence
      const gA = smooth(seg(lt, T.entente - 1.0, T.entente - 0.4)) * (1 - smooth(seg(lt, T.entente + 1.6, T.entente + 2.4)));
      if (gA > 0.003) {
        const pvx = V ? w * 0.78 : w * 0.8;
        const pvy = V ? h * 0.3 : h * 0.38;
        const swing = track(lt, [[T.entente - 1.0, -1.1], [T.entente - 0.2, -1.35, eOutCubic], [T.entente + 0.15, 0.25, eInExpo], [T.entente + 0.45, 0.12, eOutCubic], [T.entente + 1.2, 0.15]]);
        const L = m * 0.22;
        ctx.save();
        ctx.globalAlpha *= gA;
        ctx.translate(pvx, pvy);
        ctx.rotate(swing);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-L, -m * 0.008, L, m * 0.016);
        const hx = -L;
        const hg = ctx.createLinearGradient(hx - m * 0.03, 0, hx + m * 0.03, 0);
        hg.addColorStop(0, C.gold);
        hg.addColorStop(1, C.copper);
        ctx.fillStyle = hg;
        ctx.shadowColor = C.amber;
        ctx.shadowBlur = 20;
        rrect(ctx, hx - m * 0.035, -m * 0.06, m * 0.07, m * 0.12, m * 0.01);
        ctx.fill();
        ctx.restore();
        if (lt > T.entente + 0.1) {
          const ix = pvx - Math.cos(0.25) * L;
          const iy = pvy - Math.sin(0.25) * L + m * 0.06;
          shockwave(ctx, ix, iy, m * 0.3, lt - T.entente - 0.1, { color: C.emerald, count: 1, period: 1.4, alpha: gA * (1 - smooth(seg(lt, T.entente + 0.1, T.entente + 1.5))) });
        }
      }
      const ty = V ? h * 0.16 : h * 0.86;
      kRise(ctx, 'ENTENTE CONTRAIGNANTE', cx, ty, { size: Math.floor(m * (V ? 0.054 : 0.046)), weight: 900, color: C.emerald, t: seg(lt, T.entente, T.entente + 0.9), alpha: fA, glow: 16, glowColor: rgba(C.emerald, 0.4), maxW: V ? w * 0.9 : w * 0.6 });
      mono(ctx, 'POUR Y METTRE FIN', cx, ty + m * 0.05, { size: Math.floor(m * 0.02), color: C.mint, spacing: 8, t: seg(lt, T.fin, T.fin + 0.8), alpha: fA });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 08 — rep-impact-quartiers-quebec · Moins de joueurs dans votre quartier = prix plus hauts
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : survol en carte inclinée de la vallée du Saint-Laurent ; la caméra se pose sur une ville en
 *            région : une seule bannière, un bail restrictif, deux concurrents bloqués ; jauge du panier haute
 * Acte II  : un indépendant émeraude ouvre → onde de pression → la jauge baisse ; les trois recommandations
 *            du Bureau (épiciers étrangers, indépendants, prix unitaire)
 * Acte III : la jauge remonte en partie : « PAS DU JOUR AU LENDEMAIN » */

const S08_RIVER = [[-76.6, 44.2], [-75.0, 45.0], [-73.6, 45.5], [-72.5, 46.25], [-71.2, 46.8], [-70.2, 47.4], [-69.0, 48.1], [-68.0, 48.7], [-66.0, 49.3], [-64.3, 49.6]];
const S08_TOWN = [-68.52, 48.45];
const S08_INDEP = ['saguenay', 'troisRivieres', 'sherbrooke', 'drummondville', 'gaspe', 'rouyn', 'valdor', 'septIles', 'baieComeau', 'gatineau'];

/** Jauge semi-circulaire « prix du panier » (sans chiffres inventés). */
function s08_gauge(ctx, x, y, r, v, a, time) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  const a0 = Math.PI;
  const span = Math.PI;
  for (let i = 0; i < 40; i++) {
    const t = i / 39;
    const an = a0 + span * t;
    ctx.strokeStyle = rgba(mix(C.emerald, C.red, t), 0.35 + 0.65 * (t <= v ? 1 : 0.25));
    ctx.lineWidth = r * 0.09;
    ctx.beginPath();
    ctx.arc(x, y, r, an + 0.01, an + span / 40 - 0.01);
    ctx.stroke();
  }
  const an = a0 + span * clamp(v);
  ctx.strokeStyle = C.white;
  ctx.lineWidth = r * 0.04;
  ctx.lineCap = 'round';
  ctx.shadowColor = C.white;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(an) * r * 0.82, y + Math.sin(an) * r * 0.82);
  ctx.stroke();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.06, 0, TAU);
  ctx.fill();
  ctx.restore();
  light(ctx, x + Math.cos(an) * r, y + Math.sin(an) * r, r * 0.35, mix(C.emerald, C.red, v), a * 0.7);
  const fs = 17; // taille fixe (la jauge peut changer d'échelle : le texte, jamais)
  drawSprite(ctx, textSprite('BAS', { size: fs, weight: 600, fam: MONO, color: C.mint, spacing: 3 }), x - r, y + fs * 1.6, { alpha: a });
  drawSprite(ctx, textSprite('ÉLEVÉ', { size: fs, weight: 600, fam: MONO, color: C.coral, spacing: 3 }), x + r, y + fs * 1.6, { alpha: a });
}

function s08_icon(ctx, kind, x, y, s, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.4;
  ctx.beginPath();
  if (kind === 'globe') {
    ctx.arc(0, 0, s * 0.5, 0, TAU);
    ctx.moveTo(-s * 0.5, 0);
    ctx.lineTo(s * 0.5, 0);
    ctx.ellipse(0, 0, s * 0.22, s * 0.5, 0, 0, TAU);
  } else if (kind === 'hands') {
    ctx.arc(0, -s * 0.08, s * 0.28, 0, TAU);
    ctx.moveTo(-s * 0.55, s * 0.45);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.12, 0, s * 0.3);
    ctx.quadraticCurveTo(s * 0.3, s * 0.12, s * 0.55, s * 0.45);
  } else {
    ctx.rect(-s * 0.55, -s * 0.32, s * 1.1, s * 0.64);
    ctx.moveTo(-s * 0.4, s * 0.12);
    ctx.lineTo(s * 0.0, s * 0.12);
  }
  ctx.stroke();
  ctx.restore();
}

function sceneQuartiersQuebec(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    lien: 'le lien direct',
    portefeuille: 'votre portefeuille',
    bail: 'un bail restrictif',
    escompte: 'compétiteur escompte',
    inter: 'acteur international',
    quartier: 'votre quartier',
    region: 'en région',
    levier: 'le seul levier',
    baisser: 'à baisser',
    vraie: 'la vraie concurrence locale',
    bureau: 'Le Bureau de la concurrence',
    etrangers: 'épiciers étrangers',
    indep: 'soutenir les indépendants',
    unitaire: 'prix unitaire',
    ententes: 'avec des ententes',
    habitudes: 'les habitudes',
    trois: 'des trois grands',
    jour: 'du jour au lendemain'
  });

  // caméra cartographique
  const lon0 = track(lt, [[0, -71.5], [T.bail - 0.8, -71.5], [T.bail + 1.6, S08_TOWN[0], eInOutQuart], [T.bureau - 0.6, S08_TOWN[0]], [T.bureau + 1.4, -70.6, eInOutQuart]]);
  const lat0 = track(lt, [[0, 47.2], [T.bail - 0.8, 47.2], [T.bail + 1.6, S08_TOWN[1] - 0.15, eInOutQuart], [T.bureau - 0.6, S08_TOWN[1] - 0.15], [T.bureau + 1.4, 47.8, eInOutQuart]]);
  const scl = m * track(lt, [[0, V ? 0.1 : 0.1], [T.bail - 0.8, V ? 0.115 : 0.115, (x) => x], [T.bail + 1.6, V ? 0.34 : 0.34, eInOutQuart], [T.bureau - 0.6, V ? 0.36 : 0.36], [T.bureau + 1.4, V ? 0.09 : 0.085, eInOutQuart], [D, V ? 0.095 : 0.09, smoother]]);
  const tilt = track(lt, [[0, 0.8], [T.bail + 1.6, 0.9], [T.bureau + 1.4, 0.72]]);
  const yaw = -0.12 + lt * 0.006;
  const mx = V ? cx : w * 0.38;
  const my = V ? h * 0.42 : h * 0.55;
  const Pj = makeTilt(lon0, lat0, scl, mx, my, tilt, m * 1.4, yaw);
  const mapA = smooth(seg(lt, 0, 0.8)) * (1 - 0.55 * smooth(seg(lt, T.ententes - 0.4, T.ententes + 0.8)));

  frame(a, () => {
    dust(ctx, stage, gt, { count: 60, alpha: 0.22, seed: 88 });

    /* ── CARTE INCLINÉE ── */
    ctx.save();
    ctx.globalAlpha *= mapA;
    const zoomed = smooth(seg(scl / m, 0.16, 0.3));
    drawDots(ctx, Pj, regionDots('qc08', -80, -57, 44.5, 53.5, 0.16), { color: C.cyan, size: Math.max(2, scl * 0.022), alpha: 0.85 * (1 - zoomed), fade: { x: mx, y: my, r: m * (V ? 0.62 : 0.8) } });
    if (zoomed > 0.01) drawDots(ctx, Pj, regionDots('qc08f', -71.5, -65.5, 46.8, 50.2, 0.045), { color: C.cyan, size: Math.max(2, scl * 0.008), alpha: 0.85 * zoomed, fade: { x: mx, y: my, r: m * (V ? 0.62 : 0.8) } });
    const rp = smoothPath(S08_RIVER, 8).map((p) => Pj.project(p[0], p[1]));
    glowPath(ctx, rp, eInOutQuart(seg(lt, 0.2, 2.6)), { color: C.ice, width: 3, alpha: 0.85, head: false });
    ctx.restore();
    const cities = [['montreal', 'MONTRÉAL'], ['quebec', 'QUÉBEC'], ['troisRivieres', 'TROIS-RIVIÈRES'], ['saguenay', 'SAGUENAY']];
    const cityA = mapA * (1 - smooth(seg(lt, T.bail - 0.4, T.bail + 0.6))) * smooth(seg(lt, 0.6, 1.6));
    cities.forEach(([k, n], i) => {
      const q = Pj.project(...P(k));
      cityTag(ctx, q.x, q.y, n, { color: C.cyan, t: seg(lt, 0.8 + i * 0.35, 1.6 + i * 0.35), alpha: cityA, side: i === 3 ? 'top' : i === 1 ? 'right' : 'bottom', size: Math.floor(m * 0.02), time: gt, r: 5 });
    });

    // la ville en région
    const town = Pj.project(...S08_TOWN);
    const tA = mapA * smooth(seg(lt, T.bail - 0.6, T.bail + 0.6));
    if (tA > 0.003) {
      const freedT = smooth(seg(lt, T.vraie - 0.2, T.vraie + 0.6));
      // bail restrictif : anneau verrouillé autour de la ville
      const lockR = m * (V ? 0.13 : 0.12);
      ctx.save();
      ctx.globalAlpha *= tA * (1 - freedT * 0.85);
      ctx.strokeStyle = C.amber;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -lt * 12;
      ctx.shadowColor = C.amber;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(town.x, town.y, lockR, lockR * 0.55, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      mono(ctx, 'BAIL RESTRICTIF', town.x, town.y - lockR * 0.55 - m * 0.03, { size: Math.floor(m * 0.019), color: C.amber, spacing: 5, t: seg(lt, T.bail, T.bail + 0.8), alpha: tA * (1 - freedT) });
      // la seule bannière
      beacon(ctx, town.x, town.y, { color: C.amber, r: 11, alpha: tA, time: gt });
      mono(ctx, 'UNE SEULE BANNIÈRE', town.x, town.y + m * 0.045, { size: Math.floor(m * 0.017), color: C.white, spacing: 4, t: seg(lt, T.quartier, T.quartier + 0.8), alpha: tA * (1 - freedT) });
      // concurrents bloqués (escompte par l'ouest, international par l'est)
      const comps = [
        { k: T.escompte, from: -1, col: C.ice, lab: 'ESCOMPTE' },
        { k: T.inter, from: 1, col: C.violet, lab: 'INTERNATIONAL' }
      ];
      comps.forEach((c) => {
        const app = seg(lt, c.k - 0.3, c.k + 0.8);
        if (app <= 0) return;
        const tIn = lt - (c.k + 0.8);
        const edge = town.x + c.from * lockR;
        const far = town.x + c.from * lockR * 2.6;
        let x = lerp(far, edge + c.from * m * 0.02, eInCubic(app));
        if (tIn > 0) x += c.from * (Math.exp(-tIn * 3) * Math.abs(Math.sin(tIn * 8)) * m * 0.05 + m * 0.04 * smooth(clamp(tIn * 2)));
        const cA = tA * smooth(app * 3) * (1 - smooth(seg(lt, T.levier - 0.3, T.levier + 0.4)));
        beacon(ctx, x, town.y, { color: c.col, r: 7, alpha: cA, time: gt, pulse: false });
        mono(ctx, c.lab, x, town.y - m * 0.03, { size: Math.floor(m * 0.016), color: c.col, spacing: 3, alpha: cA, cursor: false });
        if (tIn > 0 && tIn < 0.4) light(ctx, edge, town.y, m * 0.05, C.red, (1 - tIn / 0.4) * cA);
      });
      // l'indépendant émeraude ouvre
      const iT = eOutBack(seg(lt, T.vraie - 0.1, T.vraie + 0.6), 2);
      if (iT > 0) {
        const ix = town.x + m * 0.06;
        const iy = town.y - m * 0.012;
        beacon(ctx, ix, iy, { color: C.emerald, r: 11 * iT, alpha: tA, time: gt });
        shockwave(ctx, ix, iy, m * 0.22, lt - T.vraie, { color: C.emerald, count: 3, period: 1.8, alpha: tA * (1 - smooth(seg(lt, T.bureau, T.bureau + 1))) });
        mono(ctx, 'INDÉPENDANT', ix, iy - m * 0.04, { size: Math.floor(m * 0.017), color: C.mint, spacing: 4, t: seg(lt, T.vraie + 0.2, T.vraie + 0.9), alpha: tA * (1 - smooth(seg(lt, T.bureau - 0.3, T.bureau + 0.3))) });
      }
    }

    /* ── ACTE II : recommandations sur la carte ── */
    const rA = smooth(seg(lt, T.bureau - 0.2, T.bureau + 0.6)) * (1 - smooth(seg(lt, T.ententes - 0.3, T.ententes + 0.6)));
    if (rA > 0.003) {
      // épiciers étrangers : arcs venant de l'Atlantique
      const eT = seg(lt, T.etrangers - 0.3, T.etrangers + 1.4);
      ['montreal', 'quebec', 'sherbrooke'].forEach((k, i) => {
        const to = Pj.project(...P(k));
        const from = Pj.project(-61.5 + i * 0.8, 51.5 - i * 0.4);
        const pts = quadPts(from, to, m * 0.06, 40);
        glowPath(ctx, pts, eInOutQuart(clamp(eT * 1.3 - i * 0.15)), { color: C.violet, width: 2.5, alpha: rA });
      });
      // indépendants partout en région
      S08_INDEP.forEach((k, i) => {
        const q = Pj.project(...P(k));
        const on = eOutBack(seg(lt, T.indep - 0.2 + i * 0.09, T.indep + 0.4 + i * 0.09), 2);
        if (on > 0) beacon(ctx, q.x, q.y, { color: C.emerald, r: 6 * on, alpha: rA, time: gt + i, pulse: true });
      });
    }

    /* ── PANNEAU LATÉRAL : jauge, recommandations, prix unitaire ── */
    const gA = smooth(seg(lt, T.levier - 0.5, T.levier + 0.3));
    if (gA > 0.003) {
      const gv = track(lt, [[T.levier, 0.86], [T.vraie, 0.86], [T.vraie + 1.6, 0.42, eInOutQuart], [T.habitudes, 0.42], [D - 0.6, 0.62, smoother]]);
      const park = eInOutQuart(seg(lt, T.bureau - 0.4, T.bureau + 0.6)) * (1 - eInOutQuart(seg(lt, T.ententes - 0.4, T.ententes + 0.8)));
      const gx = V ? cx : w * 0.79;
      const gy = V ? lerp(lerp(h * 0.72, h * 0.62, park), h * 0.645, smooth(seg(lt, T.ententes - 0.4, T.ententes + 0.8))) : lerp(h * 0.52, h * 0.3, park);
      const gr = m * (V ? 0.17 : 0.14) * lerp(1, 0.7, park);
      s08_gauge(ctx, gx, gy, gr, gv, gA, gt);
      mono(ctx, 'PRIX DU PANIER', gx, gy + m * 0.068, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.levier, T.levier + 0.8), alpha: gA });
      const ty = gy - gr - m * 0.05;
      const sw = smooth(seg(lt, T.vraie - 0.3, T.vraie));
      kRise(ctx, 'LE SEUL LEVIER', gx, ty, { size: Math.floor(m * 0.044), weight: 900, t: seg(lt, T.levier, T.levier + 0.8), out: sw, alpha: gA * (1 - smooth(seg(lt, T.bureau - 0.4, T.bureau))) });
      kRise(ctx, 'LA VRAIE CONCURRENCE', gx, ty, { size: Math.floor(m * (V ? 0.05 : 0.04)), weight: 900, color: C.emerald, t: seg(lt, T.vraie, T.vraie + 0.9), alpha: gA * sw * (1 - smooth(seg(lt, T.bureau - 0.4, T.bureau))), glow: 14, glowColor: rgba(C.emerald, 0.4), maxW: V ? w * 0.9 : w * 0.36 });
      // recommandations
      const recA = rA;
      if (recA > 0.003) {
        const recs = [
          ['globe', 'ATTIRER DE NOUVEAUX', 'ÉPICIERS ÉTRANGERS', T.etrangers, C.violet],
          ['hands', 'SOUTENIR', 'LES INDÉPENDANTS', T.indep, C.emerald],
          ['tag', 'STANDARDISER', 'LE PRIX UNITAIRE', T.unitaire, C.cyan]
        ];
        const x0 = V ? w * 0.12 : w * 0.64;
        const y0 = V ? h * 0.745 : h * 0.47;
        const dy = V ? h * 0.058 : h * 0.12;
        mono(ctx, 'LE BUREAU RECOMMANDE', V ? cx : x0, y0 - m * (V ? 0.07 : 0.06), { size: Math.floor(m * 0.019), color: C.slate, spacing: 6, align: V ? 'center' : 'left', t: seg(lt, T.bureau, T.bureau + 1.0), alpha: recA });
        recs.forEach(([ic, l1, l2, k, col], i) => {
          const yy = y0 + i * dy;
          const on = seg(lt, k - 0.3, k + 0.6);
          s08_icon(ctx, ic, x0 + m * 0.03, yy, m * 0.045 * eOutBack(on, 1.8), col, recA * smooth(on * 2));
          kSlide(ctx, l1, x0 + m * 0.08, yy - (V ? 0 : m * 0.008), { size: Math.floor(m * (V ? 0.026 : 0.024)), weight: 700, color: C.slate, t: on, alpha: recA, align: 'left', dir: 'left' });
          if (V) kSlide(ctx, l2, x0 + m * 0.08 + m * 0.36, yy, { size: Math.floor(m * 0.026), weight: 900, color: col, t: seg(lt, k, k + 0.7), alpha: recA, align: 'left', dir: 'left' });
          else kSlide(ctx, l2, x0 + m * 0.08, yy + m * 0.032, { size: Math.floor(m * 0.03), weight: 900, color: col, t: seg(lt, k, k + 0.7), alpha: recA, align: 'left', dir: 'left' });
        });
      }
    }

    /* ── ACTE III : pas du jour au lendemain ── */
    const fA = smooth(seg(lt, T.ententes - 0.2, T.ententes + 0.6));
    if (fA > 0.003) {
      const ty = V ? h * 0.86 - m * 0.06 : h * 0.785;
      mono(ctx, 'LES TROIS GRANDS DOMINENT TOUJOURS', V ? cx : w * 0.76, V ? h * 0.52 : h * 0.665, { size: Math.floor(m * 0.018), color: C.amber, spacing: 4, t: seg(lt, T.trois - 0.3, T.trois + 0.9), alpha: fA });
      kRise(ctx, 'PAS DU JOUR', V ? cx : w * 0.76, V ? ty - m * 0.065 : ty - m * 0.06, { size: Math.floor(m * (V ? 0.064 : 0.05)), weight: 900, t: seg(lt, T.jour - 0.6, T.jour + 0.3), alpha: fA });
      kRise(ctx, 'AU LENDEMAIN', V ? cx : w * 0.76, ty, { size: Math.floor(m * (V ? 0.064 : 0.05)), weight: 900, color: C.amber, t: seg(lt, T.jour - 0.3, T.jour + 0.6), alpha: fA, glow: 14, glowColor: rgba(C.amber, 0.4) });
    }

    /* ── OUVERTURE : la question ── */
    const qA = 1 - smooth(seg(lt, T.levier - 0.6, T.levier));
    if (qA > 0.003) {
      const ty = V ? h * 0.12 : h * 0.17;
      kRise(ctx, 'ET VOTRE PORTEFEUILLE ?', cx, ty, { size: Math.floor(m * (V ? 0.06 : 0.058)), weight: 900, t: seg(lt, T.portefeuille - 0.4, T.portefeuille + 0.6), alpha: qA, maxW: w * 0.9 });
      mono(ctx, 'QUARTIERS · VILLES EN RÉGION', cx, ty + m * 0.055, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.quartier, T.region + 0.8), alpha: qA });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 09 — rep-deux-cotes-baux · Protéger un investissement local ou verrouiller le marché ?
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : une diagonale tranche l'écran : PROMOTEURS (cyan) / ÉCONOMISTES (ambre)
 *            côté cyan : un supermarché de banlieue se construit ; des dizaines de millions ; le bouclier
 * Acte II  : la caméra glisse côté ambre : axe du temps 5 → 10 → 20 ans ; le bouclier devient une cage dorée ;
 *            le magasin ferme, la cage reste ; les familles paient à la caisse
 * Acte III : « BARRIÈRE ARTIFICIELLE » ; la cage s'entrouvre */

function s09_family(ctx, x, y, s, color, a) {
  if (a <= 0.003) return;
  [[-0.5, 1], [0, 1.15], [0.45, 0.75]].forEach(([dx, k]) => person(ctx, x + dx * s, y, s * 0.55 * k, color, a));
}

function s09_shop(ctx, x, y, s, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.fillStyle = rgba(color, 0.12);
  ctx.lineWidth = 2;
  ctx.fillRect(x - s / 2, y - s * 0.6, s, s * 0.6);
  ctx.strokeRect(x - s / 2, y - s * 0.6, s, s * 0.6);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const x0 = x - s / 2 + (i * s) / 4;
    ctx.moveTo(x0, y - s * 0.6);
    ctx.quadraticCurveTo(x0 + s / 8, y - s * 0.45, x0 + s / 4, y - s * 0.6);
  }
  ctx.stroke();
  ctx.restore();
}

function sceneDeuxCotesBaux(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    encore: 'Là encore',
    versions: 'les deux versions',
    promoteurs: 'promoteurs immobiliers',
    chaines: 'chaînes établies',
    clause: "une clause d'exclusivité",
    securiser: 'sécuriser un investissement',
    massif: 'massif',
    garantie: 'sans la garantie',
    seul: 'le seul grand supermarché',
    nouveau: "d'un nouveau centre commercial",
    risquerait: 'personne ne risquerait',
    dizaines: 'des dizaines de millions',
    banlieue: 'en banlieue',
    region: 'ou en région',
    economistes: 'les économistes',
    excuse: 'cette excuse ne tient plus',
    survivent: 'survivent',
    fermeture: 'la fermeture',
    complementaires: 'commerces complémentaires',
    vingt: 'pendant vingt ans',
    barriere: 'une barrière artificielle',
    familles: 'les familles',
    caisse: 'à la caisse'
  });

  const split = eInOutQuart(seg(lt, T.versions - 0.4, T.versions + 0.8));
  const focus = track(lt, [[0, 0], [T.promoteurs - 0.4, 0], [T.promoteurs + 0.9, 1, eInOutQuart], [T.economistes - 0.5, 1], [T.economistes + 1.0, -1, eInOutQuart], [T.barriere + 0.3, -1], [T.barriere + 1.6, 0, eInOutQuart]]);
  const sh = V ? focus * h * 0.11 : focus * w * 0.13; // décalage de la diagonale
  // diagonale (16:9 : du haut-droite vers le bas-gauche ; 9:16 : de droite-haut à gauche-bas, plus douce)
  const p0 = V ? { x: w * 1.05, y: h * 0.38 + sh } : { x: w * 0.66 + sh, y: -h * 0.05 };
  const p1 = V ? { x: -w * 0.05, y: h * 0.62 + sh } : { x: w * 0.34 + sh, y: h * 1.05 };
  const sideA = (draw) => {
    ctx.save();
    ctx.beginPath();
    if (V) {
      ctx.moveTo(-w, -h);
      ctx.lineTo(w * 2, -h);
      ctx.lineTo(p0.x + (p0.x - p1.x) * 2, p0.y + (p0.y - p1.y) * 2);
      ctx.lineTo(p1.x - (p0.x - p1.x) * 2, p1.y - (p0.y - p1.y) * 2);
    } else {
      ctx.moveTo(-w, -h);
      ctx.lineTo(p0.x + (p0.x - p1.x) * 2, p0.y + (p0.y - p1.y) * 2);
      ctx.lineTo(p1.x - (p0.x - p1.x) * 2, p1.y - (p0.y - p1.y) * 2);
      ctx.lineTo(-w, h * 2);
    }
    ctx.closePath();
    ctx.clip();
    draw();
    ctx.restore();
  };
  const sideB = (draw) => {
    ctx.save();
    ctx.beginPath();
    if (V) {
      ctx.moveTo(-w, h * 2);
      ctx.lineTo(w * 2, h * 2);
      ctx.lineTo(p0.x + (p0.x - p1.x) * 2, p0.y + (p0.y - p1.y) * 2);
      ctx.lineTo(p1.x - (p0.x - p1.x) * 2, p1.y - (p0.y - p1.y) * 2);
    } else {
      ctx.moveTo(w * 2, -h);
      ctx.lineTo(p0.x + (p0.x - p1.x) * 2, p0.y + (p0.y - p1.y) * 2);
      ctx.lineTo(p1.x - (p0.x - p1.x) * 2, p1.y - (p0.y - p1.y) * 2);
      ctx.lineTo(w * 2, h * 2);
    }
    ctx.closePath();
    ctx.clip();
    draw();
    ctx.restore();
  };
  // centres de contenu de chaque côté
  const A = V ? { x: cx, y: h * 0.25 + sh * 0.9 } : { x: w * 0.25 + sh * 0.95, y: h * 0.56 };
  const B = V ? { x: cx, y: h * 0.72 + sh * 0.9 } : { x: w * 0.76 + sh * 0.95, y: h * 0.56 };
  const aA = split * (focus >= 0 ? 1 : lerp(1, 0.35, -focus));
  const bA = split * (focus <= 0 ? 1 : lerp(1, 0.35, focus));

  frame(a, () => {
    dust(ctx, stage, gt, { count: 60, alpha: 0.22, seed: 99 });

    /* fonds teintés des deux plans */
    if (split > 0.003) {
      sideA(() => {
        const g = ctx.createRadialGradient(A.x, A.y, 0, A.x, A.y, m * 0.9);
        g.addColorStop(0, rgba(C.cyan, 0.1 * split));
        g.addColorStop(1, rgba(C.cyan, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-w, -h, w * 3, h * 3);
      });
      sideB(() => {
        const g = ctx.createRadialGradient(B.x, B.y, 0, B.x, B.y, m * 0.9);
        g.addColorStop(0, rgba(C.amber, 0.1 * split));
        g.addColorStop(1, rgba(C.amber, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-w, -h, w * 3, h * 3);
      });
    }

    /* ── CÔTÉ A : promoteurs ── */
    if (aA > 0.003) {
      sideA(() => {
        const bw = m * (V ? 0.42 : 0.34);
        const bh = m * (V ? 0.2 : 0.22);
        const yb = A.y + bh * 0.55;
        const x0 = A.x - bw / 2;
        const build = seg(lt, T.securiser - 0.6, T.seul + 0.6);
        ctx.save();
        ctx.globalAlpha *= aA;
        // fondations
        const f = eInOutQuart(seg(build, 0, 0.25));
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 3;
        ctx.shadowColor = C.cyan;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(x0 - bw * 0.1, yb);
        ctx.lineTo(x0 - bw * 0.1 + bw * 1.2 * f, yb);
        ctx.stroke();
        // colonnes
        for (let i = 0; i <= 5; i++) {
          const c = eOutExpo(seg(build, 0.18 + i * 0.05, 0.45 + i * 0.05));
          const x = x0 + (bw * i) / 5;
          ctx.beginPath();
          ctx.moveTo(x, yb);
          ctx.lineTo(x, yb - bh * c);
          ctx.stroke();
        }
        // dalles
        for (let k = 1; k <= 2; k++) {
          const s = eInOutQuart(seg(build, 0.45 + k * 0.08, 0.65 + k * 0.08));
          ctx.beginPath();
          ctx.moveTo(x0, yb - (bh * k) / 2.1);
          ctx.lineTo(x0 + bw * s, yb - (bh * k) / 2.1);
          ctx.stroke();
        }
        // toit + façade vitrée
        const r = eInOutQuart(seg(build, 0.7, 0.95));
        ctx.beginPath();
        ctx.moveTo(x0 - bw * 0.04, yb - bh);
        ctx.lineTo(x0 - bw * 0.04 + bw * 1.08 * r, yb - bh);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = rgba(C.cyan, 0.14 * r);
        ctx.fillRect(x0, yb - bh, bw, bh);
        // grue
        const cr = eOutExpo(seg(lt, T.securiser - 0.4, T.securiser + 1.2)) * (1 - smooth(seg(build, 0.85, 1)));
        ctx.strokeStyle = rgba(C.ice, 0.8 * cr);
        ctx.lineWidth = 2;
        const gx = x0 + bw * 1.15;
        ctx.beginPath();
        ctx.moveTo(gx, yb);
        ctx.lineTo(gx, yb - bh * 1.7 * cr);
        ctx.lineTo(gx - bw * 0.7 * cr, yb - bh * 1.7 * cr);
        ctx.moveTo(gx, yb - bh * 1.7 * cr);
        ctx.lineTo(gx + bw * 0.18 * cr, yb - bh * 1.7 * cr);
        const hook = gx - bw * 0.45 * cr;
        ctx.moveTo(hook, yb - bh * 1.7 * cr);
        ctx.lineTo(hook, yb - bh * (1.7 - 0.5 * (0.5 + 0.5 * Math.sin(lt * 1.3))) * cr);
        ctx.stroke();
        ctx.restore();
        drawSprite(ctx, textSprite('SUPERMARCHÉ', { size: Math.floor(m * 0.024), weight: 900, color: C.white, spacing: 4 }), A.x, yb - bh * 0.5, { base: 'middle', alpha: aA * r });
        // bouclier « le seul »
        const shA = smooth(seg(lt, T.seul - 0.3, T.seul + 0.5));
        const toCage = smooth(seg(lt, T.survivent - 0.4, T.survivent + 0.6));
        shield(ctx, A.x, yb - bh * 0.5, bh * 0.95, { color: C.cyan, alpha: aA * shA * (1 - toCage), draw: eInOutQuart(seg(lt, T.seul - 0.2, T.seul + 0.9)), time: gt, fill: 0.08 });
        // pile de millions
        const mA = smooth(seg(lt, T.dizaines - 0.3, T.dizaines + 0.4));
        if (mA > 0.003) {
          const sx = V ? A.x - bw * 0.82 : A.x - bw * 0.82;
          const stack = Math.floor(lerp(0, 9, eOutCubic(seg(lt, T.dizaines - 0.2, T.dizaines + 1.4))));
          for (let k = 0; k < 9; k++) {
            const on = smooth(clamp(lerp(0, 9, eOutCubic(seg(lt, T.dizaines - 0.2, T.dizaines + 1.4))) - k));
            if (on <= 0) break;
            ctx.save();
            ctx.globalAlpha *= aA * mA * on;
            ctx.fillStyle = mix(C.gold, C.amber, k / 9);
            ctx.strokeStyle = rgba(C.night, 0.6);
            ctx.beginPath();
            ctx.ellipse(sx, yb - k * m * 0.016 - (1 - on) * m * 0.03, m * 0.045, m * 0.012, 0, 0, TAU);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
          void stack;
        }
      });
      const tA = aA * (1 - smooth(seg(lt, T.economistes - 0.6, T.economistes)));
      const ty = V ? Math.max(h * 0.14, A.y - m * 0.31) : h * 0.2;
      const tx = V ? cx : A.x;
      mono(ctx, 'PROMOTEURS · CHAÎNES ÉTABLIES', tx, ty - m * 0.055, { size: Math.floor(m * 0.018), color: C.cyan, spacing: 5, t: seg(lt, T.promoteurs, T.chaines + 0.8), alpha: tA });
      const sw = smooth(seg(lt, T.garantie - 0.3, T.garantie + 0.1));
      const sw0 = smooth(seg(lt, T.securiser - 0.4, T.securiser - 0.05));
      kRise(ctx, 'UNE CLAUSE', tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.clause - 0.1, T.clause + 0.8), out: sw0, alpha: tA });
      kRise(ctx, "D'EXCLUSIVITÉ", tx, ty + m * 0.06, { size: Math.floor(m * 0.05), weight: 900, color: C.cyan, t: seg(lt, T.clause + 0.3, T.clause + 1.1), out: sw0, alpha: tA });
      kRise(ctx, 'SÉCURISER', tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.securiser - 0.1, T.securiser + 0.8), out: sw, alpha: tA });
      kRise(ctx, "L'INVESTISSEMENT", tx, ty + m * 0.06, { size: Math.floor(m * 0.05), weight: 900, color: C.cyan, t: seg(lt, T.massif - 0.4, T.massif + 0.5), out: sw, alpha: tA, maxW: V ? w * 0.9 : w * 0.42 });
      kRise(ctx, 'LE SEUL GRAND', tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.seul, T.seul + 0.8), alpha: tA * sw });
      kRise(ctx, 'SUPERMARCHÉ', tx, ty + m * 0.06, { size: Math.floor(m * 0.05), weight: 900, color: C.cyan, t: seg(lt, T.seul + 0.3, T.seul + 1.1), alpha: tA * sw });
      const my = V ? A.y + m * 0.27 : h * 0.86;
      mono(ctx, 'DES DIZAINES DE MILLIONS $', tx, my, { size: Math.floor(m * 0.022), color: C.gold, spacing: 5, t: seg(lt, T.dizaines, T.dizaines + 1.0), alpha: tA });
      mono(ctx, 'EN BANLIEUE OU EN RÉGION', tx, my + m * 0.04, { size: Math.floor(m * 0.017), color: C.ice, spacing: 5, t: seg(lt, T.banlieue, T.region + 0.8), alpha: tA });
    }

    /* ── CÔTÉ B : économistes ── */
    if (bA > 0.003) {
      const axW = V ? w * 0.8 : m * 0.62;
      const ax0 = B.x - axW / 2;
      const ay = B.y + m * (V ? 0.1 : 0.15);
      const timeT = eInOutQuart(seg(lt, T.survivent - 0.2, T.vingt + 1.0));
      const cageOpen = eInOutQuart(seg(lt, D - 3.2, D - 0.8));
      sideB(() => {
        ctx.save();
        ctx.globalAlpha *= bA;
        // axe du temps
        ctx.strokeStyle = rgba(C.slate, 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax0, ay);
        ctx.lineTo(ax0 + axW * eOutExpo(seg(lt, T.economistes, T.economistes + 1)), ay);
        ctx.stroke();
        ctx.restore();
        [['0', 0], ['5 ANS', 0.25], ['10 ANS', 0.5], ['20 ANS', 1]].forEach(([lab, f], i) => {
          const x = ax0 + axW * f;
          const on = timeT >= f - 0.001 ? 1 : 0.25;
          ctx.save();
          ctx.globalAlpha *= bA * smooth(seg(lt, T.economistes + i * 0.15, T.economistes + 0.5 + i * 0.15));
          ctx.fillStyle = on > 0.5 ? C.amber : C.slate;
          ctx.fillRect(x - 1.5, ay - 8, 3, 16);
          ctx.restore();
          drawSprite(ctx, textSprite(lab, { size: Math.floor(m * 0.018), weight: 600, fam: MONO, color: on > 0.5 ? C.gold : C.slate, spacing: 3 }), x, ay + m * 0.04, { alpha: bA * smooth(seg(lt, T.economistes + i * 0.15, T.economistes + 0.5 + i * 0.15)) });
        });
        // magasin (ferme) + commerces complémentaires bloqués
        const storeX = ax0 + axW * 0.08;
        const storeY = ay - m * 0.03;
        const closed = smooth(seg(lt, T.fermeture - 0.1, T.fermeture + 0.6));
        ctx.save();
        ctx.globalAlpha *= bA * smooth(seg(lt, T.economistes, T.economistes + 0.8));
        ctx.fillStyle = rgba(mix(C.cyan, '#1F2937', closed), 0.35);
        ctx.strokeStyle = mix(C.cyan, '#475569', closed);
        ctx.lineWidth = 2;
        ctx.fillRect(storeX - m * 0.06, storeY - m * 0.1, m * 0.12, m * 0.1);
        ctx.strokeRect(storeX - m * 0.06, storeY - m * 0.1, m * 0.12, m * 0.1);
        ctx.restore();
        drawSprite(ctx, textSprite('FERMÉ', { size: Math.floor(m * 0.016), weight: 600, fam: MONO, color: C.coral, spacing: 4 }), storeX, storeY - m * 0.05, { base: 'middle', alpha: bA * closed });
        // cage dorée qui s'étire dans le temps
        const cageL = ax0 + axW * 0.18;
        const cageR = ax0 + axW * lerp(0.2, 1.0, timeT);
        const cageH = m * (V ? 0.2 : 0.24);
        const cageA = bA * smooth(seg(lt, T.survivent - 0.3, T.survivent + 0.5));
        const nBars = 12;
        for (let i = 0; i <= nBars; i++) {
          const fx = i / nBars;
          let x = lerp(cageL, cageR, fx);
          if (cageOpen > 0 && i > nBars * 0.4 && i < nBars * 0.6) x += (i < nBars / 2 ? -1 : 1) * cageOpen * m * 0.05;
          const grow = eOutExpo(seg(lt, T.survivent + fx * 1.2, T.survivent + 0.8 + fx * 1.2));
          ctx.save();
          ctx.globalAlpha *= cageA;
          const g = ctx.createLinearGradient(0, ay - cageH, 0, ay);
          g.addColorStop(0, C.gold);
          g.addColorStop(1, C.copper);
          ctx.strokeStyle = g;
          ctx.lineWidth = 4;
          ctx.shadowColor = C.amber;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(x, ay);
          ctx.lineTo(x, ay - cageH * grow);
          ctx.stroke();
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha *= cageA * smooth(seg(lt, T.survivent + 0.6, T.survivent + 1.4));
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cageL, ay - cageH);
        ctx.lineTo(cageR, ay - cageH);
        ctx.stroke();
        ctx.restore();
        light(ctx, (cageL + cageR) / 2, ay - cageH / 2, cageH * 1.4, C.amber, cageA * 0.3);
        // commerces complémentaires enfermés
        for (let k = 0; k < 3; k++) {
          const on = smooth(seg(lt, T.complementaires - 0.2 + k * 0.2, T.complementaires + 0.5 + k * 0.2));
          s09_shop(ctx, lerp(cageL, cageR, 0.25 + k * 0.25), ay - m * 0.02, m * 0.06, C.slate, bA * on);
        }
        // les familles paient : flux de pièces vers la cage
        const famA = bA * smooth(seg(lt, T.familles - 0.3, T.familles + 0.4));
        if (famA > 0.003) {
          const fx = V ? B.x + axW * 0.38 : B.x + axW * 0.5;
          const fy = V ? ay - cageH - m * 0.08 : ay - cageH - m * 0.1;
          s09_family(ctx, fx, fy, m * 0.06, C.ice, famA);
          const tgt = { x: (cageL + cageR) / 2, y: ay - cageH };
          for (let k = 0; k < 7; k++) {
            const u = (lt * 0.6 + k / 7) % 1;
            const p = { x: lerp(fx, tgt.x, u), y: lerp(fy, tgt.y, u) - Math.sin(u * Math.PI) * m * 0.06 };
            ctx.save();
            ctx.globalAlpha *= famA * Math.sin(u * Math.PI);
            ctx.fillStyle = C.gold;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, m * 0.009, m * 0.009 * Math.abs(Math.cos(u * 12)), 0, 0, TAU);
            ctx.fill();
            ctx.restore();
          }
        }
      });
      const bT = bA * smooth(seg(lt, T.economistes - 0.2, T.economistes + 0.4));
      const ty = V ? B.y - m * 0.24 : h * 0.2;
      const tx = V ? cx : B.x;
      mono(ctx, 'ÉCONOMISTES DE LA CONCURRENCE', tx, ty - m * 0.055, { size: Math.floor(m * 0.018), color: C.amber, spacing: 5, t: seg(lt, T.economistes, T.economistes + 0.9), alpha: bT * (1 - smooth(seg(lt, T.barriere - 0.4, T.barriere))) });
      const sw = smooth(seg(lt, T.barriere - 0.3, T.barriere + 0.1));
      kRise(ctx, "L'EXCUSE NE TIENT PLUS", tx, ty, { size: Math.floor(m * (V ? 0.05 : 0.044)), weight: 900, t: seg(lt, T.excuse - 0.1, T.excuse + 0.9), out: sw, alpha: bT, maxW: V ? w * 0.9 : w * 0.44 });
      mono(ctx, 'MÊME APRÈS LA FERMETURE', tx, ty + m * 0.05, { size: Math.floor(m * 0.018), color: C.coral, spacing: 4, t: seg(lt, T.fermeture, T.fermeture + 0.8), alpha: bT * (1 - sw) });
    }

    /* ── la diagonale ── */
    if (split > 0.003) {
      const L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const k = split;
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      const ux = (p1.x - p0.x) / L;
      const uy = (p1.y - p0.y) / L;
      ctx.save();
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = C.white;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(mx - ux * L * 0.5 * k, my - uy * L * 0.5 * k);
      ctx.lineTo(mx + ux * L * 0.5 * k, my + uy * L * 0.5 * k);
      ctx.stroke();
      ctx.restore();
      light(ctx, mx, my, m * 0.08, C.white, 0.35 * k);
    }

    /* ── ACTE I : deux versions ── */
    const oA = 1 - smooth(seg(lt, T.promoteurs - 0.4, T.promoteurs + 0.2));
    if (oA > 0.003) {
      kRise(ctx, 'DEUX VERSIONS', cx, cy + m * 0.02, { size: Math.floor(m * 0.08), weight: 900, t: seg(lt, T.encore - 0.1, T.encore + 0.8), alpha: oA, glow: 20, glowColor: rgba(C.white, 0.25) });
    }

    /* ── ACTE III : barrière artificielle ── */
    const fA = smooth(seg(lt, T.barriere - 0.3, T.barriere + 0.4));
    if (fA > 0.003) {
      const ty = V ? h * 0.5 + sh : h * 0.16;
      kRise(ctx, 'BARRIÈRE', cx, ty, { size: Math.floor(m * (V ? 0.07 : 0.066)), weight: 900, color: C.amber, t: seg(lt, T.barriere, T.barriere + 0.8), alpha: fA, glow: 22, glowColor: rgba(C.amber, 0.45) });
      kRise(ctx, 'ARTIFICIELLE', cx, ty + m * (V ? 0.08 : 0.075), { size: Math.floor(m * (V ? 0.07 : 0.066)), weight: 900, t: seg(lt, T.barriere + 0.3, T.barriere + 1.1), alpha: fA });
      mono(ctx, 'PAYÉE PAR LES FAMILLES À LA CAISSE', cx, ty + m * (V ? 0.135 : 0.125), { size: Math.floor(m * 0.019), color: C.gold, spacing: 4, t: seg(lt, T.familles, T.caisse + 0.9), alpha: fA });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 10 — rep-erreurs-caisse-la-facture · Pourquoi les erreurs à la caisse penchent toujours du même côté
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : tapis de caisse en perspective, articles qui défilent, faisceau laser ; prix tablette vs scanné
 * Acte II  : « 50 / 50 » barré ; histogramme des écarts : le côté « + » s'empile, le côté « − » reste vide ;
 *            la base bascule comme une balance : EN FAVEUR DU COMMERÇANT
 * Acte III : reçu numérique qui se déroule, écarts additionnés ; borne libre-service ; tampon REFUSÉ */

const S10_ITEMS = [
  { kind: 'box', col: C.amber, shelf: 3.49, scan: 3.99 },
  { kind: 'bottle', col: C.cyan, shelf: 2.29, scan: 2.29 },
  { kind: 'can', col: C.coral, shelf: 1.79, scan: 2.79 },
  { kind: 'box', col: C.emerald, shelf: 5.99, scan: 5.99 },
  { kind: 'bottle', col: C.violet, shelf: 4.49, scan: 6.99 },
  { kind: 'can', col: C.ice, shelf: 2.99, scan: 3.49 }
];

function s10_item(ctx, kind, x, y, s, col, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(x - s, 0, x + s, 0);
  g.addColorStop(0, mix(col, C.night, 0.55));
  g.addColorStop(0.5, mix(col, C.night, 0.2));
  g.addColorStop(1, mix(col, C.night, 0.6));
  ctx.fillStyle = g;
  ctx.strokeStyle = rgba(C.white, 0.35);
  ctx.lineWidth = 1.5;
  if (kind === 'box') {
    ctx.fillRect(x - s * 0.55, y - s * 1.3, s * 1.1, s * 1.3);
    ctx.strokeRect(x - s * 0.55, y - s * 1.3, s * 1.1, s * 1.3);
    ctx.fillStyle = rgba(C.white, 0.6);
    ctx.fillRect(x - s * 0.35, y - s * 0.9, s * 0.7, s * 0.25);
  } else if (kind === 'bottle') {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.12, y - s * 1.7);
    ctx.lineTo(x + s * 0.12, y - s * 1.7);
    ctx.lineTo(x + s * 0.12, y - s * 1.35);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 1.2, x + s * 0.4, y - s * 0.9);
    ctx.lineTo(x + s * 0.4, y);
    ctx.lineTo(x - s * 0.4, y);
    ctx.lineTo(x - s * 0.4, y - s * 0.9);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 1.2, x - s * 0.12, y - s * 1.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(x - s * 0.4, y - s * 0.95, s * 0.8, s * 0.95);
    ctx.strokeRect(x - s * 0.4, y - s * 0.95, s * 0.8, s * 0.95);
    ctx.fillStyle = rgba(C.white, 0.5);
    ctx.fillRect(x - s * 0.4, y - s * 0.62, s * 0.8, s * 0.16);
  }
  ctx.restore();
}

function sceneErreursCaisse(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    concret: 'le plus concret',
    semaine: 'de votre semaine',
    lecteur: 'le lecteur optique',
    caisse: 'à la caisse',
    enquete: 'Une enquête répétée',
    union: 'Union des consommateurs',
    troublant: 'phénomène troublant',
    erreurs: 'les erreurs de prix',
    tablette: 'entre la tablette',
    jamais: 'presque jamais',
    cinquante: 'cinquante-cinquante',
    rarissime: 'Il est rarissime',
    moins: 'moins cher par erreur',
    ecart: "l'écart joue",
    syst: 'quasi systématiquement',
    faveur: 'en faveur du commerçant',
    pire: 'Pire encore',
    auto: 'de plus en plus automatisées',
    hebdo: 'hebdomadaires',
    milliers: 'par milliers',
    refus: 'des refus',
    reclamer: 'osent réclamer'
  });

  const beltA = 1 - smooth(seg(lt, T.erreurs - 0.6, T.erreurs + 0.3));
  const histA = smooth(seg(lt, T.erreurs - 0.4, T.erreurs + 0.4)) * (1 - smooth(seg(lt, T.pire - 0.4, T.pire + 0.4)));
  const recA = smooth(seg(lt, T.pire - 0.2, T.pire + 0.6));

  frame(a, () => {
    dust(ctx, stage, gt, { count: 60, alpha: 0.22, seed: 110 });

    /* ── ACTE I : le tapis de caisse ── */
    if (beltA > 0.003) {
      const by = V ? h * 0.46 : h * 0.68;
      const bx0 = V ? -w * 0.05 : w * 0.04;
      const bx1 = V ? w * 1.05 : w * 0.96;
      const dep = m * 0.15; // profondeur du tapis
      const scanX = V ? cx : w * 0.56;
      const travel = (lt - 1.0) * m * 0.16; // défilement
      ctx.save();
      ctx.globalAlpha *= beltA;
      // tapis (parallélogramme en perspective) avec stries qui défilent
      ctx.fillStyle = '#0B1320';
      ctx.beginPath();
      ctx.moveTo(bx0 + dep, by - dep * 0.6);
      ctx.lineTo(bx1 + dep, by - dep * 0.6);
      ctx.lineTo(bx1, by + dep * 0.4);
      ctx.lineTo(bx0, by + dep * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(C.slate, 0.12);
      ctx.lineWidth = 2;
      const stripe = m * 0.05;
      for (let x = bx0 - stripe + ((travel % stripe) + stripe) % stripe; x < bx1; x += stripe) {
        ctx.beginPath();
        ctx.moveTo(x + dep, by - dep * 0.6);
        ctx.lineTo(x, by + dep * 0.4);
        ctx.stroke();
      }
      ctx.strokeStyle = rgba(C.cyan, 0.4);
      ctx.beginPath();
      ctx.moveTo(bx0, by + dep * 0.4);
      ctx.lineTo(bx1, by + dep * 0.4);
      ctx.stroke();
      ctx.restore();
      // articles qui défilent (gauche → droite)
      const spacing = m * (V ? 0.3 : 0.34);
      const loop = spacing * S10_ITEMS.length;
      const itemX = (i) => bx0 - spacing + ((((travel - i * spacing + spacing * 5.2) % loop) + loop) % loop);
      S10_ITEMS.forEach((it, i) => {
        const x = itemX(i);
        if (x < bx0 - m * 0.1 || x > bx1 + m * 0.1) return;
        const near = Math.exp(-Math.pow((x - scanX) / (m * 0.05), 2));
        s10_item(ctx, it.kind, x + dep * 0.4, by - dep * 0.1, m * 0.085, it.col, beltA);
        if (near > 0.05) light(ctx, x + dep * 0.4, by - m * 0.04, m * 0.12, C.cyan, near * beltA * 0.8);
      });
      // scanner : fenêtre + éventail laser
      const lA = beltA * smooth(seg(lt, T.lecteur - 0.4, T.lecteur + 0.3));
      ctx.save();
      ctx.globalAlpha *= lA;
      ctx.globalCompositeOperation = 'lighter';
      for (let k = -3; k <= 3; k++) {
        const an = -Math.PI / 2 + k * 0.12 + Math.sin(gt * 6 + k) * 0.03;
        const L = m * 0.3;
        const g = ctx.createLinearGradient(scanX, by, scanX + Math.cos(an) * L, by + Math.sin(an) * L);
        g.addColorStop(0, rgba(C.cyan, 0.85));
        g.addColorStop(1, rgba(C.cyan, 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(scanX, by + dep * 0.1);
        ctx.lineTo(scanX + Math.cos(an) * L, by + Math.sin(an) * L);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= lA;
      ctx.fillStyle = rgba(C.cyan, 0.25);
      ctx.fillRect(scanX - m * 0.05, by - dep * 0.05, m * 0.1, dep * 0.25);
      ctx.restore();
      // afficheur : prix tablette vs prix scanné (article sous le laser)
      const idx = S10_ITEMS.findIndex((it, i) => Math.abs(itemX(i) - scanX) < spacing / 2);
      const dA = lA * smooth(seg(lt, T.caisse - 0.2, T.caisse + 0.6));
      if (idx >= 0 && dA > 0.003) {
        const it = S10_ITEMS[idx];
        const dist = Math.abs(itemX(idx) - scanX) / (spacing / 2);
        const sel = 1 - smooth(seg(dist, 0.55, 0.95));
        const dx = scanX;
        const dyy = V ? by + m * 0.36 : by - m * 0.3;
        const fs = Math.floor(m * 0.056);
        const off = it.scan > it.shelf;
        const dA2 = dA * sel;
        mono(ctx, 'TABLETTE', dx - m * 0.15, dyy - m * 0.075, { size: Math.floor(m * 0.017), color: C.slate, spacing: 4, alpha: dA, cursor: false });
        mono(ctx, 'CAISSE', dx + m * 0.15, dyy - m * 0.075, { size: Math.floor(m * 0.017), color: C.slate, spacing: 4, alpha: dA, cursor: false });
        odometer(ctx, it.shelf, dx - m * 0.15, dyy, { size: fs, weight: 900, color: C.white, dec: 2, suffix: ' $', suffixScale: 0.6, alpha: dA2, roll: false });
        odometer(ctx, it.scan, dx + m * 0.15, dyy, { size: fs, weight: 900, color: off ? C.amber : C.white, dec: 2, suffix: ' $', suffixScale: 0.6, alpha: dA2, roll: false });
        if (off) light(ctx, dx + m * 0.15, dyy - fs * 0.35, m * 0.08, C.amber, dA2 * 0.5);
      }
      const ty = V ? h * 0.17 : h * 0.17;
      const sw = smooth(seg(lt, T.enquete - 0.3, T.enquete + 0.1));
      mono(ctx, 'LE MOMENT DE VOTRE SEMAINE', cx, ty - m * 0.06, { size: Math.floor(m * (V ? 0.016 : 0.018)), color: C.ice, spacing: 4, t: seg(lt, T.concret, T.semaine + 1.0), alpha: beltA * (1 - sw) });
      const sw0 = smooth(seg(lt, T.lecteur - 0.4, T.lecteur));
      kRise(ctx, 'LE PLUS CONCRET', cx, ty, { size: Math.floor(m * 0.07), weight: 900, color: C.ice, t: seg(lt, T.concret - 0.2, T.concret + 0.7), out: sw0, alpha: beltA });
      kRise(ctx, 'À LA CAISSE', cx, ty, { size: Math.floor(m * 0.07), weight: 900, t: seg(lt, T.lecteur - 0.1, T.caisse + 0.6), out: sw, alpha: beltA });
      mono(ctx, 'ENQUÊTE RÉPÉTÉE · UNION DES CONSOMMATEURS', cx, ty - m * 0.06, { size: Math.floor(m * (V ? 0.016 : 0.018)), color: C.amber, spacing: 4, t: seg(lt, T.enquete, T.union + 1.0), alpha: beltA * sw });
      kRise(ctx, 'UN PHÉNOMÈNE TROUBLANT', cx, ty, { size: Math.floor(m * (V ? 0.056 : 0.06)), weight: 900, t: seg(lt, T.troublant - 0.2, T.troublant + 0.8), alpha: beltA * sw, maxW: w * 0.9 });
    }

    /* ── ACTE II : 50/50 barré et histogramme qui bascule ── */
    if (histA > 0.003) {
      const hx = cx;
      const hy = V ? h * 0.6 : h * 0.68;
      const hw = V ? w * 0.84 : w * 0.56;
      const tilt = eInOutQuart(seg(lt, T.faveur - 0.4, T.faveur + 0.8)) * 0.09 + Math.sin((lt - T.faveur) * 3) * 0.008 * smooth(seg(lt, T.faveur, T.faveur + 1));
      const bins = [
        { lab: '−2,50', v: 0.03, sign: -1 },
        { lab: '−1,00', v: 0.05, sign: -1 },
        { lab: '−0,50', v: 0.07, sign: -1 },
        { lab: '+0,50', v: 0.62, sign: 1 },
        { lab: '+1,00', v: 0.86, sign: 1 },
        { lab: '+2,50', v: 0.55, sign: 1 }
      ];
      const maxH = V ? h * 0.27 : h * 0.4;
      const bwid = hw / 7.5;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(tilt);
      // fléau / base
      ctx.save();
      ctx.globalAlpha *= histA;
      ctx.fillStyle = rgba(C.white, 0.9);
      ctx.fillRect(-hw / 2, -1.5, hw * eOutExpo(seg(lt, T.erreurs, T.erreurs + 0.9)), 3);
      ctx.restore();
      bins.forEach((b, i) => {
        const x = -hw / 2 + (i + (i >= 3 ? 1.5 : 0.5)) * bwid + bwid * 0.25;
        const k = b.sign < 0 ? seg(lt, T.rarissime - 0.2, T.moins + 0.8) : seg(lt, T.jamais - 0.4 + (i - 3) * 0.25, T.jamais + 0.9 + (i - 3) * 0.25);
        const hh = maxH * b.v * eOutExpo(k);
        const col = b.sign < 0 ? C.emerald : C.amber;
        ctx.save();
        ctx.globalAlpha *= histA;
        const g = ctx.createLinearGradient(0, -hh, 0, 0);
        g.addColorStop(0, col);
        g.addColorStop(1, mix(col, C.night, 0.55));
        ctx.fillStyle = g;
        ctx.shadowColor = col;
        ctx.shadowBlur = 14;
        ctx.fillRect(x - bwid * 0.38, -hh, bwid * 0.76, hh);
        ctx.restore();
        drawSprite(ctx, textSprite(b.lab + ' $', { size: Math.floor(m * 0.017), weight: 600, fam: MONO, color: b.sign < 0 ? C.mint : C.gold, spacing: 1 }), x, m * 0.04, { alpha: histA * smooth(seg(lt, T.erreurs + 0.3 + i * 0.08, T.erreurs + 0.9 + i * 0.08)) });
      });
      // pivot
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= histA * smooth(seg(lt, T.faveur - 0.5, T.faveur));
      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 6);
      ctx.lineTo(hx - m * 0.03, hy + m * 0.07);
      ctx.lineTo(hx + m * 0.03, hy + m * 0.07);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // 50 / 50 barré
      const fA = histA * env(lt, T.jamais - 0.4, T.rarissime + 0.4, 0.4, 0.6);
      const fy = V ? h * 0.24 : h * 0.24;
      kZoom(ctx, '50 / 50', cx, fy, { size: Math.floor(m * 0.1), weight: 900, color: C.slate, t: seg(lt, T.jamais - 0.3, T.jamais + 0.6), alpha: fA });
      const cross = eInOutQuart(seg(lt, T.cinquante + 0.2, T.cinquante + 0.9));
      glowPath(ctx, [{ x: cx - m * 0.22, y: fy + m * 0.01 }, { x: cx + m * 0.22, y: fy - m * 0.08 }], cross, { color: C.red, width: 6, alpha: fA });
      const tA = histA * smooth(seg(lt, T.rarissime - 0.2, T.rarissime + 0.4));
      const sw = smooth(seg(lt, T.ecart - 0.3, T.ecart + 0.1));
      kRise(ctx, 'RARISSIME', V ? cx - w * 0.22 : cx - hw * 0.3, fy, { size: Math.floor(m * 0.044), weight: 900, color: C.emerald, t: seg(lt, T.rarissime, T.rarissime + 0.8), out: sw, alpha: tA * smooth(seg(lt, T.rarissime + 0.3, T.rarissime + 0.5)) });
      mono(ctx, 'MOINS CHER PAR ERREUR', V ? cx - w * 0.22 : cx - hw * 0.3, fy + m * 0.045, { size: Math.floor(m * 0.016), color: C.mint, spacing: 3, t: seg(lt, T.moins, T.moins + 0.8), alpha: tA * (1 - sw) });
      kRise(ctx, 'EN FAVEUR', cx, fy - m * 0.03, { size: Math.floor(m * (V ? 0.066 : 0.062)), weight: 900, color: C.amber, t: seg(lt, T.faveur - 0.1, T.faveur + 0.7), alpha: histA * sw, glow: 20, glowColor: rgba(C.amber, 0.45) });
      kRise(ctx, 'DU COMMERÇANT', cx, fy + m * 0.045, { size: Math.floor(m * (V ? 0.066 : 0.062)), weight: 900, t: seg(lt, T.faveur + 0.2, T.faveur + 1.0), alpha: histA * sw });
      mono(ctx, 'QUASI SYSTÉMATIQUEMENT', cx, fy - m * 0.11, { size: Math.floor(m * 0.019), color: C.gold, spacing: 6, t: seg(lt, T.syst, T.syst + 0.9), alpha: histA * sw });
      mono(ctx, 'ÉCARTS TABLETTE ↔ CAISSE · ILLUSTRATION', cx, hy + m * 0.11, { size: Math.floor(m * 0.015), color: C.slate, spacing: 3, t: seg(lt, T.tablette, T.tablette + 1.0), alpha: histA * 0.75 });
    }

    /* ── ACTE III : le reçu, la borne, le refus ── */
    if (recA > 0.003) {
      const rx = V ? cx : w * 0.36;
      const rTop = V ? h * 0.18 : h * 0.12;
      const rw = V ? w * 0.5 : w * 0.2;
      const unroll = eInOutQuart(seg(lt, T.pire - 0.1, T.milliers + 0.4));
      const rh = (V ? h * 0.44 : h * 0.72) * unroll;
      ctx.save();
      ctx.globalAlpha *= recA;
      light(ctx, rx, rTop + rh * 0.5, rw * 1.4, C.ice, 0.15);
      const g = ctx.createLinearGradient(0, rTop, 0, rTop + rh);
      g.addColorStop(0, '#EEF2F6');
      g.addColorStop(1, '#D3DBE4');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(rx - rw / 2, rTop);
      ctx.lineTo(rx + rw / 2, rTop);
      ctx.lineTo(rx + rw / 2, rTop + rh);
      for (let k = 0; k < 10; k++) ctx.lineTo(rx + rw / 2 - (k + 0.5) * (rw / 10), rTop + rh + (k % 2 ? 0 : m * 0.012));
      ctx.lineTo(rx - rw / 2, rTop + rh);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const lines = 9;
      const lh = (V ? h * 0.44 : h * 0.72) / (lines + 3);
      let over = 0;
      for (let k = 0; k < lines; k++) {
        const ly = rTop + lh * (k + 1.2);
        if (ly > rTop + rh - lh * 0.4) break;
        const extra = [0.5, 0, 1, 0, 2.5, 0.5, 0, 1, 0.5][k];
        over += extra;
        ctx.save();
        ctx.globalAlpha *= recA;
        ctx.fillStyle = rgba('#0B1220', 0.6);
        ctx.fillRect(rx - rw * 0.42, ly - lh * 0.18, rw * 0.46, lh * 0.18);
        ctx.fillRect(rx + rw * 0.16, ly - lh * 0.18, rw * 0.24, lh * 0.18);
        ctx.restore();
        if (extra > 0) {
          drawSprite(ctx, textSprite('+' + frNum(extra, 2), { size: Math.floor(m * 0.017), weight: 700, fam: MONO, color: '#B45309', spacing: 1 }), rx + rw * 0.44, ly - lh * 0.05, { align: 'right', alpha: recA });
        }
      }
      const totY = rTop + rh - lh * 0.6;
      const totA = recA * smooth(seg(unroll, 0.85, 1));
      mono(ctx, 'ÉCARTS', rx - rw * 0.42, totY, { size: Math.floor(m * 0.016), color: '#334155', spacing: 3, align: 'left', alpha: totA, cursor: false });
      odometer(ctx, over * smooth(seg(unroll, 0.85, 1)), rx + rw * 0.44, totY + m * 0.012, { size: Math.floor(m * 0.032), weight: 900, color: '#B45309', dec: 2, prefix: '+', suffix: ' $', suffixScale: 0.6, align: 'right', alpha: totA });
      // tampon REFUSÉ
      const st = seg(lt, T.refus - 0.05, T.refus + 0.4);
      if (st > 0) {
        const sc = lerp(2.2, 1, eOutExpo(st));
        ctx.save();
        ctx.globalAlpha *= recA * clamp(st * 3);
        ctx.translate(rx - rw * 0.12, rTop + (V ? h * 0.22 : h * 0.36));
        ctx.rotate(-0.18);
        ctx.scale(sc, sc);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 5;
        ctx.strokeRect(-m * 0.15, -m * 0.045, m * 0.3, m * 0.09);
        ctx.restore();
        ctx.save();
        ctx.translate(rx - rw * 0.12, rTop + (V ? h * 0.22 : h * 0.36));
        ctx.rotate(-0.18);
        ctx.scale(sc, sc);
        drawSprite(ctx, textSprite('REFUSÉ', { size: Math.floor(m * 0.05), weight: 900, color: C.red, spacing: 6 }), 0, 0, { base: 'middle', alpha: recA * clamp(st * 3) });
        ctx.restore();
      }
      // borne libre-service + textes
      const kx = V ? cx : w * 0.7;
      const ky = V ? h * 0.79 : h * 0.4;
      const kA = recA * smooth(seg(lt, T.auto - 0.3, T.auto + 0.5));
      if (kA > 0.003 && !V) {
        ctx.save();
        ctx.globalAlpha *= kA;
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = C.cyan;
        ctx.shadowBlur = 12;
        rrect(ctx, kx - m * 0.06, ky - m * 0.1, m * 0.12, m * 0.09, m * 0.01);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(kx, ky - m * 0.01);
        ctx.lineTo(kx, ky + m * 0.1);
        ctx.moveTo(kx - m * 0.05, ky + m * 0.1);
        ctx.lineTo(kx + m * 0.05, ky + m * 0.1);
        ctx.stroke();
        ctx.restore();
      }
      const tx = V ? cx : w * 0.7;
      const ty0 = V ? h * 0.12 : ky + m * 0.2;
      kRise(ctx, 'PIRE ENCORE', tx, V ? h * 0.13 : h * 0.18, { size: Math.floor(m * 0.05), weight: 900, color: C.coral, t: seg(lt, T.pire - 0.1, T.pire + 0.6), alpha: recA });
      mono(ctx, 'CAISSES AUTOMATISÉES', tx, V ? h * 0.68 : ty0, { size: Math.floor(m * 0.02), color: C.cyan, spacing: 5, t: seg(lt, T.auto, T.auto + 0.8), alpha: recA });
      mono(ctx, 'DES MILLIERS DE CHANGEMENTS DE PRIX', tx, V ? h * 0.71 : ty0 + m * 0.045, { size: Math.floor(m * (V ? 0.017 : 0.018)), color: C.ice, spacing: 3, t: seg(lt, T.hebdo - 0.2, T.milliers + 0.8), alpha: recA });
      mono(ctx, 'CHAQUE SEMAINE', tx, V ? h * 0.735 : ty0 + m * 0.085, { size: Math.floor(m * 0.017), color: C.ice, spacing: 5, t: seg(lt, T.hebdo, T.hebdo + 0.8), alpha: recA });
      kRise(ctx, 'QUAND ON OSE RÉCLAMER', tx, V ? h * 0.8 : ty0 + m * 0.18, { size: Math.floor(m * (V ? 0.042 : 0.036)), weight: 900, color: C.white, t: seg(lt, T.reclamer - 0.3, T.reclamer + 0.6), alpha: recA, maxW: V ? w * 0.9 : w * 0.5 });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 11 — rep-regle-15-dollars-opc · Votre arme secrète légale au Québec : la règle des 15 $
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : le Québec s'illumine sous un bouclier : l'une des protections les plus puissantes d'Amérique
 *            du Nord ; « POLITIQUE D'EXACTITUDE DES PRIX · BONIFIÉE EN MAI 2025 »
 * Acte II  : étiquette 3,99 $ vs caisse 4,99 $ ; le « 15 $ » d'or devient le nœud d'un arbre de décision :
 *            ≤ 15 $ → 0,00 $ GRATUIT ; > 15 $ → rabais immédiat de 15 $ sur le plus bas prix affiché
 * Acte III : de la maison au magasin, le reçu à la main : « REVENEZ AVEC VOTRE REÇU » */

function s11_house(ctx, x, y, s, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.fillStyle = rgba(color, 0.12);
  ctx.lineWidth = Math.max(2, s * 0.07);
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.3;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.6, y - s * 0.05);
  ctx.lineTo(x, y - s * 0.6);
  ctx.lineTo(x + s * 0.6, y - s * 0.05);
  ctx.lineTo(x + s * 0.48, y - s * 0.05);
  ctx.lineTo(x + s * 0.48, y + s * 0.5);
  ctx.lineTo(x - s * 0.48, y + s * 0.5);
  ctx.lineTo(x - s * 0.48, y - s * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeRect(x - s * 0.12, y + s * 0.15, s * 0.24, s * 0.35);
  ctx.restore();
}

function sceneRegle15(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    pourtant: 'Et pourtant',
    quebec: 'au Québec',
    mains: 'entre les mains',
    puissantes: 'les plus puissantes',
    amerique: 'Amérique du Nord',
    majorite: 'la majorité des gens',
    politique: "la Politique d'exactitude des prix",
    bonifiee: 'bonifiée',
    mai: 'en mai',
    scanne: 'le prix scanné',
    eleve: 'plus élevé',
    affiche: "le prix affiché sur l'étiquette",
    quinze: 'quinze dollars ou moins',
    remettre: 'vous le remettre',
    gratuit: 'gratuitement',
    plus: "Et s'il coûte plus",
    rabais: 'un rabais immédiat',
    basprix: 'le plus bas prix affiché',
    rentre: 'déjà rentré chez vous',
    revenir: 'vous pouvez revenir',
    recu: 'votre reçu'
  });

  const actI = 1 - smooth(seg(lt, T.scanne - 0.6, T.scanne + 0.2));
  const treeA = smooth(seg(lt, T.scanne - 0.4, T.scanne + 0.4)) * (1 - smooth(seg(lt, T.rentre - 0.4, T.rentre + 0.4)));
  const homeA = smooth(seg(lt, T.rentre - 0.3, T.rentre + 0.5));

  frame(a, () => {
    dust(ctx, stage, gt, { count: 70, alpha: 0.26, seed: 121 });

    /* ── ACTE I : le bouclier québécois ── */
    if (actI > 0.003) {
      const push = lerp(1, 1.08, smoother(seg(lt, 0, T.scanne)));
      const qx = V ? cx : w * 0.34;
      const qy = V ? h * 0.42 : h * 0.55;
      ctx.save();
      ctx.translate(qx, qy);
      ctx.scale(push, push);
      ctx.translate(-qx, -qy);
      const sc = m * (V ? 0.017 : 0.016);
      const Pj = makeFlat(-80, 52, sc, qx, qy);
      drawDots(ctx, Pj, regionDots('na11', -128, -52, 26, 66, 0.7), { color: C.slate, size: sc * 0.28, alpha: 0.32 * actI, fade: { x: qx, y: qy, r: m * (V ? 0.55 : 0.6) } });
      const qon = seg(lt, T.quebec - 0.3, T.quebec + 1.2);
      drawQuebec(ctx, Pj, { color: C.cyan, alpha: actI, draw: eInOutQuart(qon), fill: 0.22 });
      const qc = Pj.project(-72, 52);
      shield(ctx, qc.x, qc.y, m * (V ? 0.13 : 0.12), { color: C.amber, alpha: actI * smooth(seg(lt, T.mains - 0.2, T.mains + 0.6)), draw: eInOutQuart(seg(lt, T.mains - 0.2, T.puissantes + 0.6)), time: gt, fill: 0.1 });
      ctx.restore();
      const tx = V ? cx : w * 0.7;
      const ty = V ? h * 0.72 : h * 0.36;
      const swap = smooth(seg(lt, T.politique - 0.4, T.politique));
      mono(ctx, 'AU QUÉBEC, ENTRE VOS MAINS', tx, ty - m * 0.07, { size: Math.floor(m * 0.019), color: C.ice, spacing: 5, t: seg(lt, T.quebec, T.mains + 0.8), alpha: actI * (1 - swap) });
      kRise(ctx, "L'UNE DES PLUS", tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.puissantes - 0.3, T.puissantes + 0.6), out: swap, alpha: actI });
      kRise(ctx, 'PUISSANTES', tx, ty + m * 0.065, { size: Math.floor(m * 0.05), weight: 900, color: C.amber, t: seg(lt, T.puissantes, T.puissantes + 0.8), out: swap, alpha: actI, glow: 16, glowColor: rgba(C.amber, 0.4) });
      mono(ctx, "PROTECTIONS D'AMÉRIQUE DU NORD", tx, ty + m * 0.12, { size: Math.floor(m * 0.018), color: C.slate, spacing: 4, t: seg(lt, T.amerique - 0.3, T.amerique + 0.8), alpha: actI * (1 - swap) });
      mono(ctx, 'ET LA MAJORITÉ L’IGNORE', tx, ty + m * 0.165, { size: Math.floor(m * 0.019), color: C.coral, spacing: 5, t: seg(lt, T.majorite, T.majorite + 0.9), alpha: actI * (1 - swap) });
      kWipe(ctx, 'POLITIQUE', tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.politique, T.politique + 0.7), alpha: actI * swap, edge: C.amber });
      kWipe(ctx, "D'EXACTITUDE DES PRIX", tx, ty + m * 0.065, { size: Math.floor(m * 0.05), weight: 900, color: C.cyan, t: seg(lt, T.politique + 0.3, T.politique + 1.1), alpha: actI * swap, edge: C.amber, maxW: V ? w * 0.9 : w * 0.5 });
      mono(ctx, 'BONIFIÉE · MAI 2025', tx, ty + m * 0.125, { size: Math.floor(m * 0.022), color: C.amber, spacing: 7, t: seg(lt, T.bonifiee, T.mai + 1.0), alpha: actI * swap });
    }

    /* ── ACTE II : l'arbre de décision ── */
    if (treeA > 0.003) {
      const rise = (1 - eOutExpo(seg(lt, T.scanne - 0.4, T.scanne + 1.2))) * h * 0.12;
      const topY = (V ? h * 0.17 : h * 0.2) + rise;
      // étiquette vs caisse
      const cA = treeA * (1 - smooth(seg(lt, T.rentre - 0.6, T.rentre)));
      const lx = cx - m * (V ? 0.23 : 0.2);
      const rx = cx + m * (V ? 0.23 : 0.2);
      const fs = Math.floor(m * 0.06);
      const labOn = seg(lt, T.affiche - 0.3, T.affiche + 0.6);
      const scnOn = seg(lt, T.scanne - 0.2, T.scanne + 0.6);
      mono(ctx, 'ÉTIQUETTE', lx, topY - m * 0.07, { size: Math.floor(m * 0.018), color: C.slate, spacing: 5, t: labOn, alpha: cA });
      kSlide(ctx, '3,99 $', lx, topY, { size: fs, weight: 900, color: C.white, t: labOn, alpha: cA });
      mono(ctx, 'CAISSE', rx, topY - m * 0.07, { size: Math.floor(m * 0.018), color: C.cyan, spacing: 5, t: scnOn, alpha: cA });
      kSlide(ctx, '4,99 $', rx, topY, { size: fs, weight: 900, color: C.cyan, t: scnOn, alpha: cA, glow: 16, glowColor: rgba(C.cyan, 0.5) });
      const neq = smooth(seg(lt, T.eleve - 0.1, T.eleve + 0.5));
      drawSprite(ctx, textSprite('≠', { size: Math.floor(m * 0.06), weight: 900, color: C.coral }), cx, topY, { alpha: cA * neq, scale: lerp(1.6, 1, eOutExpo(seg(lt, T.eleve - 0.1, T.eleve + 0.5))) });
      if (neq > 0) shockwave(ctx, rx, topY - fs * 0.35, m * 0.12, lt - T.eleve, { color: C.cyan, count: 2, period: 1.2, alpha: cA * (1 - smooth(seg(lt, T.eleve + 1, T.eleve + 2))) });
      // le nœud « 15 $ »
      const nx = cx;
      const ny = V ? h * 0.36 + rise : h * 0.45 + rise;
      const nOn = seg(lt, T.quinze - 0.4, T.quinze + 0.6);
      const nfs = Math.floor(m * (V ? 0.14 : 0.13));
      if (nOn > 0) {
        light(ctx, nx, ny - nfs * 0.35, m * 0.22, C.amber, treeA * 0.5 * smooth(nOn));
        kZoom(ctx, '15 $', nx, ny, { size: nfs, weight: 900, color: C.gold, t: nOn, alpha: treeA, from: 1.6, glow: 26, glowColor: rgba(C.amber, 0.6) });
        // reflet anodisé qui balaie le chiffre
        const sweep = seg(lt, T.quinze + 0.5, T.quinze + 1.6);
        if (sweep > 0 && sweep < 1) flare(ctx, lerp(nx - nfs, nx + nfs, sweep), ny - nfs * 0.4, m * 0.05, C.gold, treeA * Math.sin(sweep * Math.PI));
      }
      // branches
      const bY = V ? h * 0.64 + rise : h * 0.74 + rise;
      const bL = V ? w * 0.26 : w * 0.27;
      const bR = V ? w * 0.74 : w * 0.73;
      const brL = eInOutQuart(seg(lt, T.quinze + 0.3, T.quinze + 1.2));
      const brR = eInOutQuart(seg(lt, T.plus - 0.2, T.plus + 0.7));
      const from = { x: nx, y: ny + m * 0.03 };
      glowPath(ctx, quadPts(from, { x: bL, y: bY - m * 0.13 }, -m * 0.05, 30), brL, { color: C.emerald, width: 3, alpha: treeA });
      glowPath(ctx, quadPts(from, { x: bR, y: bY - m * 0.13 }, m * 0.05, 30), brR, { color: C.amber, width: 3, alpha: treeA });
      // ≤ 15 $ → GRATUIT
      const lA = treeA * smooth(seg(brL, 0.7, 1));
      if (lA > 0.003) {
        kSlide(ctx, '≤ 15 $', bL, bY - m * 0.07, { size: Math.floor(m * 0.044), weight: 900, color: C.emerald, t: seg(lt, T.quinze + 0.6, T.quinze + 1.3), alpha: lA });
        const v = lerp(4.99, 0, eInOutQuart(seg(lt, T.gratuit - 0.5, T.gratuit + 0.6)));
        odometer(ctx, v, bL, bY + m * 0.03, { size: Math.floor(m * (V ? 0.07 : 0.07)), weight: 900, color: C.white, dec: 2, suffix: ' $', suffixScale: 0.55, alpha: lA });
        const st = seg(lt, T.gratuit + 0.2, T.gratuit + 0.6);
        if (st > 0) {
          const sc = lerp(1.8, 1, eOutExpo(st));
          ctx.save();
          ctx.globalAlpha *= lA * clamp(st * 3);
          ctx.translate(bL, bY + m * 0.13);
          ctx.rotate(-0.08);
          ctx.scale(sc, sc);
          ctx.strokeStyle = C.emerald;
          ctx.lineWidth = 4;
          ctx.shadowColor = C.emerald;
          ctx.shadowBlur = 14;
          rrect(ctx, -m * 0.12, -m * 0.035, m * 0.24, m * 0.07, m * 0.012);
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.translate(bL, bY + m * 0.13);
          ctx.rotate(-0.08);
          ctx.scale(sc, sc);
          drawSprite(ctx, textSprite('GRATUIT', { size: Math.floor(m * 0.042), weight: 900, color: C.emerald, spacing: 4 }), 0, 0, { base: 'middle', alpha: lA * clamp(st * 3) });
          ctx.restore();
        }
      }
      // > 15 $ → rabais de 15 $
      const rA = treeA * smooth(seg(brR, 0.7, 1));
      if (rA > 0.003) {
        kSlide(ctx, '> 15 $', bR, bY - m * 0.07, { size: Math.floor(m * 0.044), weight: 900, color: C.amber, t: seg(lt, T.plus + 0.4, T.plus + 1.1), alpha: rA });
        const v = lerp(22.99, 7.99, eInOutQuart(seg(lt, T.rabais - 0.2, T.rabais + 1.0)));
        odometer(ctx, v, bR, bY + m * 0.03, { size: Math.floor(m * 0.07), weight: 900, color: C.white, dec: 2, suffix: ' $', suffixScale: 0.55, alpha: rA });
        kSlide(ctx, '− 15,00 $', bR, bY + m * 0.11, { size: Math.floor(m * 0.04), weight: 900, color: C.amber, t: seg(lt, T.rabais, T.rabais + 0.7), alpha: rA, glow: 14, glowColor: rgba(C.amber, 0.45) });
        mono(ctx, 'SUR LE PLUS BAS PRIX AFFICHÉ', bR, bY + m * 0.165, { size: Math.floor(m * (V ? 0.014 : 0.016)), color: C.gold, spacing: 2, t: seg(lt, T.basprix - 0.2, T.basprix + 1.0), alpha: rA });
      }
      mono(ctx, 'PRIX DONNÉS EN EXEMPLE', cx, V ? h * 0.83 : h * 0.93, { size: Math.floor(m * 0.014), color: C.slate, spacing: 3, t: seg(lt, T.quinze, T.quinze + 1), alpha: treeA * 0.6 });
    }

    /* ── ACTE III : revenez avec votre reçu ── */
    if (homeA > 0.003) {
      const hx = V ? w * 0.2 : w * 0.24;
      const sx = V ? w * 0.8 : w * 0.76;
      const yy = V ? h * 0.36 : h * 0.42;
      s11_house(ctx, hx, yy, m * 0.09, C.ice, homeA);
      // magasin
      ctx.save();
      ctx.globalAlpha *= homeA;
      ctx.strokeStyle = C.emerald;
      ctx.lineWidth = 3;
      ctx.shadowColor = C.emerald;
      ctx.shadowBlur = 12;
      ctx.strokeRect(sx - m * 0.07, yy - m * 0.05, m * 0.14, m * 0.1);
      ctx.beginPath();
      ctx.moveTo(sx - m * 0.085, yy - m * 0.05);
      ctx.lineTo(sx + m * 0.085, yy - m * 0.05);
      ctx.stroke();
      ctx.restore();
      // trajet pointillé avec le reçu qui voyage
      const path = quadPts({ x: hx + m * 0.08, y: yy }, { x: sx - m * 0.09, y: yy }, -m * 0.12, 60);
      const tr = eInOutQuart(seg(lt, T.revenir - 0.3, T.recu + 0.6));
      ctx.save();
      ctx.globalAlpha *= homeA * 0.6;
      ctx.strokeStyle = C.slate;
      ctx.setLineDash([6, 10]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.restore();
      const rp = along(path, tr);
      const rw = m * 0.06;
      ctx.save();
      ctx.globalAlpha *= homeA;
      ctx.translate(rp.x, rp.y - m * 0.04);
      ctx.rotate(Math.sin(lt * 3) * 0.05);
      ctx.fillStyle = '#E8EDF3';
      ctx.fillRect(-rw / 2, -rw * 0.7, rw, rw * 1.4);
      ctx.fillStyle = rgba('#0B1220', 0.55);
      for (let k = 0; k < 5; k++) ctx.fillRect(-rw * 0.35, -rw * 0.5 + k * rw * 0.22, rw * 0.7, rw * 0.06);
      ctx.restore();
      const ck = smooth(seg(lt, T.recu + 0.3, T.recu + 0.8));
      if (ck > 0) {
        light(ctx, sx, yy - m * 0.1, m * 0.08, C.emerald, homeA * ck * 0.6);
        glowPath(ctx, [{ x: sx - m * 0.03, y: yy - m * 0.11 }, { x: sx - m * 0.008, y: yy - m * 0.085 }, { x: sx + m * 0.035, y: yy - m * 0.14 }], eInOutQuart(ck), { color: C.emerald, width: 5, alpha: homeA });
      }
      mono(ctx, 'DÉJÀ RENTRÉ CHEZ VOUS ?', hx, yy + m * 0.1, { size: Math.floor(m * 0.017), color: C.ice, spacing: 3, t: seg(lt, T.rentre, T.rentre + 0.8), alpha: homeA });
      const ty = V ? h * 0.62 : h * 0.72;
      kRise(ctx, 'REVENEZ AVEC', cx, ty, { size: Math.floor(m * (V ? 0.07 : 0.064)), weight: 900, t: seg(lt, T.revenir - 0.1, T.revenir + 0.7), alpha: homeA });
      kRise(ctx, 'VOTRE REÇU', cx, ty + m * 0.08, { size: Math.floor(m * (V ? 0.07 : 0.064)), weight: 900, color: C.emerald, t: seg(lt, T.recu - 0.2, T.recu + 0.6), alpha: homeA, glow: 18, glowColor: rgba(C.emerald, 0.45) });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 12 — rep-lois-monde-vs-quebec · New York légifère, Washington enquête… et le Québec ?
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : le globe nocturne pivote de l'Atlantique vers le nord-est américain ; New York s'arme d'un
 *            bouclier émeraude et d'un avertissement obligatoire ; Maryland, New Jersey, Connecticut s'allument
 * Acte II  : des faisceaux remontent vers Québec (anneau de décision ambre, OPC) et vers Ottawa (prix plancher)
 * Acte III : une fenêtre de lumière s'ouvre : « LA FENÊTRE EST OUVERTE » */

const S12_LIGHTS = ['newYork', 'boston', 'philadelphia', 'baltimore', 'washington', 'montreal', 'toronto', 'quebec', 'ottawa', 'albany', 'hartford', 'trenton', 'annapolis'];

function sceneLoisAmerique(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    ailleurs: 'Ailleurs en Amérique du Nord',
    riposte: 'la riposte juridique',
    ny: "L'État de New York",
    oblige: 'oblige désormais',
    avert: 'un avertissement clair',
    algo: 'un algorithme fixe un prix',
    donnees: 'vos données personnelles',
    maryland: 'Le Maryland',
    nj: 'le New Jersey',
    ct: 'le Connecticut',
    lois: 'des lois ciblées',
    alim: 'en alimentation',
    ici: 'Ici, au Québec',
    opposition: "partis d'opposition",
    opc: "l'Office de la protection du consommateur",
    encadrer: "d'encadrer d'avance",
    norme: 'la norme',
    ottawa: "tandis qu'Ottawa",
    plancher: 'prix plancher',
    circ: 'les circulaires',
    fenetre: 'La fenêtre pour agir',
    ouverte: 'grande ouverte',
    maintenant: 'maintenant.'
  });

  // caméra-globe : [lon, lat, R/m, dx/w, dy/h]
  const st = globeTrack(lt, [
    [0, [-38, 34, V ? 0.46 : 0.42, 0, 0.04]],
    [T.ny - 0.6, [-62, 39, V ? 0.7 : 0.62, 0, 0.04]],
    [T.ny + 1.4, [-74.6, 40.6, V ? 3.4 : 3.3, V ? 0 : -0.14, V ? 0.0 : 0.06], eInOutQuart],
    [T.ct + 1.2, [-74.6, 40.5, V ? 3.6 : 3.5, V ? 0 : -0.14, V ? 0.0 : 0.06]],
    [T.ici + 1.4, [-73.5, 44.2, V ? 1.85 : 1.75, V ? 0 : -0.12, V ? -0.02 : 0.08], eInOutQuart],
    [T.fenetre - 0.4, [-73.2, 44.4, V ? 1.9 : 1.8, V ? 0 : -0.12, V ? -0.02 : 0.08]],
    [D, [-72, 44, V ? 1.3 : 1.25, 0, V ? -0.1 : 0.0], eInOutQuart]
  ]);
  const G = globeFrom(stage, st);
  const P2 = (k) => G.project(...P(k));
  const legal = (k, tk) => smooth(seg(lt, tk - 0.2, tk + 0.6));
  const endFade = 1 - smooth(seg(lt, T.fenetre - 0.6, T.fenetre + 0.1));

  frame(a, () => {
    const gA = 1 - 0.45 * smooth(seg(lt, T.fenetre - 0.4, T.fenetre + 0.8));
    drawGlobe(ctx, G, { alpha: gA, color: C.cyan, atmo: 0.9 });

    /* lumières des villes (nuit) */
    S12_LIGHTS.forEach((k, i) => {
      const q = P2(k);
      if (!q.vis || q.z <= 0) return;
      const tw = 0.75 + 0.25 * Math.sin(gt * 1.7 + i * 2.1);
      light(ctx, q.x, q.y, m * 0.035, C.gold, 0.55 * tw * gA * smooth(q.z * 4));
    });

    /* ── ACTE I : New York et les États voisins ── */
    const nyA = legal('newYork', T.ny) * (1 - smooth(seg(lt, T.ici - 0.4, T.ici + 0.6))) * gA;
    const ny = P2('newYork');
    if (nyA > 0.003 && ny.vis) {
      shield(ctx, ny.x - m * 0.08, ny.y - m * 0.07, m * 0.055, { color: C.emerald, alpha: nyA, draw: eInOutQuart(seg(lt, T.ny, T.ny + 1.0)), time: gt, fill: 0.16 });
      cityTag(ctx, ny.x, ny.y, 'NEW YORK', { color: C.emerald, t: seg(lt, T.ny, T.ny + 0.9), alpha: nyA, side: 'right', size: Math.floor(m * 0.026), time: gt, r: 8 });
    }
    const states = [
      ['annapolis', 'MARYLAND', T.maryland, 'left'],
      ['trenton', 'NEW JERSEY', T.nj, 'left'],
      ['hartford', 'CONNECTICUT', T.ct, 'right']
    ];
    states.forEach(([k, n, tk, side]) => {
      const q = P2(k);
      const sA = legal(k, tk) * (1 - smooth(seg(lt, T.ici - 0.4, T.ici + 0.6))) * gA;
      if (sA <= 0.003 || !q.vis) return;
      cityTag(ctx, q.x, q.y, n, { color: C.emerald, t: seg(lt, tk, tk + 0.8), alpha: sA, side, size: Math.floor(m * 0.022), time: gt, r: 7, pulse: true });
      const ny2 = P2('newYork');
      glowPath(ctx, [ny2, q], eInOutQuart(seg(lt, tk, tk + 0.7)), { color: C.emerald, width: 1.5, alpha: sA * 0.6, head: false });
    });

    // panneau d'avertissement obligatoire
    const pA = smooth(seg(lt, T.avert - 0.3, T.avert + 0.4)) * (1 - smooth(seg(lt, T.maryland - 0.6, T.maryland)));
    if (pA > 0.003) {
      const px = V ? cx : w * 0.72;
      const py = V ? h * 0.74 : h * 0.44;
      const pw = V ? w * 0.84 : w * 0.38;
      const ph = m * 0.2;
      const pop = eOutBack(seg(lt, T.avert - 0.3, T.avert + 0.4), 1.4);
      ctx.save();
      ctx.globalAlpha *= pA;
      ctx.translate(px, py);
      ctx.scale(pop, pop);
      rrect(ctx, -pw / 2, -ph / 2, pw, ph, m * 0.02);
      ctx.fillStyle = 'rgba(6,20,16,0.94)';
      ctx.fill();
      ctx.strokeStyle = C.emerald;
      ctx.lineWidth = 2;
      ctx.shadowColor = C.emerald;
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();
      if (pop > 0.92) {
        // pictogramme d'alerte
        const ix = px - pw / 2 + m * 0.07;
        const iy = py;
        const s = m * 0.035;
        glowPath(ctx, [{ x: ix, y: iy - s }, { x: ix + s * 1.1, y: iy + s * 0.85 }, { x: ix - s * 1.1, y: iy + s * 0.85 }, { x: ix, y: iy - s }], 1, { color: C.emerald, width: 3, alpha: pA, head: false });
        drawSprite(ctx, textSprite('!', { size: Math.floor(s * 1.1), weight: 900, color: C.emerald }), ix, iy + s * 0.55, { alpha: pA });
        const tx = ix + m * 0.07;
        mono(ctx, 'AVERTISSEMENT', tx, py - m * 0.055, { size: Math.floor(m * 0.016), color: C.mint, spacing: 6, align: 'left', t: seg(lt, T.avert, T.avert + 0.6), alpha: pA });
        mono(ctx, 'CE PRIX A ÉTÉ FIXÉ PAR UN ALGORITHME', tx, py, { size: Math.floor(m * (V ? 0.019 : 0.018)), color: C.white, spacing: 1, align: 'left', t: seg(lt, T.algo - 0.2, T.algo + 1.2), alpha: pA });
        mono(ctx, "À L'AIDE DE VOS DONNÉES PERSONNELLES", tx, py + m * 0.045, { size: Math.floor(m * (V ? 0.019 : 0.018)), color: C.white, spacing: 1, align: 'left', t: seg(lt, T.donnees - 0.3, T.donnees + 1.0), alpha: pA });
      }
    }

    /* ── ACTE II : faisceaux vers Québec et Ottawa ── */
    const qA = smooth(seg(lt, T.ici - 0.3, T.ici + 0.5)) * gA * endFade;
    if (qA > 0.003) {
      const nyq = P2('newYork');
      const q = P2('quebec');
      const ot = P2('ottawa');
      const beamQ = eInOutQuart(seg(lt, T.ici, T.ici + 1.2));
      glowPath(ctx, quadPts(nyq, q, -m * 0.08, 40), beamQ, { color: C.amber, width: 2.5, alpha: qA });
      const ringA = smooth(seg(lt, T.opposition - 0.2, T.opposition + 0.6));
      if (q.vis) {
        for (let k = 0; k < 3; k++) {
          const ph = ((lt * 0.6 + k / 3) % 1);
          ring(ctx, q.x, q.y, m * (0.03 + ph * 0.08), { color: C.amber, width: 2.5, alpha: qA * ringA * (1 - ph) });
        }
        beacon(ctx, q.x, q.y, { color: C.amber, r: 10, alpha: qA * ringA, time: gt });
        cityTag(ctx, q.x, q.y, 'QUÉBEC', { color: C.amber, t: seg(lt, T.ici, T.ici + 0.8), alpha: qA, side: 'right', size: Math.floor(m * 0.026), time: gt, r: 8 });
        mono(ctx, 'OPC', q.x, q.y - m * 0.085, { size: Math.floor(m * 0.022), color: C.gold, spacing: 8, t: seg(lt, T.opc, T.opc + 0.6), alpha: qA });
      }
      const oA = smooth(seg(lt, T.ottawa - 0.3, T.ottawa + 0.4)) * qA;
      if (oA > 0.003 && ot.vis) {
        glowPath(ctx, quadPts(nyq, ot, m * 0.06, 40), eInOutQuart(seg(lt, T.ottawa, T.ottawa + 1.0)), { color: C.cyan, width: 2, alpha: oA });
        cityTag(ctx, ot.x, ot.y, 'OTTAWA', { color: C.cyan, t: seg(lt, T.ottawa, T.ottawa + 0.8), alpha: oA, side: 'left', size: Math.floor(m * 0.024), time: gt, r: 7 });
      }
    }

    /* ── titres ── */
    const ty = V ? h * 0.15 : h * 0.17;
    const tx = V ? cx : w * 0.72;
    const t1 = 1 - smooth(seg(lt, T.ny - 0.3, T.ny + 0.1));
    kRise(ctx, 'LA RIPOSTE', cx, ty, { size: Math.floor(m * 0.064), weight: 900, t: seg(lt, T.riposte - 0.2, T.riposte + 0.6), alpha: t1 });
    kRise(ctx, "S'ACCÉLÈRE", cx, ty + m * 0.075, { size: Math.floor(m * 0.064), weight: 900, color: C.emerald, t: seg(lt, T.riposte + 0.3, T.riposte + 1.1), alpha: t1, glow: 16, glowColor: rgba(C.emerald, 0.4) });
    mono(ctx, 'AILLEURS EN AMÉRIQUE DU NORD', cx, ty - m * 0.06, { size: Math.floor(m * 0.019), color: C.ice, spacing: 5, t: seg(lt, T.ailleurs, T.ailleurs + 1.0), alpha: t1 });
    const t2 = smooth(seg(lt, T.ny - 0.2, T.ny + 0.4)) * (1 - smooth(seg(lt, T.maryland - 0.5, T.maryland)));
    mono(ctx, 'NEW YORK · OBLIGATOIRE', tx, V ? ty : h * 0.26, { size: Math.floor(m * 0.02), color: C.mint, spacing: 6, t: seg(lt, T.oblige - 0.2, T.oblige + 0.8), alpha: t2 });
    const t3 = smooth(seg(lt, T.maryland - 0.2, T.maryland + 0.4)) * (1 - smooth(seg(lt, T.ici - 0.5, T.ici)));
    kRise(ctx, 'DES LOIS CIBLÉES', tx, V ? ty : h * 0.3, { size: Math.floor(m * 0.052), weight: 900, t: seg(lt, T.lois - 0.2, T.lois + 0.7), alpha: t3, maxW: V ? w * 0.9 : w * 0.4 });
    mono(ctx, 'POUR PROTÉGER LES CONSOMMATEURS EN ALIMENTATION', tx, V ? ty + m * 0.055 : h * 0.3 + m * 0.05, { size: Math.floor(m * (V ? 0.015 : 0.016)), color: C.mint, spacing: 3, t: seg(lt, T.alim - 0.8, T.alim + 0.6), alpha: t3 });
    const t4 = smooth(seg(lt, T.ici - 0.2, T.ici + 0.4)) * (1 - smooth(seg(lt, T.fenetre - 0.5, T.fenetre)));
    const qtx = V ? cx : w * 0.74;
    const qty = V ? h * 0.74 : h * 0.6;
    mono(ctx, "PARTIS D'OPPOSITION → OPC", qtx, qty - m * 0.07, { size: Math.floor(m * 0.018), color: C.gold, spacing: 4, t: seg(lt, T.opposition, T.opc + 0.8), alpha: t4 });
    kRise(ctx, "ENCADRER D'AVANCE", qtx, qty, { size: Math.floor(m * (V ? 0.056 : 0.046)), weight: 900, color: C.amber, t: seg(lt, T.encadrer - 0.1, T.encadrer + 0.8), alpha: t4, glow: 16, glowColor: rgba(C.amber, 0.4), maxW: V ? w * 0.9 : w * 0.42 });
    mono(ctx, 'LA TARIFICATION DYNAMIQUE', qtx, qty + m * 0.05, { size: Math.floor(m * 0.019), color: C.white, spacing: 4, t: seg(lt, T.encadrer + 0.4, T.norme + 0.4), alpha: t4 });
    mono(ctx, 'OTTAWA : PRIX PLANCHER · CIRCULAIRES', qtx, qty + m * 0.1, { size: Math.floor(m * (V ? 0.016 : 0.017)), color: C.cyan, spacing: 3, t: seg(lt, T.plancher - 0.4, T.circ + 0.8), alpha: t4 });

    /* ── ACTE III : la fenêtre s'ouvre ── */
    const fA = smooth(seg(lt, T.fenetre - 0.3, T.fenetre + 0.4));
    if (fA > 0.003) {
      const fx = cx;
      const fy = V ? h * 0.44 : h * 0.42;
      const fw = m * (V ? 0.5 : 0.42);
      const fh = m * (V ? 0.36 : 0.3);
      const open = eInOutQuart(seg(lt, T.fenetre, T.ouverte + 0.8));
      // lumière qui jaillit
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fw);
      lg.addColorStop(0, rgba(C.gold, 0.55 * open * fA));
      lg.addColorStop(1, rgba(C.amber, 0));
      ctx.fillStyle = lg;
      ctx.fillRect(fx - fw * open * 0.5, fy - fh / 2, fw * open, fh);
      ctx.restore();
      light(ctx, fx, fy, fw * 0.9 * open, C.gold, fA * open * 0.5);
      // battants
      [-1, 1].forEach((sd) => {
        const pivotX = fx + sd * fw / 2;
        const ww = (fw / 2) * Math.cos(open * 1.25);
        ctx.save();
        ctx.globalAlpha *= fA;
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 3;
        ctx.shadowColor = C.amber;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(pivotX, fy - fh / 2);
        ctx.lineTo(pivotX - sd * ww, fy - fh / 2 - sd * 0 - fh * 0.06 * open);
        ctx.lineTo(pivotX - sd * ww, fy + fh / 2 + fh * 0.06 * open);
        ctx.lineTo(pivotX, fy + fh / 2);
        ctx.closePath();
        ctx.fillStyle = rgba(C.amber, 0.08);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
      ctx.save();
      ctx.globalAlpha *= fA;
      ctx.strokeStyle = rgba(C.gold, 0.6);
      ctx.lineWidth = 2;
      ctx.strokeRect(fx - fw / 2, fy - fh / 2, fw, fh);
      ctx.restore();
      const ty3 = fy + fh / 2 + m * 0.09;
      kRise(ctx, 'LA FENÊTRE', cx, ty3, { size: Math.floor(m * (V ? 0.07 : 0.06)), weight: 900, t: seg(lt, T.fenetre, T.fenetre + 0.8), alpha: fA });
      kRise(ctx, 'EST OUVERTE', cx, ty3 + m * 0.075, { size: Math.floor(m * (V ? 0.07 : 0.06)), weight: 900, color: C.gold, t: seg(lt, T.ouverte - 0.2, T.ouverte + 0.6), alpha: fA, glow: 20, glowColor: rgba(C.amber, 0.5) });
      mono(ctx, 'AGIR PRÉVENTIVEMENT · MAINTENANT', cx, fy - fh / 2 - m * 0.05, { size: Math.floor(m * 0.019), color: C.ice, spacing: 5, t: seg(lt, T.fenetre + 0.3, T.fenetre + 1.3), alpha: fA });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 13 — rep-conclusion-debat · Option A ou Option B : faut-il interdire les prix algorithmiques ?
 * ════════════════════════════════════════════════════════════════════════ */

/* Acte I   : la boussole FRANC NORD au centre, l'aiguille hésite ; les trois forces orbitent ;
 *            « QUE DOIT FAIRE QUÉBEC ? »
 * Acte II  : un faisceau net scinde l'écran : OPTION A (ambre, bouclier légal) / OPTION B (cyan, concurrence
 *            & anti-gaspillage) ; l'aiguille pivote vers chaque option
 * Acte III : « A OU B ? » en commentaire, partagez, abonnez-vous ; signature FRANC NORD, image finale stable */

function s13_bubble(ctx, x, y, s, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.fillStyle = rgba(color, 0.12);
  ctx.lineWidth = Math.max(2, s * 0.07);
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.35;
  rrect(ctx, x - s * 0.7, y - s * 0.45, s * 1.4, s * 0.8, s * 0.2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y + s * 0.35);
  ctx.lineTo(x - s * 0.45, y + s * 0.62);
  ctx.lineTo(x - s * 0.05, y + s * 0.35);
  ctx.stroke();
  ctx.restore();
}

function sceneConclusionDebat(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    trancher: 'de trancher',
    etiq: 'étiquettes électroniques',
    cartes: 'cartes de fidélité',
    ia: "l'intelligence artificielle",
    gouv: 'que devrait faire le gouvernement',
    annee: 'dès cette année',
    optA: 'Option A :',
    interdire: 'interdire dès maintenant',
    essentiels: 'aliments essentiels',
    transparence: 'transparence totale',
    optB: 'Ou Option B',
    laisser: 'laisser les épiceries',
    gaspillage: 'réduire le gaspillage',
    rabais: 'accélérer les rabais',
    concurrence: 'misant sur la concurrence',
    quinze: 'la règle des quinze dollars',
    ecrivez: 'Écrivez Option A',
    partagez: 'partagez cette enquête',
    abonnez: 'abonnez-vous',
    franc: 'Franc Nord !'
  });

  const splitT = eInOutQuart(seg(lt, T.optA - 0.6, T.optA + 0.4));
  const ctaT = smooth(seg(lt, T.ecrivez - 0.4, T.ecrivez + 0.4));
  const outro = smooth(seg(lt, T.abonnez - 0.3, T.abonnez + 0.8));
  // boussole : centre, taille et orientation de l'aiguille
  const er = m * lerp(V ? 0.15 : 0.14, V ? 0.075 : 0.07, splitT) * lerp(1, V ? 1.9 : 1.75, outro);
  const ex = cx;
  const ey = lerp(V ? h * 0.42 : h * 0.47, cy, splitT) + (V ? -h * 0.06 : -h * 0.07) * outro;
  const hesit = Math.sin(lt * 2.3) * 0.28 * (1 - splitT) * smooth(seg(lt, 0.6, 2));
  const toA = V ? 0 : -Math.PI / 2;
  const toB = V ? Math.PI : Math.PI / 2;
  const swing = track(lt, [
    [T.optA - 0.4, 0],
    [T.optA + 0.6, toA, (x) => eOutBack(x, 1.6)],
    [T.optB - 0.3, toA],
    [T.optB + 0.7, toB, (x) => eOutBack(x, 1.6)],
    [T.ecrivez - 0.2, toB],
    [T.ecrivez + 1.0, 0, eInOutQuart]
  ]) + hesit;

  frame(a, () => {
    dust(ctx, stage, gt, { count: 90, alpha: 0.3, seed: 131 });

    /* ── le faisceau qui scinde l'écran ── */
    const beamA = splitT * (1 - ctaT);
    if (beamA > 0.003) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      if (V) {
        const hw = (w / 2) * beamA;
        const g = ctx.createLinearGradient(cx - hw, 0, cx + hw, 0);
        g.addColorStop(0, rgba(C.white, 0));
        g.addColorStop(0.5, rgba(C.white, 0.95));
        g.addColorStop(1, rgba(C.white, 0));
        ctx.fillStyle = g;
        ctx.fillRect(cx - hw, ey - 1.5, hw * 2, 3);
        const ga = ctx.createLinearGradient(0, ey - h * 0.5, 0, ey);
        ga.addColorStop(0, rgba(C.amber, 0));
        ga.addColorStop(1, rgba(C.amber, 0.09 * beamA));
        ctx.fillStyle = ga;
        ctx.fillRect(0, ey - h * 0.5, w, h * 0.5);
        const gb = ctx.createLinearGradient(0, ey, 0, ey + h * 0.5);
        gb.addColorStop(0, rgba(C.cyan, 0.09 * beamA));
        gb.addColorStop(1, rgba(C.cyan, 0));
        ctx.fillStyle = gb;
        ctx.fillRect(0, ey, w, h * 0.5);
      } else {
        const hh = (h / 2) * beamA;
        const g = ctx.createLinearGradient(0, cy - hh, 0, cy + hh);
        g.addColorStop(0, rgba(C.white, 0));
        g.addColorStop(0.5, rgba(C.white, 0.95));
        g.addColorStop(1, rgba(C.white, 0));
        ctx.fillStyle = g;
        ctx.fillRect(cx - 1.5, cy - hh, 3, hh * 2);
        const ga = ctx.createLinearGradient(0, 0, cx, 0);
        ga.addColorStop(0, rgba(C.amber, 0));
        ga.addColorStop(1, rgba(C.amber, 0.09 * beamA));
        ctx.fillStyle = ga;
        ctx.fillRect(0, 0, cx, h);
        const gb = ctx.createLinearGradient(cx, 0, w, 0);
        gb.addColorStop(0, rgba(C.cyan, 0.09 * beamA));
        gb.addColorStop(1, rgba(C.cyan, 0));
        ctx.fillStyle = gb;
        ctx.fillRect(cx, 0, cx, h);
      }
      ctx.restore();
    }

    /* ── la boussole ── */
    const pulse = 1 + 0.025 * Math.sin(gt * 1.6) * outro;
    light(ctx, ex, ey, er * 3, C.ice, 0.22 + 0.15 * outro);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.scale(pulse, pulse);
    ctx.translate(-ex, -ey);
    emblem(ctx, ex, ey, er, { ringT: seg(lt, 0.1, 1.4), needle: seg(lt, 0.3, 1.2), cardinals: seg(lt, 0.6, 1.6), star: seg(lt, 0.8, 1.8), alpha: 1, time: gt, swing });
    ctx.restore();

    /* ── ACTE I : à vous de trancher ── */
    const iA = 1 - smooth(seg(lt, T.optA - 0.7, T.optA - 0.1));
    if (iA > 0.003) {
      const ty = V ? h * 0.17 : h * 0.18;
      mono(ctx, 'LA QUESTION DU JOUR', cx, ty - m * 0.06, { size: Math.floor(m * 0.02), color: C.coral, spacing: 8, t: seg(lt, 0.2, 1.2), alpha: iA });
      const sw = smooth(seg(lt, T.gouv - 0.3, T.gouv + 0.1));
      kRise(ctx, 'À VOUS DE TRANCHER', cx, ty, { size: Math.floor(m * (V ? 0.066 : 0.064)), weight: 900, t: seg(lt, T.trancher - 0.3, T.trancher + 0.6), out: sw, alpha: iA, maxW: w * 0.9 });
      kRise(ctx, 'QUE DOIT FAIRE QUÉBEC ?', cx, ty, { size: Math.floor(m * (V ? 0.06 : 0.064)), weight: 900, color: C.amber, t: seg(lt, T.gouv, T.gouv + 0.9), alpha: iA * sw, glow: 18, glowColor: rgba(C.amber, 0.4), maxW: w * 0.92 });
      mono(ctx, 'DÈS CETTE ANNÉE', cx, ty + m * 0.055, { size: Math.floor(m * 0.019), color: C.gold, spacing: 7, t: seg(lt, T.annee, T.annee + 0.7), alpha: iA * sw });
      // les trois forces : orbitent puis se rangent
      const forces = [['ÉTIQUETTES ÉLECTRONIQUES', T.etiq, C.cyan], ['CARTES DE FIDÉLITÉ', T.cartes, C.gold], ['INTELLIGENCE ARTIFICIELLE', T.ia, C.violet]];
      const settle = V ? 1 : eInOutQuart(seg(lt, T.ia + 1.2, T.ia + 2.6)); // 9:16 : colonne fixe sous la boussole
      forces.forEach(([lab, k, col], i) => {
        const on = smooth(seg(lt, k - 0.3, k + 0.5));
        if (on <= 0) return;
        const an = -Math.PI / 2 + (i / 3) * TAU + (lt - k) * 0.5;
        const orx = V ? w * 0.2 : m * 0.42;
        const ory = V ? m * 0.24 : m * 0.25;
        const ox = ex + Math.cos(an) * orx;
        const oy = ey + Math.sin(an) * ory;
        const fx = V ? cx : cx + (i - 1) * w * 0.29;
        const fy = V ? h * (0.66 + i * 0.055) : h * 0.76;
        const x = lerp(ox, fx, settle);
        const y = lerp(oy, fy, settle);
        light(ctx, x, y - m * 0.012, m * 0.05, col, iA * on * 0.4);
        const S = textSprite(lab, { size: Math.floor(m * (V ? 0.026 : 0.024)), weight: 800, color: C.white, spacing: 2 });
        drawSprite(ctx, S, x, y, { alpha: iA * on, scale: lerp(0.94, 1, settle) });
        if (settle > 0.5) underline(ctx, x, y + m * 0.018, S.w * 0.6, seg(settle, 0.5, 1), { alpha: iA * on, colorA: col, colorB: col });
      });
    }

    /* ── ACTE II : Option A / Option B ── */
    const opts = [
      {
        k: T.optA, col: C.amber, label: 'OPTION A', t1: 'BOUCLIER LÉGAL', t2: "SUR L'ALIMENTATION",
        pts: [['INTERDIRE LES PRIX DYNAMIQUES', T.interdire], ['SUR LES ALIMENTS ESSENTIELS', T.essentiels], ['TRANSPARENCE TOTALE DES DONNÉES', T.transparence]],
        pos: V ? { x: cx, y: h * 0.17 } : { x: w * 0.25, y: h * 0.25 }
      },
      {
        k: T.optB, col: C.cyan, label: 'OPTION B', t1: 'CONCURRENCE', t2: '& ANTI-GASPILLAGE',
        pts: [['RÉDUIRE LE GASPILLAGE', T.gaspillage], ['ACCÉLÉRER LES RABAIS', T.rabais], ['CONCURRENCE + RÈGLE DES 15 $', T.quinze]],
        pos: V ? { x: cx, y: h * 0.61 } : { x: w * 0.75, y: h * 0.25 }
      }
    ];
    opts.forEach((o, oi) => {
      const oA = smooth(seg(lt, o.k - 0.3, o.k + 0.4)) * (1 - ctaT);
      if (oA <= 0.003) return;
      const active = oi === 0 ? 1 - 0.45 * smooth(seg(lt, T.optB - 0.2, T.optB + 0.6)) : 1;
      const A = oA * active;
      const { x, y } = o.pos;
      kRise(ctx, o.label, x, y, { size: Math.floor(m * (V ? 0.08 : 0.08)), weight: 900, color: o.col, t: seg(lt, o.k - 0.1, o.k + 0.7), alpha: A, glow: 24, glowColor: rgba(o.col, 0.5) });
      kWipe(ctx, o.t1, x, y + m * 0.075, { size: Math.floor(m * (V ? 0.046 : 0.042)), weight: 900, color: C.white, t: seg(lt, o.k + 0.3, o.k + 1.1), alpha: A, edge: o.col, maxW: V ? w * 0.9 : w * 0.44 });
      kWipe(ctx, o.t2, x, y + m * 0.13, { size: Math.floor(m * (V ? 0.046 : 0.042)), weight: 900, color: C.white, t: seg(lt, o.k + 0.6, o.k + 1.4), alpha: A, edge: o.col, maxW: V ? w * 0.9 : w * 0.44 });
      o.pts.forEach(([p, pk], j) => {
        const yy = y + m * (V ? 0.205 : 0.215) + j * m * (V ? 0.05 : 0.058);
        const on = seg(lt, pk - 0.2, pk + 0.6);
        if (on <= 0) return;
        beacon(ctx, x - m * (V ? 0.27 : 0.25), yy - m * 0.008, { color: o.col, r: 5 * eOutBack(on, 2), alpha: A, time: gt, pulse: false });
        kSlide(ctx, p, x - m * (V ? 0.24 : 0.22), yy, { size: Math.floor(m * (V ? 0.024 : 0.022)), weight: 700, color: C.slate, t: on, alpha: A, align: 'left', dir: 'left', maxW: V ? w * 0.7 : w * 0.36 });
      });
    });

    /* ── ACTE III : A ou B ? partagez, abonnez-vous ── */
    if (ctaT > 0.003) {
      const cA = ctaT * (1 - smooth(seg(lt, T.abonnez - 0.5, T.abonnez + 0.1)));
      const ty = V ? h * 0.66 : h * 0.72;
      const ab = kZoom(ctx, 'A OU B ?', cx, ty, { size: Math.floor(m * (V ? 0.11 : 0.1)), weight: 900, color: C.white, t: seg(lt, T.ecrivez - 0.2, T.ecrivez + 0.6), alpha: cA, glow: 20, glowColor: rgba(C.amber, 0.4) });
      s13_bubble(ctx, cx + (ab || m * 0.25) / 2 + m * 0.08, ty - m * 0.05, m * 0.06, C.amber, cA * smooth(seg(lt, T.ecrivez + 0.3, T.ecrivez + 0.9)));
      mono(ctx, 'ÉCRIVEZ-LE EN COMMENTAIRE', cx, ty + m * 0.06, { size: Math.floor(m * 0.021), color: C.gold, spacing: 6, t: seg(lt, T.ecrivez + 0.2, T.ecrivez + 1.2), alpha: cA });
      kWipe(ctx, 'PARTAGEZ CETTE ENQUÊTE', cx, ty + m * 0.13, { size: Math.floor(m * 0.036), weight: 800, color: C.cyan, t: seg(lt, T.partagez - 0.1, T.partagez + 0.8), alpha: cA, edge: C.white, maxW: w * 0.9 });
      // signature finale (stable jusqu'à la fin)
      if (outro > 0.003) {
        const sy = V ? h * 0.66 : h * 0.72;
        kRise(ctx, 'FRANC NORD', cx, sy, { size: Math.floor(m * (V ? 0.1 : 0.095)), weight: 900, color: C.white, t: seg(lt, T.abonnez + 0.2, T.abonnez + 1.2), alpha: outro, spacing: 4, glow: 18, glowColor: rgba(C.ice, 0.3) });
        underline(ctx, cx, sy + m * 0.03, V ? w * 0.6 : w * 0.3, seg(lt, T.abonnez + 0.6, T.abonnez + 1.6), { alpha: outro });
        mono(ctx, "LE MONDE EXPLIQUÉ D'ICI · SANS FILTRE", cx, sy + m * 0.08, { size: Math.floor(m * (V ? 0.02 : 0.021)), color: C.slate, spacing: 6, t: seg(lt, T.franc, T.franc + 1.2), alpha: outro });
        kSlide(ctx, 'ABONNEZ-VOUS', cx, sy + m * 0.15, { size: Math.floor(m * 0.03), weight: 800, color: C.amber, spacing: 6, t: seg(lt, T.abonnez + 0.2, T.abonnez + 0.9), alpha: outro });
      }
    }
  });
}

export const CUSTOM_SCENES = {
  'rep-ouverture-choc': sceneOuvertureScanner,
  'rep-etiquettes-electroniques': sceneEtiquettesAllee,
  'rep-scandale-instacart-23pct': sceneInstacart23,
  'rep-cartes-fidelite-ia-canada': sceneFideliteIA,
  'rep-deux-cotes-etiquettes': sceneDeuxCotesEtiquettes,
  'rep-oligopole-89pct': sceneOligopole89,
  'rep-baux-secrets-concurrence': sceneBauxSecrets,
  'rep-impact-quartiers-quebec': sceneQuartiersQuebec,
  'rep-deux-cotes-baux': sceneDeuxCotesBaux,
  'rep-erreurs-caisse-la-facture': sceneErreursCaisse,
  'rep-regle-15-dollars-opc': sceneRegle15,
  'rep-lois-monde-vs-quebec': sceneLoisAmerique,
  'rep-conclusion-debat': sceneConclusionDebat
};
