-- Milestone 2B.1: prevent cross-owner parent relationships.
-- This migration changes only INSERT/UPDATE RLS policies and adds two
-- narrowly scoped helpers for self-referencing relationships.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.owns_rca_fishbone_cause(
  p_cause_id uuid,
  p_assessment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rca_fishbone_causes as fc
    where fc.id = p_cause_id
      and fc.assessment_id = p_assessment_id
      and fc.user_id = auth.uid()
  );
$$;

create or replace function private.owns_gap_action(
  p_action_id uuid,
  p_assessment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.gap_actions as ga
    where ga.id = p_action_id
      and ga.assessment_id = p_assessment_id
      and ga.user_id = auth.uid()
  );
$$;

revoke all on function private.owns_rca_fishbone_cause(uuid, uuid) from public;
revoke all on function private.owns_gap_action(uuid, uuid) from public;
grant execute on function private.owns_rca_fishbone_cause(uuid, uuid) to authenticated;
grant execute on function private.owns_gap_action(uuid, uuid) to authenticated;

-- FMEA -----------------------------------------------------------------------

drop policy if exists "Users can insert own processes" on public.processes;
create policy "Users can insert own processes"
on public.processes for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.areas as a
    where a.id = processes.area_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own processes" on public.processes;
create policy "Users can update own processes"
on public.processes for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.areas as a
    where a.id = processes.area_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own assessments" on public.risk_assessments;
