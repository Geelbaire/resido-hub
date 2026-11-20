/**
 * Scanner rayons X architectural en double passe :
 * 1) la silhouette vectorielle se trace ; 2) une lame laser verticale
 * (composition 'lighter') découpe par ctx.clip() la structure interne.
 */
import {C, light, dust, odometer} from './moteur.js';
import {color, clamp, ease, lerp, rgba, line, face, label, TAU} from './mise-en-scene.js';

/** Trace progressive d'un chemin (première passe) via pointillés. */
function drawn(ctx, path, p, stroke, width = 2, total = 4000) {
  if (p <= 0) return;
  ctx.save();
  ctx.setLineDash([total * p, total]);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.stroke(path);
  ctx.restore();
}

/** Lame laser verticale cyan/ambre. */
export function blade(ctx, x, top, bottom, t, {tint = color.cyan, warm = color.amber} = {}) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x - 60, 0, x + 60, 0);
  g.addColorStop(0, rgba(tint, 0));
  g.addColorStop(.47, rgba(tint, .22));
  g.addColorStop(.5, rgba('#FFFFFF', .9));
  g.addColorStop(.53, rgba(warm, .22));
  g.addColorStop(1, rgba(warm, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 60, top, 120, bottom - top);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x - 1, top, 2, bottom - top);
  ctx.restore();
  for (let k = 0; k < 5; k++) {
    const y = lerp(top, bottom, ((t * .35 + k / 5) % 1));
    light(ctx, x, y, 34, k % 2 ? warm : tint, .55);
  }
}

/* ── Navire brise-glace / traversier en cale sèche ──────────────────── */
function hullPath(x, y, s) {
  const p = new Path2D();
  // Coque : proue d'étrave brise-glace à gauche, poupe arrondie à droite
  p.moveTo(x - 300 * s, y - 70 * s);
  p.lineTo(x + 330 * s, y - 70 * s);
  p.bezierCurveTo(x + 360 * s, y - 40 * s, x + 352 * s, y + 10 * s, x + 320 * s, y + 42 * s);
  p.lineTo(x - 210 * s, y + 42 * s);
  p.bezierCurveTo(x - 262 * s, y + 40 * s, x - 300 * s, y - 10 * s, x - 330 * s, y - 64 * s);
  p.closePath();
  return p;
}
function superPath(x, y, s) {
  const p = new Path2D();
  p.moveTo(x - 120 * s, y - 70 * s);
  p.lineTo(x - 108 * s, y - 128 * s);
  p.lineTo(x + 40 * s, y - 128 * s);
  p.lineTo(x + 52 * s, y - 158 * s);
  p.lineTo(x + 150 * s, y - 158 * s);
  p.lineTo(x + 170 * s, y - 128 * s);
  p.lineTo(x + 250 * s, y - 120 * s);
  p.lineTo(x + 262 * s, y - 70 * s);
  p.moveTo(x + 86 * s, y - 158 * s);
  p.lineTo(x + 92 * s, y - 196 * s);
  p.lineTo(x + 120 * s, y - 196 * s);
  p.lineTo(x + 126 * s, y - 158 * s);
  return p;
}

function interior(ctx, x, y, s, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // Couples et lisses
  for (let i = -14; i <= 15; i++) {
    const xx = x + i * 21 * s;
    line(ctx, [[xx, y - 68 * s], [xx, y + 38 * s]], rgba(color.cyan, .32), 1);
  }
  for (const yy of [-36, -6, 22]) line(ctx, [[x - 280 * s, y + yy * s], [x + 335 * s, y + yy * s]], rgba(color.cyan, .5), 1.4);
  // Ponts de la superstructure et cloisons étanches
  for (const xx of [-180, -60, 60, 190]) line(ctx, [[x + xx * s, y - 70 * s], [x + xx * s, y + 40 * s]], rgba(color.ice, .7), 2);
  // Salle des machines : moteurs et arbre d'hélice
  for (let k = 0; k < 3; k++) {
    const ex = x + (110 + k * 52) * s, ey = y + 6 * s;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 20 * s, 14 * s, 0, 0, TAU);
    ctx.strokeStyle = rgba(color.amber, .85);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    light(ctx, ex, ey, 26 * s, color.amber, .25 + .2 * Math.sin(t * 5 + k));
  }
  line(ctx, [[x + 250 * s, y + 18 * s], [x + 345 * s, y + 30 * s]], rgba(color.amber, .8), 2.2);
  ctx.restore();
}

