import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Broadsheet ErrorBoundary caught an exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 font-serif">
          <div className="max-w-lg w-full bg-white border-2 border-[#581A20]/30 rounded-lg p-8 shadow-lg text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#581A20]/10 text-[#581A20] flex items-center justify-center mx-auto border-2 border-[#581A20]/20">
              <AlertTriangle className="w-8 h-8 text-[#581A20]" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-widest font-bold text-[#C5A059] block">
                Madras Christian College • Broadsheet Dispatch Desk
              </span>
              <h2 className="text-2xl font-black text-gray-950 tracking-tight">
                Gazette Press Notice: Temporary Interruption
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                A rendering exception occurred while composing this edition. Please reload the press room or return to the front page.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-left overflow-x-auto text-[11px] font-mono text-red-800 max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 bg-[#581A20] text-white rounded text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#431419] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
              >
                <Home className="w-3.5 h-3.5 text-gray-500" />
                <span>Front Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
