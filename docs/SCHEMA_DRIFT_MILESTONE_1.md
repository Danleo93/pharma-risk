# Schema drift report - Milestone 1

Data acquisizione: 24 agosto 2026  
Progetto remoto verificato: `pharma-risk` (`eu-west-3`)  
Ambito: schema `public`, migration history Supabase, migration locali.

## Metodo e protezione dei dati

- Prima del confronto e prima di modificare migration e configurazione locale e stato creato un backup remoto.
- Il backup e conservato fuori dal repository in `C:\Users\danie\PhaRMA_T_backups\20260824_milestone1_prelocal`.
- Sono stati acquisiti separatamente ruoli, schema `public`, dati `public`, dati Auth e metadati Storage.
- Il file usato per il confronto strutturale e `schema_public.sql`, che non contiene righe applicative o dati personali.
- Nessun comando di reset, push, repair o migration e stato eseguito sul progetto remoto.

## Esito sintetico

Lo schema remoto contiene 30 tabelle applicative. Le migration presenti nel repository ricostruiscono soltanto le 11 tabelle Gap Analysis. Le 11 tabelle FMEA e le 8 tabelle RCA non hanno una migration di creazione locale.

La migration history remota risulta vuota: le tre migration locali non risultano registrate in `supabase_migrations.schema_migrations`. Lo schema remoto e quindi stato costruito almeno in parte tramite SQL eseguito manualmente.

## Tabelle presenti sul remoto ma non create dalle migration locali

### FMEA

1. `areas`
2. `processes`
3. `process_steps`
4. `risk_assessments`
5. `risk_items`
6. `control_measures`
7. `action_plans`
8. `risk_catalog_base`
9. `risk_catalog_user`
10. `user_custom_risks`
11. `user_settings`

### RCA

1. `rca_assessments`
2. `rca_causes`
3. `rca_fishbone_diagrams`
4. `rca_fishbone_branches`
5. `rca_fishbone_causes`
6. `rca_five_why_chains`
7. `rca_five_why_steps`
8. `rca_action_plans`

## Oggetti FMEA non versionati

- PK, FK e vincoli CHECK delle 11 tabelle.
- Colonne generate `risk_items.hazard_score`, `risk_items.rpn` e `risk_items.risk_class`.
- Indice `idx_user_custom_risks_user_id`.
- RLS su tutte le tabelle FMEA.
- Policy CRUD per dati user-owned e policy SELECT autenticata per `risk_catalog_base`.
- Colonna `user_settings.facility_name` e vincolo univoco su `user_settings.user_id`.

## Oggetti RCA non versionati

- Funzione `public.set_rca_updated_at()`.
- Trigger `updated_at` sulle tabelle RCA che espongono la colonna.
- PK, FK, vincoli CHECK e vincoli univoci dell'intero modulo.
- Indici su `user_id`, relazioni, stati, priorita e date.
- RLS e policy CRUD separate su tutte le otto tabelle.
- Campi metodologici Root Cause in `rca_causes`: `root_cause_status`, `root_cause_confirmed_at`, `root_cause_confirmation_notes`.

## Drift Gap Analysis

### Colonna remota mancante nelle migration

- `gap_standards.is_mandatory boolean not null default false` e presente sul remoto ma non viene creata dalle migration locali.

`gap_standards.application_scope`, `source_type` e `created_in_assessment_id` sono invece gia descritti dalla migration `20260506000000_add_gap_library_metadata.sql`.

### Indici metadata difformi

Le migration locali definiscono indici con nomi e composizioni differenti da quelli effettivamente presenti sul remoto:

- standard: locale `gap_standards_user_source_type_idx`; remoto `idx_gap_standards_user_source`;
- domini: locale indici separati per `user/source`, `process/source` e `user/created_in_assessment`; remoto `idx_gap_areas_user_source` e `idx_gap_areas_assessment_source(user_id, created_in_assessment_id, source_type)`;
- attivita: locale indici separati per `user/source`, `area/source` e `user/created_in_assessment`; remoto `idx_gap_activities_user_source` e `idx_gap_activities_assessment_source(user_id, created_in_assessment_id, source_type)`.

