import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 text-center">PhaRMA T</h1>
<p className="text-sm text-gray-500 text-center -mt-2">Pharmacy Risk Management Assessment Tool</p>
          <p className="text-gray-500 mt-2">Risk Assessment per Farmacia Ospedaliera</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>

          <div className="text-center mt-3">
            <Link to="/forgot-password" className="text-sm text-sky-600 hover:text-sky-700">
              Password dimenticata?
            </Link>
          </div>
        
        </form>

        <p className="text-center text-gray-600">
          Non hai un account?{' '}
          <Link to="/register" className="text-sky-600 hover:text-sky-700 font-medium">
            Registrati
          </Link>
        </p>
      </div>
      {/* Disclaimer */}
{/* Disclaimer */}
<div className="mt-6 max-w-md text-center">
  <p className="text-xs text-gray-400 leading-relaxed">
    ⚠️ <strong>Versione Beta</strong> - Solo per uso interno e test.
    <br />
    Questo strumento è fornito "così com'è" senza garanzie.
    <br />
    Non sostituisce la valutazione professionale.
    <br />
    <span className="text-gray-500">Sviluppato da Dott. Daniele Leonardi Vinci</span>
  </p>
  
  {/* Link Privacy e Termini */}
  <div className="mt-4 text-sm text-gray-500">
    <a href="/privacy" className="hover:text-sky-600">Privacy Policy</a>
    <span className="mx-2">•</span>
    <a href="/terms" className="hover:text-sky-600">Termini di Servizio</a>
  </div>
</div>
</div>
    
  )
}