import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Area, Process } from '../types'
import { ArrowLeft, ArrowRight, Check, Building2, FileText, ClipboardList } from 'lucide-react'

export default function NewAssessment() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [newAreaName, setNewAreaName] = useState('')
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [newProcessName, setNewProcessName] = useState('')

  // Data from DB
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
      setError('Inserisci un titolo per l\'assessment')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let areaId = selectedArea !== 'new' ? selectedArea : null
      let processId = selectedProcess !== 'new' ? selectedProcess : null

      // Crea nuova area se necessario
      if (selectedArea === 'new' && newAreaName.trim()) {
        const { data: newArea, error: areaError } = await supabase
          .from('areas')
          .insert({ name: newAreaName.trim(), user_id: user?.id })
          .select()
          .single()

        if (areaError) throw areaError
        areaId = newArea.id

        // Crea nuovo processo se necessario
        if (newProcessName.trim()) {
          const { data: newProcess, error: processError } = await supabase
            .from('processes')
            .insert({ 
              name: newProcessName.trim(), 
              user_id: user?.id,
              area_id: areaId 
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
            area_id: areaId 
          })
          .select()
          .single()

        if (processError) throw processError
        processId = newProcess.id
      }

      // Crea l'assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('risk_assessments')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          user_id: user?.id,
          area_id: areaId,
          process_id: processId,
          status: 'draft'
        })
        .select()
        .single()

      if (assessmentError) throw assessmentError

      // Vai alla pagina dell'assessment
      navigate(`/assessment/${assessment.id}`)
    } catch (err) {
      console.error('Errore:', err)
      setError('Errore durante la creazione dell\'assessment')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Informazioni', icon: FileText },
    { number: 2, title: 'Area', icon: Building2 },
    { number: 3, title: 'Processo', icon: ClipboardList },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Nuovo Risk Assessment</h1>
        <p className="text-gray-500 mt-1">Segui i passaggi per creare un nuovo assessment</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => {
          const Icon = s.icon
          return (
            <div key={s.number} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full font-semibold
                ${step >= s.number 
                  ? 'bg-sky-600 text-white' 
                  : 'bg-gray-200 text-gray-500'}
              `}>
                {step > s.number ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`ml-2 font-medium hidden sm:inline ${
                step >= s.number ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {s.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-24 h-1 mx-2 sm:mx-4 rounded ${
                  step > s.number ? 'bg-sky-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Step 1: Informazioni base */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titolo dell'Assessment *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                placeholder="Es: Risk Assessment UFA Q1 2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione (opzionale)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none"
                placeholder="Descrivi brevemente lo scopo di questo assessment..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Area */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Seleziona l'area di riferimento o creane una nuova
            </p>
            
            {areas.length > 0 && (
              <div className="space-y-2">
                {areas.map((area) => (
                  <label
                    key={area.id}
                    className={`
                      flex items-center p-4 border rounded-lg cursor-pointer transition
                      ${selectedArea === area.id 
                        ? 'border-sky-500 bg-sky-50' 
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <input
                      type="radio"
                      name="area"
                      value={area.id}
                      checked={selectedArea === area.id}
                      onChange={() => setSelectedArea(area.id)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{area.name}</p>
                      {area.description && (
                        <p className="text-sm text-gray-500">{area.description}</p>
                      )}
                    </div>
                    {selectedArea === area.id && (
                      <Check className="w-5 h-5 text-sky-600" />
                    )}
                  </label>
                ))}
              </div>
            )}

            <label
              className={`
                flex items-center p-4 border rounded-lg cursor-pointer transition
                ${selectedArea === 'new' 
                  ? 'border-sky-500 bg-sky-50' 
                  : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <input
                type="radio"
                name="area"
                value="new"
                checked={selectedArea === 'new'}
                onChange={() => setSelectedArea('new')}
                className="sr-only"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">+ Crea nuova area</p>
              </div>
              {selectedArea === 'new' && (
                <Check className="w-5 h-5 text-sky-600" />
              )}
            </label>

            {selectedArea === 'new' && (
              <input
                type="text"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none mt-4"
                placeholder="Nome della nuova area (es: UFA, Magazzino, DPC...)"
              />
            )}

            <label
              className={`
                flex items-center p-4 border rounded-lg cursor-pointer transition
                ${selectedArea === null 
                  ? 'border-sky-500 bg-sky-50' 
                  : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <input
                type="radio"
                name="area"
                value=""
                checked={selectedArea === null}
                onChange={() => setSelectedArea(null)}
                className="sr-only"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">Salta questo passaggio</p>
                <p className="text-sm text-gray-500">Potrai assegnare un'area in seguito</p>
              </div>
            </label>
          </div>
        )}

        {/* Step 3: Processo */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Seleziona il processo da analizzare o creane uno nuovo
            </p>

            {processes.length > 0 && (
              <div className="space-y-2">
                {processes.map((process) => (
                  <label
                    key={process.id}
                    className={`
                      flex items-center p-4 border rounded-lg cursor-pointer transition
                      ${selectedProcess === process.id 
                        ? 'border-sky-500 bg-sky-50' 
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <input
                      type="radio"
                      name="process"
                      value={process.id}
                      checked={selectedProcess === process.id}
                      onChange={() => setSelectedProcess(process.id)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{process.name}</p>
                    </div>
                    {selectedProcess === process.id && (
                      <Check className="w-5 h-5 text-sky-600" />
                    )}
                  </label>
                ))}
              </div>
            )}

            {(selectedArea && selectedArea !== 'new') && (
              <label
                className={`
                  flex items-center p-4 border rounded-lg cursor-pointer transition
                  ${selectedProcess === 'new' 
                    ? 'border-sky-500 bg-sky-50' 
                    : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <input
                  type="radio"
                  name="process"
                  value="new"
                  checked={selectedProcess === 'new'}
                  onChange={() => setSelectedProcess('new')}
                  className="sr-only"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">+ Crea nuovo processo</p>
                </div>
                {selectedProcess === 'new' && (
                  <Check className="w-5 h-5 text-sky-600" />
                )}
              </label>
            )}

            {(selectedProcess === 'new' || selectedArea === 'new') && (
              <input
                type="text"
                value={newProcessName}
                onChange={(e) => setNewProcessName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none mt-4"
                placeholder="Nome del processo (es: Allestimento chemioterapici)"
              />
            )}

            <label
              className={`
                flex items-center p-4 border rounded-lg cursor-pointer transition
                ${selectedProcess === null 
                  ? 'border-sky-500 bg-sky-50' 
                  : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <input
                type="radio"
                name="process"
                value=""
                checked={selectedProcess === null}
                onChange={() => setSelectedProcess(null)}
                className="sr-only"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">Salta questo passaggio</p>
                <p className="text-sm text-gray-500">Potrai assegnare un processo in seguito</p>
              </div>
            </label>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !title.trim()}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Avanti
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Creazione...' : 'Crea Assessment'}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}