/**
 * "View Full Info" modal for a catalogue product.
 *
 * Renders the raw `description` value from the spreadsheet with whitespace
 * preserved (paragraphs, line breaks, bullets, numbered lists), plus the
 * Type / Supports / Warranty rows that were removed from the card face.
 */
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { SheetProduct } from "@/lib/sheet-products.functions";

const EMPTY_DESCRIPTION = "Detailed information is not available for this product yet.";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

export function ProductInfoDialog({
  product,
  onClose,
}: {
  product: SheetProduct | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = !!product;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} full information`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default animate-fade-in bg-black/70"
        style={{ backdropFilter: "blur(8px) saturate(120%)" }}
      />

      <div
        className="relative flex w-full max-w-lg flex-col overflow-hidden animate-scale-in"
        style={{
          borderRadius: "18px",
          maxHeight: "min(80vh, 80svh)",
          background:
            "linear-gradient(160deg, color-mix(in oklab, var(--card) 96%, transparent) 0%, color-mix(in oklab, var(--background) 98%, transparent) 100%)",
          border: "1px solid color-mix(in oklab, var(--primary) 32%, transparent)",
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--primary) 10%, transparent), 0 30px 70px -30px rgba(0,0,0,0.8)",
        }}
      >
        <header
          className="flex items-start gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid color-mix(in oklab, var(--primary) 18%, transparent)" }}
        >
          <h2 className="min-w-0 flex-1 font-display text-lg leading-snug tracking-tight text-foreground">
            {product.name}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            style={{ border: "1px solid color-mix(in oklab, var(--primary) 22%, transparent)" }}
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
              Product details
            </h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
              {product.description?.trim() || EMPTY_DESCRIPTION}
            </p>
          </section>

          <section
            className="mt-5 pt-4"
            style={{ borderTop: "1px dashed color-mix(in oklab, var(--primary) 25%, transparent)" }}
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
              Product information
            </h3>
            <div
              className="mt-1 divide-y"
              style={{ borderColor: "color-mix(in oklab, var(--primary) 12%, transparent)" }}
            >
              <InfoRow label="Type" value={product.type} />
              <InfoRow label="Supports" value={product.supports} />
              <InfoRow label="Warranty" value={product.warranty} />
            </div>
          </section>
        </div>

        <footer
          className="px-5 py-4"
          style={{ borderTop: "1px solid color-mix(in oklab, var(--primary) 18%, transparent)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold transition-colors"
            style={{
              background: "color-mix(in oklab, var(--primary) 14%, transparent)",
              color: "var(--primary)",
              border: "1px solid color-mix(in oklab, var(--primary) 40%, transparent)",
            }}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
