# Inventario dei trattamenti e dei dati

## Scopo e legenda

Questo inventario descrive il comportamento tecnico rilevabile dal repository. Non assegna ruoli GDPR, basi giuridiche o periodi di conservazione.

- **VERIFICATO TECNICAMENTE**: evidenza da codice, migration o test locale.
- **CONTROLLO MANUALE NECESSARIO**: configurazione provider o ambiente remoto non ricostruibile dal repository.
- **DECISIONE SIFO/DPO RICHIESTA**: scelta giuridica od organizzativa.

I contenuti FMEA, RCA e Gap sono progettati per non contenere dati personali. L'utente deve anonimizzare preventivamente le informazioni. Il software riduce il rischio di inserimento di identificatori diretti, ma non certifica l'anonimizzazione né esclude la riconoscibilità indiretta.

## A. Identity Data

| Dato | Categoria | Finalità tecnica | Dove nasce | Dove transita | Dove viene memorizzato | Chi può accedere | Export | Cancellazione | Retention da decidere |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Email account | Identity | Registrazione, login, reset, comunicazioni Auth | Registrazione/Supabase Auth | Browser → Supabase Auth | `auth.users` e sistemi Auth provider | Utente; amministratori provider autorizzati | JSON GDPR | Richiede cancellazione Auth amministrativa | Sì |
| UUID `user_id` | Identity | Ownership e isolamento RLS | Supabase Auth | Token Auth → PostgREST/PostgreSQL | `auth.users` e tabelle user-owned | Utente sulla propria sessione; amministratori autorizzati | JSON GDPR e riferimenti tecnici | Cascade progettata da `auth.users`; da testare operativamente | Sì |
| Password | Identity/credenziale | Autenticazione | Form Auth | Browser → Supabase Auth | Gestita dal provider; non nel database applicativo pubblico | Provider Auth; non leggibile dal client | No | Gestita con account Auth | Secondo provider/decisione SIFO |
| Sessione/token | Identity/security | Mantenere sessione autenticata | Supabase Auth | Browser ↔ Supabase Auth | Storage tecnico del client Auth/provider | Utente sul dispositivo e provider | No | Logout/revoca/session expiry | Sì |
| Timestamp Auth | Identity/technical | Gestione account e sicurezza | Provider Auth | Supabase | Sistemi Auth | Amministratori autorizzati/provider | Potenzialmente nel GDPR export solo se esposto | Con account/log secondo procedura | Sì |
| IP, user-agent, device metadata | Identity/technical | Sicurezza, erogazione e log provider | Richieste HTTP | Browser → Vercel/Supabase | Log provider secondo configurazione remota | Provider e amministratori autorizzati | Non nel normale export applicativo | Secondo strumenti e DPA provider | Sì; controllo manuale necessario |

## B. Analysis Data

| Dato | Categoria | Finalità tecnica | Dove nasce | Dove transita | Dove viene memorizzato | Chi può accedere | Export | Cancellazione | Retention da decidere |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Assessment, rischi, controlli e azioni FMEA | Analysis | Analisi proattiva e piano di miglioramento | Form FMEA | Browser → Supabase PostgREST | Tabelle `risk_*`, `control_measures`, `action_plans` | Solo owner autenticato tramite RLS; reference data condivisi in sola lettura dove previsto | PDF, XLSX, PNG, JSON GDPR | CRUD utente; cascade account progettata | Sì |
| Eventi, cause, Ishikawa, 5 Whys e azioni RCA | Analysis | Analisi reattiva e piano correttivo | Form RCA | Browser → Supabase PostgREST | Tabelle `rca_*` | Solo owner autenticato tramite RLS | PDF, XLSX, PNG, JSON GDPR | CRUD utente; cascade account progettata | Sì |
| Processi, domini, attività, standard e assessment Gap | Analysis/reference | Libreria personale e valutazione di conformità | Form Gap | Browser → Supabase PostgREST | Tabelle `gap_*` | Solo owner autenticato tramite RLS | PDF, XLSX, PNG, JSON GDPR | CRUD utente; cascade account progettata | Sì |
| Stato corrente, gap, priorità e note Gap | Analysis | Documentare lo scostamento e la valutazione | Evaluation Gap | Browser → Supabase PostgREST | `gap_activity_evaluations` | Solo owner autenticato tramite RLS | PDF, XLSX, JSON GDPR | CRUD utente/cascade parent | Sì |
| Evidenze, note e testi liberi | Analysis ad alto rischio di uso improprio | Contestualizzazione metodologica | Form dei tre moduli | Browser → privacy guard locale → Supabase se confermato | Tabelle di modulo | Solo owner tramite RLS | Secondo export del modulo | Rettifica/eliminazione ordinaria o procedura amministrativa | Sì |
| Report generati | Export locale | Consultazione e condivisione a cura dell'utente | Browser | Nessun backend di generazione; browser → dispositivo | Dispositivo scelto dall'utente | Chiunque riceva il file fuori dall'app | È l'output stesso | Fuori dal controllo applicativo dopo download | Decisione/regole organizzative |

