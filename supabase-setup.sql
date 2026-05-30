-- ============================================================
-- Compteur Retour — Setup Supabase (auth : pseudo + mot de passe)
-- À copier-coller dans : Dashboard Supabase → SQL Editor → Run
-- ============================================================

-- ⚙️ Préalable côté dashboard Supabase :
--   1. Authentication → Providers → Email → ACTIVÉ
--      ↳ "Confirm email" → DÉSACTIVER (sinon les comptes restent unconfirmed)
--   2. Authentication → Providers → Anonymous Sign-ins → DÉSACTIVER
--   3. Authentication → Sign Up → laisser ouvert

-- ============================================================
-- (Optionnel) RESET si tu as déjà exécuté l'ancien SQL :
-- Décommente le bloc suivant pour repartir propre
-- ============================================================
-- delete from public.drawings;
-- delete from public.profiles;
-- delete from public.couples;
-- delete from auth.users;   -- supprime aussi les anciens utilisateurs anonymes

-- ============================================================
-- 1) Tables
-- ============================================================

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete set null,
  pseudo text not null,
  created_at timestamptz default now()
);

create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  prompt_date date not null,
  prompt_text text not null,
  image_data text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, prompt_date)
);

create index if not exists drawings_couple_date_idx
  on public.drawings (couple_id, prompt_date desc);

-- Trigger updated_at sur drawings
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists drawings_updated_at on public.drawings;
create trigger drawings_updated_at
  before update on public.drawings
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2) Auto-création du profile à l'inscription
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, pseudo)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'pseudo',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3) Helper pour les policies
-- ============================================================

create or replace function public.my_couple_id()
returns uuid language sql security definer stable as $$
  select couple_id from public.profiles where id = auth.uid();
$$;
grant execute on function public.my_couple_id() to authenticated;

-- ============================================================
-- 4) Row Level Security
-- ============================================================

alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.drawings enable row level security;

-- Couples
drop policy if exists "couples_select" on public.couples;
create policy "couples_select" on public.couples
  for select to authenticated using (true);

drop policy if exists "couples_insert" on public.couples;
create policy "couples_insert" on public.couples
  for insert to authenticated with check (true);

-- Profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or (couple_id is not null and couple_id = public.my_couple_id())
  );

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated using (id = auth.uid());

-- Drawings : ses propres dessins toujours, ceux du couple après minuit Paris
drop policy if exists "drawings_select" on public.drawings;
create policy "drawings_select" on public.drawings
  for select to authenticated using (
    user_id = auth.uid()
    or (
      couple_id = public.my_couple_id()
      and prompt_date < (now() at time zone 'Europe/Paris')::date
    )
  );

drop policy if exists "drawings_insert" on public.drawings;
create policy "drawings_insert" on public.drawings
  for insert to authenticated with check (
    user_id = auth.uid()
    and couple_id = public.my_couple_id()
  );

drop policy if exists "drawings_update" on public.drawings;
create policy "drawings_update" on public.drawings
  for update to authenticated using (
    user_id = auth.uid()
    and prompt_date = (now() at time zone 'Europe/Paris')::date
  );

drop policy if exists "drawings_delete" on public.drawings;
create policy "drawings_delete" on public.drawings
  for delete to authenticated using (
    user_id = auth.uid()
    and prompt_date = (now() at time zone 'Europe/Paris')::date
  );

-- ============================================================
-- 5) Question du jour (daily_answers)
-- ============================================================

create table if not exists public.daily_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  question_date date not null,
  question_text text not null,
  answer_text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, question_date)
);

create index if not exists daily_answers_couple_date_idx
  on public.daily_answers (couple_id, question_date desc);

drop trigger if exists daily_answers_updated_at on public.daily_answers;
create trigger daily_answers_updated_at
  before update on public.daily_answers
  for each row execute function public.set_updated_at();

alter table public.daily_answers enable row level security;

-- Helper SECURITY DEFINER : sait si l'utilisateur courant a déjà répondu à une date donnée
-- (contourne RLS pour éviter la récursion infinie dans la policy ci-dessous)
create or replace function public.my_answer_exists(d date)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.daily_answers
    where user_id = auth.uid() and question_date = d
  );
$$;
grant execute on function public.my_answer_exists(date) to authenticated;

-- SELECT : sa propre réponse toujours ; celle du partenaire si soi-même a déjà répondu (même jour)
--          OU si la date est passée
drop policy if exists "daily_answers_select" on public.daily_answers;
create policy "daily_answers_select" on public.daily_answers
  for select to authenticated using (
    user_id = auth.uid()
    or (
      couple_id = public.my_couple_id()
      and (
        question_date < (now() at time zone 'Europe/Paris')::date
        or public.my_answer_exists(question_date)
      )
    )
  );

