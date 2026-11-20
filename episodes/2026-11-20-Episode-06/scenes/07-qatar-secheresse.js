import {cues, mono, odometer} from '../moteur.js';
import {color, clamp, ease, lerp, sceneRenderer, shot, colorWash, glass, floor, label, light} from '../mise-en-scene.js';
import {drawEarth, cameraPath, pin, borders, stream, shock} from '../globe.js';
import {card} from '../hud.js';
import {bezierFlow, riverProfile, curve, barometer} from '../graphes.js';
import {icon} from '../ecran.js';
import {heatHaze} from '../ciel.js';

const V = (view, v) => v ? {...view, alt: view.alt * 1.4, y: view.vy ?? .54} : view;
const times = scene => cues(scene, {
  revirement: 'revirement simultané', brutale: 'réalité brutale', donnees: 'centres de données',
  reindus: 'la réindustrialisation', inflation: 'crainte de l\'inflation', abondante: 'énergie abondante',
  berlin: 'À Berlin', qatar: 'le Qatar', seize: 'seize virgule', partenariats: 'partenariats stratégiques',
  signaux: 'signaux physiques', secheresse: 'sécheresse durable', fleuves: 'assèche les fleuves', guyane: 'la Guyane',
  caraibes: 'aux Caraïbes', indien: 'océan Indien', fao: 'la FAO', riz: 'production de riz',
});

function drivers(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  floor(d, color.amber, true);
  const ba = 1 - clamp((t - T.donnees + .4) / .8);
  if (ba > 0) {
    // Grille polaire tournante et rayons balayés derrière le baromètre
    ctx.save();
    ctx.globalAlpha *= ba;
    ctx.translate(w * .5, v ? h * .42 : h * .5);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * Math.PI * 2 + t * .35;
      const on = .5 + .5 * Math.sin(a * 3 - t * 2.4);
      ctx.strokeStyle = 'rgba(245,158,11,' + (.06 + .3 * on).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 270, Math.sin(a) * 270);
      ctx.lineTo(Math.cos(a) * (v ? 620 : 760), Math.sin(a) * (v ? 620 : 760));
      ctx.stroke();
    }
    for (let k = 0; k < 4; k++) {
      const u = (t * .45 + k / 4) % 1;
      ctx.strokeStyle = 'rgba(56,189,248,' + (.5 * (1 - u)).toFixed(3) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 250 + u * 420, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= ease(clamp(t / .8)) * ba;
    const swing = .2 * ease(clamp(t / 1.2)) + .8 * ease(clamp((t - T.revirement) / 2.4)) + .06 * Math.sin(t * 3.4);
    barometer(ctx, w * .5, v ? h * .42 : h * .5, v ? 260 : 230, lerp(.15, .85, swing), {t, bare, caption: 'PRIORITÉ DES GRANDES PUISSANCES',
      labels: ['CLIMAT', 'ÉNERGIE IMMÉDIATE']});
    ctx.restore();
  }
  const items = [['cyber', 'Centres de données', T.donnees], ['factory', 'Réindustrialisation', T.reindus], ['chart', 'Peur de l’inflation', T.inflation]];
  const target = v ? [w * .5, h * .62] : [w * .5, h * .5];
  const pts = items.map((_, i) => v ? [w * .5, h * (.17 + i * .14)] : [w * (.2 + i * .3), h * .2]);
  bezierFlow(ctx, pts.filter((_, i) => t > items[i][2]), target, t - T.donnees, {tint: color.amber, alpha: clamp((t - T.donnees) / 1), bend: 60});
  items.forEach(([kind, name, at], i) => {
    const a = clamp((t - at + .2) / .6);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= ease(a);
    glass(ctx, pts[i][0], pts[i][1], v ? 560 : 400, 110, color.amber, t, () => {
      icon(ctx, kind, v ? -230 : -160, 0, 40, color.amber);
      if (!bare) label(ctx, name, v ? -190 : -122, 0, {size: v ? 32 : 30, align: 'left', width: v ? 400 : 290, weight: 850, tint: color.white});
    }, {radius: 16});
    ctx.restore();
  });
  const ea = clamp((t - T.abondante + .2) / .7);
  if (ea > 0) {
    ctx.save();
    ctx.globalAlpha *= ease(ea);
    light(ctx, target[0], target[1], 160, color.amber, .5);
    icon(ctx, 'bolt', target[0], target[1] - 10, 90, '#FFF2D6');
    ctx.restore();
    if (!bare) mono(ctx, 'ÉNERGIE ABONDANTE ET IMMÉDIATE', target[0], target[1] + 80, {size: 19, color: color.amber, spacing: 3, t: ea, cursor: false});
  }
  colorWash(ctx, w, h, .85);
}