## C. Professional Data

| Dato | Categoria | Finalità tecnica | Dove nasce | Dove transita | Dove viene memorizzato | Chi può accedere | Export | Cancellazione | Retention da decidere |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Responsabile azione FMEA/RCA/Gap | Professional | Assegnazione operativa | Form azione | Browser → Supabase | `responsible` nelle tabelle azioni | Owner autenticato | PDF/XLSX/JSON | Modifica/eliminazione azione | Sì |
| Assessor Gap | Professional | Identificare ruolo/funzione valutatrice | Form assessment Gap | Browser → Supabase | `gap_assessments.assessor` | Owner autenticato | PDF/XLSX/JSON | Modifica/cancellazione assessment | Sì |
| Operatore/funzione Gap | Professional | Definire funzione coinvolta | Libreria attività Gap | Browser → Supabase | `gap_activities.operator` | Owner autenticato | PDF/XLSX/JSON | CRUD libreria | Sì |
| `evaluated_by` / `verified_by` | Professional | Traccia metodologica di valutazione/verifica | Workflow Gap | Browser → Supabase | Tabelle evaluation/action Gap | Owner autenticato | PDF/XLSX/JSON | Modifica/cascade secondo record | Sì |
| Responsabile monitoraggio/firma RCA | Professional | Chiusura documentale del report | UI/report RCA | Browser; dato UI o contenuto esportato secondo workflow | Stato applicativo/record correlati secondo implementazione | Owner autenticato | PDF/XLSX | Secondo record originario | Sì |

La UI privilegia ruolo, funzione o team. Lo schema consente ancora testo libero e quindi anche un nominativo: l'ammissibilità deve essere decisa da SIFO/DPO.

## D. Technical / Security Data

| Dato | Categoria | Finalità tecnica | Dove nasce | Dove transita | Dove viene memorizzato | Chi può accedere | Export | Cancellazione | Retention da decidere |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Eventi stato modulo | Technical/audit | Tracciare cambi `enabled/read_only/disabled` | Trigger DB | PostgreSQL | `app_module_status_events` | Lettura/gestione secondo policy e ruolo amministrativo | Non nel normale report assessment | Procedura amministrativa | Sì |
| Errori client | Technical | Diagnosi locale/browser | Frontend | Console browser; nessun error reporter esterno rilevato | Non persistenza applicativa esplicita | Utente/tecnico con accesso al browser | No | Chiusura sessione/browser | Da verificare per log provider |
| Log Auth/API/hosting | Technical/security | Sicurezza ed esercizio provider | Supabase/Vercel | Provider | Provider secondo piano/configurazione | Provider e amministratori autorizzati | Non nel GDPR export corrente | Strumenti provider | Sì; controllo manuale necessario |
| Metadata export | Technical | Data generazione, titolo neutro, struttura report | Browser | Browser → file locale | File utente | Destinatari del file | Sì | A cura dell'utente | Regole organizzative |
| Finding privacy locale | Technical effimero | Avvisare prima del salvataggio | Browser | Solo memoria browser | Non memorizzato; valore grezzo non esposto | Utente corrente | No | Chiusura modal/sessione | Non applicabile come archivio |

## Evidenze collegate

- `PRIVACY_FIELD_INVENTORY.md`
- `NETWORK_DATA_FLOW.md`
- `RLS_TEST_MATRIX.md`
- `PRIVACY_TESTING.md`
- migration in `supabase/migrations/`

