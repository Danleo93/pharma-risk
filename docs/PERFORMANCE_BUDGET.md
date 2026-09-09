# PhaRMA T - Performance budget

**Data:** 28 agosto 2026  
**Comando:** `npm run performance:budget`

## 1. Oggetto della misura

Lo script `scripts/performance/check-bundle-budget.mjs` legge `dist/index.html`, identifica l'entry JavaScript iniziale realmente generata da Vite e calcola la dimensione gzip del relativo file. Non dipende dal nome hash dell'asset.

Il budget misura esclusivamente il JavaScript richiesto al caricamento iniziale della SPA. Non somma:

- motore XLSX caricato al comando di export;
- jsPDF e AutoTable caricati al comando di export;
- `html-to-image` caricato al comando PNG;
- route FMEA, RCA e Gap non ancora visitate;
- Recharts e viste grafiche non iniziali.

## 2. Soglie

| Stato | Soglia | Exit code |
| --- | --- | ---: |
| PASS | gzip < 200 KiB | 0 |
| WARNING | 200 KiB <= gzip <= 250 KiB | 0 |
| FAIL | gzip > 250 KiB | 1 |

Le soglie possono essere sostituite per i soli test con:

- `PERFORMANCE_WARNING_KIB`;
- `PERFORMANCE_FAILURE_KIB`.

La soglia warning deve essere positiva e inferiore alla soglia failure.

## 3. Baseline 4E

| Indicatore | Valore |
| --- | ---: |
| Entry | `assets/index-CWdy2Dxq.js` |
| Raw da build Vite | 517,37 kB |
| Gzip misurato dallo script | **149.646 B / 146,14 KiB** |
| Stato | **PASS** |

L'hash dell'entry è informativo e cambierà tra build; lo script continuerà a ricavarlo dall'HTML.

## 4. Test dello script

| Scenario | Soglie test | Esito | Exit code |
| --- | --- | --- | ---: |
| Baseline reale | 200/250 KiB | PASS | 0 |
| Warning simulato | 100/200 KiB | WARNING | 0 |
| Failure simulato | 50/100 KiB | FAIL | 1 |

Il bundle non è stato alterato per simulare gli stati.

## 5. Uso corretto

1. Eseguire `npm run build`.
2. Eseguire `npm run performance:budget`.
3. Trattare `FAIL` come blocco della build candidata.
4. Esaminare un `WARNING` prima del rilascio, senza applicare ottimizzazioni automatiche.

Budget futuri per route, grafici o motori export sono fuori dalla Milestone 4E.
