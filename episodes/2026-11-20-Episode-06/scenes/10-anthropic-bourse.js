import {cues, mono, odometer, kWipe} from '../moteur.js';
import {color, clamp, ease, sceneRenderer, shot, colorWash, floor, glass, label, light} from '../mise-en-scene.js';
import {tickerWall, orgChart} from '../graphes.js';
import {files} from '../banc.js';
import {ticks, card} from '../hud.js';

const times = scene => cues(scene, {
  dossier: 'Troisième grand dossier', agitee: 'journée agitée', wall: 'entre Wall Street', maison: 'la Maison-Blanche et', onu0: 'et l\'ONU', ny: 'À New York', vedette: 'start-up vedette',
  claude: 'modèle Claude', chuter: 'chuter de neuf', lendemain: 'au lendemain', historique: 'Bourse historique',
  france: 'France vingt-quatre', coulisses: 'les coulisses', test: 'un test', chanter: 'faire chanter', labo: 'laboratoire secret',
  adn: 'explorant l\'ADN', moment: 'Au même moment', limoge: 'limoge son chef', pannes: 'série de pannes',
  onu: 'l\'ONU alerte', bataille: 'perd la bataille', enfants: 'exploitent les enfants',
});

function market(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  const drop = clamp((t - T.chuter + .2) / 1.4);
  tickerWall(d, {p: Math.min(.72, clamp((t - T.ny + 1) / 4.5) * .72) + .28 * drop, drop, push: clamp((t - T.ny) / 10)});
  const chips = [['WALL STREET', 'Marchés', color.cyan, T.wall], ['MAISON-BLANCHE', 'Cybersécurité', color.coral, T.maison],
    ['ONU', 'Protection de l’enfance', color.red, T.onu0]];
  chips.forEach(([k, title, tint, at], i) => card(d, {x: v ? w * .5 : w * (.22 + i * .28), y: v ? h * (.18 + i * .12) : h * .3,
    w: v ? 560 : 400, h: 116, tint, kicker: k, title, t: clamp((t - at + .2) / .6), out: clamp((t - T.ny + .3) / .6), size: 28}));
  const cx = v ? w * .5 : w * .3, cy = v ? h * .52 : h * .25;
  if (!bare && t > T.vedette - .2) {
    mono(ctx, 'ANTHROPIC · CRÉATRICE DE CLAUDE', w * .5, v ? h * .14 : h * .17, {size: 17, color: color.cyan, spacing: 3,
      t: clamp((t - T.vedette) / 1), cursor: false});
  }
  if (!bare && drop > 0) {
    const big = v ? 170 : 150;
    light(ctx, cx, cy, 260, color.red, .25 * drop);
    odometer(ctx, 9 * ease(drop), cx, cy + big * .35, {size: big, weight: 900, prefix: '−', suffix: ' %', suffixScale: .5,
      color: color.white, suffixColor: color.coral, glow: 10, glowColor: color.red, alpha: clamp(drop * 3)});
    mono(ctx, 'VENDREDI · LENDEMAIN D’UNE ENTRÉE EN BOURSE RECORD', cx, cy + big * .35 + 56, {size: 15, color: color.coral, spacing: 2,
      t: clamp((t - T.lendemain) / 1), cursor: false});
  }
}

function dossiers(d) {
  const {t, scene} = d;
  const T = times(scene);
  const focus = clamp((t - T.chanter + .3) / 1) * 0 + (t < T.labo - .3 ? 0 : t < T.adn + 1.2 ? 1 : 2);
  const smooth = focus === 0 ? 0 : focus === 1 ? clamp((t - T.labo + .3) / .9) : 1 + clamp((t - T.adn - 1.2) / .9);
  files(d, {
    names: ['1. Test de chantage par IA', '2. Laboratoire secret · ADN', '3. Philosophes & morale'],
    details: [['Une IA tente de faire chanter', 'un dirigeant (test)'], ['Explorer les mystères', 'de l’ADN'], ['Enseigner la morale', 'aux machines']],
    focus: smooth, open: clamp((t - T.france + .3) / 1.6), tint: color.cyan, source: 'RÉVÉLÉ PAR FRANCE 24',
  });
}