create policy "Users can insert own assessments"
on public.risk_assessments for insert to authenticated
with check (
  auth.uid() = user_id
  and (
    area_id is null
    or exists (
      select 1 from public.areas as a
      where a.id = risk_assessments.area_id
        and a.user_id = auth.uid()
    )
  )
  and (
    process_id is null
    or exists (
      select 1 from public.processes as p
      where p.id = risk_assessments.process_id
        and p.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own assessments" on public.risk_assessments;
create policy "Users can update own assessments"
on public.risk_assessments for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    area_id is null
    or exists (
      select 1 from public.areas as a
      where a.id = risk_assessments.area_id
        and a.user_id = auth.uid()
    )
  )
  and (
    process_id is null
    or exists (
      select 1 from public.processes as p
      where p.id = risk_assessments.process_id
        and p.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can insert own risk_items" on public.risk_items;
create policy "Users can insert own risk_items"
on public.risk_items for insert to authenticated
with check (
  exists (
    select 1 from public.risk_assessments as ra
    where ra.id = risk_items.assessment_id
      and ra.user_id = auth.uid()
  )
  and (
    process_step_id is null
    or exists (
      select 1
      from public.process_steps as ps
      join public.processes as p on p.id = ps.process_id
      where ps.id = risk_items.process_step_id
        and p.user_id = auth.uid()
    )
  )
  and (
    risk_catalog_user_id is null
    or exists (
      select 1 from public.risk_catalog_user as rcu
      where rcu.id = risk_items.risk_catalog_user_id
        and rcu.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own risk_items" on public.risk_items;
create policy "Users can update own risk_items"
on public.risk_items for update to authenticated
using (
  exists (
    select 1 from public.risk_assessments as ra
    where ra.id = risk_items.assessment_id
      and ra.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.risk_assessments as ra
    where ra.id = risk_items.assessment_id
      and ra.user_id = auth.uid()
  )
  and (
    process_step_id is null
    or exists (
      select 1
      from public.process_steps as ps
      join public.processes as p on p.id = ps.process_id
      where ps.id = risk_items.process_step_id
        and p.user_id = auth.uid()
    )
  )
  and (
    risk_catalog_user_id is null
    or exists (
      select 1 from public.risk_catalog_user as rcu
      where rcu.id = risk_items.risk_catalog_user_id
        and rcu.user_id = auth.uid()
    )
  )
);

-- RCA ------------------------------------------------------------------------

drop policy if exists "Users can insert own RCA causes" on public.rca_causes;
create policy "Users can insert own RCA causes"
on public.rca_causes for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_causes.assessment_id
      and ra.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own RCA causes" on public.rca_causes;
create policy "Users can update own RCA causes"
on public.rca_causes for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_causes.assessment_id
      and ra.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own RCA fishbone diagrams" on public.rca_fishbone_diagrams;
create policy "Users can insert own RCA fishbone diagrams"
on public.rca_fishbone_diagrams for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_fishbone_diagrams.assessment_id
      and ra.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own RCA fishbone diagrams" on public.rca_fishbone_diagrams;
create policy "Users can update own RCA fishbone diagrams"
on public.rca_fishbone_diagrams for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_fishbone_diagrams.assessment_id
      and ra.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own RCA fishbone branches" on public.rca_fishbone_branches;
create policy "Users can insert own RCA fishbone branches"
on public.rca_fishbone_branches for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_fishbone_branches.assessment_id
      and ra.user_id = auth.uid()
  )
  and exists (
    select 1 from public.rca_fishbone_diagrams as fd
    where fd.id = rca_fishbone_branches.diagram_id
      and fd.assessment_id = rca_fishbone_branches.assessment_id
      and fd.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own RCA fishbone branches" on public.rca_fishbone_branches;
create policy "Users can update own RCA fishbone branches"
on public.rca_fishbone_branches for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_fishbone_branches.assessment_id
      and ra.user_id = auth.uid()
  )
  and exists (
    select 1 from public.rca_fishbone_diagrams as fd
    where fd.id = rca_fishbone_branches.diagram_id
      and fd.assessment_id = rca_fishbone_branches.assessment_id
      and fd.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own RCA fishbone causes" on public.rca_fishbone_causes;
create policy "Users can insert own RCA fishbone causes"
on public.rca_fishbone_causes for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_fishbone_causes.assessment_id
      and ra.user_id = auth.uid()
  )
  and exists (
    select 1 from public.rca_fishbone_branches as fb
    where fb.id = rca_fishbone_causes.branch_id
      and fb.assessment_id = rca_fishbone_causes.assessment_id
      and fb.user_id = auth.uid()
  )
  and exists (
    select 1 from public.rca_causes as c
    where c.id = rca_fishbone_causes.cause_id
      and c.assessment_id = rca_fishbone_causes.assessment_id
      and c.user_id = auth.uid()
  )
  and (
    parent_id is null
    or private.owns_rca_fishbone_cause(parent_id, assessment_id)
  )
);

drop policy if exists "Users can update own RCA fishbone causes" on public.rca_fishbone_causes;
create policy "Users can update own RCA fishbone causes"
on public.rca_fishbone_causes for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_fishbone_causes.assessment_id
      and ra.user_id = auth.uid()
  )
  and exists (
    select 1 from public.rca_fishbone_branches as fb
    where fb.id = rca_fishbone_causes.branch_id
      and fb.assessment_id = rca_fishbone_causes.assessment_id
      and fb.user_id = auth.uid()
  )
  and exists (
    select 1 from public.rca_causes as c
    where c.id = rca_fishbone_causes.cause_id
      and c.assessment_id = rca_fishbone_causes.assessment_id
      and c.user_id = auth.uid()
  )
  and (
    parent_id is null
    or private.owns_rca_fishbone_cause(parent_id, assessment_id)
  )
);

drop policy if exists "Users can insert own RCA five why chains" on public.rca_five_why_chains;
create policy "Users can insert own RCA five why chains"
on public.rca_five_why_chains for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_five_why_chains.assessment_id
      and ra.user_id = auth.uid()
  )
  and (
    cause_id is null
    or exists (
      select 1 from public.rca_causes as c
      where c.id = rca_five_why_chains.cause_id
        and c.assessment_id = rca_five_why_chains.assessment_id
        and c.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own RCA five why chains" on public.rca_five_why_chains;
create policy "Users can update own RCA five why chains"
on public.rca_five_why_chains for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_five_why_chains.assessment_id
      and ra.user_id = auth.uid()
  )
  and (
    cause_id is null
    or exists (
      select 1 from public.rca_causes as c
      where c.id = rca_five_why_chains.cause_id
        and c.assessment_id = rca_five_why_chains.assessment_id
        and c.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can insert own RCA five why steps" on public.rca_five_why_steps;
create policy "Users can insert own RCA five why steps"
on public.rca_five_why_steps for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_five_why_steps.assessment_id
      and ra.user_id = auth.uid()
  )
  and exists (
    select 1 from public.rca_five_why_chains as c
    where c.id = rca_five_why_steps.chain_id
      and c.assessment_id = rca_five_why_steps.assessment_id
      and c.user_id = auth.uid()
  )
  and (
    cause_id is null
    or exists (
      select 1 from public.rca_causes as rc
      where rc.id = rca_five_why_steps.cause_id
        and rc.assessment_id = rca_five_why_steps.assessment_id
        and rc.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own RCA five why steps" on public.rca_five_why_steps;
create policy "Users can update own RCA five why steps"
on public.rca_five_why_steps for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_five_why_steps.assessment_id
      and ra.user_id = auth.uid()
  )
  and exists (
    select 1 from public.rca_five_why_chains as c
    where c.id = rca_five_why_steps.chain_id
      and c.assessment_id = rca_five_why_steps.assessment_id
      and c.user_id = auth.uid()
  )
  and (
    cause_id is null
    or exists (
      select 1 from public.rca_causes as rc
      where rc.id = rca_five_why_steps.cause_id
        and rc.assessment_id = rca_five_why_steps.assessment_id
        and rc.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can insert own RCA action plans" on public.rca_action_plans;
create policy "Users can insert own RCA action plans"
on public.rca_action_plans for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_action_plans.assessment_id
      and ra.user_id = auth.uid()
  )
  and (
    cause_id is null
    or exists (
      select 1 from public.rca_causes as c
      where c.id = rca_action_plans.cause_id
        and c.assessment_id = rca_action_plans.assessment_id
        and c.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own RCA action plans" on public.rca_action_plans;
create policy "Users can update own RCA action plans"
on public.rca_action_plans for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rca_assessments as ra
    where ra.id = rca_action_plans.assessment_id
      and ra.user_id = auth.uid()
  )
  and (
    cause_id is null
    or exists (
      select 1 from public.rca_causes as c
      where c.id = rca_action_plans.cause_id
        and c.assessment_id = rca_action_plans.assessment_id
        and c.user_id = auth.uid()
    )
  )
);

-- Gap Analysis ----------------------------------------------------------------

drop policy if exists "Users can insert own gap areas" on public.gap_areas;
create policy "Users can insert own gap areas"
on public.gap_areas for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_processes as p
    where p.id = gap_areas.process_id
      and p.user_id = auth.uid()
  )
  and (
    created_in_assessment_id is null
    or exists (
      select 1 from public.gap_assessments as ga
      where ga.id = gap_areas.created_in_assessment_id
        and ga.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own gap areas" on public.gap_areas;
create policy "Users can update own gap areas"
on public.gap_areas for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_processes as p
    where p.id = gap_areas.process_id
      and p.user_id = auth.uid()
  )
  and (
    created_in_assessment_id is null
    or exists (
      select 1 from public.gap_assessments as ga
      where ga.id = gap_areas.created_in_assessment_id
        and ga.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can insert own gap activities" on public.gap_activities;
create policy "Users can insert own gap activities"
on public.gap_activities for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_areas as a
    where a.id = gap_activities.area_id
      and a.user_id = auth.uid()
  )
  and (
    created_in_assessment_id is null
    or exists (
      select 1 from public.gap_assessments as ga
      where ga.id = gap_activities.created_in_assessment_id
        and ga.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own gap activities" on public.gap_activities;
create policy "Users can update own gap activities"
on public.gap_activities for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_areas as a
    where a.id = gap_activities.area_id
      and a.user_id = auth.uid()
  )
  and (
    created_in_assessment_id is null
    or exists (
      select 1 from public.gap_assessments as ga
      where ga.id = gap_activities.created_in_assessment_id
        and ga.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can insert own gap standards" on public.gap_standards;
create policy "Users can insert own gap standards"
on public.gap_standards for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    created_in_assessment_id is null
    or exists (
      select 1 from public.gap_assessments as ga
      where ga.id = gap_standards.created_in_assessment_id
        and ga.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own gap standards" on public.gap_standards;
create policy "Users can update own gap standards"
on public.gap_standards for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    created_in_assessment_id is null
    or exists (
      select 1 from public.gap_assessments as ga
      where ga.id = gap_standards.created_in_assessment_id
        and ga.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can insert own gap activity standards" on public.gap_activity_standards;
create policy "Users can insert own gap activity standards"
on public.gap_activity_standards for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_activities as a
    where a.id = gap_activity_standards.activity_id
      and a.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_standards as s
    where s.id = gap_activity_standards.standard_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own gap activity standards" on public.gap_activity_standards;
create policy "Users can update own gap activity standards"
on public.gap_activity_standards for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_activities as a
    where a.id = gap_activity_standards.activity_id
      and a.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_standards as s
    where s.id = gap_activity_standards.standard_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own gap assessment processes" on public.gap_assessment_processes;
create policy "Users can insert own gap assessment processes"
on public.gap_assessment_processes for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_assessments as ga
    where ga.id = gap_assessment_processes.assessment_id
      and ga.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_processes as gp
    where gp.id = gap_assessment_processes.process_id
      and gp.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own gap assessment processes" on public.gap_assessment_processes;
create policy "Users can update own gap assessment processes"
on public.gap_assessment_processes for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_assessments as ga
    where ga.id = gap_assessment_processes.assessment_id
      and ga.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_processes as gp
    where gp.id = gap_assessment_processes.process_id
      and gp.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own gap activity evaluations" on public.gap_activity_evaluations;
create policy "Users can insert own gap activity evaluations"
on public.gap_activity_evaluations for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_assessments as ga
    where ga.id = gap_activity_evaluations.assessment_id
      and ga.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_activities as a
    where a.id = gap_activity_evaluations.activity_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own gap activity evaluations" on public.gap_activity_evaluations;
create policy "Users can update own gap activity evaluations"
on public.gap_activity_evaluations for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_assessments as ga
    where ga.id = gap_activity_evaluations.assessment_id
      and ga.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_activities as a
    where a.id = gap_activity_evaluations.activity_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own gap actions" on public.gap_actions;
create policy "Users can insert own gap actions"
on public.gap_actions for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_assessments as ga
    where ga.id = gap_actions.assessment_id
      and ga.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_activities as a
    where a.id = gap_actions.activity_id
      and a.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_activity_evaluations as e
    where e.id = gap_actions.evaluation_id
      and e.assessment_id = gap_actions.assessment_id
      and e.activity_id = gap_actions.activity_id
      and e.user_id = auth.uid()
  )
  and (
    depends_on_action_id is null
    or private.owns_gap_action(depends_on_action_id, assessment_id)
  )
);

drop policy if exists "Users can update own gap actions" on public.gap_actions;
create policy "Users can update own gap actions"
on public.gap_actions for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_assessments as ga
    where ga.id = gap_actions.assessment_id
      and ga.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_activities as a
    where a.id = gap_actions.activity_id
      and a.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_activity_evaluations as e
    where e.id = gap_actions.evaluation_id
      and e.assessment_id = gap_actions.assessment_id
      and e.activity_id = gap_actions.activity_id
      and e.user_id = auth.uid()
  )
  and (
    depends_on_action_id is null
    or private.owns_gap_action(depends_on_action_id, assessment_id)
  )
);

drop policy if exists "Users can insert own gap action events" on public.gap_action_events;
create policy "Users can insert own gap action events"
on public.gap_action_events for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_assessments as ga
    where ga.id = gap_action_events.assessment_id
      and ga.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_activities as a
    where a.id = gap_action_events.activity_id
      and a.user_id = auth.uid()
  )
  and (
    evaluation_id is null
    or exists (
      select 1 from public.gap_activity_evaluations as e
      where e.id = gap_action_events.evaluation_id
        and e.assessment_id = gap_action_events.assessment_id
        and e.activity_id = gap_action_events.activity_id
        and e.user_id = auth.uid()
    )
  )
  and exists (
    select 1 from public.gap_actions as a
    where a.id = gap_action_events.action_id
      and a.assessment_id = gap_action_events.assessment_id
      and a.activity_id = gap_action_events.activity_id
      and (
        gap_action_events.evaluation_id is null
        or a.evaluation_id = gap_action_events.evaluation_id
      )
      and a.user_id = auth.uid()
  )
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists "Users can update own gap action events" on public.gap_action_events;
create policy "Users can update own gap action events"
on public.gap_action_events for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.gap_assessments as ga
    where ga.id = gap_action_events.assessment_id
      and ga.user_id = auth.uid()
  )
  and exists (
    select 1 from public.gap_activities as a
    where a.id = gap_action_events.activity_id
      and a.user_id = auth.uid()
  )
  and (
    evaluation_id is null
    or exists (
      select 1 from public.gap_activity_evaluations as e
      where e.id = gap_action_events.evaluation_id
        and e.assessment_id = gap_action_events.assessment_id
        and e.activity_id = gap_action_events.activity_id
        and e.user_id = auth.uid()
    )
  )
  and exists (
    select 1 from public.gap_actions as a
    where a.id = gap_action_events.action_id
      and a.assessment_id = gap_action_events.assessment_id
      and a.activity_id = gap_action_events.activity_id
      and (
        gap_action_events.evaluation_id is null
        or a.evaluation_id = gap_action_events.evaluation_id
      )
      and a.user_id = auth.uid()
  )
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists "Users can insert own gap links" on public.gap_links;
create policy "Users can insert own gap links"
on public.gap_links for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    assessment_id is null
    or exists (
      select 1 from public.gap_assessments as ga
      where ga.id = gap_links.assessment_id
        and ga.user_id = auth.uid()
    )
  )
  and (
    activity_id is null
    or exists (
      select 1 from public.gap_activities as a
      where a.id = gap_links.activity_id
        and a.user_id = auth.uid()
    )
  )
  and (
    evaluation_id is null
    or exists (
      select 1 from public.gap_activity_evaluations as e
      where e.id = gap_links.evaluation_id
        and e.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own gap links" on public.gap_links;
create policy "Users can update own gap links"
on public.gap_links for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    assessment_id is null
    or exists (
      select 1 from public.gap_assessments as ga
      where ga.id = gap_links.assessment_id
        and ga.user_id = auth.uid()
    )
  )
  and (
    activity_id is null
    or exists (
      select 1 from public.gap_activities as a
      where a.id = gap_links.activity_id
        and a.user_id = auth.uid()
    )
  )
  and (
    evaluation_id is null
    or exists (
      select 1 from public.gap_activity_evaluations as e
      where e.id = gap_links.evaluation_id
        and e.user_id = auth.uid()
    )
  )
);
