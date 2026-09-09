# PhaRMA T - Milestone 4D.1: lazy loading dei motori di export

**Data:** 27 agosto 2026  
**Ambiente di verifica:** build Vite production e Supabase locale con dati sintetici  
**Ambito:** caricamento on demand di XLSX, PDF e PNG; nessun route splitting, nessuna modifica Supabase o business logic

## 1. Executive summary

La milestone separa dal bundle iniziale i motori utilizzati esclusivamente durante un export:

- SheetJS/XLSX per gli Excel;
- jsPDF e `jspdf-autotable` per i PDF;
- `html-to-image` per i PNG.

Il codice viene scaricato solo al primo utilizzo del relativo comando e viene poi riutilizzato dalla cache del browser e dalla Promise condivisa del loader. L'entry JavaScript iniziale è scesa da **2.263.369 B raw / 640.382 B gzip** a **1.493.496 B raw / 393.131 B gzip** nella build finale verificata.

Riduzione finale rispetto alla baseline 4C:

- **769.873 B raw (-34,01%)**;
- **247.251 B gzip (-38,61%)**;
- target prudenziale iniziale inferiore a 400 KiB gzip: **raggiunto** (circa 383,92 KiB).

La milestone non introduce route splitting: il chunk iniziale resta superiore alla soglia raw di 500 kB e costituisce il candidato della successiva Milestone 4D.2.

## 2. Implementazione

### 2.1 Loader centralizzati

`src/lib/exportEngines.ts` espone tre loader:

- `loadXlsx()`;
- `loadPdfEngine()`;
- `loadHtmlToImage()`.

Ogni loader:

1. usa `import()` dinamico;
2. conserva una sola Promise condivisa, evitando import concorrenti duplicati;
3. azzera la Promise in caso di errore, consentendo un nuovo tentativo;
4. restituisce tipi espliciti ai servizi chiamanti.

### 2.2 Servizi aggiornati

Sono stati rimossi gli import runtime statici dai servizi FMEA, RCA e Gap. Le API pubbliche di export restano funzionalmente equivalenti, ma le funzioni che generano file sono asincrone e attendono il motore richiesto.

`html-to-image` è caricato on demand anche dagli export PNG della matrice FMEA, Pareto e diagramma RCA.

### 2.3 Stati UI e gestione errori

I comandi interessati:

- mostrano uno stato di preparazione durante caricamento e generazione;
- vengono disabilitati fino al completamento;
- ignorano richieste duplicate mentre un export è già in corso;
- mostrano un errore esplicito in caso di fallimento;
- tornano utilizzabili dopo l'errore, permettendo il retry.

I warning privacy e i gate runtime dei moduli restano applicati prima della generazione.

## 3. Misure progressive

Le misure intermedie sono state raccolte dopo ogni singolo boundary, prima di procedere al successivo.

| Fase | Initial JS raw | Initial JS gzip | Riduzione gzip vs 4C | XLSX iniziale | PDF iniziale | html-to-image iniziale |
| --- | ---: | ---: | ---: | --- | --- | --- |
| Baseline 4C | 2.263.369 B | 640.382 B | - | Sì | Sì | Sì |
| Dopo XLSX | 1.927.848 B | 533.103 B | 16,75% | No | Sì | Sì |
| Dopo PDF | 1.506.188 B | 396.959 B | 38,01% | No | No | Sì |
| Dopo PNG | 1.493.554 B | 391.896 B | 38,80% | No | No | No |
| Build finale verificata | 1.493.496 B | 393.131 B | 38,61% | No | No | No |

La piccola variazione gzip tra la misura PNG e la build finale deriva dalle correzioni testuali e di typing eseguite per chiudere il lint dei file coinvolti; la dimensione raw è rimasta sostanzialmente invariata.

## 4. Chunk finali

