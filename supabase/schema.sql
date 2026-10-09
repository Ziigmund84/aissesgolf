-- =====================================================================
-- Les Aisses Golf · base de données de l'administration (Supabase)
-- À exécuter UNE SEULE FOIS dans Supabase : SQL Editor > New query > coller > Run.
-- Le script est ré-exécutable sans danger (il ne duplique rien).
-- =====================================================================

-- ---------- Administrateurs autorisés ----------
create table if not exists public.admins (
  email text primary key
);
insert into public.admins (email) values ('jerome.millier@yahoo.fr')
  on conflict (email) do nothing;
alter table public.admins enable row level security;
-- Aucune politique de lecture : la liste n'est lisible que via la fonction ci-dessous.

create or replace function public.est_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Réservée aux utilisateurs connectés (les règles de lecture publique n'en ont pas besoin)
revoke execute on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- ---------- Photos de l'accueil ----------
create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  ordre integer not null default 0,
  image text not null,
  parcours text not null default 'Les Aisses' check (parcours in ('Les Aisses', 'La Canne')),
  cree_le timestamptz not null default now()
);

-- ---------- Hébergements (section Séjourner) ----------
create table if not exists public.hebergements (
  id uuid primary key default gen_random_uuid(),
  ordre integer not null default 0,
  nom text not null,
  etiquette_fr text not null default '',
  etiquette_en text not null default '',
  lien text not null default '',
  image text not null default '',
  cree_le timestamptz not null default now()
);

-- ---------- Galerie Médias ----------
create table if not exists public.medias (
  id uuid primary key default gen_random_uuid(),
  ordre integer not null default 0,
  image text not null,
  legende_fr text not null default '',
  legende_en text not null default '',
  video text not null default '',
  cree_le timestamptz not null default now()
);

-- ---------- Réglages divers (tarifs, PDF du restaurant) ----------
create table if not exists public.reglages (
  cle text primary key,
  valeur jsonb not null,
  maj_le timestamptz not null default now()
);

