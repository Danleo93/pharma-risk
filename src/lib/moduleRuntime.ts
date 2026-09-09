import {
  MODULE_KEYS,
  type ModuleKey,
  type ModuleStatus,
  type RuntimeModuleStatus,
} from '../config/modules'

export interface RuntimeModuleState {
  status: RuntimeModuleStatus
  allowExportInReadOnly: boolean
}

export interface RuntimeModuleRecord {
  moduleKey: ModuleKey
  status: ModuleStatus
  allowExportInReadOnly: boolean
}

const createUnknownState = (): Record<ModuleKey, RuntimeModuleState> => ({
  FMEA: { status: 'unknown', allowExportInReadOnly: false },
  RCA: { status: 'unknown', allowExportInReadOnly: false },
  GAP_ANALYSIS: { status: 'unknown', allowExportInReadOnly: false },
})

let runtimeState = createUnknownState()

export const resetModuleRuntimeState = () => {
  runtimeState = createUnknownState()
}

export const replaceModuleRuntimeState = (records: RuntimeModuleRecord[]) => {
  const nextState = createUnknownState()
  for (const record of records) {
    nextState[record.moduleKey] = {
      status: record.status,
      allowExportInReadOnly: record.allowExportInReadOnly,
    }
  }
  runtimeState = nextState
}

export const getRuntimeModuleState = (moduleKey: ModuleKey) => runtimeState[moduleKey]

export const isRuntimeModuleWritable = (moduleKey: ModuleKey) => (
  runtimeState[moduleKey].status === 'enabled'
)

export const canRuntimeModuleExport = (moduleKey: ModuleKey) => {
  const module = runtimeState[moduleKey]
  return module.status === 'enabled'
    || (module.status === 'read_only' && module.allowExportInReadOnly)
}

const notifyBlockedOperation = (moduleKey: ModuleKey, message: string) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('pharmat:module-write-blocked', {
    detail: { moduleKey, message },
  }))
}

export const ensureRuntimeModuleCanExport = (moduleKey: ModuleKey) => {
  if (canRuntimeModuleExport(moduleKey)) return true
  notifyBlockedOperation(moduleKey, 'Export non disponibile per lo stato corrente del modulo.')
  return false
}

export const assertRuntimeModuleCanExport = (moduleKey: ModuleKey) => {
  if (!ensureRuntimeModuleCanExport(moduleKey)) {
    throw new Error('Export non disponibile per lo stato corrente del modulo.')
  }
}

export const getRuntimeSnapshot = () => Object.fromEntries(
  MODULE_KEYS.map((moduleKey) => [moduleKey, { ...runtimeState[moduleKey] }]),
) as Record<ModuleKey, RuntimeModuleState>
