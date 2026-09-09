# RLS test matrix - Milestone 2B.1

Data: 25 agosto 2026  
Ambiente: Supabase locale con USER_A e USER_B sintetici.

## Metodo

La matrice usa esclusivamente normali sessioni `authenticated`. Per ciascuna tabella user-owned, in entrambe le direzioni USER_A/USER_B, verifica:

- SELECT di una riga propria e invisibilita della riga altrui;
- INSERT legittimo e rifiuto dell'impersonificazione del `user_id`;
- UPDATE legittimo e impossibilita di aggiornare la riga altrui;
- DELETE legittimo e impossibilita di eliminare la riga altrui;
- INSERT con ID noto di un parent dell'altro utente;
- UPDATE di una riga valida sostituendo le FK con parent dell'altro utente.
- INSERT con UUID parent inesistente, che deve essere respinto da RLS o FK.

I casi cross-parent usano parent esistenti e considerano PASS soltanto una negazione RLS (`42501`), non un errore accidentale di FK o unicita. Le fixture vengono create e rimosse dagli stessi utenti. Nessuna `service_role` e usata per autorizzare i test.

`risk_catalog_base` e l'unica eccezione intenzionale: lettura condivisa autenticata e scritture negate agli utenti.

## Matrice completa

| Modulo | Tabella | Own SELECT | Cross SELECT | Own INSERT | Cross-parent INSERT | Own UPDATE | Cross-parent UPDATE | Own DELETE | Esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FMEA | `areas` | PASS | PASS | PASS | N/A | PASS | N/A | PASS | PASS |
| FMEA | `processes` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| FMEA | `process_steps` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| FMEA | `risk_assessments` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| FMEA | `risk_catalog_base` | PASS condiviso | PASS condiviso | PASS, negato | N/A | PASS, negato | N/A | PASS, negato | PASS |
| FMEA | `risk_catalog_user` | PASS | PASS | PASS | N/A | PASS | N/A | PASS | PASS |
| FMEA | `risk_items` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| FMEA | `control_measures` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| FMEA | `action_plans` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| FMEA | `user_custom_risks` | PASS | PASS | PASS | N/A | PASS | N/A | PASS | PASS |
| FMEA | `user_settings` | PASS | PASS | PASS | N/A | PASS | N/A | PASS | PASS |
| RCA | `rca_assessments` | PASS | PASS | PASS | N/A | PASS | N/A | PASS | PASS |
| RCA | `rca_causes` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| RCA | `rca_fishbone_diagrams` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| RCA | `rca_fishbone_branches` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| RCA | `rca_fishbone_causes` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| RCA | `rca_five_why_chains` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| RCA | `rca_five_why_steps` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| RCA | `rca_action_plans` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gap | `gap_processes` | PASS | PASS | PASS | N/A | PASS | N/A | PASS | PASS |
| Gap | `gap_areas` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gap | `gap_activities` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gap | `gap_standards` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gap | `gap_activity_standards` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gap | `gap_assessments` | PASS | PASS | PASS | N/A | PASS | N/A | PASS | PASS |
| Gap | `gap_assessment_processes` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gap | `gap_activity_evaluations` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gap | `gap_actions` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gap | `gap_action_events` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Gap | `gap_links` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Sono inoltre PASS per 30/30 tabelle i tentativi diretti di INSERT con ownership falsa, UPDATE di righe altrui e DELETE di righe altrui.

## Scenari relazionali espliciti

La suite separa, dove lo schema lo permette, i parent multipli:

- FMEA: area, processo, assessment, fase di processo e catalogo rischio personale;
- RCA: assessment root, cause, diagramma, branch, nodo parent, chain e action plan;
- Gap: assessment, processo, area, attivita, norma, evaluation, action, dipendenza, evento e `created_by`.

Per le FK composite RCA viene usata una catena esterna internamente coerente, affinche il test non passi per una violazione referenziale precedente alla policy.

## Risultato

- Isolamento CRUD diretto: **30/30 PASS**.
- Tabelle con parent user-owned testato: **22/22 PASS**.
- Tabelle oggetto della migration 2B.1: **19/19 PASS**.
- Operazioni cross-parent consentite: **0**.
- Parent inesistenti accettati: **0**.
- Failure o warning della suite RLS: **0**.

Il risultato macchina e disponibile localmente in `.security-results/rls.json` ed e rigenerabile con `npm.cmd run security:test`.
