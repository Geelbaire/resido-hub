import {emblem, odometer, cues} from '../moteur.js';
import {color, clamp, ease, lerp, rgba, light, sceneRenderer, shot, colorWash, TAU} from '../mise-en-scene.js';
import {drawEarth, cameraPath, ballistic, pin, river, quebec, borders, shock, places} from '../globe.js';
import {card, tether, ticks} from '../hud.js';

const V = (view, v) => v ? {...view, alt: view.alt * (view.alt > 1 ? 1.75 : 1.3), x: .5, y: view.vy ?? .52} : view;

function polar(d, alpha) {
  const {ctx, w, h, t} = d;
  if (alpha < .01) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(w / 2, h * .45);
  ctx.rotate(t * .03);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 1; i < 9; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, i * 90, 0, TAU);
    ctx.strokeStyle = rgba(color.cyan, i % 3 ? .05 : .11);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (let i = 0; i < 36; i++) {
    const a = i / 36 * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 60, Math.sin(a) * 60);
    ctx.lineTo(Math.cos(a) * 820, Math.sin(a) * 820);
    ctx.strokeStyle = rgba(color.cyan, i % 9 ? .035 : .1);
    ctx.stroke();
  }
  ctx.restore();
}

function opening(d) {
  const {ctx, w, h, t, vertical: v, scene} = d;
  const T = cues(scene, {
    rdv: 'votre rendez-vous', concret: 'ce qu\'ils changent', date: 'vendredi vingt novembre',
    trois: 'trois ondes de choc', missile: 'un missile russe', otan: 'exercice de l\'OTAN',
    cinq: 'plus de cinq cents', shenzhen: 'sommet de Shenzhen', cop: 'la COP trente',
    fossiles: 'effacé les énergies', bourse: 'l\'entrée en Bourse', wall: 'Wall Street',
    alerte: 'alerte mondiale',
  });
  ctx.fillStyle = '#030509';
  ctx.fillRect(0, 0, w, h);
  polar(d, 1 - ease((t - T.missile) / 2) * .6);
  // Globe 8K : émerge de l'ombre puis vole d'un dossier à l'autre
  const keys = [
    [0, {lon: -30, lat: 28, alt: 6.5, y: .5}],
    [T.rdv + 3.2, {lon: -62, lat: 40, alt: 2.7, y: .47}, 5],
    [T.trois + .2, {lon: -8, lat: 40, alt: 2.5, y: .47}, 3.4],
    [T.missile + 2, {lon: 25, lat: 49, alt: .95, tilt: .35, y: .5}, 2.6],
    [T.cinq + 1.8, {lon: 30, lat: 47, alt: .78, tilt: .48, y: .48}, 2.2],
    [T.shenzhen + 1.6, {lon: 72, lat: 38, alt: 2.1, tilt: .08, y: .46}, 2.4],
    [T.cop + 1.8, {lon: 31, lat: 39, alt: .95, tilt: .38, y: .48}, 2.4],
    [T.bourse + 2.2, {lon: -48, lat: 40, alt: 1.7, tilt: .1, y: .48}, 2.6],
    [T.alerte + 1.8, {lon: -72, lat: 46, alt: .42, tilt: .62, y: .55}, 2.8],
  ].map(([k, view, dur]) => [k, V(view, v), dur]);
  const view = cameraPath(t, keys);
  const appear = ease((t - T.rdv + 1.2) / 3);
  if (appear > 0) {
    ctx.save();
    ctx.globalAlpha *= appear;
    const cam = drawEarth(ctx, view, w, h);
    borders(ctx, cam, ['Poland', 'Ukraine', 'Belarus', 'Turkey', 'Russia'], {alpha: .4 * ease((t - T.missile) / 2) * (1 - ease((t - T.bourse) / 2))});
    river(ctx, cam, 'Dnieper', {alpha: .55 * ease((t - T.cinq) / 2)});
    river(ctx, cam, 'St. Lawrence', {alpha: .8 * ease((t - T.alerte) / 1.5)});
    quebec(ctx, cam, {alpha: .9 * ease((t - T.alerte - .4) / 1.5), fill: color.cyan});
    // Les grands bouleversements du monde, puis la convergence vers le Québec
    const hot = [[30, 50], [114, 23], [-74, 41], [35, 32], [-46, -23], [77, 28], [139, 36], [3, 7], [-99, 19], [18, -33]];
    hot.forEach((p, i) => {
      const s = t - T.rdv - .4 - i * .45;
      const q = cam.project(...p);
      if (s > 0 && s < 3 && q.vis) shock(ctx, q.x, q.y, s, [color.amber, color.cyan, color.coral][i % 3], .7 * (1 - s / 3));
    });
    hot.slice(0, 5).forEach((p, i) => {
      places['h' + i] = p;
      ballistic(ctx, cam, 'h' + i, 'quebec', clamp((t - T.concret - i * .2) / 1.6), {color: color.cyan, height: .08, width: 1.6,
        after: t - T.concret - i * .2 - 1.6, alpha: .8 * (1 - ease((t - T.trois) / 1.2))});
    });
    // Trois ondes de choc annoncées
    const hubs = [['lublin', color.coral], ['antalya', color.emerald], ['nyc', color.cyan]];
    hubs.forEach(([p, c], i) => {
      const s = t - T.trois - i * .35;
      const q = cam.project(...places[p]);
      if (s > 0 && s < 4.2 && q.vis) shock(ctx, q.x, q.y, s, c, 1 - clamp((s - 3) / 1.2));
    });
    // Dossier 1 : missile sur la Pologne puis pluie de projectiles sur Kiev
    ballistic(ctx, cam, 'bryansk', 'lublin', clamp((t - T.missile) / 1.6), {color: color.coral, height: .045, after: t - T.missile - 1.6});
    for (let i = 0; i < 7; i++) {
      const from = [[38 + i * 1.6, 54 - i * .7], [40, 47 + i * .3]][i % 2];
      const key = 'v' + i;
      places[key] = from;
      ballistic(ctx, cam, key, 'kyiv', clamp((t - T.cinq - i * .22) / 1.3), {color: i % 2 ? color.amber : color.coral,
        height: .02 + i * .004, after: t - T.cinq - i * .22 - 1.3, width: 2, alpha: 1 - ease((t - T.cop) / 1.5)});
    }
    ballistic(ctx, cam, 'kyiv', 'shenzhen', clamp((t - T.shenzhen) / 2), {color: color.gold, height: .16, width: 2.2,
      after: t - T.shenzhen - 2, alpha: 1 - ease((t - T.cop - .6) / 1.5)});
    // Dossier 2 : COP31 en Turquie
    ballistic(ctx, cam, 'kyiv', 'antalya', clamp((t - T.cop) / 1.5), {color: color.emerald, height: .06, after: t - T.cop - 1.5});
    // Dossier 3 : Wall Street puis plongée sur le Québec
    ballistic(ctx, cam, 'antalya', 'nyc', clamp((t - T.bourse) / 2.2), {color: color.cyan, height: .14, after: t - T.bourse - 2.2, alpha: 1 - ease((t - T.alerte) / 1.2)});
    ballistic(ctx, cam, 'nyc', 'quebec', clamp((t - T.alerte) / 1.4), {color: color.cyan, height: .03, after: t - T.alerte - 1.4, width: 2});
    const anchors = {
      p1: pin(ctx, cam, 'lublin', color.coral, {alpha: ease((t - T.missile - 1.4) / .5) * (1 - ease((t - T.cop) / 1)), t}),
      p2: pin(ctx, cam, 'antalya', color.emerald, {alpha: ease((t - T.cop - 1.2) / .5) * (1 - ease((t - T.bourse) / 1)), t}),
      p3: pin(ctx, cam, 'nyc', color.cyan, {alpha: ease((t - T.bourse - 2) / .5) * (1 - ease((t - T.alerte) / 1)), t}),
      p4: pin(ctx, cam, 'quebec', color.cyan, {alpha: ease((t - T.alerte - 1.2) / .5), t}),
    };
    ctx.restore();
    colorWash(ctx, w, h, .9);
    // Fiches HUD en verre de saphir
    const cx = v ? w * .5 : w * .79, cy = v ? h * .19 : h * .35, cw = v ? 640 : 420, ch = v ? 176 : 168;
    const env = (a, b) => [clamp((t - a) / .7), clamp((t - b) / .6)];
    const [a1, o1] = env(T.missile + 1.2, T.shenzhen + 1.5);
    card(d, {x: cx, y: cy, w: cw, h: ch, tint: color.coral, kicker: '01 · POLOGNE · UKRAINE', title: 'Missile en Pologne',
      t: a1, out: o1, value: {v: 510, suffix: '+', p: clamp((t - T.cinq) / 2.4)}, sub: 'PROJECTILES SUR L’UKRAINE'});
    if (!v) tether(ctx, anchors.p1 || anchors.p1, {x: cx - cw / 2, y: cy}, color.coral, a1 * (1 - o1));
    const [a2, o2] = env(T.cop + 1, T.bourse + .6);
    card(d, {x: cx, y: cy, w: cw, h: ch, tint: color.emerald, kicker: '02 · TURQUIE · COP31', title: 'Prolongation',
      sub: clamp((t - T.fossiles) / .5) > 0 ? 'FOSSILES EFFACÉS DU PROJET D’ACCORD' : 'NÉGOCIATIONS SOUS HAUTE TENSION', t: a2, out: o2});
    if (!v) tether(ctx, anchors.p2, {x: cx - cw / 2, y: cy}, color.emerald, a2 * (1 - o2));
    const [a3] = env(T.bourse + 1.5, 999);
    card(d, {x: cx, y: cy, w: cw, h: ch, tint: color.cyan, kicker: '03 · ANTHROPIC · CYBER', title: 'Wall Street',
      value: {v: 9, prefix: '−', suffix: ' %', p: clamp((t - T.wall) / 1.6)}, t: a3});
  }
  // Emblème FRANC NORD en verre de saphir anodisé
  const leave = ease((t - T.rdv + .3) / 2.2);
  const ex = lerp(w * .5, v ? 120 : 150, leave), ey = lerp(h * (v ? .42 : .45), v ? 80 : 75, leave);
  const er = lerp(v ? 230 : 210, 36, leave);
  const ea = 1 - ease((t - T.rdv - 1.2) / 1.2);
  if (ea > .01) {
    ctx.save();
    ctx.globalAlpha *= ea;
    light(ctx, ex, ey, er * 2.2, color.cyan, .35);
    const sheen = (t * .5) % 1.6;
    ctx.beginPath();
    ctx.arc(ex, ey, er * 1.12, 0, TAU);
    const g = ctx.createLinearGradient(ex - er, ey - er, ex + er, ey + er);
    g.addColorStop(0, '#0B2033cc');
    g.addColorStop(clamp(sheen - .1), '#0B2033cc');
    g.addColorStop(clamp(sheen), '#9BE3FF55');
    g.addColorStop(clamp(sheen + .1), '#0B2033cc');
    g.addColorStop(1, '#05101Ccc');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba(color.cyan, .6);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    emblem(ctx, ex, ey, er, {ringT: ease(t / 1.6), needle: ease((t - .5) / 1.4), star: ease((t - 1.1) / 1.2),
      cardinals: true, time: t, swing: Math.sin(t * .8) * .05 * (1 - leave)});
    ctx.restore();
  }
  if (!d.bare && t > T.date - .2 && t < T.trois + .6) {
    const a = ease((t - T.date) / .5) * (1 - ease((t - T.trois) / .6));
    const y = v ? h * .62 : h * .78 - 210;
    odometer(ctx, 20, w * .5 - (v ? 150 : 210), y, {size: v ? 96 : 120, weight: 850, color: color.white, alpha: a, roll: true});
    odometer(ctx, 11, w * .5, y, {size: v ? 96 : 120, weight: 850, color: color.amber, alpha: a});
    odometer(ctx, 2026, w * .5 + (v ? 210 : 285), y, {size: v ? 96 : 120, weight: 850, color: color.white, alpha: a});
    ticks(ctx, w * .5, y + 22, v ? 620 : 820, color.cyan, clamp((t - T.date) / 1.6), t);
  }
}

