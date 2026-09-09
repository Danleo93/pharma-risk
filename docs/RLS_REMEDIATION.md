# RLS remediation - Milestone 2B.1

Data: 25 agosto 2026  
Ambiente validato: Supabase locale non linked.

## Obiettivo raggiunto

Le relazioni child-parent user-owned non possono piu attraversare il confine fra USER_A e USER_B, ne in creazione ne modificando successivamente una FK.

La migration introdotta e:

`supabase/migrations/20260825010000_fix_cross_parent_rls.sql`

E additiva, non modifica dati, tabelle, FK, policy SELECT/DELETE o logica applicativa.

## Policy modificate

Sono state ricreate le sole policy `INSERT` e `UPDATE` di 19 tabelle:

- FMEA: `processes`, `risk_assessments`, `risk_items`;
- RCA: `rca_causes`, `rca_fishbone_diagrams`, `rca_fishbone_branches`, `rca_fishbone_causes`, `rca_five_why_chains`, `rca_five_why_steps`, `rca_action_plans`;
- Gap: `gap_areas`, `gap_activities`, `gap_standards`, `gap_activity_standards`, `gap_assessment_processes`, `gap_activity_evaluations`, `gap_actions`, `gap_action_events`, `gap_links`.

Totale: **19 policy INSERT e 19 policy UPDATE**.

## Regole applicate

1. `user_id`, quando presente, deve coincidere con `auth.uid()`.
2. Ogni parent user-owned deve essere visibile e posseduto dall'utente autenticato.
3. Le FK opzionali sono verificate soltanto quando valorizzate.
4. Le catene RCA e Gap devono essere coerenti con lo stesso assessment root.
5. `risk_catalog_base` resta reference data FMEA condiviso e read-only.
6. `gap_standards` resta user-owned; un eventuale `created_in_assessment_id` deve appartenere allo stesso utente.
7. `gap_activity_standards` richiede ownership sia dell'attivita sia della norma.
8. `gap_action_events.created_by`, quando presente, deve coincidere con l'utente autenticato.

## Helper autoreferenziali

Due sole verifiche non possono usare direttamente una subquery sulla stessa tabella senza rischiare ricorsione RLS:

- `private.owns_rca_fishbone_cause(uuid, uuid)` per `parent_id`;
- `private.owns_gap_action(uuid, uuid)` per `depends_on_action_id`.

Entrambe le funzioni:

- risiedono nello schema `private`, non incluso negli schemi API esposti;
- sono `SECURITY DEFINER` con `search_path` vuoto;
- usano riferimenti completamente qualificati;
- non usano SQL dinamico;
- verificano esplicitamente `user_id = auth.uid()` e assessment;
- concedono `EXECUTE` soltanto ad `authenticated` e al proprietario locale.

## Verifiche automatiche

| Verifica | Esito |
| --- | --- |
| `supabase db reset` da zero | PASS |
| RLS CRUD isolation | PASS, 30/30 |
| Cross-parent INSERT | PASS, 0 consentiti |
| Cross-parent UPDATE | PASS, 0 consentiti |
| Auth automatica | PASS; resta il controllo manuale di indisponibilita servizio |
| Smoke funzionale USER_A/USER_B | PASS, 6/6 moduli-utente |
| Export automatici | PASS; restano i controlli visuali PNG/filename gia documentati |
| Build production | PASS |
| Suite completa | 0 failure |

I warning non RLS della baseline (dipendenze, controlli browser manuali, ESLint preesistente) restano fuori dallo scope 2B.1 e non sono stati corretti.

## Regressioni

Nessuna regressione rilevata nei workflow sintetici:

- FMEA: gerarchia, assessment, rischio, controllo, azione, update e delete;
- RCA: assessment, causa, Ishikawa, 5 Whys, action plan, update e delete;
- Gap: libreria, norma, assessment, evaluation, azione, evento, verifica efficacia, update e delete.

## Production

- Nessun comando e stato eseguito contro production.
- Il repository locale non e stato linked.
- Non sono stati eseguiti `db push`, modifiche alla migration history remota o aggiornamenti dipendenze.
- La migration non deve essere applicata al remoto senza la procedura separata di backup, riconciliazione e autorizzazione.

## Rollback locale

Prima di una futura applicazione remota, il rollback consiste nel rimuovere la migration dal branch e ricostruire il database locale. Dopo un'applicazione istituzionale futura, il rollback richiedera una migration inversa esplicita che ripristini le policy precedenti; non usare reset distruttivi sul progetto remoto.
