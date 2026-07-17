import { CONTACT } from "@/components/site-chrome";

/**
 * Floating WhatsApp CTA anchored to the bottom-right of the viewport.
 *
 * `prefill` is URL-encoded and appended as `?text=…` so tapping the button
 * opens WhatsApp with a message ready to send — useful on pages where we
 * want to funnel visitors into a specific conversation (FAQ, product).
 */
export function WhatsAppFab({ prefill }: { prefill?: string }) {
  const href = prefill
    ? `${CONTACT.WA_URL}?text=${encodeURIComponent(prefill)}`
    : CONTACT.WA_URL;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed right-5 z-40 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-soft transition-transform duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98] motion-reduce:transform-none"
      style={{
        backgroundColor: "var(--whatsapp)",
        bottom: "calc(1.25rem + env(safe-area-inset-bottom))",
      }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M20.5 3.5A11 11 0 0 0 3 17l-1 5 5.2-1.3A11 11 0 1 0 20.5 3.5Zm-8.5 18a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 1 1 12 21.5Zm5.2-6.7c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.2-.2.3-.7.9-.9 1-.2.2-.3.2-.6 0-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.3s.9 2.7 1 2.9c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.3-.1-.1-.2-.2-.5-.3Z" />
      </svg>
      <span className="hidden sm:inline">Need help? Chat</span>
    </a>
  );
}
