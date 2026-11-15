/* Acte I   : trois cartes de fidélité entrent en parallaxe ; quelques sous tombent ; chaque carte
 *            émet un flux de particules qui nourrit une base de données
 * Acte II  : les flux convergent vers un réseau neuronal sphérique en rotation 3D ; habitudes en orbite ;
 *            bulle de conversation « Loblaw × ChatGPT » qui écrit une liste d'épicerie
 * Acte III : le serment officiel ; l'alarme ; triangle d'avertissement et cadenas ouvert */

const S04_NODES = (() => {
  const n = 96;
  const pts = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = ga * i;
    pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
  }
  const edges = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
      if (d < 0.36) edges.push([i, j]);
    }
  return { pts, edges };
})();
const S04_HABITS = ['LAIT', 'COUCHES', 'CAFÉ', 'SAMEDI 10 H', 'BIO', 'RABAIS', 'CODE POSTAL', 'PROMOS'];

function s04_card(ctx, x, y, cw, rot, o) {
  const { col = C.cyan, col2 = C.night, name = '', alpha = 1, scan = 0 } = o;
  if (alpha <= 0.003) return;
  const ch = cw * 0.63;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  light(ctx, 0, 0, cw * 0.9, col, 0.2 + scan * 0.4);
  rrect(ctx, -cw / 2, -ch / 2, cw, ch, cw * 0.06);
  const g = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2);
  g.addColorStop(0, mix(col, C.night, 0.35));
  g.addColorStop(0.55, mix(col, C.night, 0.72));
  g.addColorStop(1, col2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(C.white, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // puce
  ctx.fillStyle = rgba(C.gold, 0.9);
  rrect(ctx, -cw * 0.38, -ch * 0.12, cw * 0.14, ch * 0.2, cw * 0.02);
  ctx.fill();
  ctx.strokeStyle = rgba('#92400E', 0.8);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-cw * 0.31, -ch * 0.12);
  ctx.lineTo(-cw * 0.31, ch * 0.08);
  ctx.moveTo(-cw * 0.38, -ch * 0.02);
  ctx.lineTo(-cw * 0.24, -ch * 0.02);
  ctx.stroke();
  // bande magnétique / code
  ctx.fillStyle = rgba(C.white, 0.5);
  for (let k = 0; k < 14; k++) ctx.fillRect(cw * 0.06 + k * cw * 0.024, ch * 0.22, k % 3 ? cw * 0.008 : cw * 0.014, ch * 0.14);
  // reflet qui balaie
  if (scan > 0.01) {
    ctx.save();
    rrect(ctx, -cw / 2, -ch / 2, cw, ch, cw * 0.06);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const sx = lerp(-cw, cw, scan);
    const sg = ctx.createLinearGradient(sx - cw * 0.2, 0, sx + cw * 0.2, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(255,255,255,0.55)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
    ctx.restore();
  }
  // nom : taille fixe (o.base), mise à l'échelle par transformation quand la carte rétrécit
  const base = o.base || cw;
  ctx.save();
  ctx.translate(-cw * 0.4, -ch * 0.26);
  ctx.scale(cw / base, cw / base);
  drawSprite(ctx, textSprite(name, { size: Math.floor(base * 0.1), weight: 900, color: C.white, spacing: 3 }), 0, 0, { align: 'left', base: 'middle' });
  ctx.restore();
  ctx.restore();
}

function sceneFideliteIA(a) {
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);
  const T = cues(scene, {
    canada: 'Et au Canada',
    scannez: 'vous scannez',
    pc: 'PC Optimum',
    moi: 'Moi ou',
    scene: 'Scène Plus',
    sous: 'quelques sous',
    nourr: 'vous nourrissez',
    vastes: 'plus vastes bases',
    comport: 'comportementales',
    ajoutez: 'Ajoutez maintenant',
    ia: "l'intelligence artificielle",
    partenariat: 'le partenariat',
    loblaw: 'Loblaw et ChatGPT',
    listes: "listes d'épicerie",
    officiel: 'Officiellement',
    jurent: 'jurent',
    pasde: "n'utilisent pas",
    magasin: 'en magasin',
    chercheurs: 'les chercheurs',
    alarme: "sonnent l'alarme",
    aucune: 'aucune loi québécoise',
    interdit: "n'interdit encore",
    moduler: 'moduler ses prix',
    donnees: 'vos données'
  });

  // centre du réseau (caméra : il glisse de côté à l'acte III)
  const side = eInOutQuart(seg(lt, T.officiel - 0.4, T.officiel + 1.4));
  const nx = V ? cx : lerp(w * 0.36, w * 0.27, side);
  const ny = V ? lerp(h * 0.43, h * 0.3, side) : h * 0.53;
  const netIn = eOutExpo(seg(lt, T.nourr - 0.2, T.ia + 1.2));
  const R = m * (V ? 0.28 : 0.25) * lerp(0.35, 1, netIn) * lerp(1, V ? 0.68 : 0.78, side);

  frame(a, () => {
    dust(ctx, stage, gt, { count: 80, alpha: 0.3, seed: 44 });

    /* ── ACTE I : les cartes ── */
    const cards = [
      { name: 'PC OPTIMUM', col: '#9F1239', k: T.scannez + 0.3 },
      { name: 'MOI', col: '#0369A1', k: T.moi },
      { name: 'SCÈNE+', col: '#6D28D9', k: T.scene }
    ];
    const cardsOut = eInOutQuart(seg(lt, T.ia - 0.6, T.ia + 0.8));
    const cA = 1 - cardsOut;
    const cw = V ? w * 0.42 : w * 0.17;
    const cardPos = (i) => {
      const drift = (lt - T.pc) * m * 0.004;
      if (V) return { x: cx + (i - 1) * w * 0.18, y: h * 0.62 + (i - 1) * h * 0.075 - drift * (i - 1), rot: -0.12 + i * 0.12 };
      return { x: cx + (i - 1) * w * 0.22 + drift * (i - 1), y: h * 0.68 + (i === 1 ? -h * 0.03 : 0), rot: -0.1 + i * 0.1 };
    };
    if (cA > 0.003) {
      cards.forEach((c, i) => {
        const on = eOutExpo(seg(lt, c.k - 0.3, c.k + 0.9));
        if (on <= 0) return;
        const p = cardPos(i);
        const scan = seg(lt, c.k, c.k + 0.9);
        const ox = (1 - on) * (V ? 0 : (i - 1) * w * 0.25);
        const oy = (1 - on) * h * 0.25;
        // en sortie, les cartes sont aspirées vers le réseau
        const px = lerp(p.x + ox, nx, eInCubic(cardsOut));
        const py = lerp(p.y + oy, ny, eInCubic(cardsOut));
        s04_card(ctx, px, py, cw * lerp(1, 0.2, cardsOut), p.rot * (1 - cardsOut), { col: c.col, col2: '#05080F', name: c.name, alpha: cA * on, scan, base: cw });
      });
      // quelques sous qui tombent
      const sA = env(lt, T.sous - 0.2, T.nourr + 0.6, 0.3, 0.5) * cA;
      if (sA > 0.003) {
        for (let k = 0; k < 3; k++) {
          const tt = seg(lt, T.sous + k * 0.18, T.sous + 1.2 + k * 0.18);
          const x = cx + (k - 1) * m * 0.05;
          const y0 = V ? h * 0.45 : h * 0.4;
          const y = y0 + eInCubic(tt) * m * 0.1;
          ctx.save();
          ctx.globalAlpha *= sA * (1 - smooth(seg(tt, 0.8, 1)));
          ctx.translate(x, y);
          ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.cos((lt + k) * 4)));
          ctx.fillStyle = C.gold;
          ctx.beginPath();
          ctx.arc(0, 0, m * 0.012, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        mono(ctx, 'QUELQUES SOUS DE RABAIS', cx, (V ? h * 0.45 : h * 0.4) - m * 0.04, { size: Math.floor(m * 0.019), color: C.gold, spacing: 5, t: seg(lt, T.sous, T.sous + 0.8), alpha: sA });
      }
      const ty = V ? h * 0.17 : h * 0.18;
      const swq = smooth(seg(lt, T.nourr - 0.3, T.nourr + 0.1));
      kRise(ctx, 'ET AU CANADA ?', cx, ty, { size: Math.floor(m * 0.068), weight: 900, t: seg(lt, T.canada - 0.2, T.canada + 0.7), out: swq, alpha: cA });
      mono(ctx, 'CHAQUE PASSAGE À LA CAISSE', cx, ty + m * 0.06, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.scannez, T.scannez + 1.0), alpha: cA * (1 - swq) });
    }

    /* ── FLUX DE PARTICULES (cartes → réseau) ── */
    const fA = env(lt, T.nourr - 0.2, T.ia + 1.0, 0.5, 0.8);
    if (fA > 0.003) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      cards.forEach((c, i) => {
        const p = cardPos(i);
        const path = quadPts({ x: p.x, y: p.y - cw * 0.2 }, { x: nx, y: ny }, (i - 1) * m * 0.18 + m * 0.05, 48);
        for (let k = 0; k < 26; k++) {
          const u = (lt * 0.42 + k / 26 + i * 0.13) % 1;
          const q = along(path, u);
          const s = 1.2 + 2.2 * Math.sin(u * Math.PI);
          ctx.globalAlpha = fA * Math.sin(u * Math.PI) * 0.9;
          ctx.fillStyle = k % 4 === 0 ? C.white : C.cyan;
          ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
        }
      });
      ctx.restore();
    }

    /* ── RÉSEAU NEURONAL SPHÉRIQUE ── */
    const nA = smooth(seg(lt, T.nourr - 0.3, T.nourr + 0.8));
    if (nA > 0.003) {
      const rotY = lt * 0.35;
      const rotX = 0.35 + 0.08 * Math.sin(lt * 0.3);
      const cyY = Math.cos(rotY);
      const syY = Math.sin(rotY);
      const cxX = Math.cos(rotX);
      const sxX = Math.sin(rotX);
      const proj = S04_NODES.pts.map(([x, y, z]) => {
        const x1 = x * cyY + z * syY;
        const z1 = -x * syY + z * cyY;
        const y1 = y * cxX - z1 * sxX;
        const z2 = y * sxX + z1 * cxX;
        const f = 3 / (3 + z2);
        return { x: nx + x1 * R * f, y: ny + y1 * R * f, z: z2, f };
      });
      const iaGlow = smooth(seg(lt, T.ia - 0.3, T.ia + 0.8));
      const alarm = smooth(seg(lt, T.alarme - 0.3, T.alarme + 0.6));
      const col = mix(C.cyan, C.amber, alarm);
      light(ctx, nx, ny, R * 1.6, col, nA * (0.18 + 0.25 * iaGlow));
      ctx.save();
      ctx.globalAlpha *= nA;
      ctx.lineWidth = 1;
      for (const [i, j] of S04_NODES.edges) {
        const p = proj[i];
        const q = proj[j];
        const depth = 0.5 - (p.z + q.z) * 0.25;
        ctx.strokeStyle = rgba(col, (0.08 + 0.35 * depth) * (0.4 + 0.6 * iaGlow));
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      proj.forEach((p, i) => {
        const depth = 0.5 - p.z * 0.5;
        const pulse = 0.5 + 0.5 * Math.sin(gt * 2.4 + i * 1.7);
        const r = (1.6 + 2.6 * depth) * (1 + iaGlow * pulse * 0.6);
        ctx.fillStyle = rgba(i % 7 === 0 ? C.white : col, 0.35 + 0.65 * depth);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.fill();
      });
      ctx.restore();
      // ondes d'alarme
      if (alarm > 0.01) shockwave(ctx, nx, ny, R * 1.7, gt, { color: C.amber, count: 3, period: 1.6, alpha: nA * alarm * (1 - smooth(seg(lt, T.aucune + 1.5, T.aucune + 3))) });
      // habitudes en orbite (profondeur → échelle de sprite)
      const hA = nA * env(lt, T.ia, T.officiel + 0.6, 0.8, 0.6);
      if (hA > 0.003) {
        S04_HABITS.forEach((lab, i) => {
          const an = (i / S04_HABITS.length) * TAU + lt * 0.3;
          const tilt = 0.32;
          const orb = V ? 1.15 : 1.35;
          const ox = Math.cos(an) * R * orb;
          const oz = Math.sin(an);
          const oy = Math.sin(an) * R * orb * tilt - R * 0.1 * Math.cos(an * 2);
          const f = 3 / (3 + oz * 0.9);
          const on = smooth(seg(lt, T.ia + i * 0.25, T.ia + 0.6 + i * 0.25));
          const S = textSprite(lab, { size: Math.floor(m * 0.022), weight: 600, fam: MONO, color: oz < 0 ? C.white : C.ice, spacing: 4 });
          drawSprite(ctx, S, nx + ox * f, ny + oy * f, { base: 'middle', scale: f * 0.92, alpha: hA * on * (0.35 + 0.65 * (0.5 - oz * 0.5)) });
        });
      }
      const ty = V ? h * 0.13 : h * 0.16;
      const tx = cx;
      const tA = env(lt, T.nourr, T.ajoutez + 0.2, 0.4, 0.5);
      kWipe(ctx, 'UNE DES PLUS VASTES', tx, ty, { size: Math.floor(m * 0.05), weight: 900, t: seg(lt, T.vastes - 0.3, T.vastes + 0.7), alpha: tA, edge: C.cyan });
      kWipe(ctx, 'BASES DE DONNÉES', tx, ty + m * 0.065, { size: Math.floor(m * 0.05), weight: 900, color: C.cyan, t: seg(lt, T.vastes + 0.2, T.vastes + 1.2), alpha: tA, edge: C.white });
      mono(ctx, 'COMPORTEMENTALES DU PAYS', tx, ty + m * 0.12, { size: Math.floor(m * 0.019), color: C.ice, spacing: 6, t: seg(lt, T.comport, T.comport + 0.9), alpha: tA });
      const iA = env(lt, T.ajoutez, T.officiel + 0.2, 0.4, 0.5);
      kRise(ctx, '+ INTELLIGENCE ARTIFICIELLE', tx, ty + m * 0.03, { size: Math.floor(m * (V ? 0.05 : 0.048)), weight: 900, t: seg(lt, T.ia - 0.2, T.ia + 0.9), alpha: iA, maxW: V ? w * 0.9 : w * 0.5 });
    }

    /* ── BULLE DE CONVERSATION « LOBLAW × CHATGPT » ── */
    const bA = env(lt, T.partenariat - 0.3, T.officiel + 0.4, 0.4, 0.6);
    if (bA > 0.003) {
      const bw = V ? w * 0.74 : w * 0.27;
      const bh = V ? h * 0.2 : h * 0.4;
      const bx = V ? cx : w * 0.775;
      const by = V ? h * 0.76 : h * 0.53;
      const pop = eOutBack(seg(lt, T.partenariat - 0.2, T.partenariat + 0.5), 1.3);
      ctx.save();
      ctx.globalAlpha *= bA;
      ctx.translate(bx, by);
      ctx.scale(pop, pop);
      rrect(ctx, -bw / 2, -bh / 2, bw, bh, m * 0.025);
      ctx.fillStyle = 'rgba(12,20,34,0.92)';
      ctx.fill();
      ctx.strokeStyle = rgba(C.emerald, 0.75);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      if (V) {
        ctx.moveTo(-bw * 0.08, -bh / 2);
        ctx.lineTo(0, -bh / 2 - m * 0.03);
        ctx.lineTo(bw * 0.08, -bh / 2);
      } else {
        ctx.moveTo(-bw / 2, -bh * 0.08);
        ctx.lineTo(-bw / 2 - m * 0.03, 0);
        ctx.lineTo(-bw / 2, bh * 0.08);
      }
      ctx.fillStyle = 'rgba(12,20,34,0.92)';
      ctx.fill();
      ctx.restore();
      if (pop > 0.9) {
        const x0 = bx - bw / 2 + m * 0.03;
        let y = by - bh / 2 + m * 0.045;
        mono(ctx, 'LOBLAW × CHATGPT', x0, y, { size: Math.floor(m * 0.018), color: C.mint, spacing: 4, align: 'left', t: seg(lt, T.loblaw, T.loblaw + 0.8), alpha: bA });
        const lines = ['• LAIT 2 L', '• PAIN DE BLÉ', '• BANANES', '• CAFÉ MOULU'];
        const lh = V ? m * 0.042 : m * 0.055;
        y += m * 0.035;
        lines.forEach((l, i) => {
          const k = T.listes + i * 0.45;
          if (V && i >= 2) {
            mono(ctx, l, bx + m * 0.02, y + lh * (i - 2) + lh, { size: Math.floor(m * 0.024), color: C.white, spacing: 2, align: 'left', t: seg(lt, k - 0.3, k + 0.4), alpha: bA });
          } else {
            mono(ctx, l, x0, y + lh * i * (V ? 1 : 1) + lh, { size: Math.floor(m * 0.024), color: C.white, spacing: 2, align: 'left', t: seg(lt, k - 0.3, k + 0.4), alpha: bA });
          }
        });
      }
    }

    /* ── ACTE III : serment, alarme, triangle ── */
    const oA = smooth(seg(lt, T.officiel - 0.2, T.officiel + 0.6));
    if (oA > 0.003) {
      const tx = V ? cx : w * 0.66;
      const oy = V ? h * 0.52 : h * 0.2;
      const swap = smooth(seg(lt, T.aucune - 0.5, T.aucune));
      mono(ctx, 'OFFICIELLEMENT, LES BANNIÈRES JURENT :', tx, oy - m * 0.06, { size: Math.floor(m * 0.018), color: C.slate, spacing: 4, t: seg(lt, T.officiel, T.jurent + 0.8), alpha: oA * (1 - swap) });
      kWipe(ctx, 'PAS DE PRIX PERSONNALISÉS', tx, oy, { size: Math.floor(m * (V ? 0.044 : 0.04)), weight: 800, color: C.white, t: seg(lt, T.pasde - 0.1, T.pasde + 0.9), alpha: oA * (1 - swap), edge: C.cyan, maxW: V ? w * 0.9 : w * 0.6 });
      kSlide(ctx, 'EN MAGASIN', tx, oy + m * 0.06, { size: Math.floor(m * (V ? 0.044 : 0.04)), weight: 800, color: C.cyan, t: seg(lt, T.magasin - 0.1, T.magasin + 0.7), alpha: oA * (1 - swap) });
      mono(ctx, 'CHERCHEURS · ÉLUS : ALARME', tx, oy + m * 0.13, { size: Math.floor(m * 0.019), color: C.amber, spacing: 5, t: seg(lt, T.chercheurs, T.alarme + 0.8), alpha: oA * (1 - swap) });
      // triangle d'avertissement + cadenas ouvert
      const trA = smooth(seg(lt, T.aucune - 0.5, T.aucune + 0.2));
      if (trA > 0.003) {
        const trx = V ? cx : w * 0.66;
        const try_ = V ? h * 0.58 : h * 0.36;
        const s = m * (V ? 0.12 : 0.1);
        const draw = eInOutQuart(seg(lt, T.aucune - 0.4, T.aucune + 0.8));
        const pts = [
          { x: trx, y: try_ - s },
          { x: trx + s * 1.1, y: try_ + s * 0.85 },
          { x: trx - s * 1.1, y: try_ + s * 0.85 },
          { x: trx, y: try_ - s }
        ];
        light(ctx, trx, try_, s * 2.4, C.amber, trA * 0.35);
        glowPath(ctx, pts, draw, { color: C.amber, width: 5, alpha: trA });
        const ex = smooth(seg(lt, T.aucune + 0.4, T.aucune + 0.9));
        ctx.save();
        ctx.globalAlpha *= trA * ex;
        ctx.fillStyle = C.amber;
        ctx.fillRect(trx - s * 0.06, try_ - s * 0.42, s * 0.12, s * 0.62);
        ctx.beginPath();
        ctx.arc(trx, try_ + s * 0.42, s * 0.08, 0, TAU);
        ctx.fill();
        ctx.restore();
        const ly = try_ + s * 1.55 + m * 0.03;
        kRise(ctx, 'AUCUNE LOI QUÉBÉCOISE', trx, ly, { size: Math.floor(m * (V ? 0.058 : 0.05)), weight: 900, color: C.amber, t: seg(lt, T.aucune, T.aucune + 1.0), alpha: trA, glow: 18, glowColor: rgba(C.amber, 0.45), maxW: V ? w * 0.9 : w * 0.56 });
        kRise(ctx, "N'INTERDIT ENCORE", trx, ly + m * 0.07, { size: Math.floor(m * (V ? 0.058 : 0.05)), weight: 900, t: seg(lt, T.interdit, T.interdit + 0.9), alpha: trA, maxW: V ? w * 0.9 : w * 0.56 });
        mono(ctx, 'DE MODULER VOS PRIX GRÂCE À VOS DONNÉES', trx, ly + m * 0.125, { size: Math.floor(m * (V ? 0.017 : 0.018)), color: C.ice, spacing: 4, t: seg(lt, T.moduler, T.donnees + 1.0), alpha: trA });
        // cadenas ouvert sur le réseau
        const pk = smooth(seg(lt, T.aucune + 0.6, T.aucune + 1.4));
        if (pk > 0.003) {
          const lx = nx;
          const lyy = ny;
          const ls = R * 0.32;
          ctx.save();
          ctx.globalAlpha *= pk;
          ctx.strokeStyle = C.amber;
          ctx.lineWidth = ls * 0.14;
          ctx.shadowColor = C.amber;
          ctx.shadowBlur = 16;
          rrect(ctx, lx - ls * 0.6, lyy - ls * 0.1, ls * 1.2, ls * 0.95, ls * 0.12);
          ctx.fillStyle = 'rgba(20,12,2,0.9)';
          ctx.fill();
          ctx.stroke();
          const open = eOutBack(seg(lt, T.aucune + 0.9, T.aucune + 1.7), 2);
          ctx.beginPath();
          ctx.arc(lx + ls * 0.35 * open, lyy - ls * 0.1 - ls * 0.25 * open, ls * 0.38, Math.PI, 0);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  });
}
/*@scene rep-cartes-fidelite-ia-canada=sceneFideliteIA*/
