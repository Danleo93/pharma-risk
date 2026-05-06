-- Gap Analysis library metadata for PhaRMA T
-- Additive migration only: it does not modify FMEA/RCA tables and does not seed data.

alter table public.gap_standards
add column if not exists application_scope text,
add column if not exists source_type varchar(30) not null default 'library',
add column if not exists created_in_assessment_id uuid references public.gap_assessments(id) on delete cascade;

alter table public.gap_areas
add column if not exists source_type varchar(30) not null default 'library',
add column if not exists created_in_assessment_id uuid references public.gap_assessments(id) on delete cascade;

alter table public.gap_activities
add column if not exists source_type varchar(30) not null default 'library',
add column if not exists created_in_assessment_id uuid references public.gap_assessments(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gap_standards_source_type_check'
  ) then
    alter table public.gap_standards
    add constraint gap_standards_source_type_check
    check (source_type in ('library', 'assessment_only'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'gap_areas_source_type_check'
  ) then
    alter table public.gap_areas
    add constraint gap_areas_source_type_check
    check (source_type in ('library', 'assessment_only'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'gap_activities_source_type_check'
  ) then
    alter table public.gap_activities
    add constraint gap_activities_source_type_check
    check (source_type in ('library', 'assessment_only'));
  end if;
end $$;

create index if not exists gap_standards_user_source_type_idx
on public.gap_standards(user_id, source_type);

create index if not exists gap_standards_created_in_assessment_idx
on public.gap_standards(user_id, created_in_assessment_id);

create index if not exists gap_areas_user_source_type_idx
on public.gap_areas(user_id, source_type);

create index if not exists gap_areas_process_source_type_idx
on public.gap_areas(process_id, source_type);

create index if not exists gap_areas_created_in_assessment_idx
on public.gap_areas(user_id, created_in_assessment_id);

create index if not exists gap_activities_user_source_type_idx
on public.gap_activities(user_id, source_type);

create index if not exists gap_activities_area_source_type_idx
on public.gap_activities(area_id, source_type);

create index if not exists gap_activities_created_in_assessment_idx
on public.gap_activities(user_id, created_in_assessment_id);
