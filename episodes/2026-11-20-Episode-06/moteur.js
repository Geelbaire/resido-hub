/** Moteur Canvas hérité du reportage Épicerie et de la reprise de l’épisode 04. */

/* ════════════════════════════════════════════════════════════════════════
 * 1. TYPOGRAPHIE DE LA CHARTE
 * ════════════════════════════════════════════════════════════════════════ */

const DISPLAY = '"Montserrat", "Avenir Next", "Inter", "SF Pro Display", system-ui, sans-serif';
const MONO = '"IBM Plex Mono", "SF Mono", Menlo, monospace';

if (typeof document !== 'undefined' && !document.getElementById('fn-fonts')) {
  const style=document.createElement('style');style.id='fn-fonts';document.head.appendChild(style);
  const faces=[['Montserrat','Montserrat.ttf','100 900'],['IBM Plex Mono','IBMPlexMono-Medium.ttf','500'],['IBM Plex Mono','IBMPlexMono-SemiBold.ttf','600']];
  await Promise.all(faces.map(async([family,file,weight])=>{const face=new FontFace(family,`url("${new URL('./assets/'+file,import.meta.url).href}")`,{weight});document.fonts.add(await face.load());}));
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
  /* surface stable : pas de grain temporel */
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
function qaClip(ctx,x,y,w,h){
 if(!globalThis.__FN_QA)return;
 const m=ctx.getTransform(),pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([a,b])=>[m.a*a+m.c*b+m.e,m.b*a+m.d*b+m.f]);
 let clip={x0:Math.min(...pts.map(p=>p[0])),y0:Math.min(...pts.map(p=>p[1])),x1:Math.max(...pts.map(p=>p[0])),y1:Math.max(...pts.map(p=>p[1]))};
 const old=globalThis.__FN_QA_CLIP;if(old)clip={x0:Math.max(old.x0,clip.x0),y0:Math.max(old.y0,clip.y0),x1:Math.min(old.x1,clip.x1),y1:Math.min(old.y1,clip.y1)};
 globalThis.__FN_QA_CLIP=clip;
}
function qaBox(ctx, S, x0, y0, x1, y1, alpha) {
  const q = globalThis.__FN_QA;
  if (!q || S.text === undefined || globalThis.__FN_QA_SKIP) return;
  const m = ctx.getTransform();
  const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  let box={x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)};const clip=globalThis.__FN_QA_CLIP;if(clip)box={x0:Math.max(box.x0,clip.x0),y0:Math.max(box.y0,clip.y0),x1:Math.min(box.x1,clip.x1),y1:Math.min(box.y1,clip.y1)};if(box.x1<=box.x0||box.y1<=box.y0)return;q.push({text:S.text,g:globalThis.__FN_QA_G||0,a:alpha,...box,size:S.size});
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
  const priorClip=globalThis.__FN_QA_CLIP;
  ctx.save();
  if (mask) {
    ctx.beginPath();
    qaClip(ctx,x0-P.size,y-P.size*1.25-P.glow,L.total+P.size*2,P.size*1.55+P.glow*1.5);
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
  globalThis.__FN_QA_CLIP=priorClip;
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
  const priorClip=globalThis.__FN_QA_CLIP;
  ctx.save();
  ctx.beginPath();
  if (dir === 'up' || dir === 'down') ctx.rect(x - ax - P.glow - 20, y + ay - S.asc - P.glow - 4, S.w + P.glow * 2 + 40, S.asc + S.desc + P.glow * 2 + 8);
  else ctx.rect(x - ax - 4, y + ay - S.asc - P.glow - 20, S.w + 8, S.asc + S.desc + P.glow * 2 + 40);
  if(dir==='up'||dir==='down')qaClip(ctx,x-ax-P.glow-20,y+ay-S.asc-P.glow-4,S.w+P.glow*2+40,S.asc+S.desc+P.glow*2+8);else qaClip(ctx,x-ax-4,y+ay-S.asc-P.glow-20,S.w+8,S.asc+S.desc+P.glow*2+40);
  ctx.clip();
  drawSprite(ctx, S, x + dx, y + dy, { align, base, alpha: alpha * clamp(t * 3) });
  ctx.restore();
  globalThis.__FN_QA_CLIP=priorClip;
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
  const priorClip=globalThis.__FN_QA_CLIP;
  ctx.save();
  ctx.beginPath();
  ctx.rect(xa, y + ay - S.asc - P.glow - 10, xb - xa, S.asc + S.desc + P.glow * 2 + 20);
  qaClip(ctx,xa,y+ay-S.asc-P.glow-10,xb-xa,S.asc+S.desc+P.glow*2+20);
  ctx.clip();
  drawSprite(ctx, S, x, y, { align, base, alpha });
  ctx.restore();
  globalThis.__FN_QA_CLIP=priorClip;
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
  const priorClip=globalThis.__FN_QA_CLIP;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (preS) {
    drawSprite(ctx, preS, cx, y, { align: 'left' });
    cx += preS.w + P.size * 0.12;
  }
  ctx.beginPath();
  ctx.rect(cx - 4, y - S0.asc - P.glow * 0.6 - 4, total + 8, S0.asc + S0.desc * 0.6 + P.glow * 1.2 + 8);
  ctx.save();
  qaClip(ctx,cx-4,y-S0.asc-P.glow*.6-4,total+8,S0.asc+S0.desc*.6+P.glow*1.2+8);
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
  globalThis.__FN_QA_CLIP=priorClip;
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

export { underline, rgba, mix, rrect, shield, arrowHead, dust, C, D2R, TAU, clamp, lerp, seg, smooth, smoother, eOutExpo, eInOutQuart, env, track, cues, frame, kRise, kSlide, kWipe, kZoom, mono, odometer, textSprite, drawSprite, light, flare, glowPath, quadPts, ring, beacon, emblem, makeGlobe, projectAll, arcPts, smoothPath, trail, camera };
