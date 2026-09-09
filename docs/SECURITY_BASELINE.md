# Security baseline - Milestone 2A

> Note successive: i finding RLS cross-parent sono stati corretti nella Milestone 2B.1; le vulnerabilita CRITICAL jsPDF nella Milestone 2B.2a; React Router e SheetJS/formula injection nella Milestone 2B.2b. Vedere [RLS remediation](./RLS_REMEDIATION.md), [remediation CRITICAL](./DEPENDENCY_REMEDIATION_CRITICAL.md) e [remediation HIGH runtime](./DEPENDENCY_REMEDIATION_HIGH_RUNTIME.md).

Data esecuzione: 25 agosto 2026  
Ambiente: Supabase locale (`127.0.0.1`) e frontend Vite locale  
Ambito: rilevazione e regression baseline, senza remediation.

## Esito sintetico

| Area | Esito | Evidenza principale |
| --- | --- | --- |
| Guardrail ambiente | PASS | La suite si avvia solo con URL HTTP `localhost`/`127.0.0.1`, API locale raggiungibile e repository non linked |
| Autenticazione | PASS con 1 WARNING | Login/logout USER_A e USER_B, credenziali errate e reset locale verificati; indisponibilita Auth da verificare manualmente |
| RLS | FAIL | CRUD cross-user diretto bloccato su 30/30 tabelle; 17/30 consentono insert con parent di altro utente |
| IDOR | PASS con 1 WARNING | API e route protette; verifica browser con ID USER_B non espone dati a USER_A |
| Input ostili | PASS con 1 WARNING | Persistenza/lettura e rendering React verificati; controllo browser completo da ripetere manualmente |
| Export | PASS con 2 WARNING | XLSX/PDF/JSON superano i payload automatici; PNG e filename immagine richiedono controllo visuale/manuale |
| Dipendenze | WARNING | 18 pacchetti segnalati da `npm audit`, di cui 12 nel grafo production e 2 critici raggiungibili |
| Segreti | WARNING | Nessun potenziale segreto ad alta confidenza; presenti soltanto credenziali sintetiche locali e placeholder |
| Build | PASS | Build production completata |
| ESLint | WARNING | Baseline nota: 46 errori e 1 warning, senza regressione |

Il comando unificato termina intenzionalmente con codice non zero finche sono presenti failure RLS. Questo rende la baseline adatta a bloccare regressioni o a certificare una futura remediation.

## Comando unificato

Prerequisiti:

1. Docker Desktop attivo.
2. Supabase locale avviato.
3. Database locale ricostruito e seed sintetico applicato.
4. `.env.development` contenente esclusivamente URL e chiave pubblica locali.

```powershell
supabase start
supabase db reset
npm.cmd run security:test
```

Ogni test stampa `ENVIRONMENT: LOCAL`. La suite si arresta prima di qualsiasi query se:

- l'URL non usa `http://localhost` o `http://127.0.0.1`;
- il progetto locale non risponde;
- viene trovato un project ref Supabase linked;
- la configurazione e assente o ambigua.

I risultati macchina sono scritti in `.security-results/`, directory esclusa da Git.

## Protezione production

- Nessun test e stato eseguito contro production.
- Nessuna migration, policy o dipendenza e stata modificata per correggere findings.
- Il repository e non linked al progetto remoto.
- La migration history remota risultava vuota nella Milestone 1.
- Le baseline locali FMEA/RCA/Gap non devono essere applicate al remoto prima di una futura riconciliazione autorizzata.
- E vietato usare `supabase db reset --linked` sul progetto production.

## Copertura automatica

### Autenticazione

- login valido USER_A e USER_B;
- logout e rimozione della sessione;
- rifiuto password errata;
- richiesta reset password verso il servizio locale;
- presenza di `ProtectedRoute` sui detail FMEA, RCA e Gap.

### Autorizzazione e IDOR

