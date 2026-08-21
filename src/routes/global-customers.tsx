import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";
import { CONTACT } from "@/components/site-chrome";

const TITLE = "Global Customers — International Orders & Compatibility | Digital Platform";
const DESC =
  "Ordering from outside India? Read our international customer guide on country-specific availability, compatibility checks, and payment notices before you buy.";

const WA_PREFILL = encodeURIComponent(
  "Hi Digital Platform! I'm an international customer. My country is: ",
);

export const Route = createFileRoute("/global-customers")({
  head: () =>
    buildRouteHead({
      path: "/global-customers",
      title: TITLE,
      description: DESC,
      imageAlt: "Digital Platform — global customers guide",
    }),
  component: GlobalCustomers,
});

function GlobalCustomers() {
  return (
    <PageShell>
      <PageHero
        compact
        eyebrow="INTERNATIONAL ORDERS"
        title={<>Global <em className="text-headline">Customers.</em></>}
        lede="Important information for customers outside India. Tell us your country before payment so we can confirm compatibility and recommend the right plan."
      />

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-10 py-10 sm:py-12 space-y-8 text-sm text-muted-foreground leading-relaxed">
          <IntroBlock>
            We welcome customers from different countries around the world. However, please note that digital products, subscriptions, plans and services may have different availability depending on your country or region.
          </IntroBlock>

          <Block icon="🌎" title="Why Do We Need Your Country?">
            Some plans may have:
            <ul className="mt-3 space-y-2">
              <li>Country-specific availability</li>
              <li>Regional restrictions</li>
              <li>Different activation requirements</li>
              <li>Country-specific features or limitations</li>
              <li>Different pricing or plan versions</li>
              <li>Restrictions imposed by the original service provider</li>
            </ul>
            Because of these differences, a plan that works in one country may not necessarily work in another.
          </Block>

          <Block icon="🔎" title="We Check Compatibility Before Activation">
            Once you provide your country, we can check whether the selected plan is suitable for your location. If the selected plan is not available or suitable for your country, we will try to suggest an alternative plan or suitable option, whenever available.
          </Block>

          <Block icon="⚠️" title="Please Inform Us Before Payment">
            If you are an international customer, please provide your country name before making the payment. Do not assume that a plan available in India or another country will automatically work in your country. Your country information helps us recommend the correct option and avoid compatibility issues.
          </Block>

          <Block icon="💳" title="Important Payment & Activation Notice">
            Please make sure that you have provided your correct country and confirmed the plan's suitability before payment and activation. Once a digital plan or subscription has been activated, a refund may not be possible if the plan cannot be used because of country or regional restrictions. Refund requests are subject to our applicable Refund Policy and the circumstances of the order.
          </Block>

          <Block icon="🤝" title="Our Commitment">
            Our goal is to provide you with the most suitable option for your country and help you avoid unnecessary payment or activation issues. If you are unsure whether a particular plan will work in your country, contact us before making the payment.
          </Block>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-10 py-10 sm:py-12">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber">Need Help?</div>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl">International Customer?</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Send us the following details and we will check available options and guide you accordingly.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-3">
                <span className="text-lg">🌍</span>
                <span>Your Country</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg">📦</span>
                <span>Product / Plan Name</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg">⏱️</span>
                <span>Required Duration</span>
              </li>
            </ul>
            <a
              href={`${CONTACT.WA_URL}?text=${WA_PREFILL}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full bg-amber px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-amber-foreground transition hover:brightness-110"
            >
              Message on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-10 py-10 sm:py-12 text-center">
          <p className="text-sm text-muted-foreground">
            &nbsp;Thank you for providing your country information in advance and for helping us ensure that you receive a suitable plan for your region.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

function IntroBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/5 p-5 sm:p-6">
      <div className="flex items-start">
        <p className="text-foreground">{children}</p>
      </div>
    </div>
  );
}

function Block({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="flex items-center gap-3 font-display text-lg sm:text-xl text-foreground">
        <span className="text-xl">{icon}</span>
        {title}
      </h2>
      <div className="mt-3 pl-8 sm:pl-10">
        <div className="space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
}
