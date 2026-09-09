import { createContext } from 'react'
import type { ModuleKey, RuntimeModuleStatus } from '../config/modules'

export interface ModuleConfigContextValue {
  loading: boolean
  error: string | null
  getStatus: (moduleKey: ModuleKey) => RuntimeModuleStatus
  isVisible: (moduleKey: ModuleKey) => boolean
  isReadable: (moduleKey: ModuleKey) => boolean
  isWritable: (moduleKey: ModuleKey) => boolean
  canExport: (moduleKey: ModuleKey) => boolean
  getDefaultAvailableRoute: () => string | null
  refresh: () => Promise<void>
}

export const ModuleConfigContext = createContext<ModuleConfigContextValue | undefined>(undefined)

