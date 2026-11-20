import {cues} from '../moteur.js';
import {color, clamp, sceneRenderer, shot, colorWash} from '../mise-en-scene.js';
import {split, elastic} from '../ecran.js';
import {nightSky, beam} from '../ciel.js';

const times = scene => cues(scene, {
  deux: 'deux stratégies', cote: 'D\'un côté', fermete: 'partisans de la fermeté', missile: 'missile tombé',
  pluie: 'pluie de cinq cents', intimidation: 'récompenserait l\'intimidation', violations: 'nouvelles violations',
  pekin: 'Pékin dicter', autre: 'De l\'autre côté', realisme: 'réalisme diplomatique', hiver: 'hiver énergétique',
  canal: 'canal de discussion', engrenage: 'engrenage militaire', europe: 'en Europe',
});

function sky(d) {
  const {ctx, w, h, t} = d;
  nightSky(d, {horizon: .9, snow: .6});
  for (let i = 0; i < 5; i++) {
    const x = w * (.1 + i * .2);
    beam(ctx, x, h, Math.sin(t * (.25 + i * .04) + i * 1.3) * .32, h * 1.2, {alpha: .2, spread: .025});
  }
}

function debate(d) {
  const {t, scene} = d;
  const T = times(scene);
  const ratio = elastic(t, [[0, .5], [T.cote, .7], [T.autre, .3], [T.engrenage + .4, .5]]);
  split(d, {
    ratio, bg: sky, enter: clamp((t - T.deux + .6) / 1.2),
    A: {tint: color.cyan, camp: 'CAMP A', title: 'Fermeté & bouclier OTAN', titleT: (t - T.fermete) / .9,
      shown: clamp((t - T.missile) / .7) + clamp((t - T.violations) / .7) + clamp((t - T.pekin) / .7),
      items: [['missile', 'Missile en Pologne : un test', 'NE PAS RÉCOMPENSER L’INTIMIDATION'],
        ['shield', 'Ne pas céder', 'PROTÉGER L’ESPACE AÉRIEN DE L’OTAN'],
        ['globe', 'Contrer Pékin', 'QUI DICTE L’ORDRE MONDIAL ?']]},
    B: {tint: color.amber, camp: 'CAMP B', title: 'Pourparlers & désescalade', titleT: (t - T.realisme) / .9,
      shown: clamp((t - T.hiver) / .7) + clamp((t - T.canal) / .7) + clamp((t - T.engrenage) / .7),
      items: [['bolt', 'Un hiver intenable', 'RÉSEAU ÉLECTRIQUE UKRAINIEN'],
        ['chat', 'Un canal direct', 'BERLIN  /  WASHINGTON  /  MOSCOU'],
        ['scale', 'Éviter l’engrenage', 'PAS DE CHOC OTAN – RUSSIE']]},
  });
  colorWash(d.ctx, d.w, d.h, .7);
}

export default sceneRenderer([
  shot('', 'Deux stratégies', 'PRESSION MILITAIRE ET DIPLOMATIQUE', debate, color.cyan, 'bottom', 'split'),
  shot('deux stratégies', 'Deux stratégies s’affrontent', 'CAPITALES OCCIDENTALES', debate, color.gold, 'bottom', 'split'),
  shot('D\'un côté', 'Camp A · Fermeté', 'LES PARTISANS DE LA FERMETÉ', debate, color.cyan, 'bottom', 'split'),
  shot('récompenserait l\'intimidation', 'Ne pas récompenser', 'NÉGOCIER = RÉCOMPENSER L’INTIMIDATION ?', debate, color.cyan, 'bottom', 'split'),
  shot('Pékin dicter', 'L’ordre mondial en jeu', 'SELON LE CAMP A', debate, color.cyan, 'bottom', 'split'),
  shot('De l\'autre côté', 'Camp B · Pourparlers', 'RÉALISME DIPLOMATIQUE', debate, color.amber, 'bottom', 'split'),
  shot('hiver énergétique', 'Un hiver intenable', 'UKRAINE  /  RÉSEAU ÉLECTRIQUE', debate, color.amber, 'bottom', 'split'),
  shot('canal de discussion', 'Un canal direct', 'DISCUTER AVEC MOSCOU', debate, color.amber, 'bottom', 'split'),
  shot('engrenage militaire', 'Éviter l’engrenage', 'L’ÉQUILIBRE DES DEUX CAMPS', debate, color.gold, 'bottom', 'split'),
]);
