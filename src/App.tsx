import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Docs from './pages/Docs'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import NewAssessment from './pages/NewAssessment'
import AssessmentDetail from './pages/AssessmentDetail'
import Actions from './pages/Actions'
import RiskCatalog from './pages/RiskCatalog'
import Settings from './pages/Settings'
import Assessments from './pages/Assessments'
import RCADashboard from './pages/rca/RCADashboard'
import RCAAssessments from './pages/rca/RCAAssessments'
import NewRCAAssessment from './pages/rca/NewRCAAssessment'
import RCAAssessmentDetail from './pages/rca/RCAAssessmentDetail'
import RCAActions from './pages/rca/RCAActions'
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
    return <Navigate to="/fmea/dashboard" replace />
  }

  return <>{children}</>
}

function LegacyAssessmentRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/fmea/assessment/${id}`} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Route pubbliche SENZA wrapper */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      
      {/* Route pubbliche */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Route protette generali */}
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/docs" element={<ProtectedRoute><Docs /></ProtectedRoute>} />

      {/* Analisi Proattiva - FMEA */}
      <Route path="/fmea/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/fmea/assessments" element={<ProtectedRoute><Assessments /></ProtectedRoute>} />
      <Route path="/fmea/assessment/new" element={<ProtectedRoute><NewAssessment /></ProtectedRoute>} />
      <Route path="/fmea/assessment/:id" element={<ProtectedRoute><AssessmentDetail /></ProtectedRoute>} />
      <Route path="/fmea/risks" element={<ProtectedRoute><RiskCatalog /></ProtectedRoute>} />
      <Route path="/fmea/actions" element={<ProtectedRoute><Actions /></ProtectedRoute>} />

      {/* Analisi Reattiva - RCA placeholder */}
      <Route path="/rca/dashboard" element={<ProtectedRoute><RCADashboard /></ProtectedRoute>} />
      <Route path="/rca/assessments" element={<ProtectedRoute><RCAAssessments /></ProtectedRoute>} />
      <Route path="/rca/assessment/new" element={<ProtectedRoute><NewRCAAssessment /></ProtectedRoute>} />
      <Route path="/rca/assessment/:id" element={<ProtectedRoute><RCAAssessmentDetail /></ProtectedRoute>} />
      <Route path="/rca/actions" element={<ProtectedRoute><RCAActions /></ProtectedRoute>} />
      
      {/* Redirect legacy FMEA */}
      <Route path="/dashboard" element={<Navigate to="/fmea/dashboard" replace />} />
      <Route path="/assessments" element={<Navigate to="/fmea/assessments" replace />} />
      <Route path="/assessment/new" element={<Navigate to="/fmea/assessment/new" replace />} />
      <Route path="/assessment/:id" element={<LegacyAssessmentRedirect />} />
      <Route path="/risks" element={<Navigate to="/fmea/risks" replace />} />
      <Route path="/actions" element={<Navigate to="/fmea/actions" replace />} />

      {/* Redirect default */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