function pipeline(d) {
  const {ctx, w, h, t, vertical: v, scene} = d;
  const T = times(scene);
  const view = cameraPath(t, [
    [T.berlin - .5, {lon: 14, lat: 50, alt: .9, tilt: .4}],
    [T.qatar + 1.6, {lon: 32, lat: 40, alt: 1.0, tilt: .35}, 2.4],
  ].map(([k, vw, dur]) => [k, V(vw, v), dur]));
  const cam = drawEarth(ctx, view, w, h);
  borders(ctx, cam, ['Qatar', 'Germany', 'Saudi Arabia', 'Turkey'], {alpha: .3});
  borders(ctx, cam, ['Qatar', 'Germany'], {alpha: .7 * ease((t - T.qatar) / 1), color: color.gold, fill: color.gold, width: 1.6});
  const arrivals = stream(ctx, cam, 'doha', 'berlin', t - T.qatar, {color: color.gold, height: .08, count: 34, speed: .32, width: 2.4});
  pin(ctx, cam, 'doha', color.gold, {alpha: ease((t - T.qatar) / .5), t});
  const b = pin(ctx, cam, 'berlin', color.gold, {alpha: ease((t - T.berlin) / .5), t});
  if (b && arrivals > 0) shock(ctx, b.x, b.y, ((t - T.qatar) * .3) % 1.2, color.gold, .5);
  colorWash(ctx, w, h, .85);
  const steps = Math.min(33, arrivals);
  card(d, {x: v ? w * .5 : w * .79, y: v ? h * .2 : h * .34, w: v ? 640 : 460, h: 250, tint: color.gold, kicker: 'QATAR → ALLEMAGNE',
    title: 'Investissements promis', value: {v: 16.5, dec: 1, suffix: ' G$ US', p: clamp(steps / 33 + clamp((t - T.seize) / 3) * 0)},
    sub: 'DÉFENSE · TECHNOLOGIE · PARTENARIATS', t: clamp((t - T.qatar + .2) / .7), numberSize: 96});
}

