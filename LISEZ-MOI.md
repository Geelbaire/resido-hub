# Résido

Hub résidentiel de Gilbert, conçu pour un iPad 4 (A1458, iOS 10.3.3, Safari 10.1).
Une seule page web, sombre et sobre, qui affiche l'heure, la date et la météo de
Saint-Raymond.

## Ce que la page fait

- **Heure et date** en français, au format québécois (`14 h 32`).
- **Météo** d'Open-Meteo, la même source que Giboul, avec les mêmes libellés :
  température, conditions, maximum et minimum du jour, prochaine précipitation
  probable, courbe des 12 prochaines heures, lever et coucher du soleil, trois
  jours de prévisions.
- **Lueur d'horizon** au bas de l'écran, qui suit le ciel réel : aube, jour,
  crépuscule, nuit (calculés avec le lever et le coucher du soleil du jour).
- **Mode veille** de 22 h à 6 h : l'heure seule, en ambre, avec la température.
  Un toucher sur l'écran réaffiche tout pendant 30 secondes.
- **Hors ligne** : la dernière météo reçue reste affichée, avec l'heure de sa
  réception lorsqu'elle a plus de 90 minutes.
- **Actualité** : un titre à la fois au-dessus de la courbe, qui change toutes
  les 20 secondes (région, techno, IA, pop). Un toucher sur le titre ouvre
  l'écran Actualité ; il se referme d'un toucher ou seul après 90 secondes.

Les réglages (lieu, heures de veille, fréquences) sont en haut du script, dans
`REGLAGES`, dans `index.html`.

## Sobriété

- L'écran de l'iPad 4 est un LCD rétroéclairé : un pixel noir consomme presque
  autant qu'un pixel blanc, contrairement à un écran OLED. Le fond sombre sert
  surtout au confort et permet de baisser la luminosité. **Ce qui économise
  vraiment l'énergie, c'est la luminosité de l'iPad.**
- La page ne fait presque rien : l'heure change une fois par minute, la météo
  se met à jour toutes les 30 minutes, aucune animation continue.
- Toutes les 15 minutes, la page se déplace de quelques pixels pour éviter la
  rémanence de l'écran. Elle se recharge une fois par nuit, à 3 h 30.

## Tester sur l'iPad avec le Mac (réseau local)

Le Mac et l'iPad doivent être sur le même Wi-Fi. Dans le Terminal du Mac :

```sh
cd "/Volumes/Projets/Developer/DEV/Dev2026/PROJETS PERSONNELS/RESIDO"
echo "Sur l'iPad, ouvre : http://$(ipconfig getifaddr en0):8080/"
python3 -m http.server 8080
```

Si macOS demande d'autoriser les connexions entrantes pour Python, accepte.
Ouvre l'adresse affichée dans Safari sur l'iPad. Pour arrêter le serveur :
Ctrl-C dans le Terminal.

Ce test confirme aussi que l'iPad accepte le certificat d'Open-Meteo : si la
météo s'affiche, le réseau fonctionne.

## Publier sur resido.ca (GitHub Pages)

Le site est hébergé par GitHub Pages, dans le dépôt public
`Geelbaire/resido-hub` (le dépôt `Geelbaire/resido` appartient à l'ancien
projet). Une tâche GitHub (`.github/workflows/publier.yml`) publie le site à
chaque `git push` et toutes les 30 minutes, avec l'actualité du moment.

Les DNS de resido.ca sont gérés chez GoDaddy depuis le 2 novembre 2026 :
quatre enregistrements A pour `@` (`185.199.108.153` à `185.199.111.153`) et
un CNAME `www` vers `geelbaire.github.io`.

1. Première mise en ligne, dans le Terminal du Mac :

   ```sh
   cd "/Volumes/Projets/Developer/DEV/Dev2026/PROJETS PERSONNELS/RESIDO"
   rm -f .github/workflows/test.yml
   mkdir -p .github/workflows
   mv publier.yml .github/workflows/publier.yml
   gh auth switch --user Geelbaire
   git init -b main
   git add .
   git commit -m "Résido : première version du hub"
   gh repo create Geelbaire/resido-hub --public --source . --push
   gh api -X POST repos/Geelbaire/resido-hub/pages -f build_type=workflow
   gh api -X PUT repos/Geelbaire/resido-hub/pages -f cname=resido.ca
   gh workflow run publier.yml --repo Geelbaire/resido-hub
   ```

   La toute première exécution (déclenchée par le push, avant l'activation de
   Pages) peut échouer : c'est normal, la dernière commande la relance.

