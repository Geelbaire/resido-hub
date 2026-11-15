/* Acte I   : la question ; une ligne d'horizon cyan se trace et divise l'écran en deux plans (miroir)
 * Acte II  : en haut, côté détaillants (émeraude) : papier, erreurs, horloge anti-gaspillage, −30 % → −50 %
 *            en bas, le reflet se redresse côté consommateurs (ambre) : bien essentiel, vendredi 17 h, prix ↑
 * Acte III : l'horizon devient le fléau d'une balance : BAISSER ↔ GONFLER */

function s05_clock(ctx, x, y, r, frac, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  light(ctx, x, y, r * 2.2, color, 0.25);
  ring(ctx, x, y, r, { color: rgba(color, 0.35), width: 2 });
  ring(ctx, x, y, r, { color, width: 4, a0: -Math.PI / 2, sweep: TAU * frac, glow: 12 });
  ctx.strokeStyle = C.white;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, r * 0.07);
  const an = -Math.PI / 2 + TAU * frac;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(an) * r * 0.72, y + Math.sin(an) * r * 0.72);
  ctx.stroke();
  ctx.lineWidth = Math.max(2, r * 0.09);
  const an2 = -Math.PI / 2 + TAU * frac / 12 + 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(an2) * r * 0.45, y + Math.sin(an2) * r * 0.45);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * TAU;
    ctx.fillStyle = rgba(C.white, i % 3 ? 0.35 : 0.8);
    ctx.fillRect(x + Math.cos(t) * r * 0.86 - 1.5, y + Math.sin(t) * r * 0.86 - 1.5, 3, 3);
  }
  ctx.restore();
}

