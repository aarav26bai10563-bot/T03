import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      let parsedDetail = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message) as {
          error?: string;
          operationType?: string;
          path?: string;
        };
        if (parsed && parsed.error) {
          parsedDetail = `${parsed.error} (${parsed.operationType || 'read'} on ${parsed.path || 'database'})`;
        }
      } catch {
        // Keep plain error message
      }

      return (
        <div className="min-h-screen bg-[#070D17] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#0F1A2E] border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-semibold text-slate-100">
                Application Recovery Needed
              </h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              A database or rendering interruption occurred. Your local DEMO view remains safe to reload.
            </p>
            <div className="bg-[#070D17] border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-400 break-words">
              {parsedDetail}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
