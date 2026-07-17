import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";



const WA_NUMBER = "919652191369";
const WA_URL = `https://wa.me/${WA_NUMBER}`;
const WA_GENERAL_PREFILL = "Hi Digital Platform! I'd like to get in touch about your products and pricing.";
const WA_URL_GENERAL = `${WA_URL}?text=${encodeURIComponent(WA_GENERAL_PREFILL)}`;
const WA_FOOTER_PREFILL = "Hi Digital Platform! I found you via your website and I'd like to know more.";
const WA_URL_FOOTER = `${WA_URL}?text=${encodeURIComponent(WA_FOOTER_PREFILL)}`;
const EMAIL = "Productcreator11@zohomail.in";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  // Subscribe only to pathname so unrelated router state changes don't re-render the header.
  const pathname = useRouterState({ select: (s): string => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  // Close mobile menu on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);


  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? "backdrop-blur-md bg-background/70 border-b border-border" : "bg-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-amber focus:px-4 focus:py-2 focus:text-sm focus:text-amber-foreground"
      >
        Skip to main content
      </a>
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-4">

        <Link
          to="/"
          className="-mx-2 -my-1 flex min-h-11 min-w-0 items-center gap-3 rounded-lg px-2 py-1 transition active:scale-[0.98] touch-manipulation motion-reduce:active:scale-100"
          aria-label="Digital Platform — back to top"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              const prefersReduced =
                typeof window !== "undefined" &&
                window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
              window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
            }
          }}
        >

          <span
            aria-hidden
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-display text-xl"
            style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
          >
            D
          </span>
          <span className="leading-tight min-w-0">
            <span className="block truncate font-display text-lg">Digital Platform</span>
            <span className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Since 2020</span>
          </span>
        </Link>


        <nav aria-label="Primary" className="hidden md:flex items-center gap-8 text-sm">
          {LINKS.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={active ? "page" : undefined}
                className={`relative py-2 transition ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {l.label}
                <span
                  aria-hidden
                  className={`absolute left-0 right-0 -bottom-0.5 h-px transition-transform origin-left ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                  style={{ backgroundColor: "var(--amber)" }}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <a
            href={WA_URL_GENERAL}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center min-h-11 rounded-full px-5 text-sm font-medium transition hover:brightness-110 shadow-gold"
            style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
          >
            Get in touch
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="md:hidden border-t border-border bg-background/95 backdrop-blur"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-7xl px-5 py-3 flex flex-col">
          {LINKS.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={active ? "page" : undefined}
                className={`min-h-12 flex items-center justify-between border-b border-border/60 text-base ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full transition ${active ? "opacity-100" : "opacity-0"}`}
                    style={{ backgroundColor: "var(--amber)" }}
                  />
                  {l.label}
                </span>
                <span aria-hidden className="text-muted-foreground/60">→</span>
              </Link>
            );
          })}
          <a
            href={WA_URL_GENERAL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center justify-center min-h-12 rounded-full px-5 text-sm font-medium"
            style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
          >
            Get in touch
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const linkCls =
    "rounded-sm outline-none transition-colors hover:text-amber focus-visible:text-amber";
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-14 grid gap-10 sm:grid-cols-2 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-md font-display text-lg"
              style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
            >
              D
            </span>
            <span className="font-display text-xl">Digital Platform</span>
          </div>
          <p className="mt-4 max-w-sm text-pretty text-sm text-muted-foreground">
            A trusted marketplace for premium digital products and AI tools. Genuine sources, honest prices, human support.
          </p>
        </div>
        <nav aria-label="Explore">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-medium">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/products" className={linkCls}>Products</Link></li>
            <li><Link to="/about" className={linkCls}>About</Link></li>
            <li><Link to="/faq" className={linkCls}>FAQ</Link></li>
            <li><Link to="/product-request" className={linkCls}>Product request</Link></li>
            <li><Link to="/contact" className={linkCls}>Contact</Link></li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-medium">POLICIES</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/privacy" className={linkCls}>Privacy Policy</Link></li>
            <li><Link to="/terms" className={linkCls}>Terms &amp; Conditions</Link></li>
            <li><Link to="/refund" className={linkCls}>Refund Policy</Link></li>
          </ul>
        </nav>
        <nav aria-label="Reach us">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-medium">Reach us</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href={WA_URL_FOOTER} target="_blank" rel="noreferrer" className={linkCls}>WhatsApp →</a></li>
            <li><a href={`mailto:${EMAIL}`} className={`${linkCls} break-all`}>{EMAIL}</a></li>
          </ul>

          <h2 className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground font-medium">Follow us</h2>
          <ul className="mt-3 flex items-center gap-3 justify-center sm:justify-start">
            <li>
              <a
                href="https://instagram.com/digitalplatform_"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow Digital Platform on Instagram"
                className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-all duration-[250ms] ease-out hover:scale-110 hover:border-amber/60 hover:text-amber hover:shadow-gold motion-reduce:hover:scale-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href={`${WA_URL}?text=${encodeURIComponent("Hi I'm interested in your digital products.")}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Chat with Digital Platform on WhatsApp"
                className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-all duration-[250ms] ease-out hover:scale-110 hover:border-amber/60 hover:text-amber hover:shadow-gold motion-reduce:hover:scale-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M20.5 3.5A11 11 0 0 0 3 17l-1 5 5.2-1.3A11 11 0 1 0 20.5 3.5Zm-8.5 18a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 1 1 12 21.5Zm5.2-6.7c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.2-.2.3-.7.9-.9 1-.2.2-.3.2-.6 0-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.3s.9 2.7 1 2.9c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.3-.1-.1-.2-.2-.5-.3Z" />
                </svg>
              </a>
            </li>
          </ul>
        </nav>

      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Digital Platform. Trusted since 2020.</span>
          <span>Premium digital solutions. Genuine sources.</span>
        </div>
      </div>
    </footer>
  );
}

export const CONTACT = { WA_NUMBER, WA_URL, EMAIL };
