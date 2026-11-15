/* Acte I   : le Québec s'illumine sous un bouclier : l'une des protections les plus puissantes d'Amérique
 *            du Nord ; « POLITIQUE D'EXACTITUDE DES PRIX · BONIFIÉE EN MAI 2025 »
 * Acte II  : étiquette 3,99 $ vs caisse 4,99 $ ; le « 15 $ » d'or devient le nœud d'un arbre de décision :
 *            ≤ 15 $ → 0,00 $ GRATUIT ; > 15 $ → rabais immédiat de 15 $ sur le plus bas prix affiché
 * Acte III : de la maison au magasin, le reçu à la main : « REVENEZ AVEC VOTRE REÇU » */

function s11_house(ctx, x, y, s, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.fillStyle = rgba(color, 0.12);
  ctx.lineWidth = Math.max(2, s * 0.07);
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.3;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.6, y - s * 0.05);
  ctx.lineTo(x, y - s * 0.6);
  ctx.lineTo(x + s * 0.6, y - s * 0.05);
  ctx.lineTo(x + s * 0.48, y - s * 0.05);
  ctx.lineTo(x + s * 0.48, y + s * 0.5);
  ctx.lineTo(x - s * 0.48, y + s * 0.5);
  ctx.lineTo(x - s * 0.48, y - s * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeRect(x - s * 0.12, y + s * 0.15, s * 0.24, s * 0.35);
  ctx.restore();
}

