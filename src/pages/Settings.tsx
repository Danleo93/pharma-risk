import { useEffect, useState } from 'react'
import { AlertTriangle, Building2, Check, Download, Mail, Save, Shield, User } from 'lucide-react'
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

  const handleDeletionRequest = () => {
    const subject = encodeURIComponent('[PhaRMA T] Richiesta cancellazione account e dati')
    const body = encodeURIComponent([
      'Richiedo la cancellazione del mio account PhaRMA T e dei dati applicativi associati.',
      '',
      `Email account: ${user?.email || ''}`,
      `User ID: ${user?.id || ''}`,
      '',
      'Confermo di aver esportato o salvato eventuali dati che intendo conservare.',
      'Confermo di comprendere che la cancellazione dei dati applicativi e dell account e un operazione definitiva, salvo eventuali copie temporanee di backup tecnico.',
      '',
      'Richiedo conferma di presa in carico e comunicazione dell esito della cancellazione.',
      '',
      'Note aggiuntive:',
    ].join('\n'))

    window.location.href = `mailto:daniele.leo93@gmail.com?subject=${subject}&body=${body}`
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
              e di riceverli in un formato strutturato, leggibile e interoperabile.
            </p>

            <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h3 className="mb-2 font-medium text-slate-800">I tuoi dati includono:</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>- Informazioni del profilo (email, nome struttura)</li>
                <li>- Assessment, rischi, cataloghi personalizzati e azioni FMEA</li>
                <li>- Assessment RCA, cause, Ishikawa, 5 Whys e azioni correttive</li>
                <li>- Processi, Domini/Sezioni, Attivita/Requisiti, norme, valutazioni e azioni Gap</li>
                <li>- Eventi, note e testi liberi collegati ai moduli applicativi</li>
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
              Il file verra scaricato in formato JSON. Potrebbe contenere testi liberi inseriti dall'utente:
              conservalo e condividilo con cautela.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Cancellazione account e dati</h2>
            </div>

            <p className="text-sm leading-6 text-slate-600">
              Puoi richiedere la cancellazione dell'account e dei dati applicativi associati. Prima di procedere,
              esporta i dati che intendi conservare: la cancellazione e pensata come operazione definitiva e
              riguarda i contenuti applicativi collegati al tuo utente.
            </p>

            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4">
              <h3 className="mb-3 font-medium text-red-900">Procedura strutturata di cancellazione</h3>
              <div className="grid gap-4 text-sm text-red-900 md:grid-cols-2">
                <div>
                  <h4 className="mb-1 font-semibold">Prima della richiesta</h4>
                  <ul className="space-y-1 text-red-800">
                    <li>- esporta i dati che intendi conservare;</li>
                    <li>- verifica l'email dell'account indicata nella richiesta;</li>
                    <li>- conferma esplicitamente la volonta di cancellazione definitiva.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold">Dopo l'invio</h4>
                  <ul className="space-y-1 text-red-800">
                    <li>- la richiesta viene presa in carico e confermata via email;</li>
                    <li>- l'identita dell'account puo essere verificata prima dell'esecuzione;</li>
                    <li>- l'esito della cancellazione viene comunicato all'indirizzo registrato.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 font-medium text-slate-900">Dati interessati dalla cancellazione</h3>
              <ul className="grid gap-1 text-sm text-slate-600 md:grid-cols-2">
                <li>- assessment, rischi e azioni FMEA;</li>
                <li>- assessment, cause, 5 Whys, Ishikawa e azioni RCA;</li>
                <li>- processi, requisiti, norme, valutazioni e azioni Gap;</li>
                <li>- impostazioni utente e dati applicativi collegati all'account.</li>
              </ul>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                La cancellazione viene completata indicativamente entro 30 giorni dalla presa in carico,
                salvo obblighi tecnici, legali o copie temporanee presenti nei sistemi di backup dei fornitori.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Per sicurezza, la cancellazione completa dell'account viene gestita come richiesta verificata
                e non come azione automatica immediata dal browser.
              </p>
              <Button
                type="button"
                variant="danger"
                tone="risk"
                icon={<Mail className="h-4 w-4" />}
                onClick={handleDeletionRequest}
              >
                Richiedi cancellazione
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
