/* Acte I   : une diagonale tranche l'écran : PROMOTEURS (cyan) / ÉCONOMISTES (ambre)
 *            côté cyan : un supermarché de banlieue se construit ; des dizaines de millions ; le bouclier
 * Acte II  : la caméra glisse côté ambre : axe du temps 5 → 10 → 20 ans ; le bouclier devient une cage dorée ;
 *            le magasin ferme, la cage reste ; les familles paient à la caisse
 * Acte III : « BARRIÈRE ARTIFICIELLE » ; la cage s'entrouvre */

function s09_family(ctx, x, y, s, color, a) {
  if (a <= 0.003) return;
  [[-0.5, 1], [0, 1.15], [0.45, 0.75]].forEach(([dx, k]) => person(ctx, x + dx * s, y, s * 0.55 * k, color, a));
}

function s09_shop(ctx, x, y, s, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.fillStyle = rgba(color, 0.12);
  ctx.lineWidth = 2;
  ctx.fillRect(x - s / 2, y - s * 0.6, s, s * 0.6);
  ctx.strokeRect(x - s / 2, y - s * 0.6, s, s * 0.6);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const x0 = x - s / 2 + (i * s) / 4;
    ctx.moveTo(x0, y - s * 0.6);
    ctx.quadraticCurveTo(x0 + s / 8, y - s * 0.45, x0 + s / 4, y - s * 0.6);
  }
  ctx.stroke();
  ctx.restore();
}

