/* Acte I   : survol en carte inclinée de la vallée du Saint-Laurent ; la caméra se pose sur une ville en
 *            région : une seule bannière, un bail restrictif, deux concurrents bloqués ; jauge du panier haute
 * Acte II  : un indépendant émeraude ouvre → onde de pression → la jauge baisse ; les trois recommandations
 *            du Bureau (épiciers étrangers, indépendants, prix unitaire)
 * Acte III : la jauge remonte en partie : « PAS DU JOUR AU LENDEMAIN » */

const S08_RIVER = [[-76.6, 44.2], [-75.0, 45.0], [-73.6, 45.5], [-72.5, 46.25], [-71.2, 46.8], [-70.2, 47.4], [-69.0, 48.1], [-68.0, 48.7], [-66.0, 49.3], [-64.3, 49.6]];
const S08_TOWN = [-68.52, 48.45];
const S08_INDEP = ['saguenay', 'troisRivieres', 'sherbrooke', 'drummondville', 'gaspe', 'rouyn', 'valdor', 'septIles', 'baieComeau', 'gatineau'];

/** Jauge semi-circulaire « prix du panier » (sans chiffres inventés). */
function s08_gauge(ctx, x, y, r, v, a, time) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  const a0 = Math.PI;
  const span = Math.PI;
  for (let i = 0; i < 40; i++) {
    const t = i / 39;
    const an = a0 + span * t;
    ctx.strokeStyle = rgba(mix(C.emerald, C.red, t), 0.35 + 0.65 * (t <= v ? 1 : 0.25));
    ctx.lineWidth = r * 0.09;
    ctx.beginPath();
    ctx.arc(x, y, r, an + 0.01, an + span / 40 - 0.01);
    ctx.stroke();
  }
  const an = a0 + span * clamp(v);
  ctx.strokeStyle = C.white;
  ctx.lineWidth = r * 0.04;
  ctx.lineCap = 'round';
  ctx.shadowColor = C.white;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(an) * r * 0.82, y + Math.sin(an) * r * 0.82);
  ctx.stroke();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.06, 0, TAU);
  ctx.fill();
  ctx.restore();
  light(ctx, x + Math.cos(an) * r, y + Math.sin(an) * r, r * 0.35, mix(C.emerald, C.red, v), a * 0.7);
  const fs = 17; // taille fixe (la jauge peut changer d'échelle : le texte, jamais)
  drawSprite(ctx, textSprite('BAS', { size: fs, weight: 600, fam: MONO, color: C.mint, spacing: 3 }), x - r, y + fs * 1.6, { alpha: a });
  drawSprite(ctx, textSprite('ÉLEVÉ', { size: fs, weight: 600, fam: MONO, color: C.coral, spacing: 3 }), x + r, y + fs * 1.6, { alpha: a });
}

function s08_icon(ctx, kind, x, y, s, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.4;
  ctx.beginPath();
  if (kind === 'globe') {
    ctx.arc(0, 0, s * 0.5, 0, TAU);
    ctx.moveTo(-s * 0.5, 0);
    ctx.lineTo(s * 0.5, 0);
    ctx.ellipse(0, 0, s * 0.22, s * 0.5, 0, 0, TAU);
  } else if (kind === 'hands') {
    ctx.arc(0, -s * 0.08, s * 0.28, 0, TAU);
    ctx.moveTo(-s * 0.55, s * 0.45);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.12, 0, s * 0.3);
    ctx.quadraticCurveTo(s * 0.3, s * 0.12, s * 0.55, s * 0.45);
  } else {
    ctx.rect(-s * 0.55, -s * 0.32, s * 1.1, s * 0.64);
    ctx.moveTo(-s * 0.4, s * 0.12);
    ctx.lineTo(s * 0.0, s * 0.12);
  }
  ctx.stroke();
  ctx.restore();
}

