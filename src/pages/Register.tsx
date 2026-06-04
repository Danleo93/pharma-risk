import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Le password non coincidono')
      return
    }

    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password)

    if (error) {
      setError('Errore durante la registrazione. Riprova.')
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
                Crea il tuo account per un uso formativo e documentale con dati anonimizzati.
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

              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                />
                <label htmlFor="acceptTerms" className="text-sm leading-6 text-slate-600">
                  Ho letto e accetto la{' '}
                  <Link to="/privacy" target="_blank" className="font-medium text-sky-700 hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  e i{' '}
                  <Link to="/terms" target="_blank" className="font-medium text-sky-700 hover:underline">
                    Termini di Servizio
                  </Link>
                </label>
              </div>

              <Button type="submit" loading={loading} disabled={!acceptTerms} className="w-full" size="lg">
                {loading ? 'Registrazione in corso...' : 'Registrati'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Hai gia un account?{' '}
              <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
                Accedi
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
            Non inserire dati personali, sanitari o identificativi. PhaRMA T non e uno strumento decisionale clinico.
          </p>
        </div>
      </div>
    </div>
  )
}