function sceneRegle15(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    pourtant: 'Et pourtant',
    quebec: 'au Québec',
    mains: 'entre les mains',
    puissantes: 'les plus puissantes',
    amerique: 'Amérique du Nord',
    majorite: 'la majorité des gens',
    politique: "la Politique d'exactitude des prix",
    bonifiee: 'bonifiée',
    mai: 'en mai',
    scanne: 'le prix scanné',
    eleve: 'plus élevé',
    affiche: "le prix affiché sur l'étiquette",
    quinze: 'quinze dollars ou moins',
    remettre: 'vous le remettre',
    gratuit: 'gratuitement',
    plus: "Et s'il coûte plus",
    rabais: 'un rabais immédiat',
    basprix: 'le plus bas prix affiché',
    rentre: 'déjà rentré chez vous',
    revenir: 'vous pouvez revenir',
    recu: 'votre reçu'
  });

  const actI = 1 - smooth(seg(lt, T.scanne - 0.6, T.scanne + 0.2));
  const treeA = smooth(seg(lt, T.scanne - 0.4, T.scanne + 0.4)) * (1 - smooth(seg(lt, T.rentre - 0.4, T.rentre + 0.4)));
  const homeA = smooth(seg(lt, T.rentre - 0.3, T.rentre + 0.5));

  frame(a, () => {
    dust(ctx, stage, gt, { count: 70, alpha: 0.26, seed: 121 });

    /* ── ACTE I : le bouclier québécois ── */
    if (actI > 0.003) {
      const push = lerp(1, 1.08, smoother(seg(lt, 0, T.scanne)));
      const qx = V ? cx : w * 0.34;
      const qy = V ? h * 0.42 : h * 0.55;
      ctx.save();
      ctx.translate(qx, qy);
      ctx.scale(push, push);
      ctx.translate(-qx, -qy);
      const sc = m * (V ? 0.017 : 0.016);
      const Pj = makeFlat(-80, 52, sc, qx, qy);
      drawDots(ctx, Pj, regionDots('na11', -128, -52, 26, 66, 0.7), { color: C.slate, size: sc * 0.28, alpha: 0.32 * actI, fade: { x: qx, y: qy, r: m * (V ? 0.55 : 0.6) } });
      const qon = seg(lt, T.quebec - 0.3, T.quebec + 1.2);
      drawQuebec(ctx, Pj, { color: C.cyan, alpha: actI, draw: eInOutQuart(qon), fill: 0.22 });
      const qc = Pj.project(-72, 52);
      shield(ctx, qc.x, qc.y, m * (V ? 0.13 : 0.12), { color: C.amber, alpha: actI * smooth(seg(lt, T.mains - 0.2, T.mains + 0.6)), draw: eInOutQuart(seg(lt, T.mains - 0.2, T.puissantes + 0.6)), time: gt, fill: 0.1 });
      ctx.restore();
      const tx = V ? cx : w * 0.7;
      const ty = V ? h * 0.72 : h * 0.36;
      const swap = smooth(seg(lt, T.politique - 0.4, T.politique));
      mono(ctx, 'AU QUÉBEC, ENTRE VOS MAINS', tx, ty - m * 0.07, { size: Math.floor(m * 0.019), color: C.ice, spacing: 5, t: seg(lt, T.quebec, T.mains + 0.8), alpha: actI * (1 - swap) });
      kRise(ctx, "L'UNE DES PLUS", tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.puissantes - 0.3, T.puissantes + 0.6), out: swap, alpha: actI });
      kRise(ctx, 'PUISSANTES', tx, ty + m * 0.065, { size: Math.floor(m * 0.05), weight: 900, color: C.amber, t: seg(lt, T.puissantes, T.puissantes + 0.8), out: swap, alpha: actI, glow: 16, glowColor: rgba(C.amber, 0.4) });
      mono(ctx, "PROTECTIONS D'AMÉRIQUE DU NORD", tx, ty + m * 0.12, { size: Math.floor(m * 0.018), color: C.slate, spacing: 4, t: seg(lt, T.amerique - 0.3, T.amerique + 0.8), alpha: actI * (1 - swap) });
      mono(ctx, 'ET LA MAJORITÉ L’IGNORE', tx, ty + m * 0.165, { size: Math.floor(m * 0.019), color: C.coral, spacing: 5, t: seg(lt, T.majorite, T.majorite + 0.9), alpha: actI * (1 - swap) });
      kWipe(ctx, 'POLITIQUE', tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.politique, T.politique + 0.7), alpha: actI * swap, edge: C.amber });
      kWipe(ctx, "D'EXACTITUDE DES PRIX", tx, ty + m * 0.065, { size: Math.floor(m * 0.05), weight: 900, color: C.cyan, t: seg(lt, T.politique + 0.3, T.politique + 1.1), alpha: actI * swap, edge: C.amber, maxW: V ? w * 0.9 : w * 0.5 });
      mono(ctx, 'BONIFIÉE · MAI 2025', tx, ty + m * 0.125, { size: Math.floor(m * 0.022), color: C.amber, spacing: 7, t: seg(lt, T.bonifiee, T.mai + 1.0), alpha: actI * swap });
    }

    /* ── ACTE II : l'arbre de décision ── */
    if (treeA > 0.003) {
      const rise = (1 - eOutExpo(seg(lt, T.scanne - 0.4, T.scanne + 1.2))) * h * 0.12;
      const topY = (V ? h * 0.17 : h * 0.2) + rise;
      // étiquette vs caisse
      const cA = treeA * (1 - smooth(seg(lt, T.rentre - 0.6, T.rentre)));
      const lx = cx - m * (V ? 0.23 : 0.2);
      const rx = cx + m * (V ? 0.23 : 0.2);
      const fs = Math.floor(m * 0.06);
      const labOn = seg(lt, T.affiche - 0.3, T.affiche + 0.6);
      const scnOn = seg(lt, T.scanne - 0.2, T.scanne + 0.6);
      mono(ctx, 'ÉTIQUETTE', lx, topY - m * 0.07, { size: Math.floor(m * 0.018), color: C.slate, spacing: 5, t: labOn, alpha: cA });
      kSlide(ctx, '3,99 $', lx, topY, { size: fs, weight: 900, color: C.white, t: labOn, alpha: cA });
      mono(ctx, 'CAISSE', rx, topY - m * 0.07, { size: Math.floor(m * 0.018), color: C.cyan, spacing: 5, t: scnOn, alpha: cA });
      kSlide(ctx, '4,99 $', rx, topY, { size: fs, weight: 900, color: C.cyan, t: scnOn, alpha: cA, glow: 16, glowColor: rgba(C.cyan, 0.5) });
      const neq = smooth(seg(lt, T.eleve - 0.1, T.eleve + 0.5));
      drawSprite(ctx, textSprite('≠', { size: Math.floor(m * 0.06), weight: 900, color: C.coral }), cx, topY, { alpha: cA * neq, scale: lerp(1.6, 1, eOutExpo(seg(lt, T.eleve - 0.1, T.eleve + 0.5))) });
      if (neq > 0) shockwave(ctx, rx, topY - fs * 0.35, m * 0.12, lt - T.eleve, { color: C.cyan, count: 2, period: 1.2, alpha: cA * (1 - smooth(seg(lt, T.eleve + 1, T.eleve + 2))) });
      // le nœud « 15 $ »
      const nx = cx;
      const ny = V ? h * 0.36 + rise : h * 0.45 + rise;
      const nOn = seg(lt, T.quinze - 0.4, T.quinze + 0.6);
      const nfs = Math.floor(m * (V ? 0.14 : 0.13));
      if (nOn > 0) {
        light(ctx, nx, ny - nfs * 0.35, m * 0.22, C.amber, treeA * 0.5 * smooth(nOn));
        kZoom(ctx, '15 $', nx, ny, { size: nfs, weight: 900, color: C.gold, t: nOn, alpha: treeA, from: 1.6, glow: 26, glowColor: rgba(C.amber, 0.6) });
        // reflet anodisé qui balaie le chiffre
        const sweep = seg(lt, T.quinze + 0.5, T.quinze + 1.6);
        if (sweep > 0 && sweep < 1) flare(ctx, lerp(nx - nfs, nx + nfs, sweep), ny - nfs * 0.4, m * 0.05, C.gold, treeA * Math.sin(sweep * Math.PI));
      }
      // branches
      const bY = V ? h * 0.64 + rise : h * 0.74 + rise;
      const bL = V ? w * 0.26 : w * 0.27;
      const bR = V ? w * 0.74 : w * 0.73;
      const brL = eInOutQuart(seg(lt, T.quinze + 0.3, T.quinze + 1.2));
      const brR = eInOutQuart(seg(lt, T.plus - 0.2, T.plus + 0.7));
      const from = { x: nx, y: ny + m * 0.03 };
      glowPath(ctx, quadPts(from, { x: bL, y: bY - m * 0.13 }, -m * 0.05, 30), brL, { color: C.emerald, width: 3, alpha: treeA });
      glowPath(ctx, quadPts(from, { x: bR, y: bY - m * 0.13 }, m * 0.05, 30), brR, { color: C.amber, width: 3, alpha: treeA });
      // ≤ 15 $ → GRATUIT
      const lA = treeA * smooth(seg(brL, 0.7, 1));
      if (lA > 0.003) {
        kSlide(ctx, '≤ 15 $', bL, bY - m * 0.07, { size: Math.floor(m * 0.044), weight: 900, color: C.emerald, t: seg(lt, T.quinze + 0.6, T.quinze + 1.3), alpha: lA });
        const v = lerp(4.99, 0, eInOutQuart(seg(lt, T.gratuit - 0.5, T.gratuit + 0.6)));
        odometer(ctx, v, bL, bY + m * 0.03, { size: Math.floor(m * (V ? 0.07 : 0.07)), weight: 900, color: C.white, dec: 2, suffix: ' $', suffixScale: 0.55, alpha: lA });
        const st = seg(lt, T.gratuit + 0.2, T.gratuit + 0.6);
        if (st > 0) {
          const sc = lerp(1.8, 1, eOutExpo(st));
          ctx.save();
          ctx.globalAlpha *= lA * clamp(st * 3);
          ctx.translate(bL, bY + m * 0.13);
          ctx.rotate(-0.08);
          ctx.scale(sc, sc);
          ctx.strokeStyle = C.emerald;
          ctx.lineWidth = 4;
          ctx.shadowColor = C.emerald;
          ctx.shadowBlur = 14;
          rrect(ctx, -m * 0.12, -m * 0.035, m * 0.24, m * 0.07, m * 0.012);
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.translate(bL, bY + m * 0.13);
          ctx.rotate(-0.08);
          ctx.scale(sc, sc);
          drawSprite(ctx, textSprite('GRATUIT', { size: Math.floor(m * 0.042), weight: 900, color: C.emerald, spacing: 4 }), 0, 0, { base: 'middle', alpha: lA * clamp(st * 3) });
          ctx.restore();
        }
      }
      // > 15 $ → rabais de 15 $
      const rA = treeA * smooth(seg(brR, 0.7, 1));
      if (rA > 0.003) {
        kSlide(ctx, '> 15 $', bR, bY - m * 0.07, { size: Math.floor(m * 0.044), weight: 900, color: C.amber, t: seg(lt, T.plus + 0.4, T.plus + 1.1), alpha: rA });
        const v = lerp(22.99, 7.99, eInOutQuart(seg(lt, T.rabais - 0.2, T.rabais + 1.0)));
        odometer(ctx, v, bR, bY + m * 0.03, { size: Math.floor(m * 0.07), weight: 900, color: C.white, dec: 2, suffix: ' $', suffixScale: 0.55, alpha: rA });
        kSlide(ctx, '− 15,00 $', bR, bY + m * 0.11, { size: Math.floor(m * 0.04), weight: 900, color: C.amber, t: seg(lt, T.rabais, T.rabais + 0.7), alpha: rA, glow: 14, glowColor: rgba(C.amber, 0.45) });
        mono(ctx, 'SUR LE PLUS BAS PRIX AFFICHÉ', bR, bY + m * 0.165, { size: Math.floor(m * (V ? 0.014 : 0.016)), color: C.gold, spacing: 2, t: seg(lt, T.basprix - 0.2, T.basprix + 1.0), alpha: rA });
      }
      mono(ctx, 'PRIX DONNÉS EN EXEMPLE', cx, V ? h * 0.83 : h * 0.93, { size: Math.floor(m * 0.014), color: C.slate, spacing: 3, t: seg(lt, T.quinze, T.quinze + 1), alpha: treeA * 0.6 });
    }

    /* ── ACTE III : revenez avec votre reçu ── */
    if (homeA > 0.003) {
      const hx = V ? w * 0.2 : w * 0.24;
      const sx = V ? w * 0.8 : w * 0.76;
      const yy = V ? h * 0.36 : h * 0.42;
      s11_house(ctx, hx, yy, m * 0.09, C.ice, homeA);
      // magasin
      ctx.save();
      ctx.globalAlpha *= homeA;
      ctx.strokeStyle = C.emerald;
      ctx.lineWidth = 3;
      ctx.shadowColor = C.emerald;
      ctx.shadowBlur = 12;
      ctx.strokeRect(sx - m * 0.07, yy - m * 0.05, m * 0.14, m * 0.1);
      ctx.beginPath();
      ctx.moveTo(sx - m * 0.085, yy - m * 0.05);
      ctx.lineTo(sx + m * 0.085, yy - m * 0.05);
      ctx.stroke();
      ctx.restore();
      // trajet pointillé avec le reçu qui voyage
      const path = quadPts({ x: hx + m * 0.08, y: yy }, { x: sx - m * 0.09, y: yy }, -m * 0.12, 60);
      const tr = eInOutQuart(seg(lt, T.revenir - 0.3, T.recu + 0.6));
      ctx.save();
      ctx.globalAlpha *= homeA * 0.6;
      ctx.strokeStyle = C.slate;
      ctx.setLineDash([6, 10]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.restore();
      const rp = along(path, tr);
      const rw = m * 0.06;
      ctx.save();
      ctx.globalAlpha *= homeA;
      ctx.translate(rp.x, rp.y - m * 0.04);
      ctx.rotate(Math.sin(lt * 3) * 0.05);
      ctx.fillStyle = '#E8EDF3';
      ctx.fillRect(-rw / 2, -rw * 0.7, rw, rw * 1.4);
      ctx.fillStyle = rgba('#0B1220', 0.55);
      for (let k = 0; k < 5; k++) ctx.fillRect(-rw * 0.35, -rw * 0.5 + k * rw * 0.22, rw * 0.7, rw * 0.06);
      ctx.restore();
      const ck = smooth(seg(lt, T.recu + 0.3, T.recu + 0.8));
      if (ck > 0) {
        light(ctx, sx, yy - m * 0.1, m * 0.08, C.emerald, homeA * ck * 0.6);
        glowPath(ctx, [{ x: sx - m * 0.03, y: yy - m * 0.11 }, { x: sx - m * 0.008, y: yy - m * 0.085 }, { x: sx + m * 0.035, y: yy - m * 0.14 }], eInOutQuart(ck), { color: C.emerald, width: 5, alpha: homeA });
      }
      mono(ctx, 'DÉJÀ RENTRÉ CHEZ VOUS ?', hx, yy + m * 0.1, { size: Math.floor(m * 0.017), color: C.ice, spacing: 3, t: seg(lt, T.rentre, T.rentre + 0.8), alpha: homeA });
      const ty = V ? h * 0.62 : h * 0.72;
      kRise(ctx, 'REVENEZ AVEC', cx, ty, { size: Math.floor(m * (V ? 0.07 : 0.064)), weight: 900, t: seg(lt, T.revenir - 0.1, T.revenir + 0.7), alpha: homeA });
      kRise(ctx, 'VOTRE REÇU', cx, ty + m * 0.08, { size: Math.floor(m * (V ? 0.07 : 0.064)), weight: 900, color: C.emerald, t: seg(lt, T.recu - 0.2, T.recu + 0.6), alpha: homeA, glow: 18, glowColor: rgba(C.emerald, 0.45) });
    }
  });
}
/*@scene rep-regle-15-dollars-opc=sceneRegle15*/
