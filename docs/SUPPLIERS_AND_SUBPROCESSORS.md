# Fornitori e subprocessors

Le informazioni contrattuali e di dashboard non sono dimostrabili dal repository. Devono essere raccolte in forma datata prima del pilot.

| Provider | Servizio | Dati potenzialmente trattati | Regione | Piano | DPA | Subprocessors | Trasferimenti | Stato verifica |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Supabase | Auth, PostgREST, PostgreSQL, log e infrastruttura gestita | Email, UUID, credenziali gestite, sessioni, IP/user-agent/log, contenuti applicativi | CONTROLLO MANUALE NECESSARIO | CONTROLLO MANUALE NECESSARIO | CONTROLLO MANUALE NECESSARIO | CONTROLLO MANUALE NECESSARIO | CONTROLLO MANUALE NECESSARIO | Architettura verificata; contratto e remoto aperti |
| Vercel | Hosting SPA, CDN, TLS, deploy e log infrastrutturali | IP, user-agent, richieste asset, metadata deploy; nessun payload assessment inviato a API Vercel dal codice | CONTROLLO MANUALE NECESSARIO | CONTROLLO MANUALE NECESSARIO | CONTROLLO MANUALE NECESSARIO | CONTROLLO MANUALE NECESSARIO | CONTROLLO MANUALE NECESSARIO | Architettura verificata; contratto e remoto aperti |
| GitHub | Repository, history, issue/CI/integration se abilitate | Codice, commit metadata, eventuali segreti se inseriti impropriamente; nessun dato assessment previsto | CONTROLLO MANUALE NECESSARIO | CONTROLLO MANUALE NECESSARIO | Da valutarne necessità/forma | CONTROLLO MANUALE NECESSARIO | CONTROLLO MANUALE NECESSARIO | Repository rilevato; governance remota aperta |

## Evidenze tecniche

- `@supabase/supabase-js` è il client diretto del backend gestito.
- `vercel.json` configura rewrite SPA e header browser.
- `.env.example` separa configurazione locale e variabili production non versionate.
- Il secret scan locale non ha rilevato credenziali production ad alta confidenza.
- Nessun tracker, analytics o AI applicativa è rilevato nel repository.

## Pacchetto documentale da acquisire

Per ciascun provider: termini applicabili, DPA eseguibile, elenco subprocessors con data, regioni/localizzazione, garanzie trasferimenti, retention log/backup, misure di sicurezza, contatti incidenti e modalità di restituzione/cancellazione dati.

