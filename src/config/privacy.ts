export type PrivacyHintKind =
  | 'description'
  | 'causal'
  | 'location'
  | 'temporal'
  | 'professional'
  | 'notes'

export const PRIVACY_COPY = {
  formTitle: 'Compilazione con dati anonimi',
  formNotice: 'Non inserire nomi o iniziali, codici fiscali, numeri di cartella clinica, email, telefoni o altri identificatori diretti. Usa il minor dettaglio necessario ed evita combinazioni che possano rendere riconoscibile indirettamente una persona.',
  scanTitle: 'Possibili identificatori da verificare',
  scanDescription: "Il controllo locale ha rilevato pattern compatibili con identificatori diretti. Non certifica l'anonimizzazione e non conserva né registra i contenuti rilevati.",
  exportTitle: "Verifica privacy prima dell'export",
  exportNotice: "Il file sarà salvato sul dispositivo e, dopo il download, non sarà più protetto dalle regole di accesso dell'app. Verifica che non contenga dati identificativi prima di condividerlo o archiviarlo.",
} as const

export const PRIVACY_FIELD_HINTS: Record<PrivacyHintKind, string> = {
  description: 'Descrivi il contenuto senza dati identificativi di pazienti, operatori o altre persone.',
  causal: 'Descrivi cause e fattori senza riferimenti identificativi.',
  location: "Indica solo il livello di dettaglio organizzativo necessario all'analisi.",
  temporal: 'Utilizza il dettaglio temporale minimo necessario alla ricostruzione.',
  professional: 'Preferisci ruolo, funzione o team al nominativo personale.',
  notes: 'Inserisci solo note necessarie e prive di riferimenti identificativi.',
}

export const PRIVACY_PATTERN_LABELS = {
  email: 'indirizzo email',
  fiscal_code: 'codice fiscale italiano plausibile',
  phone: 'numero telefonico plausibile',
} as const

type PrivacyTableFieldMap = Record<string, string>

export const PRIVACY_FIELDS_BY_TABLE: Record<string, PrivacyTableFieldMap> = {
  areas: { name: 'Area', description: 'Descrizione area' },
  processes: { name: 'Processo', description: 'Descrizione processo' },
  process_steps: { name: 'Fase di processo', description: 'Descrizione fase' },
  risk_assessments: { title: 'Titolo assessment', description: 'Descrizione assessment' },
  risk_catalog_user: { name: 'Rischio personalizzato', description: 'Descrizione rischio' },
  risk_items: {
    custom_risk_name: 'Nome rischio personalizzato',
    custom_risk_description: 'Descrizione rischio personalizzato',
    notes: 'Note rischio',
  },
  control_measures: { description: 'Misura di controllo' },
  action_plans: {
    description: 'Descrizione azione FMEA',
    responsible: 'Ruolo o funzione responsabile FMEA',
    notes: 'Note azione FMEA',
  },
  user_custom_risks: { name: 'Rischio personale', description: 'Descrizione rischio personale' },
  rca_assessments: {
    title: 'Titolo RCA',
    description: 'Descrizione RCA',
    event_title: 'Titolo evento',
    event_description: 'Descrizione evento',
    location: 'Luogo',
    department: 'Reparto o servizio',
    immediate_containment: 'Contenimento immediato',
    summary: 'Riepilogo RCA',
    conclusion: 'Conclusioni RCA',
  },
  rca_causes: {
    description: 'Descrizione causa',
    evidence: 'Evidenze causa',
    notes: 'Note causa',
    root_cause_confirmation_notes: 'Note esito Root Cause',
  },
  rca_fishbone_diagrams: { title: 'Titolo Ishikawa', effect_statement: 'Effetto Ishikawa' },
  rca_fishbone_branches: { name: 'Categoria Ishikawa' },
  rca_five_why_chains: { title: 'Titolo 5 Whys', problem_statement: 'Problema 5 Whys' },
  rca_five_why_steps: { why_question: 'Domanda 5 Whys', answer: 'Risposta 5 Whys' },
  rca_action_plans: {
    description: 'Descrizione azione RCA',
    responsible: 'Ruolo o funzione responsabile RCA',
    effectiveness_check: 'Verifica efficacia RCA',
    notes: 'Note azione RCA',
  },
  gap_processes: { name: 'Macro-processo', description: 'Descrizione macro-processo' },
  gap_areas: { name: 'Dominio o sezione', description: 'Descrizione dominio o sezione' },
  gap_activities: {
    name: 'Attivita o requisito',
    description: 'Descrizione attivita o requisito',
    operator: 'Ruolo o funzione coinvolta',
    target_state: 'Target atteso',
  },
  gap_standards: {
    name: 'Nome norma',
    issuing_body: 'Ente emittente',
    description: 'Descrizione norma',
    application_scope: 'Ambito di applicazione',
  },
  gap_activity_standards: { specific_reference: 'Riferimento normativo specifico' },
  gap_assessments: {
    title: 'Titolo assessment Gap',
    description: 'Descrizione assessment Gap',
    facility_name: 'Struttura',
    department: 'Reparto o unita',
    assessor: 'Ruolo o funzione valutatore',
  },
  gap_activity_evaluations: {
    current_state: 'Stato attuale',
    gap_description: 'Gap rilevato',
    notes: 'Note valutazione',
    evaluated_by: 'Ruolo o funzione valutatore',
  },
  gap_actions: {
    description: 'Descrizione azione Gap',
    responsible: 'Ruolo o funzione responsabile Gap',
    verification_method: 'Metodo di verifica',
    verification_notes: 'Note verifica',
    verified_by: 'Ruolo o funzione verificatore',
    notes: 'Note azione Gap',
  },
  gap_action_events: { description: 'Descrizione evento azione' },
  gap_links: { notes: 'Note collegamento' },
}
