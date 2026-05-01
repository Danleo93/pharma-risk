import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError("Errore nell'invio dell'email. Riprova.")
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clinical px-4 py-10">
        <Card elevated className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-950">Email inviata</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Abbiamo inviato un link per reimpostare la password a <strong>{email}</strong>.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Controlla anche la cartella spam se non trovi l'email.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 font-medium text-sky-700 hover:text-sky-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna al login
            </Link>
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
              <Mail className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-950">Password dimenticata?</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Inserisci la tua email e riceverai un link per reimpostare la password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

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

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? 'Invio in corso...' : 'Invia link di reset'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna al login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
