import { createClient } from '@supabase/supabase-js'
import { getModuleForTable, type ModuleKey } from '../config/modules'
import { getRuntimeModuleState, isRuntimeModuleWritable } from './moduleRuntime'
import { scanPrivacyPayload } from './privacyDetector'
import { requestPrivacyReview } from './privacyRuntime'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const nativeFetch = globalThis.fetch.bind(globalThis)

const getRequestedTable = (input: RequestInfo | URL) => {
  const rawUrl = input instanceof Request ? input.url : String(input)
  try {
    const url = new URL(rawUrl)
    const match = url.pathname.match(/\/rest\/v1\/([^/?]+)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

const notifyBlockedWrite = (moduleKey: ModuleKey, message: string) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('pharmat:module-write-blocked', {
    detail: { moduleKey, message },
  }))
}

const getRequestPayload = async (input: RequestInfo | URL, init?: RequestInit) => {
  const body = init?.body
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as unknown
    } catch {
      return null
    }
  }

  if (input instanceof Request) {
    try {
      const contentType = input.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) return null
      return await input.clone().json() as unknown
    } catch {
      return null
    }
  }

  return null
}

const moduleAwareFetch: typeof fetch = async (input, init) => {
  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
  if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
    const tableName = getRequestedTable(input)
    const moduleKey = tableName ? getModuleForTable(tableName) : undefined

    if (moduleKey && !isRuntimeModuleWritable(moduleKey)) {
      const status = getRuntimeModuleState(moduleKey).status
      const message = status === 'read_only'
        ? 'Il modulo e in sola lettura. Le modifiche non sono consentite.'
        : 'Il modulo non e attualmente disponibile per modifiche.'
      notifyBlockedWrite(moduleKey, message)

      return new Response(JSON.stringify({
        code: 'MODULE_WRITE_BLOCKED',
        message,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (tableName && (method === 'POST' || method === 'PATCH')) {
      const payload = await getRequestPayload(input, init)
      const findings = scanPrivacyPayload(tableName, payload)
      if (findings.length > 0) {
        const approved = await requestPrivacyReview({ tableName, findings })
        if (!approved) {
          return new Response(JSON.stringify({
            code: 'PRIVACY_REVIEW_CANCELLED',
            message: 'Salvataggio annullato per consentire la revisione dei contenuti.',
          }), {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }
  }

  return nativeFetch(input, init)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: moduleAwareFetch },
})
