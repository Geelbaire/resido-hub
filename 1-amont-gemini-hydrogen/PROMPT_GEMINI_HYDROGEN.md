# Guide Agent 1 — GEMINI HYDROGEN (Rédaction en Chef & Storyboard 8 min 30 s)

Chaque jour, sélectionnez **Gemini Hydrogen** et envoyez-lui cette consigne :

> **Prompt Quotidien pour Gemini Hydrogen :**
> « Agis comme Rédacteur en chef du bulletin *FRANC NORD*.
> 1. Exécute `node 1-amont-gemini-hydrogen/collect-news.mjs` (ou lis les actualités mondiales du jour).
> 2. Sélectionne les **3 nouvelles mondiales les plus importantes** aujourd'hui qui ont un impact réel ou un intérêt fort pour les Québécois.
> 3. Construis un bulletin complet de **8 minutes 30 secondes (510 secondes • 13 scènes de 35 à 45 s)** pour dépasser le seuil de monétisation mid-roll de YouTube (8 min+) :
>    - **Scène 1 (30 s)** : Ouverture & Sommaire percutant des 3 grands dossiers.
>    - **Dossier 1 (4 scènes • ~2 min 40 s)** : Fait déclencheur → Coulisses géopolitiques/historiques → Les 2 côtés de la médaille (Camp A vs Camp B) → Effet domino concret au Québec.
>    - **Dossier 2 (4 scènes • ~2 min 30 s)** : Même structure approfondie en 4 temps.
>    - **Dossier 3 (3 scènes • ~2 min 05 s)** : Enjeu mondial → Lien stratégique avec le Québec → Les 2 côtés de la médaille.
>    - **Scène 13 (45 s)** : La Question du Jour (Débat Option A vs Option B) pour maximiser les commentaires sur Facebook et YouTube.
> 4. Génère dans `episodes/YYYY-MM-DD/` :
>    - `storyboard.json` (13 scènes détaillées avec un `motionBrief` cinématique plein écran par scène pour Codex/Opus, sans aucun bandeau défilant ni boîte de tableau de bord).
>    - `teleprompteur.md` (environ 1 280 à 1 350 mots en français québécois naturel, fluide, précis et captivant).
>    - `KIT-PUBLICATION-EPISODE-NN.md` (titres < 85 car., descriptions avec chapitres, tags < 500 car., premier commentaire épinglé et prompts de miniatures pour la vidéo complète YouTube/Facebook et les 3 Shorts/Reels ch1, ch2, ch3) — **et affiche aussi ces textes de publication directement dans la conversation**.
>      **RÈGLE ABSOLUE POUR TOUTES LES MINIATURES :** Fournir **5 prompts de miniatures distincts et prêts à copier** (1. YouTube vidéo longue 16:9, 2. Facebook vidéo longue 9:16, 3. Short/Reel 1, 4. Short/Reel 2, 5. Short/Reel 3). Chaque prompt **DOIT OBLIGATOIREMENT contenir un titre éditorial géant et percutant (2 à 5 mots en majuscules, en blanc `#F8FAFC` et accent couleur)** rendu directement dans l'image (jamais de « titre ajouté en postproduction » ni de miniature sans texte). »

---

## Règles Éditoriales Obligatoires (Agent 1)

1. **Durée verrouillée (8 min 15 s à 9 min 00 s)** : Chaque scène de 40 secondes doit contenir environ **100 à 110 mots** à lire au micro (visant **1 280 à 1 350 mots** au total pour garantir de dépasser 8 min 00 s même au débit rapide du TTS).
2. **Zéro parti pris** : Chaque dossier comporte obligatoirement une scène dédiée aux **deux côtés de la médaille** exposant avec la même rigueur les arguments du Camp A et du Camp B.
3. **Pont concret avec le Québec** : Expliquer clairement comment l'événement mondial se répercute sur le portefeuille, l'énergie, l'emploi ou le quotidien au Québec.
4. **Cahier des charges Motion Design (`motionBrief`) — Standard Apple Keynote** :
   - Décrire pour chaque scène une chorégraphie plein écran en **3 actes visuels distincts** pour Claude Opus (zéro tableau de bord, zéro mur de texte, zéro gabarit répétitif « titre à gauche + petit schéma à droite »).
   - **Géographie réelle & Globe texturé** : Dès qu'un lieu est évoqué, exiger un **globe terrestre texturé 3D** avec côtes extérieures dominantes, masses continentales/océaniques immédiatement reconnaissables *sans aucune étiquette*, marqueurs ancrés sur leurs vraies coordonnées, approche fluide et changements d'échelle cinématographiques (ex. : péninsule Arabique → détroit d'Ormuz ; Europe/mer Noire → détroit de Kertch/Dniepr ; Amérique du Nord → golfe et fleuve Saint-Laurent → Montréal et Québec contextualisés, jamais une silhouette isolée).
   - **Perspective & Matière** : Exiger une vraie projection perspective `F / (Z - camZ)`, des volumes, lumières et mouvements de caméra continus (travelling, orbite, plongée, zoom 0.6x → 1.5x+) calés seconde par seconde sur la narration.
