import { useEffect, useState } from 'react'
import { Building2, Check, Download, Save, Shield, User } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { exportUserDataGDPR } from '../services/gdprExport'

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [facilityName, setFacilityName] = useState('')

  useEffect(() => {
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user?.id)
      .single()

    if (data) {
      setFacilityName(data.facility_name || '')
    }
    setLoading(false)
  }

  const saveSettings = async () => {
    setSaving(true)
    setSaved(false)

    const settings = {
      user_id: user?.id,
      facility_name: facilityName.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', user?.id)

    if (updateError) {
      await supabase
        .from('user_settings')
        .insert(settings)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleExportGDPR = async () => {
    if (!user) return
    setExporting(true)
    try {
      const result = await exportUserDataGDPR(user.id, user.email || '')
      if (result.success) {
        alert('Dati esportati con successo!')
      } else {
        alert("Errore durante l'esportazione dei dati")
      }
    } catch {
      alert("Errore durante l'esportazione dei dati")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex p-6 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
          <p className="text-slate-500">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="clinical-page max-w-3xl">
      <PageHeader
        title="Impostazioni"
        description="Configura le opzioni dell'applicazione."
        icon={<Building2 className="h-5 w-5" />}
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Account</h2>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="clinical-input bg-slate-50 px-4 py-2 text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">L'email non puo essere modificata</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Building2 className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Struttura</h2>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nome della Struttura
              </label>
              <input
                type="text"
                value={facilityName}
                onChange={(event) => setFacilityName(event.target.value)}
                placeholder="Es: Ospedale San Raffaele - Farmacia"
                className="clinical-input px-4 py-2"
              />
              <p className="mt-1 text-xs text-slate-400">
                Verra mostrato nei report PDF esportati.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              Salvato!
            </span>
          )}
          <Button
            onClick={saveSettings}
            disabled={saving}
            loading={saving}
            size="lg"
            icon={<Save className="h-5 w-5" />}
          >
            {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Privacy e Dati Personali</h2>
            </div>

            <p className="mb-4 text-sm leading-6 text-slate-600">
              Ai sensi del GDPR (Regolamento UE 2016/679), hai il diritto di accedere ai tuoi dati
              e di riceverli in un formato strutturato e leggibile.
            </p>

            <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h3 className="mb-2 font-medium text-slate-800">I tuoi dati includono:</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>- Informazioni del profilo (email, nome struttura)</li>
                <li>- Tutti i tuoi assessment</li>
                <li>- Tutti i rischi identificati e valutati</li>
                <li>- Tutte le azioni correttive pianificate</li>
              </ul>
            </div>

            <Button
              onClick={handleExportGDPR}
              disabled={exporting}
              loading={exporting}
              tone="neutral"
              icon={<Download className="h-4 w-4" />}
            >
              {exporting ? 'Esportazione in corso...' : 'Esporta i miei dati (GDPR)'}
            </Button>

            <p className="mt-3 text-xs text-slate-500">
              Il file verra scaricato in formato JSON, leggibile e interoperabile.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
