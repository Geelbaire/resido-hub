/**
 * Météo et éclairage volumétrique : ciel d'hiver est-européen, faisceaux de
 * défense antiaérienne, Kiev et le Dniepr en perspective F/(Z-camZ).
 */
import {C, light, dust, trail} from './moteur.js';
import {color, clamp, ease, lerp, rgba, line, face, TAU} from './mise-en-scene.js';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const r = rng(61);
  return Array.from({length: 260}, () => ({x: r(), y: r() * .62, m: r(), s: r() * TAU}));
})();

/** Ciel nocturne d'hiver : dégradé, étoiles scintillantes, voile de neige. */
export function nightSky(d, {warm = 0, horizon = .62, snow = 1} = {}) {
  const {ctx, w, h, t} = d;
  const g = ctx.createLinearGradient(0, 0, 0, h * horizon);
  g.addColorStop(0, '#02040B');
  g.addColorStop(.55, warm ? '#1B0E0A' : '#06122A');
  g.addColorStop(1, warm ? '#4A2410' : '#123A5E');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#DDEBFF';
  for (const s of STARS) {
    ctx.globalAlpha = (.25 + .55 * s.m) * (.6 + .4 * Math.sin(t * 1.7 + s.s));
    const r = .6 + s.m * 1.3;
    ctx.fillRect(s.x * w, s.y * h * horizon, r, r);
  }
  ctx.restore();
  light(ctx, w * .5, h * horizon, w * .55, warm ? color.amber : '#2A6FB0', .22);
  if (snow) dust(d.ctx, {w, h}, t * 3.2, {count: 170, color: '#E8F4FF', alpha: .55 * snow, seed: 11});
}

/**
 * Faisceau de projecteur volumétrique (cône additif, bords adoucis).
 * angle en radians (0 = vertical), spread = demi-ouverture.
 */
