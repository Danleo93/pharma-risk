# PhaRMA T - Baseline ESLint pre-pilota

**Data:** 28 agosto 2026  
**Milestone:** 4E  
**Perimetro:** codice e configurazione mantenuti nel repository; esclusi gli artefatti generati in `tmp/`

## 1. Perimetro reale

Prima della modifica, `eslint .` analizzava anche `tmp/`. L'inventario ha confermato che tale cartella contiene esclusivamente:

- bundle e misure tecniche generate;
- output di benchmark e report di test;
- copie di fixture e artefatti di regressione;
- rendering temporanei PDF/DOCX/PNG/XML;
- utility una tantum non versionate e non richiamate da applicazione o script mantenuti.

`tmp/` non contiene file tracciati da Git e non è importata dal runtime. È quindi classificata come **C - artefatto generato** o **D - file temporaneo** ed è stata esclusa mediante `globalIgnores(['dist', 'tmp'])` in `eslint.config.js`. Nessun file sorgente reale è stato escluso.

## 2. Misure

| Misura | Errori | Warning |
| --- | ---: | ---: |
| Baseline globale precedente | 43 | 13 |
| Contributo `tmp/` | 11 | 12 |
| Baseline sorgente effettiva misurata | **32** | **1** |

La nuova baseline è stata misurata dopo l'esclusione e non ricavata per sola sottrazione.

## 3. Debito residuo per regola

| Regola | Errori | Warning | Categoria | Valutazione |
| --- | ---: | ---: | --- | --- |
| `no-irregular-whitespace` | 16 | 0 | E - Style/Cleanup | Spazi Unicode in copy UI; nessun impatto di sicurezza o runtime rilevato |
| `react-hooks/immutability` | 7 | 0 | D - Maintainability | Funzioni richiamate da effect prima della dichiarazione lessicale; pattern valido a runtime ma non compatibile con l'analisi del React Compiler |
| `@typescript-eslint/no-explicit-any` | 4 | 0 | C - Type safety/Correctness | Tipizzazione FMEA legacy da rendere più precisa in intervento dedicato |
| `react-hooks/preserve-manual-memoization` | 3 | 0 | C - Type safety/Correctness | Un unico punto nella Guida, ripetuto dal compilatore; memoizzazione non ottimizzata, comportamento UI non risultato bloccante |
| `react-hooks/exhaustive-deps` | 0 | 1 | C - Type safety/Correctness | Dipendenza `faqList` non dichiarata nel `useMemo` della Guida |
| `react-hooks/set-state-in-effect` | 1 | 0 | D - Maintainability | Sincronizzazione sidebar/route con render aggiuntivo; rischio prestazionale limitato |
| `react-refresh/only-export-components` | 1 | 0 | D - Maintainability | Helper esportato insieme al provider Auth; impatta soprattutto Fast Refresh |

Totale per categoria:

- A - Security: **0**;
- B - Possible runtime bug: **0 bloccanti identificati**;
- C - Type safety/Correctness: **7 errori e 1 warning**;
- D - Maintainability: **9 errori**;
- E - Style/Cleanup: **16 errori**.

## 4. File interessati

| File | Finding |
| --- | --- |
| `src/components/Layout.tsx` | 1 maintainability |
| `src/components/gap/GapActionPlanTab.tsx` | 2 style |
| `src/components/gap/GapAssessmentCreatePanel.tsx` | 5 style |
| `src/context/AuthContext.tsx` | 1 maintainability |
| `src/pages/Actions.tsx` | 4 type safety, 3 maintainability |
| `src/pages/Assessments.tsx` | 1 maintainability |
| `src/pages/Dashboard.tsx` | 1 maintainability |
| `src/pages/Docs.tsx` | 3 correctness, 1 warning correctness |
| `src/pages/RiskCatalog.tsx` | 2 maintainability |
| `src/pages/gap/GapProcessDetail.tsx` | 7 style |
| `src/pages/gap/GapStandards.tsx` | 2 style |

## 5. Decisione

La Milestone 4E non tenta l'azzeramento del debito. Non sono emersi finding ESLint di sicurezza o runtime critici che impongano una correzione prima del pilot tecnico. La baseline `32/1` deve essere trattata per gruppi omogenei in interventi successivi, con build e regressioni per ogni gruppo.

**Nuovi errori introdotti dalla Milestone 4E:** 0.
