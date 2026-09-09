# Dossier GDPR e governance per SIFO/DPO

## Executive Summary

Il presente documento non costituisce una DPIA, un parere legale o una determinazione dei ruoli GDPR; raccoglie le evidenze tecniche e le decisioni organizzative e giuridiche necessarie per la valutazione da parte di SIFO e dei relativi referenti privacy.

## 1. Cos'è PhaRMA T

PhaRMA T è una web app per attività formative, metodologiche e documentali di risk management in farmacia ospedaliera. Integra FMEA, Root Cause Analysis e Gap Analysis. Non è progettata come dispositivo medico né come strumento di decisione clinica sul singolo paziente.

## 2. Finalità

La piattaforma consente a professionisti autenticati di organizzare assessment, cause, rischi, requisiti e azioni correttive, producendo riepiloghi ed export. La finalità proposta non richiede l'inserimento di dati identificativi di pazienti o operatori.

## 3. Utenti

Gli utenti previsti sono professionisti autorizzati nel perimetro definito da SIFO. Ogni account accede ai propri dati tramite autenticazione e Row Level Security. Numerosità, categorie professionali, strutture aderenti e scala geografica del pilot devono essere deliberate.

## 4. Dati trattati

### Dati necessari all'account

Email, UUID, credenziali gestite da Supabase Auth, sessione e metadati tecnici del provider.

### Contenuti metodologici

Assessment FMEA/RCA/Gap, cause, 5 Whys, Ishikawa, stati correnti, gap, note, standard e azioni. Sono progettati per informazioni non identificative e previamente anonimizzate. Poiché sono presenti testi liberi, il software non può garantire che l'utente non inserisca accidentalmente dati personali o sanitari riconoscibili.

### Dati professionali

Alcuni campi possono contenere responsabile, assessor, operatore, verificatore o equivalenti. La UI privilegia ruolo/funzione/team; l'ammissibilità di nominativi deve essere decisa da SIFO/DPO.

## 5. Dati che non devono essere inseriti

- nomi, iniziali riconoscibili, codici fiscali, email o telefoni di pazienti;
- numeri di cartella, ticket, referto o identificativi univoci;
- combinazioni di data, luogo e dettagli clinici che rendano riconoscibile una persona;
- nominativi di operatori quando ruolo o funzione sono sufficienti;
- credenziali, token, chiavi o segreti tecnici.

L'utente deve anonimizzare il caso prima dell'inserimento. Il controllo locale rileva soltanto alcuni identificatori diretti e non certifica anonimizzazione.

## 6. Architettura

PhaRMA T è una SPA React/TypeScript distribuita da Vercel. Il browser comunica direttamente con Supabase Auth e con le API PostgREST collegate a PostgreSQL. Non esiste un backend custom. Gli export sono generati nel browser e salvati sul dispositivo dell'utente.

```text
Utente → Browser → Vercel (SPA/asset)
                  → Supabase Auth
                  → Supabase PostgREST → PostgreSQL/RLS
                  → PDF/XLSX/PNG/JSON sul dispositivo
```

## 7. Provider

I provider tecnici individuati sono Supabase, Vercel e GitHub. Regione, piano, DPA, subprocessors, trasferimenti, log e backup devono essere verificati manualmente sulle configurazioni e sui contratti effettivi. Il repository non consente di certificarli.

## 8. Misure di sicurezza

### Verificato tecnicamente in locale

- schema ricostruibile da migration e seed sintetico;
- autenticazione Supabase;
- policy RLS user-owned e cross-parent;
- 30/30 tabelle CRUD isolate e 22/22 relazioni parent testate;
- nessuna operazione cross-parent consentita nei test;
- stati modulo `enabled/read_only/disabled` con fail-safe;
- nessuna vulnerabilità runtime CRITICAL/HIGH nota e raggiungibile dopo remediation;
- protezione formula injection XLSX;
- header browser restrittivi configurati;
- assenza di segreti production ad alta confidenza nello scan locale.

### Da verificare prima del pilot

La corrispondenza delle policy production, gli accessi provider, le chiavi, i log, il backup/restore, la protezione deploy e le configurazioni Auth remote.

## 9. Privacy by design

Sono presenti avvisi nei form, microcopy di minimizzazione, preferenza per ruolo/funzione/team, controllo locale pre-salvataggio e warning prima degli export. Il controllo non invia contenuti a AI o servizi esterni, non memorizza i match e consente di tornare a modificare o confermare un falso positivo.

## 10. Export

PDF, XLSX, PNG e JSON sono prodotti client-side. I test automatici verificano isolamento utente, PDF, XLSX e protezione dalle formule; resta una verifica visuale manuale completa. Dopo il download il file non è più protetto da RLS e deve essere custodito secondo regole approvate.

## 11. Cancellazione

