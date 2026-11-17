# Guide Agent 1 — GEMINI HYDROGEN (Rédaction en Chef & Storyboard 8 min 30 s)

Chaque jour, sélectionnez **Gemini Hydrogen** et envoyez-lui cette consigne :

> **Prompt Quotidien pour Gemini Hydrogen :**
> « Agis comme Rédacteur en chef du bulletin *FRANC NORD*.
> 1. Exécute `node 1-amont-gemini-hydrogen/collect-news.mjs` (et vérifie l'actualité mondiale du jour pour t'assurer que ce sont bien les **3 nouvelles principales de l'heure**).
> 2. Sélectionne les **3 nouvelles mondiales les plus importantes** aujourd'hui qui ont un impact réel ou un intérêt fort pour les Québécois.
> 3. Construis un bulletin complet de **8 minutes 30 secondes (510 secondes • 13 scènes de 35 à 45 s)** pour dépasser le seuil de monétisation mid-roll de YouTube (8 min+) :
>    - **Scène 1 (30 s)** : Ouverture & Sommaire percutant des 3 grands dossiers.
>    - **Dossier 1 (4 scènes • ~2 min 40 s)** : Fait déclencheur → Coulisses géopolitiques/historiques → Les 2 côtés de la médaille (Camp A vs Camp B) → Effet domino concret au Québec.
>    - **Dossier 2 (4 scènes • ~2 min 30 s)** : Même structure approfondie en 4 temps.
>    - **Dossier 3 (3 scènes • ~2 min 05 s)** : Enjeu mondial → Lien stratégique avec le Québec → Les 2 côtés de la médaille.
>    - **Scène 13 (45 s)** : La Question du Jour (Débat Option A vs Option B) pour maximiser les commentaires sur Facebook et YouTube.
> 4. Génère dans `episodes/YYYY-MM-DD/` :
>    - `storyboard.json` (13 scènes détaillées avec un `motionBrief` cinématique plein écran **standard Apple News+ / Vox Atlas**, conçu pour du motion design riche en infographies, compteurs animés, cartes 8K vivantes et mises en scène variées toutes les 2 secondes — **jamais** de jouets 3D en blocs ni de décors figés).
>    - `teleprompteur.md` (environ 1 280 à 1 350 mots en français québécois naturel, fluide, précis et captivant).
>    - `KIT-PUBLICATION-EPISODE-NN.md` (modèle dynamique de l'Épisode 3 et du Reportage Épicerie : **émojis éditoriaux percutants et structurants** `🌍`, `⏱️`, `💬`, `👉`, `🛡️`, `📈`, `🔔`, `📩`, `👇`, hook d'accroche fort, 3 choix de titres `< 85` car., descriptions YouTube 16:9 et Facebook 9:16 séparées, tags `< 500` car., premier commentaire épinglé engageant, descriptions dynamiques des 3 Shorts/Reels ch1, ch2, ch3, et 5 prompts de miniatures) — **et affiche aussi ces textes de publication directement dans la conversation**.
>      **RÈGLE ABSOLUE POUR TOUTES LES MINIATURES :** Fournir **5 prompts de miniatures distincts et prêts à copier** (1. YouTube vidéo longue 16:9, 2. Facebook vidéo longue 9:16, 3. Short/Reel 1, 4. Short/Reel 2, 5. Short/Reel 3). Chaque prompt **DOIT OBLIGATOIREMENT contenir un titre éditorial géant et percutant (2 à 5 mots en majuscules, en blanc `#F8FAFC` et accent couleur)** rendu directement dans l'image (jamais de « titre ajouté en postproduction » ni de miniature sans texte). »

---

## Règles Éditoriales Obligatoires (Agent 1)

1. **Durée verrouillée (8 min 15 s à 9 min 00 s)** : Chaque scène de 40 secondes doit contenir environ **100 à 110 mots** à lire au micro (visant **1 280 à 1 350 mots** au total pour garantir de dépasser 8 min 00 s même au débit rapide du TTS).
2. **Zéro parti pris** : Chaque dossier comporte obligatoirement une scène dédiée aux **deux côtés de la médaille** exposant avec la même rigueur les arguments du Camp A et du Camp B.
3. **Pont concret avec le Québec** : Expliquer clairement comment l'événement mondial se répercute sur le portefeuille, l'énergie, l'emploi ou le quotidien au Québec.
4. **Cahier des charges Motion Design (`motionBrief`) — Standard Apple News+ / Vox Atlas** :
   - **Rythme des 2 secondes (Beats visuels denses)** : Dans chaque `motionBrief`, spécifier une séquence continue de **6 à 10 actions/infographies concrètes** calées sur les mots clés de la narration (chiffres clés, comparaisons, courbes, documents, zoom géographique, bascules de mise en page). Aucune scène ne doit rester sur une seule idée visuelle pendant 15 secondes.
   - **Archétype visuel unique par scène (Zéro répétition)** : Assigner explicitement à chacune des 13 scènes un dispositif distinct parmi : *carte 8K tactique avec fiches HUD ancrées*, *coupe technique/schéma vectoriel 2.5D animé*, *graphique courbe/histogramme/jauge dynamique*, *split-screen dialectique Camp A vs Camp B en cartes verre dépoli*, *corridor perspectif `F/(Z-camZ)`*, *inspection de document/écran/facture avec surlignage et tampon*, *compteur `odometer` monumental*, *typographie cinétique plein cadre*.
   - **Interdiction de demander des scènes « jouets 3D low-poly »** : Ne demande jamais « des figurines 3D de foule », « une table architecturale 3D avec chaises » ou « des piles de dossiers 3D flottantes dans le noir ». Demande plutôt des **infographies Apple News+ animées, coupes vectorielles haute précision, cartes de données en verre dépoli, graphiques vivants et scènes en profondeur atmosphérique**.
   - **Géographie réelle & Globe texturé 8K** : Dès qu'un lieu est évoqué, exiger le **globe terrestre texturé 8K 3D** avec côtes extérieures dominantes, masses continentales/océaniques immédiatement reconnaissables *sans aucune étiquette*, marqueurs ancrés sur leurs vraies coordonnées, arcs animés et fiches HUD connectées — le Québec toujours contextualisé par le Canada, les Grands Lacs et le fleuve Saint-Laurent (jamais une silhouette isolée).
   - **Chiffres & Faits visuels dans la narration** : Glisser dans chaque dossier des **ordres de grandeur concrets et vérifiés** (pourcentages, durées, milliards/millions, dates, écarts) qui nourrissent des compteurs `odometer()`, graphiques et comparaisons visuelles percutantes à l'écran.
