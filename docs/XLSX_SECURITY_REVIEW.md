# SheetJS/xlsx security review - Milestone 2B.2b

Data: 25 agosto 2026  
Ambito: export Excel FMEA, RCA e Gap e rischio di formula injection.

## Esito

SheetJS e stato aggiornato da **0.18.5** a **0.20.3**, usando il tarball ufficiale con versione esatta:

```text
https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

La dipendenza e fissata in `package.json` e `package-lock.json`; il lockfile registra URL, versione e integrita SHA-512. La licenza dichiarata dal pacchetto e Apache-2.0. Non viene usato un URL `latest` e non e stato necessario aggiungere un tarball binario al repository.

## Uso reale

| File | API | READ/PARSE | WRITE/EXPORT | Dati utente | Rischio pre-fix |
| --- | --- | --- | --- | --- | --- |
| `src/services/exportService.ts` | `book_new`, `aoa_to_sheet`, `book_append_sheet`, `writeFile` | No | Si | Titoli, rischi, controlli e azioni FMEA | Formula injection |
| `src/services/rcaExportService.ts` | API precedenti e `json_to_sheet` | No | Si | Evento, cause, 5 Whys e azioni RCA | Formula injection |
| `src/services/gapExportService.ts` | `book_new`, `aoa_to_sheet`, `book_append_sheet`, `writeFile` | No | Si | Valutazioni, gap, norme e azioni | Formula injection |

Il codice applicativo non usa `XLSX.read`, `readFile` o upload/import di workbook arbitrari. `XLSX.read` e presente soltanto nei test locali per riaprire workbook sintetici appena generati.

## CVE e raggiungibilita pre-fix

| Finding | Versione affetta | Percorso vulnerabile | Uso PhaRMA T | Reachability pre-fix | Remediation |
| --- | --- | --- | --- | --- | --- |
| [CVE-2023-30533 / GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6) | prima di 0.19.3 | Lettura di workbook costruiti ad arte | Nessun parsing applicativo | NOT REACHABLE | 0.20.3 |
| [CVE-2024-22363 / GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9) | prima di 0.20.2 | Parsing di contenuti costruiti ad arte | Nessun parsing applicativo | NOT REACHABLE | 0.20.3 |

La presenza del pacchetto vulnerabile non rendeva da sola sfruttabili i due percorsi: entrambi richiedevano lettura/parsing, assente nei servizi dell'app. E stato comunque scelto l'upgrade ufficiale, preferibile al mantenimento di una accepted risk.

Riferimento installazione ufficiale: [SheetJS CE - NodeJS installation](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/).

## Formula injection

La formula injection e un rischio applicativo distinto dalle CVE della libreria. Valori controllati dall'utente che iniziano, anche dopo spazi o caratteri di controllo, con `=`, `+`, `-` o `@` possono essere interpretati come formule da un foglio elettronico.

E stato introdotto `src/lib/spreadsheetSecurity.ts`. Tutti i servizi Excel passano ora righe o record attraverso lo stesso neutralizzatore prima della creazione del foglio. I valori pericolosi ricevono un apostrofo iniziale e rimangono testo; numeri, date, booleani, celle vuote e stringhe normali non vengono alterati.

## Regression test

`scripts/security/excel-regression-test.mjs` genera, serializza e riapre workbook sintetici con SheetJS. Il test copre:

- FMEA: `Info`, `Rischi`, `Azioni Correttive`;
- RCA: `Info`, `Cause`, `Azioni`;
- Gap: `Riepilogo`, `Valutazioni`, `Gap rilevati`, `Azioni`, `Norme`;
- intestazioni e dati attesi;
- Unicode;
- stringa da 12.000 caratteri;
- payload che iniziano con `=`, `+`, `-`, `@`;
- assenza di celle formula;
- isolamento USER_A/USER_B;
- riapertura con un parser di test.

Esito post-upgrade: **11/11 PASS**.

## Compatibilita e bundle

- API usate: compatibili senza modifica di business logic;
- TypeScript e Vite: build PASS;
- dimensione bundle principale: incremento di circa 49 kB minificati e 14 kB gzip rispetto alla build intermedia;
- warning Vite sul chunk principale oltre 500 kB: preesistente e fuori scope;
- Vercel/npm install: riproducibile tramite URL esatto e integrita nel lockfile.

## Rischio residuo

Non restano finding npm attribuiti a `xlsx`. L'app non deve introdurre in futuro import o parsing di file Excel senza una nuova threat analysis, limiti dimensionali e test su file ostili. Gli export devono continuare a usare esclusivamente gli helper di sanitizzazione condivisi.

## Rollback locale

```powershell
npm.cmd install xlsx@0.18.5 --save-exact
```

Il rollback reintroduce CVE note e rimuove la provenienza ufficiale fissata; non e adatto a un rilascio.
