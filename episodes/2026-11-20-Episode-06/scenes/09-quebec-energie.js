import {cues} from '../moteur.js';
import {color, clamp, ease, sceneRenderer, shot, colorWash, light} from '../mise-en-scene.js';
import {drawEarth, cameraPath, ballistic, pin, river, quebec, borders, stream, places} from '../globe.js';
import {card, tether} from '../hud.js';
import {barometer, pumpSign} from '../graphes.js';

const V = (view, v) => v ? {...view, alt: view.alt * 1.35, y: view.vy ?? .54} : view;
const times = scene => cues(scene, {
  virage: 'virage américain', recul: 'recul de la COP', dilemme: 'dilemme économique', exception: 'figure d\'exception', marche: 'marché du carbone', californie: 'la Californie',
  quinze: 'quinze à dix-huit', entreprises: 'nos entreprises', etats: 'Si les États-Unis', factures: 'factures industrielles',
  taxe: 'sans taxe carbone', manufacturiers: 'nos manufacturiers', ecart: 'écart de compétitivité', inverse: 'à l\'inverse',
  hydro: 'hydroélectricité propre', carte: 'carte maîtresse', geants: 'géants mondiaux', decarboner: 'décarboner',
});
Object.assign(places, {pa: [-75.2, 40.4], ohio: [-82.9, 40.0], nj: [-74.4, 40.2], michigan: [-84.6, 42.7]});

function border(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  const view = cameraPath(t, [
    [0, {lon: -80, lat: 40, alt: 1.2, tilt: .3, y: .5}],
    [T.exception + .6, {lon: -73, lat: 43.5, alt: .32, tilt: 1.05, y: .6}, T.exception + .6],
    [T.marche + 2.2, {lon: -98, lat: 42, alt: 1.15, tilt: .4, y: .52}, 2.8],
    [T.quinze + 1.6, {lon: -72.5, lat: 44.8, alt: .2, tilt: 1.1, y: .62}, 2.6],
    [T.etats + 2, {lon: -76, lat: 41.6, alt: .3, tilt: 1.05, turn: -.15, y: .6}, 2.4],
    [T.inverse - .2, {lon: -71.5, lat: 42.6, alt: .26, tilt: 1.1, turn: .1, y: .6}, T.inverse - T.etats - 2.4],
    [T.inverse + 2.4, {lon: -72, lat: 47.5, alt: .55, tilt: .95, turn: .1, y: .7}, 2.8],
  ].map(([k, vw, dur]) => [k, V(vw, v), dur]));
  const cam = drawEarth(ctx, view, w, h);
  borders(ctx, cam, ['United States of America', 'Canada'], {alpha: .55, color: '#E8F4FF', width: 1.6});
  river(ctx, cam, 'St. Lawrence', {alpha: .9});
  river(ctx, cam, 'Ottawa', {alpha: .5});
  quebec(ctx, cam, {alpha: .9, fill: t > T.inverse ? color.emerald : color.cyan});
  ballistic(ctx, cam, 'montreal', 'sacramento', clamp((t - T.californie + .4) / 2), {color: color.cyan, height: .07, width: 2.2,
    after: t - T.californie - 1.6, alpha: 1 - ease((t - T.quinze) / 1.4)});
  pin(ctx, cam, 'sacramento', color.cyan, {alpha: ease((t - T.californie) / .5) * (1 - ease((t - T.quinze) / 1.2)), t});
  const mtl = pin(ctx, cam, 'montreal', color.cyan, {alpha: ease((t - T.exception) / .5), t});
  // Centrales et pipelines américains déréglementés (lueurs ambre)
  const us = clamp((t - T.etats) / 1.6) * (1 - .5 * ease((t - T.inverse) / 2));
  ['pa', 'ohio', 'nj', 'michigan', 'albany', 'boston'].forEach((p, i) => {
    const q = pin(ctx, cam, p, color.amber, {alpha: us * ease((t - T.etats - i * .2) / .5), t: t + i, r: 5});
    if (q) light(ctx, q.x, q.y, 60, color.amber, .35 * us);
  });
  stream(ctx, cam, 'ohio', 'pa', t - T.factures, {color: color.amber, height: .01, count: 10, speed: .5, alpha: us});
  // Barrages d'Hydro-Québec : courants émeraude
  const hq = clamp((t - T.hydro + .4) / 1);
  ['manic', 'lg2', 'lg4'].forEach((dam, i) => {
    stream(ctx, cam, dam, 'montreal', (t - T.hydro - i * .3), {color: color.emerald, height: .02, count: 16, speed: .4, alpha: hq, width: 2.2});
    pin(ctx, cam, dam, color.emerald, {alpha: hq, t: t + i});
  });
  colorWash(ctx, w, h, .85);
  // Le dilemme : deux secousses venues de l'extérieur, puis l'exception québécoise
  const out0 = clamp((t - T.marche + .3) / .6);
  card(d, {x: v ? w * .5 : w * .22, y: v ? h * .13 : h * .22, w: v ? 560 : 380, h: 118, tint: color.amber, kicker: 'WASHINGTON',
    title: 'Virage américain', t: clamp((t - T.virage + .1) / .6), out: out0, size: 28});
  card(d, {x: v ? w * .5 : w * .78, y: v ? h * .23 : h * .22, w: v ? 560 : 380, h: 118, tint: color.emerald, kicker: 'COP31',
    title: 'Recul climatique', t: clamp((t - T.recul + .1) / .6), out: out0, size: 28});
  card(d, {x: w * .5, y: v ? h * .33 : h * .42, w: v ? 600 : 460, h: 118, tint: color.cyan, kicker: 'QUÉBEC · AMÉRIQUE DU NORD',
    title: 'Une exception', t: clamp((t - T.exception + .1) / .6), out: out0, size: 30});
  // Afficheur de pompe : +15 à 18 ¢ / litre
  const pa = clamp((t - T.quinze + .3) / 1.4) * (1 - clamp((t - T.etats) / .6));
  const px = v ? w * .5 : w * .8, py = v ? h * .27 : h * .3;
  if (pa > 0) pumpSign(d, px, py, {t: pa, value: 18, from: 15, tint: color.amber});
  if (!v && pa > 0) tether(ctx, mtl, {x: px - 165, y: py}, color.amber, pa);
  card(d, {x: px, y: py, w: v ? 620 : 420, h: 140, tint: color.amber, kicker: 'ÉTATS-UNIS · FAST-TRACK', title: 'Aucune taxe carbone fédérale',
    t: clamp((t - T.taxe + .2) / .6), out: clamp((t - T.ecart) / .6), size: 28});
  const ba = clamp((t - T.ecart + .2) / .7) * (1 - clamp((t - T.inverse) / .6));
  if (ba > 0) {
    ctx.save();
    ctx.globalAlpha *= ease(ba);
    barometer(ctx, px, py + 40, v ? 170 : 150, .3 + .45 * ease(clamp((t - T.ecart) / 1.6)), {t, bare,
      caption: 'ÉCART DE COMPÉTITIVITÉ', labels: ['QUÉBEC', 'ÉTATS-UNIS']});
    ctx.restore();
  }
  card(d, {x: px, y: py, w: v ? 620 : 440, h: 210, tint: color.emerald, kicker: 'HYDRO-QUÉBEC', title: 'Énergie propre',
    value: {v: 99, suffix: ' %', p: clamp((t - T.hydro) / 1.8)}, sub: t > T.geants ? 'AIMANT POUR DÉCARBONER' : 'CARTE MAÎTRESSE',
    t: clamp((t - T.hydro + .1) / .6), numberSize: 84});
}

