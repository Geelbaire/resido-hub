# FRANC NORD — Studio d'Actualité Mondiale en Motion Design (100 % Code)

Système quotidien à **2 Agents IA + Voix Humaine** pour produire un bulletin d'actualité mondiale impartial, expliqué pour les Québécois, avec un **Canevas d'émission constant** et des **scènes de Motion Design originales codées sur mesure** chaque jour.

---

## Architecture Quotidienne (Pipeline en 3 étapes)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 — AMONT : GEMINI HYDROGEN (Salle de rédaction)                   │
│  • Lance `node 1-amont-gemini-hydrogen/collect-news.mjs`                 │
│  • Sélectionne 3 nouvelles mondiales majeures + photos Wikimedia Commons │
│  • Croise les sources (Point de vue A vs Point de vue B)                 │
│  • Génère `episodes/YYYY-MM-DD/storyboard.json` + `teleprompteur.md`     │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 — AVAL : OPUS 5.5 (Studio Motion Design 100 % Code)              │
│  • Lit `episodes/YYYY-MM-DD/storyboard.json`                             │
│  • Garde intact le Canevas de l'émission (`studio/broadcast-canvas.js`)  │
│  • Code les animations sur mesure du jour dans                           │
│    `episodes/YYYY-MM-DD/scenes-custom.js` (16:9 YouTube & 9:16 Facebook) │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 3 — VOIX & EXPORT MP4 (Vous)                                       │
│  • Ouvrez le Studio Web (`node server.mjs` → http://localhost:4321)      │
│  • Lisez le téléprompteur synchronisé et déposez votre fichier voix      │
│    (`episodes/YYYY-MM-DD/voix.m4a` ou `.wav` / `.mp3`)                   │
│  • Exportez en `.mp4` 1080p via `node export-video.mjs`                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Structure du Projet

- `studio/`
  - `index.html` : Interface Studio (Aperçu 16:9 & 9:16, Téléprompteur synchronisé, Lecteur/Enregistreur Voix, Contrôles par scène).
  - `broadcast-canvas.js` : **Le Canevas fixe de l'émission** (Charte graphique « Studio Boréal », En-tête TV, Progression des chapitres, Bandeau Sources vérifiées, Sous-titres dynamiques, Attribution Wikimedia Commons).
  - `studio-app.js` : Logique de contrôle du Studio Web, synchronisation audio/voix et téléprompteur.
- `episodes/2026-11-14/` *(Épisode pilote complet prêt à tester)*
  - `storyboard.json` : Contrat de passage structuré produit par Gemini Hydrogen.
  - `scenes-custom.js` : Les 5 scènes de Motion Design codées sur mesure pour cet épisode (Radar maritime, Balance d'impartialité A/B, Courbe inflation & panier d'épicerie QC, Réseau énergétique IA × Hydro-Québec, Débat Facebook/YouTube).
  - `teleprompteur.md` : Script formaté prêt à lire au micro avec repères de ton et de temps.
- `1-amont-gemini-hydrogen/`
  - `collect-news.mjs` : Collecteur RSS mondial (Reuters/BBC/AFP/AP/ONU) + chercheur d'images libres de droits sur **Wikimedia Commons** (avec licence et auteur).
  - `PROMPT_GEMINI_HYDROGEN.md` : Prompt prêt à copier-coller pour Gemini Hydrogen chaque matin.
- `2-aval-opus-motion/`
  - `PROMPT_OPUS_5_5.md` : Prompt prêt à copier-coller pour Opus 5.5 afin qu'il code `scenes-custom.js` dans le canevas de l'émission.
- `server.mjs` : Serveur local léger pour ouvrir le Studio et le Téléprompteur.
- `export-video.mjs` : Exporteur vidéo `.mp4` 100 % en code (via Chrome Headless + `FFmpeg` `h264_videotoolbox`) qui fusionne automatiquement votre voix.
