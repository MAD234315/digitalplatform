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
  "Answers about our digital products, subscriptions, delivery, warranty and support — plus how our prices and plans change based on demand and availability.";

const slugifyCat = (name: string) =>
  name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");


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
        const targetId = next === "All" ? "faq-group-all" : `faq-heading-${slugifyCat(next)}`;
        const el = document.getElementById(targetId);
        if (!el) return;
        // Measure the top chrome at its final sticky position so the category
        // heading, not just the first question, lands fully below it.
        let stickyOffset = 0;
        document.querySelectorAll<HTMLElement>("header, [data-sticky], .sticky").forEach((node) => {
          const style = window.getComputedStyle(node);
          if (style.position !== "sticky" && style.position !== "fixed") return;
          const rect = node.getBoundingClientRect();
          if (rect.bottom <= 0) return;
          if (node.dataset.sticky === "filter-bar" && style.position === "sticky") {
            const cssTop = Number.parseFloat(style.top);
            const pinnedTop = Number.isFinite(cssTop) ? cssTop : Math.max(0, rect.top);
            stickyOffset = Math.max(stickyOffset, pinnedTop + rect.height);
            return;
          }
          if (rect.top < Math.min(window.innerHeight * 0.45, 260)) {
            stickyOffset = Math.max(stickyOffset, rect.bottom);
          }
        });
        const gap = 20;
        const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset - gap;
        const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: Math.max(0, top), behavior: prefersReduced ? "auto" : "smooth" });
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
        compact
        eyebrow="FREQUENTLY ASKED QUESTIONS"
        title="Everything you need"
        titleAccent="to know before purchasing."
        lede={<>{"'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            delete this"}</>}
      />


      <FilterBar
        categories={CATEGORIES}
        counts={counts}
        active={active}
        onActiveChange={handleActiveChange}
        query={q}
        onQueryChange={setQ}
        searchLabel="Search FAQs"
        searchPlaceholder="Search FAQs…"
        searchId="faq-search"
      />

      {/* Accordion list */}
      <section id="faq-group-all" className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-10 py-8 sm:py-10 scroll-mt-[160px] sm:scroll-mt-[180px]">
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
                <div className="space-y-8 sm:space-y-10">
                  {groups.map((g) => (
                    <div key={g.cat} id={`faq-group-${slugifyCat(g.cat)}`} className="scroll-mt-[180px] sm:scroll-mt-[200px]">
                      <div id={`faq-heading-${slugifyCat(g.cat)}`} className="mb-3 flex items-center gap-3 pl-3 border-l-2 border-[color:var(--amber)] scroll-mt-[180px] sm:scroll-mt-[200px]">
                        <h2 className="font-display text-xl sm:text-2xl leading-tight">
                          <span className="text-headline">{g.cat}</span>
                        </h2>
                        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          {g.items.length} {g.items.length === 1 ? "question" : "questions"}
                        </span>
                        <span aria-hidden className="hidden sm:block flex-1 h-px bg-gradient-to-r from-[color:var(--amber)]/30 to-transparent" />
                      </div>
                      <ul className="space-y-2.5">

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
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-10 py-12 sm:py-16 text-center">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Still have questions?</div>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl">
            Can&apos;t find <em className="text-headline">the answer</em> you&apos;re looking for?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Our support team is a message away — every day, limited hours.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <a
              href={`${CONTACT.WA_URL}?text=${encodeURIComponent(waPrefill)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
              style={{ backgroundColor: "var(--whatsapp)" }}
            >
              💬 Chat on WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT.EMAIL}`}
              className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em]"
            >
              📞 Email support
            </a>
          </div>
        </div>
      </section>


      
    </PageShell>
  );
}
