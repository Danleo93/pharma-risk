import { useMemo, useState } from 'react'
import { AlertTriangle, BookMarked, ChevronDown, ClipboardCheck, ExternalLink, Plus, Save, Trash2 } from 'lucide-react'
import type {
  ComplianceStatus,
  GapAction,
  GapActionPriority,
  GapActivityEvaluation,
  GapActivityStandard,
  GapStandard,
  RiskPriority,
} from '../../types/gap'
import {
  COMPLIANCE_STATUS_OPTIONS,
  GAP_ACTION_PRIORITY_OPTIONS,
  RISK_PRIORITY_OPTIONS,
  getComplianceStatusColor,
  getComplianceStatusLabel,
  getGapActionPriorityColor,
  getGapActionPriorityLabel,
  getGapActionStatusColor,
  getGapActionStatusLabel,
  getGapRiskPriorityColor,
  getGapRiskPriorityLabel,
} from '../../lib/labels'
import { cn } from '../../lib/ui'
import { Button } from '../ui/Button'
import {
  GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT,
  GAP_STANDARDS_PER_ACTIVITY_WARNING,
} from '../../lib/gapLimits'

export interface GapEvaluationDraft {
  current_state: string
  target_state_override: string
  gap_description: string
  compliance_status: ComplianceStatus
  risk_priority: RiskPriority
  notes: string
}

interface StandardDraftLink {
  standard_id: string
  specific_reference: string
}

interface StandardFormState {
  code: string
  name: string
  version: string
  issuing_body: string
  application_scope: string
  is_mandatory: boolean
  add_to_library: boolean
  description: string
  url: string
}

interface QuickActionDraft {
  description: string
  responsible: string
  priority: GapActionPriority
  planned_end_date: string
  notes: string
}

type StandardMandatoryFilter = 'all' | 'mandatory' | 'optional'

interface GapEvaluationRowProps {
  evaluation: GapActivityEvaluation
  draft: GapEvaluationDraft | undefined
  expanded: boolean
  changed: boolean
  saving: boolean
  actionCount: number
  actions: GapAction[]
  actionsLoaded: boolean
  standards: GapActivityStandard[]
  targetState: string | null
  assessmentOnly?: boolean
  standardsCatalog: GapStandard[]
  standardsEditorOpen: boolean
  standardDraftLinks: StandardDraftLink[]
  savingStandards: boolean
  showCreateStandardForm: boolean
  newStandardForm: StandardFormState
  savingNewStandard: boolean
  savingDisabled: boolean
  deleting?: boolean
  quickActionOpen: boolean
  quickActionDraft: QuickActionDraft
  savingQuickAction: boolean
  quickActionDisabled: boolean
  onToggle: () => void
  onManageStandards: () => void
  onCancelStandards: () => void
  onToggleStandard: (standardId: string) => void
  onUpdateStandardReference: (standardId: string, specificReference: string) => void
  onToggleCreateStandard: () => void
  onNewStandardFormChange: (patch: Partial<StandardFormState>) => void
  onDraftChange: (patch: Partial<GapEvaluationDraft>) => void
  onReset: () => void
  onSaveStandards: () => void
  onCreateStandard: () => void
  onSave: () => void
  onCreateAction?: () => void
  onManageActions?: () => void
  onCloseQuickAction?: () => void
  onQuickActionDraftChange?: (patch: Partial<QuickActionDraft>) => void
  onSaveQuickAction?: () => void
  onDelete?: () => void
}

const formatDateTime = (value: string | null) => {
  return value ? new Date(value).toLocaleString('it-IT') : 'N/D'
}

const formatDate = (value: string | null) => {
  return value ? new Date(value).toLocaleDateString('it-IT') : 'N/D'
}

const getStandardOriginLabel = (standard?: GapStandard | null) => (
  standard?.source_type === 'assessment_only' ? 'Solo assessment' : 'Libreria'
)

