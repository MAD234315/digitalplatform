import { useState } from "react";
import { Check, FileDown, Loader2 } from "lucide-react";
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
 * Build a SHORT WhatsApp handoff note: only the visitor's latest question, a
 * trimmed version of the assistant's final answer and any recommended
 * products. The full conversation goes out as a PDF attachment instead, so the
 * WhatsApp message never becomes a wall of text.
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

  const lines = [
    "Hi Digital Platform! I was chatting with your website assistant and I'd like to continue here.",
  ];

  if (question) {
    lines.push("", `My question: ${truncate(question, 220)}`);
  }
  if (answer) {
    lines.push("", `Assistant said: ${truncate(answer, 280)}`);
  }

  const recommended = matchProducts(`${answer}\n${question}`, products);
  if (recommended.length) {
    lines.push("", "Products mentioned:", ...recommended.slice(0, 3).map(productLine));
  }

  lines.push("", "Could you confirm today's price and availability?");
  lines.push("(Full chat transcript attached as a PDF.)");
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

/** Show the handoff options (no transcript preview) and download the chat PDF. */
export function HandoffDialog({
  open,
  onOpenChange,
  text,
  messages = [],
  chatLink,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  onTextChange?: (text: string) => void;
  messages?: UIMessage[];
  chatLink?: string;
}) {
  const message = chatLink ? `${text}\n\nChat history link: ${chatLink}` : text;
  const href = `${CONTACT.WA_URL}?text=${encodeURIComponent(message)}`;
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const { downloadChatTranscriptPdf } = await import("@/lib/chat-transcript-pdf");
      await downloadChatTranscriptPdf(messages);
      setDownloaded(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>Continue on WhatsApp?</DialogTitle>
          <DialogDescription>
            We keep the message short — download the full conversation as a PDF and attach it in
            WhatsApp if our admin needs the details.
          </DialogDescription>
        </DialogHeader>


        <button
          type="button"
          onClick={downloadPdf}
          disabled={downloading || messages.length === 0}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:border-amber/40 hover:bg-card disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : downloaded ? (
            <Check className="size-4 text-amber" aria-hidden />
          ) : (
            <FileDown className="size-4 text-amber" aria-hidden />
          )}
          {downloaded ? "Chat PDF saved" : "Download full chat as PDF"}
        </button>




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