drop policy if exists "daily_answers_insert" on public.daily_answers;
create policy "daily_answers_insert" on public.daily_answers
  for insert to authenticated with check (
    user_id = auth.uid()
    and couple_id = public.my_couple_id()
  );

drop policy if exists "daily_answers_update" on public.daily_answers;
create policy "daily_answers_update" on public.daily_answers
  for update to authenticated using (
    user_id = auth.uid()
    and question_date = (now() at time zone 'Europe/Paris')::date
  );

drop policy if exists "daily_answers_delete" on public.daily_answers;
create policy "daily_answers_delete" on public.daily_answers
  for delete to authenticated using (
    user_id = auth.uid()
    and question_date = (now() at time zone 'Europe/Paris')::date
  );

-- ============================================================
-- 6) Liste à faire au retour (bucket_items)
-- ============================================================

create table if not exists public.bucket_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  done_by uuid references public.profiles(id) on delete set null,
  done_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists bucket_items_couple_idx
  on public.bucket_items (couple_id, done, created_at desc);

drop trigger if exists bucket_items_updated_at on public.bucket_items;
create trigger bucket_items_updated_at
  before update on public.bucket_items
  for each row execute function public.set_updated_at();

alter table public.bucket_items enable row level security;

-- Les items sont partagés entre les deux membres du couple
drop policy if exists "bucket_items_select" on public.bucket_items;
create policy "bucket_items_select" on public.bucket_items
  for select to authenticated using (
    couple_id = public.my_couple_id()
  );

drop policy if exists "bucket_items_insert" on public.bucket_items;
create policy "bucket_items_insert" on public.bucket_items
  for insert to authenticated with check (
    couple_id = public.my_couple_id()
    and created_by = auth.uid()
  );

drop policy if exists "bucket_items_update" on public.bucket_items;
create policy "bucket_items_update" on public.bucket_items
  for update to authenticated using (
    couple_id = public.my_couple_id()
  );

drop policy if exists "bucket_items_delete" on public.bucket_items;
create policy "bucket_items_delete" on public.bucket_items
  for delete to authenticated using (
    couple_id = public.my_couple_id()
  );

-- ============================================================
-- 7) Journal commun (journal_entries)
-- ============================================================

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  mood text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists journal_entries_couple_created_idx
  on public.journal_entries (couple_id, created_at desc);

drop trigger if exists journal_entries_updated_at on public.journal_entries;
create trigger journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

alter table public.journal_entries enable row level security;

-- Tout membre du couple peut lire toutes les entrées du couple
drop policy if exists "journal_select" on public.journal_entries;
create policy "journal_select" on public.journal_entries
  for select to authenticated using (
    couple_id = public.my_couple_id()
  );

-- Seul l'auteur peut écrire dans son couple
drop policy if exists "journal_insert" on public.journal_entries;
create policy "journal_insert" on public.journal_entries
  for insert to authenticated with check (
    user_id = auth.uid()
    and couple_id = public.my_couple_id()
  );

-- Seul l'auteur peut modifier/supprimer ses propres entrées
drop policy if exists "journal_update" on public.journal_entries;
create policy "journal_update" on public.journal_entries
  for update to authenticated using (
    user_id = auth.uid()
  );

drop policy if exists "journal_delete" on public.journal_entries;
create policy "journal_delete" on public.journal_entries
  for delete to authenticated using (
    user_id = auth.uid()
  );

-- ============================================================
-- 8) Calendrier des nuits passées à la maison (nights)
-- ============================================================

create table if not exists public.nights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  night_date date not null,
  created_at timestamptz default now(),
  unique (user_id, night_date)
);

create index if not exists nights_couple_date_idx
  on public.nights (couple_id, night_date);

alter table public.nights enable row level security;

-- Chacun coche ses propres nuits ; les deux membres du couple voient les deux
drop policy if exists "nights_select" on public.nights;
create policy "nights_select" on public.nights
  for select to authenticated using (
    couple_id = public.my_couple_id()
  );

drop policy if exists "nights_insert" on public.nights;
create policy "nights_insert" on public.nights
  for insert to authenticated with check (
    user_id = auth.uid()
    and couple_id = public.my_couple_id()
  );

-- Chacun ne peut décocher que ses propres nuits
drop policy if exists "nights_delete" on public.nights;
create policy "nights_delete" on public.nights
  for delete to authenticated using (
    user_id = auth.uid()
  );

-- ============================================================
-- DONE
-- ============================================================
