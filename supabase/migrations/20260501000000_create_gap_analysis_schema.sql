-- Gap Analysis schema for PhaRMA T
-- This migration creates only gap_* objects and does not modify FMEA/RCA tables.

create extension if not exists pgcrypto;

create or replace function public.set_gap_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.gap_processes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code varchar(100) not null,
  name varchar(255) not null,
  description text,
  order_index integer not null default 0,
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gap_processes_user_code_unique unique (user_id, code),
  constraint gap_processes_order_index_check check (order_index >= 0)
);

create table if not exists public.gap_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  process_id uuid not null references public.gap_processes(id) on delete cascade,
  code varchar(100) not null,
  name varchar(255) not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gap_areas_process_code_unique unique (process_id, code),
  constraint gap_areas_order_index_check check (order_index >= 0)
);

create table if not exists public.gap_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid not null references public.gap_areas(id) on delete cascade,
  code varchar(100) not null,
  name varchar(255) not null,
  description text,
  operator varchar(255),
  target_state text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gap_activities_area_code_unique unique (area_id, code),
  constraint gap_activities_order_index_check check (order_index >= 0)
);

create table if not exists public.gap_standards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code varchar(100) not null,
  name varchar(255) not null,
  version varchar(100),
  issuing_body varchar(255),
  description text,
  url text,
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gap_standards_user_code_unique unique (user_id, code)
);

create table if not exists public.gap_activity_standards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references public.gap_activities(id) on delete cascade,
  standard_id uuid not null references public.gap_standards(id) on delete cascade,
  specific_reference text,
  created_at timestamptz not null default now(),
  constraint gap_activity_standards_activity_standard_unique unique (activity_id, standard_id)
);

create table if not exists public.gap_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title varchar(255) not null,
  description text,
  facility_name varchar(255),
  department varchar(255),
  assessor varchar(255),
  assessment_date date,
  status varchar(50) not null default 'draft',
  total_activities integer not null default 0,
  compliant_count integer not null default 0,
  partial_count integer not null default 0,
  non_compliant_count integer not null default 0,
  not_evaluated_count integer not null default 0,
  na_count integer not null default 0,
  compliance_percentage numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gap_assessments_status_check check (status in ('draft', 'in_progress', 'completed', 'archived')),
  constraint gap_assessments_counts_check check (
    total_activities >= 0
    and compliant_count >= 0
    and partial_count >= 0
    and non_compliant_count >= 0
    and not_evaluated_count >= 0
    and na_count >= 0
  ),
  constraint gap_assessments_compliance_percentage_check check (compliance_percentage >= 0 and compliance_percentage <= 100)
);

create table if not exists public.gap_assessment_processes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.gap_assessments(id) on delete cascade,
  process_id uuid not null references public.gap_processes(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint gap_assessment_processes_assessment_process_unique unique (assessment_id, process_id)
);

create table if not exists public.gap_activity_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.gap_assessments(id) on delete cascade,
  activity_id uuid not null references public.gap_activities(id) on delete restrict,
  current_state text,
  target_state_override text,
  gap_description text,
  compliance_status varchar(50) not null default 'not_evaluated',
  risk_priority varchar(50) not null default 'medium',
  process_name_snapshot text,
  area_name_snapshot text,
  activity_name_snapshot text,
  activity_code_snapshot text,
  notes text,
  evaluated_by varchar(255),
  evaluated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gap_activity_evaluations_assessment_activity_unique unique (assessment_id, activity_id),
  constraint gap_activity_evaluations_compliance_status_check check (
    compliance_status in ('not_evaluated', 'not_applicable', 'non_compliant', 'partially_compliant', 'compliant')
  ),
  constraint gap_activity_evaluations_risk_priority_check check (risk_priority in ('low', 'medium', 'high'))
);

