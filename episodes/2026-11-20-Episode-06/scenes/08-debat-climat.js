import {cues} from '../moteur.js';
import {color, clamp, sceneRenderer, shot, colorWash, floor, light} from '../mise-en-scene.js';
import {split, elastic} from '../ecran.js';
import {heatHaze} from '../ciel.js';
import {helix} from '../graphes.js';

const times = scene => cues(scene, {
  frein: 'grand coup de frein', fracture: 'fracture profonde', cote: 'D\'un côté', scientifiques: 'les scientifiques',
  capitulation: 'capitulation dangereuse', sortie: 'effacer la sortie', dereg: 'déréglementer les chantiers',
  secheresses: 'des sécheresses', dix: 'dix fois plus cher', autre: 'De l\'autre côté', pragmatiques: 'gouvernements pragmatiques',
  interdictions: 'imposer des interdictions', familles: 'étouffe les familles', factures: 'factures de chauffage', usines: 'délocalisation',
});

function thermal(d) {
  const {ctx, w, h, t} = d;
  floor(d, color.emerald);
  light(ctx, w * .2, h * .3, w * .5, color.emerald, .18);
  light(ctx, w * .8, h * .3, w * .5, color.amber, .18);
  heatHaze(d, .35 + .15 * Math.sin(t * .4));
}

function debate(d) {
  const {t, scene} = d;
  const T = times(scene);
  const ratio = elastic(t, [[0, .5], [T.cote, .7], [T.autre, .3], [T.usines + 1.2, .5]]);
  split(d, {
    ratio, bg: thermal, enter: clamp((t - T.frein + .4) / 1.2),
    A: {tint: color.emerald, camp: 'CAMP A', title: 'Urgence climatique', titleT: (t - T.scientifiques) / .9,
      shown: clamp((t - T.sortie) / .7) + clamp((t - T.secheresses) / .7) + clamp((t - T.dix) / .7),
      items: [['drop', 'Sortie des fossiles effacée', 'L’ONU DÉNONCE UNE CAPITULATION'],
        ['thermo', 'Sécheresses, chocs alimentaires', 'LA PLANÈTE EN SURCHAUFFE'],
        ['chart', '10 fois plus cher demain', 'LE COÛT DE L’INACTION']]},
    B: {tint: color.amber, camp: 'CAMP B', title: 'Factures & compétitivité', titleT: (t - T.pragmatiques) / .9,
      shown: clamp((t - T.interdictions) / .7) + clamp((t - T.factures) / .7) + clamp((t - T.usines) / .7),
      items: [['scale', 'Pas d’interdiction sans solution', 'UNE RECHANGE ABORDABLE'],
        ['bolt', 'Factures de chauffage', 'LES FAMILLES ÉTOUFFENT'],
        ['factory', 'Usines délocalisées', 'EMPLOIS MANUFACTURIERS']]},
  });
  colorWash(d.ctx, d.w, d.h, .7);
}

export default sceneRenderer([
  shot('', 'Un coup de frein', 'COP31  /  WASHINGTON', debate, color.emerald, 'bottom', 'split'),
  shot('fracture profonde', 'Une fracture profonde', 'LA MARCHE À SUIVRE', debate, color.gold, 'bottom', 'split'),
  shot('D\'un côté', 'Camp A · Climat', 'SCIENTIFIQUES  /  ONU  /  DÉFENSEURS DU CLIMAT', debate, color.emerald, 'bottom', 'split'),
  shot('effacer la sortie', 'Une capitulation', 'SELON LE CAMP A', debate, color.emerald, 'bottom', 'split'),
  shot('dix fois plus cher', '10 fois plus cher', 'SÉCHERESSES ET CHOCS ALIMENTAIRES', debate, color.emerald, 'bottom', 'split'),
  shot('De l\'autre côté', 'Camp B · Factures', 'GOUVERNEMENTS  /  INDUSTRIE', debate, color.amber, 'bottom', 'split'),
  shot('factures de chauffage', 'Les factures grimpent', 'SELON LE CAMP B', debate, color.amber, 'bottom', 'split'),
  shot('délocalisation', 'Nos usines', 'RISQUE DE DÉLOCALISATION', debate, color.gold, 'bottom', 'split'),
]);
void helix;
