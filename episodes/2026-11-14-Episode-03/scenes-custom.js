/**
 * FRANC NORD — Épisode #3 (2026-11-14) — 13 scènes cinématiques plein écran
 * Meta & vos photos · Logement & vie chère · Francophonie & Asie
 * Motion design 100 % code · Canvas 2D · Zéro musique (voix.mp3 seule)
 * Réalisation : Claude Opus 5.5
 *
 * PRINCIPES DE RÉALISATION
 *  • ZÉRO TREMBLEMENT : tout texte animé est rastérisé une seule fois dans un
 *    sprite (taille de police entière et constante), puis déplacé / mis à
 *    l'échelle par drawImage en coordonnées flottantes (filtrage bilinéaire).
 *    Aucun Math.round sur une position ou une taille de texte en mouvement.
 *  • SYNCHRONISATION AU MOT : storyboard.json fournit pour chaque scène
 *    `wordTimes` = [[indexCaractère, secondes], …] issus de la transcription
 *    horodatée de voix.mp3. Chaque temps fort est ancré sur une expression
 *    exacte de la narration (fonction `cues`).
 *  • Coin inférieur droit toujours libre (filigrane YouTube).
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
    return { cv, w, asc, desc, cap, pad, res, size };
  });
}

/**
 * Pose un sprite en coordonnées flottantes.
 * align : 'left' | 'center' | 'right' ; base : 'alphabetic' | 'middle' (milieu des capitales) | 'top'
 */
function drawSprite(ctx, S, x, y, o = {}) {
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

/** Bloc entier qui glisse depuis un masque (direction dir: 'up' | 'down' | 'left' | 'right'). */
function kSlide(ctx, text, x, y, o = {}) {
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
    const lower = raw - Math.floor(raw);
    const frac = !roll ? 0 : k === 0 ? lower : smooth(seg(lower, 0.9, 1));
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

/* ── Lieux de l'épisode 3 ──────────────────────────────────────── */
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
  niamey: [2.11, 13.51]
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
 * SCÈNE 01 — intro-sommaire
 * Acte I   : l'emblème naît dans le noir ; FRANC NORD par masques ; ÉPISODE 03
 * Acte II  : travelling en profondeur à travers 3 plans en parallaxe
 *            (prisme de photos · ligne d'horizon sous tension · arc diplomatique)
 * Acte III : les trois trajectoires convergent vers le Québec
 * ════════════════════════════════════════════════════════════════════════ */

/** Prisme rotatif de vignettes photo (plan 1). */
function photoPrism(ctx, x, y, R, H, time, o = {}) {
  const { alpha = 1, cols = 14, rows = 4, tint = C.amber, suck = 0 } = o;
  if (alpha <= 0.003) return;
  const cards = [];
  const cw = ((TAU * R) / cols) * 0.78;
  const ch = (H / rows) * 0.8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = (c / cols) * TAU + time * 0.22 + r * 0.18;
      const z = Math.cos(a);
      const px = Math.sin(a) * R;
      const py = (r - (rows - 1) / 2) * (H / rows);
      cards.push({ a, z, px, py, v: (r * 7 + c) % 4 });
    }
  }
  cards.sort((p, q) => p.z - q.z);
  ctx.save();
  ctx.globalAlpha *= alpha;
  light(ctx, x, y, R * 1.6, tint, 0.28);
  for (const cd of cards) {
    const depth = (cd.z + 1) / 2;
    const k = 0.55 + 0.45 * depth;
    const sq = Math.max(0.08, Math.abs(Math.cos(cd.a))); // raccourci de face
    const sx = x + cd.px * (1 - suck * 0.85);
    const sy = y + cd.py * k * (1 - suck * 0.85);
    ctx.save();
    ctx.globalAlpha *= (0.18 + 0.82 * depth) * (1 - suck * 0.4);
    ctx.translate(sx, sy);
    ctx.scale(sq * k * (1 - suck * 0.6), k * (1 - suck * 0.6));
    photoCard(ctx, 0, 0, cw, ch, { tint: cd.v % 2 ? tint : C.cyan, variant: cd.v, glow: cd.z > 0.9 ? 0.25 : 0 });
    ctx.restore();
  }
  ctx.restore();
}

/** Ligne d'horizon urbaine en traits fins, câble « sous tension » (plan 2). */
function skylineTension(ctx, x, y, W, H, time, o = {}) {
  const { alpha = 1, rise = 1, tension = 1 } = o;
  if (alpha <= 0.003) return;
  const b = cached('skyline', () => {
    const r = rng(41);
    const arr = [];
    let xx = -0.5;
    while (xx < 0.5) {
      const w = 0.028 + r() * 0.045;
      arr.push({ x: xx, w, h: 0.25 + Math.pow(r(), 1.6) * 0.75, win: r() });
      xx += w + 0.006;
    }
    return arr;
  });
  ctx.save();
  ctx.globalAlpha *= alpha;
  const base = y + H * 0.5;
  light(ctx, x, base, W * 0.6, C.cyan, 0.18);
  for (const bd of b) {
    const bx = x + bd.x * W;
    const bw = bd.w * W;
    const bh = bd.h * H * (0.25 + 0.75 * eOutCubic(rise));
    ctx.fillStyle = 'rgba(8,20,36,0.92)';
    ctx.fillRect(bx, base - bh, bw, bh);
    ctx.strokeStyle = rgba(C.cyan, 0.75);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(bx, base - bh, bw, bh);
    // fenêtres
    const cols = Math.max(2, Math.floor(bw / 9));
    const rowsN = Math.floor(bh / 12);
    const rr = rng(Math.floor(bd.win * 1e6));
    for (let ry = 1; ry < rowsN; ry++) {
      for (let cx = 0; cx < cols; cx++) {
        const v = rr();
        if (v > 0.62) {
          ctx.fillStyle = v > 0.9 ? rgba(C.amber, 0.85) : rgba(C.ice, 0.35);
          ctx.fillRect(bx + 3 + cx * ((bw - 6) / cols), base - bh + ry * 12, Math.max(1.5, (bw - 6) / cols - 3), 4);
        }
      }
    }
  }
  // câble sous tension : onde stationnaire ambre / corail
  const amp = H * 0.05 * tension;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass ? rgba(C.white, 0.7) : rgba(C.amber, 0.9);
    ctx.lineWidth = pass ? 1.2 : 3;
    ctx.shadowColor = C.amber;
    ctx.shadowBlur = pass ? 0 : 16;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const yy = base - H * 0.86 + Math.sin(u * Math.PI) * H * 0.08 + Math.sin(u * TAU * 6 + time * 9) * amp * Math.sin(u * Math.PI);
      if (i === 0) ctx.moveTo(x - W * 0.52 + u * W * 1.04, yy);
      else ctx.lineTo(x - W * 0.52 + u * W * 1.04, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
  // sol
  ctx.fillStyle = rgba(C.cyan, 0.5);
  ctx.fillRect(x - W * 0.55, base, W * 1.1, 1.5);
  ctx.restore();
}

/** Arc diplomatique Québec → Phnom Penh sur une carte en pointillés (plan 3). */
function diploArc(ctx, x, y, W, t, time, o = {}) {
  const { alpha = 1 } = o;
  if (alpha <= 0.003) return;
  const scale = W / 200;
  const Pj = makeFlat(18, 22, scale, x, y);
  ctx.save();
  ctx.globalAlpha *= alpha;
  const dots = regionDots('wide', -128, 160, -38, 66, 2.2);
  drawDots(ctx, Pj, dots, { color: C.emerald, size: scale * 1.15, alpha: 0.55 });
  const a = Pj.project(...P('quebec'));
  const b = Pj.project(...P('phnomPenh'));
  const pts = quadPts(a, b, -W * 0.16, 90);
  glowPath(ctx, pts, eInOutQuart(t), { color: C.emerald, width: 3.2 });
  beacon(ctx, a.x, a.y, { color: C.cyan, r: 7, time, alpha: 1 });
  beacon(ctx, b.x, b.y, { color: C.emerald, r: 8 * clamp(t * 1.5 - 0.4), time, alpha: clamp(t * 2 - 0.6) });
  ctx.restore();
  return { a, b };
}

function sceneIntro(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const T = cues(scene, {
    franc: 'Franc Nord',
    monde: 'décortique',
    filtre: 'sans filtre',
    somm: 'Au sommaire',
    trois: 'troisième',
    abord: "d'abord",
    meta: 'Meta',
    g12: 'un virgule deux',
    vingt: 'vingt millions',
    ensuite: 'Ensuite',
    portugal: 'Portugal',
    logement: 'logement',
    enfin: 'Enfin',
    cambodge: 'Cambodge',
    quebec: 'Québec se',
    ottawa: "différemment d'Ottawa"
  });
  const D = scene.duration;

  frame(a, () => {
    dust(ctx, stage, gt, { count: 130, alpha: 0.5 });

    /* ── ACTE I : emblème + titre ── */
    const actI = 1 - smooth(seg(lt, T.abord - 0.9, T.abord + 0.2));
    if (actI > 0.003) {
      const er = m * (V ? 0.2 : 0.17);
      const ey = V ? h * 0.36 : cy - m * 0.12;
      // méridien qui descend du ciel
      const mer = seg(lt, 0.05, 1.1);
      if (lt < 3) {
        ctx.save();
        ctx.globalAlpha *= (1 - smooth(seg(lt, 1.5, 2.8))) * actI;
        const yEnd = lerp(0, ey - er * 1.04, eOutExpo(mer));
        const g = ctx.createLinearGradient(0, 0, 0, yEnd);
        g.addColorStop(0, rgba(C.ice, 0));
        g.addColorStop(1, rgba(C.white, 0.9));
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, yEnd);
        ctx.stroke();
        ctx.restore();
      }
      // globe pointillé dans l'anneau (comme le logo officiel)
      const gA = smooth(seg(lt, 1.2, 3.0)) * actI;
      if (gA > 0.01) {
        const G = makeGlobe(-40 + gt * 5, 20, er * 0.88, cx, ey);
        drawGlobe(ctx, G, { dot: Math.max(1.4, er * 0.016), alpha: gA * 0.85, rim: false, grat: false, ocean: false, atmo: 0.6, step: 1.6, dotAlpha: 1 });
      }
      // l'emblème recule légèrement à l'annonce du sommaire (dolly arrière)
      const pull = eInOutQuart(seg(lt, T.somm - 0.2, T.somm + 1.4));
      ctx.save();
      ctx.translate(cx, ey);
      ctx.scale(1 - pull * 0.16, 1 - pull * 0.16);
      ctx.translate(-cx, -ey);
      emblem(ctx, cx, ey, er, {
        star: seg(lt, 0.7, 1.6),
        ringT: seg(lt, 1.0, 2.3),
        needle: seg(lt, 1.6, 2.5),
        cardinals: seg(lt, 2.0, 3.0),
        time: gt,
        alpha: actI
      });
      ctx.restore();

      const ty = ey + er * (V ? 2.05 : 1.95);
      const tSize = Math.floor(m * (V ? 0.13 : 0.11));
      kRise(ctx, 'FRANC NORD', cx, ty, { size: tSize, weight: 800, t: seg(lt, T.franc - 0.1, T.franc + 1.3), spacing: Math.floor(m * 0.008), alpha: actI, maxW: w * 0.86, out: seg(lt, T.abord - 0.9, T.abord - 0.1) });
      underline(ctx, cx, ty + m * 0.035, m * (V ? 0.5 : 0.36), seg(lt, T.franc + 0.7, T.franc + 1.8), { alpha: actI });
      const subY = ty + m * 0.09;
      const swap = smooth(seg(lt, T.filtre - 0.3, T.filtre + 0.1));
      mono(ctx, "LE MONDE EXPLIQUÉ D'ICI", cx, subY, { size: Math.floor(m * 0.022), t: seg(lt, T.monde, T.monde + 1.4), alpha: actI * (1 - swap), color: C.slate });
      mono(ctx, 'SANS FILTRE · SANS COMMANDITAIRE', cx, subY, { size: Math.floor(m * 0.022), t: seg(lt, T.filtre, T.filtre + 1.5), alpha: actI * swap, color: C.amber });

      // ÉPISODE 03 : compteur roulant 00 → 03
      const epA = env(lt, T.somm - 0.1, T.abord + 0.1, 0.4, 0.6);
      if (epA > 0.003) {
        const ey2 = subY + m * (V ? 0.13 : 0.1);
        mono(ctx, 'ÉPISODE', cx - m * (V ? 0.07 : 0.055), ey2, { size: Math.floor(m * 0.024), color: C.ice, alpha: epA, t: seg(lt, T.somm, T.somm + 0.7), cursor: false, align: 'right' });
        odometer(ctx, 3 * eInOutQuart(seg(lt, T.somm + 0.2, T.trois + 0.6)), cx - m * (V ? 0.05 : 0.04), ey2 + m * 0.03, {
          size: Math.floor(m * 0.075), weight: 800, color: C.amber, align: 'left', glow: 18, glowColor: rgba(C.amber, 0.6), alpha: epA, prefix: '0'
        });
      }
    }

    /* ── ACTE II : travelling en profondeur à travers trois plans ── */
    const cz = track(lt, [
      [0, -1.6],
      [T.abord - 0.6, -1.6],
      [T.abord + 0.9, 0, eInOutExpo],
      [T.ensuite - 0.5, 0.14, (x) => x],
      [T.ensuite + 0.8, 1.0, eInOutExpo],
      [T.enfin - 0.5, 1.13, (x) => x],
      [T.enfin + 0.8, 2.0, eInOutExpo],
      [D, 2.16, (x) => x]
    ]);
    const planeA = smooth(seg(lt, T.abord - 1.0, T.abord + 0.2));
    if (planeA > 0.003) {
      const planes = [
        { z: 1, ox: V ? 0 : -0.1, oy: V ? -0.06 : 0, col: C.amber },
        { z: 2, ox: V ? 0 : 0.12, oy: V ? 0.04 : 0.02, col: C.cyan },
        { z: 3, ox: V ? 0 : -0.04, oy: V ? 0 : 0.0, col: C.emerald }
      ];
      // dessin de l'arrière vers l'avant
      for (let i = planes.length - 1; i >= 0; i--) {
        const pl = planes[i];
        const dist = pl.z - cz;
        if (dist <= 0.18) continue;
        const s = 1 / dist;
        const al = planeA * smooth(seg(dist, 0.22, 0.6)) * (0.25 + 0.75 * smooth(seg(s, 0.3, 0.9)));
        if (al <= 0.003) continue;
        // parallaxe : décalage latéral qui converge vers le centre quand on approche
        // parallaxe : les plans lointains sont décalés ; le plan cadré revient au centre
        const lat = clamp(dist - 1, 0, 1.5);
        const px = cx + pl.ox * w * lat;
        const py = cy + pl.oy * h * lat - (V ? h * 0.1 : h * 0.085);
        ctx.save();
        ctx.globalAlpha *= al;
        ctx.translate(px, py);
        ctx.scale(s, s);
        if (i === 0) {
          photoPrism(ctx, 0, 0, m * (V ? 0.32 : 0.3), m * 0.42, gt, { tint: C.amber, suck: 0 });
        } else if (i === 1) {
          skylineTension(ctx, 0, 0, m * (V ? 0.9 : 1.15), m * 0.46, gt, { rise: seg(lt, T.ensuite - 0.4, T.ensuite + 1.6), tension: 0.4 + 0.6 * smooth(seg(lt, T.logement - 1, T.logement + 0.5)) });
        } else {
          diploArc(ctx, 0, 0, m * (V ? 0.95 : 1.2), seg(lt, T.enfin + 0.2, T.cambodge + 1.2), gt);
        }
        ctx.restore();
      }

      // Légendes en espace écran, actives quand le plan est cadré
      const capY = V ? h * 0.69 : h * 0.8;
      const big = Math.floor(m * (V ? 0.085 : 0.072));
      const sub = Math.floor(m * 0.024);
      const cap = (i, k0, k1, num, title, color, extra) => {
        const al = env(lt, k0, k1, 0.35, 0.45);
        if (al <= 0.003) return;
        const out = seg(lt, k1 - 0.45, k1);
        mono(ctx, num, cx, capY - big * 1.15, { size: sub, color, t: seg(lt, k0, k0 + 0.6), alpha: al });
        kRise(ctx, title, cx, capY, { size: big, weight: 800, t: seg(lt, k0 + 0.1, k0 + 1.1), out, alpha: al, maxW: w * 0.9 });
        if (extra) extra(al, out);
      };
      cap(0, T.abord + 0.2, T.ensuite, '01 · ROME → MENLO PARK', 'META', C.amber, (al) => {
        // compteur 1,2 G$ puis 20 M de photos
        const cy2 = capY + big * 1.05;
        const g12 = env(lt, T.g12 - 0.2, T.vingt - 0.1, 0.3, 0.3);
        odometer(ctx, 1.2 * eOutCubic(seg(lt, T.g12 - 0.2, T.g12 + 1.4)), cx, cy2, { size: Math.floor(big * 0.62), weight: 700, dec: 1, suffix: 'G$ D’AMENDE', suffixScale: 0.5, color: C.amber, suffixColor: C.slate, alpha: al * g12 });
        const v20 = env(lt, T.vingt - 0.1, T.ensuite, 0.3, 0.4);
        odometer(ctx, 20 * eOutCubic(seg(lt, T.vingt - 0.1, T.vingt + 1.3)), cx, cy2, { size: Math.floor(big * 0.62), weight: 700, suffix: 'MILLIONS D’USAGERS', suffixScale: 0.5, color: C.amber, suffixColor: C.slate, alpha: al * v20 });
      });
      cap(1, T.ensuite + 0.2, T.enfin, '02 · LISBONNE · PARIS', 'LOGEMENT', C.cyan, (al) => {
        kWords(ctx, ['PORTUGAL', '·', 'FRANCE', '·', 'VIE', 'CHÈRE'], cx, capY + big * 0.95, { size: Math.floor(big * 0.4), weight: 700, color: C.slate, time: lt, times: [T.portugal, T.portugal + 0.3, T.portugal + 0.7, T.logement - 0.2, T.logement + 1.4, T.logement + 1.6], alpha: al });
      });
      cap(2, T.enfin + 0.2, D + 1, '03 · PHNOM PENH · CAMBODGE', 'FRANCOPHONIE', C.emerald, (al) => {
        const q = seg(lt, T.quebec, T.quebec + 0.9);
        kWipe(ctx, 'QUÉBEC  ≠  OTTAWA ?', cx, capY + big * 0.95, { size: Math.floor(big * 0.42), weight: 800, color: C.white, t: q, alpha: al, edge: C.emerald });
      });

      // ACTE III : les trajectoires ambre et cyan rejoignent le Québec (sur le plan 3)
      const conv = seg(lt, T.quebec - 0.4, T.ottawa + 0.6);
      if (conv > 0) {
        const dist = 3 - cz;
        const s = 1 / Math.max(0.2, dist);
        const W3 = m * (V ? 0.95 : 1.2);
        const Pj = makeFlat(18, 22, W3 / 200, 0, 0);
        const q = Pj.project(...P('quebec'));
        const qx = cx + q.x * s + planes[2].ox * w * clamp(dist - 1, 0, 1.5);
        const qy = cy + q.y * s - (V ? h * 0.1 : h * 0.085);
        [
          [C.amber, -1],
          [C.cyan, 1]
        ].forEach(([col, sgn], k) => {
          const from = { x: sgn < 0 ? -w * 0.1 : w * 1.1, y: V ? h * 0.2 : h * 0.15 };
          const pts = quadPts(from, { x: qx, y: qy }, sgn * m * 0.25, 60);
          glowPath(ctx, pts, eInOutQuart(seg(conv, k * 0.15, 0.85 + k * 0.15)), { color: col, width: 2.6, alpha: 0.9 });
        });
        if (conv > 0.8) shockwave(ctx, qx, qy, m * 0.08, gt, { color: C.white, alpha: smooth(seg(conv, 0.8, 1)) * 0.8, count: 2 });
      }
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 02 — d1-fait-declencheur · Meta frappé de 805 M€ (≈ 1,2 G$ CA)
 * Acte I   : plongée zénithale sur l'Italie, Rome s'allume, 805 M€ monumental
 * Acte II  : 20 millions de photos (mosaïque) aspirées vers le noyau Meta
 * Acte III : le bouclier de l'ONU tranche net le faisceau d'aspiration
 * ════════════════════════════════════════════════════════════════════════ */

/** Noyau algorithmique : anneaux hexagonaux contrarotatifs + cœur incandescent. */
function algoCore(ctx, x, y, r, time, o = {}) {
  const { alpha = 1, energy = 0.5, color = C.amber } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  light(ctx, x, y, r * (2.4 + energy * 1.6), color, 0.35 + energy * 0.4);
  for (let k = 0; k < 4; k++) {
    const rr = r * (0.42 + k * 0.2);
    const rot = time * (k % 2 ? -0.35 : 0.25) * (1 + energy) + k;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * TAU;
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.strokeStyle = k === 3 ? rgba(C.white, 0.35) : rgba(color, 0.55 + 0.15 * k);
    ctx.lineWidth = k === 0 ? 3 : 1.6;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.setLineDash(k === 2 ? [6, 10] : []);
    ctx.stroke();
    // nœuds aux sommets
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.fillStyle = k % 2 ? C.white : color;
      ctx.fillRect(Math.cos(a) * rr - 2.5, Math.sin(a) * rr - 2.5, 5, 5);
    }
    ctx.restore();
  }
  // cœur
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.36);
  g.addColorStop(0, rgba(C.white, 0.95));
  g.addColorStop(0.35, rgba(color, 0.85));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.36 * (1 + 0.06 * Math.sin(time * 4) * energy), 0, TAU);
  ctx.fill();
  ctx.restore();
}

const ITALY = [
  [7.5, 43.8, 8.8, 44.4, 10.2, 43.9, 11, 42.6, 12.2, 41.8, 13.6, 41.2, 14.6, 40.6, 15.6, 40, 15.8, 38, 16.6, 38.4, 17.2, 39, 16.6, 39.6, 17.2, 40.4, 18.5, 40.1, 18.4, 40.6, 16, 41.4, 14.8, 42.0, 13.6, 43.4, 12.4, 44.4, 12.4, 45.4, 13.8, 45.7, 13.4, 46.5, 12, 47, 10.5, 46.9, 9, 46.4, 7, 45.9, 6.8, 44.5],
  [12.4, 38, 15.6, 38.2, 15.1, 36.7],
  [8.4, 39, 8.2, 41, 9.6, 41, 9.8, 39.2]
];
const inItaly = (lo, la) => ITALY.some((poly) => insidePoly(lo, la, poly));

function sceneMetaFine(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    italie: 'Italie',
    amende: 'amende historique',
    e805: 'huit cent cinq',
    cad: 'un virgule deux',
    meta: 'Meta,',
    fb: 'Facebook',
    motif: 'Le motif',
    photos: 'photos personnelles',
    vingt: 'vingt millions',
    sans: 'sans les en informer',
    onu: 'Nations unies',
    haut: 'Haut-Commissaire',
    limites: 'limites strictes',
    algo: 'algorithmes autonomes',
    machines: 'les machines',
    controle: 'contrôle démocratique'
  });

  // Monde : Rome = origine (px). Le noyau Meta est posé à droite (paysage) ou au-dessus (portrait).
  const scale = (V ? 0.05 : 0.056) * h;
  const Pj = makeFlat(12.5, 41.9, scale, 0, 0);
  const core = V ? { x: m * 0.05, y: -m * 0.9 } : { x: m * 0.74, y: -m * 0.1 };
  const shieldW = { x: lerp(0, core.x, 0.55), y: lerp(0, core.y, 0.55) };

  const cam = trackV(lt, [
    [0, V ? [0, -m * 0.1, 0.42] : [m * 0.1, 0, 0.5]],
    [T.amende + 0.6, V ? [0, -m * 0.05, 1.0] : [0, -m * 0.02, 1.0], eInOutQuart],
    [T.meta - 0.3, V ? [0, -m * 0.08, 1.06] : [m * 0.03, -m * 0.03, 1.06], (x) => x],
    [T.fb + 0.6, V ? [core.x * 0.5, core.y * 0.5, 0.78] : [core.x * 0.5, core.y * 0.5, 0.82], eInOutQuart],
    [T.onu - 0.4, V ? [core.x * 0.45, core.y * 0.45, 0.82] : [core.x * 0.48, core.y * 0.48, 0.86], (x) => x],
    [T.haut + 0.8, V ? [shieldW.x, shieldW.y, 1.0] : [shieldW.x, shieldW.y, 1.05], eInOutQuart],
    [D, V ? [core.x * 0.45, core.y * 0.45, 0.8] : [core.x * 0.45, core.y * 0.45, 0.84], eInOutQuart]
  ]);
  const [fx, fy, zm] = cam;
  const toS = (x, y) => camPt(stage, fx, fy, zm, x, y);

  // Particules-photos : sous-ensemble des points de l'Italie
  const dots = regionDots('itaWide', -14, 52, 24, 62, 0.17);
  const parts = cached('metaParts', () => {
    const r = rng(805);
    const arr = [];
    for (let i = 0; i < dots.length; i += 2) {
      const lo = dots[i];
      const la = dots[i + 1];
      if (inItaly(lo, la)) arr.push({ lo, la, d: r(), lift: (r() - 0.5) * 0.6, s: 2.6 + r() * 3.4, f: r() * TAU });
    }
    return arr;
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 90, alpha: 0.35, camX: fx, camY: fy });
    const rome = toS(0, 0);
    const coreS = toS(core.x, core.y);
    const shS = toS(shieldW.x, shieldW.y);

    camera(ctx, stage, fx, fy, zm, () => {
      // carte zénithale en pointillés
      const itA = smooth(seg(lt, T.italie, T.italie + 1.5)) * (1 - 0.7 * smooth(seg(lt, T.photos - 0.3, T.photos + 0.8)));
      const hlItaly = (lo, la) => (inItaly(lo, la) ? 0.8 * itA : 0);
      drawDots(ctx, Pj, dots, { color: C.cyan, size: scale * 0.06, alpha: 0.85 - 0.25 * smooth(seg(lt, T.italie, T.italie + 1.5)), hl: hlItaly, hlColor: C.ice });
      for (const poly of ITALY) polyStroke(ctx, Pj, poly, { color: C.ice, alpha: 0.5 * itA, width: 1.2 / zm, glow: 8 });
      // graticule fin
      ctx.save();
      ctx.strokeStyle = rgba(C.ice, 0.06);
      ctx.lineWidth = 1 / zm;
      ctx.beginPath();
      for (let lo = -5; lo <= 30; lo += 5) {
        const a1 = Pj.project(lo, 33);
        const a2 = Pj.project(lo, 53);
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
      }
      for (let la = 35; la <= 52; la += 5) {
        const a1 = Pj.project(-5, la);
        const a2 = Pj.project(30, la);
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Rome : point focal ambre + ondes
    const romeA = smooth(seg(lt, T.italie + 0.5, T.italie + 1.3));
    beacon(ctx, rome.x, rome.y, { color: C.amber, r: 9, alpha: romeA, time: gt });
    shockwave(ctx, rome.x, rome.y, m * 0.16, gt, { color: C.amber, alpha: romeA * env(lt, T.amende - 0.5, T.photos, 0.5, 1.0), count: 3, period: 2.6 });
    cityTag(ctx, rome.x, rome.y, 'ROME', { color: C.amber, t: seg(lt, T.italie + 0.8, T.italie + 1.8), alpha: 1 - smooth(seg(lt, T.photos - 0.5, T.photos)), side: 'left', size: Math.floor(m * 0.022), time: gt });

    // ACTE I : 805 M€ monumental projeté depuis Rome
    const aI = env(lt, T.e805 - 0.4, T.meta + 0.3, 0.4, 0.6);
    if (aI > 0.003) {
      const bx = V ? cx : rome.x + m * 0.36;
      const by = V ? h * 0.66 : rome.y - m * 0.02;
      // filament reliant Rome au chiffre
      ctx.save();
      ctx.globalAlpha *= aI * 0.7;
      ctx.strokeStyle = rgba(C.amber, 0.6);
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(rome.x, rome.y);
      ctx.lineTo(V ? bx : bx - m * 0.2, by - m * 0.06);
      ctx.stroke();
      ctx.restore();
      const big = Math.floor(m * (V ? 0.17 : 0.15));
      const v = 805 * eOutExpo(seg(lt, T.e805 - 0.2, T.e805 + 1.8));
      const up = eInOutQuart(seg(lt, T.cad - 0.3, T.cad + 0.5));
      ctx.save();
      ctx.translate(bx, by - up * big * 0.42);
      ctx.scale(1 - up * 0.42, 1 - up * 0.42);
      odometer(ctx, v, V ? 0 : -m * 0.02, 0, { size: big, weight: 900, color: C.white, align: V ? 'center' : 'left', suffix: 'M€', suffixScale: 0.55, suffixColor: C.amber, glow: 24, glowColor: rgba(C.amber, 0.45), alpha: aI });
      ctx.restore();
      mono(ctx, 'AMENDE HISTORIQUE · ITALIE', V ? bx : bx - m * 0.02, by - big * 1.05 - up * big * 0.15, { size: Math.floor(m * 0.02), color: C.amber, t: seg(lt, T.amende, T.amende + 1.2), alpha: aI, align: V ? 'center' : 'left' });
      // conversion en dollars canadiens
      const cA = smooth(seg(lt, T.cad - 0.1, T.cad + 0.4));
      if (cA > 0.003) {
        const sz = Math.floor(big * 0.62);
        odometer(ctx, 1.2 * eOutCubic(seg(lt, T.cad, T.cad + 1.4)), V ? bx : bx - m * 0.02, by + sz * 0.62, { prefix: '≈', size: sz, weight: 800, dec: 1, color: C.amber, align: V ? 'center' : 'left', suffix: 'G$ CA', suffixScale: 0.5, suffixColor: C.slate, alpha: aI * cA, glow: 16, glowColor: rgba(C.amber, 0.4) });
      }
    }

    // Noyau Meta
    const coreA = smooth(seg(lt, T.meta - 0.4, T.meta + 0.8));
    const absorbed = smooth(seg(lt, T.vingt, T.onu + 2));
    const cut = smooth(seg(lt, T.haut, T.limites + 0.4));
    algoCore(ctx, coreS.x, coreS.y, m * 0.13 * zm, gt, { alpha: coreA, energy: 0.3 + absorbed * 0.7 * (1 - cut * 0.6) });
    const lblA = coreA * (1 - smooth(seg(lt, T.onu - 0.5, T.onu)));
    kRise(ctx, 'META', coreS.x, coreS.y + m * 0.2 * zm + m * 0.03, { size: Math.floor(m * 0.06), weight: 900, t: seg(lt, T.meta - 0.2, T.meta + 0.9), alpha: lblA, spacing: 6 });
    kWords(ctx, ['FACEBOOK', '·', 'INSTAGRAM'], coreS.x, coreS.y + m * 0.2 * zm + m * 0.075, { size: Math.floor(m * 0.022), weight: 700, color: C.ice, time: lt, times: [T.fb, T.fb + 0.25, T.fb + 0.6], alpha: lblA });

    // ACTE II : aspiration des photos
    // Flux continu : chaque photo part de l'Italie, traverse le faisceau et rejoint le noyau,
    // puis recommence. Après la coupe (tc), toute photo qui n'a pas franchi le bouclier s'y écrase.
    const flowStart = T.vingt + 0.2;
    const tc = T.haut + 0.35;
    const period = 3.2;
    const uSh = 0.55;
    const emit = smooth(seg(lt, flowStart, flowStart + 1.5));
    if (lt > T.photos - 0.5) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const pt of parts) {
        const q = Pj.project(pt.lo, pt.la);
        const lit = smooth(seg(lt, T.photos - 0.4 + pt.d * 0.8, T.photos + 0.1 + pt.d * 0.8)) * (0.75 + 0.25 * Math.sin(gt * 5 + pt.f));
        if (lit <= 0.01) continue;
        let u = 0;
        let fade = 1;
        if (lt > flowStart) {
          const ph = (lt - flowStart) / period - pt.d;
          if (ph > 0) {
            const cyc = Math.floor(ph);
            u = eInOutQuart(ph - cyc);
            const tCross = flowStart + (cyc + pt.d + 0.5) * period; // instant approximatif du passage au bouclier
            if (lt > tc && tCross > tc && u > uSh - 0.05) {
              const over = (u - (uSh - 0.05)) / (1 - uSh + 0.05);
              u = uSh - 0.05 + over * 0.02;
              fade = 1 - smooth(over * 3);
            }
            if (lt > tc + period && tCross > tc) u = Math.min(u, uSh - 0.03);
          }
        }
        // le flux ralentit et s'éteint après la coupe (les photos restent au pays)
        const stop = smooth(seg(lt, tc + period * 0.9, tc + period * 1.6));
        if (stop > 0) u = lerp(u, 0, stop);
        const sx0 = q.x;
        const sy0 = q.y;
        const ex = core.x;
        const ey = core.y;
        const mx = lerp(sx0, ex, 0.5) + pt.lift * m * 0.6 * (V ? 1 : 0.4);
        const my = lerp(sy0, ey, 0.5) + pt.lift * m * 0.6 * (V ? 0 : 1);
        const uu = 1 - u;
        const wx = uu * uu * sx0 + 2 * uu * u * mx + u * u * ex;
        const wy = uu * uu * sy0 + 2 * uu * u * my + u * u * ey;
        const s = toS(wx, wy);
        const sz = pt.s * zm * (1 - u * 0.55);
        ctx.globalAlpha = lit * fade * (u > 0 ? emit : 1) * (0.5 + 0.5 * (1 - u));
        ctx.fillStyle = pt.d > 0.7 ? C.cyan : C.amber;
        ctx.fillRect(s.x - sz / 2, s.y - sz / 2, sz, sz);
      }
      ctx.restore();
    }
    {
      // compteur 20 000 000
      const cA = env(lt, T.vingt - 0.3, T.onu, 0.4, 0.6);
      const px = V ? cx : w * 0.27;
      const py = V ? h * 0.76 : h * 0.8;
      odometer(ctx, 20000000 * eOutQuint(seg(lt, T.vingt - 0.2, T.vingt + 1.4)), px, py, { size: Math.floor(m * 0.085), weight: 800, color: C.white, alpha: cA, glow: 14, glowColor: rgba(C.amber, 0.5) });
      mono(ctx, 'PHOTOS D’UTILISATEURS', px, py + m * 0.05, { size: Math.floor(m * 0.022), color: C.amber, t: seg(lt, T.vingt + 0.3, T.vingt + 1.3), alpha: cA });
      kWipe(ctx, 'SANS CONSENTEMENT CLAIR', px, py + m * 0.11, { size: Math.floor(m * 0.032), weight: 800, color: C.coral, t: seg(lt, T.sans, T.sans + 1.0), alpha: cA, edge: C.coral });
    }

    // ACTE III : bouclier ONU qui tranche le faisceau
    const shA = smooth(seg(lt, T.onu - 0.2, T.onu + 0.6));
    if (shA > 0.003) {
      const drop = spring(lt - T.onu, 7, 12);
      const ss = m * 0.11 * zm;
      const ang = Math.atan2(core.y, core.x);
      ctx.save();
      ctx.translate(shS.x, shS.y - (1 - drop) * m * 0.3);
      ctx.rotate(ang);
      // lame de coupe perpendiculaire au faisceau
      const blade = eOutExpo(seg(lt, T.haut, T.haut + 0.6));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(C.cyan, 0.9 * blade);
      ctx.shadowColor = C.cyan;
      ctx.shadowBlur = 30;
      ctx.fillRect(-2, -m * 0.2 * blade, 4, m * 0.4 * blade);
      ctx.restore();
      ctx.restore();
      shield(ctx, shS.x, shS.y - (1 - drop) * m * 0.3, ss, { color: C.cyan, alpha: shA, draw: seg(lt, T.onu, T.onu + 1.2), time: gt });
      if (cut > 0.2) shockwave(ctx, shS.x, shS.y, m * 0.12, gt, { color: C.cyan, alpha: cut * 0.5, count: 2, period: 1.8 });
      // légendes ONU
      const lx = V ? cx : shS.x;
      const ly = V ? h * 0.72 : shS.y + m * 0.29;
      mono(ctx, 'ONU · HAUT-COMMISSAIRE AUX DROITS DE L’HOMME', lx, ly - m * 0.055, { size: Math.floor(m * 0.019), color: C.ice, t: seg(lt, T.haut, T.haut + 1.6), alpha: shA });
      kRise(ctx, 'LIMITES AUX ALGORITHMES', lx, ly + m * 0.01, { size: Math.floor(m * (V ? 0.05 : 0.045)), weight: 800, t: seg(lt, T.limites, T.limites + 1.2), alpha: shA, maxW: w * 0.9 });
      kWipe(ctx, 'CONTRÔLE DÉMOCRATIQUE', lx, ly + m * 0.07, { size: Math.floor(m * 0.028), weight: 700, color: C.cyan, t: seg(lt, T.machines, T.machines + 1.0), alpha: shA, edge: C.cyan });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 03 — d1-coulisses-geopolitiques · Pourquoi nos photos valent de l'or
 * Acte I   : anatomie — vacances · visages · publications → « le nerf de la guerre »
 * Acte II  : le réservoir de texte public se vide ; les milliards d'images
 *            traversent l'Atlantique vers les monolithes d'entraînement
 * Acte III : la muraille réglementaire européenne s'élève ; Washington protège
 *            ses champions face à la Chine
 * ════════════════════════════════════════════════════════════════════════ */

/** Visage en maillage low-poly (reconnaissance faciale). */
function faceMesh(ctx, x, y, s, o = {}) {
  const { t = 1, alpha = 1, color = C.cyan, time = 0, scan = 0 } = o;
  if (alpha <= 0.003 || t <= 0) return;
  const pts = cached('facePts', () => {
    const out = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU - Math.PI / 2;
      out.push([Math.cos(a) * 0.78 * (1 - 0.12 * Math.max(0, Math.sin(a))), Math.sin(a) * 1.0 + (Math.sin(a) > 0.5 ? 0.06 : 0)]);
    }
    out.push([-0.34, -0.12], [-0.2, -0.16], [-0.06, -0.12], [0.06, -0.12], [0.2, -0.16], [0.34, -0.12]); // yeux / sourcils
    out.push([0, 0.0], [-0.1, 0.24], [0.1, 0.24], [0, 0.3]); // nez
    out.push([-0.26, 0.5], [0, 0.44], [0.26, 0.5], [0, 0.58]); // bouche
    return out;
  });
  const edges = cached('faceEdges', () => {
    const e = [];
    for (let i = 0; i < 18; i++) e.push([i, (i + 1) % 18]);
    const inner = [[18, 19], [19, 20], [21, 22], [22, 23], [20, 24], [21, 24], [24, 25], [24, 26], [25, 27], [26, 27], [27, 29], [28, 29], [29, 30], [28, 31], [30, 31], [18, 2], [23, 16], [25, 28], [26, 30], [18, 25], [23, 26], [0, 20], [0, 21], [6, 31], [12, 31], [4, 18], [14, 23]];
    return e.concat(inner);
  });
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  const n = edges.length;
  ctx.strokeStyle = rgba(color, 0.8);
  ctx.lineWidth = Math.max(1, s * 0.012);
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  edges.forEach(([i, j], k) => {
    const lt = clamp(t * 1.4 - (k / n) * 0.4);
    if (lt <= 0) return;
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[j];
    ctx.moveTo(x1 * s, y1 * s);
    ctx.lineTo(lerp(x1, x2, lt) * s, lerp(y1, y2, lt) * s);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;
  pts.forEach(([px, py], i) => {
    const lt = clamp(t * 1.6 - (i / pts.length) * 0.6);
    if (lt <= 0) return;
    ctx.fillStyle = i >= 18 ? C.white : color;
    const r = (i >= 18 ? 0.028 : 0.02) * s * eOutBack(lt, 2);
    ctx.fillRect(px * s - r, py * s - r, r * 2, r * 2);
  });
  // ligne de balayage biométrique
  if (scan > 0) {
    const sy = (((time * 0.6) % 1) * 2.2 - 1.1) * s;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, sy - s * 0.12, 0, sy + s * 0.12);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(0.5, rgba(color, 0.45 * scan));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-s * 0.9, sy - s * 0.12, s * 1.8, s * 0.24);
  }
  ctx.restore();
}

/** Carte « publication » de réseau social (avatar, lignes, cœur). */
function postCard(ctx, x, y, w, h, o = {}) {
  const { alpha = 1, color = C.amber, t = 1 } = o;
  if (alpha <= 0.003 || t <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  rrect(ctx, -w / 2, -h / 2, w, h, w * 0.07);
  ctx.fillStyle = 'rgba(10,20,34,0.9)';
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.85);
  ctx.lineWidth = Math.max(1.5, w * 0.012);
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = rgba(color, 0.9);
  ctx.beginPath();
  ctx.arc(-w * 0.34, -h * 0.32, w * 0.08, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(C.slate, 0.6);
  ctx.fillRect(-w * 0.2, -h * 0.36, w * 0.4 * clamp(t * 2), h * 0.05);
  for (let i = 0; i < 3; i++) {
    const lt = clamp(t * 2.2 - 0.4 - i * 0.25);
    ctx.fillStyle = rgba(C.slate, 0.32);
    ctx.fillRect(-w * 0.4, -h * 0.12 + i * h * 0.13, w * (i === 2 ? 0.5 : 0.8) * lt, h * 0.055);
  }
  // cœur
  const hs = w * 0.07 * eOutBack(clamp(t * 2 - 1), 3);
  if (hs > 0) {
    ctx.fillStyle = C.coral;
    ctx.beginPath();
    const hx = -w * 0.34;
    const hy = h * 0.34;
    ctx.moveTo(hx, hy + hs * 0.7);
    ctx.bezierCurveTo(hx - hs * 1.4, hy - hs * 0.2, hx - hs * 0.6, hy - hs * 1.1, hx, hy - hs * 0.35);
    ctx.bezierCurveTo(hx + hs * 0.6, hy - hs * 1.1, hx + hs * 1.4, hy - hs * 0.2, hx, hy + hs * 0.7);
    ctx.fill();
  }
  ctx.restore();
}

/** Monolithe d'entraînement (prisme vertical à deux faces dégradées). */
function monolith(ctx, x, yBase, wd, ht, o = {}) {
  const { alpha = 1, color = C.amber, glow = 0.5, time = 0 } = o;
  if (alpha <= 0.003 || ht <= 0.5) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  light(ctx, x, yBase - ht * 0.5, ht * 0.9, color, glow * 0.35);
  const d = wd * 0.42;
  // face gauche
  let g = ctx.createLinearGradient(0, yBase - ht, 0, yBase);
  g.addColorStop(0, rgba(color, 0.85));
  g.addColorStop(1, rgba(color, 0.08));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - wd / 2, yBase);
  ctx.lineTo(x - wd / 2, yBase - ht);
  ctx.lineTo(x, yBase - ht - d * 0.3);
  ctx.lineTo(x, yBase + d * 0.3);
  ctx.closePath();
  ctx.fill();
  // face droite
  g = ctx.createLinearGradient(0, yBase - ht, 0, yBase);
  g.addColorStop(0, rgba(mix(color, C.night, 0.45), 0.95));
  g.addColorStop(1, rgba(mix(color, C.night, 0.6), 0.1));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, yBase + d * 0.3);
  ctx.lineTo(x, yBase - ht - d * 0.3);
  ctx.lineTo(x + wd / 2, yBase - ht);
  ctx.lineTo(x + wd / 2, yBase);
  ctx.closePath();
  ctx.fill();
  // arête et sommet lumineux
  ctx.strokeStyle = rgba(C.white, 0.75);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, yBase - ht - d * 0.3);
  ctx.lineTo(x, yBase + d * 0.3);
  ctx.stroke();
  // bandes de données qui montent
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const ph = (time * 0.35 + i / 4) % 1;
    ctx.globalAlpha = alpha * (1 - ph) * 0.6;
    ctx.fillStyle = C.white;
    ctx.fillRect(x - wd / 2, yBase - ht * ph, wd / 2, 1.5);
  }
  ctx.restore();
  flare(ctx, x, yBase - ht - d * 0.3, wd * 0.5, color, glow * alpha * 0.6);
}

