-- ============================================================
-- Compteur Retour — Setup Supabase
-- À copier-coller dans : Dashboard Supabase → SQL Editor → Run
-- ============================================================

-- 1) Activer l'auth anonyme (à faire AUSSI dans le dashboard) :
--    Dashboard → Authentication → Providers → "Anonymous Sign-ins" → Enable

-- 2) Tables ---------------------------------------------------

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
  image_data text not null,           -- PNG en data URL base64
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, prompt_date)
);

create index if not exists drawings_couple_date_idx
  on public.drawings (couple_id, prompt_date desc);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists drawings_updated_at on public.drawings;
create trigger drawings_updated_at
  before update on public.drawings
  for each row execute function public.set_updated_at();

-- 3) Helper pour les policies --------------------------------

create or replace function public.my_couple_id()
returns uuid language sql security definer stable as $$
  select couple_id from public.profiles where id = auth.uid();
$$;
grant execute on function public.my_couple_id() to authenticated;

-- 4) RLS -----------------------------------------------------

alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.drawings enable row level security;

-- Couples : lecture libre pour rejoindre via code, insert libre
drop policy if exists "couples_select" on public.couples;
create policy "couples_select" on public.couples
  for select to authenticated using (true);

drop policy if exists "couples_insert" on public.couples;
create policy "couples_insert" on public.couples
  for insert to authenticated with check (true);

-- Profiles : self ou même couple
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

-- Drawings : tes dessins toujours visibles, ceux du couple seulement après minuit Paris
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
-- DONE
-- ============================================================
