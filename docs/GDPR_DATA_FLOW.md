# Flusso dei dati rilevante per la governance

## Schema generale

```text
UTENTE
  |
  v
BROWSER
  |-- caricamento SPA e asset --------------------------> VERCEL
  |-- registrazione/login/sessione ---------------------> SUPABASE AUTH
  |-- CRUD FMEA/RCA/GAP --------------------------------> SUPABASE POSTGREST
  |                                                        |
  |                                                        v
  |                                                  POSTGRESQL + RLS
  |
  `-- generazione PDF/XLSX/PNG/JSON --> DISPOSITIVO UTENTE
```

## Frontend e hosting

**VERIFICATO TECNICAMENTE**: PhaRMA T è una SPA React/Vite. Vercel distribuisce HTML, JavaScript, CSS e asset. Non esiste un backend custom su Vercel e il repository non invia a Vercel i payload degli assessment tramite API applicative.

**CONTROLLO MANUALE NECESSARIO**: log HTTP, IP, user-agent, retention, regione effettiva, accessi team, analytics e configurazioni del progetto Vercel.

## Autenticazione

**VERIFICATO TECNICAMENTE**: il browser comunica direttamente con Supabase Auth. Email, password, token e sessione sono gestiti dal provider. Il client usa la chiave pubblica/anon e non include `service_role`.

**CONTROLLO MANUALE NECESSARIO**: configurazione Auth remota, conferma email, policy password, session lifetime, rate limit, MFA amministratori e log retention.

## Dati applicativi

**VERIFICATO TECNICAMENTE**: i dati FMEA, RCA e Gap passano dal browser a Supabase PostgREST e PostgreSQL. Le policy RLS user-owned e cross-parent sono versionate e superano i test locali USER_A/USER_B. `risk_catalog_base` è reference data condiviso in sola lettura; le altre entità rilevanti sono isolate secondo la matrice RLS.

**CONTROLLO MANUALE NECESSARIO**: corrispondenza esatta tra migration locali e policy production prima di un pilot.

## Privacy guard

**VERIFICATO TECNICAMENTE**: prima delle scritture PostgREST, il client esegue un controllo locale limitato a identificatori diretti ad alta confidenza. Il valore rilevato non viene memorizzato né inviato a servizi esterni. Il controllo è un ausilio e non garantisce anonimizzazione.

## Export

**VERIFICATO TECNICAMENTE**: PDF, XLSX, PNG e JSON sono generati nel browser a partire dai dati già autorizzati. Il download avviene sul dispositivo dell'utente. Dopo il download il file non è più protetto da Auth o RLS.

**DECISIONE SIFO/DPO RICHIESTA**: regole di custodia, condivisione, conservazione e cancellazione degli export.

## Log e localizzazione

Il repository non contiene tracker, analytics applicativi, AI/LLM o error reporting esterno. Ciò non prova l'assenza di log infrastrutturali dei provider.

| Elemento | Stato |
| --- | --- |
| Regione Supabase production | CONTROLLO MANUALE NECESSARIO |
| Regione/edge Vercel e Functions | CONTROLLO MANUALE NECESSARIO |
| Trasferimenti extra SEE | CONTROLLO MANUALE NECESSARIO su DPA e subprocessors |
| Backup provider | CONTROLLO MANUALE NECESSARIO |
| Log retention provider | CONTROLLO MANUALE NECESSARIO |
| Tracker nel codice applicativo | NESSUN TRACKER APPLICATIVO RILEVATO NEL REPOSITORY |

## Confini

Il diagramma descrive il percorso applicativo. DNS, CDN, rete dell'utente, posta elettronica avviata tramite `mailto:` e sistemi operativi dei dispositivi possono introdurre ulteriori trattamenti non governati dal repository.

