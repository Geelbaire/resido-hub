/** Cartes HUD en verre de saphir, filets de liaison et repères typographiques. */
import {kWipe, kSlide, mono, odometer, light as glow} from './moteur.js';
import {color, clamp, ease, lerp, rgba, line, label, glass, TAU} from './mise-en-scene.js';

/**
 * Carte de données en verre de saphir.
 * t : apparition 0→1 ; out : disparition 0→1 ; value : {v, dec, prefix, suffix, from}
 */
export function card(d, {
  x, y, w = 360, h = 132, tint = color.cyan, kicker = '', title = '', sub = '',
  t = 1, out = 0, value = null, size, numberSize, align = 'left',
}) {
  const {ctx, bare} = d;
  // Hauteur minimale garantie : sur-titre + titre + compteur + légende sans chevauchement
  {
    const ts0 = size ?? Math.min(34, h * .26), ns0 = numberSize ?? Math.min(76, h * .42);
    const need = 30 + (kicker ? 20 + ts0 * .82 + (title ? 0 : 10) : ts0 * .7) + (title ? ts0 * .5 : 0) +
      (value ? ns0 * 1.15 : 0) + (sub ? 34 : 0) + 18;
    if (value && sub) h = Math.max(h, need);
  }
  const a = ease(t) * (1 - ease(out));
  if (a < .01) return;
  const lift = (1 - ease(t)) * 22 - ease(out) * 14;
  const s = lerp(.94, 1, ease(t));
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y + lift);
  ctx.scale(s, s);
  glass(ctx, 0, 0, w, h, tint, d.t, () => {
    // Micro-grille télémétrique et repères d'angle
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    line(ctx, [[-w / 2 + 12, -h / 2 + 22], [-w / 2 + 12, -h / 2 + 12], [-w / 2 + 22, -h / 2 + 12]], rgba(tint, .8), 1.4);
    line(ctx, [[w / 2 - 12, h / 2 - 22], [w / 2 - 12, h / 2 - 12], [w / 2 - 22, h / 2 - 12]], rgba(tint, .8), 1.4);
    ctx.fillStyle = tint;
    ctx.fillRect(-w / 2, -h / 2 + 16, 3, h - 32);
    ctx.restore();
    if (bare) return;
    const left = align === 'left' ? -w / 2 + 26 : 0;
    const al = align === 'left' ? 'left' : 'center';
    const ts = size ?? Math.min(34, h * .26);
    let yy = -h / 2 + 30;
    if (kicker) {
      mono(ctx, kicker, left, yy, {size: 15, color: tint, align: al, spacing: 2.4, t: clamp(t * 1.6), cursor: false});
      yy += 20 + ts * .82;
      if (!title) yy += 10;
    } else yy += ts * .7;
    if (title) {
      kWipe(ctx, title, left, yy, {t: clamp((t - .15) * 1.5), size: ts, weight: 850, maxW: w - 52, align: al, edge: tint});
      yy += ts * .5;
    }
    if (value) {
      const ns = numberSize ?? Math.min(76, h * .42);
      const v = lerp(value.from ?? 0, value.v, ease(clamp((t - .2) / .8)) * (value.p ?? 1));
      odometer(ctx, v, left, yy + ns * .92, {
        size: ns, weight: 850, dec: value.dec ?? 0, prefix: value.prefix ?? '', suffix: value.suffix ?? '',
        suffixScale: (value.suffix || '').length <= 2 ? .72 : .5, color: color.white, suffixColor: tint, glow: 5, glowColor: tint, align: al,
      });
      yy += ns * 1.15;
    }
    if (sub) {
      label(ctx, sub, left, value ? Math.min(h / 2 - 20, yy + 12) : h / 2 - 22, {size: 15, mono: true, align: al, width: w - 52, tint: color.slate,
        alpha: clamp((t - .4) * 2)});
    }
  }, {radius: 16});
  ctx.restore();
}

/** Filet de liaison coudé qui se trace entre un repère et une carte. */
export function tether(ctx, from, to, tint, t = 1) {
  if (!from || t <= 0) return;
  const mid = [lerp(from.x, to.x, .55), from.y];
  const pts = [[from.x, from.y], mid, [to.x, to.y]];
  const lengths = [Math.hypot(mid[0] - from.x, 0), Math.hypot(to.x - mid[0], to.y - mid[1])];
  const total = lengths[0] + lengths[1];
  const run = ease(t) * total;
  const p = run <= lengths[0] ? [[from.x, from.y], [lerp(from.x, mid[0], run / lengths[0]), from.y]] :
    [pts[0], pts[1], [lerp(mid[0], to.x, (run - lengths[0]) / lengths[1]), lerp(mid[1], to.y, (run - lengths[0]) / lengths[1])]];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  line(ctx, p, rgba(tint, .75), 1.4);
  ctx.restore();
  const tip = p[p.length - 1];
  glow(ctx, tip[0], tip[1], 14, tint, .6);
}

/** Sur-titre mono + grand titre balayé : bloc d'affiche (2 à 6 mots). */
export function poster(d, {x, y, kicker, title, t = 1, out = 0, tint = color.cyan, size = 64, align = 'left', maxW = 900}) {
  const {ctx, bare} = d;
  if (bare || t <= 0 || out >= 1) return;
  mono(ctx, kicker, x, y - size * .95, {size: 17, color: tint, align, spacing: 3, t: clamp(t * 1.8), cursor: false,
    alpha: 1 - ease(out)});
  kSlide(ctx, title, x, y, {t, out, size, weight: 900, align, maxW, dir: 'up'});
}

/** Pastille numérotée « 01 · … » en verre. */
export function badge(ctx, x, y, r, tint, t = 1, n = '') {
  if (t <= 0) return;
  ctx.save();
  ctx.globalAlpha *= ease(t);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  const g = ctx.createRadialGradient(x - r * .4, y - r * .5, 1, x, y, r);
  g.addColorStop(0, rgba(tint, .55));
  g.addColorStop(1, '#06121Ee8');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(tint, .9);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
  if (n) label(ctx, n, x, y, {size: r * .9, mono: true, tint: color.white, alpha: ease(t)});
}

/** Graduations micrométriques horlogères autour d'un compteur. */
export function ticks(ctx, x, y, w, tint, progress = 1, time = 0) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const n = 80;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const xx = x - w / 2 + w * i / n;
    const hh = i % 10 === 0 ? 14 : i % 5 === 0 ? 9 : 5;
    ctx.moveTo(xx, y);
    ctx.lineTo(xx, y + hh);
  }
  ctx.strokeStyle = rgba(tint, .42);
  ctx.lineWidth = 1;
  ctx.stroke();
  const cursor = x - w / 2 + w * clamp(progress);
  line(ctx, [[x - w / 2, y], [cursor, y]], rgba(tint, .95), 2.4);
  glow(ctx, cursor, y, 24, tint, .7 + .2 * Math.sin(time * 4));
  ctx.restore();
}
