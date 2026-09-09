# Matrice per la determinazione della base giuridica

Il repository non può determinare la base giuridica. La tabella prepara le decisioni SIFO/DPO e non assume che il consenso sia la soluzione predefinita.

| Trattamento | Dati | Finalità | Necessità tecnica | Base giuridica da determinare | Decisione SIFO/DPO |
| --- | --- | --- | --- | --- | --- |
| Creazione account | Email, UUID, timestamp Auth | Abilitare accesso personale | Necessaria per modello user-owned | Aperta | Sì |
| Autenticazione e sessione | Credenziali, token, metadati Auth | Proteggere accesso e mantenere sessione | Necessaria | Aperta | Sì |
| Sicurezza e log | IP, user-agent, eventi Auth/API, errori | Prevenzione abuso, diagnosi e sicurezza | In parte necessaria; dettaglio provider da verificare | Aperta | Sì |
| Utilizzo FMEA/RCA/Gap | Contenuti metodologici non destinati a dati personali | Erogare il servizio | Necessaria al servizio | Aperta; definire istruzioni in caso di dato accidentale | Sì |
| Dati professionali | Ruolo/funzione/team; eventuale nominativo | Assegnazioni, verifica e responsabilità metodologica | Dipende dal campo e dal workflow | Aperta | Sì, campo per campo |
| Comunicazioni di servizio | Email | Conferma account, reset, sicurezza, assistenza | Necessaria per alcune comunicazioni Auth | Aperta | Sì |
| Richieste diritti/cancellazione | Email, UUID, evidenza richiesta | Gestire la richiesta e dimostrarne l'esito | Necessaria alla procedura scelta | Aperta | Sì |
| Eventi stato moduli | UUID amministrativo, timestamp, stato | Governance tecnica e tracciabilità | Necessaria se si usa la modularità runtime | Aperta | Sì |

## Esito richiesto

Per ogni riga SIFO/DPO devono definire finalità, base giuridica, informativa, soggetti autorizzati, retention e modalità di esercizio dei diritti.