La migration locale verra allineata alla struttura remota per evitare indici semanticamente duplicati in una futura ricostruzione.

## Drift tra codice applicativo e schema remoto

### Stato FMEA `archived`

Il codice TypeScript e la UI gestiscono `draft`, `in_progress`, `completed`, `archived`. Il vincolo remoto `risk_assessments_status_check` ammette soltanto `draft`, `in_progress`, `completed`.

Conseguenza: un aggiornamento FMEA a `archived` puo essere rifiutato dal database remoto. Lo schema locale desiderato includera `archived` per essere coerente con il codice. La produzione non viene modificata in questa milestone.

### Compatibilita RCA legacy

Il remoto ammette ancora:

- `rca_assessments.status = action_planned`;
- `rca_action_plans.status = cancelled`;
- `rca_assessments.methodology = 5_whys`.

La UI non propone piu questi valori, ma il codice conserva compatibilita di lettura con dati legacy. I vincoli vengono quindi mantenuti nella baseline locale.

### Stato Gap `not_applicable`

Il valore e ancora presente nel vincolo remoto e nei tipi TypeScript, pur non essendo proposto in alcune superfici UI. Viene mantenuto per compatibilita con lo schema effettivo.

## Enum e strategia `updated_at`

- Il database remoto non usa enum PostgreSQL applicativi: gli stati sono `text`/`varchar` con CHECK nominati.
- Gap usa `public.set_gap_updated_at()` e trigger dedicati alle sole tabelle Gap con `updated_at`.
- RCA usa `public.set_rca_updated_at()` e trigger dedicati alle sole tabelle RCA con `updated_at`.
- FMEA non dispone di una funzione trigger `updated_at`; le colonne presenti mantengono la strategia attuale.

## Migration history

| Versione locale | Presente localmente | Registrata sul remoto |
| --- | --- | --- |
| `20260501000000` | Si | No |
| `20260506000000` | Si | No |
| `20260605000000` | Si | No |

La migration `20260605000000_harden_rls_policies.sql` e protetta da controlli `to_regclass`: nello stato attuale non fallisce, ma non puo creare policy FMEA/RCA perche le rispettive tabelle non esistono in locale.

## Interventi locali necessari

1. Aggiungere una migration baseline FMEA precedente alle migration Gap.
2. Aggiungere una migration baseline RCA precedente alle migration Gap.
3. Versionare `gap_standards.is_mandatory`.
4. Allineare gli indici metadata Gap alla struttura remota.
5. Rendere il vincolo FMEA coerente con lo stato `archived` usato dall'app.
6. Versionare i privilegi API presenti sul remoto; le policy RLS restano il confine autorizzativo sui record.
7. Verificare il risultato tramite reset locale ripetibile e confronto finale dello schema.

## Stato del remoto

Questo report fotografa il remoto senza modificarlo. Le correzioni introdotte nella Milestone 1 sono destinate esclusivamente alla ricostruzione locale e al repository. Qualunque futura sincronizzazione verso produzione richiedera una fase separata, backup aggiornato, revisione delle migration e autorizzazione esplicita.

## Confronto finale dopo la ricostruzione

Il confronto conclusivo di sola lettura tra migration locali e schema remoto ha eliminato il drift strutturale di tabelle, colonne, indici, RLS e privilegi API. Restano esclusivamente:

1. il vincolo FMEA `risk_assessments_status_check`, che in locale include deliberatamente `archived` per coerenza con la UI mentre il remoto non lo ammette;
2. una normalizzazione testuale segnalata per `set_rca_updated_at()`, senza differenza nella logica eseguita.

Al termine del confronto il repository locale e stato scollegato dal progetto Supabase remoto.
