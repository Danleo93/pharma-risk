# PhaRMA T - Bundle analysis

**Milestone:** 4C  
**Data:** 26 agosto 2026  
**Oggetto:** attribuzione del bundle Vite corrente e separabilità tecnica

## 1. Architettura corrente del caricamento

`src/App.tsx` importa staticamente tutte le pagine pubbliche e protette. Questo produce un unico entry chunk che contiene l'intera applicazione:

```text
index.html
  -> src/main.tsx
    -> src/App.tsx
      -> pagine generali e autenticazione
      -> FMEA
      -> RCA
      -> Gap Analysis
      -> servizi export
      -> Recharts
      -> Supabase
```

Le route proteggono correttamente l'accesso ai moduli, ma oggi non rappresentano boundary di caricamento. Disabilitare un modulo a runtime impedisce di usarlo, non impedisce al browser di scaricarne il codice.

## 2. Chunk principale e warning Vite

Il chunk che genera il warning oltre 500 kB è:

| File | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| `assets/index-BwOcZKli.js` | 2.263.369 B | 640.382 B | 519.330 B |

Il valore raw supera la soglia Vite. Il dato più vicino al trasferimento HTTP è il gzip/Brotli, ma il browser deve comunque decomprimere, analizzare e compilare circa 2,16 MiB di JavaScript.

## 3. Principali contributori del chunk iniziale

La tabella seguente usa `renderedLength` dei moduli Rollup prima della minificazione finale. È utile per ordinare i contributori, ma **non è sommabile direttamente** alle dimensioni raw/gzip del file finale.

| Posizione | Pacchetto nel chunk entry | Contributo Rollup indicativo |
| ---: | --- | ---: |
| 1 | `xlsx` | 646.127 B |
| 2 | `recharts` | 616.589 B |
| 3 | `react-dom` | 561.323 B |
| 4 | `@supabase/auth-js` | 397.841 B |
| 5 | `jspdf` | 343.358 B |
| 6 | `pako` | 106.807 B |
| 7 | `@supabase/storage-js` | 106.765 B |
| 8 | `@supabase/postgrest-js` | 106.209 B |
| 9 | `@supabase/realtime-js` | 98.439 B |
| 10 | `react-router` | 85.934 B |

Altri contributori iniziali rilevanti:

- `jspdf-autotable`: 82.097 B;
- `@supabase/phoenix`: 56.053 B;
- `@reduxjs/toolkit`: 53.736 B, dipendenza transitiva;
- `lucide-react`: 39.578 B;
- `html-to-image`: 31.494 B.

## 4. Impronta isolata delle librerie

Per integrare l'attribuzione Rollup sono state eseguite build isolate delle API effettivamente importate. Questi numeri rappresentano bundle autonomi e includono runtime/transitive dependencies; non sono risparmi garantiti e non devono essere sommati tra loro.

| Libreria/API isolata | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| React + React DOM runtime | 951.883 B | 207.781 B | 155.953 B |
| React Router | 98.609 B | 26.986 B | 23.846 B |
| Supabase `createClient` | 612.072 B | 129.276 B | 102.299 B |
| Recharts, componenti usati | 643.854 B | 156.895 B | 125.419 B |
| jsPDF + AutoTable | 1.101.295 B | 278.325 B | 227.475 B |
| SheetJS/XLSX | 777.959 B | 196.552 B | 160.418 B |
| `html-to-image` / `toPng` | 16.579 B | 5.685 B | 4.999 B |

L'impronta isolata di jsPDF è superiore al contributo nell'app perché il bundle reale condivide o rinvia componenti opzionali (`html2canvas`, `canvg`, `DOMPurify`) in chunk dinamici.

## 5. Contributo del codice applicativo

Anche queste dimensioni sono `renderedLength` Rollup, quindi comparative e non equivalenti alla dimensione finale compressa.

| Area | Contributo indicativo | Moduli analizzati |
| --- | ---: | ---: |
| Gap Analysis | 506.502 B | 22 |
| Pagine condivise, auth, documenti e layout | 363.608 B | 154 |
| RCA | 255.713 B | 6 |
| FMEA | 214.665 B | 10 |

File applicativi individuali più grandi:

| File | Contributo Rollup indicativo |
| --- | ---: |
| `src/pages/rca/RCAAssessmentDetail.tsx` | 152.132 B |
| `src/pages/gap/GapAssessmentDetail.tsx` | 79.785 B |
| `src/pages/gap/GapProcessDetail.tsx` | 76.096 B |
| `src/pages/Docs.tsx` | 65.558 B |
| `src/pages/AssessmentDetail.tsx` | 56.182 B |
| `src/components/gap/GapEvaluationRow.tsx` | 51.132 B |
| `src/pages/gap/GapActions.tsx` | 39.256 B |
| `src/components/gap/GapActionPlanTab.tsx` | 34.274 B |
| `src/services/exportService.ts` | 33.333 B |
| `src/components/gap/GapAssessmentCreatePanel.tsx` | 33.224 B |

