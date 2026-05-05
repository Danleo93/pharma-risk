import { useRef, type RefObject } from 'react'
import { CalendarDays, Download } from 'lucide-react'
import { isGapActionOverdue } from '../../lib/gapScoring'
import { exportElementToPng } from '../../lib/exportImage'
import {
  getGapActionPriorityColor,
  getGapActionPriorityLabel,
  getGapActionStatusColor,
  getGapActionStatusLabel,
} from '../../lib/labels'
import type { GapAction, GapActivityEvaluation } from '../../types/gap'
import { EmptyState } from '../ui/EmptyState'

interface GapActionGanttProps {
  actions: GapAction[]
  evaluations: GapActivityEvaluation[]
  captureRef?: RefObject<HTMLDivElement | null>
}

const dayMs = 24 * 60 * 60 * 1000

const toDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const dateDiff = (start: Date, end: Date) => {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / dayMs))
}

const formatDate = (value: string | null) => {
  return value ? new Date(value).toLocaleDateString('it-IT') : 'N/D'
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value))
}

const getPriorityBarClasses = (priority: string | null | undefined) => {
  switch (priority) {
    case 'critical':
      return {
        track: 'bg-red-200/90',
        progress: 'bg-red-700',
      }
    case 'high':
      return {
        track: 'bg-orange-200/90',
        progress: 'bg-orange-600',
      }
    case 'medium':
      return {
        track: 'bg-yellow-200/90',
        progress: 'bg-yellow-500',
      }
    case 'low':
      return {
        track: 'bg-emerald-200/90',
        progress: 'bg-emerald-600',
      }
    default:
      return {
        track: 'bg-slate-300/80',
        progress: 'bg-slate-600',
      }
  }
}

