import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";
import { CONTACT } from "@/components/site-chrome";

const TITLE = "Privacy Policy — Digital Platform";
const DESC =
  "How Digital Platform collects, uses, and protects the personal information you share while ordering our digital products.";

export const Route = createFileRoute("/privacy")({
  head: () =>
    buildRouteHead({ path: "/privacy", title: TITLE, description: DESC, imageAlt: "Digital Platform — privacy policy" }),
  component: Privacy,
});

function Privacy() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title="Privacy"
        titleAccent="Policy."
        lede="This page describes how Digital Platform handles the personal information you share when you contact us or place an order. It is maintained by the Digital Platform team and may be updated from time to time."
      />
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16 space-y-10 text-muted-foreground leading-relaxed">
          <Block title="Information we collect">
            When you contact us or place an order, we may collect your name, WhatsApp number, email address, payment reference, and the details required to deliver the specific product you ordered (for example, an account email where a license needs to be delivered).
          </Block>
          <Block title="How we use your information">
            We use your information only to process your order, deliver your product, verify payments, and provide customer support. We do not use it for unrelated marketing.
          </Block>
          <Block title="Sharing your information">
            We do not sell your personal information. We share it only where strictly necessary to complete your order — for example, with payment providers to verify a transaction.
          </Block>
          <Block title="Data retention">
            We retain order-related information only as long as needed to provide support, honour warranty commitments, and meet standard record-keeping requirements.
          </Block>
          <Block title="Your choices">
            You can request access to, correction of, or deletion of the personal information we hold about you by contacting us at{" "}
            <a href={`mailto:${CONTACT.EMAIL}`} className="text-foreground underline">{CONTACT.EMAIL}</a>.
          </Block>
          <Block title="Security">
            We use trusted payment providers and reasonable safeguards to help protect your information. No system is perfectly secure, so we encourage you to keep your own account credentials safe.
          </Block>
          <Block title="Contact">
            Questions about this policy? Reach us on{" "}
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