- SELECT/INSERT/UPDATE/DELETE incrociati USER_A verso USER_B e viceversa;
- insert con `user_id` esterno;
- insert con foreign key verso parent di altro utente;
- accesso API a assessment e figli noti dell'altro utente;
- accesso browser autenticato agli URL detail con ID esterno.

### Input ostili

- tag script e HTML;
- attributi evento;
- URL `javascript:`;
- virgolette e apostrofi;
- Unicode ed emoji;
- newline e caratteri di controllo;
- stringa da 12.000 caratteri;
- scansione del sorgente per API di rendering HTML attivo.

### Export

- celle che iniziano con `=`, `+`, `-`, `@`;
- payload HTML/JavaScript nel PDF;
- Unicode e contenuto lungo nel JSON;
- impossibilita di leggere assessment USER_B prima dell'export da USER_A;
- verifica statica della normalizzazione filename.

## Verifiche browser eseguite

Con sessione sintetica USER_A:

- worklist FMEA visibile con soli dati USER_A;
- worklist RCA visibile con soli dati USER_A;
- worklist Gap visibile con soli dati USER_A;
- URL FMEA con assessment USER_B: redirect alla dashboard;
- URL RCA con assessment USER_B: redirect alla lista assessment;
- URL Gap con assessment USER_B: messaggio assessment non trovato/non accessibile.

## Controlli manuali residui

1. Interrompere Supabase locale mentre l'app e aperta e verificare messaggi e recupero Auth.
2. Inserire i payload ostili nei form principali e confermare che siano mostrati come testo, senza dialog o DOM attivo.
3. Aprire PDF, Excel, PNG e JSON generati dai moduli e verificare layout, caratteri e assenza di formule attive.
4. Verificare i filename PNG prodotti da `src/lib/exportImage.ts` con titoli contenenti caratteri speciali.
5. Ripetere il controllo URL IDOR dopo ogni modifica a route, service o policy.

## File della suite

| File | Responsabilita |
| --- | --- |
| `scripts/security/lib.mjs` | Guardrail, client locali, utenti sintetici e output comune |
| `scripts/security/guard-local.mjs` | Verifica esplicita ambiente locale |
| `scripts/security/auth-test.mjs` | Autenticazione e route protette |
| `scripts/security/rls-test.mjs` | Matrice CRUD/cross-parent sulle 30 tabelle |
| `scripts/security/idor-test.mjs` | Accesso con identificativi esterni |
| `scripts/security/input-test.mjs` | Payload ostili e rendering |
| `scripts/security/export-test.mjs` | PDF/Excel/JSON/PNG e formula injection |
| `scripts/security/pdf-regression-test.mjs` | Regressione PDF sintetica FMEA/RCA/Gap, immagini, Unicode e payload ostili |
| `scripts/security/routing-regression-test.mjs` | Routing SPA, route protette, detail, legacy, wildcard e logout |
| `scripts/security/excel-regression-test.mjs` | Workbook FMEA/RCA/Gap, Unicode, isolamento utenti e formula injection |
| `scripts/security/dependency-audit.mjs` | Inventario advisory npm e raggiungibilita |
| `scripts/security/secret-scan.mjs` | Scansione working tree, file Git e cronologia |
| `scripts/security/quality-check.mjs` | Build e confronto ESLint con baseline nota |
| `scripts/security/run-security-tests.mjs` | Orchestrazione unica e riepilogo PASS/FAIL/WARNING |

## Documenti collegati

- [RLS test matrix](./RLS_TEST_MATRIX.md)
- [Vulnerability inventory](./VULNERABILITY_INVENTORY.md)
- [Secret scan report](./SECRET_SCAN_REPORT.md)
- [Export security test](./EXPORT_SECURITY_TEST.md)
- [Remediation backlog](./REMEDIATION_BACKLOG.md)

## Confini della Milestone 2A

Non sono stati eseguiti upgrade, remediation RLS, modifiche alle funzioni applicative, feature flag, interventi su production o trasferimenti di ownership. La Milestone 2B non e iniziata.
