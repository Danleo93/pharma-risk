# Gestione runtime dei moduli PhaRMA T

## Scopo

PhaRMA T gestisce separatamente i moduli `FMEA`, `RCA` e `GAP_ANALYSIS`.
Il loro stato operativo e conservato nella tabella Supabase `public.app_modules` e
puo essere cambiato senza modificare il codice o distribuire una nuova versione
dell'applicazione.

In questa milestone non esiste un pannello amministrativo nell'app. Le modifiche
devono essere effettuate da un amministratore del database.

## Stati disponibili

| Stato | Visibile | Consultazione | Scritture | Export assessment |
| --- | --- | --- | --- | --- |
| `enabled` | Si | Si | Si, nel rispetto delle RLS | Si |
| `read_only` | Si, con badge | Si | No | Si se `allow_export_in_read_only = true` |
| `disabled` | No | Bloccata dall'app | No | Non disponibile dall'interfaccia |

Lo stato `disabled` non elimina dati. Le letture restano tecnicamente disponibili
nel database agli utenti proprietari per recupero, amministrazione ed export GDPR.

## Cambiare stato in ambiente locale

1. Verificare di essere nel progetto locale e che Supabase locale sia avviato.
2. Aprire Supabase Studio locale all'indirizzo indicato da `supabase status`.
3. Aprire SQL Editor.
4. Eseguire uno dei comandi seguenti.

### Disabilitare RCA

```sql
update public.app_modules
set status = 'disabled', updated_by = null
where module_key = 'RCA';
```

### Riattivare RCA

```sql
update public.app_modules
set status = 'enabled', updated_by = null
where module_key = 'RCA';
```

### Impostare RCA in sola lettura

```sql
update public.app_modules
set
  status = 'read_only',
  allow_export_in_read_only = true,
  updated_by = null
where module_key = 'RCA';
```

Sostituire `RCA` con `FMEA` o `GAP_ANALYSIS` per gli altri moduli.

## Quando il cambio diventa visibile

L'app aggiorna la configurazione:

- ogni 60 secondi;
- quando la finestra torna in primo piano;
- al nuovo accesso dell'utente.

La cache e solo in memoria. Non viene usato `localStorage` come fonte autoritativa.

## Verificare il cambio

```sql
select module_key, status, allow_export_in_read_only, updated_at
from public.app_modules
order by module_key;
```

Verificare inoltre che:

1. un modulo disabilitato non compaia nella Home e nella sidebar;
2. il suo URL diretto mostri "Modulo temporaneamente non disponibile";
3. in sola lettura compaia il badge e le modifiche siano negate;
4. gli altri moduli restino operativi.

## Audit dei cambi di stato

```sql
select module_key, old_status, new_status, changed_at, changed_by
from public.app_module_status_events
order by changed_at desc;
```

Quando il cambio avviene dal SQL Editor senza valorizzare `updated_by`,
`changed_by` puo essere `null`. Questa limitazione e intenzionale per la
Milestone 3 e non riduce l'applicazione delle policy.

## Rollback operativo

In caso di comportamento inatteso:

```sql
update public.app_modules
set
  status = 'enabled',
  allow_export_in_read_only = true,
  updated_by = null;
```

Poi:

1. verificare i tre record;
2. eseguire `npm.cmd run security:modules` in locale;
3. eseguire `npm.cmd run security:test`;
4. correggere il problema con una nuova migration;
5. non modificare retroattivamente migration gia applicate;
6. non eliminare `app_modules` o lo storico degli eventi.

## Troubleshooting

### Tutti i moduli risultano non disponibili

Controllare che la query a `app_modules` riesca e che esista una riga valida per
ciascuna chiave. Una riga mancante o uno stato non valido viene trattato in modo
conservativo come `unknown`.

### Una pagina aperta consente ancora di premere Salva

Il client blocca la richiesta prima della rete e mostra un messaggio. Se lo stato
e cambiato mentre la pagina era aperta ma il client non si e ancora aggiornato,
la policy RLS del database nega comunque la scrittura.

### Un export non parte in sola lettura

Verificare `allow_export_in_read_only`. L'export GDPR da Impostazioni e
indipendente da questo valore.

## Protezione production

Queste procedure sono state validate esclusivamente in ambiente locale. Non
eseguire `supabase db reset --linked`, `db push` o comandi equivalenti sul
progetto production.

