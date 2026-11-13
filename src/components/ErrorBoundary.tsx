import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F8FB] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-6 text-center shadow-sm">
            <h1 className="font-display text-xl font-bold text-slate-900">
              Terjadi Gangguan Tampilan
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Silakan muat ulang halaman untuk melanjutkan lomba.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 px-5 py-2.5 font-display font-bold text-slate-950 cursor-pointer"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
