# FRANC NORD — Épisode 4 · Spécial reportage — 14 novembre 2026

« L'épicerie sous algorithme » : étiquettes électroniques, baux secrets et la règle des 15 $.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `Franc-Nord-Episode-04-16x9.mp4` | Reportage complet YouTube, 1920 × 1080, 30 i/s, voix seule |
| `Franc-Nord-Episode-04-9x16.mp4` | Reportage complet vertical Facebook, 1080 × 1920 |
| `Short-1-…`, `Short-2-…`, `Short-3-…` | Shorts / Reels 9:16 découpés sur les chapitres 01, 02 et 03 |
| `KIT-PUBLICATION-REPORTAGE.md` | Titres, descriptions avec chapitres réels, tags, 1er commentaire, miniatures |
| `scenes-custom.js` | Les 13 scènes de motion design (Canvas 2D, 100 % code) |
| `storyboard.json` | Storyboard synchronisé : durées réelles et `wordTimes` (minutage de chaque mot) |
| `voix.mp3` | Narration (copie conforme de `Épisode4.mp3`), seule piste audio |
| `voice-transcript-reportage.json` | Transcription horodatée au mot (faster-whisper small, en local) |
| `alignment-report.json` | Bornes des scènes et taux d'ancrage texte ⇄ voix |
| `controle-visuel/` | 26 planches contact (13 scènes × 2 formats, 12 instants par scène) vérifiées avant l'export |
| `CONTROLE-FINAL.json` | Contrôles automatiques des MP4 (synchro audio, décodage, images noires) |
| `teleprompteur.md`, `narration-elevenlabs.txt`, `DOSSIER-RECHERCHE-ENQUETE.md` | Fichiers éditoriaux d'origine |
| `reference/` | Storyboard avant synchronisation, brouillon du kit, outils de production (banc d'essai, assemblage, fragments de scènes) |

## Synchronisation

- Voix de 446,511 s, lue à sa vitesse d'origine, suivie d'une tenue finale de 2,6 s après le dernier mot. Durée de la vidéo : 449,111 s (7 min 29 s).
- 1 286 mots du script sur 1 331 sont ancrés sur la transcription. Les autres, surtout les nombres dits en toutes lettres, sont interpolés entre leurs voisins.
- Le storyboard disait « caisses enregistreuse » (scène 10) alors que la voix dit « caisses ». La narration du storyboard a été alignée sur l'enregistrement.
- Chaque temps fort est ancré sur une expression exacte de la narration : `cues()` lit `scene.wordTimes`.
- Outil : `node align-voix-mots.mjs --episode 2026-11-14-Special-Reportage-Epicerie`.

## Mise en scène : 13 dispositifs distincts

1. Ouverture : l'emblème devient un scanner laser qui balaie un code-barres monumental, puis 4 strates en profondeur et le titre.
2. Étiquettes : travelling 2.5D dans une allée, gros plan e-ink, onde sans fil du serveur central (4,99 $ → 5,79 $), courbe horaire « billet d'avion ».
3. Instacart : la frontière se trace, écran scindé client A / client B, +23 %, dossier Kroger de 60 pages en couches, sceau FTC.
4. Fidélité et IA : cartes en parallaxe, flux de particules, réseau neuronal sphérique en rotation 3D, liste générée, triangle d'alerte et cadenas ouvert.
5. Deux côtés (étiquettes) : horizon miroir. Le haut est émeraude (anti-gaspillage) ; le reflet du bas se redresse en ambre (vendredi 17 h) ; l'horizon devient le fléau d'une balance.
6. Oligopole : disque isométrique extrudé (89 %), satellites Costco et Walmart, trois noyaux et leurs bannières en orbite, fissure.
7. Baux secrets : document caviardé, plan d'architecte zénithal, barrières laser, rebonds des concurrents, frise 2025-2026, marteau.
8. Quartiers : survol en carte inclinée du Saint-Laurent, ville en région verrouillée, indépendant émeraude, jauge du panier, recommandations du Bureau.
9. Deux côtés (baux) : diagonale tranchante, chantier et bouclier côté promoteurs ; axe du temps et cage dorée côté économistes.
10. Caisse : tapis roulant et laser, histogramme des écarts qui bascule, reçu qui se déroule, tampon REFUSÉ.
11. Règle des 15 $ : bouclier sur le Québec, arbre de décision autour du « 15 $ » d'or (0,00 $ GRATUIT / −15 $), trajet maison → magasin.
12. Lois : globe nocturne sur le nord-est américain, bouclier et avertissement de New York, faisceaux vers Québec et Ottawa, fenêtre qui s'ouvre.
13. Question du jour : boussole centrale dont l'aiguille pivote vers Option A puis Option B, appel à commenter, signature FRANC NORD.

## Qualité

- **Zéro tremblement.** Chaque texte est rastérisé une seule fois en sprite, à taille entière constante, puis déplacé ou mis à l'échelle en coordonnées flottantes. Les compteurs roulent chiffre par chiffre. Les éléments qui zooment (étiquette e-ink, cartes) sont mis à l'échelle par transformation : la police ne change jamais de taille.
- **Correctif hérité de l'épisode 3.** Le compteur faisait rouler les chiffres de rang supérieur dès que les chiffres inférieurs approchaient 9 : un prix fixe de 4,99 $ s'affichait alors « 5,99 $ ». Corrigé : un chiffre ne roule plus que pendant une vraie retenue.
- **Banc d'essai automatique.** Il signale les textes hors cadre, les chevauchements entre textes, les textes dans les zones réservées (marque en haut à gauche, sources en bas à gauche, filigrane YouTube en bas à droite, légende des Shorts) et les repères voix introuvables. Chaque scène a été inspectée sur planche contact dans les deux formats. Les derniers signalements sont des superpositions voulues (l'étiquette papier qui recouvre l'écran e-ink, un tampon sur un reçu) ou des chiffres en train de rouler, déjà masqués.
- Aucune musique ni effet sonore. Les prix affichés (4,99 $, 3,99 $…) et les proportions du disque sont des illustrations, signalées à l'écran.

## Reprise

```sh
node align-voix-mots.mjs --episode 2026-11-14-Special-Reportage-Epicerie
node export-video.mjs --episode 2026-11-14-Special-Reportage-Epicerie --format 16x9 --gpu --output episodes/2026-11-14-Special-Reportage-Epicerie/Franc-Nord-Episode-04-16x9.mp4
node export-video.mjs --episode 2026-11-14-Special-Reportage-Epicerie --format 9x16 --gpu --server-port 4412 --debug-port 9312 --output episodes/2026-11-14-Special-Reportage-Epicerie/Franc-Nord-Episode-04-9x16.mp4
node decouper-shorts.mjs --episode 2026-11-14-Special-Reportage-Epicerie --source Franc-Nord-Episode-04-9x16.mp4 --names "Etiquettes-Electroniques-Prix-Personnalises,Baux-Secrets-Oligopole-Epicerie,Regle-15-Dollars-Caisse-Quebec"
```

Lancer le second export quelques secondes après le premier : sinon, les deux profils Chrome portent le même nom.
