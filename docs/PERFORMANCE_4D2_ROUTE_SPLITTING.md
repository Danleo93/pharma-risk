# PhaRMA T - Milestone 4D.2: route-based code splitting

**Data:** 27 agosto 2026  
**Ambiente di verifica:** build Vite production e Supabase locale con dati sintetici  
**Ambito:** lazy loading per route di Gap Analysis, RCA, FMEA e pagine secondarie; nessuna modifica a production, Supabase remoto, migration, business logic o motori export

## 1. Executive summary

La milestone introduce il caricamento progressivo delle pagine tramite `React.lazy` e un boundary condiviso che gestisce attesa ed errori di download dei chunk. I controlli di autenticazione e disponibilita dei moduli restano esterni al boundary lazy: una pagina di un modulo disabilitato non viene montata e il relativo chunk non viene richiesto dalla sola presenza della route.

L'entry JavaScript iniziale e scesa da **1.493.496 B raw / 393.131 B gzip** della Milestone 4D.1 a **517.370 B raw / 149.985 B gzip**.

Riduzione rispetto a 4D.1:

- **976.126 B raw (-65,36%)**;
- **243.146 B gzip (-61,85%)**.

Rispetto alla baseline 4C, la riduzione dell'initial JavaScript gzip e **76,58%**. Il target indicativo inferiore a 300 KiB e il target ambizioso 200-250 KiB sono entrambi raggiunti senza `manualChunks`, sostituzione di librerie o refactoring funzionale.

## 2. Chiarimento della baseline ESLint

La configurazione resta `eslint.config.js`; `dist` e ignorata, mentre `tmp` non e esclusa globalmente. La discrepanza rispetto alla baseline storica **46 errori + 1 warning** non rappresenta soltanto nuovo debito applicativo:

1. i comandi storici non includevano sempre gli artefatti generati sotto `tmp/`;
2. `eslint .` include i bundle tecnici prodotti dalle analisi delle dipendenze;
3. le versioni correnti sono ESLint 9.39.5 e typescript-eslint 8.68.0, diverse da alcune rilevazioni precedenti;
4. il codice applicativo e gli artefatti generati devono quindi essere conteggiati separatamente.

Rilevazione finale verificabile con `npx eslint . --format json`:

| Perimetro | Errori | Warning | Interpretazione |
| --- | ---: | ---: | --- |
| Totale `eslint .` | 43 | 13 | Gate globale corrente |
| Sorgenti `src/` | 32 | 1 | Debito applicativo preesistente |
| Bundle generati `tmp/library-footprint/` | 11 | 12 | Artefatti di analisi, non codice distribuito |
| File modificati in 4D.2 | 0 | 0 | Nessun nuovo finding |

La milestone non modifica la configurazione ESLint e non corregge il debito globale. Il comando aggregato `security:test` termina pertanto con un solo `FAIL` sul gate ESLint storico, mentre i controlli funzionali, privacy, RLS ed export risultano verdi.

## 3. Implementazione

### 3.1 Fallback e gestione errori condivisi

Sono stati introdotti:

- `src/components/RouteLoadingFallback.tsx`: stato di attesa leggero, accessibile e coerente con il design clinico;
- `src/components/LazyRouteBoundary.tsx`: `Suspense` e error boundary dedicato alle route lazy.

In caso di fallimento di un chunk, l'utente vede un messaggio comprensibile e il comando **Ricarica la pagina**. Il boundary non registra dati dell'assessment, non usa CDN esterne e non introduce dipendenze.

### 3.2 Ordine dei guard

L'ordine resta:

1. `ProtectedRoute` verifica la sessione;
2. `ModuleRoute` verifica `enabled`, `read_only` e disponibilita runtime;
3. `LazyRouteBoundary` carica la pagina autorizzata;
4. la pagina esegue la propria logica invariata.

Questo conserva il comportamento fail-safe dei feature flag e impedisce che il lazy loading diventi un bypass delle autorizzazioni applicative o RLS.

## 4. Route rese lazy

### 4.1 Gap Analysis

- `GapDashboard`
- `GapAssessments`
- `NewGapAssessment`
- `GapAssessmentDetail`
- `GapProcesses`
- `GapProcessDetail`
- `GapStandards`
- `GapActions`

### 4.2 RCA

