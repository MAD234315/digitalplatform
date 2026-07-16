import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";
import { CONTACT } from "@/components/site-chrome";

const TITLE = "Refund Policy — Digital Platform";
const DESC =
  "How refunds and replacements are handled at Digital Platform for digital products, subscriptions, and licenses.";

export const Route = createFileRoute("/refund")({
  head: () =>
    buildRouteHead({ path: "/refund", title: TITLE, description: DESC, imageAlt: "Digital Platform — refund policy" }),
  component: Refund,
});

function Refund() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title="Refund"
        titleAccent="Policy."
        lede="Because we sell digital products, refunds are handled case by case. This page explains how we approach refunds and replacements, and how to raise a concern. Maintained by the Digital Platform team."
      />
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16 space-y-10 text-muted-foreground leading-relaxed">
          <Block title="Before you buy">
            Please read the product details carefully — including plan, validity, device support, and warranty — before placing an order. If anything is unclear, message us and we'll help you choose.
          </Block>
          <Block title="Order cancellations">
            If your order has not yet been processed, please contact us as soon as possible. Cancellation is possible depending on the product and its processing stage.
          </Block>
          <Block title="Refund eligibility">
            Refunds may be considered if a product could not be delivered, if the product materially differs from what was described, or if a covered issue cannot be resolved through replacement or support during the applicable warranty period.
          </Block>
          <Block title="Non-refundable situations">
            Refunds generally do not apply to change-of-mind requests, misuse of the product, breach of the underlying provider's terms, or issues caused by user error after successful delivery.
          </Block>
          <Block title="How to request a refund or replacement">
            Contact our support team with your order details and a description of the issue. We'll review your request and respond with the next steps as quickly as possible.
          </Block>
          <Block title="Contact">
            Reach us on{" "}
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
