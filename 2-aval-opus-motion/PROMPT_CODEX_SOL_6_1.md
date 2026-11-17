# MANIFESTE & PROMPT QUOTIDIEN — CODEX SOL 6.1 (Standard Apple Keynote / Motion Design de Calibre Mondial)

Lorsque vous choisissez **Codex** pour la réalisation vidéo, envoyez-lui cette consigne :

> **Prompt Quotidien à copier-coller pour Codex :**
> « Examine les images haute résolution de notre charte graphique dans `/Volumes/Projets/FRANC NORD/identite-visuelle/` (`logo-Officiel.jpeg`, `02-banniere-officielle.jpg`, `03-brand-board-charte.png` et `04-modele-miniature.png`), étudie attentivement nos deux références artistiques approuvées :
> 1. `/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Special-Reportage-Epicerie/scenes-custom.js` (projection perspective `F / (Z - camZ)`, vrais travellings et objets qui se transforment sur les paroles),
> 2. `/Volumes/Projets/FRANC NORD/episodes/2026-11-15-Episode-04/REPRISE-DIRECTION-ARTISTIQUE.md` ainsi que `earth.js`, `atlas.js` et `canaries-approved.js` (globe texturé 3D, géographie immédiatement reconnaissable **sans étiquettes**, approche géographique et changements d'échelle fluides).
>
> Lis ensuite `/Volumes/Projets/FRANC NORD/2-aval-opus-motion/PROMPT_OPUS_5_5.md`, `/Volumes/Projets/FRANC NORD/2-aval-opus-motion/PROMPT_CODEX_SOL_6_1.md` et `/Volumes/Projets/FRANC NORD/episodes/2026-11-17/storyboard.json` (remplace `2026-11-17` par `YYYY-MM-DD` les autres jours).
> Code les 13 scènes du jour dans `/Volumes/Projets/FRANC NORD/episodes/2026-11-17/scenes-custom.js`, synchronise avec `voix.mp3`, valide d'abord une séquence pilote complète avec sa voix en `16:9` et `9:16` (plus une passe de vérification géographique **sans aucune étiquette**), puis exporte les 2 vidéos complètes (`16x9` et `9x16`) ET découpe automatiquement les 3 Shorts/Reels verticaux (`Short-1-*.mp4`, `Short-2-*.mp4`, `Short-3-*.mp4` correspondant aux chapitres `ch1`, `ch2`, `ch3`) dans `/Volumes/Projets/FRANC NORD/episodes/2026-11-17-Episode-05/`.
>
> **EXIGENCE ABSOLUE — QUALITÉ APPLE QUI ANNONCE UN PRODUIT PHARE (DE LA 1re À LA DERNIÈRE SECONDE DES 13 SCÈNES) :**
> - **INTERDIT** de faire un « melting pot de lignes avec des noms de pays au-dessus » : les côtes, mers, détroits, fleuves et continents doivent être **immédiatement reconnaissables sur un globe texturé 3D avant même l'apparition des noms**, avec marqueurs ancrés aux vraies coordonnées pendant tout le mouvement de caméra.
> - **INTERDIT** d'utiliser un gabarit répétitif « titre à gauche + petit schéma à droite » ou de simuler 3 actes en changeant seulement le titre à 0,30 et 0,68.
> - **OBLIGATOIRE** : vraie projection perspective `F / (Z - camZ)`, volumes, lumières, vrais changements d'échelle (`0.60 → 1.50+`), orbites et plongées de caméra continus, typographies cinétiques sans aucun tremblement (zéro jitter, coordonnées flottantes) et 13 mises en scène totalement diversifiées collées seconde par seconde à la narration. »

---

## 🎯 RÈGLES OBLIGATOIRES POUR CODEX

1. **Références Artistiques Obligatoires (Ne pas régresser vers la V1 rejetée)** :
   * Avant d'écrire une seule ligne de code, inspecte [`episodes/2026-11-14-Special-Reportage-Epicerie/scenes-custom.js`](../episodes/2026-11-14-Special-Reportage-Epicerie/scenes-custom.js), [`episodes/2026-11-15-Episode-04/REPRISE-DIRECTION-ARTISTIQUE.md`](../episodes/2026-11-15-Episode-04/REPRISE-DIRECTION-ARTISTIQUE.md) (ainsi que `earth.js`, `atlas.js` et `canaries-approved.js` dans le même dossier), et applique toutes les règles de [`PROMPT_OPUS_5_5.md`](./PROMPT_OPUS_5_5.md).
2. **Géographie Réelle & Globe Texturé 3D (Tolérance Zéro)** :
   * Utiliser un **globe texturé 3D** avec masses terrestres/océaniques réalistes, côte extérieure dominante et frontières secondaires discrètes.
   * Pour le Québec et Montréal : toujours contextualiser par le Canada, les Grands Lacs, le golfe et le fleuve Saint-Laurent — **jamais** une silhouette angulaire isolée.
   * **Test obligatoire sans étiquettes** : capturer chaque plan géographique sans aucun label texte ; si le lieu n'est pas identifiable au premier coup d'œil, reprendre le cadrage et la cartographie avant de continuer.
3. **Zéro Défaut Technique ou Artistique** :
   * **ZÉRO gabarit commun** (« titre à gauche + icône à droite » banni).
   * **ZÉRO texte qui tremble** : coordonnées flottantes sous-pixel fluides, jamais de `Math.round()` sur des positions en mouvement.
   * **ZÉRO animation répétitive dans un même dossier** : les 4 scènes d'une même nouvelle doivent avoir 4 architectures visuelles et mises en scène totalement distinctes.
   * **ZÉRO texte statique** : typographie cinétique façon Apple Keynote (masques de révélation `ctx.clip()`, compteurs animés, lueurs anodisées, ressorts fluides).
   * **ZÉRO musique ou effet sonore** : uniquement la voix humaine `voix.mp3`.
4. **Validation Pilote Avant Export Long** :
   * Rendre et inspecter visuellement une séquence pilote complète avec sa voix en `16:9` et `9:16` ainsi que des planches de contrôle (début, milieu, fin de chaque scène) **avant** de lancer l'export complet des 2 vidéos longues et des 3 Shorts.
5. **Livraison sur le SSD (2 vidéos complètes + 3 Shorts/Reels) & dans le Studio Résido** :
   * Livrer directement dans `/Volumes/Projets/FRANC NORD/episodes/YYYY-MM-DD-Episode-NN/` (exemple : `episodes/2026-11-17-Episode-05/`) :
     - Les 2 vidéos complètes (`16x9` et `9x16`)
     - Les 3 vidéos verticales Shorts/Reels (`Short-1-*.mp4`, `Short-2-*.mp4`, `Short-3-*.mp4`) découpées sur les chapitres `ch1`, `ch2` et `ch3`.
     - Le fichier **`KIT-PUBLICATION-EPISODE-NN.md`** déjà préparé dans `episodes/YYYY-MM-DD/` (en mettant uniquement à jour les horodatages exacts des chapitres et repères de coupe selon la durée réelle de `voix.mp3`).
   * Préparer la mise à jour dans le Studio Résido (`https://resido.ca`) et demander l'accord avant de pousser sur GitHub Pages.
