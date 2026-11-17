# MANIFESTE & PROMPT QUOTIDIEN — CODEX SOL 6.1 (Standard Apple News+ / Apple Keynote / Vox Atlas)

Lorsque vous choisissez **Codex** pour la réalisation vidéo, envoyez-lui cette consigne :

> **Prompt Quotidien à copier-coller pour Codex :**
> « Examine les images haute résolution de notre charte graphique dans `/Volumes/Projets/FRANC NORD/identite-visuelle/` (`logo-Officiel.jpeg`, `02-banniere-officielle.jpg`, `03-brand-board-charte.png` et `04-modele-miniature.png`), puis étudie nos **trois références artistiques obligatoires** :
> 1. `/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Special-Reportage-Epicerie/scenes-custom.js` et son guide `reference/outils-production/BRIEF.md` (densité de repères `cues` toutes les 1,5–2,5 s, compteurs `odometer`, cartes verre dépoli, graphiques vivants, allée en perspective `F/(Z-camZ)`, documents/sceaux, micro-mouvements permanents),
> 2. `/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Episode-01/reference-episode-1/scenes-custom.js` (esthétique glassmorphique translucide à arêtes lumineuses, grilles radiales et perspectives atmosphériques, variété de mises en page),
> 3. `/Volumes/Projets/FRANC NORD/episodes/2026-11-15-Episode-04/REPRISE-DIRECTION-ARTISTIQUE.md` ainsi que `earth.js`, `atlas.js` et `canaries-approved.js` (globe texturé 8K 3D, géographie reconnaissable **sans étiquettes**, marqueurs ancrés aux vraies coordonnées).
>
> Lis ensuite `/Volumes/Projets/FRANC NORD/2-aval-opus-motion/PROMPT_OPUS_5_5.md`, `/Volumes/Projets/FRANC NORD/2-aval-opus-motion/PROMPT_CODEX_SOL_6_1.md` et `/Volumes/Projets/FRANC NORD/episodes/YYYY-MM-DD/storyboard.json`.
> Code les **13 scènes sur mesure** (~200–450 lignes artisanales par scène, zéro code compacté) dans `/Volumes/Projets/FRANC NORD/episodes/YYYY-MM-DD/scenes-custom.js`, synchronise au mot près avec `voix.mp3` (`14 à 26 cues` par scène), valide d'abord une séquence pilote complète avec sa voix en `16:9` et `9:16` + la passe géographique sans étiquettes + un audit visuel anti-temps-morts des planches de contrôle, puis exporte les 2 vidéos complètes (`16x9` et `9x16`) ET découpe les 3 Shorts/Reels verticaux (`Short-1-*.mp4`, `Short-2-*.mp4`, `Short-3-*.mp4` pour `ch1`, `ch2`, `ch3`) dans `/Volumes/Projets/FRANC NORD/episodes/YYYY-MM-DD-Episode-NN/`.
>
> **EXIGENCE ABSOLUE — ZERO VIDÉO MORTE, ZERO JOUET 3D EN BLOCS, QUALITÉ APPLE NEWS+ :**
> - **RÈGLE DES 2 SECONDES (DENSITÉ CINÉMATIQUE)** : Il est STRICTEMENT INTERDIT de laisser plus de 2,5 secondes sans transformation visuelle notable (nouveau chiffre `odometer`, révélation de donnée, carte HUD, courbe animée, onde de choc, bascule de plan, surbrillance synchronisée sur la voix). Chaque scène de 35–45 s doit contenir **14 à 26 repères `cues`** calés sur `wordTimes`, plus une animation ambiante permanente (`dust`, reflets, balayage radar, particules sur trajectoires).
> - **INTERDICTION DES « JOUETS 3D LOW-POLY / PIONS DE MONOPOLY »** : Ne sculpte JAMAIS d'humains, foules, navires, mines, trains, avions, barrages, serveurs ou bâtiments avec de simples `box()` / `cylinder()` / `ellipsoid()` gris/jaunes opaques flottant dans un vide noir. Utilise la projection `F/(Z-camZ)` pour l'architecture spatiale, les corridors, les plans inclinés 2.5D et la profondeur, combinée à du **vectoriel Canvas haute couture** (courbes de Bézier détaillées, dégradés métalliques et verriers, rim-lighting, lueurs `'lighter'`, reflets sur l'eau, silhouettes propres, graphiques animés, fiches éditoriales en verre dépoli).
> - **INTERDICTION DU VIDE NOIR (`#030509` nu) & DU GABARIT UNIQUE** : Chaque cadre hors globe doit avoir 3 plans de profondeur (grille/lueur atmosphérique + sujet/infographie riche + particules/HUD). Varie les mises en scène entre les 13 scènes (jamais 2 fois de suite « titre centré en haut à y=21% + objet au centre »).
> - **GÉOGRAPHIE VIVANTE & RECONNAISSABLE SANS ÉTIQUETTES** : Le globe 8K est obligatoire pour situer, mais ne le laisse jamais immobile ou nu derrière un titre : habille-le d'arcs énergétiques, zones d'impact, cercles radar, filets de rappel et fiches télémétriques ancrées, puis plonge vers une vraie scène éditoriale/infographique dès l'explication.
> - **ZÉRO JITTER, ZÉRO GHOSTING DE TITRE, ZÉRO MUSIQUE** : Surfaces/sprites pré-rastérisés en coordonnées flottantes, transitions de titres propres sans chevauchement ni découpe à moitié, piste audio `voix.mp3` uniquement. »

---

## 🎯 RÈGLES NON-NÉGOCIABLES POUR CODEX (DIAGNOSTIC ANTI-RÉGRESSION)

L'épisode 05 V1 a été rejeté parce qu'il combinait 5 défauts majeurs. Il est **strictement interdit** de reproduire l'un de ces travers :

1. **Bannir les primitives 3D amateurs (`box` + `cylinder` + `ellipsoid` opaques)** :
   * Une foule ne se dessine **jamais** comme des cylindres posés sur des rectangles (« pions de Monopoly ») : utilise des grilles de pictogrammes vectoriels `person()` éclairés, des courbes de flux migratoire animées, des compteurs `odometer` monumentaux (`340 000+`) et des coupes cartographiques.
   * Un pétrolier, une mine marine, un train, un barrage hydroélectrique, un avion ou un tribunal ne sont **jamais** des blocs gris/jaunes dans un Painter's algorithm sombre : construis des illustrations vectorielles multicouches en perspective 2.5D (coque profilée avec sillage, reflets sur mer animée, coupe sonar sous-marine avec onde de pression réelle, lignes électriques irradiantes, documents officiels et sceaux de justice en verre dépoli).
2. **Bannir les 10 secondes d'immobilisme (Règle des 2 secondes)** :
   * 4 à 6 `cues` par scène = vidéo ennuyante et morte.
   * Minimum **14 à 26 `cues`** par scène, reliés à des transformations visuelles concrètes (pas seulement changer 2 mots de titre en haut de l'écran).
   * Toute statistique chiffrée citée par la voix doit déclencher un **`odometer()`**, une **jauge**, un **graphique animé** ou une **fiche de donnée**.
3. **Bannir le gabarit « titre centré à y = 21 % + bidule au centre sur fond noir »** :
   * Utilise au moins **8 archétypes de composition distincts** sur les 13 scènes :
     1. *Split-screen dialectique* (Camp A cyan à gauche vs Camp B ambre à droite, séparateur lumineux, arguments et poids visuels qui basculent).
     2. *Corridor / Allée en vraie perspective `F/(Z-camZ)`* (racks IA, lignes logistiques, étiquettes/données qui défilent en profondeur comme dans `Special-Reportage-Epicerie`).
     3. *Statistique monumentale + Contexte* (chiffre géant `odometer` occupant 35–45 % du cadre avec décomposition visuelle dynamique).
     4. *Graphique / Courbe / Histogramme vivant* (axes gradués IBM Plex Mono, courbes qui se tracent avec tête incandescente, barres à lueur interne, seuils d'alerte).
     5. *Inspection de preuve / Document / Écran* (mockup épuré, document officiel avec surlignage progressif, tampon animé, scan biométrique ou facture détaillée).
     6. *Carte 8K tactique avec fiches HUD ancrées* (arcs maritimes/aériens, zones d'exclusion pulsantes, fiches latérales reliées aux coordonnées lat/lon par filets fins).
     7. *Coupe mécanique / Schéma cinématique 2.5D* (coupe d'un détroit miné avec onde sous-marine, coupe d'un barrage/réseau électrique avec flux d'énergie, infrastructure ferroviaire/portuaire détaillée).
     8. *Typographie cinétique plein cadre* (`kWords` synchronisé mot à mot, masques `ctx.clip()`, soulignements lumineux, bascule d'échelle dramatique).
4. **Bannir le « Code Golfing » (250 lignes pour 8 minutes)** :
   * Chaque scène doit être une création dédiée de **~200 à 450 lignes lisibles** (ou fichiers modulaires par scène assemblés dans `scenes-custom.js`), exactement comme `episodes/2026-11-14-Special-Reportage-Epicerie/reference/outils-production/scenes/`.
   * Zéro chevauchement ou coupure brutale de titre (`flushTitles` ne doit jamais effacer une phrase en plein fondu).

---

## 🔍 AUDIT VISUEL OBLIGATOIRE AVANT EXPORT LONG (GATES DE REJET)

Avant de lancer l'export des vidéos de 8 minutes, tu DOIS inspecter chaque planche `*_16x9_PLANCHE.jpg` et `*_9x16_PLANCHE.jpg` (10+ captures par scène) et **rejeter + corriger immédiatement** toute scène qui échoue à un seul de ces 5 tests :

1. **Test de Delta Visuel** : Au moins **7 à 8 vignettes sur 10** par planche doivent présenter une avancée visuelle franche (nouvelle donnée, graphique, changement de cadrage/d'échelle, transformation d'objet). Si 3 vignettes consécutives se ressemblent, la scène est trop lente : ajoute des beats `cues` et des infographies.
2. **Test Anti-Pions / Anti-Blocs** : Aucun objet ne doit ressembler à un assemblage enfantin de cubes/cylindres gris ou jaunes.
3. **Test Anti-Vide Noir** : Aucune image ne doit montrer un petit objet perdu au milieu d'un `#030509` vide sans grille, atmosphère, particules ni structuration éditoriale.
4. **Test Typographique & Marges** : Zéro tremblement (coordonnées flottantes + sprites mis en cache), zéro titre tronqué à mi-mot, zéro superposition, respect des zones réservées (`x < 600, y < 130` en haut à gauche ; bas-gauche sources ; bas-droite filigrane YouTube ; bas 13 % et bord droit en `9:16` pour l'UI Shorts/Reels).
5. **Test Géographique Sans Étiquettes** : Sur la passe sans labels, chaque lieu clé (détroits, fleuves, archipels, Québec contextualisé par les Grands Lacs et le Saint-Laurent) est reconnaissable au premier coup d'œil.

---

## 📦 LIVRAISON SUR LE SSD & DANS LE STUDIO RÉSIDO

1. **Livraison directe dans `/Volumes/Projets/FRANC NORD/episodes/YYYY-MM-DD-Episode-NN/`** (sans sous-dossier `livraisons/`) :
   * `Franc-Nord-Episode-NN-16x9.mp4` (vidéo complète 16:9, 1080p, voix seule `voix.mp3`, zéro musique)
   * `Franc-Nord-Episode-NN-9x16.mp4` (vidéo complète 9:16, 1080×1920, mise en page verticale dédiée — jamais un simple recadrage)
   * `Short-1-<sujet1>-9x16.mp4` (`ch1`), `Short-2-<sujet2>-9x16.mp4` (`ch2`), `Short-3-<sujet3>-9x16.mp4` (`ch3`) découpés sur les bornes exactes des chapitres depuis le master `9:16`
   * `voix.mp3`, `storyboard.json`, `scenes-custom.js`, `teleprompteur.md`, `KIT-PUBLICATION-EPISODE-NN.md` (horodatages exacts mis à jour selon `voix.mp3`).
2. **Studio Résido (`https://resido.ca`)** :
   * Préparer la mise à jour dans le Studio et demander l'accord explicite de Gilbert avant de pousser sur GitHub Pages. Ne pas commiter les `.mp4` dans Git.
