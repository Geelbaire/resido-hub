import {cues, mono} from '../moteur.js';
import {color, clamp, ease, sceneRenderer, shot, colorWash} from '../mise-en-scene.js';
import {drawEarth, cameraPath, ballistic, pin, borders} from '../globe.js';
import {card, tether} from '../hud.js';
import {draft} from '../banc.js';
import {deadline, hemicycle} from '../graphes.js';

const V = (view, v) => v ? {...view, alt: view.alt * 1.4, y: view.vy ?? .54} : view;
const times = scene => cues(scene, {
  dossier: 'Deuxième grand dossier', theatre: 'coup de théâtre', turquie: 'en Turquie', washington: 'à Washington',
  cop: 'conférence climatique', prolongation: 'entrer en prolongation', compromis: 'arracher un compromis',
  blocage: 'Pourquoi ce blocage', onu: 'selon l\'ONU', version: 'dernière version', efface: 'effacé toute mention',
  charbon: 'du charbon', petrole: 'du pétrole', gaz: 'du gaz', moment: 'au moment exact', senat: 'le Sénat américain',
  adopter: 'vient d\'adopter', accelerer: 'accélérer les projets', recours: 'limiter les recours',
});

function antalya(d) {
  const {ctx, w, h, t, vertical: v, scene} = d;
  const T = times(scene);
  const view = cameraPath(t, [
    [0, {lon: 10, lat: 42, alt: 1.6, tilt: .15}],
    [T.turquie + 2, {lon: 30.5, lat: 37.5, alt: .32, tilt: .7, y: .55}, 4.5],
    [T.prolongation + 3, {lon: 31.5, lat: 37.8, alt: .26, tilt: .78, turn: .1, y: .56}, 5],
  ].map(([k, vw, dur]) => [k, V(vw, v), dur]));
  const cam = drawEarth(ctx, view, w, h);
  borders(ctx, cam, ['Turkey', 'Greece', 'Cyprus', 'Syria', 'Bulgaria'], {alpha: .3});
  borders(ctx, cam, ['Turkey'], {alpha: .55 * ease((t - T.turquie) / 1), color: color.emerald, fill: color.emerald, width: 1.6});
  const ant = pin(ctx, cam, 'antalya', color.emerald, {alpha: ease((t - T.theatre) / .5), t});
  ballistic(ctx, cam, 'antalya', 'washington', clamp((t - T.washington + .3) / 1.8), {color: color.amber, height: .16, width: 2,
    after: t - T.washington - 1.5, alpha: .8 * (1 - ease((t - T.cop) / 1.2))});
  colorWash(ctx, w, h, .85);
  const over = clamp((t - T.prolongation) / 6);
  const cx = v ? w * .5 : w * .8, cy = v ? h * .19 : h * .3;
  const a = clamp((t - T.cop + .2) / .7);
  if (a > 0) {
    ctx.save();
    ctx.globalAlpha *= ease(a);
    deadline(ctx, cx, cy, v ? 110 : 100, 720 * (.97 + over * .2), {t, over});
    ctx.restore();
    if (!d.bare) mono(ctx, over > 0 ? 'COP31 · PROLONGATION EN COURS' : 'COP31 · ANTALYA', cx, cy + (v ? 160 : 150), {size: 17,
      color: over > 0 ? color.coral : color.emerald, spacing: 3, t: a, cursor: false});
    if (!v) tether(ctx, ant, {x: cx - 115, y: cy}, color.emerald, a);
  }
  card(d, {x: v ? w * .5 : w * .8, y: v ? h * .19 : h * .3, w: v ? 620 : 420, h: 150, tint: color.emerald, kicker: 'DOSSIER 02',
    title: 'Énergie & climat', sub: 'TURQUIE  ·  WASHINGTON', t: clamp((t - .4) / .7), out: clamp((t - T.cop + .4) / .6)});
  card(d, {x: v ? w * .5 : w * .8, y: v ? h * .37 : h * .56, w: v ? 600 : 380, h: 120, tint: color.coral, kicker: 'OBJECTIF',
    title: 'Un compromis ce soir', t: clamp((t - T.compromis) / .6)});
}