create table if not exists public.gap_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.gap_assessments(id) on delete cascade,
  activity_id uuid not null references public.gap_activities(id) on delete restrict,
  evaluation_id uuid not null references public.gap_activity_evaluations(id) on delete cascade,
  description text not null,
  responsible varchar(255),
  priority varchar(50) not null default 'medium',
  status varchar(50) not null default 'planned',
  progress integer not null default 0,
  phase varchar(255),
  milestone boolean not null default false,
  depends_on_action_id uuid references public.gap_actions(id) on delete set null,
  planned_start_date date,
  planned_end_date date,
  actual_start_date date,
  actual_end_date date,
  verification_due_date date,
  verified_at timestamptz,
  verification_method text,
  verification_result varchar(50) not null default 'pending',
  verification_notes text,
  verified_by varchar(255),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gap_actions_priority_check check (priority in ('low', 'medium', 'high', 'critical')),
  constraint gap_actions_status_check check (
    status in ('not_started', 'planned', 'in_progress', 'blocked', 'completed', 'verified', 'ineffective', 'closed')
  ),
  constraint gap_actions_progress_check check (progress >= 0 and progress <= 100),
  constraint gap_actions_verification_result_check check (
    verification_result in ('pending', 'effective', 'partially_effective', 'ineffective')
  ),
  constraint gap_actions_phase_check check (
    phase is null or phase in ('analysis', 'planning', 'implementation', 'training', 'verification', 'monitoring', 'closure')
  ),
  constraint gap_actions_planned_dates_check check (
    planned_start_date is null or planned_end_date is null or planned_start_date <= planned_end_date
  ),
  constraint gap_actions_actual_dates_check check (
    actual_start_date is null or actual_end_date is null or actual_start_date <= actual_end_date
  )
);

create table if not exists public.gap_action_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.gap_assessments(id) on delete cascade,
  activity_id uuid not null references public.gap_activities(id) on delete restrict,
  evaluation_id uuid references public.gap_activity_evaluations(id) on delete cascade,
  action_id uuid not null references public.gap_actions(id) on delete cascade,
  event_type varchar(50) not null,
  event_date timestamptz not null default now(),
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint gap_action_events_event_type_check check (
    event_type in (
      'created',
      'assigned',
      'started',
      'blocked',
      'unblocked',
      'completed',
      'verification_pending',
      'verified_effective',
      'verified_partially',
      'verified_ineffective',
      'verification_failed',
      'reopened',
      'closed',
      'due_date_changed',
      'progress_updated',
      'note_added'
    )
  )
);

create table if not exists public.gap_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.gap_assessments(id) on delete cascade,
  activity_id uuid references public.gap_activities(id) on delete cascade,
  evaluation_id uuid references public.gap_activity_evaluations(id) on delete cascade,
  linked_type varchar(50) not null,
  linked_id uuid not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint gap_links_linked_type_check check (
    linked_type in ('fmea_assessment', 'fmea_risk', 'fmea_action', 'rca_assessment', 'rca_cause', 'rca_action', 'document', 'external')
  ),
  constraint gap_links_scope_check check (
    assessment_id is not null or activity_id is not null or evaluation_id is not null
  )
);

create index if not exists idx_gap_processes_user_id on public.gap_processes(user_id);
create index if not exists idx_gap_processes_is_template on public.gap_processes(is_template);
create index if not exists idx_gap_processes_order_index on public.gap_processes(order_index);

create index if not exists idx_gap_areas_user_id on public.gap_areas(user_id);
create index if not exists idx_gap_areas_process_id on public.gap_areas(process_id);
create index if not exists idx_gap_areas_order_index on public.gap_areas(order_index);

create index if not exists idx_gap_activities_user_id on public.gap_activities(user_id);
create index if not exists idx_gap_activities_area_id on public.gap_activities(area_id);
create index if not exists idx_gap_activities_order_index on public.gap_activities(order_index);

create index if not exists idx_gap_standards_user_id on public.gap_standards(user_id);
create index if not exists idx_gap_standards_is_template on public.gap_standards(is_template);

