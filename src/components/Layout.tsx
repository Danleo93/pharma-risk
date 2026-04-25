import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  FileText, 
  AlertTriangle, 
  CheckSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  BookOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  activeMatch?: string[]
}

type SectionKey = 'fmea' | 'rca'

interface NavSection {
  key: SectionKey
  title: string
  subtitle: string
  items: NavItem[]
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openSection, setOpenSection] = useState<SectionKey | null>(() => {
    if (location.pathname.startsWith('/rca')) return 'rca'
    if (location.pathname.startsWith('/fmea')) return 'fmea'
    return null
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    if (location.pathname.startsWith('/rca')) {
      setOpenSection('rca')
    } else if (location.pathname.startsWith('/fmea')) {
      setOpenSection('fmea')
    }
  }, [location.pathname])

  const navSections: NavSection[] = [
    {
      key: 'fmea',
      title: 'FMEA',
      subtitle: 'Analisi Proattiva',
      items: [
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
      key: 'rca',
      title: 'RCA',
      subtitle: 'Analisi Reattiva',
      items: [
        { path: '/rca/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/rca/assessments', label: 'Assessment', icon: FileText },
        { path: '/rca/actions', label: 'Azioni Correttive', icon: CheckSquare },
      ],
    },
  ]

  const generalItems: NavItem[] = [
    { path: '/settings', label: 'Impostazioni', icon: Settings },
    { path: '/docs', label: 'Guida', icon: BookOpen },
  ]

  const isActive = (item: NavItem) => {
    const matches = item.activeMatch || [item.path]
    return matches.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))
  }

  const getSectionClasses = (section: NavSection, expanded: boolean) => {
    if (section.key === 'rca') {
      return expanded
        ? 'border-orange-200 bg-orange-50 text-orange-800'
        : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/60 hover:text-orange-800'
    }

    return expanded
      ? 'border-sky-200 bg-sky-50 text-sky-800'
      : 'border-gray-200 bg-white text-gray-700 hover:border-sky-200 hover:bg-sky-50/60 hover:text-sky-800'
  }

  const getActiveItemClasses = (section: NavSection) => {
    return section.key === 'rca'
      ? 'bg-orange-50 text-orange-700'
      : 'bg-sky-50 text-sky-700'
  }

  const getInactiveItemClasses = (section: NavSection) => {
    return section.key === 'rca'
      ? 'text-gray-600 hover:bg-orange-50/70 hover:text-orange-800'
      : 'text-gray-600 hover:bg-sky-50/70 hover:text-sky-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">PhaRMA T</span>
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
            {navSections.map((section) => {
              const expanded = openSection === section.key
              const SectionIcon = section.key === 'rca' ? AlertTriangle : LayoutDashboard

              return (
                <div key={section.key}>
                  <button
                    type="button"
                    onClick={() => setOpenSection(expanded ? null : section.key)}
                    className={`
                      w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-left transition
                      ${getSectionClasses(section, expanded)}
                    `}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <SectionIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold uppercase tracking-wide">
                          {section.title}
                        </span>
                        <span className="block text-xs font-medium opacity-80 truncate">
                          {section.subtitle}
                        </span>
                      </span>
                    </span>
                    {expanded ? (
                      <ChevronDown className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 flex-shrink-0" />
                    )}
                  </button>

                  {expanded && (
                    <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition
                          ${isActive(item)
                            ? getActiveItemClasses(section)
                            : getInactiveItemClasses(section)}
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    )
                  })}
                    </div>
                  )}
                </div>
              )
            })}

            <div>
              <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Generale
              </p>
              <div className="space-y-1">
                {generalItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition
                        ${isActive(item)
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

{/* User section */}
<div className="p-4 border-t border-gray-100">
  <div className="px-4 py-2 mb-2">
    <p className="text-sm text-gray-500">Connesso come</p>
    <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
  </div>
  <button
    onClick={handleSignOut}
    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
  >
    <LogOut className="w-5 h-5" />
    Esci
  </button>
</div>

{/* Credits e Copyright */}
<div className="p-4 border-t border-gray-100">
  <p className="text-xs text-gray-400 text-center leading-relaxed">
    Ideato e sviluppato da<br />
    <span className="font-medium text-gray-500">Dott. Daniele Leonardi Vinci, PharmD</span>
  </p>
  <p className="text-xs text-gray-400 text-center mt-2">
    © 2025 Tutti i diritti riservati
  </p>
  <div className="flex justify-center gap-3 mt-2">
    <Link to="/privacy" className="text-xs text-gray-400 hover:text-sky-600">Privacy</Link>
    <span className="text-gray-300">•</span>
    <Link to="/terms" className="text-xs text-gray-400 hover:text-sky-600">Termini</Link>
  </div>
</div>

        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-gray-800">PhaRMA T</span>
            <div className="w-6" /> {/* Spacer */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