export function GapActionGantt({ actions, evaluations, captureRef }: GapActionGanttProps) {
  const exportRef = useRef<HTMLDivElement | null>(null)
  const ganttRef = captureRef || exportRef
  const scheduledActions = actions
    .filter((action) => action.planned_start_date && action.planned_end_date)
    .sort((a, b) => {
      const startDiff = (a.planned_start_date || '').localeCompare(b.planned_start_date || '')
      if (startDiff !== 0) return startDiff

      const endDiff = (a.planned_end_date || '').localeCompare(b.planned_end_date || '')
      if (endDiff !== 0) return endDiff

      return a.description.localeCompare(b.description)
    })
  const evaluationById = evaluations.reduce<Record<string, GapActivityEvaluation>>((acc, evaluation) => ({
    ...acc,
    [evaluation.id]: evaluation,
  }), {})

  if (scheduledActions.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="h-6 w-6" />}
        title="Nessuna azione pianificata nel Diagramma di GANTT"
        description="Compila data inizio e fine pianificata per visualizzare le azioni nel Diagramma di GANTT."
      />
    )
  }

  const dates = scheduledActions.flatMap((action) => [
    action.planned_start_date,
    action.planned_end_date,
    action.verification_due_date,
  ]).filter(Boolean) as string[]
  const minDate = dates.reduce((min, date) => (
    toDate(date) < toDate(min) ? date : min
  ), dates[0])
  const maxDate = dates.reduce((max, date) => (
    toDate(date) > toDate(max) ? date : max
  ), dates[0])
  const timelineStart = toDate(minDate)
  const timelineEnd = toDate(maxDate)
  const totalDays = Math.max(1, dateDiff(timelineStart, timelineEnd) + 1)
  const groupedActions = scheduledActions.reduce<Record<string, GapAction[]>>((acc, action) => {
    const evaluation = evaluationById[action.evaluation_id]
    const groupKey = evaluation
      ? `${evaluation.activity_code_snapshot || 'N/D'} - ${evaluation.activity_name_snapshot || 'Attività/Requisito'}`
      : 'Attività/Requisito non disponibile'

    return {
      ...acc,
      [groupKey]: [...(acc[groupKey] || []), action],
    }
  }, {})
  const groupedActionEntries = Object.entries(groupedActions)
    .map(([groupName, groupActions]) => ({
      groupName,
      groupActions: [...groupActions].sort((a, b) => {
        const startDiff = (a.planned_start_date || '').localeCompare(b.planned_start_date || '')
        if (startDiff !== 0) return startDiff

        const endDiff = (a.planned_end_date || '').localeCompare(b.planned_end_date || '')
        if (endDiff !== 0) return endDiff

        return a.description.localeCompare(b.description)
      }),
    }))
    .sort((a, b) => {
      const aFirst = a.groupActions[0]
      const bFirst = b.groupActions[0]
      const startDiff = (aFirst?.planned_start_date || '').localeCompare(bFirst?.planned_start_date || '')
      if (startDiff !== 0) return startDiff

      return a.groupName.localeCompare(b.groupName)
    })

  const exportGantt = async () => {
    try {
      await exportElementToPng(ganttRef.current, 'gap_diagramma_gantt_azioni')
    } catch (error) {
      console.error('Errore esportazione PNG Diagramma di GANTT Gap:', error)
      alert("Errore durante l'esportazione PNG del Diagramma di GANTT.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Diagramma di GANTT azioni correttive</h3>
            <p className="text-xs text-slate-500">
              Vista read-only basata sulle date pianificate. Nessuna modifica date da questa vista.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-medium text-slate-500">
              {formatDate(minDate)} - {formatDate(maxDate)}
            </div>
            <div className="hidden flex-wrap items-center gap-2 text-xs text-slate-500 lg:flex">
              <span className="font-medium text-slate-600">Priorità:</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Bassa</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Media</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />Alta</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-600" />Critica</span>
            </div>
            <button
              type="button"
              onClick={exportGantt}
              className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
            >
              <Download className="h-4 w-4" />
              PNG
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div ref={ganttRef} className="min-w-[920px] bg-white p-4">
          <div className="mb-4 grid grid-cols-[260px_1fr] gap-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Attività/Requisito</span>
            <div className="flex justify-between">
              <span>{formatDate(minDate)}</span>
              <span>{formatDate(maxDate)}</span>
            </div>
          </div>

          <div className="space-y-6">
            {groupedActionEntries.map(({ groupName, groupActions }) => (
              <div key={groupName} className="grid grid-cols-[260px_1fr] gap-4">
                <div className="text-sm font-medium leading-6 text-slate-800">
                  {groupName}
                </div>
                <div className="space-y-3">
                  {groupActions.map((action) => {
                    const actionStart = toDate(action.planned_start_date as string)
                    const actionEnd = toDate(action.planned_end_date as string)
                    const offset = clamp((dateDiff(timelineStart, actionStart) / totalDays) * 100, 0, 100)
                    const width = clamp(((dateDiff(actionStart, actionEnd) + 1) / totalDays) * 100, 2, 100 - offset)
                    const overdue = isGapActionOverdue(action)
                    const priorityBarClasses = getPriorityBarClasses(action.priority)
                    const milestoneOffset = action.verification_due_date
                      ? clamp((dateDiff(timelineStart, toDate(action.verification_due_date)) / totalDays) * 100, 0, 100)
                      : null

                    return (
                      <div key={action.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">{action.description}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(action.planned_start_date)} - {formatDate(action.planned_end_date)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getGapActionStatusColor(action.status)}`}>
                              {getGapActionStatusLabel(action.status)}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getGapActionPriorityColor(action.priority)}`}>
                              {getGapActionPriorityLabel(action.priority)}
                            </span>
                            {overdue && (
                              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                Scaduta
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="relative h-9 rounded-full bg-white ring-1 ring-slate-200">
                          <div
                            className={`absolute top-1/2 h-4 -translate-y-1/2 rounded-full ${priorityBarClasses.track}`}
                            style={{ left: `${offset}%`, width: `${width}%` }}
                          >
                            <div
                              className={`h-full rounded-full ${priorityBarClasses.progress}`}
                              style={{ width: `${clamp(action.progress || 0, 0, 100)}%` }}
                            />
                          </div>
                          {milestoneOffset !== null && (
                            <div
                              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm border border-amber-300 bg-amber-100"
                              style={{ left: `${milestoneOffset}%` }}
                              title={`Verifica: ${formatDate(action.verification_due_date)}`}
                            />
                          )}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Avanzamento {action.progress}%{action.verification_due_date ? ` - milestone verifica ${formatDate(action.verification_due_date)}` : ''}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

