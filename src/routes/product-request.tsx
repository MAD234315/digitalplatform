import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";
import { CONTACT } from "@/components/site-chrome";

const TITLE = "Request a Product — Digital Platform";
const DESC =
  "Can't find what you need in our catalogue? Send us a product request and we'll check availability and pricing.";

export const Route = createFileRoute("/product-request")({
  head: () =>
    buildRouteHead({ path: "/product-request", title: TITLE, description: DESC, imageAlt: "Digital Platform — request a product" }),
  component: ProductRequest,
});

function ProductRequest() {
  const waPrefill =
    "Hi, I'd like to request a product:\n\n• Product / Service: \n• Plan or edition: \n• Duration: \n• Any other details: ";

  return (
    <PageShell>
      <PageHero
        compact
        eyebrow="PRODUCT REQUEST"
        title="Can't find it?"
        titleAccent="Just ask."
        lede="Tell us what you're looking for — a subscription, an AI tool, a software license, a gift card. We'll check availability, source it if we can, and reply with pricing."
      />
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 py-10 sm:py-12 space-y-8">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg sm:text-xl">What to include</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground leading-relaxed">
              <li>• The exact product or service name</li>
              <li>• The plan, edition, or tier you want</li>
              <li>• Duration (monthly, yearly, lifetime)</li>
              <li>• How many seats or devices you need</li>
              <li>• Any preferences on region, language, or delivery format</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`${CONTACT.WA_URL}?text=${encodeURIComponent(waPrefill)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
              style={{ backgroundColor: "var(--whatsapp)" }}
            >
              💬 Send request on WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT.EMAIL}?subject=${encodeURIComponent("Product request")}&body=${encodeURIComponent(waPrefill)}`}
              className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em]"
            >
              📧 Email us instead
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            Our team responds every day as earliest as possible.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
