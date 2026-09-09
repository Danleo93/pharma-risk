# PhaRMA T - Validazione visuale manuale pre-pilota

**Data:** 28 agosto 2026  
**Ambiente:** frontend locale `127.0.0.1`, Supabase locale, seed esclusivamente sintetico

## 1. Convenzioni

- **PASS:** verificato visivamente in questa milestone.
- **AUTOMATED PASS:** coperto dalla regressione automatica locale, non sostituisce un controllo visuale.
- **PENDING:** richiede il completamento del collaudo browser autenticato.
- **NOT SIMULATED:** scenario non provocato per evitare hack permanenti o alterazioni dell'ambiente.

## 2. Pagine pubbliche e responsive

| Vista | 1440 px | 1024 px | 390 px | Esito |
| --- | --- | --- | --- | --- |
| Login | Nessun overflow, card e disclaimer leggibili | Struttura coerente | Nessun overflow orizzontale, comandi utilizzabili | PASS |
| Privacy | - | Titolo, sezioni e liste leggibili | - | PASS |
| Termini | - | - | Nessun overflow; gerarchia e liste leggibili | PASS |

Non sono stati rilevati schermate bianche, layout shift evidenti o errori console sulle route pubbliche osservate.

## 3. Moduli e stati runtime

La matrice automatica `security:modules` ha verificato 22/22 casi, inclusi `enabled`, `read_only`, `disabled`, preservazione dati, gate di scrittura ed export.

| Scenario visuale | Home/sidebar | Badge read-only | Route disabled / ModuleUnavailable | Layout/fallback | Stato |
| --- | --- | --- | --- | --- | --- |
| FMEA enabled/read_only/disabled | da verificare | da verificare | da verificare | da verificare | PENDING |
| RCA enabled/read_only/disabled | da verificare | da verificare | da verificare | da verificare | PENDING |
| Gap enabled/read_only/disabled | da verificare | da verificare | da verificare | da verificare | PENDING |

Prima della chiusura il test deve ripristinare tutti i moduli a `enabled` nel solo database locale.

## 4. Lazy route

| Route | Esito |
| --- | --- |
| Login | PASS |
| Privacy | PASS |
| Terms | PASS |
| Home | PENDING autenticazione |
| Prima apertura FMEA | PENDING autenticazione |
| Prima apertura RCA | PENDING autenticazione |
| Prima apertura Gap | PENDING autenticazione |
| Docs | PENDING autenticazione |
| Settings | PENDING autenticazione |
| Contatti | PENDING autenticazione |
| Chunk failure, messaggio e retry | NOT SIMULATED |

Il fallimento di un chunk non viene simulato: non sono stati introdotti intercettori, rinomine di asset o hack permanenti.

## 5. Export

### PDF

Sono stati rigenerati e renderizzati tutti i fogli dei PDF sintetici di regressione:

| Modulo | Pagine | Apertura/render | Unicode/accenti | Testo lungo/payload ostile | Esito |
| --- | ---: | --- | --- | --- | --- |
| FMEA | 2 | corretto | leggibile | inerte e visibile come testo | PASS |
| RCA | 3 | corretto | leggibile | inerte e visibile come testo | PASS |
| Gap | 2 | corretto | leggibile | inerte e visibile come testo | PASS |

Non sono stati osservati file corrotti, testo fuori pagina, sovrapposizioni bloccanti o contenuto JavaScript attivo. Le pagine di regressione sono volutamente sintetiche e non sostituiscono l'ispezione di un report completo ricco di grafici.

### XLSX e PNG

| Controllo | Stato | Nota |
| --- | --- | --- |
| XLSX FMEA/RCA/Gap, struttura e formule | AUTOMATED PASS | 11/11; parser riapre i workbook, formule neutralizzate |
| Apertura XLSX in Microsoft Excel | PENDING | Excel risulta installato; attendere export browser autenticato |
| PNG reale | PENDING | Il test automatico conferma il percorso di rasterizzazione, non l'output visuale end-to-end |

## 6. Privacy visuale

| Controllo | Stato |
| --- | --- |
| `PrivacyFormNotice` e microcopy nei form | PENDING autenticazione |
| Modal `PrivacyGuard` senza eco del valore | PENDING autenticazione |
| Detector email sintetica | AUTOMATED PASS |
| Detector codice fiscale sintetico | AUTOMATED PASS |
| Detector telefono sintetico | AUTOMATED PASS |
| Ritorno al form / gestione falso positivo | PENDING autenticazione |
| Warning export centralizzato | AUTOMATED PASS; verifica visuale PENDING |
| Assenza di valori identificativi nei log | AUTOMATED PASS |

## 7. Residui manuali

I punti `PENDING` non indicano una regressione rilevata: descrivono controlli visuali che richiedono una sessione locale autenticata. Devono essere aggiornati a PASS/FAIL prima della dichiarazione finale di chiusura della Milestone 4E.
