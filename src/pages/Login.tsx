import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Email o password non validi')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-clinical px-4 py-10">
      <div className="w-full max-w-md">
        <Card elevated>
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-700 text-white shadow-clinical-soft">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">PhaRMA T</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Clinical Risk Suite
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Supporto formativo e documentale per farmacia ospedaliera e rischio clinico.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="clinical-input px-4 py-3"
                  placeholder="nome@struttura.it"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="clinical-input px-4 py-3 pr-12"
                    placeholder="Inserisci la password"
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

              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <Link to="/forgot-password" className="text-sm font-medium text-sky-700 hover:text-sky-800">
                Password dimenticata?
              </Link>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              Non hai un account?{' '}
              <Link to="/register" className="font-semibold text-sky-700 hover:text-sky-800">
                Registrati
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50/70 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Versione Beta
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Solo per uso formativo, metodologico e documentale con dati anonimizzati o simulati.
            Non sostituisce la valutazione professionale e non orienta decisioni cliniche dirette.
          </p>
          <p className="mt-2 text-xs text-slate-500">Sviluppato da Dott. Daniele Leonardi Vinci</p>
          <div className="mt-3 flex justify-center gap-3 text-xs">
            <Link to="/privacy" className="text-slate-500 hover:text-sky-700">Privacy Policy</Link>
            <span className="text-slate-300">-</span>
            <Link to="/terms" className="text-slate-500 hover:text-sky-700">Termini di Servizio</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
