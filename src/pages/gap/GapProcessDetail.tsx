import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, BookMarked, ChevronDown, ChevronRight, ClipboardList, Edit3, Info, Layers3, Map, Plus, Trash2, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  createGapArea,
  createGapActivity,
  createGapStandard,
  deleteGapArea,
  deleteGapActivity,
  getGapActivityCount,
  getGapActivityStandardsForActivities,
  getGapActivitiesByAreas,
  getGapAreasByProcess,
  getGapProcessById,
  getGapStandards,
  replaceGapActivityStandards,
  updateGapArea,
  updateGapActivity,
  type GapActivityStandardLinkInput,
  type GapActivityInput,
  type GapAreaInput,
  type GapStandardInput,
} from '../../services/gapService'
import type { GapActivity, GapActivityStandard, GapArea, GapProcess, GapStandard } from '../../types/gap'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import {
  GAP_LIBRARY_ACTIVITY_HARD_LIMIT,
  GAP_LIBRARY_ACTIVITY_WARNING,
  GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT,
  GAP_STANDARDS_PER_ACTIVITY_WARNING,
  isGapHardLimitReached,
  isGapWarningLimitReached,
} from '../../lib/gapLimits'

interface AreaFormState {
  code: string
  name: string
  operational_context: string
  description: string
  order_index: string
}

const emptyForm: AreaFormState = {
  code: '',
  name: '',
  operational_context: '',
  description: '',
  order_index: '0',
}

interface ActivityFormState {
  code: string
  name: string
  description: string
  operator: string
  target_state: string
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
  description: string
  url: string
}

type StandardMandatoryFilter = 'all' | 'mandatory' | 'optional'

const emptyActivityForm: ActivityFormState = {
  code: '',
  name: '',
  description: '',
  operator: '',
  target_state: '',
}

const emptyStandardForm: StandardFormState = {
  code: '',
  name: '',
  version: '',
  issuing_body: '',
  application_scope: '',
  is_mandatory: false,
  description: '',
  url: '',
}

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const parseAreaDescription = (description: string | null) => {
  if (!description) {
    return {
      operational_context: '',
      description: '',
    }
  }

  const contextMatch = description.match(/^Contesto operativo:\s*(.*?)(?:\n\n|$)/s)

  if (!contextMatch) {
    return {
      operational_context: '',
      description,
    }
  }

  const operationalContext = contextMatch[1].trim()
  const remaining = description
    .slice(contextMatch[0].length)
    .replace(/^Descrizione:\s*/s, '')
    .trim()

  return {
    operational_context: operationalContext,
    description: remaining,
  }
}

const formatAreaDescription = (form: AreaFormState) => {
  const operationalContext = form.operational_context.trim()
  const description = form.description.trim()

  if (operationalContext && description) {
    return `Contesto operativo: ${operationalContext}\n\nDescrizione:\n${description}`
  }

  if (operationalContext) {
    return `Contesto operativo: ${operationalContext}`
  }

  return description
}

const buildPayload = (form: AreaFormState): GapAreaInput => ({
  code: form.code.trim(),
  name: form.name.trim(),
  description: toNullable(formatAreaDescription(form)),
  order_index: Number(form.order_index) || 0,
})

const buildActivityPayload = (form: ActivityFormState, orderIndex: number): GapActivityInput => ({
  code: form.code.trim(),
  name: form.name.trim(),
  description: toNullable(form.description),
  operator: toNullable(form.operator),
  target_state: toNullable(form.target_state),
  order_index: orderIndex,
})