function NormativeReferences({ standards }: { standards: GapActivityStandard[] }) {
  return (
    <div>
      {standards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">
          Nessun riferimento normativo collegato all'Attività/Requisito.
        </p>
      ) : (
        <div className="grid gap-3">
          {standards.map((link) => {
            const standard = link.standard

            return (
              <div key={link.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                        {standard?.code || 'Norma'}
                      </span>
                      {standard?.is_mandatory && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                          <AlertTriangle className="h-3 w-3" />
                          Cogente
                        </span>
                      )}
                      {standard?.application_scope && (
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100">
                          {standard.application_scope}
                        </span>
                      )}
                      {standard?.version && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Versione {standard.version}
                        </span>
                      )}
                      {standard && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {getStandardOriginLabel(standard)}
                        </span>
                      )}
                      {standard?.issuing_body && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {standard.issuing_body}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {standard?.name || 'Norma non disponibile'}
                    </p>
                    {link.specific_reference && (
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Riferimento specifico: {link.specific_reference}
                      </p>
                    )}
                  </div>

                  {standard?.url && (
                    <a
                      href={standard.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-teal-700 transition hover:text-teal-800"
                    >
                      Apri link
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function GapEvaluationRow({
  evaluation,
  draft,
  expanded,
  changed,
  saving,
  actionCount,
  actions,
  actionsLoaded,
  standards,
  targetState,
  assessmentOnly = false,
  standardsCatalog,
  standardsEditorOpen,
  standardDraftLinks,
  savingStandards,
  showCreateStandardForm,
  newStandardForm,
  savingNewStandard,
  savingDisabled,
  deleting = false,
  quickActionOpen,
  quickActionDraft,
  savingQuickAction,
  quickActionDisabled,
  onToggle,
  onManageStandards,
  onCancelStandards,
  onToggleStandard,
  onUpdateStandardReference,
  onToggleCreateStandard,
  onNewStandardFormChange,
  onDraftChange,
  onReset,
  onSaveStandards,
  onCreateStandard,
  onSave,
  onCreateAction,
  onManageActions,
  onCloseQuickAction,
  onQuickActionDraftChange,
  onSaveQuickAction,
  onDelete,
}: GapEvaluationRowProps) {
  const [standardSearch, setStandardSearch] = useState('')
  const [standardMandatoryFilter, setStandardMandatoryFilter] = useState<StandardMandatoryFilter>('all')
  const [standardScopeFilter, setStandardScopeFilter] = useState('all')
  const hasGap = Boolean(evaluation.gap_description?.trim())
  const isFinding = evaluation.compliance_status === 'non_compliant' || evaluation.compliance_status === 'partially_compliant'
  const mandatoryStandardsCount = standards.filter((link) => link.standard?.is_mandatory).length
  const hasMandatoryStandards = mandatoryStandardsCount > 0
  const standardsLimitReached = standardDraftLinks.length >= GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT
  const standardsLimitWarning = standardDraftLinks.length >= GAP_STANDARDS_PER_ACTIVITY_WARNING
  const selectedStandardIds = useMemo(
    () => new Set(standardDraftLinks.map((link) => link.standard_id)),
    [standardDraftLinks],
  )
  const allKnownStandards = useMemo(() => {
    const byId = new Map<string, GapStandard>()
    standardsCatalog.forEach((standard) => byId.set(standard.id, standard))
    standards.forEach((link) => {
      if (link.standard) byId.set(link.standard.id, link.standard)
    })

    return Array.from(byId.values())
  }, [standards, standardsCatalog])
  const standardScopes = useMemo(() => {
    const scopes = standardsCatalog
      .map((standard) => standard.application_scope?.trim())
      .filter((scope): scope is string => Boolean(scope))

    return [...new Set(scopes)].sort((a, b) => a.localeCompare(b, 'it'))
  }, [standardsCatalog])
  const selectedStandards = useMemo(
    () => allKnownStandards.filter((standard) => selectedStandardIds.has(standard.id)),
    [allKnownStandards, selectedStandardIds],
  )
  const filteredStandards = useMemo(() => {
    const normalizedSearch = standardSearch.trim().toLowerCase()

    return standardsCatalog
      .filter((standard) => {
        const searchableText = [
          standard.code,
          standard.name,
          standard.issuing_body,
          standard.application_scope,
          standard.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)
        const matchesMandatory =
          standardMandatoryFilter === 'all' ||
          (standardMandatoryFilter === 'mandatory' && standard.is_mandatory) ||
          (standardMandatoryFilter === 'optional' && !standard.is_mandatory)
        const matchesScope =
          standardScopeFilter === 'all' || standard.application_scope === standardScopeFilter

        return matchesSearch && matchesMandatory && matchesScope && !selectedStandardIds.has(standard.id)
      })
      .sort((a, b) => a.code.localeCompare(b.code, 'it') || a.name.localeCompare(b.name, 'it'))
  }, [
    selectedStandardIds,
    standardMandatoryFilter,
    standardScopeFilter,
    standardSearch,
    standardsCatalog,
  ])

  const renderStandardSelectorCard = (standard: GapStandard) => {
    const selected = selectedStandardIds.has(standard.id)
    const draftLink = standardDraftLinks.find((link) => link.standard_id === standard.id)
    const disabledByLimit = !selected && standardsLimitReached

    return (
      <div key={standard.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleStandard(standard.id)}
            disabled={disabledByLimit}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">
              {standard.code} - {standard.name}
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              {standard.issuing_body || 'Ente non specificato'}
              {standard.version ? ` - Versione ${standard.version}` : ''}
            </span>
            <span className="mt-2 flex flex-wrap gap-1.5">
              {standard.is_mandatory && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-100">
                  Cogente
                </span>
              )}
              {standard.application_scope && (
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-100">
                  {standard.application_scope}
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {getStandardOriginLabel(standard)}
              </span>
            </span>
          </span>
        </label>

        {selected && (
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Riferimento specifico
            </span>
            <input
              type="text"
              value={draftLink?.specific_reference || ''}
              onChange={(event) => onUpdateStandardReference(standard.id, event.target.value)}
              className="clinical-input py-2 text-sm"
              placeholder="Es. paragrafo, requisito, procedura interna"
            />
          </label>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'overflow-hidden rounded-xl border bg-white shadow-sm transition',
      isFinding ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200',
      expanded && 'ring-1 ring-teal-200',
    )}>
      <button
        type="button"
        onClick={onToggle}
        className="group w-full cursor-pointer px-4 py-4 text-left transition hover:bg-teal-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
      >
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-[120px_minmax(150px,1.2fr)_minmax(150px,1fr)_120px_120px_100px_90px_150px_44px] 2xl:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {evaluation.activity_code_snapshot || 'Senza codice'}
              </span>
              {hasGap && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100">
                  Gap presente
                </span>
              )}
              {assessmentOnly && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  Solo assessment
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <span className="font-medium text-slate-700 2xl:hidden">Attività/Requisito: </span>
            <p className="inline break-words font-semibold text-slate-950 2xl:block">
              {evaluation.activity_name_snapshot || 'Attività/Requisito senza nome'}
            </p>
          </div>

          <div className="min-w-0 break-words text-sm text-slate-600">
            <span className="font-medium text-slate-700 2xl:hidden">Dominio/Sezione: </span>
            {evaluation.area_name_snapshot || 'N/D'}
          </div>

          <div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getComplianceStatusColor(evaluation.compliance_status)}`}>
              {getComplianceStatusLabel(evaluation.compliance_status)}
            </span>
          </div>

          <div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getGapRiskPriorityColor(evaluation.risk_priority)}`}>
              Priorità {getGapRiskPriorityLabel(evaluation.risk_priority)}
            </span>
          </div>

          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-700 2xl:hidden">Azioni: </span>
            {actionCount > 0 ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {actionCount === 1 ? '1 azione' : `${actionCount} azioni`}
              </span>
            ) : (
              <span className="text-slate-400">0 azioni</span>
            )}
          </div>

          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-700 2xl:hidden">Norme: </span>
            {standards.length > 0 ? (
              <span className="inline-flex flex-wrap gap-1.5">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  hasMandatoryStandards
                    ? 'bg-amber-50 text-amber-800 ring-amber-100'
                    : 'bg-slate-100 text-slate-600 ring-slate-200'
                }`}>
                  {standards.length === 1 ? '1 norma' : `${standards.length} norme`}
                  {hasMandatoryStandards ? ` · ${mandatoryStandardsCount} ${mandatoryStandardsCount === 1 ? 'cogente' : 'cogenti'}` : ''}
                </span>
              </span>
            ) : (
              <span className="text-slate-400">0 norme</span>
            )}
          </div>

          <div className="text-sm text-slate-500">
            <span className="font-medium text-slate-700 2xl:hidden">Ultima valutazione: </span>
            {formatDateTime(evaluation.evaluated_at)}
          </div>

          <div className="flex items-center justify-end lg:col-span-2 2xl:col-span-1">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-teal-100 bg-white text-teal-700 transition group-hover:bg-teal-50"
              title={expanded ? 'Chiudi valutazione' : 'Apri valutazione'}
              aria-hidden="true"
            >
              {expanded ? <ChevronDown className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </span>
          </div>
        </div>
      </button>

      {expanded && draft && (
        <div className="space-y-4 border-t border-slate-100 bg-white p-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              Snapshot libreria: codice, nome e Dominio/Sezione
            </span>
            <span className="rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-700 ring-1 ring-teal-100">
              Valutazione assessment-specifica: stato, gap, conformità e note
            </span>
          </div>

          <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-teal-700" />
                  <h4 className="text-sm font-semibold text-slate-900">Norme e riferimenti</h4>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Le norme collegate supportano la valutazione dell'Attività/Requisito.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                tone="neutral"
                size="sm"
                icon={<BookMarked className="h-4 w-4" />}
                onClick={onManageStandards}
              >
                Gestisci norme
              </Button>
            </div>

            <div className="mt-4">
              <NormativeReferences standards={standards} />
            </div>

            {standardsEditorOpen && (
              <div className="mt-4 rounded-lg border border-teal-100 bg-white p-4">
                <div className="space-y-4">
                  <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-3 text-sm text-sky-800">
                    Le norme create qui possono essere salvate nel Catalogo Norme personale se vuoi riutilizzarle nei futuri assessment.
                    Le norme sono collegate all'Attività/Requisito di libreria, non solo alla valutazione corrente.
                  </div>
                  <div className={`rounded-lg border p-3 text-sm ${
                    standardsLimitWarning
                      ? 'border-amber-100 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    Per mantenere prestazioni fluide, collega solo i riferimenti realmente essenziali. Limite operativo: {GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT} norme per Attività/Requisito.
                  </div>

                  {standardsCatalog.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                          Seleziona le norme applicabili
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          tone="neutral"
                          size="sm"
                          onClick={onToggleCreateStandard}
                          disabled={standardsLimitReached && !showCreateStandardForm}
                        >
                          {showCreateStandardForm ? 'Chiudi nuova norma' : 'Crea nuova norma'}
                        </Button>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_180px_180px]">
                        <input
                          type="text"
                          value={standardSearch}
                          onChange={(event) => setStandardSearch(event.target.value)}
                          className="clinical-input py-2 text-sm"
                          placeholder="Cerca per codice, nome, ente, ambito..."
                        />
                        <select
                          value={standardMandatoryFilter}
                          onChange={(event) => setStandardMandatoryFilter(event.target.value as StandardMandatoryFilter)}
                          className="clinical-input py-2 text-sm"
                        >
                          <option value="all">Tutte</option>
                          <option value="mandatory">Solo cogenti</option>
                          <option value="optional">Solo non cogenti</option>
                        </select>
                        <select
                          value={standardScopeFilter}
                          onChange={(event) => setStandardScopeFilter(event.target.value)}
                          className="clinical-input py-2 text-sm"
                        >
                          <option value="all">Tutti gli ambiti</option>
                          {standardScopes.map((scope) => (
                            <option key={scope} value={scope}>
                              {scope}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedStandards.length > 0 && (
                        <div className="space-y-2 rounded-lg border border-teal-100 bg-teal-50/50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                            Norme selezionate
                          </p>
                          {selectedStandards.map(renderStandardSelectorCard)}
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Risultati ricerca
                        </p>
                        {filteredStandards.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                            Nessuna norma corrisponde alla ricerca o ai filtri selezionati.
                          </div>
                        ) : (
                          filteredStandards.map(renderStandardSelectorCard)
                        )}
                      </div>
                    </div>
                  )}

                  {(standardsCatalog.length === 0 || showCreateStandardForm) && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-900">Crea nuova norma</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          La norma verrà collegata subito a questa Attività/Requisito. Puoi salvarla nel Catalogo Norme personale per riutilizzarla nei futuri assessment.
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-slate-600">Codice *</span>
                          <input
                            type="text"
                            value={newStandardForm.code}
                            onChange={(event) => onNewStandardFormChange({ code: event.target.value })}
                            className="clinical-input py-2 text-sm"
                            placeholder="Es. ISO-9001, LG-001"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-slate-600">Nome *</span>
                          <input
                            type="text"
                            value={newStandardForm.name}
                            onChange={(event) => onNewStandardFormChange({ name: event.target.value })}
                            className="clinical-input py-2 text-sm"
                            placeholder="Nome norma o riferimento"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-slate-600">Versione</span>
                          <input
                            type="text"
                            value={newStandardForm.version}
                            onChange={(event) => onNewStandardFormChange({ version: event.target.value })}
                            className="clinical-input py-2 text-sm"
                            placeholder="Es. 2026"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-slate-600">Ente emittente</span>
                          <input
                            type="text"
                            value={newStandardForm.issuing_body}
                            onChange={(event) => onNewStandardFormChange({ issuing_body: event.target.value })}
                            className="clinical-input py-2 text-sm"
                            placeholder="Es. Ministero, ISO, Regione"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-slate-600">Ambito di applicazione</span>
                          <input
                            type="text"
                            value={newStandardForm.application_scope}
                            onChange={(event) => onNewStandardFormChange({ application_scope: event.target.value })}
                            className="clinical-input py-2 text-sm"
                            placeholder="Es. Allestimento, Sperimentazioni"
                          />
                        </label>

                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <input
                            type="checkbox"
                            checked={newStandardForm.is_mandatory}
                            onChange={(event) => onNewStandardFormChange({ is_mandatory: event.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                          />
                          <span className="text-xs font-medium text-slate-700">Norma cogente</span>
                        </label>

                        <label className="flex items-start gap-2 rounded-lg border border-teal-100 bg-teal-50/70 px-3 py-2 md:col-span-2">
                          <input
                            type="checkbox"
                            checked={newStandardForm.add_to_library}
                            onChange={(event) => onNewStandardFormChange({ add_to_library: event.target.checked })}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                          />
                          <span>
                            <span className="block text-xs font-semibold text-teal-800">
                              Aggiungi al Catalogo Norme personale
                            </span>
                            <span className="mt-0.5 block text-xs leading-5 text-teal-700">
                              Se non selezionato, la norma resterà disponibile solo in questo assessment.
                            </span>
                          </span>
                        </label>

                        <label className="block md:col-span-2">
                          <span className="mb-1 block text-xs font-medium text-slate-600">Descrizione</span>
                          <textarea
                            value={newStandardForm.description}
                            onChange={(event) => onNewStandardFormChange({ description: event.target.value })}
                            className="clinical-input min-h-20 resize-y py-2 text-sm"
                            placeholder="Descrizione sintetica della norma."
                          />
                        </label>

                        <label className="block md:col-span-2">
                          <span className="mb-1 block text-xs font-medium text-slate-600">URL</span>
                          <input
                            type="url"
                            value={newStandardForm.url}
                            onChange={(event) => onNewStandardFormChange({ url: event.target.value })}
                            className="clinical-input py-2 text-sm"
                            placeholder="https://..."
                          />
                        </label>
                      </div>

                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        {standardsCatalog.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            tone="neutral"
                            size="sm"
                            onClick={onToggleCreateStandard}
                          >
                            Annulla nuova norma
                          </Button>
                        )}
                        <Button
                          type="button"
                      tone="success"
                      size="sm"
                      loading={savingNewStandard}
                      onClick={onCreateStandard}
                      disabled={standardsLimitReached}
                    >
                          Crea e collega norma
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      tone="neutral"
                      size="sm"
                      onClick={onCancelStandards}
                    >
                      Annulla
                    </Button>
                    <Button
                      type="button"
                      tone="success"
                      size="sm"
                      loading={savingStandards}
                      onClick={onSaveStandards}
                      disabled={standardDraftLinks.length > GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT}
                    >
                      Salva norme
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {isFinding && (
            <section className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-emerald-700" />
                    <h4 className="text-sm font-semibold text-slate-900">Azioni correttive</h4>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Crea o consulta le azioni collegate senza uscire dalla valutazione.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    tone="neutral"
                    size="sm"
                    onClick={onManageActions}
                  >
                    Gestisci nella tab Azioni
                  </Button>
                  <Button
                    type="button"
                    tone="success"
                    size="sm"
                    icon={<ClipboardCheck className="h-4 w-4" />}
                    onClick={onCreateAction}
                    disabled={quickActionDisabled}
                  >
                    {quickActionOpen ? 'Chiudi azione rapida' : 'Crea azione correttiva'}
                  </Button>
                </div>
              </div>

              {actionCount > 0 && (
                <div className="mt-3 space-y-2">
                  {actionsLoaded ? (
                    actions.slice(0, 3).map((action) => (
                      <div key={action.id} className="rounded-lg border border-emerald-100 bg-white p-3">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{action.description}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Responsabile/i: {action.responsible || 'Non assegnato'} - Scadenza: {formatDate(action.planned_end_date)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getGapActionStatusColor(action.status)}`}>
                              {getGapActionStatusLabel(action.status)}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getGapActionPriorityColor(action.priority)}`}>
                              {getGapActionPriorityLabel(action.priority)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg border border-emerald-100 bg-white p-3 text-xs text-slate-500">
                      {actionCount === 1 ? '1 azione collegata.' : `${actionCount} azioni collegate.`} Apri la tab Azioni per il dettaglio completo.
                    </p>
                  )}
                  {actionsLoaded && actions.length > 3 && (
                    <p className="text-xs font-medium text-slate-500">
                      +{actions.length - 3} altre azioni nella tab Azioni correttive.
                    </p>
                  )}
                </div>
              )}

              {quickActionOpen && (
                <div className="mt-3 rounded-lg border border-emerald-100 bg-white p-3">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-900">Nuova azione rapida</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Per stato avanzato, fase, avanzamento e verifica efficacia usa la tab Azioni correttive.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Descrizione/intervento *</span>
                      <textarea
                        value={quickActionDraft.description}
                        onChange={(event) => onQuickActionDraftChange?.({ description: event.target.value })}
                        className="clinical-input min-h-20 resize-y py-2 text-sm"
                        placeholder="Descrivi l'intervento correttivo essenziale."
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Responsabile/i</span>
                      <input
                        type="text"
                        value={quickActionDraft.responsible}
                        onChange={(event) => onQuickActionDraftChange?.({ responsible: event.target.value })}
                        className="clinical-input py-2 text-sm"
                        placeholder="Persona, team o funzione"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Priorità</span>
                      <select
                        value={quickActionDraft.priority}
                        onChange={(event) => onQuickActionDraftChange?.({ priority: event.target.value as GapActionPriority })}
                        className="clinical-input py-2 text-sm"
                      >
                        {GAP_ACTION_PRIORITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Scadenza</span>
                      <input
                        type="date"
                        value={quickActionDraft.planned_end_date}
                        onChange={(event) => onQuickActionDraftChange?.({ planned_end_date: event.target.value })}
                        className="clinical-input py-2 text-sm"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-1 block text-xs font-medium text-slate-600">Note</span>
                      <textarea
                        value={quickActionDraft.notes}
                        onChange={(event) => onQuickActionDraftChange?.({ notes: event.target.value })}
                        className="clinical-input min-h-16 resize-y py-2 text-sm"
                        placeholder="Note operative opzionali."
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      tone="neutral"
                      size="sm"
                      onClick={onCloseQuickAction}
                    >
                      Annulla
                    </Button>
                    <Button
                      type="button"
                      tone="success"
                      size="sm"
                      loading={savingQuickAction}
                      disabled={!quickActionDraft.description.trim() || savingQuickAction}
                      onClick={onSaveQuickAction}
                    >
                      Salva azione
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                Valutazione assessment-specifica
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Stato, gap, conformità e note
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Stato attuale</span>
              <textarea
                value={draft.current_state}
                onChange={(event) => onDraftChange({ current_state: event.target.value })}
                className="clinical-input min-h-24 resize-y"
                placeholder="Descrivi la situazione osservata durante la valutazione."
              />
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Target atteso di riferimento
              </span>
              <p className="min-h-16 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {targetState || 'Target atteso non definito nella libreria.'}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Il target appartiene all'Attività/Requisito di libreria ed è mostrato in sola lettura.
              </p>
              </div>
            </div>

            <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Gap rilevato rispetto al target</span>
            <textarea
              value={draft.gap_description}
              onChange={(event) => onDraftChange({ gap_description: event.target.value })}
              className="clinical-input min-h-24 resize-y"
              placeholder="Descrivi lo scostamento tra stato attuale e target atteso di riferimento."
            />
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Descrivi lo scostamento tra stato attuale e target atteso di riferimento.
            </span>
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Stato conformità</span>
              <select
                value={draft.compliance_status}
                onChange={(event) => onDraftChange({ compliance_status: event.target.value as ComplianceStatus })}
                className="clinical-input"
              >
                {COMPLIANCE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              </label>

              <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Priorità rischio</span>
              <select
                value={draft.risk_priority}
                onChange={(event) => onDraftChange({ risk_priority: event.target.value as RiskPriority })}
                className="clinical-input"
              >
                {RISK_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              </label>
            </div>

            <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Note</span>
            <textarea
              value={draft.notes}
              onChange={(event) => onDraftChange({ notes: event.target.value })}
              className="clinical-input min-h-20 resize-y"
              placeholder="Evidenze, riferimenti o note operative."
            />
            </label>
          </section>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              {changed ? (
                <span className="font-medium text-amber-700">Modifiche non salvate</span>
              ) : (
                <span>Valutazione allineata ai dati salvati.</span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
            {onDelete && (
              <Button
                type="button"
                variant="danger"
                tone="neutral"
                icon={<Trash2 className="h-4 w-4" />}
                loading={deleting}
                disabled={savingDisabled || saving || deleting}
                onClick={onDelete}
              >
                Rimuovi dall'assessment
              </Button>
            )}
            {changed && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Annulla modifiche
              </button>
            )}
            <Button
              type="button"
              tone="success"
              icon={<Save className="h-4 w-4" />}
              loading={saving}
              disabled={!changed || savingDisabled}
              onClick={onSave}
            >
              Salva valutazione
            </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
