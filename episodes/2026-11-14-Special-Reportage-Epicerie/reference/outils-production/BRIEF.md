# FRANC NORD — Spécial Reportage « Épicerie sous algorithme » — BRIEF COMMUN MOTION DESIGN

Tu codes UNE scène (Canvas 2D, 100 % code) d'un reportage d'enquête de 7 min 29 s, au standard
« une coche au-dessus d'Apple News+ / Apple Keynote ». Le directeur artistique (moi) a attribué à
chaque scène un DISPOSITIF VISUEL UNIQUE : respecte le tien, n'emprunte pas celui des autres.

## Fichiers
- Dossier de travail : `/private/tmp/claude-501/-Volumes-Projets-FRANC-NORD/e0e964de-b739-4c8c-86dd-e574990e88e0/scratchpad/build/` (= BUILD)
- Moteur commun (NE PAS MODIFIER) : `BUILD/00-engine.js` — lis-le en entier avant de coder (≈1 900 lignes).
- Ta scène : `BUILD/scenes/NN-<scene-id>.js` (fragment JS sans import/export).
- Storyboard synchronisé : `/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Special-Reportage-Epicerie/storyboard.json`
  (`scene.narration`, `scene.duration` réelle, `scene.wordTimes` = minutage de chaque mot de la voix).
- Charte (images) : `/private/tmp/claude-501/-Volumes-Projets-FRANC-NORD/e0e964de-b739-4c8c-86dd-e574990e88e0/scratchpad/charte/*.jpg`
- Exemple de qualité (épisode 3, même moteur) : `/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Episode-03/scenes-custom.js` (scènes à partir de la ligne 1943). Inspire-toi de la rigueur, PAS des dispositifs.

## Contrat du fragment
```js
// helpers locaux : TOUS préfixés par ton préfixe unique (ex. s07_), y compris les const de niveau supérieur
function s07_cage(ctx, ...) { ... }
const S07_UNITS = [...];
function sceneBauxSecrets(a) {          // nom de la fonction principale : sceneXxx unique
  const { ctx, stage, localTime: lt, globalTime: gt, scene, isVertical: V } = a;
  const { w, h, cx, cy } = stage;
  const m = Math.min(w, h);              // = 1080 dans les deux formats
  const T = cues(scene, { clef: 'expression exacte de la narration', ... }); // secondes locales
  frame(a, () => { /* dessin */ });     // fondu d'entrée/sortie + vignettage + grain
}
/*@scene rep-baux-secrets-concurrence=sceneBauxSecrets*/
```
- Le marqueur final `/*@scene <id>=<fonction>*/` est OBLIGATOIRE (dernière ligne).
- Aucun identifiant de niveau supérieur sans ton préfixe (sauf la fonction sceneXxx). Aucune redéfinition
  d'un nom du moteur. Pas d'`import`/`export`.
