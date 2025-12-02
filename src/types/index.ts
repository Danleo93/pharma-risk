// Tipi per l'applicazione Pharma Risk

export interface User {
  id: string
  email: string
}

export interface Area {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Process {
  id: string
  user_id: string
  area_id: string
  name: string
  description: string | null
  created_at: string
}

export interface ProcessStep {
  id: string
  process_id: string
  step_number: number
  name: string
  description: string | null
  created_at: string
}

export interface RiskCatalogBase {
  id: string
  category: string
  name: string
  description: string | null
  created_at: string
}

export interface RiskCatalogUser {
  id: string
  user_id: string
  category: string
  name: string
  description: string | null
  created_at: string
}

export interface RiskAssessment {
  id: string
  user_id: string
  area_id: string | null
  process_id: string | null
  title: string
  description: string | null
  status: 'draft' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
  // Relazioni opzionali
  area?: Area
  process?: Process
  risk_items?: RiskItem[]
}

export interface RiskItem {
  id: string
  assessment_id: string
  process_step_id: string | null
  risk_catalog_base_id: string | null
  risk_catalog_user_id: string | null
  custom_risk_name: string | null
  custom_risk_description: string | null
  severity: number | null
  probability: number | null
  detectability: number | null
  rpn: number | null
  hazard_score: number | null
  risk_class: 'Alta' | 'Media' | 'Bassa' | null
  notes: string | null
  created_at: string
  // Relazioni opzionali
  process_step?: ProcessStep
  risk_catalog_base?: RiskCatalogBase
  risk_catalog_user?: RiskCatalogUser
  control_measures?: ControlMeasure[]
  action_plans?: ActionPlan[]
}

export interface ControlMeasure {
  id: string
  risk_item_id: string
  description: string
  measure_type: 'preventive' | 'detective' | 'corrective' | null
  effectiveness: 'high' | 'medium' | 'low' | null
  created_at: string
}

export interface ActionPlan {
  id: string
  risk_item_id: string
  description: string
  responsible: string | null
  due_date: string | null
  status: 'planned' | 'in_progress' | 'completed'
  completion_date: string | null
  notes: string | null
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  organization_name: string | null
  theme: 'light' | 'dark'
  color_palette: 'hospital' | 'minimal' | 'professional'
  created_at: string
  updated_at: string
}

// Tipi per le scale di valutazione
export interface ScaleOption {
  value: number
  label: string
  description: string
}

export const SEVERITY_SCALE: ScaleOption[] = [
  { value: 1, label: 'Minima', description: 'Nessun danno o danno trascurabile' },
  { value: 2, label: 'Bassa', description: 'Danno lieve, recupero completo' },
  { value: 3, label: 'Moderata', description: 'Danno moderato, intervento necessario' },
  { value: 4, label: 'Alta', description: 'Danno grave, conseguenze a lungo termine' },
  { value: 5, label: 'Critica', description: 'Morte o danno permanente grave' },
]

export const PROBABILITY_SCALE: ScaleOption[] = [
  { value: 1, label: 'Rara', description: 'Può accadere solo in circostanze eccezionali' },
  { value: 2, label: 'Improbabile', description: 'Potrebbe accadere qualche volta' },
  { value: 3, label: 'Occasionale', description: 'Potrebbe accadere occasionalmente' },
  { value: 4, label: 'Probabile', description: 'Probabilmente accadrà più volte' },
  { value: 5, label: 'Frequente', description: 'Ci si aspetta che accada frequentemente' },
]

export const DETECTABILITY_SCALE: ScaleOption[] = [
  { value: 1, label: 'Quasi certa', description: 'Controlli rileveranno sicuramente il problema' },
  { value: 2, label: 'Alta', description: 'Alta probabilità di rilevamento' },
  { value: 3, label: 'Moderata', description: 'Probabilità moderata di rilevamento' },
  { value: 4, label: 'Bassa', description: 'Bassa probabilità di rilevamento' },
  { value: 5, label: 'Impossibile', description: 'Il problema non sarà rilevato' },
]

export interface UserCustomRisk {
  id: string
  user_id: string
  name: string
  category: string
  description?: string
  created_at: string
}