export default sceneRenderer([
  shot('', 'Franc Nord|Épisode 6', 'LE MONDE EXPLIQUÉ D’ICI', opening, color.cyan, 'bottom', 'globe'),
  shot('votre rendez-vous', 'Le monde expliqué d’ici', 'BULLETIN QUOTIDIEN  /  SANS COMMANDITAIRE', opening, color.cyan, 'bottom', 'globe'),
  shot('ce qu\'ils changent', 'Ce que ça change ici', 'MONDE  →  QUÉBEC', opening, color.amber, 'bottom', 'globe'),
  shot('Aujourd\'hui, vendredi', 'Vendredi 20 novembre', 'ÉDITION DU JOUR', opening, color.gold, 'bottom', 'globe'),
  shot('trois ondes de choc', 'Trois ondes de choc', 'POLOGNE  /  TURQUIE  /  WALL STREET', opening, color.cyan, 'bottom', 'globe'),
  shot('un missile russe', 'Un missile en Pologne', 'DOSSIER 01  /  FLANC EST DE L’OTAN', opening, color.coral, 'bottom', 'globe'),
  shot('plus de cinq cents', '510+ projectiles', 'UKRAINE  /  ATTAQUE AÉRIENNE', opening, color.coral, 'bottom', 'globe'),
  shot('sommet de Shenzhen', 'Après Shenzhen', 'CHINE  /  SOMMET À TROIS', opening, color.gold, 'bottom', 'globe'),
  shot('la COP trente', 'La COP31 en prolongation', 'DOSSIER 02  /  TURQUIE', opening, color.emerald, 'bottom', 'globe'),
  shot('effacé les énergies', 'Les fossiles effacés', 'PROJET D’ACCORD  /  SELON L’ONU', opening, color.emerald, 'bottom', 'globe'),
  shot('l\'entrée en Bourse', 'Anthropic trébuche', 'DOSSIER 03  /  WALL STREET', opening, color.cyan, 'bottom', 'globe'),
  shot('alerte mondiale', 'Et chez nous ?', 'QUÉBEC  /  SAINT-LAURENT', opening, color.cyan, 'bottom', 'globe'),
]);
