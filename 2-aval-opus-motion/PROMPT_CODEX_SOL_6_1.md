# MANIFESTE & PROMPT QUOTIDIEN — CODEX SOL 6.1 (Motion Design de Calibre Mondial)

Lorsque vous choisissez **Codex Sol 6.1** (au lieu de Claude Opus 5.5) selon vos crédits disponibles, envoyez-lui cette consigne :

> **Prompt Quotidien à copier-coller pour Codex Sol 6.1 :**
> « Examine les images haute résolution de notre charte graphique dans `/Volumes/Projets/FRANC NORD/identite-visuelle/` (`logo-Officiel.jpeg`, `02-banniere-officielle.jpg`, `03-brand-board-charte.png` et `04-modele-miniature.png`), étudie le code de référence de l'Épisode #1 dans `/Volumes/Projets/FRANC NORD/episodes/2026-11-14/scenes-custom.js` ainsi que `/Volumes/Projets/FRANC NORD/2-aval-opus-motion/PROMPT_CODEX_SOL_6_1.md` et `/Volumes/Projets/FRANC NORD/episodes/YYYY-MM-DD/storyboard.json`.
> Code ensuite les 13 scènes du jour dans `/Volumes/Projets/FRANC NORD/episodes/YYYY-MM-DD/scenes-custom.js`, puis exporte les MP4 16:9 et 9:16 avec `voix.mp3`.
> **EXIGENCE ABSOLUE : Tu dois égaler ou surpasser le calibre visuel de l'Épisode #1 (`episodes/2026-11-14/scenes-custom.js`) et prouver seconde par seconde que tu es le meilleur motion designer de la terre entière.** »

---

## 🎯 RÈGLES OBLIGATOIRES POUR CODEX SOL 6.1

1. **Modèle d'excellence obligatoire (`episodes/2026-11-14/scenes-custom.js`)** :
   * Avant d'écrire une seule ligne de code, inspecte la structure, la densité mathématique et la chorégraphie de [`episodes/2026-11-14/scenes-custom.js`](../episodes/2026-11-14/scenes-custom.js). Ton fichier `scenes-custom.js` du jour doit avoir le même niveau de richesse visuelle, de fluidité et de finition.
2. **Interdictions Formelles (Zéro Musique, Zéro Télé Câblée)** :
   * **INTERDIT** de mettre la moindre musique de fond ou effet sonore (la seule piste audio est `voix.mp3`).
   * **INTERDIT** de faire des boîtes rectangulaires empilées façon « tableau de bord / dashboard Web » ou des barres de nouvelles défilantes (tickers).
   * **INTERDIT** de saturer l'écran de texte (maximum 2 à 6 mots visibles simultanément).
3. **Exigences de Haut Calibre** :
   * **Chorégraphie Multi-Actes** : chaque scène (30 à 45 s) doit évoluer à travers plusieurs actes visuels distincts synchronisés avec `scene.narration`.
   * **Charte Officielle FRANC NORD** : Abyssal Midnight (`#030509`), Boreal Ice Cyan (`#38BDF8`), Editorial Amber Gold (`#F59E0B`), Pure Slate (`#E5E7EB`).
   * **Synchronisation Audio & Export** : si `voix.mp3` est présent dans le dossier de l'épisode, ajuste au besoin les durées dans `storyboard.json` pour coller à la durée exacte de `voix.mp3`, puis lance `export-video.mjs` en `16x9` et `9x16`.


## Livraison obligatoire dans le Studio Résido

L’export local ne termine pas la livraison. Après les contrôles :

1. Préparer la mise à jour de l’épisode dans le Studio FRANC NORD sur **https://resido.ca** : scènes, storyboard et téléprompteur cohérents. Indiquer la durée complète et l’état réel de la voix.
2. Demander explicitement à Gilbert : **« Veux-tu que je publie maintenant cet épisode dans le Studio Résido ? »**, sauf si son autorisation de publication est déjà donnée dans la conversation. Si la voix manque, préciser que la version proposée est muette et que les durées restent provisoires.
3. Après accord, publier les fichiers nécessaires dans le dépôt `Geelbaire/resido-hub` et suivre le déploiement GitHub Pages jusqu’à son résultat. Vérifier l’épisode sur le site avant d’annoncer sa mise en ligne.
4. Distinguer le lecteur d’animations Canvas du Studio des fichiers MP4 exportés. Le Studio actuel ne propose pas de lecteur MP4 : ne pas prétendre que les fichiers MP4 sont hébergés ou consultables sur Résido sans avoir effectivement préparé et vérifié leur hébergement et leurs liens. Ne pas ajouter les gros MP4 au dépôt Git sans une solution d’hébergement adaptée.

Les exports complets doivent être livrés avec leur durée intégrale. Des extraits de contrôle ne les remplacent pas.


## Livraison sur le SSD

Livrer les deux MP4 **complets** dans `/Volumes/Projets/FRANC NORD/livraisons/YYYY-MM-DD-Episode-NN/`, avec la voix, le storyboard, le code des scènes et un court rapport. Vérifier durée, formats, présence de la seule narration et décodage des fichiers. Ne jamais remplacer l’épisode complet par une bande de démonstration. Si une nouvelle voix est plus courte, recaler les scènes et les repères sur les mots prononcés, sans ralentir artificiellement la voix pour atteindre 8 min 30 s. Préserver les versions précédentes.
