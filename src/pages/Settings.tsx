import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Save, Building2, User, Check } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Settings
  const [facilityName, setFacilityName] = useState('')

  useEffect(() => {
    fetchSettings()
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
      updated_at: new Date().toISOString()
    }

    // Prova a fare update, se fallisce fa insert
    const { error: updateError } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', user?.id)

    if (updateError) {
      // Se non esiste, crea
      await supabase
        .from('user_settings')
        .insert(settings)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Impostazioni</h1>
        <p className="text-gray-500 mt-1">Configura le opzioni dell'applicazione</p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-sky-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Account</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">L'email non può essere modificata</p>
            </div>
          </div>
        </div>

        {/* Facility Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Struttura</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome della Struttura
              </label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="Es: Ospedale San Raffaele - Farmacia"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Verrà mostrato nei report PDF esportati
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="text-green-600 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Salvato!
            </span>
          )}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </button>
        </div>
      </div>
    </div>
  )
}