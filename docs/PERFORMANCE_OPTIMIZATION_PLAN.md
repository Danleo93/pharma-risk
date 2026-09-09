# PhaRMA T - Piano di ottimizzazione performance

**Stato:** export on demand completato in Milestone 4D.1; route splitting completato in Milestone 4D.2  
**Baseline di riferimento:** 26 agosto 2026

## 1. Obiettivo

Ridurre il codice JavaScript trasferito e analizzato prima del primo rendering, mantenendo invariati:

- comportamento funzionale FMEA, RCA e Gap Analysis;
- autorizzazioni runtime dei moduli;
- sicurezza e privacy-by-design;
- contenuto degli export;
- compatibilità con Vite, React Router e Supabase.

## 2. Principi decisionali

1. Ottimizzare l'**initial load**, non soltanto eliminare il warning Vite.
2. Rinviare codice non necessario fino alla navigazione o all'interazione che lo richiede.
3. Non sostituire librerie consolidate senza una motivazione funzionale.
4. Applicare un cambiamento per volta e misurare dopo ogni passaggio.
5. Eseguire build, security, privacy, smoke, module ed export regression test a ogni fase.
6. Prevedere fallback visivi e gestione errori per ogni import dinamico.

## 3. Matrice delle ottimizzazioni

| Ottimizzazione | Beneficio atteso | Complessità | Rischio | Priorità | Motivazione |
| --- | --- | --- | --- | --- | --- |
| A. Lazy loading FMEA/RCA/Gap | Alto | Media | Medio | P1 | Evita di scaricare i moduli non visitati e valorizza i feature flag runtime |
| B. Lazy loading export PDF | Alto | Media | Medio | P1 | jsPDF e AutoTable sono nel chunk iniziale ma servono solo su click |
| C. Lazy loading export XLSX | Alto | Bassa/Media | Basso/Medio | P1 | XLSX è il maggior contributore iniziale isolabile |
| D. Lazy loading PNG/`html-to-image` | Basso/Medio | Bassa | Basso | P2 | Libreria piccola; parti opzionali sono già dinamiche |
| E. Lazy loading grafici | Medio/Alto | Media | Basso/Medio | P1 | Recharts è pesante e non serve su login o pagine senza grafici |
| F. Route-based code splitting | Alto | Media | Medio | P1 | Tutte le pagine sono oggi importate staticamente in `App.tsx` |
| G. `manualChunks` Vite | Medio | Bassa/Media | Medio | P3 | Migliora caching solo dopo boundary dinamici reali |
| H. Eliminazione import inutilizzati | Basso | Bassa | Basso | P2 | Tree-shaking già attivo; utile come pulizia misurata |

## 4. Cinque interventi migliori per rapporto beneficio/complessità

### 4.1 XLSX caricato solo su export Excel

**Priorità:** P1  
**Beneficio:** alto  
**Complessità:** bassa/media

Spostare il caricamento di `xlsx` dietro il click “Esporta Excel”. È il candidato più lineare perché non partecipa al rendering e non serve prima dell'azione esplicita dell'utente.

Controlli obbligatori:

- stato di caricamento sul pulsante;
- un solo import concorrente;
- gestione errore chiara;
- regressione formula injection e contenuto workbook;
- export FMEA, RCA e Gap invariati.

### 4.2 jsPDF e AutoTable caricati solo su export PDF

**Priorità:** P1  
**Beneficio:** alto  
**Complessità:** media

Introdurre un loader comune o import dinamici nei servizi senza cambiare l'API pubblica degli export. I chunk opzionali `html2canvas`, `canvg` e `DOMPurify` sono già separati, ma il core jsPDF e AutoTable no.

Controlli obbligatori:

- PDF FMEA/RCA/Gap completi;
- grafici e diagrammi presenti;
- font, paginazione e tabelle invariati;
- nessuna regressione privacy o sanitizzazione;
- messaggio durante il primo caricamento del motore PDF.

### 4.3 Route-based lazy loading delle pagine

**Priorità:** P1  
**Beneficio:** alto  
**Complessità:** media

Convertire gli import pagina di `src/App.tsx` in `React.lazy`, raggruppando progressivamente:

1. pagine Gap;
2. pagine RCA;
3. pagine FMEA;
4. pagine generali pesanti come Docs e Settings.

`ProtectedRoute` e `ModuleRoute` devono conservare la propria responsabilità. Un `Suspense` coerente con il design system deve gestire il caricamento.

### 4.4 Lazy loading delle viste con Recharts

**Priorità:** P1  
**Beneficio:** medio/alto  
**Complessità:** media

Rinviare dashboard e tab statistiche/report. L'utente che apre un form o una lista non deve sostenere subito il costo dei grafici.

Evitare import dinamici granulari per ogni primitive Recharts: è preferibile separare il componente grafico o la pagina che lo usa.

### 4.5 Lazy loading del percorso PNG

**Priorità:** P2  
**Beneficio:** basso/medio  
**Complessità:** bassa

Caricare `html-to-image` solo al click di esportazione PNG. L'impatto isolato è contenuto, quindi va eseguito dopo XLSX/PDF e route splitting.

## 5. Stima prudenziale del beneficio

Le build isolate indicano che XLSX, jsPDF/AutoTable e Recharts hanno ciascuno un'impronta gzip significativa. Le dimensioni condividono dipendenze e non sono sommabili, quindi non è corretto promettere un risparmio aritmetico.

Obiettivo indicativo da validare nella Fase 2:

| Indicatore | Baseline | Target prudenziale |
| --- | ---: | ---: |
| Initial JavaScript gzip | circa 625 KiB | inferiore a 400 KiB |
| Initial JavaScript raw | circa 2,16 MiB | inferiore a 1,50 MiB |
| Chunk entry Vite | oltre 500 kB raw | sotto soglia o warning motivatamente residuale |
| Chunk richiesti su `/login` | 1 JS principale | runtime/auth + eventuali piccoli vendor |

Un target più ambizioso, nell'ordine di 200-300 KiB gzip iniziali, è tecnicamente plausibile ma deve essere verificato dopo i primi boundary. Non viene assunto come criterio vincolante prima delle misure.

## 6. Sequenza proposta per la Fase 2

### Fase 2.1 - Export on demand

1. rendere dinamico XLSX;
2. build e misure;
3. test export Excel;
4. rendere dinamici jsPDF/AutoTable;
5. build e misure;
6. test PDF completi;
7. rendere dinamico PNG se ancora utile.

### Fase 2.2 - Route splitting

1. introdurre un fallback `Suspense` condiviso;
2. separare prima Gap, che ha il maggior codice applicativo;
3. separare RCA;
4. separare FMEA;
5. separare Docs e pagine secondarie;
6. verificare route dirette, refresh, redirect legacy e feature flag.

### Fase 2.3 - Grafici e report

1. verificare il chunk Recharts dopo route splitting;
2. rendere lazy le tab statistiche/report se Recharts resta nel percorso iniziale del modulo;
3. verificare export grafici e rendering nascosto dei report;
4. evitare doppio caricamento dei dati.

### Fase 2.4 - Chunk policy e pulizia

1. valutare `manualChunks` sulla nuova topologia;
2. rimuovere import inutilizzati confermati dall'analisi;
3. stabilire soglie di budget bundle in CI;
4. documentare la nuova architettura di caricamento.

## 7. Rischi e mitigazioni

| Rischio | Mitigazione |
| --- | --- |
| Schermata vuota durante import dinamico | `Suspense` con loading state coerente e compatto |
| Errore di rete al primo accesso a una route | Error boundary con retry e messaggio operativo |
| Export avviato più volte | Disabilitare temporaneamente il comando durante import/generazione |
| Regressione di route protette | Mantenere `ProtectedRoute`/`ModuleRoute` e ampliare routing regression test |
| Export incompleto | Eseguire test PDF/Excel e confronto manuale dei report |
| Chunk troppo frammentati | Misurare prima di introdurre `manualChunks` |
| Cache obsoleta dopo deploy | Conservare hashing Vite e verificare strategia Vercel |
| Feature flag che scarica codice disabilitato | Controllare che il boundary lazy sia interno al controllo modulo appropriato |

## 8. Criteri di accettazione della futura Fase 2

Ogni intervento deve rispettare:

- build production PASS;
- security test PASS;
- privacy test PASS;
- smoke test PASS;
- module state test PASS;
- routing regression PASS;
- export Excel/PDF/PNG PASS;
- nuovi errori lint: 0;
- nessuna modifica business logic;
- misure raw/gzip/Brotli prima e dopo;
- test di accesso diretto alle route dopo refresh;
- nessun accesso a Supabase remoto durante i test.

## 9. Decisione proposta

Procedere con una **Fase 2 limitata inizialmente agli export on demand**, perché offre il miglior rapporto beneficio/complessità ed è facilmente misurabile. Successivamente introdurre route-based splitting per Gap, RCA e FMEA. `manualChunks` non deve essere il primo intervento, perché da solo non riduce le dipendenze richieste dal caricamento iniziale.

La Milestone 4C si ferma a questa proposta: nessuna ottimizzazione è stata implementata.

## 10. Stato di attuazione al 27 agosto 2026

La **Fase 2.1 - Export on demand** è stata completata come Milestone 4D.1:

- XLSX: completato e verificato;
- jsPDF/AutoTable: completato e verificato;
- `html-to-image`: completato e verificato;
- stati di caricamento, blocco duplicati, gestione errori e retry: completati;
- target initial JavaScript gzip inferiore a 400 KiB: raggiunto.

La misurazione completa è in `PERFORMANCE_4D1_EXPORT_LAZY_LOADING.md`.

### Prossima raccomandazione

Procedere, solo dopo validazione della 4D.1, con **Milestone 4D.2 - Route splitting**:

1. introdurre un fallback `Suspense` condiviso;
2. separare progressivamente Gap, RCA e FMEA;
3. verificare accesso diretto, refresh, route protette e feature flag;
4. misurare nuovamente l'entry prima di valutare lazy loading Recharts o `manualChunks`.

La Milestone 4D.1 non ha implementato route splitting, lazy loading delle route, lazy loading Recharts o configurazioni `manualChunks`.

## 11. Stato di attuazione al 27 agosto 2026 - Milestone 4D.2

La **Fase 2.2 - Route splitting** e stata completata progressivamente:

1. fallback `Suspense` e error boundary condivisi;
2. route Gap Analysis separate;
3. route RCA separate;
4. route FMEA separate;
5. pagine secondarie pesanti separate dopo analisi del beneficio;
6. Recharts escluso dal caricamento iniziale come conseguenza dei boundary di route.

Risultato finale:

| Indicatore | Dopo 4D.1 | Dopo 4D.2 | Variazione |
| --- | ---: | ---: | ---: |
| Initial JavaScript raw | 1.493.496 B | 517.370 B | -65,36% |
| Initial JavaScript gzip | 393.131 B | 149.985 B | -61,85% |
| Initial CSS gzip | 12.461 B | 12.483 B | sostanzialmente invariato |
| Recharts iniziale | Si | No | caricato solo sulle route grafiche |
| Motori export iniziali | No | No | comportamento 4D.1 preservato |

La misurazione completa, la topologia dei chunk e il quality gate sono descritti in `PERFORMANCE_4D2_ROUTE_SPLITTING.md`.

### Decisione successiva

Non procedere automaticamente con `manualChunks` o bundle budget CI. L'entry gzip e gia circa 146,47 KiB e il percorso di login carica un solo JavaScript e un solo CSS. Eventuali ulteriori interventi devono partire da una nuova baseline su rete/dispositivi rappresentativi e da un beneficio misurabile, non dal solo warning raw di Vite.

## 12. Stato di attuazione al 28 agosto 2026 - Milestone 4E

È stato introdotto un budget locale riproducibile, senza ulteriori ottimizzazioni o cambiamenti alla topologia dei chunk:

- comando: `npm run performance:budget`;
- entry ricavata da `dist/index.html`, senza dipendenza dall'hash;
- valore misurato: **149.646 B / 146,14 KiB gzip**;
- soglie: PASS sotto 200 KiB, WARNING da 200 a 250 KiB inclusi, FAIL oltre 250 KiB;
- baseline reale, warning simulato e failure simulato: verificati.

Il budget misura solo il JavaScript iniziale. Motori export, route non visitate e Recharts restano esclusi. Non sono stati introdotti `manualChunks`, nuove librerie o ulteriori boundary lazy.
