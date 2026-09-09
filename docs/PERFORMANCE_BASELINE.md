# PhaRMA T - Performance baseline

**Milestone:** 4C - Performance baseline e bundle analysis  
**Data rilevazione:** 26 agosto 2026  
**Ambiente:** build production Vite eseguita localmente; backend Supabase locale con dati sintetici  
**Commit:** worktree in sviluppo; nessun deploy e nessuna modifica a production

## 1. Scopo e limiti

Questa baseline misura lo stato corrente di PhaRMA T prima di introdurre lazy loading, code splitting o altre ottimizzazioni. Le misure browser sono state raccolte su `localhost` senza throttling di CPU o rete: sono utili per confronti interni, ma **non equivalgono a metriche di produzione** e non costituiscono una previsione delle prestazioni su reti reali.

La milestone non modifica business logic, moduli, database remoto, configurazione production o deploy.

## 2. Metodo di rilevazione

Sono state eseguite le seguenti attività:

1. build Vite di produzione;
2. inventario di tutti i file in `dist/`;
3. calcolo delle dimensioni raw, gzip e Brotli;
4. build tecnica separata con manifest e metadati Rollup per attribuire moduli e dipendenze ai chunk;
5. preview locale della build production collegata esclusivamente a Supabase locale;
6. raccolta delle risorse di rete e delle metriche Performance API su `/login` e sulla home autenticata;
7. esecuzione dei quality gate disponibili.

Gli artefatti tecnici temporanei sono conservati sotto `tmp/` e non fanno parte del prodotto distribuito.

## 3. Riepilogo esecutivo

| Indicatore | Valore |
| --- | ---: |
| Dimensione totale `dist/` raw | 2.721.680 byte (2,60 MiB) |
| Dimensione totale `dist/` gzip | 764.572 byte (746,65 KiB) |
| Dimensione totale `dist/` Brotli | 624.180 byte (609,55 KiB) |
| JavaScript totale raw | 2.651.697 byte (2,53 MiB) |
| JavaScript totale gzip | 751.193 byte (733,59 KiB) |
| CSS totale raw | 67.988 byte (66,39 KiB) |
| CSS totale gzip | 12.285 byte (12,00 KiB) |
| Initial JavaScript raw | 2.263.369 byte (2,16 MiB) |
| Initial JavaScript gzip | 640.382 byte (625,37 KiB) |
| Initial CSS raw | 67.988 byte (66,39 KiB) |
| Initial CSS gzip | 12.285 byte (12,00 KiB) |
| Initial JS + CSS gzip | 652.667 byte (637,37 KiB) |
| Chunk che supera la soglia Vite | `assets/index-BwOcZKli.js` |

Il warning Vite oltre 500 kB riguarda il chunk iniziale JavaScript. Non indica da solo un malfunzionamento, ma segnala che il primo caricamento include codice applicativo e librerie non necessari alla schermata di login.

## 4. Inventario dei file generati

| File | Tipo | Raw | Gzip | Brotli | Caricato inizialmente? |
| --- | --- | ---: | ---: | ---: | --- |
| `assets/index-BwOcZKli.js` | JavaScript entry | 2.263.369 B | 640.382 B | 519.330 B | Sì |
| `assets/index-CrQ23su6.css` | CSS | 67.988 B | 12.285 B | 9.760 B | Sì |
| `assets/html2canvas.esm-DXEQVQnt.js` | JavaScript dinamico | 201.041 B | 46.903 B | 38.337 B | No |
| `assets/index.es-DQ1KNDa6.js` | JavaScript dinamico (`canvg`) | 158.546 B | 52.900 B | 45.985 B | No |
| `assets/purify.es-4eNOHKSq.js` | JavaScript dinamico (`DOMPurify`) | 28.741 B | 11.008 B | 9.888 B | No |
| `vite.svg` | SVG | 1.497 B | 771 B | 672 B | Browser/favicon |
| `index.html` | HTML | 498 B | 323 B | 200 B | Sì |

I nomi hash possono cambiare a ogni build. Le dimensioni rappresentano la build rilevata il 26 agosto 2026.

## 5. Cosa viene scaricato al primo caricamento

### 5.1 `/login`

La pagina di login scarica il chunk entry e il CSS globale. Poiché `src/App.tsx` importa staticamente tutte le pagine, il chunk entry comprende anche:

- pagine FMEA;
- pagine RCA;
- pagine Gap Analysis;
- Recharts;
- jsPDF e `jspdf-autotable`;
- SheetJS/XLSX;
- `html-to-image`;
- client Supabase;
- pagine documentali e componenti condivisi.

I chunk opzionali di `html2canvas`, `canvg` e `DOMPurify` non sono stati richiesti durante il login.

### 5.2 Home dopo autenticazione

Nella prova con l'utente sintetico locale `USER_A`, dopo il login il browser ha riutilizzato lo stesso bundle. Non sono stati scaricati nuovi chunk applicativi per aprire la home o la dashboard FMEA: il relativo codice era già nel chunk iniziale.

Richieste Supabase osservate subito dopo l'autenticazione e l'accesso alla dashboard FMEA:

