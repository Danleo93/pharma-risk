import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ClipboardList } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { RCAMethodology, RCAEventType, RCASeverity } from '../../types'

export default function NewRCAAssessment() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventType, setEventType] = useState<RCAEventType | ''>('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [location, setLocation] = useState('')
  const [department, setDepartment] = useState('')
  const [severity, setSeverity] = useState<RCASeverity | ''>('')
  const [methodology, setMethodology] = useState<RCAMethodology | ''>('combined')
  const [immediateContainment, setImmediateContainment] = useState('')

  const handleSubmit = async () => {
    if (!user) return
    if (!title.trim() || !eventTitle.trim()) {
      setError("Titolo assessment e titolo evento sono obbligatori")
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('rca_assessments')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        status: 'draft',
        methodology: methodology || null,
        event_title: eventTitle.trim(),
        event_description: eventDescription.trim() || null,
        event_type: eventType || null,
        event_date: eventDate || null,
        event_time: eventTime || null,
        location: location.trim() || null,
        department: department.trim() || null,
        severity: severity || null,
        immediate_containment: immediateContainment.trim() || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Errore creazione RCA:', insertError)
      setError("Errore durante la creazione dell'assessment RCA")
      setLoading(false)
      return
    }

    navigate(`/rca/assessment/${data.id}`)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/rca/assessments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna agli Assessment RCA
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Nuovo Assessment RCA</h1>
        <p className="text-gray-500 mt-1">Registra un evento, incidente o near miss da analizzare.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Informazioni iniziali</h2>
            <p className="text-sm text-gray-500">La parte analitica verra' completata nelle fasi successive.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titolo assessment *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Es: RCA errore dispensazione"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titolo evento *
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Es: Near miss in preparazione terapia"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione assessment
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
              placeholder="Contesto o perimetro dell'analisi..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo evento</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as RCAEventType | '')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="">Non specificato</option>
                <option value="incident">Incidente</option>
                <option value="near_miss">Near miss</option>
                <option value="non_conformity">Non conformita'</option>
                <option value="complaint">Reclamo</option>
                <option value="other">Altro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severita'</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as RCASeverity | '')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="">Non specificata</option>
                <option value="low">Bassa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Critica</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Metodologia prevista</label>
              <select
                value={methodology}
                onChange={(e) => setMethodology(e.target.value as RCAMethodology | '')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="">Da definire</option>
                <option value="combined">Ishikawa + 5 Whys</option>
                <option value="fishbone">Ishikawa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data evento</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ora evento</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Luogo</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Es: Farmacia ospedaliera"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reparto / Servizio</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Es: UFA, DPC, Magazzino"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione evento</label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
              placeholder="Descrivi cosa e' accaduto..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contenimento immediato</label>
            <textarea
              value={immediateContainment}
              onChange={(e) => setImmediateContainment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
              placeholder="Azioni immediate gia' adottate..."
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/rca/assessments')}
            className="px-5 py-2.5 text-gray-600 hover:text-gray-900"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Creazione...' : 'Crea Assessment RCA'}
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
