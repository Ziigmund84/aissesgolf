# Les Aisses Golf · site one-page

Nouveau site vitrine du golf des Aisses (La Ferté-Saint-Aubin, Loiret). Site statique en une seule page, en français : HTML, CSS et JavaScript, sans framework ni étape de build.

## Structure

```
index.html            la page (toutes les sections)
css/style.css         styles ; couleurs et polices en variables dans :root
js/main.js            diaporama de l'accueil, saison en cours, statut ouvert/fermé
assets/fonts/         polices auto-hébergées (Organda, Rubik, Montserrat, Playfair Display, Anton)
assets/img/           photos (WebP) et logos
```

## Voir le site en local

Ouvrir `index.html` dans un navigateur, ou lancer un petit serveur :

```
python3 -m http.server 8000
```

puis aller sur http://localhost:8000

## Charte

- Fond anthracite `#121212`, accent bronze `#A57A43`, texte blanc et gris clairs.
- Titres et menu : **Organda** (police historique du golf). Texte : **Rubik**. Libellés : **Montserrat**. Citations : **Playfair Display** italique. Mot « SOLOGNE » : **Anton**.
- Aucun angle arrondi.

## Modifications courantes

| Je veux… | Où |
|---|---|
| Changer les tarifs | `index.html`, section `id="tarifs"` (deux tableaux) |
| Changer une photo de l'accueil ou son parcours | `index.html`, section `id="accueil"` : `src`, `alt` et `data-parcours` de chaque `.slide` |
| Changer les horaires | `js/main.js`, objet `HORAIRES` en haut du fichier |
| Changer les dates de saison | `js/main.js` (ligne « Saison en cours ») et le texte de la section tarifs |
| Changer les couleurs | `css/style.css`, variables dans `:root` |

## Reste à compléter

- Hébergeur dans les mentions légales.
- Nom du photographe dans les crédits.
- Vérifier quelles photos de l'accueil montrent Les Aisses ou La Canne (`data-parcours`).
- Photos des hôtels en meilleure définition (les actuelles font 272 px de large).
- Le plat du jour, la carte, les tarifs d'abonnement et le film pointent encore vers les fichiers de l'ancien site (aissesgolf.com/images/…) : les rapatrier dans `assets/` avant de couper l'ancien site.

## Publication

Le site peut être publié tel quel sur GitHub Pages, Netlify, ou l'hébergement actuel (LWS) en copiant les fichiers à la racine.