function inspection(d) {
  const {t, scene} = d;
  const T = times(scene);
  draft(d, {
    heading: 'Projet d’accord final', kind: 'COP31  /  FAC-SIMILÉ ILLUSTRATIF', tint: color.emerald,
    rows: ['Préambule · science du climat', 'Article 3 · financement', 'Article 4 · transition énergétique', 'Article 5 · adaptation'],
    target: 2, words: ['CHARBON', '·', 'PÉTROLE', '·', 'GAZ'],
    strike: clamp((t - T.charbon + .3) / Math.max(.8, T.gaz - T.charbon + .8)),
    lensT: Math.max(0, (t - T.version + .6) / 2.6), stamp: t - T.gaz - .5, stampText: 'MENTION EFFACÉE (ONU)', stampTint: color.red,
    seal: 'SELON L’ONU · VERSION LA PLUS RÉCENTE',
  });
}

function senate(d) {
  const {ctx, w, h, t, vertical: v, scene} = d;
  const T = times(scene);
  const into = ease((t - T.senat + .3) / 1.1);
  if (into < 1) {
    const view = cameraPath(t, [
      [T.moment, {lon: 31, lat: 38, alt: .5, tilt: .5}],
      [T.moment + 2.6, {lon: -50, lat: 40, alt: 1.6, tilt: .2}, 2.6],
      [T.senat + 1, {lon: -77, lat: 38.9, alt: .45, tilt: .6, y: .5}, 2],
    ].map(([k, vw, dur]) => [k, V(vw, v), dur]));
    const cam = drawEarth(ctx, view, w, h);
    borders(ctx, cam, ['United States of America', 'Turkey'], {alpha: .3});
    ballistic(ctx, cam, 'antalya', 'washington', clamp((t - T.moment) / 2.4), {color: color.amber, height: .16, after: t - T.moment - 2.4});
    pin(ctx, cam, 'washington', color.amber, {alpha: ease((t - T.moment - 2.2) / .5), t});
    colorWash(ctx, w, h, .85);
  }
  if (into > 0) {
    ctx.save();
    ctx.globalAlpha *= into;
    hemicycle(d, {p: clamp((t - T.senat) / 2.4), verdict: clamp((t - T.adopter) / .8), caption: 'FAST-TRACK ÉNERGÉTIQUE'});
    ctx.restore();
    const cy = v ? h * .13 : h * .2;
    card(d, {x: v ? w * .5 : w * .2, y: cy, w: v ? 620 : 380, h: 120, tint: color.amber, kicker: 'LOI ADOPTÉE', title: 'Projets accélérés',
      t: clamp((t - T.accelerer) / .6)});
    card(d, {x: v ? w * .5 : w * .8, y: v ? cy + 140 : cy, w: v ? 620 : 380, h: 120, tint: color.coral, kicker: 'TRIBUNAUX', title: 'Recours limités',
      t: clamp((t - T.recours) / .6)});
  }
}

export default sceneRenderer([
  shot('', 'Deuxième dossier', 'COP31  /  ÉNERGIE', antalya, color.emerald, 'bottom', 'geo'),
  shot('coup de théâtre', 'Un coup de théâtre', 'TURQUIE  /  WASHINGTON', antalya, color.emerald, 'bottom', 'geo'),
  shot('conférence climatique', 'La COP31 à Antalya', 'MÉDITERRANÉE ORIENTALE', antalya, color.emerald, 'bottom', 'geo'),
  shot('entrer en prolongation', 'Prolongation', 'NÉGOCIATIONS SOUS HAUTE TENSION', antalya, color.coral, 'bottom', 'geo'),
  shot('Pourquoi ce blocage', 'Pourquoi ce blocage ?', 'LE PROJET D’ACCORD', inspection, color.emerald, 'bottom', 'doc'),
  shot('effacé toute mention', 'Les fossiles effacés', 'CHARBON  /  PÉTROLE  /  GAZ', inspection, color.red, 'bottom', 'doc'),
  shot('du gaz', 'Mention effacée', 'SELON L’ONU', inspection, color.red, 'bottom', 'doc'),
  shot('au moment exact', 'Pendant ce temps…', 'CAP SUR WASHINGTON', senate, color.amber, 'bottom', 'senate'),
  shot('le Sénat américain', 'Le Sénat accélère', 'LOI SUR LES PROJETS ÉNERGÉTIQUES', senate, color.amber, 'bottom', 'senate'),
  shot('limiter les recours', 'Moins de recours', 'DEVANT LES TRIBUNAUX', senate, color.coral, 'bottom', 'senate'),
]);
