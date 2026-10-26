import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Church, AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary a intercepté une erreur d’exécution:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch {
      this.setState({ hasError: false });
    }
  };

  private handleClearAndReload = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('EMF_AUTH_USER');
      }
      window.location.href = '/';
    } catch {
      this.setState({ hasError: false });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4 font-sans text-slate-800">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center mx-auto border border-[#4A0E17]/20 shadow-inner">
              <Church className="w-8 h-8 text-[#6E1325]" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C99B2E] block">
                EMF SMART • Sangmelima
              </span>
              <h1 className="text-xl font-black text-[#4A0E17] tracking-tight">
                Rétablissement Automatique du Portail
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Une interruption est survenue lors du chargement des modules. Vos données paroissiales sont sécurisées.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-left flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 leading-snug">
                Les clés et données de secours ont été préservées. Cliquez ci-dessous pour actualiser le portail.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-[#C99B2E]" />
                <span>Actualiser l'Affichage</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReload}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Réinitialiser la Session Locale
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
