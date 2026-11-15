/* Acte I   : un document CONFIDENTIEL ; une ligne caviardée se révèle : « CONTRÔLES DE PROPRIÉTÉ »
 * Acte II  : plongée zénithale sur le plan d'un centre commercial ; le supermarché rayonne ; des barrières
 *            laser verrouillent les locaux ; épicier, magasin à 1 $ et boulangerie rebondissent
 * Acte III : frise FÉV. 2025 → SEPT. 2026 ; le marteau du Bureau de la concurrence brise les barrières */

/** Plan du centre commercial (coordonnées écran à zoom 1), propre à chaque format. */
function s07_plan(w, h, V) {
  if (V) {
    return {
      mall: [0.08 * w, 0.3 * h, 0.84 * w, 0.36 * h],
      anchor: [0.1 * w, 0.32 * h, 0.8 * w, 0.12 * h],
      units: [
        [0.1, 0.455], [0.3, 0.455], [0.5, 0.455], [0.7, 0.455],
        [0.1, 0.555], [0.3, 0.555], [0.5, 0.555], [0.7, 0.555]
      ].map(([x, y], i) => ({ x: x * w, y: y * h, w: 0.19 * w, h: 0.088 * h, id: `L-0${i + 1}` })),
      lot: [0.08 * w, 0.68 * h, 0.84 * w, 0.14 * h]
    };
  }
  return {
    mall: [0.15 * w, 0.27 * h, 0.7 * w, 0.4 * h],
    anchor: [0.17 * w, 0.3 * h, 0.25 * w, 0.34 * h],
    units: [
      [0.44, 0.3], [0.54, 0.3], [0.64, 0.3], [0.74, 0.3],
      [0.44, 0.48], [0.54, 0.48], [0.64, 0.48], [0.74, 0.48]
    ].map(([x, y], i) => ({ x: x * w, y: y * h, w: 0.092 * w, h: 0.16 * h, id: `L-0${i + 1}` })),
    lot: [0.15 * w, 0.71 * h, 0.7 * w, 0.17 * h]
  };
}

