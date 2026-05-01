import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      return
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      console.error('Supabase updateUser error:', error)
      setError('Errore nel reset della password. Il link potrebbe essere scaduto.')
    } else {
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clinical px-4 py-10">
        <Card elevated className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-950">Password aggiornata</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              La tua password e stata cambiata con successo.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Verrai reindirizzato al login tra pochi secondi...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-clinical px-4 py-10">
      <Card elevated className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-700">
              <KeyRound className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-950">Nuova password</h1>
            <p className="mt-2 text-sm text-slate-500">Inserisci e conferma la tua nuova password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Nuova password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="clinical-input px-4 py-3 pr-12"
                  placeholder="Almeno 6 caratteri"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                Conferma password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="clinical-input px-4 py-3"
                placeholder="Ripeti la password"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? 'Salvataggio...' : 'Salva nuova password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