2. Quand GitHub a émis le certificat (de quelques minutes à quelques heures),
   forcer le HTTPS :

   ```sh
   gh api -X PUT repos/Geelbaire/resido-hub/pages -F https_enforced=true
   ```

3. Pour publier une nouvelle version :

   ```sh
   cd "/Volumes/Projets/Developer/DEV/Dev2026/PROJETS PERSONNELS/RESIDO"
   git add .
   git commit -m "Résido : mise à jour"
   git push
   ```

À surveiller : GitHub désactive les tâches planifiées d'un dépôt public après
60 jours sans activité. Si l'actualité cesse de se mettre à jour, la réactiver
dans l'onglet Actions du dépôt, ou publier une petite modification.

## Actualité

`scripts/actualites.py` lit les fils RSS, garde seulement les titres récents
(jamais le texte des articles), alterne les sources et écarte les titres
promotionnels. Sources :

- **Portneuf et Québec** : Courrier de Portneuf, Radio-Canada Québec ;
- **Technologie** : Radio-Canada, La Presse, Numerama ;
- **Intelligence artificielle** : ActuIA, et les titres technos qui parlent d'IA ;
- **Musique pop** : Billboard (pop), Radio-Canada (musique).

Pour changer une source, modifier `SOURCES` dans le script, puis publier.

## Acquit

1. Dans Acquit (iPhone) : Réglages, Écran Résido, Relier un écran. Un code de
   8 caractères s'affiche pendant 10 minutes.
2. Sur l'iPad : toucher « Acquit » en bas à droite, entrer le code, Relier.

Les chiffres viennent du dernier calcul fait par l'app Acquit (l'heure est
affichée) : ouvrir Acquit les met à jour. Rien n'est conservé sur l'iPad à
part le jeton de l'écran. Pour retirer l'accès : Acquit, Réglages, Écran
Résido, Retirer.

## Heure

Résido affiche l'heure de l'iPad. Le gouvernement du Québec a annoncé le
28 octobre 2026 vouloir mettre fin au changement d'heure ; iOS 10 ne recevra
pas cette règle. Si la loi est adoptée, mettre `decalageUTC` à `-5` (heure
normale) ou `-4` (heure avancée) dans `REGLAGES` (`index.html`), puis publier.

## Régler l'iPad

1. Safari : ouvrir l'adresse, bouton Partager, **Sur l'écran d'accueil**.
   Résido s'ouvre alors en plein écran, sans la barre de Safari.
2. **Réglages > Luminosité et affichage > Verrouillage automatique > Jamais.**
3. **Réglages > Général > Accessibilité > Accès guidé** : activer, puis dans
   Résido, triple-clic sur le bouton principal pour verrouiller l'écran sur la
   page.
4. Baisser la luminosité au minimum confortable.

Un iPad de 2012 branché en permanence : surveiller la batterie. Si l'écran se
soulève ou si le dos bombe, débrancher l'iPad.

## Vérifier le code

Le JavaScript est en ES5 et le CSS n'utilise que ce que Safari 10 comprend.
Après une modification :

```sh
cd "/Volumes/Projets/Developer/DEV/Dev2026/PROJETS PERSONNELS/RESIDO"
npm install --no-save acorn@8 && node verifier.js
```

Pour simuler une autre heure dans un navigateur : ajouter `?t=16:25` à
l'adresse.

## Applications de Gilbert

| App | État |
| --- | --- |
| Giboul | Branchée : même source (Open-Meteo) et mêmes libellés. |
| Acquit | Sur demande : le bouton « Acquit » affiche pendant 30 secondes le reste à dépenser, les dépenses de la semaine et les factures des 7 prochains jours. Lecture seule, par jeton propre à l'écran. Demande la version d'Acquit qui contient le réglage « Écran Résido ». |
| PlanifiCal, Health Hub | Retirées du projet : leurs données ne sont pas lisibles par une page web (calendriers iCloud et Google sans accès direct, HealthKit). |

## Licences

Polices Instrument Serif et Geist sous licence SIL Open Font License
(`polices/OFL-*.txt`), réduites aux caractères latins. Données météo :
Open-Meteo (CC BY 4.0), mention affichée sur la page.