function drought(d) {
  const {ctx, w, h, t, vertical: v, scene, bare} = d;
  const T = times(scene);
  const warm = ease((t - T.signaux) / 2.4);
  const view = cameraPath(t, [
    [T.signaux - .3, {lon: 0, lat: 30, alt: 2.2, tilt: .1}],
    [T.secheresse + 2.6, {lon: -58, lat: 10, alt: .9, tilt: .45, y: .5}, 3],
    [T.indien + 1.6, {lon: 5, lat: -6, alt: 2.6, tilt: .1}, 2.4],
  ].map(([k, vw, dur]) => [k, V(vw, v), dur]));
  const cam = drawEarth(ctx, view, w, h, {warm});
  borders(ctx, cam, ['Guyana', 'Suriname', 'Brazil', 'Venezuela'], {alpha: .25});
  pin(ctx, cam, 'guyane', color.amber, {alpha: ease((t - T.guyane) / .5), t});
  pin(ctx, cam, 'caraibes', color.amber, {alpha: ease((t - T.caraibes) / .5), t});
  pin(ctx, cam, 'reunion', color.amber, {alpha: ease((t - T.indien) / .5), t});
  heatHaze(d, warm);
  colorWash(ctx, w, h, .85);
  const pa = clamp((t - T.fleuves + .2) / .7) * (1 - clamp((t - T.fao + .2) / .6));
  if (pa > 0) {
    const pw = v ? 640 : 520, ph = v ? 300 : 260, px = v ? w * .5 : w * .76, py = v ? h * .21 : h * .33;
    ctx.save();
    ctx.globalAlpha *= ease(pa);
    glass(ctx, px, py, pw + 40, ph + 70, color.amber, t, () => {
      if (!bare) mono(ctx, 'PROFIL D’UN FLEUVE · ILLUSTRATIF', 0, -ph / 2 - 6, {size: 15, color: color.amber, spacing: 2, cursor: false});
      riverProfile(ctx, -pw / 2 + 20, -ph / 2 + 22, pw - 40, ph - 30, clamp((t - T.fleuves) / 4), {t, bare});
    }, {radius: 18});
    ctx.restore();
  }
  const fa = clamp((t - T.fao + .2) / .7);
  if (fa > 0) {
    const cw = v ? 620 : 560, ch = v ? 300 : 250, px = v ? w * .5 : w * .74, py = v ? h * .23 : h * .34;
    ctx.save();
    ctx.globalAlpha *= ease(fa);
    glass(ctx, px, py, cw + 60, ch + 120, color.red, t, () => {
      if (!bare) {
        mono(ctx, 'FAO · RIZ · TENDANCE ILLUSTRATIVE', 0, -ch / 2 - 22, {size: 16, color: color.amber, spacing: 2, cursor: false});
        label(ctx, 'Première baisse en 4 campagnes', 0, ch / 2 + 42, {size: 22, tint: color.white, width: cw, weight: 800});
      }
      curve(ctx, -cw / 2, -ch / 2 + 6, cw, ch - 30, [100, 103, 104, 107, 109, 103], clamp((t - T.fao) / 2.6), {
        tint: color.emerald, alert: color.red, labels: [], bare, t, dropFrom: 4});
    }, {radius: 18});
    ctx.restore();
  }
}

export default sceneRenderer([
  shot('', 'Pourquoi ce revirement ?', 'GRANDES PUISSANCES  /  CLIMAT', drivers, color.amber, 'bottom', 'drivers'),
  shot('réalité brutale', 'Une réalité brutale', 'TROIS PRESSIONS', drivers, color.amber, 'bottom', 'drivers'),
  shot('la réindustrialisation', 'Réindustrialiser', 'ET CRAINDRE L’INFLATION', drivers, color.amber, 'bottom', 'drivers'),
  shot('énergie abondante', 'L’énergie d’abord', 'ABONDANTE ET IMMÉDIATE', drivers, color.gold, 'bottom', 'drivers'),
  shot('À Berlin', 'Berlin, aujourd’hui même', 'LE CHANCELIER ALLEMAND', pipeline, color.gold, 'bottom', 'pipe'),
  shot('seize virgule', '16,5 milliards $ US', 'QATAR  →  ALLEMAGNE', pipeline, color.gold, 'bottom', 'pipe'),
  shot('signaux physiques', 'Les signaux s’accumulent', 'DÉRÈGLEMENT CLIMATIQUE', drought, color.amber, 'bottom', 'dry'),
  shot('sécheresse durable', 'Une sécheresse durable', 'GUYANE  /  CARAÏBES', drought, color.amber, 'bottom', 'dry'),
  shot('assèche les fleuves', 'Les fleuves baissent', 'RÉCOLTES MENACÉES', drought, color.amber, 'bottom', 'dry'),
  shot('océan Indien', 'Jusqu’à l’océan Indien', 'LA RÉUNION', drought, color.amber, 'bottom', 'dry'),
  shot('la FAO', 'Alerte de la FAO', 'PRODUCTION MONDIALE DE RIZ', drought, color.red, 'bottom', 'dry'),
]);
void odometer; void lerp;