function s07_pin(ctx, x, y, s, kind, color, a) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  light(ctx, x, y, s * 2.4, color, 0.45);
  ctx.fillStyle = 'rgba(6,12,20,0.95)';
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.beginPath();
  ctx.arc(x, y, s, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (kind === 'cart') {
    ctx.moveTo(-s * 0.55, -s * 0.35);
    ctx.lineTo(-s * 0.35, -s * 0.35);
    ctx.lineTo(-s * 0.2, s * 0.2);
    ctx.lineTo(s * 0.45, s * 0.2);
    ctx.lineTo(s * 0.55, -s * 0.2);
    ctx.lineTo(-s * 0.28, -s * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-s * 0.12, s * 0.42, s * 0.09, 0, TAU);
    ctx.arc(s * 0.35, s * 0.42, s * 0.09, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (kind === 'bread') {
    ctx.moveTo(-s * 0.55, s * 0.15);
    ctx.quadraticCurveTo(-s * 0.55, -s * 0.4, 0, -s * 0.4);
    ctx.quadraticCurveTo(s * 0.55, -s * 0.4, s * 0.55, s * 0.15);
    ctx.lineTo(s * 0.45, s * 0.3);
    ctx.lineTo(-s * 0.45, s * 0.3);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    for (const dx of [-0.22, 0, 0.22]) {
      ctx.moveTo((dx - 0.08) * s, -s * 0.18);
      ctx.lineTo((dx + 0.08) * s, s * 0.05);
    }
    ctx.stroke();
  }
  ctx.restore();
  if (kind === 'dollar') drawSprite(ctx, textSprite('1 $', { size: Math.floor(s * 0.75), weight: 900, color }), x, y, { base: 'middle', alpha: a });
}

function sceneBauxSecrets(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const D = scene.duration;
  const T = cues(scene, {
    secrets: 'secrets les mieux gardés',
    immo: "l'immobilier commercial",
    bureau: 'révélé par le Bureau',
    controles: 'contrôles de propriété',
    annees: 'Pendant des années',
    chaines: 'grandes chaînes',
    baux: 'leurs baux',
    actes: 'actes de vente',
    clauses: "clauses d'exclusivité",
    proprio: 'au propriétaire',
    louer: 'de louer un local',
    epicier: 'un autre épicier',
    dollar: 'un magasin à un dollar',
    boul: 'une boulangerie',
    frais: 'produits frais',
    fev: 'En février',
    loblaw: 'Loblaw a accepté',
    reculer: 'de reculer',
    sept: 'en septembre',
    cour: 'Cour fédérale',
    sobeys: 'Empire-Sobeys a dû',
    entente: 'entente juridiquement contraignante',
    fin: 'y mettre fin'
  });

  const PL = s07_plan(w, h, V);
  const dive = eInOutQuart(seg(lt, T.annees - 0.8, T.annees + 1.0));
  const planA = smooth(seg(lt, T.annees - 0.6, T.annees + 0.4));
  const smash = seg(lt, T.entente + 0.15, T.entente + 0.5); // impact du marteau
  const freed = smooth(seg(lt, T.entente + 0.3, T.entente + 1.2));
  // caméra du plan : vue d'ensemble → rapproché sur les locaux → recul pour la frise
  const anc = PL.anchor;
  const uc = PL.units;
  const unitsC = { x: (uc[0].x + uc[7].x + uc[7].w) / 2, y: (uc[0].y + uc[7].y + uc[7].h) / 2 };
  const fx = track(lt, [[0, cx], [T.clauses - 0.5, cx], [T.clauses + 1.2, V ? cx : unitsC.x - w * 0.05, eInOutQuart], [T.fev - 0.6, V ? cx : unitsC.x - w * 0.05], [T.fev + 1.0, cx, eInOutQuart]]);
  const fy = track(lt, [[0, cy], [T.clauses - 0.5, cy], [T.clauses + 1.2, unitsC.y, eInOutQuart], [T.fev - 0.6, unitsC.y], [T.fev + 1.0, V ? cy + h * 0.06 : cy - h * 0.08, eInOutQuart]]);
  const zoom = track(lt, [[0, 0.6], [T.annees - 0.8, 0.6], [T.annees + 1.0, 1.0, eOutCubic], [T.clauses - 0.5, 1.0], [T.clauses + 1.2, V ? 1.12 : 1.25, eInOutQuart], [T.fev - 0.6, V ? 1.12 : 1.25], [T.fev + 1.0, 0.86, eInOutQuart]]);

  frame(a, () => {
    /* ── ACTE I : le document confidentiel ── */
    const dA = 1 - smooth(seg(lt, T.annees - 0.6, T.annees + 0.3));
    if (dA > 0.003) {
      const dw = V ? w * 0.66 : w * 0.27;
      const dh = dw * 1.25;
      const dx = cx;
      const dy = V ? h * 0.56 : h * 0.62;
      const slide = eOutExpo(seg(lt, 0.1, 1.4));
      ctx.save();
      ctx.globalAlpha *= dA * slide;
      ctx.translate(dx, dy + (1 - slide) * h * 0.2);
      ctx.rotate(lerp(-0.08, -0.03, slide) + 0.02 * dive);
      ctx.scale(lerp(1, 1.6, dive), lerp(1, 1.6, dive));
      light(ctx, 0, 0, dw, C.ice, 0.12);
      rrect(ctx, -dw / 2, -dh / 2, dw, dh, dw * 0.02);
      ctx.fillStyle = '#E8EDF3';
      ctx.fill();
      // lignes caviardées
      const rr = rng(707);
      for (let l = 0; l < 11; l++) {
        const yy = -dh * 0.3 + l * dh * 0.06;
        const ww = dw * (0.5 + rr() * 0.32);
        ctx.fillStyle = l === 5 ? 'rgba(0,0,0,0)' : '#0B1220';
        if (l !== 5) ctx.fillRect(-dw * 0.4, yy, ww, dh * 0.026);
      }
      ctx.restore();
      // ligne révélée (balayage de lumière) — dessinée hors de la transformation pour rester nette
      const ly = dy - dh * 0.3 + 5 * dh * 0.06 + dh * 0.026 + (1 - slide) * h * 0.2;
      const rev = seg(lt, T.bureau, T.controles + 0.8);
      const redA = dA * slide * (1 - smooth(seg(rev, 0, 0.15)));
      ctx.save();
      ctx.globalAlpha *= redA;
      ctx.fillStyle = '#0B1220';
      ctx.fillRect(dx - dw * 0.4, ly - dh * 0.026, dw * 0.8, dh * 0.026);
      ctx.restore();
      kWipe(ctx, '« CONTRÔLES DE PROPRIÉTÉ »', dx, ly, { size: Math.floor(m * (V ? 0.036 : 0.03)), weight: 900, color: '#B45309', t: seg(lt, T.controles - 0.3, T.controles + 0.8), alpha: dA * slide, edge: C.amber, maxW: dw * 0.86 });
      // tampon CONFIDENTIEL
      const st = eOutBack(seg(lt, T.secrets - 0.2, T.secrets + 0.4), 1.4);
      if (st > 0) {
        ctx.save();
        ctx.globalAlpha *= dA * clamp(st);
        ctx.translate(dx + dw * 0.18, dy - dh * 0.4 + (1 - slide) * h * 0.2);
        ctx.rotate(-0.12);
        ctx.scale(lerp(1.8, 1, clamp(st)), lerp(1.8, 1, clamp(st)));
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.strokeRect(-dw * 0.22, -dh * 0.035, dw * 0.44, dh * 0.07);
        drawSprite(ctx, textSprite('CONFIDENTIEL', { size: Math.floor(m * (V ? 0.026 : 0.022)), weight: 800, fam: MONO, color: C.red, spacing: 5 }), 0, 0, { base: 'middle' });
        ctx.restore();
      }
      const ty = V ? h * 0.17 : h * 0.17;
      kRise(ctx, 'UN SECRET BIEN GARDÉ', cx, ty, { size: Math.floor(m * (V ? 0.062 : 0.058)), weight: 900, t: seg(lt, T.secrets - 0.2, T.secrets + 0.8), alpha: dA, maxW: w * 0.9 });
      mono(ctx, "DE L'IMMOBILIER COMMERCIAL", cx, ty + m * 0.055, { size: Math.floor(m * 0.019), color: C.ice, spacing: 5, t: seg(lt, T.immo, T.immo + 0.9), alpha: dA });
      mono(ctx, 'RÉVÉLÉ PAR LE BUREAU DE LA CONCURRENCE', cx, ty + m * 0.09, { size: Math.floor(m * 0.017), color: C.amber, spacing: 4, t: seg(lt, T.bureau, T.bureau + 1.2), alpha: dA });
    }

    /* ── ACTE II : le plan d'architecte ── */
    if (planA > 0.003) {
      camera(ctx, stage, fx, fy, zoom, () => {
        ctx.save();
        ctx.globalAlpha *= planA;
        // trame bleue
        ctx.strokeStyle = rgba(C.cyan, 0.08);
        ctx.lineWidth = 1;
        const step = m * 0.04;
        for (let x = -w * 0.2; x < w * 1.2; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, -h * 0.2);
          ctx.lineTo(x, h * 1.2);
          ctx.stroke();
        }
        for (let y = -h * 0.2; y < h * 1.2; y += step) {
          ctx.beginPath();
          ctx.moveTo(-w * 0.2, y);
          ctx.lineTo(w * 1.2, y);
          ctx.stroke();
        }
        // enveloppe du centre commercial
        const draw = eInOutQuart(seg(lt, T.annees - 0.4, T.annees + 1.6));
        const [mx, my, mw, mh] = PL.mall;
        ctx.setLineDash([mw * 2 * draw + 1, mw * 4]);
        ctx.strokeStyle = rgba(C.ice, 0.75);
        ctx.lineWidth = 2;
        ctx.strokeRect(mx, my, mw, mh);
        ctx.setLineDash([]);
        // stationnement
        const [px, py, pw, ph] = PL.lot;
        ctx.strokeStyle = rgba(C.slate, 0.25 * draw * (1 - smooth(seg(lt, T.fev - 0.6, T.fev + 0.4))));
        for (let k = 0; k <= 16; k++) {
          const xx = px + (pw * k) / 16;
          ctx.beginPath();
          ctx.moveTo(xx, py);
          ctx.lineTo(xx, py + ph * 0.38);
          ctx.moveTo(xx, py + ph * 0.62);
          ctx.lineTo(xx, py + ph);
          ctx.stroke();
        }
        ctx.restore();
        // supermarché d'ancrage
        const [ax, ay, aw, ah] = anc;
        const aOn = smooth(seg(lt, T.chaines - 0.3, T.chaines + 0.6));
        ctx.save();
        ctx.globalAlpha *= planA;
        light(ctx, ax + aw / 2, ay + ah / 2, Math.max(aw, ah) * 0.9, C.amber, 0.45 * aOn);
        ctx.fillStyle = rgba(C.amber, 0.12 + 0.18 * aOn);
        ctx.fillRect(ax, ay, aw, ah);
        ctx.strokeStyle = mix(C.ice, C.amber, aOn);
        ctx.lineWidth = 2.5;
        ctx.strokeRect(ax, ay, aw, ah);
        ctx.restore();
        drawSprite(ctx, textSprite('SUPERMARCHÉ', { size: Math.floor(m * 0.026), weight: 900, color: C.gold, spacing: 4 }), ax + aw / 2, ay + ah / 2, { base: 'middle', alpha: planA * aOn });
        drawSprite(ctx, textSprite('GRANDE CHAÎNE', { size: Math.floor(m * 0.015), weight: 600, fam: MONO, color: C.amber, spacing: 4 }), ax + aw / 2, ay + ah / 2 + m * 0.035, { base: 'middle', alpha: planA * aOn });
        // locaux
        const lockOn = eInOutQuart(seg(lt, T.clauses - 0.2, T.clauses + 1.2));
        uc.forEach((u, i) => {
          const fr = freed * smooth(seg(lt, T.entente + 0.3 + i * 0.08, T.entente + 0.9 + i * 0.08));
          const col = mix(mix(C.ice, C.red, lockOn * (1 - fr)), C.emerald, fr);
          ctx.save();
          ctx.globalAlpha *= planA * smooth(seg(lt, T.annees + 0.2 + i * 0.1, T.annees + 0.8 + i * 0.1));
          ctx.fillStyle = rgba(col, 0.06 + 0.1 * fr);
          ctx.fillRect(u.x, u.y, u.w, u.h);
          ctx.strokeStyle = rgba(col, 0.7);
          ctx.lineWidth = 1.5;
          ctx.strokeRect(u.x, u.y, u.w, u.h);
          ctx.restore();
          drawSprite(ctx, textSprite(u.id, { size: Math.floor(m * 0.016), weight: 500, fam: MONO, color: C.slate, spacing: 2 }), u.x + u.w / 2, u.y + u.h * 0.22, { base: 'middle', alpha: planA * 0.7 });
        });
        // barrières laser (façade de chaque local) + chaînes « CLAUSE EXCLUSIVE »
        const barA = planA * lockOn * (1 - (smash > 0 ? 1 : 0));
        if (barA > 0.003) {
          uc.forEach((u, i) => {
            const by = u.y + u.h * 0.92;
            const bOn = seg(lockOn, i * 0.08, i * 0.08 + 0.4);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha *= barA * bOn * (0.85 + 0.15 * Math.sin(gt * 9 + i));
            ctx.strokeStyle = C.red;
            ctx.lineWidth = 3;
            ctx.shadowColor = C.red;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(u.x + u.w * 0.08, by);
            ctx.lineTo(u.x + u.w * (0.08 + 0.84 * bOn), by);
            ctx.stroke();
            ctx.restore();
          });
          const chainA = barA * smooth(seg(lt, T.proprio - 0.2, T.proprio + 0.6)) * (1 - smooth(seg(lt, T.fev - 0.8, T.fev - 0.2)));
          const lab = V ? { x: cx, y: PL.mall[1] - m * 0.03 } : { x: unitsC.x, y: uc[0].y - m * 0.025 };
          drawSprite(ctx, textSprite('CLAUSE EXCLUSIVE', { size: Math.floor(m * (V ? 0.024 : 0.018)), weight: 600, fam: MONO, color: C.red, spacing: 6 }), lab.x, lab.y, { base: 'middle', alpha: chainA });
        }
        // éclats des barrières brisées
        if (smash > 0 && smash < 1) {
          const rr = rng(77);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          uc.forEach((u, i) => {
            const by = u.y + u.h * 0.92;
            for (let k = 0; k < 7; k++) {
              const sx = u.x + u.w * (0.1 + k * 0.12);
              const vx = (rr() - 0.5) * m * 0.25;
              const vy = (rr() - 0.5) * m * 0.25;
              const e = eOutCubic(smash);
              ctx.globalAlpha = (1 - smash) * 0.9;
              ctx.strokeStyle = k % 2 ? C.amber : C.red;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(sx + vx * e, by + vy * e);
              ctx.lineTo(sx + vx * e + u.w * 0.08 * Math.cos(rr() * TAU), by + vy * e + u.w * 0.08 * Math.sin(rr() * TAU));
              ctx.stroke();
            }
          });
          ctx.restore();
        }
        // concurrents qui rebondissent (puis entrent quand les barrières tombent)
        const tries = [
          { kind: 'cart', col: C.emerald, k: T.epicier, unit: 5, lab: 'ÉPICIER' },
          { kind: 'dollar', col: C.ice, k: T.dollar, unit: 6, lab: 'MAGASIN À 1 $' },
          { kind: 'bread', col: C.gold, k: T.boul, unit: 7, lab: 'BOULANGERIE' }
        ];
        tries.forEach((tr, j) => {
          const u = uc[tr.unit];
          const front = u.y + u.h * 0.92;
          const outside = PL.lot[1] + PL.lot[3] * 0.5;
          const doorX = u.x + u.w / 2;
          const startX = doorX;
          const app = seg(lt, tr.k - 0.2, tr.k + 0.7);
          if (app <= 0) return;
          const tIn = lt - (tr.k + 0.7);
          let yy;
          let xx = startX;
          if (lt < T.entente + 0.5) {
            const reach = lerp(outside, front + m * 0.03, eInCubic(app));
            const bounce = tIn > 0 ? Math.exp(-tIn * 3) * Math.abs(Math.sin(tIn * 9)) * m * 0.07 : 0;
            yy = reach + bounce + (tIn > 0 ? m * 0.05 * smooth(clamp(tIn * 2)) : 0);
          } else {
            const go = eInOutQuart(seg(lt, T.entente + 0.6 + j * 0.15, T.entente + 1.8 + j * 0.15));
            const rest = front + m * 0.08;
            yy = lerp(rest, u.y + u.h * 0.55, go);
            xx = lerp(startX, doorX, go);
          }
          const pA = planA * smooth(app * 3);
          s07_pin(ctx, xx, yy, m * 0.026, tr.kind, tr.col, pA);
          drawSprite(ctx, textSprite(tr.lab, { size: Math.floor(m * 0.015), weight: 600, fam: MONO, color: tr.col, spacing: 3 }), xx, yy + m * 0.05, { base: 'middle', alpha: pA * (1 - freed) });
          if (tIn > 0 && tIn < 0.5 && lt < T.entente) light(ctx, xx, front, m * 0.06, C.red, (1 - tIn * 2) * 0.8);
        });
      });

      // titres de l'acte II (hors caméra, tailles fixes)
      const t2A = planA * (1 - smooth(seg(lt, T.fev - 0.6, T.fev)));
      const ty = V ? h * 0.15 : h * 0.13;
      const swap = smooth(seg(lt, T.clauses - 0.4, T.clauses));
      mono(ctx, 'BAUX · ACTES DE VENTE', cx, ty - m * 0.055, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.baux, T.actes + 0.8), alpha: t2A * (1 - swap) });
      kRise(ctx, 'PENDANT DES ANNÉES', cx, ty, { size: Math.floor(m * (V ? 0.056 : 0.05)), weight: 900, t: seg(lt, T.annees, T.annees + 0.9), out: swap, alpha: t2A, maxW: w * 0.9 });
      kRise(ctx, "CLAUSES D'EXCLUSIVITÉ", cx, ty, { size: Math.floor(m * (V ? 0.056 : 0.05)), weight: 900, color: C.red, t: seg(lt, T.clauses, T.clauses + 0.9), alpha: t2A * swap, glow: 16, glowColor: rgba(C.red, 0.4), maxW: w * 0.9 });
      mono(ctx, 'MÊME LES PRODUITS FRAIS', cx, V ? h * 0.8 : ty + m * 0.055, { size: Math.floor(m * 0.019), color: C.gold, spacing: 6, t: seg(lt, T.frais - 0.3, T.frais + 0.7), alpha: t2A });
    }

    /* ── ACTE III : la frise et le marteau ── */
    const fA = smooth(seg(lt, T.fev - 0.5, T.fev + 0.3));
    if (fA > 0.003) {
      const ly = V ? h * 0.78 : h * 0.2;
      const x0 = V ? w * 0.14 : w * 0.24;
      const x1 = V ? w * 0.86 : w * 0.76;
      const draw = eInOutQuart(seg(lt, T.fev - 0.3, T.sept + 0.6));
      ctx.save();
      ctx.globalAlpha *= fA;
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, C.cyan);
      g.addColorStop(1, C.emerald);
      ctx.fillStyle = g;
      ctx.fillRect(x0, ly - 1.5, (x1 - x0) * draw, 3);
      ctx.restore();
      const nodes = [
        { x: lerp(x0, x1, 0.18), k: T.fev, a: 'FÉV. 2025', b: 'LOBLAW RECULE', bk: T.reculer, col: C.cyan },
        { x: lerp(x0, x1, 0.82), k: T.sept, a: 'SEPT. 2026', b: 'EMPIRE-SOBEYS', bk: T.sobeys, col: C.emerald }
      ];
      nodes.forEach((n) => {
        const on = seg(lt, n.k - 0.1, n.k + 0.7);
        if (on <= 0) return;
        beacon(ctx, n.x, ly, { color: n.col, r: 9 * eOutBack(on, 2), alpha: fA, time: gt });
        kSlide(ctx, n.a, n.x, ly - m * 0.035, { size: Math.floor(m * (V ? 0.034 : 0.03)), weight: 900, color: C.white, t: on, alpha: fA, dir: 'up' });
        mono(ctx, n.b, n.x, ly + m * 0.05, { size: Math.floor(m * (V ? 0.019 : 0.018)), color: n.col, spacing: 4, t: seg(lt, n.bk - 0.1, n.bk + 0.8), alpha: fA });
      });
      mono(ctx, 'ENQUÊTES EN COUR FÉDÉRALE', (x0 + x1) / 2, ly + m * (V ? 0.1 : 0.09), { size: Math.floor(m * 0.016), color: C.slate, spacing: 4, t: seg(lt, T.cour, T.cour + 1.0), alpha: fA });
      // marteau géométrique du Bureau de la concurrence
      const gA = smooth(seg(lt, T.entente - 1.0, T.entente - 0.4)) * (1 - smooth(seg(lt, T.entente + 1.6, T.entente + 2.4)));
      if (gA > 0.003) {
        const pvx = V ? w * 0.78 : w * 0.8;
        const pvy = V ? h * 0.3 : h * 0.38;
        const swing = track(lt, [[T.entente - 1.0, -1.1], [T.entente - 0.2, -1.35, eOutCubic], [T.entente + 0.15, 0.25, eInExpo], [T.entente + 0.45, 0.12, eOutCubic], [T.entente + 1.2, 0.15]]);
        const L = m * 0.22;
        ctx.save();
        ctx.globalAlpha *= gA;
        ctx.translate(pvx, pvy);
        ctx.rotate(swing);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-L, -m * 0.008, L, m * 0.016);
        const hx = -L;
        const hg = ctx.createLinearGradient(hx - m * 0.03, 0, hx + m * 0.03, 0);
        hg.addColorStop(0, C.gold);
        hg.addColorStop(1, C.copper);
        ctx.fillStyle = hg;
        ctx.shadowColor = C.amber;
        ctx.shadowBlur = 20;
        rrect(ctx, hx - m * 0.035, -m * 0.06, m * 0.07, m * 0.12, m * 0.01);
        ctx.fill();
        ctx.restore();
        if (lt > T.entente + 0.1) {
          const ix = pvx - Math.cos(0.25) * L;
          const iy = pvy - Math.sin(0.25) * L + m * 0.06;
          shockwave(ctx, ix, iy, m * 0.3, lt - T.entente - 0.1, { color: C.emerald, count: 1, period: 1.4, alpha: gA * (1 - smooth(seg(lt, T.entente + 0.1, T.entente + 1.5))) });
        }
      }
      const ty = V ? h * 0.16 : h * 0.86;
      kRise(ctx, 'ENTENTE CONTRAIGNANTE', cx, ty, { size: Math.floor(m * (V ? 0.054 : 0.046)), weight: 900, color: C.emerald, t: seg(lt, T.entente, T.entente + 0.9), alpha: fA, glow: 16, glowColor: rgba(C.emerald, 0.4), maxW: V ? w * 0.9 : w * 0.6 });
      mono(ctx, 'POUR Y METTRE FIN', cx, ty + m * 0.05, { size: Math.floor(m * 0.02), color: C.mint, spacing: 8, t: seg(lt, T.fin, T.fin + 0.8), alpha: fA });
    }
  });
}
/*@scene rep-baux-secrets-concurrence=sceneBauxSecrets*/
