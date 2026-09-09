# Matrice preliminare dei ruoli GDPR

Questa matrice non attribuisce ruoli definitivi. Separa il ruolo privacy dalla proprietà intellettuale del software e deve essere deliberata da SIFO/DPO.

| Soggetto | Possibile ruolo | Motivazione | Evidenza tecnica | Decisione richiesta |
| --- | --- | --- | --- | --- |
| SIFO | Possibile titolare | Potrebbe determinare finalità istituzionali, utenti, regole e governance del pilot | Non determinabile dal repository | SIFO/DPO |
| Coordinatore del progetto | Soggetto autorizzato/incarico tecnico | Sviluppo e manutenzione sotto governance definita | Stato attuale progettuale su account esistenti, come dichiarato nel perimetro milestone | SIFO/DPO |
| Coordinatore del progetto | Eventuale amministratore di sistema | Potenziali privilegi elevati su provider e database | Richiede verifica degli account e delle autorizzazioni remote | SIFO/DPO e atto organizzativo |
| Utente professionale | Autorizzato/utilizzatore | Inserisce e gestisce i propri assessment | Auth e RLS user-owned verificate localmente | SIFO/DPO definiscono istruzioni e perimetro |
| Supabase | Provider; possibile responsabile/subresponsabile | Auth, API e PostgreSQL gestiti | SDK e architettura verificati; contratto/configurazione remota no | Verifica DPA, regione, subprocessors e ruolo |
| Vercel | Provider; possibile responsabile/subresponsabile | Hosting SPA, CDN e log infrastrutturali | Deploy SPA e header verificati nel repository | Verifica DPA, subprocessors, log e ruolo |
| GitHub | Hosting repository/codice | Conservazione codice, history e CI/integration | Repository Git rilevato; account e accessi remoti non verificati | Governance, accessi e verifica assenza dati/segreti |
| Struttura sanitaria dell'utente | Ruolo da determinare | Potrebbe concorrere alle regole sull'uso professionale e sui contenuti inseriti | Non determinabile dal codice | SIFO/DPO e accordi con aderenti |

## Proprietà intellettuale e governance dati

La titolarità del codice, il diritto di manutenerlo e i ruoli relativi al trattamento dei dati sono piani distinti. Un eventuale trasferimento degli account tecnici a un'organizzazione SIFO non determina automaticamente proprietà intellettuale o ruoli GDPR; entrambi devono essere formalizzati separatamente.

