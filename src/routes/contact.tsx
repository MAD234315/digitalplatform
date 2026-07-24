import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { CONTACT } from "@/components/site-chrome";
import { ORG_ID, SITE_URL } from "@/lib/site-config";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";

const TITLE = "Contact Digital Platform — Support & Sales";
const DESC =
  "Reach us on WhatsApp for live pricing, stock checks and support. Typical reply within minutes, every day 10 AM – 10 PM IST.";

export const Route = createFileRoute("/contact")({
  head: () =>
    buildRouteHead({
      path: "/contact",
      title: TITLE,
      description: DESC,
      imageAlt: "Digital Platform — contact us",
      extraJsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          url: SITE_URL + "/contact",
          name: TITLE,
          description: DESC,
          publisher: { "@id": ORG_ID },
        },
      ],
    }),
  component: Contact,
});

function Contact() {
  return (
    <PageShell>
      <PageHero
        compact
        eyebrow="Contact"
        title={<>Let&apos;s <em className="text-headline">talk.</em></>}
        lede="The fastest way to reach us is WhatsApp — we typically reply at earliest with live pricing and stock updates."
      />


      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-10 py-10 sm:py-12 grid gap-4 sm:gap-5 md:grid-cols-2">
          <div className="group rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-amber transition">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber">Preferred</div>
            <h2 className="mt-2 font-display text-2xl">WhatsApp</h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Send a message with the product you&apos;re interested in.
            </p>
            <div className="mt-4 flex items-center gap-2.5 flex-wrap">
              <a
                href="tel:+919652191369"
                className="font-display text-lg hover:text-amber transition-colors"
              >
                +91 96521 91369
              </a>
              <CopyButton
                value="+91 96521 91369"
                successMessage="Phone number copied to clipboard!"
                errorMessage="Unable to copy phone number. Please copy it manually."
                labelIdle="Copy phone number"
                labelDone="Copied!"
                ariaIdle="Copy phone number"
                ariaDone="Phone number copied"
              />
            </div>
            <a
              href={`${CONTACT.WA_URL}?text=${encodeURIComponent("Hi Digital Platform! I'd like to know more about your products and pricing.")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 text-xs text-amber group-hover:translate-x-1 transition inline-flex"
            >
              Open WhatsApp →
            </a>
          </div>
          <div className="group rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-amber transition">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Email</div>
            <h2 className="mt-2 font-display text-2xl">Mail</h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Suggestions, feedback, or collabs? Drop us a line.
            </p>
            <div className="mt-4 flex items-center gap-2.5 flex-wrap">
              <a href={`mailto:${CONTACT.EMAIL}`} className="font-display text-base break-all hover:text-amber transition-colors">{CONTACT.EMAIL}</a>
              <CopyEmailButton email={CONTACT.EMAIL} />
            </div>
            <a href={`mailto:${CONTACT.EMAIL}`} className="mt-4 text-xs text-amber group-hover:translate-x-1 transition inline-flex">Send email →</a>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-10 py-10 sm:py-12 grid lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl sm:text-3xl">
              Contact <em className="text-headline">admin</em>
            </h2>
            <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
              For the fastest reply, include these details in your message:
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <li>• Your Full Name</li>
              <li>•&nbsp;Product or Service You&apos;re Interested In</li>
              <li>• Referral Details (if applicable)</li>
              <li>• Preferred Delivery Timeline</li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Support hours</div>
              <p className="mt-2 font-display text-xl">Every day, limited hours.</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Messages sent outside these hours get a reply first thing next morning.
              </p>
              <ul className="mt-4 space-y-2 text-xs">
                {[
                  "Live pricing on any listed product",
                  "Stock check before you order",
                  "Post-purchase support & warranty",
                  "Requests for products not in the catalogue",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2.5">
                    <span className="text-amber">✓</span>{x}
                  </li>
                ))}
              </ul>
              <a
                href={`${CONTACT.WA_URL}?text=Hi%2C%20I%27d%20like%20live%20pricing%20on%3A`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-full bg-amber px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-amber-foreground"
              >
                Send via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

    </PageShell>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  return (
    <CopyButton
      value={email}
      successMessage="Email copied to clipboard!"
      errorMessage="Unable to copy email. Please copy it manually."
      labelIdle="Copy email"
      labelDone="Copied!"
      ariaIdle="Copy email address"
      ariaDone="Email copied"
    />
  );
}

function CopyButton({
  value,
  successMessage,
  errorMessage,
  labelIdle,
  labelDone,
  ariaIdle,
  ariaDone,
}: {
  value: string;
  successMessage: string;
  errorMessage: string;
  labelIdle: string;
  labelDone: string;
  ariaIdle: string;
  ariaDone: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for insecure contexts / older browsers.
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("execCommand copy failed");
      }
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[CopyButton]", err);
      toast.error(errorMessage);
    }
  };


  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? ariaDone : ariaIdle}
      title={copied ? labelDone : labelIdle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-all duration-200 hover:border-amber hover:text-amber hover:-translate-y-0.5 hover:shadow-[0_0_0_3px_rgba(212,175,55,0.12)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-400" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