- `cues()` : chaque expression doit exister TELLE QUELLE dans `scene.narration` (accents, apostrophes
  typographiques ’ vs ' — copie-colle depuis le storyboard). `'expr#2'` = 2e occurrence. Le banc
  signale toute expression introuvable (bloquant).

## Règles absolues (tolérance zéro)
1. ZÉRO TEXTE QUI TREMBLE : n'utilise JAMAIS `ctx.fillText`, `ctx.strokeText` ni `ctx.font` dans ta scène.
   Tout texte passe par `kRise`, `kSlide`, `kWipe`, `kZoom`, `kWords`, `mono`, `odometer`, `cityTag`, ou
   `drawSprite(ctx, textSprite(...), x, y, {scale})`. La `size` d'un texte est une constante par format
   (ex. `Math.floor(m * 0.06)`) — jamais une valeur qui dépend du temps, d'une caméra ou d'un `fitSize`
   recalculé avec un `maxW` variable. Pour grossir/rétrécir un texte : `scale` de `drawSprite`, `kZoom`
   ou une caméra (`camera()` / `ctx.scale`). Aucun `Math.round/floor/ceil` sur une position en mouvement.
   Pendant un plan fixe, un texte ne dérive pas de 0,3 px par seconde : soit il est immobile, soit il
   bouge franchement (travelling de caméra assumé).
2. ZÉRO CHEVAUCHEMENT, ZÉRO TEXTE COUPÉ, en 16:9 (1920×1080) ET en 9:16 (1080×1920). Mise en page
   spécifique au vertical (`V`) : empile verticalement, ne te contente pas de réduire. Utilise `maxW`
   (constant) pour qu'un titre tienne toujours en largeur.
3. ZONES RÉSERVÉES (aucun texte, aucun élément important) :
   - haut-gauche (marque FRANC NORD) : x < 600 et y < 130 ;
   - bas-gauche (ligne SOURCES) : y > h − 64 sur la moitié gauche ;
   - bas-droite (filigrane YouTube) : x > w − 300 et y > h − 220 (16:9) ; x > w − 240 et y > h − 300 (9:16) ;
   - 9:16 : garde les textes au-dessus de 0,87·h (légende Shorts/Reels) et évite le bord droit (x > 0,9·w).
4. CHAQUE TEXTE EST ANIMÉ AVEC BEAUTÉ : masque de découpe, glissement amorti, balayage avec arête lumineuse,
   compteur à rouleaux pour TOUS les chiffres-chocs, soulignement qui se trace, lueur anodisée. 2 à 6 mots par
   groupe typographique. Hiérarchie d'affiche : un titre fort, un sur-titre mono discret, un chiffre monumental.
5. SYNCHRONISATION AU MOT : chaque élément apparaît sur le mot exact qui le nomme (via `cues`). Le visuel
   illustre précisément CHAQUE phrase de la narration, dans l'ordre, seconde par seconde. Pas de décor générique.
6. CAMÉRA : au moins 3 mouvements de caméra fluides et motivés (travelling, zoom exponentiel, parallaxe
   multi-plans, bascule 2.5D) et 3 actes visuels distincts calés sur la narration. Easing C2-continus
   (`eInOutQuart`, `eOutExpo`, `smoother`, `track()`). Aucune coupure sèche à l'intérieur de la scène : les
   actes se fondent (enveloppes `env()`), la caméra enchaîne.
7. PALETTE : fond #030509 ; Boreal Cyan #38BDF8 ; Editorial Amber #F59E0B ; Pure Slate #E5E7EB ; blanc #F8FAFC ;
   Émeraude #10B981 (positif/consommateur) ; rouge/corail #F43F5E/#FB7185 avec parcimonie (alerte).
   Typo : Montserrat 800–900 (titres, `DISPLAY`), IBM Plex Mono (données, `MONO`). Constantes `C.*` du moteur.
8. INTERDITS : musique/son ; tableaux de bord en boîtes empilées façon web ; bandeau défilant ; logos de marques
   réelles (écris les noms de bannières en typographie neutre) ; chiffres inventés absents de la narration
   (les valeurs d'illustration comme un prix 4,99 $ → 5,79 $ du brief sont permises si marquées comme exemple
   ou évidentes) ; texte de plus de ~6 mots d'un bloc.
9. PERFORMANCE : le rendu d'une image doit rester < 60 ms. Mets en cache (`cached()` + `makeCanvas`) les couches
   statiques coûteuses ; pas de `shadowBlur` > 30 sur des centaines d'objets ; pas de boucle de plus de ~15 000
   éléments par image.
10. DÉTERMINISME : aucun `Math.random()` / `Date.now()` — utilise `rng(seed)` du moteur et le temps fourni.

## Moteur (00-engine.js) — l'essentiel
Maths : `clamp lerp seg smooth smoother eOutCubic eOutQuint eOutExpo eInExpo eInCubic eInOut eInOutQuart eInOutExpo eOutBack spring env rng cached track trackV` ; `D2R TAU`.
Couleur : `C` (palette), `rgba(hex,a)`, `mix(h1,h2,t)`.
Lumière : `light(ctx,x,y,r,color,a)` (lueur additive), `flare`, `dust(ctx,stage,time,{...})`, `vignette`, `grain`, `frame(a, draw)`.
Typo sans tremblement : `textSprite(text,{size,weight,fam,color,spacing,glow,glowColor,res})`, `drawSprite(ctx,S,x,y,{align,base,alpha,scale,sx,sy})`,
`kRise` (lettres qui montent d'un masque), `kSlide` (bloc qui glisse d'un masque, dir up/down/left/right), `kWipe` (balayage + arête lumineuse),
`kZoom` (se pose depuis une échelle), `kWords(ctx, words, x, y, {time, times:[s…]})`, `mono` (terminal IBM Plex), `odometer(ctx,value,x,y,{size,dec,suffix,prefix})` (compteur à rouleaux),
`frNum`, `underline(ctx,x,y,w,t,{colorA,colorB,align})`, `fitSize` (à appeler avec un maxW CONSTANT).
Options communes des k* : `{ t (0→1 entrée), out (0→1 sortie), alpha, align, size, weight, color, glow, glowColor, maxW, spacing }`.
Motifs : `chevrons`, `ring`, `shockwave`, `beacon`, `arrowHead`, `emblem(ctx,x,y,r,{star,ringT,needle,cardinals,alpha,time,swing})` (boussole FRANC NORD),
`camera(ctx,stage,fx,fy,zoom,fn,rot)`, `camPt`, `glowPath(ctx,pts,t,{color,width})`, `quadPts`, `along`, `rrect`, `photoCard`, `person`, `shield`, `shieldPath`.
Géographie : `LAND`, `QUEBEC`, `isLand`, `worldDots`, `makeGlobe`, `drawGlobe`, `globeFrom`, `globeTrack`, `arcPts`, `smoothPath`, `trail`, `makeFlat`, `drawQuebec`,
`PLACES`/`P(k)` (quebec, montreal, ottawa, gatineau, sherbrooke, troisRivieres, rimouski, saguenay, septIles, rouyn, gaspe, baieComeau, valdor, drummondville,
toronto, newYork, albany, hartford, trenton, annapolis, baltimore, boston, philadelphia, washington…), `regionDots`, `quebecDots`, `makeTilt` (carte inclinée 2.5D),
`drawDots`, `polyStroke`, `cityTag`.

## Banc d'essai (OBLIGATOIRE, à répéter jusqu'à perfection)
```sh
cd BUILD && node qa-render.mjs --frag scenes/NN-<id>.js --scenes <scene-id> --out qa/NN --port <TON_PORT>
# temps précis : --times 2.5,7.1,12   ·   un seul format : --formats 9x16
```
Sortie : PNG plein format + planches contact `qa/NN/<id>_16x9_PLANCHE.jpg` et `_9x16_PLANCHE.jpg` (ordre : de gauche à
droite, haut en bas = temps croissants), + résumé JSON (exceptions, repères introuvables, HORS-CADRE, CHEVAUCHEMENT, ZONE-*).
REGARDE les planches ET plusieurs PNG plein format (outil Read) dans les deux formats. Corrige tout ce qui n'est pas
parfait : composition, lisibilité, hiérarchie, équilibre, élégance. L'analyse automatique ne voit que les textes : juge
toi-même les formes (pas de forme coupée bêtement, pas d'élément qui passe sous un texte).
Contrôle aussi la synchronisation : rends aux temps de tes repères (+0,3 s, +1 s) pour vérifier que l'élément nommé
est bien visible quand la voix le prononce.
