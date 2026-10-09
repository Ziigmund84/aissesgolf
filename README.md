# Les Aisses Golf · site one-page

Nouveau site vitrine du golf des Aisses (La Ferté-Saint-Aubin, Loiret). Site statique en une seule page, en français et en anglais : HTML, CSS et JavaScript, sans framework ni étape de build.

## Structure

```
index.html            la page en français (toutes les sections)
en/index.html         la page en anglais (mêmes sections, mêmes fichiers CSS/JS/images)
css/style.css         styles ; couleurs et polices en variables dans :root
js/main.js            diaporama de l'accueil, saison en cours, statut ouvert/fermé, carte de score, galerie
js/contenu.js         charge les contenus modifiés depuis l'administration (Supabase)
js/config.js          adresse et clé publique Supabase
admin/                interface d'administration (voir ADMIN.md)
supabase/schema.sql   base de données de l'administration
assets/fonts/         polices auto-hébergées (Organda, Rubik, Montserrat, Playfair Display)
assets/img/           photos (WebP) et logos
```

## Voir le site en local

Ouvrir `index.html` dans un navigateur, ou lancer un petit serveur :

```
python3 -m http.server 8000
```

puis aller sur http://localhost:8000

## Charte

- Fond anthracite `#121212`, accent bronze `#C29257`, texte blanc et gris clairs.
- Titres et menu : **Organda** (police historique du golf). Texte : **Rubik**. Libellés : **Montserrat**. Citations : **Playfair Display** italique. Mot « SOLOGNE » : **Organda** épaissi par un contour.
- Aucun angle arrondi.

## Deux langues

Chaque modification de contenu doit être faite dans **les deux fichiers** : `index.html` (français) et `en/index.html` (anglais). Les drapeaux en haut à droite passent de l'un à l'autre. Les textes générés par le script (statut d'ouverture, « Parcours / Course »…) sont dans l'objet `T` en haut de `js/main.js`.

## Administration

Les photos de l'accueil, les PDF du restaurant, les tarifs, les hébergements et la galerie se modifient depuis `/admin/`. Mise en route : **ADMIN.md**. Une fois Supabase configuré, ce sont les données de l'administration qui s'affichent, et non plus le contenu écrit en dur dans les fichiers HTML pour ces sections.

## Modifications courantes

| Je veux… | Où |
|---|---|
| Changer les distances, par ou handicaps | `js/main.js`, objet `PARCOURS` (carte de score) |
| Changer la couleur ou le nom d'un repère | `js/main.js` : tableau `REPERES` (couleurs) et `reperes` dans l'objet `T` (noms français et anglais) |
| Changer les tarifs | `index.html`, section `id="tarifs"` (deux tableaux) |
| Changer une photo de l'accueil ou son parcours | `index.html`, section `id="accueil"` : `src`, `alt` et `data-parcours` de chaque `.slide` |
| Changer les horaires | `js/main.js`, objet `HORAIRES` en haut du fichier |
| Changer les dates de saison | `js/main.js` (ligne « Saison en cours ») et le texte de la section tarifs |
| Changer les couleurs | `css/style.css`, variables dans `:root` |
| Ajouter une image dans Médias | `index.html` et `en/index.html`, section `id="medias"` : dupliquer un `<li>`. Les vignettes sont répétées automatiquement par `js/main.js` pour remplir la largeur ; la lightbox ne parcourt que les images uniques |

## Reste à compléter

- Hébergeur dans les mentions légales.
- Nom du photographe dans les crédits.
- Vérifier quelles photos de l'accueil montrent Les Aisses ou La Canne (`data-parcours`).
- Photos des hôtels en meilleure définition (les actuelles font 272 px de large).
- Le plat du jour, la carte, les tarifs d'abonnement et le film pointent encore vers les fichiers de l'ancien site (aissesgolf.com/images/…) : les rapatrier dans `assets/` avant de couper l'ancien site.

## Publication

Les fichiers HTML ne contiennent volontairement aucun commentaire (le code source est visible par les visiteurs) : les explications sont dans ce README. Le titre de l'accueil (nom du parcours), la carte de score et la mise en avant de la saison en cours sont générés par `js/main.js`.

Sur GitHub Pages, `_config.yml` empêche la publication des fichiers internes (`ADMIN.md`, `CLAUDE.md`, `README.md`, `supabase/`). Ils restent visibles dans le dépôt GitHub lui-même s'il est public.

Le site peut être publié tel quel sur GitHub Pages, Netlify, ou l'hébergement actuel (LWS) en copiant les fichiers à la racine.
