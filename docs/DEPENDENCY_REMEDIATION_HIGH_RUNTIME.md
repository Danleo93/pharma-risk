# Remediation dipendenze HIGH runtime - Milestone 2B.2b

Data: 25 agosto 2026  
Ambito: React Router e SheetJS/xlsx.  
Production e schema Supabase: non modificati.

## Esito sintetico

| Componente | Prima | Dopo | Finding HIGH residui | Test mirato |
| --- | --- | --- | ---: | --- |
| `react-router-dom` / `react-router` | 7.9.6 | 7.18.2 | 0 | Routing 16/16 PASS |
| `xlsx` | 0.18.5 npm | 0.20.3 tarball ufficiale fissato | 0 | Excel 11/11 PASS |
| Formula injection | Sanitizzazione non uniforme | Helper condiviso su FMEA/RCA/Gap | 0 percorso noto | Payload `= + - @` PASS |

## Strategia applicata

1. Inventario delle API e delle modalita realmente utilizzate.
2. Test di regressione routing sulla versione iniziale.
3. Upgrade React Router entro la serie 7.x.
4. Ripetizione routing, smoke, security suite e build.
5. Classificazione SheetJS READ/WRITE e reachability delle CVE.
6. Test Excel pre-upgrade.
7. Upgrade SheetJS alla release CE ufficiale 0.20.3 con URL esatto e lockfile.
8. Sanitizzazione centralizzata delle celle controllabili dall'utente.
9. Ripetizione test Excel, security suite, build e lint.

Non sono stati usati `npm audit fix` o `npm audit fix --force`.

## Modifiche applicative

- `src/lib/spreadsheetSecurity.ts`: neutralizzazione pura delle celle potenzialmente interpretate come formule;
- `src/services/exportService.ts`: righe FMEA sanitizzate;
- `src/services/rcaExportService.ts`: wrapper sicuri AOA/JSON;
- `src/services/gapExportService.ts`: append dei fogli Gap sanitizzato;
- nessun cambiamento ai dati esportati salvo l'apostrofo di sicurezza davanti ai prefissi formula;
- nessun cambiamento alle route o ai redirect.

## Automazione introdotta

- `scripts/security/routing-regression-test.mjs`;
- `scripts/security/excel-regression-test.mjs`;
- script npm `security:routing` e `security:excel`;
- integrazione di entrambe le suite in `security:test`.

## Quality gate

| Controllo | Esito |
| --- | --- |
| Vulnerabilita CRITICAL production | 0 |
| React Router HIGH | 0 |
| SheetJS/xlsx HIGH | 0 |
| Audit production residuo | 6 HIGH, 0 CRITICAL; nessuno attribuito a Router/xlsx |
| Audit completo residuo | 10 HIGH, 1 MODERATE, 1 LOW; nessuno attribuito a Router/xlsx |
| Routing regression | 16/16 PASS |
| Excel regression | 11/11 PASS |
| Functional smoke | 6/6 PASS |
| RLS CRUD | 30/30 PASS |
| Cross-parent | 19/19 PASS |
| PDF regression | 4/4 PASS |
| Build | PASS |
| ESLint | baseline 46 errori e 1 warning; delta nuovi 0 |
| Security suite integrata | 12 sezioni senza failure |

Il conteggio audit complessivo puo continuare a includere finding HIGH di build/tooling e `ws`. Questi non sono stati rimediati perche esclusi esplicitamente dalla milestone. `ws` appartiene al ramo Supabase Realtime, per il quale non risultano canali usati nel sorgente corrente.

La prima esecuzione della suite integrata in sandbox ha registrato un failure esclusivamente per indisponibilita di rete del registro npm durante `npm audit`. La riesecuzione con accesso al registro, a parita di codice, e terminata con **0 failure**; non si tratta di una regressione applicativa.

## Documenti di dettaglio

- [React Router security review](./REACT_ROUTER_SECURITY_REVIEW.md)
- [SheetJS/xlsx security review](./XLSX_SECURITY_REVIEW.md)
- [Inventario vulnerabilita](./VULNERABILITY_INVENTORY.md)
- [Remediation backlog](./REMEDIATION_BACKLOG.md)

## Rischi residui e confini

- toolchain Vite/Rollup/PostCSS/Nanoid e dipendenze lint: fuori scope;
- trasporto Supabase Realtime `ws`: non rilevato nell'uso applicativo corrente, fuori scope;
- regressione visuale manuale completa dei file Excel in Microsoft Excel/LibreOffice: raccomandata prima del rilascio;
- eventuale introduzione futura di SSR/RSC o import Excel richiede una nuova analisi.

La milestone non ha modificato feature flag, schema Supabase, dati production, ownership o deploy.