create index if not exists idx_gap_activity_standards_user_id on public.gap_activity_standards(user_id);
create index if not exists idx_gap_activity_standards_activity_id on public.gap_activity_standards(activity_id);
create index if not exists idx_gap_activity_standards_standard_id on public.gap_activity_standards(standard_id);

create index if not exists idx_gap_assessments_user_id on public.gap_assessments(user_id);
create index if not exists idx_gap_assessments_status on public.gap_assessments(status);
create index if not exists idx_gap_assessments_assessment_date on public.gap_assessments(assessment_date);
create index if not exists idx_gap_assessments_created_at on public.gap_assessments(created_at);

create index if not exists idx_gap_assessment_processes_user_id on public.gap_assessment_processes(user_id);
create index if not exists idx_gap_assessment_processes_assessment_id on public.gap_assessment_processes(assessment_id);
create index if not exists idx_gap_assessment_processes_process_id on public.gap_assessment_processes(process_id);

create index if not exists idx_gap_activity_evaluations_user_id on public.gap_activity_evaluations(user_id);
create index if not exists idx_gap_activity_evaluations_assessment_id on public.gap_activity_evaluations(assessment_id);
create index if not exists idx_gap_activity_evaluations_activity_id on public.gap_activity_evaluations(activity_id);
create index if not exists idx_gap_activity_evaluations_compliance_status on public.gap_activity_evaluations(compliance_status);
create index if not exists idx_gap_activity_evaluations_risk_priority on public.gap_activity_evaluations(risk_priority);
create index if not exists idx_gap_activity_evaluations_evaluated_at on public.gap_activity_evaluations(evaluated_at);

create index if not exists idx_gap_actions_user_id on public.gap_actions(user_id);
create index if not exists idx_gap_actions_assessment_id on public.gap_actions(assessment_id);
create index if not exists idx_gap_actions_activity_id on public.gap_actions(activity_id);
create index if not exists idx_gap_actions_evaluation_id on public.gap_actions(evaluation_id);
create index if not exists idx_gap_actions_status on public.gap_actions(status);
create index if not exists idx_gap_actions_priority on public.gap_actions(priority);
create index if not exists idx_gap_actions_planned_start_date on public.gap_actions(planned_start_date);
create index if not exists idx_gap_actions_planned_end_date on public.gap_actions(planned_end_date);
create index if not exists idx_gap_actions_verification_due_date on public.gap_actions(verification_due_date);
create index if not exists idx_gap_actions_verification_result on public.gap_actions(verification_result);
create index if not exists idx_gap_actions_depends_on_action_id on public.gap_actions(depends_on_action_id);

create index if not exists idx_gap_action_events_user_id on public.gap_action_events(user_id);
create index if not exists idx_gap_action_events_assessment_id on public.gap_action_events(assessment_id);
create index if not exists idx_gap_action_events_activity_id on public.gap_action_events(activity_id);
create index if not exists idx_gap_action_events_evaluation_id on public.gap_action_events(evaluation_id);
create index if not exists idx_gap_action_events_action_id on public.gap_action_events(action_id);
create index if not exists idx_gap_action_events_event_type on public.gap_action_events(event_type);
create index if not exists idx_gap_action_events_event_date on public.gap_action_events(event_date);

create index if not exists idx_gap_links_user_id on public.gap_links(user_id);
create index if not exists idx_gap_links_assessment_id on public.gap_links(assessment_id);
create index if not exists idx_gap_links_activity_id on public.gap_links(activity_id);
create index if not exists idx_gap_links_evaluation_id on public.gap_links(evaluation_id);
create index if not exists idx_gap_links_linked_type on public.gap_links(linked_type);
create index if not exists idx_gap_links_linked_id on public.gap_links(linked_id);

drop trigger if exists trg_gap_processes_updated_at on public.gap_processes;
create trigger trg_gap_processes_updated_at
before update on public.gap_processes
for each row
execute function public.set_gap_updated_at();

