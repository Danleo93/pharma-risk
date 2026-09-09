# PhaRMA-T — registro migrazione Cloudflare

Data apertura: 2026-09-09.
Stato: PREPARAZIONE LOCALE; nessuna pubblicazione Cloudflare o modifica remota eseguita.

## Ambito autorizzato

L'utente ha richiesto di iniziare la migrazione del frontend da Vercel a
Cloudflare, con guida progressiva per le operazioni manuali sul sito.
Destinazione iniziale prevista: account personale del proponente; successivo
account SIFO da concordare. Nessun account, ruolo istituzionale, DPA accettato
o stanziamento economico viene presunto.

La migrazione non equivale ad autorizzazione alla diffusione istituzionale.
Restano aperti i controlli autenticati e di produzione e le decisioni privacy
registrate nei documenti di chiusura tecnica e governance.

## Configurazione predisposta

### Isolamento Git

Il 2026-09-09 e stato creato e selezionato il branch locale
`codex/cloudflare-migration`, a partire da `main`, commit `26e21d0`
(`ui: add Gap Analysis to home dashboard`). Tutte le modifiche locali
preesistenti sono state preservate. Nessun push eseguito.

Con autorizzazione dell'utente e stato successivamente creato il checkpoint
locale **`fac158e`**, riferimento **`codex/pre-cloudflare-2026-09-09`**.
Comprende 209 file complessivi di codice, configurazioni, test, audit e
documentazione (inclusi DOCX/XLSX salvati su disco e diagrammi).
Rispetto al precedente commit, 153 file risultano aggiunti o modificati.

La situazione pre-Cloudflare e stata ricostruita nell'indice Git, senza
riscrivere i file di lavoro: esclusi `wrangler.json`, `public/_headers` e questo
registro; rimossa dal solo README indicizzato la nota sulla migrazione e
ripristinato nel solo `.env.example` indicizzato il commento precedente.
Le modifiche Cloudflare sono salvate in un commit successivo separato.

`main` resta a `26e21d0`: per recuperare la situazione locale pre-migrazione
usare **il checkpoint `fac158e`, non `main`**. Il commit effettivamente
pubblicato su Vercel non e stato ancora verificato.

### Verifica del checkpoint e limiti

- Inventario e SHA-256 calcolati sui 209 file; contenuto dell'indice verificato
  contro i file controllati, con sole due trasformazioni sopra descritte.
- Scansione per pattern di chiavi private, token, URL con credenziali,
  assegnazioni di segreti, password e JWT. Per DOCX/XLSX esaminati i contenuti
  XML e relazioni interni, non soltanto i byte compressi.
- Nessuna credenziale operativa rilevata nei file selezionati. Revisionate
  sette segnalazioni: cinque password di fixture locali, una chiave pubblica
  anon dimostrativa Supabase in `.env.development`, un riferimento
  `env(OPENAI_API_KEY)` in `supabase/config.toml` (non il valore della chiave).
- Scanner esistente `node scripts/security/secret-scan.mjs`: WARNING atteso,
  zero potenziali segreti, zero da revisionare, cinque fixture/placeholder.
  Una scansione per pattern non certifica l'assenza assoluta di segreti.
- Esclusi dal checkpoint: `.env.local` e altre configurazioni riservate,
  dipendenze, build, backup, risultati generati, `tmp/`, anteprime renderizzate,
  estrazioni intermedie e file di blocco Office. Nessun file eliminato.
- Il checkpoint salva i documenti presenti su disco; eventuali modifiche
  ancora non salvate in Word/Excel non possono essere incluse.

### Recupero sicuro

Per consultare o verificare il checkpoint senza toccare il branch corrente,
creare una nuova directory di lavoro separata con `git worktree add --detach
<nuova-directory-vuota> codex/pre-cloudflare-2026-09-09`.
Reinstallare le dipendenze con `npm ci` e predisporre le variabili locali
necessarie; non copiare o pubblicare credenziali indiscriminatamente.
Non usare `reset --hard` o pulizie ricorsive per tornare alla versione precedente.

Questo recupera codice e documenti, non lo stato remoto di database, DNS,
contratti o account. Non sostituisce un backup del database o una copia Git
esterna: entrambi i branch sono al momento soltanto su questo computer.

- React/Vite invariati; Workers Static Assets, piano Free previsto.
- `wrangler.json`: pubblicazione della sola directory `dist`, fallback SPA;
  nessun codice Worker, database Cloudflare, account ID o dominio incorporato.
- `public/_headers`: stesse sei intestazioni di sicurezza di `vercel.json`.
  Vite copia il file nella directory di build; Cloudflare lo interpreta.
