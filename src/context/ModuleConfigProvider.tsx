import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  MODULE_DEFINITIONS,
  MODULE_KEYS,
  isModuleStatus,
  type ModuleKey,
  type RuntimeModuleStatus,
} from '../config/modules'
import {
  getRuntimeSnapshot,
  replaceModuleRuntimeState,
  resetModuleRuntimeState,
  type RuntimeModuleState,
} from '../lib/moduleRuntime'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { ModuleConfigContext, type ModuleConfigContextValue } from './ModuleConfigContext'

interface ModuleConfigProviderProps {
  children: ReactNode
}

interface AppModuleRow {
  module_key: string
  status: string
  allow_export_in_read_only: boolean
}

const isModuleKey = (value: string): value is ModuleKey => (
  MODULE_KEYS.some((moduleKey) => moduleKey === value)
)

export function ModuleConfigProvider({ children }: ModuleConfigProviderProps) {
  const { user } = useAuth()
  const [modules, setModules] = useState<Record<ModuleKey, RuntimeModuleState>>(
    () => getRuntimeSnapshot(),
  )
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const loading = Boolean(user) && loadedForUserId !== user?.id

  const refresh = useCallback(async () => {
    if (!user) {
      resetModuleRuntimeState()
      setModules(getRuntimeSnapshot())
      setError(null)
      setLoadedForUserId(null)
      return
    }

    const { data, error: queryError } = await supabase
      .from('app_modules')
      .select('module_key, status, allow_export_in_read_only')

    if (queryError) {
      resetModuleRuntimeState()
      setModules(getRuntimeSnapshot())
      setError('Configurazione dei moduli non disponibile. Le funzioni operative sono state sospese.')
      setLoadedForUserId(user.id)
      return
    }

    const records = (data as AppModuleRow[])
      .filter((row) => isModuleKey(row.module_key) && isModuleStatus(row.status))
      .map((row) => ({
        moduleKey: row.module_key as ModuleKey,
        status: row.status as 'enabled' | 'read_only' | 'disabled',
        allowExportInReadOnly: row.allow_export_in_read_only === true,
      }))

    replaceModuleRuntimeState(records)
    const snapshot = getRuntimeSnapshot()
    const hasUnknownModule = MODULE_KEYS.some((moduleKey) => snapshot[moduleKey].status === 'unknown')
    setModules(snapshot)
    setError(hasUnknownModule
      ? 'Configurazione incompleta. I moduli senza configurazione restano non disponibili.'
      : null)
    setLoadedForUserId(user.id)
  }, [user])

  useEffect(() => {
    const initialRefreshId = window.setTimeout(() => {
      void refresh()
    }, 0)

    if (!user) {
      return () => window.clearTimeout(initialRefreshId)
    }

    const intervalId = window.setInterval(() => {
      void refresh()
    }, 60_000)
    const refreshOnForeground = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    window.addEventListener('focus', refreshOnForeground)
    document.addEventListener('visibilitychange', refreshOnForeground)
    return () => {
      window.clearTimeout(initialRefreshId)
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshOnForeground)
      document.removeEventListener('visibilitychange', refreshOnForeground)
    }
  }, [refresh, user])

  const value = useMemo<ModuleConfigContextValue>(() => {
    const getStatus = (moduleKey: ModuleKey): RuntimeModuleStatus => modules[moduleKey].status
    const isReadable = (moduleKey: ModuleKey) => {
      const status = getStatus(moduleKey)
      return status === 'enabled' || status === 'read_only'
    }

    return {
      loading,
      error,
      getStatus,
      isVisible: isReadable,
      isReadable,
      isWritable: (moduleKey) => getStatus(moduleKey) === 'enabled',
      canExport: (moduleKey) => {
        const module = modules[moduleKey]
        return module.status === 'enabled'
          || (module.status === 'read_only' && module.allowExportInReadOnly)
      },
      getDefaultAvailableRoute: () => (
        MODULE_DEFINITIONS
          .filter((module) => isReadable(module.key))
          .sort((first, second) => first.order - second.order)[0]?.dashboardRoute ?? null
      ),
      refresh,
    }
  }, [error, loading, modules, refresh])

  return (
    <ModuleConfigContext.Provider value={value}>
      {children}
    </ModuleConfigContext.Provider>
  )
}
