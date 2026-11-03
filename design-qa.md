# Vérification de Jardin de minuit

Date : 3 novembre 2026. Direction finale conservée par Gilbert : Jardin de
minuit, après sa décision de garder le visuel en place pour le moment.

## Références et captures

- Maquette choisie : `docs/qa/jardin-de-minuit/reference.png`, 1448 × 1086.
- Interface réelle : `docs/qa/jardin-de-minuit/paysage-final.png`, 1024 × 768.
- Comparaison normalisée : `docs/qa/jardin-de-minuit/comparaison.png`.
- Détails horloge et météo : `docs/qa/jardin-de-minuit/details.png`.
- Portrait : `docs/qa/jardin-de-minuit/portrait-final.png`, 768 × 1024.
- Cabinet : `docs/qa/jardin-de-minuit/cabinet.png`.
- Veille : `docs/qa/jardin-de-minuit/veille.png`.

Captures du navigateur intégré, aux dimensions CSS de l'iPad, densité de
capture 1. La référence a été réduite à 1024 × 768, sans recadrage, pour la
comparaison commune. État principal simulé avec `?t=21:08`, même date que la
référence. La météo et les titres proviennent du réseau, pas de la maquette;
les températures, heures de prévision et titres diffèrent donc légitimement.
La lune est décorative et n'affirme aucune phase astronomique.

## Historique des corrections

- [P2 corrigé] Le premier nuage reprenait le pictogramme simple de l'ancien
  hub. Il a été remplacé par une gravure transparente produite pour la
  direction retenue. L'arabesque de bas d'écran a également été ajoutée.
- [P2 corrigé] Le feuillage masquait une partie importante de la lune. Les
  plans de composition ont été ajustés pour garder son disque lisible.
- [P2 corrigé] La découpe haute du décor en portrait produisait un bord
  horizontal visible. Le décor commence maintenant au bord supérieur.
- [P1 corrigé] Le sélecteur historique `.actus-ouvert .actus` ouvrait aussi
  les autres panneaux partageant la classe. Il cible maintenant `#actus`.
  La nouvelle capture d'accessibilité montre seulement le panneau demandé.
- [P2 corrigé] Les pastilles du minuteur et du son restaient exposées dans
  l'arbre d'accessibilité derrière un panneau. Elles sont masquées pendant
  l'ouverture des panneaux; l'arrêt rapide de la pluie a été retesté depuis
  l'accueil.
- [P2 corrigé] Le blocage tactile global empêchait le défilement des outils.
  Il épargne maintenant les panneaux et leurs champs de saisie.

La comparaison finale et les captures rapprochées ont été ouvertes après
ces corrections. Aucun problème P0/P1/P2 restant n'a été identifié.

## Surfaces visuelles vérifiées

- Typographie : Instrument Serif pour l'horloge et les titres, Geist pour les
  textes et commandes, polices WOFF locales. Pas de débordement sur les
  accès persistants aux deux formats. L'horloge conserve la hiérarchie du
  modèle, sans remplacer le texte dynamique par une image.
- Espacement : composition 4:3, horloge à gauche, illustration à droite,
  météo et prévisions sous l'heure, quatre accès au bas du cadre. La ligne
  d'actualité réelle occupe l'espace précédant ces accès.
- Couleurs : encre, parchemin, cuivre et lilas. Deux palettes alternatives
  sont proposées dans les outils. Les textes secondaires et commandes ont
  été inspectés dans les captures aux dimensions réelles.
- Images : cinq PNG transparents locaux, décor séparé en trois plans animés,
  nuage gravé et arabesque. Aucun fond opaque ni rectangle résiduel observé.
  Icônes de commande SVG propres à Résido, réalisées sur mesure conformément
  à la demande explicite de Gilbert; pas de bibliothèque distante.
- Contenu : heure et date québécoises, données météo du réseau, vrais titres
  d'actualité, états vides et messages d'enregistrement. Aucun faux montant
  ni chiffre financier ajouté pour la démonstration.

## Interactions vérifiées dans le navigateur

- Ouverture des neuf outils et retour au cabinet; fermeture et retour au hub.
- Minuteur d'une minute : décompte, pause, conservation après rechargement,
  reprise de l'état, arrivée à zéro, suppression du minuteur terminé.
- Session de concentration de 25 minutes : démarrage et arrêt.
- Carnet : saisie, confirmation d'enregistrement et récupération après
  rechargement. La note d'essai a ensuite été vidée.
- Rituels : cocher un élément, enregistrement, puis tout décocher.
- Date personnelle : le 10 novembre donne « Dans 7 jours » le 3 novembre;
  enregistrement puis oubli de la date d'essai.
- Respiration : démarrage, libellé et animation, puis arrêt.
- Pluie : démarrage sur un clic, état actif, arrêt dans le panneau et arrêt
  depuis la pastille de l'accueil. L'audibilité physique n'est pas attestée.
- Ambiance : palette prune, retour encre, pause/reprise des dessins,
  assombrissement à 25 %, puis retour à 0 %.
- Veille à 23 h 10 : horloge et résumé seuls, réveil au toucher. Option
  « garder le jardin visible la nuit » conservée après rechargement; retour
  au réglage automatique après l'essai.
- Actualité : ouverture, données réelles, fermeture, absence de panneaux
  fantômes. Acquit : ouverture du formulaire de jumelage existant. Aucun
  jeton ni compte réel utilisé dans ce navigateur de vérification.
- Console finale : aucun avertissement ni erreur du JavaScript observé.
- `node verifier.js` : ES5 valide et contrôle Safari 10 réussi après chaque
  modification de `index.html`; `git diff --check` réussi.

## Limites et finitions ultérieures

- Le navigateur de vérification est moderne. Le contrôle statique ES5 ne
  remplace pas un essai sur l'iPad 4 physique, notamment pour la fluidité,
  le clavier, le défilement tactile et le son Web Audio.
- Les illustrations sont de nouvelles pièces assorties à la maquette; leurs
  silhouettes et la taille de la lune ne sont pas une reproduction pixel
  par pixel. L'identité et la composition choisies sont conservées.
- Le jumelage et l'envoi réel des chiffres Acquit doivent être validés sur
  les appareils avec les permissions serveur réglées par Lovable.
- Le site public n'est pas publié par ce travail. Gilbert effectue le push.

final result: passed
