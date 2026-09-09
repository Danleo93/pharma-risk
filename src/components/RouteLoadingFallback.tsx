export function RouteLoadingFallback() {
  return (
    <div
      className="clinical-page flex min-h-[45vh] items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">Caricamento sezione...</p>
      </div>
    </div>
  )
}