- `RCADashboard`
- `RCAAssessments`
- `NewRCAAssessment`
- `RCAAssessmentDetail`
- `RCAActions`

### 4.3 FMEA

- `Dashboard`
- `Assessments`
- `NewAssessment`
- `AssessmentDetail`
- `RiskCatalog`
- `Actions`

### 4.4 Pagine secondarie

L'analisi del chunk entry mostrava un beneficio misurabile per:

- `Docs`;
- `Settings`;
- `Privacy`;
- `Terms`;
- `Home`;
- `Contacts`.

Login, registrazione, recupero password, autenticazione, layout, provider privacy e configurazione moduli restano statici per non complicare il percorso essenziale di accesso.

## 5. Misure progressive

Le dimensioni raw e gzip sono calcolate sul file entry delle build production. Il CSS e rimasto sostanzialmente invariato.

| Indicatore | 4D.1 | Dopo Gap | Dopo RCA | Dopo FMEA | Finale |
| --- | ---: | ---: | ---: | ---: | ---: |
| Initial JS raw | 1.493.496 B | 1.216.776 B | 1.081.479 B | 598.205 B | 517.370 B |
| Initial JS gzip | 393.131 B | 333.508 B | 306.102 B | 171.394 B | 149.985 B |
| Initial CSS gzip | 12.461 B | 12.483 B | 12.483 B | 12.483 B | 12.483 B |
| JS entry iniziali | 1 | 1 | 1 | 1 | 1 |
| Recharts iniziale | Si | Si | Si | No | No |
| Riduzione gzip incrementale | - | 15,17% | 8,22% | 44,01% | 12,49% |

Sul login locale a cache vuota sono osservati:

- HTML di navigazione;
- un solo JavaScript entry;
- un solo foglio stile.

L'inventario pagina rileva quindi **2 asset iniziali** e **3 richieste includendo il documento HTML**. XLSX, jsPDF/AutoTable, `html-to-image`, Recharts e le route applicative non sono richiesti sul login.

## 6. Chunk applicativi finali

I nomi hash variano tra build; le dimensioni indicano la build production verificata.

### 6.1 Gap Analysis

| Chunk route | Raw | Gzip |
| --- | ---: | ---: |
| Gap dashboard | 10.190 B | 2.903 B |
| Gap assessments | 8.327 B | 2.886 B |
| Nuovo assessment Gap | 1.320 B | 774 B |
| Dettaglio assessment Gap | 118.380 B | 29.065 B |
| Processi Gap | 8.654 B | 3.072 B |
| Dettaglio processo Gap | 35.099 B | 8.621 B |
| Norme Gap | 14.018 B | 4.276 B |
| Azioni Gap | 19.859 B | 5.332 B |

### 6.2 RCA

| Chunk route | Raw | Gzip |
| --- | ---: | ---: |
| RCA dashboard | 8.679 B | 2.723 B |
| RCA assessments | 9.199 B | 3.069 B |
| Nuovo assessment RCA | 9.358 B | 2.418 B |
| Dettaglio assessment RCA | 98.422 B | 21.798 B |
| Azioni RCA | 11.466 B | 3.175 B |

### 6.3 FMEA

| Chunk route | Raw | Gzip |
| --- | ---: | ---: |
| FMEA dashboard | 7.409 B | 1.938 B |
| Nuovo assessment FMEA | 8.216 B | 2.491 B |
| Dettaglio assessment FMEA | 84.061 B | 21.064 B |
| Azioni FMEA | 13.896 B | 3.762 B |
| Catalogo rischi | 11.804 B | 3.835 B |
| Assessments FMEA | 8.419 B | 2.832 B |

### 6.4 Shared e pagine secondarie

| Chunk | Raw | Gzip | Caricamento |
| --- | ---: | ---: | --- |
| `CartesianChart` / Recharts condiviso | 339.495 B | 102.375 B | solo route con grafici |
| Docs | 44.327 B | 12.535 B | apertura Guida |
| Settings | 12.463 B | 4.123 B | apertura Impostazioni |
| Privacy | 9.404 B | 3.088 B | apertura Privacy |
| Terms | 5.997 B | 2.325 B | apertura Termini |
| Home | 3.520 B | 1.274 B | apertura home |
| Contacts | 3.594 B | 1.320 B | apertura Contatti |

I motori export restano nei chunk on demand documentati in 4D.1 e non sono stati modificati.

## 7. Recharts

