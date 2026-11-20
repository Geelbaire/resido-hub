import {cues, emblem, mono, kRise, kZoom} from '../moteur.js';
import {color, clamp, ease, lerp, sceneRenderer, shot, colorWash, glass, label, light, TAU} from '../mise-en-scene.js';
import {drawEarth, cameraPath, pin, river, quebec, borders} from '../globe.js';
import {card} from '../hud.js';
import {split, elastic} from '../ecran.js';
import {nightSky} from '../ciel.js';

const V = (view, v) => v ? {...view, alt: view.alt * 1.35, y: view.vy ?? .54} : view;
const times = scene => cues(scene, {
  choix: 'grand choix de société', parole: 'donne la parole', missile: 'Entre le missile', fossiles: 'l\'effacement des énergies',
  secousses: 'les secousses', boussole: 'quelle boussole', optionA: 'Option A :', defense: 'renforcer notre défense',
  climat: 'maintenir nos exigences', ia: 'coupe-circuits stricts', optionB: 'Ou Option B', pourparlers: 'pourparlers rapides',
  couts: 'alléger nos coûts', innover: 'laisser nos innovateurs', ecrivez: 'Écrivez Option A', partagez: 'partagez ce bulletin',
  demain: 'à demain',
});

function recap(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  const view = cameraPath(t, [
    [0, {lon: -60, lat: 42, alt: 1.9, tilt: .2, y: .55}],
    [T.missile + 3, {lon: -71, lat: 47, alt: 1.1, tilt: .35, y: .62}, 6],
  ].map(([k, vw, dur]) => [k, V(vw, v), dur]));
  const cam = drawEarth(ctx, view, w, h);
  borders(ctx, cam, ['Canada', 'United States of America'], {alpha: .3});
  river(ctx, cam, 'St. Lawrence', {alpha: .8});
  quebec(ctx, cam, {alpha: .9, fill: color.cyan});
  const q = pin(ctx, cam, 'quebec', color.cyan, {alpha: 1, t});
  colorWash(ctx, w, h, .85);
  const hub = q || {x: w * .5, y: h * .6};
  const recapCards = [
    ['01 · POLOGNE, SHENZHEN & DAVIE', 'Défense', color.coral, T.missile],
    ['02 · COP31 VS DÉTAXE ÉNERGIE', 'Climat', color.emerald, T.fossiles],
    ['03 · ANTHROPIC −9 % & ONU', 'Intelligence artificielle', color.cyan, T.secousses],
  ];
  const leave = clamp((t - T.boussole + .2) / 1);
  recapCards.forEach(([kicker, title, tint, at], i) => {
    const a = i / 3 * TAU - Math.PI / 2 + t * .06;
    const rx = v ? 250 : 520, ry = v ? 330 : 190;
    const x = lerp(hub.x + Math.cos(a) * rx, hub.x, ease(leave));
    const y = lerp((v ? h * .4 : h * .36) + Math.sin(a) * ry, hub.y, ease(leave));
    card(d, {x, y, w: v ? 470 : 400, h: 116, tint, kicker, title, t: clamp((t - at + .2) / .6), out: leave, size: 28});
  });
  const ca = clamp((t - T.boussole + .1) / .8);
  if (ca > 0) {
    ctx.save();
    ctx.globalAlpha *= ease(ca);
    light(ctx, w * .5, h * (v ? .38 : .38), 260, color.cyan, .3);
    emblem(ctx, w * .5, h * (v ? .38 : .38), v ? 210 : 190, {ringT: 1, needle: 1, star: 1, cardinals: true, time: t, swing: Math.sin(t * 2.2) * .5 * (1 - ease(clamp((t - T.boussole) / 3)))});
    ctx.restore();
    if (!bare) mono(ctx, 'QUELLE BOUSSOLE POUR NOS GOUVERNEMENTS ?', w * .5, v ? h * .56 : h * .64 - 10, {size: 18, color: color.gold, spacing: 3, t: ca, cursor: false});
  }
}