const CORPUS_LINES = [
  'wiki/Histoire_du_Québec', 'forum.rep#4471 « bonjour à tous »', 'arXiv:2311.0042 abstract', 'news/2026/11/14/monde',
  'blog/recettes/tourtière', 'reddit.com/r/montreal', 'livre_public_domaine.txt', 'docs.api/v3/reference',
  'commentaire #88213', 'wiki/Photosynthèse', 'transcription_balado_ep12', 'manuel_utilisateur.pdf'
];

function sceneDataWar(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    vac: 'photos de vacances',
    vis: 'nos visages',
    pub: 'nos publications',
    nerf: "nerf d'une guerre",
    sv: 'Silicon Valley',
    epuise: 'épuisé',
    texte: 'texte public',
    ia: "modèles d'intelligence",
    franchir: 'Pour franchir',
    recon: 'reconnaissance visuelle',
    video: 'vidéo générative',
    milliards: "milliards d'images",
    ue: "L'Union européenne",
    muraille: 'muraille réglementaire',
    amendes: 'amendes géantes',
    wash: 'Washington',
    champions: 'champions technologiques',
    chine: 'la Chine'
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 100, alpha: 0.4 });

    /* ── ACTE I : anatomie de ce que nous donnons ── */
    const aI = 1 - smooth(seg(lt, T.sv - 0.6, T.sv + 0.2));
    if (aI > 0.003) {
      const items = [
        { k: T.vac, lab: 'VACANCES', col: C.amber, draw: (x, y, s, t) => photoCard(ctx, x, y, s * 1.25, s * 0.95, { alpha: clamp(t * 2), tint: C.amber, glow: 0.3, rot: (1 - eOutExpo(t)) * -0.3 }) },
        { k: T.vis, lab: 'VISAGES', col: C.cyan, draw: (x, y, s, t) => faceMesh(ctx, x, y, s * 0.62, { t, color: C.cyan, time: gt, scan: smooth(seg(lt, T.vis + 0.8, T.vis + 1.6)) }) },
        { k: T.pub, lab: 'PUBLICATIONS', col: C.amber, draw: (x, y, s, t) => postCard(ctx, x, y, s * 1.0, s * 1.25, { t, alpha: clamp(t * 2.5) }) }
      ];
      const s = m * (V ? 0.22 : 0.2);
      const merge = eInOutQuart(seg(lt, T.nerf - 0.3, T.nerf + 0.9));
      items.forEach((it, i) => {
        const t = seg(lt, it.k - 0.25, it.k + 1.1);
        if (t <= 0) return;
        const bx = V ? cx : cx + (i - 1) * m * 0.42;
        const by = V ? h * 0.27 + i * h * 0.17 : cy - m * 0.08;
        const x = lerp(bx, cx, merge);
        const y = lerp(by, V ? h * 0.42 : cy - m * 0.1, merge);
        const lift = (1 - eOutExpo(t)) * m * 0.08;
        ctx.save();
        ctx.translate(x, y + lift);
        ctx.scale(1 - merge * 0.55, 1 - merge * 0.55);
        it.draw(0, 0, s, t);
        ctx.restore();
        kRise(ctx, it.lab, V ? bx + s * 0.95 : bx, V ? by + 8 : by + s * 0.95, { size: Math.floor(m * 0.03), weight: 800, color: it.col, t: seg(lt, it.k, it.k + 0.9), out: merge, spacing: 3, align: V ? 'left' : 'center' });
      });
      // fusion : un lingot d'or « données »
      if (merge > 0.01) {
        const gy = V ? h * 0.42 : cy - m * 0.1;
        light(ctx, cx, gy, m * 0.3 * merge, C.amber, 0.5 * merge);
        ring(ctx, cx, gy, m * 0.14 * eOutExpo(merge), { color: C.gold, width: 2, alpha: merge * 0.8, glow: 18 });
        const ty = V ? h * 0.62 : cy + m * 0.24;
        mono(ctx, 'LE NERF DE LA', cx, ty - m * 0.075, { size: Math.floor(m * 0.024), color: C.ice, t: seg(lt, T.nerf, T.nerf + 0.6), alpha: aI });
        kZoom(ctx, 'GUERRE MONDIALE', cx, ty, { size: Math.floor(m * (V ? 0.09 : 0.085)), weight: 900, t: seg(lt, T.nerf + 0.3, T.nerf + 1.4), alpha: aI, glow: 22, glowColor: rgba(C.amber, 0.45), maxW: w * 0.9 });
      }
    }

    /* ── ACTE II-a : le réservoir de texte public se vide ── */
    const aT = env(lt, T.sv - 0.4, T.franchir + 0.6, 0.6, 0.7);
    if (aT > 0.003) {
      const tw = m * (V ? 0.62 : 0.38);
      const th = m * (V ? 0.5 : 0.52);
      const tx = V ? cx - tw / 2 : cx - m * 0.62;
      const ty = V ? h * 0.2 : cy - th / 2 - m * 0.04;
      const level = lerp(1, 0.06, eInOutQuart(seg(lt, T.epuise - 0.2, T.ia + 0.6)));
      ctx.save();
      ctx.globalAlpha *= aT;
      // cuve
      ctx.strokeStyle = rgba(C.ice, 0.6);
      ctx.lineWidth = 1.5;
      rrect(ctx, tx, ty, tw, th, 14);
      ctx.stroke();
      // lignes du corpus qui défilent sous le niveau
      ctx.save();
      rrect(ctx, tx, ty + th * (1 - level), tw, th * level, 14);
      ctx.clip();
      const lineH = m * 0.034;
      const scroll = (lt * lineH * 0.8) % lineH;
      for (let i = -1; i < th / lineH + 1; i++) {
        const S = textSprite(CORPUS_LINES[(i + 120) % CORPUS_LINES.length], { size: Math.floor(m * 0.017), weight: 500, fam: MONO, color: C.ice });
        drawSprite(ctx, S, tx + 18, ty + i * lineH + scroll + lineH, { align: 'left', alpha: 0.55 });
      }
      ctx.fillStyle = rgba(C.cyan, 0.12);
      ctx.fillRect(tx, ty, tw, th);
      ctx.restore();
      // surface du liquide
      ctx.fillStyle = C.cyan;
      ctx.shadowColor = C.cyan;
      ctx.shadowBlur = 14;
      const sy = ty + th * (1 - level);
      ctx.fillRect(tx + 4, sy, tw - 8, 2);
      ctx.restore();
      mono(ctx, "TEXTE PUBLIC D'INTERNET", tx + tw / 2, ty - m * 0.04, { size: Math.floor(m * 0.02), color: C.ice, t: seg(lt, T.texte - 0.2, T.texte + 1.2), alpha: aT });
      odometer(ctx, 100 * level, tx + tw / 2, ty + th + m * 0.085, { size: Math.floor(m * 0.06), weight: 800, color: level < 0.2 ? C.coral : C.white, suffix: '%', suffixScale: 0.6, roll: false, alpha: aT * smooth(seg(lt, T.epuise - 0.4, T.epuise)) });
      kWipe(ctx, 'PRESQUE ÉPUISÉ', tx + tw / 2, ty + th + m * 0.14, { size: Math.floor(m * 0.026), weight: 800, color: C.coral, t: seg(lt, T.ia - 0.4, T.ia + 0.5), alpha: aT, edge: C.coral });
      // tuyau vers le modèle d'IA
      const mx = V ? cx : cx + m * 0.42;
      const myB = V ? h * 0.86 : cy + m * 0.26;
      const pipe = [
        { x: tx + tw / 2, y: ty + th },
        { x: tx + tw / 2, y: ty + th + m * 0.02 },
        { x: V ? cx : mx - m * 0.18, y: V ? ty + th + m * 0.02 : ty + th + m * 0.02 },
        { x: V ? cx : mx - m * 0.18, y: V ? myB - m * 0.02 : myB - m * 0.02 },
        { x: mx, y: myB - m * 0.02 }
      ];
      if (!V) glowPath(ctx, pipe, seg(lt, T.sv, T.epuise + 0.6), { color: C.cyan, width: 2, alpha: aT * 0.8, head: true });
      monolith(ctx, mx, myB, m * 0.12, m * (V ? 0.18 : 0.42) * eOutExpo(seg(lt, T.sv - 0.2, T.sv + 1.2)), { color: C.amber, time: gt, glow: 0.4 + 0.6 * (1 - level), alpha: aT * (V ? 0 : 1) });
      if (!V) {
        mono(ctx, 'SILICON VALLEY', mx, myB + m * 0.05, { size: Math.floor(m * 0.019), color: C.amber, t: seg(lt, T.sv, T.sv + 1), alpha: aT });
        kRise(ctx, "MODÈLES D'IA", mx, myB + m * 0.11, { size: Math.floor(m * 0.032), weight: 800, t: seg(lt, T.ia, T.ia + 1), alpha: aT });
      }
    }

    /* ── ACTE II-b / III : la traversée de l'Atlantique ── */
    const aM = smooth(seg(lt, T.franchir - 0.3, T.franchir + 1.2));
    if (aM > 0.003) {
      const tilt = lerp(1.32, 0.98, eInOutQuart(seg(lt, T.franchir - 0.3, T.franchir + 2.0)));
      const pan = track(lt, [
        [T.franchir, -50],
        [T.milliards + 1.0, -54, eInOutQuart],
        [T.ue + 0.4, -40, eInOutQuart],
        [T.wash + 0.2, -58, eInOutQuart],
        [D, -55, eInOutQuart]
      ]);
      const sc = m * (V ? 0.0105 : 0.0128) * track(lt, [[T.franchir, 0.82], [T.recon, 1.0], [T.wash, 1.04], [D, 0.95]]);
      const Pj = makeTilt(pan, 42, sc, cx, cy + (V ? -h * 0.02 : m * 0.04), tilt, m * 1.6, 0);
      const dots = regionDots('atl', -140, 45, 5, 72, 0.75);
      ctx.save();
      ctx.globalAlpha *= aM;
      drawDots(ctx, Pj, dots, { color: C.cyan, size: sc * 0.3, alpha: 0.8, depthFade: true });
      // monolithes américains
      const sites = [
        { k: 'siliconValley', col: C.amber, h: 1 },
        { k: 'seattle', col: C.amber, h: 0.8 },
        { k: 'newYork', col: C.amber, h: 0.7 }
      ];
      const mono3 = sites.map((st, i) => {
        const q = Pj.project(...P(st.k));
        const grow = eOutExpo(seg(lt, T.recon - 0.6 + i * 0.25, T.recon + 1.2 + i * 0.25));
        monolith(ctx, q.x, q.y, m * 0.05 * q.s, m * 0.3 * st.h * q.s * grow, { color: st.col, time: gt + i, glow: 0.6, alpha: 1 });
        return { x: q.x, y: q.y - m * 0.3 * st.h * q.s * grow * 0.6, base: q };
      });
      // flux d'images européennes vers les monolithes
      const flow = smooth(seg(lt, T.milliards - 1.2, T.milliards));
      const wall = eOutExpo(seg(lt, T.muraille - 0.6, T.muraille + 1.4));
      const srcs = ['paris', 'rome', 'madrid', 'brussels', 'lisbon', 'milan', 'dublin'];
      const wallLon = -16;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      srcs.forEach((sk, i) => {
        const a0 = Pj.project(...P(sk));
        const tgt = mono3[i % 3];
        const pts = quadPts(a0, tgt, -m * (0.12 + 0.05 * (i % 3)), 50);
        // trajectoire fine
        glowPath(ctx, pts, 1, { color: C.amber, width: 1.2, alpha: 0.35 * flow * (1 - wall * 0.6), head: false, glow: 0.5 });
        // paquets d'images
        for (let k = 0; k < 9; k++) {
          let u = ((gt * 0.22 + k / 9 + i * 0.13) % 1);
          // la muraille stoppe une partie du flux (friction)
          const wallX = Pj.project(wallLon, P(sk)[1]).x;
          const pp = along(pts, u);
          const stopped = wall > 0.3 && pp.x < wallX + 4 && pts[0].x > wallX && k % 3 !== 0;
          if (stopped) continue;
          const sz = (3 + (k % 3) * 2) * (0.6 + 0.4 * flow);
          ctx.globalAlpha = flow * (0.4 + 0.6 * Math.sin(u * Math.PI));
          ctx.fillStyle = k % 4 === 0 ? C.white : C.gold;
          ctx.fillRect(pp.x - sz / 2, pp.y - sz / 2, sz, sz * 0.75);
        }
      });
      ctx.restore();
      // muraille réglementaire européenne
      if (wall > 0.003) {
        const top = [];
        const bot = [];
        for (let la = 34; la <= 62; la += 2) {
          const q0 = Pj.project(wallLon, la, 0);
          const q1 = Pj.project(wallLon, la, m * 0.22 * wall);
          bot.push(q0);
          top.push(q1);
        }
        ctx.save();
        ctx.beginPath();
        top.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
        for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, top[0].y, 0, bot[0].y);
        g.addColorStop(0, rgba(C.cyan, 0.05));
        g.addColorStop(1, rgba(C.cyan, 0.32));
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = rgba(C.cyan, 0.9);
        ctx.lineWidth = 2;
        ctx.shadowColor = C.cyan;
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.clip();
        // lignes de code / normes qui montent dans la muraille
        const rules = ['RGPD · ART. 6 · CONSENTEMENT', 'RGPD · ART. 83 · AMENDES', 'LOI SUR L’IA · UE', 'DMA · DSA', 'RGPD · ART. 9 · BIOMÉTRIE'];
        const bx = Math.min(...bot.map((q) => q.x));
        const by = Math.max(...bot.map((q) => q.y));
        const rh = m * 0.03;
        for (let i = 0; i < 14; i++) {
          const S = textSprite(rules[i % rules.length], { size: Math.floor(m * 0.014), weight: 500, fam: MONO, color: C.ice });
          const yy = by - ((i * rh + lt * rh * 0.9) % (rh * 14));
          drawSprite(ctx, S, bx + (i % 2) * m * 0.02, yy, { align: 'left', alpha: 0.75 });
        }
        ctx.restore();
        // étincelles de friction
        for (let i = 0; i < 6; i++) {
          const la = 38 + i * 4;
          const q = Pj.project(wallLon, la, m * 0.08 + (i % 2) * m * 0.05);
          const fl = 0.5 + 0.5 * Math.sin(gt * 9 + i * 2.1);
          light(ctx, q.x, q.y, m * 0.03, C.gold, wall * fl * 0.8);
        }
      }
      // Washington : dôme protecteur sur les champions
      const wA = smooth(seg(lt, T.wash - 0.2, T.wash + 0.8));
      if (wA > 0.003) {
        const q = Pj.project(...P('washington'));
        beacon(ctx, q.x, q.y, { color: C.cyan, r: 7, time: gt, alpha: wA });
        const dc = Pj.project(-100, 40);
        const dr = m * 0.36 * eOutExpo(seg(lt, T.champions - 0.6, T.champions + 0.8));
        ctx.save();
        ctx.globalAlpha *= wA;
        ctx.beginPath();
        ctx.ellipse(dc.x, dc.y + m * 0.02, dr, dr * 0.62, 0, Math.PI, TAU);
        ctx.strokeStyle = rgba(C.ice, 0.55);
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 7]);
        ctx.shadowColor = C.cyan;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // Typographie de l'acte II-b / III (espace écran)
      const lx = V ? cx : w * 0.5;
      const lyTop = V ? h * 0.17 : h * 0.17;
      const rA = env(lt, T.recon - 0.2, T.ue - 0.2, 0.4, 0.5);
      kWords(ctx, ['RECONNAISSANCE', 'VISUELLE'], lx, lyTop, { size: Math.floor(m * 0.03), weight: 700, color: C.ice, time: lt, times: [T.recon, T.recon + 0.3], alpha: rA });
      kWords(ctx, ['VIDÉO', 'GÉNÉRATIVE'], lx, lyTop + m * 0.05, { size: Math.floor(m * 0.03), weight: 700, color: C.ice, time: lt, times: [T.video, T.video + 0.3], alpha: rA });
      kZoom(ctx, 'DES MILLIARDS D’IMAGES', lx, lyTop + m * 0.14, { size: Math.floor(m * (V ? 0.06 : 0.058)), weight: 900, t: seg(lt, T.milliards - 0.1, T.milliards + 1.0), alpha: rA, glow: 18, glowColor: rgba(C.amber, 0.5), maxW: w * 0.9 });
      const eA = env(lt, T.ue - 0.1, T.wash - 0.1, 0.4, 0.5);
      mono(ctx, 'UNION EUROPÉENNE', lx, lyTop, { size: Math.floor(m * 0.022), color: C.cyan, t: seg(lt, T.ue, T.ue + 0.8), alpha: eA });
      kRise(ctx, 'MURAILLE RÉGLEMENTAIRE', lx, lyTop + m * 0.085, { size: Math.floor(m * (V ? 0.058 : 0.056)), weight: 900, t: seg(lt, T.muraille, T.muraille + 1.1), alpha: eA, maxW: w * 0.9 });
      kWipe(ctx, 'AMENDES GÉANTES', lx, lyTop + m * 0.14, { size: Math.floor(m * 0.03), weight: 800, color: C.amber, t: seg(lt, T.amendes, T.amendes + 0.8), alpha: eA });
      const uA = smooth(seg(lt, T.wash - 0.1, T.wash + 0.5));
      mono(ctx, 'WASHINGTON', lx, lyTop, { size: Math.floor(m * 0.022), color: C.cyan, t: seg(lt, T.wash, T.wash + 0.8), alpha: uA });
      kRise(ctx, 'CHAMPIONS TECHNOLOGIQUES', lx, lyTop + m * 0.085, { size: Math.floor(m * (V ? 0.054 : 0.052)), weight: 900, t: seg(lt, T.champions, T.champions + 1.1), alpha: uA, maxW: w * 0.9 });
      const chA = smooth(seg(lt, T.chine - 0.6, T.chine + 0.2));
      kWords(ctx, ['ÉTATS-UNIS', '⟷', 'CHINE'], lx, lyTop + m * 0.145, { size: Math.floor(m * 0.03), weight: 800, color: C.white, time: lt, times: [T.chine - 1.4, T.chine - 0.9, T.chine - 0.3], alpha: uA });
      if (chA > 0) light(ctx, V ? w * 0.92 : w * 0.96, V ? h * 0.42 : h * 0.4, m * 0.25, C.red, chA * 0.55);
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 04 — d1-deux-cotes-medaille · Vie privée absolue ou carburant de l'innovation ?
 * Acte I   : un faisceau vertical fend le noir : BRAS DE FER · DEUX VISIONS
 * Acte II  : la frontière glisse — Camp A (empreinte + photo sous anneau verrouillé)
 *            puis Camp B (réseau ouvert qui irrigue des milliards de points)
 * Acte III : la frontière revient au centre ; les deux principes s'équilibrent
 * ════════════════════════════════════════════════════════════════════════ */

