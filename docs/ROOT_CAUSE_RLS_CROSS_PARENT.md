# Root cause RLS cross-parent

Data: 25 agosto 2026  
Ambiente di analisi: Supabase locale, utenti sintetici USER_A e USER_B.

## Sintesi

Le policy RLS delle tabelle interessate verificavano l'ownership della riga child, oppure la sola ownership del parent root, senza validare tutte le foreign key user-owned. Un utente poteva quindi creare una riga con il proprio `user_id` ma collegarla a un parent appartenente a un altro utente.

La baseline della Milestone 2A aveva individuato 17 tabelle. L'inventario completo delle foreign key ha aggiunto `risk_items` e `gap_standards`, portando a 19 le tabelle da coprire. L'estensione e stata autorizzata esplicitamente.

## Modello di `gap_standards`

`gap_standards` e user-owned, non reference data globale:

- `user_id` e obbligatorio;
- il codice e univoco per utente;
- le letture applicative filtrano per utente e `source_type`;
- gli standard `assessment_only` possono riferire `created_in_assessment_id`;
- solo `risk_catalog_base` FMEA e condiviso intenzionalmente in lettura.

Ne consegue che sia `created_in_assessment_id` sia i due lati di `gap_activity_standards` devono appartenere all'utente autenticato.

## Inventario

| Modulo | Tabella child | Parent/FK protette | Policy precedente | Scenario consentito prima del fix | Gravita |
| --- | --- | --- | --- | --- | --- |
| FMEA | `processes` | `areas(area_id)` | solo `child.user_id` | processo USER_A sotto area USER_B | Media |
| FMEA | `risk_assessments` | `areas(area_id)`, `processes(process_id)` | solo `child.user_id` | assessment USER_A con area/processo USER_B | Alta |
| FMEA | `risk_items` | `risk_assessments(assessment_id)`, `process_steps(process_step_id)`, `risk_catalog_user(risk_catalog_user_id)` | solo assessment root | rischio in assessment USER_A con fase/rischio personale USER_B | Alta |
| RCA | `rca_causes` | `rca_assessments(assessment_id)` | solo `child.user_id` | causa USER_A sotto assessment USER_B | Alta |
| RCA | `rca_fishbone_diagrams` | `rca_assessments(assessment_id)` | solo `child.user_id` | diagramma USER_A sotto assessment USER_B | Alta |
| RCA | `rca_fishbone_branches` | assessment e diagramma | solo `child.user_id` | ramo USER_A sotto diagramma USER_B | Alta |
| RCA | `rca_fishbone_causes` | assessment, branch, cause, parent cause | solo `child.user_id` | nodo Ishikawa USER_A in catena USER_B | Alta |
| RCA | `rca_five_why_chains` | assessment e causa opzionale | solo `child.user_id` | catena USER_A collegata a assessment/causa USER_B | Alta |
| RCA | `rca_five_why_steps` | assessment, chain e causa opzionale | solo `child.user_id` | step USER_A in chain USER_B | Alta |
| RCA | `rca_action_plans` | assessment e causa opzionale | solo `child.user_id` | azione USER_A su assessment/causa USER_B | Alta |
| Gap | `gap_areas` | processo e assessment di origine opzionale | solo `child.user_id` | Dominio/Sezione USER_A sotto processo/assessment USER_B | Media |
| Gap | `gap_activities` | area e assessment di origine opzionale | solo `child.user_id` | Attivita/Requisito USER_A sotto area/assessment USER_B | Media |
| Gap | `gap_standards` | assessment di origine opzionale | solo `child.user_id` | norma assessment-only USER_A sotto assessment USER_B | Media |
| Gap | `gap_activity_standards` | attivita e norma | solo `child.user_id` | associazione fra attivita/norma di tenant diversi | Alta |
| Gap | `gap_assessment_processes` | assessment e processo | solo `child.user_id` | processo USER_A incluso in assessment USER_B o viceversa | Alta |
| Gap | `gap_activity_evaluations` | assessment e attivita | solo `child.user_id` | evaluation USER_A su assessment/attivita USER_B | Alta |
| Gap | `gap_actions` | assessment, attivita, evaluation, dipendenza opzionale | solo `child.user_id` | azione USER_A collegata a parent USER_B | Alta |
| Gap | `gap_action_events` | assessment, attivita, evaluation, action, `created_by` | solo `child.user_id` | evento USER_A collegato ad azione/attore USER_B | Alta |
| Gap | `gap_links` | assessment, attivita ed evaluation opzionali | solo `child.user_id` | link USER_A verso scope USER_B | Alta |

## Causa tecnica

Le foreign key garantiscono l'esistenza del record referenziato, non la sua ownership. RLS non propaga automaticamente la policy del parent alla tabella child. Una policy `WITH CHECK (user_id = auth.uid())` protegge pertanto soltanto la colonna locale.

Anche un `USING` corretto non basta per gli update: senza un `WITH CHECK` completo una riga valida puo essere trasformata in una relazione cross-owner.

## Decisione

Le policy `INSERT` e `UPDATE` verificano ora:

1. ownership locale, quando la tabella ha `user_id`;
2. ownership dei parent immediati user-owned;
3. coerenza con il root assessment nelle catene multilivello;
4. FK opzionali soltanto quando valorizzate;
5. reference data condivisi intenzionali senza introdurre ownership artificiale.

I due riferimenti autoreferenziali sono verificati tramite helper `SECURITY DEFINER` nello schema non esposto `private`, senza SQL dinamico e con `search_path` vuoto.
