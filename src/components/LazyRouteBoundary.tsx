import { Component, Suspense, type ReactNode } from 'react'
import { RouteLoadingFallback } from './RouteLoadingFallback'

interface LazyRouteBoundaryProps {
  children: ReactNode
}

interface LazyRouteBoundaryState {
  hasError: boolean
}

class LazyRouteErrorBoundary extends Component<LazyRouteBoundaryProps, LazyRouteBoundaryState> {
  state: LazyRouteBoundaryState = { hasError: false }

  static getDerivedStateFromError(): LazyRouteBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="clinical-page flex min-h-[45vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">Sezione non disponibile</h1>
            <p className="mt-2 text-sm text-slate-600">
              Non è stato possibile caricare questa sezione. Verifica la connessione e riprova.
            </p>
            <button
              type="button"
              className="mt-5 rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              onClick={() => window.location.reload()}
            >
              Ricarica la pagina
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function LazyRouteBoundary({ children }: LazyRouteBoundaryProps) {
  return (
    <LazyRouteErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
    </LazyRouteErrorBoundary>
  )
}
