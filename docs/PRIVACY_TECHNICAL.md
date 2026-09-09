# Privacy by design tecnica

## Perimetro

PhaRMA T distingue due categorie di dati:

- **Identity data**: email, UUID utente, autenticazione, sessione e metadati tecnici gestiti dai provider. Sono dati personali necessari al servizio.
- **Analysis content**: contenuti FMEA, RCA e Gap Analysis. Il prodotto li progetta per informazioni anonime e non identificative; l'utente deve anonimizzare il caso prima dell'inserimento.

Il software non dichiara né certifica che un testo sia anonimo. Il controllo locale introdotto in Milestone 4A è un ausilio limitato a pattern ad alta confidenza.

## Misure implementate

1. Avviso centralizzato nei workflow di assessment con regole di minimizzazione.
2. Microcopy contestuale per descrizioni, cause, collocazione, data/ora, note e identificatori professionali.
3. Etichette orientate a **Ruolo / Funzione / Team** dove la logica non richiede un nominativo.
4. Scansione locale pre-salvataggio per email, codice fiscale italiano formalmente plausibile e telefono italiano plausibile.
5. Soft block: correzione raccomandata oppure conferma esplicita del falso positivo.
6. Nessuna trasmissione a servizi AI o API esterne per la scansione; nessuna memorizzazione dei match.
7. Warning centralizzato prima degli export e filename/metadati neutri.
8. Header browser a basso rischio in `vercel.json`.
9. Suite automatica `npm.cmd run privacy:test` su ambiente locale sintetico.

## Limiti deliberati

- Il detector non riconosce tutti gli identificatori e non sostituisce la revisione umana.
- Non analizza semanticamente combinazioni indirettamente identificative.
- Date e orari non vengono bloccati perché possono essere necessari alla RCA.
- Non sono stati introdotti tracker, analytics, AI o nuovi subprocessori.
- Non è stata implementata una cancellazione account dal browser con privilegi amministrativi.
- Non sono stati stabiliti periodi di conservazione.
- Informativa, ruoli, basi giuridiche e retention richiedono approvazione SIFO/DPO.

## Rettifica e rimozione selettiva

Con modulo `enabled`, le funzioni ordinarie di modifica/eliminazione restano disponibili secondo la UI del modulo e le RLS. Con modulo `read_only` o `disabled`, le scritture ordinarie sono intenzionalmente bloccate. Un dato personale inserito accidentalmente in un modulo non scrivibile richiede una procedura amministrativa verificata, eseguita da un soggetto autorizzato e tracciata fuori dal client pubblico; i feature flag non vengono bypassati dal browser.

## Cookie e storage

Il codice applicativo non salva contenuti assessment in `localStorage`, `sessionStorage` o IndexedDB. Supabase Auth conserva quanto necessario alla sessione secondo il proprio client. Non risultano SDK analytics o tracker nel repository. La valutazione giuridica su cookie/informativa resta separata dall'inventario tecnico.

## Header browser

La configurazione Vercel include CSP compatibile con asset locali e Supabase, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, Permissions Policy restrittiva e HSTS. La CSP consente connessioni solo all'origine e ai domini Supabase; deve essere rivalidata se in futuro vengono aggiunti provider o CDN.

## Matrice conclusiva Milestone 4A

| Requirement | Evidenza tecnica | Stato | Owner della decisione residua |
| --- | --- | --- | --- |
| Data minimisation | Privacy guard locale, notice nei form e `PRIVACY_FIELD_INVENTORY.md` | Implementato tecnicamente | SIFO/DPO per regole organizzative e casi ammessi |
| Retention | Timestamp e readiness documentati in `DATA_RETENTION_TECHNICAL_READINESS.md` | Tecnicamente predisposto, periodi non definiti | SIFO/DPO definiscono periodi e trigger |
| Cancellazione account | Relazioni cascade e workflow analizzati in `ACCOUNT_DELETION_TECHNICAL_REVIEW.md` | Parziale; manca procedura amministrativa approvata e testata | SIFO/DPO; successiva implementazione backend/amministrativa |
| Base giuridica | Non determinabile dal codice | Aperto | SIFO/DPO |
| DPIA | Evidenze tecniche e rischi inventariati | Aperto | DPO |
| Retention backup/log | Flussi e timestamp mappati; configurazione remota non verificata | Aperto | Supabase/SIFO/DPO e verifica provider |
| Sicurezza production | RLS, cross-parent, export e privacy test superati in locale | Non ancora validata sul remoto | Futura attività autorizzata successiva alla Milestone 4B |