- Cache: comportamento predefinito Static Assets, con rivalidazione; nessuna
  nuova regola di cache per dati utente o risposte Supabase.
- Supabase resta separato e invariato. Nessuna migrazione SQL o dati.
- Vercel e la sua configurazione restano disponibili per il ritorno al servizio precedente.

## Condizioni prima della prima pubblicazione

1. Verificare account di destinazione e accettazione contrattuale/DPA da parte
   del soggetto autorizzato; conservare evidenza con data e versione.
2. Individuare la versione locale da pubblicare. Il worktree di partenza contiene
   numerose modifiche dell'utente, anche non tracciate: nessun commit, push,
   collegamento automatico al repository o trasferimento di file indiscriminato.
3. Verificare le variabili effettive della build (`VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`): una build locale puo usare valori locali.
   Non caricare una build di verifica collegata a localhost. Usare solo la
   chiave pubblica client appropriata, MAI service_role o credenziali amministrative.
4. Caricare solo gli asset compilati e la configurazione strettamente necessaria,
   mai `.env`, documenti di audit, backup, file temporanei o sorgenti riservati.
5. Registrare versione dello strumento di pubblicazione, identificativo deployment,
   manifest/hash della build, data e account (senza token o password).

## Passaggi manuali e controlli remoti — tutti PENDING

- Accesso/creazione account personale; verifica email e autenticazione a due fattori.
- Evidenza contratto/DPA applicabile al nuovo account.
- Selezione Workers & Pages; nessun piano a pagamento o dominio da acquistare ora.
- Autorizzazione dello strumento di pubblicazione limitata all'account corretto.
- Prima pubblicazione di verifica; registrazione del nuovo URL.
- Verifica HTTPS, sei header, navigazione diretta e ricaricamento delle route,
  caricamento asset, console e assenza di invocazioni dinamiche non previste.
- Supabase: aggiungere il nuovo URL ai redirect necessari senza rimuovere quello
  Vercel; pianificare separatamente il cambio di Site URL.
- Collaudo login/logout/reset password, FMEA/RCA/Gap e relativi stati, isolamento
  fra utenti, privacy ed export PDF/XLSX/PNG usando dati sintetici autorizzati.
- Decisione di passaggio dopo evidenza positiva; aggiornamento link e documenti.
- Dominio definitivo per produzione da scegliere: workers.dev resta inizialmente
  un indirizzo di verifica; un dominio personalizzato richiede controllo DNS.

## Reversibilita

Prima del passaggio mantenere la pubblicazione Vercel e i redirect Auth esistenti.
Se i controlli Cloudflare falliscono, non cambiare il punto di accesso ufficiale.
Se il problema emerge dopo il passaggio, ripristinare link/DNS e impostazioni Auth
precedenti come registrate nel verbale di cambio. Non rimuovere dati o progetti.
L'eventuale vecchia pubblicazione va disattivata solo dopo decisione esplicita.

## Documentazione da riconciliare alla verifica del nuovo hosting

Aggiornare documenti tecnici correnti, addendum SIFO, inventario fornitori,
flussi dati/rete, privacy, governance tecnica, trasferibilita e riproducibilita.
Conservare gli audit storici come evidenza datata: nessuna sostituzione globale
di Vercel con Cloudflare. Distinguere account personale iniziale da futuro SIFO.
I DOCX/PDF non sono ancora stati modificati: migrazione non completata.

## Evidenze locali

Verifiche eseguite il 2026-09-09:

- `npm run build`: PASS, 2704 moduli; warning Vite per un chunk oltre 500 kB
  non compressi. Build locale di verifica, non autorizzata al caricamento senza
  il controllo delle variabili di destinazione descritto sopra.
- `npm run performance:budget`: PASS, entry gzip 146,14 KiB.
- `npm run security:routing`: PASS, tutti i controlli della suite esistente.
- Verifica strutturale locale con assert Node: fallback SPA, assenza di `main`
  e `run_worker_first`, corrispondenza esatta delle sei intestazioni Vercel: PASS.
- Confronto contenuto `public/_headers` / `dist/_headers`: PASS.
- `git diff --check`: PASS; avvisi Git di normalizzazione LF/CRLF.

Nessuna prova su infrastruttura Cloudflare ancora eseguita.

## Riferimenti ufficiali consultati il 2026-09-09

- https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/
- https://developers.cloudflare.com/workers/static-assets/headers/
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://www.cloudflare.com/terms/ (sezione 6.1: incorporazione DPA)
- https://www.cloudflare.com/cloudflare-customer-dpa/
