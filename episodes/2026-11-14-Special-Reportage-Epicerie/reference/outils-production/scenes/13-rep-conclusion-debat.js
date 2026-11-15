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
/*@scene rep-conclusion-debat=sceneConclusionDebat*/
