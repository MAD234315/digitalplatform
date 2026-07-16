import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <header className="absolute top-0 left-0 right-0 z-30">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary-foreground">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-primary-foreground font-display text-xl">P</span>
          <span className="font-display text-2xl">PixelVault</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-primary-foreground/80">
          <Link to="/" className="hover:text-primary-foreground transition">Home</Link>
          <Link to="/products" className="hover:text-primary-foreground transition">Products</Link>
          <a href="#trust" className="hover:text-primary-foreground transition">Why us</a>
          <a href="#faq" className="hover:text-primary-foreground transition">FAQ</a>
        </nav>
        <a
          href="https://wa.me/919999999999"
          className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2 text-sm font-medium text-whatsapp-foreground shadow-lift hover:brightness-105 transition"
        >
          <WhatsAppIcon className="h-4 w-4" />
          WhatsApp
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-display">P</span>
          <span>© {new Date().getFullYear()} PixelVault. Trusted since 2020.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/products" className="hover:text-foreground">Products</Link>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Refunds</a>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 22h-.007a9.94 9.94 0 01-5.06-1.385l-.363-.216-3.766.988 1.005-3.67-.236-.376A9.937 9.937 0 012.1 12.017C2.107 6.582 6.527 2.164 11.955 2.164c2.646.001 5.132 1.033 7.001 2.905a9.87 9.87 0 012.9 7.008c-.003 5.435-4.423 9.853-9.856 9.853m8.413-18.267A11.815 11.815 0 0011.95 0C5.463 0 .186 5.277.184 11.762c0 2.072.541 4.096 1.573 5.877L.057 24l6.541-1.716A11.85 11.85 0 0011.95 24h.005c6.482 0 11.759-5.278 11.762-11.764a11.72 11.72 0 00-3.454-8.303"/>
    </svg>
  );
}
