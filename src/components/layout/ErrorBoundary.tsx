import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary global para capturar erros de renderização.
 * Evita que um erro em um componente quebre toda a aplicação.
 *
 * Uso: envolver rotas ou seções críticas da UI.
 *
 * Para integrar com Sentry no futuro:
 * - Adicionar Sentry.captureException(error) no componentDidCatch
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // TODO: Integrar com Sentry quando disponível
    // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div
            className="max-w-md w-full rounded-lg p-8 text-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="text-4xl mb-4">⚠</div>
            <h2
              className="font-display text-lg font-bold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Algo deu errado
            </h2>
            <p
              className="text-sm font-body mb-4"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>

            {this.state.error && (
              <pre
                className="text-xs text-left p-3 rounded mb-4 overflow-auto max-h-32"
                style={{ background: 'var(--color-bg)', color: 'var(--color-danger)' }}
              >
                {this.state.error.message}
              </pre>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded text-sm font-display font-semibold"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded text-sm font-display font-semibold text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                Recarregar pagina
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
