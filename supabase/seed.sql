-- Synthetic local-only dataset for PhaRMA T.
-- Never replace this file with a production dump.

create extension if not exists pgcrypto;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'user_a@pharmat.local',
    crypt('LocalOnly!Passw0rd-A', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"USER_A"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'user_b@pharmat.local',
    crypt('LocalOnly!Passw0rd-B', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"USER_B"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '11000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '{"sub":"10000000-0000-4000-8000-000000000001","email":"user_a@pharmat.local"}'::jsonb,
    'email',
    'user_a@pharmat.local',
    now(),
    now(),
    now()
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '{"sub":"10000000-0000-4000-8000-000000000002","email":"user_b@pharmat.local"}'::jsonb,
    'email',
    'user_b@pharmat.local',
    now(),
    now(),
    now()
  )
on conflict (id) do nothing;

-- FMEA: shared synthetic base catalog.
insert into public.risk_catalog_base (id, category, name, description)
values
  ('24000000-0000-4000-8000-000000000001', 'Processo', 'Controllo documentale incompleto', 'Voce sintetica per test locale.'),
  ('24000000-0000-4000-8000-000000000002', 'Tecnologia', 'Sistema informativo non disponibile', 'Voce sintetica per test locale.');

insert into public.areas (id, user_id, name, description)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Area sintetica A', 'Area FMEA locale di USER_A.'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Area sintetica B', 'Area FMEA locale di USER_B.');

insert into public.processes (id, user_id, area_id, name, description)
values
  ('21000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Processo sintetico A', 'Processo locale di USER_A.'),
  ('21000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Processo sintetico B', 'Processo locale di USER_B.');