export default sceneRenderer([
  shot('', 'Le dilemme du Québec', 'FRONTIÈRE QUÉBEC  /  ÉTATS-UNIS', border, color.cyan, 'bottom', 'geo'),
  shot('figure d\'exception', 'Une exception', 'EN AMÉRIQUE DU NORD', border, color.cyan, 'bottom', 'geo'),
  shot('marché du carbone', 'Marché du carbone', 'QUÉBEC  ⇄  CALIFORNIE', border, color.cyan, 'bottom', 'geo'),
  shot('quinze à dix-huit', '15 à 18 ¢ / litre', 'À LA POMPE  /  ESTIMATION', border, color.amber, 'bottom', 'geo'),
  shot('Si les États-Unis', 'Les États-Unis accélèrent', 'PROJETS ÉNERGÉTIQUES', border, color.amber, 'bottom', 'geo'),
  shot('écart de compétitivité', 'Un écart de compétitivité', 'NOS MANUFACTURIERS', border, color.coral, 'bottom', 'geo'),
  shot('à l\'inverse', 'Mais à l’inverse…', 'CÔTE-NORD  /  BAIE-JAMES', border, color.emerald, 'bottom', 'geo'),
  shot('hydroélectricité propre', '99 % propre', 'HYDRO-QUÉBEC', border, color.emerald, 'bottom', 'geo'),
  shot('géants mondiaux', 'Un aimant industriel', 'DÉCARBONER LA PRODUCTION', border, color.emerald, 'bottom', 'geo'),
]);