/** Empreinte digitale en arcs concentriques interrompus. */
function fingerprint(ctx, x, y, s, o = {}) {
  const { t = 1, alpha = 1, color = C.amber } = o;
  if (alpha <= 0.003 || t <= 0) return;
  const arcs = cached('fp', () => {
    const r = rng(25);
    const out = [];
    for (let i = 0; i < 15; i++) {
      const rad = 0.08 + i * 0.062;
      let a = -Math.PI * 0.95 + r() * 0.4;
      while (a < Math.PI * 0.95) {
        const len = 0.5 + r() * 1.6;
        out.push([rad, a, Math.min(Math.PI * 0.98, a + len), i]);
        a += len + 0.12 + r() * 0.25;
      }
    }
    return out;
  });
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.022);
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.05;
  arcs.forEach(([rad, a0, a1, i]) => {
    const lt = clamp(t * 1.5 - i * 0.035);
    if (lt <= 0) return;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, rad * s * 0.78, rad * s, 0, a0 - Math.PI / 2, lerp(a0, a1, eOutCubic(lt)) - Math.PI / 2);
    ctx.stroke();
  });
  ctx.restore();
}

/** Cadenas minimaliste. */
function padlock(ctx, x, y, s, o = {}) {
  const { alpha = 1, color = C.amber, closed = 1 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.14;
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.4;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.35 - (1 - closed) * s * 0.3, s * 0.32, Math.PI, TAU);
  ctx.stroke();
  rrect(ctx, x - s * 0.5, y - s * 0.38, s, s * 0.78, s * 0.12);
  ctx.fill();
  ctx.restore();
}

/** Réseau ouvert (hub → anneaux de nœuds) avec impulsions de services. */
function openNetwork(ctx, x, y, R, time, o = {}) {
  const { t = 1, alpha = 1, color = C.cyan, cut = 0, cutDir = 0.25 } = o;
  if (alpha <= 0.003 || t <= 0) return;
  const G = cached('net', () => {
    const r = rng(9);
    const nodes = [{ x: 0, y: 0, ring: 0, p: -1 }];
    const rings = [7, 21, 70];
    let prevStart = 0;
    let prevCount = 1;
    rings.forEach((n, ri) => {
      const start = nodes.length;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + r() * 0.2 + ri * 0.3;
        const rad = (ri + 1) / 3 + (r() - 0.5) * 0.08;
        const parent = prevStart + Math.floor((i / n) * prevCount);
        nodes.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, ring: ri + 1, p: parent, a });
      }
      prevStart = start;
      prevCount = n;
    });
    return nodes;
  });
  ctx.save();
  ctx.globalAlpha *= alpha;
  light(ctx, x, y, R * 0.6, color, 0.4);
  // arêtes
  for (let i = 1; i < G.length; i++) {
    const n = G[i];
    const p = G[n.p];
    const lt = clamp(t * 3 - (n.ring - 1));
    if (lt <= 0) continue;
    const dead = cut > 0 && Math.cos(n.a - cutDir * TAU) > 0.82 && n.ring >= 2 ? cut : 0;
    ctx.strokeStyle = dead ? rgba(C.slate, 0.15) : rgba(color, 0.35 + 0.15 * (3 - n.ring));
    ctx.lineWidth = n.ring === 1 ? 2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(x + p.x * R, y + p.y * R);
    ctx.lineTo(x + lerp(p.x, n.x, eOutCubic(lt)) * R, y + lerp(p.y, n.y, eOutCubic(lt)) * R);
    ctx.stroke();
    // impulsions (services qui circulent du centre vers la périphérie)
    if (lt >= 1 && !dead) {
      const ph = (time * 0.6 + i * 0.137) % 1;
      const px = x + lerp(p.x, n.x, ph) * R;
      const py = y + lerp(p.y, n.y, ph) * R;
      ctx.fillStyle = i % 5 === 0 ? C.white : color;
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillRect(px - 2.5, py - 2.5, 5, 5);
      ctx.globalAlpha = alpha;
    }
  }
  // nœuds
  for (let i = 0; i < G.length; i++) {
    const n = G[i];
    const lt = clamp(t * 3 - n.ring + 0.6);
    if (lt <= 0) continue;
    const dead = cut > 0 && i > 0 && Math.cos(n.a - cutDir * TAU) > 0.82 && n.ring >= 2 ? cut : 0;
    const r = (n.ring === 0 ? 0.06 : n.ring === 1 ? 0.025 : n.ring === 2 ? 0.014 : 0.008) * R * eOutBack(lt, 2);
    ctx.fillStyle = dead ? rgba(C.slate, 0.3) : n.ring === 0 ? C.white : color;
    ctx.beginPath();
    ctx.arc(x + n.x * R, y + n.y * R, Math.max(1.5, r), 0, TAU);
    ctx.fill();
    if (n.ring === 3 && !dead) light(ctx, x + n.x * R, y + n.y * R, R * 0.03, color, 0.5);
  }
  ctx.restore();
}

function scenePrivacySplit(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    bras: 'bras de fer',
    deux: 'deux visions',
    cote1: "D'un côté",
    def: 'défenseurs de la vie privée',
    image: 'notre image',
    aspirer: 'aspirer en cachette',
    consent: 'consentement préalable',
    produit: 'produit gratuit',
    cote2: "De l'autre côté",
    acteurs: 'acteurs technologiques',
    finance: 'finance des applications',
    milliards: 'milliards de personnes',
    exces: "excès d'amendes",
    priver: 'priver certains pays',
    innov: 'meilleures innovations'
  });

  // Position de la frontière (fraction de l'axe principal) — balance dynamique
  const split = track(lt, [
    [0, 0.5],
    [T.cote1 - 0.2, 0.5],
    [T.cote1 + 1.2, 0.6, eInOutQuart],
    [T.cote2 - 0.4, 0.6],
    [T.cote2 + 1.0, 0.4, eInOutQuart],
    [T.innov - 0.2, 0.4],
    [T.innov + 0.9, 0.5, eInOutQuart]
  ]);
  const beamIn = eOutExpo(seg(lt, 0.1, 1.4));

  frame(a, () => {
    dust(ctx, stage, gt, { count: 110, alpha: 0.35 });
    const sx = V ? 0 : w * split;
    const sy = V ? h * split : 0;

    // champs colorés de part et d'autre (lueurs latérales)
    const aA = smooth(seg(lt, T.cote1 - 0.3, T.cote1 + 1.0));
    const aB = smooth(seg(lt, T.cote2 - 0.3, T.cote2 + 1.0));
    if (!V) {
      light(ctx, sx * 0.5, cy, m * 0.7, C.amber, 0.22 * aA);
      light(ctx, sx + (w - sx) * 0.5, cy, m * 0.7, C.cyan, 0.22 * aB);
    } else {
      light(ctx, cx, sy * 0.5, m * 0.7, C.amber, 0.22 * aA);
      light(ctx, cx, sy + (h - sy) * 0.5, m * 0.7, C.cyan, 0.22 * aB);
    }

    // faisceau de scission
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (!V) {
      const yEnd = h * beamIn;
      const g = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(230,245,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx - 40, 0, 80, yEnd);
      ctx.fillStyle = rgba(C.white, 0.95);
      ctx.fillRect(sx - 1.2, 0, 2.4, yEnd);
    } else {
      const xEnd = w * beamIn;
      const g = ctx.createLinearGradient(0, sy - 40, 0, sy + 40);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(230,245,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, sy - 40, xEnd, 80);
      ctx.fillStyle = rgba(C.white, 0.95);
      ctx.fillRect(0, sy - 1.2, xEnd, 2.4);
    }
    ctx.restore();
    if (!V) flare(ctx, sx, h * beamIn, m * 0.12, C.ice, beamIn < 1 ? 1 : 0.3);

    // ACTE I : titres
    const tA = env(lt, T.bras - 0.2, T.cote1 + 0.4, 0.3, 0.6);
    kRise(ctx, 'BRAS DE FER', cx, cy - m * 0.02, { size: Math.floor(m * (V ? 0.12 : 0.11)), weight: 900, t: seg(lt, T.bras, T.bras + 1.1), alpha: tA, glow: 20, glowColor: rgba(C.ice, 0.4), maxW: w * 0.9 });
    mono(ctx, 'DEUX VISIONS · DONNÉES PERSONNELLES', cx, cy + m * 0.07, { size: Math.floor(m * 0.022), color: C.ice, t: seg(lt, T.deux, T.deux + 1.3), alpha: tA });

    // Centres des deux camps
    const A = V ? { x: cx, y: sy * 0.5 + m * 0.02 } : { x: sx * 0.5, y: cy - m * 0.06 };
    const B = V ? { x: cx, y: sy + (h - sy) * 0.4 } : { x: sx + (w - sx) * 0.5, y: cy - m * 0.06 };
    const eq = smooth(seg(lt, T.innov, T.innov + 1.0));

    /* ── CAMP A ── */
    if (aA > 0.003) {
      const s = m * (V ? 0.2 : 0.2) * lerp(1, 0.82, smooth(seg(lt, T.cote2, T.cote2 + 1)));
      fingerprint(ctx, A.x - s * 0.15, A.y, s, { t: seg(lt, T.def - 0.3, T.def + 2.2), alpha: aA * 0.9 });
      photoCard(ctx, A.x + s * 0.42, A.y + s * 0.3, s * 0.62, s * 0.48, { tint: C.amber, alpha: aA * smooth(seg(lt, T.image - 0.4, T.image + 0.4)), rot: 0.08, glow: 0.25 });
      // anneau verrouillé
      const lock = eInOutQuart(seg(lt, T.image, T.image + 1.4));
      ring(ctx, A.x, A.y + s * 0.05, s * 1.05, { color: C.amber, width: 3, alpha: aA, sweep: TAU * lock, glow: 18 });
      ring(ctx, A.x, A.y + s * 0.05, s * 1.13, { color: C.gold, width: 1, alpha: aA * 0.5, sweep: TAU * lock, dash: [3, 9], a0: gt * 0.2 });
      padlock(ctx, A.x, A.y - s * 1.05 + s * 0.05, s * 0.16, { alpha: aA * smooth(seg(lock, 0.85, 1)), closed: smooth(seg(lt, T.image + 1.2, T.image + 1.6)) });
      // tentatives d'aspiration « en cachette » repoussées par l'anneau
      const asp = env(lt, T.aspirer - 0.2, T.consent + 0.8, 0.3, 0.6);
      if (asp > 0.003) {
        for (let i = 0; i < 5; i++) {
          const ang = (V ? Math.PI / 2 : 0) + (i - 2) * 0.32;
          const ph = (gt * 0.9 + i * 0.21) % 1;
          const r0 = s * 2.2;
          const r1 = lerp(r0, s * 1.12, eOutCubic(ph));
          const px = A.x + Math.cos(ang) * r1;
          const py = A.y + Math.sin(ang) * r1;
          ctx.save();
          ctx.globalAlpha *= asp * (1 - ph * 0.4);
          ctx.strokeStyle = rgba(C.cyan, 0.7);
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.moveTo(A.x + Math.cos(ang) * r0, A.y + Math.sin(ang) * r0);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.restore();
          if (ph > 0.85) light(ctx, px, py, s * 0.18, C.gold, asp * smooth(seg(ph, 0.85, 1)));
        }
      }
      // typographie du camp A
      const lx = A.x;
      const ly = V ? A.y + s * 1.45 : A.y + s * 1.5;
      const fade = 1 - smooth(seg(lt, T.cote2 - 0.4, T.cote2 + 0.2)) * (V ? 1 : 0.65);
      const maxW = V ? w * 0.86 : sx * 0.86;
      mono(ctx, 'CAMP A · VIE PRIVÉE', lx, V ? A.y - s * 1.35 : A.y - s * 1.45, { size: Math.floor(m * 0.02), color: C.amber, t: seg(lt, T.cote1, T.cote1 + 1), alpha: aA * fade });
      kRise(ctx, 'VOTRE IMAGE', lx, ly, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.image, T.image + 0.9), alpha: aA * fade, maxW });
      kRise(ctx, 'VOUS APPARTIENT', lx, ly + m * 0.058, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.image + 0.4, T.image + 1.3), alpha: aA * fade, color: C.gold, maxW });
      const subY = ly + m * 0.115;
      const swap = smooth(seg(lt, T.produit - 0.3, T.produit + 0.1));
      kWipe(ctx, 'CONSENTEMENT EXPLICITE', lx, subY, { size: Math.floor(m * 0.026), weight: 800, color: C.white, t: seg(lt, T.consent, T.consent + 0.8), alpha: aA * fade * (1 - swap), edge: C.amber, maxW });
      kWipe(ctx, 'CITOYEN ≠ PRODUIT GRATUIT', lx, subY, { size: Math.floor(m * 0.026), weight: 800, color: C.coral, t: seg(lt, T.produit - 0.1, T.produit + 0.7), alpha: aA * fade * swap, edge: C.coral, maxW });
    }

    /* ── CAMP B ── */
    if (aB > 0.003) {
      const R = m * (V ? 0.25 : 0.27);
      const cutT = smooth(seg(lt, T.exces + 0.2, T.priver + 0.6));
      openNetwork(ctx, B.x, B.y, R, gt, { t: seg(lt, T.acteurs - 0.4, T.finance + 0.6), alpha: aB, cut: cutT, cutDir: V ? 0.25 : 0 });
      const lx = B.x;
      const ly = V ? B.y + R * 1.18 : B.y + R * 1.22;
      const maxW = V ? w * 0.86 : (w - sx) * 0.86;
      mono(ctx, 'CAMP B · INNOVATION', lx, V ? B.y - R * 1.15 : B.y - R * 1.2, { size: Math.floor(m * 0.02), color: C.cyan, t: seg(lt, T.cote2, T.cote2 + 1), alpha: aB });
      kRise(ctx, 'APPLICATIONS', lx, ly, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.finance, T.finance + 0.9), alpha: aB, maxW });
      kRise(ctx, 'GRATUITES', lx, ly + m * 0.058, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.finance + 0.4, T.finance + 1.3), alpha: aB, color: C.ice, maxW });
      const subY = ly + m * 0.115;
      const swap = smooth(seg(lt, T.exces - 0.3, T.exces + 0.1));
      kWipe(ctx, "DES MILLIARDS D'USAGERS", lx, subY, { size: Math.floor(m * 0.026), weight: 800, color: C.white, t: seg(lt, T.milliards - 0.2, T.milliards + 0.6), alpha: aB * (1 - swap), edge: C.cyan, maxW });
      kWipe(ctx, 'TROP D’AMENDES → PAYS PRIVÉS', lx, subY, { size: Math.floor(m * 0.026), weight: 800, color: C.amber, t: seg(lt, T.priver - 0.5, T.priver + 0.4), alpha: aB * swap, edge: C.amber, maxW });
    }

    /* ── ACTE III : ligne d'horizon d'équilibre ── */
    if (eq > 0.003) {
      const hy = V ? h * 0.5 : h * 0.84;
      ctx.save();
      ctx.globalAlpha *= eq;
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, rgba(C.amber, 0));
      g.addColorStop(0.3, rgba(C.amber, 0.9));
      g.addColorStop(0.5, rgba(C.white, 1));
      g.addColorStop(0.7, rgba(C.cyan, 0.9));
      g.addColorStop(1, rgba(C.cyan, 0));
      ctx.fillStyle = g;
      ctx.shadowColor = C.white;
      ctx.shadowBlur = 14;
      const half = (w / 2) * eOutExpo(eq);
      if (!V) ctx.fillRect(cx - half, hy, half * 2, 2);
      ctx.restore();
      if (!V) mono(ctx, 'DEUX PRINCIPES · UN ÉQUILIBRE À TROUVER', cx, hy + m * 0.04, { size: Math.floor(m * 0.019), color: C.slate, t: seg(lt, T.innov + 0.2, T.innov + 1.2), alpha: eq });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 05 — d1-impact-quebec · Loi 25 et bras de fer avec Facebook et Instagram
 * Acte I   : l'onde partie de Rome traverse l'Atlantique (globe) jusqu'au Saint-Laurent ;
 *            des millions de photos de famille s'élèvent des villes québécoises
 * Acte II  : un champ de force hexagonal épouse le territoire : LOI 25
 * Acte III : faisceaux ambre venus du sud contre le champ ; médias bloqués ; JUSQU'OÙ ?
 * ════════════════════════════════════════════════════════════════════════ */

/** Icône « journal » (médias). */
function newsIcon(ctx, x, y, s, o = {}) {
  const { alpha = 1, color = C.slate, struck = 0 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  rrect(ctx, x - s / 2, y - s * 0.62, s, s * 1.24, s * 0.08);
  ctx.strokeStyle = rgba(color, 0.9);
  ctx.lineWidth = Math.max(1.5, s * 0.05);
  ctx.stroke();
  ctx.fillStyle = rgba(color, 0.85);
  ctx.fillRect(x - s * 0.34, y - s * 0.46, s * 0.68, s * 0.16);
  for (let i = 0; i < 4; i++) ctx.fillRect(x - s * 0.34, y - s * 0.18 + i * s * 0.16, s * (i === 3 ? 0.4 : 0.68), s * 0.06);
  if (struck > 0) {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = Math.max(2, s * 0.09);
    ctx.shadowColor = C.red;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.7, y + s * 0.75);
    ctx.lineTo(lerp(x - s * 0.7, x + s * 0.7, eOutExpo(struck)), lerp(y + s * 0.75, y - s * 0.75, eOutExpo(struck)));
    ctx.stroke();
  }
  ctx.restore();
}

