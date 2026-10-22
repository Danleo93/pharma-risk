# Aggiornamento sicurezza Node.js e dipendenze - 22 ottobre 2026

## Perimetro del rilascio web

La release parte dal commit `f6299d1` del branch `codex/cloudflare-migration`, collegato alla pubblicazione Cloudflare. La preparazione avviene in un worktree separato dalla copia di sviluppo contenente modifiche desktop e prototipi. Le sorgenti applicative, la configurazione ESLint e il database restano identici alla base del rilascio.

## Versioni aggiornate

| Componente | Branch online prima dell'aggiornamento | Release di sicurezza |
| --- | --- | --- |
| Node.js, requisito di sviluppo/build | Nessuna versione dichiarata nel repository | 24.22.1 LTS |
| Vite | 7.3.6 | 7.3.7 |
| DOMPurify, dipendenza jsPDF | 3.4.14 | 3.4.17 |
| source-map-js | 1.2.1 | 1.2.2 |
| brace-expansion | 1.1.18 e 5.0.9 | 1.1.21 e 5.0.12 |
| fflate | 0.8.2 | 0.8.3, gia usata nella copia locale |
| @babel/core | 7.28.5 | 7.29.7 |
| @humanfs/node | 0.16.7 | 0.16.8 |
| baseline-browser-mapping | 2.8.32 | 2.11.30 |
| browserslist | 4.28.0 | 4.29.4 |
| js-yaml | 4.3.1 | 4.3.2 |

Gli ultimi cinque pacchetti erano gia aggiornati nella copia di sviluppo, ma non nel lockfile del branch online. Il confronto separato ha permesso di includere anche le relative correzioni. Sono aggiornati inoltre gli helper Babel e le altre dipendenze richieste dalle nuove versioni, entro gli intervalli compatibili dei parent. Non sono aggiunte dipendenze dirette o effettuati aggiornamenti major.

## Node.js e installazione riproducibile

- Sul computer di sviluppo Node.js e stato aggiornato da `24.11.1` a `24.22.1` con il pacchetto ufficiale OpenJS.NodeJS.LTS; `node --version` conferma la nuova versione.
- `.node-version` fissa `24.22.1` per gli strumenti che riconoscono il file, tra cui Cloudflare Workers Builds.
- `package.json` richiede `^24.22.1` e fissa Vite a `7.3.7`.
- `package-lock.json` registra le versioni e gli hash dei pacchetti aggiornati; `npm ci` e stato eseguito nel worktree di rilascio.
- Se il pannello Cloudflare contiene una variabile `NODE_VERSION`, occorre allinearla e verificare la versione effettiva nei log della build remota. La presenza del file nel repository non dimostra da sola la configurazione remota.

## Verifiche sulla copia esatta del rilascio

| Verifica | Esito |
| --- | --- |
| `npm ci` | PASS: installazione riproducibile dal lockfile, audit a zero vulnerabilita note |
| `npm run build` | PASS: compilazione TypeScript e Vite 7.3.7 |
| `npm run security:pdf` | PASS: 4 controlli, PDF sintetici FMEA/RCA/Gap |
| `npm run security:excel` | PASS: 11 controlli su workbook, Unicode e formula injection |
| `npm run security:routing` | PASS: 24 controlli su route, protezioni e redirect |
| Confronto `src/` e `eslint.config.js` con la base Git | PASS: nessuna modifica |
| `npm run lint` | FAIL: 32 errori e 1 warning nei file applicativi invariati; rilievi su hook React, tipi `any`, Fast Refresh e spazi Unicode |

Il lint completo non e un controllo superato. I relativi rilievi non sono corretti in questo rilascio dedicato agli aggiornamenti delle dipendenze. La build conserva inoltre l'avviso gia presente sulle dimensioni di alcuni bundle.

Nella copia di sviluppo erano stati verificati anche il frontend desktop e 6 test desktop di privacy/assistenza; questi risultati non sono attribuiti al commit web, che non include le sorgenti desktop in sviluppo. Non e stato generato un nuovo installer Tauri.

## Pubblicazione e limiti della verifica

Il push sul branch `codex/cloudflare-migration` attiva il collegamento Git esistente con Cloudflare. Dopo il push, la verifica pubblica deve confermare il caricamento della nuova pagina e del modulo DOMPurify aggiornato. Il deploy non richiede migration o modifiche ai dati Supabase.

L'audit npm riguarda gli avvisi noti nel registro al momento del controllo. Non sostituisce una verifica completa dell'infrastruttura, delle autorizzazioni production o delle operazioni autenticate.

## Fonti

- Node.js, release di sicurezza del 21 ottobre 2026: https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
- Cloudflare Workers Builds e selezione della versione Node.js: https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
