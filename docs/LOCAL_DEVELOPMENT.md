# Ambiente locale PhaRMA T

Questa procedura ricostruisce PhaRMA T con database, autenticazione e dati esclusivamente locali e sintetici.

## Prerequisiti Windows

1. Git.
2. Node.js e npm.
3. Docker Desktop avviato con container Linux.
4. Supabase CLI installata e disponibile come comando `supabase`.

Per l'installazione della CLI consultare la documentazione ufficiale Supabase. In alternativa, i comandi di verifica del progetto possono essere eseguiti con `npx supabase`.

## Ricostruzione da zero

Aprire PowerShell nella cartella in cui si desidera scaricare il progetto:

```powershell
git clone <URL_REPOSITORY>
cd pharma-risk
npm install
supabase start
supabase db reset
npm run dev
```

Aprire quindi:

- applicazione: `http://127.0.0.1:5173`;
- Supabase Studio locale: `http://127.0.0.1:54323`;
- casella email di test: `http://127.0.0.1:54324`.

Il frontend usa automaticamente `.env.development`, che contiene soltanto URL e chiave pubblica dell'istanza Supabase locale.

## Esposizione del server Vite

Lo script `npm run dev` esegue Vite senza opzioni `--host`: il server di sviluppo resta sul loopback locale (`localhost`/`127.0.0.1`) e non deve essere esposto alla rete aziendale o a Internet.

Usare normalmente:

```powershell
npm run dev
```

Non usare:

```text
npm run dev -- --host 0.0.0.0
```

Non aggiungere `server.host: true`, `0.0.0.0` o indirizzi LAN a `vite.config.ts` senza una valutazione di sicurezza separata e un'autorizzazione esplicita. Vite e uno strumento di sviluppo, non il server di produzione.

## Utenti sintetici

| Utente | Email | Password |
| --- | --- | --- |
| USER_A | `user_a@pharmat.local` | `LocalOnly!Passw0rd-A` |
| USER_B | `user_b@pharmat.local` | `LocalOnly!Passw0rd-B` |

Ogni utente dispone di dati distinti per FMEA, RCA e Gap Analysis. I contenuti sono simulati e non derivano dal database di produzione.

## Verifica automatica

Con Supabase locale in esecuzione:

```powershell
npm run verify:local
```

Il controllo:

1. rifiuta URL diversi da `127.0.0.1` o `localhost`;
2. autentica USER_A e USER_B;
3. verifica che RLS nasconda i dati dell'altro utente;
4. crea, modifica ed elimina un assessment temporaneo FMEA, RCA e Gap;
5. elimina i record temporanei anche se un aggiornamento fallisce.

## Reset e aggiornamento tipi

Per ricostruire il solo database locale:

```powershell
supabase db reset
```

Per rigenerare i tipi TypeScript dallo schema locale:

```powershell
supabase gen types typescript --local > src/types/database.ts
```

## Protezione del progetto remoto

Il repository di sviluppo deve restare scollegato dal progetto Supabase di produzione durante il normale lavoro locale.

Non eseguire mai:

```text
supabase db reset --linked
```

Non usare inoltre `supabase db push`, `supabase migration repair` o comandi con `--linked` senza una fase separata, un backup aggiornato e un'autorizzazione esplicita.

Prima di un reset verificare sempre che:

1. Docker Desktop sia avviato;
2. l'URL applicativo sia `http://127.0.0.1:54321`;
3. il comando non contenga `--linked`.

## Arresto e riavvio

```powershell
supabase stop
```

Per riprendere:

```powershell
supabase start
npm run dev
```

## Problemi comuni

- **Docker non raggiungibile:** avviare Docker Desktop e attendere che il motore sia pronto.
- **Porte occupate:** controllare che `5173` e le porte locali Supabase `54321-54324` non siano usate da altri servizi.
- **Login non riuscito dopo il reset:** attendere il riavvio dei container, ricaricare la pagina e usare uno degli utenti sintetici.
- **Schema incoerente:** eseguire nuovamente `supabase db reset`; non correggere manualmente il database locale senza aggiungere una migration.
- **Frontend con dati remoti:** controllare che Vite sia avviato in modalita sviluppo e che `.env.development` punti a `127.0.0.1`.

## Controlli manuali consigliati

1. Aprire dashboard e dettaglio assessment FMEA.
2. Aprire dashboard e dettaglio assessment RCA.
3. Aprire dashboard e dettaglio assessment Gap.
4. Modificare e ripristinare un dato sintetico.
5. Verificare PDF, Excel e PNG disponibili nei moduli.
6. Accedere separatamente come USER_A e USER_B e confermare l'isolamento dei dataset.