export function beam(ctx, x, y, angle, length, {spread = .045, tint = '#CFE8FF', alpha = .5} = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = 'lighter';
  for (const [k, a] of [[1, .35], [.55, .55], [.22, 1]]) {
    const s = spread * k;
    const g = ctx.createLinearGradient(0, 0, 0, -length);
    g.addColorStop(0, rgba(tint, alpha * a * .9));
    g.addColorStop(.6, rgba(tint, alpha * a * .25));
    g.addColorStop(1, rgba(tint, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(-Math.tan(s) * length, -length);
    ctx.lineTo(Math.tan(s) * length, -length);
    ctx.lineTo(3, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  light(ctx, x, y, 26, tint, alpha * .9);
}

/* ── Kiev : vue le long du Dniepr, ponts à différentes profondeurs ───── */
const BUILDINGS = (() => {
  const r = rng(29);
  const out = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 150; i++) {
      const z = 8 + Math.pow(r(), .7) * 85;
      out.push({side, x: side * (1.9 + r() * 7), z, w: .25 + r() * .55,
        hgt: (.7 + r() * 1.6) * (side < 0 ? 1.2 : 1) * (r() > .9 ? 1.9 : 1), seed: Math.floor(r() * 1e6),
        dome: side < 0 && r() > .93});
    }
  }
  return out.sort((a, b) => b.z - a.z);
})();
const BRIDGES = [9, 18, 31, 50];

export function kyiv(d, {
  push = 0, blackout = 0, missiles = 0, drones = 0, strike = -1, beams = 1, bridgeFocus = -1,
} = {}) {
  const {ctx, w, h, t, vertical: v} = d;
  const horizonY = h * (v ? .5 : .56);
  nightSky(d, {horizon: horizonY / h});
  const camZ = push;
  const camY = .95;
  const F = v ? w * 1.15 : h * 1.15;
  const P = (X, Y, Z) => {
    const zz = Math.max(.4, Z - camZ);
    return [w * .5 + F * X / zz, horizonY - F * (Y - camY) / zz, zz];
  };
  // Sol des deux rives
  ctx.fillStyle = '#040911';
  ctx.fillRect(0, horizonY, w, h - horizonY);
  // Collines de la rive droite et monument de la Mère-Patrie
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 2);
  for (let i = 0; i <= 30; i++) {
    const X = -16 + i * .5;
    const [x, y] = P(X, .9 + .6 * Math.sin(i * .37) ** 2, 95);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w * .5, horizonY + 2);
  ctx.closePath();
  ctx.fillStyle = '#071221';
  ctx.fill();
  ctx.restore();
  {
    const [mx, my, mz] = P(-6.5, 1.25, 72);
    const k = F / mz;
    ctx.save();
    ctx.translate(mx, my);
    ctx.scale(k, k);
    ctx.fillStyle = '#0B1A2C';
    ctx.beginPath();
    ctx.moveTo(-.18, 0); ctx.lineTo(-.1, -.9); ctx.lineTo(.1, -.9); ctx.lineTo(.18, 0); ctx.closePath();
    ctx.moveTo(-.08, -.9); ctx.lineTo(-.06, -1.5); ctx.lineTo(.06, -1.5); ctx.lineTo(.08, -.9); ctx.closePath();
    ctx.moveTo(.04, -1.4); ctx.lineTo(.3, -2.1); ctx.lineTo(.34, -2.08); ctx.lineTo(.08, -1.38); ctx.closePath();
    ctx.moveTo(-.05, -1.35); ctx.lineTo(-.28, -1.3); ctx.lineTo(-.26, -1.12); ctx.lineTo(-.05, -1.2); ctx.closePath();
    ctx.fill();
    ctx.restore();
    light(ctx, mx, my - 1.4 * k, 1.6 * k, '#9CC8FF', .18 * (1 - blackout));
  }
  // Fleuve : surface et reflets
  const fl = P(-1.6, 0, 110), fr = P(1.6, 0, 110), nl = P(-1.6, 0, camZ + 1.2), nr = P(1.6, 0, camZ + 1.2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(fl[0], fl[1]); ctx.lineTo(fr[0], fr[1]); ctx.lineTo(nr[0], nr[1]); ctx.lineTo(nl[0], nl[1]); ctx.closePath();
  const water = ctx.createLinearGradient(0, fl[1], 0, h);
  water.addColorStop(0, '#163A5C');
  water.addColorStop(1, '#06121F');
  ctx.fillStyle = water;
  ctx.fill();
  ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 60; i++) {
    const Z = camZ + 1.5 + ((i * 1.9 - t * .7) % 100 + 100) % 100;
    const X = -1.4 + ((i * 37) % 28) / 10;
    const [x0, y0] = P(X, 0, Z);
    const [x1] = P(X + .3, 0, Z);
    ctx.fillStyle = rgba(i % 4 ? '#8FC3F0' : '#FFD59A', .16 * clamp(1 - Z / 100));
    ctx.fillRect(x0, y0, x1 - x0, 1.4 + 6 / Math.max(1, Z - camZ));
  }
  ctx.restore();
  // Quais éclairés
  for (const side of [-1, 1]) {
    for (let Z = Math.ceil(camZ) + 2; Z < camZ + 90; Z += 2.5) {
      const [x, y, zz] = P(side * 1.65, .05, Z);
      light(ctx, x, y, 4 + 30 / zz, color.gold, .55 * (1 - blackout * .85) * clamp(1 - zz / 90));
    }
  }
  // Immeubles fenêtrés (le réseau s'éteint avec blackout)
  for (const b of BUILDINGS) {
    const zz = b.z - camZ;
    if (zz < 1.2) continue;
    const [xa, ya] = P(b.x - b.w / 2, 0, b.z);
    const [xb, yb] = P(b.x + b.w / 2, b.hgt, b.z);
    if (xb < -20 || xa > w + 20) continue;
    const fog = clamp(1 - zz / 95);
    ctx.fillStyle = `rgb(${8 + 10 * fog},${15 + 16 * fog},${26 + 22 * fog})`;
    ctx.fillRect(xa, yb, xb - xa, ya - yb);
    if (b.dome) {
      const r = (xb - xa) * .42;
      ctx.beginPath();
      ctx.ellipse((xa + xb) / 2, yb, r, r * 1.3, 0, Math.PI, TAU);
      ctx.fillStyle = '#5A4A20';
      ctx.fill();
      light(ctx, (xa + xb) / 2, yb - r, r * 2.4, color.gold, .35 * fog);
    }
    const cols = Math.max(1, Math.floor((xb - xa) / 6));
    const rows = Math.max(1, Math.floor((ya - yb) / 7));
    if (cols * rows > 420) continue;
    const r = rng(b.seed);
    ctx.fillStyle = '#FFD7A0';
    for (let cx = 0; cx < cols; cx++) for (let ry = 0; ry < rows; ry++) {
      const lit = r();
      if (lit < .38 || blackout > (lit - .38) * 1.75) continue;
      ctx.globalAlpha = (.3 + .6 * fog) * Math.min(1, (lit - .38) * 2.4);
      ctx.fillRect(xa + 1.5 + cx * (xb - xa - 2) / cols, yb + 2 + ry * (ya - yb - 3) / rows, 1.8, 2.2);
    }
    ctx.globalAlpha = 1;
  }
  // Ponts sur le Dniepr (tablier lumineux et arches)
  BRIDGES.forEach((Z, i) => {
    const zz = Z - camZ;
    if (zz < 1.4) return;
    const focus = bridgeFocus >= 0 ? (i === bridgeFocus ? 1 : .4) : .75;
    const hit = strike >= 0 && i === 1 ? clamp(1 - strike / 3) : 0;
    const deck = [];
    for (let k = 0; k <= 24; k++) deck.push(P(-2.2 + 4.4 * k / 24, .3, Z));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    line(ctx, deck.map(p => [p[0], p[1]]), rgba(hit ? color.coral : '#CFE6FF', .35 + .5 * focus), 2 + 8 / zz);
    for (let a = 0; a < 3; a++) {
      const arc = [];
      for (let k = 0; k <= 18; k++) {
        const u = k / 18;
        arc.push(P(-1.6 + a * 1.067 + 1.067 * u, .02 + .26 * Math.sin(Math.PI * u), Z));
      }
      line(ctx, arc.map(p => [p[0], p[1]]), rgba('#CFE6FF', .25 + .45 * focus), 1.2 + 3 / zz);
    }
    ctx.restore();
    for (let k = 0; k <= 10; k++) {
      const [lx, ly] = P(-2.2 + 4.4 * k / 10, .34, Z);
      light(ctx, lx, ly, 5 + 40 / zz, color.gold, .6 * focus * (1 - blackout * .5));
    }
    if (hit > 0) {
      const [x, y] = P(.3, .3, Z);
      light(ctx, x, y, 170 * hit + 20, color.amber, hit);
      light(ctx, x, y, 50 * hit, C.white, hit);
    }
  });
  // Projecteurs antiaériens depuis les deux rives (reflétés dans l'eau)
  if (beams > 0) {
    for (let i = 0; i < 7; i++) {
      const side = i % 2 ? 1 : -1;
      const [bx, by, zz] = P(side * (2.6 + (i % 3) * 2.2), 0, 14 + i * 9);
      const ang = side * (-.16 - .16 * Math.sin(t * (.3 + i * .05) + i * 1.7)) + Math.sin(t * .21 + i) * .1;
      beam(ctx, bx, by, ang, h * 1.1, {alpha: .32 * beams * clamp(1.4 - zz / 90), spread: .022 + .008 * (i % 3)});
    }
  }
  // Missiles et drones entrants
  const top = v ? h * .1 : h * .06;
  for (let i = 0; i < 9; i++) {
    const start = i * .09;
    const u = clamp((missiles - start) / .32);
    if (u <= 0) continue;
    const r = rng(300 + i);
    const x0 = w * (r() < .5 ? -.05 : 1.05), y0 = top + r() * h * .12;
    const tx = w * (.3 + r() * .4), ty = horizonY - h * (.01 + r() * .06);
    const pts = [];
    for (let k = 0; k <= 30; k++) {
      const s2 = k / 30;
      pts.push({x: lerp(x0, tx, s2), y: lerp(y0, ty, s2) - Math.sin(Math.PI * s2) * h * .08, vis: true});
    }
    if (u < 1) trail(ctx, pts, u, {color: color.coral, width: 2.4, alpha: .95, head: true, glow: 1.5});
    else {
      const after = (missiles - start - .32) * 9;
      if (after < 1.6) light(ctx, tx, ty, 120 * (1 - after / 1.6) + 10, color.amber, 1 - after / 1.6);
    }
  }
  if (drones > 0) {
    const r = rng(77);
    for (let i = 0; i < 46; i++) {
      const appear = r() * .85;
      const x = w * r(), y = top + r() * (horizonY - top) * .75, sp = .5 + r();
      const a = clamp((drones - appear) * 5);
      if (a <= 0) continue;
      const xx = (x + t * 14 * sp) % w;
      const blink = Math.sin(t * 7 + i) > .2 ? 1 : .3;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#1A1208';
      ctx.beginPath();
      ctx.moveTo(xx - 6, y); ctx.lineTo(xx + 6, y - 2); ctx.lineTo(xx, y + 3); ctx.closePath();
      ctx.fill();
      ctx.restore();
      light(ctx, xx, y, 9, color.amber, .8 * a * blink);
    }
  }
}

/** Voile thermique aride : brume ambre et ondulations de chaleur. */
export function heatHaze(d, amount = 1) {
  const {ctx, w, h, t} = d;
  if (amount <= .01) return;
  ctx.save();
  ctx.globalAlpha = amount;
  const g = ctx.createLinearGradient(0, h, 0, 0);
  g.addColorStop(0, 'rgba(120,52,6,.42)');
  g.addColorStop(.5, 'rgba(90,40,10,.12)');
  g.addColorStop(1, 'rgba(40,20,8,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const y = h * (.3 + i * .05) + Math.sin(t * .8 + i) * 6;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 24) ctx.lineTo(x, y + Math.sin(x * .012 + t * 2.1 + i) * 3);
    ctx.strokeStyle = 'rgba(255,170,80,.035)';
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.restore();
  dust(ctx, {w, h}, t * 2, {count: 110, color: '#FFC27A', alpha: .5 * amount, seed: 19});
}
