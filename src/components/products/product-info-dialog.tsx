/**
 * "View Full Info" modal for a catalogue product.
 *
 * Renders the raw `description` value from the spreadsheet with whitespace
 * preserved (paragraphs, line breaks, bullets, numbered lists), plus all
 * catalogue fields (Category, Status, Plan, Validity, Type, Supports, Warranty)
 * that were removed from the card face.
 *
 * The dialog is portaled to document.body so it escapes any ancestor stacking
 * contexts (transforms, overflow-hidden) and stays perfectly centered on the
 * viewport.
 */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { SheetProduct } from "@/lib/sheet-products.functions";

const EMPTY_DESCRIPTION = "Detailed information is not available for this product yet.";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="break-words text-right text-sm text-foreground">{value || "—"}</span>
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

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} full information`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 animate-fade-in bg-black/80"
        style={{ backdropFilter: "blur(10px) saturate(120%)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-[1] flex w-full max-w-lg flex-col overflow-hidden animate-scale-in"
        style={{
          borderRadius: "18px",
          maxHeight: "min(85vh, 85svh)",
          background:
            "linear-gradient(160deg, color-mix(in oklab, var(--card) 98%, transparent) 0%, color-mix(in oklab, var(--background) 99%, transparent) 100%)",
          border: "1px solid color-mix(in oklab, var(--primary) 32%, transparent)",
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--primary) 10%, transparent), 0 40px 90px -30px rgba(0,0,0,0.85)",
        }}
      >
        <header
          className="flex items-start gap-3 px-5 py-4 sm:px-6 sm:py-5"
          style={{ borderBottom: "1px solid color-mix(in oklab, var(--primary) 18%, transparent)" }}
        >
          <h2 className="min-w-0 flex-1 font-display text-lg leading-snug tracking-tight text-foreground sm:text-xl">
            {product.name}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            style={{ border: "1px solid color-mix(in oklab, var(--primary) 22%, transparent)" }}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              PRODUCT DETAILS
            </h3>
            <div
              className="mt-1 divide-y"
              style={{ borderColor: "color-mix(in oklab, var(--primary) 12%, transparent)" }}
            >
              <InfoRow label="Category" value={product.category} />
              <InfoRow label="Status" value={product.status} />
              <InfoRow label="Plan" value={product.plan} />
              <InfoRow label="Validity" value={product.validity} />
              <InfoRow label="Type" value={product.type} />
              <InfoRow label="Supports" value={product.supports} />
              <InfoRow label="Warranty" value={product.warranty} />
            </div>
          </section>

          <section
            className="mt-5 pt-4"
            style={{ borderTop: "1px dashed color-mix(in oklab, var(--primary) 25%, transparent)" }}
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              PRODUCT DESCRIPTION
            </h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
              {product.description?.trim() || EMPTY_DESCRIPTION}
            </p>
          </section>
        </div>

        <footer
          className="px-5 py-4 sm:px-6 sm:pb-5"
          style={{ borderTop: "1px solid color-mix(in oklab, var(--primary) 18%, transparent)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary"
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

  return createPortal(modal, document.body);
}

