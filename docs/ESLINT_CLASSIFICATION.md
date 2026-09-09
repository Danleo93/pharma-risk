# Classificazione baseline ESLint

Data: 25 agosto 2026  
Baseline: 46 errori e 1 warning, invariata rispetto alla Milestone 2A.

## Riepilogo

| Categoria | Regole | Errori | Warning | Decisione 2B.3 |
| --- | --- | ---: | ---: | --- |
| A. Security relevant | nessuna | 0 | 0 | Nessun finding |
| B. Potential runtime bug | `react-hooks/preserve-manual-memoization`, `react-hooks/exhaustive-deps` | 3 | 1 | Debito noto; nessun bug runtime evidente nei test |
| C. Maintainability | `react-hooks/set-state-in-effect`, `react-hooks/immutability`, `@typescript-eslint/no-explicit-any`, `react-refresh/only-export-components` | 22 | 0 | Rinviare a refactor mirati |
| D. Style / cleanup | `no-irregular-whitespace` | 21 | 0 | Pulizia non funzionale separata |
| **Totale** |  | **46** | **1** | **Delta nuovi errori: 0** |

## Dettaglio

### A. Security relevant - 0

Non risultano regole ESLint che evidenzino injection, gestione insicura di segreti, bypass autorizzativi, uso pericoloso del DOM o primitive crittografiche deboli.

### B. Potential runtime bug - 3 errori, 1 warning

- `Docs.tsx`: tre segnalazioni duplicate `preserve-manual-memoization` e un warning `exhaustive-deps` sullo stesso `useMemo`.
- Impatto potenziale: memoizzazione non ottimale o valore non aggiornato se cambiano in futuro le dipendenze di `faqList`.
- Evidenza corrente: `faqList` usa lo stato gia incluso; build, navigazione e smoke non mostrano malfunzionamenti.
- Decisione: non modificare in una milestone di dependency hardening; correggere con test dedicato alla Guida in un intervento separato.

### C. Maintainability - 22 errori

| Regola | Conteggio | Nota |
| --- | ---: | --- |
| `react-hooks/set-state-in-effect` | 1 | Aggiornamento sezione sidebar sulla route; possibile render aggiuntivo, non vulnerabilita. |
| `react-hooks/immutability` | 8 | Include funzioni dichiarate dopo un effect e accumulatore Pareto; il codice corrente e eseguito dopo l'inizializzazione e supera build/smoke. |
| `@typescript-eslint/no-explicit-any` | 12 | Tipizzazione incompleta, soprattutto export e pagine FMEA. |
| `react-refresh/only-export-components` | 1 | Organizzazione di `AuthContext`, rilevante allo sviluppo hot reload. |

### D. Style / cleanup - 21 errori

Tutte le occorrenze sono `no-irregular-whitespace` in stringhe o markup Gap. Non hanno effetto sul modello autorizzativo o sul runtime. Vanno corrette in una passata editoriale controllata per evitare modifiche massive non pertinenti.

## Criterio di chiusura

La Milestone 2B.3 non introduce nuovi errori ESLint. La baseline resta debito tecnico esplicito; ogni gruppo va affrontato in modifiche separate con build e smoke funzionale.
