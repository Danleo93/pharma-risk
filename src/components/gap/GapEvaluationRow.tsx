import { BookMarked, ChevronDown, ChevronRight, ExternalLink, Save } from 'lucide-react'
import type {
  ComplianceStatus,
  GapActivityEvaluation,
  GapActivityStandard,
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

interface GapEvaluationRowProps {
  evaluation: GapActivityEvaluation
  draft: GapEvaluationDraft | undefined
  expanded: boolean
  changed: boolean
  saving: boolean
  actionCount: number
  standards: GapActivityStandard[]
  savingDisabled: boolean
  onToggle: () => void
  onDraftChange: (patch: Partial<GapEvaluationDraft>) => void
  onReset: () => void
  onSave: () => void
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
          Nessun riferimento normativo collegato all'Attivita/Requisito.
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
  savingDisabled,
  onToggle,
  onDraftChange,
  onReset,
  onSave,
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
        className="w-full cursor-pointer px-4 py-4 text-left transition hover:bg-teal-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
      >
        <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr_1fr_0.8fr_0.8fr_0.7fr_0.7fr_1fr_auto] xl:items-center">
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
            <span className="font-medium text-slate-700 xl:hidden">Attivita/Requisito: </span>
            <p className="inline font-semibold text-slate-950 xl:block">
              {evaluation.activity_name_snapshot || 'Attivita/Requisito senza nome'}
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
              Priorita {getGapRiskPriorityLabel(evaluation.risk_priority)}
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

          <div className="flex items-center justify-end gap-2 text-teal-700">
            <span className="whitespace-nowrap text-xs font-semibold">
              {expanded ? 'Chiudi' : 'Apri valutazione'}
            </span>
            {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
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
              Valutazione assessment-specifica: stato, gap, conformita e note
            </span>
          </div>

          <NormativeReferences standards={standards} />

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

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Target specifico assessment
              </span>
              <textarea
                value={draft.target_state_override}
                onChange={(event) => onDraftChange({ target_state_override: event.target.value })}
                className="clinical-input min-h-24 resize-y"
                placeholder="Eventuale target adattato al contesto dell assessment."
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Gap rilevato</span>
            <textarea
              value={draft.gap_description}
              onChange={(event) => onDraftChange({ gap_description: event.target.value })}
              className="clinical-input min-h-24 resize-y"
              placeholder="Descrivi lo scostamento tra stato attuale e target."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Stato conformita</span>
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
              <span className="mb-1 block text-sm font-medium text-slate-700">Priorita rischio</span>
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
