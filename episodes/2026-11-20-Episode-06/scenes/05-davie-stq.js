import {cues, odometer, mono, kZoom} from '../moteur.js';
import {color, clamp, ease, lerp, rgba, line, label, glass, floor, sceneRenderer, shot, colorWash, light} from '../mise-en-scene.js';
import {drawEarth, cameraPath, ballistic, pin, river, quebec, borders} from '../globe.js';
import {card, tether, ticks} from '../hud.js';
import {drydock} from '../rayonx.js';

const V = (view, v) => v ? {...view, alt: view.alt * 1.4, y: view.vy ?? .54} : view;
const times = scene => cues(scene, {
  quebec: 'au Québec', concret: 'très concrètement', militaires: 'nos militaires', lettonie: 'en Lettonie',
  alerte: 'alerte directe', economie: 'économie régionale', flottes: 'flottes stratégiques', davie: 'chantier maritime Davie',
  regime: 'plein régime', recrute: 'recrute des centaines', pme: 'pénurie de main', chaudiere: 'Chaudière-Appalaches',
  couts: 'coûts navals', apprend: 'apprend aujourd\'hui', traversiers: 'trois traversiers', quatre: 'quatre cents millions',
  double: 'le double', prevus: 'millions prévus',
});

function front(d) {
  const {ctx, w, h, t, vertical: v, scene} = d;
  const T = times(scene);
  const view = cameraPath(t, [
    [0, {lon: -70, lat: 46, alt: .7, tilt: .45, y: .52}],
    [T.militaires + 2.4, {lon: -25, lat: 52, alt: 2.3, tilt: .15}, 2.8],
    [T.economie + 2.6, {lon: -71.2, lat: 46.3, alt: .07, tilt: 1.0, turn: .5, y: .62}, 3],
  ].map(([k, vw, dur]) => [k, V(vw, v), dur]));
  const cam = drawEarth(ctx, view, w, h);
  borders(ctx, cam, ['Latvia', 'Poland', 'Lithuania', 'Estonia', 'Canada', 'United States of America'], {alpha: .3});
  river(ctx, cam, 'St. Lawrence', {alpha: .85 * ease(t / 1.6)});
  ['montreal', 'quebec', 'levis'].forEach((p, i) => pin(ctx, cam, p, color.cyan, {alpha: ease((t - .8 - i * .6) / .5) * (1 - ease((t - T.militaires) / 1)), t, r: 4}));
  quebec(ctx, cam, {alpha: .7, fill: color.cyan});
  ballistic(ctx, cam, 'quebec', 'adazi', clamp((t - T.militaires) / 2.4), {color: color.cyan, height: .1, width: 2.4, after: t - T.militaires - 2.4,
    alpha: 1 - ease((t - T.economie - 1) / 1)});
  ballistic(ctx, cam, 'adazi', 'levis', clamp((t - T.economie) / 2.4), {color: color.amber, height: .1, width: 2.4, after: t - T.economie - 2.4});
  const lat = pin(ctx, cam, 'adazi', color.cyan, {alpha: ease((t - T.lettonie) / .5) * (1 - ease((t - T.economie) / 1)), t});
  pin(ctx, cam, 'warsaw', color.cyan, {alpha: ease((t - T.lettonie - .5) / .5) * (1 - ease((t - T.economie) / 1)), t, r: 4});
  const lev = pin(ctx, cam, 'levis', color.amber, {alpha: ease((t - T.economie - 2) / .5), t});
  pin(ctx, cam, 'beauce', color.coral, {alpha: ease((t - T.flottes) / .5), t, r: 4});
  colorWash(ctx, w, h, .85);
  const cx = v ? w * .5 : w * .79, cy = v ? h * .17 : h * .3;
  const a1 = clamp((t - T.lettonie) / .6), o1 = clamp((t - T.economie) / .6);
  card(d, {x: cx, y: cy, w: v ? 620 : 420, h: 150, tint: color.cyan, kicker: 'FLANC EST · LETTONIE', title: 'Nos militaires',
    sub: t > T.alerte ? 'EN ALERTE DIRECTE' : 'DÉPLOYÉS PRÈS DE LA POLOGNE', t: a1, out: o1});
  if (!v) tether(ctx, lat, {x: cx - 210, y: cy}, color.cyan, a1 * (1 - o1));
  const a2 = clamp((t - T.economie - 1.6) / .6);
  card(d, {x: cx, y: cy, w: v ? 620 : 420, h: 150, tint: color.amber, kicker: 'LÉVIS · CHAUDIÈRE-APPALACHES', title: 'Économie régionale',
    sub: 'FLOTTES STRATÉGIQUES', t: a2});
  if (!v) tether(ctx, lev, {x: cx - 210, y: cy}, color.amber, a2);
}

function shipyard(d) {
  const {t, scene} = d;
  const T = times(scene);
  drydock(d, {outline: clamp((t - T.davie + 1.2) / 2.2), scan: clamp((t - T.regime + .2) / 3.4),
    flows: Math.max(0, t - T.recrute), pme: clamp((t - T.pme + .3) / 2.2), push: clamp((t - T.davie) / 14)});
  colorWash(d.ctx, d.w, d.h, .7);
}

