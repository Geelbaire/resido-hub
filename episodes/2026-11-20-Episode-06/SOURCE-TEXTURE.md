# Cartographie et typographie

La Terre utilise la texture Earth Day Map de Solar System Scope et INOVE,
8192 × 4096 px en projection équirectangulaire, licence CC BY 4.0.
[Texture et attribution](https://www.solarsystemscope.com/textures/) · [Licence](https://creativecommons.org/licenses/by/4.0/)

Le globe de cet épisode est rendu en **perspective réelle** par un shader WebGL2
(`globe.js`) : caméra orbitale avec altitude, inclinaison et cap, lancer de rayon
sur la sphère, diffusion atmosphérique de type Rayleigh au limbe et dans le halo
externe, reflet océanique. Les arcs, repères, frontières et fleuves sont projetés
par la même caméra en JavaScript.

Frontières nationales : Natural Earth 1:50 000 000 (`assets/countries.js`, repris
de l’épisode 04). Hydrographie (Dniepr, Saint-Laurent, Outaouais) : Natural Earth,
Rivers and Lake Centerlines 1:10 000 000. Limites du Québec : Natural Earth admin-1.
[Natural Earth](https://www.naturalearthdata.com/)

Montserrat et IBM Plex Mono sont distribuées sous SIL Open Font License.
Les textes de licence sont dans `assets/`.

Kiev de nuit, la cale sèche de Lévis, le coffre d’épargne, le corridor numérique,
les documents (projet d’accord de la COP31, garanties pour Kyiv, dossiers France 24),
l’organigramme et l’hémicycle sont des illustrations vectorielles originales
dessinées en code pour cet épisode. Ce sont des reconstitutions explicatives,
pas des documents ni des plans réels.
