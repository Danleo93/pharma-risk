# Remediation backlog successivo alla Milestone 2A

Questo backlog registra le azioni emerse dalla baseline. Non costituisce implementazione della Milestone 2B e non modifica production.

## P0 - Critico

| Finding | Evidenza | Intervento proposto | Rischio modifica | Test obbligatori |
| --- | --- | --- | --- | --- |
| jsPDF 3.0.4 con advisory critici | **Risolto localmente in Milestone 2B.2a**: `jspdf@4.2.1`, `jspdf-autotable@5.0.8`, 0 CRITICAL production | Prima del rilascio: verifica visuale finale dei PDF completi con dataset realistici | Basso residuo, limitato al layout documentale | [Remediation CRITICAL](./DEPENDENCY_REMEDIATION_CRITICAL.md), test PDF 4/4 PASS, build e security suite PASS |

## P1 - Alto

| Finding | Evidenza | Intervento proposto | Rischio modifica | Test obbligatori |
| --- | --- | --- | --- | --- |
| RLS cross-parent, 19 tabelle dopo inventario completo | **Risolto localmente in Milestone 2B.1**: [matrice](./RLS_TEST_MATRIX.md) e [remediation](./RLS_REMEDIATION.md) | Prima di production: backup, riconciliazione migration history e applicazione autorizzata | Medio-alto sul deploy remoto; nessuna regressione locale rilevata | Matrice 30/30 PASS, cross-parent 0, smoke USER_A/B PASS |
| SheetJS xlsx 0.18.5 high | **Risolto localmente in Milestone 2B.2b**: 0.20.3 ufficiale fissato; app write-only; formula injection neutralizzata | Prima del rilascio: apertura manuale di export completi in Excel/LibreOffice | Basso residuo, legato alla compatibilita visuale dei workbook | [Review SheetJS](./XLSX_SECURITY_REVIEW.md), Excel 11/11 PASS, build PASS |
| React Router 7.9.6 high | **Risolto localmente in Milestone 2B.2b**: 7.18.2; modalita Declarative SPA | Ripetere la reachability analysis se si introducono SSR, Framework Mode o RSC | Basso nel modello corrente | [Review Router](./REACT_ROUTER_SECURITY_REVIEW.md), routing 16/16 PASS, smoke 6/6 PASS |

## P2 - Medio

| Finding | Evidenza | Intervento proposto | Rischio modifica | Test obbligatori |
| --- | --- | --- | --- | --- |
| Dipendenze build/transitive segnalate | **Risolto in Milestone 2B.3**: 0 HIGH/MODERATE, 1 LOW build-only accettato | Monitorare Babel e rivalutare con il prossimo aggiornamento compatibile della toolchain | Basso residuo | [Review residua](./RESIDUAL_DEPENDENCY_REVIEW.md), security suite e build PASS |
| Filename export e metadati privacy | **Risolto localmente in Milestone 4A**: helper centralizzato, nomi neutri e metadata `PhaRMA T` | Mantenere la convenzione per i futuri formati di export | Basso residuo | `privacy:test`, export test e verifica manuale dei download |
| Browser XSS manuale incompleto | Input test WARNING | Automatizzare i tre detail con payload sintetici e controllo dialog/DOM | Basso | FMEA/RCA/Gap, desktop e laptop |
| PNG non coperto end-to-end | Export test WARNING | Test browser su output reale e area catturata | Basso | RCA/FMEA grafici disponibili, Unicode e stringhe lunghe |
| ESLint baseline effettiva 32+1 | `tmp/` esclusa dopo inventario; classificazione aggiornata in [ESLINT_BASELINE.md](./ESLINT_BASELINE.md); 0 security/runtime critici, nessun nuovo errore | Correggere per regola e modulo in PR separati | Medio | Nessuna variazione business, build e smoke |

## P3 - Basso / maturita operativa

| Finding | Evidenza | Intervento proposto | Rischio modifica | Test obbligatori |
| --- | --- | --- | --- | --- |
| Auth indisponibile non automatizzato | Auth WARNING | Test di resilienza UI e messaggi con Supabase locale arrestato | Basso | Login, sessione scaduta, retry manuale |
| Secret scanner basato su pattern interni | Secret report | Integrare scanner dedicato in CI mantenendo redazione dei valori | Basso | Fixture locali non devono generare blocchi ingiustificati |
| Baseline locale non riconciliata con migration history remota | Milestone 1 | Definire procedura separata di baseline/repair autorizzata prima di qualunque push schema | Alto se eseguita male | Backup, dry run, confronto schema e piano rollback |
| Procedura definitiva di cancellazione account | Review tecnica Milestone 4A | Definire con SIFO/DPO canale, ruoli, verifica identita, tempi e prova di completamento; valutare backend amministrativo separato | Medio-alto | Test end-to-end su account sintetico e verifica FK/cascade |
| Periodi di conservazione | Timestamp inventariati, policy non definita | Delibera SIFO/DPO per categorie di dati e successiva implementazione tecnica | Medio | Dry run su dati sintetici, audit delle esclusioni e rollback |
| Informativa e termini definitivi | Affermazioni tecniche separate dalle decisioni legali | Validazione formale SIFO/DPO di ruoli, finalita, basi, tempi, fornitori e trasferimenti | Medio | Revisione documentale versionata |
| Rettifica urgente con modulo disabled | Le feature flag impediscono correttamente le modifiche ordinarie | Definire procedura amministrativa autenticata senza bypass client o `service_role` nel browser | Medio-alto | Test USER_A/USER_B e audit delle operazioni |
| Verifiche visuali autenticate pre-pilota | Gate automatico verde; checklist parziale in [validazione visuale](./MANUAL_VISUAL_VALIDATION.md) | Completare moduli enabled/read_only/disabled, privacy modal, XLSX Excel e PNG end-to-end | Basso | Desktop 1440, laptop 1024, mobile 390; dati sintetici locali |

## Ordine raccomandato per una futura Milestone 2B

1. Verifica manuale visuale degli export completi con [checklist](./MANUAL_EXPORT_VERIFICATION.md).
2. Automazione browser residua.
3. Riduzione progressiva della baseline ESLint per gruppi omogenei.

Completati localmente: policy cross-parent (Milestone 2B.1), jsPDF/jspdf-autotable (Milestone 2B.2a), React Router e SheetJS/formula injection (Milestone 2B.2b), dipendenze residue e toolchain compatibile (Milestone 2B.3).

Ogni punto deve avere commit dedicato e rollback semplice. Nessuna remediation deve essere applicata al database remoto senza backup aggiornato, riconciliazione della migration history e autorizzazione esplicita.
