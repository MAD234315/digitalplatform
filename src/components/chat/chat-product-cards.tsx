import { CONTACT } from "@/components/site-chrome";
import { WaGlyph } from "@/components/products/wa-glyph";

export type ChatProduct = {
  name: string;
  plan?: string;
  validity?: string;
  availability?: string;
  category?: string;
};

/** Catalogue products the assistant actually named, longest names first. */
export function matchChatProducts(text: string, products: ChatProduct[]): ChatProduct[] {
  const haystack = text.toLowerCase();
  const seen = new Set<string>();
  const hits: ChatProduct[] = [];
  for (const p of [...products].sort((a, b) => b.name.length - a.name.length)) {
    const name = p.name?.trim();
    if (!name || name.length < 4) continue;
    const key = name.toLowerCase();
    if (seen.has(key) || !haystack.includes(key)) continue;
    seen.add(key);
    hits.push(p);
    if (hits.length >= 4) break;
  }
  return hits;
}

function availabilityLabel(value?: string): { label: string; tone: string } {
  switch (value) {
    case "out":
      return { label: "Out of stock", tone: "text-destructive border-destructive/30" };
    case "limited":
      return { label: "Limited stock", tone: "text-amber border-amber/30" };
    default:
      return { label: "Available", tone: "text-emerald-400 border-emerald-500/30" };
  }
}

/** Rich product cards rendered under an assistant answer. */
export function ChatProductCards({
  products,
  onKnowMore,
}: {
  products: ChatProduct[];
  onKnowMore: (prompt: string) => void;
}) {
  if (!products.length) return null;

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {products.map((p) => {
        const stock = availabilityLabel(p.availability);
        const details = [p.plan, p.validity].filter(Boolean).join(" · ");
        const waHref = `${CONTACT.WA_URL}?text=${encodeURIComponent(
          `Hi Digital Platform! I'd like to buy ${p.name}${details ? ` (${details})` : ""}. Could you confirm today's price?`,
        )}`;
        return (
          <article
            key={p.name}
            className="rounded-2xl border border-border bg-background/60 p-3 shadow-sm transition-colors hover:border-amber/30"
          >
            <h4 className="truncate text-sm font-semibold text-foreground">{p.name}</h4>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {details || p.category || "Digital product"}
            </p>
            <span
              className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${stock.tone}`}
            >
              {stock.label}
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onKnowMore(`Tell me more about ${p.name} — plans, validity and how it works.`)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-border px-3 text-xs font-medium text-foreground transition-colors hover:border-amber/40 hover:bg-amber/5"
              >
                Know more
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white transition-[filter] hover:brightness-110"
                style={{ backgroundColor: "var(--whatsapp)" }}
              >
                <WaGlyph />
                Buy now
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
