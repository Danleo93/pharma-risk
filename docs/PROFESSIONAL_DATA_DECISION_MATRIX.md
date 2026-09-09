# Matrice decisionale sui dati professionali

Principio proposto: **ruolo/funzione/team prima del nominativo**, quando metodologicamente sufficiente.

| Campo | Modulo | Ruolo/team sufficiente? | Nominativo necessario? | Motivo | Decisione |
| --- | --- | --- | --- | --- | --- |
| Responsabile azione | FMEA | Spesso sì | Possibile eccezione operativa | Accountability del piano | SIFO/DPO e owner metodologico |
| Responsabile azione | RCA | Spesso sì | Possibile eccezione operativa | Accountability del piano | SIFO/DPO e owner metodologico |
| Responsabile/i azione | Gap | Spesso sì | Possibile eccezione operativa | Accountability e scadenze | SIFO/DPO e owner metodologico |
| Assessor | Gap | Sì nella maggior parte dei casi | Da motivare | Identificare funzione valutatrice | SIFO/DPO |
| Operatore/Funzione coinvolta | Gap attività | Sì | Normalmente no | Descrive il processo, non una persona | SIFO/DPO confermano regola |
| `evaluated_by` | Gap | Sì | Da motivare | Tracciabilità metodologica | SIFO/DPO |
| `verified_by` | Gap | Sì | Da motivare | Verifica efficacia | SIFO/DPO |
| Responsabile monitoraggio/firma | RCA | Ruolo possibile | Firma nominale può essere richiesta per uso documentale | Chiusura report | SIFO/DPO e governance documentale |
| Autore/owner account | Tutti | UUID tecnico sufficiente nell'app | Email necessaria ad Auth | Isolamento dati e accesso | SIFO/DPO |

## Azione tecnica eventuale

Dopo la decisione: introdurre vocabolari controllati o distinguere campi `ruolo` e `nominativo` solo se realmente necessari. Nessuna modifica è inclusa nella Milestone 4B.

