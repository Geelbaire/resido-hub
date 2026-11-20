/** Dispositifs éditoriaux : graphiques, instruments, perspective F/(Z-camZ). */
import {C, light, mono, odometer, kWipe, dust, trail} from './moteur.js';
import {color, clamp, ease, lerp, rgba, line, face, label, glass, floor, colorWash, TAU} from './mise-en-scene.js';
import {icon} from './ecran.js';

const bez = (a, b, c, e, p) => {
  const q = 1 - p;
  return [q * q * q * a[0] + 3 * q * q * p * b[0] + 3 * q * p * p * c[0] + p * p * p * e[0],
    q * q * q * a[1] + 3 * q * q * p * b[1] + 3 * q * p * p * c[1] + p * p * p * e[1]];
};

/** Champ de particules sur courbes de Bézier convergeant vers un point. */
export function bezierFlow(ctx, sources, target, time, {tint = color.gold, n = 14, bend = 120, alpha = 1, width = 1.6} = {}) {
  if (alpha < .01) return 0;
  let arrivals = 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  sources.forEach((a, i) => {
    const dx = target[0] - a[0], dy = target[1] - a[1];
    const nx = -dy, ny = dx, L = Math.hypot(nx, ny) || 1;
    const b = [a[0] + dx * .3 + nx / L * bend * (i % 2 ? 1 : -1), a[1] + dy * .3 + ny / L * bend * (i % 2 ? 1 : -1)];
    const c = [a[0] + dx * .75 - nx / L * bend * .4, a[1] + dy * .75 - ny / L * bend * .4];
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.bezierCurveTo(...b, ...c, ...target);
    ctx.strokeStyle = rgba(tint, .18 * alpha);
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let j = 0; j < n; j++) {
      const life = time * .42 - j / n;
      if (life < 0) continue;
      arrivals += Math.floor(life);
      const p = life % 1;
      const tip = bez(a, b, c, target, p), back = bez(a, b, c, target, Math.max(0, p - .035));
      line(ctx, [back, tip], rgba(tint, .85 * alpha), width);
      light(ctx, tip[0], tip[1], 8, tint, .55 * alpha * Math.sin(Math.PI * p));
    }
  });
  ctx.restore();
  light(ctx, target[0], target[1], 70 + 10 * Math.sin(time * 3), tint, .35 * alpha);
  return arrivals;
}

/** 1 144 pictogrammes d'enfants : constellation sobre qui se remplit. */
export function constellation(d, {p = 1, tint = color.ice, count = 1144}) {
  const {ctx, w, h, t, vertical: v} = d;
  floor(d, color.cyan);
  const cols = v ? 44 : 52, rows = Math.ceil(count / cols);
  const sp = v ? 17.5 : 17;
  const gx = v ? (w - (cols - 1) * sp) / 2 : 96, gy = v ? 190 : 160;
  const shown = Math.floor(count * clamp(p));
  ctx.save();
  for (let i = 0; i < count; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const x = gx + c * sp, y = gy + r * sp;
    const on = i < shown;
    ctx.globalAlpha = on ? .92 : .12;
    ctx.fillStyle = on ? (i > shown - 40 ? '#FFFFFF' : '#CFE4F2') : '#5D7489';
    ctx.beginPath();
    ctx.arc(x, y - 3.2, 2.3, 0, TAU);
    ctx.fill();
    ctx.fillRect(x - 2, y - .5, 4, 5.5);
  }
  ctx.restore();
  const head = shown < count ? shown : count - 1;
  light(ctx, gx + (head % cols) * sp, gy + Math.floor(head / cols) * sp, 40, color.coral, .45 * (p < 1 ? 1 : .4 + .3 * Math.sin(t * 2)));
  return {gx, gy, cols, rows, sp};
}

