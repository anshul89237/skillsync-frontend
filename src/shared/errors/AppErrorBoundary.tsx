import React from 'react';

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  public constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    console.error('AppErrorBoundary caught an error', error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-app px-6 py-10 text-ink">
          <div className="w-full max-w-lg rounded-[20px] border border-line bg-surface p-8 text-center shadow-shell">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-brand">Application Error</p>
            <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
            <p className="mt-3 text-sm text-dim">Refresh the page. If the issue persists, the latest UI state may be incompatible with current runtime data.</p>
            <button className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-brand" onClick={() => window.location.reload()} type="button">
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}