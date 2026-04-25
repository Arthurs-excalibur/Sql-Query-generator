import React, { Component, ErrorInfo } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-[480px] w-full bg-white p-10 rounded-3xl border border-[#E2E8F0] shadow-xl space-y-8 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
              <AlertCircle size={40} />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-[#1A1C1E]">Something went wrong</h1>
              <p className="text-[#64748B] text-sm leading-relaxed">
                The application encountered an unexpected error. This might be due to a broken database connection or an invalid state.
              </p>
              {this.state.error && (
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] text-[11px] font-mono text-red-600 text-left overflow-auto max-h-[100px] mt-4">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <RefreshCw size={18} />
                Refresh Application
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-white text-[#64748B] font-bold rounded-2xl border border-[#E2E8F0] flex items-center justify-center gap-3 hover:bg-[#F8FAFC] transition-all"
              >
                <Home size={18} />
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