/** Triangle de puissance : trois lentilles de saphir reliées par des flux dorés. */
export function triangle(d, {names, appear = 1, flows = 0, center = '', centerT = 0, tints}) {
  const {ctx, w, h, t, vertical: v, bare} = d;
  const cx = w * .5, cy = v ? h * .37 : h * .38, R = v ? 330 : 255;
  const pts = [0, 1, 2].map(i => {
    const a = -Math.PI / 2 + i * TAU / 3;
    return [cx + Math.cos(a) * R * (v ? .78 : 1.45), cy + Math.sin(a) * R * (v ? 1 : .82)];
  });
  bezierFlow(ctx, pts, [cx, cy], flows, {tint: color.gold, alpha: clamp(flows), bend: 90, n: 22, width: 2.4});
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) line(ctx, [pts[i], pts[(i + 1) % 3]], rgba(color.gold, .22 * appear), 1.2);
  ctx.restore();
  names.forEach((name, i) => {
    const a = ease(clamp(appear * 3 - i));
    if (a <= 0) return;
    const [x, y] = pts[i];
    const r = v ? 118 : 112;
    const tint = tints?.[i] || color.gold;
    ctx.save();
    ctx.globalAlpha *= a;
    glass(ctx, x, y, r * 2, r * 2, tint, t, () => {
      ctx.beginPath();
      ctx.arc(0, 0, r * .62, 0, TAU);
      ctx.strokeStyle = rgba(tint, .5);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      if (!bare) {
        label(ctx, name[0], 0, -8, {size: v ? 28 : 27, width: r * 1.7, tint: color.white, weight: 900});
        label(ctx, name[1], 0, 26, {size: 14, mono: true, width: r * 1.7, tint});
      }
    }, {radius: r});
    ctx.restore();
  });
  if (center && !bare && centerT > 0) {
    kWipe(ctx, center, cx, cy + 10, {t: clamp(centerT), size: v ? 30 : 32, weight: 900, color: color.gold, align: 'center', base: 'middle', edge: color.amber});
  }
  return pts;
}

/** Baromètre semi-circulaire du rapport de force (cyan → corail). */
export function barometer(ctx, x, y, r, value, {t = 0, caption = '', bare = false, labels = ['ÉQUILIBRE', 'POSITION DE FORCE']} = {}) {
  ctx.save();
  for (let i = 0; i < 60; i++) {
    const a0 = Math.PI + i / 60 * Math.PI, a1 = a0 + Math.PI / 60 * .8;
    ctx.beginPath();
    ctx.arc(x, y, r, a0, a1);
    ctx.strokeStyle = i / 60 < value ? (i / 60 > .62 ? color.red : i / 60 > .4 ? color.amber : color.cyan) : 'rgba(255,255,255,.08)';
    ctx.lineWidth = 16;
    ctx.stroke();
  }
  const a = Math.PI + Math.PI * value + Math.sin(t * 6) * .01;
  line(ctx, [[x, y], [x + Math.cos(a) * r * .86, y + Math.sin(a) * r * .86]], '#FFFFFF', 3);
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, TAU);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  light(ctx, x + Math.cos(a) * r * .86, y + Math.sin(a) * r * .86, 30, value > .62 ? color.red : color.amber, .8);
  ctx.restore();
  if (!bare) {
    label(ctx, labels[0], x - r, y + 30, {size: 14, mono: true, tint: color.slate, width: 200});
    label(ctx, labels[1], x + r, y + 30, {size: 14, mono: true, tint: color.coral, width: 220});
    if (caption) label(ctx, caption, x, y + 64, {size: 16, mono: true, tint: color.white, width: r * 2.4});
  }
}

/** Table ronde européenne en perspective (verre dépoli, sièges lumineux). */
export function roundTable(d, {p = 1, seats = 12, caption = '', captionT = 0}) {
  const {ctx, w, h, t, vertical: v, bare} = d;
  const cx = w * .5, cy = v ? h * .42 : h * .42, rx = v ? 330 : 430, ry = v ? 150 : 150;
  const e = ease(p);
  ctx.save();
  ctx.globalAlpha *= e;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy + k * 7, rx * (1 - k * .02), ry * (1 - k * .02), 0, 0, TAU);
    ctx.fillStyle = k === 0 ? 'rgba(20,52,78,.75)' : 'rgba(5,14,24,.6)';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.strokeStyle = rgba(color.cyan, .75);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * .55, ry * .55, 0, 0, TAU);
  ctx.strokeStyle = rgba(color.gold, .5);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  for (let i = 0; i < seats; i++) {
    const a = i / seats * TAU + Math.PI / 2;
    const lit = clamp(p * seats * 1.2 - i);
    const x = cx + Math.cos(a) * rx * 1.12, y = cy + Math.sin(a) * ry * 1.25;
    ctx.beginPath();
    ctx.ellipse(x, y, 22, 12, 0, 0, TAU);
    ctx.fillStyle = rgba(color.cyan, .15 + .3 * lit);
    ctx.fill();
    light(ctx, x, y - 12, 26, i % 2 ? color.cyan : color.gold, .6 * lit);
    line(ctx, [[x, y - 8], [lerp(x, cx, .35), lerp(y, cy, .35)]], rgba(color.gold, .25 * lit), 1);
  }
  ctx.restore();
  light(ctx, cx, cy, 160, color.gold, .3 * e);
  if (caption && !bare) kWipe(ctx, caption, cx, cy + 6, {t: clamp(captionT), size: v ? 30 : 36, weight: 900, align: 'center', base: 'middle', maxW: rx * 1.1, edge: color.gold});
}

