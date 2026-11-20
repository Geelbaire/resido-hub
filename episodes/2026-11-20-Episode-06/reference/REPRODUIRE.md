# Reproduire l’épisode 06

Lancer les commandes depuis la racine du dépôt. `voix.mp3` est la prise
`Épisode6.mp3` copiée à l’identique. La transcription Faster Whisper (`small`,
français, horodatage par mot) est conservée dans `voice-transcript-small.json`.

```sh
episode=2026-11-20-Episode-06
d="episodes/$episode"
node align-voix-mots.mjs --episode "$episode"
node "$d/reference/produire.mjs" inspect 16x9
for format in 16x9 9x16; do
  node "$d/reference/produire.mjs" boards "$format"
  node "$d/reference/produire.mjs" texte "$format"
  node "$d/reference/produire.mjs" pilot "$format"
  node "$d/reference/produire.mjs" playback "$format"
done
node "$d/reference/verifier-texte.mjs"
python3 "$d/reference/verifier-planches.py"
for format in 16x9 9x16; do
  node "$d/reference/produire.mjs" full "$format"
done
node decouper-shorts.mjs --episode "$episode" \
  --source Franc-Nord-Episode-06-9x16.mp4 \
  --names "Missile-Pologne-Shenzhen-Quebec,COP31-Fossiles-Energie-Quebec,Anthropic-Bourse-Cyber-Quebec"
python3 "$d/reference/verifier-medias.py"
```

Vues ponctuelles pour la mise au point : `node "$d/reference/produire.mjs" frames 16x9 12.5,40,61.2`.
Le contrôle Python demande Pillow et NumPy. Le rendu utilise Chrome macOS
(Canvas 2D, WebGL2, WebCodecs H.264) et FFmpeg.
