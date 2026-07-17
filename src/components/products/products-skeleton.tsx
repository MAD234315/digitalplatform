/**
 * Skeleton shown while the /products loader resolves the sheet fetch.
 * Mirrors the real hero + filter + grid layout so the shift on hydration
 * is minimal.
 */
import { PageShell } from "@/components/layout/PageShell";

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex flex-col gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-muted animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="h-6 w-4/5 rounded bg-muted animate-pulse" />
          <div className="mt-2 h-3 w-1/2 rounded bg-muted animate-pulse" />
          <div className="mt-5 space-y-2">
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="mt-6 h-12 w-full rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function ProductsSkeleton() {
  return (
    <PageShell>
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16">
          <div className="h-10 w-2/3 max-w-lg rounded-lg bg-muted animate-pulse" />
          <div className="mt-4 h-4 w-1/2 max-w-md rounded bg-muted animate-pulse" />
          <div className="mt-6 flex gap-3">
            <div className="h-9 w-28 rounded-full bg-muted animate-pulse" />
            <div className="h-9 w-24 rounded-full bg-muted animate-pulse" />
            <div className="h-9 w-24 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </div>
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-3">
          <div className="h-11 w-full rounded-full bg-muted animate-pulse" />
        </div>
      </div>
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-3 flex gap-2 flex-wrap">
          <div className="h-11 w-56 rounded-full bg-muted animate-pulse" />
          <div className="h-11 w-44 rounded-full bg-muted animate-pulse" />
          <div className="h-11 w-48 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14">
        <div className="mb-5 h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground align-[-2px]"
    />
  );
}