insert into public.process_steps (id, process_id, step_number, name, description)
values
  ('22000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 1, 'Fase sintetica A', 'Fase locale di USER_A.'),
  ('22000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000002', 1, 'Fase sintetica B', 'Fase locale di USER_B.');

insert into public.risk_assessments (id, user_id, area_id, process_id, title, description, status)
values
  ('23000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 'FMEA sintetica USER_A', 'Assessment esclusivamente locale.', 'in_progress'),
  ('23000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000002', 'FMEA sintetica USER_B', 'Assessment esclusivamente locale.', 'draft');

insert into public.risk_catalog_user (id, user_id, category, name, description)
values
  ('24100000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Organizzazione', 'Rischio personale sintetico A', 'Dato locale.'),
  ('24100000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Organizzazione', 'Rischio personale sintetico B', 'Dato locale.');

insert into public.risk_items (
  id, assessment_id, process_step_id, risk_catalog_base_id,
  custom_risk_name, custom_risk_description, severity, probability, detectability, notes
)
values
  ('25000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Rischio sintetico A', 'Scenario simulato senza riferimenti reali.', 4, 3, 2, 'Nota sintetica A.'),
  ('25000000-0000-4000-8000-000000000002', '23000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000002', '24000000-0000-4000-8000-000000000002', 'Rischio sintetico B', 'Scenario simulato senza riferimenti reali.', 3, 2, 3, 'Nota sintetica B.');

insert into public.control_measures (id, risk_item_id, description, measure_type, effectiveness)
values
  ('26000000-0000-4000-8000-000000000001', '25000000-0000-4000-8000-000000000001', 'Checklist sintetica A', 'preventive', 'medium'),
  ('26000000-0000-4000-8000-000000000002', '25000000-0000-4000-8000-000000000002', 'Checklist sintetica B', 'detective', 'high');

insert into public.action_plans (id, risk_item_id, description, responsible, due_date, status, notes)
values
  ('27000000-0000-4000-8000-000000000001', '25000000-0000-4000-8000-000000000001', 'Azione FMEA sintetica A', 'Funzione A', current_date + 30, 'planned', 'Solo test locale.'),
  ('27000000-0000-4000-8000-000000000002', '25000000-0000-4000-8000-000000000002', 'Azione FMEA sintetica B', 'Funzione B', current_date + 45, 'in_progress', 'Solo test locale.');

insert into public.user_custom_risks (id, user_id, name, category, description)
values
  ('29000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Voce sintetica USER_A', 'Locale', 'Nessun dato reale.'),
  ('29000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Voce sintetica USER_B', 'Locale', 'Nessun dato reale.');

insert into public.user_settings (id, user_id, organization_name, facility_name)
values
  ('28000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Organizzazione sintetica A', 'Struttura locale A'),
  ('28000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Organizzazione sintetica B', 'Struttura locale B');

-- RCA.
insert into public.rca_assessments (
  id, user_id, title, description, status, methodology, event_title,
  event_description, event_type, event_date, location, department, severity,
  immediate_containment, summary
)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'RCA sintetica USER_A', 'Analisi locale senza dati reali.', 'in_progress', 'combined', 'Evento sintetico A', 'Evento simulato per test.', 'near_miss', current_date - 7, 'Area simulata A', 'Unita sintetica A', 'high', 'Contenimento simulato A', 'Riepilogo sintetico A'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'RCA sintetica USER_B', 'Analisi locale senza dati reali.', 'draft', 'fishbone', 'Evento sintetico B', 'Evento simulato per test.', 'incident', current_date - 3, 'Area simulata B', 'Unita sintetica B', 'medium', 'Contenimento simulato B', 'Riepilogo sintetico B');

insert into public.rca_causes (
  id, assessment_id, user_id, description, category, source_type,
  is_root_cause, confidence_level, evidence, root_cause_status
)
values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Causa sintetica A', 'processes_procedures', 'fishbone', true, 'high', 'Evidenza simulata A', 'candidate'),
  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Causa sintetica B', 'people', 'fishbone', true, 'medium', 'Evidenza simulata B', 'candidate');

insert into public.rca_fishbone_diagrams (id, assessment_id, user_id, title, effect_statement, status)
values
  ('32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Ishikawa sintetico A', 'Effetto simulato A', 'draft'),
  ('32000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Ishikawa sintetico B', 'Effetto simulato B', 'draft');

insert into public.rca_fishbone_branches (
  id, diagram_id, assessment_id, user_id, name, source_type, standard_key, sort_order
)
values
  ('33000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Processi / Procedure', 'standard', 'processes_procedures', 1),
  ('33000000-0000-4000-8000-000000000002', '32000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Persone', 'standard', 'people', 1);

insert into public.rca_fishbone_causes (id, branch_id, assessment_id, user_id, cause_id, sort_order)
values
  ('34000000-0000-4000-8000-000000000001', '33000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', 1),
  ('34000000-0000-4000-8000-000000000002', '33000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000002', 1);

insert into public.rca_five_why_chains (id, assessment_id, user_id, title, problem_statement, status, cause_id)
values
  ('35000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 Whys sintetica A', 'Problema simulato A', 'draft', '31000000-0000-4000-8000-000000000001'),
  ('35000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '5 Whys sintetica B', 'Problema simulato B', 'draft', '31000000-0000-4000-8000-000000000002');

insert into public.rca_five_why_steps (
  id, chain_id, assessment_id, user_id, step_number, why_question, answer, cause_id, is_root_step
)
values
  ('36000000-0000-4000-8000-000000000001', '35000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 1, 'Perche e accaduto?', 'Risposta sintetica A', '31000000-0000-4000-8000-000000000001', true),
  ('36000000-0000-4000-8000-000000000002', '35000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 1, 'Perche e accaduto?', 'Risposta sintetica B', '31000000-0000-4000-8000-000000000002', true);

insert into public.rca_action_plans (
  id, assessment_id, cause_id, user_id, description, responsible,
  due_date, status, priority, notes
)
values
  ('37000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Azione RCA sintetica A', 'Funzione A', current_date + 30, 'planned', 'high', 'Solo test locale.'),
  ('37000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Azione RCA sintetica B', 'Funzione B', current_date + 45, 'in_progress', 'medium', 'Solo test locale.');

-- Gap Analysis.
insert into public.gap_processes (id, user_id, code, name, description, order_index)
values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'SYN-A', 'Macro-processo sintetico A', 'Libreria locale USER_A.', 1),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'SYN-B', 'Macro-processo sintetico B', 'Libreria locale USER_B.', 1);

insert into public.gap_areas (id, user_id, process_id, code, name, description, order_index, source_type)
values
  ('41000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'SYN-A-DOM', 'Dominio sintetico A', '[Contesto operativo: Laboratorio sintetico A]\nDescrizione locale.', 1, 'library'),
  ('41000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'SYN-B-DOM', 'Dominio sintetico B', '[Contesto operativo: Laboratorio sintetico B]\nDescrizione locale.', 1, 'library');

insert into public.gap_activities (
  id, user_id, area_id, code, name, description, operator, target_state, order_index, source_type
)
values
  ('42000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', 'SYN-A-DOM-01', 'Attivita sintetica A', 'Requisito locale USER_A.', 'Funzione A', 'Target sintetico verificabile A.', 1, 'library'),
  ('42000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000002', 'SYN-B-DOM-01', 'Attivita sintetica B', 'Requisito locale USER_B.', 'Funzione B', 'Target sintetico verificabile B.', 1, 'library');

insert into public.gap_standards (
  id, user_id, code, name, version, issuing_body, description, url,
  is_template, is_mandatory, application_scope, source_type
)
values
  ('43000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'NORMA-SYN-A', 'Norma sintetica A', '1.0', 'Ente sintetico A', 'Riferimento esclusivamente locale.', 'https://example.invalid/norma-a', false, true, 'Ambito sintetico A', 'library'),
  ('43000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'NORMA-SYN-B', 'Norma sintetica B', '1.0', 'Ente sintetico B', 'Riferimento esclusivamente locale.', 'https://example.invalid/norma-b', false, false, 'Ambito sintetico B', 'library');

insert into public.gap_activity_standards (id, user_id, activity_id, standard_id, specific_reference)
values
  ('44000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000001', 'Sezione sintetica A'),
  ('44000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '42000000-0000-4000-8000-000000000002', '43000000-0000-4000-8000-000000000002', 'Sezione sintetica B');

insert into public.gap_assessments (
  id, user_id, title, description, facility_name, department, assessor,
  assessment_date, status, total_activities, non_compliant_count,
  partial_count, compliance_percentage
)
values
  ('45000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Gap sintetica USER_A', 'Assessment esclusivamente locale.', 'Struttura sintetica A', 'Unita A', 'Valutatore A', current_date, 'in_progress', 1, 1, 0, 0),
  ('45000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Gap sintetica USER_B', 'Assessment esclusivamente locale.', 'Struttura sintetica B', 'Unita B', 'Valutatore B', current_date, 'in_progress', 1, 0, 1, 50);

insert into public.gap_assessment_processes (id, user_id, assessment_id, process_id)
values
  ('46000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('46000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '45000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002');

insert into public.gap_activity_evaluations (
  id, user_id, assessment_id, activity_id, current_state, gap_description,
  compliance_status, risk_priority, process_name_snapshot, area_name_snapshot,
  activity_name_snapshot, activity_code_snapshot, notes, evaluated_by, evaluated_at
)
values
  ('47000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001', 'Stato sintetico A', 'Scostamento sintetico A', 'non_compliant', 'high', 'Macro-processo sintetico A', 'Dominio sintetico A', 'Attivita sintetica A', 'SYN-A-DOM-01', 'Solo test locale.', 'Valutatore A', now()),
  ('47000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '45000000-0000-4000-8000-000000000002', '42000000-0000-4000-8000-000000000002', 'Stato sintetico B', 'Scostamento sintetico B', 'partially_compliant', 'medium', 'Macro-processo sintetico B', 'Dominio sintetico B', 'Attivita sintetica B', 'SYN-B-DOM-01', 'Solo test locale.', 'Valutatore B', now());

insert into public.gap_actions (
  id, user_id, assessment_id, activity_id, evaluation_id, description,
  responsible, priority, status, progress, phase, milestone,
  planned_start_date, planned_end_date, verification_result, notes
)
values
  ('48000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001', '47000000-0000-4000-8000-000000000001', 'Azione Gap sintetica A', 'Funzione A', 'high', 'planned', 0, 'planning', false, current_date, current_date + 30, 'pending', 'Solo test locale.'),
  ('48000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '45000000-0000-4000-8000-000000000002', '42000000-0000-4000-8000-000000000002', '47000000-0000-4000-8000-000000000002', 'Azione Gap sintetica B', 'Funzione B', 'medium', 'in_progress', 25, 'implementation', false, current_date - 5, current_date + 20, 'pending', 'Solo test locale.');

insert into public.gap_action_events (
  id, user_id, assessment_id, activity_id, evaluation_id, action_id,
  event_type, description, created_by
)
values
  ('49000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001', '47000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001', 'created', 'Evento sintetico A', '10000000-0000-4000-8000-000000000001'),
  ('49000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '45000000-0000-4000-8000-000000000002', '42000000-0000-4000-8000-000000000002', '47000000-0000-4000-8000-000000000002', '48000000-0000-4000-8000-000000000002', 'created', 'Evento sintetico B', '10000000-0000-4000-8000-000000000002');
