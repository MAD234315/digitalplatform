import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteNav, SiteFooter, CONTACT } from "@/components/site-chrome";
import { getSheetProducts, type Availability, type SheetProduct } from "@/lib/sheet-products.functions";
import type { ReactNode } from "react";
import { TiltCard } from "@/components/tilt-card";
import { OG_IMAGE, ORG_ID, SITE_URL, WEBSITE_ID } from "@/lib/site-config";
import { useRecentlyViewed, type RecentItem } from "@/lib/recently-viewed";

// Static options (not a factory) — keeps queryKey referentially stable so
// useSuspenseQuery, ensureQueryData, and any getQueryData reads share the
// same cache entry across renders.
const productsQueryOptions = queryOptions({
  queryKey: ["sheet-products"],
  queryFn: () => getSheetProducts(),
  staleTime: 60_000,
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
});

const PRODUCTS_URL = SITE_URL + "/products";
const PRODUCTS_TITLE = "Digital Subscriptions & Software — Digital Platform";
const PRODUCTS_DESC = "Live catalogue of premium subscriptions, AI tools, software licenses and gift cards. Updated daily from our stock sheet. DM for live pricing.";

function availabilityToSchema(a: Availability): string {
  if (a === "out") return "https://schema.org/OutOfStock";
  if (a === "limited") return "https://schema.org/LimitedAvailability";
  return "https://schema.org/InStock";
}

export const Route = createFileRoute("/products")({
  head: ({ loaderData }: { loaderData?: { products?: SheetProduct[] } }) => {
    const items = loaderData?.products?.slice(0, 20) ?? [];
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      url: PRODUCTS_URL,
      name: PRODUCTS_TITLE,
      numberOfItems: items.length,
      itemListElement: items.map((p: SheetProduct, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name + (p.plan ? ` — ${p.plan}` : ""),
          category: p.category,
          brand: { "@type": "Brand", name: "Digital Platform" },
          offers: {
            "@type": "Offer",
            availability: availabilityToSchema(p.availability),
            priceCurrency: "INR",
            price: "0",
            url: PRODUCTS_URL,
            seller: { "@id": ORG_ID },
          },
        },
      })),
    };
    return {
      meta: [
        { title: PRODUCTS_TITLE },
        { name: "description", content: PRODUCTS_DESC },
        { property: "og:title", content: PRODUCTS_TITLE },
        { property: "og:description", content: PRODUCTS_DESC },
        { property: "og:url", content: PRODUCTS_URL },
        { property: "og:type", content: "website" },
        { property: "og:image", content: OG_IMAGE },
        { property: "og:image:alt", content: "Digital Platform — live product catalogue" },
        { name: "twitter:title", content: PRODUCTS_TITLE },
        { name: "twitter:description", content: PRODUCTS_DESC },
        { name: "twitter:image", content: OG_IMAGE },
      ],
      links: [{ rel: "canonical", href: PRODUCTS_URL }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            url: PRODUCTS_URL,
            name: PRODUCTS_TITLE,
            description: PRODUCTS_DESC,
            isPartOf: { "@id": WEBSITE_ID },
            publisher: { "@id": ORG_ID },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(itemList),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
              { "@type": "ListItem", position: 2, name: "Products", item: PRODUCTS_URL },
            ],
          }),
        },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  component: Products,
});

