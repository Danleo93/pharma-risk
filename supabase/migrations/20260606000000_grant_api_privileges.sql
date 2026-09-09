-- Expose application objects to Supabase API roles.
-- Row Level Security policies remain the authorization boundary for data rows.

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema public
  to anon, authenticated, service_role;

grant all privileges on all routines in schema public
  to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant all privileges on tables to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant all privileges on sequences to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant all privileges on functions to anon, authenticated, service_role;
