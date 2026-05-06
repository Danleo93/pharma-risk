import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, Check, ClipboardList, FileText } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/ui'
import { supabase } from '../lib/supabase'
import type { Area, Process } from '../types'

export default function NewAssessment() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [newAreaName, setNewAreaName] = useState('')
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [newProcessName, setNewProcessName] = useState('')

  const [areas, setAreas] = useState<Area[]>([])
  const [processes, setProcesses] = useState<Process[]>([])

  useEffect(() => {
    fetchAreas()
  }, [])

  useEffect(() => {
    if (selectedArea && selectedArea !== 'new') {
      fetchProcesses(selectedArea)
    } else {
      setProcesses([])
    }
  }, [selectedArea])

  const fetchAreas = async () => {
    const { data } = await supabase
      .from('areas')
      .select('*')
      .order('name')
    setAreas(data || [])
  }

  const fetchProcesses = async (areaId: string) => {
    const { data } = await supabase
      .from('processes')
      .select('*')
      .eq('area_id', areaId)
      .order('name')
    setProcesses(data || [])
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Inserisci un titolo per l'assessment")
      return
    }

    setLoading(true)
    setError(null)

    try {
      let areaId = selectedArea !== 'new' ? selectedArea : null
      let processId = selectedProcess !== 'new' ? selectedProcess : null

      if (selectedArea === 'new' && newAreaName.trim()) {
        const { data: newArea, error: areaError } = await supabase
          .from('areas')
          .insert({ name: newAreaName.trim(), user_id: user?.id })
          .select()
          .single()

        if (areaError) throw areaError
        areaId = newArea.id

        if (newProcessName.trim()) {
          const { data: newProcess, error: processError } = await supabase
            .from('processes')
            .insert({
              name: newProcessName.trim(),
              user_id: user?.id,
              area_id: areaId,
            })
            .select()
            .single()

          if (processError) throw processError
          processId = newProcess.id
        }
      } else if (selectedProcess === 'new' && newProcessName.trim() && areaId) {
        const { data: newProcess, error: processError } = await supabase
          .from('processes')
          .insert({
            name: newProcessName.trim(),
            user_id: user?.id,
            area_id: areaId,
          })
          .select()
          .single()

        if (processError) throw processError
        processId = newProcess.id
      }

      const { data: assessment, error: assessmentError } = await supabase
        .from('risk_assessments')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          user_id: user?.id,
          area_id: areaId,
          process_id: processId,
          status: 'draft',
        })
        .select()
        .single()

      if (assessmentError) throw assessmentError

      navigate(`/fmea/assessment/${assessment.id}`)
    } catch (err) {
      console.error('Errore:', err)
      setError("Errore durante la creazione dell'assessment")
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Informazioni', icon: FileText },
    { number: 2, title: 'Area', icon: Building2 },
    { number: 3, title: 'Processo', icon: ClipboardList },
  ]

  const optionClass = (active: boolean) =>
    cn(
      'flex cursor-pointer items-center rounded-xl border p-4 transition',
      active
        ? 'border-sky-200 bg-sky-50 text-sky-900 shadow-clinical-soft'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
    )

  return (
    <div className="clinical-page max-w-4xl">
      <PageHeader
        title="Nuovo Risk Assessment"
        description="Segui i passaggi guidati per creare un nuovo assessment FMEA/HFMEA."
        eyebrow="Analisi Proattiva"
        backAction={(
          <button
            type="button"
            onClick={() => navigate('/fmea/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alla Dashboard
          </button>
        )}
      />

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => {
              const Icon = s.icon
              const completed = step > s.number
              const active = step >= s.number

              return (
                <div key={s.number} className="flex flex-1 items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full font-semibold transition',
                        active ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-400',
                      )}
                    >
                      {completed ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={cn('hidden font-medium sm:inline', active ? 'text-slate-900' : 'text-slate-400')}>
                      {s.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn('mx-3 h-px flex-1 rounded sm:mx-5', completed ? 'bg-sky-600' : 'bg-slate-200')} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card elevated>
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Titolo dell'Assessment *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="clinical-input px-4 py-3"
                  placeholder="Es: Risk Assessment UFA Q1 2025"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Descrizione (opzionale)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="clinical-input resize-none px-4 py-3"
                  placeholder="Descrivi brevemente lo scopo di questo assessment..."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Area di riferimento</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seleziona l'area di riferimento o creane una nuova.
                </p>
              </div>

              {areas.length > 0 && (
                <div className="space-y-2">
                  {areas.map((area) => (
                    <label key={area.id} className={optionClass(selectedArea === area.id)}>
                      <input
                        type="radio"
                        name="area"
                        value={area.id}
                        checked={selectedArea === area.id}
                        onChange={() => setSelectedArea(area.id)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{area.name}</p>
                        {area.description && (
                          <p className="text-sm text-slate-500">{area.description}</p>
                        )}
                      </div>
                      {selectedArea === area.id && <Check className="h-5 w-5 text-sky-700" />}
                    </label>
                  ))}
                </div>
              )}

              <label className={optionClass(selectedArea === 'new')}>
                <input
                  type="radio"
                  name="area"
                  value="new"
                  checked={selectedArea === 'new'}
                  onChange={() => setSelectedArea('new')}
                  className="sr-only"
                />
                <div className="flex-1">
                  <p className="font-medium">+ Crea nuova area</p>
                </div>
                {selectedArea === 'new' && <Check className="h-5 w-5 text-sky-700" />}
              </label>

              {selectedArea === 'new' && (
                <input
                  type="text"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="clinical-input px-4 py-3"
                  placeholder="Nome della nuova area (es: UFA, Magazzino, DPC...)"
                />
              )}

              <label className={optionClass(selectedArea === null)}>
                <input
                  type="radio"
                  name="area"
                  value=""
                  checked={selectedArea === null}
                  onChange={() => setSelectedArea(null)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <p className="font-medium">Salta questo passaggio</p>
                  <p className="text-sm text-slate-500">Potrai assegnare un'area in seguito.</p>
                </div>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Processo da analizzare</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seleziona il processo da analizzare o creane uno nuovo.
                </p>
              </div>

              {processes.length > 0 && (
                <div className="space-y-2">
                  {processes.map((process) => (
                    <label key={process.id} className={optionClass(selectedProcess === process.id)}>
                      <input
                        type="radio"
                        name="process"
                        value={process.id}
                        checked={selectedProcess === process.id}
                        onChange={() => setSelectedProcess(process.id)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{process.name}</p>
                      </div>
                      {selectedProcess === process.id && <Check className="h-5 w-5 text-sky-700" />}
                    </label>
                  ))}
                </div>
              )}

              {selectedArea && selectedArea !== 'new' && (
                <label className={optionClass(selectedProcess === 'new')}>
                  <input
                    type="radio"
                    name="process"
                    value="new"
                    checked={selectedProcess === 'new'}
                    onChange={() => setSelectedProcess('new')}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="font-medium">+ Crea nuovo processo</p>
                  </div>
                  {selectedProcess === 'new' && <Check className="h-5 w-5 text-sky-700" />}
                </label>
              )}

              {(selectedProcess === 'new' || selectedArea === 'new') && (
                <input
                  type="text"
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                  className="clinical-input px-4 py-3"
                  placeholder="Nome del processo (es: Allestimento chemioterapici)"
                />
              )}

              <label className={optionClass(selectedProcess === null)}>
                <input
                  type="radio"
                  name="process"
                  value=""
                  checked={selectedProcess === null}
                  onChange={() => setSelectedProcess(null)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <p className="font-medium">Salta questo passaggio</p>
                  <p className="text-sm text-slate-500">Potrai assegnare un processo in seguito.</p>
                </div>
              </label>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-between border-t border-slate-100 pt-6">
            <Button
              type="button"
              variant="ghost"
              tone="neutral"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Indietro
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                tone="fmea"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !title.trim()}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Avanti
              </Button>
            ) : (
              <Button
                type="button"
                tone="success"
                onClick={handleSubmit}
                loading={loading}
                iconRight={<Check className="h-4 w-4" />}
              >
                {loading ? 'Creazione...' : 'Crea Assessment'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