function Products() {
  const { data, dataUpdatedAt } = useSuspenseQuery(productsQueryOptions);
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");
  const { items: recent, track, clear } = useRecentlyViewed();

  // Precompute a category → count map so the filter bar doesn't re-scan
  // `data.categories` for each chip on every keystroke.
  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of data.categories) m.set(c.name, c.count);
    return m;
  }, [data.categories]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.products.filter((p) => {
      if (active !== "All" && p.category !== active) return false;
      if (needle && !`${p.name} ${p.plan} ${p.category}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data.products, active, q]);

  // Only surface recents that still exist in the live catalogue, and skip
  // whatever is being filtered — jumping to a hidden card would confuse users.
  const recentVisible = useMemo(() => {
    const byId = new Map(data.products.map((p) => [p.id, p] as const));
    return recent
      .map((r) => ({ recent: r, product: byId.get(r.id) }))
      .filter((x): x is { recent: RecentItem; product: SheetProduct } => Boolean(x.product));
  }, [recent, data.products]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />

      <div>

      <header className="relative border-b border-border">
        <div className="absolute inset-0 bg-hero" aria-hidden />
        <div className="relative">
          <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-36 pb-14">
            <div className="grid lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-8">
                <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">The catalogue</div>
                <h1 className="mt-4 font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.98]">
                  Every product,
                  <br />
                  <em className="italic" style={{ color: "var(--accent)" }}>live from our shelf.</em>
                </h1>
                <p className="mt-6 max-w-xl text-muted-foreground">
                  Updated in real-time from our internal stock sheet. Prices depend on stock availability
                  and demand — DM us for today&apos;s rate.
                </p>
              </div>
              <div className="lg:col-span-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Live status</div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "var(--whatsapp)" }} />
                      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "var(--whatsapp)" }} />
                    </span>
                    Synced with stock sheet
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Last update: {new Date(dataUpdatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <div className="font-display text-4xl">{data.products.length}</div>
                    <div className="text-xs text-muted-foreground">products listed</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Sticky filter bar — remains visible while scrolling long lists */}
      <div className="sticky top-16 sm:top-20 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-3 flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Filter by category"
            className="scroll-slim flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
          >
            {["All", ...data.categories.map((c) => c.name)].map((name) => {
              const isActive = active === name;
              const count = name === "All" ? data.products.length : (categoryCounts.get(name) ?? 0);
              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-pressed={isActive}
                  onClick={() => setActive(name)}
                  className={`whitespace-nowrap rounded-full border px-4 min-h-9 text-xs font-medium uppercase tracking-[0.14em] transition ${
                    isActive
                      ? "border-transparent shadow-soft"
                      : "border-border bg-card hover:bg-muted hover:border-foreground/20"
                  }`}
                  style={isActive ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" } : undefined}
                >
                  {name.toLowerCase()} <span className="opacity-60">· {count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full lg:w-72 lg:shrink-0">
            <label htmlFor="products-search" className="sr-only">Search products</label>
            <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              id="products-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-full border border-border bg-card pl-11 pr-10 min-h-10 text-sm outline-none transition focus:border-foreground/40"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>


      {/* GRID */}
      <main className="mx-auto max-w-7xl px-6 lg:px-10 py-14">
        {data.error && (
          <div className="mb-6 rounded-xl border border-danger/40 p-4 text-sm" style={{ color: "var(--danger)" }}>
            Couldn&apos;t load the live sheet ({data.error}). Please retry shortly.
          </div>
        )}

        {recentVisible.length > 0 && (
          <RecentlyViewed
            items={recentVisible}
            onClear={clear}
            onJump={(id) => {
              const el = document.getElementById(`product-${id}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("ring-2", "ring-amber");
                window.setTimeout(() => el.classList.remove("ring-2", "ring-amber"), 1500);
              }
            }}
          />
        )}

        {filtered.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            No products match this filter. Try another category.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <TiltCard key={p.id} max={4}>
                <ProductCard p={p} updatedAt={dataUpdatedAt} onView={track} />
              </TiltCard>
            ))}
          </div>
        )}

        <p className="mt-16 text-center text-xs text-muted-foreground">
          Prices depend on stock &amp; demand — <span className="font-medium text-foreground">contact admin for detailed info.</span>
        </p>
      </main>

      </div>
      <SiteFooter />

    </div>
  );
}


