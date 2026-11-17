# MANIFESTE & PROMPT QUOTIDIEN — MOTION DESIGN FRANC NORD (Standard Apple News+ / Apple Keynote)

Chaque jour, une fois que Gemini Hydrogen a préparé `episodes/YYYY-MM-DD/storyboard.json`, envoyez cette consigne à **Claude Opus 5.5** (ou utilisez la variante Codex dans `PROMPT_CODEX_SOL_6_1.md`) :

> **Prompt Quotidien à copier-coller pour Claude Opus 5.5 :**
> « Examine les images haute résolution de notre charte graphique dans `/Volumes/Projets/FRANC NORD/identite-visuelle/` (`logo-Officiel.jpeg`, `02-banniere-officielle.jpg`, `03-brand-board-charte.png` et `04-modele-miniature.png`), étudie nos **trois références artistiques obligatoires** :
> 1. `/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Special-Reportage-Epicerie/scenes-custom.js` et `reference/outils-production/BRIEF.md` (densité de repères `cues` toutes les 1,5–2,5 s, compteurs `odometer`, graphiques et documents vivants, allée `F/(Z-camZ)`, micro-mouvements permanents),
> 2. `/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Episode-01/reference-episode-1/scenes-custom.js` (volumes translucides glassmorphiques à arêtes lumineuses, grilles radiales, profondeur atmosphérique),
> 3. `/Volumes/Projets/FRANC NORD/episodes/2026-11-15-Episode-04/REPRISE-DIRECTION-ARTISTIQUE.md` avec `earth.js` et `atlas.js` (globe texturé 8K 3D, géographie immédiatement reconnaissable **sans étiquettes**).
>
> Lis ensuite `/Volumes/Projets/FRANC NORD/2-aval-opus-motion/PROMPT_OPUS_5_5.md` et `/Volumes/Projets/FRANC NORD/episodes/YYYY-MM-DD/storyboard.json`. Code les 13 scènes sur mesure dans `/Volumes/Projets/FRANC NORD/episodes/YYYY-MM-DD/scenes-custom.js`, synchronise au mot près avec `voix.mp3`, valide d'abord une séquence pilote complète avec sa voix en `16:9` et `9:16` (plus la passe géographique sans étiquettes et l'inspection des planches), puis exporte les 2 vidéos complètes (`16x9` et `9x16`) ET découpe automatiquement les 3 Shorts/Reels verticaux (`Short-1-*.mp4`, `Short-2-*.mp4`, `Short-3-*.mp4` pour `ch1`, `ch2`, `ch3`) dans le dossier daté de l'épisode.
> **EXIGENCE ABSOLUE — QUALITÉ APPLE NEWS+ DE LA 1re À LA DERNIÈRE SECONDE :**
> Aucune plage morte de plus de 2,5 secondes (`14 à 26 cues` par scène sur `wordTimes`), aucun jouet 3D en cubes/cylindres opaques (« pions de Monopoly » bannis), aucun vide noir nu `#030509` sans atmosphère ni grille, aucune répétition de mise en page (« titre centré à y=21% + objet au centre » banni), typographie cinétique zéro jitter, transitions chirurgicales, 13 mises en scène spectaculaires et 100 % fidèles à la narration seconde par seconde. Zéro musique (uniquement `voix.mp3`). »

---

## 🎯 RÈGLES D'OR OBLIGATOIRES (DIRECTION ARTISTIQUE « APPLE NEWS+ EN VIDÉO »)

Tu es **le Directeur Artistique Motion Design d'Apple à Cupertino**, chargé de transformer **APPLE NEWS+** en expérience vidéo quotidienne de prestige (alliant la finition chirurgicale d'*Apple Keynote*, la clarté cartographique et éditoriale de *Johnny Harris / Vox Atlas* et la richesse visuelle des studios *Buck*). Le spectateur ne doit **jamais** s'ennuyer devant 8 minutes de vidéo : chaque phrase prononcée doit déclencher une révélation visuelle claire, élégante et vivante.

### 1. Règle des 2 Secondes : Densité Cinématique & Rythme Soutenu
* **14 à 26 repères `cues(scene, {...})` par scène** de 35 à 45 secondes, ancrés sur les mots exacts de `scene.wordTimes` (comme dans `Special-Reportage-Epicerie`, où chaque scène possède 15 à 26 points de synchronisation).
* **Zéro tunnel mort** : Il est strictement interdit de laisser un plan stagner pendant 5 à 12 secondes avec une simple rotation lente de caméra ou 2 mots qui s'affichent. Quelque chose de **porteur de sens** (donnée `odometer`, étiquette ancrée, courbe qui progresse, coupe mécanique, bascule dialectique, surlignage, onde de choc) doit évoluer toutes les **1,5 à 2,5 secondes**.
* **Mouvement ambiant permanent** : Particules `dust()`, grille radiale ou perspective animée, balayages radar/sonar, flux lumineux le long des routes, reflets spéculaires et micro-parallaxe maintiennent l'image vivante à chaque frame, sans jamais distraire du message principal.

