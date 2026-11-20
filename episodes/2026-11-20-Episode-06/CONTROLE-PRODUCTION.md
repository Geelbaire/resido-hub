# Contrôle de production · Franc Nord #6 (20 novembre 2026)

## Voix et synchronisation

`voix.mp3` est la prise `Épisode6.mp3` copiée à l’identique, sans réencodage ni
changement de tempo. Elle dure 08:43.964. Une tenue finale de 2,6 s porte la
conduite à 08:46.564, soit 15 797 images à 30 i/s (08:46.567).

Faster Whisper (`small`, français) a ancré 1 492 des 1 568 mots du storyboard
(95,2 %). Les 76 autres sont interpolés entre leurs voisins.
[Alignement](alignment-report.json) · [Transcription](voice-transcript-small.json).

Les 13 conduites comptent de 24 à 28 repères vocaux, avec un intervalle maximal
mesuré de 1,998 s. Aucun repère de la mise en scène n’est introuvable dans la
narration. [Conduites](controle/conduites.json).

## Dispositifs

| Effet | Scènes |
|---|---|
| Scanner rayons X en double passe (`ctx.clip()` + lame `lighter`) | 5 (navire en cale sèche à Lévis, flux des PME) · 11 (coffre CDPQ · REER · CELI) |
| Caméra virtuelle 2.5D (orbite, inclinaison, cap) et corridor `F/(Z-camZ)` | toutes les scènes géographiques · 2 (Kiev le long du Dniepr) · 11 (corridor numérique) |
| Verre de saphir (reflet spéculaire relancé à chaque repère vocal) | toutes les cartes HUD et tous les panneaux |
| Flux de particules sur Bézier | 3 (triangle Shenzhen) · 7 (Doha → Berlin, compteur alimenté à chaque impact) · 9 (barrages → Montréal) |
| Globe 8K en perspective réelle, atmosphère Rayleigh, arcs cométaires à ombre portée | 1, 2, 3, 5, 6, 7, 9, 11, 13 |
| Météo et lumière volumétrique | 2 et 4 (projecteurs antiaériens, neige) · 7 (bascule thermique ambre) |
| Loupe optique × 1,45 | 3 (garanties pour Kyiv) · 6 (projet d’accord COP31) · 10 (dossiers France 24) |
| Écran scindé 70/30 ⇄ 30/70 ⇄ 50/50 à ressort | 4, 8, 12, 13 |
| Compteurs `odometer()` à graduations | 510+, 110+, 400, 1 144, 191,5 → 400 M$, 16,5 G$ US, 15 à 18 ¢, 99 %, −9 %, 111 |

## Planches et contrôle typographique

26 planches de 12 vues (13 scènes × 2 formats) : de 9 à 12 vues distinctes par
planche (2 à 9/12, 4 à 10/12, 13 à 11/12, 7 à 12/12). Passes sans étiquettes
pour les 9 scènes géographiques : mer Baltique, Pologne, mer Noire, Dniepr, delta
de la rivière des Perles, Turquie, Grands Lacs et Saint-Laurent se reconnaissent
sans aucun nom. [Planches 16:9](controle/16x9) · [Planches 9:16](controle/9x16) ·
[Variation](controle/variation-planches.json).

Sur 512 instants échantillonnés (256 par format), les 3 204 éléments
typographiques contrôlés donnent zéro empiètement sur les zones réservées et
zéro chevauchement. [Contrôle typographique](controle/validation-texte.json).

## Pilote et MP4

Le pilote narré (ouverture, 39,8 s) a été lu en entier dans Chrome dans les
deux formats : 1 194 images affichées, aucune perdue.
[Pilote 16:9](controle/Pilote-Ouverture-16x9.mp4) · [Pilote 9:16](controle/Pilote-Ouverture-9x16.mp4).

Les deux masters, les trois Shorts et les deux pilotes ont été décodés en entier.
Masters : 15 797 images, 5 chapitres intégrés. Corrélation minimale avec la voix
d’origine : 0,99991, décalage maximal 0 ms. Aucun segment noir, aucune plage de
faible variation. Le détecteur de gel signale uniquement les 2,5 dernières
secondes du master 16:9 (524,0 s), soit la tenue finale du générique
« FRANC NORD · À demain ». [Vérification des MP4](VERIFICATION-MP4.json).

| Fichier | Durée | Images |
|---|---:|---:|
| `Franc-Nord-Episode-06-16x9.mp4` | 08:46.567 | 15 797 |
| `Franc-Nord-Episode-06-9x16.mp4` | 08:46.567 | 15 797 |
| `Short-1-Missile-Pologne-Shenzhen-Quebec-9x16.mp4` | 02:37.000 | 4 710 |
| `Short-2-COP31-Fossiles-Energie-Quebec-9x16.mp4` | 02:37.700 | 4 731 |
| `Short-3-Anthropic-Bourse-Cyber-Quebec-9x16.mp4` | 02:00.600 | 3 617 |

## Points éditoriaux

Voir la section « Notes de production » du [kit de publication](KIT-PUBLICATION-EPISODE-06.md) :
UNICEF (tués ou blessés), Corée du Sud (appareils interdits, pas « tricheurs IA »),
Qatar (défense et technologie), courbe FAO illustrative, fac-similés signalés.

[Reproduire l’épisode](reference/REPRODUIRE.md) · [Sources cartographiques](SOURCE-TEXTURE.md).