/** Horloge de négociation qui dépasse l'heure limite. */
export function deadline(ctx, x, y, r, minutes, {t = 0, over = 0} = {}) {
  ctx.save();
  glass(ctx, x, y, r * 2.25, r * 2.25, over > 0 ? color.coral : color.emerald, t, () => {
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * TAU;
      line(ctx, [[Math.cos(a) * r * (i % 5 ? .9 : .8), Math.sin(a) * r * (i % 5 ? .9 : .8)], [Math.cos(a) * r, Math.sin(a) * r]],
        rgba('#E2F6F9', i % 5 ? .35 : .8), i % 5 ? 1 : 2);
    }
    // Zone de dépassement (au-delà de minuit)
    ctx.beginPath();
    ctx.arc(0, 0, r * .72, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(over) * .25);
    ctx.strokeStyle = rgba(color.coral, .8);
    ctx.lineWidth = 10;
    ctx.stroke();
    const am = minutes / 60 * TAU - Math.PI / 2, ah = (minutes / 720) * TAU - Math.PI / 2;
    line(ctx, [[0, 0], [Math.cos(ah) * r * .5, Math.sin(ah) * r * .5]], '#FFFFFF', 5);
    line(ctx, [[0, 0], [Math.cos(am) * r * .82, Math.sin(am) * r * .82]], over > 0 ? color.coral : '#FFFFFF', 3);
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, TAU);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  }, {radius: r * 1.12});
  ctx.restore();
}

/** Hémicycle du Sénat américain (100 sièges) qui s'allume. */
export function hemicycle(d, {p = 0, verdict = 0, caption = ''}) {
  const {ctx, w, h, t, vertical: v, bare} = d;
  floor(d, color.amber, true);
  const cx = w * .5, cy = v ? h * .5 : h * .56, R = v ? 380 : 400;
  const rowsN = 5;
  let k = 0;
  for (let r = 0; r < rowsN; r++) {
    const rr = R * (.48 + r * .13), n = 12 + r * 4;
    for (let i = 0; i < n && k < 100; i++, k++) {
      const a = Math.PI + (i + .5) / n * Math.PI;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * .82;
      const lit = clamp(p * 100 - (k * 37 % 100)) ;
      ctx.beginPath();
      ctx.arc(x, y, v ? 9 : 9.5, 0, TAU);
      ctx.fillStyle = lit > 0 ? rgba(color.amber, .35 + .65 * lit) : 'rgba(255,255,255,.08)';
      ctx.fill();
      if (lit > .9) light(ctx, x, y, 16, color.amber, .35);
    }
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy, R * .38, R * .3, 0, Math.PI, TAU);
  ctx.strokeStyle = rgba(color.gold, .5);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (!bare && verdict > 0) {
    kWipe(ctx, 'ADOPTÉ', cx, cy + R * .1, {t: clamp(verdict), size: v ? 64 : 70, weight: 900, color: color.amber, align: 'center', base: 'middle', edge: color.white});
    if (caption) mono(ctx, caption, cx, cy + R * .1 + 62, {size: 17, color: color.white, spacing: 3, t: clamp(verdict * 1.5), cursor: false});
  }
  colorWash(ctx, w, h, .88);
}

