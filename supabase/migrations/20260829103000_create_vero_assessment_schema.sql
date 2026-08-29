-- Vero Talent Assessment - schema inicial
-- Execute via Supabase CLI (supabase db push) ou no SQL Editor do projeto.
-- Esta migration cria as tabelas usadas pelas server functions e pelo painel de RH.

create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('admin', 'recruiter');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email
  )
  on conflict (id) do update
  set name = excluded.name,
      email = excluded.email,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  email text,
  position text not null check (char_length(trim(position)) >= 2),
  access_code text not null unique,
  code_active boolean not null default true,
  code_expires_at timestamptz,
  status text not null default 'nao_iniciado'
    check (status in ('nao_iniciado', 'em_andamento', 'enviado', 'em_avaliacao', 'avaliado', 'finalizado')),
  progress integer not null default 0 check (progress between 0 and 100),
  started_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_responses (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  section text not null check (section in ('diagnostico', 'analytics', 'automacao', 'ia', 'roadmap')),
  question_id text not null default 'data',
  response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, section, question_id)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references public.candidates(id) on delete cascade,
  assessment_status text not null default 'pendente'
    check (assessment_status in ('pendente', 'em_avaliacao', 'avaliado', 'finalizado')),
  final_score_ai numeric(4,2),
  final_score_hr numeric(4,2),
  recommendation_ai text,
  recommendation_hr text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_evaluations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  criteria_scores jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  interview_questions jsonb not null default '[]'::jsonb,
  executive_summary jsonb not null default '[]'::jsonb,
  recommendation text,
  final_score numeric(4,2),
  generated_at timestamptz not null default now()
);

create table if not exists public.hr_reviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewer_name text not null,
  criteria_scores jsonb not null default '{}'::jsonb,
  comments text,
  strengths text,
  attention_points text,
  final_score numeric(4,2),
  final_recommendation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, reviewer_id)
);

create index if not exists candidates_access_code_idx on public.candidates (access_code);
create index if not exists candidates_status_idx on public.candidates (status);
create index if not exists candidate_responses_candidate_id_idx on public.candidate_responses (candidate_id);
create index if not exists assessments_candidate_id_idx on public.assessments (candidate_id);
create index if not exists ai_evaluations_candidate_generated_idx on public.ai_evaluations (candidate_id, generated_at desc);
create index if not exists hr_reviews_candidate_id_idx on public.hr_reviews (candidate_id);
create index if not exists user_roles_user_id_idx on public.user_roles (user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists candidates_set_updated_at on public.candidates;
create trigger candidates_set_updated_at before update on public.candidates
  for each row execute procedure public.set_updated_at();

drop trigger if exists candidate_responses_set_updated_at on public.candidate_responses;
create trigger candidate_responses_set_updated_at before update on public.candidate_responses
  for each row execute procedure public.set_updated_at();

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at before update on public.assessments
  for each row execute procedure public.set_updated_at();

drop trigger if exists hr_reviews_set_updated_at on public.hr_reviews;
create trigger hr_reviews_set_updated_at before update on public.hr_reviews
  for each row execute procedure public.set_updated_at();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('admin'::public.app_role, 'recruiter'::public.app_role)
  );
$$;

grant execute on function public.is_staff() to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.candidates enable row level security;
alter table public.candidate_responses enable row level security;
alter table public.assessments enable row level security;
alter table public.ai_evaluations enable row level security;
alter table public.hr_reviews enable row level security;

drop policy if exists "profiles_read_own_or_staff" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "roles_read_own_or_staff" on public.user_roles;
drop policy if exists "staff_manage_candidates" on public.candidates;
drop policy if exists "staff_manage_responses" on public.candidate_responses;
drop policy if exists "staff_manage_assessments" on public.assessments;
drop policy if exists "staff_manage_ai_evaluations" on public.ai_evaluations;
drop policy if exists "staff_manage_hr_reviews" on public.hr_reviews;

create policy "profiles_read_own_or_staff" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());

create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "roles_read_own_or_staff" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

create policy "staff_manage_candidates" on public.candidates for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "staff_manage_responses" on public.candidate_responses for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "staff_manage_assessments" on public.assessments for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "staff_manage_ai_evaluations" on public.ai_evaluations for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "staff_manage_hr_reviews" on public.hr_reviews for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- O fluxo público do candidato ocorre exclusivamente via server functions
-- com supabaseAdmin; não há política pública de acesso direto às tabelas.