-- ---------- Sécurité : tout le monde lit, seul un admin écrit ----------
do $$
declare t text;
begin
  foreach t in array array['slides', 'hebergements', 'medias', 'reglages'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "lecture publique" on public.%I', t);
    execute format('create policy "lecture publique" on public.%I for select using (true)', t);
    execute format('drop policy if exists "ecriture admin" on public.%I', t);
    execute format('create policy "ecriture admin" on public.%I for all to authenticated using (public.est_admin()) with check (public.est_admin())', t);
  end loop;
end $$;

-- ---------- Stockage des fichiers (photos, PDF) ----------
insert into storage.buckets (id, name, public)
  values ('site', 'site', true)
  on conflict (id) do update set public = true;

drop policy if exists "site lecture publique" on storage.objects;
create policy "site lecture publique" on storage.objects
  for select using (bucket_id = 'site');
drop policy if exists "site ajout admin" on storage.objects;
create policy "site ajout admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'site' and public.est_admin());
drop policy if exists "site modif admin" on storage.objects;
create policy "site modif admin" on storage.objects
  for update to authenticated using (bucket_id = 'site' and public.est_admin());
drop policy if exists "site suppression admin" on storage.objects;
create policy "site suppression admin" on storage.objects
  for delete to authenticated using (bucket_id = 'site' and public.est_admin());

-- =====================================================================
-- Contenu de départ = contenu actuel du site (les images restent dans assets/img
-- tant que vous ne les remplacez pas depuis l'administration).
-- =====================================================================
insert into public.slides (ordre, image, parcours)
select * from (values
  (1, 'assets/img/accueil-1.webp', 'Les Aisses'),
  (2, 'assets/img/accueil-2.webp', 'La Canne'),
  (3, 'assets/img/accueil-3.webp', 'Les Aisses'),
  (4, 'assets/img/accueil-4.webp', 'La Canne'),
  (5, 'assets/img/accueil-5.webp', 'Les Aisses'),
  (6, 'assets/img/accueil-6.webp', 'Les Aisses')
) v(ordre, image, parcours)
where not exists (select 1 from public.slides);

insert into public.hebergements (ordre, nom, etiquette_fr, etiquette_en, lien, image)
select * from (values
  (1, 'L''Orée des Chênes', 'Hôtel ★★★★', 'Hotel ★★★★', 'http://www.loreedeschenes.com/', 'assets/img/hotel-oree-des-chenes.webp'),
  (2, 'Château les Muids', 'Hôtel ★★★★', 'Hotel ★★★★', 'http://www.chateau-les-muids.com/', 'assets/img/hotel-chateau-les-muids.webp'),
  (3, 'Château de la Giraudière', 'Château', 'Château', 'https://www.chateaudelagiraudiere.fr/', 'assets/img/hotel-chateau-giraudiere.webp'),
  (4, 'Relais de Chambord', 'Hôtel', 'Hotel', 'http://relaisdechambord.com', 'assets/img/hotel-relais-chambord.webp'),
  (5, 'Novotel La Source', 'Orléans Sud', 'Orléans South', 'https://www.accorhotels.com/fr/hotel-0419-novotel-orleans-sud-la-source/index.shtml', 'assets/img/hotel-novotel-la-source.webp')
) v(ordre, nom, etiquette_fr, etiquette_en, lien, image)
where not exists (select 1 from public.hebergements);

insert into public.medias (ordre, image, legende_fr, legende_en, video)
select * from (values
  (1,  'assets/img/accueil-1.webp', 'Les Aisses', 'Les Aisses', ''),
  (2,  'assets/img/accueil-2.webp', 'La Canne', 'La Canne', ''),
  (3,  'assets/img/media-trou-8.webp', 'Les Aisses · trou 8', 'Les Aisses · hole 8', ''),
  (4,  'assets/img/accueil-3.webp', 'Les Aisses', 'Les Aisses', ''),
  (5,  'assets/img/club-house.webp', 'Le club-house', 'The clubhouse', ''),
  (6,  'assets/img/accueil-4.webp', 'La Canne', 'La Canne', ''),
  (7,  'assets/img/media-trou-16.webp', 'Les Aisses · trou 16', 'Les Aisses · hole 16', ''),
  (8,  'assets/img/accueil-6.webp', 'Le film du parcours', 'The course film', 'https://www.aissesgolf.com/images/videos/parcours.mp4'),
  (9,  'assets/img/accueil-5.webp', 'Les Aisses', 'Les Aisses', ''),
  (10, 'assets/img/media-la-canne.webp', 'La Canne', 'La Canne', ''),
  (11, 'assets/img/media-trou-14.webp', 'Les Aisses · trou 14', 'Les Aisses · hole 14', ''),
  (12, 'assets/img/parcours-les-aisses.webp', 'Les Aisses vu du ciel', 'Les Aisses from above', ''),
  (13, 'assets/img/media-trou-12.webp', 'Les Aisses · trou 12', 'Les Aisses · hole 12', ''),
  (14, 'assets/img/parcours-la-canne.webp', 'La Canne vu du ciel', 'La Canne from above', '')
) v(ordre, image, legende_fr, legende_en, video)
where not exists (select 1 from public.medias);

insert into public.reglages (cle, valeur) values
  ('tarifs', '{
    "aisses": { "18": { "haute": 150, "basse": 125 }, "9": { "haute": 80, "basse": 65 } },
    "canne":  { "18": { "haute": 75,  "basse": 60  }, "9": { "haute": 48, "basse": 38 } }
  }'::jsonb),
  ('pdf', '{
    "menu_du_jour": "https://www.aissesgolf.com/images/platdujour.pdf",
    "carte": "https://www.aissesgolf.com/images/carte.pdf"
  }'::jsonb)
on conflict (cle) do nothing;

-- Carte de score (onglet « Parcours » de l'administration). Distances en mètres,
-- du départ noir (le plus long) au rouge.
insert into public.reglages (cle, valeur) values ('parcours', '{
 "aisses": {
  "par": [5,4,3,4,4,5,3,4,4,3,4,5,4,4,5,4,3,4],
  "hcp": [17,5,9,7,1,15,11,13,3,16,2,10,8,6,18,14,12,4],
  "dist": [
   [481,370,182,391,386,502,176,426,409,157,402,520,379,396,511,374,208,403],
   [467,352,177,377,369,477,158,347,385,144,387,477,347,368,486,344,188,368],
   [454,332,168,362,349,454,137,322,374,131,363,455,315,336,434,322,166,347],
   [430,292,141,339,321,431,116,298,334,131,341,432,266,308,404,300,166,327],
   [405,256,101,315,301,400,101,275,304,91,318,411,241,284,386,283,136,306]
  ]
 },
 "canne": {
  "par": [4,4,4,3,4,5,4,5,3],
  "hcp": [3,13,15,5,11,7,9,1,17],
  "dist": [
   [419,323,305,198,392,521,392,545,169],
   [383,323,305,178,369,499,367,518,163],
   [353,294,282,156,310,452,330,486,139],
   [300,271,254,156,300,438,315,460,139],
   [272,254,234,137,291,408,294,414,115]
  ]
 }
}'::jsonb) on conflict (cle) do nothing;
