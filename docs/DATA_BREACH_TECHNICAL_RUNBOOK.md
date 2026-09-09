# Runbook tecnico per incidenti sui dati

## Scopo

Supportare la risposta tecnica senza sostituire la valutazione SIFO/DPO. Il runbook non stabilisce se notificare il Garante o gli interessati.

## Flusso operativo

```text
DETECTION
  ↓
CONTAINMENT
  ↓
PRESERVATION OF EVIDENCE / LOGS
  ↓
TECHNICAL ASSESSMENT
  ↓
IMMEDIATE COMMUNICATION TO SIFO CONTACT
  ↓
SUPPORT TO SIFO/DPO ASSESSMENT
  ↓
TECHNICAL REMEDIATION
  ↓
POST-INCIDENT REVIEW
```

## Regole di raccolta evidenze

- non copiare payload personali nei ticket se basta ID/tabella/timestamp;
- preservare log e configurazioni senza alterare gli originali;
- registrare chi ha avuto accesso alle evidenze;
- non usare account condivisi per l'intervento;
- non pubblicare token, chiavi o screenshot con dati reali;
- eseguire test e riproduzioni solo con dataset sintetici.

## Scenari e contenimento iniziale

| Scenario | Contenimento tecnico iniziale | Evidenza da preservare | Decisione esterna |
| --- | --- | --- | --- |
| Accesso cross-user | Sospendere la funzione/modulo se necessario; non alterare subito le policy senza backup | ID record, route, policy, token claims redatti, timestamp | SIFO/DPO qualificano impatto e comunicazioni |
| Credenziali compromesse | Revocare sessioni, forzare reset secondo strumenti provider | Eventi Auth, IP/user-agent se disponibili | SIFO/DPO definiscono comunicazioni |
| Chiave/token esposto | Revoca/rotazione immediata; rimuovere accesso pubblico | Commit/log/deployment coinvolti senza riportare il segreto | Governance provider e valutazione SIFO/DPO |
| Dato personale in assessment | Limitare, rettificare/rimuovere secondo procedura dedicata | ID e tipo di dato, non il valore | SIFO/DPO decidono qualificazione |
| Export a destinatario errato | Chiedere contenimento organizzativo e cancellazione della copia | File, destinatario, canale, orario | SIFO/DPO decidono misure ulteriori |
| Database esposto | Revocare credenziali, limitare rete/accessi, preservare audit | Configurazione, log accessi, intervallo | SIFO/DPO e provider |
| Account amministratore compromesso | Bloccare/revocare account e sessioni, ruotare credenziali | Audit account, modifiche, accessi | SIFO/DPO e governance tecnica |
| Vulnerabilità critica | Disabilitare percorso raggiungibile o modulo; applicare remediation testata | Advisory, versione, reachability, test | SIFO decide rilascio/stop pilot |

## Scheda minima incidente

1. Identificativo e data/ora.
2. Segnalante e referente tecnico.
3. Sistemi, utenti e moduli potenzialmente interessati.
4. Finestra temporale.
5. Misure di contenimento eseguite.
6. Evidenze disponibili e loro custodia.
7. Valutazione tecnica preliminare, separata da quella giuridica.
8. Comunicazione inviata al contatto SIFO.
9. Decisioni ricevute da SIFO/DPO.
10. Remediation, verifica e chiusura tecnica.

## Contatti e tempi

Owner, recapiti, reperibilità e tempi di escalation sono **DECISIONE SIFO/DPO RICHIESTA** prima del pilot.

