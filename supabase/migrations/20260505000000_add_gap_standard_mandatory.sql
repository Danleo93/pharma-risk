-- Column created manually in production and required by the Gap UI.

alter table public.gap_standards
  add column if not exists is_mandatory boolean not null default false;
