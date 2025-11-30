import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import NewAssessment from './pages/NewAssessment'
import AssessmentDetail from './pages/AssessmentDetail'
import Actions from './pages/Actions'
import RiskCatalog from './pages/RiskCatalog'
import Settings from './pages/Settings'
import Assessments from './pages/Assessments'
// Componente per proteggere le route
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

// Componente per le route pubbliche (redirect se già loggato)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Route pubbliche */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Route protette */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/assessment/new" element={<ProtectedRoute><NewAssessment /></ProtectedRoute>} />
      <Route path="/assessment/:id" element={<ProtectedRoute><AssessmentDetail /></ProtectedRoute>} />
      <Route path="/actions" element={<ProtectedRoute><Actions /></ProtectedRoute>} />
      <Route path="/risks" element={<ProtectedRoute><RiskCatalog /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/assessments" element={<ProtectedRoute><Assessments /></ProtectedRoute>} />
      {/* Redirect default */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App