import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors anywhere below it and shows a readable fallback
 * instead of a blank white screen. Without this, any thrown error in a route
 * (e.g. the admin dashboard) unmounts the whole React tree silently.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Always log so the real cause is visible in the console, even in prod.
    console.error('[ErrorBoundary] Uncaught render error:', error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-foreground">משהו השתבש</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            אירעה שגיאה בלתי צפויה. נסו לרענן את הדף.
          </p>
          {import.meta.env.DEV && (
            <pre
              dir="ltr"
              className="mb-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-start text-xs text-destructive"
            >
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="h-11 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            רענון הדף
          </button>
        </div>
      </div>
    );
  }
}
