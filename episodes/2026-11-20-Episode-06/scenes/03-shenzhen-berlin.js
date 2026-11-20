import {cues, mono} from '../moteur.js';
import {color, clamp, ease, lerp, sceneRenderer, shot, colorWash, light} from '../mise-en-scene.js';
import {drawEarth, cameraPath, ballistic, pin, borders, stream} from '../globe.js';
import {triangle, barometer, roundTable} from '../graphes.js';
import {draft} from '../banc.js';
import {deadline} from '../graphes.js';

const V = (view, v) => v ? {...view, alt: view.alt * 1.4, y: view.vy ?? .54} : view;
const times = scene => cues(scene, {
  otan: 'incident direct', comprendre: 'Pour comprendre', heures: 'quarante-huit heures', shenzhen: 'à Shenzhen',
  xi: 'Xi Jinping', trump: 'Donald Trump', poutine: 'Vladimir Poutine', nucleaires: 'trois premières puissances',
  pekin: 'Pékin au centre', tribune: 'Fort de cette tribune', rejette: 'rejette toute garantie', kyiv: 'pour Kyiv',
  force: 'position de force', calcul: 'ce calcul produit', berlin: 'sommet à Berlin', europeens: 'dirigeants européens',
  pourparlers: 'ouvrir des pourparlers',
});

function summit(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  const view = cameraPath(t, [
    [0, {lon: 24, lat: 51, alt: .9, tilt: .4}],
    [T.shenzhen + 2.2, {lon: 114, lat: 22.2, alt: .16, tilt: .55, y: .55}, 5.2],
    [T.pekin + 2, {lon: 112, lat: 28, alt: .55, tilt: .45, y: .5}, 4],
  ].map(([k, vw, dur]) => [k, V(vw, v), dur]));
  const cam = drawEarth(ctx, view, w, h);
  borders(ctx, cam, ['China', 'Russia', 'Poland', 'Ukraine', 'Mongolia', 'Vietnam'], {alpha: .3});
  ballistic(ctx, cam, 'moscow', 'warsaw', clamp((t - .5) / 2), {color: color.coral, height: .05, width: 2.6, after: t - 2.5,
    alpha: 1 - ease((t - T.heures) / 1.2)});
  borders(ctx, cam, ['Poland', 'Lithuania', 'Latvia', 'Estonia'], {alpha: .7 * ease((t - T.otan + .3) / .8) * (1 - ease((t - T.heures) / 1.2)), color: color.cyan, width: 2});
  ballistic(ctx, cam, 'warsaw', 'shenzhen', clamp((t - T.heures) / 3), {color: color.gold, height: .2, width: 2.4, after: t - T.heures - 3});
  const sz = pin(ctx, cam, 'shenzhen', color.gold, {alpha: ease((t - T.shenzhen) / .6), t});
  pin(ctx, cam, 'beijing', color.amber, {alpha: ease((t - T.pekin) / .6), t});
  colorWash(ctx, w, h, .82);
  // Horloge : retour 48 heures en arrière
  const ca = ease((t - T.comprendre) / .6) * (1 - ease((t - T.xi) / .6));
  if (ca > .01) {
    ctx.save();
    ctx.globalAlpha *= ca;
    const back = clamp((t - T.heures) / 2.4);
    deadline(ctx, v ? w * .5 : w * .8, v ? h * .2 : h * .32, v ? 120 : 110, 60 * (12 - back * 48) % 720, {t});
    ctx.restore();
    if (!bare) mono(ctx, '− 48 HEURES', v ? w * .5 : w * .8, v ? h * .2 + 170 : h * .32 + 160, {size: 22, color: color.gold, spacing: 4, t: clamp((t - T.heures) / .8), alpha: ca, cursor: false});
  }
  // Triangle de puissance en verre de saphir, flux dorés convergents
  const ta = clamp((t - T.xi + .2) / 3.2);
  if (ta > 0) {
    ctx.save();
    ctx.globalAlpha *= 1 - ease((t - T.tribune) / .7);
    ctx.fillStyle = 'rgba(3,5,9,.45)';
    ctx.fillRect(0, 0, w, h);
    const names = [['Xi Jinping', 'HÔTE · PÉKIN PIVOT'], ['Donald Trump', 'ÉTATS-UNIS'], ['Vladimir Poutine', 'RUSSIE']];
    const appear = Math.min(clamp((t - T.xi + .2) / 1), 1 / 3 + clamp((t - T.trump) / .9) / 3 + clamp((t - T.poutine) / .9) / 3);
    triangle(d, {names, appear: appear * 1, flows: t - T.nucleaires, center: 'PÉKIN AU CENTRE', centerT: (t - T.pekin) / .9,
      tints: [color.gold, color.cyan, color.coral]});
    if (!bare && t > T.nucleaires) mono(ctx, 'LES 3 PREMIÈRES PUISSANCES NUCLÉAIRES', w * .5, v ? h * .1 : h * .655 - 40,
      {size: 17, color: color.gold, spacing: 3, t: clamp((t - T.nucleaires) / 1.2), cursor: false});
    ctx.restore();
  }
  void sz;
}

