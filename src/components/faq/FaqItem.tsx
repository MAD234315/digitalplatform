import type { QA } from "./data";

export function FaqItem({ f }: { f: QA }) {
  return (
    <details className="group rounded-2xl border border-border bg-card/60 transition hover:border-foreground/20">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{f.cat}</div>
          <div className="mt-1 font-display text-lg leading-snug">{f.q}</div>
        </div>
        <span
          aria-hidden
          className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition group-open:rotate-45 group-open:text-foreground group-open:border-foreground/40"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
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
