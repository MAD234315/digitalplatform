import type { UIMessage } from "ai";
import { CONTACT } from "@/components/site-chrome";
import { WaGlyph } from "@/components/products/wa-glyph";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/** Plain text of a UI message (text parts only). */
function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/** Minimal shape needed to recommend a product in the handoff note. */
export type HandoffProduct = {
  name: string;
  plan?: string;
  validity?: string;
  availability?: string;
};

/**
 * Pick catalogue products the assistant actually mentioned in its final answer
 * (falling back to the visitor's question), longest names first so
 * "Canva Pro Team" wins over "Canva Pro".
 */
function matchProducts(haystack: string, products: HandoffProduct[]): HandoffProduct[] {
  const text = haystack.toLowerCase();
  const seen = new Set<string>();
  const hits: HandoffProduct[] = [];

  for (const product of [...products].sort((a, b) => b.name.length - a.name.length)) {
    const name = product.name?.trim();
    if (!name || name.length < 4) continue;
    const key = name.toLowerCase();
    if (seen.has(key) || !text.includes(key)) continue;
    seen.add(key);
    hits.push(product);
    if (hits.length >= 5) break;
  }
  return hits;
}

function productLine(product: HandoffProduct): string {
  const details = [product.plan, product.validity].filter(Boolean).join(" · ");
  return `• ${product.name}${details ? ` (${details})` : ""}`;
}

/**
 * Build the WhatsApp handoff note: the visitor's exact question, the
 * assistant's final answer, and any catalogue products it recommended.
 */
export function buildHandoffSummary(
  messages: UIMessage[],
  products: HandoffProduct[] = [],
): string {
  const questions = messages
    .filter((m) => m.role === "user")
    .map(messageText)
    .filter(Boolean);
  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant");
  const answer = lastAnswer ? stripMarkdown(messageText(lastAnswer)) : "";
  const question = questions.at(-1) ?? "";
  const earlier = questions.slice(0, -1).slice(-2);

  const lines = [
    "Hi Digital Platform! I was chatting with your website assistant and I'd like to continue here.",
  ];

  if (question) {
    lines.push("", "My question:", truncate(question, 500));
  }
  if (earlier.length) {
    lines.push("", "Earlier in the chat I asked:", ...earlier.map((q) => `• ${truncate(q, 160)}`));
  }
  if (answer) {
    lines.push("", "The assistant's answer:", `"${truncate(answer, 700)}"`);
  }

  const recommended = matchProducts(`${answer}\n${question}`, products);
  if (recommended.length) {
    lines.push("", "Products mentioned:", ...recommended.map(productLine));
  }

  lines.push("", "Could you confirm today's price and availability?");
  return lines.join("\n");
}


function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Preview + edit the handoff note before opening WhatsApp. */
export function HandoffDialog({
  open,
  onOpenChange,
  text,
  onTextChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  onTextChange: (text: string) => void;
}) {
  const href = `${CONTACT.WA_URL}?text=${encodeURIComponent(text)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send this summary to WhatsApp?</DialogTitle>
          <DialogDescription>
            We&apos;ll pass along what you asked so our team can pick up right where the assistant
            left off. Edit anything before you send.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={9}
          aria-label="WhatsApp handoff message"
          className="resize-none text-sm"
        />

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="min-h-11 rounded-full border border-border px-5 text-sm transition-colors hover:bg-card"
          >
            Keep chatting
          </button>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition-transform duration-200 hover:brightness-110 active:scale-[0.98] motion-reduce:transform-none"
            style={{ backgroundColor: "var(--whatsapp)" }}
          >
            <WaGlyph />
            Open WhatsApp
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
