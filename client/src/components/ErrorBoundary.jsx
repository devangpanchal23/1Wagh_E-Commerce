import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled Application Render Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env && import.meta.env.DEV);

      return (
        <div className="min-h-screen bg-wagh-bg flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-wagh-border shadow-soft p-6 sm:p-8 space-y-6 text-center animate-fade-in">
            
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-amber-100/80 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Error Copy */}
            <div className="space-y-2">
              <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-wagh-dark">
                Something went wrong
              </h2>
              <p className="text-wagh-muted text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                An unexpected display error occurred while rendering this component. Please refresh or return home.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-wagh-teal text-white font-extrabold text-xs sm:text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-wagh-dark border border-wagh-border font-bold text-xs sm:text-sm hover:bg-gray-50 hover:border-wagh-teal transition-all duration-200 shadow-sm cursor-pointer"
              >
                <Home className="w-4 h-4 text-wagh-teal" />
                <span>Go to Home</span>
              </button>
            </div>

            {/* Development Mode Error Inspection Drawer */}
            {isDev && this.state.error && (
              <div className="mt-6 text-left pt-4 border-t border-wagh-border">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showStack: !prev.showStack }))}
                  className="w-full flex items-center justify-between text-xs font-mono-tag font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-600" />
                    <span>Developer Error Trace (DEV ONLY)</span>
                  </div>
                  {this.state.showStack ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {this.state.showStack && (
                  <div className="mt-3 p-4 bg-slate-900 text-rose-300 font-mono text-xs rounded-xl overflow-x-auto max-h-64 space-y-2 border border-slate-800 shadow-inner">
                    <p className="font-bold text-white border-b border-slate-800 pb-1">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="whitespace-pre-wrap text-[11px] leading-normal text-slate-300">
                        {this.state.error.stack}
                      </pre>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div className="pt-2 border-t border-slate-800">
                        <p className="font-bold text-amber-400">Component Stack:</p>
                        <pre className="whitespace-pre-wrap text-[10px] leading-normal text-slate-400">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
