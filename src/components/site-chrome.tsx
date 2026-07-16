import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";



const WA_NUMBER = "919652191369";
const WA_URL = `https://wa.me/${WA_NUMBER}`;
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

        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Digital Platform home">
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
            href={WA_URL}
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
            href={WA_URL}
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
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-14 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
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
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            A trusted marketplace for premium digital products and AI tools. Genuine sources, honest prices, human support.
          </p>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-medium">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-amber">Products</Link></li>
            <li><Link to="/about" className="hover:text-amber">About</Link></li>
            <li><Link to="/faq" className="hover:text-amber">FAQ</Link></li>
            <li><Link to="/product-request" className="hover:text-amber">Product request</Link></li>
            <li><Link to="/contact" className="hover:text-amber">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-medium">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/privacy" className="hover:text-amber">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-amber">Terms &amp; Conditions</Link></li>
            <li><Link to="/refund" className="hover:text-amber">Refund Policy</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-medium">Reach us</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href={WA_URL} target="_blank" rel="noreferrer" className="hover:text-amber">WhatsApp →</a></li>
            <li><a href={`mailto:${EMAIL}`} className="hover:text-amber break-all">{EMAIL}</a></li>
          </ul>
        </div>
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
