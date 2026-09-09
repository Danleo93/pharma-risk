import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  BookMarked,
  CheckSquare,
  ClipboardList,
  FileText,
  Layers3,
  LayoutDashboard,
  SearchCheck,
} from 'lucide-react'

export const MODULE_KEYS = ['FMEA', 'RCA', 'GAP_ANALYSIS'] as const

export type ModuleKey = (typeof MODULE_KEYS)[number]
export type ModuleStatus = 'enabled' | 'read_only' | 'disabled'
export type RuntimeModuleStatus = ModuleStatus | 'unknown'

export interface ModuleNavigationItem {
  path: string
  label: string
  icon: LucideIcon
  activeMatch?: string[]
}

export interface ModuleDefinition {
  key: ModuleKey
  sectionKey: 'fmea' | 'rca' | 'gap'
  tag: string
  label: string
  title: string
  subtitle: string
  description: string
  homeDescription: string
  routePrefix: string
  dashboardRoute: string
  order: number
  icon: LucideIcon
  badgeLabel: string
  badgeVariant: 'fmea' | 'rca' | 'success'
  iconClass: string
  topClass: string
  linkClass: string
  navigation: ModuleNavigationItem[]
}

export const MODULE_DEFINITIONS: readonly ModuleDefinition[] = [
  {
    key: 'FMEA',
    sectionKey: 'fmea',
    tag: 'FMEA',
    label: 'FMEA',
    title: 'Analisi Proattiva',
    subtitle: 'Analisi Proattiva',
    description: 'Prevenzione rischi',
    homeDescription: 'Valutazione preventiva dei rischi, catalogo, assessment e azioni correttive.',
    routePrefix: '/fmea',
    dashboardRoute: '/fmea/dashboard',
    order: 1,
    icon: SearchCheck,
    badgeLabel: 'Proactive',
    badgeVariant: 'fmea',
    iconClass: 'bg-sky-50 text-sky-700 ring-sky-100',
    topClass: 'bg-sky-500',
    linkClass: 'hover:border-sky-300 hover:bg-sky-50 focus-visible:ring-sky-500',
    navigation: [
      { path: '/fmea/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      {
        path: '/fmea/assessments',
        label: 'Assessment',
        icon: FileText,
        activeMatch: ['/fmea/assessments', '/fmea/assessment'],
      },
      { path: '/fmea/risks', label: 'Catalogo Rischi', icon: AlertTriangle },
      { path: '/fmea/actions', label: 'Azioni Correttive', icon: CheckSquare },
    ],
  },
  {
    key: 'RCA',
    sectionKey: 'rca',
    tag: 'RCA',
    label: 'RCA',
    title: 'Analisi Reattiva',
    subtitle: 'Analisi Reattiva',
    description: 'Eventi e cause',
    homeDescription: 'Analisi di eventi, cause radice, 5 Whys e piano di azioni conseguenti.',
    routePrefix: '/rca',
    dashboardRoute: '/rca/dashboard',
    order: 2,
    icon: AlertTriangle,
    badgeLabel: 'Reactive',
    badgeVariant: 'rca',
    iconClass: 'bg-amber-50 text-amber-700 ring-amber-100',
    topClass: 'bg-amber-500',
    linkClass: 'hover:border-amber-300 hover:bg-amber-50 focus-visible:ring-amber-500',
    navigation: [
      { path: '/rca/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      {
        path: '/rca/assessments',
        label: 'Assessment',
        icon: FileText,
        activeMatch: ['/rca/assessments', '/rca/assessment'],
      },
      { path: '/rca/actions', label: 'Azioni Correttive', icon: CheckSquare },
    ],
  },
  {
    key: 'GAP_ANALYSIS',
    sectionKey: 'gap',
    tag: 'GAP',
    label: 'Gap Analysis',
    title: 'Gap Analysis',
    subtitle: 'Gap Analysis',
    description: 'Conformita e scostamenti',
    homeDescription: 'Verifica di conformita, requisiti, norme, gap operativi e azioni correttive.',
    routePrefix: '/gap',
    dashboardRoute: '/gap/dashboard',
    order: 3,
    icon: ClipboardList,
    badgeLabel: 'Compliance',
    badgeVariant: 'success',
    iconClass: 'bg-teal-50 text-teal-700 ring-teal-100',
    topClass: 'bg-teal-500',
    linkClass: 'hover:border-teal-300 hover:bg-teal-50 focus-visible:ring-teal-500',
    navigation: [
      { path: '/gap/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      {
        path: '/gap/assessments',
        label: 'Assessment',
        icon: FileText,
        activeMatch: ['/gap/assessments', '/gap/assessment'],
      },
      {
        path: '/gap/processes',
        label: 'Processi',
        icon: Layers3,
        activeMatch: ['/gap/processes', '/gap/process'],
      },
      { path: '/gap/standards', label: 'Norme', icon: BookMarked },
      { path: '/gap/actions', label: 'Azioni', icon: CheckSquare },
    ],
  },
]

export const MODULE_TABLES: Readonly<Record<ModuleKey, readonly string[]>> = {
  FMEA: [
    'areas',
    'processes',
    'process_steps',
    'risk_assessments',
    'risk_catalog_base',
    'risk_catalog_user',
    'risk_items',
    'control_measures',
    'action_plans',
    'user_custom_risks',
  ],
  RCA: [
    'rca_assessments',
    'rca_causes',
    'rca_fishbone_diagrams',
    'rca_fishbone_branches',
    'rca_fishbone_causes',
    'rca_five_why_chains',
    'rca_five_why_steps',
    'rca_action_plans',
  ],
  GAP_ANALYSIS: [
    'gap_processes',
    'gap_areas',
    'gap_activities',
    'gap_standards',
    'gap_activity_standards',
    'gap_assessments',
    'gap_assessment_processes',
    'gap_activity_evaluations',
    'gap_actions',
    'gap_action_events',
    'gap_links',
  ],
}

const TABLE_TO_MODULE = Object.fromEntries(
  MODULE_KEYS.flatMap((moduleKey) => (
    MODULE_TABLES[moduleKey].map((tableName) => [tableName, moduleKey])
  )),
) as Record<string, ModuleKey>

export const isModuleStatus = (value: unknown): value is ModuleStatus => (
  value === 'enabled' || value === 'read_only' || value === 'disabled'
)

export const getModuleDefinition = (moduleKey: ModuleKey) => (
  MODULE_DEFINITIONS.find((module) => module.key === moduleKey) as ModuleDefinition
)

export const getModuleForTable = (tableName: string) => TABLE_TO_MODULE[tableName]