function sceneQuartiersQuebec(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    lien: 'le lien direct',
    portefeuille: 'votre portefeuille',
    bail: 'un bail restrictif',
    escompte: 'compétiteur escompte',
    inter: 'acteur international',
    quartier: 'votre quartier',
    region: 'en région',
    levier: 'le seul levier',
    baisser: 'à baisser',
    vraie: 'la vraie concurrence locale',
    bureau: 'Le Bureau de la concurrence',
    etrangers: 'épiciers étrangers',
    indep: 'soutenir les indépendants',
    unitaire: 'prix unitaire',
    ententes: 'avec des ententes',
    habitudes: 'les habitudes',
    trois: 'des trois grands',
    jour: 'du jour au lendemain'
  });

  // caméra cartographique
  const lon0 = track(lt, [[0, -71.5], [T.bail - 0.8, -71.5], [T.bail + 1.6, S08_TOWN[0], eInOutQuart], [T.bureau - 0.6, S08_TOWN[0]], [T.bureau + 1.4, -70.6, eInOutQuart]]);
  const lat0 = track(lt, [[0, 47.2], [T.bail - 0.8, 47.2], [T.bail + 1.6, S08_TOWN[1] - 0.15, eInOutQuart], [T.bureau - 0.6, S08_TOWN[1] - 0.15], [T.bureau + 1.4, 47.8, eInOutQuart]]);
  const scl = m * track(lt, [[0, V ? 0.1 : 0.1], [T.bail - 0.8, V ? 0.115 : 0.115, (x) => x], [T.bail + 1.6, V ? 0.34 : 0.34, eInOutQuart], [T.bureau - 0.6, V ? 0.36 : 0.36], [T.bureau + 1.4, V ? 0.09 : 0.085, eInOutQuart], [D, V ? 0.095 : 0.09, smoother]]);
  const tilt = track(lt, [[0, 0.8], [T.bail + 1.6, 0.9], [T.bureau + 1.4, 0.72]]);
  const yaw = -0.12 + lt * 0.006;
  const mx = V ? cx : w * 0.38;
  const my = V ? h * 0.42 : h * 0.55;
  const Pj = makeTilt(lon0, lat0, scl, mx, my, tilt, m * 1.4, yaw);
  const mapA = smooth(seg(lt, 0, 0.8)) * (1 - 0.55 * smooth(seg(lt, T.ententes - 0.4, T.ententes + 0.8)));

  frame(a, () => {
    dust(ctx, stage, gt, { count: 60, alpha: 0.22, seed: 88 });

    /* ── CARTE INCLINÉE ── */
    ctx.save();
    ctx.globalAlpha *= mapA;
    const zoomed = smooth(seg(scl / m, 0.16, 0.3));
    drawDots(ctx, Pj, regionDots('qc08', -80, -57, 44.5, 53.5, 0.16), { color: C.cyan, size: Math.max(2, scl * 0.022), alpha: 0.85 * (1 - zoomed), fade: { x: mx, y: my, r: m * (V ? 0.62 : 0.8) } });
    if (zoomed > 0.01) drawDots(ctx, Pj, regionDots('qc08f', -71.5, -65.5, 46.8, 50.2, 0.045), { color: C.cyan, size: Math.max(2, scl * 0.008), alpha: 0.85 * zoomed, fade: { x: mx, y: my, r: m * (V ? 0.62 : 0.8) } });
    const rp = smoothPath(S08_RIVER, 8).map((p) => Pj.project(p[0], p[1]));
    glowPath(ctx, rp, eInOutQuart(seg(lt, 0.2, 2.6)), { color: C.ice, width: 3, alpha: 0.85, head: false });
    ctx.restore();
    const cities = [['montreal', 'MONTRÉAL'], ['quebec', 'QUÉBEC'], ['troisRivieres', 'TROIS-RIVIÈRES'], ['saguenay', 'SAGUENAY']];
    const cityA = mapA * (1 - smooth(seg(lt, T.bail - 0.4, T.bail + 0.6))) * smooth(seg(lt, 0.6, 1.6));
    cities.forEach(([k, n], i) => {
      const q = Pj.project(...P(k));
      cityTag(ctx, q.x, q.y, n, { color: C.cyan, t: seg(lt, 0.8 + i * 0.35, 1.6 + i * 0.35), alpha: cityA, side: i === 3 ? 'top' : i === 1 ? 'right' : 'bottom', size: Math.floor(m * 0.02), time: gt, r: 5 });
    });

    // la ville en région
    const town = Pj.project(...S08_TOWN);
    const tA = mapA * smooth(seg(lt, T.bail - 0.6, T.bail + 0.6));
    if (tA > 0.003) {
      const freedT = smooth(seg(lt, T.vraie - 0.2, T.vraie + 0.6));
      // bail restrictif : anneau verrouillé autour de la ville
      const lockR = m * (V ? 0.13 : 0.12);
      ctx.save();
      ctx.globalAlpha *= tA * (1 - freedT * 0.85);
      ctx.strokeStyle = C.amber;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -lt * 12;
      ctx.shadowColor = C.amber;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(town.x, town.y, lockR, lockR * 0.55, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      mono(ctx, 'BAIL RESTRICTIF', town.x, town.y - lockR * 0.55 - m * 0.03, { size: Math.floor(m * 0.019), color: C.amber, spacing: 5, t: seg(lt, T.bail, T.bail + 0.8), alpha: tA * (1 - freedT) });
      // la seule bannière
      beacon(ctx, town.x, town.y, { color: C.amber, r: 11, alpha: tA, time: gt });
      mono(ctx, 'UNE SEULE BANNIÈRE', town.x, town.y + m * 0.045, { size: Math.floor(m * 0.017), color: C.white, spacing: 4, t: seg(lt, T.quartier, T.quartier + 0.8), alpha: tA * (1 - freedT) });
      // concurrents bloqués (escompte par l'ouest, international par l'est)
      const comps = [
        { k: T.escompte, from: -1, col: C.ice, lab: 'ESCOMPTE' },
        { k: T.inter, from: 1, col: C.violet, lab: 'INTERNATIONAL' }
      ];
      comps.forEach((c) => {
        const app = seg(lt, c.k - 0.3, c.k + 0.8);
        if (app <= 0) return;
        const tIn = lt - (c.k + 0.8);
        const edge = town.x + c.from * lockR;
        const far = town.x + c.from * lockR * 2.6;
        let x = lerp(far, edge + c.from * m * 0.02, eInCubic(app));
        if (tIn > 0) x += c.from * (Math.exp(-tIn * 3) * Math.abs(Math.sin(tIn * 8)) * m * 0.05 + m * 0.04 * smooth(clamp(tIn * 2)));
        const cA = tA * smooth(app * 3) * (1 - smooth(seg(lt, T.levier - 0.3, T.levier + 0.4)));
        beacon(ctx, x, town.y, { color: c.col, r: 7, alpha: cA, time: gt, pulse: false });
        mono(ctx, c.lab, x, town.y - m * 0.03, { size: Math.floor(m * 0.016), color: c.col, spacing: 3, alpha: cA, cursor: false });
        if (tIn > 0 && tIn < 0.4) light(ctx, edge, town.y, m * 0.05, C.red, (1 - tIn / 0.4) * cA);
      });
      // l'indépendant émeraude ouvre
      const iT = eOutBack(seg(lt, T.vraie - 0.1, T.vraie + 0.6), 2);
      if (iT > 0) {
        const ix = town.x + m * 0.06;
        const iy = town.y - m * 0.012;
        beacon(ctx, ix, iy, { color: C.emerald, r: 11 * iT, alpha: tA, time: gt });
        shockwave(ctx, ix, iy, m * 0.22, lt - T.vraie, { color: C.emerald, count: 3, period: 1.8, alpha: tA * (1 - smooth(seg(lt, T.bureau, T.bureau + 1))) });
        mono(ctx, 'INDÉPENDANT', ix, iy - m * 0.04, { size: Math.floor(m * 0.017), color: C.mint, spacing: 4, t: seg(lt, T.vraie + 0.2, T.vraie + 0.9), alpha: tA * (1 - smooth(seg(lt, T.bureau - 0.3, T.bureau + 0.3))) });
      }
    }

    /* ── ACTE II : recommandations sur la carte ── */
    const rA = smooth(seg(lt, T.bureau - 0.2, T.bureau + 0.6)) * (1 - smooth(seg(lt, T.ententes - 0.3, T.ententes + 0.6)));
    if (rA > 0.003) {
      // épiciers étrangers : arcs venant de l'Atlantique
      const eT = seg(lt, T.etrangers - 0.3, T.etrangers + 1.4);
      ['montreal', 'quebec', 'sherbrooke'].forEach((k, i) => {
        const to = Pj.project(...P(k));
        const from = Pj.project(-61.5 + i * 0.8, 51.5 - i * 0.4);
        const pts = quadPts(from, to, m * 0.06, 40);
        glowPath(ctx, pts, eInOutQuart(clamp(eT * 1.3 - i * 0.15)), { color: C.violet, width: 2.5, alpha: rA });
      });
      // indépendants partout en région
      S08_INDEP.forEach((k, i) => {
        const q = Pj.project(...P(k));
        const on = eOutBack(seg(lt, T.indep - 0.2 + i * 0.09, T.indep + 0.4 + i * 0.09), 2);
        if (on > 0) beacon(ctx, q.x, q.y, { color: C.emerald, r: 6 * on, alpha: rA, time: gt + i, pulse: true });
      });
    }

    /* ── PANNEAU LATÉRAL : jauge, recommandations, prix unitaire ── */
    const gA = smooth(seg(lt, T.levier - 0.5, T.levier + 0.3));
    if (gA > 0.003) {
      const gv = track(lt, [[T.levier, 0.86], [T.vraie, 0.86], [T.vraie + 1.6, 0.42, eInOutQuart], [T.habitudes, 0.42], [D - 0.6, 0.62, smoother]]);
      const park = eInOutQuart(seg(lt, T.bureau - 0.4, T.bureau + 0.6)) * (1 - eInOutQuart(seg(lt, T.ententes - 0.4, T.ententes + 0.8)));
      const gx = V ? cx : w * 0.79;
      const gy = V ? lerp(lerp(h * 0.72, h * 0.62, park), h * 0.645, smooth(seg(lt, T.ententes - 0.4, T.ententes + 0.8))) : lerp(h * 0.52, h * 0.3, park);
      const gr = m * (V ? 0.17 : 0.14) * lerp(1, 0.7, park);
      s08_gauge(ctx, gx, gy, gr, gv, gA, gt);
      mono(ctx, 'PRIX DU PANIER', gx, gy + m * 0.068, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.levier, T.levier + 0.8), alpha: gA });
      const ty = gy - gr - m * 0.05;
      const sw = smooth(seg(lt, T.vraie - 0.3, T.vraie));
      kRise(ctx, 'LE SEUL LEVIER', gx, ty, { size: Math.floor(m * 0.044), weight: 900, t: seg(lt, T.levier, T.levier + 0.8), out: sw, alpha: gA * (1 - smooth(seg(lt, T.bureau - 0.4, T.bureau))) });
      kRise(ctx, 'LA VRAIE CONCURRENCE', gx, ty, { size: Math.floor(m * (V ? 0.05 : 0.04)), weight: 900, color: C.emerald, t: seg(lt, T.vraie, T.vraie + 0.9), alpha: gA * sw * (1 - smooth(seg(lt, T.bureau - 0.4, T.bureau))), glow: 14, glowColor: rgba(C.emerald, 0.4), maxW: V ? w * 0.9 : w * 0.36 });
      // recommandations
      const recA = rA;
      if (recA > 0.003) {
        const recs = [
          ['globe', 'ATTIRER DE NOUVEAUX', 'ÉPICIERS ÉTRANGERS', T.etrangers, C.violet],
          ['hands', 'SOUTENIR', 'LES INDÉPENDANTS', T.indep, C.emerald],
          ['tag', 'STANDARDISER', 'LE PRIX UNITAIRE', T.unitaire, C.cyan]
        ];
        const x0 = V ? w * 0.12 : w * 0.64;
        const y0 = V ? h * 0.745 : h * 0.47;
        const dy = V ? h * 0.058 : h * 0.12;
        mono(ctx, 'LE BUREAU RECOMMANDE', V ? cx : x0, y0 - m * (V ? 0.07 : 0.06), { size: Math.floor(m * 0.019), color: C.slate, spacing: 6, align: V ? 'center' : 'left', t: seg(lt, T.bureau, T.bureau + 1.0), alpha: recA });
        recs.forEach(([ic, l1, l2, k, col], i) => {
          const yy = y0 + i * dy;
          const on = seg(lt, k - 0.3, k + 0.6);
          s08_icon(ctx, ic, x0 + m * 0.03, yy, m * 0.045 * eOutBack(on, 1.8), col, recA * smooth(on * 2));
          kSlide(ctx, l1, x0 + m * 0.08, yy - (V ? 0 : m * 0.008), { size: Math.floor(m * (V ? 0.026 : 0.024)), weight: 700, color: C.slate, t: on, alpha: recA, align: 'left', dir: 'left' });
          if (V) kSlide(ctx, l2, x0 + m * 0.08 + m * 0.36, yy, { size: Math.floor(m * 0.026), weight: 900, color: col, t: seg(lt, k, k + 0.7), alpha: recA, align: 'left', dir: 'left' });
          else kSlide(ctx, l2, x0 + m * 0.08, yy + m * 0.032, { size: Math.floor(m * 0.03), weight: 900, color: col, t: seg(lt, k, k + 0.7), alpha: recA, align: 'left', dir: 'left' });
        });
      }
    }

    /* ── ACTE III : pas du jour au lendemain ── */
    const fA = smooth(seg(lt, T.ententes - 0.2, T.ententes + 0.6));
    if (fA > 0.003) {
      const ty = V ? h * 0.86 - m * 0.06 : h * 0.785;
      mono(ctx, 'LES TROIS GRANDS DOMINENT TOUJOURS', V ? cx : w * 0.76, V ? h * 0.52 : h * 0.665, { size: Math.floor(m * 0.018), color: C.amber, spacing: 4, t: seg(lt, T.trois - 0.3, T.trois + 0.9), alpha: fA });
      kRise(ctx, 'PAS DU JOUR', V ? cx : w * 0.76, V ? ty - m * 0.065 : ty - m * 0.06, { size: Math.floor(m * (V ? 0.064 : 0.05)), weight: 900, t: seg(lt, T.jour - 0.6, T.jour + 0.3), alpha: fA });
      kRise(ctx, 'AU LENDEMAIN', V ? cx : w * 0.76, ty, { size: Math.floor(m * (V ? 0.064 : 0.05)), weight: 900, color: C.amber, t: seg(lt, T.jour - 0.3, T.jour + 0.6), alpha: fA, glow: 14, glowColor: rgba(C.amber, 0.4) });
    }

    /* ── OUVERTURE : la question ── */
    const qA = 1 - smooth(seg(lt, T.levier - 0.6, T.levier));
    if (qA > 0.003) {
      const ty = V ? h * 0.12 : h * 0.17;
      kRise(ctx, 'ET VOTRE PORTEFEUILLE ?', cx, ty, { size: Math.floor(m * (V ? 0.06 : 0.058)), weight: 900, t: seg(lt, T.portefeuille - 0.4, T.portefeuille + 0.6), alpha: qA, maxW: w * 0.9 });
      mono(ctx, 'QUARTIERS · VILLES EN RÉGION', cx, ty + m * 0.055, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.quartier, T.region + 0.8), alpha: qA });
    }
  });
}
/*@scene rep-impact-quartiers-quebec=sceneQuartiersQuebec*/