1. token di autenticazione;
2. configurazione `app_modules`;
3. `risk_assessments`;
4. `risk_items`;
5. `action_plans`.

Non sono state osservate richieste duplicate evidenti nella singola navigazione misurata.

## 6. Network baseline locale

### 6.1 Login non autenticato, cache fredda

| Risorsa | Transfer size osservato | Corpo decodificato | Durata indicativa |
| --- | ---: | ---: | ---: |
| JavaScript entry | 643.983 B | 2.263.296 B | 50,6 ms |
| CSS | 12.464 B | 66.066 B | 10,0 ms |
| Favicon/SVG | 1.075 B | 1.497 B | trascurabile |
| HTML | richiesta di navigazione separata | 498 B | inclusa nella navigazione |

Richieste iniziali osservate: **4** (HTML, JavaScript, CSS, favicon). Nessuna richiesta Supabase è stata rilevata prima dell'interazione di login nel nuovo origin locale.

### 6.2 Home autenticata, cache fredda

La home ha richiesto gli stessi asset iniziali e una lettura della configurazione `app_modules`. Non sono stati caricati chunk FMEA/RCA/Gap separati, perché non esistono ancora boundary di route lazy.

## 7. Metriche browser indicative

### 7.1 `/login` - local production build

| Metrica | Valore indicativo |
| --- | ---: |
| Navigation duration | 141,4 ms |
| DOMContentLoaded | 132,7 ms |
| Load event | 141,4 ms |
| First Contentful Paint (FCP) | 172 ms |
| Largest Contentful Paint (LCP) | 204 ms |
| Total Blocking Time approssimato | 11 ms |
| Long task rilevati | 1 |

### 7.2 Home autenticata - local production build

| Metrica | Valore indicativo |
| --- | ---: |
| Navigation duration | 131,7 ms |
| DOMContentLoaded | 124,4 ms |
| Load event | 131,7 ms |
| First Contentful Paint (FCP) | 168 ms |
| Largest Contentful Paint (LCP) | 200 ms |
| Total Blocking Time approssimato | 10 ms |
| Long task rilevati | 1 |

Questi risultati mostrano un comportamento rapido sul computer locale, ma non annullano il costo di circa 625 KiB gzip di JavaScript iniziale su reti mobili, dispositivi meno potenti o cache vuota.

## 8. Quality gate della milestone

| Controllo | Esito della rilevazione 4C | Nota |
| --- | --- | --- |
| Build production | PASS | Confermato anche dalla suite di sicurezza |
| Routing regression | PASS | Test corrente |
| RLS regression | PASS | 30/30 test |
| Smoke test | PASS | 6/6 test |
| Export Excel | PASS | 11/11 test |
| Export PDF | PASS | 4/4 test |
| Privacy detector/static checks | PASS parziale | 16 controlli completati prima del passaggio amministrativo |
| Module state test | Non rieseguito completamente | Accesso al socket Docker negato dal sandbox Codex |
| Privacy test amministrativo | Non rieseguito completamente | Accesso al socket Docker negato dal sandbox Codex |
| Dependency audit | Non rieseguito completamente | Accesso rete/cache negato dal sandbox Codex |
| Nuovi errori lint | 0 | Baseline invariata: 46 errori e 1 warning preesistenti |

I tre controlli non completati sono **limitazioni dell'ambiente di esecuzione della baseline**, non nuovi finding applicativi. La Milestone 4A aveva già registrato il completamento dei test security/privacy locali. Prima di approvare una futura fase di ottimizzazione è comunque raccomandato rieseguire l'intera suite in un terminale con Docker e registry accessibili.

## 9. Conclusione baseline

La prestazione locale percepita è buona, ma l'architettura di import corrente rende il primo bundle più ampio del necessario. Il principale margine di miglioramento non è comprimere ulteriormente lo stesso file, bensì evitare di scaricare al login:

- tre moduli operativi completi;
- motori PDF ed Excel;
- componenti grafici Recharts;
- codice dedicato a pagine e report non ancora visitati.

La strategia consigliata è descritta in `PERFORMANCE_OPTIMIZATION_PLAN.md`. Nessuna ottimizzazione è stata applicata in questa milestone.

## 10. Aggiornamento storico - Milestone 4D.1

**Data:** 27 agosto 2026  
**Intervento:** caricamento on demand dei motori XLSX, jsPDF/AutoTable e `html-to-image`.

La baseline 4C sopra riportata resta invariata come riferimento storico. Dopo la Milestone 4D.1 la build finale verificata presenta:

| Indicatore | Baseline 4C | Dopo 4D.1 | Variazione |
| --- | ---: | ---: | ---: |
| Initial JavaScript raw | 2.263.369 B | 1.493.496 B | -34,01% |
| Initial JavaScript gzip | 640.382 B | 393.131 B | -38,61% |
| Initial CSS gzip | 12.285 B | 12.461 B | sostanzialmente invariato |
| Motori export nel caricamento iniziale | XLSX, PDF, PNG | nessuno | boundary verificati nel browser |

I risultati progressivi, i chunk e il quality gate sono descritti in `PERFORMANCE_4D1_EXPORT_LAZY_LOADING.md`. Il successivo candidato è il route splitting; non è incluso in 4D.1.
