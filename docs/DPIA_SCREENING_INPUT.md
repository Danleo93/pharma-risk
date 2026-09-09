# Input tecnico per lo screening DPIA

Questo documento fornisce evidenze per la valutazione del DPO e non conclude se la DPIA sia obbligatoria.

| Elemento | Evidenza/stato |
| --- | --- |
| Finalità | Strumento formativo, metodologico e documentale per FMEA, RCA e Gap; non strumento decisionale clinico |
| Categorie dati account | Email, UUID, sessione e metadati tecnici provider |
| Contenuti assessment | Progettati per dati previamente anonimizzati e non identificativi; testi liberi possono contenere accidentalmente dati personali o sanitari riconoscibili |
| Dati professionali | Ruolo/funzione/team; nominativi tecnicamente possibili in alcuni campi liberi |
| Numero utenti previsto | DECISIONE SIFO; il repository non impone una numerosità istituzionale |
| Scala geografica | DECISIONE SIFO; non deducibile dal codice |
| Categorie particolari previste | No, per finalità e istruzioni applicative |
| Inserimento accidentale dati sanitari | Possibile soprattutto in RCA, descrizioni evento, cause, evidenze e note |
| Profilazione persone | No, non rilevata nel repository |
| Scoring utenti | No |
| Decisioni automatizzate su persone | No |
| Geolocalizzazione | No; Permissions Policy la disabilita nel browser |
| Biometria | No |
| Monitoraggio sistematico persone | No, non rilevato |
| AI sui contenuti | No, nessun servizio AI/LLM applicativo rilevato |
| Tracker/analytics applicativi | Nessuno rilevato nel repository |
| Soggetti vulnerabili | I pazienti non sono utenti né destinatari di valutazione; possibili riferimenti indiretti accidentali nel contesto sanitario |
| Rischio re-identificazione RCA | Presente per combinazione di evento, data/ora, luogo, reparto e dettagli clinico-organizzativi |
| RLS | 30/30 tabelle testate; 22/22 parent user-owned; 0 cross-parent consentiti in locale |
| Security testing | Suite locale riproducibile; dipendenze CRITICAL/HIGH raggiungibili corrette; production non validata in 4B |
| Privacy detector | Controllo locale per email, CF plausibile e telefono plausibile; non certifica anonimizzazione |
| Modularità | `enabled`, `read_only`, `disabled` con enforcement client e RLS restrittive locali |
| Export | Client-side; fuori da RLS dopo download; warning e filename/metadata neutri |
| Backup | CONTROLLO MANUALE NECESSARIO presso provider/piano |
| Provider | Supabase, Vercel, GitHub; DPA, regioni e subprocessors da verificare |

## Fattori che richiedono esame DPO

- contesto sanitario e rischio di riconoscibilità indiretta;
- uso di testi liberi e possibili nominativi professionali;
- numerosità e perimetro geografico del pilot;
- governance degli account tecnici;
- provider, trasferimenti, backup e log;
- gestione di export non più protetti dall'app;
- procedura incidenti e cancellazione non ancora deliberata.

**DECISIONE DPIA: SIFO/DPO**
