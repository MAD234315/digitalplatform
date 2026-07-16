import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CONTACT } from "@/components/site-chrome";
import { ORG_ID } from "@/lib/site-config";
import { FAQS, CATEGORIES } from "@/components/faq/data";
import { FaqItem } from "@/components/faq/FaqItem";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { FilterBar } from "@/components/layout/FilterBar";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { buildRouteHead } from "@/lib/seo";
import { Reveal } from "@/components/reveal";

const TITLE = "FAQ — Digital Platform | Orders, Delivery, Warranty & Support";
const DESC =
  "Answers to the most common questions about our digital products, subscriptions, delivery process, warranty, and support at Digital Platform.";

export const Route = createFileRoute("/faq")({
  head: () =>
    buildRouteHead({
      path: "/faq",
      title: TITLE,
      description: DESC,
      imageAlt: "Digital Platform — frequently asked questions",
      extraJsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          publisher: { "@id": ORG_ID },
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    }),
  component: FAQPage,
});

function FAQPage() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FAQS.filter((f) => {
      if (active !== "All" && f.cat !== active) return false;
      if (needle && !(f.q + " " + f.a).toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [active, q]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    m.set("All", FAQS.length);
    for (const f of FAQS) m.set(f.cat, (m.get(f.cat) ?? 0) + 1);
    return m;
  }, []);

  const waPrefill = "Hi, I have a question about your products.";

  return (
    <PageShell>
      <PageHero
        eyebrow="Frequently asked questions"
        title="Everything you need"
        titleAccent="to know before purchasing."
        lede={<>Answers to the most common questions about our digital products, subscriptions, delivery, warranty, and support. Can&apos;t find what you&apos;re looking for? Message us — we usually reply within minutes.</>}
      />

      <FilterBar
        categories={CATEGORIES}
        counts={counts}
        active={active}
        onActiveChange={setActive}
        query={q}
        onQueryChange={setQ}
        searchLabel="Search FAQs"
        searchPlaceholder="Search FAQs…"
        searchId="faq-search"
      />

      {/* Accordion list */}
      <section className="mx-auto max-w-5xl px-6 lg:px-10 py-14">
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            No questions match your search. Try a different keyword or category.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((f, i) => (
              <li key={`${f.cat}-${i}`}>
                <FaqItem f={f} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 lg:py-28 text-center">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Still have questions?</div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">
            Can&apos;t find <em className="text-headline">the answer</em> you&apos;re looking for?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
            Our support team is a message away — every day, 10 AM to 10 PM IST.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={`${CONTACT.WA_URL}?text=${encodeURIComponent(waPrefill)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white"
              style={{ backgroundColor: "var(--whatsapp)" }}
            >
              💬 Chat on WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT.EMAIL}`}
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em]"
            >
              📞 Email support
            </a>
          </div>
        </div>
      </section>

      <WhatsAppFab prefill={waPrefill} />
    </PageShell>
  );
}
