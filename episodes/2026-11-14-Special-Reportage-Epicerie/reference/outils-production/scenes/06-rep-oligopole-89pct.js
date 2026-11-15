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
/*@scene rep-oligopole-89pct=sceneOligopole89*/
