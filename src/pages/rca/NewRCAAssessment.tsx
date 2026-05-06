import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, ClipboardList, FileText, ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/ui'
import { supabase } from '../../lib/supabase'
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
  const [methodology, setMethodology] = useState<RCAMethodology>('combined')
  const [immediateContainment, setImmediateContainment] = useState('')

  const handleSubmit = async () => {
    if (!user) return
    if (!title.trim() || !eventTitle.trim()) {
      setError('Titolo assessment e titolo evento sono obbligatori')
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
        methodology,
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

  const methodologyCardClass = (active: boolean) =>
    cn(
      'flex h-full cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
      active
        ? 'border-amber-200 bg-amber-50 text-amber-900 shadow-clinical-soft'
        : 'border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50/60',
    )

  return (
    <div className="clinical-page max-w-5xl">
      <PageHeader
        title="Nuovo Assessment RCA"
        description="Registra un evento, incidente o near miss da analizzare con metodologia RCA."
        eyebrow="Analisi Reattiva"
        backAction={(
          <button
            type="button"
            onClick={() => navigate('/rca/assessments')}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna agli Assessment RCA
          </button>
        )}
      />

      <Card elevated>
        <CardContent className="p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Informazioni iniziali</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                La raccolta evento apre il workflow; Ishikawa, 5 Whys e azioni saranno gestiti nel dettaglio assessment.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Assessment</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Titolo assessment *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="clinical-input px-4 py-3"
                    placeholder="Es: RCA errore dispensazione"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Titolo evento *
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="clinical-input px-4 py-3"
                    placeholder="Es: Near miss in preparazione terapia"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Descrizione assessment
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="clinical-input resize-none px-4 py-3"
                  placeholder="Contesto o perimetro dell'analisi..."
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Metodologia prevista</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className={methodologyCardClass(methodology === 'combined')}>
                  <input
                    type="radio"
                    name="methodology"
                    value="combined"
                    checked={methodology === 'combined'}
                    onChange={() => setMethodology('combined')}
                    className="sr-only"
                  />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 ring-1 ring-amber-100">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Ishikawa + 5 Whys</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Percorso consigliato: mappa le cause candidate e approfondiscile con 5 Whys.
                    </p>
                  </div>
                  {methodology === 'combined' && <Check className="h-5 w-5 text-amber-700" />}
                </label>

                <label className={methodologyCardClass(methodology === 'fishbone')}>
                  <input
                    type="radio"
                    name="methodology"
                    value="fishbone"
                    checked={methodology === 'fishbone'}
                    onChange={() => setMethodology('fishbone')}
                    className="sr-only"
                  />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 ring-1 ring-amber-100">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Ishikawa</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Analisi causa-effetto con eventuale approfondimento successivo.
                    </p>
                  </div>
                  {methodology === 'fishbone' && <Check className="h-5 w-5 text-amber-700" />}
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Evento e contesto</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tipo evento</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as RCAEventType | '')}
                    className="clinical-input px-4 py-3"
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
                  <label className="mb-2 block text-sm font-medium text-slate-700">Severita'</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as RCASeverity | '')}
                    className="clinical-input px-4 py-3"
                  >
                    <option value="">Non specificata</option>
                    <option value="low">Bassa</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Critica</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Data evento</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="clinical-input px-4 py-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Ora evento</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="clinical-input px-4 py-3"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Luogo</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="clinical-input px-4 py-3"
                    placeholder="Es: Farmacia ospedaliera"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Reparto / Servizio</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="clinical-input px-4 py-3"
                    placeholder="Es: UFA, DPC, Magazzino"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Descrizione evento</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={4}
                  className="clinical-input resize-none px-4 py-3"
                  placeholder="Descrivi cosa e' accaduto..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Contenimento immediato</label>
                <textarea
                  value={immediateContainment}
                  onChange={(e) => setImmediateContainment(e.target.value)}
                  rows={3}
                  className="clinical-input resize-none px-4 py-3"
                  placeholder="Azioni immediate gia' adottate..."
                />
              </div>
            </section>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <Button
              type="button"
              variant="ghost"
              tone="neutral"
              onClick={() => navigate('/rca/assessments')}
            >
              Annulla
            </Button>
            <Button
              type="button"
              tone="rca"
              onClick={handleSubmit}
              loading={loading}
              iconRight={<Check className="h-4 w-4" />}
            >
              {loading ? 'Creazione...' : 'Crea Assessment RCA'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
