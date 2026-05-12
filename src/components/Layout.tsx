import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  BookOpen,
  BookMarked,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Layers3,
  LogOut,
  Mail,
  Menu,
  SearchCheck,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/ui'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  activeMatch?: string[]
}

type SectionKey = 'fmea' | 'rca' | 'gap'

interface NavSection {
  key: SectionKey
  title: string
  subtitle: string
  description: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    key: 'fmea',
    title: 'FMEA',
    subtitle: 'Analisi Proattiva',
    description: 'Prevenzione rischi',
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
    description: 'Eventi e cause',
    items: [
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
    key: 'gap',
    title: 'GAP',
    subtitle: 'Gap Analysis',
    description: 'Conformita e scostamenti',
    items: [
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

const generalItems: NavItem[] = [
  { path: '/settings', label: 'Impostazioni', icon: Settings },
  { path: '/docs', label: 'Guida', icon: BookOpen },
  { path: '/contacts', label: 'Contatti', icon: Mail },
]

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openSection, setOpenSection] = useState<SectionKey | null>(() => {
    if (location.pathname.startsWith('/gap')) return 'gap'
    if (location.pathname.startsWith('/rca')) return 'rca'
    if (location.pathname.startsWith('/fmea')) return 'fmea'
    return null
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    if (location.pathname.startsWith('/gap')) {
      setOpenSection('gap')
    } else if (location.pathname.startsWith('/rca')) {
      setOpenSection('rca')
    } else if (location.pathname.startsWith('/fmea')) {
      setOpenSection('fmea')
    }
  }, [location.pathname])

  const isActive = (item: NavItem) => {
    const matches = item.activeMatch || [item.path]
    return matches.some((path) => {
      if (path === '/') return location.pathname === '/'
      return location.pathname === path || location.pathname.startsWith(`${path}/`)
    })
  }

  const getSectionTone = (section: NavSection) => {
    if (section.key === 'rca') {
      return {
          icon: 'bg-amber-50 text-amber-700 ring-amber-100',
          expanded: 'border-amber-200 bg-amber-50 text-amber-900 shadow-clinical-soft',
          collapsed:
            'border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-900',
          itemActive: 'border-amber-200 bg-amber-50 text-amber-700 shadow-clinical-soft',
          itemInactive: 'border-transparent text-slate-600 hover:bg-amber-50 hover:text-amber-900',
        }
    }

    if (section.key === 'gap') {
      return {
        icon: 'bg-teal-50 text-teal-700 ring-teal-100',
        expanded: 'border-teal-200 bg-teal-50/80 text-teal-900 shadow-clinical-soft',
        collapsed:
          'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50/70 hover:text-teal-900',
        itemActive: 'border-teal-200 bg-teal-50 text-teal-700 shadow-clinical-soft',
        itemInactive: 'border-transparent text-slate-600 hover:bg-teal-50 hover:text-teal-900',
      }
    }

    return {
      icon: 'bg-sky-50 text-sky-700 ring-sky-100',
      expanded: 'border-sky-200 bg-sky-50/80 text-sky-900 shadow-clinical-soft',
      collapsed:
        'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/70 hover:text-sky-900',
      itemActive: 'border-sky-200 bg-sky-50 text-sky-700 shadow-clinical-soft',
      itemInactive: 'border-transparent text-slate-600 hover:bg-sky-50 hover:text-sky-900',
    }
  }

  const getSectionIcon = (section: NavSection) => {
    if (section.key === 'fmea') return SearchCheck
    if (section.key === 'rca') return AlertTriangle
    if (section.key === 'gap') return ClipboardList
    return LayoutDashboard
  }

  const getSectionBadge = (section: NavSection) => {
    if (section.key === 'rca') return 'Reactive'
    if (section.key === 'gap') return 'Compliance'
    return 'Proactive'
  }

  return (
    <div className="flex min-h-screen bg-clinical">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Chiudi menu"
          className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-72 transform border-r border-slate-200 bg-white/95 shadow-clinical transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="group flex min-w-0 items-center gap-3"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-700 text-white shadow-clinical-soft transition group-hover:bg-sky-800">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-xl font-bold tracking-tight text-slate-950">
                    PhaRMA T
                  </span>
                  <span className="block truncate text-xs font-medium uppercase tracking-wide text-slate-500">
                    Clinical Risk Suite
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
                aria-label="Chiudi menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
            <div className="space-y-3">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Moduli metodologici
              </p>

              {navSections.map((section) => {
                const expanded = openSection === section.key
                const SectionIcon = getSectionIcon(section)
                const tone = getSectionTone(section)

                return (
                  <div key={section.key} className="space-y-2">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpenSection(expanded ? null : section.key)}
                      className={cn(
                        'min-h-20 w-full rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                        expanded ? tone.expanded : tone.collapsed,
                      )}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1', tone.icon)}>
                            <SectionIcon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-bold uppercase tracking-wide">{section.title}</span>
                              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                {getSectionBadge(section)}
                              </span>
                            </span>
                            <span className="block truncate text-xs font-semibold opacity-90">
                              {section.subtitle}
                            </span>
                            <span className="mt-0.5 block truncate text-xs opacity-70">
                              {section.description}
                            </span>
                          </span>
                        </span>
                        {expanded ? (
                          <ChevronDown className="h-5 w-5 shrink-0" />
                        ) : (
                          <ChevronRight className="h-5 w-5 shrink-0" />
                        )}
                      </span>
                    </button>

                    {expanded && (
                      <div className="space-y-1 border-l border-slate-200 pl-3 ml-5">
                        {section.items.map((item) => {
                          const Icon = item.icon
                          const active = isActive(item)

                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition',
                                active ? tone.itemActive : tone.itemInactive,
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-2 space-y-1 border-t border-slate-100 pt-5">
              <p className="px-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Strumenti
              </p>
              <div className="space-y-1 pt-2">
                {generalItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item)

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                        active
                          ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Connesso come</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Esci
            </button>
          </div>

          <div className="border-t border-slate-100 px-4 py-4">
            <p className="text-center text-xs leading-relaxed text-slate-400">
              Ideato e sviluppato da<br />
              <span className="font-medium text-slate-500">Dott. Daniele Leonardi Vinci, PharmD</span>
            </p>
            <p className="mt-2 text-center text-xs text-slate-400">
              Copyright 2025. Tutti i diritti riservati.
            </p>
            <div className="mt-2 flex justify-center gap-3">
              <Link to="/privacy" className="text-xs text-slate-400 hover:text-sky-700">
                Privacy
              </Link>
              <span className="text-slate-300">-</span>
              <Link to="/terms" className="text-xs text-slate-400 hover:text-sky-700">
                Termini
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              aria-label="Apri menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center gap-2 font-bold text-slate-950">
              <ShieldCheck className="h-5 w-5 text-sky-700" />
              PhaRMA T
            </Link>
            <div className="h-10 w-10" aria-hidden="true" />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