const sortActivities = (activities: GapActivity[]) => {
  return [...activities].sort((a, b) => {
    if (a.order_index !== b.order_index) return a.order_index - b.order_index
    return a.name.localeCompare(b.name, 'it')
  })
}

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function GapProcessDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [process, setProcess] = useState<GapProcess | null>(null)
  const [areas, setAreas] = useState<GapArea[]>([])
  const [activitiesByArea, setActivitiesByArea] = useState<Record<string, GapActivity[]>>({})
  const [standards, setStandards] = useState<GapStandard[]>([])
  const [activityStandardsByActivity, setActivityStandardsByActivity] = useState<Record<string, GapActivityStandard[]>>({})
  const [libraryActivityCount, setLibraryActivityCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingStandards, setSavingStandards] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAreaForm, setShowAreaForm] = useState(false)
  const [editingArea, setEditingArea] = useState<GapArea | null>(null)
  const [form, setForm] = useState<AreaFormState>(emptyForm)
  const [showActivityFormForArea, setShowActivityFormForArea] = useState<string | null>(null)
  const [editingActivity, setEditingActivity] = useState<GapActivity | null>(null)
  const [activityForm, setActivityForm] = useState<ActivityFormState>(emptyActivityForm)
  const [editingStandardsForActivity, setEditingStandardsForActivity] = useState<string | null>(null)
  const [standardDraftLinks, setStandardDraftLinks] = useState<StandardDraftLink[]>([])
  const [showCreateStandardForm, setShowCreateStandardForm] = useState(false)
  const [newStandardForm, setNewStandardForm] = useState<StandardFormState>(emptyStandardForm)
  const [savingNewStandard, setSavingNewStandard] = useState(false)
  const [standardSearch, setStandardSearch] = useState('')
  const [standardMandatoryFilter, setStandardMandatoryFilter] = useState<StandardMandatoryFilter>('all')
  const [standardScopeFilter, setStandardScopeFilter] = useState('all')
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id || !id) return

    const fetchProcessData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [processData, areasData, standardsData, activityCount] = await Promise.all([
          getGapProcessById(id, user.id),
          getGapAreasByProcess(id, user.id),
          getGapStandards(user.id),
          getGapActivityCount(user.id),
        ])
        const areaIds = areasData.map((area) => area.id)
        const batchedActivities = await getGapActivitiesByAreas(areaIds, user.id)
        const batchedActivitiesByArea = batchedActivities.reduce<Record<string, GapActivity[]>>((acc, activity) => {
          if (!acc[activity.area_id]) {
            acc[activity.area_id] = []
          }
          acc[activity.area_id].push(activity)
          return acc
        }, {})
        const activityEntries = areasData.map((area) => [
          area.id,
          sortActivities(batchedActivitiesByArea[area.id] || []),
        ] as const)
        const activities = activityEntries.flatMap(([, areaActivities]) => areaActivities)
        const activityStandardLinks = await getGapActivityStandardsForActivities(
          activities.map((activity) => activity.id),
          user.id,
        )
        const standardLinksByActivity = activityStandardLinks.reduce<Record<string, GapActivityStandard[]>>((acc, link) => {
          if (!acc[link.activity_id]) {
            acc[link.activity_id] = []
          }
          acc[link.activity_id].push(link)
          return acc
        }, {})
        const activityStandardEntries = activities.map((activity) => [
          activity.id,
          standardLinksByActivity[activity.id] || [],
        ] as const)

        setProcess(processData)
        setAreas(areasData)
        setStandards(standardsData)
        setLibraryActivityCount(activityCount)
        setActivitiesByArea(Object.fromEntries(activityEntries))
        setActivityStandardsByActivity(Object.fromEntries(activityStandardEntries))
      } catch (fetchError) {
        console.error('Errore caricamento dettaglio processo Gap:', fetchError)
        setError('Impossibile caricare il dettaglio del processo.')
      } finally {
        setLoading(false)
      }
    }

    fetchProcessData()
  }, [id, user?.id])

  const standardScopes = useMemo(() => {
    const scopes = standards
      .map((standard) => standard.application_scope?.trim())
      .filter((scope): scope is string => Boolean(scope))

    return [...new Set(scopes)].sort((a, b) => a.localeCompare(b, 'it'))
  }, [standards])
  const selectedStandardIds = useMemo(
    () => new Set(standardDraftLinks.map((link) => link.standard_id)),
    [standardDraftLinks],
  )
  const selectedStandards = useMemo(
    () => standards.filter((standard) => selectedStandardIds.has(standard.id)),
    [selectedStandardIds, standards],
  )
  const libraryActivityWarning = isGapWarningLimitReached(
    libraryActivityCount,
    GAP_LIBRARY_ACTIVITY_WARNING,
  )
  const libraryActivityBlocked = isGapHardLimitReached(
    libraryActivityCount,
    GAP_LIBRARY_ACTIVITY_HARD_LIMIT,
  )
  const standardsLimitReached = standardDraftLinks.length >= GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT
  const standardsLimitWarning = standardDraftLinks.length >= GAP_STANDARDS_PER_ACTIVITY_WARNING
  const filteredStandards = useMemo(() => {
    const normalizedSearch = standardSearch.trim().toLowerCase()

    return standards
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
    standards,
  ])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingArea(null)
    setShowAreaForm(false)
    setError(null)
  }

  const startCreate = () => {
    setForm(emptyForm)
    setEditingArea(null)
    setShowAreaForm(true)
    setError(null)
  }

  const resetActivityForm = () => {
    setActivityForm(emptyActivityForm)
    setEditingActivity(null)
    setShowActivityFormForArea(null)
    setError(null)
  }

  const resetStandardEditor = () => {
    setEditingStandardsForActivity(null)
    setStandardDraftLinks([])
    setShowCreateStandardForm(false)
    setNewStandardForm(emptyStandardForm)
    setStandardSearch('')
    setStandardMandatoryFilter('all')
    setStandardScopeFilter('all')
    setError(null)
  }

  const startEdit = (area: GapArea) => {
    const parsedDescription = parseAreaDescription(area.description)

    setForm({
      code: area.code,
      name: area.name,
      operational_context: parsedDescription.operational_context,
      description: parsedDescription.description,
      order_index: String(area.order_index ?? 0),
    })
    setEditingArea(area)
    setShowAreaForm(true)
    setError(null)
  }

  const startCreateActivity = (areaId: string) => {
    setExpandedAreaId(areaId)
    setActivityForm(emptyActivityForm)
    setEditingActivity(null)
    setShowActivityFormForArea(areaId)
    setError(null)
  }

  const startEditActivity = (activity: GapActivity) => {
    resetStandardEditor()
    setActivityForm({
      code: activity.code,
      name: activity.name,
      description: activity.description || '',
      operator: activity.operator || '',
      target_state: activity.target_state || '',
    })
    setEditingActivity(activity)
    setExpandedAreaId(activity.area_id)
    setShowActivityFormForArea(activity.area_id)
    setError(null)
  }

  const getActivityMaxSuffix = (areaId: string) => {
    const area = areas.find((item) => item.id === areaId)
    const areaCode = area?.code.trim()

    if (!areaCode) return 0

    const activities = activitiesByArea[areaId] || []
    const codePattern = new RegExp(`^${escapeRegExp(areaCode)}-(\\d+)$`)
    return activities.reduce((max, activity) => {
      const match = activity.code.match(codePattern)
      if (!match) return max

      const suffix = Number(match[1])
      return Number.isFinite(suffix) ? Math.max(max, suffix) : max
    }, 0)
  }

  const getNextActivityCode = (areaId: string) => {
    const area = areas.find((item) => item.id === areaId)
    const areaCode = area?.code.trim()
    const maxSuffix = getActivityMaxSuffix(areaId)

    if (!areaCode || maxSuffix >= 99) return ''

    return `${areaCode}-${String(maxSuffix + 1).padStart(2, '0')}`
  }

  const startEditStandards = (activity: GapActivity) => {
    const existingLinks = activityStandardsByActivity[activity.id] || []

    setExpandedAreaId(activity.area_id)
    setEditingStandardsForActivity(activity.id)
    setStandardDraftLinks(
      existingLinks.map((link) => ({
        standard_id: link.standard_id,
        specific_reference: link.specific_reference || '',
      })),
    )
    setError(null)
  }

  const saveArea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.id || !id) return

    if (!form.code.trim() || !form.name.trim()) {
      setError('Codice e nome Dominio/Sezione sono obbligatori.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = buildPayload(form)

      if (editingArea) {
        const updatedArea = await updateGapArea(editingArea.id, user.id, payload)
        setAreas((current) =>
          current.map((area) => area.id === updatedArea.id ? updatedArea : area),
        )
      } else {
        const createdArea = await createGapArea(user.id, id, payload)
        setAreas((current) => [...current, createdArea].sort((a, b) => {
          if (a.order_index !== b.order_index) return a.order_index - b.order_index
          return a.name.localeCompare(b.name, 'it')
        }))
        setExpandedAreaId(createdArea.id)
      }

      resetForm()
    } catch (saveError) {
      console.error('Errore salvataggio area Gap:', saveError)
      setError('Impossibile salvare il Dominio/Sezione. Verifica codice e dati inseriti.')
    } finally {
      setSaving(false)
    }
  }

  const removeArea = async (area: GapArea) => {
    if (!user?.id) return
    if (!confirm(`Eliminare il Dominio/Sezione "${area.code} - ${area.name}"? Verranno eliminati anche eventuali Attività/Requisiti collegati se non vincolati da assessment.`)) return

    setError(null)

    try {
      await deleteGapArea(area.id, user.id)
      setAreas((current) => current.filter((item) => item.id !== area.id))
      setActivitiesByArea((current) => {
        const next = { ...current }
        delete next[area.id]
        return next
      })
      setExpandedAreaId((current) => current === area.id ? null : current)
    } catch (deleteError) {
      console.error('Errore eliminazione area Gap:', deleteError)
      setError('Impossibile eliminare il Dominio/Sezione. Potrebbe contenere Attività/Requisiti già collegati ad assessment o dati operativi.')
    }
  }

  const saveActivity = async (areaId: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.id) return

    const maxSuffix = getActivityMaxSuffix(areaId)
    const activityCode = editingActivity ? editingActivity.code : getNextActivityCode(areaId)

    if (!editingActivity && maxSuffix >= 99) {
      setError('Non si possono inserire più di 99 Attività/Requisiti per Dominio/Sezione. Procedi con la creazione di un nuovo Dominio/Sezione.')
      return
    }

    if (!editingActivity && libraryActivityBlocked) {
      setError(
        `La libreria contiene giÃ  ${libraryActivityCount} AttivitÃ /Requisiti. Per mantenere prestazioni fluide, crea un nuovo perimetro di libreria o riorganizza gli elementi prima di aggiungerne altri.`,
      )
      return
    }

    if (!activityCode || !activityForm.name.trim()) {
      setError('Codice e nome Attività/Requisito sono obbligatori.')
      return
    }

    if (!activityForm.target_state.trim()) {
      setError("Il target atteso di riferimento è obbligatorio per salvare un'Attività/Requisito.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const currentActivities = activitiesByArea[areaId] || []
      const nextOrderIndex = currentActivities.reduce(
        (max, activity) => Math.max(max, activity.order_index),
        -1,
      ) + 1
      const payload = buildActivityPayload(
        {
          ...activityForm,
          code: activityCode,
        },
        editingActivity ? editingActivity.order_index : nextOrderIndex,
      )

      if (editingActivity) {
        const updatedActivity = await updateGapActivity(editingActivity.id, user.id, payload)
        setActivitiesByArea((current) => ({
          ...current,
          [updatedActivity.area_id]: sortActivities(
            (current[updatedActivity.area_id] || []).map((activity) =>
              activity.id === updatedActivity.id ? updatedActivity : activity,
            ),
          ),
        }))
      } else {
        const createdActivity = await createGapActivity(user.id, areaId, payload)
        setLibraryActivityCount((current) => current + 1)
        setActivitiesByArea((current) => ({
          ...current,
          [areaId]: sortActivities([...(current[areaId] || []), createdActivity]),
        }))
        setActivityStandardsByActivity((current) => ({
          ...current,
          [createdActivity.id]: [],
        }))
      }

      resetActivityForm()
    } catch (saveError) {
      console.error('Errore salvataggio attività Gap:', saveError)
      setError("Impossibile salvare l'Attività/Requisito. Verifica codice e dati inseriti.")
    } finally {
      setSaving(false)
    }
  }

  const removeActivity = async (activity: GapActivity) => {
    if (!user?.id) return
    if (!confirm(`Eliminare l'Attività/Requisito "${activity.code} - ${activity.name}"?`)) return

    setError(null)

    try {
      await deleteGapActivity(activity.id, user.id)
      setLibraryActivityCount((current) => Math.max(0, current - 1))
      setActivitiesByArea((current) => ({
        ...current,
        [activity.area_id]: (current[activity.area_id] || []).filter((item) => item.id !== activity.id),
      }))
      setActivityStandardsByActivity((current) => {
        const next = { ...current }
        delete next[activity.id]
        return next
      })
      if (editingStandardsForActivity === activity.id) {
        resetStandardEditor()
      }
    } catch (deleteError) {
      console.error('Errore eliminazione attività Gap:', deleteError)
      setError("Impossibile eliminare l'Attività/Requisito. Potrebbe essere già collegata ad assessment o dati operativi.")
    }
  }

  const toggleStandardDraftLink = (standardId: string) => {
    setStandardDraftLinks((current) => {
      if (current.some((link) => link.standard_id === standardId)) {
        return current.filter((link) => link.standard_id !== standardId)
      }

      if (current.length >= GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT) {
        setError(
          `Per mantenere prestazioni fluide, collega al massimo ${GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT} norme essenziali a una singola AttivitÃ /Requisito.`,
        )
        return current
      }

      return [...current, { standard_id: standardId, specific_reference: '' }]
    })
  }

  const updateStandardDraftReference = (standardId: string, specificReference: string) => {
    setStandardDraftLinks((current) =>
      current.map((link) =>
        link.standard_id === standardId
          ? { ...link, specific_reference: specificReference }
          : link,
      ),
    )
  }

  const renderStandardSelectorCard = (standard: GapStandard) => {
    const selected = selectedStandardIds.has(standard.id)
    const draftLink = standardDraftLinks.find((link) => link.standard_id === standard.id)
    const disabledByLimit = !selected && standardsLimitReached

    return (
      <div
        key={standard.id}
        className="rounded-lg border border-slate-200 bg-white p-3"
      >
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => toggleStandardDraftLink(standard.id)}
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
              onChange={(event) =>
                updateStandardDraftReference(standard.id, event.target.value)
              }
              className="clinical-input py-2 text-sm"
              placeholder="Es. paragrafo, requisito, procedura interna"
            />
          </label>
        )}
      </div>
    )
  }

  const saveActivityStandards = async (activityId: string) => {
    if (!user?.id) return

    if (standardDraftLinks.length > GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT) {
      setError(
        `Per mantenere prestazioni fluide, collega al massimo ${GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT} norme essenziali a una singola AttivitÃ /Requisito.`,
      )
      return
    }

    setSavingStandards(true)
    setError(null)

    try {
      const payload: GapActivityStandardLinkInput[] = standardDraftLinks.map((link) => ({
        standard_id: link.standard_id,
        specific_reference: toNullable(link.specific_reference),
      }))
      const updatedLinks = await replaceGapActivityStandards(activityId, user.id, payload)

      setActivityStandardsByActivity((current) => ({
        ...current,
        [activityId]: updatedLinks,
      }))
      resetStandardEditor()
    } catch (saveError) {
      console.error('Errore salvataggio norme Attività/Requisito:', saveError)
      setError("Impossibile salvare le norme collegate all'Attività/Requisito.")
    } finally {
      setSavingStandards(false)
    }
  }

  const createStandardAndLinkToActivity = async (activityId: string) => {
    if (!user?.id) return

    if (standardDraftLinks.length >= GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT) {
      setError(
        `Per mantenere prestazioni fluide, collega al massimo ${GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT} norme essenziali a una singola AttivitÃ /Requisito.`,
      )
      return
    }

    const code = newStandardForm.code.trim()
    const name = newStandardForm.name.trim()

    if (!code || !name) {
      setError('Codice e nome della norma sono obbligatori.')
      return
    }

    setSavingNewStandard(true)
    setError(null)

    try {
      const payload: GapStandardInput = {
        code,
        name,
        version: toNullable(newStandardForm.version),
        issuing_body: toNullable(newStandardForm.issuing_body),
        application_scope: toNullable(newStandardForm.application_scope),
        is_mandatory: newStandardForm.is_mandatory,
        description: toNullable(newStandardForm.description),
        url: toNullable(newStandardForm.url),
      }
      const createdStandard = await createGapStandard(user.id, payload)
      const nextDraftLinks = [
        ...standardDraftLinks.filter((link) => link.standard_id !== createdStandard.id),
        { standard_id: createdStandard.id, specific_reference: '' },
      ]
      const linkPayload: GapActivityStandardLinkInput[] = nextDraftLinks.map((link) => ({
        standard_id: link.standard_id,
        specific_reference: toNullable(link.specific_reference),
      }))
      const updatedLinks = await replaceGapActivityStandards(activityId, user.id, linkPayload)

      setStandards((current) => [createdStandard, ...current])
      setActivityStandardsByActivity((current) => ({
        ...current,
        [activityId]: updatedLinks,
      }))
      resetStandardEditor()
    } catch (createError) {
      console.error('Errore creazione norma da Attività/Requisito:', createError)
      setError('Impossibile creare e collegare la norma. Verifica i dati e riprova.')
    } finally {
      setSavingNewStandard(false)
    }
  }

  const totalActivities = Object.values(activitiesByArea).reduce(
    (sum, activities) => sum + activities.length,
    0,
  )

  if (loading) {
    return (
      <div className="clinical-page">
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            Caricamento processo...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!process) {
    return (
      <div className="clinical-page">
        <PageHeader
          title="Processo non trovato"
          description="Il processo richiesto non esiste o non è accessibile con l'utente corrente."
          eyebrow="Gap Analysis"
          icon={<Layers3 className="h-6 w-6" />}
          backAction={(
            <Link to="/gap/processes" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800">
              <ArrowLeft className="h-4 w-4" />
              Torna ai processi
            </Link>
          )}
        />
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Processo non disponibile"
          description={error || 'Verifica il link o torna alla libreria processi.'}
        />
      </div>
    )
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title={process.name}
        description={process.description || 'Gestione di Domini/Sezioni e Attività/Requisiti collegati al processo Gap.'}
        eyebrow="Gap Analysis"
        icon={<Layers3 className="h-6 w-6" />}
        backAction={(
          <Link to="/gap/processes" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800">
            <ArrowLeft className="h-4 w-4" />
            Torna ai processi
          </Link>
        )}
        actions={(
          <Button type="button" tone="success" icon={<Plus className="h-4 w-4" />} onClick={startCreate}>
            Nuovo Dominio/Sezione
          </Button>
        )}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {libraryActivityWarning && (
        <div className={`mb-6 rounded-xl border p-4 text-sm ${
          libraryActivityBlocked
            ? 'border-red-100 bg-red-50 text-red-700'
            : 'border-amber-100 bg-amber-50 text-amber-800'
        }`}>
          La libreria contiene {libraryActivityCount} AttivitÃ /Requisiti. Per mantenere prestazioni fluide, conserva una struttura essenziale e valuta di suddividere per perimetri piÃ¹ specifici.
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Contesto processo</CardTitle>
          <CardDescription>
            Macro-processo read-only della libreria Gap. Domini/Sezioni e Attività/Requisiti sono gestiti sotto questo contesto.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">{process.code}</Badge>
                <Badge variant="neutral">Locale</Badge>
                <Badge variant="info">Ordine {process.order_index}</Badge>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-950">{process.name}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                {process.description || 'Nessuna descrizione del processo disponibile.'}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-64">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Domini/Sezioni</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{areas.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attività/Requisiti</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{totalActivities}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showAreaForm && (
        <Card className="mb-6">
          <CardHeader
            actions={(
              <Button
                type="button"
                variant="ghost"
                tone="neutral"
                icon={<X className="h-4 w-4" />}
                onClick={resetForm}
              >
                Annulla
              </Button>
            )}
          >
            <CardTitle>{editingArea ? 'Modifica Dominio/Sezione' : 'Nuovo Dominio/Sezione'}</CardTitle>
            <CardDescription>
              Definisci un Dominio/Sezione del processo. Il Contesto operativo resta salvato nella
              descrizione; le Attività/Requisiti sono gestite sotto ciascun Dominio/Sezione.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveArea} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                    Codice *
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                      title="Codice sintetico e stabile del Dominio/Sezione, utile per identificarlo rapidamente in libreria, assessment e report. Preferisci sigle brevi e riconoscibili, ad esempio ALL, STO, VAL, DIST."
                      aria-label="Aiuto codice Dominio/Sezione"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </span>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                    className="clinical-input"
                    required
                  />
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Usa un codice sintetico e riconoscibile per identificare il Dominio/Sezione in valutazioni e report.
                  </span>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                    Dominio/Sezione *
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                      title="Un Dominio/Sezione rappresenta una fase o sottoambito del processo da valutare. Esempi: Prescrizione, Validazione, Stoccaggio, Allestimento, Distribuzione, Somministrazione, Monitoraggio."
                      aria-label="Aiuto Dominio/Sezione"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="clinical-input"
                    placeholder="Nome del Dominio/Sezione"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Ordine</span>
                  <input
                    type="number"
                    min="0"
                    value={form.order_index}
                    onChange={(event) => setForm((current) => ({ ...current, order_index: event.target.value }))}
                    className="clinical-input"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Contesto operativo</span>
                  <input
                    type="text"
                    value={form.operational_context}
                    onChange={(event) => setForm((current) => ({ ...current, operational_context: event.target.value }))}
                    className="clinical-input"
                    placeholder="Es. UFA, Magazzino farmaceutico, Reparto, Laboratorio galenico"
                  />
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Per ora il contesto operativo viene salvato nella descrizione del Dominio/Sezione; in futuro potra diventare un campo strutturato.
                  </span>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Descrizione</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="clinical-input min-h-24 resize-y"
                    placeholder="Ambito del Dominio/Sezione, confini e note operative."
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="outline" tone="neutral" onClick={resetForm}>
                  Annulla
                </Button>
                <Button type="submit" tone="success" loading={saving}>
                  {editingArea ? 'Salva modifiche' : 'Crea Dominio/Sezione'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {areas.length === 0 ? (
        <EmptyState
          icon={<Map className="h-6 w-6" />}
          title="Nessun Dominio/Sezione disponibile"
          description="Crea il primo Dominio/Sezione del processo. Le Attività/Requisiti saranno aggiunti sotto il relativo Contesto operativo."
          action={(
            <Button type="button" tone="success" icon={<Plus className="h-4 w-4" />} onClick={startCreate}>
              Crea Dominio/Sezione
            </Button>
          )}
        />
      ) : (
        <div className="grid gap-4">
          {areas.map((area) => {
            const parsedDescription = parseAreaDescription(area.description)
            const areaActivities = activitiesByArea[area.id] || []
            const isExpanded = expandedAreaId === area.id

            return (
            <Card key={area.id} className={`transition ${isExpanded ? 'ring-1 ring-teal-100' : 'hover:shadow-clinical'}`}>
              <CardContent className="p-5">
                <div
                  className="flex cursor-pointer flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedAreaId((current) => current === area.id ? null : area.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setExpandedAreaId((current) => current === area.id ? null : area.id)
                    }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="success">{area.code}</Badge>
                      <Badge variant="neutral">{areaActivities.length} Attività/Requisiti</Badge>
                      <Badge variant="info">Ordine {area.order_index}</Badge>
                    </div>
                    <h2 className="mt-3 text-base font-semibold text-slate-900">{area.name}</h2>
                    {parsedDescription.operational_context && (
                      <p className="mt-2 inline-flex rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                        Contesto operativo: {parsedDescription.operational_context}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      tone="neutral"
                      size="sm"
                      icon={<Edit3 className="h-4 w-4" />}
                      onClick={(event) => {
                        event.stopPropagation()
                        startEdit(area)
                      }}
                    >
                      Modifica
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      tone="risk"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={(event) => {
                        event.stopPropagation()
                        removeArea(area)
                      }}
                    >
                      Elimina
                    </Button>
                    <Button
                      type="button"
                      variant={isExpanded ? 'secondary' : 'outline'}
                      tone="success"
                      size="sm"
                      icon={isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      onClick={(event) => {
                        event.stopPropagation()
                        setExpandedAreaId((current) => current === area.id ? null : area.id)
                      }}
                    >
                      {isExpanded ? 'Chiudi' : 'Apri'}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  {parsedDescription.description && (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Descrizione</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{parsedDescription.description}</p>
                    </div>
                  )}

                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Attività/Requisiti</h3>
                      <p className="text-xs text-slate-500">
                        Azioni o controlli valutabili, separati dalle future valutazioni assessment.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      tone="success"
                      size="sm"
                      icon={<Plus className="h-4 w-4" />}
                      onClick={() => startCreateActivity(area.id)}
                      disabled={libraryActivityBlocked}
                    >
                      Nuova Attività/Requisito
                    </Button>
                  </div>

                  {showActivityFormForArea === area.id && (
                    <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            {editingActivity ? 'Modifica Attività/Requisito' : 'Nuova Attività/Requisito'}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Lo stato corrente e i gap saranno gestiti nelle evaluation dell'assessment.
                            Esempio: Preparazione in cappa biologica.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          tone="neutral"
                          size="sm"
                          icon={<X className="h-4 w-4" />}
                          onClick={resetActivityForm}
                        >
                          Annulla
                        </Button>
                      </div>

                      <form onSubmit={(event) => saveActivity(area.id, event)} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <label className="block">
                            <span className="mb-1 block text-sm font-medium text-slate-700">Codice</span>
                            <input
                              type="text"
                              value={editingActivity ? activityForm.code : getNextActivityCode(area.id) || 'Limite raggiunto'}
                              className="clinical-input bg-slate-50 text-slate-600"
                              readOnly
                            />
                            {editingActivity ? (
                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                Codice esistente mantenuto invariato in modifica.
                              </span>
                            ) : getActivityMaxSuffix(area.id) >= 99 ? (
                              <span className="mt-1 block text-xs leading-5 text-red-600">
                                Non si possono inserire più di 99 Attività/Requisiti per Dominio/Sezione. Crea un nuovo Dominio/Sezione.
                              </span>
                            ) : (
                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                Preview generata automaticamente dal codice del Dominio/Sezione con progressivo a due cifre.
                              </span>
                            )}
                          </label>

                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-medium text-slate-700">Nome *</span>
                            <input
                              type="text"
                              value={activityForm.name}
                              onChange={(event) => setActivityForm((current) => ({ ...current, name: event.target.value }))}
                              className="clinical-input"
                              placeholder="Es. Preparazione in cappa biologica"
                              required
                            />
                          </label>

                          <label className="block">
                            <span className="mb-1 block text-sm font-medium text-slate-700">Operatore/Funzione coinvolta</span>
                            <input
                              type="text"
                              value={activityForm.operator}
                              onChange={(event) => setActivityForm((current) => ({ ...current, operator: event.target.value }))}
                              className="clinical-input"
                              placeholder="Ruolo o funzione"
                            />
                          </label>

                          <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-medium text-slate-700">Target atteso di riferimento *</span>
                            <input
                              type="text"
                              value={activityForm.target_state}
                              required
                              onChange={(event) => setActivityForm((current) => ({ ...current, target_state: event.target.value }))}
                              className="clinical-input"
                              placeholder="Stato atteso standard dell'Attività/Requisito"
                            />
                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              Definisce lo stato atteso standard dell'Attività/Requisito nella libreria.
                            </span>
                          </label>

                          <label className="block md:col-span-3">
                            <span className="mb-1 block text-sm font-medium text-slate-700">Descrizione</span>
                            <textarea
                              value={activityForm.description}
                              onChange={(event) => setActivityForm((current) => ({ ...current, description: event.target.value }))}
                              className="clinical-input min-h-24 resize-y"
                              placeholder="Descrizione stabile dell'Attività/Requisito."
                            />
                          </label>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button type="button" variant="outline" tone="neutral" onClick={resetActivityForm}>
                            Annulla
                          </Button>
                          <Button
                            type="submit"
                            tone="success"
                            loading={saving}
                            disabled={!editingActivity && getActivityMaxSuffix(area.id) >= 99}
                          >
                            {editingActivity ? 'Salva modifiche' : 'Crea Attività/Requisito'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {areaActivities.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                      <ClipboardList className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">Nessuna Attività/Requisito in questo Dominio/Sezione</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Aggiungi Attività/Requisiti di libreria per usarli nei futuri assessment Gap.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {areaActivities.map((activity) => {
                        const linkedStandards = activityStandardsByActivity[activity.id] || []
                        const editingStandards = editingStandardsForActivity === activity.id

                        return (
                        <div
                          key={activity.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="success">{activity.code}</Badge>
                                <Badge variant="info">Ordine {activity.order_index}</Badge>
                                {activity.operator && <Badge variant="neutral">{activity.operator}</Badge>}
                              </div>
                              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <h4 className="text-sm font-semibold text-slate-900">{activity.name}</h4>
                                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    tone="neutral"
                                    size="sm"
                                    icon={<Edit3 className="h-4 w-4" />}
                                    onClick={() => startEditActivity(activity)}
                                  >
                                    Modifica
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    tone="risk"
                                    size="sm"
                                    icon={<Trash2 className="h-4 w-4" />}
                                    onClick={() => removeActivity(activity)}
                                  >
                                    Elimina
                                  </Button>
                                </div>
                              </div>
                              {activity.description && (
                                <p className="mt-1 text-sm leading-6 text-slate-500">{activity.description}</p>
                              )}
                              {activity.target_state && (
                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                  <span className="font-semibold text-slate-700">Target atteso di riferimento:</span> {activity.target_state}
                                </p>
                              )}
                              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Norme collegate
                                    </h5>
                                    {linkedStandards.length === 0 ? (
                                      <p className="mt-1 text-xs text-slate-500">
                                        Nessuna norma collegata a questa Attività/Requisito.
                                      </p>
                                    ) : (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {linkedStandards.map((link) => (
                                          <span
                                            key={link.id}
                                            className="inline-flex max-w-full flex-col rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs text-teal-900"
                                          >
                                            <span className="font-semibold">
                                              {link.standard?.code || 'Norma'} - {link.standard?.name || link.standard_id}
                                            </span>
                                            {link.specific_reference && (
                                              <span className="mt-0.5 text-teal-700">
                                                Rif.: {link.specific_reference}
                                              </span>
                                            )}
                                            <span className="mt-1 flex flex-wrap gap-1.5">
                                              {link.standard?.is_mandatory && (
                                                <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 ring-1 ring-amber-100">
                                                  Cogente
                                                </span>
                                              )}
                                              {link.standard?.application_scope && (
                                                <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700 ring-1 ring-sky-100">
                                                  {link.standard.application_scope}
                                                </span>
                                              )}
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    tone="neutral"
                                    size="sm"
                                    icon={<BookMarked className="h-4 w-4" />}
                                    onClick={() => startEditStandards(activity)}
                                  >
                                    Gestisci norme
                                  </Button>
                                </div>

                                {editingStandards && (
                                  <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50/60 p-4">
                                    <div className="space-y-4">
                                      <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-3 text-sm leading-6 text-sky-800">
                                        Le norme create qui saranno salvate nel Catalogo Norme personale e riutilizzabili nei futuri assessment.
                                        Le norme sono collegate all'Attività/Requisito di libreria.
                                      </div>

                                      <div className={`rounded-lg border p-3 text-sm ${
                                        standardsLimitWarning
                                          ? 'border-amber-100 bg-amber-50 text-amber-800'
                                          : 'border-slate-200 bg-white text-slate-600'
                                      }`}>
                                        Per mantenere prestazioni fluide, collega solo i riferimenti realmente essenziali. Limite operativo: {GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT} norme per AttivitÃ /Requisito.
                                      </div>

                                      {standards.length > 0 && (
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
                                              onClick={() => setShowCreateStandardForm((current) => !current)}
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

                                      {(standards.length === 0 || showCreateStandardForm) && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                                          <div className="mb-3">
                                            <p className="text-sm font-semibold text-slate-900">
                                              Crea nuova norma
                                            </p>
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
                                                onChange={(event) => setNewStandardForm((current) => ({ ...current, code: event.target.value }))}
                                                className="clinical-input py-2 text-sm"
                                                placeholder="Es. ISO-9001, LG-001"
                                              />
                                            </label>

                                            <label className="block">
                                              <span className="mb-1 block text-xs font-medium text-slate-600">Nome *</span>
                                              <input
                                                type="text"
                                                value={newStandardForm.name}
                                                onChange={(event) => setNewStandardForm((current) => ({ ...current, name: event.target.value }))}
                                                className="clinical-input py-2 text-sm"
                                                placeholder="Nome norma o riferimento"
                                              />
                                            </label>

                                            <label className="block">
                                              <span className="mb-1 block text-xs font-medium text-slate-600">Versione</span>
                                              <input
                                                type="text"
                                                value={newStandardForm.version}
                                                onChange={(event) => setNewStandardForm((current) => ({ ...current, version: event.target.value }))}
                                                className="clinical-input py-2 text-sm"
                                                placeholder="Es. 2026"
                                              />
                                            </label>

                                            <label className="block">
                                              <span className="mb-1 block text-xs font-medium text-slate-600">Ente emittente</span>
                                              <input
                                                type="text"
                                                value={newStandardForm.issuing_body}
                                                onChange={(event) => setNewStandardForm((current) => ({ ...current, issuing_body: event.target.value }))}
                                                className="clinical-input py-2 text-sm"
                                                placeholder="Es. Ministero, ISO, Regione"
                                              />
                                            </label>

                                            <label className="block">
                                              <span className="mb-1 block text-xs font-medium text-slate-600">Ambito di applicazione</span>
                                              <input
                                                type="text"
                                                value={newStandardForm.application_scope}
                                                onChange={(event) => setNewStandardForm((current) => ({ ...current, application_scope: event.target.value }))}
                                                className="clinical-input py-2 text-sm"
                                                placeholder="Es. Allestimento, Sperimentazioni"
                                              />
                                            </label>

                                            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                              <input
                                                type="checkbox"
                                                checked={newStandardForm.is_mandatory}
                                                onChange={(event) => setNewStandardForm((current) => ({ ...current, is_mandatory: event.target.checked }))}
                                                className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                                              />
                                              <span className="text-xs font-medium text-slate-700">Norma cogente</span>
                                            </label>

                                            <label className="block md:col-span-2">
                                              <span className="mb-1 block text-xs font-medium text-slate-600">Descrizione</span>
                                              <textarea
                                                value={newStandardForm.description}
                                                onChange={(event) => setNewStandardForm((current) => ({ ...current, description: event.target.value }))}
                                                className="clinical-input min-h-20 resize-y py-2 text-sm"
                                                placeholder="Descrizione sintetica della norma."
                                              />
                                            </label>

                                            <label className="block md:col-span-2">
                                              <span className="mb-1 block text-xs font-medium text-slate-600">URL</span>
                                              <input
                                                type="url"
                                                value={newStandardForm.url}
                                                onChange={(event) => setNewStandardForm((current) => ({ ...current, url: event.target.value }))}
                                                className="clinical-input py-2 text-sm"
                                                placeholder="https://..."
                                              />
                                            </label>
                                          </div>

                                          <div className="mt-3 flex flex-wrap justify-end gap-2">
                                            {standards.length > 0 && (
                                              <Button
                                                type="button"
                                                variant="outline"
                                                tone="neutral"
                                                size="sm"
                                                onClick={() => setShowCreateStandardForm(false)}
                                              >
                                                Annulla nuova norma
                                              </Button>
                                            )}
                                            <Button
                                              type="button"
                                              tone="success"
                                              size="sm"
                                              loading={savingNewStandard}
                                              onClick={() => createStandardAndLinkToActivity(activity.id)}
                                              disabled={standardsLimitReached}
                                            >
                                              Crea e collega norma
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-teal-100 pt-3">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          tone="neutral"
                                          size="sm"
                                          onClick={resetStandardEditor}
                                        >
                                          Annulla
                                        </Button>
                                        <Button
                                          type="button"
                                          tone="success"
                                          size="sm"
                                          loading={savingStandards}
                                          onClick={() => saveActivityStandards(activity.id)}
                                          disabled={standardDraftLinks.length > GAP_STANDARDS_PER_ACTIVITY_HARD_LIMIT}
                                        >
                                          Salva norme
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