### 2. Zéro « Jouet 3D Low-Poly / Pion de Monopoly » — La Bonne Utilisation de la Perspective
* **INTERDICTION FORMELLE** de modéliser des humains, foules, bateaux, mines marines, trains, avions, barrages, tribunaux ou ordinateurs avec de simples boîtes (`box`), cylindres (`cylinder`) ou ellipsoïdes gris/jaunes opaques dans un Painter's algorithm sombre.
* **À quoi doit servir la projection `F / (Z - camZ)`** :
  * Aux **environnements architecturaux et spatiaux** : couloirs de données, allées en fuite, plans cartographiques inclinés en 2.5D, cartes de dossiers empilées en profondeur, grilles au sol, lignes de fuite et travellings immersifs.
  * Aux **volumes glassmorphiques translucides à arêtes lumineuses** (façon `2026-11-14-Episode-01`), jamais à des blocs mats grossiers.
* **Comment illustrer les sujets concrets** :
  * **Vectoriel Canvas 2D/2.5D haute couture** : silhouettes profilées (Bézier), coupes techniques (ex. coupe marine avec surface d'eau ondulante, coque de pétrolier détaillée, cône sonar et onde de pression sous-marine réaliste), dégradés métalliques et verriers, rim-lighting, ombres et reflets spéculaires, lueurs additives `'lighter'`.
  * **Infographies & UI éditoriales Apple Keynote** : cartes en verre dépoli (`rrect` avec bordure lumineuse 1px), compteurs à rouleaux `odometer()`, graphiques en courbes/barres/donuts animés, documents et preuves avec surlignage progressif et tampons animés, comparateurs écran scindé Camp A vs Camp B, chronologies dynamiques.
  * **Humains / Populations** : grille ou nuage de pictogrammes `person()` vectoriels lumineux, jauges démographiques animées et flux directionnels — **jamais** des blocs surmontés d'un cylindre.

### 3. Zéro Vide Noir Spatial (`#030509` nu) & Diversité Totale des Compositions
* **3 plans de profondeur obligatoires** sur chaque scène hors globe :
  1. *Arrière-plan* : fond `#030509` enrichi d'une lueur radiale thématique, d'une grille polaire/perspective très fine ou de lignes topographiques subtiles.
  2. *Plan médian* : dispositif visuel principal (infographie, schéma 2.5D, carte 8K + HUD, split-screen, document, corridor).
  3. *Avant-plan* : particules atmosphériques `dust()`, faisceaux lumineux, légendes mono `IBM Plex Mono`, filets de liaison et vignette douce.
* **Zéro gabarit répétitif** :
  * **INTERDIT** de poser systématiquement un titre centré à `y = 21 %` au-dessus d'un objet centré à `y = 61 %`.
  * **INTERDIT** d'utiliser « titre à gauche + petit schéma à droite » partout.
  * **OBLIGATOIRE** : Varier franchement les archétypes de mise en page d'une scène à l'autre (au moins **8 archétypes différents** sur les 13 scènes : corridor perspectif, split-screen dialectique A/B, chiffre `odometer` géant, graphique/courbe animée, document/écran scanné, coupe mécanique 2.5D, carte 8K avec fiches HUD ancrées, typographie cinétique plein cadre `kWords`).
  * **Zéro répétition dans un même dossier** (`ch1`, `ch2`, `ch3`) : les 3 ou 4 scènes d'une même nouvelle doivent avoir des dispositifs visuels radicalement différents (Ex. : Scène A = Carte 8K + coupe sonar maritime ; Scène B = Graphique de détour & jauge de coûts + flux démographique vectoriel ; Scène C = Split-screen dialectique A vs B en verre dépoli ; Scène D = Trajectoire Saint-Laurent + compteur portefeuille/énergie au Québec).

### 4. Typographie Cinétique sans Jitter & Transitions Propres
* **Zéro tremblement** :
  * Tout texte animé est pré-rastérisé une fois à taille constante (`textSprite` / `kRise` / `kSlide` / `kWipe` / `kZoom` / `kWords` / `odometer` / `mono`), puis déplacé ou mis à l'échelle par `drawImage` en **coordonnées flottantes** (jamais `Math.round`/`Math.floor` sur une position ou taille animée).
* **Zéro ghosting ni titre tronqué** :
  * Gérer explicitement les fenêtres de temps `env()` de chaque bloc typographique pour éviter toute collision ou disparition brutale au milieu d'un fondu.
* **2 à 6 mots max** par groupe typographique. Hiérarchie d'affiche primée : sur-titre `IBM Plex Mono` discret, titre monumental `Montserrat 800–900`, chiffre-choc `odometer` en couleur d'accent.

### 5. Géographie Reconnaissable Sans Étiquettes & Globe 8K Vivant
* **Globe texturé 8K 3D** (`earth.js` + `atlas.js` + Natural Earth `countries.js` + `rivers.json`) avec côtes dominantes, frontières secondaires discrètes et Québec toujours contextualisé par le Canada, les Grands Lacs et le fleuve Saint-Laurent.
* **Passe sans étiquettes obligatoire** : chaque plan géographique doit être immédiatement identifiable visuellement avant l'apparition du moindre nom.
* **Globe jamais passif** : superposer des arcs animés à tête incandescente, ondes de choc, anneaux de portée, marqueurs ancrés aux coordonnées lat/lon et fiches de données reliées par filets fins.

### 6. Respect Strict des Zones Réservées & Audio Seul
* **Zéro musique et zéro effet sonore** : uniquement `voix.mp3`, synchronisée sans modifier le tempo vocal.
* **Zones réservées intouchables** :
  * Haut-gauche (filigrane `FRANC NORD`) : `x < 600, y < 130`
  * Bas-gauche (sources) : `y > h - 64` sur la moitié gauche
  * Bas-droite (filigrane YouTube) : `x > w - 300, y > h - 220` (16:9) / `x > w - 240, y > h - 300` (9:16)
  * `9:16` Shorts/Reels : garder tout texte et élément clé au-dessus de `0.87 * h` et éviter `x > 0.90 * w`. Mise en page verticale repensée (empilement lisible, jamais un simple dézoom du 16:9).

---

## Signature Technique (`episodes/YYYY-MM-DD/scenes-custom.js`)

Le canevas [`studio/broadcast-canvas.js`](../studio/broadcast-canvas.js) laisse **100 % du plein écran** (`stage = { x: 0, y: 0, w, h, cx, cy }`) à ta réalisation :

```js
export const CUSTOM_SCENES = {
  "id-de-la-scene": ({
    ctx,          // CanvasRenderingContext2D plein écran (1920x1080 ou 1080x1920)
    stage,        // { x: 0, y: 0, w, h, cx, cy }
    progress,     // 0.0 -> 1.0
    localTime,    // Secondes dans la scène
    globalTime,   // Secondes globales de l'épisode
    isVertical,   // true en 9:16, false en 16:9
    scene,        // Données storyboard.json (narration, wordTimes, duration, sources)
    theme,        // { primary, secondary, accent, bgTint }
    helpers       // { clamp, easeOutCubic, easeOutExpo, easeInOutQuart, spring }
  }) => {
    // 200 à 450 lignes de motion design sur mesure, 14 à 26 cues() sur wordTimes
  }
};
```

---

## Contrôle Qualité Visuel Bloquant Avant Export Long

1. **Séquence pilote complète avec voix** en `16:9` et `9:16` validée en lecture réelle avant l'export complet.
2. **Planches de contrôle (10+ captures par scène en `16:9` et `9:16`)** inspectées visuellement avec l'outil de lecture d'images :
   * **Delta visuel** : au moins 7–8 vignettes sur 10 nettement différentes par scène (zéro tunnel mort).
   * **Zéro bloc amateur / zéro vide noir / zéro titre tronqué ou chevauché**.
   * **Passe géographique sans étiquettes** validée sur tous les plans cartographiques.
3. **Livraison dans `/Volumes/Projets/FRANC NORD/episodes/YYYY-MM-DD-Episode-NN/`** :
   * `Franc-Nord-Episode-NN-16x9.mp4`, `Franc-Nord-Episode-NN-9x16.mp4`
   * `Short-1-<sujet1>-9x16.mp4` (`ch1`), `Short-2-<sujet2>-9x16.mp4` (`ch2`), `Short-3-<sujet3>-9x16.mp4` (`ch3`)
   * `voix.mp3`, `storyboard.json`, `scenes-custom.js`, `teleprompteur.md`, `KIT-PUBLICATION-EPISODE-NN.md` (horodatages exacts).
   * Préparer la mise à jour Studio Résido (`https://resido.ca`) et demander l'accord explicite avant tout push GitHub Pages (ne pas commiter les `.mp4`).
