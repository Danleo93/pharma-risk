import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { RiskAssessment, RiskItem, ActionPlan } from '../types'
import { Plus, FileText, AlertTriangle, CheckCircle, Clock, Shield, ClipboardCheck } from 'lucide-react'
import { getFMEAAssessmentStatusColor, getFMEAAssessmentStatusLabel } from '../lib/labels'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'

export default function Dashboard() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<RiskAssessment[]>([])
  const [riskItems, setRiskItems] = useState<RiskItem[]>([])
  const [actions, setActions] = useState<ActionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Fetch assessments
    const { data: assessmentsData } = await supabase
      .from('risk_assessments')
      .select('*')
      .order('created_at', { ascending: false })

    // Fetch all risk items
    const { data: riskItemsData } = await supabase
      .from('risk_items')
      .select('*')

    // Fetch all actions
    const { data: actionsData } = await supabase
      .from('action_plans')
      .select('*')

    setAssessments(assessmentsData || [])
    setRiskItems(riskItemsData || [])
    setActions(actionsData || [])
    setLoading(false)
  }

  // Calcoli statistiche rischi
  const totalRisks = riskItems.length
  const highRisks = riskItems.filter(r => r.risk_class === 'Alta').length
  const mediumRisks = riskItems.filter(r => r.risk_class === 'Media').length
  const lowRisks = riskItems.filter(r => r.risk_class === 'Bassa').length

  const highPercent = totalRisks > 0 ? Math.round((highRisks / totalRisks) * 100) : 0
  const mediumPercent = totalRisks > 0 ? Math.round((mediumRisks / totalRisks) * 100) : 0
  const lowPercent = totalRisks > 0 ? Math.round((lowRisks / totalRisks) * 100) : 0

  // Calcoli statistiche azioni
  const totalActions = actions.length
  const completedActions = actions.filter(a => a.status === 'completed').length
  const inProgressActions = actions.filter(a => a.status === 'in_progress').length
  const plannedActions = actions.filter(a => a.status === 'planned').length
  const completedPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="clinical-page">
      <PageHeader
        title="Dashboard"
        description={`Benvenuto, ${user?.email}`}
        eyebrow="Analisi Proattiva"
        actions={(
          <Link
            to="/fmea/assessment/new"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-3 font-medium text-white transition hover:bg-sky-800"
          >
            <Plus className="w-5 h-5" />
            Nuovo Assessment
          </Link>
        )}
      />

      {/* Stats Cards - Assessment */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
        <StatCard
          label="Totale Assessment"
          value={assessments.length}
          icon={<FileText className="w-6 h-6" />}
          tone="fmea"
        />
        <StatCard
          label="In Corso"
          value={assessments.filter(a => a.status === 'in_progress').length}
          icon={<Clock className="w-6 h-6" />}
          tone="warning"
        />
        <StatCard
          label="Completati"
          value={assessments.filter(a => a.status === 'completed').length}
          icon={<CheckCircle className="w-6 h-6" />}
          tone="success"
        />
      </div>

      {/* Stats Cards - Rischi e Azioni */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Distribuzione Rischi */}
        <Card>
          <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-slate-100 text-slate-700 p-2 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Distribuzione Rischi</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Totale rischi identificati</span>
              <span className="font-bold text-slate-900">{totalRisks}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  Rischio Alto
                </span>
                <span className="font-medium">{highRisks} ({highPercent}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${highPercent}%` }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  Rischio Medio
                </span>
                <span className="font-medium">{mediumRisks} ({mediumPercent}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${mediumPercent}%` }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Rischio Basso
                </span>
                <span className="font-medium">{lowRisks} ({lowPercent}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${lowPercent}%` }}></div>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Stato Azioni Correttive */}
        <Card>
          <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-50 text-orange-700 p-2 rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Azioni Correttive</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Totale azioni</span>
              <span className="font-bold text-slate-900">{totalActions}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 py-2">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{plannedActions}</p>
                <p className="text-xs text-gray-500">Pianificate</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{inProgressActions}</p>
                <p className="text-xs text-gray-500">In Corso</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{completedActions}</p>
                <p className="text-xs text-gray-500">Completate</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Completamento</span>
                <span className="font-medium text-green-600">{completedPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${completedPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment List */}
      <Card>
        <CardHeader>
          <CardTitle>I tuoi Risk Assessment</CardTitle>
        </CardHeader>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Caricamento...
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<AlertTriangle className="w-6 h-6" />}
              title="Non hai ancora creato nessun assessment"
              action={(
                <Link
                  to="/fmea/assessment/new"
                  className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-800 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Crea il tuo primo assessment
                </Link>
              )}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {assessments.map((assessment) => (
              <Link
                key={assessment.id}
                to={`/fmea/assessment/${assessment.id}`}
                className="flex items-center justify-between p-6 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(assessment.status)}
                  <div>
                    <h3 className="font-medium text-slate-900">{assessment.title}</h3>
                    <p className="text-sm text-slate-500">
                      Creato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFMEAAssessmentStatusColor(assessment.status)}`}>
                  {getFMEAAssessmentStatusLabel(assessment.status)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
