# Inventario dei campi a rilevanza privacy

## Diff rispetto all'inventario precedente

| Variazione rilevata | Stato corrente |
| --- | --- |
| `gap_activity_evaluations.evaluated_by` valorizzato con email utente | Rimosso il nuovo autofill email; viene preservato il valore esistente o usata la dicitura neutra `Utente autenticato` |
| Responsabile monitoraggio RCA con fallback email | Rimosso il fallback email |
| Campi professionali con label nominative | Label e placeholder principali orientati a ruolo/funzione/team; il DB resta invariato |
| Feature flag runtime | Aggiungono stato tecnico dei moduli e audit amministrativo, non contenuto assessment |
| Metadata Gap `source_type` e `created_in_assessment_id` | Dati strutturali, non nuovi campi liberi personali |
| Warning e controllo pre-save | Nuova misura trasversale centralizzata |

## Matrice aggiornata

Legenda rischio: **diretto** se il campo può contenere un identificatore esplicito; **indiretto** se dettaglio e combinazioni possono rendere riconoscibile una persona.

| Modulo | Campo | UI | DB | Testo libero | Rischio diretto | Rischio indiretto | Misura attuale | Misura proposta/futura |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FMEA | Titolo assessment | Sì | `risk_assessments.title` | Sì | Medio | Medio | Notice + scan | Revisione umana |
| FMEA | Descrizione assessment | Sì | `risk_assessments.description` | Sì | Alto | Alto | Hint + scan | Esempi anonimizzati nel manuale |
| FMEA | Area/processo/fase | Sì | `areas`, `processes`, `process_steps` | Sì | Medio | Medio | Scan sui campi liberi | Tassonomie condivise da valutare |
| FMEA | Nome/descrizione rischio custom | Sì | `risk_catalog_user`, `risk_items`, `user_custom_risks` | Sì | Alto | Alto | Scan | Revisione cataloghi personali |
| FMEA | Note rischio | Sì | `risk_items.notes` | Sì | Alto | Alto | Scan | Regola operativa di minimizzazione |
| FMEA | Misura di controllo | Sì | `control_measures.description` | Sì | Medio | Medio | Scan | Revisione umana |
| FMEA | Descrizione/note azione | Sì | `action_plans.description`, `notes` | Sì | Alto | Medio | Scan | Revisione umana |
| FMEA | Responsabile azione | Sì | `action_plans.responsible` | Sì | Alto | Medio | Label ruolo/team + scan | Nominativo come eccezione documentata |
| RCA | Titolo assessment/evento | Sì | `rca_assessments.title`, `event_title` | Sì | Alto | Alto | Notice + scan | Revisione umana |
| RCA | Descrizione assessment/evento | Sì | `description`, `event_description` | Sì | Alto | Alto | Hint + scan | Esempi anonimizzati nel manuale |
| RCA | Data/ora/reported_at | Sì/parziale | `event_date`, `event_time`, `reported_at` | No | Basso | Alto | Hint di dettaglio minimo; esclusi dal detector | Decisione metodologica sul livello necessario |
| RCA | Luogo/reparto | Sì | `location`, `department` | Sì | Medio | Alto | Hint + scan | Tassonomia organizzativa da valutare |
| RCA | Contenimento, sintesi, conclusioni | Sì | `immediate_containment`, `summary`, `conclusion` | Sì | Alto | Alto | Scan; hint sul form iniziale | Estendere microcopy alle viste di editing future |
| RCA | Causa/evidenze/note | Sì | `rca_causes.description`, `evidence`, `notes` | Sì | Alto | Alto | Hint causale + scan | Revisione umana |
| RCA | 5 Whys | Sì | `rca_five_why_chains`, `rca_five_why_steps.answer` | Sì | Alto | Alto | Hint causale + scan | Esempi nel manuale |
| RCA | Note conferma Root Cause | Sì | `root_cause_confirmation_notes` | Sì | Alto | Alto | Hint causale + scan | Revisione umana |
| RCA | Azione/efficacia/note | Sì | `rca_action_plans` | Sì | Alto | Medio | Scan | Revisione umana |
| RCA | Responsabile/monitoraggio | Sì | `responsible`; stato UI per firma | Sì | Alto | Medio | Label ruolo/team; niente fallback email; scan sul responsabile azione | Formalizzare se la firma nominale è necessaria |
| Gap | Struttura/reparto | Sì | `gap_assessments.facility_name`, `department` | Sì | Medio | Medio | Notice + scan | Vocabolario controllato da valutare |
| Gap | Valutatore | Sì | `gap_assessments.assessor` | Sì | Alto | Medio | Label ruolo/team + scan | Nominativo come eccezione documentata |
| Gap | Operatore attività | Sì | `gap_activities.operator` | Sì | Alto | Medio | Label già funzionale + scan | Uniformare help text in tutte le viste |
| Gap | Stato corrente | Sì | `gap_activity_evaluations.current_state` | Sì | Alto | Alto | Hint + scan | Revisione umana |
| Gap | Gap rilevato | Sì | `gap_description` | Sì | Alto | Alto | Hint + scan | Revisione umana |
| Gap | Note valutazione | Sì | `notes` | Sì | Alto | Alto | Scan | Hint contestuale esteso |
| Gap | Evaluated by | Indiretto | `evaluated_by` | Sì | Alto | Medio | Nuovo autofill neutro; scan | Valutare migrazione dei valori email pregressi |
| Gap | Azione/responsabile/note | Sì | `gap_actions.description`, `responsible`, `notes` | Sì | Alto | Medio | Label ruolo/team + hint + scan | Revisione umana |
| Gap | Verifica efficacia | Sì | `verification_method`, `verification_notes`, `verified_by` | Sì | Alto | Medio | Label verificatore ruolo/team + scan | Nominativo come eccezione documentata |
| Gap | Eventi azione/collegamenti | Indiretto | `gap_action_events.description`, `gap_links.notes` | Sì | Medio | Medio | Scan | Limitare dettaglio nei testi generati/manuali |

## Campi professionali che restano capaci di contenere nominativi

Lo schema conserva `responsible`, `assessor`, `operator`, `evaluated_by`, `verified_by` e il campo di monitoraggio RCA. La UI privilegia ruolo/funzione/team, ma non impedisce un nominativo quando funzionalmente necessario. Questi campi non devono essere descritti come anonimi e richiedono regole organizzative approvate.