function alerts(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  floor(d, color.red);
  const ox = v ? w * .5 : w * .3, oy = v ? h * .26 : h * .4;
  glass(ctx, ox, oy, v ? 760 : 640, v ? 400 : 420, color.coral, t, () => {
    orgChart(ctx, 0, 10, v ? 1.3 : 1.1, clamp((t - T.limoge - .2) / 1.6), {t, bare});
    if (!bare) mono(ctx, 'MAISON-BLANCHE · ORGANIGRAMME SIMPLIFIÉ', 0, v ? -175 : -185, {size: 14, color: color.coral, spacing: 2, cursor: false});
  }, {radius: 20});
  if (t > T.pannes) {
    for (let i = 0; i < 5; i++) {
      const blink = Math.sin(t * 9 + i * 2) > .3 ? 1 : .25;
      light(ctx, ox + (i - 2) * 90, oy + (v ? 170 : 175), 22, color.red, .6 * blink * clamp((t - T.pannes) / .6));
    }
  }
  const ua = clamp((t - T.onu + .2) / .7);
  if (ua > 0) {
    const bx = v ? w * .5 : w * .76, by = v ? h * .56 : h * .4;
    ctx.save();
    ctx.globalAlpha *= ease(ua);
    glass(ctx, bx, by, v ? 760 : 560, v ? 290 : 320, color.red, t, () => {
      ctx.fillStyle = 'rgba(244,63,94,.22)';
      ctx.fillRect(v ? -380 : -280, v ? -145 : -160, v ? 760 : 560, 58);
      if (!bare) {
        mono(ctx, 'ALERTE · ONU', 0, v ? -116 : -131, {size: 20, color: '#FFFFFF', spacing: 5, cursor: false});
        kWipe(ctx, 'On perd la bataille', 0, v ? -20 : -30, {t: clamp((t - T.bataille) / .9), size: v ? 44 : 42, weight: 900, edge: color.red});
        label(ctx, 'L’IA AIDE LES PRÉDATEURS', 0, v ? 40 : 40, {size: 19, mono: true, tint: color.coral, width: 520, alpha: clamp((t - T.enfants + .2) / .6)});
        label(ctx, 'À EXPLOITER LES ENFANTS', 0, v ? 72 : 74, {size: 19, mono: true, tint: color.coral, width: 520, alpha: clamp((t - T.enfants) / .6)});
      }
      ticks(ctx, 0, v ? 110 : 118, v ? 600 : 460, color.red, clamp((t - T.onu) / 3), t);
    }, {radius: 20});
    ctx.restore();
  }
  colorWash(ctx, w, h, .85);
}

export default sceneRenderer([
  shot('', 'Troisième dossier', 'WALL STREET  /  MAISON-BLANCHE  /  ONU', market, color.cyan, 'bottom', 'market'),
  shot('À New York', 'Wall Street', 'NEW YORK', market, color.cyan, 'bottom', 'market'),
  shot('modèle Claude', 'Anthropic en Bourse', 'START-UP VEDETTE DE L’IA', market, color.cyan, 'bottom', 'market'),
  shot('chuter de neuf', 'Anthropic : −9 %', 'APRÈS UNE ENTRÉE EN BOURSE HISTORIQUE', market, color.red, 'bottom', 'market'),
  shot('France vingt-quatre', 'Les coulisses révélées', 'FRANCE 24', dossiers, color.cyan, 'bottom', 'files'),
  shot('faire chanter', 'Un test de chantage', 'DOSSIER 1  /  EN LABORATOIRE', dossiers, color.coral, 'bottom', 'files'),
  shot('laboratoire secret', 'Un laboratoire secret', 'DOSSIER 2  /  L’ADN', dossiers, color.emerald, 'bottom', 'files'),
  shot('Au même moment', 'Washington limoge', 'CHEF DE LA CYBERSÉCURITÉ', alerts, color.coral, 'bottom', 'alerts'),
  shot('série de pannes', 'Une série de pannes', 'MAISON-BLANCHE', alerts, color.coral, 'bottom', 'alerts'),
  shot('l\'ONU alerte', 'L’alerte de l’ONU', 'PROTECTION DES ENFANTS', alerts, color.red, 'bottom', 'alerts'),
]);
