/**
 * FRANC NORD — Canevas Cinématique Officiel (Basé sur la Charte de Marque Officielle)
 *
 * Palette Officielle :
 *  - Abyssal Midnight : #030509
 *  - Boreal Ice Cyan  : #38BDF8
 *  - Editorial Amber  : #F59E0B
 *  - Pure Slate       : #E5E7EB
 */

export const BRAND_COLORS = {
  abyssalMidnight: '#030509',
  borealCyan: '#38BDF8',
  editorialAmber: '#F59E0B',
  pureSlate: '#E5E7EB'
};

export const PALETTES = {
  amber: {
    primary: '#F59E0B',
    secondary: '#FDE68A',
    accent: '#38BDF8',
    bgTint: '#110C04'
  },
  cyan: {
    primary: '#38BDF8',
    secondary: '#BAE6FD',
    accent: '#F59E0B',
    bgTint: '#040E1A'
  },
  emerald: {
    primary: '#10B981',
    secondary: '#A7F3D0',
    accent: '#38BDF8',
    bgTint: '#04130F'
  },
  rose: {
    primary: '#F43F5E',
    secondary: '#FECDD3',
    accent: '#F59E0B',
    bgTint: '#14060A'
  }
};

export const helpers = {
  clamp(v, min = 0, max = 1) {
    return Math.max(min, Math.min(max, v));
  },
  easeOutCubic(t) {
    const x = helpers.clamp(t);
    return 1 - Math.pow(1 - x, 3);
  },
  easeOutExpo(t) {
    const x = helpers.clamp(t);
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  },
  easeInOutQuart(t) {
    const x = helpers.clamp(t);
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
  },
  spring(t, damping = 0.72, frequency = 4.5) {
    const x = helpers.clamp(t);
    return 1 - Math.exp(-x * 6 * damping) * Math.cos(x * frequency * Math.PI);
  },

  /**
   * Dessine l'emblème officiel FRANC NORD en vectoriel pur :
   *  - Anneau méridien scindé (Bleu Boréal #38BDF8 à gauche / Or Ambre #F59E0B à droite)
   *  - 4 pointes cardinales effilées
   *  - Flèche de boussole 3D à 4 facettes (Cyan à gauche, Ambre à droite)
   *  - Étoile Polaire à 8 branches au sommet
   */
  drawOfficialFrancNordEmblem(ctx, cx, cy, radius, globalTime = 0) {
    ctx.save();
    ctx.translate(cx, cy);

    // 1. Arc méridien gauche (Boreal Ice Cyan #38BDF8)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI * 0.56, Math.PI * 1.44);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = Math.max(1.5, radius * 0.032);
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = radius * 0.18;
    ctx.stroke();
    ctx.restore();

    // 2. Arc méridien droit (Editorial Amber Gold #F59E0B)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI * 0.44, Math.PI * 0.44);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = Math.max(1.5, radius * 0.032);
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = radius * 0.18;
    ctx.stroke();
    ctx.restore();

    // 3. Pointes horizontales Est/Ouest et verticale Sud effilées
    ctx.save();
    ctx.strokeStyle = 'rgba(229, 231, 235, 0.78)';
    ctx.lineWidth = Math.max(1, radius * 0.02);
    // Ouest
    ctx.beginPath();
    ctx.moveTo(-radius * 1.25, radius * 0.05);
    ctx.lineTo(-radius * 0.55, radius * 0.05);
    ctx.stroke();
    // Est
    ctx.beginPath();
    ctx.moveTo(radius * 0.55, radius * 0.05);
    ctx.lineTo(radius * 1.25, radius * 0.05);
    ctx.stroke();
    // Sud
    ctx.beginPath();
    ctx.moveTo(0, radius * 0.15);
    ctx.lineTo(0, radius * 1.22);
    ctx.stroke();
    ctx.restore();

    // 4. Flèche de boussole facettée 3D (Cyan à gauche / Ambre à droite)
    const tipY = -radius * 0.76;
    const midY = radius * 0.06;
    const wingY = radius * 0.52;
    const wingX = radius * 0.46;

    // Facette Supérieure Gauche (Cyan lumineux)
    const leftGrad = ctx.createLinearGradient(-wingX, wingY, 0, tipY);
    leftGrad.addColorStop(0, '#0284C7');
    leftGrad.addColorStop(0.55, '#38BDF8');
    leftGrad.addColorStop(1, '#E0F2FE');
    ctx.beginPath();
    ctx.moveTo(0, tipY);
    ctx.lineTo(-wingX, wingY);
    ctx.lineTo(0, midY);
    ctx.closePath();
    ctx.fillStyle = leftGrad;
    ctx.fill();

    // Facette Supérieure Droite (Or Ambre lumineux)
    const rightGrad = ctx.createLinearGradient(wingX, wingY, 0, tipY);
    rightGrad.addColorStop(0, '#D97706');
    rightGrad.addColorStop(0.55, '#F59E0B');
    rightGrad.addColorStop(1, '#FEF3C7');
    ctx.beginPath();
    ctx.moveTo(0, tipY);
    ctx.lineTo(wingX, wingY);
    ctx.lineTo(0, midY);
    ctx.closePath();
    ctx.fillStyle = rightGrad;
    ctx.fill();

    // Facette Inférieure Interne Gauche (Ombre Cyan profonde)
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(-wingX, wingY);
    ctx.lineTo(0, radius * 0.22);
    ctx.closePath();
    ctx.fillStyle = '#075985';
    ctx.fill();

    // Facette Inférieure Interne Droite (Ombre Ambre profonde)
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(wingX, wingY);
    ctx.lineTo(0, radius * 0.22);
    ctx.closePath();
    ctx.fillStyle = '#92400E';
    ctx.fill();

    // 5. Étoile Polaire à 8 branches au sommet
    const starY = -radius * 1.02;
    const starR = radius * 0.32 * (0.96 + 0.04 * Math.sin(globalTime * 3));
    const innerR = starR * 0.16;

    ctx.save();
    ctx.translate(0, starY);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const len = i % 2 === 0 ? starR : starR * 0.52;
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      const nextAngle = angle + Math.PI / 8;
      ctx.lineTo(Math.cos(nextAngle) * innerR, Math.sin(nextAngle) * innerR);
    }
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = radius * 0.15;
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
};