Il client non possiede privilegi amministrativi per eliminare un utente Auth. Le foreign key sono progettate per la cascade dei dati user-owned dopo cancellazione Auth amministrativa. Sono documentati ordine tecnico, controlli post-operazione e casi `read_only/disabled`; devono ancora essere definiti canale, owner, tempi, registro, backup/log e test end-to-end.

## 12. Retention

I timestamp tecnici sono mappati, ma non esistono periodi definitivi né job automatici. SIFO/DPO devono deliberare durata, trigger, eccezioni e gestione backup/log prima di qualsiasi implementazione.

## 13. Incidenti

È predisposto un runbook tecnico basato su rilevazione, contenimento, conservazione evidenze, comunicazione immediata al contatto SIFO, supporto alla valutazione DPO, remediation e revisione. Il coordinatore tecnico non decide autonomamente notifiche al Garante o agli interessati.

## 14. Ruoli da definire

Devono essere valutati: SIFO come possibile titolare; coordinatore come soggetto autorizzato e/o eventuale amministratore di sistema; Supabase e Vercel come provider con qualificazione contrattuale; utenti e strutture aderenti. Proprietà del codice e ruolo GDPR sono distinti.

## 15. Decisioni ancora necessarie

Sono ancora aperti: ruoli, basi giuridiche, informative, DPA/subprocessors, regione/trasferimenti, retention, cancellazione, DPIA, nominativi professionali, backup/log, governance account e autorizzazione alla validazione production.

## 16. Condizioni per il pilot

### Elementi già pronti tecnicamente

Riproducibilità locale, RLS testate, modularità runtime, privacy guard, export hardening e documentazione tecnica.

### Condizioni indispensabili

1. approvazione ruoli, basi e testi legali;
2. verifica provider/DPA/regioni/subprocessors;
3. decisione retention, cancellazione e DPIA;
4. governance account, accessi e recovery;
5. backup/restore e incident response approvati;
6. validazione autorizzata di schema/policy/configurazione production;
7. test manuali export con dati sintetici.

Lo stato complessivo è **GO WITH CONDITION sul piano tecnico-preparatorio** e **NO-GO per l'avvio del pilot finché le condizioni istituzionali indispensabili restano aperte**.

---

# Decisioni richieste a SIFO/DPO

1. SIFO assume il ruolo di titolare del trattamento per il pilot e per l'eventuale esercizio successivo?
2. Quali basi giuridiche si applicano separatamente ad account, autenticazione, sicurezza/log, uso della piattaforma e comunicazioni di servizio?
3. Il coordinatore viene formalmente autorizzato alla gestione tecnica e con quale perimetro di privilegi?
4. Il coordinatore deve essere designato amministratore di sistema o deve operare tramite un diverso modello organizzativo?
5. Supabase e Vercel sono approvati come provider per il pilot, previa verifica dei relativi DPA?
6. Sono approvati regioni, subprocessors e garanzie per eventuali trasferimenti risultanti dalla supplier review?
7. Quali periodi e trigger di conservazione si applicano ad account, assessment, librerie, eventi amministrativi, log e backup?
8. Quale procedura, canale, owner e tempo di risposta si applicano a cancellazione account e rettifica/rimozione selettiva?
9. La documentazione predisposta è sufficiente per lo screening o deve essere svolta una DPIA completa?
10. Quando sono ammessi nominativi professionali e quando deve essere obbligatorio ruolo/funzione/team?
11. Quali testi di Privacy, Termini, registrazione e disclaimer sono approvati e con quale versione/data di efficacia?
12. Quali regole si applicano a download, custodia, condivisione e cancellazione degli export?
13. Chi sono i contatti e gli owner del runbook incidenti, con quali tempi di escalation e reperibilità?
14. Quali evidenze di backup, restore, log e sicurezza production sono richieste per autorizzare il pilot?
15. Gli account GitHub, Supabase e Vercel restano temporaneamente progettuali o devono essere trasferiti a organizzazioni SIFO, e in quale fase?

## Allegati tecnici principali

- `DATA_PROCESSING_INVENTORY.md`
- `GDPR_DATA_FLOW.md`
- `GDPR_ROLE_MATRIX.md`
- `GDPR_LEGAL_BASIS_DECISION_MATRIX.md`
- `RETENTION_DECISION_MATRIX.md`
- `ACCOUNT_DELETION_PROCEDURE_DRAFT.md`
- `ACCIDENTAL_PERSONAL_DATA_PROCEDURE.md`
- `DATA_BREACH_TECHNICAL_RUNBOOK.md`
- `DPIA_SCREENING_INPUT.md`
- `SUPPLIERS_AND_SUBPROCESSORS.md`
- checklist Supabase, Vercel e GitHub
- `TRANSFER_READINESS.md`
- `PILOT_READINESS_GDPR_CHECKLIST.md`
