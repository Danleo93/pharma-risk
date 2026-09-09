-- Runtime module management for FMEA, RCA and Gap Analysis.
-- All modules start enabled. Runtime changes are intentionally performed only
-- through an administrative SQL session in this milestone.

create table if not exists public.app_modules (
  module_key text primary key,
  status text not null default 'enabled',
  allow_export_in_read_only boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint app_modules_module_key_check
    check (module_key in ('FMEA', 'RCA', 'GAP_ANALYSIS')),
  constraint app_modules_status_check
    check (status in ('enabled', 'read_only', 'disabled'))
);

create table if not exists public.app_module_status_events (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  old_status text not null,
  new_status text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null,
  constraint app_module_status_events_module_key_check
    check (module_key in ('FMEA', 'RCA', 'GAP_ANALYSIS')),
  constraint app_module_status_events_old_status_check
    check (old_status in ('enabled', 'read_only', 'disabled')),
  constraint app_module_status_events_new_status_check
    check (new_status in ('enabled', 'read_only', 'disabled'))
);

create index if not exists app_module_status_events_module_key_idx
  on public.app_module_status_events(module_key);
create index if not exists app_module_status_events_changed_at_idx
  on public.app_module_status_events(changed_at desc);

insert into public.app_modules (module_key, status, allow_export_in_read_only)
values
  ('FMEA', 'enabled', true),
  ('RCA', 'enabled', true),
  ('GAP_ANALYSIS', 'enabled', true)
on conflict (module_key) do nothing;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_module_readable(requested_module_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select module.status in ('enabled', 'read_only')
      from public.app_modules as module
      where module.module_key = requested_module_key
    ),
    false
  );
$$;

create or replace function private.is_module_writable(requested_module_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select module.status = 'enabled'
      from public.app_modules as module
      where module.module_key = requested_module_key
    ),
    false
  );
$$;

create or replace function private.can_export_module(requested_module_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select
        module.status = 'enabled'
        or (
          module.status = 'read_only'
          and module.allow_export_in_read_only
        )
      from public.app_modules as module
      where module.module_key = requested_module_key
    ),
    false
  );
$$;

revoke all on function private.is_module_readable(text) from public;
revoke all on function private.is_module_writable(text) from public;
revoke all on function private.can_export_module(text) from public;
grant execute on function private.is_module_readable(text) to authenticated;
grant execute on function private.is_module_writable(text) to authenticated;
grant execute on function private.can_export_module(text) to authenticated;

create or replace function private.touch_app_module()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.audit_app_module_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.app_module_status_events (
      module_key,
      old_status,
      new_status,
      changed_by
    )
    values (
      new.module_key,
      old.status,
      new.status,
      coalesce(new.updated_by, auth.uid())
    );
  end if;
  return new;
end;
$$;

revoke all on function private.touch_app_module() from public;
revoke all on function private.audit_app_module_status() from public;

drop trigger if exists app_modules_touch_updated_at on public.app_modules;
create trigger app_modules_touch_updated_at
before update on public.app_modules
for each row execute function private.touch_app_module();

drop trigger if exists app_modules_audit_status on public.app_modules;
create trigger app_modules_audit_status
after update of status on public.app_modules
for each row execute function private.audit_app_module_status();

alter table public.app_modules enable row level security;
alter table public.app_module_status_events enable row level security;

revoke all on table public.app_modules from anon, authenticated;
revoke all on table public.app_module_status_events from anon, authenticated;
grant select on table public.app_modules to authenticated;

drop policy if exists "Authenticated users can read module configuration"
  on public.app_modules;
create policy "Authenticated users can read module configuration"
on public.app_modules
for select
to authenticated
using (true);

-- Restrictive write gates are AND-ed with the existing ownership and
-- cross-parent policies. SELECT policies are deliberately unchanged so data
-- remain recoverable and available to the independent GDPR export.
do $$
declare
  target record;
  operation text;
  policy_name text;
begin
  for target in
    select * from (
      values
        ('FMEA', 'areas'),
        ('FMEA', 'processes'),
        ('FMEA', 'process_steps'),
        ('FMEA', 'risk_assessments'),
        ('FMEA', 'risk_catalog_base'),
        ('FMEA', 'risk_catalog_user'),
        ('FMEA', 'risk_items'),
        ('FMEA', 'control_measures'),
        ('FMEA', 'action_plans'),
        ('FMEA', 'user_custom_risks'),
        ('RCA', 'rca_assessments'),
        ('RCA', 'rca_causes'),
        ('RCA', 'rca_fishbone_diagrams'),
        ('RCA', 'rca_fishbone_branches'),
        ('RCA', 'rca_fishbone_causes'),
        ('RCA', 'rca_five_why_chains'),
        ('RCA', 'rca_five_why_steps'),
        ('RCA', 'rca_action_plans'),
        ('GAP_ANALYSIS', 'gap_processes'),
        ('GAP_ANALYSIS', 'gap_areas'),
        ('GAP_ANALYSIS', 'gap_activities'),
        ('GAP_ANALYSIS', 'gap_standards'),
        ('GAP_ANALYSIS', 'gap_activity_standards'),
        ('GAP_ANALYSIS', 'gap_assessments'),
        ('GAP_ANALYSIS', 'gap_assessment_processes'),
        ('GAP_ANALYSIS', 'gap_activity_evaluations'),
        ('GAP_ANALYSIS', 'gap_actions'),
        ('GAP_ANALYSIS', 'gap_action_events'),
        ('GAP_ANALYSIS', 'gap_links')
    ) as module_tables(module_key, table_name)
  loop
    if to_regclass('public.' || target.table_name) is null then
      raise exception 'Module write gate target table is missing: public.%', target.table_name;
    end if;

    foreach operation in array array['insert', 'update', 'delete']
    loop
      policy_name := format('Module %s write gate %s', target.module_key, operation);
      execute format(
        'drop policy if exists %I on public.%I',
        policy_name,
        target.table_name
      );

      if operation = 'insert' then
        execute format(
          'create policy %I on public.%I as restrictive for insert to authenticated with check (private.is_module_writable(%L))',
          policy_name,
          target.table_name,
          target.module_key
        );
      elsif operation = 'update' then
        execute format(
          'create policy %I on public.%I as restrictive for update to authenticated using (private.is_module_writable(%L)) with check (private.is_module_writable(%L))',
          policy_name,
          target.table_name,
          target.module_key,
          target.module_key
        );
      else
        execute format(
          'create policy %I on public.%I as restrictive for delete to authenticated using (private.is_module_writable(%L))',
          policy_name,
          target.table_name,
          target.module_key
        );
      end if;
    end loop;
  end loop;
end $$;

