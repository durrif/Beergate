import React from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryInner extends React.Component<Props & { fallback: React.ReactNode }, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function ErrorFallback() {
  const { t } = useTranslation('common')
  return (
    <div className="flex items-center justify-center h-full min-h-48" role="alert">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
        <span className="text-5xl">⚠️</span>
        <h2 className="text-lg font-bold text-[#E8E0D4] font-display">
          {t('errors.unexpected', 'Algo salió mal')}
        </h2>
        <p className="text-sm text-[#8B9BB4] leading-relaxed">
          {t('errors.try_reload', 'Ha ocurrido un error inesperado. Intenta recargar la página.')}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent-amber/15 text-accent-amber hover:bg-accent-amber/25 transition-colors border-none cursor-pointer"
        >
          {t('actions.reload', 'Recargar')}
        </button>
      </div>
    </div>
  )
}

export function ErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundaryInner fallback={<ErrorFallback />}>
      {children}
    </ErrorBoundaryInner>
  )
}
