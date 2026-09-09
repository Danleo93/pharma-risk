import { lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ModuleConfigProvider } from './context/ModuleConfigProvider'
import { PrivacyGuardProvider } from './context/PrivacyGuardProvider'
import { useModuleConfig } from './context/useModuleConfig'
import Layout from './components/Layout'
import { ModuleRoute } from './components/modules/ModuleRoute'
import { ModuleUnavailable } from './components/modules/ModuleUnavailable'
import { LazyRouteBoundary } from './components/LazyRouteBoundary'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const Docs = lazy(() => import('./pages/Docs'))
const Contacts = lazy(() => import('./pages/Contacts'))
const Home = lazy(() => import('./pages/Home'))
const Settings = lazy(() => import('./pages/Settings'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const NewAssessment = lazy(() => import('./pages/NewAssessment'))
const AssessmentDetail = lazy(() => import('./pages/AssessmentDetail'))
const Actions = lazy(() => import('./pages/Actions'))
const RiskCatalog = lazy(() => import('./pages/RiskCatalog'))
const Assessments = lazy(() => import('./pages/Assessments'))
const RCADashboard = lazy(() => import('./pages/rca/RCADashboard'))
const RCAAssessments = lazy(() => import('./pages/rca/RCAAssessments'))
const NewRCAAssessment = lazy(() => import('./pages/rca/NewRCAAssessment'))
const RCAAssessmentDetail = lazy(() => import('./pages/rca/RCAAssessmentDetail'))
const RCAActions = lazy(() => import('./pages/rca/RCAActions'))
const GapDashboard = lazy(() => import('./pages/gap/GapDashboard'))
const GapAssessments = lazy(() => import('./pages/gap/GapAssessments'))
const NewGapAssessment = lazy(() => import('./pages/gap/NewGapAssessment'))
const GapAssessmentDetail = lazy(() => import('./pages/gap/GapAssessmentDetail'))
const GapProcesses = lazy(() => import('./pages/gap/GapProcesses'))
const GapProcessDetail = lazy(() => import('./pages/gap/GapProcessDetail'))
const GapStandards = lazy(() => import('./pages/gap/GapStandards'))
const GapActions = lazy(() => import('./pages/gap/GapActions'))
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
    return <Navigate to="/start" replace />
  }

  return <>{children}</>
}

function LegacyAssessmentRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/fmea/assessment/${id}`} replace />
}

function DefaultModuleRedirect() {
  const { loading, error, getDefaultAvailableRoute } = useModuleConfig()

  if (loading) {
    return (
      <div className="clinical-page flex min-h-[45vh] items-center justify-center">
        <p className="text-sm text-slate-500">Verifica moduli disponibili...</p>
      </div>
    )
  }

  const route = getDefaultAvailableRoute()
  return route
    ? <Navigate to={route} replace />
    : <ModuleUnavailable configurationError={error} />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Route pubbliche SENZA wrapper */}
      <Route path="/privacy" element={<LazyRouteBoundary><Privacy /></LazyRouteBoundary>} />
      <Route path="/terms" element={<LazyRouteBoundary><Terms /></LazyRouteBoundary>} />
      
      {/* Route pubbliche */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Route protette generali */}
      <Route path="/" element={<ProtectedRoute><LazyRouteBoundary><Home /></LazyRouteBoundary></ProtectedRoute>} />
      <Route path="/start" element={<ProtectedRoute><DefaultModuleRedirect /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><LazyRouteBoundary><Settings /></LazyRouteBoundary></ProtectedRoute>} />
      <Route path="/docs" element={<ProtectedRoute><LazyRouteBoundary><Docs /></LazyRouteBoundary></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><LazyRouteBoundary><Contacts /></LazyRouteBoundary></ProtectedRoute>} />

      {/* Analisi Proattiva - FMEA */}
      <Route path="/fmea" element={<ProtectedRoute><ModuleRoute moduleKey="FMEA"><Navigate to="/fmea/dashboard" replace /></ModuleRoute></ProtectedRoute>} />
      <Route path="/fmea/dashboard" element={<ProtectedRoute><ModuleRoute moduleKey="FMEA"><LazyRouteBoundary><Dashboard /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/fmea/assessments" element={<ProtectedRoute><ModuleRoute moduleKey="FMEA"><LazyRouteBoundary><Assessments /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/fmea/assessment/new" element={<ProtectedRoute><ModuleRoute moduleKey="FMEA" requiresWrite><LazyRouteBoundary><NewAssessment /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/fmea/assessment/:id" element={<ProtectedRoute><ModuleRoute moduleKey="FMEA"><LazyRouteBoundary><AssessmentDetail /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/fmea/risks" element={<ProtectedRoute><ModuleRoute moduleKey="FMEA"><LazyRouteBoundary><RiskCatalog /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/fmea/actions" element={<ProtectedRoute><ModuleRoute moduleKey="FMEA"><LazyRouteBoundary><Actions /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />

      {/* Analisi Reattiva - RCA placeholder */}
      <Route path="/rca" element={<ProtectedRoute><ModuleRoute moduleKey="RCA"><Navigate to="/rca/dashboard" replace /></ModuleRoute></ProtectedRoute>} />
      <Route path="/rca/dashboard" element={<ProtectedRoute><ModuleRoute moduleKey="RCA"><LazyRouteBoundary><RCADashboard /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/rca/assessments" element={<ProtectedRoute><ModuleRoute moduleKey="RCA"><LazyRouteBoundary><RCAAssessments /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/rca/assessment/new" element={<ProtectedRoute><ModuleRoute moduleKey="RCA" requiresWrite><LazyRouteBoundary><NewRCAAssessment /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/rca/assessment/:id" element={<ProtectedRoute><ModuleRoute moduleKey="RCA"><LazyRouteBoundary><RCAAssessmentDetail /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/rca/actions" element={<ProtectedRoute><ModuleRoute moduleKey="RCA"><LazyRouteBoundary><RCAActions /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />

      {/* Gap Analysis */}
      <Route path="/gap" element={<ProtectedRoute><ModuleRoute moduleKey="GAP_ANALYSIS"><Navigate to="/gap/dashboard" replace /></ModuleRoute></ProtectedRoute>} />
      <Route path="/gap/dashboard" element={<ProtectedRoute><ModuleRoute moduleKey="GAP_ANALYSIS"><LazyRouteBoundary><GapDashboard /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/gap/assessments" element={<ProtectedRoute><ModuleRoute moduleKey="GAP_ANALYSIS"><LazyRouteBoundary><GapAssessments /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/gap/assessment/new" element={<ProtectedRoute><ModuleRoute moduleKey="GAP_ANALYSIS" requiresWrite><LazyRouteBoundary><NewGapAssessment /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/gap/assessment/:id" element={<ProtectedRoute><ModuleRoute moduleKey="GAP_ANALYSIS"><LazyRouteBoundary><GapAssessmentDetail /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/gap/processes" element={<ProtectedRoute><ModuleRoute moduleKey="GAP_ANALYSIS"><LazyRouteBoundary><GapProcesses /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/gap/process/:id" element={<ProtectedRoute><ModuleRoute moduleKey="GAP_ANALYSIS"><LazyRouteBoundary><GapProcessDetail /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/gap/standards" element={<ProtectedRoute><ModuleRoute moduleKey="GAP_ANALYSIS"><LazyRouteBoundary><GapStandards /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      <Route path="/gap/actions" element={<ProtectedRoute><ModuleRoute moduleKey="GAP_ANALYSIS"><LazyRouteBoundary><GapActions /></LazyRouteBoundary></ModuleRoute></ProtectedRoute>} />
      
      {/* Redirect legacy FMEA */}
      <Route path="/dashboard" element={<Navigate to="/start" replace />} />
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
        <ModuleConfigProvider>
          <PrivacyGuardProvider>
            <AppRoutes />
          </PrivacyGuardProvider>
        </ModuleConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
