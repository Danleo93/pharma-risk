-- FMEA baseline reconstructed from the production public schema.

create table if not exists public.areas (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  constraint areas_pkey primary key (id),
  constraint areas_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create table if not exists public.processes (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  area_id uuid not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  constraint processes_pkey primary key (id),
  constraint processes_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade,
  constraint processes_area_id_fkey foreign key (area_id)
    references public.areas(id) on delete cascade
);

create table if not exists public.process_steps (
  id uuid default gen_random_uuid() not null,
  process_id uuid not null,
  step_number integer not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  constraint process_steps_pkey primary key (id),
  constraint process_steps_process_id_fkey foreign key (process_id)
    references public.processes(id) on delete cascade
);

create table if not exists public.risk_assessments (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  area_id uuid,
  process_id uuid,
  title text not null,
  description text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint risk_assessments_pkey primary key (id),
  constraint risk_assessments_status_check
    check (status in ('draft', 'in_progress', 'completed', 'archived')),
  constraint risk_assessments_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade,
  constraint risk_assessments_area_id_fkey foreign key (area_id)
    references public.areas(id) on delete set null,
  constraint risk_assessments_process_id_fkey foreign key (process_id)
    references public.processes(id) on delete set null
);

create table if not exists public.risk_catalog_base (
  id uuid default gen_random_uuid() not null,
  category text not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  constraint risk_catalog_base_pkey primary key (id)
);

create table if not exists public.risk_catalog_user (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  category text not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  constraint risk_catalog_user_pkey primary key (id),
  constraint risk_catalog_user_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create table if not exists public.risk_items (
  id uuid default gen_random_uuid() not null,
  assessment_id uuid not null,
  process_step_id uuid,
  risk_catalog_base_id uuid,
  risk_catalog_user_id uuid,
  custom_risk_name text,
  custom_risk_description text,
  severity integer,
  probability integer,
  detectability integer,
  hazard_score integer generated always as (severity * probability) stored,
  notes text,
  created_at timestamptz default now(),
  rpn integer generated always as (
    case
      when severity is not null and probability is not null and detectability is not null
        then severity * probability * detectability
      else null
    end
  ) stored,
  risk_class text generated always as (
    case
      when severity is null or probability is null or detectability is null then null
      when severity * probability * detectability >= 50 then 'Alta'
      when severity * probability * detectability >= 20 then 'Media'
      else 'Bassa'
    end
  ) stored,
  constraint risk_items_pkey primary key (id),
  constraint risk_items_severity_check check (severity between 1 and 5),
  constraint risk_items_probability_check check (probability between 1 and 5),
  constraint risk_items_detectability_check check (detectability between 1 and 5),
  constraint risk_items_assessment_id_fkey foreign key (assessment_id)
    references public.risk_assessments(id) on delete cascade,
  constraint risk_items_process_step_id_fkey foreign key (process_step_id)
    references public.process_steps(id) on delete set null,
  constraint risk_items_risk_catalog_base_id_fkey foreign key (risk_catalog_base_id)
    references public.risk_catalog_base(id) on delete set null,
  constraint risk_items_risk_catalog_user_id_fkey foreign key (risk_catalog_user_id)
    references public.risk_catalog_user(id) on delete set null
);

create table if not exists public.control_measures (
  id uuid default gen_random_uuid() not null,
  risk_item_id uuid not null,
  description text not null,
  measure_type text,
  effectiveness text,
  created_at timestamptz default now(),
  constraint control_measures_pkey primary key (id),
  constraint control_measures_measure_type_check
    check (measure_type in ('preventive', 'detective', 'corrective')),
  constraint control_measures_effectiveness_check
    check (effectiveness in ('high', 'medium', 'low')),
  constraint control_measures_risk_item_id_fkey foreign key (risk_item_id)
    references public.risk_items(id) on delete cascade
);

create table if not exists public.action_plans (
  id uuid default gen_random_uuid() not null,
  risk_item_id uuid not null,
  description text not null,
  responsible text,
  due_date date,
  status text default 'planned',
  completion_date date,
  notes text,
  created_at timestamptz default now(),
  constraint action_plans_pkey primary key (id),
  constraint action_plans_status_check
    check (status in ('planned', 'in_progress', 'completed')),
  constraint action_plans_risk_item_id_fkey foreign key (risk_item_id)
    references public.risk_items(id) on delete cascade
);

create table if not exists public.user_custom_risks (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  name text not null,
  category text not null,
  description text,
  created_at timestamptz default now(),
  constraint user_custom_risks_pkey primary key (id),
  constraint user_custom_risks_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create table if not exists public.user_settings (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  organization_name text,
  theme text default 'light',
  color_palette text default 'hospital',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  facility_name text,
  constraint user_settings_pkey primary key (id),
  constraint user_settings_user_id_key unique (user_id),
  constraint user_settings_theme_check check (theme in ('light', 'dark')),
  constraint user_settings_color_palette_check
    check (color_palette in ('hospital', 'minimal', 'professional')),
  constraint user_settings_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create index if not exists idx_user_custom_risks_user_id
  on public.user_custom_risks(user_id);

alter table public.areas enable row level security;
alter table public.processes enable row level security;
alter table public.process_steps enable row level security;
alter table public.risk_assessments enable row level security;
alter table public.risk_catalog_base enable row level security;
alter table public.risk_catalog_user enable row level security;
alter table public.risk_items enable row level security;
alter table public.control_measures enable row level security;
alter table public.action_plans enable row level security;
alter table public.user_custom_risks enable row level security;
alter table public.user_settings enable row level security;

-- Policies are recreated centrally by 20260605000000_harden_rls_policies.sql.
