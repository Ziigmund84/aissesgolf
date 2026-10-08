# Consignes pour Claude Code

Projet : site vitrine statique du golf Les Aisses. Une seule page, en français uniquement pour l'instant.

## Règles de design à respecter
- Ton haut de gamme, sobre, « golf classe » : pas d'emoji, pas de bandeau défilant, pas d'étoiles décoratives.
- Aucun arrondi (`border-radius: 0` partout) : boutons et cadres rectangulaires.
- Accent bronze `#A57A43` uniquement ; fond `#121212`.
- Organda pour les titres et le menu. Ne pas remplacer cette police.
- « Réserver » reste un lien du menu (https://aisses.l.netgolf.fr/), pas un bouton dans l'accueil.
- L'accueil = uniquement la photo, le nom du parcours et la pagination.

## Technique
- Pas de framework ni de build : HTML/CSS/JS natifs. Garder ce choix sauf demande explicite.
- Polices auto-hébergées dans `assets/fonts/` (pas d'appel à Google Fonts, pour le RGPD).
- Images en WebP dans `assets/img/`.
- Les animations au défilement utilisent `animation-timeline: view()` dans un bloc `@supports` : sans support, le contenu reste simplement visible.
- Respecter `prefers-reduced-motion`.
