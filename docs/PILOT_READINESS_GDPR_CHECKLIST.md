# Checklist GDPR e governance per il pilot

## Interpretazione degli stati

- **GO**: requisito tecnico verificato localmente; non equivale ad approvazione giuridica o production.
- **GO WITH CONDITION**: base disponibile, ma serve un controllo o una decisione prima del pilot.
- **NO-GO**: elemento organizzativo, contrattuale o tecnico indispensabile non ancora chiuso.

## Matrice

| Area | Stato | Evidenza | Azione residua |
| --- | --- | --- | --- |
| Riproducibilità | GO | Supabase locale, migration complete, seed USER_A/USER_B, `db reset` PASS | Conservare procedura e ripetere a ogni release |
| Security | GO WITH CONDITION | Security suite locale senza failure | Verifica autorizzata della configurazione production |
| RLS | GO WITH CONDITION | 30/30 CRUD, 22/22 cross-parent, 0 associazioni cross-owner in locale | Riconciliare e validare policy remote |
| Vulnerabilità | GO WITH CONDITION | Nessuna CRITICAL/HIGH runtime nota e raggiungibile dopo remediation | Rieseguire audit prima del rilascio |
| Privacy by design | GO | Notice, detector locale, soft block, minimizzazione, export warning | Approvare istruzioni organizzative e falsi positivi |
| Moduli runtime | GO | `enabled/read_only/disabled`, fail-safe e test 22/22 | Definire chi può cambiare stato in production |
| Backup | NO-GO | Nessuna evidenza provider nel repository | Acquisire piano, retention e prova restore |
| Incident response | GO WITH CONDITION | Runbook tecnico predisposto | Nominare contatti, owner, tempi ed approvare procedura |
| Informativa | NO-GO | Matrice legale predisposta; testi contengono punti non deliberati | Validazione e versionamento SIFO/DPO |
| Ruoli GDPR | NO-GO | Scenari mappati senza attribuzione definitiva | Delibera SIFO/DPO e atti conseguenti |
| DPA | NO-GO | Provider identificati | Verificare/sottoscrivere documenti applicabili e subprocessors |
| Retention | NO-GO | Timestamp/readiness mappati | Deliberare periodi e trigger |
| Cancellazione | GO WITH CONDITION | Cascade e ordine tecnico documentati | Approvare canale, owner, tempi e test end-to-end amministrativo |
| DPIA screening | GO WITH CONDITION | Input tecnico completo | Decisione DPIA SIFO/DPO |
| Export manual test | GO WITH CONDITION | PDF 4/4, XLSX 11/11 e JSON automatici PASS | Completare verifica visuale PDF/PNG/XLSX con dataset realistico |
| Governance account | NO-GO | Stato progettuale e transfer readiness documentati | Definire owner, accessi, recovery ed emergenza prima del pilot |

## Sintesi

L'app è tecnicamente pronta per proseguire la valutazione, ma il pilot istituzionale è **NO-GO allo stato attuale** finché non vengono chiusi almeno ruoli, informative, DPA/provider, backup e governance account. Le aree tecniche già `GO` non risolvono da sole tali condizioni.

## Condizioni minime per rivalutare il pilot

1. Delibera dei ruoli e della base giuridica.
2. Informativa/Termini approvati e versionati.
3. Supplier review con DPA, regione, subprocessors e trasferimenti.
4. Retention e procedura cancellazione approvate.
5. Backup/restore e log verificati sul piano effettivo.
6. Contatti e runbook incidenti approvati.
7. Decisione DPIA documentata.
8. Governance degli account e accessi formalizzata.
9. Confronto migration/policy e test production autorizzati.
10. Export manuali completati su dati sintetici.

