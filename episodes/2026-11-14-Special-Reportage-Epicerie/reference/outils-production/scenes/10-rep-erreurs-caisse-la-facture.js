/* Acte I   : tapis de caisse en perspective, articles qui défilent, faisceau laser ; prix tablette vs scanné
 * Acte II  : « 50 / 50 » barré ; histogramme des écarts : le côté « + » s'empile, le côté « − » reste vide ;
 *            la base bascule comme une balance : EN FAVEUR DU COMMERÇANT
 * Acte III : reçu numérique qui se déroule, écarts additionnés ; borne libre-service ; tampon REFUSÉ */

const S10_ITEMS = [
  { kind: 'box', col: C.amber, shelf: 3.49, scan: 3.99 },
  { kind: 'bottle', col: C.cyan, shelf: 2.29, scan: 2.29 },
  { kind: 'can', col: C.coral, shelf: 1.79, scan: 2.79 },
  { kind: 'box', col: C.emerald, shelf: 5.99, scan: 5.99 },
  { kind: 'bottle', col: C.violet, shelf: 4.49, scan: 6.99 },
  { kind: 'can', col: C.ice, shelf: 2.99, scan: 3.49 }
];

function s10_item(ctx, kind, x, y, s, col, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(x - s, 0, x + s, 0);
  g.addColorStop(0, mix(col, C.night, 0.55));
  g.addColorStop(0.5, mix(col, C.night, 0.2));
  g.addColorStop(1, mix(col, C.night, 0.6));
  ctx.fillStyle = g;
  ctx.strokeStyle = rgba(C.white, 0.35);
  ctx.lineWidth = 1.5;
  if (kind === 'box') {
    ctx.fillRect(x - s * 0.55, y - s * 1.3, s * 1.1, s * 1.3);
    ctx.strokeRect(x - s * 0.55, y - s * 1.3, s * 1.1, s * 1.3);
    ctx.fillStyle = rgba(C.white, 0.6);
    ctx.fillRect(x - s * 0.35, y - s * 0.9, s * 0.7, s * 0.25);
  } else if (kind === 'bottle') {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.12, y - s * 1.7);
    ctx.lineTo(x + s * 0.12, y - s * 1.7);
    ctx.lineTo(x + s * 0.12, y - s * 1.35);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 1.2, x + s * 0.4, y - s * 0.9);
    ctx.lineTo(x + s * 0.4, y);
    ctx.lineTo(x - s * 0.4, y);
    ctx.lineTo(x - s * 0.4, y - s * 0.9);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 1.2, x - s * 0.12, y - s * 1.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(x - s * 0.4, y - s * 0.95, s * 0.8, s * 0.95);
    ctx.strokeRect(x - s * 0.4, y - s * 0.95, s * 0.8, s * 0.95);
    ctx.fillStyle = rgba(C.white, 0.5);
    ctx.fillRect(x - s * 0.4, y - s * 0.62, s * 0.8, s * 0.16);
  }
  ctx.restore();
}

