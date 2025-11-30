import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { RiskAssessment, RiskItem, ActionPlan } from '../types'
import { Plus, FileText, AlertTriangle, CheckCircle, Clock, Shield, ClipboardCheck } from 'lucide-react'

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completato'
      case 'in_progress':
        return 'In corso'
      default:
        return 'Bozza'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Benvenuto, {user?.email}
          </p>
        </div>
        <Link
          to="/assessment/new"
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-lg font-medium transition"
        >
          <Plus className="w-5 h-5" />
          Nuovo Assessment
        </Link>
      </div>

      {/* Stats Cards - Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-sky-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Totale Assessment</p>
              <p className="text-2xl font-bold text-gray-800">{assessments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">In Corso</p>
              <p className="text-2xl font-bold text-gray-800">
                {assessments.filter(a => a.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Completati</p>
              <p className="text-2xl font-bold text-gray-800">
                {assessments.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Rischi e Azioni */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Distribuzione Rischi */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Distribuzione Rischi</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Totale rischi identificati</span>
              <span className="font-bold text-gray-800">{totalRisks}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  Rischio Alto
                </span>
                <span className="font-medium">{highRisks} ({highPercent}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
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
              <div className="w-full bg-gray-200 rounded-full h-2">
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${lowPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stato Azioni Correttive */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <ClipboardCheck className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Azioni Correttive</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Totale azioni</span>
              <span className="font-bold text-gray-800">{totalActions}</span>
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
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${completedPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">I tuoi Risk Assessment</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Caricamento...
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Non hai ancora creato nessun assessment</p>
            <Link
              to="/assessment/new"
              className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Crea il tuo primo assessment
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {assessments.map((assessment) => (
              <Link
                key={assessment.id}
                to={`/assessment/${assessment.id}`}
                className="flex items-center justify-between p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(assessment.status)}
                  <div>
                    <h3 className="font-medium text-gray-800">{assessment.title}</h3>
                    <p className="text-sm text-gray-500">
                      Creato il {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}>
                  {getStatusLabel(assessment.status)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}