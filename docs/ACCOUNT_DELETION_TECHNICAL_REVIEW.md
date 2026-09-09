# Revisione tecnica cancellazione account e dati

## Stato corrente

- L'utente può esportare i propri dati da Impostazioni.
- L'utente può predisporre una richiesta di cancellazione via email con email account e UUID.
- Il client pubblico non possiede `service_role` e non può eliminare un utente Supabase Auth.
- Non esiste un backend amministrativo dedicato per l'oblio.
- La cancellazione automatica dal browser non è stata introdotta per non ampliare la superficie di attacco.

## Relazioni dati

Le tabelle utente principali referenziano `auth.users(id)` con `on delete cascade`. Le tabelle figlie FMEA, RCA e Gap sono inoltre collegate ai rispettivi parent con cascade o, in alcuni casi, `set null`/`restrict`. La rimozione dell'utente Auth da un contesto amministrativo autorizzato è quindi progettata per propagarsi ai dati user-owned, ma deve essere provata su un clone/ambiente locale prima di adottare la procedura operativa.

Gli eventi amministrativi di stato modulo possono conservare la traccia tecnica con riferimento utente rimosso o nullo secondo la FK prevista; la loro qualificazione e retention devono essere definite separatamente.

## Ordine tecnico raccomandato da validare

1. Ricezione della richiesta tramite canale definito.
2. Verifica dell'identità del richiedente senza richiedere ulteriori dati non necessari.
3. Offerta/verifica dell'export prima della cancellazione, se richiesto.
4. Inventario e conteggio dei record associati all'UUID.
5. Cancellazione dell'utente Auth da contesto amministrativo autorizzato.
6. Verifica post-operazione che non restino record applicativi user-owned.
7. Verifica separata di backup, log provider e tempi tecnici applicabili.
8. Comunicazione dell'esito e conservazione della sola evidenza amministrativa strettamente necessaria.

## Moduli read_only o disabled

La procedura amministrativa non deve riattivare il modulo né bypassare il client. L'amministratore autorizzato opera sul perimetro dell'utente dopo verifica della richiesta. Questa procedura futura deve essere documentata, autorizzata e testata; non è un pannello admin nella Milestone 4A.

## Gap residui

- owner e canale ufficiale della richiesta;
- SLA/termine applicabile;
- formato del registro richieste;
- trattamento delle copie di backup e dei log provider;
- responsabilità SIFO, autore, gestore Supabase e gestore Vercel;
- procedura approvata per errore di contenuto in modulo disabilitato;
- test end-to-end amministrativo su ambiente non production.