| Chunk | Funzione | Raw | Gzip | Caricamento |
| --- | --- | ---: | ---: | --- |
| `index-Bo0g8gNg.js` | entry applicativa | 1.493.496 B | 393.131 B | iniziale |
| `index-CrQ23su6.css` | CSS globale | 67.988 B | 12.461 B | iniziale |
| `xlsx-CKwrMZHi.js` | motore Excel | 499.549 B | 162.963 B | primo export Excel |
| `jspdf.es.min-BTeY_Xlo.js` | motore PDF | 386.010 B | 126.322 B | primo export PDF |
| `jspdf.plugin.autotable-B0IxatYY.js` | tabelle PDF | 31.041 B | 9.903 B | primo export PDF |
| `index-BeoRn2gJ.js` | `html-to-image` | 13.728 B | 5.406 B | primo export PNG |
| `html2canvas.esm-DXEQVQnt.js` | dipendenza PDF opzionale | 201.041 B | 47.431 B | dinamico, quando richiesto |
| `index.es-D-MgC1nl.js` | `canvg` opzionale | 158.586 B | 52.923 B | dinamico, quando richiesto |
| `purify.es-4eNOHKSq.js` | DOMPurify opzionale | 28.741 B | 11.017 B | dinamico, quando richiesto |

I nomi hash sono propri della build verificata e possono cambiare in build successive.

## 5. Verifica browser locale

La prova è stata eseguita su una build production collegata esclusivamente a Supabase locale e all'account sintetico `USER_A`.

| Momento | Script applicativi osservati |
| --- | --- |
| Login e apertura assessment FMEA | solo entry iniziale |
| Dopo click Excel | entry + chunk XLSX |
| Dopo click PDF | entry + XLSX + jsPDF + AutoTable |
| Dopo click PNG | entry + precedenti + `html-to-image` |

Questo dimostra che i tre motori non sono richiesti durante login, home o apertura dell'assessment e vengono caricati solo dall'interazione pertinente.

## 6. Quality gate

| Controllo | Esito | Dettaglio |
| --- | --- | --- |
| `supabase db reset --local` | PASS | tutte le migration e seed sintetico applicati |
| Build production | PASS | 2.702 moduli trasformati |
| Routing regression | PASS | tutte le route attese |
| Module state | PASS | 22/22 |
| Privacy regression | PASS | 18/18 |
| RLS | PASS | 30/30 |
| Smoke FMEA/RCA/Gap | PASS | 6/6 |
| Excel regression | PASS | 11/11 |
| PDF regression | PASS | 4/4 |
| Dipendenze | WARNING | un pacchetto segnalato, zero vulnerabilità critiche raggiungibili |
| Segreti | WARNING informativo | zero segreti; cinque fixture/placeholder |
| ESLint sui file 4D.1 | PASS | 0 errori, 0 warning applicativi |
| ESLint globale | Debito preesistente | 56 errori e 13 warning complessivi; non introdotti né risolti in questa milestone |

La suite aggregata restituisce exit code non zero esclusivamente per il gate ESLint globale storico. I test che richiedono Docker e registry sono stati rieseguiti con accesso locale completo; i precedenti errori di socket/rete erano limitazioni della sandbox, non failure applicative.

## 7. Artefatti sintetici per verifica manuale

I test PDF producono:

- `tmp/security-pdf-regression/fmea-regression.pdf`;
- `tmp/security-pdf-regression/rca-regression.pdf`;
- `tmp/security-pdf-regression/gap-regression.pdf`.

I file contengono esclusivamente dati sintetici. I test automatici verificano struttura, numero di pagine e assenza di JavaScript attivo. La verifica visuale finale dei layout resta una verifica manuale raccomandata.

## 8. Rischi residui

- Il primo export di un formato richiede il download una tantum del relativo chunk; lo stato UI rende esplicita l'attesa.
- L'entry iniziale contiene ancora tutte le route e Recharts: il warning Vite raw resta atteso.
- Un errore di rete al primo caricamento produce un messaggio e consente il retry, ma non è presente un error boundary applicativo dedicato agli export.
- Il lint globale storico resta da trattare in una milestone separata, evitando di mescolarlo alle ottimizzazioni performance.

## 9. Decisione e prossimo passo

La Milestone 4D.1 è tecnicamente completata: i motori di export sono realmente on demand, i test funzionali e di sicurezza degli export sono verdi e il target gzip prudenziale è raggiunto.

Il prossimo intervento consigliato è **Milestone 4D.2 - route-based code splitting**, iniziando dalle pagine Gap, RCA e FMEA con `React.lazy`/`Suspense`. Non è stato implementato alcun route splitting in questa milestone.
