import { Link, useRouterState } from "@tanstack/react-router";

const WA_NUMBER = "919652191369";
const WA_URL = `https://wa.me/${WA_NUMBER}`;
const EMAIL = "Productcreator11@zohomail.in";

export function SiteNav({ invert = false }: { invert?: boolean }) {
  const { location } = useRouterState();
  const links = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ] as const;

  return (
    <header className={`absolute top-0 inset-x-0 z-30 ${invert ? "text-ink" : "text-foreground"}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber font-display text-xl text-amber-foreground">D</span>
          <span className="leading-tight">
            <span className="block font-display text-lg">Digital Platform</span>
            <span className="block text-[10px] uppercase tracking-[0.22em] opacity-60">Since 2020</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-9 text-sm">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link key={l.to} to={l.to} className={`transition ${active ? "opacity-100" : "opacity-70 hover:opacity-100"}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <a href={WA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground hover:brightness-105 transition">
          Get in touch
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber font-display text-lg text-amber-foreground">D</span>
            <span className="font-display text-xl">Digital Platform</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            A trusted marketplace for premium digital products and AI tools. Genuine sources, honest prices, human support.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.22em] opacity-60">Explore</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.22em] opacity-60">Reach us</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href={WA_URL} target="_blank" rel="noreferrer">WhatsApp →</a></li>
            <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Digital Platform. Trusted since 2020.</span>
          <span>Premium digital solutions. Genuine sources.</span>
        </div>
      </div>
    </footer>
  );
}

export const CONTACT = { WA_NUMBER, WA_URL, EMAIL };
