import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  /** Human label used in error reports so we can tell which section failed. */
  boundary: string;
  /** UI to show if `children` throws. Defaults to a small inline notice with retry. */
  fallback?: ReactNode | ((ctx: { error: Error; reset: () => void }) => ReactNode);
  /**
   * When any value in this array changes between renders, the boundary
   * auto-resets. Useful for "retry after route/filter change" patterns.
   */
  resetKeys?: ReadonlyArray<unknown>;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class-based React error boundary for isolating non-critical UI.
 *
 * TanStack Router's `errorComponent` catches errors at the route level, but
 * a single broken presentational section (e.g. an animated card, a widget
 * that reads bad localStorage state) shouldn't blank the whole page. Wrap
 * such sections in `<ErrorBoundary boundary="…">` so they degrade to a
 * fallback while the rest of the route keeps rendering.
 *
 * Errors are forwarded to `reportLovableError` with the boundary label so
 * they surface in project logs with enough context to locate the source.
 *
 * The default fallback offers a "Try again" button that re-mounts children.
 * Pass `resetKeys={[filter, page]}` to auto-reset when external state changes.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.boundary}]`, error, info);
    reportLovableError(error, {
      boundary: `react_error_boundary:${this.props.boundary}`,
      componentStack: info.componentStack ?? undefined,
    });
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.state.hasError) return;
    const prev = prevProps.resetKeys ?? [];
    const next = this.props.resetKeys ?? [];
    if (prev.length !== next.length || prev.some((v, i) => v !== next[i])) {
      this.reset();
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    const error = this.state.error ?? new Error("Unknown error");

    if (typeof this.props.fallback === "function") {
      return this.props.fallback({ error, reset: this.reset });
    }
    if (this.props.fallback !== undefined) return this.props.fallback;

    return (
      <div
        role="alert"
        className="mx-auto max-w-3xl px-6 py-10 text-center text-sm text-muted-foreground"
      >
        <p>This section couldn&apos;t load.</p>
        <button
          type="button"
          onClick={this.reset}
          className="mt-3 inline-flex items-center rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] transition hover:bg-muted hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Try again
        </button>
      </div>
    );
  }
}
