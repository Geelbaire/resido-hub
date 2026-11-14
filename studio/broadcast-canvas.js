/**
 * FRANC NORD — Canevas Cinématique Minimaliste (Plein Écran)
 *
 * Philosophie visuelle :
 *  - ZÉRO boîte empilée, ZÉRO bandeau saturé, ZÉRO effet "tableau de bord".
 *  - 100 % de la surface de l'écran (1920x1080 ou 1080x1920) est laissée libre
 *    à Claude Opus pour ses compositions de Motion Design plein écran.
 *  - La continuité de l'émission ("la griffe FRANC NORD") repose uniquement sur :
 *      1. Le fond profond et le vignettage cinématographique.
 *      2. Le discret filigrane en haut à gauche (Boussole FRANC NORD + Chapitre).
 *      3. La mention discrète de la source en bas à droite et un filet de progression de 2 px.
 */

export const PALETTES = {
  amber: {
    primary: '#F59E0B',
    secondary: '#FDE68A',
    accent: '#38BDF8',
    bgTint: '#120D05'
  },
  cyan: {
    primary: '#38BDF8',
    secondary: '#BAE6FD',
    accent: '#F43F5E',
    bgTint: '#050E1A'
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
    accent: '#FBBF24',
    bgTint: '#16060B'
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

  // 1. Fond cinématique plein écran (noir profond nuancé)
  const bg = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    width * 0.05,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.75
  );
  bg.addColorStop(0, theme.bgTint);
  bg.addColorStop(1, '#030509');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Scène Plein Écran (100 % de l'espace est confié à Claude Opus)
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
    drawAwaitingOpusSlate(ctx, stage, scene, chapter, theme, localTime, helpers);
  }
  ctx.restore();

  // 3. Signature minimale "FRANC NORD" (Filigrane discret en haut à gauche)
  const margin = isVertical ? 48 : 64;
  drawMinimalBrandWatermark(ctx, margin, margin, chapter, theme, globalTime);

  // 4. Crédit source minimaliste en bas à droite (sans boîte lourde)
  if (scene.sources?.length) {
    ctx.save();
    ctx.font = '500 13px "Inter", -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      scene.sources.join('  ·  ').toUpperCase(),
      width - margin,
      height - margin * 0.65
    );
    ctx.restore();
  }

  // 5. Filet de progression ultra-fin (2 px) tout en bas de l'écran
  const globalRatio = totalDuration > 0 ? helpers.clamp(globalTime / totalDuration) : 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, height - 3, width, 3);
  ctx.fillStyle = theme.primary;
  ctx.fillRect(0, height - 3, width * globalRatio, 3);

  ctx.restore();
}

function drawMinimalBrandWatermark(ctx, x, y, chapter, theme, globalTime) {
  ctx.save();
  // Boussole minimaliste fine
  const r = 13;
  const cx = x + r;
  const cy = y + r;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.32)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(globalTime * 0.9) * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.72);
  ctx.lineTo(r * 0.22, 0);
  ctx.lineTo(-r * 0.22, 0);
  ctx.closePath();
  ctx.fillStyle = theme.primary;
  ctx.fill();
  ctx.restore();

  // Texte FRANC NORD + Chapitre en typographie espacée très sobre
  ctx.font = '700 14px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(248, 250, 252, 0.82)';
  ctx.textBaseline = 'middle';
  ctx.fillText('FRANC NORD', cx + r + 14, cy + 1);

  ctx.font = '500 13px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.fillText(`—  ${chapter.number}  ${chapter.label}`, cx + r + 118, cy + 1);

  ctx.restore();
}

function drawAwaitingOpusSlate(ctx, stage, scene, chapter, theme, localTime, helpers) {
  const fade = helpers.easeOutExpo(Math.min(1, localTime / 0.9));
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Cercle respirant très fin au centre
  ctx.beginPath();
  ctx.arc(stage.cx, stage.cy, 180 + Math.sin(localTime * 1.2) * 8, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '600 14px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = theme.primary;
  ctx.fillText(`${chapter.number}  ·  ${scene.locationBadge || chapter.label}`, stage.cx, stage.cy - 44);

  ctx.font = '300 44px "Inter", "SF Pro Display", -apple-system, sans-serif';
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(scene.shortVisualTitle || `Scène ${scene.id}`, stage.cx, stage.cy + 8);

  ctx.font = '400 15px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.fillText('Scène plein écran prête à être animée par Claude Opus', stage.cx, stage.cy + 62);
  ctx.restore();
}
