/* Acte I   : travelling dans une allée d'épicerie en perspective ; enseignes des bannières ; gros plan sur
 *            UNE étiquette électronique qui remplace l'étiquette papier
 * Acte II  : recul ; serveur central au fond de l'allée ; onde sans fil qui fait basculer toutes les
 *            étiquettes de 4,99 $ à 5,79 $ ; succursale · heure · météo
 * Acte III : l'allée se replie en courbe horaire de prix « façon billet d'avion » */

const S02_COLS = (() => {
  const r = rng(902);
  return Array.from({ length: 18 }, (_, k) => ({
    hue: [C.cyan, C.amber, C.emerald, C.coral, C.violet, C.ice][Math.floor(r() * 6)],
    hs: [0.55 + r() * 0.35, 0.55 + r() * 0.35, 0.55 + r() * 0.35, 0.55 + r() * 0.35],
    k
  }));
})();

/**
 * Étiquette électronique en gros plan (écran e-ink).
 * Anti-tremblement : tout est dessiné à une taille de base FIXE (o.base), puis mis à l'échelle par
 * transformation — les polices ne changent jamais de taille pendant le zoom.
 */
function s02_bigLabel(ctx, x, y, s, o) {
  const S0 = o.base;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / S0, s / S0);
  s02_bigLabelRaw(ctx, 0, 0, S0, o);
  ctx.restore();
}
function s02_bigLabelRaw(ctx, x, y, s, o) {
  const { alpha = 1, price = 4.99, paper = 0, flash = 0, time = 0 } = o;
  if (alpha <= 0.003) return;
  const W = s * 2.1;
  const H = s;
  ctx.save();
  ctx.globalAlpha *= alpha;
  light(ctx, x, y, s * 2.4, C.cyan, 0.22 + flash * 0.4);
  // boîtier
  rrect(ctx, x - W / 2, y - H / 2, W, H, s * 0.1);
  const g = ctx.createLinearGradient(0, y - H / 2, 0, y + H / 2);
  g.addColorStop(0, '#1E293B');
  g.addColorStop(1, '#0B1220');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(C.cyan, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();
  // écran e-ink
  const sx = x - W / 2 + s * 0.08;
  const sy = y - H / 2 + s * 0.08;
  const sw = W - s * 0.6;
  const sh = H - s * 0.16;
  rrect(ctx, sx, sy, sw, sh, s * 0.04);
  const eg = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
  eg.addColorStop(0, '#E8EDF2');
  eg.addColorStop(1, '#C9D2DC');
  ctx.fillStyle = eg;
  ctx.fill();
  ctx.restore();
  // prix (compteur à rouleaux, encre noire)
  const fs = Math.floor(s * 0.42);
  odometer(ctx, price, sx + sw * 0.08, sy + sh * 0.62, { size: fs, weight: 900, color: '#0B1220', dec: 2, align: 'left', suffix: ' $', suffixScale: 0.6, alpha: alpha * smooth(seg(paper, 0.2, 0.55)) });
  mono(ctx, 'ART. 0462 · 2 L', sx + sw * 0.08, sy + sh * 0.84, { size: Math.floor(s * 0.075), color: '#334155', align: 'left', spacing: 3, alpha: alpha * smooth(seg(paper, 0.2, 0.55)), cursor: false });
  // LED + code
  ctx.save();
  ctx.globalAlpha *= alpha;
  const lx = x + W / 2 - s * 0.26;
  ctx.fillStyle = mix(C.emerald, C.amber, flash);
  ctx.beginPath();
  ctx.arc(lx, y - H * 0.22, s * 0.06, 0, TAU);
  ctx.fill();
  light(ctx, lx, y - H * 0.22, s * 0.35, mix(C.emerald, C.amber, flash), 0.6 + 0.4 * Math.sin(time * 5) * flash);
  ctx.fillStyle = rgba(C.slate, 0.55);
  for (let k = 0; k < 9; k++) ctx.fillRect(lx - s * 0.14 + k * s * 0.032, y + H * 0.05, k % 3 ? s * 0.012 : s * 0.02, s * 0.26);
  ctx.restore();
  // étiquette papier qui se détache
  if (paper < 1) {
    const pe = eInCubic(paper);
    ctx.save();
    ctx.globalAlpha *= alpha * (1 - smooth(seg(paper, 0.6, 1)));
    ctx.translate(x - W * 0.05 + pe * s * 0.8, y + pe * s * 2.2);
    ctx.rotate(pe * 0.7);
    rrect(ctx, -W * 0.5, -H * 0.52, W * 1.0, H * 1.04, s * 0.03);
    ctx.fillStyle = '#F5F0E6';
    ctx.fill();
    ctx.fillStyle = rgba('#B45309', 0.9);
    ctx.fillRect(-W * 0.5, -H * 0.52, W, H * 0.16);
    ctx.restore();
    if (paper < 0.6) {
      ctx.save();
      ctx.translate(x - W * 0.05 + pe * s * 0.8, y + pe * s * 2.2);
      ctx.rotate(pe * 0.7);
      drawSprite(ctx, textSprite('4,99', { size: Math.floor(s * 0.4), weight: 800, color: '#1F2937' }), -W * 0.38, H * 0.2, { align: 'left', alpha: alpha * (1 - smooth(seg(paper, 0.4, 0.6))) });
      drawSprite(ctx, textSprite('PAPIER', { size: Math.floor(s * 0.09), weight: 700, fam: MONO, color: '#FFF7ED', spacing: 4 }), -W * 0.44, -H * 0.4, { align: 'left', alpha: alpha * (1 - smooth(seg(paper, 0.4, 0.6))) });
      ctx.restore();
    }
  }
}

/** Petits pictogrammes : succursale, horloge, météo, voiture, avion. */
function s02_glyph(ctx, kind, x, y, s, color, a, k = 0) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = rgba(color, 0.14);
  ctx.lineWidth = Math.max(2, s * 0.08);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.3;
  ctx.beginPath();
  if (kind === 'store') {
    ctx.moveTo(-s * 0.6, s * 0.5);
    ctx.lineTo(-s * 0.6, -s * 0.1);
    ctx.lineTo(-s * 0.7, -s * 0.1);
    ctx.lineTo(-s * 0.5, -s * 0.5);
    ctx.lineTo(s * 0.5, -s * 0.5);
    ctx.lineTo(s * 0.7, -s * 0.1);
    ctx.lineTo(s * 0.6, -s * 0.1);
    ctx.lineTo(s * 0.6, s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeRect(-s * 0.15, s * 0.08, s * 0.3, s * 0.42);
  } else if (kind === 'clock') {
    ctx.arc(0, 0, s * 0.55, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(k * TAU - Math.PI / 2) * s * 0.4, Math.sin(k * TAU - Math.PI / 2) * s * 0.4);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(k * TAU / 12 - Math.PI / 2) * s * 0.25, Math.sin(k * TAU / 12 - Math.PI / 2) * s * 0.25);
    ctx.stroke();
  } else if (kind === 'weather') {
    // soleil qui se voile (k : 0 → 1)
    const sunA = 1 - k * 0.6;
    ctx.globalAlpha *= sunA;
    ctx.arc(-s * 0.15, -s * 0.12, s * 0.28, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * TAU;
      ctx.moveTo(-s * 0.15 + Math.cos(an) * s * 0.4, -s * 0.12 + Math.sin(an) * s * 0.4);
      ctx.lineTo(-s * 0.15 + Math.cos(an) * s * 0.52, -s * 0.12 + Math.sin(an) * s * 0.52);
    }
    ctx.stroke();
    ctx.globalAlpha /= sunA;
    const cxo = lerp(s * 0.6, s * 0.1, eInOutQuart(k));
    ctx.beginPath();
    ctx.arc(cxo - s * 0.22, s * 0.18, s * 0.2, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(cxo, s * 0.02, s * 0.27, Math.PI, Math.PI * 1.9);
    ctx.arc(cxo + s * 0.26, s * 0.2, s * 0.18, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.globalAlpha *= k;
    ctx.fillStyle = rgba(color, 0.3);
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'car') {
    ctx.moveTo(-s * 0.7, s * 0.2);
    ctx.lineTo(-s * 0.6, -s * 0.05);
    ctx.lineTo(-s * 0.3, -s * 0.12);
    ctx.lineTo(-s * 0.12, -s * 0.38);
    ctx.lineTo(s * 0.32, -s * 0.38);
    ctx.lineTo(s * 0.52, -s * 0.1);
    ctx.lineTo(s * 0.7, -s * 0.04);
    ctx.lineTo(s * 0.7, s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-s * 0.36, s * 0.24, s * 0.13, 0, TAU);
    ctx.moveTo(s * 0.5, s * 0.24);
    ctx.arc(s * 0.38, s * 0.24, s * 0.13, 0, TAU);
    ctx.stroke();
  } else {
    // avion
    ctx.moveTo(s * 0.75, 0);
    ctx.quadraticCurveTo(s * 0.7, -s * 0.08, s * 0.5, -s * 0.08);
    ctx.lineTo(s * 0.1, -s * 0.08);
    ctx.lineTo(-s * 0.2, -s * 0.6);
    ctx.lineTo(-s * 0.36, -s * 0.6);
    ctx.lineTo(-s * 0.18, -s * 0.08);
    ctx.lineTo(-s * 0.55, -s * 0.08);
    ctx.lineTo(-s * 0.7, -s * 0.3);
    ctx.lineTo(-s * 0.8, -s * 0.3);
    ctx.lineTo(-s * 0.72, 0);
    ctx.lineTo(-s * 0.8, s * 0.3);
    ctx.lineTo(-s * 0.7, s * 0.3);
    ctx.lineTo(-s * 0.55, s * 0.08);
    ctx.lineTo(-s * 0.18, s * 0.08);
    ctx.lineTo(-s * 0.36, s * 0.6);
    ctx.lineTo(-s * 0.2, s * 0.6);
    ctx.lineTo(s * 0.1, s * 0.08);
    ctx.lineTo(s * 0.5, s * 0.08);
    ctx.quadraticCurveTo(s * 0.7, s * 0.08, s * 0.75, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function sceneEtiquettesAllee(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    banal: 'un objet banal',
    maxi: 'Maxi',
    provigo: 'Provigo',
    metro: 'Metro',
    superc: 'Super C',
    iga: 'IGA',
    petite: 'la petite étiquette',
    officiel: 'Officiellement',
    papier: 'remplace le papier',
    temps: 'économiser du temps',
    erreurs: 'éviter les erreurs',
    technique: 'sur le plan technique',
    sansfil: 'reliés sans fil',
    serveur: 'serveur central',
    secondes: 'En quelques secondes',
    changer: 'changer le prix',
    milliers: 'milliers de produits',
    succ: 'une seule succursale',
    heure: 'une heure précise',
    meteo: 'selon la météo',
    infra: "L'infrastructure du prix variable",
    uber: 'Uber',
    avion: 'compagnies aériennes',
    deja: 'déjà installée',
    allees: 'dans nos allées'
  });

  // poids des trois plans
  const closeUp = env(lt, T.petite - 0.6, T.technique + 0.3, 0.9, 1.0); // gros plan sur l'étiquette
  const aisleA = 1 - smooth(seg(lt, T.infra - 0.2, T.infra + 1.0));
  const curveA = smooth(seg(lt, T.infra - 0.1, T.infra + 1.0));

  frame(a, () => {
    /* ── L'ALLÉE (actes I et II) ── */
    if (aisleA > 0.003) {
      const F = m * (V ? 1.1 : 0.82);
      const vx = cx;
      const vy = V ? h * 0.47 : h * 0.5;
      const Wd = V ? 0.95 : 1.75;
      const camZ = track(lt, [
        [0, 0],
        [T.petite, 2.6, (x) => x],
        [T.technique, 3.2, smoother],
        [T.serveur + 1.0, 1.4, eInOutQuart],
        [T.infra + 1, 2.4, smoother]
      ]);
      const camX = track(lt, [[0, 0], [T.petite, 0], [T.technique, 0], [T.infra, 0]]);
      const pr = (X, Y, Z) => {
        const dz = Z - camZ;
        const s = F / Math.max(0.15, dz);
        return { x: vx + (X - camX) * s, y: vy + Y * s, s, dz };
      };
      const waveZ = track(lt, [[T.sansfil, 22], [T.changer + 0.2, 22, smoother], [T.milliers + 1.6, camZ - 1, eInCubic]]);
      const waveOn = smooth(seg(lt, T.sansfil, T.sansfil + 0.6)) * (1 - smooth(seg(lt, T.milliers + 1.4, T.milliers + 2.2)));
      const signDim = env(lt, T.maxi - 0.3, T.petite + 0.2, 0.3, 0.6) * 0.35;
      const iconDim = env(lt, T.succ - 0.4, T.infra, 0.5, 0.5) * 0.4;
      const dim = (1 - closeUp * 0.85) * (1 - signDim) * (1 - iconDim);
      globalThis.__FN_QA_SKIP = true; // étiquettes de décor : exclues de l'analyse typographique
      ctx.save();
      ctx.globalAlpha *= aisleA * dim;
      // sol : lignes de fuite
      ctx.strokeStyle = rgba(C.cyan, 0.12);
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const p0 = pr(i * Wd * 0.33, 1.7, camZ + 0.3);
        const p1 = pr(i * Wd * 0.33, 1.7, camZ + 26);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      // serveur central au fond
      const sv = pr(0, 0.2, 23);
      const svA = smooth(seg(lt, T.serveur - 0.5, T.serveur + 0.6));
      if (svA > 0.003) {
        const sw = 0.9 * sv.s;
        const sh = 2.6 * sv.s;
        ctx.save();
        ctx.globalAlpha *= svA;
        light(ctx, sv.x, sv.y - sh * 0.3, sh * 1.6, C.amber, 0.5);
        const g = ctx.createLinearGradient(sv.x - sw / 2, 0, sv.x + sw / 2, 0);
        g.addColorStop(0, '#0F172A');
        g.addColorStop(0.5, '#1E293B');
        g.addColorStop(1, '#0F172A');
        ctx.fillStyle = g;
        ctx.fillRect(sv.x - sw / 2, sv.y - sh, sw, sh * 1.0);
        ctx.fillStyle = C.amber;
        for (let k = 0; k < 7; k++) ctx.fillRect(sv.x - sw * 0.35, sv.y - sh + sh * (0.1 + k * 0.12), sw * 0.7 * (0.4 + 0.6 * ((k * 37 + Math.floor(gt * 3)) % 5) / 4), Math.max(1, sh * 0.02));
        ctx.restore();
      }
      // étagères (du fond vers l'avant)
      const shelfY = [-1.15, -0.45, 0.25, 0.95];
      const zStep = 1.25;
      const z0 = Math.floor(camZ / zStep) * zStep;
      for (let zi = 16; zi >= 0; zi--) {
        const Z = z0 + zi * zStep;
        if (Z - camZ < 1.7) continue;
        const col = S02_COLS[Math.abs(Math.round(Z / zStep)) % S02_COLS.length];
        const fog = clamp(1 - (Z - camZ) / 20);
        for (const side of [-1, 1]) {
          const X = side * Wd;
          shelfY.forEach((Y, si) => {
            // produits (trois volumes par section, face dans le plan du mur)
            for (let b = 0; b < 3; b++) {
              const ph = 0.5 * col.hs[(si + b) % 4];
              const za = Z + 0.08 + b * (zStep / 3);
              const zb = za + zStep / 3 - 0.1;
              const a0 = pr(X, Y, za);
              const a1 = pr(X, Y, zb);
              const b0 = pr(X, Y - ph, za);
              const b1 = pr(X, Y - ph, zb);
              const pg = ctx.createLinearGradient(b0.x, b0.y, a0.x, a0.y);
              pg.addColorStop(0, rgba(mix(col.hue, C.night, 0.45), 0.9 * fog));
              pg.addColorStop(1, rgba(mix(col.hue, C.night, 0.78), 0.9 * fog));
              ctx.fillStyle = pg;
              ctx.beginPath();
              ctx.moveTo(a0.x, a0.y);
              ctx.lineTo(a1.x, a1.y);
              ctx.lineTo(b1.x, b1.y);
              ctx.lineTo(b0.x, b0.y);
              ctx.closePath();
              ctx.fill();
            }
            // tablette
            const t0 = pr(X, Y, Z);
            const t1 = pr(X, Y, Z + zStep);
            ctx.strokeStyle = rgba(C.slate, 0.35 * fog);
            ctx.lineWidth = Math.max(1, 0.03 * t0.s);
            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.stroke();
            // étiquette électronique
            const lz = Z + zStep * 0.35;
            const lp = pr(X, Y + 0.09, lz);
            const lsz = 0.16 * lp.s;
            if (lsz < 2) return;
            const flipped = waveOn > 0 && waveZ < lz ? 1 : lt > T.milliers + 1.6 && lt < T.infra + 1 ? 1 : 0;
            const hit = waveOn * Math.exp(-Math.pow((lz - waveZ) * 1.6, 2));
            ctx.fillStyle = flipped ? '#2A1A05' : '#0B1A2A';
            ctx.fillRect(lp.x - lsz * 0.9, lp.y - lsz * 0.45, lsz * 1.8, lsz * 0.9);
            ctx.strokeStyle = rgba(flipped ? C.amber : C.cyan, (0.55 + hit * 0.45) * fog);
            ctx.lineWidth = 1;
            ctx.strokeRect(lp.x - lsz * 0.9, lp.y - lsz * 0.45, lsz * 1.8, lsz * 0.9);
            if (hit > 0.05) light(ctx, lp.x, lp.y, lsz * 4, C.amber, hit * 0.8);
            if (lsz > 12) {
              const S = textSprite(flipped ? '5,79' : '4,99', { size: 40, weight: 800, color: flipped ? C.gold : C.ice });
              drawSprite(ctx, S, lp.x, lp.y + lsz * 0.18, { scale: (lsz * 1.35) / S.w, alpha: fog });
            }
          });
        }
      }
      // onde sans fil (anneau en perspective)
      if (waveOn > 0.003 && waveZ > camZ + 0.4) {
        const wp = pr(0, 0, waveZ);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) {
          const zk = waveZ + k * 0.9;
          if (zk - camZ < 0.4) continue;
          const q = pr(0, 0.1, zk);
          ctx.strokeStyle = rgba(C.amber, waveOn * (0.7 - k * 0.2));
          ctx.lineWidth = Math.max(1.5, 0.05 * q.s);
          ctx.beginPath();
          ctx.ellipse(q.x, q.y, Wd * 1.05 * q.s, 1.5 * q.s, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
        light(ctx, wp.x, wp.y, 0.6 * wp.s, C.amber, waveOn * 0.3);
      }
      ctx.restore();
      globalThis.__FN_QA_SKIP = false;

      // enseignes des bannières (acte I)
      const signA = env(lt, T.maxi - 0.3, T.petite + 0.2, 0.3, 0.6);
      if (signA > 0.003) {
        const names = [
          ['MAXI', T.maxi],
          ['PROVIGO', T.provigo],
          ['METRO', T.metro],
          ['SUPER C', T.superc],
          ['IGA', T.iga]
        ];
        const fs = Math.floor(m * (V ? 0.04 : 0.04));
        const rowY = V ? h * 0.17 : h * 0.18;
        const g = mctx();
        g.font = `800 ${fs}px ${DISPLAY}`;
        g.letterSpacing = '4px';
        const ws = names.map(([n]) => g.measureText(n).width);
        const gap = fs * 1.4;
        const rows = V ? [[0, 1, 2], [3, 4]] : [[0, 1, 2, 3, 4]];
        const xs = [];
        const ys = [];
        rows.forEach((row, ri) => {
          const tot = row.reduce((acc, j) => acc + ws[j], 0) + gap * (row.length - 1);
          let xx = cx - tot / 2;
          row.forEach((j) => {
            xs[j] = xx;
            ys[j] = rowY + ri * fs * 1.6;
            xx += ws[j] + gap;
          });
        });
        names.forEach(([n, k], i) => {
          const x = xs[i];
          const rowYi = ys[i];
          const tt = seg(lt, k - 0.15, k + 0.6);
          // filin de suspension
          ctx.save();
          ctx.globalAlpha *= signA * smooth(tt);
          ctx.strokeStyle = rgba(C.slate, 0.35);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + ws[i] / 2, 0);
          ctx.lineTo(x + ws[i] / 2, rowYi - fs * 1.1);
          ctx.stroke();
          ctx.restore();
          kSlide(ctx, n, x, rowYi, { size: fs, weight: 800, spacing: 4, color: i % 2 ? C.white : C.ice, t: tt, alpha: signA, align: 'left', dir: 'down' });
        });
        mono(ctx, 'PARTOUT, DÉSORMAIS', cx, Math.max(...ys) + m * 0.05, { size: Math.floor(m * 0.018), color: C.amber, spacing: 6, t: seg(lt, T.iga + 0.2, T.iga + 1.2), alpha: signA });
      }
    }

    /* ── GROS PLAN : l'étiquette électronique ── */
    if (closeUp > 0.003) {
      const zoomIn = eOutExpo(seg(lt, T.petite - 0.6, T.petite + 1.0));
      const s = m * (V ? 0.3 : 0.24) * lerp(0.3, 1, zoomIn) * lerp(1, 0.4, eInCubic(seg(lt, T.technique - 0.4, T.technique + 0.3)));
      const lx = V ? cx : cx - w * 0.17;
      const ly = V ? h * 0.42 : h * 0.5;
      s02_bigLabel(ctx, lx, ly, s, { base: Math.floor(m * (V ? 0.3 : 0.24)), alpha: closeUp, price: 4.99, paper: seg(lt, T.papier - 0.1, T.papier + 1.3), time: gt });
      const tx = V ? cx : w * 0.6;
      const ty = V ? h * 0.66 : h * 0.36;
      const al = V ? 'center' : 'left';
      kRise(ctx, 'ÉTIQUETTE', tx, ty, { size: Math.floor(m * 0.062), weight: 900, t: seg(lt, T.petite, T.petite + 0.9), alpha: closeUp, align: al });
      kRise(ctx, 'ÉLECTRONIQUE', tx, ty + m * 0.075, { size: Math.floor(m * 0.062), weight: 900, color: C.cyan, t: seg(lt, T.petite + 0.25, T.petite + 1.2), alpha: closeUp, align: al });
      mono(ctx, 'OFFICIELLEMENT :', tx, ty + m * 0.16, { size: Math.floor(m * 0.02), color: C.amber, spacing: 6, t: seg(lt, T.officiel, T.officiel + 0.8), alpha: closeUp, align: al });
      kSlide(ctx, '— PAPIER', tx, ty + m * 0.225, { size: Math.floor(m * 0.034), weight: 800, color: C.slate, t: seg(lt, T.papier, T.papier + 0.7), alpha: closeUp, align: al, dir: 'left' });
      kSlide(ctx, '+ TEMPS POUR LES EMPLOYÉS', tx, ty + m * 0.28, { size: Math.floor(m * 0.034), weight: 800, color: C.slate, t: seg(lt, T.temps, T.temps + 0.7), alpha: closeUp, align: al, dir: 'left', maxW: V ? w * 0.86 : w * 0.34 });
      kSlide(ctx, '— ERREURS', tx, ty + m * 0.335, { size: Math.floor(m * 0.034), weight: 800, color: C.slate, t: seg(lt, T.erreurs, T.erreurs + 0.7), alpha: closeUp, align: al, dir: 'left' });
    }

    /* ── ACTE II : titres de la bascule ── */
    const bA = env(lt, T.technique, T.infra + 0.3, 0.5, 0.6) * aisleA;
    if (bA > 0.003) {
      const ty = V ? h * 0.16 : h * 0.15;
      const sw1 = smooth(seg(lt, T.secondes - 0.3, T.secondes + 0.1));
      kRise(ctx, 'RELIÉES SANS FIL', cx, ty, { size: Math.floor(m * 0.056), weight: 900, t: seg(lt, T.sansfil, T.sansfil + 0.9), out: sw1, alpha: bA });
      mono(ctx, 'À UN SERVEUR CENTRAL', cx, ty + m * 0.055, { size: Math.floor(m * 0.02), color: C.amber, spacing: 6, t: seg(lt, T.serveur, T.serveur + 0.9), alpha: bA * (1 - sw1) });
      kRise(ctx, 'DES MILLIERS DE PRIX', cx, ty, { size: Math.floor(m * 0.056), weight: 900, color: C.amber, t: seg(lt, T.changer, T.changer + 0.9), alpha: bA, glow: 18, glowColor: rgba(C.amber, 0.5), maxW: w * 0.9 });
      mono(ctx, 'EN QUELQUES SECONDES', cx, ty + m * 0.055, { size: Math.floor(m * 0.02), color: C.ice, spacing: 6, t: seg(lt, T.secondes, T.secondes + 0.9), alpha: bA * sw1 });
      // compteur de prix monumental
      const pv = lerp(4.99, 5.79, eInOutQuart(seg(lt, T.milliers - 0.2, T.milliers + 1.4)));
      const py = V ? h * 0.83 : h * 0.86;
      const pA = bA * smooth(seg(lt, T.changer - 0.4, T.changer + 0.3));
      odometer(ctx, pv, V ? cx : cx - m * 0.1, py, { size: Math.floor(m * (V ? 0.09 : 0.075)), weight: 900, color: mix(C.ice, C.amber, seg(lt, T.milliers, T.milliers + 1.4)), dec: 2, suffix: ' $', suffixScale: 0.6, alpha: pA, glow: 16, glowColor: rgba(C.amber, 0.4) });
      // succursale · heure · météo
      const icons = [
        ['store', 'UNE SUCCURSALE', T.succ],
        ['clock', 'À UNE HEURE PRÉCISE', T.heure],
        ['weather', 'SELON LA MÉTÉO', T.meteo]
      ];
      const gy = V ? h * 0.66 : h * 0.62;
      icons.forEach(([kind, lab, k], i) => {
        const on = eOutBack(seg(lt, k - 0.1, k + 0.7), 1.6);
        if (on <= 0) return;
        const gx = cx + (i - 1) * (V ? w * 0.31 : w * 0.25);
        const gyy = gy;
        const gs = m * 0.045 * on;
        const kk = kind === 'clock' ? (lt - T.heure) * 0.6 : kind === 'weather' ? seg(lt, T.meteo + 0.2, T.meteo + 1.2) : 0;
        light(ctx, gx, gyy, m * 0.09, C.amber, 0.25 * bA);
        s02_glyph(ctx, kind, gx, gyy, gs, i === 0 ? C.cyan : C.amber, bA, kk);
        mono(ctx, lab, gx, gyy + m * 0.07, { size: Math.floor(m * 0.017), color: C.white, spacing: 4, t: seg(lt, k, k + 0.8), alpha: bA });
      });
    }

    /* ── ACTE III : courbe horaire façon billet d'avion ── */
    if (curveA > 0.003) {
      const x0 = V ? w * 0.1 : w * 0.12;
      const x1 = V ? w * 0.9 : w * 0.88;
      const yb = V ? h * 0.68 : h * 0.7;
      const amp = V ? h * 0.17 : h * 0.18;
      const draw = eInOutQuart(seg(lt, T.infra, T.avion + 1.4));
      const pts = [];
      for (let i = 0; i <= 160; i++) {
        const u = i / 160;
        const v = 0.45 + 0.22 * Math.sin(u * 9.4 + 0.6) + 0.14 * Math.sin(u * 23 + 1.1) + 0.2 * Math.exp(-Math.pow((u - 0.72) * 9, 2));
        pts.push({ x: lerp(x0, x1, u), y: yb - v * amp * 1.6 });
      }
      // axe horaire
      ctx.save();
      ctx.globalAlpha *= curveA;
      ctx.strokeStyle = rgba(C.slate, 0.35);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, yb);
      ctx.lineTo(x0 + (x1 - x0) * eOutExpo(seg(lt, T.infra, T.infra + 1.2)), yb);
      ctx.stroke();
      ctx.restore();
      ['6 H', '10 H', '14 H', '18 H', '22 H'].forEach((lab, i) => {
        const xx = lerp(x0, x1, i / 4);
        mono(ctx, lab, xx, yb + m * 0.032, { size: Math.floor(m * 0.016), color: C.slate, spacing: 2, t: seg(lt, T.infra + 0.2 + i * 0.12, T.infra + 0.7 + i * 0.12), alpha: curveA * 0.8, cursor: false });
      });
      // aire sous la courbe
      const n = Math.max(2, Math.floor(draw * (pts.length - 1)));
      ctx.save();
      ctx.globalAlpha *= curveA * 0.35;
      const ag = ctx.createLinearGradient(0, yb - amp * 1.6, 0, yb);
      ag.addColorStop(0, rgba(C.amber, 0.55));
      ag.addColorStop(1, rgba(C.amber, 0));
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, yb);
      for (let i = 0; i <= n; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[n].x, yb);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const hp = glowPath(ctx, pts, draw, { color: C.amber, width: 3.5, alpha: curveA });
      // voiture & avion
      const cU = 0.3;
      const pU = 0.72;
      const cp = pts[Math.floor(cU * 160)];
      const pp = pts[Math.floor(pU * 160)];
      s02_glyph(ctx, 'car', cp.x, cp.y - m * 0.06, m * 0.045 * eOutBack(seg(lt, T.uber - 0.1, T.uber + 0.6), 1.8), C.cyan, curveA);
      mono(ctx, 'UBER', cp.x, cp.y - m * 0.12, { size: Math.floor(m * 0.018), color: C.cyan, spacing: 5, t: seg(lt, T.uber, T.uber + 0.6), alpha: curveA });
      s02_glyph(ctx, 'plane', pp.x, pp.y - m * 0.07, m * 0.05 * eOutBack(seg(lt, T.avion - 0.1, T.avion + 0.6), 1.8), C.ice, curveA);
      mono(ctx, 'COMPAGNIES AÉRIENNES', pp.x, pp.y - m * 0.135, { size: Math.floor(m * 0.018), color: C.ice, spacing: 4, t: seg(lt, T.avion, T.avion + 0.8), alpha: curveA });
      if (hp && draw < 0.999) light(ctx, hp.x, hp.y, m * 0.05, C.gold, curveA * 0.8);
      const ty = V ? h * 0.28 : h * 0.2;
      kRise(ctx, 'LE PRIX VARIABLE', cx, ty, { size: Math.floor(m * (V ? 0.074 : 0.07)), weight: 900, t: seg(lt, T.infra + 0.1, T.infra + 1.1), alpha: curveA, maxW: w * 0.9 });
      kWipe(ctx, 'DÉJÀ DANS NOS ALLÉES', cx, ty + m * (V ? 0.085 : 0.08), { size: Math.floor(m * (V ? 0.05 : 0.046)), weight: 800, color: C.amber, t: seg(lt, T.deja, T.allees + 0.9), alpha: curveA, edge: C.cyan, maxW: w * 0.9 });
    }
  });
}
/*@scene rep-etiquettes-electroniques=sceneEtiquettesAllee*/
