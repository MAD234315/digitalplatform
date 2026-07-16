import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, SiteFooter, WhatsAppIcon } from "@/components/site-chrome";
import chatgpt from "@/assets/p-chatgpt.jpg";
import netflix from "@/assets/p-netflix.jpg";
import canva from "@/assets/p-canva.jpg";
import adobe from "@/assets/p-adobe.jpg";
import spotify from "@/assets/p-spotify.jpg";
import youtube from "@/assets/p-youtube.jpg";
import grammarly from "@/assets/p-grammarly.jpg";
import perplexity from "@/assets/p-perplexity.jpg";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — PixelVault" },
      { name: "description", content: "Genuine premium subscriptions: ChatGPT, Netflix, Canva Pro, Adobe, Spotify and more. Instant delivery, best price." },
    ],
  }),
  component: ProductsPage,
});

type Product = {
  name: string;
  logo: string;
  logoBg: string;
  logoColor: string;
  image: string;
  originalPrice: string;
  offerPrice: string;
  validity: string;
  delivery: string;
};

const products: Product[] = [
  { name: "ChatGPT Plus",     logo: "G", logoBg: "#10a37f", logoColor: "#fff", image: chatgpt,    originalPrice: "₹1,999", offerPrice: "₹499",   validity: "1 Month",  delivery: "Instant (5 min)" },
  { name: "Netflix Premium",  logo: "N", logoBg: "#e50914", logoColor: "#fff", image: netflix,    originalPrice: "₹649",   offerPrice: "₹199",   validity: "1 Month",  delivery: "Instant (5 min)" },
  { name: "Canva Pro",        logo: "C", logoBg: "#00c4cc", logoColor: "#fff", image: canva,      originalPrice: "₹4,000", offerPrice: "₹299",   validity: "1 Year",   delivery: "Within 1 hour" },
  { name: "Adobe Creative",   logo: "A", logoBg: "#fa0f00", logoColor: "#fff", image: adobe,      originalPrice: "₹4,731", offerPrice: "₹899",   validity: "1 Month",  delivery: "Within 2 hours" },
  { name: "Spotify Premium",  logo: "S", logoBg: "#1db954", logoColor: "#fff", image: spotify,    originalPrice: "₹119",   offerPrice: "₹59",    validity: "1 Month",  delivery: "Instant (5 min)" },
  { name: "YouTube Premium",  logo: "Y", logoBg: "#ff0000", logoColor: "#fff", image: youtube,    originalPrice: "₹149",   offerPrice: "₹69",    validity: "1 Month",  delivery: "Instant (5 min)" },
  { name: "Grammarly Premium",logo: "g", logoBg: "#15c39a", logoColor: "#fff", image: grammarly,  originalPrice: "₹1,200", offerPrice: "₹349",   validity: "1 Month",  delivery: "Within 1 hour" },
  { name: "Perplexity Pro",   logo: "P", logoBg: "#20808d", logoColor: "#fff", image: perplexity, originalPrice: "₹1,700", offerPrice: "₹599",   validity: "1 Year",   delivery: "Instant (5 min)" },
];

function ProductsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative bg-hero text-primary-foreground">
        <SiteNav />
        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-36 pb-16 lg:pt-40">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary-foreground/80">
            All plans
          </span>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl leading-tight">
            Explore <em className="text-gold not-italic italic">premium plans</em>.
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/75">
            Genuine subscriptions with instant delivery and personal support. DM us on WhatsApp for the fastest price.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.name} product={p} />
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Prices vary by duration and stock — <span className="font-medium text-foreground">contact admin for detailed info.</span>
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const waMsg = encodeURIComponent(`Hi, I'm interested in ${p.name}. Please share details.`);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border transition hover:shadow-lift hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={p.image}
          alt={p.name}
          width={800}
          height={600}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div
          aria-hidden
          className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl font-display text-xl shadow-lift ring-1 ring-black/5"
          style={{ backgroundColor: p.logoBg, color: p.logoColor }}
        >
          {p.logo}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl text-foreground">{p.name}</h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground line-through">{p.originalPrice}</span>
        </div>

        <dl className="mt-4 space-y-1.5 text-sm">
          <Row label="Validity" value={p.validity} />
          <Row label="Delivery" value={p.delivery} />
        </dl>

        <p className="mt-4 text-xs text-muted-foreground">Contact admin for detailed info.</p>

        <a
          href={`https://wa.me/919999999999?text=${waMsg}`}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-3 text-sm font-semibold text-whatsapp-foreground shadow-card hover:brightness-105 transition"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Offer: Quick DM
        </a>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
