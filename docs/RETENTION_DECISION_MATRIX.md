# Matrice decisionale per la conservazione

Questo documento non stabilisce periodi. Usa le evidenze di `DATA_RETENTION_TECHNICAL_READINESS.md` e indica le decisioni ancora necessarie.

| Categoria | Timestamp disponibili | Cancellazione tecnicamente possibile | Periodo attuale | Periodo da decidere | Decisione SIFO/DPO |
| --- | --- | --- | --- | --- | --- |
| Account/email | Timestamp Supabase Auth, da verificare nel remoto | Sì, tramite contesto amministrativo Auth | CONTROLLO MANUALE NECESSARIO | Durata account e periodo post-chiusura | Sì |
| Assessment FMEA | `created_at`, `updated_at`; niente `archived_at` esplicito | CRUD/cascade progettati | Nessuna regola automatica nel repository | Durata, trigger e archivio | Sì |
| Assessment RCA | `created_at`, `updated_at`; date evento separate | CRUD/cascade progettati | Nessuna regola automatica nel repository | Durata, trigger e archivio | Sì |
| Assessment Gap | `created_at`, `updated_at`, `assessment_date` | CRUD/cascade progettati | Nessuna regola automatica nel repository | Durata, trigger e archivio | Sì |
| Librerie personali | Timestamp non uniformi per tutte le entità | CRUD/cascade secondo tabella | Nessuna regola automatica | Durata indipendente o collegata all'account | Sì |
| Eventi stato moduli | `changed_at`, `updated_at` | Procedura amministrativa possibile | Nessuna regola automatica | Durata audit amministrativo | Sì |
| Log Supabase/Vercel | Timestamp provider | Dipende da piano e strumenti | CONTROLLO MANUALE NECESSARIO | Durata tecnica/contrattuale | Sì + provider |
| Richieste di cancellazione | Registro non implementato | Da progettare | Non disponibile | Evidenza minima della richiesta/esito | Sì |
| Backup | Metadati provider non nel repository | Dipende da provider e piano | CONTROLLO MANUALE NECESSARIO | Finestra backup e gestione cancellazioni | Sì + provider |
| Documentazione incidente | Non implementata come archivio applicativo | Da definire fuori/dentro piattaforma | Non disponibile | Durata e accessi | Sì |

## Eventuale azione tecnica successiva

Dopo la delibera: aggiungere soltanto i timestamp necessari, un job amministrativo con dry run, un audit privo dei contenuti eliminati e test su backup/restore. Nessuna di queste azioni è inclusa nella Milestone 4B.
