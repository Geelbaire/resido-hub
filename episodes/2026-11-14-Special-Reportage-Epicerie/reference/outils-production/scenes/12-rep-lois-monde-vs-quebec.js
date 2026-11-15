/* Acte I   : le globe nocturne pivote de l'Atlantique vers le nord-est américain ; New York s'arme d'un
 *            bouclier émeraude et d'un avertissement obligatoire ; Maryland, New Jersey, Connecticut s'allument
 * Acte II  : des faisceaux remontent vers Québec (anneau de décision ambre, OPC) et vers Ottawa (prix plancher)
 * Acte III : une fenêtre de lumière s'ouvre : « LA FENÊTRE EST OUVERTE » */

const S12_LIGHTS = ['newYork', 'boston', 'philadelphia', 'baltimore', 'washington', 'montreal', 'toronto', 'quebec', 'ottawa', 'albany', 'hartford', 'trenton', 'annapolis'];

function sceneLoisAmerique(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    ailleurs: 'Ailleurs en Amérique du Nord',
    riposte: 'la riposte juridique',
    ny: "L'État de New York",
    oblige: 'oblige désormais',
    avert: 'un avertissement clair',
    algo: 'un algorithme fixe un prix',
    donnees: 'vos données personnelles',
    maryland: 'Le Maryland',
    nj: 'le New Jersey',
    ct: 'le Connecticut',
    lois: 'des lois ciblées',
    alim: 'en alimentation',
    ici: 'Ici, au Québec',
    opposition: "partis d'opposition",
    opc: "l'Office de la protection du consommateur",
    encadrer: "d'encadrer d'avance",
    norme: 'la norme',
    ottawa: "tandis qu'Ottawa",
    plancher: 'prix plancher',
    circ: 'les circulaires',
    fenetre: 'La fenêtre pour agir',
    ouverte: 'grande ouverte',
    maintenant: 'maintenant.'
  });

  // caméra-globe : [lon, lat, R/m, dx/w, dy/h]
  const st = globeTrack(lt, [
    [0, [-38, 34, V ? 0.46 : 0.42, 0, 0.04]],
    [T.ny - 0.6, [-62, 39, V ? 0.7 : 0.62, 0, 0.04]],
    [T.ny + 1.4, [-74.6, 40.6, V ? 3.4 : 3.3, V ? 0 : -0.14, V ? 0.0 : 0.06], eInOutQuart],
    [T.ct + 1.2, [-74.6, 40.5, V ? 3.6 : 3.5, V ? 0 : -0.14, V ? 0.0 : 0.06]],
    [T.ici + 1.4, [-73.5, 44.2, V ? 1.85 : 1.75, V ? 0 : -0.12, V ? -0.02 : 0.08], eInOutQuart],
    [T.fenetre - 0.4, [-73.2, 44.4, V ? 1.9 : 1.8, V ? 0 : -0.12, V ? -0.02 : 0.08]],
    [D, [-72, 44, V ? 1.3 : 1.25, 0, V ? -0.1 : 0.0], eInOutQuart]
  ]);
  const G = globeFrom(stage, st);
  const P2 = (k) => G.project(...P(k));
  const legal = (k, tk) => smooth(seg(lt, tk - 0.2, tk + 0.6));
  const endFade = 1 - smooth(seg(lt, T.fenetre - 0.6, T.fenetre + 0.1));

  frame(a, () => {
    const gA = 1 - 0.45 * smooth(seg(lt, T.fenetre - 0.4, T.fenetre + 0.8));
    drawGlobe(ctx, G, { alpha: gA, color: C.cyan, atmo: 0.9 });

    /* lumières des villes (nuit) */
    S12_LIGHTS.forEach((k, i) => {
      const q = P2(k);
      if (!q.vis || q.z <= 0) return;
      const tw = 0.75 + 0.25 * Math.sin(gt * 1.7 + i * 2.1);
      light(ctx, q.x, q.y, m * 0.035, C.gold, 0.55 * tw * gA * smooth(q.z * 4));
    });

    /* ── ACTE I : New York et les États voisins ── */
    const nyA = legal('newYork', T.ny) * (1 - smooth(seg(lt, T.ici - 0.4, T.ici + 0.6))) * gA;
    const ny = P2('newYork');
    if (nyA > 0.003 && ny.vis) {
      shield(ctx, ny.x - m * 0.08, ny.y - m * 0.07, m * 0.055, { color: C.emerald, alpha: nyA, draw: eInOutQuart(seg(lt, T.ny, T.ny + 1.0)), time: gt, fill: 0.16 });
      cityTag(ctx, ny.x, ny.y, 'NEW YORK', { color: C.emerald, t: seg(lt, T.ny, T.ny + 0.9), alpha: nyA, side: 'right', size: Math.floor(m * 0.026), time: gt, r: 8 });
    }
    const states = [
      ['annapolis', 'MARYLAND', T.maryland, 'left'],
      ['trenton', 'NEW JERSEY', T.nj, 'left'],
      ['hartford', 'CONNECTICUT', T.ct, 'right']
    ];
    states.forEach(([k, n, tk, side]) => {
      const q = P2(k);
      const sA = legal(k, tk) * (1 - smooth(seg(lt, T.ici - 0.4, T.ici + 0.6))) * gA;
      if (sA <= 0.003 || !q.vis) return;
      cityTag(ctx, q.x, q.y, n, { color: C.emerald, t: seg(lt, tk, tk + 0.8), alpha: sA, side, size: Math.floor(m * 0.022), time: gt, r: 7, pulse: true });
      const ny2 = P2('newYork');
      glowPath(ctx, [ny2, q], eInOutQuart(seg(lt, tk, tk + 0.7)), { color: C.emerald, width: 1.5, alpha: sA * 0.6, head: false });
    });

    // panneau d'avertissement obligatoire
    const pA = smooth(seg(lt, T.avert - 0.3, T.avert + 0.4)) * (1 - smooth(seg(lt, T.maryland - 0.6, T.maryland)));
    if (pA > 0.003) {
      const px = V ? cx : w * 0.72;
      const py = V ? h * 0.74 : h * 0.44;
      const pw = V ? w * 0.84 : w * 0.38;
      const ph = m * 0.2;
      const pop = eOutBack(seg(lt, T.avert - 0.3, T.avert + 0.4), 1.4);
      ctx.save();
      ctx.globalAlpha *= pA;
      ctx.translate(px, py);
      ctx.scale(pop, pop);
      rrect(ctx, -pw / 2, -ph / 2, pw, ph, m * 0.02);
      ctx.fillStyle = 'rgba(6,20,16,0.94)';
      ctx.fill();
      ctx.strokeStyle = C.emerald;
      ctx.lineWidth = 2;
      ctx.shadowColor = C.emerald;
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();
      if (pop > 0.92) {
        // pictogramme d'alerte
        const ix = px - pw / 2 + m * 0.07;
        const iy = py;
        const s = m * 0.035;
        glowPath(ctx, [{ x: ix, y: iy - s }, { x: ix + s * 1.1, y: iy + s * 0.85 }, { x: ix - s * 1.1, y: iy + s * 0.85 }, { x: ix, y: iy - s }], 1, { color: C.emerald, width: 3, alpha: pA, head: false });
        drawSprite(ctx, textSprite('!', { size: Math.floor(s * 1.1), weight: 900, color: C.emerald }), ix, iy + s * 0.55, { alpha: pA });
        const tx = ix + m * 0.07;
        mono(ctx, 'AVERTISSEMENT', tx, py - m * 0.055, { size: Math.floor(m * 0.016), color: C.mint, spacing: 6, align: 'left', t: seg(lt, T.avert, T.avert + 0.6), alpha: pA });
        mono(ctx, 'CE PRIX A ÉTÉ FIXÉ PAR UN ALGORITHME', tx, py, { size: Math.floor(m * (V ? 0.019 : 0.018)), color: C.white, spacing: 1, align: 'left', t: seg(lt, T.algo - 0.2, T.algo + 1.2), alpha: pA });
        mono(ctx, "À L'AIDE DE VOS DONNÉES PERSONNELLES", tx, py + m * 0.045, { size: Math.floor(m * (V ? 0.019 : 0.018)), color: C.white, spacing: 1, align: 'left', t: seg(lt, T.donnees - 0.3, T.donnees + 1.0), alpha: pA });
      }
    }

    /* ── ACTE II : faisceaux vers Québec et Ottawa ── */
    const qA = smooth(seg(lt, T.ici - 0.3, T.ici + 0.5)) * gA * endFade;
    if (qA > 0.003) {
      const nyq = P2('newYork');
      const q = P2('quebec');
      const ot = P2('ottawa');
      const beamQ = eInOutQuart(seg(lt, T.ici, T.ici + 1.2));
      glowPath(ctx, quadPts(nyq, q, -m * 0.08, 40), beamQ, { color: C.amber, width: 2.5, alpha: qA });
      const ringA = smooth(seg(lt, T.opposition - 0.2, T.opposition + 0.6));
      if (q.vis) {
        for (let k = 0; k < 3; k++) {
          const ph = ((lt * 0.6 + k / 3) % 1);
          ring(ctx, q.x, q.y, m * (0.03 + ph * 0.08), { color: C.amber, width: 2.5, alpha: qA * ringA * (1 - ph) });
        }
        beacon(ctx, q.x, q.y, { color: C.amber, r: 10, alpha: qA * ringA, time: gt });
        cityTag(ctx, q.x, q.y, 'QUÉBEC', { color: C.amber, t: seg(lt, T.ici, T.ici + 0.8), alpha: qA, side: 'right', size: Math.floor(m * 0.026), time: gt, r: 8 });
        mono(ctx, 'OPC', q.x, q.y - m * 0.085, { size: Math.floor(m * 0.022), color: C.gold, spacing: 8, t: seg(lt, T.opc, T.opc + 0.6), alpha: qA });
      }
      const oA = smooth(seg(lt, T.ottawa - 0.3, T.ottawa + 0.4)) * qA;
      if (oA > 0.003 && ot.vis) {
        glowPath(ctx, quadPts(nyq, ot, m * 0.06, 40), eInOutQuart(seg(lt, T.ottawa, T.ottawa + 1.0)), { color: C.cyan, width: 2, alpha: oA });
        cityTag(ctx, ot.x, ot.y, 'OTTAWA', { color: C.cyan, t: seg(lt, T.ottawa, T.ottawa + 0.8), alpha: oA, side: 'left', size: Math.floor(m * 0.024), time: gt, r: 7 });
      }
    }

    /* ── titres ── */
    const ty = V ? h * 0.15 : h * 0.17;
    const tx = V ? cx : w * 0.72;
    const t1 = 1 - smooth(seg(lt, T.ny - 0.3, T.ny + 0.1));
    kRise(ctx, 'LA RIPOSTE', cx, ty, { size: Math.floor(m * 0.064), weight: 900, t: seg(lt, T.riposte - 0.2, T.riposte + 0.6), alpha: t1 });
    kRise(ctx, "S'ACCÉLÈRE", cx, ty + m * 0.075, { size: Math.floor(m * 0.064), weight: 900, color: C.emerald, t: seg(lt, T.riposte + 0.3, T.riposte + 1.1), alpha: t1, glow: 16, glowColor: rgba(C.emerald, 0.4) });
    mono(ctx, 'AILLEURS EN AMÉRIQUE DU NORD', cx, ty - m * 0.06, { size: Math.floor(m * 0.019), color: C.ice, spacing: 5, t: seg(lt, T.ailleurs, T.ailleurs + 1.0), alpha: t1 });
    const t2 = smooth(seg(lt, T.ny - 0.2, T.ny + 0.4)) * (1 - smooth(seg(lt, T.maryland - 0.5, T.maryland)));
    mono(ctx, 'NEW YORK · OBLIGATOIRE', tx, V ? ty : h * 0.26, { size: Math.floor(m * 0.02), color: C.mint, spacing: 6, t: seg(lt, T.oblige - 0.2, T.oblige + 0.8), alpha: t2 });
    const t3 = smooth(seg(lt, T.maryland - 0.2, T.maryland + 0.4)) * (1 - smooth(seg(lt, T.ici - 0.5, T.ici)));
    kRise(ctx, 'DES LOIS CIBLÉES', tx, V ? ty : h * 0.3, { size: Math.floor(m * 0.052), weight: 900, t: seg(lt, T.lois - 0.2, T.lois + 0.7), alpha: t3, maxW: V ? w * 0.9 : w * 0.4 });
    mono(ctx, 'POUR PROTÉGER LES CONSOMMATEURS EN ALIMENTATION', tx, V ? ty + m * 0.055 : h * 0.3 + m * 0.05, { size: Math.floor(m * (V ? 0.015 : 0.016)), color: C.mint, spacing: 3, t: seg(lt, T.alim - 0.8, T.alim + 0.6), alpha: t3 });
    const t4 = smooth(seg(lt, T.ici - 0.2, T.ici + 0.4)) * (1 - smooth(seg(lt, T.fenetre - 0.5, T.fenetre)));
    const qtx = V ? cx : w * 0.74;
    const qty = V ? h * 0.74 : h * 0.6;
    mono(ctx, "PARTIS D'OPPOSITION → OPC", qtx, qty - m * 0.07, { size: Math.floor(m * 0.018), color: C.gold, spacing: 4, t: seg(lt, T.opposition, T.opc + 0.8), alpha: t4 });
    kRise(ctx, "ENCADRER D'AVANCE", qtx, qty, { size: Math.floor(m * (V ? 0.056 : 0.046)), weight: 900, color: C.amber, t: seg(lt, T.encadrer - 0.1, T.encadrer + 0.8), alpha: t4, glow: 16, glowColor: rgba(C.amber, 0.4), maxW: V ? w * 0.9 : w * 0.42 });
    mono(ctx, 'LA TARIFICATION DYNAMIQUE', qtx, qty + m * 0.05, { size: Math.floor(m * 0.019), color: C.white, spacing: 4, t: seg(lt, T.encadrer + 0.4, T.norme + 0.4), alpha: t4 });
    mono(ctx, 'OTTAWA : PRIX PLANCHER · CIRCULAIRES', qtx, qty + m * 0.1, { size: Math.floor(m * (V ? 0.016 : 0.017)), color: C.cyan, spacing: 3, t: seg(lt, T.plancher - 0.4, T.circ + 0.8), alpha: t4 });

    /* ── ACTE III : la fenêtre s'ouvre ── */
    const fA = smooth(seg(lt, T.fenetre - 0.3, T.fenetre + 0.4));
    if (fA > 0.003) {
      const fx = cx;
      const fy = V ? h * 0.44 : h * 0.42;
      const fw = m * (V ? 0.5 : 0.42);
      const fh = m * (V ? 0.36 : 0.3);
      const open = eInOutQuart(seg(lt, T.fenetre, T.ouverte + 0.8));
      // lumière qui jaillit
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fw);
      lg.addColorStop(0, rgba(C.gold, 0.55 * open * fA));
      lg.addColorStop(1, rgba(C.amber, 0));
      ctx.fillStyle = lg;
      ctx.fillRect(fx - fw * open * 0.5, fy - fh / 2, fw * open, fh);
      ctx.restore();
      light(ctx, fx, fy, fw * 0.9 * open, C.gold, fA * open * 0.5);
      // battants
      [-1, 1].forEach((sd) => {
        const pivotX = fx + sd * fw / 2;
        const ww = (fw / 2) * Math.cos(open * 1.25);
        ctx.save();
        ctx.globalAlpha *= fA;
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 3;
        ctx.shadowColor = C.amber;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(pivotX, fy - fh / 2);
        ctx.lineTo(pivotX - sd * ww, fy - fh / 2 - sd * 0 - fh * 0.06 * open);
        ctx.lineTo(pivotX - sd * ww, fy + fh / 2 + fh * 0.06 * open);
        ctx.lineTo(pivotX, fy + fh / 2);
        ctx.closePath();
        ctx.fillStyle = rgba(C.amber, 0.08);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
      ctx.save();
      ctx.globalAlpha *= fA;
      ctx.strokeStyle = rgba(C.gold, 0.6);
      ctx.lineWidth = 2;
      ctx.strokeRect(fx - fw / 2, fy - fh / 2, fw, fh);
      ctx.restore();
      const ty3 = fy + fh / 2 + m * 0.09;
      kRise(ctx, 'LA FENÊTRE', cx, ty3, { size: Math.floor(m * (V ? 0.07 : 0.06)), weight: 900, t: seg(lt, T.fenetre, T.fenetre + 0.8), alpha: fA });
      kRise(ctx, 'EST OUVERTE', cx, ty3 + m * 0.075, { size: Math.floor(m * (V ? 0.07 : 0.06)), weight: 900, color: C.gold, t: seg(lt, T.ouverte - 0.2, T.ouverte + 0.6), alpha: fA, glow: 20, glowColor: rgba(C.amber, 0.5) });
      mono(ctx, 'AGIR PRÉVENTIVEMENT · MAINTENANT', cx, fy - fh / 2 - m * 0.05, { size: Math.floor(m * 0.019), color: C.ice, spacing: 5, t: seg(lt, T.fenetre + 0.3, T.fenetre + 1.3), alpha: fA });
    }
  });
}
/*@scene rep-lois-monde-vs-quebec=sceneLoisAmerique*/
