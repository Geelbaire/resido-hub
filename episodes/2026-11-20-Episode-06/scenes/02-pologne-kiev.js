import {cues, odometer, mono} from '../moteur.js';
import {color, clamp, ease, lerp, sceneRenderer, shot, colorWash, label} from '../mise-en-scene.js';
import {drawEarth, cameraPath, ballistic, pin, river, borders, dome, places} from '../globe.js';
import {card, tether, ticks} from '../hud.js';
import {kyiv} from '../ciel.js';
import {constellation} from '../graphes.js';

const V = (view, v) => v ? {...view, alt: view.alt * 1.35, y: view.vy ?? .54} : view;
const times = scene => cues(scene, {
  tusk: 'Donald Tusk', frappe: 'a frappé le territoire', exercice: 'exercice militaire conjoint',
  blesse: 'Aucun blessé', provocation: 'provocation calculée', instant: 'au même instant',
  violentes: 'plus violentes attaques', cent: 'cent dix missiles', drones: 'quatre cents drones',
  ponts: 'ponts de Kiev', reseau: 'réseau électrique', morts: 'huit morts', unicef: 'l\'UNICEF',
  enfants: 'mille cent quarante-quatre', dix: 'en dix mois',
});

function frontier(d) {
  const {ctx, w, h, t, vertical: v, scene} = d;
  const T = times(scene);
  const view = cameraPath(t, [
    [0, {lon: 20, lat: 56, alt: 1.15, tilt: .3}],
    [T.frappe + 1, {lon: 22.5, lat: 51.5, alt: .55, tilt: .55, y: .52}, 4],
    [T.provocation + 1.5, {lon: 25, lat: 51, alt: .5, tilt: .62, turn: .12, y: .52}, 4],
    [T.instant + 2, {lon: 30.5, lat: 50.2, alt: .2, tilt: .9, turn: .2, y: .58}, 2.4],
  ].map(([k, view, dur]) => [k, V(view, v), dur]));
  const cam = drawEarth(ctx, view, w, h);
  borders(ctx, cam, ['Poland', 'Ukraine', 'Belarus', 'Lithuania', 'Latvia', 'Russia', 'Germany', 'Slovakia', 'Romania'], {alpha: .38});
  ['Estonia', 'Latvia', 'Lithuania', 'Poland', 'Slovakia', 'Romania'].forEach((c, i) =>
    borders(ctx, cam, [c], {alpha: .6 * ease((t - .6 - i * .7) / .8) * (1 - .5 * ease((t - T.tusk) / 1)), color: color.cyan, width: 2}));
  borders(ctx, cam, ['Poland'], {alpha: .8 * ease((t - T.tusk) / 1.2), color: color.cyan, fill: color.cyan, width: 2});
  river(ctx, cam, 'Dnieper', {alpha: .75 * ease((t - T.instant) / 1.5)});
  dome(ctx, cam, [19.5, 52], 3.6, {alpha: ease((t - T.exercice + 1.2) / 1.2) * (1 - ease((t - T.instant) / 1.5)), t,
    breach: t - T.frappe - .9});
  ballistic(ctx, cam, 'bryansk', 'rzeszow', clamp((t - T.frappe + .6) / 1.5), {color: color.red, height: .012, width: 3.2, after: t - T.frappe - .9});
  const warsaw = pin(ctx, cam, 'warsaw', color.cyan, {alpha: ease((t - T.tusk) / .6), t});
  const kyivP = pin(ctx, cam, 'kyiv', color.coral, {alpha: ease((t - T.instant) / .6), t});
  colorWash(ctx, w, h, .85);
  const cx = v ? w * .5 : w * .78, cy = v ? h * .17 : h * .3;
  const a1 = clamp((t - T.tusk - .3) / .7), o1 = clamp((t - T.instant) / .6);
  card(d, {x: cx, y: cy, w: v ? 640 : 440, h: 150, tint: color.cyan, kicker: 'VARSOVIE · DONALD TUSK', title: 'Une provocation',
    sub: t > T.blesse ? 'AUCUN BLESSÉ SIGNALÉ' : 'MISSILE RUSSE EN TERRITOIRE POLONAIS', t: a1, out: o1});
  if (!v) tether(ctx, warsaw, {x: cx - 220, y: cy}, color.cyan, a1 * (1 - o1));
  const a2 = clamp((t - T.exercice) / .6), o2 = clamp((t - T.instant) / .6);
  if (!d.bare && a2 > 0) {
    mono(d.ctx, 'OTAN · EXERCICE ALLIÉ EN COURS', v ? w * .5 : w * .78, v ? h * .27 : h * .49, {size: 16, color: color.cyan, t: a2,
      alpha: 1 - o2, spacing: 3});
  }
  if (kyivP && !d.bare) {
    const a = ease((t - T.instant - .4) / .6);
    label(ctx, 'KIEV', kyivP.x + 26, kyivP.y - 24, {size: 20, mono: true, align: 'left', alpha: a, tint: color.coral, width: 120});
  }
}