function guarantees(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  const docOut = v ? ease((t - T.force + .2) / .6) : 0;
  ctx.save();
  ctx.globalAlpha *= 1 - docOut;
  draft(d, {
    heading: 'Garanties de sécurité', kind: 'KYIV  /  FAC-SIMILÉ ILLUSTRATIF', tint: color.cyan, layout: v ? 'center' : 'left',
    rows: ['Souveraineté de l’Ukraine', 'Présence alliée dissuasive', 'Garanties occidentales', 'Calendrier de cessez-le-feu'],
    target: 2, lensT: Math.max(0, (t - T.rejette + .4) / 2.2), stamp: t - T.kyiv - .2, stampText: 'REJETÉ PAR MOSCOU', stampTint: color.red,
  });
  ctx.restore();
  const ba = clamp((t - T.force + .3) / .8);
  if (ba > 0) {
    const bx = v ? w * .5 : w * .8, by = v ? h * .5 : h * .5;
    ctx.save();
    ctx.globalAlpha *= ease(ba);
    light(ctx, bx, by - 60, 220, color.red, .25);
    barometer(ctx, bx, by, v ? 220 : 170, lerp(.3, .86, ease(clamp((t - T.force) / 2.4))), {t, bare, caption: 'RAPPORT DE FORCE · KREMLIN'});
    ctx.restore();
  }
}

function berlin(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  const view = cameraPath(t, [
    [0, {lon: 100, lat: 35, alt: 1.6, tilt: .1}],
    [T.calcul + 2.6, {lon: 40, lat: 45, alt: 1.5, tilt: .2}, 2.6],
    [T.berlin + 1.6, {lon: 13.4, lat: 51, alt: .5, tilt: .5, y: .5}, 2.4],
  ].map(([k, vw, dur]) => [k, V(vw, v), dur]));
  const tableIn = ease((t - T.europeens + .2) / 1);
  const cam = drawEarth(ctx, view, w, h);
  borders(ctx, cam, ['Germany', 'Poland', 'France', 'China', 'Russia'], {alpha: .3});
  borders(ctx, cam, ['Germany'], {alpha: .7 * ease((t - T.berlin) / 1), color: color.gold, fill: color.gold, width: 1.8});
  ballistic(ctx, cam, 'shenzhen', 'berlin', clamp((t - T.calcul) / 2.6), {color: color.gold, height: .2, width: 2.4, after: t - T.calcul - 2.6});
  stream(ctx, cam, 'shenzhen', 'berlin', t - T.calcul - 1, {color: color.gold, height: .2, alpha: .7 * (1 - tableIn)});
  pin(ctx, cam, 'berlin', color.gold, {alpha: ease((t - T.berlin) / .5), t});
  colorWash(ctx, w, h, .85);
  if (tableIn > 0) {
    ctx.save();
    ctx.globalAlpha *= tableIn;
    ctx.fillStyle = 'rgba(3,5,9,.62)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= tableIn;
    roundTable(d, {p: clamp((t - T.europeens) / 2.4), caption: 'PRÊTS À DES POURPARLERS', captionT: (t - T.pourparlers) / 1});
    if (!bare) mono(ctx, 'SOMMET DE BERLIN · POSITION EUROPÉENNE', w * .5, v ? h * .64 : h * .14 + 20, {size: 17, color: color.gold, spacing: 3, t: clamp((t - T.europeens) / 1.2), cursor: false});
    ctx.restore();
  }
}

export default sceneRenderer([
  shot('', 'Pourquoi frapper si fort ?', 'MOSCOU  /  OTAN', summit, color.coral, 'bottom', 'summit'),
  shot('Pour comprendre', '48 heures plus tôt', 'RETOUR EN ARRIÈRE', summit, color.gold, 'bottom', 'summit'),
  shot('à Shenzhen', 'Shenzhen, Chine', 'DELTA DE LA RIVIÈRE DES PERLES', summit, color.gold, 'bottom', 'summit'),
  shot('Xi Jinping', 'Le sommet à trois', 'XI  /  TRUMP  /  POUTINE', summit, color.gold, 'bottom', 'summit'),
  shot('trois premières puissances', 'Trois puissances nucléaires', 'UN SOMMET HISTORIQUE', summit, color.amber, 'bottom', 'summit'),
  shot('Pékin au centre', 'Pékin au centre du jeu', 'DIPLOMATIE MONDIALE', summit, color.gold, 'bottom', 'summit'),
  shot('Fort de cette tribune', 'Le Kremlin durcit le ton', 'GARANTIES DE SÉCURITÉ POUR KYIV', guarantees, color.red, 'bottom', 'doc'),
  shot('rejette toute garantie', 'Garanties rejetées', 'POSITION DE MOSCOU', guarantees, color.red, 'bottom', 'doc'),
  shot('position de force', 'Négocier en position de force', 'RAPPORT DE FORCE', guarantees, color.coral, 'bottom', 'doc'),
  shot('ce calcul produit', 'Un premier effet', 'DE SHENZHEN À BERLIN', berlin, color.gold, 'bottom', 'berlin'),
  shot('sommet à Berlin', 'Sommet de Berlin', 'DIRIGEANTS EUROPÉENS', berlin, color.gold, 'bottom', 'berlin'),
  shot('ouvrir des pourparlers', 'Prêts à négocier', 'POURPARLERS AVEC LA RUSSIE', berlin, color.cyan, 'bottom', 'berlin'),
]);
