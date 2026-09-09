# Review dipendenze residue - Milestone 2B.3

Data valutazione: 25 agosto 2026  
Ambiente: repository locale, Supabase locale e dataset sintetico.

## Esito

La remediation conservativa ha eliminato tutti gli advisory HIGH senza major upgrade e senza modifiche alla business logic.

| Grafo | Low | Moderate | High | Critical |
| --- | ---: | ---: | ---: | ---: |
| Prima della Milestone 2B.3 - completo | 1 | 1 | 10 | 0 |
| Prima della Milestone 2B.3 - production | 0 | 0 | 6 | 0 |
| Dopo la Milestone 2B.3 - completo | 1 | 0 | 0 | 0 |
| Dopo la Milestone 2B.3 - production | 0 | 0 | 0 | 0 |

Il solo finding residuo e `@babel/core` LOW, classificato `BUILD_ONLY` e documentato in `SECURITY_ACCEPTED_RISKS.md`.

## Matrice di reachability e decisione

| Package | Versione iniziale -> finale | Severity iniziale | Direct/Transitive | Production/Dev | Advisory | Reachability | Fix | Breaking risk | Decisione |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `@supabase/supabase-js` | 2.86.0 -> 2.112.4 | tramite `ws` HIGH | Direct | Runtime | ramo Realtime | `NOT_REACHABLE` nel codice corrente | minor stessa major | Basso, coperto dalla suite | Aggiornato |
| `ws` | 8.18.3 -> rimosso | HIGH | Transitive | Dipendenza Realtime Node | GHSA-58qx-3vcg-4xpx; GHSA-96hv-2xvq-fx4p | `NOT_REACHABLE`: nessuna subscription o connessione WebSocket applicativa | rimosso dal nuovo ramo Supabase | Basso | Eliminato |
| `vite` | 7.2.4 -> 7.3.6 | HIGH | Direct | Dev/build | advisory dev server e file read | `BUILD_ONLY`; il server resta su loopback | patch/minor stessa major | Basso | Aggiornato |
| `rollup` | 4.53.3 -> 4.62.5 | HIGH | Transitive | Build | GHSA-mw96-cpmx-2vgc | `BUILD_ONLY` | versione compatibile | Basso | Aggiornato |
| `postcss` | 8.5.6 -> 8.5.26 | HIGH | Transitive | Build CSS | source map/file read e stringify | `BUILD_ONLY` | versione compatibile | Basso | Aggiornato |
| `nanoid` | 3.3.11 -> 3.3.18 | HIGH | Transitive | Build via PostCSS | loop con size invalida | `BUILD_ONLY`; API non usata dall'app | versione compatibile | Basso | Aggiornato |
| `picomatch` | 4.0.3 -> 4.0.7 | HIGH | Transitive | Build/tooling | glob injection/ReDoS | `BUILD_ONLY` | versione compatibile | Basso | Aggiornato |
| `flatted` | 3.3.3 -> 3.4.4 | HIGH | Transitive | ESLint | parse DoS/prototype pollution | `BUILD_ONLY` | versione compatibile | Basso | Aggiornato |
| `minimatch` | 3.1.2 e 9.x vulnerabili -> 3.1.5/10.2.6 | HIGH | Transitive | ESLint | ReDoS | `BUILD_ONLY` | aggiornamento ESLint compatibile | Basso | Aggiornato |
| `brace-expansion` | versioni vulnerabili -> 1.1.18/5.0.9 | HIGH | Transitive | ESLint | expansion DoS | `BUILD_ONLY` | aggiornamento ESLint compatibile | Basso | Aggiornato |
| `js-yaml` | 4.1.1 -> 4.3.1 | HIGH | Transitive | ESLint config | parsing DoS | `BUILD_ONLY` | aggiornamento ESLint compatibile | Basso | Aggiornato |
| `ajv` | 6.12.6 -> 6.15.0 | MODERATE | Transitive | ESLint | ReDoS con `$data` | `BUILD_ONLY` | aggiornamento ESLint compatibile | Basso | Aggiornato |
| `@babel/core` | 7.28.5 | LOW | Transitive | Build React | GHSA-4x5r-pxfx-6jf8 | `BUILD_ONLY`, richiede sorgente locale malevolo e condizioni specifiche | fix indicato con cambio di toolchain/major | Medio | Accettato temporaneamente |
| `dompurify` | 3.4.14 | nessun finding | Transitive | Runtime opzionale jsPDF | nessun advisory npm attivo | API HTML jsPDF non usata | non necessario | N/D | Nessuna azione |

## Verifica `ws` e Supabase Realtime

- `ws` era introdotto da `@supabase/realtime-js@2.86.0`.
- Nel sorgente non risultano chiamate a `channel`, `subscribe`, `removeChannel`, `WebSocket` o API Realtime.
- La versione browser usa i servizi Supabase Auth e PostgREST; nessuna connessione WebSocket e aperta dalla logica applicativa corrente.
- `@supabase/supabase-js@2.112.4` usa `@supabase/realtime-js@2.112.4`, che non introduce piu `ws` nell'albero installato.
- La security suite locale ha confermato autenticazione, CRUD, RLS e isolamento USER_A/USER_B dopo l'upgrade.

Rivalutare questa conclusione se vengono introdotti canali Realtime, subscription, presenza online o notifiche WebSocket.

## Dev server

`vite.config.ts` non imposta `server.host` e lo script `dev` esegue soltanto `vite`: il binding predefinito resta `localhost`. Non sono presenti script con `--host 0.0.0.0`. La regola operativa e descritta in `LOCAL_DEVELOPMENT.md`.

## Decisione conclusiva

- `CRITICAL reachable`: 0
- `HIGH runtime reachable`: 0
- `HIGH non-reachable`: 0 residui
- `BUILD_ONLY`: 1 LOW residuo
- `MODERATE`: 0
- `LOW`: 1

La baseline puo essere chiusa con un rischio residuo LOW documentato e con verifica manuale degli export ancora da completare.

## Quality gate finale

| Controllo | Esito |
| --- | --- |
| `npm.cmd run security:test` | PASS: 12 sezioni, 0 failure |
| Build production | PASS con Vite 7.3.6 |
| Smoke funzionale | 6/6 PASS, USER_A e USER_B su FMEA/RCA/Gap |
| RLS | 30/30 PASS |
| Cross-parent | 22/22 tabelle testate; 19/19 oggetto remediation PASS; 0 operazioni consentite |
| Routing regression | 16/16 PASS |
| Excel regression | 11/11 PASS |
| PDF regression | 4/4 PASS |
| `npm audit --omit=dev` | 0 finding |
| `npm audit` completo | 1 LOW build-only, 0 HIGH/CRITICAL |
| ESLint | baseline invariata: 46 errori, 1 warning; delta nuovi errori 0 |

La build segnala ancora un chunk JavaScript superiore a 500 kB. E un tema di performance/code splitting, non un finding di sicurezza di questa milestone.
