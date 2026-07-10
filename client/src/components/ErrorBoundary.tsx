import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          id="main-content"
          className="flex min-h-screen items-center justify-center p-8"
        >
          <div className="cm-card flex w-full max-w-lg flex-col items-center p-8 text-center">
            <AlertTriangle
              size={48}
              className="mb-6 flex-shrink-0 text-[var(--cm-danger)]"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <p className="mb-6 text-sm leading-6 text-[var(--cm-text-muted)]">
              Reload the page. If the problem continues, contact support and
              include the time it happened.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="cm-button-primary flex items-center gap-2 px-4 py-2"
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