function ferry(ctx, x, y, s, tint, a = 1) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-90, 0); ctx.lineTo(90, 0); ctx.lineTo(76, 22); ctx.lineTo(-76, 22); ctx.closePath();
  ctx.fillStyle = rgba(tint, .25);
  ctx.fill();
  ctx.strokeStyle = tint;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-60, 0); ctx.lineTo(-54, -24); ctx.lineTo(50, -24); ctx.lineTo(58, 0);
  ctx.moveTo(-30, -24); ctx.lineTo(-26, -40); ctx.lineTo(20, -40); ctx.lineTo(24, -24);
  ctx.stroke();
  for (let i = 0; i < 7; i++) ctx.fillRect(-46 + i * 14, -16, 7, 6);
  ctx.restore();
}

function budget(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  floor(d, color.amber, true);
  const cx = w * .5, cy = v ? h * .4 : h * .37;
  const gw = v ? 800 : 1200, gh = v ? 720 : 470;
  glass(ctx, cx, cy, gw, gh, color.amber, t, () => {
    if (!bare) mono(ctx, 'SOCIÉTÉ DES TRAVERSIERS DU QUÉBEC · REMPLACEMENT', 0, -gh / 2 + 36, {size: 16, color: color.amber, spacing: 3, cursor: false});
    for (let i = 0; i < 3; i++) {
      const a = ease(clamp((t - T.traversiers - i * .25) / .6));
      ferry(ctx, (i - 1) * (v ? 230 : 250), -gh / 2 + (v ? 130 : 120) + Math.sin(t * 1.4 + i) * 3, v ? 1.05 : 1.15, color.ice, a);
    }
    const oy = v ? 40 : 40;
    // Devis initial 2023, barré
    const old = clamp((t - T.couts + .2) / .8);
    if (!bare) {
      odometer(ctx, 191.5 * ease(old), v ? 0 : -300, oy, {size: v ? 64 : 66, weight: 850, dec: 1, suffix: ' M$', suffixScale: .55,
        color: color.slate, suffixColor: color.slate, alpha: old});
      label(ctx, 'ESTIMATION DE 2023', v ? 0 : -300, oy + 46, {size: 15, mono: true, tint: color.slate, width: 300, alpha: old});
    }
    const cut = clamp((t - T.quatre + .3) / .5);
    if (cut > 0) line(ctx, [[(v ? 0 : -300) - 150, oy - 22], [(v ? 0 : -300) - 150 + 300 * ease(cut), oy - 22 - 6 * ease(cut)]], color.red, 5);
    // Nouveau coût : rouleaux propulsés jusqu'à 400 M$
    const grow = clamp((t - T.quatre + .1) / 2);
    const nx = v ? 0 : 230, ny = v ? oy + 200 : oy + 10;
    if (!bare && grow > 0) {
      odometer(ctx, lerp(191.5, 400, ease(grow)), nx, ny, {size: v ? 120 : 132, weight: 900, suffix: ' M$', suffixScale: .45,
        color: color.white, suffixColor: color.amber, glow: 8, glowColor: color.amber, alpha: clamp(grow * 3)});
      label(ctx, 'COÛT ANNONCÉ AUJOURD’HUI', nx, ny + 60, {size: 15, mono: true, tint: color.amber, width: 360, alpha: clamp(grow * 3)});
    }
    if (!bare && t > T.double - .1) kZoom(ctx, '× 2', v ? 230 : 470, v ? ny - 110 : ny - 120, {t: clamp((t - T.double) / .4), from: 2.4, size: v ? 70 : 76, weight: 900, color: color.red});
    ticks(ctx, 0, gh / 2 - 46, gw * .8, color.amber, ease(grow) * .95 + .05 * ease(old), t);
  }, {radius: 22});
  colorWash(ctx, w, h, .8);
  light(ctx, cx, cy, 300, color.amber, .12);
}

export default sceneRenderer([
  shot('', 'Et ici, au Québec', 'SAINT-LAURENT  /  GRANDS LACS', front, color.cyan, 'bottom', 'geo'),
  shot('nos militaires', 'Nos militaires en alerte', 'FLANC EST DE L’OTAN', front, color.cyan, 'bottom', 'geo'),
  shot('alerte directe', 'Lettonie et Pologne', 'TROUPES CANADIENNES DÉPLOYÉES', front, color.cyan, 'bottom', 'geo'),
  shot('économie régionale', 'Notre économie régionale', 'CAP SUR LÉVIS', front, color.amber, 'bottom', 'geo'),
  shot('chantier maritime Davie', 'Le chantier Davie', 'LÉVIS  /  FACE À QUÉBEC', shipyard, color.amber, 'bottom', 'yard'),
  shot('plein régime', 'À plein régime', 'COUPE RAYONS X  /  NAVIRE EN CALE SÈCHE', shipyard, color.cyan, 'bottom', 'yard'),
  shot('recrute des centaines', 'Des centaines d’embauches', 'CONDITIONS ALLÉCHANTES', shipyard, color.amber, 'bottom', 'yard'),
  shot('pénurie de main', 'Les PME s’essoufflent', 'CHAUDIÈRE-APPALACHES', shipyard, color.coral, 'bottom', 'yard'),
  shot('coûts navals', 'Les coûts navals explosent', 'SOCIÉTÉ DES TRAVERSIERS DU QUÉBEC', budget, color.amber, 'bottom', 'stq'),
  shot('trois traversiers', 'Trois traversiers', 'REMPLACEMENT DE LA FLOTTE', budget, color.amber, 'bottom', 'stq'),
  shot('quatre cents millions', 'Près de 400 M$', 'LE DOUBLE DES 191,5 M$ PRÉVUS', budget, color.red, 'bottom', 'stq'),
]);