/** Profil hydrologique : coupe d'un fleuve dont le niveau baisse. */
export function riverProfile(ctx, x, y, pw, ph, level, {t = 0, bare = false, tint = color.amber} = {}) {
  const ground = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const depth = Math.sin(Math.PI * Math.min(1, Math.max(0, (u - .18) / .64))) ** .8;
    ground.push([x + pw * u, y + ph * (.25 + .7 * depth)]);
  }
  const wl = y + ph * lerp(.32, .72, level);
  ctx.save();
  ctx.beginPath();
  ground.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
  ctx.lineTo(x + pw, y + ph * 1.1);
  ctx.lineTo(x, y + ph * 1.1);
  ctx.closePath();
  const soil = ctx.createLinearGradient(0, y, 0, y + ph);
  soil.addColorStop(0, '#6B3E14');
  soil.addColorStop(1, '#24130A');
  ctx.fillStyle = soil;
  ctx.fill();
  ctx.clip();
  // Eau restante
  const water = ctx.createLinearGradient(0, wl, 0, y + ph);
  water.addColorStop(0, 'rgba(56,189,248,.75)');
  water.addColorStop(1, 'rgba(8,40,70,.9)');
  ctx.fillStyle = water;
  ctx.fillRect(x, wl + Math.sin(t * 2) * 1.5, pw, ph);
  ctx.restore();
  // Ancien niveau et fissures de sol
  line(ctx, [[x + pw * .12, y + ph * .32], [x + pw * .88, y + ph * .32]], rgba('#BAE6FD', .55), 1.5);
  ctx.save();
  ctx.setLineDash([6, 6]);
  line(ctx, [[x + pw * .12, wl], [x + pw * .88, wl]], rgba(tint, .9), 2);
  ctx.restore();
  for (let k = 0; k < 9; k++) {
    const cx2 = x + pw * (.05 + k * .03 + (k > 4 ? .62 : 0)), cy2 = y + ph * .3;
    line(ctx, [[cx2, cy2], [cx2 + 6, cy2 + 14], [cx2 + 2, cy2 + 26]], rgba('#1A0D04', .8), 1.4);
  }
  ground.forEach((p, i) => { if (i) line(ctx, [ground[i - 1], p], rgba(tint, .7), 2); });
  if (!bare) {
    label(ctx, 'NIVEAU HABITUEL', x + pw * .9, y + ph * .32 - 14, {size: 14, mono: true, align: 'right', width: 260, tint: '#BAE6FD'});
    label(ctx, 'NIVEAU ACTUEL', x + pw * .9, wl - 14, {size: 14, mono: true, align: 'right', width: 260, tint});
  }
}

/** Courbe de production (FAO) qui plonge en fin de série. */
export function curve(ctx, x, y, cw, chh, values, p, {tint = color.emerald, alert = color.red, labels = [], bare = false, t = 0, dropFrom = values.length - 2} = {}) {
  const max = Math.max(...values) * 1.08, min = Math.min(...values) * .92;
  const pts = values.map((val, i) => [x + cw * i / (values.length - 1), y + chh - (val - min) / (max - min) * chh]);
  ctx.save();
  for (let k = 0; k <= 4; k++) line(ctx, [[x, y + chh * k / 4], [x + cw, y + chh * k / 4]], 'rgba(255,255,255,.07)', 1);
  const n = pts.length - 1, f = clamp(p) * n;
  const draw = (a, b, c) => {
    const seg = [];
    for (let i = a; i <= Math.min(b, Math.ceil(f)); i++) {
      if (i > f) seg.push([lerp(pts[i - 1][0], pts[i][0], f - i + 1), lerp(pts[i - 1][1], pts[i][1], f - i + 1)]);
      else seg.push(pts[i]);
    }
    if (seg.length > 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      line(ctx, seg, rgba(c, .25), 10);
      ctx.restore();
      line(ctx, seg, c, 3.2);
    }
  };
  draw(0, dropFrom, tint);
  if (f > dropFrom) draw(dropFrom, n, alert);
  // Aire sous la courbe
  pts.forEach((pt, i) => {
    if (i > f) return;
    ctx.beginPath();
    ctx.arc(pt[0], pt[1], 5, 0, TAU);
    ctx.fillStyle = i > dropFrom ? alert : tint;
    ctx.fill();
    if (!bare && labels[i]) label(ctx, labels[i], pt[0], y + chh + 26, {size: 14, mono: true, tint: color.slate, width: cw / values.length * 1.6});
  });
  const head = pts[Math.min(n, Math.floor(f))];
  light(ctx, head[0], head[1], 36, f > dropFrom ? alert : tint, .6 + .2 * Math.sin(t * 4));
  ctx.restore();
  return pts;
}

