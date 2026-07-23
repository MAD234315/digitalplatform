export function DefaultPendingComponent() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[60vh] items-center justify-center bg-background px-4"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}