Dopo il lazy loading FMEA l'analisi Rollup rileva **0 moduli Recharts/d3 nell'entry iniziale**. Recharts e raccolto nel chunk condiviso `CartesianChart` e viene richiesto soltanto dalle route che renderizzano grafici.

Non sono stati introdotti import dinamici granulari delle primitive Recharts, come richiesto dalla milestone.

## 8. Feature flag e protezioni

La suite locale `module-state-test` completa **22/22 PASS** e verifica:

- FMEA, RCA e Gap in stato `enabled`, `read_only` e `disabled`;
- riattivazione con storico preservato;
- scritture bloccate centralmente;
- route protette da `ModuleRoute`;
- sidebar e home coerenti con la disponibilita;
- export di modulo soggetto al gate runtime;
- export GDPR indipendente dai flag.

Il boundary lazy e interno a `ModuleRoute`; il codice del modulo non viene richiesto prima che il guard ne autorizzi il rendering.

## 9. Deep link, refresh e caricamento progressivo

I test automatici di routing coprono route FMEA/RCA/Gap, route detail, redirect legacy, utente non autenticato, redirect post-login e fallback delle route inesistenti.

La verifica browser production locale ha confermato che accessi diretti e refresh senza sessione su route FMEA, RCA, Gap e dettaglio Gap:

- tornano a `/login`;
- non producono 404;
- non generano loop;
- non mostrano schermate bianche.

I percorsi autenticati e l'isolamento dei dati sono coperti dai test API/RLS e dallo smoke funzionale con `USER_A` e `USER_B`. La verifica visuale browser autenticata completa resta una verifica manuale raccomandata, in particolare per il caricamento del chunk dopo una route profonda e per gli stati `read_only`/`disabled`.

## 10. Quality gate

| Controllo | Esito | Dettaglio |
| --- | --- | --- |
| `supabase db reset --local` | PASS | migration e seed sintetico applicati |
| Build production | PASS | Vite 7.3.6, 2.704 moduli trasformati |
| Routing regression | PASS | route e redirect attesi |
| Module state | PASS | 22/22 |
| Privacy regression | PASS | 18/18 |
| RLS | PASS | 30/30 |
| Cross-parent / IDOR API | PASS | dataset USER_A/USER_B isolati |
| Smoke FMEA/RCA/Gap | PASS | 6/6 |
| Excel regression | PASS | 11/11 |
| PDF regression | PASS | 4/4 |
| PNG | PASS | rasterizzazione browser locale su DOM sintetico; data URL PNG valida |
| Secret scan | PASS con warning fixture | 0 segreti, 5 placeholder sintetici |
| Dependency audit | WARNING | 1 pacchetto segnalato, 0 critici raggiungibili |
| ESLint file 4D.2 | PASS | 0 errori e 0 warning |
| ESLint globale | FAIL noto | 43 errori e 13 warning, separati sopra |
| `git diff --check` | PASS | nessun errore whitespace |

La suite aggregata conta 13 sezioni senza failure e un solo failure ESLint globale. Gli avvisi browser manuali gia presenti nella baseline di sicurezza non sono regressioni introdotte dal route splitting.

## 11. Regressioni e rischi residui

- Nessuna regressione funzionale rilevata nei test automatici.
- Il primo accesso a una route richiede il relativo chunk; il fallback rende esplicita l'attesa.
- Un errore di rete nel download del chunk e gestito dal boundary con messaggio e ricarica.
- Il chunk Recharts condiviso e consistente, ma non incide sul login.
- Il numero di richieste aumenta all'apertura di route complesse; e il comportamento atteso del caricamento progressivo e va bilanciato con caching HTTP.
- Il warning Vite sul chunk entry raw resta appena sopra 500 kB; non giustifica da solo `manualChunks`, dato che l'entry gzip e circa 146,47 KiB e le route non necessarie sono state escluse.

## 12. Decisione

La Milestone 4D.2 e tecnicamente completata. L'obiettivo di route splitting e stato raggiunto con margine, Recharts e fuori dal login e i guard di sicurezza/modularita restano invariati.

Non e necessario introdurre subito `manualChunks`: il beneficio atteso sarebbe soprattutto di caching e organizzazione, non di riduzione sostanziale dell'initial load. Come richiesto, la milestone si ferma prima di manual chunking, bundle budget CI e ulteriori refactor.