/** Mur boursier en verre 2.5D (Wall Street) : courbe qui grimpe puis décroche. */
export function tickerWall(d, {p = 1, drop = 0, push = 0}) {
  const {ctx, w, h, t, vertical: v, bare} = d;
  floor(d, drop > 0 ? color.red : color.cyan);
  const cx = w * .5, cy = v ? h * .36 : h * .38;
  const ww = (v ? 760 : 1180) * (1 + push * .12), hh = (v ? 560 : 420) * (1 + push * .12);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.transform(1, -.04, -.1, 1, 0, 0);
  glass(ctx, 0, 0, ww, hh, drop > 0 ? color.coral : color.cyan, t, () => {
    // Bande défilante de cotations fictives (sans chiffres)
    for (let r = 0; r < 9; r++) {
      const y = -hh / 2 + 30 + r * (hh - 60) / 8;
      line(ctx, [[-ww / 2 + 30, y], [ww / 2 - 30, y]], 'rgba(160,210,255,.06)', 1);
    }
    const vals = [];
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const base = u < .72 ? Math.pow(u / .72, 1.6) * .95 + Math.sin(i * 1.7) * .03 : .95 - (u - .72) / .28 * .32 * clamp(drop * 1.2) + Math.sin(i * 2.3) * .02;
      vals.push([-ww / 2 + 50 + (ww - 100) * u, hh / 2 - 60 - base * (hh - 140)]);
    }
    const shown = Math.floor(clamp(p) * 60);
    const up = vals.slice(0, Math.min(shown, 44) + 1), dn = vals.slice(43, shown + 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (up.length > 1) { line(ctx, up, rgba(color.cyan, .25), 12); line(ctx, up, color.cyan, 3.4); }
    if (dn.length > 1) { line(ctx, dn, rgba(color.red, .3), 12); line(ctx, dn, color.coral, 3.6); }
    ctx.restore();
    const head = vals[Math.max(0, shown)];
    light(ctx, head[0], head[1], 40, shown > 43 ? color.red : color.cyan, .9);
    if (shown >= 43) {
      const peak = vals[43];
      light(ctx, peak[0], peak[1], 26, color.white, .7);
      if (!bare) label(ctx, 'INTRODUCTION EN BOURSE', peak[0], peak[1] - 30, {size: 15, mono: true, tint: color.white, width: 300});
    }
  }, {radius: 18});
  ctx.restore();
  colorWash(ctx, w, h, .88);
}

/** Organigramme : le poste « chef de la cybersécurité » est éjecté. */
export function orgChart(ctx, x, y, s, eject, {t = 0, bare = false} = {}) {
  const boxes = [[0, -130, 'MAISON-BLANCHE'], [-150, -10, 'SÉCURITÉ NATIONALE'], [150, -10, 'CHEF CYBERSÉCURITÉ'],
    [-230, 100, 'RÉSEAUX'], [-70, 100, 'AGENCES'], [70, 100, 'INFRASTRUCTURES'], [230, 100, 'PANNES']];
  const links = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  links.forEach(([a, b]) => {
    const broken = b === 2 || a === 2;
    const A = boxes[a], B = boxes[b];
    line(ctx, [[A[0], A[1] + 22], [A[0], (A[1] + B[1]) / 2], [B[0], (A[1] + B[1]) / 2], [B[0], B[1] - 22]],
      rgba(broken && eject > 0 ? color.red : color.cyan, broken ? .5 * (1 - eject) + .25 : .5), 1.5);
  });
  boxes.forEach(([bx, by, name], i) => {
    let ox = 0, oy = 0, rot = 0, a = 1;
    if (i === 2 && eject > 0) {
      const e = ease(clamp(eject));
      ox = e * 260; oy = -e * 60 + e * e * 240; rot = e * .6; a = 1 - clamp((eject - .7) / .3);
    }
    ctx.save();
    ctx.translate(bx + ox, by + oy);
    ctx.rotate(rot);
    ctx.globalAlpha *= a;
    const hot = i === 2 || i === 6;
    ctx.beginPath();
    ctx.roundRect(-72, -22, 144, 44, 9);
    ctx.fillStyle = hot ? 'rgba(244,63,94,.18)' : 'rgba(56,189,248,.12)';
    ctx.fill();
    ctx.strokeStyle = hot ? color.coral : rgba(color.cyan, .7);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    if (!bare) label(ctx, name, 0, 0, {size: 13, mono: true, tint: hot ? '#FFD4DA' : color.white, width: 132});
    ctx.restore();
  });
  ctx.restore();
}

