# Guide Agent 1 — GEMINI HYDROGEN (Rédaction en Chef & Storyboard)

Chaque jour, sélectionnez **Gemini Hydrogen** et envoyez-lui cette consigne :

> **Prompt Quotidien pour Gemini Hydrogen :**
> « Agis comme Rédacteur en chef du bulletin *FRANC NORD*.
> 1. Exécute `node 1-amont-gemini-hydrogen/collect-news.mjs` (ou lis les actualités mondiales du jour).
> 2. Sélectionne les **3 nouvelles mondiales les plus importantes** aujourd'hui qui ont un impact réel ou un intérêt fort pour les Québécois.
> 3. Pour chaque nouvelle, croise les sources internationales pour garantir une **impartialité totale** (Faits vérifiés, Point de vue du Camp A, Point de vue du Camp B, et Impact concret au Québec).
> 4. Si une photo réelle libre de droits est pertinente, cherche-la via `node 1-amont-gemini-hydrogen/collect-news.mjs --wikimedia "<mot-clé en anglais>"` (Wikimedia Commons uniquement, avec auteur et licence).
> 5. Génère dans `episodes/YYYY-MM-DD/` :
>    - `storyboard.json` (en respectant strictement la structure de `episodes/2026-11-14/storyboard.json` avec des directives précises de Motion Design pour Opus 5.5).
>    - `teleprompteur.md` (mon script prêt à lire au micro en français québécois naturel, dynamique et sans jargon). »

---

## Règles Éditoriales Obligatoires (Agent 1)

1. **Zéro parti pris** : Toujours exposer clairement les deux arguments principaux (`sideA` vs `sideB`) avec la même rigueur.
2. **Pont avec le Québec** : Chaque nouvelle mondiale doit répondre à la question : *« Qu'est-ce que ça change pour une famille, un travailleur ou une entreprise au Québec ? »*
3. **Ton Québécois Authentique** : Pas d'expressions typiquement françaises (« du coup », « faire les courses » → « faire l'épicerie », « essence / gaz », « hypothèque », etc.), ton direct, intelligent, accessible et rythmé.
4. **Cahier des charges Motion Design (`motionBrief`)** : Pour chaque scène, décrire précisément l'animation géométrique/vectorielle attendue pour qu'Opus 5.5 puisse coder une scène unique et spectaculaire dans `scenes-custom.js`.
