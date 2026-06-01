import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In production you'd send to an error tracking service (Sentry, etc.)
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-1">
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Try refreshing the page. If this keeps happening, contact your administrator.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={14} /> Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Go Home
              </button>
            </div>
            {(import.meta as any).env?.DEV && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-slate-400 cursor-pointer">Stack trace</summary>
                <pre className="text-[10px] text-red-700 bg-red-50 rounded-lg p-3 mt-2 overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
