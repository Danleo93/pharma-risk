# PhaRMA T - Chiusura tecnica pre-pilota

**Milestone:** 4E  
**Data:** 28 agosto 2026  
**Ambiente verificato:** locale, dati sintetici, nessun deploy o modifica production

## Executive summary

La baseline automatica pre-pilota è stabile: database locale ricostruibile, build production, performance budget, routing, stati modulo, privacy, RLS, smoke, IDOR ed export completano il gate senza failure. L'entry iniziale è pari a **146,14 KiB gzip**, sotto il budget PASS di 200 KiB.

Il debito ESLint effettivo è **32 errori e 1 warning**: non include più `tmp/`, non presenta finding di sicurezza o runtime critici ed è registrato come debito tecnico non bloccante. La chiusura definitiva resta subordinata al completamento delle verifiche visuali autenticate annotate in `MANUAL_VISUAL_VALIDATION.md`.

## 1. Quality gate

| Controllo | Risultato |
| --- | --- |
| `supabase db reset --local` | PASS |
| Build production | PASS, 2704 moduli |
| Performance budget | PASS, 146,14 KiB gzip |
| Security suite aggregata | PASS, 14 sezioni senza failure |
| Privacy | 18/18 PASS |
| RLS | 30/30 PASS |
| Cross-parent / IDOR API | PASS |
| Module state | 22/22 PASS |
| Smoke USER_A/USER_B | 6/6 PASS |
| Routing | PASS |
| Excel | 11/11 PASS |
| PDF | 4/4 PASS |
| PNG | AUTOMATED WARNING; controllo visuale PENDING |
| `git diff --check` | PASS; soli avvisi EOL Windows |
| ESLint | baseline nota 32 errori / 1 warning |

La prima esecuzione isolata di `privacy:test` è stata impedita dalle autorizzazioni Docker della sandbox; la stessa verifica autorizzata contro i container locali è poi risultata 18/18 PASS. Non è un failure applicativo.

## 2. Modifiche della Milestone 4E

- esclusione ESLint limitata a `tmp/`, dopo inventario e conferma della natura generata;
- script `scripts/performance/check-bundle-budget.mjs`;
- comando `npm run performance:budget`;
- documentazione di baseline, budget, validazione visuale e chiusura;
- nessuna modifica a business logic, migration, Supabase remoto, production o deploy.

## 3. Classificazione residui

### BLOCKING BEFORE PILOT

- completare il collaudo visuale autenticato dei tre moduli e dei tre stati runtime;
- completare il controllo visuale end-to-end di almeno un PNG e degli XLSX in Excel;
- risolvere qualunque failure bloccante eventualmente emerso da tali verifiche.

### NON-BLOCKING TECHNICAL DEBT

- baseline ESLint 32/1, da ridurre per regola e modulo;
- controllo resilienza UI con Supabase Auth deliberatamente arrestato;
- simulazione browser di un errore chunk;
- automazione browser XSS completa sui tre detail;
- warning LOW/build-only delle dipendenze già accettato e monitorato;
- riconciliazione della migration history remota prima di un futuro rilascio production.

### SIFO/DPO / GOVERNANCE DECISION

- periodi di conservazione e cancellazione;
- ruoli GDPR, base giuridica e necessità DPIA;
- testi definitivi di informativa e termini;
- governance fornitori, backup e log retention;
- procedura amministrativa di rettifica/cancellazione e gestione moduli disabilitati.

## 4. Decisione tecnica

**TECHNICALLY READY FOR PRODUCTION VALIDATION: NON ANCORA DICHIARATO.**

Motivo: il gate automatico è verde, ma il collaudo visuale autenticato richiesto dalla Milestone 4E è ancora in completamento. Questa formulazione non equivale a un finding bloccante del software e non autorizza deploy o modifiche production.

Al completamento dei punti visuali pendenti, la decisione deve essere aggiornata senza avviare nuove ottimizzazioni.