Questi dati indicano che la separazione per route e modulo produrrebbe benefici reali anche oltre alle dipendenze esterne.

## 6. Librerie di export

### 6.1 Presenza nel bundle iniziale

| Libreria | Uso | Nel chunk iniziale? | Nota |
| --- | --- | --- | --- |
| `jsPDF` | PDF FMEA/RCA/Gap | Sì | Import statico nei tre servizi export |
| `jspdf-autotable` | Tabelle PDF | Sì | Import statico nei tre servizi export |
| `xlsx` | Excel FMEA/RCA/Gap | Sì | Import statico nei tre servizi export |
| `html-to-image` | PNG/grafici e RCA | Sì | Import statico in componenti/servizi |
| `html2canvas` | Supporto opzionale jsPDF | No, chunk dinamico | Già separato dalla libreria |
| `canvg` | Rendering SVG opzionale | No, chunk dinamico | Già separato dalla libreria |
| `DOMPurify` | Sanitizzazione opzionale jsPDF | No, chunk dinamico | Già separato dalla libreria |

### 6.2 Separabilità

I servizi export sono candidati adatti a `import()` su interazione. Il caricamento può avvenire dopo il click su PDF/Excel/PNG, con uno stato visivo “Preparazione export...”.

Beneficio atteso:

- XLSX: alto, perché è uno dei maggiori contributori iniziali;
- PDF + AutoTable: alto, pur mantenendo i chunk opzionali già dinamici;
- PNG: basso/medio per `html-to-image` stesso, ma utile per tenere il percorso export fuori dalle pagine che non lo usano.

Rischio principale: mantenere immutati firme delle funzioni, gestione errori, contenuto dei report e regressioni di sicurezza dei file esportati.

## 7. Recharts

Componenti importati nell'app:

- `Bar`, `BarChart`;
- `CartesianGrid`;
- `Cell`;
- `Legend`;
- `Line`, `LineChart`;
- `Pie`, `PieChart`;
- `ResponsiveContainer`;
- `Tooltip`;
- `XAxis`, `YAxis`.

Punti d'uso principali:

- Pareto FMEA;
- dashboard e report Gap;
- grafici di conformità, priorità, azioni e domini.

Gli import nominati consentono tree-shaking, ma la porzione realmente usata resta consistente. Poiché i componenti che importano Recharts sono raggiunti staticamente da pagine importate in `App.tsx`, Recharts è nel bundle iniziale.

Soluzione raccomandata: lazy loading delle pagine/dashboard/report che ospitano i grafici, senza sostituire Recharts e senza forzare un wrapper grafico globale.

## 8. Supabase

`@supabase/supabase-js` è necessario sin dal bootstrap per autenticazione e sessione. La build comprende le famiglie:

- Auth;
- PostgREST;
- Realtime;
- Storage;
- Phoenix.

L'app usa principalmente autenticazione e PostgREST. Realtime e Storage non risultano centrali nei flussi esaminati, ma `createClient` compone il client completo e limita la possibilità di eliminarli con il tree-shaking corrente.

Decisione: **non sostituire Supabase e non intervenire su questo pacchetto nella prima fase di ottimizzazione**. Il suo peso è strutturale e va valutato dopo aver rimosso dal caricamento iniziale export, grafici e route non necessarie.

## 9. Fattibilità dello splitting per modulo

| Modulo | Codice separabile | Dipendenze specifiche | Beneficio | Complessità | Rischio regressione |
| --- | --- | --- | --- | --- | --- |
| FMEA | Dashboard, assessment, catalogo, azioni, detail | Pareto, matrice, export | Medio/alto | Media | Medio |
| RCA | Dashboard, assessment, azioni, detail | export PDF/Excel/PNG | Medio | Media | Medio |
| Gap Analysis | Dashboard, processi, norme, assessment, azioni | Recharts, export, componenti grandi | Alto | Media | Medio |

L'architettura React Router è compatibile con `React.lazy` e `Suspense`. `ModuleRoute` può restare il controllo autorizzativo; il boundary lazy deve essere posto sul componente pagina, non sulle policy runtime.

## 10. Considerazioni su `manualChunks`

`manualChunks` può migliorare caching e leggibilità dell'output, ma non riduce automaticamente il JavaScript iniziale: se l'entry importa staticamente XLSX, jsPDF e Recharts, il browser deve comunque scaricare i relativi chunk.

Ordine corretto:

1. introdurre boundary dinamici reali;
2. misurare nuovamente;
3. usare `manualChunks` solo per stabilizzare vendor condivisi o correggere accorpamenti inefficienti.

## 11. Conclusione

Il bundle è grande soprattutto per una scelta architetturale chiara e sanabile: tutte le route e quasi tutte le librerie funzionali sono collegate staticamente all'entry. Le ottimizzazioni con il miglior rapporto beneficio/rischio sono il caricamento dinamico dei motori export e il route-based splitting dei moduli. Nessun intervento è stato applicato durante questa baseline.
