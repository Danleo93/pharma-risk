-- RCA baseline reconstructed from the production public schema.

create or replace function public.set_rca_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.rca_assessments (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  title text not null,
  description text,
  status text default 'draft' not null,
  methodology text,
  event_title text not null,
  event_description text,
  event_type text,
  event_date date,
  event_time time,
  reported_at timestamptz,
  location text,
  department text,
  severity text,
  immediate_containment text,
  summary text,
  conclusion text,
  closed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint rca_assessments_pkey primary key (id),
  constraint rca_assessments_status_check
    check (status in ('draft', 'in_progress', 'action_planned', 'completed', 'archived')),
  constraint rca_assessments_methodology_check
    check (methodology is null or methodology in ('5_whys', 'fishbone', 'combined')),
  constraint rca_assessments_event_type_check
    check (event_type is null or event_type in ('incident', 'near_miss', 'non_conformity', 'complaint', 'other')),
  constraint rca_assessments_severity_check
    check (severity is null or severity in ('low', 'medium', 'high', 'critical')),
  constraint rca_assessments_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create table if not exists public.rca_causes (
  id uuid default gen_random_uuid() not null,
  assessment_id uuid not null,
  user_id uuid not null,
  description text not null,
  category text,
  source_type text not null,
  is_root_cause boolean default false not null,
  confidence_level text,
  evidence text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  root_cause_status text,
  root_cause_confirmed_at timestamptz,
  root_cause_confirmation_notes text,
  constraint rca_causes_pkey primary key (id),
  constraint rca_causes_id_assessment_unique unique (id, assessment_id),
  constraint rca_causes_source_type_check
    check (source_type in ('five_whys', 'fishbone', 'manual')),
  constraint rca_causes_confidence_level_check
    check (confidence_level is null or confidence_level in ('low', 'medium', 'high')),
  constraint rca_causes_root_cause_status_check
    check (root_cause_status is null or root_cause_status in ('candidate', 'confirmed', 'not_confirmed')),
  constraint rca_causes_assessment_id_fkey foreign key (assessment_id)
    references public.rca_assessments(id) on delete cascade,
  constraint rca_causes_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create table if not exists public.rca_fishbone_diagrams (
  id uuid default gen_random_uuid() not null,
  assessment_id uuid not null,
  user_id uuid not null,
  title text not null,
  effect_statement text not null,
  status text default 'draft' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint rca_fishbone_diagrams_pkey primary key (id),
  constraint rca_fishbone_diagrams_assessment_unique unique (assessment_id),
  constraint rca_fishbone_diagrams_id_assessment_unique unique (id, assessment_id),
  constraint rca_fishbone_diagrams_status_check check (status in ('draft', 'completed')),
  constraint rca_fishbone_diagrams_assessment_id_fkey foreign key (assessment_id)
    references public.rca_assessments(id) on delete cascade,
  constraint rca_fishbone_diagrams_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create table if not exists public.rca_fishbone_branches (
  id uuid default gen_random_uuid() not null,
  diagram_id uuid not null,
  assessment_id uuid not null,
  user_id uuid not null,
  name text not null,
  source_type text default 'standard' not null,
  standard_key text,
  is_active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint rca_fishbone_branches_pkey primary key (id),
  constraint rca_fishbone_branches_id_assessment_unique unique (id, assessment_id),
  constraint rca_fishbone_branches_source_type_check
    check (source_type in ('standard', 'custom')),
  constraint rca_fishbone_branches_standard_key_check
    check (standard_key is null or standard_key in (
      'people', 'processes_procedures', 'technology_equipment',
      'drugs_materials', 'environment', 'organization', 'controls_monitoring'
    )),
  constraint rca_fishbone_branches_source_standard_consistency_check
    check (
      (source_type = 'standard' and standard_key is not null)
      or (source_type = 'custom' and standard_key is null)
    ),
  constraint rca_fishbone_branches_assessment_id_fkey foreign key (assessment_id)
    references public.rca_assessments(id) on delete cascade,
  constraint rca_fishbone_branches_diagram_fk foreign key (diagram_id, assessment_id)
    references public.rca_fishbone_diagrams(id, assessment_id) on delete cascade,
  constraint rca_fishbone_branches_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create table if not exists public.rca_fishbone_causes (
  id uuid default gen_random_uuid() not null,
  branch_id uuid not null,
  assessment_id uuid not null,
  user_id uuid not null,
  cause_id uuid not null,
  parent_id uuid,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null,
  constraint rca_fishbone_causes_pkey primary key (id),
  constraint rca_fishbone_causes_id_assessment_unique unique (id, assessment_id),
  constraint rca_fishbone_causes_assessment_id_fkey foreign key (assessment_id)
    references public.rca_assessments(id) on delete cascade,
  constraint rca_fishbone_causes_branch_fk foreign key (branch_id, assessment_id)
    references public.rca_fishbone_branches(id, assessment_id) on delete cascade,
  constraint rca_fishbone_causes_cause_fk foreign key (cause_id, assessment_id)
    references public.rca_causes(id, assessment_id) on delete cascade,
  constraint rca_fishbone_causes_parent_fk foreign key (parent_id, assessment_id)
    references public.rca_fishbone_causes(id, assessment_id) on delete cascade,
  constraint rca_fishbone_causes_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create table if not exists public.rca_five_why_chains (
  id uuid default gen_random_uuid() not null,
  assessment_id uuid not null,
  user_id uuid not null,
  title text not null,
  problem_statement text not null,
  status text default 'draft' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  cause_id uuid,
  constraint rca_five_why_chains_pkey primary key (id),
  constraint rca_five_why_chains_id_assessment_unique unique (id, assessment_id),
  constraint rca_five_why_chains_status_check check (status in ('draft', 'completed')),
  constraint rca_five_why_chains_assessment_id_fkey foreign key (assessment_id)
    references public.rca_assessments(id) on delete cascade,
  constraint rca_five_why_chains_cause_fk foreign key (cause_id, assessment_id)
    references public.rca_causes(id, assessment_id) on delete set null,
  constraint rca_five_why_chains_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create table if not exists public.rca_five_why_steps (
  id uuid default gen_random_uuid() not null,
  chain_id uuid not null,
  assessment_id uuid not null,
  user_id uuid not null,
  step_number integer not null,
  why_question text not null,
  answer text not null,
  cause_id uuid,
  is_root_step boolean default false not null,
  created_at timestamptz default now() not null,
  constraint rca_five_why_steps_pkey primary key (id),
  constraint rca_five_why_steps_chain_step_unique unique (chain_id, step_number),
  constraint rca_five_why_steps_step_number_check check (step_number > 0),
  constraint rca_five_why_steps_assessment_id_fkey foreign key (assessment_id)
    references public.rca_assessments(id) on delete cascade,
  constraint rca_five_why_steps_cause_fk foreign key (cause_id, assessment_id)
    references public.rca_causes(id, assessment_id) on delete set null,
  constraint rca_five_why_steps_chain_fk foreign key (chain_id, assessment_id)
    references public.rca_five_why_chains(id, assessment_id) on delete cascade,
  constraint rca_five_why_steps_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create table if not exists public.rca_action_plans (
  id uuid default gen_random_uuid() not null,
  assessment_id uuid not null,
  cause_id uuid,
  user_id uuid not null,
  description text not null,
  responsible text,
  due_date date,
  status text default 'planned' not null,
  priority text,
  completion_date date,
  effectiveness_check text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint rca_action_plans_pkey primary key (id),
  constraint rca_action_plans_status_check
    check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  constraint rca_action_plans_priority_check
    check (priority is null or priority in ('low', 'medium', 'high', 'critical')),
  constraint rca_action_plans_assessment_id_fkey foreign key (assessment_id)
    references public.rca_assessments(id) on delete cascade,
  constraint rca_action_plans_cause_fk foreign key (cause_id, assessment_id)
    references public.rca_causes(id, assessment_id) on delete set null,
  constraint rca_action_plans_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade
);

create index if not exists rca_assessments_user_id_idx on public.rca_assessments(user_id);
create index if not exists rca_assessments_status_idx on public.rca_assessments(status);
create index if not exists rca_assessments_severity_idx on public.rca_assessments(severity);
create index if not exists rca_assessments_event_date_idx on public.rca_assessments(event_date);
create index if not exists rca_assessments_created_at_idx on public.rca_assessments(created_at desc);

create index if not exists rca_causes_user_id_idx on public.rca_causes(user_id);
create index if not exists rca_causes_assessment_id_idx on public.rca_causes(assessment_id);
create index if not exists rca_causes_category_idx on public.rca_causes(category);
create index if not exists rca_causes_source_type_idx on public.rca_causes(source_type);
create index if not exists rca_causes_is_root_cause_idx on public.rca_causes(is_root_cause);

create index if not exists rca_fishbone_diagrams_user_id_idx on public.rca_fishbone_diagrams(user_id);
create index if not exists rca_fishbone_diagrams_assessment_id_idx on public.rca_fishbone_diagrams(assessment_id);
create index if not exists rca_fishbone_diagrams_status_idx on public.rca_fishbone_diagrams(status);

create index if not exists rca_fishbone_branches_user_id_idx on public.rca_fishbone_branches(user_id);
create index if not exists rca_fishbone_branches_diagram_id_idx on public.rca_fishbone_branches(diagram_id);
create index if not exists rca_fishbone_branches_assessment_id_idx on public.rca_fishbone_branches(assessment_id);
create index if not exists rca_fishbone_branches_standard_key_idx on public.rca_fishbone_branches(standard_key);
create index if not exists rca_fishbone_branches_is_active_idx on public.rca_fishbone_branches(is_active);
create index if not exists rca_fishbone_branches_sort_order_idx on public.rca_fishbone_branches(diagram_id, sort_order);

create index if not exists rca_fishbone_causes_user_id_idx on public.rca_fishbone_causes(user_id);
create index if not exists rca_fishbone_causes_branch_id_idx on public.rca_fishbone_causes(branch_id);
create index if not exists rca_fishbone_causes_assessment_id_idx on public.rca_fishbone_causes(assessment_id);
create index if not exists rca_fishbone_causes_cause_id_idx on public.rca_fishbone_causes(cause_id);
create index if not exists rca_fishbone_causes_parent_id_idx on public.rca_fishbone_causes(parent_id);
create index if not exists rca_fishbone_causes_sort_order_idx on public.rca_fishbone_causes(branch_id, sort_order);

create index if not exists rca_five_why_chains_user_id_idx on public.rca_five_why_chains(user_id);
create index if not exists rca_five_why_chains_assessment_id_idx on public.rca_five_why_chains(assessment_id);
create index if not exists rca_five_why_chains_status_idx on public.rca_five_why_chains(status);
create index if not exists rca_five_why_chains_cause_id_idx on public.rca_five_why_chains(cause_id);

create index if not exists rca_five_why_steps_user_id_idx on public.rca_five_why_steps(user_id);
create index if not exists rca_five_why_steps_chain_id_idx on public.rca_five_why_steps(chain_id);
create index if not exists rca_five_why_steps_assessment_id_idx on public.rca_five_why_steps(assessment_id);
create index if not exists rca_five_why_steps_cause_id_idx on public.rca_five_why_steps(cause_id);
create index if not exists rca_five_why_steps_is_root_step_idx on public.rca_five_why_steps(is_root_step);

create index if not exists rca_action_plans_user_id_idx on public.rca_action_plans(user_id);
create index if not exists rca_action_plans_assessment_id_idx on public.rca_action_plans(assessment_id);
create index if not exists rca_action_plans_cause_id_idx on public.rca_action_plans(cause_id);
create index if not exists rca_action_plans_status_idx on public.rca_action_plans(status);
create index if not exists rca_action_plans_priority_idx on public.rca_action_plans(priority);
create index if not exists rca_action_plans_due_date_idx on public.rca_action_plans(due_date);
create index if not exists rca_action_plans_completion_date_idx on public.rca_action_plans(completion_date);

create trigger set_rca_assessments_updated_at
before update on public.rca_assessments
for each row execute function public.set_rca_updated_at();

create trigger set_rca_causes_updated_at
before update on public.rca_causes
for each row execute function public.set_rca_updated_at();

create trigger set_rca_fishbone_diagrams_updated_at
before update on public.rca_fishbone_diagrams
for each row execute function public.set_rca_updated_at();

create trigger set_rca_fishbone_branches_updated_at
before update on public.rca_fishbone_branches
for each row execute function public.set_rca_updated_at();

create trigger set_rca_five_why_chains_updated_at
before update on public.rca_five_why_chains
for each row execute function public.set_rca_updated_at();

create trigger set_rca_action_plans_updated_at
before update on public.rca_action_plans
for each row execute function public.set_rca_updated_at();

alter table public.rca_assessments enable row level security;
alter table public.rca_causes enable row level security;
alter table public.rca_fishbone_diagrams enable row level security;
alter table public.rca_fishbone_branches enable row level security;
alter table public.rca_fishbone_causes enable row level security;
alter table public.rca_five_why_chains enable row level security;
alter table public.rca_five_why_steps enable row level security;
alter table public.rca_action_plans enable row level security;

-- Policies are recreated centrally by 20260605000000_harden_rls_policies.sql.