/** Étiquette (boîtier + nom + prix) ; flipY ∈ [-1, 1] : -1 = reflet sans texte, 1 = endroit. */
function s05_label(ctx, x, y, lw, o) {
  const { name = '', price = 0, color = C.emerald, alpha = 1, badge = '', badgeT = 1, flipY = 1, textOn = true } = o;
  if (alpha <= 0.003) return;
  const lh = lw * 0.5;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(1, flipY);
  light(ctx, 0, 0, lw * 0.8, color, 0.22);
  rrect(ctx, -lw / 2, -lh / 2, lw, lh, lw * 0.05);
  ctx.fillStyle = 'rgba(10,18,30,0.95)';
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.9);
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
  if (!textOn || flipY < 0.98) return;
  mono(ctx, name, x - lw * 0.42, y - lh * 0.24, { size: Math.floor(lw * 0.075), color: C.slate, spacing: 3, align: 'left', alpha, cursor: false });
  odometer(ctx, price, x - lw * 0.42, y + lh * 0.3, { size: Math.floor(lw * 0.17), weight: 900, color: C.white, dec: 2, align: 'left', suffix: ' $', suffixScale: 0.55, alpha });
  if (badge && badgeT > 0) {
    const bx = x + lw * 0.3;
    const by = y - lh * 0.02;
    const br = lw * 0.15 * eOutBack(badgeT, 2);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function sceneDeuxCotesEtiquettes(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    bannir: 'Faut-il bannir',
    ia: "l'IA en épicerie",
    deux: 'les deux côtés',
    rigueur: 'avec rigueur',
    cote1: "D'un côté",
    etiqNum: 'les étiquettes numériques',
    papier: 'tonnes de papier',
    erreurs: 'erreurs humaines',
    rabais: 'des rabais à la baisse',
    viandes: 'les viandes',
    pains: 'les pains',
    limite: 'date limite',
    gaspillage: 'gaspillage alimentaire',
    autre: "De l'autre côté",
    essentiel: 'un bien essentiel',
    concert: 'billet de concert',
    baisser: 'baisser les prix',
    gonfler: 'les gonfler',
    dixsept: 'dix-sept heures',
    vendredi: 'un vendredi soir'
  });

  // caméra verticale : on regarde le haut, puis le bas, puis la balance
  const camY = track(lt, [
    [0, 0],
    [T.cote1 - 0.6, 0],
    [T.cote1 + 0.8, (V ? 0.09 : 0.13) * h, eInOutQuart],
    [T.autre - 0.5, (V ? 0.09 : 0.13) * h],
    [T.autre + 0.9, -(V ? 0.09 : 0.13) * h, eInOutQuart],
    [T.baisser - 0.3, -(V ? 0.09 : 0.13) * h],
    [T.baisser + 1.0, 0, eInOutQuart]
  ]);
  const hy = cy + camY;
  const U = V ? h * 0.15 : h * 0.22; // distance type entre l'horizon et les étiquettes
  const lw = V ? w * 0.36 : w * 0.17;
  const topOn = smooth(seg(lt, T.cote1 - 0.2, T.cote1 + 0.6));
  const botOn = smooth(seg(lt, T.autre - 0.2, T.autre + 0.7));
  const flipUp = eInOutQuart(seg(lt, T.autre + 0.3, T.autre + 1.5)); // le reflet se redresse
  const scaleT = eInOutQuart(seg(lt, T.baisser - 0.4, T.baisser + 0.8)); // balance
  const lx = (i) => cx + (i - 0.5) * (V ? w * 0.42 : w * 0.21);

  frame(a, () => {
    dust(ctx, stage, gt, { count: 70, alpha: 0.25, seed: 55 });

    /* ── la ligne d'horizon (puis fléau de balance) ── */
    const lineT = eInOutQuart(seg(lt, T.deux - 0.3, T.deux + 1.0));
    const tilt = scaleT * 0.07 * Math.sin((lt - T.baisser) * 2.2) * Math.exp(-Math.max(0, lt - T.baisser - 0.6) * 0.5);
    if (lineT > 0) {
      const half = (w / 2) * lineT * lerp(1, V ? 0.84 : 0.62, scaleT);
      ctx.save();
      ctx.translate(cx, hy);
      ctx.rotate(tilt);
      const g = ctx.createLinearGradient(-half, 0, half, 0);
      g.addColorStop(0, rgba(C.cyan, 0));
      g.addColorStop(0.2, rgba(C.cyan, 0.9));
      g.addColorStop(0.5, rgba(C.white, 1));
      g.addColorStop(0.8, rgba(C.cyan, 0.9));
      g.addColorStop(1, rgba(C.cyan, 0));
      ctx.fillStyle = g;
      ctx.shadowColor = C.cyan;
      ctx.shadowBlur = 14;
      ctx.fillRect(-half, -1.5, half * 2, 3);
      ctx.restore();
      light(ctx, cx, hy, m * 0.1, C.cyan, 0.5 * lineT * (1 - scaleT * 0.5));
      // reflet du ciel dans le plan inférieur (halo)
      ctx.save();
      ctx.globalAlpha *= 0.5 * lineT;
      const rg = ctx.createLinearGradient(0, hy, 0, hy + h * 0.3);
      rg.addColorStop(0, rgba(C.cyan, 0.08));
      rg.addColorStop(1, rgba(C.cyan, 0));
      ctx.fillStyle = rg;
      ctx.fillRect(0, hy, w, h * 0.3);
      ctx.restore();
    }

    /* ── ACTE I : la question ── */
    const qA = 1 - smooth(seg(lt, T.cote1 - 0.5, T.cote1 + 0.2));
    if (qA > 0.003) {
      kRise(ctx, 'FAUT-IL BANNIR', cx, hy - m * 0.13, { size: Math.floor(m * (V ? 0.08 : 0.075)), weight: 900, t: seg(lt, T.bannir - 0.2, T.bannir + 0.8), alpha: qA, maxW: w * 0.9 });
      kRise(ctx, 'CES ÉTIQUETTES ?', cx, hy - m * 0.04, { size: Math.floor(m * (V ? 0.08 : 0.075)), weight: 900, color: C.cyan, t: seg(lt, T.bannir + 0.4, T.bannir + 1.3), alpha: qA, maxW: w * 0.9 });
      mono(ctx, 'LES DEUX CÔTÉS DE LA MÉDAILLE', cx, hy + m * 0.07, { size: Math.floor(m * 0.02), color: C.slate, spacing: 7, t: seg(lt, T.deux, T.deux + 1.0), alpha: qA });
      mono(ctx, 'AVEC RIGUEUR', cx, hy + m * 0.11, { size: Math.floor(m * 0.018), color: C.amber, spacing: 7, t: seg(lt, T.rigueur, T.rigueur + 0.6), alpha: qA });
    }

    /* ── PLAN SUPÉRIEUR : côté détaillants ── */
    const tA = topOn * (1 - scaleT * 0.25);
    if (tA > 0.003) {
      const ly = hy - U;
      mono(ctx, 'CÔTÉ DÉTAILLANTS', cx, hy - U * (V ? 2.45 : 1.72), { size: Math.floor(m * 0.02), color: C.emerald, spacing: 8, t: seg(lt, T.cote1, T.cote1 + 0.8), alpha: tA * (1 - botOn) });
      // papier qui se dissout
      const pA = tA * env(lt, T.papier - 0.3, T.autre + 0.5, 0.4, 0.6) * (1 - scaleT);
      if (pA > 0.003) {
        const px = V ? w * 0.18 : w * 0.14;
        const py = V ? ly - U * 0.98 : ly;
        const dis = seg(lt, T.papier + 0.2, T.papier + 2.4);
        const r = rng(51);
        for (let k = 0; k < 4; k++) {
          ctx.save();
          ctx.globalAlpha *= pA * (1 - dis);
          ctx.translate(px + k * m * 0.012, py - k * m * 0.012);
          ctx.fillStyle = rgba(C.slate, 0.25 + k * 0.1);
          ctx.strokeStyle = rgba(C.white, 0.6);
          ctx.fillRect(-m * 0.05, -m * 0.065, m * 0.1, m * 0.13);
          ctx.strokeRect(-m * 0.05, -m * 0.065, m * 0.1, m * 0.13);
          ctx.restore();
        }
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 60; k++) {
          const ox = (r() - 0.5) * m * 0.1;
          const oy = (r() - 0.5) * m * 0.12;
          const sp = 0.5 + r();
          const tt = clamp(dis * 1.4 - r() * 0.4);
          if (tt <= 0 || tt >= 1) continue;
          ctx.globalAlpha = pA * (1 - tt) * 0.9;
          ctx.fillStyle = C.mint;
          ctx.fillRect(px + ox + tt * m * 0.06 * sp, py + oy - tt * m * 0.14 * sp, 2.5, 2.5);
        }
        ctx.restore();
        mono(ctx, '− PAPIER', px, py + m * 0.085, { size: Math.floor(m * 0.019), color: C.mint, spacing: 4, t: seg(lt, T.papier, T.papier + 0.6), alpha: pA });
      }
      // erreurs d'affichage : coche
      const eA = tA * env(lt, T.erreurs - 0.3, T.autre + 0.5, 0.4, 0.6) * (1 - scaleT);
      if (eA > 0.003) {
        const ex = V ? w * 0.82 : w * 0.86;
        const ey = V ? ly - U * 0.98 : ly;
        const ck = [{ x: ex - m * 0.055, y: ey }, { x: ex - m * 0.016, y: ey + m * 0.042 }, { x: ex + m * 0.062, y: ey - m * 0.048 }];
        light(ctx, ex, ey, m * 0.08, C.emerald, eA * 0.4);
        glowPath(ctx, ck, eInOutQuart(seg(lt, T.erreurs, T.erreurs + 0.7)), { color: C.emerald, width: 6, alpha: eA });
        mono(ctx, '− ERREURS', ex, ey + m * 0.085, { size: Math.floor(m * 0.019), color: C.mint, spacing: 4, t: seg(lt, T.erreurs, T.erreurs + 0.6), alpha: eA });
      }
      // horloge anti-gaspillage
      const clockA = tA * env(lt, T.rabais - 0.4, T.autre + 0.4, 0.5, 0.5) * (1 - scaleT);
      const cxk = V ? cx : w * 0.29;
      const cyk = V ? ly - U * 1.0 : ly;
      s05_clock(ctx, cxk, cyk, m * (V ? 0.06 : 0.055), 0.55 + 0.4 * seg(lt, T.rabais, T.limite + 1), C.emerald, clockA);
      mono(ctx, 'DATE LIMITE', cxk, cyk + m * (V ? 0.1 : 0.095), { size: Math.floor(m * 0.017), color: C.emerald, spacing: 4, t: seg(lt, T.limite, T.limite + 0.6), alpha: clockA });
      // étiquettes viande & pain (rabais qui chutent)
      const items = [['VIANDE', 12.99, T.viandes], ['PAIN', 4.49, T.pains]];
      items.forEach(([nm, p0, k], i) => {
        const on = eOutExpo(seg(lt, T.etiqNum - 0.2 + i * 0.25, T.etiqNum + 0.8 + i * 0.25));
        const x = V ? lx(i) : w * 0.5 + (i - 0.5) * w * 0.2 + w * 0.06;
        const disc = lerp(0.3, 0.5, eInOutQuart(seg(lt, T.limite - 0.2, T.limite + 1.4)));
        const price = Math.round(p0 * (1 - disc) * 100) / 100;
        const pAnim = lerp(p0, Math.round(p0 * 0.7 * 100) / 100, eInOutQuart(seg(lt, Math.max(T.rabais, k - 0.6), Math.max(T.rabais, k - 0.6) + 0.9)));
        const shown = lt < T.limite - 0.2 ? pAnim : lerp(Math.round(p0 * 0.7 * 100) / 100, price, eInOutQuart(seg(lt, T.limite - 0.2, T.limite + 1.4)));
        const kb = Math.max(T.rabais, k - 0.6);
        s05_label(ctx, x, ly, lw, { name: nm, price: shown, color: C.emerald, alpha: tA * on, badge: 'x', badgeT: seg(lt, kb, kb + 0.6) });
        const bx = x + lw * 0.3;
        const by = ly - lw * 0.01;
        odometer(ctx, Math.round(disc * 100), bx, by + lw * 0.04, { size: Math.floor(lw * 0.1), weight: 900, color: C.night, prefix: '−', suffix: '%', suffixScale: 0.7, alpha: tA * on * smooth(seg(lt, kb + 0.2, kb + 0.7)) });
        // reflet (formes seulement) tant que le plan inférieur n'est pas actif
        s05_label(ctx, x, hy + (hy - ly), lw, { color: C.emerald, alpha: tA * on * 0.18 * (1 - botOn), flipY: -1, textOn: false });
      });
      const gA = tA * smooth(seg(lt, T.gaspillage - 0.3, T.gaspillage + 0.3)) * (1 - scaleT);
      kWipe(ctx, 'MOINS DE GASPILLAGE', cx, ly + lw * 0.25 + m * (V ? 0.085 : 0.065), { size: Math.floor(m * (V ? 0.05 : 0.044)), weight: 900, color: C.emerald, t: seg(lt, T.gaspillage - 0.2, T.gaspillage + 0.8), alpha: gA, edge: C.white, maxW: w * 0.9 });
    }

    /* ── PLAN INFÉRIEUR : côté consommateurs (le reflet se redresse) ── */
    const bA = botOn * (1 - scaleT * 0.25);
    if (bA > 0.003) {
      const ly = hy + U;
      mono(ctx, 'CÔTÉ CONSOMMATEURS', cx, hy + U * (V ? 0.45 : 0.42), { size: Math.floor(m * 0.02), color: C.amber, spacing: 8, t: seg(lt, T.autre, T.autre + 0.8), alpha: bA * (1 - scaleT) });
      const items = [['VIANDE', 12.99], ['PAIN', 4.49]];
      const rise = eInOutQuart(seg(lt, T.dixsept - 0.3, Math.min(T.vendredi + 0.6, D - 0.6)));
      items.forEach(([nm, p0], i) => {
        const x = V ? lx(i) : w * 0.5 + (i - 0.5) * w * 0.2 + w * 0.06;
        const fy = lerp(-1, 1, flipUp);
        const up = Math.round(p0 * 1.18 * 100) / 100;
        s05_label(ctx, x, ly, lw, { name: nm, price: lerp(p0, up, rise), color: C.amber, alpha: bA, flipY: Math.abs(fy) < 0.02 ? 0.02 : fy, badge: 'x', badgeT: seg(lt, T.dixsept, T.dixsept + 0.6) });
        if (flipUp > 0.98) {
          const bx = x + lw * 0.3;
          const by = ly - lw * 0.01;
          arrowHead(ctx, bx, by + lw * 0.02 - lw * 0.03 * rise, -Math.PI / 2, lw * 0.07, C.night, bA * smooth(seg(lt, T.dixsept + 0.2, T.dixsept + 0.8)));
        }
      });
      // horloge « vendredi 17 h »
      const cxk = V ? cx : w * 0.29;
      const cyk = V ? ly + U * 1.0 : ly;
      const ckA = bA * smooth(seg(lt, T.autre + 0.8, T.autre + 1.5));
      s05_clock(ctx, cxk, cyk, m * (V ? 0.06 : 0.055), lerp(0.25, 5 / 12, eInOutQuart(seg(lt, T.essentiel, T.dixsept + 0.6))), C.amber, ckA);
      mono(ctx, 'VENDREDI 17 H', cxk, cyk + m * (V ? 0.1 : 0.095), { size: Math.floor(m * 0.017), color: C.amber, spacing: 4, t: seg(lt, T.vendredi, T.vendredi + 0.6), alpha: ckA });
      // bien essentiel / billet de concert
      const ex = V ? cx : w * 0.86;
      const eY = ly;
      const esA = bA * env(lt, T.essentiel - 0.3, T.baisser + 0.2, 0.4, 0.5);
      if (esA > 0.003) {
        // billet barré
        const tw = m * 0.1;
        const th = m * 0.05;
        const tx = V ? cx + w * 0.3 : ex;
        const tyy = V ? cyk : eY;
        const tOn = smooth(seg(lt, T.concert - 0.2, T.concert + 0.4));
        ctx.save();
        ctx.globalAlpha *= esA * tOn;
        ctx.strokeStyle = rgba(C.slate, 0.8);
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(tx - tw / 2, tyy - th / 2, tw, th);
        ctx.setLineDash([]);
        ctx.restore();
        drawSprite(ctx, textSprite('CONCERT', { size: Math.floor(m * 0.016), weight: 600, fam: MONO, color: C.slate, spacing: 3 }), tx, tyy, { base: 'middle', alpha: esA * tOn });
        const cross = eInOutQuart(seg(lt, T.concert + 0.2, T.concert + 0.8));
        glowPath(ctx, [{ x: tx - tw * 0.6, y: tyy + th * 0.7 }, { x: tx + tw * 0.6, y: tyy - th * 0.7 }], cross, { color: C.red, width: 4, alpha: esA });
        kRise(ctx, 'UN BIEN ESSENTIEL', cx, V ? ly + U * 1.75 : ly + U * 0.78, { size: Math.floor(m * (V ? 0.06 : 0.05)), weight: 900, color: C.amber, t: seg(lt, T.essentiel - 0.1, T.essentiel + 0.8), alpha: esA, maxW: w * 0.9 });
      }
    }

    /* ── ACTE III : la balance ── */
    if (scaleT > 0.003) {
      const half = (w / 2) * (V ? 0.84 : 0.62);
      const pivotH = m * 0.07;
      ctx.save();
      ctx.globalAlpha *= scaleT;
      ctx.fillStyle = rgba(C.white, 0.9);
      ctx.beginPath();
      ctx.moveTo(cx, hy + 4);
      ctx.lineTo(cx - pivotH * 0.6, hy + pivotH);
      ctx.lineTo(cx + pivotH * 0.6, hy + pivotH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const endL = { x: cx - Math.cos(tilt) * half * 0.92, y: hy - Math.sin(tilt) * half * 0.92 };
      const endR = { x: cx + Math.cos(tilt) * half * 0.92, y: hy + Math.sin(tilt) * half * 0.92 };
      beacon(ctx, endL.x, endL.y, { color: C.emerald, r: 9, alpha: scaleT, time: gt });
      beacon(ctx, endR.x, endR.y, { color: C.amber, r: 9, alpha: scaleT, time: gt + 0.5 });
      const fs = Math.floor(m * (V ? 0.05 : 0.05));
      kRise(ctx, 'BAISSER', V ? cx - w * 0.22 : endL.x + m * 0.02, endL.y - m * 0.05, { size: fs, weight: 900, color: C.emerald, t: seg(lt, T.baisser, T.baisser + 0.8), alpha: scaleT, align: V ? 'center' : 'left' });
      kRise(ctx, 'GONFLER', V ? cx + w * 0.22 : endR.x - m * 0.02, endR.y - m * 0.05, { size: fs, weight: 900, color: C.amber, t: seg(lt, T.gonfler, T.gonfler + 0.8), alpha: scaleT, align: V ? 'center' : 'right', glow: 14, glowColor: rgba(C.amber, 0.4) });
      mono(ctx, 'LE MÊME OUTIL', cx, hy + pivotH + m * 0.045, { size: Math.floor(m * 0.022), color: C.slate, spacing: 8, t: seg(lt, T.baisser + 0.2, T.baisser + 1.0), alpha: scaleT });
    }
  });
}
/*@scene rep-deux-cotes-etiquettes=sceneDeuxCotesEtiquettes*/