function sceneLoi25(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    italienne: 'décision italienne',
    qc: 'Québec ?',
    millions: 'Des millions',
    photos: 'photos de leur famille',
    fb: 'Facebook et Instagram',
    loi: 'la Loi vingt-cinq',
    rens: 'renseignements personnels',
    bio: 'biométrie',
    severe: 'le plus sévère',
    amendes: 'amendes de plusieurs millions',
    question: 'la question reste',
    bloquer: "bloquer l'accès",
    payer: 'éviter de payer',
    jusqu: "jusqu'où",
    respect: 'faire respecter',
    ici: "citoyens d'ici"
  });

  // Plan carte du Québec (après le globe)
  const flatS = (V ? 0.03 : 0.043) * h;
  const qcCenter = [-70.5, 52.6];
  const mapA = smooth(seg(lt, T.qc - 0.4, T.qc + 1.0));
  const zoomMap = track(lt, [
    [T.qc - 0.4, 0.55],
    [T.qc + 1.6, 1.0, eOutCubic],
    [T.question, 1.04, (x) => x],
    [T.bloquer + 0.6, 0.86, eInOutQuart],
    [D, 0.9, (x) => x]
  ]);
  const mapCy = V ? h * 0.42 : cy - m * 0.02;
  const mapCx = V ? cx : cx - m * 0.28;
  const Pj = makeFlat(qcCenter[0], qcCenter[1], flatS * zoomMap, mapCx, mapCy);

  frame(a, () => {
    dust(ctx, stage, gt, { count: 100, alpha: 0.35 });

    /* ── ACTE I-a : le globe tourne de Rome vers le Québec ── */
    const gA = 1 - smooth(seg(lt, T.qc - 0.2, T.qc + 1.0));
    if (gA > 0.003) {
      const st = globeTrack(lt, [
        [0, [14, 38, V ? 0.42 : 0.4, 0, 0]],
        [T.qc - 0.4, [-58, 46, V ? 0.5 : 0.48, 0, 0], eInOutQuart],
        [T.qc + 1.0, [-71, 50, 1.6, V ? 0 : -0.14, V ? -0.08 : 0], eInExpo]
      ]);
      const G = globeFrom(stage, st);
      drawGlobe(ctx, G, { alpha: gA, color: C.cyan, hl: (lo, la) => (QUEBEC.some((p) => insidePoly(lo, la, p)) ? smooth(seg(lt, 1.5, 3)) : 0), hlColor: C.ice });
      const route = projectAll(G, arcPts(P('rome'), P('quebec'), 80, 0.16));
      trail(ctx, route, eInOutQuart(seg(lt, 0.2, T.qc - 0.3)), { color: C.amber, width: 3, alpha: gA });
      const r0 = G.project(...P('rome'));
      if (r0.vis) shockwave(ctx, r0.x, r0.y, m * 0.06, gt, { color: C.amber, alpha: gA * 0.8, count: 2 });
      mono(ctx, 'ROME → SAINT-LAURENT', cx, V ? h * 0.78 : h * 0.86, { size: Math.floor(m * 0.022), color: C.amber, t: seg(lt, 0.3, 1.6), alpha: gA });
    }

    /* ── Carte du Québec ── */
    if (mapA > 0.003) {
      ctx.save();
      ctx.globalAlpha *= mapA;
      const ctxDots = regionDots('qcRegion', -95, -50, 38, 64, 0.32);
      drawDots(ctx, Pj, ctxDots, { color: C.cyan, size: flatS * zoomMap * 0.1, alpha: 0.35, fade: { x: mapCx, y: mapCy, r: m * 0.9 } });
      const qd = quebecDots(0.26);
      const field = smooth(seg(lt, T.loi - 0.3, T.loi + 1.2));
      drawDots(ctx, Pj, qd, { color: C.ice, size: flatS * zoomMap * 0.1, alpha: 0.6 + 0.3 * field });
      for (const poly of QUEBEC) polyStroke(ctx, Pj, poly, { color: C.cyan, width: 2.2, draw: seg(lt, T.qc, T.qc + 2.2), glow: 18, fill: 0.05 + field * 0.06 });
      ctx.restore();

      // villes : photos de famille qui s'élèvent vers les plateformes
      const cities = ['montreal', 'quebec', 'gatineau', 'sherbrooke', 'troisRivieres', 'rimouski'];
      const upA = env(lt, T.millions - 0.2, T.loi + 0.4, 0.5, 0.8);
      const platY = V ? h * 0.13 : h * 0.14;
      const platX = V ? cx : mapCx + m * 0.05;
      if (upA > 0.003) {
        cities.forEach((ck, i) => {
          const q = Pj.project(...P(ck));
          beacon(ctx, q.x, q.y, { color: C.amber, r: 5, alpha: upA, time: gt + i, pulse: false });
          for (let k = 0; k < 4; k++) {
            const ph = (gt * 0.32 + k / 4 + i * 0.17) % 1;
            const px = lerp(q.x, platX + (i - 2.5) * m * 0.03, eInOutQuart(ph));
            const py = lerp(q.y, platY + m * 0.05, eInOutQuart(ph));
            photoCard(ctx, px, py, m * 0.032, m * 0.024, { alpha: upA * Math.sin(ph * Math.PI), tint: k % 2 ? C.amber : C.cyan, variant: k });
          }
        });
        const pf = env(lt, T.fb - 0.2, T.loi + 0.4, 0.4, 0.8);
        kWords(ctx, ['FACEBOOK', '·', 'INSTAGRAM'], platX, platY, { size: Math.floor(m * 0.03), weight: 800, color: C.white, time: lt, times: [T.fb, T.fb + 0.2, T.fb + 0.5], alpha: pf });
        const lx = V ? cx : w * 0.74;
        const ly = V ? h * 0.8 : cy - m * 0.02;
        mono(ctx, 'CHAQUE SEMAINE', lx, ly - m * 0.12, { size: Math.floor(m * 0.02), color: C.amber, t: seg(lt, T.millions + 0.4, T.millions + 1.4), alpha: upA });
        kRise(ctx, 'DES MILLIONS', lx, ly - m * 0.03, { size: Math.floor(m * 0.06), weight: 900, t: seg(lt, T.millions, T.millions + 1.0), alpha: upA });
        kRise(ctx, 'DE QUÉBÉCOIS', lx, ly + m * 0.04, { size: Math.floor(m * 0.06), weight: 900, t: seg(lt, T.millions + 0.35, T.millions + 1.35), alpha: upA, color: C.ice });
      }

      /* ── ACTE II : champ de force hexagonal LOI 25 ── */
      if (field > 0.003) {
        const hexR = m * 0.026 * zoomMap;
        const cells = cached('hexQc_' + (V ? 'v' : 'h'), () => {
          // cellules hexagonales en coordonnées (lon, lat) dont le centre est au Québec
          const out = [];
          const P0 = makeFlat(qcCenter[0], qcCenter[1], 1, 0, 0);
          for (let row = -40; row <= 40; row++) {
            for (let col = -40; col <= 40; col++) {
              const x = col * 1.732 + (row % 2 ? 0.866 : 0);
              const y = row * 1.5;
              const lon = qcCenter[0] + x / Math.cos(qcCenter[1] * D2R) / 1.0 * 0.5;
              const lat = qcCenter[1] - y * 0.5;
              if (QUEBEC.some((p) => insidePoly(lon, lat, p))) out.push([lon, lat, Math.hypot(x, y)]);
            }
          }
          return out;
        });
        const sweep = seg(lt, T.loi - 0.2, T.loi + 2.2);
        const hit = env(lt, T.question - 0.2, D, 0.6, 0.3);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const [lon, lat, d0] of cells) {
          const q = Pj.project(lon, lat);
          const on = clamp(sweep * 26 - d0 * 0.9);
          if (on <= 0) continue;
          const flick = hit > 0 && lat < 47.5 ? 0.5 + 0.5 * Math.sin(gt * 11 + lon * 3) : 0;
          const wave = 0.5 + 0.5 * Math.sin(gt * 2.2 - d0 * 0.35);
          ctx.globalAlpha = field * (0.26 + 0.22 * wave + flick * hit * 0.4);
          ctx.strokeStyle = flick > 0.6 ? C.gold : C.cyan;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          const rr = hexR * flatS * 0.0 + flatS * zoomMap * 0.5 * 0.98;
          for (let k = 0; k <= 6; k++) {
            const an = (k / 6) * TAU + Math.PI / 6;
            const px = q.x + Math.cos(an) * rr * 0.98;
            const py = q.y + Math.sin(an) * rr * 0.98;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();
        // inscription monumentale LOI 25
        const c0 = Pj.project(-72.5, 51.5);
        const big = Math.floor(m * (V ? 0.14 : 0.13));
        const lA = field * (1 - smooth(seg(lt, T.bloquer - 0.4, T.bloquer + 0.2)) * 0.55);
        mono(ctx, 'QUÉBEC', c0.x, c0.y - big * 1.05, { size: Math.floor(m * 0.022), color: C.ice, t: seg(lt, T.loi, T.loi + 0.6), alpha: lA });
        kZoom(ctx, 'LOI 25', c0.x, c0.y, { size: big, weight: 900, t: seg(lt, T.loi + 0.1, T.loi + 1.2), alpha: lA, glow: 26, glowColor: rgba(C.cyan, 0.7), from: 1.5 });
        underline(ctx, c0.x, c0.y + big * 0.22, big * 2.6, seg(lt, T.loi + 0.6, T.loi + 1.6), { alpha: lA, colorA: C.cyan, colorB: C.ice });
        // attributs de la loi, mot à mot
        const lx = V ? cx : w * 0.74;
        const ly = V ? h * 0.78 : cy - m * 0.12;
        const kA = env(lt, T.rens - 0.3, T.question + 0.2, 0.4, 0.5);
        const lines = [
          [T.rens, 'RENSEIGNEMENTS PERSONNELS', C.white],
          [T.bio, 'BIOMÉTRIE', C.white],
          [T.severe, 'LE PLUS SÉVÈRE', C.cyan],
          [T.severe + 0.7, 'EN AMÉRIQUE DU NORD', C.ice]
        ];
        lines.forEach(([k, txt, col], i) => kSlide(ctx, txt, lx, ly + i * m * 0.052, { size: Math.floor(m * (i === 2 ? 0.042 : 0.03)), weight: i === 2 ? 900 : 700, color: col, t: seg(lt, k - 0.1, k + 0.7), alpha: kA, dir: 'up', maxW: V ? w * 0.9 : w * 0.42 }));
        const amA = env(lt, T.amendes - 0.2, T.question + 0.2, 0.4, 0.5);
        kWipe(ctx, 'AMENDES DE PLUSIEURS M$', lx, ly + m * 0.25, { size: Math.floor(m * 0.036), weight: 900, color: C.amber, t: seg(lt, T.amendes, T.amendes + 0.9), alpha: amA, edge: C.gold, maxW: V ? w * 0.9 : w * 0.42 });
      }

      /* ── ACTE III : rapport de force avec les géants du Web ── */
      const beams = env(lt, T.question - 0.3, D, 0.6, 0.3);
      if (beams > 0.003) {
        const south = [[-77, 44.6], [-73.6, 44.9], [-70.6, 45.1], [-68.2, 47.0]];
        south.forEach(([lo, la], i) => {
          const q = Pj.project(lo, la);
          const fromP = { x: q.x + (i - 1.5) * m * 0.12, y: h + m * 0.05 };
          const ph = (gt * 0.5 + i * 0.27) % 1;
          const pts = [fromP, { x: q.x, y: q.y + m * 0.02 }];
          glowPath(ctx, pts, 1, { color: C.amber, width: 2.4, alpha: beams * (0.35 + 0.4 * Math.sin(ph * Math.PI)), head: false });
          const hp = along(pts, eInOutQuart(ph));
          light(ctx, hp.x, hp.y, m * 0.03, C.gold, beams * 0.9);
          if (ph > 0.9) shockwave(ctx, q.x, q.y + m * 0.02, m * 0.05, gt, { color: C.gold, alpha: beams * 0.5, count: 1, period: 1 });
        });
        // médias bloqués
        const nA = env(lt, T.bloquer - 0.3, T.jusqu, 0.4, 0.4);
        const nx = V ? cx : w * 0.74;
        const ny = V ? h * 0.8 : cy - m * 0.07;
        for (let i = 0; i < 5; i++) {
          const ix = nx + (i - 2) * m * 0.07;
          newsIcon(ctx, ix, ny, m * 0.045, { alpha: nA * (1 - smooth(seg(lt, T.bloquer + 0.8 + i * 0.12, T.bloquer + 1.4 + i * 0.12)) * 0.55), struck: seg(lt, T.bloquer + 0.6 + i * 0.12, T.bloquer + 1.1 + i * 0.12) });
        }
        mono(ctx, 'META · MÉDIAS CANADIENS', nx, ny - m * 0.08, { size: Math.floor(m * 0.02), color: C.amber, t: seg(lt, T.bloquer, T.bloquer + 1), alpha: nA });
        kWipe(ctx, 'NOUVELLES BLOQUÉES', nx, ny + m * 0.1, { size: Math.floor(m * 0.036), weight: 900, color: C.white, t: seg(lt, T.bloquer + 0.6, T.bloquer + 1.4), alpha: nA, edge: C.red });
        kWipe(ctx, 'POUR ÉVITER DE PAYER', nx, ny + m * 0.15, { size: Math.floor(m * 0.024), weight: 700, color: C.amber, t: seg(lt, T.payer - 0.2, T.payer + 0.6), alpha: nA, edge: C.amber });
        // Québec et Ottawa, puis la question
        const jA = smooth(seg(lt, T.jusqu, T.jusqu + 0.5));
        if (jA > 0.003) {
          const q1 = Pj.project(...P('quebec'));
          const q2 = Pj.project(...P('ottawa'));
          cityTag(ctx, q1.x, q1.y, 'QUÉBEC', { color: C.cyan, t: seg(lt, T.jusqu + 0.2, T.jusqu + 1.0), alpha: jA, side: 'right', size: Math.floor(m * 0.022), time: gt, pulse: true });
          cityTag(ctx, q2.x, q2.y, 'OTTAWA', { color: C.amber, t: seg(lt, T.jusqu + 0.5, T.jusqu + 1.3), alpha: jA, side: 'left', size: Math.floor(m * 0.022), time: gt, pulse: true });
          const qx = V ? cx : w * 0.74;
          const qy = V ? h * 0.82 : cy + m * 0.04;
          kZoom(ctx, 'JUSQU’OÙ ?', qx, qy, { size: Math.floor(m * (V ? 0.13 : 0.11)), weight: 900, t: seg(lt, T.jusqu, T.jusqu + 1.1), alpha: jA, glow: 24, glowColor: rgba(C.amber, 0.45), from: 1.4 });
          kWords(ctx, ['VIE', 'PRIVÉE', 'DES', 'CITOYENS', "D'ICI"], qx, qy + m * 0.08, { size: Math.floor(m * 0.028), weight: 700, color: C.ice, time: lt, times: [T.respect + 0.5, T.respect + 0.7, T.ici - 0.3, T.ici, T.ici + 0.3], alpha: jA });
        }
      }
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 06 — d2-fait-declencheur · Marées humaines au Portugal et en France
 * Acte I   : survol nocturne de l'Europe de l'Ouest (carte inclinée)
 * Acte II  : fleuves de manifestants vers Lisbonne et Porto, puis 50 villes françaises
 * Acte III : les immeubles s'étirent hors de portée — travailler ne suffit plus
 * ════════════════════════════════════════════════════════════════════════ */

const FR_CITIES = [
  [2.35, 48.86], [4.84, 45.76], [5.37, 43.3], [1.44, 43.6], [-0.58, 44.84], [-1.55, 47.22], [3.06, 50.63], [7.75, 48.57], [-1.68, 48.11], [3.88, 43.61],
  [7.26, 43.7], [5.72, 45.19], [1.1, 49.44], [-0.37, 49.18], [-4.49, 48.39], [0.69, 47.39], [1.91, 47.9], [5.04, 47.32], [6.02, 47.24], [6.18, 49.12],
  [6.18, 48.69], [4.03, 49.26], [2.3, 49.9], [0.2, 48.0], [-0.55, 47.47], [0.34, 46.58], [1.26, 45.83], [3.08, 45.78], [4.39, 45.44], [4.81, 43.95],
  [4.36, 43.84], [2.9, 42.7], [-0.37, 43.3], [-1.47, 43.49], [-1.15, 46.16], [5.93, 43.12], [7.34, 47.75], [0.1, 49.49], [4.89, 44.93], [6.13, 45.9],
  [5.92, 45.57], [1.53, 45.16], [0.62, 44.2], [-3.37, 47.75], [-2.76, 47.66], [1.86, 50.95], [4.07, 48.3], [2.4, 47.08], [1.35, 44.02], [3.22, 43.34]
];

/** Rangée d'immeubles qui s'étirent vers le haut (loyers hors de portée). */
function stretchTowers(ctx, stage, t, time, o = {}) {
  const { alpha = 1, baseY, count = 9 } = o;
  if (alpha <= 0.003) return;
  const { w, h } = stage;
  const r = cached('towers', () => {
    const g = rng(55);
    return Array.from({ length: 12 }, () => ({ w: 0.06 + g() * 0.05, h: 0.18 + g() * 0.16, sp: 0.6 + g() * 0.8, seed: Math.floor(g() * 1e6) }));
  });
  ctx.save();
  ctx.globalAlpha *= alpha;
  let x = w * 0.08;
  const total = r.slice(0, count).reduce((acc, b) => acc + b.w * w + w * 0.012, 0);
  x = (w - total) / 2;
  for (let i = 0; i < count; i++) {
    const b = r[i];
    const bw = b.w * w;
    const grow = eInOutQuart(clamp(t * b.sp * 1.2 - i * 0.03));
    const bh = b.h * h + grow * h * (0.9 + b.sp * 0.4);
    const top = baseY - bh;
    const g = ctx.createLinearGradient(0, top, 0, baseY);
    g.addColorStop(0, rgba(C.amber, 0.0));
    g.addColorStop(0.25, rgba(C.amber, 0.25));
    g.addColorStop(1, 'rgba(10,22,38,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(x, top, bw, bh);
    ctx.strokeStyle = rgba(C.amber, 0.7);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, top);
    ctx.moveTo(x + bw, top);
    ctx.lineTo(x + bw, baseY);
    ctx.stroke();
    // fenêtres
    const rr = rng(b.seed);
    for (let yy = baseY - 18; yy > Math.max(top + 10, -20); yy -= 16) {
      for (let k = 0; k < 4; k++) {
        if (rr() > 0.55) {
          ctx.fillStyle = rr() > 0.85 ? rgba(C.gold, 0.9) : rgba(C.ice, 0.28);
          ctx.fillRect(x + 6 + k * ((bw - 12) / 4), yy, (bw - 12) / 4 - 4, 5);
        }
      }
    }
    x += bw + w * 0.012;
  }
  ctx.fillStyle = rgba(C.amber, 0.7);
  ctx.fillRect(0, baseY, w, 1.5);
  ctx.restore();
}

function sceneStreets(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    deuxieme: 'Deuxième grand',
    colere: 'colère sociale',
    logement: 'du logement',
    deborde: 'déborde',
    portugal: 'Au Portugal',
    dizaines: 'dizaines de milliers',
    lisbonne: 'Lisbonne',
    porto: 'Porto',
    vaste: 'plus vaste',
    loyers: 'prix des loyers',
    france: 'en France',
    centmille: 'cent mille',
    villes: 'cinquantaine de villes',
    acte: 'Acte cinq',
    vie: 'contre la vie chère',
    etudiants: 'étudiants',
    familles: 'familles',
    retraites: 'retraités',
    constat: 'même constat',
    travailler: 'travailler ne suffit',
    loger: 'se loger dignement'
  });

  const mapOut = smooth(seg(lt, T.constat - 0.6, T.constat + 0.6));
  // Caméra : survol (cap, latitude visée, échelle)
  const camT = trackV(lt, [
    [0, [-2, 43.5, 0.7]],
    [T.portugal - 0.4, [-4, 42.5, 0.85], (x) => x],
    [T.portugal + 1.2, [-8.2, 39.8, 1.6], eInOutQuart],
    [T.loyers, [-8.4, 40.2, 1.72], (x) => x],
    [T.france + 1.0, [2.2, 46.4, 1.15], eInOutQuart],
    [T.vie + 1.0, [2.4, 46.6, 1.25], (x) => x],
    [D, [2.4, 47, 1.4], eInOutQuart]
  ]);

  frame(a, () => {
    dust(ctx, stage, gt, { count: 90, alpha: 0.35 });
    const mA = 1 - mapOut;
    if (mA > 0.003) {
      const sc = m * (V ? 0.024 : 0.03) * camT[2];
      const Pj = makeTilt(camT[0], camT[1], sc, cx, cy + (V ? -h * 0.06 : m * 0.06), V ? 0.85 : 0.95, m * 1.5, 0);
      ctx.save();
      ctx.globalAlpha *= mA;
      const dots = regionDots('weu', -16, 22, 33, 58, 0.22);
      drawDots(ctx, Pj, dots, { color: C.cyan, size: sc * 0.075, alpha: 0.55, depthFade: true });
      // lumières des villes (nuit)
      FR_CITIES.forEach(([lo, la], i) => {
        const q = Pj.project(lo, la);
        if (!q.vis) return;
        light(ctx, q.x, q.y, sc * 0.25 * q.s, C.gold, 0.25);
      });

      // ── Portugal : fleuves de manifestants vers Lisbonne et Porto ──
      const pt = smooth(seg(lt, T.portugal - 0.2, T.portugal + 1.2)) * (1 - smooth(seg(lt, T.france + 0.5, T.france + 2.5)) * 0.7);
      if (pt > 0.003) {
        const targets = [P('lisbon'), P('porto')];
        const flows = cached('ptFlows', () => {
          const r = rng(351);
          return Array.from({ length: 420 }, () => {
            const tg = r() < 0.6 ? 0 : 1;
            const ang = r() * TAU;
            const rad = 0.6 + r() * 2.2;
            return { tg, lo: 0, la: 0, ang, rad, d: r(), sp: 0.12 + r() * 0.18 };
          });
        });
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const f of flows) {
          const tg = targets[f.tg];
          const ph = (gt * f.sp + f.d) % 1;
          const k = eInCubic(ph);
          const lo = tg[0] + Math.cos(f.ang) * f.rad * (1 - k) * 1.2;
          const la = tg[1] + Math.sin(f.ang) * f.rad * (1 - k) * 0.9 - Math.sin(k * Math.PI) * 0.15;
          const lo2 = Math.min(lo, -6.3);
          const q = Pj.project(lo2, la);
          ctx.globalAlpha = pt * (0.3 + 0.7 * k) * smooth(seg(lt, T.dizaines - 1 + f.d, T.dizaines + f.d));
          ctx.fillStyle = f.d > 0.75 ? C.white : C.amber;
          const s = 2.4 * q.s;
          ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
        }
        ctx.restore();
        const ql = Pj.project(...P('lisbon'));
        const qp = Pj.project(...P('porto'));
        light(ctx, ql.x, ql.y, m * 0.12, C.amber, pt * (0.5 + 0.2 * Math.sin(gt * 3)));
        light(ctx, qp.x, qp.y, m * 0.09, C.amber, pt * (0.45 + 0.2 * Math.sin(gt * 3 + 1)));
        cityTag(ctx, ql.x, ql.y, 'LISBONNE', { color: C.amber, t: seg(lt, T.lisbonne - 0.2, T.lisbonne + 0.8), alpha: pt, side: 'left', size: Math.floor(m * 0.024), time: gt, pulse: true });
        cityTag(ctx, qp.x, qp.y, 'PORTO', { color: C.amber, t: seg(lt, T.porto - 0.2, T.porto + 0.8), alpha: pt, side: 'left', size: Math.floor(m * 0.024), time: gt, pulse: true });
      }

      // ── France : 50 villes s'embrasent ──
      const fr = smooth(seg(lt, T.france - 0.2, T.france + 0.8));
      if (fr > 0.003) {
        const q0 = Pj.project(...P('paris'));
        FR_CITIES.forEach(([lo, la], i) => {
          const q = Pj.project(lo, la);
          if (!q.vis) return;
          const r = rng(i * 31 + 7)();
          const on = smooth(seg(lt, T.villes - 1.2 + r * 1.8, T.villes - 0.6 + r * 1.8));
          if (on <= 0) return;
          light(ctx, q.x, q.y, m * 0.035 * q.s * (1 + 0.15 * Math.sin(gt * 4 + i)), C.cyan, fr * on * 0.9);
          ctx.save();
          ctx.globalAlpha *= fr * on;
          ctx.fillStyle = C.white;
          ctx.fillRect(q.x - 2.5, q.y - 2.5, 5, 5);
          ctx.restore();
          // filaments de convergence vers Paris (mobilisation nationale)
          if (i > 0 && i % 2 === 0) {
            const pts = quadPts(q, q0, m * 0.02, 20);
            glowPath(ctx, pts, seg(lt, T.villes + r, T.villes + r + 1.5), { color: C.cyan, width: 1, alpha: fr * on * 0.35, head: false, glow: 0.4 });
          }
        });
        shockwave(ctx, q0.x, q0.y, m * 0.1, gt, { color: C.cyan, alpha: fr * 0.6, count: 3 });
      }
      ctx.restore();
    }

    /* ── Typographie ── */
    const lx = V ? cx : w * 0.72;
    const ly = V ? h * 0.74 : h * 0.3;
    const big = Math.floor(m * (V ? 0.09 : 0.08));
    const maxW = V ? w * 0.9 : w * 0.46;
    // Acte I
    const iA = env(lt, T.deuxieme - 0.2, T.portugal + 0.2, 0.4, 0.6);
    mono(ctx, '02 · LOGEMENT & VIE CHÈRE', lx, ly - big * 0.95, { size: Math.floor(m * 0.022), color: C.cyan, t: seg(lt, T.deuxieme, T.deuxieme + 1.2), alpha: iA });
    kRise(ctx, 'COLÈRE SOCIALE', lx, ly, { size: big, weight: 900, t: seg(lt, T.colere - 0.1, T.colere + 1.0), alpha: iA, maxW });
    kWipe(ctx, 'ELLE DÉBORDE DANS LES RUES', lx, ly + big * 0.75, { size: Math.floor(m * 0.03), weight: 800, color: C.amber, t: seg(lt, T.deborde - 0.1, T.deborde + 0.8), alpha: iA, maxW });
    // Portugal
    const pA = env(lt, T.portugal - 0.1, T.france, 0.4, 0.5);
    kRise(ctx, 'PORTUGAL', lx, ly, { size: big, weight: 900, t: seg(lt, T.portugal, T.portugal + 1.0), alpha: pA, color: C.white, maxW });
    kWipe(ctx, 'DES DIZAINES DE MILLIERS', lx, ly + big * 0.72, { size: Math.floor(m * 0.032), weight: 800, color: C.amber, t: seg(lt, T.dizaines, T.dizaines + 0.8), alpha: pA, maxW });
    mono(ctx, 'LA PLUS VASTE MANIFESTATION DU MOUVEMENT', lx, ly + big * 1.25, { size: Math.floor(m * 0.018), color: C.slate, t: seg(lt, T.vaste, T.vaste + 1.6), alpha: pA });
    kSlide(ctx, 'CONTRE L’EXPLOSION DES LOYERS', lx, ly + big * 1.7, { size: Math.floor(m * 0.026), weight: 700, color: C.white, t: seg(lt, T.loyers - 0.6, T.loyers + 0.4), alpha: pA, maxW });
    // France
    const fA = env(lt, T.france - 0.1, T.constat - 0.2, 0.4, 0.5);
    kRise(ctx, 'FRANCE', lx, ly, { size: big, weight: 900, t: seg(lt, T.france, T.france + 0.9), alpha: fA, maxW });
    odometer(ctx, 100000 * eOutQuint(seg(lt, T.centmille - 0.3, T.centmille + 1.4)), lx, ly + big * 0.95, { size: Math.floor(big * 0.72), weight: 800, color: C.cyan, prefix: '+', alpha: fA, glow: 12, glowColor: rgba(C.cyan, 0.5) });
    mono(ctx, 'MANIFESTANTS', lx, ly + big * 1.35, { size: Math.floor(m * 0.02), color: C.slate, t: seg(lt, T.centmille + 0.4, T.centmille + 1.2), alpha: fA });
    const vA = smooth(seg(lt, T.villes - 0.2, T.villes + 0.3));
    odometer(ctx, 50 * eOutCubic(seg(lt, T.villes - 0.2, T.villes + 1.2)), lx - m * 0.1, ly + big * 2.1, { size: Math.floor(big * 0.5), weight: 800, color: C.white, prefix: '≈', alpha: fA * vA, suffix: 'VILLES', suffixScale: 0.5, suffixColor: C.slate, roll: false, align: 'center' });
    const acteA = smooth(seg(lt, T.acte - 0.2, T.acte + 0.3));
    chevrons(ctx, lx + m * 0.12, ly + big * 2.05, m * 0.04, { t: seg(lt, T.acte, T.acte + 0.8), alpha: fA * acteA });
    kZoom(ctx, 'ACTE 5', lx + m * 0.24, ly + big * 2.1, { size: Math.floor(big * 0.5), weight: 900, color: C.amber, t: seg(lt, T.acte, T.acte + 0.8), alpha: fA, align: 'center' });
    // qui manifeste
    const who = [
      [T.etudiants, 'ÉTUDIANTS'],
      [T.familles, 'FAMILLES'],
      [T.retraites, 'RETRAITÉS']
    ];
    who.forEach(([k, lab], i) => {
      const t = seg(lt, k - 0.15, k + 0.6);
      const px = lx + (i - 1) * m * (V ? 0.26 : 0.17);
      const py = ly + big * 3.25;
      person(ctx, px, py - m * 0.025, m * 0.05 * eOutBack(t, 2), i === 2 ? C.ice : C.cyan, fA * clamp(t * 2));
      kSlide(ctx, lab, px, py + m * 0.025, { size: Math.floor(m * 0.019), weight: 700, color: C.slate, t, alpha: fA });
    });

    /* ── ACTE III : les tours hors de portée ── */
    if (mapOut > 0.003) {
      const baseY = V ? h * 0.78 : h * 0.86;
      stretchTowers(ctx, stage, seg(lt, T.constat, D - 0.3), gt, { alpha: mapOut, baseY, count: V ? 7 : 11 });
      // personne qui lève la main au pied des tours
      const px = cx;
      person(ctx, px, baseY, m * 0.075, C.white, mapOut);
      const reach = 0.5 + 0.5 * Math.sin(gt * 2);
      ctx.save();
      ctx.globalAlpha *= mapOut;
      ctx.strokeStyle = C.white;
      ctx.lineWidth = m * 0.008;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px + m * 0.02, baseY - m * 0.05);
      ctx.lineTo(px + m * 0.04, baseY - m * (0.1 + reach * 0.01));
      ctx.stroke();
      ctx.restore();
      const ty = V ? h * 0.2 : h * 0.2;
      // voile sombre derrière le texte pour la lisibilité
      ctx.save();
      ctx.globalAlpha *= mapOut * 0.75;
      const vg = ctx.createLinearGradient(0, ty - m * 0.14, 0, ty + m * 0.12);
      vg.addColorStop(0, 'rgba(3,5,9,0)');
      vg.addColorStop(0.5, 'rgba(3,5,9,0.9)');
      vg.addColorStop(1, 'rgba(3,5,9,0)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, ty - m * 0.14, w, m * 0.26);
      ctx.restore();
      mono(ctx, 'UN MÊME CONSTAT', cx, ty - m * 0.085, { size: Math.floor(m * 0.022), color: C.amber, t: seg(lt, T.constat, T.constat + 0.8), alpha: mapOut });
      kRise(ctx, 'TRAVAILLER NE SUFFIT PLUS', cx, ty, { size: Math.floor(m * (V ? 0.065 : 0.07)), weight: 900, t: seg(lt, T.travailler - 0.1, T.travailler + 1.0), alpha: mapOut, maxW: w * 0.9 });
      kWipe(ctx, 'POUR SE LOGER DIGNEMENT', cx, ty + m * 0.07, { size: Math.floor(m * 0.032), weight: 800, color: C.ice, t: seg(lt, T.loger - 0.2, T.loger + 0.7), alpha: mapOut, edge: C.amber });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 07 — d2-coulisses-geopolitiques · Le logement devenu actif financier mondial
 * Acte I   : quatre villes, une même pulsation (Lisbonne · Paris · Dublin · Montréal) ; 10 ANS
 * Acte II  : un quartier en traits fins sur une base stable, enveloppé par les capitaux,
 *            se transforme en colonnes boursières ; trois forces le frappent
 * Acte III : deux courbes plein écran se décrochent : prix ↗, revenus →
 * ════════════════════════════════════════════════════════════════════════ */

/** Maison isométrique en traits fins ; morph → colonne boursière (chandelier). */
function isoHouse(ctx, x, y, s, o = {}) {
  const { alpha = 1, morph = 0, color = C.cyan, hot = C.amber, hgt = 1, time = 0, idx = 0 } = o;
  if (alpha <= 0.003) return;
  const e = eInOutQuart(morph);
  const col = mix(color, hot, e);
  const W = s * lerp(1, 0.55, e);
  const H = s * lerp(0.7, 2.4 * hgt, e);
  const dx = W * 0.5;
  const dy = W * 0.28;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = rgba(col, 0.9);
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.shadowColor = col;
  ctx.shadowBlur = 8;
  // faces
  ctx.fillStyle = rgba(col, 0.08 + 0.12 * e);
  ctx.beginPath();
  ctx.moveTo(x - dx, y);
  ctx.lineTo(x, y + dy);
  ctx.lineTo(x, y + dy - H);
  ctx.lineTo(x - dx, y - H);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rgba(col, 0.16 + 0.18 * e);
  ctx.beginPath();
  ctx.moveTo(x, y + dy);
  ctx.lineTo(x + dx, y);
  ctx.lineTo(x + dx, y - H);
  ctx.lineTo(x, y + dy - H);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // toit (disparaît avec le morph)
  const roof = 1 - e;
  if (roof > 0.01) {
    ctx.globalAlpha = alpha * roof;
    ctx.beginPath();
    ctx.moveTo(x - dx, y - H);
    ctx.lineTo(x - dx * 0.0, y - H - s * 0.42);
    ctx.lineTo(x + dx, y - H);
    ctx.moveTo(x, y + dy - H);
    ctx.lineTo(x, y - H - s * 0.42);
    ctx.stroke();
    // porte et fenêtre
    ctx.strokeRect(x + dx * 0.25, y - H * 0.5, dx * 0.35, H * 0.42);
    ctx.strokeRect(x - dx * 0.75, y - H * 0.72, dx * 0.4, H * 0.28);
  }
  // mèche de chandelier boursier
  if (e > 0.05) {
    ctx.globalAlpha = alpha * e;
    ctx.strokeStyle = hot;
    ctx.shadowColor = hot;
    ctx.shadowBlur = 10;
    const wick = s * 0.5 * (0.6 + 0.4 * Math.sin(time * 1.5 + idx));
    ctx.beginPath();
    ctx.moveTo(x, y + dy - H);
    ctx.lineTo(x, y + dy - H - wick);
    ctx.stroke();
    light(ctx, x, y + dy - H - wick, s * 0.25, hot, e * 0.6);
  }
  ctx.restore();
}

function sceneAsset(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    pourquoi: 'Pourquoi',
    simult: 'simultanément',
    lisbonne: 'Lisbonne,',
    paris: 'Paris,',
    dublin: 'Dublin',
    montreal: 'Montréal ?',
    dix: 'dix',
    nature: 'changé de nature',
    toit: 'simple toit',
    salaire: 'salaire local',
    placement: 'placement financier',
    fonds: "fonds d'investissement",
    touristiques: 'locations touristiques',
    construction: 'coûts de construction',
    taux: "taux d'intérêt",
    decroches: 'décrochés',
    revenus: 'revenus des habitants'
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 100, alpha: 0.35 });

    /* ── ACTE I : quatre villes, une même pulsation ── */
    const aI = 1 - smooth(seg(lt, T.nature + 0.4, T.nature + 1.2));
    if (aI > 0.003) {
      const cities = [
        [T.lisbonne, 'LISBONNE', C.amber],
        [T.paris, 'PARIS', C.amber],
        [T.dublin, 'DUBLIN', C.amber],
        [T.montreal, 'MONTRÉAL', C.cyan]
      ];
      const pos = cities.map((_, i) => (V ? { x: cx, y: h * 0.25 + i * h * 0.1 } : { x: w * (0.17 + i * 0.22), y: cy - m * 0.1 }));
      // ligne de pulsation commune (électrocardiogramme)
      const lineT = seg(lt, T.lisbonne - 0.3, T.montreal + 0.6);
      if (!V) {
        const pts = [];
        for (let i = 0; i <= 240; i++) {
          const u = i / 240;
          const x = lerp(w * 0.08, w * 0.92, u);
          let y = cy - m * 0.1;
          pos.forEach((p) => {
            const dd = (x - p.x) / (m * 0.03);
            y -= Math.exp(-dd * dd) * m * 0.07 * Math.sin(dd * 2.2 + 0.4);
          });
          pts.push({ x, y });
        }
        glowPath(ctx, pts, lineT, { color: C.amber, width: 2, alpha: aI * 0.9 });
        // impulsion qui circule
        if (lineT >= 1) {
          const hp = along(pts, (gt * 0.35) % 1);
          light(ctx, hp.x, hp.y, m * 0.05, C.white, aI * 0.8);
        }
      }
      cities.forEach(([k, lab, col], i) => {
        const p = pos[i];
        const t = seg(lt, k - 0.2, k + 0.7);
        beacon(ctx, p.x, p.y, { color: col, r: 9 * eOutBack(t, 2), alpha: aI * clamp(t * 2), time: gt + i * 0.25 });
        kRise(ctx, lab, V ? p.x : p.x, V ? p.y + m * 0.07 : p.y + m * 0.1, { size: Math.floor(m * 0.042), weight: 900, t, alpha: aI, color: C.white });
      });
      mono(ctx, 'EN MÊME TEMPS', cx, V ? h * 0.18 : cy - m * 0.27, { size: Math.floor(m * 0.022), color: C.ice, t: seg(lt, T.simult - 0.2, T.simult + 0.9), alpha: aI });
      // 10 ANS
      const dA = env(lt, T.dix - 0.3, T.nature + 1.2, 0.3, 0.6);
      const dy = V ? h * 0.72 : cy + m * 0.26;
      odometer(ctx, 10 * eOutCubic(seg(lt, T.dix - 0.2, T.dix + 0.9)), cx - m * 0.02, dy, { size: Math.floor(m * 0.11), weight: 900, color: C.amber, align: 'right', alpha: dA, roll: false, glow: 16, glowColor: rgba(C.amber, 0.5) });
      kSlide(ctx, 'ANS', cx + m * 0.01, dy, { size: Math.floor(m * 0.055), weight: 800, color: C.white, align: 'left', t: seg(lt, T.dix, T.dix + 0.7), alpha: dA });
    }
    // le constat reste affiché en haut pendant que le quartier apparaît
    const nA = env(lt, T.nature - 0.2, T.toit - 0.4, 0.3, 0.5);
    mono(ctx, 'EN DIX ANS', cx, (V ? h * 0.2 : h * 0.17) - m * 0.07, { size: Math.floor(m * 0.02), color: C.amber, t: seg(lt, T.nature + 0.6, T.nature + 1.4), alpha: nA * smooth(seg(lt, T.nature + 0.5, T.nature + 1)) });
    kWipe(ctx, 'LE LOGEMENT A CHANGÉ DE NATURE', cx, V ? h * 0.2 : h * 0.17, { size: Math.floor(m * 0.045), weight: 900, color: C.white, t: seg(lt, T.nature - 0.1, T.nature + 0.8), alpha: nA, maxW: w * 0.9 });

    /* ── ACTE II : le quartier devient un placement ── */
    const aII = smooth(seg(lt, T.nature + 0.4, T.nature + 1.4)) * (1 - smooth(seg(lt, T.construction + 0.6, T.taux + 0.6)));
    if (aII > 0.003) {
      const n = V ? 5 : 7;
      const s = m * (V ? 0.13 : 0.12);
      const baseY = V ? h * 0.56 : cy + m * 0.14;
      const span = V ? w * 0.8 : w * 0.66;
      const x0 = cx - span / 2;
      // base stable
      ctx.save();
      ctx.globalAlpha *= aII;
      ctx.fillStyle = rgba(C.ice, 0.55);
      ctx.fillRect(x0 - s, baseY + s * 0.3, span + s * 2, 2);
      ctx.restore();
      const morphT = seg(lt, T.placement - 0.2, T.placement + 2.4);
      // flux de capitaux qui enveloppent le quartier
      const capA = smooth(seg(lt, T.placement - 0.6, T.placement + 0.6));
      if (capA > 0.003) {
        for (let k = 0; k < 5; k++) {
          const pts = [];
          for (let i = 0; i <= 120; i++) {
            const u = i / 120;
            const x = lerp(-w * 0.05, w * 1.05, u);
            const y = baseY - s * (1.6 + k * 0.35) - Math.sin(u * Math.PI * 2 + k + gt * 0.8) * s * 0.35;
            pts.push({ x, y });
          }
          glowPath(ctx, pts, seg(lt, T.placement - 0.4 + k * 0.15, T.placement + 1.2 + k * 0.15), { color: C.amber, width: 1.4, alpha: aII * capA * 0.6, head: true, glow: 0.6 });
          // pièces/jetons de capital
          for (let j = 0; j < 4; j++) {
            const hp = along(pts, (gt * 0.12 + j / 4 + k * 0.07) % 1);
            ctx.save();
            ctx.globalAlpha *= aII * capA;
            ctx.fillStyle = C.gold;
            ctx.beginPath();
            ctx.arc(hp.x, hp.y, 3.2, 0, TAU);
            ctx.fill();
            ctx.restore();
          }
        }
      }
      for (let i = 0; i < n; i++) {
        const x = x0 + (i / (n - 1)) * span;
        const t = seg(lt, T.nature + 0.4 + i * 0.08, T.nature + 1.4 + i * 0.08);
        const mo = clamp(morphT * 1.6 - (i / n) * 0.6);
        const hgt = 0.6 + 0.4 * Math.abs(Math.sin(i * 1.7)) + (i / n) * 0.6;
        isoHouse(ctx, x, baseY + (1 - eOutExpo(t)) * s * 0.6, s, { alpha: aII * clamp(t * 2), morph: mo, hgt, time: gt, idx: i });
      }
      // légendes
      const ty = V ? h * 0.24 : h * 0.22;
      const tA = env(lt, T.toit - 0.3, T.placement + 0.1, 0.4, 0.4);
      kWords(ctx, ['UN', 'TOIT', '·', 'UN', 'SALAIRE', 'LOCAL'], cx, ty, { size: Math.floor(m * (V ? 0.05 : 0.05)), weight: 900, color: C.white, time: lt, times: [T.toit - 0.3, T.toit, T.toit + 0.6, T.salaire - 0.5, T.salaire - 0.25, T.salaire], alpha: tA });
      const pA = env(lt, T.placement - 0.1, T.construction + 0.8, 0.4, 0.5);
      mono(ctx, "L'IMMOBILIER EST DEVENU", cx, ty - m * 0.07, { size: Math.floor(m * 0.02), color: C.ice, t: seg(lt, T.placement - 0.6, T.placement + 0.4), alpha: pA });
      kZoom(ctx, 'UN PLACEMENT FINANCIER', cx, ty, { size: Math.floor(m * (V ? 0.058 : 0.06)), weight: 900, color: C.amber, t: seg(lt, T.placement, T.placement + 1.0), alpha: pA, maxW: w * 0.9, glow: 16, glowColor: rgba(C.amber, 0.4) });
      // trois forces
      const forces = [
        [T.fonds, 'FONDS D’INVESTISSEMENT', C.amber],
        [T.touristiques, 'LOCATIONS TOURISTIQUES', C.coral],
        [T.construction, 'CONSTRUCTION & TAUX ↑', C.gold]
      ];
      forces.forEach(([k, lab, col], i) => {
        const fA = env(lt, k - 0.3, T.taux + 0.6, 0.3, 0.5) * aII;
        if (fA <= 0.003) return;
        const fx = V ? cx : w * (0.22 + i * 0.28);
        const fy = V ? h * (0.7 + i * 0.065) : baseY + s * 1.25;
        // flèche d'impact qui descend sur le quartier
        const t = eOutExpo(seg(lt, k - 0.2, k + 0.6));
        if (!V) {
          const ax = fx;
          const ay0 = ty + m * 0.08;
          const ay1 = lerp(ay0, baseY - s * 2.4, t);
          ctx.save();
          ctx.globalAlpha *= fA * 0.8;
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(ax, ay0);
          ctx.lineTo(ax, ay1);
          ctx.stroke();
          ctx.restore();
          arrowHead(ctx, ax, ay1, Math.PI / 2, 10, col, fA * t);
        }
        kSlide(ctx, lab, fx, fy, { size: Math.floor(m * 0.026), weight: 800, color: col, t: seg(lt, k - 0.1, k + 0.6), alpha: fA, maxW: V ? w * 0.9 : w * 0.26 });
      });
    }

    /* ── ACTE III : le grand décrochage ── */
    const aIII = smooth(seg(lt, T.construction + 0.4, T.taux + 0.6));
    if (aIII > 0.003) {
      const gx0 = V ? w * 0.1 : w * 0.1;
      const gx1 = V ? w * 0.9 : w * 0.86;
      const gy = V ? h * 0.66 : h * 0.78;
      const gh = V ? h * 0.36 : h * 0.5;
      const draw = eInOutQuart(seg(lt, T.taux - 0.4, T.decroches + 1.2));
      ctx.save();
      ctx.globalAlpha *= aIII;
      ctx.strokeStyle = rgba(C.slate, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx0, gy);
      ctx.lineTo(gx1, gy);
      ctx.moveTo(gx0, gy);
      ctx.lineTo(gx0, gy - gh);
      ctx.stroke();
      ctx.restore();
      const price = [];
      const income = [];
      for (let i = 0; i <= 100; i++) {
        const u = i / 100;
        const x = lerp(gx0, gx1, u);
        price.push({ x, y: gy - gh * (0.12 + 0.8 * Math.pow(u, 2.1) + 0.015 * Math.sin(u * 30)) });
        income.push({ x, y: gy - gh * (0.12 + 0.1 * u + 0.008 * Math.sin(u * 22)) });
      }
      // zone d'écart
      const nDraw = Math.max(1, Math.floor(draw * 100));
      ctx.save();
      ctx.globalAlpha *= aIII * 0.22;
      ctx.beginPath();
      ctx.moveTo(price[0].x, price[0].y);
      for (let i = 1; i <= nDraw; i++) ctx.lineTo(price[i].x, price[i].y);
      for (let i = nDraw; i >= 0; i--) ctx.lineTo(income[i].x, income[i].y);
      ctx.closePath();
      const gg = ctx.createLinearGradient(0, gy - gh, 0, gy);
      gg.addColorStop(0, rgba(C.amber, 0.9));
      gg.addColorStop(1, rgba(C.amber, 0.05));
      ctx.fillStyle = gg;
      ctx.fill();
      ctx.restore();
      const hp1 = glowPath(ctx, price, draw, { color: C.amber, width: 3.5, alpha: aIII });
      const hp2 = glowPath(ctx, income, draw, { color: C.cyan, width: 3.5, alpha: aIII });
      const endP = along(price, Math.max(0.001, draw));
      const endI = along(income, Math.max(0.001, draw));
      const lA = aIII * smooth(seg(draw, 0.3, 0.6));
      kSlide(ctx, 'PRIX & LOYERS', endP.x - m * 0.02, endP.y - m * 0.03, { size: Math.floor(m * 0.03), weight: 900, color: C.amber, align: 'right', t: seg(lt, T.taux, T.taux + 0.8), alpha: lA });
      kSlide(ctx, 'REVENUS DES HABITANTS', endI.x - m * 0.02, endI.y + m * 0.05, { size: Math.floor(m * 0.03), weight: 900, color: C.cyan, align: 'right', t: seg(lt, T.revenus - 0.4, T.revenus + 0.4), alpha: lA });
      // cote du décrochage
      const dA = smooth(seg(lt, T.decroches - 0.2, T.decroches + 0.6));
      if (dA > 0.003) {
        const xq = lerp(gx0, gx1, 0.8);
        const yp = gy - gh * (0.12 + 0.8 * Math.pow(0.8, 2.1));
        const yi = gy - gh * (0.12 + 0.08);
        ctx.save();
        ctx.globalAlpha *= dA * aIII;
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xq, yi);
        ctx.lineTo(xq, lerp(yi, yp, eOutExpo(dA)));
        ctx.stroke();
        ctx.restore();
        kZoom(ctx, 'DÉCROCHAGE', xq - m * 0.03, (yp + yi) / 2, { size: Math.floor(m * 0.05), weight: 900, color: C.white, align: 'right', base: 'middle', t: seg(lt, T.decroches, T.decroches + 0.8), alpha: aIII });
      }
      mono(ctx, 'ILLUSTRATION DU MÉCANISME · SANS ÉCHELLE', V ? cx : gx0, gy + m * 0.04, { size: Math.floor(m * 0.014), color: C.slate, t: aIII, alpha: aIII * 0.6, align: V ? 'center' : 'left', cursor: false });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 08 — d2-deux-cotes-medaille · Plafonner les loyers ou bâtir massivement ?
 * Acte I   : une diagonale lumineuse partage l'espace : DEUX REMÈDES
 * Acte II  : à gauche, un plafond protecteur bloque la hausse et abrite du logement social ;
 *            à droite, des grues multiplient les tours (choc d'offre)
 * Acte III : les deux modèles face à face — protection immédiate vs choc d'offre
 * ════════════════════════════════════════════════════════════════════════ */

/** Grue à tour en traits fins. */
function crane(ctx, x, yBase, H, o = {}) {
  const { alpha = 1, color = C.cyan, swing = 0, hook = 0.5, frozen = 0 } = o;
  if (alpha <= 0.003) return;
  const col = frozen > 0 ? mix(color, '#64748B', frozen) : color;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = col;
  ctx.shadowBlur = 8;
  const mw = H * 0.06;
  // mât en treillis
  ctx.beginPath();
  ctx.moveTo(x - mw / 2, yBase);
  ctx.lineTo(x - mw / 2, yBase - H);
  ctx.moveTo(x + mw / 2, yBase);
  ctx.lineTo(x + mw / 2, yBase - H);
  for (let y = yBase; y > yBase - H; y -= mw) {
    ctx.moveTo(x - mw / 2, y);
    ctx.lineTo(x + mw / 2, y - mw);
  }
  ctx.stroke();
  // flèche (jib) qui pivote
  const jib = H * 0.7 * Math.cos(swing);
  const counter = H * 0.25 * Math.cos(swing);
  const top = yBase - H;
  ctx.beginPath();
  ctx.moveTo(x - counter, top);
  ctx.lineTo(x + jib, top);
  ctx.moveTo(x, top - H * 0.1);
  ctx.lineTo(x + jib, top);
  ctx.moveTo(x, top - H * 0.1);
  ctx.lineTo(x - counter, top);
  ctx.stroke();
  // câble + charge
  const hx = x + jib * (0.35 + 0.55 * hook);
  const hy = top + H * (0.15 + 0.35 * (0.5 + 0.5 * Math.sin(hook * Math.PI * 2)));
  ctx.beginPath();
  ctx.moveTo(hx, top);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.fillStyle = rgba(col, 0.8);
  ctx.fillRect(hx - H * 0.05, hy, H * 0.1, H * 0.035);
  ctx.restore();
}

/** Tour en construction : étages qui s'empilent. */
function towerFloors(ctx, x, yBase, wd, floors, fh, o = {}) {
  const { alpha = 1, color = C.cyan, max = 20 } = o;
  if (alpha <= 0.003 || floors <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const full = Math.floor(floors);
  const part = floors - full;
  for (let i = 0; i < Math.min(max, full + 1); i++) {
    const k = i < full ? 1 : eOutCubic(part);
    if (k <= 0) continue;
    const y = yBase - (i + 1) * fh;
    ctx.globalAlpha = alpha * k;
    ctx.fillStyle = rgba(color, i === full ? 0.35 : 0.14);
    ctx.fillRect(x - wd / 2, y + (1 - k) * -fh * 0.6, wd, fh - 2);
    ctx.strokeStyle = rgba(color, 0.75);
    ctx.lineWidth = 1.1;
    ctx.strokeRect(x - wd / 2, y + (1 - k) * -fh * 0.6, wd, fh - 2);
    for (let j = 0; j < 3; j++) {
      ctx.fillStyle = (i * 3 + j) % 4 === 0 ? rgba(C.gold, 0.8) : rgba(C.ice, 0.35);
      ctx.fillRect(x - wd / 2 + 4 + j * ((wd - 8) / 3), y + fh * 0.3, (wd - 8) / 3 - 4, fh * 0.35);
    }
  }
  ctx.restore();
}

function sceneRemedies(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    comment: 'Comment éteindre',
    deux: 'deux remèdes',
    mouvements: 'Les mouvements citoyens',
    plafond: 'plafonnement strict',
    interdiction: "l'interdiction",
    milliards: 'des milliards en',
    sociaux: 'logements sociaux',
    proteger: 'protéger immédiatement',
    oppose: "À l'opposé",
    economistes: 'économistes de marché',
    bloquer: 'bloquer les loyers',
    fuir: 'fait fuir',
    paralyse: 'paralyse les mises',
    solution: 'la seule vraie solution',
    bureaucratie: 'bureaucratie municipale',
    taxes: 'les taxes',
    construire: 'construire des centaines',
    neufs: 'logements neufs'
  });

  // diagonale : du haut-droite au bas-gauche (paysage) ; du haut-gauche au bas-droite (portrait)
  const diagIn = eOutExpo(seg(lt, 0.15, 1.5));
  const A = V ? { x: w * 0.5, y: h * 0.3 } : { x: w * 0.28, y: h * 0.53 };
  const B = V ? { x: w * 0.5, y: h * 0.76 } : { x: w * 0.72, y: h * 0.53 };

  frame(a, () => {
    dust(ctx, stage, gt, { count: 100, alpha: 0.35 });
    const aA = smooth(seg(lt, T.mouvements - 0.4, T.mouvements + 0.8));
    const aB = smooth(seg(lt, T.oppose - 0.4, T.oppose + 0.8));
    const focusA = 1 - 0.45 * smooth(seg(lt, T.oppose, T.oppose + 1)) * (1 - smooth(seg(lt, T.neufs - 0.8, T.neufs + 0.2)));
    const focusB = 0.35 + 0.65 * aB;

    // champs teintés (clip par la diagonale)
    const p1 = V ? { x: -w * 0.1, y: h * 0.36 } : { x: w * 0.62, y: -h * 0.05 };
    const p2 = V ? { x: w * 1.1, y: h * 0.64 } : { x: w * 0.38, y: h * 1.05 };
    ctx.save();
    ctx.beginPath();
    if (V) {
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p1.x, p1.y);
    } else {
      ctx.moveTo(0, 0);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(0, h);
    }
    ctx.closePath();
    ctx.clip();
    light(ctx, A.x, A.y, m * 0.8, C.amber, 0.2 * aA * focusA);
    ctx.restore();
    light(ctx, B.x, B.y, m * 0.8, C.cyan, 0.2 * aB * focusB);

    // la diagonale lumineuse
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const ex = p1.x + dx * diagIn;
    const ey = p1.y + dy * diagIn;
    ctx.strokeStyle = rgba(C.white, 0.9);
    ctx.lineWidth = 2.4;
    ctx.shadowColor = C.ice;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();
    if (diagIn < 1) flare(ctx, ex, ey, m * 0.1, C.ice, 1 - diagIn);

    // ACTE I
    const tA = env(lt, T.comment - 0.2, T.mouvements + 0.3, 0.3, 0.5);
    mono(ctx, 'COMMENT ÉTEINDRE LA CRISE ?', cx, cy - m * 0.1, { size: Math.floor(m * 0.024), color: C.ice, t: seg(lt, T.comment, T.comment + 1.4), alpha: tA });
    kZoom(ctx, 'DEUX REMÈDES', cx, cy, { size: Math.floor(m * (V ? 0.11 : 0.1)), weight: 900, t: seg(lt, T.deux - 0.1, T.deux + 1.0), alpha: tA, glow: 20, glowColor: rgba(C.ice, 0.4) });
    kWords(ctx, ['OPPOSÉS'], cx, cy + m * 0.07, { size: Math.floor(m * 0.03), weight: 800, color: C.amber, time: lt, times: [T.deux + 0.5], alpha: tA });

    const s = m * (V ? 0.16 : 0.15);

    /* ── CAMP A : PROTÉGER ── */
    if (aA > 0.003) {
      ctx.save();
      ctx.globalAlpha *= aA * focusA;
      const baseY = A.y + s * 1.2;
      const bx = A.x;
      // édifice résidentiel dont la hausse est bloquée par le plafond
      const ceilY = A.y - s * 0.7;
      const ceilT = eOutExpo(seg(lt, T.plafond - 0.2, T.plafond + 0.8));
      const want = A.y - s * 1.9; // la hausse « voudrait » aller jusqu'ici
      const rise = eInOutQuart(seg(lt, T.mouvements, T.plafond + 1.4));
      const top = Math.max(lerp(baseY - s * 0.6, want, rise), ceilT > 0.5 ? ceilY + 4 : -1e9);
      const bw = s * 0.95;
      ctx.fillStyle = 'rgba(30,20,6,0.9)';
      ctx.fillRect(bx - bw / 2, top, bw, baseY - top);
      ctx.strokeStyle = rgba(C.amber, 0.85);
      ctx.lineWidth = 1.6;
      ctx.strokeRect(bx - bw / 2, top, bw, baseY - top);
      for (let y = baseY - s * 0.2; y > top + 8; y -= s * 0.18) {
        for (let k = 0; k < 4; k++) {
          ctx.fillStyle = (Math.floor(y) + k) % 3 === 0 ? rgba(C.gold, 0.85) : rgba(C.amber, 0.25);
          ctx.fillRect(bx - bw / 2 + 6 + k * ((bw - 12) / 4), y, (bw - 12) / 4 - 5, s * 0.07);
        }
      }
      // flèche de la hausse des loyers qui cogne le plafond
      const arrowY = Math.max(top - s * 0.25, ceilY + 10);
      arrowHead(ctx, bx, arrowY, -Math.PI / 2, 12, C.coral, smooth(seg(lt, T.mouvements, T.mouvements + 0.6)));
      // plafond protecteur
      if (ceilT > 0.003) {
        const cw = s * 2.2 * ceilT;
        ctx.save();
        ctx.fillStyle = C.amber;
        ctx.shadowColor = C.amber;
        ctx.shadowBlur = 22;
        ctx.fillRect(bx - cw / 2, ceilY - 5, cw, 6);
        ctx.restore();
        const hitT = (gt * 1.3) % 1;
        if (rise > 0.6) light(ctx, bx, ceilY, s * 0.4 * (1 - hitT), C.gold, 0.7 * (1 - hitT));
      }
      // logements sociaux qui s'ajoutent sous le plafond
      const soc = seg(lt, T.milliards - 0.2, T.proteger + 0.4);
      for (let i = 0; i < 6; i++) {
        const k = eOutBack(clamp(soc * 6 - i), 1.6);
        if (k <= 0) continue;
        const side = i % 2 ? 1 : -1;
        const col = Math.floor(i / 2);
        const ux = bx + side * (bw / 2 + s * 0.22 + col * s * 0.34);
        const uh = s * (0.5 + (i % 3) * 0.15) * k;
        ctx.fillStyle = rgba(C.gold, 0.18);
        ctx.fillRect(ux - s * 0.14, baseY - uh, s * 0.28, uh);
        ctx.strokeStyle = rgba(C.gold, 0.8);
        ctx.strokeRect(ux - s * 0.14, baseY - uh, s * 0.28, uh);
      }
      // valise de location touristique barrée
      const sui = env(lt, T.interdiction - 0.2, T.milliards + 0.6, 0.3, 0.5);
      if (sui > 0.003) {
        const sx = bx + s * 1.25;
        const sy = A.y - s * 0.2;
        ctx.save();
        ctx.globalAlpha *= sui;
        ctx.strokeStyle = C.slate;
        ctx.lineWidth = 2;
        rrect(ctx, sx - s * 0.2, sy - s * 0.14, s * 0.4, s * 0.3, 6);
        ctx.stroke();
        ctx.strokeRect(sx - s * 0.07, sy - s * 0.22, s * 0.14, s * 0.08);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx - s * 0.3, sy + s * 0.25);
        ctx.lineTo(sx - s * 0.3 + s * 0.6 * eOutExpo(seg(lt, T.interdiction + 0.2, T.interdiction + 0.8)), sy + s * 0.25 - s * 0.55 * eOutExpo(seg(lt, T.interdiction + 0.2, T.interdiction + 0.8)));
        ctx.stroke();
        ctx.restore();
      }
      // investisseurs qui fuient (argument du camp B, visible sur le modèle A)
      const flee = env(lt, T.fuir - 0.2, T.solution + 0.4, 0.4, 0.6);
      if (flee > 0.003) {
        for (let i = 0; i < 18; i++) {
          const ph = (gt * 0.5 + i / 18) % 1;
          const ang = -Math.PI * 0.5 + (i / 18 - 0.5) * 1.6;
          const r = s * (0.3 + ph * 1.8);
          ctx.globalAlpha = aA * focusA * flee * (1 - ph);
          ctx.fillStyle = C.gold;
          ctx.beginPath();
          ctx.arc(bx + Math.cos(ang) * r, top + Math.sin(ang) * r * 0.6, 3, 0, TAU);
          ctx.fill();
        }
      }
      // grue figée (mises en chantier paralysées)
      const frz = env(lt, T.paralyse - 0.3, T.solution + 0.4, 0.4, 0.6);
      if (frz > 0.003) crane(ctx, bx - s * 1.35, baseY, s * 1.5, { color: C.amber, alpha: frz * 0.8, swing: 0.3, hook: 0.2, frozen: smooth(seg(lt, T.paralyse, T.paralyse + 1)) });
      ctx.restore();

      const lx = A.x;
      const ly = V ? h * 0.08 + m * 0.07 : h * 0.21;
      mono(ctx, 'MOUVEMENTS CITOYENS · GAUCHE ÉCONOMIQUE', lx, ly - m * 0.06, { size: Math.floor(m * 0.017), color: C.amber, t: seg(lt, T.mouvements, T.mouvements + 1.4), alpha: aA * focusA });
      kRise(ctx, 'PROTÉGER', lx, ly + m * 0.01, { size: Math.floor(m * 0.075), weight: 900, t: seg(lt, T.mouvements + 0.2, T.mouvements + 1.2), alpha: aA * focusA, color: C.white });
      const items = [
        [T.plafond, 'PLAFONNER LES LOYERS'],
        [T.interdiction, 'STOP LOCATIONS TOURISTIQUES'],
        [T.sociaux, 'LOGEMENTS SOCIAUX · HORS MARCHÉ']
      ];
      const iy = V ? A.y + s * 1.55 : A.y + s * 1.62;
      items.forEach(([k, txt], i) => {
        const cur = env(lt, k - 0.2, i < 2 ? items[i + 1][0] - 0.1 : T.oppose + 0.2, 0.3, 0.3);
        kWipe(ctx, txt, lx, iy, { size: Math.floor(m * 0.03), weight: 800, color: C.gold, t: seg(lt, k - 0.1, k + 0.7), alpha: aA * cur, edge: C.amber, maxW: V ? w * 0.9 : w * 0.42 });
      });
    }

    /* ── CAMP B : CONSTRUIRE ── */
    if (aB > 0.003) {
      const baseY = B.y + s * 1.2;
      const build = seg(lt, T.economistes - 0.5, D);
      const towers = V ? 5 : 6;
      for (let i = 0; i < towers; i++) {
        const tx = B.x + (i - (towers - 1) / 2) * s * 0.55;
        const speed = 0.8 + ((i * 7) % 5) * 0.12;
        const boost = 1 + 2.2 * smooth(seg(lt, T.bureaucratie - 0.3, T.construire + 0.6));
        const fl = clamp(build * 1.6 * speed * boost - i * 0.08) * (6 + (i % 3) * 2);
        towerFloors(ctx, tx, baseY, s * 0.42, fl, s * 0.17, { alpha: aB, color: C.cyan, max: 9 });
      }
      crane(ctx, B.x - s * 1.2, baseY, s * 2.1, { alpha: aB, color: C.ice, swing: 0.4 * Math.sin(gt * 0.6), hook: (gt * 0.3) % 1 });
      crane(ctx, B.x + s * 1.3, baseY, s * 1.7, { alpha: aB * smooth(seg(lt, T.bureaucratie - 0.5, T.bureaucratie + 0.5)), color: C.ice, swing: -0.5 + 0.4 * Math.sin(gt * 0.7 + 1), hook: (gt * 0.35 + 0.5) % 1 });
      ctx.save();
      ctx.globalAlpha *= aB;
      ctx.fillStyle = rgba(C.cyan, 0.7);
      ctx.fillRect(B.x - s * 2.2, baseY, s * 4.4, 1.5);
      ctx.restore();
      const lx = B.x;
      const ly = V ? h * 0.53 : h * 0.21;
      mono(ctx, 'ÉCONOMISTES DE MARCHÉ · CONSTRUCTEURS', lx, ly - m * 0.06, { size: Math.floor(m * 0.017), color: C.cyan, t: seg(lt, T.economistes, T.economistes + 1.4), alpha: aB });
      kRise(ctx, 'CONSTRUIRE', lx, ly + m * 0.01, { size: Math.floor(m * 0.075), weight: 900, t: seg(lt, T.economistes + 0.2, T.economistes + 1.2), alpha: aB });
      const iy = V ? B.y + s * 1.62 : B.y + s * 1.62;
      const items = [
        [T.bloquer, 'LE PLAFOND FAIT FUIR LES INVESTISSEURS', C.ice],
        [T.solution, 'MOINS DE BUREAUCRATIE · MOINS DE TAXES', C.ice],
        [T.construire, 'DES CENTAINES DE MILLIERS DE LOGEMENTS', C.white]
      ];
      items.forEach(([k, txt, col], i) => {
        const cur = env(lt, k - 0.2, i < 2 ? items[i + 1][0] - 0.1 : D, 0.3, 0.3);
        kWipe(ctx, txt, lx, iy, { size: Math.floor(m * 0.026), weight: 800, color: col, t: seg(lt, k - 0.1, k + 0.8), alpha: aB * cur, edge: C.cyan, maxW: V ? w * 0.9 : w * 0.42 });
      });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 09 — d2-impact-quebec · De Montréal à Rimouski : la fin des loyers abordables ?
 * Acte I   : travelling de Lisbonne et Paris jusqu'au Saint-Laurent
 * Acte II  : colonnes de lumière Vancouver · Toronto · Québec — l'avantage fond ;
 *            corridor Gatineau → Rimouski sous la barre critique de 1,5 %
 * Acte III : le triplex québécois et sa jauge de pression budgétaire
 * ════════════════════════════════════════════════════════════════════════ */

/** Triplex montréalais avec escaliers extérieurs en colimaçon. */
function triplex(ctx, x, yBase, s, o = {}) {
  const { alpha = 1, t = 1, color = C.ice, glow = C.amber, lit = 0 } = o;
  if (alpha <= 0.003 || t <= 0) return;
  const W = s * 1.6;
  const H = s * 1.9;
  const fl = H / 3;
  ctx.save();
  ctx.globalAlpha *= alpha;
  light(ctx, x, yBase - H * 0.5, s * 2, glow, 0.25 * lit);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.018);
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  const L = 6000;
  ctx.setLineDash([L * clamp(t), L]);
  // façade
  ctx.beginPath();
  ctx.rect(x - W / 2, yBase - H, W, H);
  // corniche
  ctx.moveTo(x - W / 2 - s * 0.06, yBase - H);
  ctx.lineTo(x + W / 2 + s * 0.06, yBase - H);
  ctx.moveTo(x - W / 2 - s * 0.06, yBase - H - s * 0.08);
  ctx.lineTo(x + W / 2 + s * 0.06, yBase - H - s * 0.08);
  // balcons
  for (let i = 1; i <= 2; i++) {
    const by = yBase - fl * i;
    ctx.moveTo(x - W / 2, by);
    ctx.lineTo(x + W / 2, by);
    for (let k = 0; k <= 10; k++) {
      const bx = x - W / 2 + (k / 10) * W;
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, by - fl * 0.22);
    }
    ctx.moveTo(x - W / 2, by - fl * 0.22);
    ctx.lineTo(x + W / 2, by - fl * 0.22);
  }
  ctx.stroke();
  // escalier extérieur en colimaçon (signature montréalaise)
  ctx.beginPath();
  const sx = x + W * 0.32;
  for (let i = 0; i <= 60; i++) {
    const u = i / 60;
    const yy = yBase - u * fl * 2;
    const xx = sx + Math.sin(u * Math.PI * 4) * s * 0.16;
    if (i === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // fenêtres et portes (s'allument)
  for (let f = 0; f < 3; f++) {
    for (let k = 0; k < 2; k++) {
      const wx = x - W * 0.38 + k * W * 0.28;
      const wy = yBase - fl * (f + 1) + fl * 0.3;
      const on = clamp(lit * 3 - f * 0.6 - k * 0.3);
      ctx.fillStyle = rgba(C.gold, 0.15 + 0.6 * on);
      ctx.fillRect(wx, wy, W * 0.16, fl * 0.42);
    }
  }
  ctx.restore();
}

/** Jauge semi-circulaire (pression budgétaire). */
function gauge(ctx, x, y, r, v, o = {}) {
  const { alpha = 1 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const segs = 40;
  for (let i = 0; i < segs; i++) {
    const u = i / segs;
    const a0 = Math.PI + u * Math.PI;
    const col = u < 0.5 ? mix(C.cyan, C.amber, u * 2) : mix(C.amber, C.red, (u - 0.5) * 2);
    ctx.strokeStyle = rgba(col, u <= v ? 0.95 : 0.15);
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.arc(x, y, r, a0 + 0.012, a0 + Math.PI / segs - 0.012);
    ctx.stroke();
  }
  const ang = Math.PI + v * Math.PI;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = Math.max(2, r * 0.03);
  ctx.shadowColor = C.white;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(ang) * r * 0.82, y + Math.sin(ang) * r * 0.82);
  ctx.stroke();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.06, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Colonne de lumière en verre (cylindre). */
function glassColumn(ctx, x, yBase, r, hgt, color, o = {}) {
  const { alpha = 1, time = 0 } = o;
  if (alpha <= 0.003 || hgt <= 0.5) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const g = ctx.createLinearGradient(x - r, 0, x + r, 0);
  g.addColorStop(0, rgba(color, 0.08));
  g.addColorStop(0.35, rgba(color, 0.45));
  g.addColorStop(0.6, rgba(C.white, 0.35));
  g.addColorStop(1, rgba(color, 0.08));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, yBase - hgt, r * 2, hgt);
  ctx.strokeStyle = rgba(color, 0.9);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, yBase - hgt, r, r * 0.28, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, yBase, r, r * 0.28, 0, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
  light(ctx, x, yBase - hgt, r * 2.2, color, 0.5 * alpha);
}

function sceneQcRent(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    rues: 'dans les rues',
    lisbonne: 'Lisbonne et',
    resonne: 'résonne',
    quebec: 'au Québec',
    decennies: 'des décennies',
    abordables: 'plus abordables',
    toronto: 'Toronto',
    vancouver: 'Vancouver',
    avantage: 'avantage historique',
    fond: 'fond à vue',
    taux: "taux d'inoccupation",
    critique: 'barre critique',
    pct: 'un virgule cinq',
    montreal: 'à Montréal',
    quebecC: 'à Québec,',
    gatineau: 'Gatineau',
    sherbrooke: 'Sherbrooke',
    trois: 'Trois-Rivières',
    rimouski: 'Rimouski',
    loger: 'se loger absorbe',
    budget: 'part record du budget',
    risque: 'au risque',
    grogne: 'grogne sociale'
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 100, alpha: 0.35 });

    /* ── ACTE I : traversée de l'Atlantique (carte plate en travelling) ── */
    const aI = 1 - smooth(seg(lt, T.decennies - 0.6, T.decennies + 0.4));
    if (aI > 0.003) {
      const lon = track(lt, [
        [0, -2],
        [T.resonne - 0.4, -10, (x) => x],
        [T.quebec + 0.6, -71, eInOutQuart]
      ]);
      const sc = m * (V ? 0.012 : 0.0125) * track(lt, [[0, 1], [T.quebec + 0.6, 1.25, eInOutQuart]]);
      const Pj = makeFlat(lon, 44, sc, cx, cy);
      const dots = regionDots('atlFlat', -125, 55, 8, 74, 0.55);
      drawDots(ctx, Pj, dots, { color: C.cyan, size: sc * 0.22, alpha: 0.75 * aI, fade: { x: cx, y: cy, r: Math.hypot(w, h) * 0.55 } });
      const l = Pj.project(...P('lisbon'));
      const p = Pj.project(...P('paris'));
      const q = Pj.project(...P('quebec'));
      cityTag(ctx, l.x, l.y, 'LISBONNE', { color: C.amber, t: seg(lt, T.lisbonne - 0.3, T.lisbonne + 0.5), alpha: aI, side: 'bottom', size: Math.floor(m * 0.02), time: gt });
      cityTag(ctx, p.x, p.y, 'PARIS', { color: C.amber, t: seg(lt, T.lisbonne + 0.1, T.lisbonne + 0.8), alpha: aI, side: 'top', size: Math.floor(m * 0.02), time: gt });
      const wave = quadPts(l, q, -m * 0.15, 60);
      glowPath(ctx, wave, eInOutQuart(seg(lt, T.resonne - 0.6, T.quebec + 0.5)), { color: C.amber, width: 3, alpha: aI });
      if (lt > T.quebec) shockwave(ctx, q.x, q.y, m * 0.12, gt, { color: C.cyan, alpha: aI, count: 3 });
      kRise(ctx, 'RÉSONNE AU QUÉBEC', cx, V ? h * 0.8 : h * 0.82, { size: Math.floor(m * 0.06), weight: 900, t: seg(lt, T.resonne, T.resonne + 1.0), alpha: aI, maxW: w * 0.9 });
    }

    /* ── ACTE II-a : trois colonnes de loyers ── */
    const aC = env(lt, T.decennies - 0.4, T.taux + 0.4, 0.5, 0.6);
    if (aC > 0.003) {
      const baseY = V ? h * 0.66 : h * 0.72;
      const r = m * 0.055;
      const melt = eInOutQuart(seg(lt, T.fond - 0.3, T.fond + 1.6));
      const cols = [
        { lab: 'VANCOUVER', k: T.vancouver, hgt: 0.36, col: C.slate },
        { lab: 'TORONTO', k: T.toronto, hgt: 0.33, col: C.slate },
        { lab: 'QUÉBEC', k: T.decennies + 0.4, hgt: lerp(0.14, 0.29, melt), col: C.cyan }
      ];
      cols.forEach((c, i) => {
        const x = cx + (i - 1) * m * (V ? 0.28 : 0.3);
        const grow = eOutExpo(seg(lt, c.k - 0.3, c.k + 1.0));
        glassColumn(ctx, x, baseY, r, h * c.hgt * grow, i === 2 ? mix(C.cyan, C.amber, melt) : c.col, { alpha: aC, time: gt });
        kSlide(ctx, c.lab, x, baseY + m * 0.07, { size: Math.floor(m * 0.03), weight: 800, color: i === 2 ? C.white : C.slate, t: seg(lt, c.k - 0.2, c.k + 0.6), alpha: aC });
      });
      mono(ctx, 'LOYERS · ILLUSTRATION', cx, baseY + m * 0.12, { size: Math.floor(m * 0.015), color: C.slate, t: aC, alpha: aC * 0.6, cursor: false });
      const ty = V ? h * 0.15 : h * 0.17;
      const sw = smooth(seg(lt, T.avantage - 0.3, T.avantage + 0.2));
      kRise(ctx, 'PLUS ABORDABLE', cx, ty, { size: Math.floor(m * 0.065), weight: 900, t: seg(lt, T.abordables - 0.2, T.abordables + 0.8), out: sw, alpha: aC, color: C.cyan });
      kRise(ctx, 'UN AVANTAGE QUI FOND', cx, ty, { size: Math.floor(m * 0.065), weight: 900, t: seg(lt, T.avantage, T.avantage + 1.0), alpha: aC * sw, color: C.amber, maxW: w * 0.9 });
      mono(ctx, 'PENDANT DES DÉCENNIES', cx, ty - m * 0.075, { size: Math.floor(m * 0.02), color: C.ice, t: seg(lt, T.decennies, T.decennies + 1), alpha: aC * (1 - sw) });
    }

    /* ── ACTE II-b : le corridor sous la barre critique ── */
    const aK = env(lt, T.taux - 0.3, T.loger + 0.2, 0.5, 0.6);
    if (aK > 0.003) {
      const sc = m * (V ? 0.105 : 0.115);
      const Pj = makeFlat(-72.0, 46.9, sc, V ? cx : cx - m * 0.12, V ? h * 0.45 : cy + m * 0.06);
      const dots = regionDots('stl', -82, -62, 42.5, 51.5, 0.09);
      drawDots(ctx, Pj, dots, { color: C.cyan, size: sc * 0.035, alpha: 0.5 * aK, fade: { x: V ? cx : cx - m * 0.12, y: V ? h * 0.45 : cy + m * 0.06, r: m * (V ? 0.62 : 0.78) } });
      // fleuve Saint-Laurent stylisé
      const river = [[-76.6, 44.2], [-75.0, 45.0], [-73.6, 45.5], [-72.5, 46.25], [-71.2, 46.8], [-70.2, 47.4], [-69.0, 48.1], [-68.0, 48.7], [-66.0, 49.3]];
      const rp = smoothPath(river, 10).map((pp) => Pj.project(pp[0], pp[1]));
      glowPath(ctx, rp, seg(lt, T.taux - 0.4, T.taux + 1.2), { color: C.ice, width: 3, alpha: aK * 0.8, head: false });
      const cities = [
        ['montreal', 'MONTRÉAL', T.montreal, 'bottom'],
        ['quebec', 'QUÉBEC', T.quebecC, 'top'],
        ['gatineau', 'GATINEAU', T.gatineau, 'top'],
        ['sherbrooke', 'SHERBROOKE', T.sherbrooke, 'bottom'],
        ['troisRivieres', 'TROIS-RIVIÈRES', T.trois, 'left'],
        ['rimouski', 'RIMOUSKI', T.rimouski, 'top']
      ];
      cities.forEach(([k, lab, tk, side]) => {
        const q = Pj.project(...P(k));
        const on = seg(lt, tk - 0.15, tk + 0.6);
        if (on <= 0) beacon(ctx, q.x, q.y, { color: C.cyan, r: 5, alpha: aK * 0.8, time: gt, pulse: false });
        cityTag(ctx, q.x, q.y, lab, { color: mix(C.amber, C.red, smooth(on)), t: on, alpha: aK, side, size: Math.floor(m * 0.022), time: gt, r: 7, pulse: on > 0 });
        if (on > 0) shockwave(ctx, q.x, q.y, m * 0.05, gt + tk, { color: C.amber, alpha: aK * on * 0.6, count: 1, period: 1.6 });
      });
      // compteur 1,5 % avec barre critique
      const nx = V ? cx : w * 0.78;
      const ny = V ? h * 0.78 : cy - m * 0.08;
      mono(ctx, "TAUX D'INOCCUPATION", nx, ny - m * 0.14, { size: Math.floor(m * 0.02), color: C.ice, t: seg(lt, T.taux, T.taux + 1.2), alpha: aK });
      kZoom(ctx, '< 1,5 %', nx, ny, { size: Math.floor(m * 0.12), weight: 900, color: C.amber, t: seg(lt, T.pct - 0.1, T.pct + 0.9), alpha: aK, glow: 22, glowColor: rgba(C.red, 0.5) });
      const barT = eOutExpo(seg(lt, T.critique - 0.2, T.critique + 0.8));
      ctx.save();
      ctx.globalAlpha *= aK;
      ctx.fillStyle = C.red;
      ctx.shadowColor = C.red;
      ctx.shadowBlur = 14;
      ctx.fillRect(nx - m * 0.18 * barT, ny + m * 0.04, m * 0.36 * barT, 3);
      ctx.restore();
      mono(ctx, 'BARRE CRITIQUE', nx, ny + m * 0.085, { size: Math.floor(m * 0.018), color: C.red, t: seg(lt, T.critique, T.critique + 1), alpha: aK });
    }

    /* ── ACTE III : triplex et budget ── */
    const aT = smooth(seg(lt, T.loger - 0.4, T.loger + 0.6));
    if (aT > 0.003) {
      const s = m * (V ? 0.22 : 0.2);
      const tx = V ? cx : cx - m * 0.3;
      const baseY = V ? h * 0.62 : h * 0.8;
      triplex(ctx, tx, baseY, s, { alpha: aT, t: seg(lt, T.loger - 0.4, T.loger + 1.6), lit: seg(lt, T.loger + 0.4, T.budget + 1) });
      ctx.save();
      ctx.globalAlpha *= aT;
      ctx.fillStyle = rgba(C.ice, 0.5);
      ctx.fillRect(tx - s * 1.6, baseY, s * 3.2, 1.5);
      ctx.restore();
      const gx = V ? cx : cx + m * 0.38;
      const gy = V ? h * 0.8 : cy + m * 0.12;
      const v = eInOutQuart(seg(lt, T.budget - 0.8, T.budget + 1.4)) * 0.86 + 0.02 * Math.sin(gt * 3) * smooth(seg(lt, T.budget + 1, T.budget + 2));
      gauge(ctx, gx, gy, m * (V ? 0.16 : 0.15), v, { alpha: aT });
      mono(ctx, 'BUDGET DES QUÉBÉCOIS', gx, gy + m * 0.06, { size: Math.floor(m * 0.019), color: C.ice, t: seg(lt, T.budget - 0.6, T.budget + 0.6), alpha: aT });
      kWipe(ctx, 'PART RECORD AU LOGEMENT', gx, gy + m * 0.12, { size: Math.floor(m * 0.03), weight: 800, color: C.amber, t: seg(lt, T.budget, T.budget + 0.9), alpha: aT, edge: C.red, maxW: V ? w * 0.9 : w * 0.4 });
      const qy = V ? h * 0.16 : h * 0.2;
      kZoom(ctx, 'GROGNE SOCIALE ?', V ? cx : gx, qy, { size: Math.floor(m * (V ? 0.08 : 0.07)), weight: 900, t: seg(lt, T.grogne - 0.3, T.grogne + 0.8), alpha: aT, glow: 20, glowColor: rgba(C.red, 0.45), maxW: V ? w * 0.9 : w * 0.45 });
      mono(ctx, 'ICI AUSSI', V ? cx : gx, qy - m * 0.075, { size: Math.floor(m * 0.02), color: C.coral, t: seg(lt, T.risque, T.risque + 0.8), alpha: aT });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 10 — d3-enjeu-mondial · Sommet de la Francophonie sous haute tension
 * Acte I   : le globe pivote vers l'Asie du Sud-Est ; Phnom Penh s'allume (20e SOMMET)
 * Acte II  : quatre candidats convergent ; fracture Kinshasa ⟷ Kigali
 * Acte III : arc commercial Canada → Philippines ; les 11 nœuds de l'ANASE
 * ════════════════════════════════════════════════════════════════════════ */

const ASEAN = ['bangkok', 'hanoi', 'vientiane', 'phnomPenh', 'naypyidaw', 'kualaLumpur', 'singapore', 'jakarta', 'bandar', 'manila', 'dili'];

/** Arc électrique crépitant autour d'un point (atmosphère électrique). */
function crackle(ctx, x, y, r, time, o = {}) {
  const { alpha = 1, color = C.mint, n = 5 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  const f = Math.floor(time * 12); // scintillement (tracé, pas de texte)
  for (let k = 0; k < n; k++) {
    const g = rng(f * 13 + k * 7);
    const a0 = g() * TAU;
    const a1 = a0 + 0.6 + g() * 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = lerp(a0, a1, i / 10);
      const rr = r * (0.9 + g() * 0.25);
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function sceneSummit(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    troisieme: 'Troisième dossier',
    cap: "cap sur l'Asie",
    pp: 'Phnom Penh',
    cambodge: 'Cambodge',
    vingt: 'vingtième',
    sommet: 'Sommet de la Francophonie',
    elec: 'atmosphère électrique',
    quatre: 'Quatre candidats',
    secr: 'secrétariat général',
    rdc: 'République démocratique',
    menace: 'menace ouvertement',
    sortante: 'secrétaire générale sortante',
    rwandaise: 'Rwandaise',
    louise: 'Louise Mushikiwabo',
    reconduite: 'reconduite',
    guerre: 'guerre meurtrière',
    est: "l'est congolais",
    parallele: 'En parallèle',
    carney: 'Mark Carney',
    accord: 'accord commercial',
    phil: 'Philippines',
    onze: 'onze pays',
    anase: "l'ANASE"
  });

  const R0 = V ? 0.46 : 0.4;
  const off = V ? [0, -0.1] : [-0.16, 0.02];
  const st = globeTrack(lt, [
    [0, [-40, 30, R0 * 0.85, off[0], off[1]]],
    [T.cap - 0.3, [-10, 28, R0 * 0.85, off[0], off[1]], (x) => x],
    [T.pp + 0.4, [104, 14, R0 * 1.25, off[0], off[1]], eInOutQuart],
    [T.secr, [106, 13, R0 * 1.32, off[0], off[1]], (x) => x],
    [T.rdc + 0.8, [24, -2, R0 * 1.25, off[0], off[1]], eInOutQuart],
    [T.est + 0.4, [26, -2, R0 * 1.32, off[0], off[1]], (x) => x],
    [T.carney + 0.4, [140, 22, R0 * 0.95, off[0], off[1]], eInOutQuart],
    [D, [128, 10, R0 * 1.05, off[0], off[1]], (x) => x]
  ]);

  frame(a, () => {
    dust(ctx, stage, gt, { count: 110, alpha: 0.4 });
    const G = globeFrom(stage, st);
    drawGlobe(ctx, G, { color: C.cyan, alpha: 1, hl: (lo, la) => (lo > 92 && lo < 127 && la > -10 && la < 24 ? 0.55 * smooth(seg(lt, T.cap, T.pp + 0.6)) : 0), hlColor: C.emerald });
    const prj = (k) => G.project(...P(k));
    const pp = prj('phnomPenh');

    // ACTE I : Phnom Penh, atmosphère électrique
    const ppA = smooth(seg(lt, T.pp - 0.2, T.pp + 0.6));
    if (pp.vis) {
      beacon(ctx, pp.x, pp.y, { color: C.emerald, r: 10, alpha: ppA, time: gt });
      crackle(ctx, pp.x, pp.y, m * 0.06, gt, { alpha: ppA * env(lt, T.elec - 0.4, T.rdc, 0.3, 0.8) });
      shockwave(ctx, pp.x, pp.y, m * 0.14, gt, { color: C.emerald, alpha: ppA * env(lt, T.sommet - 0.2, T.quatre + 1, 0.3, 0.8) * 0.7, count: 3 });
      cityTag(ctx, pp.x, pp.y, 'PHNOM PENH', { color: C.emerald, t: seg(lt, T.pp, T.pp + 0.8), alpha: ppA * (1 - smooth(seg(lt, T.rdc - 0.5, T.rdc))), side: 'right', size: Math.floor(m * 0.024), time: gt });
    }
    // quatre vecteurs candidats
    const c4 = env(lt, T.quatre - 0.3, T.rdc + 0.2, 0.3, 0.6);
    if (c4 > 0.003 && pp.vis) {
      const dirs = [[-1, -0.7], [1, -0.8], [-1, 0.8], [1, 0.7]];
      dirs.forEach(([dx, dy], i) => {
        const from = { x: pp.x + dx * m * 0.42, y: pp.y + dy * m * 0.32 };
        const pts = quadPts(from, pp, dx * dy * m * 0.08, 40);
        const t = seg(lt, T.quatre + i * 0.2, T.quatre + 1.2 + i * 0.2);
        const col = [C.emerald, C.ice, C.gold, C.violet][i];
        glowPath(ctx, pts, eInOutQuart(t), { color: col, width: 2.4, alpha: c4 });
        person(ctx, from.x, from.y + m * 0.02, m * 0.035 * eOutBack(t, 2), col, c4 * clamp(t * 3));
      });
    }
    // fracture Kinshasa ⟷ Kigali
    const fr = env(lt, T.rdc - 0.2, T.parallele + 0.4, 0.4, 0.6);
    if (fr > 0.003) {
      const k1 = prj('kinshasa');
      const k2 = prj('kigali');
      const g3 = prj('goma');
      if (k1.vis && k2.vis) {
        // ligne brisée en zigzag
        const pts = [];
        const nZ = 14;
        for (let i = 0; i <= nZ; i++) {
          const u = i / nZ;
          const jit = i % 2 ? 1 : -1;
          const nx = -(k2.y - k1.y);
          const ny = k2.x - k1.x;
          const L = Math.hypot(nx, ny) || 1;
          pts.push({ x: lerp(k1.x, k2.x, u) + (nx / L) * jit * m * 0.012 * Math.sin(u * Math.PI), y: lerp(k1.y, k2.y, u) + (ny / L) * jit * m * 0.012 * Math.sin(u * Math.PI) });
        }
        glowPath(ctx, pts, eOutExpo(seg(lt, T.rdc + 0.2, T.menace + 0.8)), { color: C.red, width: 3, alpha: fr });
        cityTag(ctx, k1.x, k1.y, 'KINSHASA · RD CONGO', { color: C.coral, t: seg(lt, T.rdc, T.rdc + 0.9), alpha: fr, side: 'left', size: Math.floor(m * 0.022), time: gt, pulse: true });
        cityTag(ctx, k2.x, k2.y, 'KIGALI · RWANDA', { color: C.amber, t: seg(lt, T.rwandaise - 0.2, T.rwandaise + 0.7), alpha: fr, side: 'right', size: Math.floor(m * 0.022), time: gt, pulse: true });
        const war = env(lt, T.guerre - 0.3, T.parallele + 0.4, 0.4, 0.6);
        if (g3.vis) shockwave(ctx, g3.x, g3.y, m * 0.08, gt, { color: C.red, alpha: war, count: 3, period: 1.6 });
      }
    }
    // ACTE III : arc Canada → Philippines, ANASE
    const tr = smooth(seg(lt, T.carney - 0.6, T.carney + 0.4));
    if (tr > 0.003) {
      const route = projectAll(G, arcPts(P('ottawa'), P('manila'), 90, 0.22));
      trail(ctx, route, eInOutQuart(seg(lt, T.carney - 0.4, T.phil + 0.4)), { color: C.amber, width: 3, alpha: tr });
      const mn = prj('manila');
      if (mn.vis) cityTag(ctx, mn.x, mn.y, 'MANILLE', { color: C.amber, t: seg(lt, T.phil - 0.2, T.phil + 0.6), alpha: tr, side: 'right', size: Math.floor(m * 0.022), time: gt, pulse: true });
      const nodes = ASEAN.map((k) => prj(k));
      const on = seg(lt, T.onze - 0.4, T.onze + 1.0);
      // anneau reliant les capitales de l'ANASE
      const ringPts = nodes.filter((q) => q.vis);
      if (ringPts.length > 2 && on > 0) {
        const cxr = ringPts.reduce((s, q) => s + q.x, 0) / ringPts.length;
        const cyr = ringPts.reduce((s, q) => s + q.y, 0) / ringPts.length;
        const sorted = ringPts.slice().sort((p1, p2) => Math.atan2(p1.y - cyr, p1.x - cxr) - Math.atan2(p2.y - cyr, p2.x - cxr));
        sorted.push(sorted[0]);
        glowPath(ctx, sorted, eInOutQuart(on), { color: C.emerald, width: 1.6, alpha: tr * 0.8, head: false });
      }
      nodes.forEach((q, i) => {
        if (!q.vis) return;
        const t = clamp(on * 11 - i);
        beacon(ctx, q.x, q.y, { color: C.emerald, r: 6 * eOutBack(t, 2), alpha: tr * clamp(t * 2), time: gt + i * 0.1, pulse: false });
      });
    }

    /* ── Typographie (colonne droite en paysage, bas en portrait) ── */
    const lx = V ? cx : w * 0.74;
    const ly = V ? h * 0.76 : h * 0.36;
    const maxW = V ? w * 0.9 : w * 0.44;
    const big = Math.floor(m * (V ? 0.075 : 0.068));
    const aI = env(lt, T.troisieme - 0.2, T.quatre - 0.1, 0.4, 0.5);
    mono(ctx, '03 · FRANCOPHONIE & ASIE', lx, ly - big * 1.1, { size: Math.floor(m * 0.022), color: C.emerald, t: seg(lt, T.troisieme, T.troisieme + 1.2), alpha: aI });
    kRise(ctx, 'ASIE DU SUD-EST', lx, ly, { size: big, weight: 900, t: seg(lt, T.cap, T.cap + 1.0), alpha: aI * (1 - smooth(seg(lt, T.vingt - 0.4, T.vingt))), maxW });
    const sA = smooth(seg(lt, T.vingt - 0.3, T.vingt + 0.2));
    odometer(ctx, 20 * eOutCubic(seg(lt, T.vingt - 0.2, T.vingt + 0.9)), lx - m * 0.04, ly, { size: big, weight: 900, color: C.emerald, align: 'right', alpha: aI * sA, roll: false });
    // « e » en exposant (20e)
    drawSprite(ctx, textSprite('e', { size: Math.floor(big * 0.48), weight: 800, color: C.emerald }), lx - m * 0.035, ly - big * 0.38, { align: 'left', alpha: aI * sA });
    kSlide(ctx, 'SOMMET', lx + m * 0.01, ly, { size: big, weight: 900, align: 'left', t: seg(lt, T.sommet - 0.3, T.sommet + 0.5), alpha: aI });
    kWipe(ctx, 'DE LA FRANCOPHONIE', lx, ly + big * 0.75, { size: Math.floor(m * 0.032), weight: 800, color: C.ice, t: seg(lt, T.sommet, T.sommet + 0.9), alpha: aI, maxW });
    kWipe(ctx, 'ATMOSPHÈRE ÉLECTRIQUE', lx, ly + big * 1.35, { size: Math.floor(m * 0.026), weight: 700, color: C.mint, t: seg(lt, T.elec, T.elec + 0.8), alpha: aI, edge: C.mint, maxW });
    // 4 candidats
    const qA = env(lt, T.quatre - 0.2, T.rdc - 0.1, 0.3, 0.4);
    odometer(ctx, 4 * eOutCubic(seg(lt, T.quatre - 0.1, T.quatre + 0.7)), lx, ly, { size: Math.floor(big * 1.4), weight: 900, color: C.white, alpha: qA, roll: false, glow: 18, glowColor: rgba(C.emerald, 0.6) });
    kRise(ctx, 'CANDIDATS', lx, ly + big * 0.85, { size: Math.floor(m * 0.04), weight: 900, t: seg(lt, T.quatre + 0.2, T.quatre + 1.0), alpha: qA });
    mono(ctx, 'SECRÉTARIAT GÉNÉRAL DE L’OIF', lx, ly + big * 1.45, { size: Math.floor(m * 0.02), color: C.ice, t: seg(lt, T.secr, T.secr + 1.2), alpha: qA });
    // RDC
    const rA = env(lt, T.rdc - 0.2, T.parallele, 0.3, 0.5);
    mono(ctx, 'RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', lx, ly - big * 1.1, { size: Math.floor(m * 0.019), color: C.coral, t: seg(lt, T.rdc, T.rdc + 1.4), alpha: rA });
    kRise(ctx, 'MENACE DE QUITTER', lx, ly, { size: big, weight: 900, t: seg(lt, T.menace - 0.1, T.menace + 1.0), alpha: rA, maxW });
    kWipe(ctx, 'LA FRANCOPHONIE', lx, ly + big * 0.75, { size: Math.floor(m * 0.032), weight: 800, color: C.ice, t: seg(lt, T.menace + 0.6, T.menace + 1.4), alpha: rA, maxW });
    const lA = smooth(seg(lt, T.sortante - 0.2, T.sortante + 0.4));
    kSlide(ctx, 'SI LOUISE MUSHIKIWABO', lx, ly + big * 1.45, { size: Math.floor(m * 0.026), weight: 700, color: C.amber, t: seg(lt, T.louise - 0.6, T.louise + 0.3), alpha: rA * lA, maxW });
    kSlide(ctx, 'EST RECONDUITE', lx, ly + big * 1.9, { size: Math.floor(m * 0.026), weight: 700, color: C.amber, t: seg(lt, T.reconduite - 0.3, T.reconduite + 0.4), alpha: rA * lA, maxW });
    kWipe(ctx, 'GUERRE DANS L’EST CONGOLAIS', lx, ly + big * 2.5, { size: Math.floor(m * 0.024), weight: 800, color: C.red, t: seg(lt, T.guerre, T.guerre + 0.9), alpha: rA, edge: C.red, maxW });
    // Carney / ANASE
    const cA = smooth(seg(lt, T.parallele - 0.1, T.parallele + 0.5));
    mono(ctx, 'OTTAWA · MARK CARNEY', lx, ly - big * 1.1, { size: Math.floor(m * 0.02), color: C.amber, t: seg(lt, T.carney - 0.3, T.carney + 0.9), alpha: cA });
    kRise(ctx, 'ACCORD COMMERCIAL', lx, ly, { size: Math.floor(big * 0.9), weight: 900, t: seg(lt, T.accord - 0.1, T.accord + 0.9), alpha: cA, maxW });
    kWipe(ctx, 'AVEC LES PHILIPPINES', lx, ly + big * 0.7, { size: Math.floor(m * 0.03), weight: 800, color: C.amber, t: seg(lt, T.phil - 0.3, T.phil + 0.5), alpha: cA, maxW });
    const aN = smooth(seg(lt, T.onze - 0.3, T.onze + 0.3));
    odometer(ctx, 11 * eOutCubic(seg(lt, T.onze - 0.3, T.onze + 0.7)), lx - m * 0.01, ly + big * 1.65, { size: Math.floor(big * 0.85), weight: 900, color: C.emerald, align: 'right', alpha: cA * aN, roll: false });
    kSlide(ctx, 'PAYS DE L’ANASE', lx + m * 0.005, ly + big * 1.65, { size: Math.floor(m * 0.032), weight: 800, align: 'left', t: seg(lt, T.onze, T.anase + 0.3), alpha: cA });
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 11 — d3-lien-quebec · À Phnom Penh, Québec prêt à voter différemment d'Ottawa
 * Acte I   : carte centrée sur le Pacifique : deux trajectoires (Québec cyan, Ottawa ambre)
 * Acte II  : la table ronde de l'OIF — deux sièges, deux votes ; le bulletin du Québec
 * Acte III : lignes d'exportation vers l'Afrique francophone et l'Asie, hors des États-Unis
 * ════════════════════════════════════════════════════════════════════════ */

function sceneTable(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    sommet: 'ce sommet',
    coeur: 'au cœur',
    bras: 'bras de fer',
    rappelons: 'Rappelons',
    oif: 'Organisation internationale',
    seule: 'seule grande table',
    pm: 'premier ministre du Québec',
    siege: 'siège de plein droit',
    vote: 'propre droit de vote',
    federal: 'gouvernement fédéral',
    auj: "Et aujourd'hui",
    affirme: 'Québec affirme',
    indep: 'indépendamment',
    election: "l'élection",
    geste: 'geste politique',
    tisser: 'tisser',
    asie: 'en Asie',
    afrique: 'Afrique francophone',
    divers: 'diversifier',
    eu: 'hors des États-Unis'
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 100, alpha: 0.35 });

    /* ── ACTE I : traversée du Pacifique ── */
    const aI = 1 - smooth(seg(lt, T.rappelons - 0.4, T.oif));
    if (aI > 0.003) {
      const sc = m * (V ? 0.0062 : 0.0078);
      const wrap = (lo) => (lo < -30 ? lo + 360 : lo);
      const Pj0 = makeFlat(200, 22, sc, cx, V ? h * 0.42 : cy);
      const Pj = { project: (lo, la) => Pj0.project(wrap(lo), la) };
      const dots = regionDots('world', -180, 180, -50, 72, 1.3);
      drawDots(ctx, Pj, dots, { color: C.cyan, size: sc * 0.55, alpha: 0.7 * aI });
      const q = Pj.project(...P('quebec'));
      const o = Pj.project(...P('ottawa'));
      const pp = Pj.project(...P('phnomPenh'));
      const tQ = eInOutQuart(seg(lt, T.sommet - 0.2, T.bras + 0.8));
      const tO = eInOutQuart(seg(lt, T.sommet + 0.4, T.bras + 1.4));
      glowPath(ctx, quadPts(q, pp, m * 0.22, 80), tQ, { color: C.cyan, width: 3, alpha: aI });
      glowPath(ctx, quadPts(o, pp, m * 0.12, 80), tO, { color: C.amber, width: 3, alpha: aI });
      cityTag(ctx, q.x, q.y, 'QUÉBEC', { color: C.cyan, t: seg(lt, 0, 0.8), alpha: aI, side: 'top', size: Math.floor(m * 0.022), time: gt });
      cityTag(ctx, o.x, o.y, 'OTTAWA', { color: C.amber, t: seg(lt, 0.3, 1.1), alpha: aI, side: 'bottom', size: Math.floor(m * 0.022), time: gt });
      cityTag(ctx, pp.x, pp.y, 'PHNOM PENH', { color: C.emerald, t: seg(lt, T.coeur - 0.2, T.coeur + 0.6), alpha: aI, side: 'bottom', size: Math.floor(m * 0.022), time: gt, pulse: true });
      kRise(ctx, 'BRAS DE FER DIPLOMATIQUE', cx, V ? h * 0.74 : h * 0.84, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.bras - 0.1, T.bras + 1.0), alpha: aI, maxW: w * 0.9 });
    }

    /* ── ACTE II : la table ronde ── */
    const aII = smooth(seg(lt, T.rappelons - 0.4, T.oif + 0.3)) * (1 - smooth(seg(lt, T.geste - 0.3, T.geste + 0.6)));
    if (aII > 0.003) {
      const tx = cx;
      const ty = V ? h * 0.47 : cy + m * 0.08;
      const rx = m * (V ? 0.36 : 0.34);
      const ry = rx * 0.38;
      const appear = eOutExpo(seg(lt, T.rappelons - 0.2, T.oif + 1.2));
      ctx.save();
      ctx.globalAlpha *= aII;
      // plateau
      const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, rx);
      g.addColorStop(0, rgba(C.emerald, 0.16));
      g.addColorStop(1, rgba(C.emerald, 0.02));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx * appear, ry * appear, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(C.emerald, 0.9);
      ctx.lineWidth = 2;
      ctx.shadowColor = C.emerald;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.ellipse(tx, ty, rx * appear, ry * appear, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
      // emblème OIF stylisé au centre : anneau de 5 arcs
      ring(ctx, tx, ty, ry * 0.42, { color: C.ice, width: 2, alpha: aII * appear, sweep: TAU * appear, glow: 10 });
      // sièges
      const nS = 16;
      const qcIdx = 1;
      const caIdx = 15;
      const seatOn = (i) => clamp(seg(lt, T.oif - 0.2, T.seule + 0.8) * nS - i);
      for (let i = 0; i < nS; i++) {
        const an = (i / nS) * TAU + Math.PI / 2;
        const sx = tx + Math.cos(an) * rx * 1.12;
        const sy = ty + Math.sin(an) * ry * 1.25;
        const s = seatOn(i);
        if (s <= 0) continue;
        const isQ = i === qcIdx;
        const isC = i === caIdx;
        let col = rgba(C.slate, 0.45);
        let rr = m * 0.012;
        if (isQ) {
          const l = smooth(seg(lt, T.pm - 0.2, T.pm + 0.6));
          col = l > 0 ? C.cyan : col;
          rr *= 1 + 0.6 * l;
          light(ctx, sx, sy, m * 0.06 * l, C.cyan, aII * l);
        }
        if (isC) {
          const l = smooth(seg(lt, T.federal - 0.3, T.federal + 0.5));
          col = l > 0 ? C.amber : col;
          rr *= 1 + 0.6 * l;
          light(ctx, sx, sy, m * 0.06 * l, C.amber, aII * l);
        }
        ctx.save();
        ctx.globalAlpha *= aII * s;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(sx, sy, rr * eOutBack(s, 2), 0, TAU);
        ctx.fill();
        ctx.restore();
        if (isQ) kSlide(ctx, 'QUÉBEC', sx - m * 0.03, sy + m * 0.006, { size: Math.floor(m * 0.024), weight: 800, color: C.cyan, align: 'right', base: 'middle', t: seg(lt, T.pm, T.pm + 0.7), alpha: aII, dir: 'left', dist: 0.5 });
        if (isC) kSlide(ctx, 'CANADA', sx + m * 0.03, sy + m * 0.006, { size: Math.floor(m * 0.024), weight: 800, color: C.amber, align: 'left', base: 'middle', t: seg(lt, T.federal - 0.2, T.federal + 0.6), alpha: aII, dir: 'right', dist: 0.5 });
      }
      // bulletins de vote : celui du Québec part seul
      const qAn = (qcIdx / nS) * TAU + Math.PI / 2;
      const cAn = (caIdx / nS) * TAU + Math.PI / 2;
      const qS = { x: tx + Math.cos(qAn) * rx * 1.12, y: ty + Math.sin(qAn) * ry * 1.25 };
      const cS = { x: tx + Math.cos(cAn) * rx * 1.12, y: ty + Math.sin(cAn) * ry * 1.25 };
      const vb = seg(lt, T.indep - 0.3, T.indep + 1.4);
      const vc = seg(lt, T.indep + 0.4, T.indep + 2.0);
      const drop = (from, t, col, sideBend) => {
        if (t <= 0) return;
        const pts = quadPts(from, { x: tx, y: ty }, sideBend * m * 0.12, 30);
        const p = along(pts, eInOutQuart(t));
        ctx.save();
        ctx.globalAlpha *= aII * (1 - smooth(seg(t, 0.92, 1)));
        ctx.translate(p.x, p.y - m * 0.03 * Math.sin(t * Math.PI));
        ctx.rotate((t - 0.5) * 0.6 * sideBend);
        rrect(ctx, -m * 0.018, -m * 0.024, m * 0.036, m * 0.048, 4);
        ctx.fillStyle = rgba(col, 0.25);
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.shadowColor = col;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.fillRect(-m * 0.01, -m * 0.006, m * 0.02, 3);
        ctx.restore();
      };
      drop(qS, vb, C.cyan, -1);
      drop(cS, vc, C.amber, 1);
      if (vb > 0.9) shockwave(ctx, tx, ty, ry * 0.8, gt, { color: C.cyan, alpha: aII * 0.4, count: 1, period: 1.4 });

      // typographie
      const ly = V ? h * 0.18 : h * 0.2;
      const t1 = env(lt, T.oif - 0.2, T.auj, 0.4, 0.4);
      mono(ctx, 'ORGANISATION INTERNATIONALE DE LA FRANCOPHONIE', cx, ly - m * 0.07, { size: Math.floor(m * 0.019), color: C.emerald, t: seg(lt, T.oif, T.oif + 1.6), alpha: t1 });
      kRise(ctx, 'LA SEULE GRANDE TABLE', cx, ly, { size: Math.floor(m * 0.055), weight: 900, t: seg(lt, T.seule - 0.1, T.seule + 1.0), alpha: t1, maxW: w * 0.9 });
      const t1b = smooth(seg(lt, T.siege - 0.2, T.siege + 0.3));
      kWords(ctx, ['UN', 'SIÈGE', '·', 'UN', 'VOTE'], cx, ly + m * 0.065, { size: Math.floor(m * 0.032), weight: 800, color: C.cyan, time: lt, times: [T.siege - 0.1, T.siege + 0.15, T.vote - 0.3, T.vote, T.vote + 0.4], alpha: t1 * t1b });
      const t2 = smooth(seg(lt, T.auj - 0.1, T.auj + 0.4));
      mono(ctx, 'PHNOM PENH · ÉLECTION À LA TÊTE DE L’OIF', cx, ly - m * 0.07, { size: Math.floor(m * 0.019), color: C.emerald, t: seg(lt, T.auj + 0.4, T.election + 0.6), alpha: t2 });
      kZoom(ctx, 'QUÉBEC  ≠  OTTAWA', cx, ly, { size: Math.floor(m * 0.065), weight: 900, t: seg(lt, T.affirme, T.affirme + 1.0), alpha: t2, glow: 18, glowColor: rgba(C.cyan, 0.5), maxW: w * 0.9 });
      kWipe(ctx, 'UN VOTE INDÉPENDANT', cx, ly + m * 0.065, { size: Math.floor(m * 0.032), weight: 800, color: C.cyan, t: seg(lt, T.indep - 0.1, T.indep + 0.8), alpha: t2 });
    }

    /* ── ACTE III : lignes d'exportation ── */
    const aIII = smooth(seg(lt, T.geste - 0.2, T.geste + 0.8));
    if (aIII > 0.003) {
      const sc = m * (V ? 0.0075 : 0.0068);
      const Pj = makeFlat(30, 15, sc, V ? cx : cx - m * 0.06, V ? h * 0.45 : cy + m * 0.06);
      const dots = regionDots('world', -180, 180, -50, 72, 1.3);
      drawDots(ctx, Pj, dots, { color: C.cyan, size: sc * 0.6, alpha: 0.55 * aIII });
      const q = Pj.project(...P('quebec'));
      beacon(ctx, q.x, q.y, { color: C.cyan, r: 9, alpha: aIII, time: gt });
      // États-Unis : la dépendance s'estompe
      const us = Pj.project(-95, 38);
      const euT = smooth(seg(lt, T.divers, T.eu + 0.4));
      glowPath(ctx, quadPts(q, us, m * 0.03, 20), 1, { color: C.slate, width: 4 * (1 - euT * 0.75), alpha: aIII * (0.7 - euT * 0.5), head: false, glow: 0.3 });
      if (euT > 0) {
        ctx.save();
        ctx.globalAlpha *= aIII * euT;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        const mx = (q.x + us.x) / 2;
        const my = (q.y + us.y) / 2;
        ctx.beginPath();
        ctx.moveTo(mx - 12, my - 12);
        ctx.lineTo(mx + 12, my + 12);
        ctx.moveTo(mx + 12, my - 12);
        ctx.lineTo(mx - 12, my + 12);
        ctx.stroke();
        ctx.restore();
      }
      const afr = ['dakar', 'abidjan', 'kinshasa', 'tunis', 'rabat', 'yaounde', 'bamako'];
      const asi = ['phnomPenh', 'hanoi', 'manila', 'singapore', 'jakarta', 'tokyo'];
      const draw = (list, k, col, lift) => {
        list.forEach((ck, i) => {
          const d = Pj.project(...P(ck));
          const t = seg(lt, k - 0.3 + i * 0.15, k + 1.4 + i * 0.15);
          const pts = quadPts(q, d, -m * lift * (1 + (i % 3) * 0.15), 50);
          glowPath(ctx, pts, eInOutQuart(t), { color: col, width: 1.8, alpha: aIII * 0.85, head: true, glow: 0.6 });
          if (t >= 1) {
            const p = along(pts, (gt * 0.25 + i * 0.17) % 1);
            ctx.save();
            ctx.globalAlpha *= aIII;
            ctx.fillStyle = C.white;
            ctx.fillRect(p.x - 4, p.y - 2.5, 8, 5);
            ctx.restore();
          }
          beacon(ctx, d.x, d.y, { color: col, r: 5 * clamp(t * 2 - 0.8), alpha: aIII * clamp(t * 2 - 0.8), time: gt + i, pulse: false });
        });
      };
      draw(afr, T.afrique, C.amber, 0.12);
      draw(asi, T.asie, C.emerald, 0.2);
      const lx = V ? cx : w * 0.5;
      const ly = V ? h * 0.78 : h * 0.17;
      mono(ctx, 'AU-DELÀ DU GESTE POLITIQUE', lx, ly - m * 0.065, { size: Math.floor(m * 0.02), color: C.ice, t: seg(lt, T.geste, T.geste + 1.2), alpha: aIII });
      kRise(ctx, 'NOS PROPRES LIENS ÉCONOMIQUES', lx, ly, { size: Math.floor(m * (V ? 0.048 : 0.05)), weight: 900, t: seg(lt, T.tisser - 0.1, T.tisser + 1.0), alpha: aIII, maxW: w * 0.92 });
      kWords(ctx, ['ASIE', '·', 'AFRIQUE', 'FRANCOPHONE'], lx, ly + m * 0.065, { size: Math.floor(m * 0.03), weight: 800, color: C.emerald, time: lt, times: [T.asie, T.asie + 0.3, T.afrique, T.afrique + 0.4], alpha: aIII });
      kWipe(ctx, 'HORS DES ÉTATS-UNIS', lx, ly + m * 0.12, { size: Math.floor(m * 0.03), weight: 800, color: C.amber, t: seg(lt, T.eu - 0.3, T.eu + 0.6), alpha: aIII, edge: C.red });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 12 — d3-deux-cotes-medaille · Voix québécoise distincte ou front uni ?
 * Acte I   : APPLAUDIR ? / S'INQUIÉTER ? — l'horizon partage le cadre en deux perspectives
 * Acte II  : en haut, un faisceau cyan unique trace la constellation francophone ;
 *            en bas, un faisceau combiné plus large ouvre les corridors vers l'Asie-Pacifique
 * Acte III : les deux trajectoires se stabilisent en parallèle
 * ════════════════════════════════════════════════════════════════════════ */

const FRANCO_NET = ['paris', 'brussels', 'geneva', 'dakar', 'abidjan', 'kinshasa', 'tunis', 'beirut', 'hanoi', 'portAuPrince', 'bucharest', 'antananarivo', 'yaounde', 'rabat'];
const ASIA_PORTS = ['tokyo', 'seoul', 'hongKong', 'singapore', 'manila', 'hcm', 'sydney', 'jakarta'];

function sceneTwoVoices(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    applaudir: 'applaudir',
    inquieter: "s'inquiéter",
    qo: 'Québec et Ottawa',
    positions: 'positions différentes',
    medaille: 'deux côtés à la médaille',
    partisans: "d'une diplomatie québécoise",
    raison: "raison d'être",
    interets: 'nos intérêts propres',
    langue: 'notre langue',
    alliances: 'nos alliances',
    dilues: 'sans être dilués',
    inverse: "À l'inverse",
    pragma: 'pragmatisme fédéral',
    divisions: 'étaler des divisions',
    affaiblit: 'affaiblit notre poids',
    contrats: 'contrats de plusieurs milliards',
    asie: 'en Asie',
    front: 'front commun',
    traites: 'grands traités'
  });

  const split = eOutExpo(seg(lt, T.positions - 0.3, T.positions + 1.2));
  const hy = cy; // horizon
  const topC = { x: cx, y: hy - (V ? h * 0.24 : h * 0.25) };
  const botC = { x: cx, y: hy + (V ? h * 0.24 : h * 0.25) };

  frame(a, () => {
    dust(ctx, stage, gt, { count: 110, alpha: 0.35 });
    const aTop = smooth(seg(lt, T.partisans - 0.6, T.partisans + 0.6));
    const aBot = smooth(seg(lt, T.inverse - 0.6, T.inverse + 0.6));
    light(ctx, cx, topC.y, m * 0.8, C.cyan, 0.16 * aTop);
    light(ctx, cx, botC.y, m * 0.8, C.amber, 0.14 * aBot);

    // horizon
    if (split > 0.003) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const half = (w / 2) * split;
      const g = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.shadowColor = C.ice;
      ctx.shadowBlur = 20;
      ctx.fillRect(cx - half, hy - 1.2, half * 2, 2.4);
      ctx.restore();
    }

    // ACTE I : deux questions qui glissent en sens opposés
    const qA = env(lt, T.applaudir - 0.3, T.partisans - 0.2, 0.3, 0.5);
    const big = Math.floor(m * (V ? 0.1 : 0.095));
    kSlide(ctx, 'APPLAUDIR ?', cx, hy - m * 0.06, { size: big, weight: 900, color: C.cyan, dir: 'right', t: seg(lt, T.applaudir - 0.2, T.applaudir + 0.9), alpha: qA, glow: 18, glowColor: rgba(C.cyan, 0.4), maxW: w * 0.9 });
    kSlide(ctx, "S'INQUIÉTER ?", cx, hy + m * 0.06 + big * 0.7, { size: big, weight: 900, color: C.amber, dir: 'left', t: seg(lt, T.inquieter - 0.2, T.inquieter + 0.9), alpha: qA, glow: 18, glowColor: rgba(C.amber, 0.4), maxW: w * 0.9 });
    mono(ctx, 'QUÉBEC ET OTTAWA · POSITIONS DIFFÉRENTES', cx, hy + m * 0.26, { size: Math.floor(m * 0.02), color: C.ice, t: seg(lt, T.qo, T.qo + 1.6), alpha: qA });
    mono(ctx, 'DEUX CÔTÉS DE LA MÉDAILLE', cx, hy - m * 0.28, { size: Math.floor(m * 0.022), color: C.slate, t: seg(lt, T.medaille - 0.2, T.medaille + 1.0), alpha: qA });

    const settle = smooth(seg(lt, T.traites - 0.3, T.traites + 0.8));

    /* ── EN HAUT : voix distincte (constellation francophone) ── */
    if (aTop > 0.003) {
      const bandH = V ? h * 0.36 : h * 0.4;
      const Pj = makeFlat(-8, 20, (V ? w * 0.62 : w * 0.36) / 150, cx + (V ? w * 0.04 : w * 0.12), topC.y + (V ? bandH * 0.16 : 0));
      const q = Pj.project(...P('quebec'));
      // faisceau cyan unique vers la constellation
      const draw = seg(lt, T.partisans, T.dilues + 0.5);
      const nodes = FRANCO_NET.map((k) => Pj.project(...P(k)));
      nodes.forEach((d, i) => {
        const t = clamp(draw * FRANCO_NET.length * 0.9 - i * 0.8);
        const pts = quadPts(q, d, -m * 0.05, 40);
        glowPath(ctx, pts, eInOutQuart(t), { color: C.cyan, width: 1.5, alpha: aTop * 0.75, head: true, glow: 0.5 });
        if (t >= 1) beacon(ctx, d.x, d.y, { color: C.ice, r: 4, alpha: aTop, time: gt + i * 0.3, pulse: false });
      });
      // liens de la constellation entre voisins
      ctx.save();
      ctx.globalAlpha *= aTop * 0.35 * smooth(seg(draw, 0.6, 1));
      ctx.strokeStyle = C.ice;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < nodes.length - 1; i++) {
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
      }
      ctx.stroke();
      ctx.restore();
      beacon(ctx, q.x, q.y, { color: C.cyan, r: 10, alpha: aTop, time: gt });
      kSlide(ctx, 'QUÉBEC', q.x, q.y - m * 0.03, { size: Math.floor(m * 0.024), weight: 800, color: C.cyan, t: seg(lt, T.partisans, T.partisans + 0.6), alpha: aTop });
      // typographie
      const lx = V ? cx : w * 0.06;
      const ly = V ? h * 0.13 : hy - h * 0.3;
      mono(ctx, 'DIPLOMATIE QUÉBÉCOISE AFFIRMÉE', lx, ly - m * 0.05, { size: Math.floor(m * 0.018), color: C.cyan, t: seg(lt, T.partisans, T.partisans + 1.2), alpha: aTop * (1 - settle * 0.5), align: V ? 'center' : 'left' });
      kRise(ctx, 'VOIX DISTINCTE', lx, ly + m * 0.01, { size: Math.floor(m * 0.055), weight: 900, t: seg(lt, T.raison - 0.6, T.raison + 0.5), alpha: aTop, align: V ? 'center' : 'left' });
      kWords(ctx, ['INTÉRÊTS', '·', 'LANGUE', '·', 'ALLIANCES'], lx, ly + m * 0.065, { size: Math.floor(m * 0.026), weight: 800, color: C.ice, time: lt, times: [T.interets + 0.3, T.langue - 0.2, T.langue, T.alliances - 0.2, T.alliances], alpha: aTop, align: V ? 'center' : 'left' });
      kWipe(ctx, 'SANS ÊTRE DILUÉS', lx, ly + m * 0.11, { size: Math.floor(m * 0.024), weight: 700, color: C.cyan, t: seg(lt, T.dilues, T.dilues + 0.8), alpha: aTop, align: V ? 'center' : 'left' });
    }

    /* ── EN BAS : front commun — un faisceau combiné s'ouvre en corridors vers l'Asie-Pacifique ── */
    if (aBot > 0.003) {
      const hub = { x: V ? w * 0.2 : w * 0.34, y: botC.y - (V ? h * 0.05 : h * 0.06) };
      const inQ = { x: -w * 0.02, y: hub.y - m * 0.09 };
      const inO = { x: -w * 0.02, y: hub.y + m * 0.09 };
      const join = eInOutQuart(seg(lt, T.pragma - 0.4, T.pragma + 1.0));
      // deux brins (Québec cyan, Ottawa ambre) qui se tressent en un faisceau blanc
      const strand = (from, col, ph) => {
        const pts = [];
        for (let i = 0; i <= 40; i++) {
          const u = i / 40;
          const x = lerp(from.x, hub.x, u);
          const y = lerp(from.y, hub.y, eInOutQuart(u)) + Math.sin(u * TAU * 2 + ph + gt * 2) * m * 0.01 * u;
          pts.push({ x, y });
        }
        return glowPath(ctx, pts, join, { color: col, width: 2.6, alpha: aBot, head: false });
      };
      strand(inQ, C.cyan, 0);
      strand(inO, C.amber, Math.PI);
      // divisions : la tresse se dédouble un instant
      const div = env(lt, T.divisions - 0.2, T.contrats - 0.4, 0.3, 0.5);
      if (div > 0.003) {
        const wob = Math.sin(gt * 6) * m * 0.03 * div;
        glowPath(ctx, [inQ, { x: hub.x, y: hub.y - wob }], 1, { color: C.cyan, width: 1.4, alpha: aBot * div, head: false, dash: [6, 6] });
        glowPath(ctx, [inO, { x: hub.x, y: hub.y + wob }], 1, { color: C.amber, width: 1.4, alpha: aBot * div, head: false, dash: [6, 6] });
      }
      beacon(ctx, hub.x, hub.y, { color: C.white, r: 10 * join, alpha: aBot, time: gt });
      // corridors vers les ports d'Asie-Pacifique
      const ports = [['TOKYO', 'tokyo'], ['SÉOUL', 'seoul'], ['HONG KONG', 'hongKong'], ['MANILLE', 'manila'], ['SINGAPOUR', 'singapore'], ['SYDNEY', 'sydney']];
      const open = seg(lt, T.contrats - 0.6, T.front + 0.8);
      const px = V ? w * 0.8 : w * 0.78;
      const spread = V ? h * 0.1 : h * 0.12;
      ports.forEach(([lab], i) => {
        const d = { x: px, y: hub.y + (i / (ports.length - 1) - 0.5) * 2 * spread };
        const t = clamp(open * ports.length * 0.75 - i * 0.6);
        const pts = quadPts(hub, d, (i - 2.5) * m * 0.015, 50);
        glowPath(ctx, pts, eInOutQuart(t), { color: C.white, width: 2.8, alpha: aBot * 0.7, head: true, glow: 0.8 });
        if (t >= 1) {
          for (let j = 0; j < 2; j++) {
            const p = along(pts, (gt * 0.2 + j * 0.5 + i * 0.13) % 1);
            ctx.save();
            ctx.globalAlpha *= aBot;
            ctx.fillStyle = j ? C.amber : C.cyan;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.ang);
            ctx.fillRect(-6, -3.5, 12, 7);
            ctx.restore();
          }
        }
        ring(ctx, d.x, d.y, 7 * clamp(t * 2 - 1), { color: C.gold, width: 2, alpha: aBot, glow: 8 });
        mono(ctx, lab, d.x - m * 0.02, d.y, { size: Math.floor(m * 0.016), color: C.gold, t: seg(t, 0.6, 1), alpha: aBot, align: 'right', cursor: false });
      });
      mono(ctx, 'PORTS D’ASIE-PACIFIQUE', px, hub.y - spread - m * 0.03, { size: Math.floor(m * 0.016), color: C.slate, t: seg(lt, T.contrats, T.contrats + 1), alpha: aBot });
      // typographie (sous le faisceau, côté gauche)
      const lx = V ? cx : w * 0.06;
      const ly = V ? h * 0.86 : h * 0.86;
      const al = V ? 'center' : 'left';
      mono(ctx, 'PRAGMATISME FÉDÉRAL', lx, ly - m * 0.05, { size: Math.floor(m * 0.018), color: C.amber, t: seg(lt, T.pragma, T.pragma + 1.0), alpha: aBot * (1 - settle * 0.5), align: al });
      kRise(ctx, 'FRONT COMMUN', lx, ly + m * 0.01, { size: Math.floor(m * 0.055), weight: 900, t: seg(lt, T.pragma + 0.2, T.pragma + 1.2), alpha: aBot, align: al });
      // trois arguments enchaînés sur une même ligne, calés sur la voix
      const s1 = smooth(seg(lt, T.contrats - 0.3, T.contrats + 0.1));
      const s2 = smooth(seg(lt, T.front - 0.3, T.front + 0.1));
      kWipe(ctx, 'DIVISIONS = POIDS AFFAIBLI', lx, ly + m * 0.065, { size: Math.floor(m * 0.026), weight: 800, color: C.coral, t: seg(lt, T.divisions, T.affaiblit + 0.6), alpha: aBot * (1 - s1), align: al, edge: C.coral });
      kWipe(ctx, 'CONTRATS DE MILLIARDS EN ASIE', lx, ly + m * 0.065, { size: Math.floor(m * 0.026), weight: 800, color: C.gold, t: seg(lt, T.contrats, T.asie + 0.6), alpha: aBot * s1 * (1 - s2), align: al, edge: C.gold });
      kWipe(ctx, 'FRONT COMMUN · GRANDS TRAITÉS', lx, ly + m * 0.065, { size: Math.floor(m * 0.026), weight: 800, color: C.white, t: seg(lt, T.front, T.traites + 0.6), alpha: aBot * s2, align: al, edge: C.white });
    }

    /* ── ACTE III : deux trajectoires parallèles stabilisées ── */
    if (settle > 0.003) {
      [[hy - m * 0.013, C.cyan], [hy + m * 0.013, C.amber]].forEach(([y, col], i) => {
        const pts = [];
        for (let k = 0; k <= 60; k++) {
          const u = k / 60;
          pts.push({ x: lerp(w * 0.06, w * 0.94, u), y: y + Math.sin(u * TAU * 2 + gt) * m * 0.01 * (1 - settle) });
        }
        glowPath(ctx, pts, eInOutQuart(settle), { color: col, width: 2.2, alpha: settle * 0.9 });
      });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * SCÈNE 13 — conclusion-debat-quebec · Option A ou Option B ?
 * Acte I   : LA QUESTION DU JOUR — rappel des trois dossiers (photo · toit · monde)
 * Acte II  : la diagonale scinde l'écran : OPTION A (ambre) / OPTION B (cyan) ;
 *            l'aiguille de la boussole pivote vers chaque camp au fil de la voix
 * Acte III : A ou B en commentaire · abonnez-vous · à très vite (coin inférieur droit libre)
 * ════════════════════════════════════════════════════════════════════════ */

function sceneFinale(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    question: 'Question du Jour',
    trancher: 'trancher',
    meta: 'face à Meta',
    loyers: 'flambée des loyers',
    monde: 'notre place dans le monde',
    deux: 'deux philosophies',
    direction: 'Quelle direction',
    optA: 'Option A :',
    fermes: 'règles fermes',
    plafonner: 'plafonner les loyers',
    punir: 'punir durement',
    voix: 'affirmer une voix',
    optB: 'Ou Option B',
    marche: 'le marché',
    couper: 'couper les règlements',
    construire: 'construire plus vite',
    attirer: 'attirer les géants',
    accords: 'prioriser les accords',
    ecrivez: 'Écrivez',
    commentaire: 'en commentaire',
    abonnez: 'abonnez-vous',
    franc: 'Franc Nord',
    vite: 'à très vite'
  });

  const aSplit = smooth(seg(lt, T.deux - 0.4, T.deux + 0.8));
  const endA = smooth(seg(lt, T.ecrivez - 0.5, T.ecrivez + 0.5));

  frame(a, () => {
    dust(ctx, stage, gt, { count: 120, alpha: 0.4 });

    /* ── ACTE I ── */
    const aI = 1 - smooth(seg(lt, T.deux - 0.6, T.deux + 0.3));
    if (aI > 0.003) {
      const ty = V ? h * 0.32 : cy - m * 0.12;
      mono(ctx, '04 · LA QUESTION', cx, ty - m * 0.13, { size: Math.floor(m * 0.022), color: C.red, t: seg(lt, 0.1, 1.0), alpha: aI });
      kRise(ctx, 'LA QUESTION', cx, ty - m * 0.02, { size: Math.floor(m * (V ? 0.12 : 0.11)), weight: 900, t: seg(lt, T.question - 0.4, T.question + 0.6), alpha: aI, maxW: w * 0.9 });
      kRise(ctx, 'DU JOUR', cx, ty + m * 0.09, { size: Math.floor(m * (V ? 0.12 : 0.11)), weight: 900, color: C.red, t: seg(lt, T.question, T.question + 1.0), alpha: aI, glow: 20, glowColor: rgba(C.red, 0.5), maxW: w * 0.9 });
      kWipe(ctx, 'À VOUS DE TRANCHER', cx, ty + m * 0.17, { size: Math.floor(m * 0.032), weight: 800, color: C.white, t: seg(lt, T.trancher - 0.5, T.trancher + 0.4), alpha: aI, edge: C.red });
      // rappel des trois dossiers
      const icons = [
        [T.meta, 'META', (x, y, s, al) => photoCard(ctx, x, y, s * 1.2, s * 0.9, { alpha: al, tint: C.amber, glow: 0.2 })],
        [T.loyers, 'LOYERS', (x, y, s, al) => isoHouse(ctx, x, y + s * 0.35, s * 0.9, { alpha: al, color: C.cyan })],
        [T.monde, 'NOTRE PLACE', (x, y, s, al) => { ring(ctx, x, y, s * 0.5, { color: C.emerald, width: 2, alpha: al, glow: 10 }); ring(ctx, x, y, s * 0.5, { color: C.emerald, width: 1, alpha: al * 0.5, dash: [3, 6], a0: gt * 0.3 }); beacon(ctx, x + s * 0.2, y - s * 0.1, { color: C.emerald, r: 4, alpha: al, time: gt, pulse: false }); }]
      ];
      icons.forEach(([k, lab, draw], i) => {
        const t = seg(lt, k - 0.2, k + 0.8);
        const x = cx + (i - 1) * m * (V ? 0.3 : 0.26);
        const y = V ? h * 0.66 : cy + m * 0.3;
        const s = m * 0.07;
        draw(x, y - (1 - eOutExpo(t)) * m * 0.04, s, aI * clamp(t * 2));
        kSlide(ctx, lab, x, y + s * 0.95, { size: Math.floor(m * 0.02), weight: 800, color: C.slate, t, alpha: aI });
      });
    }

    /* ── ACTE II : OPTION A / OPTION B ── */
    if (aSplit > 0.003) {
      const fade = 1 - endA * 0.55;
      // diagonale
      const p1 = V ? { x: -w * 0.05, y: h * 0.38 } : { x: w * 0.58, y: -h * 0.02 };
      const p2 = V ? { x: w * 1.05, y: h * 0.62 } : { x: w * 0.42, y: h * 1.02 };
      const dIn = eOutExpo(seg(lt, T.deux - 0.2, T.deux + 1.2));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(C.white, 0.9);
      ctx.lineWidth = 2.4;
      ctx.shadowColor = C.ice;
      ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(lerp(p1.x, p2.x, dIn), lerp(p1.y, p2.y, dIn));
      ctx.stroke();
      ctx.restore();
      const Ac = V ? { x: cx, y: h * 0.2 } : { x: w * 0.25, y: cy };
      const Bc = V ? { x: cx, y: h * 0.78 } : { x: w * 0.75, y: cy };
      const lean = track(lt, [[T.optA - 0.4, 0], [T.optA + 0.6, -1], [T.optB - 0.4, -1], [T.optB + 0.6, 1], [T.ecrivez - 0.3, 1], [T.ecrivez + 0.7, 0]]);
      light(ctx, Ac.x, Ac.y, m * 0.7, C.amber, 0.22 * aSplit * (0.6 + 0.4 * Math.max(0, -lean)));
      light(ctx, Bc.x, Bc.y, m * 0.7, C.cyan, 0.22 * aSplit * (0.6 + 0.4 * Math.max(0, lean)));
      mono(ctx, 'QUELLE DIRECTION POUR LE QUÉBEC ?', cx, V ? h * 0.5 + m * 0.2 : h * 0.13, { size: Math.floor(m * 0.022), color: C.ice, t: seg(lt, T.direction, T.direction + 1.4), alpha: aSplit * (1 - endA) });
      const big = Math.floor(m * (V ? 0.085 : 0.075));
      const colA = (lt < T.optB - 0.2 ? 1 : 0.55) * (V ? 1 - endA : fade);
      const colB = (lt > T.optB - 0.2 ? 1 : 0.55) * smooth(seg(lt, T.optB - 0.4, T.optB + 0.3)) * (V ? 1 - endA : fade);
      const ayT = V ? Ac.y - big * 0.4 : Ac.y - m * 0.22;
      const byT = V ? Bc.y - big * 0.4 : Bc.y - m * 0.22;
      mono(ctx, 'OPTION A', Ac.x, ayT - big * 0.95, { size: Math.floor(m * 0.026), color: C.amber, t: seg(lt, T.optA - 0.2, T.optA + 0.6), alpha: aSplit * colA, spacing: 8 });
      kRise(ctx, 'ENCADRER', Ac.x, ayT, { size: big, weight: 900, color: C.white, t: seg(lt, T.optA, T.optA + 0.9), alpha: aSplit * colA });
      kRise(ctx, '& PROTÉGER', Ac.x, ayT + big * 0.95, { size: big, weight: 900, color: C.gold, t: seg(lt, T.fermes - 0.3, T.fermes + 0.6), alpha: aSplit * colA });
      const listA = [[T.plafonner, 'PLAFONNER LES LOYERS'], [T.punir, 'PUNIR LES GÉANTS DU WEB'], [T.voix, 'VOIX QUÉBÉCOISE DISTINCTE']];
      listA.forEach(([k, txt], i) => {
        const y = (V ? Ac.y + big * 1.35 : Ac.y + m * 0.04) + i * m * 0.05;
        kSlide(ctx, txt, Ac.x, y, { size: Math.floor(m * 0.026), weight: 700, color: C.slate, t: seg(lt, k - 0.1, k + 0.6), alpha: aSplit * colA * (1 - endA), maxW: V ? w * 0.9 : w * 0.4 });
      });
      mono(ctx, 'OPTION B', Bc.x, byT - big * 0.95, { size: Math.floor(m * 0.026), color: C.cyan, t: seg(lt, T.optB - 0.2, T.optB + 0.6), alpha: aSplit * colB, spacing: 8 });
      kRise(ctx, 'CONSTRUIRE', Bc.x, byT, { size: big, weight: 900, color: C.white, t: seg(lt, T.optB, T.optB + 0.9), alpha: aSplit * colB });
      kRise(ctx, '& OUVRIR', Bc.x, byT + big * 0.95, { size: big, weight: 900, color: C.ice, t: seg(lt, T.marche - 0.3, T.marche + 0.6), alpha: aSplit * colB });
      const listB = [[T.couper, 'COUPER LES RÈGLEMENTS'], [T.construire, 'CONSTRUIRE PLUS VITE'], [T.attirer, 'ATTIRER LA TECH'], [T.accords, 'ACCORDS COMMERCIAUX']];
      listB.forEach(([k, txt], i) => {
        const y = (V ? Bc.y + big * 1.35 : Bc.y + m * 0.04) + i * m * 0.05;
        kSlide(ctx, txt, Bc.x, y, { size: Math.floor(m * 0.026), weight: 700, color: C.slate, t: seg(lt, k - 0.1, k + 0.6), alpha: aSplit * colB * (1 - endA), maxW: V ? w * 0.9 : w * 0.4 });
      });
      // boussole au centre, sur la diagonale
      const er = m * (V ? 0.07 : 0.075);
      const ex = cx;
      const ey = V ? h * 0.5 : cy;
      const swing = (V ? Math.PI / 2 : Math.PI / 2) * 0.55 * lean * (1 - endA) + Math.sin(gt * 1.3) * 0.03;
      // paysage : A à gauche, B à droite ; portrait : A en haut (aiguille droite), B en bas (aiguille retournée)
      const swingV = Math.PI * clamp(lean, 0, 1) * (1 - endA) + Math.sin(gt * 1.3) * 0.03;
      emblem(ctx, ex, ey, er * lerp(1, 1.6, endA), { time: gt, alpha: aSplit, swing: V ? swingV : swing });
    }

    /* ── ACTE III : appel à l'action ── */
    if (endA > 0.003) {
      const by = V ? h * 0.66 : h * 0.73;
      // bulle de commentaire « A ou B ? »
      const bw = m * 0.34;
      const bh = m * 0.11;
      const pop = eOutBack(seg(lt, T.ecrivez - 0.2, T.ecrivez + 0.6), 1.8);
      if (pop > 0.01) {
        ctx.save();
        ctx.globalAlpha *= endA;
        ctx.translate(cx, by);
        ctx.scale(pop, pop);
        rrect(ctx, -bw / 2, -bh / 2, bw, bh, bh * 0.3);
        ctx.fillStyle = 'rgba(10,20,34,0.92)';
        ctx.fill();
        ctx.strokeStyle = rgba(C.white, 0.8);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-bw * 0.25, bh / 2);
        ctx.lineTo(-bw * 0.32, bh / 2 + bh * 0.35);
        ctx.lineTo(-bw * 0.14, bh / 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(10,20,34,0.92)';
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        // pastilles A / B
        const chip = (x, lab, col, t) => {
          const k = eOutBack(t, 2.2);
          if (k <= 0) return;
          ctx.save();
          ctx.globalAlpha *= endA;
          ctx.translate(x, by);
          ctx.scale(k * pop, k * pop);
          ctx.fillStyle = col;
          ctx.shadowColor = col;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(0, 0, bh * 0.32, 0, TAU);
          ctx.fill();
          ctx.restore();
          kZoom(ctx, lab, x, by, { size: Math.floor(bh * 0.4), weight: 900, color: C.night, base: 'middle', t: seg(t, 0.3, 1), alpha: endA });
        };
        chip(cx - bw * 0.3, 'A', C.amber, seg(lt, T.ecrivez + 0.3, T.ecrivez + 0.8));
        kSlide(ctx, 'OU', cx, by, { size: Math.floor(bh * 0.3), weight: 800, color: C.slate, base: 'middle', t: seg(lt, T.ecrivez + 0.6, T.ecrivez + 1.1), alpha: endA });
        chip(cx + bw * 0.3, 'B', C.cyan, seg(lt, T.ecrivez + 0.9, T.ecrivez + 1.4));
      }
      kWipe(ctx, 'ÉCRIVEZ-LE EN COMMENTAIRE', cx, by + bh * 1.05, { size: Math.floor(m * 0.028), weight: 800, color: C.white, t: seg(lt, T.commentaire - 0.2, T.commentaire + 0.7), alpha: endA, edge: C.amber });
      // abonnez-vous : l'emblème grandit, titre de marque
      const subA = smooth(seg(lt, T.abonnez - 0.2, T.abonnez + 0.5));
      const ty = V ? h * 0.36 : h * 0.24;
      mono(ctx, 'ABONNEZ-VOUS', cx, ty - m * 0.17, { size: Math.floor(m * 0.024), color: C.amber, t: seg(lt, T.abonnez, T.abonnez + 0.8), alpha: subA, spacing: 8 });
      const vA = smooth(seg(lt, T.vite - 0.3, T.vite + 0.4));
      kRise(ctx, 'À TRÈS VITE', cx, V ? h * 0.82 : h * 0.92, { size: Math.floor(m * 0.03), weight: 800, color: C.ice, t: seg(lt, T.vite - 0.1, T.vite + 0.8), alpha: vA, spacing: 6 });
      underline(ctx, cx, (V ? h * 0.82 : h * 0.92) + m * 0.02, m * 0.3, seg(lt, T.vite + 0.3, T.vite + 1.3), { alpha: vA });
    }
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * REGISTRE DES 13 SCÈNES
 * ════════════════════════════════════════════════════════════════════════ */
export const CUSTOM_SCENES = {
  'intro-sommaire': sceneIntro,
  'd1-fait-declencheur': sceneMetaFine,
  'd1-coulisses-geopolitiques': sceneDataWar,
  'd1-deux-cotes-medaille': scenePrivacySplit,
  'd1-impact-quebec': sceneLoi25,
  'd2-fait-declencheur': sceneStreets,
  'd2-coulisses-geopolitiques': sceneAsset,
  'd2-deux-cotes-medaille': sceneRemedies,
  'd2-impact-quebec': sceneQcRent,
  'd3-enjeu-mondial': sceneSummit,
  'd3-lien-quebec': sceneTable,
  'd3-deux-cotes-medaille': sceneTwoVoices,
  'conclusion-debat-quebec': sceneFinale
};
