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

/**
 * Build the WhatsApp handoff note: a short recap of what the visitor asked
 * (and the assistant's last answer) so support has context before replying.
 */
export function buildHandoffSummary(messages: UIMessage[]): string {
  const questions = messages
    .filter((m) => m.role === "user")
    .map(messageText)
    .filter(Boolean);
  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant");

  const recent = questions.slice(-3);
  const lines = [
    "Hi Digital Platform! I was chatting with your website assistant and I'd like to continue here.",
    "",
    recent.length > 1 ? "What I asked:" : "My question:",
    ...recent.map((q) => `• ${truncate(q, 220)}`),
  ];

  const answer = lastAnswer ? messageText(lastAnswer) : "";
  if (answer) {
    lines.push("", "The assistant replied:", `"${truncate(stripMarkdown(answer), 320)}"`);
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
