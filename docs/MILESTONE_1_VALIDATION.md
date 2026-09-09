# Milestone 1 - validazione Supabase locale

## Esito

**PASS.** Il repository ricostruisce localmente schema, autenticazione e dataset sintetici per FMEA, RCA e Gap Analysis.

## Backup e acquisizione remota

Prima delle modifiche sono stati acquisiti fuori dal repository:

- ruoli;
- schema `public` senza righe applicative;
- backup dati `public`;
- backup Auth;
- metadati Storage;
- migration history remota.

Percorso locale del backup: `C:\Users\danie\PhaRMA_T_backups\20260824_milestone1_prelocal`.

Il progetto remoto non e stato sottoposto a reset, push, repair o applicazione di migration.

## Ricostruzione database

- `supabase start`: PASS.
- `supabase db reset`: PASS in quattro esecuzioni complete dopo la correzione del seed.
- Tabelle applicative ricostruite: 30.
- Tabelle con RLS attiva: 30.
- Policy presenti: 117.
- Utenti sintetici: 2.
- Assessment seed: 2 FMEA, 2 RCA, 2 Gap.

## Verifiche API

`npm run verify:local`: PASS.

- autenticazione USER_A: PASS;
- autenticazione USER_B: PASS;
- isolamento RLS tra utenti: PASS;
- create/update/delete FMEA: PASS;
- create/update/delete RCA: PASS;
- create/update/delete Gap: PASS.

## Verifiche frontend

- login locale e redirect FMEA: PASS;
- dashboard e dettaglio FMEA: PASS;
- dashboard e dettaglio RCA: PASS;
- dashboard e dettaglio Gap: PASS;
- visualizzazione dei dati sintetici corretti per USER_A: PASS.

## Export

Sono stati attivati dal browser locale senza errori applicativi:

- FMEA: PDF ed Excel;
- RCA: PDF, Excel e PNG;
- Gap: PDF ed Excel.

Il controllo ha verificato l'esecuzione dei generatori. La revisione visiva puntuale di ogni pagina PDF e di ogni foglio Excel resta un controllo manuale consigliato.

## Confronto finale con production

Il confronto di sola lettura tra migration locali e schema remoto lascia due differenze:

1. `risk_assessments.status`: il locale include deliberatamente `archived`, gia usato dal codice; il remoto non lo ammette ancora.
2. `set_rca_updated_at()`: il motore segnala una normalizzazione testuale del corpo della funzione; la logica SQL e equivalente.

Il repository e stato scollegato dal progetto remoto al termine del confronto.

## Elementi non riproducibili dal repository

- configurazione e segreti Vercel di produzione;
- impostazioni operative del progetto Supabase remoto non rappresentate da `config.toml`;
- dati reali di produzione, volutamente esclusi;
- backup remoto, volutamente conservato fuori dal repository.

## Rollback repository

Prima del rollback salvare eventualmente il lavoro con un commit o una patch. Ripristinare solo i file tracciati modificati nella milestone e rimuovere esclusivamente i nuovi file elencati nel relativo commit. Non usare reset distruttivi sull'intero working tree se sono presenti modifiche dell'utente.

Per arrestare l'ambiente locale senza intervenire sul remoto:

```powershell
supabase stop
```

La production non richiede rollback perche non e stata modificata.