/**
 * Corridor numérique en perspective F/(Z-camZ) : cadres de verre
 * successifs, bouclier qui intercepte des faisceaux corail, nœuds réseau.
 */
export function corridor(d, {camZ = 0, shield = 0, threats = 0, nodes = 0, nodeNames = [], tint = color.cyan, alert = 0}) {
  const {ctx, w, h, t, vertical: v, bare} = d;
  ctx.fillStyle = '#02050B';
  ctx.fillRect(0, 0, w, h);
  const cx = w * .5, cy = v ? h * .4 : h * .42, F = v ? 520 : 560;
  const P = (X, Y, Z) => {
    const zz = Math.max(.05, Z - camZ);
    return [cx + F * X / zz, cy + F * Y / zz, zz];
  };
  const W = v ? 1.05 : 1.7, H = v ? 1.5 : .95;
  // Rails du corridor
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [X, Y] of [[-W, -H], [W, -H], [-W, H], [W, H], [0, H], [0, -H], [-W, 0], [W, 0]]) {
    const a = P(X, Y, camZ + .3), b = P(X, Y, camZ + 40);
    line(ctx, [[a[0], a[1]], [b[0], b[1]]], rgba(tint, .14), 1);
  }
  // Cadres de verre successifs
  for (let k = 0; k < 18; k++) {
    const Z = Math.ceil(camZ) + k * 1.4 - (camZ % 1.4);
    const z = Z - camZ;
    if (z < .25) continue;
    const a = P(-W, -H, Z), b = P(W, H, Z);
    const fog = clamp(1 - z / 24);
    ctx.strokeStyle = rgba(k % 3 === 0 ? color.amber : tint, .5 * fog);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    // Données qui défilent sur les parois
    for (let j = 0; j < 4; j++) {
      const yy = lerp(a[1], b[1], (j + 1) / 5);
      line(ctx, [[a[0], yy], [a[0] + (b[0] - a[0]) * .06, yy]], rgba(tint, .4 * fog), 2);
      line(ctx, [[b[0], yy], [b[0] - (b[0] - a[0]) * .06 * ((j + k) % 3 + 1) / 3, yy]], rgba(tint, .4 * fog), 2);
    }
  }
  ctx.restore();
  // Faisceaux corail (menaces) et bouclier de saphir
  const sz = camZ + 3.2;
  const sc = P(0, 0, sz);
  if (threats > 0) {
    for (let i = 0; i < 6; i++) {
      const ang = i / 6 * TAU + .4;
      const start = P(Math.cos(ang) * W * .9, Math.sin(ang) * H * .9, camZ + 22);
      const u = ((t * .5 + i / 6) % 1);
      const end = shield > .5 ? [lerp(start[0], sc[0], .86), lerp(start[1], sc[1], .86)] : sc;
      const head = [lerp(start[0], end[0], u), lerp(start[1], end[1], u)];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      line(ctx, [[start[0], start[1]], head], rgba(color.red, .75 * threats), 3.4);
      line(ctx, [[lerp(start[0], head[0], .7), lerp(start[1], head[1], .7)], head], rgba('#FFD4DA', .8 * threats), 1.4);
      ctx.restore();
      light(ctx, head[0], head[1], 26, color.coral, .9 * threats);
      if (shield > .5 && u > .95) light(ctx, end[0], end[1], 50, color.white, .8);
    }
  }
  if (shield > 0) {
    const r = (v ? 210 : 190) * ease(shield);
    ctx.save();
    ctx.translate(sc[0], sc[1]);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + Math.PI / 6;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, r * .2, 0, 0, r);
    g.addColorStop(0, 'rgba(56,189,248,.05)');
    g.addColorStop(1, 'rgba(56,189,248,.28)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba('#DDF6FF', .9);
    ctx.lineWidth = 2.4;
    ctx.stroke();
    for (let k = 1; k < 3; k++) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + Math.PI / 6;
        ctx.lineTo(Math.cos(a) * r * k / 3, Math.sin(a) * r * k / 3);
      }
      ctx.closePath();
      ctx.strokeStyle = rgba(color.cyan, .3);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    icon(ctx, 'child', 0, 0, r * .42, '#E8FBFF');
    ctx.restore();
    light(ctx, sc[0], sc[1], r * 1.4, color.cyan, .25 * shield);
  }
  // Nœuds des réseaux critiques
  nodeNames.forEach((name, i) => {
    const a = clamp(nodes * 3 - i);
    if (a <= 0) return;
    const X = (i - 1) * W * .78, Z = camZ + 3.4;
    const [x, y] = P(X, H * .1, Z);
    const r = v ? 70 : 74;
    const pulse = alert > 0 ? (Math.sin(t * 6 + i) > 0 ? color.coral : color.amber) : color.emerald;
    ctx.save();
    ctx.globalAlpha *= ease(a);
    glass(ctx, x, y, r * 2, r * 2, pulse, t, () => {
      ctx.beginPath();
      ctx.arc(0, 0, r * .7, -Math.PI / 2, -Math.PI / 2 + TAU * (.55 + .4 * Math.sin(t * .7 + i)));
      ctx.strokeStyle = pulse;
      ctx.lineWidth = 4;
      ctx.stroke();
      icon(ctx, ['cyber', 'scale', 'grid'][i % 3], 0, -10, 34, '#FFFFFF');
      if (!bare) label(ctx, name, 0, 34, {size: 15, mono: true, width: r * 1.8, tint: color.white});
    }, {radius: r});
    ctx.restore();
  });
  dust(ctx, {w, h}, t * 3, {count: 120, color: '#9BDCFF', alpha: .5, seed: 23, camX: camZ * 400});
}