function night(d) {
  const {ctx, w, h, t, vertical: v, scene} = d;
  const T = times(scene);
  const local = t - T.violentes;
  kyiv(d, {push: Math.min(9, local * .32), missiles: clamp((t - T.cent + .5) / 7), drones: clamp((t - T.drones + .3) / 3),
    blackout: clamp((t - T.reseau) / 2.6), strike: t - T.ponts - .8, bridgeFocus: t > T.ponts ? 1 : -1});
  colorWash(ctx, w, h, .8);
  const y = v ? h * .62 : h * .2;
  const xs = v ? [w * .5, w * .5] : [w * .3, w * .7];
  const ys = v ? [h * .16, h * .28] : [y, y];
  const c1 = clamp((t - T.cent + .2) / .6), c2 = clamp((t - T.drones + .2) / .6);
  const cw = v ? 560 : 420;
  card(d, {x: xs[0], y: ys[0], w: cw, h: 168, tint: color.coral, kicker: 'MISSILES', t: c1,
    value: {v: 110, suffix: '+', p: clamp((t - T.cent) / 1.4)}, numberSize: 82});
  card(d, {x: xs[1], y: ys[1], w: cw, h: 168, tint: color.amber, kicker: 'DRONES', t: c2,
    value: {v: 400, p: clamp((t - T.drones) / 1.6)}, numberSize: 82});
  if (!d.bare && t > T.morts - .2) {
    const a = ease((t - T.morts) / .5);
    mono(ctx, 'AU MOINS 8 MORTS', w * .5, v ? h * .37 : h * .38, {size: 22, color: color.white, t: a, spacing: 4, cursor: false});
  }
}

function children(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  const grid = constellation(d, {p: clamp((t - T.enfants + .4) / 3.2)});
  const cx = v ? w * .5 : w * .808, cy = v ? h * .5 : h * .36;
  card(d, {x: cx, y: cy + (v ? 60 : 30), w: v ? 640 : 520, h: v ? 300 : 300, tint: color.coral, t: clamp((t - T.unicef) / .6),
    kicker: 'UNICEF · UKRAINE', title: 'Enfants touchés', sub: 'TUÉS OU BLESSÉS · 10 MOIS DE 2026',
    value: {v: 1144, p: clamp((t - T.enfants + .2) / 3)}, numberSize: v ? 120 : 112});
  void grid;
  colorWash(ctx, w, h, .82);
}

export default sceneRenderer([
  shot('', 'Le flanc Est testé', 'MER BALTIQUE  /  POLOGNE  /  UKRAINE', frontier, color.cyan, 'bottom', 'geo'),
  shot('Donald Tusk', 'Varsovie confirme', 'LE PREMIER MINISTRE POLONAIS', frontier, color.cyan, 'bottom', 'geo'),
  shot('a frappé le territoire', 'Un missile russe en Pologne', 'TERRITOIRE DE L’OTAN', frontier, color.red, 'bottom', 'geo'),
  shot('exercice militaire conjoint', 'En plein exercice allié', 'TROUPES DE L’OTAN DÉPLOYÉES', frontier, color.cyan, 'bottom', 'geo'),
  shot('Aucun blessé', 'Aucun blessé', 'VARSOVIE DÉNONCE UNE PROVOCATION', frontier, color.gold, 'bottom', 'geo'),
  shot('au même instant', 'Au même instant, Kiev', 'UKRAINE  /  LE DNIEPR', frontier, color.coral, 'bottom', 'geo'),
  shot('plus violentes attaques', 'Une nuit sous les tirs', 'KIEV  /  DÉFENSE ANTIAÉRIENNE', night, color.coral, 'bottom', 'night'),
  shot('cent dix missiles', '110+ missiles', 'ATTAQUE AÉRIENNE  /  UKRAINE', night, color.coral, 'bottom', 'night'),
  shot('quatre cents drones', '400 drones', 'PLUS DE 510 PROJECTILES', night, color.amber, 'bottom', 'night'),
  shot('ponts de Kiev', 'Les ponts visés', 'LE DNIEPR  /  KIEV', night, color.amber, 'bottom', 'night'),
  shot('réseau électrique', 'Le réseau électrique', 'SOUS-STATIONS VISÉES', night, color.coral, 'bottom', 'night'),
  shot('l\'UNICEF', '1 144 enfants', 'UNICEF  /  10 MOIS DE 2026', children, color.coral, 'bottom', 'unicef'),
  shot('en dix mois', 'Un sombre record', 'PLUS QUE CHACUNE DES TROIS DERNIÈRES ANNÉES', children, color.gold, 'bottom', 'unicef'),
]);
void lerp; void places;
