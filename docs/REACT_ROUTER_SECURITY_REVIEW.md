# React Router security review - Milestone 2B.2b

Data: 25 agosto 2026  
Ambito: routing runtime di PhaRMA T, senza modifica delle route o della logica di autenticazione.

## Esito

React Router e stato aggiornato dalla versione **7.9.6** alla **7.18.2**, ultima release 7.x verificata durante la milestone. L'app continua a usare Declarative Mode con `BrowserRouter`; non sono stati introdotti Data Router, Framework Mode, SSR o RSC.

| Elemento | Evidenza |
| --- | --- |
| Modalita | Declarative SPA con `BrowserRouter`, `Routes`, `Route` e `Navigate` |
| Entry point | `src/App.tsx:5`, `src/App.tsx:84`, `src/App.tsx:142` |
| Protezione route | `ProtectedRoute` in `src/App.tsx:34`; redirect a `/login` in `src/App.tsx:49` |
| Route pubbliche | `PublicRoute` in `src/App.tsx:56`; redirect autenticati in `src/App.tsx:71` |
| Logout | `src/components/Layout.tsx:125` |
| Assenti | `createBrowserRouter`, `RouterProvider`, `ScrollRestoration`, API server, SSR e RSC |

## Advisory HIGH iniziali

Le classificazioni sotto derivano dalla modalita realmente usata e dalle sezioni "Affected configurations" degli advisory ufficiali.

| Advisory | Versioni/fix rilevante | Modalita vulnerabile | Modalita PhaRMA T | Reachability pre-fix | Esito |
| --- | --- | --- | --- | --- | --- |
| [GHSA-2w69-qvjg-hvjx](https://github.com/advisories/GHSA-2w69-qvjg-hvjx) | fix 7.12.0 | Data/Framework/RSC in specifici redirect | Declarative `BrowserRouter` | NOT REACHABLE | Risolto dall'upgrade |
| [GHSA-8v8x-cx79-35w7](https://github.com/advisories/GHSA-8v8x-cx79-35w7) | fix 7.12.0 | SSR con `ScrollRestoration` | SPA client-side | NOT REACHABLE | Risolto dall'upgrade |
| [GHSA-49rj-9fvp-4h2h](https://github.com/advisories/GHSA-49rj-9fvp-4h2h) | fix 7.14.2 | Framework Mode | Declarative | NOT REACHABLE | Risolto dall'upgrade |
| [GHSA-8646-j5j9-6r62](https://github.com/advisories/GHSA-8646-j5j9-6r62) | fix 7.13.2 | API RSC instabili | Nessuna API RSC | NOT REACHABLE | Risolto dall'upgrade |
| [GHSA-8x6r-g9mw-2r78](https://github.com/advisories/GHSA-8x6r-g9mw-2r78) | fix 7.15.0 | Framework manifest endpoint | Nessun server React Router | NOT REACHABLE | Risolto dall'upgrade |
| [GHSA-rxv8-25v2-qmq8](https://github.com/advisories/GHSA-rxv8-25v2-qmq8) | fix 7.14.0 | Framework/single-fetch | Nessun single-fetch | NOT REACHABLE | Risolto dall'upgrade |
| [GHSA-chx6-hx7r-mcp5](https://github.com/advisories/GHSA-chx6-hx7r-mcp5) | fix 7.18.0 | Framework Mode | Declarative | NOT REACHABLE | Risolto dall'upgrade |
| [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2) | fix 7.18.2 | API RSC instabili | Nessuna API RSC | NOT REACHABLE | Risolto dall'upgrade |

Nessuno degli advisory HIGH iniziali risultava raggiungibile nel deployment SPA corrente. L'upgrade e stato comunque applicato per eliminare i finding dal grafo, ridurre il rischio di un futuro uso involontario delle modalita interessate e restare nella stessa major 7.

## Regressione routing

E stato aggiunto `scripts/security/routing-regression-test.mjs`, eseguibile con:

```powershell
npm.cmd run security:routing
```

Il test valida 16 casi:

- modalita Declarative e assenza di API server/RSC;
- pagine pubbliche e redirect di autenticazione;
- route protette;
- dashboard e detail FMEA, RCA e Gap;
- parametri ID;
- redirect legacy;
- wildcard per route inesistente;
- logout verso `/login`;
- compatibilita dei deep link dichiarati.

Esito post-upgrade: **16/16 PASS**. Il functional smoke locale resta **6/6 PASS**.

## Rischio residuo

Non restano advisory npm HIGH attribuiti a `react-router` o `react-router-dom`. Se in futuro venissero introdotti Framework Mode, SSR, RSC, server actions o single-fetch, questa reachability analysis dovra essere ripetuta e non potra essere riutilizzata automaticamente.

## Rollback locale

```powershell
npm.cmd install react-router-dom@7.9.6 --save-exact
```

Il rollback reintroduce advisory noti e non e adatto a un rilascio.