/** Afficheur de station-service en verre de saphir (prix au litre). */
export function pumpSign(d, x, y, {t = 1, value = 18, from = 15, tint = color.amber}) {
  const {ctx, bare} = d;
  if (t <= 0) return;
  ctx.save();
  ctx.globalAlpha *= ease(t);
  glass(ctx, x, y, 330, 210, tint, d.t, () => {
    icon(ctx, 'drop', -128, -66, 26, tint);
    if (!bare) {
      label(ctx, 'BOURSE DU CARBONE', -100, -66, {size: 15, mono: true, align: 'left', width: 230, tint});
      odometer(ctx, lerp(0, from, ease(clamp(t * 1.4))), -72, 22, {size: 70, weight: 850, color: color.white, align: 'center'});
      label(ctx, 'À', 0, 6, {size: 24, tint: color.amber, width: 30});
      odometer(ctx, lerp(0, value, ease(clamp(t * 1.2 - .1))), 74, 22, {size: 70, weight: 850, color: color.white, align: 'center'});
      label(ctx, '¢ DE PLUS PAR LITRE', 0, 70, {size: 16, mono: true, tint: color.white, width: 290});
    }
  }, {radius: 18});
  ctx.restore();
}

/** Double hélice d'ADN lumineuse. */
export function helix(ctx, x, y, hh, t, {tint = color.emerald, alpha = 1} = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 34; i++) {
    const u = i / 33, yy = y - hh / 2 + hh * u, a = u * 9 + t * 1.2;
    const x1 = x + Math.sin(a) * 46, x2 = x - Math.sin(a) * 46;
    const depth = (Math.cos(a) + 1) / 2;
    line(ctx, [[x1, yy], [x2, yy]], rgba(tint, .2 + .25 * depth), 1.4);
    light(ctx, x1, yy, 8, tint, .4 + .5 * depth);
    light(ctx, x2, yy, 8, color.cyan, .4 + .5 * (1 - depth));
  }
  ctx.restore();
}

export {trail};
