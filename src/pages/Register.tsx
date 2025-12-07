import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">PhaRMA T</h1>
          <p className="text-sm text-gray-500 -mt-1">Pharmacy Risk Management Assessment Tool</p>
          <p className="text-gray-600 mt-4">Crea il tuo account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
              placeholder="tuaemail@esempio.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Conferma Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition pr-12"
                placeholder="Ripeti la password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Checkbox accettazione termini */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-600">
              Ho letto e accetto la{' '}
              <a href="/privacy" target="_blank" className="text-sky-600 hover:underline">Privacy Policy</a>
              {' '}e i{' '}
              <a href="/terms" target="_blank" className="text-sky-600 hover:underline">Termini di Servizio</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptTerms}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Hai già un account?{' '}
          <Link to="/login" className="text-sky-600 hover:text-sky-700 font-medium">
            Accedi
          </Link>
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 max-w-md text-center">
        <p className="text-xs text-gray-400 leading-relaxed">
          ⚠️ <strong>Versione Beta</strong> - Solo per uso interno e test.
          <br />
          <span className="text-gray-500">Sviluppato da Dott. Daniele Leonardi Vinci</span>
        </p>
      </div>
    </div>
  )
}
