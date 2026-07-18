import type { QA } from "./data";

/**
 * Single collapsible FAQ entry.
 *
 * Uses a native `<details>` element for zero-JS open/close and native
 * keyboard support (Enter/Space toggle on the summary).
 */
export function FaqItem({ f }: { f: QA }) {
  return (
    <details className="group rounded-2xl border border-border bg-card/60 transition-all duration-300 hover:border-[color:var(--amber)]/50 hover:shadow-[0_10px_30px_-15px_color-mix(in_oklab,var(--amber)_35%,transparent)] hover:-translate-y-0.5 active:translate-y-0 open:border-[color:var(--amber)]/50 open:shadow-[0_10px_30px_-15px_color-mix(in_oklab,var(--amber)_30%,transparent)]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 min-h-[3.25rem]">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{f.cat}</div>
          <div className="mt-1 font-display text-lg leading-snug group-open:text-headline">{f.q}</div>
        </div>
        <span
          aria-hidden
          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--amber)]/40 text-[color:var(--amber)] bg-[color:var(--amber)]/5 transition-all duration-300 group-open:rotate-45 group-open:bg-[color:var(--amber)]/15 group-open:border-[color:var(--amber)] group-hover:bg-[color:var(--amber)]/10"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
      </summary>
      <div className="px-5 pb-5 -mt-1 text-sm leading-relaxed text-muted-foreground animate-rise">
        {f.a}
      </div>
    </details>
  );
}
