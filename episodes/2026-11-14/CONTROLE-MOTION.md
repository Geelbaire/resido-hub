> État actuel : version Astra avec la nouvelle voix Épisode2.mp3, validée en 16:9 et 9:16. Durée 446,133333 s. Livraison : `livraisons/2026-11-14-Episode-02/`. Les paragraphes ci-dessous décrivent les étapes et versions précédentes, dont les versions muettes remplacées. La voix est désormais présente.

# FRANC NORD — Réalisation du 14 novembre 2026

Les 13 scènes COP31 / Donbass / pannes FAA et Microsoft sont codées dans `scenes-custom.js`. Le moteur optique du pilote est conservé : géographie en pointillés, lueurs additives, emblème vectoriel, ressorts, révélations typographiques, grain et vignette. Les compositions sont adaptées au paysage et au portrait. Le canevas fixe de l’émission n’a pas été modifié.

## État de la voix : nouvelle prise attendue

Choix confirmé par Gilbert : conserver le nouveau storyboard et fournir une voix correspondante. Le `voix.mp3` présent dure **442,592625 secondes**, mais appartient à l’ancien pilote pétrole / dollar / hydroélectricité. La transcription locale le confirme notamment à 12,84 s (routes pétrolières), 18,14 s (dollar à 71 cents) et 28,50 s (Hydro-Québec). `voice-transcript-pilote.json` contient cette transcription automatique, avec ses erreurs de reconnaissance possibles.

**Aucun alignement avec cette ancienne voix n’a été appliqué au nouveau storyboard.** Les 510 secondes actuelles sont provisoires. Les anciens fichiers `franc-nord-2026-11-14-16x9.mp4` et `franc-nord-2026-11-14-9x16.mp4` sont préservés : ils ne représentent pas la nouvelle réalisation.

## Contrôles visuels

- Registre : 13 identifiants, correspondant aux 13 scènes du storyboard.
- Syntaxe JavaScript vérifiée en mode module.
- Parcours de chaque scène à intervalles d’une seconde, dans les deux formats, sans exception JavaScript.
- 104 captures : 4 instants par scène et par format ; manifeste dans `controle-visuel/manifest.json`.
- Revue des planches paysage et portrait et des captures de finale ; correction du déclenchement prématuré de la signature finale.
- Cartes, réseaux, flux et frontières stylisés : illustrations explicatives, sans prétention de mesure statistique ou de délimitation cartographique exacte.
- Les repères visuels se calculent à partir du texte et accepteront les minutages de phrases (`voiceSync`) ou de mots (`wordSync`) après réception de la nouvelle prise.

## Aperçus

`apercu-muet-COP31-16x9.mp4` et `apercu-muet-COP31-9x16.mp4` sont des **montages de contrôle muets de 52 secondes**, composés de deux extraits de deux secondes par scène. Ils permettent de juger les animations et le cadrage. Ce ne sont pas les épisodes complets synchronisés. Ils ne comportent aucune piste audio.

## Reprise avec la nouvelle voix

Remplacer `voix.mp3` par la lecture du storyboard actuel, puis exécuter depuis le projet :

```sh
node sync-voix.mjs --episode 2026-11-14
node export-video.mjs --episode 2026-11-14 --format 16x9
node export-video.mjs --episode 2026-11-14 --format 9x16
```

Le script refuse de synchroniser l’empreinte SHA-256 de la prise connue du pilote. La synchronisation par pauses reste une estimation à revoir avec écoute et image ; elle n’est pas une preuve d’alignement au mot. L’export final reste bloqué tant que l’état du storyboard indique l’attente de remplacement. Il ne mélange que la voix sélectionnée, sans musique ni effets sonores.

La référence originale et le storyboard reçu avant cette intervention sont conservés dans `reference-episode-1/`.

## Vérification des MP4 de contrôle

Les deux fichiers ont été exportés et sondés : H.264, 30 images/s, 1 560 images et 52,000 secondes chacun ; 1920 × 1080 pour le paysage et 1080 × 1920 pour le portrait. Une seule piste vidéo, aucune piste audio. Les deux fichiers ont été décodés intégralement par FFmpeg sans erreur.

## Épisodes complets — correction de livraison

Les fichiers `franc-nord-COP31-complet-muet-16x9.mp4` et `franc-nord-COP31-complet-muet-9x16.mp4` contiennent désormais les **13 scènes intégrales sur 510 secondes (8 min 30 s)**. Les extraits de 52 secondes restent des aperçus distincts.

Vérification des deux épisodes complets : H.264, 30 images/s, 15 300 images, durée exacte 510,000 secondes ; paysage 1920 × 1080 et portrait 1080 × 1920. Les deux fichiers ont été décodés intégralement sans erreur par FFmpeg. Des images extraites du MP4 à 260 et 500 secondes ont aussi été inspectées. Aucune piste audio ; nouvelle voix toujours attendue. Rendu accéléré Metal via l’option `--gpu`.