function sceneErreursCaisse(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    concret: 'le plus concret',
    semaine: 'de votre semaine',
    lecteur: 'le lecteur optique',
    caisse: 'à la caisse',
    enquete: 'Une enquête répétée',
    union: 'Union des consommateurs',
    troublant: 'phénomène troublant',
    erreurs: 'les erreurs de prix',
    tablette: 'entre la tablette',
    jamais: 'presque jamais',
    cinquante: 'cinquante-cinquante',
    rarissime: 'Il est rarissime',
    moins: 'moins cher par erreur',
    ecart: "l'écart joue",
    syst: 'quasi systématiquement',
    faveur: 'en faveur du commerçant',
    pire: 'Pire encore',
    auto: 'de plus en plus automatisées',
    hebdo: 'hebdomadaires',
    milliers: 'par milliers',
    refus: 'des refus',
    reclamer: 'osent réclamer'
  });

  const beltA = 1 - smooth(seg(lt, T.erreurs - 0.6, T.erreurs + 0.3));
  const histA = smooth(seg(lt, T.erreurs - 0.4, T.erreurs + 0.4)) * (1 - smooth(seg(lt, T.pire - 0.4, T.pire + 0.4)));
  const recA = smooth(seg(lt, T.pire - 0.2, T.pire + 0.6));

  frame(a, () => {
    dust(ctx, stage, gt, { count: 60, alpha: 0.22, seed: 110 });

    /* ── ACTE I : le tapis de caisse ── */
    if (beltA > 0.003) {
      const by = V ? h * 0.46 : h * 0.68;
      const bx0 = V ? -w * 0.05 : w * 0.04;
      const bx1 = V ? w * 1.05 : w * 0.96;
      const dep = m * 0.15; // profondeur du tapis
      const scanX = V ? cx : w * 0.56;
      const travel = (lt - 1.0) * m * 0.16; // défilement
      ctx.save();
      ctx.globalAlpha *= beltA;
      // tapis (parallélogramme en perspective) avec stries qui défilent
      ctx.fillStyle = '#0B1320';
      ctx.beginPath();
      ctx.moveTo(bx0 + dep, by - dep * 0.6);
      ctx.lineTo(bx1 + dep, by - dep * 0.6);
      ctx.lineTo(bx1, by + dep * 0.4);
      ctx.lineTo(bx0, by + dep * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(C.slate, 0.12);
      ctx.lineWidth = 2;
      const stripe = m * 0.05;
      for (let x = bx0 - stripe + ((travel % stripe) + stripe) % stripe; x < bx1; x += stripe) {
        ctx.beginPath();
        ctx.moveTo(x + dep, by - dep * 0.6);
        ctx.lineTo(x, by + dep * 0.4);
        ctx.stroke();
      }
      ctx.strokeStyle = rgba(C.cyan, 0.4);
      ctx.beginPath();
      ctx.moveTo(bx0, by + dep * 0.4);
      ctx.lineTo(bx1, by + dep * 0.4);
      ctx.stroke();
      ctx.restore();
      // articles qui défilent (gauche → droite)
      const spacing = m * (V ? 0.3 : 0.34);
      const loop = spacing * S10_ITEMS.length;
      const itemX = (i) => bx0 - spacing + ((((travel - i * spacing + spacing * 5.2) % loop) + loop) % loop);
      S10_ITEMS.forEach((it, i) => {
        const x = itemX(i);
        if (x < bx0 - m * 0.1 || x > bx1 + m * 0.1) return;
        const near = Math.exp(-Math.pow((x - scanX) / (m * 0.05), 2));
        s10_item(ctx, it.kind, x + dep * 0.4, by - dep * 0.1, m * 0.085, it.col, beltA);
        if (near > 0.05) light(ctx, x + dep * 0.4, by - m * 0.04, m * 0.12, C.cyan, near * beltA * 0.8);
      });
      // scanner : fenêtre + éventail laser
      const lA = beltA * smooth(seg(lt, T.lecteur - 0.4, T.lecteur + 0.3));
      ctx.save();
      ctx.globalAlpha *= lA;
      ctx.globalCompositeOperation = 'lighter';
      for (let k = -3; k <= 3; k++) {
        const an = -Math.PI / 2 + k * 0.12 + Math.sin(gt * 6 + k) * 0.03;
        const L = m * 0.3;
        const g = ctx.createLinearGradient(scanX, by, scanX + Math.cos(an) * L, by + Math.sin(an) * L);
        g.addColorStop(0, rgba(C.cyan, 0.85));
        g.addColorStop(1, rgba(C.cyan, 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(scanX, by + dep * 0.1);
        ctx.lineTo(scanX + Math.cos(an) * L, by + Math.sin(an) * L);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= lA;
      ctx.fillStyle = rgba(C.cyan, 0.25);
      ctx.fillRect(scanX - m * 0.05, by - dep * 0.05, m * 0.1, dep * 0.25);
      ctx.restore();
      // afficheur : prix tablette vs prix scanné (article sous le laser)
      const idx = S10_ITEMS.findIndex((it, i) => Math.abs(itemX(i) - scanX) < spacing / 2);
      const dA = lA * smooth(seg(lt, T.caisse - 0.2, T.caisse + 0.6));
      if (idx >= 0 && dA > 0.003) {
        const it = S10_ITEMS[idx];
        const dist = Math.abs(itemX(idx) - scanX) / (spacing / 2);
        const sel = 1 - smooth(seg(dist, 0.55, 0.95));
        const dx = scanX;
        const dyy = V ? by + m * 0.36 : by - m * 0.3;
        const fs = Math.floor(m * 0.056);
        const off = it.scan > it.shelf;
        const dA2 = dA * sel;
        mono(ctx, 'TABLETTE', dx - m * 0.15, dyy - m * 0.075, { size: Math.floor(m * 0.017), color: C.slate, spacing: 4, alpha: dA, cursor: false });
        mono(ctx, 'CAISSE', dx + m * 0.15, dyy - m * 0.075, { size: Math.floor(m * 0.017), color: C.slate, spacing: 4, alpha: dA, cursor: false });
        odometer(ctx, it.shelf, dx - m * 0.15, dyy, { size: fs, weight: 900, color: C.white, dec: 2, suffix: ' $', suffixScale: 0.6, alpha: dA2, roll: false });
        odometer(ctx, it.scan, dx + m * 0.15, dyy, { size: fs, weight: 900, color: off ? C.amber : C.white, dec: 2, suffix: ' $', suffixScale: 0.6, alpha: dA2, roll: false });
        if (off) light(ctx, dx + m * 0.15, dyy - fs * 0.35, m * 0.08, C.amber, dA2 * 0.5);
      }
      const ty = V ? h * 0.17 : h * 0.17;
      const sw = smooth(seg(lt, T.enquete - 0.3, T.enquete + 0.1));
      mono(ctx, 'LE MOMENT DE VOTRE SEMAINE', cx, ty - m * 0.06, { size: Math.floor(m * (V ? 0.016 : 0.018)), color: C.ice, spacing: 4, t: seg(lt, T.concret, T.semaine + 1.0), alpha: beltA * (1 - sw) });
      const sw0 = smooth(seg(lt, T.lecteur - 0.4, T.lecteur));
      kRise(ctx, 'LE PLUS CONCRET', cx, ty, { size: Math.floor(m * 0.07), weight: 900, color: C.ice, t: seg(lt, T.concret - 0.2, T.concret + 0.7), out: sw0, alpha: beltA });
      kRise(ctx, 'À LA CAISSE', cx, ty, { size: Math.floor(m * 0.07), weight: 900, t: seg(lt, T.lecteur - 0.1, T.caisse + 0.6), out: sw, alpha: beltA });
      mono(ctx, 'ENQUÊTE RÉPÉTÉE · UNION DES CONSOMMATEURS', cx, ty - m * 0.06, { size: Math.floor(m * (V ? 0.016 : 0.018)), color: C.amber, spacing: 4, t: seg(lt, T.enquete, T.union + 1.0), alpha: beltA * sw });
      kRise(ctx, 'UN PHÉNOMÈNE TROUBLANT', cx, ty, { size: Math.floor(m * (V ? 0.056 : 0.06)), weight: 900, t: seg(lt, T.troublant - 0.2, T.troublant + 0.8), alpha: beltA * sw, maxW: w * 0.9 });
    }

    /* ── ACTE II : 50/50 barré et histogramme qui bascule ── */
    if (histA > 0.003) {
      const hx = cx;
      const hy = V ? h * 0.6 : h * 0.68;
      const hw = V ? w * 0.84 : w * 0.56;
      const tilt = eInOutQuart(seg(lt, T.faveur - 0.4, T.faveur + 0.8)) * 0.09 + Math.sin((lt - T.faveur) * 3) * 0.008 * smooth(seg(lt, T.faveur, T.faveur + 1));
      const bins = [
        { lab: '−2,50', v: 0.03, sign: -1 },
        { lab: '−1,00', v: 0.05, sign: -1 },
        { lab: '−0,50', v: 0.07, sign: -1 },
        { lab: '+0,50', v: 0.62, sign: 1 },
        { lab: '+1,00', v: 0.86, sign: 1 },
        { lab: '+2,50', v: 0.55, sign: 1 }
      ];
      const maxH = V ? h * 0.27 : h * 0.4;
      const bwid = hw / 7.5;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(tilt);
      // fléau / base
      ctx.save();
      ctx.globalAlpha *= histA;
      ctx.fillStyle = rgba(C.white, 0.9);
      ctx.fillRect(-hw / 2, -1.5, hw * eOutExpo(seg(lt, T.erreurs, T.erreurs + 0.9)), 3);
      ctx.restore();
      bins.forEach((b, i) => {
        const x = -hw / 2 + (i + (i >= 3 ? 1.5 : 0.5)) * bwid + bwid * 0.25;
        const k = b.sign < 0 ? seg(lt, T.rarissime - 0.2, T.moins + 0.8) : seg(lt, T.jamais - 0.4 + (i - 3) * 0.25, T.jamais + 0.9 + (i - 3) * 0.25);
        const hh = maxH * b.v * eOutExpo(k);
        const col = b.sign < 0 ? C.emerald : C.amber;
        ctx.save();
        ctx.globalAlpha *= histA;
        const g = ctx.createLinearGradient(0, -hh, 0, 0);
        g.addColorStop(0, col);
        g.addColorStop(1, mix(col, C.night, 0.55));
        ctx.fillStyle = g;
        ctx.shadowColor = col;
        ctx.shadowBlur = 14;
        ctx.fillRect(x - bwid * 0.38, -hh, bwid * 0.76, hh);
        ctx.restore();
        drawSprite(ctx, textSprite(b.lab + ' $', { size: Math.floor(m * 0.017), weight: 600, fam: MONO, color: b.sign < 0 ? C.mint : C.gold, spacing: 1 }), x, m * 0.04, { alpha: histA * smooth(seg(lt, T.erreurs + 0.3 + i * 0.08, T.erreurs + 0.9 + i * 0.08)) });
      });
      // pivot
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= histA * smooth(seg(lt, T.faveur - 0.5, T.faveur));
      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 6);
      ctx.lineTo(hx - m * 0.03, hy + m * 0.07);
      ctx.lineTo(hx + m * 0.03, hy + m * 0.07);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // 50 / 50 barré
      const fA = histA * env(lt, T.jamais - 0.4, T.rarissime + 0.4, 0.4, 0.6);
      const fy = V ? h * 0.24 : h * 0.24;
      kZoom(ctx, '50 / 50', cx, fy, { size: Math.floor(m * 0.1), weight: 900, color: C.slate, t: seg(lt, T.jamais - 0.3, T.jamais + 0.6), alpha: fA });
      const cross = eInOutQuart(seg(lt, T.cinquante + 0.2, T.cinquante + 0.9));
      glowPath(ctx, [{ x: cx - m * 0.22, y: fy + m * 0.01 }, { x: cx + m * 0.22, y: fy - m * 0.08 }], cross, { color: C.red, width: 6, alpha: fA });
      const tA = histA * smooth(seg(lt, T.rarissime - 0.2, T.rarissime + 0.4));
      const sw = smooth(seg(lt, T.ecart - 0.3, T.ecart + 0.1));
      kRise(ctx, 'RARISSIME', V ? cx - w * 0.22 : cx - hw * 0.3, fy, { size: Math.floor(m * 0.044), weight: 900, color: C.emerald, t: seg(lt, T.rarissime, T.rarissime + 0.8), out: sw, alpha: tA * smooth(seg(lt, T.rarissime + 0.3, T.rarissime + 0.5)) });
      mono(ctx, 'MOINS CHER PAR ERREUR', V ? cx - w * 0.22 : cx - hw * 0.3, fy + m * 0.045, { size: Math.floor(m * 0.016), color: C.mint, spacing: 3, t: seg(lt, T.moins, T.moins + 0.8), alpha: tA * (1 - sw) });
      kRise(ctx, 'EN FAVEUR', cx, fy - m * 0.03, { size: Math.floor(m * (V ? 0.066 : 0.062)), weight: 900, color: C.amber, t: seg(lt, T.faveur - 0.1, T.faveur + 0.7), alpha: histA * sw, glow: 20, glowColor: rgba(C.amber, 0.45) });
      kRise(ctx, 'DU COMMERÇANT', cx, fy + m * 0.045, { size: Math.floor(m * (V ? 0.066 : 0.062)), weight: 900, t: seg(lt, T.faveur + 0.2, T.faveur + 1.0), alpha: histA * sw });
      mono(ctx, 'QUASI SYSTÉMATIQUEMENT', cx, fy - m * 0.11, { size: Math.floor(m * 0.019), color: C.gold, spacing: 6, t: seg(lt, T.syst, T.syst + 0.9), alpha: histA * sw });
      mono(ctx, 'ÉCARTS TABLETTE ↔ CAISSE · ILLUSTRATION', cx, hy + m * 0.11, { size: Math.floor(m * 0.015), color: C.slate, spacing: 3, t: seg(lt, T.tablette, T.tablette + 1.0), alpha: histA * 0.75 });
    }

    /* ── ACTE III : le reçu, la borne, le refus ── */
    if (recA > 0.003) {
      const rx = V ? cx : w * 0.36;
      const rTop = V ? h * 0.18 : h * 0.12;
      const rw = V ? w * 0.5 : w * 0.2;
      const unroll = eInOutQuart(seg(lt, T.pire - 0.1, T.milliers + 0.4));
      const rh = (V ? h * 0.44 : h * 0.72) * unroll;
      ctx.save();
      ctx.globalAlpha *= recA;
      light(ctx, rx, rTop + rh * 0.5, rw * 1.4, C.ice, 0.15);
      const g = ctx.createLinearGradient(0, rTop, 0, rTop + rh);
      g.addColorStop(0, '#EEF2F6');
      g.addColorStop(1, '#D3DBE4');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(rx - rw / 2, rTop);
      ctx.lineTo(rx + rw / 2, rTop);
      ctx.lineTo(rx + rw / 2, rTop + rh);
      for (let k = 0; k < 10; k++) ctx.lineTo(rx + rw / 2 - (k + 0.5) * (rw / 10), rTop + rh + (k % 2 ? 0 : m * 0.012));
      ctx.lineTo(rx - rw / 2, rTop + rh);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const lines = 9;
      const lh = (V ? h * 0.44 : h * 0.72) / (lines + 3);
      let over = 0;
      for (let k = 0; k < lines; k++) {
        const ly = rTop + lh * (k + 1.2);
        if (ly > rTop + rh - lh * 0.4) break;
        const extra = [0.5, 0, 1, 0, 2.5, 0.5, 0, 1, 0.5][k];
        over += extra;
        ctx.save();
        ctx.globalAlpha *= recA;
        ctx.fillStyle = rgba('#0B1220', 0.6);
        ctx.fillRect(rx - rw * 0.42, ly - lh * 0.18, rw * 0.46, lh * 0.18);
        ctx.fillRect(rx + rw * 0.16, ly - lh * 0.18, rw * 0.24, lh * 0.18);
        ctx.restore();
        if (extra > 0) {
          drawSprite(ctx, textSprite('+' + frNum(extra, 2), { size: Math.floor(m * 0.017), weight: 700, fam: MONO, color: '#B45309', spacing: 1 }), rx + rw * 0.44, ly - lh * 0.05, { align: 'right', alpha: recA });
        }
      }
      const totY = rTop + rh - lh * 0.6;
      const totA = recA * smooth(seg(unroll, 0.85, 1));
      mono(ctx, 'ÉCARTS', rx - rw * 0.42, totY, { size: Math.floor(m * 0.016), color: '#334155', spacing: 3, align: 'left', alpha: totA, cursor: false });
      odometer(ctx, over * smooth(seg(unroll, 0.85, 1)), rx + rw * 0.44, totY + m * 0.012, { size: Math.floor(m * 0.032), weight: 900, color: '#B45309', dec: 2, prefix: '+', suffix: ' $', suffixScale: 0.6, align: 'right', alpha: totA });
      // tampon REFUSÉ
      const st = seg(lt, T.refus - 0.05, T.refus + 0.4);
      if (st > 0) {
        const sc = lerp(2.2, 1, eOutExpo(st));
        ctx.save();
        ctx.globalAlpha *= recA * clamp(st * 3);
        ctx.translate(rx - rw * 0.12, rTop + (V ? h * 0.22 : h * 0.36));
        ctx.rotate(-0.18);
        ctx.scale(sc, sc);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 5;
        ctx.strokeRect(-m * 0.15, -m * 0.045, m * 0.3, m * 0.09);
        ctx.restore();
        ctx.save();
        ctx.translate(rx - rw * 0.12, rTop + (V ? h * 0.22 : h * 0.36));
        ctx.rotate(-0.18);
        ctx.scale(sc, sc);
        drawSprite(ctx, textSprite('REFUSÉ', { size: Math.floor(m * 0.05), weight: 900, color: C.red, spacing: 6 }), 0, 0, { base: 'middle', alpha: recA * clamp(st * 3) });
        ctx.restore();
      }
      // borne libre-service + textes
      const kx = V ? cx : w * 0.7;
      const ky = V ? h * 0.79 : h * 0.4;
      const kA = recA * smooth(seg(lt, T.auto - 0.3, T.auto + 0.5));
      if (kA > 0.003 && !V) {
        ctx.save();
        ctx.globalAlpha *= kA;
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = C.cyan;
        ctx.shadowBlur = 12;
        rrect(ctx, kx - m * 0.06, ky - m * 0.1, m * 0.12, m * 0.09, m * 0.01);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(kx, ky - m * 0.01);
        ctx.lineTo(kx, ky + m * 0.1);
        ctx.moveTo(kx - m * 0.05, ky + m * 0.1);
        ctx.lineTo(kx + m * 0.05, ky + m * 0.1);
        ctx.stroke();
        ctx.restore();
      }
      const tx = V ? cx : w * 0.7;
      const ty0 = V ? h * 0.12 : ky + m * 0.2;
      kRise(ctx, 'PIRE ENCORE', tx, V ? h * 0.13 : h * 0.18, { size: Math.floor(m * 0.05), weight: 900, color: C.coral, t: seg(lt, T.pire - 0.1, T.pire + 0.6), alpha: recA });
      mono(ctx, 'CAISSES AUTOMATISÉES', tx, V ? h * 0.68 : ty0, { size: Math.floor(m * 0.02), color: C.cyan, spacing: 5, t: seg(lt, T.auto, T.auto + 0.8), alpha: recA });
      mono(ctx, 'DES MILLIERS DE CHANGEMENTS DE PRIX', tx, V ? h * 0.71 : ty0 + m * 0.045, { size: Math.floor(m * (V ? 0.017 : 0.018)), color: C.ice, spacing: 3, t: seg(lt, T.hebdo - 0.2, T.milliers + 0.8), alpha: recA });
      mono(ctx, 'CHAQUE SEMAINE', tx, V ? h * 0.735 : ty0 + m * 0.085, { size: Math.floor(m * 0.017), color: C.ice, spacing: 5, t: seg(lt, T.hebdo, T.hebdo + 0.8), alpha: recA });
      kRise(ctx, 'QUAND ON OSE RÉCLAMER', tx, V ? h * 0.8 : ty0 + m * 0.18, { size: Math.floor(m * (V ? 0.042 : 0.036)), weight: 900, color: C.white, t: seg(lt, T.reclamer - 0.3, T.reclamer + 0.6), alpha: recA, maxW: V ? w * 0.9 : w * 0.5 });
    }
  });
}
/*@scene rep-erreurs-caisse-la-facture=sceneErreursCaisse*/