/** Points d'origine des travailleurs (PME de Chaudière-Appalaches). */
const PME = [[.06, .26], [.12, .5], [.04, .66], [.17, .78], [.09, .9]];

export function drydock(d, {outline = 1, scan = 0, flows = 0, pme = 0, push = 0, tag = 1} = {}) {
  const {ctx, w, h, t, vertical: v, bare} = d;
  // Ciel de crépuscule d'hiver sur Québec
  const sky = ctx.createLinearGradient(0, 0, 0, h * .6);
  sky.addColorStop(0, '#040814');
  sky.addColorStop(.7, '#10253F');
  sky.addColorStop(1, '#2B3E58');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const s = (v ? .95 : 1.32) * (1 + push * .18);
  const cx = w * (v ? .5 : .5) - push * w * .03, horizon = h * (v ? .3 : .3);
  // Rive nord : cap Diamant et silhouette du Vieux-Québec, de l'autre côté du fleuve
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  const cliff = [[0, -.02], [.16, -.035], [.3, -.09], [.42, -.11], [.5, -.115], [.62, -.1], [.75, -.06], [1, -.04]];
  cliff.forEach(([u, k]) => ctx.lineTo(u * w, horizon + k * h * .6));
  ctx.lineTo(w, horizon + 10);
  ctx.lineTo(0, horizon + 10);
  ctx.closePath();
  ctx.fillStyle = '#0A1626';
  ctx.fill();
  // Château aux toits pentus sur la falaise
  const chx = w * .46, chy = horizon - h * .069;
  face(ctx, [[chx - 60, chy], [chx - 60, chy - 30], [chx - 40, chy - 52], [chx - 20, chy - 30], [chx - 6, chy - 30],
    [chx + 8, chy - 74], [chx + 22, chy - 30], [chx + 50, chy - 30], [chx + 64, chy - 48], [chx + 78, chy - 30], [chx + 78, chy]], '#0E1D30');
  for (let i = 0; i < 26; i++) light(ctx, w * (.25 + i * .019), horizon - h * (.04 + (i % 4) * .012), 5, color.gold, .55);
  ctx.restore();
  // Fleuve Saint-Laurent
  const water = ctx.createLinearGradient(0, horizon, 0, horizon + h * .1);
  water.addColorStop(0, '#0C2238');
  water.addColorStop(1, '#06121F');
  ctx.fillStyle = water;
  ctx.fillRect(0, horizon + 8, w, h * .1);
  // Cale sèche en perspective (bassin)
  const dockTop = horizon + h * .1, base = h * (v ? .6 : .655);
  face(ctx, [[0, dockTop], [w, dockTop], [w * .86, base], [w * .14, base]], '#08111C', rgba(color.cyan, .25), 1);
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    line(ctx, [[lerp(0, w * .14, u * 0 + 0) + u * w, dockTop], [w * .14 + u * w * .72, base]], rgba(color.cyan, .06), 1);
  }
  // Grue portique en treillis
  const gx = cx + 230 * s;
  ctx.save();
  ctx.strokeStyle = rgba(color.ice, .35);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const off of [-1, 1]) {
    ctx.moveTo(gx + off * 40 * s, base);
    ctx.lineTo(gx + off * 30 * s, dockTop - 230 * s);
  }
  for (let k = 0; k < 10; k++) {
    const y0 = lerp(base, dockTop - 230 * s, k / 10), y1 = lerp(base, dockTop - 230 * s, (k + 1) / 10);
    ctx.moveTo(gx - 40 * s + k * s, y0);
    ctx.lineTo(gx + 40 * s - (k + 1) * s, y1);
  }
  ctx.moveTo(gx - 260 * s, dockTop - 230 * s);
  ctx.lineTo(gx + 110 * s, dockTop - 230 * s);
  ctx.stroke();
  ctx.restore();
  light(ctx, gx - 260 * s, dockTop - 230 * s, 16, color.coral, .8 * (Math.sin(t * 3) > 0 ? 1 : .3));
  // Navire en cale : première passe (tracé de la silhouette)
  const sy = base - 70 * s;
  const hull = hullPath(cx, sy, s), sup = superPath(cx, sy, s);
  ctx.save();
  const hullFill = ctx.createLinearGradient(0, sy - 70 * s, 0, sy + 42 * s);
  hullFill.addColorStop(0, rgba('#7A2A2E', .95 * outline));
  hullFill.addColorStop(.55, rgba('#4A1619', .95 * outline));
  hullFill.addColorStop(1, rgba('#1C0A0C', .95 * outline));
  ctx.fillStyle = hullFill;
  ctx.fill(hull);
  const supFill = ctx.createLinearGradient(0, sy - 196 * s, 0, sy - 70 * s);
  supFill.addColorStop(0, rgba('#DCE6EE', .9 * outline));
  supFill.addColorStop(1, rgba('#7E93A6', .9 * outline));
  ctx.fillStyle = supFill;
  ctx.fill(sup);
  ctx.globalAlpha = outline;
  ctx.fillStyle = '#0F2334';
  for (let i = 0; i < 9; i++) ctx.fillRect(cx - 96 * s + i * 22 * s, sy - 116 * s, 12 * s, 10 * s);
  ctx.globalAlpha = 1;
  ctx.restore();
  drawn(ctx, hull, outline, rgba(color.ice, .9), 2.2);
  drawn(ctx, sup, outline, rgba(color.ice, .75), 1.6);
  // Tins de cale sous la coque
  for (let i = -6; i <= 6; i++) face(ctx, [[cx + i * 45 * s - 8, base], [cx + i * 45 * s + 8, base], [cx + i * 45 * s + 6, sy + 42 * s], [cx + i * 45 * s - 6, sy + 42 * s]], '#152739');
  // Seconde passe : la lame révèle la structure interne
  if (scan > 0) {
    const left = cx - 360 * s, right = cx + 370 * s;
    const bx = lerp(left, right, ease(scan));
    ctx.save();
    ctx.beginPath();
    ctx.rect(left - 10, sy - 210 * s, bx - left + 10, 270 * s);
    ctx.clip();
    ctx.fillStyle = 'rgba(4,22,40,.82)';
    ctx.fill(hull);
    ctx.fill(sup);
    interior(ctx, cx, sy, s, t);
    ctx.restore();
    if (scan < .999) blade(ctx, bx, sy - 220 * s, base + 10, t);
  }
  // Flux de main-d'œuvre aspirés depuis les PME (courbes de Bézier)
  if (flows > 0) {
    const target = [cx - 40 * s, sy - 10 * s];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    PME.forEach(([u, k], i) => {
      const ox = w * u * (v ? 1 : .9), oy = dockTop + (h - dockTop) * k * .55 + (v ? h * .08 : 0);
      const c1 = [ox + 120, oy - 140], c2 = [target[0] - 160, target[1] + 120];
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.bezierCurveTo(...c1, ...c2, ...target);
      ctx.strokeStyle = rgba(color.amber, .22 * clamp(flows * 2));
      ctx.lineWidth = 1.2;
      ctx.stroke();
      for (let j = 0; j < 9; j++) {
        const p = ((flows * .45 + j / 9 + i * .07) % 1);
        const q = 1 - p;
        const x = q * q * q * ox + 3 * q * q * p * c1[0] + 3 * q * p * p * c2[0] + p * p * p * target[0];
        const y = q * q * q * oy + 3 * q * q * p * c1[1] + 3 * q * p * p * c2[1] + p * p * p * target[1];
        light(ctx, x, y, 9, color.amber, .8 * clamp(flows * 3));
      }
      ctx.beginPath();
      ctx.arc(ox, oy, 7, 0, TAU);
      ctx.strokeStyle = rgba(color.coral, .9 * clamp(flows * 3));
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.restore();
    if (!bare && pme > 0) {
      const gx0 = v ? 90 : 90, gy0 = v ? h * .1 : h * .19, gw = v ? 520 : 360;
      label(ctx, 'PME DE CHAUDIÈRE-APPALACHES', gx0, gy0, {size: 16, mono: true, align: 'left', width: gw, tint: color.coral, alpha: clamp(pme * 3)});
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.fillRect(gx0, gy0 + 22, gw, 10);
      ctx.fillStyle = color.coral;
      ctx.fillRect(gx0, gy0 + 22, gw * lerp(.9, .42, ease(pme)), 10);
      label(ctx, 'MAIN-D’ŒUVRE DISPONIBLE', gx0, gy0 + 52, {size: 15, mono: true, align: 'left', width: gw, tint: color.slate, alpha: clamp(pme * 3)});
    }
  }
  dust(ctx, {w, h}, t * 2, {count: 90, color: '#E6F3FF', alpha: .35, seed: 5});
  if (!bare && tag > 0) {
    label(ctx, 'LÉVIS  /  CHANTIER MARITIME', cx - 330 * s, dockTop - 24, {size: 16, mono: true, align: 'left', width: 420, tint: color.slate, alpha: tag});
  }
}

/* ── Coffre d'épargne québécois : CDPQ · REER · CELI ─────────────────── */
export function vault(d, {scan = 0, cables = 0, drop = 0, shake = 0} = {}) {
  const {ctx, w, h, t, vertical: v, bare} = d;
  const bg = ctx.createRadialGradient(w * .4, h * .4, 10, w * .4, h * .4, w * .8);
  bg.addColorStop(0, '#0C2034');
  bg.addColorStop(1, '#02050B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const cx = v ? w * .5 : w * .34, cy = v ? h * .3 : h * .4, R = v ? 220 : 230;
  const jitter = shake * Math.sin(t * 40) * 3;
  // Câbles boursiers vers Wall Street (révélés par le scanner)
  const target = v ? [w * .5, h * .58] : [w * .8, h * .38];
  const drawCables = alpha => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const a0 = [cx + R * .55, cy - R * .45 + i * R * .15];
      const c1 = v ? [a0[0] + 60, a0[1] + 180] : [a0[0] + 220, a0[1] - 60 + i * 12];
      const c2 = v ? [target[0] - 120 + i * 40, target[1] - 160] : [target[0] - 200, target[1] + (i - 3) * 30];
      ctx.beginPath();
      ctx.moveTo(...a0);
      ctx.bezierCurveTo(...c1, ...c2, target[0] + (v ? (i - 3) * 14 : 0), target[1] + (v ? 0 : (i - 3) * 8));
      const hot = drop > 0 ? clamp(drop * 2) : 0;
      ctx.strokeStyle = rgba(hot ? color.coral : color.cyan, (.25 + .4 * cables) * alpha);
      ctx.lineWidth = 2 + (i % 3);
      ctx.stroke();
      const p = (t * .4 + i * .13) % 1;
      const q = 1 - p;
      const x = q ** 3 * a0[0] + 3 * q * q * p * c1[0] + 3 * q * p * p * c2[0] + p ** 3 * target[0];
      const y = q ** 3 * a0[1] + 3 * q * q * p * c1[1] + 3 * q * p * p * c2[1] + p ** 3 * target[1];
      light(ctx, x, y, 12, hot ? color.coral : color.cyan, .9 * alpha * cables);
    }
    ctx.restore();
  };
  // Porte du coffre (silhouette)
  ctx.save();
  ctx.translate(jitter, 0);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.08, 0, TAU);
  ctx.fillStyle = '#0B1726';
  ctx.fill();
  ctx.strokeStyle = rgba(color.ice, .5);
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * R * .97, cy + Math.sin(a) * R * .97, 6, 0, TAU);
    ctx.fillStyle = '#284660';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, R * .78, 0, TAU);
  const metal = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  metal.addColorStop(0, '#2B4A66');
  metal.addColorStop(.5, '#0F2236');
  metal.addColorStop(1, '#1F3A54');
  ctx.fillStyle = metal;
  ctx.fill();
  // Volant de la porte
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * .45);
  for (let k = 0; k < 3; k++) {
    ctx.rotate(TAU / 3);
    line(ctx, [[0, 0], [R * .55, 0]], rgba(color.ice, .8), 7);
    ctx.beginPath();
    ctx.arc(R * .58, 0, 10, 0, TAU);
    ctx.fillStyle = color.ice;
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
  // Passe rayons X : bande verticale qui révèle les compartiments et les câbles
  if (scan > 0) {
    const left = cx - R * 1.2, right = v ? w * .95 : w * .92;
    const bx = lerp(left, right, ease(scan));
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, 0, bx - left, h);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.06, 0, TAU);
    ctx.fillStyle = 'rgba(3,20,36,.92)';
    ctx.fill();
    const names = ['CDPQ', 'REER', 'CELI'];
    names.forEach((n, i) => {
      const a0 = -Math.PI / 2 + i * TAU / 3, a1 = a0 + TAU / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R * .92, a0 + .04, a1 - .04);
      ctx.closePath();
      ctx.fillStyle = rgba([color.cyan, color.emerald, color.amber][i], .14);
      ctx.fill();
      ctx.strokeStyle = rgba([color.cyan, color.emerald, color.amber][i], .8);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const am = (a0 + a1) / 2;
      if (!bare) label(ctx, n, cx + Math.cos(am) * R * .55, cy + Math.sin(am) * R * .55, {size: v ? 34 : 36, tint: color.white, weight: 900});
    });
    drawCables(1);
    ctx.restore();
    if (scan < .999) blade(ctx, bx, 40, h - 40, t);
  }
  return {target};
}
