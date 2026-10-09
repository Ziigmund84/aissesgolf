# Administration du site · mise en route

L'administration se trouve à l'adresse **/admin/** du site (par exemple `https://votre-site/admin/`).
Elle permet de :

- changer les photos de l'accueil, leur ordre, et indiquer pour chacune « Les Aisses » ou « La Canne » ;
- mettre en ligne le PDF du menu du jour et celui de la carte du restaurant ;
- modifier les tarifs des green-fees ;
- modifier la longueur de chaque trou pour chaque départ (noir, blanc, jaune, bleu, rouge), ainsi que le par et le handicap : les totaux se recalculent automatiquement ;
- ajouter, modifier, réordonner ou supprimer les hébergements (photo, nom, étiquette, lien) ;
- ajouter, supprimer et réordonner les photos de la galerie Médias, avec leurs légendes.

Les modifications sont visibles sur le site **immédiatement**, en français comme en anglais.

Les contenus et les fichiers sont gardés par **Supabase**, un service en ligne gratuit pour un site de cette taille. Tant que Supabase n'est pas configuré, le site affiche simplement le contenu écrit dans les fichiers.

---

## Mise en route

### Déjà fait

- Projet Supabase **les-aisses-golf** créé dans votre organisation « Ziigmund », région Paris : https://supabase.com/dashboard/project/cyhjmsrgccwtpkqoqxhu
- Base installée avec le contenu actuel du site (fichier `supabase/schema.sql`), règles de sécurité vérifiées : tout le monde peut lire, seul jerome.millier@yahoo.fr peut modifier.
- `js/config.js` contient déjà l'adresse du projet et sa clé publique.

Il reste trois réglages à faire dans le tableau de bord Supabase, puis l'envoi sur GitHub.

### 1. Fermer les inscriptions et indiquer l'adresse du site

1. **Authentication** → **Sign In / Providers** (ou *Providers*) → **Email** : désactivez **Allow new users to sign up**. Personne d'autre ne pourra créer de compte.
2. **Authentication** → **URL Configuration** :
   - *Site URL* : l'adresse de votre site (par exemple `https://votre-nom.github.io/les-aisses-golf/`).
   - *Redirect URLs* : ajoutez l'adresse de l'administration, par exemple `https://votre-nom.github.io/les-aisses-golf/admin/`.

### 2. Envoyer le site sur GitHub

Décompressez le dossier par-dessus votre dossier actuel, puis demandez à Claude Code d'envoyer les modifications sur GitHub.

### 3. Créer le compte administrateur et choisir le mot de passe

1. Dans Supabase : **Authentication** → **Users** → **Add user** → **Send invitation** → `jerome.millier@yahoo.fr`.
2. Un e-mail arrive sur cette adresse. Cliquez sur le lien : vous arrivez sur l'administration, sur l'écran **Choisir un mot de passe**.
3. Choisissez un mot de passe d'au moins 12 caractères. Vous êtes connecté.

Le mot de passe n'est connu que de vous : il ne passe ni par Claude ni par les fichiers du site.

---

## Au quotidien

- Connexion : `https://votre-site/admin/`, avec l'adresse e-mail et le mot de passe.
- **Mot de passe oublié** : sur l'écran de connexion, saisissez l'adresse e-mail puis cliquez sur *Mot de passe oublié ou première connexion ?*. Un lien arrive par e-mail.
- Photos : envoyez directement les photos de l'appareil ou du téléphone. Elles sont réduites et converties automatiquement pour rester légères.
- Supprimer : cliquez une première fois sur *Supprimer*, puis sur *Confirmer ?* dans les 3 secondes.
- Réordonner : faites glisser l'élément par la poignée ⠿, ou utilisez les flèches ↑ ↓.

## Ajouter un autre administrateur

Dans Supabase, **SQL Editor** :

```sql
insert into public.admins (email) values ('autre.adresse@exemple.fr');
```

Puis invitez cette adresse comme à l'étape 3.

## Bon à savoir

- Les e-mails d'invitation et de mot de passe oublié sont envoyés par Supabase, en anglais par défaut. Vous pouvez les traduire dans **Authentication** → **Email Templates**. Le service d'e-mail intégré à Supabase est limité à quelques envois par heure, ce qui suffit pour un seul administrateur.
- Sur l'offre gratuite, Supabase peut mettre en pause un projet resté longtemps inactif. Dans ce cas, le site continue d'afficher son contenu d'origine, et il suffit de relancer le projet depuis le tableau de bord Supabase.
- Les photos d'origine restent dans `assets/img/`. Celles que vous ajoutez depuis l'administration sont stockées dans Supabase.
