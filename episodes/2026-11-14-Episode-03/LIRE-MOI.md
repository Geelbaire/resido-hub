# FRANC NORD — Épisode 3 — 14 novembre 2026

Meta & vos photos · Logement & vie chère · Francophonie & Asie.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `Franc-Nord-Episode-03-16x9.mp4` | Vidéo complète YouTube, 1920 × 1080, 30 i/s, voix seule |
| `Franc-Nord-Episode-03-9x16.mp4` | Vidéo complète verticale Facebook, 1080 × 1920 |
| `Short-1-…`, `Short-2-…`, `Short-3-…` | Shorts / Reels 9:16 découpés sur les chapitres 01, 02, 03 |
| `KIT-PUBLICATION-EPISODE-03.md` | Titres, descriptions avec chapitres réels, tags, 1er commentaire, miniature |
| `scenes-custom.js` | Les 13 scènes de motion design (Canvas 2D, 100 % code) |
| `storyboard.json` | Storyboard synchronisé : durées réelles + `wordTimes` (minutage de chaque mot) |
| `voix.mp3` | Narration (copie conforme de `Épisode3.mp3`), seule piste audio |
| `voice-transcript-episode3.json` | Transcription horodatée au mot (faster-whisper small, local) |
| `alignment-report.json` | Bornes des scènes et taux d'ancrage texte ⇄ voix |
| `teleprompteur.md`, `narration-elevenlabs.txt`, `raw-news-digest.json` | Fichiers éditoriaux d'origine |
| `reference/` | Storyboard avant synchronisation et brouillon du kit (8 min 30) |

## Synchronisation

- Voix : 458,919 s, lue à sa vitesse d'origine. Tenue finale de 2,6 s après le dernier mot. Durée vidéo : 461,519 s (7 min 41 s).
- 1 328 mots du script sur 1 353 sont ancrés sur la transcription. Les autres, surtout les nombres dits en toutes lettres (« un virgule deux »), sont interpolés entre leurs voisins.
- Chaque temps fort des scènes est ancré sur une expression exacte de la narration. `cues()` lit `scene.wordTimes`, sans estimation proportionnelle.
- Outil : `node align-voix-mots.mjs --episode 2026-11-14-Episode-03`.

## Mise en scène

- 13 dispositifs visuels distincts. Dans chaque dossier, aucune mécanique ne se répète :
  - Meta : plongée zénithale sur l'Italie et noyau algorithmique ; carte inclinée de l'Atlantique avec monolithes et muraille réglementaire ; scission verticale empreinte / réseau ouvert ; globe puis champ de force hexagonal sur le Québec.
  - Logement : survol nocturne avec fleuves de manifestants ; quartier isométrique qui devient des colonnes boursières, puis le décrochage des courbes ; diagonale plafond / grues ; colonnes de verre, corridor du Saint-Laurent et triplex.
  - Francophonie : globe en rotation ; carte du Pacifique puis table ronde de l'OIF et lignes d'exportation ; horizon avec constellation francophone et corridors vers l'Asie-Pacifique.
- Texte sans tremblement : chaque texte animé est rastérisé une seule fois en sprite (taille entière constante), puis déplacé ou mis à l'échelle en coordonnées flottantes. Les compteurs utilisent des sprites par chiffre.
- Coin inférieur droit dégagé (filigrane YouTube). Aucune musique ni effet sonore.
- Cartes, courbes et schémas : illustrations des mécanismes, sans échelle statistique ni frontière exacte.

## Reprise

```sh
node align-voix-mots.mjs --episode 2026-11-14-Episode-03
node export-video.mjs --episode 2026-11-14-Episode-03 --format 16x9 --gpu --output episodes/2026-11-14-Episode-03/Franc-Nord-Episode-03-16x9.mp4
node export-video.mjs --episode 2026-11-14-Episode-03 --format 9x16 --gpu --output episodes/2026-11-14-Episode-03/Franc-Nord-Episode-03-9x16.mp4 --server-port 4412 --debug-port 9312
node decouper-shorts.mjs --episode 2026-11-14-Episode-03 --source Franc-Nord-Episode-03-9x16.mp4 --names "Meta-Photos-Loi25-Quebec,Crise-Logement-Loyers-Quebec,Francophonie-Cambodge-Quebec-Ottawa"
```

Lancer le second export quelques secondes après le premier : les deux profils Chrome portent sinon le même nom.

## Contrôles effectués (automatiques)

- 13 846 images par vidéo complète, 461,53 s ; décodage intégral sans erreur dans les deux formats.
- Voix : corrélation 0,99997 à 0,99999 avec `voix.mp3` à 5, 150, 300 et 450 s, décalage mesuré 0,0 ms, dans les deux formats.
- 462 images parcourues (une toutes les 2 s, deux formats) : aucune exception JavaScript, aucune image noire.
- Shorts : 2 min 21 s, 2 min 17 s et 1 min 49 s, coupés aux bornes exactes des chapitres.
- Détails dans `CONTROLE-FINAL.json`. Une écoute humaine intégrale reste recommandée avant publication.
