import { Button } from "@/components/ui/button";
import { WaGlyph } from "@/components/products/wa-glyph";
import { CONTACT } from "@/components/site-chrome";
import { pricingEnquiryUrl } from "@/lib/product-presentation";

export function PricingEnquiry({ name, onClick, soldOut = false, compact = false }: { name: string; onClick?: () => void; soldOut?: boolean; compact?: boolean }) {
  const sizing = compact ? "shop-whatsapp-compact" : "h-8 whitespace-nowrap px-2 text-[11px]";
  if (soldOut) {
    return (
      <span className={`shop-whatsapp-button shop-whatsapp-sold-out inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 ${sizing}`} aria-disabled="true" title="Sold out — WhatsApp enquiries are paused for this product">
        <WaGlyph />
        <span>DM on WhatsApp</span>
      </span>
    );
  }
  return (
    <Button asChild className={`shop-whatsapp-button min-w-0 flex-1 shadow-none ${sizing}`} onClick={onClick}>
      <a href={pricingEnquiryUrl(CONTACT.WA_URL, name)} target="_blank" rel="noopener noreferrer" aria-label={`DM on WhatsApp about ${name}`}>
        <WaGlyph />
        <span>DM on WhatsApp</span>
      </a>
    </Button>
  );
}
