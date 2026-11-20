import {cues} from '../moteur.js';
import {color, clamp, sceneRenderer, shot, colorWash, floor, light} from '../mise-en-scene.js';
import {split, elastic} from '../ecran.js';
import {helix} from '../graphes.js';

const times = scene => cues(scene, {
  signaux: 'signaux d\'alarme', visions: 'deux visions', cote: 'D\'un côté', experts: 'les experts de l\'ONU',
  frein: 'coup de frein', chantage: 'chantage en laboratoire', ados: 'piègent des adolescents', pannes: 'les pannes paralysent',
  coupe: 'coupe-circuits légaux', autre: 'De l\'autre côté', investisseurs: 'les investisseurs', neuf: 'baisse de neuf',
  respiration: 'respiration normale', adn: 'sur l\'ADN', percees: 'percées médicales',
});

function lab(d) {
  const {ctx, w, h, t, vertical: v} = d;
  floor(d, color.violet);
  light(ctx, w * .25, h * .4, w * .45, color.coral, .14);
  light(ctx, w * .75, h * .4, w * .45, color.emerald, .14);
  helix(ctx, v ? w * .9 : w * .965, h * .45, h * .8, t, {alpha: .35});
  helix(ctx, v ? w * .1 : w * .035, h * .45, h * .8, -t, {tint: color.coral, alpha: .35});
}

function debate(d) {
  const {t, scene} = d;
  const T = times(scene);
  const ratio = elastic(t, [[0, .5], [T.cote, .7], [T.autre, .3], [T.percees + .6, .5]]);
  split(d, {
    ratio, bg: lab, prism: true, enter: clamp((t - T.visions + .5) / 1.2),
    A: {tint: color.coral, camp: 'CAMP A', title: 'Coupe-circuits & protection', titleT: (t - T.experts) / .9,
      shown: clamp((t - T.chantage) / .7) + clamp((t - T.ados) / .7) + clamp((t - T.coupe) / .7),
      items: [['lock', 'Garde-fous contre le chantage', 'MODÈLES TESTÉS EN LABORATOIRE'],
        ['child', 'Protéger les adolescents', 'RÉSEAUX CRIMINELS  /  ONU'],
        ['cyber', 'Coupe-circuits légaux', 'AVANT TOUTE MISE EN MARCHÉ']]},
    B: {tint: color.emerald, camp: 'CAMP B', title: 'Innovation & percées', titleT: (t - T.investisseurs) / .9,
      shown: clamp((t - T.neuf) / .7) + clamp((t - T.adn) / .7) + clamp((t - T.percees) / .7),
      items: [['chart', '−9 % : une respiration', 'APRÈS UNE ENTRÉE EN BOURSE RECORD'],
        ['dna', 'Travaux sur l’ADN', 'ET SUR L’ÉTHIQUE'],
        ['brain', 'Percées médicales', 'SELON LES PIONNIERS']]},
  });
  colorWash(d.ctx, d.w, d.h, .7);
}

export default sceneRenderer([
  shot('', 'Signaux d’alarme', 'L’AVENIR DE L’IA', debate, color.violet, 'bottom', 'split'),
  shot('deux visions', 'Deux visions s’opposent', 'INTELLIGENCE ARTIFICIELLE', debate, color.gold, 'bottom', 'split'),
  shot('D\'un côté', 'Camp A · Coup de frein', 'ONU  /  PROTECTION DE L’ENFANCE  /  RÉGULATEURS', debate, color.coral, 'bottom', 'split'),
  shot('chantage en laboratoire', 'Chantage en laboratoire', 'SELON LE CAMP A', debate, color.coral, 'bottom', 'split'),
  shot('coupe-circuits légaux', 'Des coupe-circuits', 'AVANT LA MISE EN MARCHÉ', debate, color.coral, 'bottom', 'split'),
  shot('De l\'autre côté', 'Camp B · Innovation', 'INVESTISSEURS  /  PIONNIERS', debate, color.emerald, 'bottom', 'split'),
  shot('respiration normale', 'Une respiration normale', 'SELON LE CAMP B', debate, color.emerald, 'bottom', 'split'),
  shot('percées médicales', 'Des percées médicales', 'ADN  /  ÉTHIQUE', debate, color.gold, 'bottom', 'split'),
]);
