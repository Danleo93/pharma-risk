import { BookMarked, ChevronDown, ClipboardCheck, ExternalLink, Plus, Save, Trash2 } from 'lucide-react'
import type {
  ComplianceStatus,
  GapActivityEvaluation,
  GapActivityStandard,
  GapStandard,
  RiskPriority,
} from '../../types/gap'
import {
  COMPLIANCE_STATUS_OPTIONS,
  RISK_PRIORITY_OPTIONS,
  getComplianceStatusColor,
  getComplianceStatusLabel,
  getGapRiskPriorityColor,
  getGapRiskPriorityLabel,
} from '../../lib/labels'
import { cn } from '../../lib/ui'
import { Button } from '../ui/Button'

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
  description: string
  url: string
}

interface GapEvaluationRowProps {
  evaluation: GapActivityEvaluation
  draft: GapEvaluationDraft | undefined
  expanded: boolean
  changed: boolean
  saving: boolean
  actionCount: number
  standards: GapActivityStandard[]
  targetState: string | null
  standardsCatalog: GapStandard[]
  standardsEditorOpen: boolean
  standardDraftLinks: StandardDraftLink[]
  savingStandards: boolean
  showCreateStandardForm: boolean
  newStandardForm: StandardFormState
  savingNewStandard: boolean
  savingDisabled: boolean
  deleting?: boolean
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
  onDelete?: () => void
}

const formatDateTime = (value: string | null) => {
  return value ? new Date(value).toLocaleString('it-IT') : 'N/D'
}

function NormativeReferences({ standards }: { standards: GapActivityStandard[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <BookMarked className="h-4 w-4 text-teal-700" />
        <h4 className="text-sm font-semibold text-slate-900">Riferimenti normativi</h4>
      </div>

      {standards.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nessun riferimento normativo collegato all'Attività/Requisito.
        </p>
      ) : (
        <div className="grid gap-3">
          {standards.map((link) => {
            const standard = link.standard

            return (
              <div key={link.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                        {standard?.code || 'Norma'}
                      </span>
                      {standard?.version && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Versione {standard.version}
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
  standards,
  targetState,
  standardsCatalog,
  standardsEditorOpen,
  standardDraftLinks,
  savingStandards,
  showCreateStandardForm,
  newStandardForm,
  savingNewStandard,
  savingDisabled,
  deleting = false,
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
  onDelete,
}: GapEvaluationRowProps) {
  const hasGap = Boolean(evaluation.gap_description?.trim())
  const isFinding = evaluation.compliance_status === 'non_compliant' || evaluation.compliance_status === 'partially_compliant'

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
        <div className="grid gap-3 xl:grid-cols-[120px_minmax(150px,1.2fr)_minmax(150px,1fr)_120px_120px_100px_90px_150px_44px] xl:items-center">
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
            </div>
          </div>

          <div className="min-w-0">
            <span className="font-medium text-slate-700 xl:hidden">Attività/Requisito: </span>
            <p className="inline font-semibold text-slate-950 xl:block">
              {evaluation.activity_name_snapshot || 'Attività/Requisito senza nome'}
            </p>
          </div>

          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-700 xl:hidden">Dominio/Sezione: </span>
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
            <span className="font-medium text-slate-700 xl:hidden">Azioni: </span>
            {actionCount > 0 ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {actionCount === 1 ? '1 azione' : `${actionCount} azioni`}
              </span>
            ) : (
              <span className="text-slate-400">0 azioni</span>
            )}
          </div>

          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-700 xl:hidden">Norme: </span>
            {standards.length > 0 ? (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                {standards.length === 1 ? '1 norma' : `${standards.length} norme`}
              </span>
            ) : (
              <span className="text-slate-400">0 norme</span>
            )}
          </div>

          <div className="text-sm text-slate-500">
            <span className="font-medium text-slate-700 xl:hidden">Ultima valutazione: </span>
            {formatDateTime(evaluation.evaluated_at)}
          </div>

          <div className="flex items-center justify-end">
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

          <NormativeReferences standards={standards} />

          <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-teal-700" />
                  <h4 className="text-sm font-semibold text-slate-900">Norme dell'Attività/Requisito</h4>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Le norme sono collegate all'Attività/Requisito di libreria e saranno riutilizzabili nei futuri assessment.
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

            {standardsEditorOpen && (
              <div className="mt-4 rounded-lg border border-teal-100 bg-white p-4">
                <div className="space-y-4">
                  <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-3 text-sm text-sky-800">
                    Le norme create qui saranno salvate nel Catalogo Norme personale e riutilizzabili nei futuri assessment.
                    Le norme sono collegate all'Attività/Requisito di libreria, non solo alla valutazione corrente.
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
                        >
                          {showCreateStandardForm ? 'Chiudi nuova norma' : 'Crea nuova norma'}
                        </Button>
                      </div>

                    {standardsCatalog.map((standard) => {
                      const selected = standardDraftLinks.some((link) => link.standard_id === standard.id)
                      const draftLink = standardDraftLinks.find((link) => link.standard_id === standard.id)

                      return (
                        <div key={standard.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => onToggleStandard(standard.id)}
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
                    })}
                    </div>
                  )}

                  {(standardsCatalog.length === 0 || showCreateStandardForm) && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-900">Crea nuova norma</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          La norma verrà salvata nel Catalogo Norme personale e collegata subito a questa Attività/Requisito.
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
                    >
                      Salva norme
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isFinding && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-emerald-700" />
                    <h4 className="text-sm font-semibold text-slate-900">Gap azionabile</h4>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Questa valutazione può generare un'azione correttiva collegata all'Attività/Requisito.
                  </p>
                </div>
                <Button
                  type="button"
                  tone="success"
                  size="sm"
                  icon={<ClipboardCheck className="h-4 w-4" />}
                  onClick={onCreateAction}
                >
                  Crea azione correttiva
                </Button>
              </div>
            </div>
          )}

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

          <label className="block">
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

          <div className="grid gap-4 md:grid-cols-2">
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

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Note</span>
            <textarea
              value={draft.notes}
              onChange={(event) => onDraftChange({ notes: event.target.value })}
              className="clinical-input min-h-20 resize-y"
              placeholder="Evidenze, riferimenti o note operative."
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
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
      )}
    </div>
  )
}