export function resolveTimeline(storyboard, globalTime) {
  const scenes = storyboard.scenes || [];
  let acc = 0;
  for (let i = 0; i < scenes.length; i++) {
    const dur = scenes[i].duration || 12;
    if (globalTime < acc + dur || i === scenes.length - 1) {
      const localTime = Math.max(0, Math.min(dur, globalTime - acc));
      const progress = dur > 0 ? localTime / dur : 0;
      return {
        sceneIndex: i,
        scene: scenes[i],
        localTime,
        progress,
        sceneStartTime: acc,
        totalDuration: scenes.reduce((s, item) => s + (item.duration || 12), 0)
      };
    }
    acc += dur;
  }
  return null;
}

export function renderBroadcastFrame({
  ctx,
  width,
  height,
  storyboard,
  customScenes,
  globalTime
}) {
  const isVertical = height > width;
  const timeline = resolveTimeline(storyboard, globalTime);
  if (!timeline) return;

  const { scene, sceneIndex, localTime, progress, totalDuration } = timeline;
  const chapter = (storyboard.chapters || []).find((c) => c.id === scene.chapterId) || {
    number: `0${sceneIndex + 1}`,
    label: 'DOSSIER',
    colorKey: 'cyan'
  };
  const theme = PALETTES[chapter.colorKey] || PALETTES.cyan;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. Fond Abyssal Midnight (#030509) avec halo boréal/ambre subtil
  ctx.fillStyle = BRAND_COLORS.abyssalMidnight;
  ctx.fillRect(0, 0, width, height);

  const bg = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    width * 0.04,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.72
  );
  bg.addColorStop(0, theme.bgTint);
  bg.addColorStop(1, BRAND_COLORS.abyssalMidnight);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Scène Plein Écran (100 % confiée à Claude Opus)
  const stage = {
    x: 0,
    y: 0,
    w: width,
    h: height,
    cx: width / 2,
    cy: height / 2
  };

  const customRender = customScenes?.[scene.id];
  ctx.save();
  if (typeof customRender === 'function') {
    customRender({
      ctx,
      stage,
      progress,
      localTime,
      globalTime,
      isVertical,
      scene,
      storyboard,
      theme,
      helpers
    });
  } else {
    drawAwaitingOpusSlate(ctx, stage, scene, chapter, theme, localTime, globalTime, helpers);
  }
  ctx.restore();

  // 3. Transition Cinéma 3 bandes diagonales (Ambre / Pure Slate / Cyan de la Charte Officielle)
  if (localTime < 0.48 && sceneIndex > 0) {
    drawBrandDiagonalTransition(ctx, width, height, localTime / 0.48);
  }

  // 4. Filigrane Officiel FRANC NORD en haut à gauche
  const margin = isVertical ? 48 : 64;
  drawOfficialBrandCorner(ctx, margin, margin, chapter, globalTime);

  // 5. Crédit source discret en bas à droite (IBM Plex Mono / Monospace technique)
  if (scene.sources?.length) {
    ctx.save();
    ctx.font = '500 12px "IBM Plex Mono", "SF Mono", monospace';
    ctx.fillStyle = 'rgba(229, 231, 235, 0.42)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      `SOURCES // ${scene.sources.join(' · ').toUpperCase()}`,
      width - margin,
      height - margin * 0.6
    );
    ctx.restore();
  }

  // 6. Filet de progression bicolore (Cyan → Ambre) de 2 px tout en bas
  const globalRatio = totalDuration > 0 ? helpers.clamp(globalTime / totalDuration) : 0;
  const barGrad = ctx.createLinearGradient(0, 0, width, 0);
  barGrad.addColorStop(0, BRAND_COLORS.borealCyan);
  barGrad.addColorStop(1, BRAND_COLORS.editorialAmber);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fillRect(0, height - 2, width, 2);
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, height - 2, width * globalRatio, 2);

  ctx.restore();
}

