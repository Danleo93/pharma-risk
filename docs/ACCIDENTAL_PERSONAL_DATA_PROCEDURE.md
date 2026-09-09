# Procedura tecnica per dato personale inserito accidentalmente

## Scenario

Un utente inserisce in FMEA, RCA o Gap un nome, codice fiscale, email, recapito o dettaglio sanitario riconoscibile. La presenza di tali dati non è prevista dalla finalità applicativa. Il privacy guard riduce alcuni inserimenti diretti, ma non garantisce il riconoscimento semantico o indiretto.

## Workflow

```text
Segnalazione
  → identificazione minima del record
  → limitazione dell'accesso, se necessaria
  → rettifica o rimozione
  → verifica di export e copie già distribuite
  → verifica tecnica di log e backup
  → comunicazione al referente SIFO
  → decisione SIFO/DPO sulla qualificazione dell'evento
```

## Informazioni minime della segnalazione

- account o UUID interessato;
- modulo e ID del record;
- data indicativa;
- tipo di dato, senza riprodurne il valore nel ticket se evitabile;
- presenza nota di export o condivisioni;
- urgenza tecnica osservata.

## Azioni per stato del modulo

| Stato modulo | Azione tecnica ordinaria | Escalation |
| --- | --- | --- |
| `enabled` | L'utente rettifica/elimina tramite UI dove disponibile; verifica il record aggiornato | Supporto se il record non è gestibile dalla UI |
| `read_only` | Nessuna scrittura dal client | Intervento amministrativo autorizzato, senza riattivare il modulo |
| `disabled` | Pagina funzionale non montata e scritture negate | Intervento amministrativo autorizzato e tracciato fuori dal client pubblico |

## Export e copie

La rimozione dal database non revoca file PDF, XLSX, PNG o JSON già scaricati. Il referente deve identificare, per quanto ragionevolmente possibile, destinatari e copie note e applicare le istruzioni organizzative approvate.

## Confine decisionale

Il coordinatore tecnico documenta evidenze, contiene l'accesso e supporta la rimozione. Non decide autonomamente se l'evento costituisca data breach, se sia necessaria una notifica o quali comunicazioni inviare agli interessati. Queste decisioni spettano a SIFO/DPO secondo la procedura approvata.

