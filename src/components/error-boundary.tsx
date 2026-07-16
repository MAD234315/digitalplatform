import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  /** Human label used in error reports so we can tell which section failed. */
  boundary: string;
  /** UI to show if `children` throws. Defaults to a small inline notice. */
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Class-based React error boundary for isolating non-critical UI.
 *
 * TanStack Router's `errorComponent` catches errors at the route level, but
 * a single broken presentational section (e.g. an animated card, a widget
 * that reads bad localStorage state) shouldn't blank the whole page. Wrap
 * such sections in `<ErrorBoundary boundary="…">` so they degrade to the
 * fallback while the rest of the route keeps rendering.
 *
 * Errors are forwarded to `reportLovableError` with the boundary label so
 * they surface in project logs with enough context to locate the source.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.boundary}]`, error, info);
    reportLovableError(error, {
      boundary: `react_error_boundary:${this.props.boundary}`,
      componentStack: info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="mx-auto max-w-3xl px-6 py-10 text-center text-sm text-muted-foreground">
            This section couldn&apos;t load. Refresh to try again.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
