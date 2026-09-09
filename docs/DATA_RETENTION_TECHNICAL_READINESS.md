# Readiness tecnica per future regole di conservazione

## Principio

Questo documento non stabilisce periodi. Le durate devono essere decise da SIFO/DPO in base a finalità, ruoli, obblighi applicabili e documentazione contrattuale.

## Timestamp disponibili

| Ambito | Timestamp disponibili | Osservazioni |
| --- | --- | --- |
| FMEA assessment | `created_at`, `updated_at` | Nessun `archived_at`; lo stato `archived` non registra da solo la data del passaggio |
| FMEA librerie/figli | prevalentemente `created_at`; `updated_at` solo su alcune tabelle | Granularità non uniforme |
| RCA assessment e oggetti modificabili | `created_at`, `updated_at` | Eventi RCA hanno anche data/ora metodologica, da non confondere con retention |
| RCA tabelle ponte/step | spesso solo `created_at` | Nessun audit storico generale delle modifiche |
| Gap librerie/assessment/evaluation/action | `created_at`, spesso `updated_at` | Evaluation: `evaluated_at`; action: `verified_at`; assessment: `assessment_date` |
| Gap eventi azione | `event_date`, `created_at` | Buona base per cronologia operativa, non per ultimo accesso |
| Stato moduli | `updated_at`, eventi `changed_at` | Audit amministrativo separato |
| Supabase Auth | timestamp gestiti dal provider, inclusi creazione/accessi secondo schema Auth | Accesso solo amministrativo; non esposto dal frontend ordinario |

## Dati mancanti o non uniformi

- `archived_at` esplicito per FMEA/RCA/Gap;
- data ultima consultazione, non attualmente necessaria alla logica applicativa;
- timestamp uniforme su tutte le tabelle figlie;
- registro cancellazioni/retention jobs;
- classificazione della durata per categoria di dato;
- evidenza del completamento di un job di cancellazione.

## Componenti necessari per una futura policy

1. Matrice approvata categoria dati/finalità/durata/trigger.
2. Migrazione additiva per i timestamp realmente necessari.
3. Job amministrativo o Edge Function con privilegi minimi, non esposto al client.
4. Dry run con conteggi e report prima della cancellazione.
5. Esclusione/gestione delle sospensioni motivate.
6. Audit tecnico privo del contenuto cancellato.
7. Test su backup e procedure dei provider.

