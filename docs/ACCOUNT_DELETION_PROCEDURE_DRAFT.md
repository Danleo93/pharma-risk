# Bozza tecnica della procedura di cancellazione account e dati

## Stato del documento

Bozza per deliberazione SIFO/DPO. Non è una procedura approvata e non introduce funzioni nell'app.

## Distinzioni necessarie

### A. Disattivazione account

Impedisce nuovi accessi senza eliminare immediatamente record e prove tecniche. Il repository non implementa uno stato applicativo di sospensione account; l'eventuale funzione dipende dagli strumenti Supabase Auth e dalla procedura scelta.

### B. Cancellazione Auth

Rimuove l'identità da Supabase Auth. Richiede privilegi amministrativi che non sono e non devono essere presenti nel browser pubblico.

### C. Cancellazione dati applicativi

Le tabelle principali referenziano `auth.users(id)` con `ON DELETE CASCADE`. La propagazione è progettata nello schema e deve essere collaudata end-to-end su ambiente sintetico prima dell'uso operativo.

### D. Cancellazione o rettifica selettiva

Con modulo `enabled`, l'utente può usare i normali workflow CRUD disponibili. Con modulo `read_only` o `disabled`, serve un intervento amministrativo autorizzato che non riattivi il modulo e non esponga `service_role` al client.

### E. Backup

La rimozione dal database attivo non equivale alla cancellazione immediata da ogni backup. Piano, finestra e ripristino selettivo sono **CONTROLLO MANUALE NECESSARIO** presso il provider.

### F. Log

I log Auth, API e hosting possono essere separati dai record applicativi. Contenuto, accessi e retention sono **CONTROLLO MANUALE NECESSARIO**.

## Ordine tecnico proposto

1. Ricevere la richiesta attraverso il canale approvato.
2. Verificare l'identità con dati minimi, senza chiedere contenuti degli assessment.
3. Registrare identificativo richiesta, data, scope e operatore autorizzato.
4. Offrire o verificare l'export dei dati propri, se richiesto.
5. Inventariare i record associati all'UUID senza copiarne il contenuto nei log della procedura.
6. Limitare l'accesso all'account, se previsto dalla decisione organizzativa.
7. Cancellare l'utente Auth da un contesto amministrativo autorizzato.
8. Verificare che le cascade abbiano rimosso i record user-owned FMEA, RCA e Gap.
9. Verificare separatamente eventi amministrativi, log e backup.
10. Registrare esito, data e sole evidenze minime, senza conservare i dati cancellati.
11. Comunicare l'esito tramite il canale approvato.

## Matrice delle responsabilità operative

| Attività | Utente | Amministratore autorizzato | Decisione SIFO/DPO |
| --- | --- | --- | --- |
| Esportare i propri dati | Disponibile in UI | Non necessario | Regole informative |
| Rettificare/eliminare record con modulo enabled | Disponibile dove previsto dalla UI | Non necessario | Istruzioni d'uso |
| Cancellare account Auth | Non disponibile dal client | Necessario | Owner, canale e autorizzazione |
| Rimuovere dati con modulo read_only/disabled | Non disponibile ordinariamente | Necessario | Procedura eccezionale e audit |
| Verificare backup/log | No | Provider/amministratore | Tempi e prova richiesta |
| Conservare evidenza della richiesta | No | Funzione designata | Contenuto minimo e retention |

## Decisioni aperte

- canale ufficiale e responsabile della presa in carico;
- modalità di verifica dell'identità;
- tempi di evasione e comunicazione;
- disattivazione preventiva sì/no;
- formato e retention del registro richieste;
- trattamento di backup, log ed eventi amministrativi;
- gestione delle richieste durante indisponibilità provider;
- approvazione del test end-to-end su account sintetico.