function ProductCard({ p, updatedAt, onView }: { p: SheetProduct; updatedAt: number; onView?: (p: SheetProduct) => void }) {
  const waMsg = encodeURIComponent(`Hi, I'm interested in ${p.name}${p.plan ? ` (${p.plan})` : ""}${p.validity ? ` — ${p.validity}` : ""}. Please share the price.`);
  const initials = p.name.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || p.name.slice(0, 2).toUpperCase();
  const updatedLabel = formatRelative(updatedAt);

  return (
    <article id={`product-${p.id}`} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-0.5 hover:shadow-soft hover:border-foreground/20 focus-within:-translate-y-0.5 focus-within:shadow-soft scroll-mt-32">
      {/* Ultra-compact media strip — brand logo thumbnail + inline category & badges */}
      <div className="relative flex items-center gap-3 px-3 py-2.5 border-b border-border/60">
        {/* Anime-style thumbnail — deterministic per product name via DiceBear */}
        <div
          aria-hidden
          className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-soft"
          style={{ background: gradientFor(p.name) }}
        >
          <img
            src={animeImageFor(p.name)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-11 w-11 object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        {/* Initials + category label */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded px-1 font-display text-[10px]" style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
              {initials}
            </span>
            <span className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {p.category}
            </span>
          </div>
        </div>

        {/* Badges, inline right */}
        <div className="flex shrink-0 flex-wrap justify-end gap-1 max-w-[55%]">
          {p.badges.includes("new") && <Badge tone="new">🆕 New</Badge>}
          {p.badges.includes("high-demand") && <Badge tone="hot">🔥 Hot</Badge>}
          {p.loot && <Badge tone="loot">Loot</Badge>}
          <AvailabilityBadge availability={p.availability} />
        </div>
      </div>


      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl leading-tight">{p.name}</h3>
        {p.plan && <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{p.plan}</div>}

        {p.originalPrice && (
          <div className="mt-3 text-sm">
            <span className="text-muted-foreground line-through">{p.originalPrice}</span>
          </div>
        )}

        <dl className="mt-4 space-y-1.5 text-sm">
          {p.plan && <Row label="Plan" value={p.plan} />}
          {p.validity && <Row label="Validity" value={p.validity} />}
          {p.supports && <Row label="Supported devices" value={p.supports} />}
          {p.type && <Row label="Delivery" value={p.type} />}
          {p.warranty && <Row label="Warranty" value={p.warranty} />}
        </dl>

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--whatsapp)" }}
          />
          <span>Last updated {updatedLabel}</span>
        </div>

        <a
          href={`${CONTACT.WA_URL}?text=${waMsg}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => onView?.(p)}
          aria-label={`Quick DM for price on WhatsApp about ${p.name}`}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.98]"
          style={{ backgroundColor: "var(--whatsapp)" }}
        >
          <WaGlyph /> Quick DM for Price
        </a>
      </div>
    </article>
  );
}

function formatRelative(ts: number): string {
  const diffMs = Date.now() - ts;
  const sec = Math.max(0, Math.round(diffMs / 1000));
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function WaGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M20.5 3.5A11 11 0 0 0 3 17l-1 5 5.2-1.3A11 11 0 1 0 20.5 3.5Zm-8.5 18a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 1 1 12 21.5Zm5.2-6.7c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.2-.2.3-.7.9-.9 1-.2.2-.3.2-.6 0-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.3s.9 2.7 1 2.9c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.3-.1-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}

// Deterministic accent gradient per product name for visual variety
/**
 * Deterministic anime-style thumbnail per product name.
 * Rotates across a few DiceBear anime-leaning styles so the grid looks varied
 * while remaining stable across reloads (same product → same image).
 */
function animeImageFor(name: string): string {
  const styles = ["lorelei", "adventurer", "big-smile", "personas", "notionists", "micah"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const style = styles[h % styles.length];
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&radius=20&backgroundType=gradientLinear`;
}

function gradientFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const h2 = (h + 40) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${h2} 75% 40%))`;
}

/**
 * Emoji glyph that acts as a lightweight product image.
 * Product name keywords take priority so recognisable brands get a fitting
 * icon even inside a shared category; falls back to a category-level default.
 */
function glyphForCategory(category: string, name: string): string {
  const n = name.toLowerCase();
  // Name-level overrides for common brands / product families
  if (/(netflix|prime|hotstar|disney|zee|sony ?liv|jio ?cinema|hulu|apple ?tv)/.test(n)) return "🎬";
  if (/(spotify|apple ?music|youtube ?music|gaana|wynk|tidal|deezer)/.test(n)) return "🎧";
  if (/(youtube|yt)/.test(n)) return "▶️";
  if (/(chatgpt|openai|gpt|claude|gemini|perplexity|copilot|midjourney|leonardo|stable ?diffusion|runway|elevenlabs|grok)/.test(n)) return "🤖";
  if (/(canva|figma|adobe|photoshop|illustrator|lightroom|premiere|after ?effects|coreldraw)/.test(n)) return "🎨";
  if (/(microsoft|office|windows|excel|word|powerpoint|outlook|onedrive|365)/.test(n)) return "🪟";
  if (/(google ?one|google ?drive|dropbox|icloud|mega|pcloud)/.test(n)) return "☁️";
  if (/(github|gitlab|jetbrains|intellij|pycharm|vscode|cursor|replit|vercel|netlify|aws|azure|render|fly\.io)/.test(n)) return "⚙️";
  if (/(coursera|udemy|skillshare|masterclass|linkedin ?learning|duolingo|quizlet|chegg)/.test(n)) return "🎓";
  if (/(notion|evernote|todoist|asana|trello|monday|clickup|obsidian|slack)/.test(n)) return "📊";
  if (/(vpn|nord|express|surfshark|proton|windscribe)/.test(n)) return "🛡️";
  if (/(gift ?card|voucher|amazon|flipkart|steam|playstation|xbox|nintendo|google ?play)/.test(n)) return "🎁";
  if (/(zoom|meet|webex|teams)/.test(n)) return "📹";
  if (/(grammarly|quillbot|deepl|linguee)/.test(n)) return "✍️";
  if (/(telegram|whatsapp|signal|discord)/.test(n)) return "💬";

  // Category-level defaults
  const c = category.toLowerCase();
  if (/ai/.test(c)) return "🤖";
  if (/stream|entertain|ott|video/.test(c)) return "🎬";
  if (/music|audio/.test(c)) return "🎧";
  if (/design|creative|graphic/.test(c)) return "🎨";
  if (/dev|code|program/.test(c)) return "⚙️";
  if (/microsoft|office/.test(c)) return "🪟";
  if (/productivity|business/.test(c)) return "📊";
  if (/education|learning|course/.test(c)) return "🎓";
  if (/gift|card|voucher/.test(c)) return "🎁";
  if (/cloud|storage/.test(c)) return "☁️";
  if (/vpn|security|privacy/.test(c)) return "🛡️";
  if (/game|gaming/.test(c)) return "🎮";
  return "✨";
}

/**
 * Real brand-logo URL for a product when we can confidently map its name to
 * a known brand. Uses simpleicons.org CDN (SVG, cached at the edge).
 * Returns null when no confident match — caller falls back to the glyph.
 */
function logoForProduct(name: string): string | null {
  const n = name.toLowerCase();
  const brands: Array<[RegExp, string]> = [
    [/netflix/, "netflix"],
    [/prime ?video|amazon ?prime/, "primevideo"],
    [/hotstar|disney/, "disneyplus"],
    [/sony ?liv/, "sonyliv"],
    [/zee/, "zee5"],
    [/jio ?cinema/, "jiocinema"],
    [/apple ?tv/, "appletv"],
    [/hulu/, "hulu"],
    [/youtube ?music/, "youtubemusic"],
    [/apple ?music/, "applemusic"],
    [/spotify/, "spotify"],
    [/gaana/, "gaana"],
    [/wynk/, "wynkmusic"],
    [/tidal/, "tidal"],
    [/deezer/, "deezer"],
    [/youtube|yt ?premium/, "youtube"],
    [/chatgpt|openai/, "openai"],
    [/claude|anthropic/, "anthropic"],
    [/gemini|bard/, "googlegemini"],
    [/perplexity/, "perplexity"],
    [/copilot/, "githubcopilot"],
    [/midjourney/, "midjourney"],
    [/leonardo/, "leonardoai"],
    [/stable ?diffusion/, "stablediffusion"],
    [/runway/, "runway"],
    [/elevenlabs/, "elevenlabs"],
    [/grok/, "x"],
    [/canva/, "canva"],
    [/figma/, "figma"],
    [/photoshop/, "adobephotoshop"],
    [/illustrator/, "adobeillustrator"],
    [/lightroom/, "adobelightroom"],
    [/premiere/, "adobepremierepro"],
    [/after ?effects/, "adobeaftereffects"],
    [/adobe/, "adobe"],
    [/coreldraw/, "coreldraw"],
    [/office ?365|microsoft ?365|ms ?office/, "microsoftoffice"],
    [/excel/, "microsoftexcel"],
    [/word/, "microsoftword"],
    [/powerpoint/, "microsoftpowerpoint"],
    [/outlook/, "microsoftoutlook"],
    [/onedrive/, "microsoftonedrive"],
    [/windows/, "windows"],
    [/microsoft/, "microsoft"],
    [/google ?one|google ?drive/, "googledrive"],
    [/dropbox/, "dropbox"],
    [/icloud/, "icloud"],
    [/mega/, "mega"],
    [/pcloud/, "pcloud"],
    [/github/, "github"],
    [/gitlab/, "gitlab"],
    [/jetbrains/, "jetbrains"],
    [/intellij/, "intellijidea"],
    [/pycharm/, "pycharm"],
    [/vscode|visual ?studio ?code/, "vscodium"],
    [/cursor/, "cursor"],
    [/replit/, "replit"],
    [/vercel/, "vercel"],
    [/netlify/, "netlify"],
    [/aws|amazon ?web/, "amazonaws"],
    [/azure/, "microsoftazure"],
    [/render/, "render"],
    [/fly\.io/, "fly"],
    [/coursera/, "coursera"],
    [/udemy/, "udemy"],
    [/skillshare/, "skillshare"],
    [/masterclass/, "masterclass"],
    [/linkedin ?learning|linkedin/, "linkedin"],
    [/duolingo/, "duolingo"],
    [/quizlet/, "quizlet"],
    [/chegg/, "chegg"],
    [/notion/, "notion"],
    [/evernote/, "evernote"],
    [/todoist/, "todoist"],
    [/asana/, "asana"],
    [/trello/, "trello"],
    [/clickup/, "clickup"],
    [/obsidian/, "obsidian"],
    [/slack/, "slack"],
    [/nord ?vpn/, "nordvpn"],
    [/express ?vpn/, "expressvpn"],
    [/surfshark/, "surfshark"],
    [/proton ?vpn|proton/, "protonvpn"],
    [/windscribe/, "windscribe"],
    [/amazon/, "amazon"],
    [/flipkart/, "flipkart"],
    [/steam/, "steam"],
    [/playstation/, "playstation"],
    [/xbox/, "xbox"],
    [/nintendo/, "nintendo"],
    [/google ?play/, "googleplay"],
    [/zoom/, "zoom"],
    [/google ?meet/, "googlemeet"],
    [/webex/, "webex"],
    [/teams/, "microsoftteams"],
    [/grammarly/, "grammarly"],
    [/quillbot/, "quillbot"],
    [/deepl/, "deepl"],
    [/telegram/, "telegram"],
    [/whatsapp/, "whatsapp"],
    [/signal/, "signal"],
    [/discord/, "discord"],
  ];
  for (const [re, slug] of brands) if (re.test(n)) return `https://cdn.simpleicons.org/${slug}`;
  return null;
}

