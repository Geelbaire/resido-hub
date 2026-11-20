/**
 * Écran scindé dynamique à géométrie variable (70/30 ⇄ 30/70 ⇄ 50/50).
 * La cloison lumineuse suit un ressort amorti : léger dépassement puis repos.
 */
import {light, mono} from './moteur.js';
import {color, clamp, ease, lerp, rgba, line, label, glass, TAU} from './mise-en-scene.js';
import {badge} from './hud.js';

/**
 * Réponse du ressort de la cloison, s secondes après un changement de camp :
 * 0 au départ, 1 au repos (au-delà de 1 = dépassement).
 */
function ressort(s) {
  // TODO(human) : choisir la « sensation » de la cloison (amorti, fréquence, dépassement).
  // Réglage livré : amorti 4,2 · fréquence 7,2 rad/s · dépassement ≈ 8 %.
  return 1 - Math.exp(-4.2 * s) * (Math.cos(7.2 * s) + .58 * Math.sin(7.2 * s));
}

/** Ressort amorti entre cibles successives [[t, valeur], …]. */
export function elastic(time, keys) {
  let value = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [tk, target] = keys[i];
    if (time < tk) break;
    value = value + (target - value) * ressort(time - tk);
  }
  return value;
}

/** Pictogrammes vectoriels fins (24 px de référence). */
export function icon(ctx, kind, x, y, s, tint) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 24, s / 24);
  ctx.strokeStyle = tint;
  ctx.fillStyle = tint;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (kind) {
    case 'missile': ctx.moveTo(-10, 10); ctx.lineTo(8, -8); ctx.moveTo(8, -8); ctx.lineTo(10, -10); ctx.moveTo(3, -9); ctx.lineTo(9, -3);
      ctx.moveTo(-10, 10); ctx.lineTo(-12, 4); ctx.moveTo(-10, 10); ctx.lineTo(-4, 12); break;
    case 'shield': ctx.moveTo(0, -11); ctx.lineTo(9, -7); ctx.lineTo(8, 3); ctx.quadraticCurveTo(5, 9, 0, 12); ctx.quadraticCurveTo(-5, 9, -8, 3);
      ctx.lineTo(-9, -7); ctx.closePath(); break;
    case 'globe': ctx.arc(0, 0, 10, 0, TAU); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.ellipse(0, 0, 4.5, 10, 0, 0, TAU); break;
    case 'bolt': ctx.moveTo(2, -11); ctx.lineTo(-6, 2); ctx.lineTo(0, 2); ctx.lineTo(-2, 11); ctx.lineTo(6, -2); ctx.lineTo(0, -2); ctx.closePath(); break;
    case 'chat': ctx.moveTo(-10, -7); ctx.lineTo(10, -7); ctx.lineTo(10, 5); ctx.lineTo(-2, 5); ctx.lineTo(-7, 10); ctx.lineTo(-6, 5); ctx.lineTo(-10, 5); ctx.closePath(); break;
    case 'scale': ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.moveTo(-9, -6); ctx.lineTo(9, -6); ctx.moveTo(-9, -6); ctx.lineTo(-12, 2); ctx.lineTo(-6, 2); ctx.closePath();
      ctx.moveTo(9, -6); ctx.lineTo(6, 2); ctx.lineTo(12, 2); ctx.closePath(); ctx.moveTo(-5, 10); ctx.lineTo(5, 10); break;
    case 'chart': ctx.moveTo(-11, 10); ctx.lineTo(11, 10); ctx.moveTo(-9, 5); ctx.lineTo(-3, -1); ctx.lineTo(2, 3); ctx.lineTo(10, -9); break;
    case 'drop': ctx.moveTo(-9, -9); ctx.lineTo(-3, -1); ctx.lineTo(2, -4); ctx.lineTo(10, 9); ctx.moveTo(10, 9); ctx.lineTo(4, 9); ctx.moveTo(10, 9); ctx.lineTo(10, 3); break;
    case 'thermo': ctx.moveTo(-2, 5); ctx.lineTo(-2, -10); ctx.arc(0, -10, 2, Math.PI, 0); ctx.lineTo(2, 5); ctx.arc(0, 8, 4, -1.1, Math.PI + 1.1); break;
    case 'factory': ctx.moveTo(-11, 10); ctx.lineTo(-11, -2); ctx.lineTo(-4, 2); ctx.lineTo(-4, -2); ctx.lineTo(3, 2); ctx.lineTo(3, -10); ctx.lineTo(8, -10); ctx.lineTo(8, 10); ctx.closePath(); break;
    case 'grid': ctx.moveTo(0, -11); ctx.lineTo(-7, 11); ctx.moveTo(0, -11); ctx.lineTo(7, 11); ctx.moveTo(-9, -5); ctx.lineTo(9, -5); ctx.moveTo(-5, 3); ctx.lineTo(5, 3); break;
    case 'lock': ctx.rect(-8, -2, 16, 12); ctx.moveTo(-5, -2); ctx.lineTo(-5, -6); ctx.arc(0, -6, 5, Math.PI, 0); ctx.lineTo(5, -2); break;
    case 'child': ctx.arc(0, -6, 4, 0, TAU); ctx.moveTo(0, -2); ctx.lineTo(0, 6); ctx.moveTo(-6, 1); ctx.lineTo(6, 1); ctx.moveTo(0, 6); ctx.lineTo(-4, 11); ctx.moveTo(0, 6); ctx.lineTo(4, 11); break;
    case 'cyber': ctx.rect(-10, -8, 20, 14); ctx.moveTo(-4, 10); ctx.lineTo(4, 10); ctx.moveTo(-6, -2); ctx.lineTo(-2, 1); ctx.lineTo(-6, 4); ctx.moveTo(1, 4); ctx.lineTo(6, 4); break;
    case 'dna': for (let i = -10; i <= 10; i += 4) { ctx.moveTo(-6 * Math.sin(i * .3), i); ctx.lineTo(6 * Math.sin(i * .3), i); }
      ctx.moveTo(-6 * Math.sin(-3), -10); for (let i = -10; i <= 10; i++) ctx.lineTo(6 * Math.sin(i * .3), i); break;
    case 'brain': ctx.arc(-3, -2, 7, Math.PI * .6, Math.PI * 1.9); ctx.arc(4, 0, 7, Math.PI * 1.2, Math.PI * .4); ctx.moveTo(0, -8); ctx.lineTo(0, 9); break;
    case 'ship': ctx.moveTo(-11, 2); ctx.lineTo(11, 2); ctx.lineTo(7, 9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.moveTo(-4, 2); ctx.lineTo(-3, -5); ctx.lineTo(5, -5); ctx.lineTo(6, 2); break;
    case 'snow': for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.lineTo(-Math.cos(a) * 10, -Math.sin(a) * 10); } break;
    default: ctx.arc(0, 0, 9, 0, TAU);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Écran scindé. ratio = part du camp A (0,3 → 0,7).
 * camp = {tint, camp, title, items:[[icone, texte, sous-texte]], shown (nombre révélé, fractionnaire), focus}
 */
export function split(d, {ratio = .5, A, B, bg, prism = false, enter = 1, out = 0, dim = 0}) {
  const {ctx, w, h, t, vertical: v, bare} = d;
  bg?.(d);
  const x0 = v ? 40 : 46, x1 = v ? w - 40 : w - 46;
  const y0 = v ? 150 : 118, y1 = v ? 1036 : 618;
  const span = v ? y1 - y0 : x1 - x0;
  const cut = (v ? y0 : x0) + span * ratio;
  const gap = 12;
  const panels = v ? [
    {camp: A, x: x0, y: y0, pw: x1 - x0, ph: cut - gap - y0, share: ratio},
    {camp: B, x: x0, y: cut + gap, pw: x1 - x0, ph: y1 - cut - gap, share: 1 - ratio},
  ] : [
    {camp: A, x: x0, y: y0, pw: cut - gap - x0, ph: y1 - y0, share: ratio},
    {camp: B, x: cut + gap, y: y0, pw: x1 - cut - gap, ph: y1 - y0, share: 1 - ratio},
  ];
  const appear = ease(enter) * (1 - ease(out)) * (1 - .7 * dim);
  panels.forEach(({camp, x, y, pw, ph, share}, i) => {
    if (pw < 30 || ph < 30) return;
    const focus = clamp((share - .32) / .3);
    ctx.save();
    ctx.globalAlpha *= appear * (.62 + .38 * focus);
    const slide = (1 - ease(enter)) * (i ? 60 : -60);
    ctx.translate(v ? 0 : slide, v ? slide : 0);
    glass(ctx, x + pw / 2, y + ph / 2, pw, ph, camp.tint, t, () => {
      const L = -pw / 2 + 30, T0 = -ph / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-pw / 2, -ph / 2, pw, ph);
      ctx.clip();
      light(ctx, 0, 0, Math.max(pw, ph) * .6, camp.tint, .16 + .12 * focus);
      // Grande lettre filigrane A / B (décor, exclue du contrôle typographique)
      globalThis.__FN_QA_SKIP = true;
      label(ctx, i ? 'B' : 'A', pw / 2 - (v ? 60 : 80), ph / 2 - (v ? 60 : 80), {size: v ? 130 : 190, tint: rgba(camp.tint, .08), weight: 900, width: 400});
      globalThis.__FN_QA_SKIP = false;
      if (!bare) {
        mono(ctx, camp.camp, L, T0 + 34, {size: 16, color: camp.tint, align: 'left', spacing: 3, cursor: false});
        const tw = pw - 70;
        ctx.save();
        const wipe = clamp(camp.titleT ?? 1);
        ctx.beginPath();
        ctx.rect(L - 4, T0 + 44, (tw + 10) * ease(wipe), v ? 60 : 64);
        ctx.clip();
        label(ctx, camp.title, L, T0 + (v ? 80 : 84), {size: v ? 38 : 42, width: tw, align: 'left', tint: color.white, weight: 900});
        ctx.restore();
      }
      // Cartes télémétriques
      const items = camp.items || [];
      const top = T0 + (v ? 132 : 150);
      const avail = (v ? ph : ph) - (v ? 150 : 170);
      const rowH = Math.min(v ? 92 : 128, avail / Math.max(1, items.length));
      const compact = rowH < 66;
      items.forEach(([kind, text, sub], k) => {
        const reveal = clamp((camp.shown ?? items.length) - k);
        if (reveal <= 0) return;
        const yy = top + rowH * k + rowH * .5;
        const a = ease(reveal);
        ctx.save();
        ctx.globalAlpha *= a;
        ctx.translate((1 - a) * 30, 0);
        const cw = pw - 60, chh = rowH - 14;
        ctx.beginPath();
        ctx.roundRect(L - 6, yy - chh / 2, cw, chh, 12);
        ctx.fillStyle = rgba(camp.tint, .09 + .05 * (k === Math.floor((camp.shown ?? 0) - .001) ? 1 : 0));
        ctx.fill();
        ctx.strokeStyle = rgba(camp.tint, .35);
        ctx.lineWidth = 1;
        ctx.stroke();
        badge(ctx, L + 28, yy, compact ? 16 : v ? 22 : 27, camp.tint, 1, String(k + 1));
        icon(ctx, kind, L + (v ? 80 : 92), yy, compact ? 24 : v ? 30 : 38, camp.tint);
        if (!bare) {
          const tx = L + (v ? 116 : 136), tw = cw - (v ? 132 : 152);
          label(ctx, text, tx, yy - (sub && !compact ? (v ? 12 : 16) : 0), {size: compact ? 22 : v ? 28 : 32, width: tw, align: 'left', tint: color.white, weight: 800});
          if (sub && !compact) label(ctx, sub, tx, yy + (v ? 18 : 24), {size: v ? 15 : 17, width: tw, mono: true, align: 'left', tint: color.slate});
        }
        ctx.restore();
      });
      ctx.restore();
    }, {radius: 22});
    ctx.restore();
  });
  // Cloison lumineuse (lame laser)
  ctx.save();
  ctx.globalAlpha *= appear;
  ctx.globalCompositeOperation = 'lighter';
  const p0 = v ? [x0 - 20, cut] : [cut + 10, y0 - 20], p1 = v ? [x1 + 20, cut] : [cut - 10, y1 + 20];
  line(ctx, [p0, p1], rgba(A.tint, .25), 24);
  line(ctx, [p0, p1], rgba(B.tint, .7), 5);
  line(ctx, [p0, p1], '#F2FCFF', 1.8);
  const f = .5 + .45 * Math.sin(t * .9);
  light(ctx, lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f), 60, color.white, .35);
  ctx.restore();
  if (prism) {
    const px = v ? w / 2 : cut, py = v ? cut : (y0 + y1) / 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(t * .2);
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + k * TAU / 3;
      ctx.lineTo(Math.cos(a) * 44, Math.sin(a) * 44);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(-44, -44, 44, 44);
    g.addColorStop(0, rgba(A.tint, .55));
    g.addColorStop(.5, '#E8FBFFcc');
    g.addColorStop(1, rgba(B.tint, .55));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    light(ctx, px, py, 90, color.white, .45);
  }
  return cut;
}
