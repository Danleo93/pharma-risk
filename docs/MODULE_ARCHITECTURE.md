# Architettura della modularita runtime

## Componenti

### Registry statico

`src/config/modules.ts` descrive i tre moduli e centralizza:

- chiave stabile;
- label e metadati visivi;
- prefisso route e dashboard;
- ordinamento predefinito;
- voci di navigazione;
- associazione tra tabelle Supabase e modulo.

Il registry descrive la struttura. Non contiene lo stato operativo.

### Configurazione runtime

`public.app_modules` e la fonte autoritativa dello stato. Gli utenti autenticati
possono soltanto leggerla. Non esistono policy client per insert, update o delete.

`public.app_module_status_events` registra i cambi di stato tramite trigger.

### Provider React

`ModuleConfigProvider` effettua una sola lettura centralizzata e offre:

- `getStatus`;
- `isVisible`;
- `isReadable`;
- `isWritable`;
- `canExport`;
- `getDefaultAvailableRoute`;
- `refresh`.

Il refresh avviene ogni 60 secondi e al ritorno in foreground. La configurazione
e mantenuta solo in memoria.

### Routing

`ModuleRoute` protegge tutte le route FMEA, RCA e Gap:

- `enabled`: monta la pagina;
- `read_only`: monta la pagina con avviso;
- `disabled` o `unknown`: non monta la pagina funzionale;
- le route di nuova analisi richiedono esplicitamente scrittura.

Il redirect `/start` seleziona la prima dashboard leggibile nell'ordine del
registry. Non dipende piu da FMEA. Se nessun modulo e leggibile viene mostrata
una pagina neutrale senza redirect ricorsivi.

### Navigazione e Home

Home e sidebar leggono lo stesso registry e lo stesso provider. I moduli
disabilitati o sconosciuti vengono omessi; quelli in sola lettura mostrano un
indicatore dedicato.

### Enforcement delle scritture

Il client Supabase usa un `fetch` centralizzato che riconosce le mutazioni
PostgREST sulle tabelle dei moduli. Se il modulo non e `enabled`, la richiesta
viene fermata prima della rete e viene mostrato un messaggio comprensibile.

Questo controllo migliora l'esperienza ma non e l'autorita di sicurezza.

Nel database, 87 policy `AS RESTRICTIVE` applicano il controllo a 29 tabelle:

```text
ownership/cross-parent policy
AND
private.is_module_writable(module_key)
```

Le policy esistenti non sono state sostituite o indebolite.

### Sessione gia aperta

Se un utente apre una pagina quando il modulo e attivo e un amministratore lo
porta in sola lettura o lo disabilita, una configurazione client non ancora
aggiornata non consente di superare il database: la RLS valuta lo stato corrente
per ogni scrittura.

### Export

Gli export assessment controllano lo stato in memoria:

- `enabled`: consentiti;
- `read_only`: dipendono da `allow_export_in_read_only`;
- `disabled`/`unknown`: negati.

L'export GDPR non importa il runtime dei moduli e continua a leggere i dati
accessibili dell'utente anche se un modulo e disabilitato.

## Funzioni database

Le funzioni `private.is_module_readable`, `private.is_module_writable` e
`private.can_export_module`:

- risiedono nello schema non esposto `private`;
- usano `SECURITY DEFINER` con `search_path = ''`;
- usano nomi completamente qualificati;
- non usano SQL dinamico;
- restituiscono `false` se la configurazione manca.

## Fail-safe

La regola e `unknown != enabled`.

Errore di rete, riga assente o stato non valido producono uno stato `unknown`:

- route funzionale non montata;
- modulo omesso dalla navigazione;
- scritture frontend negate;
- export assessment negato;
- messaggio esplicativo mostrato all'utente.

Le letture DB non vengono revocate, quindi recupero tecnico ed export GDPR
restano possibili.