function sceneDeuxCotesBaux(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    encore: 'Là encore',
    versions: 'les deux versions',
    promoteurs: 'promoteurs immobiliers',
    chaines: 'chaînes établies',
    clause: "une clause d'exclusivité",
    securiser: 'sécuriser un investissement',
    massif: 'massif',
    garantie: 'sans la garantie',
    seul: 'le seul grand supermarché',
    nouveau: "d'un nouveau centre commercial",
    risquerait: 'personne ne risquerait',
    dizaines: 'des dizaines de millions',
    banlieue: 'en banlieue',
    region: 'ou en région',
    economistes: 'les économistes',
    excuse: 'cette excuse ne tient plus',
    survivent: 'survivent',
    fermeture: 'la fermeture',
    complementaires: 'commerces complémentaires',
    vingt: 'pendant vingt ans',
    barriere: 'une barrière artificielle',
    familles: 'les familles',
    caisse: 'à la caisse'
  });

  const split = eInOutQuart(seg(lt, T.versions - 0.4, T.versions + 0.8));
  const focus = track(lt, [[0, 0], [T.promoteurs - 0.4, 0], [T.promoteurs + 0.9, 1, eInOutQuart], [T.economistes - 0.5, 1], [T.economistes + 1.0, -1, eInOutQuart], [T.barriere + 0.3, -1], [T.barriere + 1.6, 0, eInOutQuart]]);
  const sh = V ? focus * h * 0.11 : focus * w * 0.13; // décalage de la diagonale
  // diagonale (16:9 : du haut-droite vers le bas-gauche ; 9:16 : de droite-haut à gauche-bas, plus douce)
  const p0 = V ? { x: w * 1.05, y: h * 0.38 + sh } : { x: w * 0.66 + sh, y: -h * 0.05 };
  const p1 = V ? { x: -w * 0.05, y: h * 0.62 + sh } : { x: w * 0.34 + sh, y: h * 1.05 };
  const sideA = (draw) => {
    ctx.save();
    ctx.beginPath();
    if (V) {
      ctx.moveTo(-w, -h);
      ctx.lineTo(w * 2, -h);
      ctx.lineTo(p0.x + (p0.x - p1.x) * 2, p0.y + (p0.y - p1.y) * 2);
      ctx.lineTo(p1.x - (p0.x - p1.x) * 2, p1.y - (p0.y - p1.y) * 2);
    } else {
      ctx.moveTo(-w, -h);
      ctx.lineTo(p0.x + (p0.x - p1.x) * 2, p0.y + (p0.y - p1.y) * 2);
      ctx.lineTo(p1.x - (p0.x - p1.x) * 2, p1.y - (p0.y - p1.y) * 2);
      ctx.lineTo(-w, h * 2);
    }
    ctx.closePath();
    ctx.clip();
    draw();
    ctx.restore();
  };
  const sideB = (draw) => {
    ctx.save();
    ctx.beginPath();
    if (V) {
      ctx.moveTo(-w, h * 2);
      ctx.lineTo(w * 2, h * 2);
      ctx.lineTo(p0.x + (p0.x - p1.x) * 2, p0.y + (p0.y - p1.y) * 2);
      ctx.lineTo(p1.x - (p0.x - p1.x) * 2, p1.y - (p0.y - p1.y) * 2);
    } else {
      ctx.moveTo(w * 2, -h);
      ctx.lineTo(p0.x + (p0.x - p1.x) * 2, p0.y + (p0.y - p1.y) * 2);
      ctx.lineTo(p1.x - (p0.x - p1.x) * 2, p1.y - (p0.y - p1.y) * 2);
      ctx.lineTo(w * 2, h * 2);
    }
    ctx.closePath();
    ctx.clip();
    draw();
    ctx.restore();
  };
  // centres de contenu de chaque côté
  const A = V ? { x: cx, y: h * 0.25 + sh * 0.9 } : { x: w * 0.25 + sh * 0.95, y: h * 0.56 };
  const B = V ? { x: cx, y: h * 0.72 + sh * 0.9 } : { x: w * 0.76 + sh * 0.95, y: h * 0.56 };
  const aA = split * (focus >= 0 ? 1 : lerp(1, 0.35, -focus));
  const bA = split * (focus <= 0 ? 1 : lerp(1, 0.35, focus));

  frame(a, () => {
    dust(ctx, stage, gt, { count: 60, alpha: 0.22, seed: 99 });

    /* fonds teintés des deux plans */
    if (split > 0.003) {
      sideA(() => {
        const g = ctx.createRadialGradient(A.x, A.y, 0, A.x, A.y, m * 0.9);
        g.addColorStop(0, rgba(C.cyan, 0.1 * split));
        g.addColorStop(1, rgba(C.cyan, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-w, -h, w * 3, h * 3);
      });
      sideB(() => {
        const g = ctx.createRadialGradient(B.x, B.y, 0, B.x, B.y, m * 0.9);
        g.addColorStop(0, rgba(C.amber, 0.1 * split));
        g.addColorStop(1, rgba(C.amber, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-w, -h, w * 3, h * 3);
      });
    }

    /* ── CÔTÉ A : promoteurs ── */
    if (aA > 0.003) {
      sideA(() => {
        const bw = m * (V ? 0.42 : 0.34);
        const bh = m * (V ? 0.2 : 0.22);
        const yb = A.y + bh * 0.55;
        const x0 = A.x - bw / 2;
        const build = seg(lt, T.securiser - 0.6, T.seul + 0.6);
        ctx.save();
        ctx.globalAlpha *= aA;
        // fondations
        const f = eInOutQuart(seg(build, 0, 0.25));
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 3;
        ctx.shadowColor = C.cyan;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(x0 - bw * 0.1, yb);
        ctx.lineTo(x0 - bw * 0.1 + bw * 1.2 * f, yb);
        ctx.stroke();
        // colonnes
        for (let i = 0; i <= 5; i++) {
          const c = eOutExpo(seg(build, 0.18 + i * 0.05, 0.45 + i * 0.05));
          const x = x0 + (bw * i) / 5;
          ctx.beginPath();
          ctx.moveTo(x, yb);
          ctx.lineTo(x, yb - bh * c);
          ctx.stroke();
        }
        // dalles
        for (let k = 1; k <= 2; k++) {
          const s = eInOutQuart(seg(build, 0.45 + k * 0.08, 0.65 + k * 0.08));
          ctx.beginPath();
          ctx.moveTo(x0, yb - (bh * k) / 2.1);
          ctx.lineTo(x0 + bw * s, yb - (bh * k) / 2.1);
          ctx.stroke();
        }
        // toit + façade vitrée
        const r = eInOutQuart(seg(build, 0.7, 0.95));
        ctx.beginPath();
        ctx.moveTo(x0 - bw * 0.04, yb - bh);
        ctx.lineTo(x0 - bw * 0.04 + bw * 1.08 * r, yb - bh);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = rgba(C.cyan, 0.14 * r);
        ctx.fillRect(x0, yb - bh, bw, bh);
        // grue
        const cr = eOutExpo(seg(lt, T.securiser - 0.4, T.securiser + 1.2)) * (1 - smooth(seg(build, 0.85, 1)));
        ctx.strokeStyle = rgba(C.ice, 0.8 * cr);
        ctx.lineWidth = 2;
        const gx = x0 + bw * 1.15;
        ctx.beginPath();
        ctx.moveTo(gx, yb);
        ctx.lineTo(gx, yb - bh * 1.7 * cr);
        ctx.lineTo(gx - bw * 0.7 * cr, yb - bh * 1.7 * cr);
        ctx.moveTo(gx, yb - bh * 1.7 * cr);
        ctx.lineTo(gx + bw * 0.18 * cr, yb - bh * 1.7 * cr);
        const hook = gx - bw * 0.45 * cr;
        ctx.moveTo(hook, yb - bh * 1.7 * cr);
        ctx.lineTo(hook, yb - bh * (1.7 - 0.5 * (0.5 + 0.5 * Math.sin(lt * 1.3))) * cr);
        ctx.stroke();
        ctx.restore();
        drawSprite(ctx, textSprite('SUPERMARCHÉ', { size: Math.floor(m * 0.024), weight: 900, color: C.white, spacing: 4 }), A.x, yb - bh * 0.5, { base: 'middle', alpha: aA * r });
        // bouclier « le seul »
        const shA = smooth(seg(lt, T.seul - 0.3, T.seul + 0.5));
        const toCage = smooth(seg(lt, T.survivent - 0.4, T.survivent + 0.6));
        shield(ctx, A.x, yb - bh * 0.5, bh * 0.95, { color: C.cyan, alpha: aA * shA * (1 - toCage), draw: eInOutQuart(seg(lt, T.seul - 0.2, T.seul + 0.9)), time: gt, fill: 0.08 });
        // pile de millions
        const mA = smooth(seg(lt, T.dizaines - 0.3, T.dizaines + 0.4));
        if (mA > 0.003) {
          const sx = V ? A.x - bw * 0.82 : A.x - bw * 0.82;
          const stack = Math.floor(lerp(0, 9, eOutCubic(seg(lt, T.dizaines - 0.2, T.dizaines + 1.4))));
          for (let k = 0; k < 9; k++) {
            const on = smooth(clamp(lerp(0, 9, eOutCubic(seg(lt, T.dizaines - 0.2, T.dizaines + 1.4))) - k));
            if (on <= 0) break;
            ctx.save();
            ctx.globalAlpha *= aA * mA * on;
            ctx.fillStyle = mix(C.gold, C.amber, k / 9);
            ctx.strokeStyle = rgba(C.night, 0.6);
            ctx.beginPath();
            ctx.ellipse(sx, yb - k * m * 0.016 - (1 - on) * m * 0.03, m * 0.045, m * 0.012, 0, 0, TAU);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
          void stack;
        }
      });
      const tA = aA * (1 - smooth(seg(lt, T.economistes - 0.6, T.economistes)));
      const ty = V ? Math.max(h * 0.14, A.y - m * 0.31) : h * 0.2;
      const tx = V ? cx : A.x;
      mono(ctx, 'PROMOTEURS · CHAÎNES ÉTABLIES', tx, ty - m * 0.055, { size: Math.floor(m * 0.018), color: C.cyan, spacing: 5, t: seg(lt, T.promoteurs, T.chaines + 0.8), alpha: tA });
      const sw = smooth(seg(lt, T.garantie - 0.3, T.garantie + 0.1));
      const sw0 = smooth(seg(lt, T.securiser - 0.4, T.securiser - 0.05));
      kRise(ctx, 'UNE CLAUSE', tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.clause - 0.1, T.clause + 0.8), out: sw0, alpha: tA });
      kRise(ctx, "D'EXCLUSIVITÉ", tx, ty + m * 0.06, { size: Math.floor(m * 0.05), weight: 900, color: C.cyan, t: seg(lt, T.clause + 0.3, T.clause + 1.1), out: sw0, alpha: tA });
      kRise(ctx, 'SÉCURISER', tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.securiser - 0.1, T.securiser + 0.8), out: sw, alpha: tA });
      kRise(ctx, "L'INVESTISSEMENT", tx, ty + m * 0.06, { size: Math.floor(m * 0.05), weight: 900, color: C.cyan, t: seg(lt, T.massif - 0.4, T.massif + 0.5), out: sw, alpha: tA, maxW: V ? w * 0.9 : w * 0.42 });
      kRise(ctx, 'LE SEUL GRAND', tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.seul, T.seul + 0.8), alpha: tA * sw });
      kRise(ctx, 'SUPERMARCHÉ', tx, ty + m * 0.06, { size: Math.floor(m * 0.05), weight: 900, color: C.cyan, t: seg(lt, T.seul + 0.3, T.seul + 1.1), alpha: tA * sw });
      const my = V ? A.y + m * 0.27 : h * 0.86;
      mono(ctx, 'DES DIZAINES DE MILLIONS $', tx, my, { size: Math.floor(m * 0.022), color: C.gold, spacing: 5, t: seg(lt, T.dizaines, T.dizaines + 1.0), alpha: tA });
      mono(ctx, 'EN BANLIEUE OU EN RÉGION', tx, my + m * 0.04, { size: Math.floor(m * 0.017), color: C.ice, spacing: 5, t: seg(lt, T.banlieue, T.region + 0.8), alpha: tA });
    }

    /* ── CÔTÉ B : économistes ── */
    if (bA > 0.003) {
      const axW = V ? w * 0.8 : m * 0.62;
      const ax0 = B.x - axW / 2;
      const ay = B.y + m * (V ? 0.1 : 0.15);
      const timeT = eInOutQuart(seg(lt, T.survivent - 0.2, T.vingt + 1.0));
      const cageOpen = eInOutQuart(seg(lt, D - 3.2, D - 0.8));
      sideB(() => {
        ctx.save();
        ctx.globalAlpha *= bA;
        // axe du temps
        ctx.strokeStyle = rgba(C.slate, 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax0, ay);
        ctx.lineTo(ax0 + axW * eOutExpo(seg(lt, T.economistes, T.economistes + 1)), ay);
        ctx.stroke();
        ctx.restore();
        [['0', 0], ['5 ANS', 0.25], ['10 ANS', 0.5], ['20 ANS', 1]].forEach(([lab, f], i) => {
          const x = ax0 + axW * f;
          const on = timeT >= f - 0.001 ? 1 : 0.25;
          ctx.save();
          ctx.globalAlpha *= bA * smooth(seg(lt, T.economistes + i * 0.15, T.economistes + 0.5 + i * 0.15));
          ctx.fillStyle = on > 0.5 ? C.amber : C.slate;
          ctx.fillRect(x - 1.5, ay - 8, 3, 16);
          ctx.restore();
          drawSprite(ctx, textSprite(lab, { size: Math.floor(m * 0.018), weight: 600, fam: MONO, color: on > 0.5 ? C.gold : C.slate, spacing: 3 }), x, ay + m * 0.04, { alpha: bA * smooth(seg(lt, T.economistes + i * 0.15, T.economistes + 0.5 + i * 0.15)) });
        });
        // magasin (ferme) + commerces complémentaires bloqués
        const storeX = ax0 + axW * 0.08;
        const storeY = ay - m * 0.03;
        const closed = smooth(seg(lt, T.fermeture - 0.1, T.fermeture + 0.6));
        ctx.save();
        ctx.globalAlpha *= bA * smooth(seg(lt, T.economistes, T.economistes + 0.8));
        ctx.fillStyle = rgba(mix(C.cyan, '#1F2937', closed), 0.35);
        ctx.strokeStyle = mix(C.cyan, '#475569', closed);
        ctx.lineWidth = 2;
        ctx.fillRect(storeX - m * 0.06, storeY - m * 0.1, m * 0.12, m * 0.1);
        ctx.strokeRect(storeX - m * 0.06, storeY - m * 0.1, m * 0.12, m * 0.1);
        ctx.restore();
        drawSprite(ctx, textSprite('FERMÉ', { size: Math.floor(m * 0.016), weight: 600, fam: MONO, color: C.coral, spacing: 4 }), storeX, storeY - m * 0.05, { base: 'middle', alpha: bA * closed });
        // cage dorée qui s'étire dans le temps
        const cageL = ax0 + axW * 0.18;
        const cageR = ax0 + axW * lerp(0.2, 1.0, timeT);
        const cageH = m * (V ? 0.2 : 0.24);
        const cageA = bA * smooth(seg(lt, T.survivent - 0.3, T.survivent + 0.5));
        const nBars = 12;
        for (let i = 0; i <= nBars; i++) {
          const fx = i / nBars;
          let x = lerp(cageL, cageR, fx);
          if (cageOpen > 0 && i > nBars * 0.4 && i < nBars * 0.6) x += (i < nBars / 2 ? -1 : 1) * cageOpen * m * 0.05;
          const grow = eOutExpo(seg(lt, T.survivent + fx * 1.2, T.survivent + 0.8 + fx * 1.2));
          ctx.save();
          ctx.globalAlpha *= cageA;
          const g = ctx.createLinearGradient(0, ay - cageH, 0, ay);
          g.addColorStop(0, C.gold);
          g.addColorStop(1, C.copper);
          ctx.strokeStyle = g;
          ctx.lineWidth = 4;
          ctx.shadowColor = C.amber;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(x, ay);
          ctx.lineTo(x, ay - cageH * grow);
          ctx.stroke();
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha *= cageA * smooth(seg(lt, T.survivent + 0.6, T.survivent + 1.4));
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cageL, ay - cageH);
        ctx.lineTo(cageR, ay - cageH);
        ctx.stroke();
        ctx.restore();
        light(ctx, (cageL + cageR) / 2, ay - cageH / 2, cageH * 1.4, C.amber, cageA * 0.3);
        // commerces complémentaires enfermés
        for (let k = 0; k < 3; k++) {
          const on = smooth(seg(lt, T.complementaires - 0.2 + k * 0.2, T.complementaires + 0.5 + k * 0.2));
          s09_shop(ctx, lerp(cageL, cageR, 0.25 + k * 0.25), ay - m * 0.02, m * 0.06, C.slate, bA * on);
        }
        // les familles paient : flux de pièces vers la cage
        const famA = bA * smooth(seg(lt, T.familles - 0.3, T.familles + 0.4));
        if (famA > 0.003) {
          const fx = V ? B.x + axW * 0.38 : B.x + axW * 0.5;
          const fy = V ? ay - cageH - m * 0.08 : ay - cageH - m * 0.1;
          s09_family(ctx, fx, fy, m * 0.06, C.ice, famA);
          const tgt = { x: (cageL + cageR) / 2, y: ay - cageH };
          for (let k = 0; k < 7; k++) {
            const u = (lt * 0.6 + k / 7) % 1;
            const p = { x: lerp(fx, tgt.x, u), y: lerp(fy, tgt.y, u) - Math.sin(u * Math.PI) * m * 0.06 };
            ctx.save();
            ctx.globalAlpha *= famA * Math.sin(u * Math.PI);
            ctx.fillStyle = C.gold;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, m * 0.009, m * 0.009 * Math.abs(Math.cos(u * 12)), 0, 0, TAU);
            ctx.fill();
            ctx.restore();
          }
        }
      });
      const bT = bA * smooth(seg(lt, T.economistes - 0.2, T.economistes + 0.4));
      const ty = V ? B.y - m * 0.24 : h * 0.2;
      const tx = V ? cx : B.x;
      mono(ctx, 'ÉCONOMISTES DE LA CONCURRENCE', tx, ty - m * 0.055, { size: Math.floor(m * 0.018), color: C.amber, spacing: 5, t: seg(lt, T.economistes, T.economistes + 0.9), alpha: bT * (1 - smooth(seg(lt, T.barriere - 0.4, T.barriere))) });
      const sw = smooth(seg(lt, T.barriere - 0.3, T.barriere + 0.1));
      kRise(ctx, "L'EXCUSE NE TIENT PLUS", tx, ty, { size: Math.floor(m * (V ? 0.05 : 0.044)), weight: 900, t: seg(lt, T.excuse - 0.1, T.excuse + 0.9), out: sw, alpha: bT, maxW: V ? w * 0.9 : w * 0.44 });
      mono(ctx, 'MÊME APRÈS LA FERMETURE', tx, ty + m * 0.05, { size: Math.floor(m * 0.018), color: C.coral, spacing: 4, t: seg(lt, T.fermeture, T.fermeture + 0.8), alpha: bT * (1 - sw) });
    }

    /* ── la diagonale ── */
    if (split > 0.003) {
      const L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const k = split;
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      const ux = (p1.x - p0.x) / L;
      const uy = (p1.y - p0.y) / L;
      ctx.save();
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = C.white;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(mx - ux * L * 0.5 * k, my - uy * L * 0.5 * k);
      ctx.lineTo(mx + ux * L * 0.5 * k, my + uy * L * 0.5 * k);
      ctx.stroke();
      ctx.restore();
      light(ctx, mx, my, m * 0.08, C.white, 0.35 * k);
    }

    /* ── ACTE I : deux versions ── */
    const oA = 1 - smooth(seg(lt, T.promoteurs - 0.4, T.promoteurs + 0.2));
    if (oA > 0.003) {
      kRise(ctx, 'DEUX VERSIONS', cx, cy + m * 0.02, { size: Math.floor(m * 0.08), weight: 900, t: seg(lt, T.encore - 0.1, T.encore + 0.8), alpha: oA, glow: 20, glowColor: rgba(C.white, 0.25) });
    }

    /* ── ACTE III : barrière artificielle ── */
    const fA = smooth(seg(lt, T.barriere - 0.3, T.barriere + 0.4));
    if (fA > 0.003) {
      const ty = V ? h * 0.5 + sh : h * 0.16;
      kRise(ctx, 'BARRIÈRE', cx, ty, { size: Math.floor(m * (V ? 0.07 : 0.066)), weight: 900, color: C.amber, t: seg(lt, T.barriere, T.barriere + 0.8), alpha: fA, glow: 22, glowColor: rgba(C.amber, 0.45) });
      kRise(ctx, 'ARTIFICIELLE', cx, ty + m * (V ? 0.08 : 0.075), { size: Math.floor(m * (V ? 0.07 : 0.066)), weight: 900, t: seg(lt, T.barriere + 0.3, T.barriere + 1.1), alpha: fA });
      mono(ctx, 'PAYÉE PAR LES FAMILLES À LA CAISSE', cx, ty + m * (V ? 0.135 : 0.125), { size: Math.floor(m * 0.019), color: C.gold, spacing: 4, t: seg(lt, T.familles, T.caisse + 0.9), alpha: fA });
    }
  });
}
/*@scene rep-deux-cotes-baux=sceneDeuxCotesBaux*/