drop trigger if exists trg_gap_areas_updated_at on public.gap_areas;
create trigger trg_gap_areas_updated_at
before update on public.gap_areas
for each row
execute function public.set_gap_updated_at();

drop trigger if exists trg_gap_activities_updated_at on public.gap_activities;
create trigger trg_gap_activities_updated_at
before update on public.gap_activities
for each row
execute function public.set_gap_updated_at();

drop trigger if exists trg_gap_standards_updated_at on public.gap_standards;
create trigger trg_gap_standards_updated_at
before update on public.gap_standards
for each row
execute function public.set_gap_updated_at();

drop trigger if exists trg_gap_assessments_updated_at on public.gap_assessments;
create trigger trg_gap_assessments_updated_at
before update on public.gap_assessments
for each row
execute function public.set_gap_updated_at();

drop trigger if exists trg_gap_activity_evaluations_updated_at on public.gap_activity_evaluations;
create trigger trg_gap_activity_evaluations_updated_at
before update on public.gap_activity_evaluations
for each row
execute function public.set_gap_updated_at();

drop trigger if exists trg_gap_actions_updated_at on public.gap_actions;
create trigger trg_gap_actions_updated_at
before update on public.gap_actions
for each row
execute function public.set_gap_updated_at();

alter table public.gap_processes enable row level security;
alter table public.gap_areas enable row level security;
alter table public.gap_activities enable row level security;
alter table public.gap_standards enable row level security;
alter table public.gap_activity_standards enable row level security;
alter table public.gap_assessments enable row level security;
alter table public.gap_assessment_processes enable row level security;
alter table public.gap_activity_evaluations enable row level security;
alter table public.gap_actions enable row level security;
alter table public.gap_action_events enable row level security;
alter table public.gap_links enable row level security;

create policy "Users can select own gap processes"
on public.gap_processes for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap processes"
on public.gap_processes for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap processes"
on public.gap_processes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap processes"
on public.gap_processes for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can select own gap areas"
on public.gap_areas for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap areas"
on public.gap_areas for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap areas"
on public.gap_areas for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap areas"
on public.gap_areas for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can select own gap activities"
on public.gap_activities for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap activities"
on public.gap_activities for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap activities"
on public.gap_activities for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap activities"
on public.gap_activities for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can select own gap standards"
on public.gap_standards for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap standards"
on public.gap_standards for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap standards"
on public.gap_standards for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap standards"
on public.gap_standards for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can select own gap activity standards"
on public.gap_activity_standards for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap activity standards"
on public.gap_activity_standards for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap activity standards"
on public.gap_activity_standards for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap activity standards"
on public.gap_activity_standards for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can select own gap assessments"
on public.gap_assessments for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap assessments"
on public.gap_assessments for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap assessments"
on public.gap_assessments for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap assessments"
on public.gap_assessments for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can select own gap assessment processes"
on public.gap_assessment_processes for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap assessment processes"
on public.gap_assessment_processes for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap assessment processes"
on public.gap_assessment_processes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap assessment processes"
on public.gap_assessment_processes for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can select own gap activity evaluations"
on public.gap_activity_evaluations for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap activity evaluations"
on public.gap_activity_evaluations for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap activity evaluations"
on public.gap_activity_evaluations for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap activity evaluations"
on public.gap_activity_evaluations for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can select own gap actions"
on public.gap_actions for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap actions"
on public.gap_actions for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap actions"
on public.gap_actions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap actions"
on public.gap_actions for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can select own gap action events"
on public.gap_action_events for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap action events"
on public.gap_action_events for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap action events"
on public.gap_action_events for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap action events"
on public.gap_action_events for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can select own gap links"
on public.gap_links for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own gap links"
on public.gap_links for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own gap links"
on public.gap_links for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own gap links"
on public.gap_links for delete
to authenticated
using (user_id = auth.uid());
