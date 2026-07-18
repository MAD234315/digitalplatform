import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CONTACT } from "@/components/site-chrome";
import { ORG_ID } from "@/lib/site-config";
import { FAQS, CATEGORIES } from "@/components/faq/data";
import { FaqItem } from "@/components/faq/FaqItem";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { FilterBar } from "@/components/layout/FilterBar";
import { ErrorBoundary } from "@/components/error-boundary";

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

  const handleActiveChange = (next: (typeof CATEGORIES)[number]) => {
    setActive(next);
    if (typeof window === "undefined") return;
    // Wait for the list to re-render with the new filter before scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetId = next === "All" ? "faq-group-all" : `faq-group-${slugifyCat(next)}`;
        const el = document.getElementById(targetId);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };


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
        <ErrorBoundary boundary="faq:list" resetKeys={[active, q]}>
          {filtered.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">
              No questions match your search. Try a different keyword or category.
            </div>
          ) : (
            (() => {
              // Group by category, preserving CATEGORIES order (skip "All").
              const order = CATEGORIES.filter((c) => c !== "All");
              const groups = order
                .map((cat) => ({ cat, items: filtered.filter((f) => f.cat === cat) }))
                .filter((g) => g.items.length > 0);
              let idx = 0;
              return (
                <div className="space-y-14">
                  {groups.map((g) => (
                    <div key={g.cat}>
                      <div className="mb-5 flex items-center gap-4 pl-4 border-l-2 border-[color:var(--amber)]">
                        <h2 className="font-display text-2xl sm:text-3xl leading-tight">
                          <span className="text-headline">{g.cat}</span>
                        </h2>
                        <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          {g.items.length} {g.items.length === 1 ? "question" : "questions"}
                        </span>
                        <span aria-hidden className="hidden sm:block flex-1 h-px bg-gradient-to-r from-[color:var(--amber)]/30 to-transparent" />
                      </div>
                      <ul className="space-y-3.5">
                        {g.items.map((f) => {
                          const i = idx++;
                          return (
                            <ErrorBoundary key={`${f.cat}-${i}`} boundary="faq:item" fallback={null}>
                              <Reveal as="li" delay={Math.min(i, 6) * 60} y={18}>
                                <FaqItem f={f} />
                              </Reveal>
                            </ErrorBoundary>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </ErrorBoundary>
      </section>


      {/* CTA */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 lg:py-28 text-center">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Still have questions?</div>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">
            Can&apos;t find <em className="text-headline">the answer</em> you&apos;re looking for?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
            Our support team is a message away — every day, limited hours.
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

      
    </PageShell>
  );
}
