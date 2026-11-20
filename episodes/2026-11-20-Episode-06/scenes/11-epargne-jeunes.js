import {cues, mono, odometer} from '../moteur.js';
import {color, clamp, ease, sceneRenderer, shot, colorWash} from '../mise-en-scene.js';
import {drawEarth, cameraPath, pin, river, quebec, borders, ballistic} from '../globe.js';
import {card} from '../hud.js';
import {vault} from '../rayonx.js';
import {corridor} from '../graphes.js';

const V = (view, v) => v ? {...view, alt: view.alt * 1.35, y: view.vy ?? .54} : view;
const times = scene => cues(scene, {
  secousses: 'trois secousses', foyer: 'chaque foyer', portefeuille: 'notre portefeuille', caisse: 'la Caisse de dépôt',
  retraites: 'nos retraites', reer: 'nos REER', expose: 'fortement exposée', geants: 'géants américains',
  recul: 'Le recul de neuf', volatile: 'reste volatile', ensuite: 'Ensuite, l\'alerte', chantage: 'le chantage',
  jeunes: 'exploitation des jeunes', ecoles: 'écoles secondaires', sextorsion: 'la sextorsion', reseaux: 'réseaux publics',
  sante: 'Santé Québec', banques: 'nos banques', pannes: 'grandes pannes',
});

function homes(d) {
  const {ctx, w, h, t, vertical: v, scene} = d;
  const T = times(scene);
  const view = cameraPath(t, [
    [0, {lon: -74, lat: 41.5, alt: .5, tilt: .7}],
    [T.foyer + 1.6, {lon: -72.6, lat: 45.9, alt: .1, tilt: 1.05, turn: .35, y: .62}, 4],
  ].map(([k, vw, dur]) => [k, V(vw, v), dur]));
  const cam = drawEarth(ctx, view, w, h);
  borders(ctx, cam, ['United States of America', 'Canada'], {alpha: .45, color: '#E8F4FF'});
  river(ctx, cam, 'St. Lawrence', {alpha: .9});
  quebec(ctx, cam, {alpha: .8, fill: color.cyan});
  ballistic(ctx, cam, 'nyc', 'montreal', clamp((t - T.secousses) / 1.6), {color: color.coral, height: .03, after: t - T.secousses - 1.6});
  ballistic(ctx, cam, 'nyc', 'quebec', clamp((t - T.secousses - .4) / 1.8), {color: color.coral, height: .035, after: t - T.secousses - 2.2});
  pin(ctx, cam, 'montreal', color.cyan, {alpha: ease((t - T.foyer) / .5), t});
  pin(ctx, cam, 'quebec', color.cyan, {alpha: ease((t - T.foyer - .2) / .5), t});
  colorWash(ctx, w, h, .85);
}

function savings(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  const drop = clamp((t - T.recul + .1) / 1.2);
  const {target} = vault(d, {scan: clamp((t - T.caisse + .3) / 5.2), cables: clamp((t - T.expose + .2) / 1.2), drop,
    shake: drop * (1 - clamp((t - T.volatile) / 1.5))});
  card(d, {x: target[0], y: target[1], w: v ? 520 : 360, h: 170, tint: drop > 0 ? color.red : color.cyan,
    kicker: 'WALL STREET · IA', title: drop > 0 ? 'Anthropic' : 'Géants américains',
    value: drop > 0 ? {v: 9, prefix: '−', suffix: ' %', p: drop} : null, sub: drop > 0 ? '' : 'NOTRE ÉPARGNE EXPOSÉE',
    t: clamp((t - T.geants + .2) / .6), numberSize: 74});
  if (!bare && t > T.volatile - .2) mono(ctx, 'UNE VALORISATION VOLATILE', target[0], target[1] + (v ? -120 : 120), {size: 17, color: color.coral, spacing: 3,
    t: clamp((t - T.volatile) / .8), cursor: false});
  colorWash(ctx, w, h, .82);
}

function network(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  corridor(d, {camZ: (t - T.ensuite) * 1.35, threats: clamp((t - T.chantage + .2) / 1), shield: clamp((t - T.chantage + .6) / 1.2) * (1 - .6 * clamp((t - T.reseaux) / 1)),
    nodes: clamp((t - T.reseaux) / 2.4) * 1.0, nodeNames: ['SANTÉ QUÉBEC', 'BANQUES', 'TRANSPORTS'], alert: clamp((t - T.pannes) / .6)});
  const sa = clamp((t - T.sextorsion + .2) / .6) * (1 - clamp((t - T.reseaux) / .6));
  if (!bare && sa > 0) mono(ctx, 'SEXTORSION · CHANTAGE PAR IA', w * .5, v ? h * .64 : h * .7 - 40, {size: 20, color: color.coral, spacing: 4, t: sa, cursor: false});
  card(d, {x: v ? w * .5 : w * .83, y: v ? h * .16 : h * .2, w: v ? 560 : 340, h: 160, tint: color.violet, kicker: 'AILLEURS · CORÉE DU SUD',
    title: 'Examens sous surveillance', value: {v: 111, suffix: ' élèves', p: clamp((t - T.ecoles - .4) / 1.4)}, numberSize: 54,
    t: clamp((t - T.ecoles + .1) / .6), out: clamp((t - T.reseaux + .2) / .6), size: 22});
  colorWash(ctx, w, h, .8);
  void odometer;
}

export default sceneRenderer([
  shot('', 'Ce que ça change ici', 'CHAQUE FOYER AU QUÉBEC', homes, color.cyan, 'bottom', 'geo'),
  shot('chaque foyer', 'Chaque foyer touché', 'MONTRÉAL  /  QUÉBEC', homes, color.cyan, 'bottom', 'geo'),
  shot('notre portefeuille', 'Notre portefeuille', 'CDPQ  /  REER  /  CELI', savings, color.cyan, 'bottom', 'vault'),
  shot('fortement exposée', 'Une épargne exposée', 'AUX GÉANTS AMÉRICAINS DE L’IA', savings, color.amber, 'bottom', 'vault'),
  shot('Le recul de neuf', 'Le recul de 9 %', 'UNE VALORISATION VOLATILE', savings, color.red, 'bottom', 'vault'),
  shot('Ensuite, l\'alerte', 'Nos jeunes ciblés', 'L’ALERTE DE L’ONU', network, color.coral, 'bottom', 'net'),
  shot('écoles secondaires', 'Dans nos écoles', 'ÉCOLES SECONDAIRES QUÉBÉCOISES', network, color.cyan, 'bottom', 'net'),
  shot('réseaux publics', 'Nos réseaux publics', 'SANTÉ QUÉBEC  /  BANQUES', network, color.emerald, 'bottom', 'net'),
  shot('grandes pannes', 'Vulnérables aux pannes', 'SURVEILLANCE CYBER', network, color.coral, 'bottom', 'net'),
]);
