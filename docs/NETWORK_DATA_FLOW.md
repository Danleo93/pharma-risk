# Flussi di rete e dati

| Destinazione | Motivo | Dati inviati | Necessaria | Stato |
| --- | --- | --- | --- | --- |
| Supabase Auth | Registrazione, login, reset password, sessione | Email, password tramite protocollo Auth, UUID/session token e metadati tecnici provider | Sì | Attiva |
| Supabase REST/PostgREST | CRUD FMEA, RCA, Gap, impostazioni e configurazione moduli | Dati account referenziali e contenuti assessment inseriti dall'utente | Sì | Attiva, protetta da Auth/RLS |
| Vercel | Distribuzione SPA e asset | Richieste HTTP, IP/user agent e log tecnici secondo configurazione provider; il repository non invia payload assessment a Vercel tramite API custom | Sì per hosting corrente | Attiva |
| Client browser locale | Generazione PDF/Excel/PNG/JSON | Contenuti già caricati nel browser; download sul dispositivo | Sì per export | Attiva |
| `mailto:` contatti/cancellazione | Avvio volontario del client email | Contenuto preparato e modificabile dall'utente | Solo su azione utente | Attiva |
| Tracker/analytics/Sentry/Hotjar | Non presenti | Nessuno dal codice applicativo | No | Assenti |
| AI/LLM/NLP esterni | Non presenti | Nessuno | No | Assenti |

## Browser storage

Il repository non usa esplicitamente `localStorage`, `sessionStorage` o IndexedDB per FMEA/RCA/Gap. Supabase Auth gestisce la persistenza della sessione necessaria all'accesso. I parametri URL osservati servono alla navigazione (per esempio tab RCA) e non contengono testi assessment.

## Logging applicativo

| Categoria | Presenza | Contenuto osservato | Valutazione |
| --- | --- | --- | --- |
| `console.log` | Assente nel codice applicativo | Nessuno | Conforme all'obiettivo |
| `console.error` | Presente per errori CRUD/export | Oggetto errore provider, non payload assessment esplicito | Mantenuto per diagnosi; evitare di aggiungere payload/email |
| `console.warn` | Presente per ref/grafici export mancanti | Etichetta tecnica del grafico, non contenuto assessment | Mantenuto |
| Error reporting esterno | Assente | Nessuno | Nessun egress aggiuntivo |

Il detector privacy non registra né mostra il valore intercettato; espone solo tipo, campo e numero di occorrenze.

