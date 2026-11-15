/* Acte I   : l'emblème naît, puis se condense en faisceau laser qui balaie un code-barres monumental
 * Acte II  : la facture s'allonge ; les barres s'écartent en parallaxe et libèrent 4 strates lumineuses
 * Acte III : les strates se replient en un faisceau ; titre « SPÉCIAL REPORTAGE / L'ÉPICERIE SOUS ALGORITHME » */

const S01_BARS = (() => {
  const r = rng(4021);
  const out = [];
  let x = 0;
  for (let i = 0; i < 58; i++) {
    const wd = [1, 1, 2, 3, 1, 4, 2][Math.floor(r() * 7)];
    const gap = [1, 2, 1, 3][Math.floor(r() * 4)];
    out.push({ x, wd, depth: r(), guard: i < 2 || i > 55 || i === 28 || i === 29 });
    x += wd + gap;
  }
  return { bars: out, total: x };
})();

/** Pictogrammes vectoriels des quatre strates. */
function s01_icon(ctx, kind, x, y, s, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = rgba(color, 0.16);
  ctx.lineWidth = Math.max(2, s * 0.07);
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.35;
  if (kind === 'tag') {
    rrect(ctx, -s * 0.62, -s * 0.38, s * 1.24, s * 0.76, s * 0.1);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-s * 0.46, -s * 0.18, s * 0.52, s * 0.14);
    ctx.fillRect(-s * 0.46, s * 0.06, s * 0.3, s * 0.1);
    ctx.beginPath();
    ctx.arc(s * 0.4, -s * 0.2, s * 0.07, 0, TAU);
    ctx.fill();
  } else if (kind === 'file') {
    for (let k = 2; k >= 0; k--) {
      rrect(ctx, -s * 0.42 + k * s * 0.12, -s * 0.5 - k * s * 0.1, s * 0.72, s * 0.94, s * 0.06);
      ctx.fillStyle = rgba(color, 0.1 + (2 - k) * 0.06);
      ctx.fill();
      ctx.stroke();
    }
    ctx.lineWidth = Math.max(1.5, s * 0.045);
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.28 + k * s * 0.16);
      ctx.lineTo(s * (k === 3 ? 0.0 : 0.16), -s * 0.28 + k * s * 0.16);
      ctx.stroke();
    }
  } else if (kind === 'lease') {
    rrect(ctx, -s * 0.4, -s * 0.52, s * 0.8, s * 1.0, s * 0.06);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-s * 0.26, -s * 0.3, s * 0.52, s * 0.12);
    ctx.fillRect(-s * 0.26, -s * 0.08, s * 0.52, s * 0.12);
    ctx.beginPath();
    ctx.arc(s * 0.2, s * 0.3, s * 0.15, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.1, s * 0.42);
    ctx.lineTo(s * 0.04, s * 0.62);
    ctx.moveTo(s * 0.3, s * 0.42);
    ctx.lineTo(s * 0.36, s * 0.62);
    ctx.stroke();
  } else {
    // caisse : reçu avec crochet
    ctx.beginPath();
    ctx.moveTo(-s * 0.36, -s * 0.52);
    ctx.lineTo(s * 0.36, -s * 0.52);
    ctx.lineTo(s * 0.36, s * 0.46);
    for (let k = 0; k < 6; k++) ctx.lineTo(s * 0.36 - (k + 0.5) * s * 0.12, s * (k % 2 ? 0.46 : 0.56));
    ctx.lineTo(-s * 0.36, s * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, s * 0.0);
    ctx.lineTo(-s * 0.04, s * 0.14);
    ctx.lineTo(s * 0.2, -s * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

function sceneOuvertureScanner(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    bienvenue: 'Bienvenue',
    speciale: 'édition spéciale',
    filtre: 'sans filtre',
    comm: 'sans commanditaire',
    ouvre: 'on ouvre un dossier',
    famille: 'chaque famille québécoise',
    semaine: 'à chaque semaine',
    mecanique: 'la mécanique complète',
    explosion: "l'explosion de votre facture",
    etiq: 'Étiquettes électroniques',
    pages: 'soixante pages',
    clauses: 'clauses secrètes',
    quinze: 'quinze dollars',
    voici: 'Voici notre enquête',
    machine: 'la nouvelle machine',
    geants: 'géants alimentaires'
  });

  frame(a, () => {
    dust(ctx, stage, gt, { count: 90, alpha: 0.32, seed: 11 });

    /* ── ACTE I-a : naissance de l'emblème ── */
    const condense = eInOutQuart(seg(lt, T.ouvre - 0.5, T.ouvre + 0.5));
    const embA = 1 - condense;
    const ey = V ? h * 0.38 : h * 0.43;
    if (embA > 0.003) {
      const er = m * (V ? 0.17 : 0.13) * lerp(1, 0.25, condense);
      emblem(ctx, cx, ey, er, {
        ringT: seg(lt, 0.2, 1.6),
        needle: seg(lt, 0.5, 1.5),
        cardinals: seg(lt, 0.9, 1.9),
        star: seg(lt, 1.1, 2.0),
        alpha: embA,
        time: gt
      });
      const ty = ey + m * (V ? 0.3 : 0.27);
      mono(ctx, 'ÉDITION SPÉCIALE · REPORTAGE', cx, ty - m * 0.075, { size: Math.floor(m * 0.02), color: C.amber, spacing: 7, t: seg(lt, T.speciale - 0.3, T.speciale + 1.0), alpha: embA });
      if (V) {
        kWords(ctx, ['SANS', 'FILTRE'], cx, ty + m * 0.02, { size: Math.floor(m * 0.07), weight: 900, time: lt, times: [T.filtre, T.filtre + 0.2], alpha: embA });
        kWords(ctx, ['SANS', 'COMMANDITAIRE'], cx, ty + m * 0.11, { size: Math.floor(m * 0.07), weight: 900, time: lt, times: [T.comm, T.comm + 0.2], alpha: embA, color: C.amber });
      } else {
        kWords(ctx, ['SANS', 'FILTRE', '·', 'SANS', 'COMMANDITAIRE'], cx, ty, {
          size: Math.floor(m * 0.046),
          weight: 900,
          time: lt,
          times: [T.filtre, T.filtre + 0.2, T.filtre + 0.45, T.comm, T.comm + 0.2],
          alpha: embA,
          gapEm: 0.3
        });
      }
    }

    /* ── ACTE I-b : code-barres monumental + faisceau laser ── */
    const bcIn = eOutExpo(seg(lt, T.ouvre - 0.2, T.ouvre + 1.4));
    const split = eInOutQuart(seg(lt, T.etiq - 0.9, T.etiq + 0.6)); // barres qui s'écartent
    const bcA = bcIn * (1 - smooth(seg(lt, T.etiq + 0.2, T.etiq + 1.2)));
    const bw = V ? w * 0.8 : w * 0.5;
    const bh = V ? h * 0.2 : h * 0.4;
    const fShift = smoother(seg(lt, T.explosion - 0.4, T.explosion + 1.2)) * (1 - split);
    const bcx = V ? cx : cx - w * 0.11 * fShift;
    const bcy = V ? h * 0.45 - h * 0.06 * fShift : h * 0.47;
    // travelling avant lent sur le code-barres puis traversée
    const zoom = track(lt, [
      [T.ouvre, 0.9],
      [T.explosion, 1.0, smoother],
      [T.etiq + 0.6, 1.9, eInExpo]
    ]);
    if (bcA > 0.003) {
      const { bars, total } = S01_BARS;
      const unit = bw / total;
      ctx.save();
      ctx.translate(bcx, bcy);
      ctx.scale(zoom, zoom);
      const reveal = eInOutQuart(seg(lt, T.ouvre + 0.1, T.mecanique + 0.4));
      bars.forEach((b, i) => {
        const bx = -bw / 2 + b.x * unit;
        const frac = i / bars.length;
        const vis = clamp((reveal - frac * 0.7) / 0.3);
        if (vis <= 0) return;
        const side = bx + (b.wd * unit) / 2 < 0 ? -1 : 1;
        const push = split * side * w * (0.25 + b.depth * 0.55);
        const hh = (b.guard ? bh * 1.08 : bh) * eOutExpo(vis);
        const g = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2);
        g.addColorStop(0, rgba(C.white, 0.95));
        g.addColorStop(1, rgba(C.ice, 0.55));
        ctx.globalAlpha = bcA * vis * (b.guard ? 1 : 0.85);
        ctx.fillStyle = b.guard ? C.amber : g;
        ctx.fillRect(bx + push, -bh / 2, b.wd * unit, hh);
      });
      ctx.restore();
      // chiffres sous le code
      const digitsY = bcy + (bh / 2) * zoom + m * 0.05;
      mono(ctx, '0 62890 14112 6', bcx, digitsY, { size: Math.floor(m * 0.024), color: C.slate, spacing: 10, t: seg(lt, T.famille, T.famille + 1.5), alpha: bcA * (1 - split) });
      // faisceau laser qui balaie
      const sweep = (Math.sin((lt - T.ouvre) * 2.1) * 0.5 + 0.5) * eInOutQuart(seg(lt, T.ouvre, T.ouvre + 0.8));
      const ly = bcy - (bh / 2) * zoom + bh * zoom * sweep;
      const laserA = bcA * smooth(seg(lt, T.ouvre - 0.1, T.ouvre + 0.5)) * (1 - split);
      if (laserA > 0.003) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const lg = ctx.createLinearGradient(bcx - bw * 0.62, 0, bcx + bw * 0.62, 0);
        lg.addColorStop(0, rgba(C.cyan, 0));
        lg.addColorStop(0.15, rgba(C.cyan, 0.9 * laserA));
        lg.addColorStop(0.85, rgba(C.cyan, 0.9 * laserA));
        lg.addColorStop(1, rgba(C.cyan, 0));
        ctx.fillStyle = lg;
        ctx.fillRect(bcx - bw * 0.62, ly - 2, bw * 1.24, 4);
        ctx.globalAlpha = 0.18 * laserA;
        ctx.fillRect(bcx - bw * 0.62, ly - 16, bw * 1.24, 32);
        ctx.restore();
        flare(ctx, bcx - bw * 0.6, ly, m * 0.05, C.cyan, laserA * 0.8);
      }
      // sur-titres de l'acte I
      const capY = V ? h * 0.2 : h * 0.16;
      const swapF = smooth(seg(lt, T.explosion - 0.4, T.explosion));
      kRise(ctx, 'CHAQUE FAMILLE', cx, capY, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.famille, T.famille + 0.9), out: swapF, alpha: bcA });
      mono(ctx, 'CHAQUE SEMAINE · LA MÉCANIQUE COMPLÈTE', cx, capY + m * 0.055, { size: Math.floor(m * 0.018), color: C.ice, spacing: 5, t: seg(lt, T.semaine, T.mecanique + 1.0), alpha: bcA * (1 - swapF) });
    }

    /* ── ACTE II-a : la facture qui s'allonge ── */
    const fA = env(lt, T.explosion - 0.3, T.etiq + 0.4, 0.4, 0.6);
    if (fA > 0.003) {
      const grow = eInOutExpo(seg(lt, T.explosion, T.explosion + 2.2));
      const rx = V ? cx : w * 0.79;
      const rTop = V ? h * 0.63 : h * 0.24;
      const rw = m * 0.16;
      const rh = (V ? h * 0.2 : h * 0.6) * (0.25 + 0.75 * grow);
      ctx.save();
      ctx.globalAlpha *= fA;
      light(ctx, rx, rTop + rh * 0.6, rw * 2.2, C.amber, 0.28);
      const g = ctx.createLinearGradient(0, rTop, 0, rTop + rh);
      g.addColorStop(0, rgba(C.white, 0.92));
      g.addColorStop(1, rgba(C.gold, 0.55));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(rx - rw / 2, rTop);
      ctx.lineTo(rx + rw / 2, rTop);
      ctx.lineTo(rx + rw / 2, rTop + rh);
      for (let k = 0; k < 8; k++) ctx.lineTo(rx + rw / 2 - (k + 0.5) * (rw / 8), rTop + rh + (k % 2 ? 0 : rw * 0.05));
      ctx.lineTo(rx - rw / 2, rTop + rh);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(C.night, 0.55);
      const lines = Math.floor(rh / (rw * 0.12));
      for (let k = 1; k < lines; k++) {
        const ly2 = rTop + k * rw * 0.12;
        ctx.fillRect(rx - rw * 0.38, ly2, rw * (k % 3 === 0 ? 0.5 : 0.62), 2.5);
        ctx.fillRect(rx + rw * 0.22, ly2, rw * 0.16, 2.5);
      }
      ctx.restore();
      // flèche qui monte
      const ax = V ? rx + rw * 0.95 : rx - rw * 1.05;
      const aBot = rTop + rh;
      const aTop = rTop + rh * 0.1;
      ctx.save();
      ctx.globalAlpha *= fA * grow;
      ctx.strokeStyle = C.amber;
      ctx.lineWidth = 4;
      ctx.shadowColor = C.amber;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(ax, aBot);
      ctx.lineTo(ax, aTop + 18);
      ctx.stroke();
      ctx.restore();
      arrowHead(ctx, ax, aTop, -Math.PI / 2, 18, C.amber, fA * grow);
      const lx = V ? cx : w * 0.79;
      const ly3 = V ? h * 0.585 : h * 0.17;
      kRise(ctx, 'VOTRE FACTURE', lx, ly3, { size: Math.floor(m * 0.046), weight: 900, color: C.amber, t: seg(lt, T.explosion + 0.2, T.explosion + 1.1), alpha: fA, glow: 18, glowColor: rgba(C.amber, 0.5) });
      mono(ctx, "D'ÉPICERIE", lx, ly3 + m * 0.05, { size: Math.floor(m * 0.019), color: C.gold, spacing: 8, t: seg(lt, T.explosion + 0.6, T.explosion + 1.5), alpha: fA });
    }

    /* ── ACTE II-b : quatre strates lumineuses en profondeur ── */
    const strata = [
      { k: T.etiq, kind: 'tag', col: C.cyan, a: 'ÉTIQUETTES', b: 'CONNECTÉES' },
      { k: T.pages, kind: 'file', col: C.ice, a: 'DOSSIERS DE', b: null, num: 60, suf: 'PAGES' },
      { k: T.clauses, kind: 'lease', col: C.amber, a: 'BAUX', b: 'SECRETS' },
      { k: T.quinze, kind: 'till', col: C.emerald, a: 'RÈGLE DES', b: null, num: 15, suf: '$' }
    ];
    const fold = eInOutQuart(seg(lt, T.voici - 0.2, T.voici + 0.9));
    const sA = smooth(seg(lt, T.etiq - 0.4, T.etiq + 0.3)) * (1 - smooth(seg(lt, T.voici + 0.5, T.voici + 1.1)));
    if (sA > 0.003) {
      const slabW = V ? w * 0.74 : w * 0.56;
      const slabH = V ? h * 0.085 : h * 0.13;
      const gapY = V ? h * 0.125 : h * 0.17;
      const baseY = V ? h * 0.31 : h * 0.24;
      // caméra : légère bascule continue (parallaxe par profondeur)
      const drift = track(lt, [[T.etiq, 1], [T.quinze + 1.4, 0, smoother]]);
      strata.forEach((s, i) => {
        const on = eOutExpo(seg(lt, s.k - 0.25, s.k + 0.9));
        if (on <= 0) return;
        const depth = 1 - i * 0.08;
        const yy = lerp(baseY + i * gapY, cy, fold);
        const xx = cx + (1 - on) * (i % 2 ? 1 : -1) * w * 0.6 * depth + drift * (i - 1.5) * m * 0.03;
        const sh = slabH * lerp(1, 0.04, fold);
        ctx.save();
        ctx.globalAlpha *= sA * on;
        // dalle de verre inclinée (parallélogramme)
        const sk = slabH * 0.35;
        const g = ctx.createLinearGradient(xx - slabW / 2, 0, xx + slabW / 2, 0);
        g.addColorStop(0, rgba(s.col, 0.2));
        g.addColorStop(0.5, rgba(s.col, 0.07));
        g.addColorStop(1, rgba(s.col, 0.02));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(xx - slabW / 2 + sk, yy - sh / 2);
        ctx.lineTo(xx + slabW / 2 + sk, yy - sh / 2);
        ctx.lineTo(xx + slabW / 2 - sk, yy + sh / 2);
        ctx.lineTo(xx - slabW / 2 - sk, yy + sh / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = rgba(s.col, 0.85);
        ctx.lineWidth = 1.5;
        ctx.shadowColor = s.col;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
        light(ctx, xx - slabW / 2 + sk, yy - sh / 2, m * 0.05, s.col, sA * on * 0.7);
        const textA = sA * on * (1 - fold);
        const ix = xx - slabW / 2 + slabH * 0.75;
        s01_icon(ctx, s.kind, ix, yy, slabH * 0.5, s.col, textA);
        const tx = ix + slabH * 0.62;
        const fs = Math.floor(m * (V ? 0.04 : 0.042));
        const tt = seg(lt, s.k - 0.1, s.k + 0.8);
        const bl = yy + textSprite('H', { size: fs, weight: 900 }).cap / 2; // ligne de base commune (texte centré sur la dalle)
        const used = kSlide(ctx, s.a, tx, bl, { size: fs, weight: 900, color: C.white, t: tt, alpha: textA, align: 'left', dir: 'up' });
        if (s.b) kSlide(ctx, s.b, tx + used + fs * 0.32, bl, { size: fs, weight: 900, color: s.col, t: seg(lt, s.k + 0.15, s.k + 1.0), alpha: textA, align: 'left', dir: 'up' });
        if (s.num) {
          const nv = s.num * eOutExpo(seg(lt, s.k, s.k + 1.0));
          odometer(ctx, nv, tx + used + fs * 0.32, bl, { size: fs, weight: 900, color: s.col, align: 'left', suffix: ' ' + s.suf, suffixColor: s.col, alpha: textA * smooth(seg(lt, s.k, s.k + 0.3)) });
        }
      });
    }

    /* ── ACTE III : le faisceau et le titre ── */
    const tA = smooth(seg(lt, T.voici + 0.3, T.voici + 0.9));
    if (tA > 0.003) {
      const beamW = w * eInOutQuart(seg(lt, T.voici, T.voici + 1.0));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bg = ctx.createLinearGradient(cx - beamW / 2, 0, cx + beamW / 2, 0);
      bg.addColorStop(0, rgba(C.cyan, 0));
      bg.addColorStop(0.3, rgba(C.cyan, 0.6));
      bg.addColorStop(0.5, rgba(C.white, 0.9));
      bg.addColorStop(0.7, rgba(C.amber, 0.6));
      bg.addColorStop(1, rgba(C.amber, 0));
      ctx.fillStyle = bg;
      ctx.globalAlpha = tA * (1 - 0.6 * smooth(seg(lt, T.voici + 1.2, T.voici + 2.4)));
      ctx.fillRect(cx - beamW / 2, cy - 1.5, beamW, 3);
      ctx.restore();
      flare(ctx, cx, cy, m * 0.12, C.ice, tA * (1 - smooth(seg(lt, T.voici + 0.6, T.voici + 2.0))));
      // lente poussée de caméra sur le titre (échelle de sprite, aucun changement de police)
      const push = lerp(1, 1.04, smoother(seg(lt, T.voici, D)));
      const t1y = cy - m * (V ? 0.05 : 0.055);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(push, push);
      ctx.translate(-cx, -cy);
      kRise(ctx, 'SPÉCIAL REPORTAGE', cx, t1y, { size: Math.floor(m * (V ? 0.1 : 0.105)), weight: 900, color: C.white, t: seg(lt, T.voici + 0.25, T.voici + 1.3), alpha: tA, glow: 26, glowColor: rgba(C.amber, 0.55), maxW: w * 0.88 });
      const t2y = cy + m * (V ? 0.075 : 0.085);
      kWipe(ctx, "L'ÉPICERIE SOUS ALGORITHME", cx, t2y, { size: Math.floor(m * (V ? 0.054 : 0.058)), weight: 800, color: C.cyan, t: seg(lt, T.voici + 0.8, T.voici + 1.9), alpha: tA, edge: C.amber, maxW: w * 0.86 });
      underline(ctx, cx, t2y + m * 0.035, V ? w * 0.7 : w * 0.42, seg(lt, T.voici + 1.4, T.voici + 2.4), { alpha: tA });
      mono(ctx, 'LA NOUVELLE MACHINE DES GÉANTS ALIMENTAIRES', cx, t2y + m * 0.09, { size: Math.floor(m * (V ? 0.017 : 0.018)), color: C.slate, spacing: 5, t: seg(lt, T.machine, T.geants + 1.2), alpha: tA * 0.85 });
      ctx.restore();
    }
  });
}
/*@scene rep-ouverture-choc=sceneOuvertureScanner*/
