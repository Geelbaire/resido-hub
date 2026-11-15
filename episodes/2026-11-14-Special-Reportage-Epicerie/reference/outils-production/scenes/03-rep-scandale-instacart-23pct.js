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
/*@scene rep-scandale-instacart-23pct=sceneInstacart23*/
