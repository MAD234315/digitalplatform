import { Button } from "@/components/ui/button";
import { WaGlyph } from "@/components/products/wa-glyph";
import { CONTACT } from "@/components/site-chrome";
import { pricingEnquiryUrl } from "@/lib/product-presentation";

export function PricingEnquiry({ name, onClick }: { name: string; onClick?: () => void }) {
  return (
    <Button asChild className="shop-whatsapp-button h-auto min-h-11 min-w-0 flex-1 whitespace-normal px-3 py-2.5 text-xs shadow-none" onClick={onClick}>
      <a href={pricingEnquiryUrl(CONTACT.WA_URL, name)} target="_blank" rel="noopener noreferrer" aria-label={`DM on WhatsApp about ${name}`}>
        <WaGlyph />
        <span>DM on WhatsApp</span>
      </a>
    </Button>
  );
}