import { useEffect, useState, type ReactNode } from 'react'
import type { ModuleKey } from '../../config/modules'
import { useModuleConfig } from '../../context/useModuleConfig'
import { ModuleUnavailable } from './ModuleUnavailable'

interface ModuleRouteProps {
  moduleKey: ModuleKey
  children: ReactNode
  requiresWrite?: boolean
}

interface WriteBlockedEventDetail {
  moduleKey: ModuleKey
  message: string
}

export function ModuleRoute({ moduleKey, children, requiresWrite = false }: ModuleRouteProps) {
  const { loading, error, getStatus, isReadable, isWritable } = useModuleConfig()
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  useEffect(() => {
    const handleBlockedWrite = (event: Event) => {
      const detail = (event as CustomEvent<WriteBlockedEventDetail>).detail
      if (detail?.moduleKey !== moduleKey) return
      setBlockedMessage(detail.message)
      window.setTimeout(() => setBlockedMessage(null), 6_000)
    }
    window.addEventListener('pharmat:module-write-blocked', handleBlockedWrite)
    return () => window.removeEventListener('pharmat:module-write-blocked', handleBlockedWrite)
  }, [moduleKey])

  if (loading) {
    return (
      <div className="clinical-page flex min-h-[45vh] items-center justify-center">
        <p className="text-sm text-slate-500">Verifica disponibilita del modulo...</p>
      </div>
    )
  }

  if (!isReadable(moduleKey)) {
    return <ModuleUnavailable moduleKey={moduleKey} configurationError={error} />
  }

  if (requiresWrite && !isWritable(moduleKey)) {
    return <ModuleUnavailable moduleKey={moduleKey} readOnlyWriteRoute />
  }

  const readOnly = getStatus(moduleKey) === 'read_only'
  return (
    <>
      {readOnly && (
        <div className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-[1500px] rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Modulo in sola lettura: puoi consultare ed esportare i dati, ma non modificarli.
        </div>
      )}
      {blockedMessage && (
        <div className="fixed right-4 top-4 z-[100] max-w-md rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-amber-900 shadow-lg">
          {blockedMessage}
        </div>
      )}
      {children}
    </>
  )
}

