import { useContext } from 'react'
import { ModuleConfigContext } from './ModuleConfigContext'

export const useModuleConfig = () => {
  const context = useContext(ModuleConfigContext)
  if (!context) {
    throw new Error('useModuleConfig deve essere usato dentro ModuleConfigProvider.')
  }
  return context
}

