# Consignes pour Claude Code

Projet : site vitrine statique du golf Les Aisses. Une seule page, en français (`index.html`) et en anglais (`en/index.html`).
Toute modification de contenu ou de structure doit être reportée dans les deux langues.

## Règles de design à respecter
- Ton haut de gamme, sobre, « golf classe » : pas d'emoji, pas de bandeau défilant, pas d'étoiles décoratives.
- Aucun arrondi (`border-radius: 0` partout) : boutons et cadres rectangulaires.
- Accent bronze `#C29257` uniquement ; fond `#121212`.
- Organda pour les titres et le menu. Ne pas remplacer cette police.
- « Réserver » reste un lien du menu (https://aisses.l.netgolf.fr/), pas un bouton dans l'accueil.
- L'accueil = uniquement la photo, le nom du parcours et la pagination.

## Git
- Une seule branche : `main`. Commiter et pousser directement sur `main` (le site GitHub Pages se met à jour automatiquement). Ne pas créer d'autre branche ni de pull request.

## Technique
- Pas de framework ni de build : HTML/CSS/JS natifs. Garder ce choix sauf demande explicite.
- Polices auto-hébergées dans `assets/fonts/` (pas d'appel à Google Fonts, pour le RGPD).
- Images en WebP dans `assets/img/`.
- Les animations au défilement utilisent `animation-timeline: view()` dans un bloc `@supports` : sans support, le contenu reste simplement visible.
- Respecter `prefers-reduced-motion`.
- Aucun commentaire dans les fichiers HTML (visibles via « Afficher le code source ») : documenter dans README.md.
- Tout fichier interne ajouté (notes, scripts, SQL) doit être ajouté à `exclude` dans `_config.yml` pour ne pas être publié.

## Administration (Supabase)
- `admin/` : interface d'administration ; `js/contenu.js` remplace dans la page les sections administrables (accueil, PDF, tarifs, hébergements, galerie) par les données Supabase.
- Les éléments remplacés sont repérés par `data-slides`, `data-pdf`, `data-prix`, `data-hebergements`, `data-galerie` : conserver ces attributs dans les deux langues.
- `js/main.js` démarre après `window.AISSES_CONTENU` : ne pas casser cet ordre.
- Ne jamais mettre la clé `service_role` dans le dépôt ; seule la clé `anon` va dans `js/config.js`.
- Toute nouvelle table doit avoir la sécurité RLS « lecture publique / écriture admin » comme dans `supabase/schema.sql`.