function vote(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  const ratio = elastic(t, [[0, .5], [T.optionA, .7], [T.optionB, .3], [T.ecrivez, .5]]);
  const fin = clamp((t - T.partagez + .2) / 1);
  const va = clamp((t - T.ecrivez + .2) / .7) * (1 - fin);
  split(d, {
    ratio, bg: dd => nightSky(dd, {horizon: .95, snow: .4}), enter: clamp((t - T.optionA + .6) / 1.1), out: fin, dim: va,
    A: {tint: color.cyan, camp: 'OPTION A', title: 'Bouclier, climat & garde-fous', titleT: (t - T.optionA) / .9,
      shown: clamp((t - T.defense) / .7) + clamp((t - T.climat) / .7) + clamp((t - T.ia) / .7),
      items: [['ship', 'Défense & chantiers maritimes', 'RENFORCER LA FERMETÉ'],
        ['drop', 'Cap climatique maintenu', 'EXIGENCES DU QUÉBEC'],
        ['lock', 'Coupe-circuits pour l’IA', 'PROTÉGER NOS JEUNES']]},
    B: {tint: color.amber, camp: 'OPTION B', title: 'Pragmatisme & portefeuille', titleT: (t - T.optionB) / .9,
      shown: clamp((t - T.pourparlers) / .7) + clamp((t - T.couts) / .7) + clamp((t - T.innover) / .7),
      items: [['chat', 'Pourparlers rapides', 'EN EUROPE'],
        ['bolt', 'Coûts énergétiques allégés', 'FACE AUX ÉTATS-UNIS'],
        ['brain', 'Innover sans frein', 'NOS INNOVATEURS']]},
  });
  if (va > 0) {
    const pulse = 1 + .04 * Math.sin(t * 5);
    const x = w * .5, y = v ? h * .5 : h * .38;
    ctx.save();
    ctx.globalAlpha *= ease(va);
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    glass(ctx, 0, 0, v ? 700 : 760, 130, color.gold, t, () => {
      if (!bare) {
        label(ctx, 'VOTEZ  A  OU  B', 0, -14, {size: v ? 46 : 52, weight: 900, tint: color.white, width: 660});
        label(ctx, 'EN COMMENTAIRE', 0, 36, {size: 18, mono: true, tint: color.gold, width: 600});
      }
    }, {radius: 65});
    ctx.restore();
    light(ctx, x, y, 300, color.gold, .2 * va);
  }
  if (fin > 0) {
    ctx.save();
    ctx.globalAlpha *= ease(fin);
    const x = w * .5, y = h * (v ? .36 : .36);
    nightSky(d, {horizon: .95, snow: 1.4});
    light(ctx, x, y, 320, color.cyan, .35);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU + t * .5;
      light(ctx, x + Math.cos(a) * (v ? 300 : 260), y + Math.sin(a) * (v ? 300 : 260) * .55, 10, i % 2 ? color.cyan : color.amber, .55);
    }
    emblem(ctx, x, y, v ? 170 : 150, {ringT: 1, needle: 1, star: 1, cardinals: true, time: t, swing: Math.sin(t * 1.1) * .12});
    const sweep = ((t - T.partagez) * .55) % 1.4 - .2;
    light(ctx, lerp(x - 420, x + 420, sweep), y + (v ? 270 : 230), 120, color.cyan, .35);
    for (let k = 0; k < 3; k++) {
      const u = ((t - T.partagez) * .4 + k / 3) % 1;
      ctx.beginPath();
      ctx.arc(x, y, (v ? 170 : 150) * (1.1 + u * 1.2), 0, TAU);
      ctx.strokeStyle = 'rgba(56,189,248,' + (.28 * (1 - u)).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
    if (!bare) {
      kRise(ctx, 'FRANC NORD', x, y + (v ? 270 : 230), {t: clamp((t - T.partagez) / 1), size: v ? 72 : 78, weight: 900, color: color.white});
      kZoom(ctx, 'À demain', x, y + (v ? 350 : 300), {t: clamp((t - T.demain) / .8), size: v ? 36 : 34, weight: 800, color: color.gold});
    }
  }
  colorWash(ctx, w, h, .7);
}

export default sceneRenderer([
  shot('', 'À vous la parole', 'DÉFENSE  /  CLIMAT  /  IA', recap, color.gold, 'bottom', 'recap'),
  shot('quelle boussole', 'Quelle boussole ?', 'POUR NOS GOUVERNEMENTS', recap, color.gold, 'bottom', 'recap'),
  shot('Option A :', 'Option A', 'LE BOUCLIER ET LA FERMETÉ', vote, color.cyan, 'bottom', 'vote'),
  shot('Ou Option B', 'Option B', 'LE PRAGMATISME ÉCONOMIQUE', vote, color.amber, 'bottom', 'vote'),
  shot('Écrivez Option A', 'A ou B ?', 'VOTRE ARGUMENT EN COMMENTAIRE', vote, color.gold, 'bottom', 'vote'),
  shot('partagez ce bulletin', '', '', vote, color.cyan, 'bottom', 'vote'),
]);
