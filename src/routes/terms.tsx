import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";
import { CONTACT } from "@/components/site-chrome";

const TITLE = "Terms & Conditions — Digital Platform";
const DESC =
  "The terms under which you may use Digital Platform and purchase digital products, subscriptions, and licenses from us.";

export const Route = createFileRoute("/terms")({
  head: () =>
    buildRouteHead({ path: "/terms", title: TITLE, description: DESC, imageAlt: "Digital Platform — terms and conditions" }),
  component: Terms,
});

function Terms() {
  return (
    <PageShell>
      <PageHero
        eyebrow={"POLICIES\n\n"}
        title="Terms &amp;"
        titleAccent="Conditions."
        lede="By using Digital Platform or placing an order, you agree to the terms below. This page is maintained by the Digital Platform team and may be updated from time to time."
      />
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16 space-y-10 text-muted-foreground leading-relaxed">
          <Block title="Our products">
            Digital Platform is a marketplace for premium digital products, subscriptions, licenses, and gift cards. Products, plans, availability, and pricing may change based on stock and market conditions.
          </Block>
          <Block title="Orders and payment">
            Orders are confirmed only after payment is verified. Please share your payment reference with our support team so we can process your order promptly.
          </Block>
          <Block title="Delivery">
            Delivery times vary by product. Most digital products are delivered shortly after payment verification, though some may take longer. You will be notified once your product has been delivered.
          </Block>
          <Block title="Warranty and support">
            Warranty details, when applicable, are displayed on each product card. Our support team is available to help with eligible issues — please share your order details when you reach out.
          </Block>
          <Block title="Acceptable use">
            Products must be used in accordance with the terms and conditions of the underlying service or provider. You are responsible for keeping your account credentials safe and using products only for lawful purposes.
          </Block>
          <Block title="Limitation of liability">
            Digital Platform is not responsible for changes made by third-party service providers to their plans, pricing, or availability after your order has been delivered.
          </Block>
          <Block title="Contact">
            Questions about these terms? Reach us on{" "}
            <a href={CONTACT.WA_URL} target="_blank" rel="noreferrer" className="text-foreground underline">WhatsApp</a>{" "}
            or email{" "}
            <a href={`mailto:${CONTACT.EMAIL}`} className="text-foreground underline">{CONTACT.EMAIL}</a>.
          </Block>
        </div>
      </section>
    </PageShell>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      <p className="mt-3">{children}</p>
    </div>
  );
}
