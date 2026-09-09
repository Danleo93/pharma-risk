# Remediation dipendenze CRITICAL - Milestone 2B.2a

Data: 25 agosto 2026  
Ambiente di verifica: repository locale, Supabase locale e registro npm  
Ambito: sole vulnerabilita CRITICAL presenti nel grafo production.

## Esito

La remediation ha portato le vulnerabilita CRITICAL production da **2 a 0** senza modificare la logica applicativa, i servizi export o lo schema Supabase.

| Controllo | Prima | Dopo |
| --- | --- | --- |
| `jspdf` | 3.0.4 | 4.2.1 |
| `jspdf-autotable` | 5.0.2 | 5.0.8 |
| CRITICAL grafo production | 2 | 0 |
| Vulnerabilita production totali | 12 | 9 |
| Test PDF sintetici | 4/4 PASS | 4/4 PASS |
| Build | PASS | PASS |
| ESLint | 46 errori, 1 warning | 46 errori, 1 warning |

## Inventario iniziale

| Finding | Package | Versione | Tipo | Advisory/CVE | Percorso | Uso PhaRMA T | Reachability del sink | Fix | Rischio breaking |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local file inclusion/path traversal | `jspdf` | 3.0.4 | Diretta | GHSA-f8cm-6447-x5h2 / CVE-2025-68428 | PhaRMA T -> `jspdf` | Export PDF FMEA/RCA/Gap; `addImage` per immagini generate internamente | `POTENTIALLY REACHABLE`: `addImage` e usata, ma production e browser-only, non usa il build Node vulnerabile e non riceve percorsi filesystem dall'utente | 4.0.0 | Major; release ufficiale dichiara nessun altro breaking change |
| HTML injection nei percorsi new-window | `jspdf` | 3.0.4 | Diretta | GHSA-wfv2-pwc8-crg5 / CVE-2026-31938 | PhaRMA T -> `jspdf` | Export tramite `doc.save()`; test tramite `output('arraybuffer')` | `NOT REACHABLE` nel codice corrente: assenti `pdfobjectnewwindow`, `pdfjsnewwindow` e `dataurlnewwindow`, e nessuna opzione controllata dall'utente e passata a tali overload | 4.2.1 | Major cumulativa rispetto a 3.x |
| Severita ereditata da jsPDF | `jspdf-autotable` | 5.0.2 | Diretta con peer vulnerabile | Eredita i finding `jspdf` | PhaRMA T -> `jspdf-autotable` -> `jspdf` | Tabelle dei PDF FMEA/RCA/Gap con testi immessi dagli utenti | `REACHABLE` come funzionalita; non esiste un sink CRITICAL indipendente da jsPDF | AutoTable compatibile con jsPDF 4 | Basso per update patch; regressione possibile su impaginazione |

### Input controllabili

Titoli, descrizioni, note, cause, 5 Whys, azioni, gap e riferimenti normativi possono raggiungere `doc.text()` e le celle di AutoTable. Il codice non passa questi valori a `loadFile`, `addJS`, AcroForm, `html()` o agli overload `output()` new-window. Le immagini RCA/Gap vengono prodotte dall'app come dati raster e non come percorsi filesystem forniti dall'utente.

## Scelta delle versioni

```text
CURRENT VERSION
jspdf 3.0.4
jspdf-autotable 5.0.2

TARGET VERSION
jspdf 4.2.1
jspdf-autotable 5.0.8

WHY THIS VERSION
jspdf 4.2.1 e la prima versione fuori dall'intervallo vulnerabile <=4.2.0.
jspdf-autotable 5.0.8 dichiara peer dependency ^2 || ^3 || ^4 e mantiene la stessa major.

BREAKING CHANGES
Il passaggio jsPDF 3 -> 4 e major. La release 4.0.0 limita l'accesso filesystem nel build Node e dichiara nessun altro breaking change. PhaRMA T non abilita tale accesso.

CODE CHANGES EXPECTED
Nessuna per le API usate: costruttore, text, splitTextToSize, addPage, addImage con dati raster, output arraybuffer, save e AutoTable.
```

## Test specifico pre-fix e post-fix

E stato aggiunto `scripts/security/pdf-regression-test.mjs`, eseguibile con:

```powershell
npm.cmd run security:pdf
```

Il test genera PDF sintetici in `tmp/security-pdf-regression/` e copre:

- FMEA: titolo, assessment, rischi, RPN, note, controlli e action plan;
- RCA: evento, causa, Ishikawa raster, 5 Whys, root cause, azioni, monitoraggio e firma/ruolo;
- Gap: assessment, stato attuale, target, gap, azioni, verifiche e riferimenti;
- Unicode, stringhe lunghe e payload HTML/JavaScript/formula trattati come testo;
- assenza di azioni JavaScript nel PDF;
- assenza nel sorgente delle API jsPDF vulnerabili non necessarie.

| Modulo | Pre-fix | Post-fix | Pagine sintetiche |
| --- | --- | --- | ---: |
| FMEA | PASS | PASS | 2 |
| RCA | PASS | PASS | 3 |
| Gap | PASS | PASS | 2 |
| API jsPDF vietate/non necessarie | PASS | PASS | N/A |

Le dimensioni dei tre file sintetici sono rimaste invariate tra pre-fix e post-fix. La verifica visuale dei report completi con dataset realistici resta raccomandata prima di un rilascio istituzionale.

## Variazioni del dependency tree

L'installazione isolata ha modificato esclusivamente il ramo jsPDF:

- `jspdf`: 3.0.4 -> 4.2.1;
- `jspdf-autotable`: 5.0.2 -> 5.0.8;
- `@babel/runtime`: 7.28.4 -> 7.29.7, dipendenza richiesta da jsPDF;
- `dompurify`: 3.3.0 -> 3.4.14, dipendenza opzionale richiesta dal nuovo ramo jsPDF.

Non sono state introdotte nuove dipendenze dirette e non sono state aggiornate altre famiglie applicative.

## Validazione finale

```text
jsPDF remediation:
Security finding: FIXED
PDF FMEA: PASS
PDF RCA: PASS
PDF Gap: PASS
security:test: PASS (0 failure)
build: PASS
```

Ulteriori risultati:

- `npm audit --omit=dev`: 0 CRITICAL, 9 HIGH, 0 MODERATE, 0 LOW;
- smoke funzionale USER_A/USER_B: 6/6 PASS;
- RLS CRUD: 30/30 PASS;
- cross-parent: 19/19 PASS, operazioni consentite 0;
- ESLint: 46 errori e 1 warning prima e dopo, delta 0.

## Vulnerabilita residue fuori scope al termine della Milestone 2B.2a

- HIGH runtime raggiungibili: `xlsx`, `react-router-dom`/`react-router`;
- HIGH runtime transitiva non rilevata nell'uso corrente: `ws` (Realtime non usato);
- HIGH build/tooling: Vite/Rollup/PostCSS/Nanoid e dipendenze ESLint/glob/YAML;
- MODERATE e LOW nel grafo completo: dipendenze di sviluppo indicate dall'audit corrente.

React Router e SheetJS/formula injection sono stati successivamente corretti nella Milestone 2B.2b; vedere [remediation HIGH runtime](./DEPENDENCY_REMEDIATION_HIGH_RUNTIME.md). Toolchain e `ws` restano fuori da entrambe le milestone.

## Rollback

Ripristinare le versioni precedenti esclusivamente per diagnosi locale:

```powershell
npm.cmd install jspdf@3.0.4 jspdf-autotable@5.0.2 --save-exact
```

Il rollback reintroduce vulnerabilita CRITICAL note e non deve essere usato per un rilascio.
