export function DefaultPendingComponent() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[60vh] items-center justify-center bg-background px-4 animate-fade-in"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber/25 border-t-amber" />
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Loading</span>
      </div>
    </div>
  );
}
