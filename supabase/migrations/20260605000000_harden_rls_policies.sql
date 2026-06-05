-- Hardening RLS policies for PhaRMA T.
-- This migration is additive in intent: it recreates existing policies with
-- stricter roles and explicit WITH CHECK clauses where appropriate.
-- It does not modify tables, data, or application logic.

do $$
begin
  if to_regclass('public.risk_catalog_base') is not null then
    execute 'drop policy if exists "Anyone can view base catalog" on public.risk_catalog_base';
    execute 'create policy "Authenticated users can view base catalog"
      on public.risk_catalog_base for select
      to authenticated
      using (true)';
  end if;

  if to_regclass('public.areas') is not null then
    execute 'drop policy if exists "Users can view own areas" on public.areas';
    execute 'drop policy if exists "Users can insert own areas" on public.areas';
    execute 'drop policy if exists "Users can update own areas" on public.areas';
    execute 'drop policy if exists "Users can delete own areas" on public.areas';
    execute 'create policy "Users can view own areas"
      on public.areas for select
      to authenticated
      using (auth.uid() = user_id)';
    execute 'create policy "Users can insert own areas"
      on public.areas for insert
      to authenticated
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can update own areas"
      on public.areas for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can delete own areas"
      on public.areas for delete
      to authenticated
      using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.processes') is not null then
    execute 'drop policy if exists "Users can view own processes" on public.processes';
    execute 'drop policy if exists "Users can insert own processes" on public.processes';
    execute 'drop policy if exists "Users can update own processes" on public.processes';
    execute 'drop policy if exists "Users can delete own processes" on public.processes';
    execute 'create policy "Users can view own processes"
      on public.processes for select
      to authenticated
      using (auth.uid() = user_id)';
    execute 'create policy "Users can insert own processes"
      on public.processes for insert
      to authenticated
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can update own processes"
      on public.processes for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can delete own processes"
      on public.processes for delete
      to authenticated
      using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.process_steps') is not null then
    execute 'drop policy if exists "Users can view own process_steps" on public.process_steps';
    execute 'drop policy if exists "Users can insert own process_steps" on public.process_steps';
    execute 'drop policy if exists "Users can update own process_steps" on public.process_steps';
    execute 'drop policy if exists "Users can delete own process_steps" on public.process_steps';
    execute 'create policy "Users can view own process_steps"
      on public.process_steps for select
      to authenticated
      using (
        exists (
          select 1 from public.processes
          where processes.id = process_steps.process_id
            and processes.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can insert own process_steps"
      on public.process_steps for insert
      to authenticated
      with check (
        exists (
          select 1 from public.processes
          where processes.id = process_steps.process_id
            and processes.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can update own process_steps"
      on public.process_steps for update
      to authenticated
      using (
        exists (
          select 1 from public.processes
          where processes.id = process_steps.process_id
            and processes.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.processes
          where processes.id = process_steps.process_id
            and processes.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can delete own process_steps"
      on public.process_steps for delete
      to authenticated
      using (
        exists (
          select 1 from public.processes
          where processes.id = process_steps.process_id
            and processes.user_id = auth.uid()
        )
      )';
  end if;

  if to_regclass('public.risk_assessments') is not null then
    execute 'drop policy if exists "Users can view own assessments" on public.risk_assessments';
    execute 'drop policy if exists "Users can insert own assessments" on public.risk_assessments';
    execute 'drop policy if exists "Users can update own assessments" on public.risk_assessments';
    execute 'drop policy if exists "Users can delete own assessments" on public.risk_assessments';
    execute 'create policy "Users can view own assessments"
      on public.risk_assessments for select
      to authenticated
      using (auth.uid() = user_id)';
    execute 'create policy "Users can insert own assessments"
      on public.risk_assessments for insert
      to authenticated
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can update own assessments"
      on public.risk_assessments for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can delete own assessments"
      on public.risk_assessments for delete
      to authenticated
      using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.risk_items') is not null then
    execute 'drop policy if exists "Users can view own risk_items" on public.risk_items';
    execute 'drop policy if exists "Users can insert own risk_items" on public.risk_items';
    execute 'drop policy if exists "Users can update own risk_items" on public.risk_items';
    execute 'drop policy if exists "Users can delete own risk_items" on public.risk_items';
    execute 'create policy "Users can view own risk_items"
      on public.risk_items for select
      to authenticated
      using (
        exists (
          select 1 from public.risk_assessments
          where risk_assessments.id = risk_items.assessment_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can insert own risk_items"
      on public.risk_items for insert
      to authenticated
      with check (
        exists (
          select 1 from public.risk_assessments
          where risk_assessments.id = risk_items.assessment_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can update own risk_items"
      on public.risk_items for update
      to authenticated
      using (
        exists (
          select 1 from public.risk_assessments
          where risk_assessments.id = risk_items.assessment_id
            and risk_assessments.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.risk_assessments
          where risk_assessments.id = risk_items.assessment_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can delete own risk_items"
      on public.risk_items for delete
      to authenticated
      using (
        exists (
          select 1 from public.risk_assessments
          where risk_assessments.id = risk_items.assessment_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
  end if;

  if to_regclass('public.action_plans') is not null then
    execute 'drop policy if exists "Users can view own action_plans" on public.action_plans';
    execute 'drop policy if exists "Users can insert own action_plans" on public.action_plans';
    execute 'drop policy if exists "Users can update own action_plans" on public.action_plans';
    execute 'drop policy if exists "Users can delete own action_plans" on public.action_plans';
    execute 'create policy "Users can view own action_plans"
      on public.action_plans for select
      to authenticated
      using (
        exists (
          select 1
          from public.risk_items
          join public.risk_assessments on risk_assessments.id = risk_items.assessment_id
          where risk_items.id = action_plans.risk_item_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can insert own action_plans"
      on public.action_plans for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.risk_items
          join public.risk_assessments on risk_assessments.id = risk_items.assessment_id
          where risk_items.id = action_plans.risk_item_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can update own action_plans"
      on public.action_plans for update
      to authenticated
      using (
        exists (
          select 1
          from public.risk_items
          join public.risk_assessments on risk_assessments.id = risk_items.assessment_id
          where risk_items.id = action_plans.risk_item_id
            and risk_assessments.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.risk_items
          join public.risk_assessments on risk_assessments.id = risk_items.assessment_id
          where risk_items.id = action_plans.risk_item_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can delete own action_plans"
      on public.action_plans for delete
      to authenticated
      using (
        exists (
          select 1
          from public.risk_items
          join public.risk_assessments on risk_assessments.id = risk_items.assessment_id
          where risk_items.id = action_plans.risk_item_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
  end if;

  if to_regclass('public.control_measures') is not null then
    execute 'drop policy if exists "Users can view own control_measures" on public.control_measures';
    execute 'drop policy if exists "Users can insert own control_measures" on public.control_measures';
    execute 'drop policy if exists "Users can update own control_measures" on public.control_measures';
    execute 'drop policy if exists "Users can delete own control_measures" on public.control_measures';
    execute 'create policy "Users can view own control_measures"
      on public.control_measures for select
      to authenticated
      using (
        exists (
          select 1
          from public.risk_items
          join public.risk_assessments on risk_assessments.id = risk_items.assessment_id
          where risk_items.id = control_measures.risk_item_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can insert own control_measures"
      on public.control_measures for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.risk_items
          join public.risk_assessments on risk_assessments.id = risk_items.assessment_id
          where risk_items.id = control_measures.risk_item_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can update own control_measures"
      on public.control_measures for update
      to authenticated
      using (
        exists (
          select 1
          from public.risk_items
          join public.risk_assessments on risk_assessments.id = risk_items.assessment_id
          where risk_items.id = control_measures.risk_item_id
            and risk_assessments.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.risk_items
          join public.risk_assessments on risk_assessments.id = risk_items.assessment_id
          where risk_items.id = control_measures.risk_item_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
    execute 'create policy "Users can delete own control_measures"
      on public.control_measures for delete
      to authenticated
      using (
        exists (
          select 1
          from public.risk_items
          join public.risk_assessments on risk_assessments.id = risk_items.assessment_id
          where risk_items.id = control_measures.risk_item_id
            and risk_assessments.user_id = auth.uid()
        )
      )';
  end if;

  if to_regclass('public.user_custom_risks') is not null then
    execute 'drop policy if exists "Users can view own custom risks" on public.user_custom_risks';
    execute 'drop policy if exists "Users can insert own custom risks" on public.user_custom_risks';
    execute 'drop policy if exists "Users can update own custom risks" on public.user_custom_risks';
    execute 'drop policy if exists "Users can delete own custom risks" on public.user_custom_risks';
    execute 'create policy "Users can view own custom risks"
      on public.user_custom_risks for select
      to authenticated
      using (auth.uid() = user_id)';
    execute 'create policy "Users can insert own custom risks"
      on public.user_custom_risks for insert
      to authenticated
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can update own custom risks"
      on public.user_custom_risks for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can delete own custom risks"
      on public.user_custom_risks for delete
      to authenticated
      using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.user_settings') is not null then
    execute 'drop policy if exists "Users can view own settings" on public.user_settings';
    execute 'drop policy if exists "Users can insert own settings" on public.user_settings';
    execute 'drop policy if exists "Users can update own settings" on public.user_settings';
    execute 'drop policy if exists "Users can delete own settings" on public.user_settings';
    execute 'create policy "Users can view own settings"
      on public.user_settings for select
      to authenticated
      using (auth.uid() = user_id)';
    execute 'create policy "Users can insert own settings"
      on public.user_settings for insert
      to authenticated
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can update own settings"
      on public.user_settings for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can delete own settings"
      on public.user_settings for delete
      to authenticated
      using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.risk_catalog_user') is not null then
    execute 'drop policy if exists "Users can view own risk catalog" on public.risk_catalog_user';
    execute 'drop policy if exists "Users can insert own risk catalog" on public.risk_catalog_user';
    execute 'drop policy if exists "Users can update own risk catalog" on public.risk_catalog_user';
    execute 'drop policy if exists "Users can delete own risk catalog" on public.risk_catalog_user';
    execute 'create policy "Users can view own risk catalog"
      on public.risk_catalog_user for select
      to authenticated
      using (auth.uid() = user_id)';
    execute 'create policy "Users can insert own risk catalog"
      on public.risk_catalog_user for insert
      to authenticated
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can update own risk catalog"
      on public.risk_catalog_user for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
    execute 'create policy "Users can delete own risk catalog"
      on public.risk_catalog_user for delete
      to authenticated
      using (auth.uid() = user_id)';
  end if;
end $$;

do $$
declare
  rca_table text;
  rca_label text;
begin
  for rca_table, rca_label in
    select * from (
      values
        ('rca_assessments', 'RCA assessments'),
        ('rca_causes', 'RCA causes'),
        ('rca_fishbone_diagrams', 'RCA fishbone diagrams'),
        ('rca_fishbone_branches', 'RCA fishbone branches'),
        ('rca_fishbone_causes', 'RCA fishbone causes'),
        ('rca_five_why_chains', 'RCA five why chains'),
        ('rca_five_why_steps', 'RCA five why steps'),
        ('rca_action_plans', 'RCA action plans')
    ) as rls_policy_targets(table_name, label)
  loop
    if to_regclass('public.' || rca_table) is not null then
      execute format('drop policy if exists %I on public.%I', 'Users can select own ' || rca_label, rca_table);
      execute format('drop policy if exists %I on public.%I', 'Users can insert own ' || rca_label, rca_table);
      execute format('drop policy if exists %I on public.%I', 'Users can update own ' || rca_label, rca_table);
      execute format('drop policy if exists %I on public.%I', 'Users can delete own ' || rca_label, rca_table);

      execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid())', 'Users can select own ' || rca_label, rca_table);
      execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())', 'Users can insert own ' || rca_label, rca_table);
      execute format('create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', 'Users can update own ' || rca_label, rca_table);
      execute format('create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())', 'Users can delete own ' || rca_label, rca_table);
    end if;
  end loop;
end $$;