function drawOfficialBrandCorner(ctx, x, y, chapter, globalTime) {
  ctx.save();
  const r = 18;
  helpers.drawOfficialFrancNordEmblem(ctx, x + r, y + r + 4, r, globalTime);

  ctx.font = '800 15px "Inter", "SF Pro Display", sans-serif';
  ctx.fillStyle = '#F8FAFC';
  ctx.textBaseline = 'middle';
  ctx.fillText('FRANC NORD', x + r * 2 + 16, y + r + 2);

  ctx.font = '500 12px "IBM Plex Mono", "SF Mono", monospace';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText(`${chapter.number}`, x + r * 2 + 126, y + r + 2);

  ctx.fillStyle = 'rgba(229, 231, 235, 0.6)';
  ctx.fillText(`/ ${chapter.label}`, x + r * 2 + 148, y + r + 2);
  ctx.restore();
}

function drawBrandDiagonalTransition(ctx, width, height, t) {
  const ease = helpers.easeInOutQuart(t);
  const offset = (ease * 2.2 - 0.6) * (width + height);
  const stripeW = width * 0.045;
  const colors = ['#F59E0B', '#E5E7EB', '#38BDF8'];

  ctx.save();
  colors.forEach((col, i) => {
    const x = offset - i * (stripeW * 1.15);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW, 0);
    ctx.lineTo(x + stripeW - height * 0.45, height);
    ctx.lineTo(x - height * 0.45, height);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.globalAlpha = (1 - t) * 0.85;
    ctx.fill();
  });
  ctx.restore();
}

function drawAwaitingOpusSlate(ctx, stage, scene, chapter, theme, localTime, globalTime, helpers) {
  const fade = helpers.easeOutExpo(Math.min(1, localTime / 0.8));
  ctx.save();
  ctx.globalAlpha = fade;

  // Emblème officiel FRANC NORD au centre supérieur
  helpers.drawOfficialFrancNordEmblem(ctx, stage.cx, stage.cy - 85, 64, globalTime);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '600 13px "IBM Plex Mono", "SF Mono", monospace';
  ctx.fillStyle = '#38BDF8';
  ctx.fillText(`${chapter.number} // ${scene.locationBadge || chapter.label}`, stage.cx, stage.cy + 24);

  ctx.font = '800 40px "Inter", "SF Pro Display", sans-serif';
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(scene.shortVisualTitle || scene.id, stage.cx, stage.cy + 74);

  // Soulignement bicolore officiel (Cyan à gauche, Ambre à droite)
  const lineY = stage.cy + 114;
  ctx.beginPath();
  ctx.moveTo(stage.cx - 120, lineY);
  ctx.lineTo(stage.cx - 8, lineY);
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(stage.cx + 8, lineY);
  ctx.lineTo(stage.cx + 120, lineY);
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();
}