type BadgeTone = "available" | "limited" | "out" | "hot" | "new" | "loot";

const badgeToneStyle: Record<BadgeTone, { bg: string; fg: string; ring?: string }> = {
  available: { bg: "var(--whatsapp)", fg: "#fff" },
  limited: { bg: "#f4b740", fg: "#3a2500" },
  out: { bg: "#c8321f", fg: "#fff" },
  hot: { bg: "#ff5a1f", fg: "#fff" },
  new: { bg: "#1f6feb", fg: "#fff" },
  loot: { bg: "var(--accent)", fg: "#fff" },
};

function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  const s = badgeToneStyle[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-soft backdrop-blur-sm"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {children}
    </span>
  );
}

function AvailabilityBadge({ availability }: { availability: Availability }) {
  if (availability === "out") return <Badge tone="out">🔴 Out of Stock</Badge>;
  if (availability === "limited") return <Badge tone="limited">🟡 Limited Stock</Badge>;
  return <Badge tone="available">🟢 Available Now</Badge>;
}

function RecentlyViewed({
  items,
  onJump,
  onClear,
}: {
  items: Array<{ recent: RecentItem; product: SheetProduct }>;
  onJump: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <section aria-labelledby="recently-viewed-heading" className="mb-10 rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Continue where you left off</div>
          <h2 id="recently-viewed-heading" className="mt-1 font-display text-xl">Recently viewed</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground"
        >
          Clear
        </button>
      </div>

      <ul className="scroll-slim mt-4 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {items.map(({ recent, product }) => {
          const initials =
            product.name.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() ||
            product.name.slice(0, 2).toUpperCase();
          return (
            <li key={recent.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onJump(recent.id)}
                className="group flex w-56 items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition hover:-translate-y-0.5 hover:shadow-soft hover:border-foreground/20"
              >
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-sm text-white shadow-soft"
                  style={{ background: gradientFor(product.name) }}
                >
                  {initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{product.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {product.plan || product.category}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

