# Matrice decisionale per Informativa, Termini e disclaimer

Classificazioni: `TECHNICALLY VERIFIED`, `LEGAL REVIEW REQUIRED`, `OUTDATED`, `MISSING`.

| Affermazione/tema | Documento/UI | Classificazione | Evidenza o problema | Decisione/azione |
| --- | --- | --- | --- | --- |
| App formativa, metodologica e documentale; non decisionale clinica | Home, Login, Terms, Docs | TECHNICALLY VERIFIED + LEGAL REVIEW REQUIRED | Coerente con funzioni e assenza di motore clinico | Validare formulazione definitiva |
| Dati account necessari al servizio | Privacy/Register | TECHNICALLY VERIFIED | Email/UUID/Auth presenti | Definire finalità e base giuridica |
| Assessment non destinati a dati personali e da anonimizzare prima | Privacy/Terms/disclaimer | TECHNICALLY VERIFIED come requisito progettuale | Notice e privacy guard implementati; anonimizzazione non garantita | Approvare istruzioni e responsabilità |
| App garantisce anonimizzazione | Qualsiasi testo eventuale | OUTDATED/DA EVITARE | Il detector non può garantire anonimizzazione | Sostituire con formulazione non assoluta |
| Titolare e contatti | Privacy/Terms | LEGAL REVIEW REQUIRED | Il codice usa il termine ma il ruolo non è deliberato | SIFO/DPO identificano soggetto e contatti |
| Supabase/Vercel come responsabili | Privacy | LEGAL REVIEW REQUIRED | Ruolo dipende da contratto e governance | Verificare DPA e qualificazione |
| Base giuridica/consenso | Privacy/Register | LEGAL REVIEW REQUIRED | Non determinabile tecnicamente | Delibera per trattamento |
| Cancellazione indicativamente entro 30 giorni | Privacy/Settings | OUTDATED/NON APPROVATO | Periodo non deliberato; procedura amministrativa non implementata | Rimuovere o validare dopo decisione |
| Conservazione per durata servizio | Privacy | LEGAL REVIEW REQUIRED | Nessun job retention automatico | Matrice retention SIFO/DPO |
| Solo cookie tecnici; nessun profiling | Privacy | TECHNICALLY VERIFIED PARZIALE | Nessun tracker SDK rilevato; provider e sessione richiedono controllo | Verifica browser/provider e valutazione cookie |
| Diritti e canale richieste | Privacy/Settings | LEGAL REVIEW REQUIRED | Export disponibile; cancellazione via procedura non definitiva | Definire canale, owner e tempi |
| Regione, trasferimenti, subprocessors | Privacy | MISSING/LEGAL REVIEW REQUIRED | Non verificabili dal repository | Integrare dopo supplier review |
| Data breach e contatti di emergenza | Documentazione operativa | MISSING NEL TESTO LEGALE | Runbook tecnico predisposto | Delibera procedura e riferimenti |
| Versione/data efficacia testi | Privacy/Terms | LEGAL REVIEW REQUIRED | Da governare documentariamente | Stabilire versionamento e approvazione |

## Formulazione concettuale corretta

> PhaRMA T tratta i dati necessari alla gestione dell'account e del servizio. I contenuti degli assessment non sono destinati a contenere dati personali e devono essere previamente anonimizzati.

Questa formulazione non implica che l'app garantisca l'anonimizzazione e deve comunque essere validata da SIFO/DPO.

