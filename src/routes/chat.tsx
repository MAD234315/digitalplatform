import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { CONTACT } from "@/components/site-chrome";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { WaGlyph } from "@/components/products/wa-glyph";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SITE_URL } from "@/lib/site-config";

const URL = SITE_URL + "/chat";
const TITLE = "Ask Digital Platform — AI catalogue & support assistant";
const DESC =
  "Chat with the Digital Platform assistant about subscriptions, AI tools, delivery, warranty and pricing — then finish your order on WhatsApp.";

const STORAGE_KEY = "dp-chat-messages-v1";

const SUGGESTIONS = [
  "What AI tools do you have in stock?",
  "How fast is delivery?",
  "Do you offer a warranty?",
  "How do I place an order?",
];

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ChatPage,
});

function loadStored(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function ChatPage() {
  // Hydration-safe: SSR renders the empty transcript, then we restore.
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  useEffect(() => setInitial(loadStored()), []);

  if (initial === null) return <ChatFrame>{null}</ChatFrame>;
  return <ChatFrame><ChatWindow initialMessages={initial} /></ChatFrame>;
}

function ChatFrame({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <PageHero
        compact
        eyebrow="AI assistant"
        title="Ask us"
        titleAccent="anything."
        lede="Our assistant knows the live catalogue, delivery times, warranty and support hours. When you're ready to buy, we hand you over to WhatsApp."
      />
      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 pb-16">
        {children}
      </section>
    </PageShell>
  );
}

function ChatWindow({ initialMessages }: { initialMessages: UIMessage[] }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: "dp-support",
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // Persist the single ongoing conversation to this browser only.
  useEffect(() => {
    if (status === "streaming") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* quota or private mode — chat still works for this session */
    }
  }, [messages, status]);

  const focusInput = useCallback(() => textareaRef.current?.focus(), []);
  useEffect(() => {
    focusInput();
  }, [focusInput]);
  useEffect(() => {
    if (status === "ready") focusInput();
  }, [status, focusInput]);

  const busy = status === "submitted" || status === "streaming";

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setInput("");
      void sendMessage({ text: trimmed });
      focusInput();
    },
    [busy, sendMessage, focusInput],
  );

  const clear = () => {
    setMessages([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    focusInput();
  };

  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffText, setHandoffText] = useState("");

  const openHandoff = () => {
    setHandoffText(buildHandoffSummary(messages));
    setHandoffOpen(true);
  };


  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-amber/15 text-amber">
            <MessageSquare className="size-3.5" aria-hidden />
          </span>
          <span className="font-medium">Digital Platform assistant</span>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="min-h-9 rounded-full border border-border px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            New conversation
          </button>
        )}
      </div>

      <Conversation className="h-[min(60vh,540px)]">
        <ConversationContent className="gap-6 p-4 sm:p-5">
          {messages.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Ask about any product, price, delivery time or warranty.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="min-h-11 rounded-full border border-border px-4 text-xs transition-colors hover:border-amber/40 hover:bg-background"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <MessageResponse key={i}>{part.text}</MessageResponse>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking...</Shimmer>
              </MessageContent>
            </Message>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              Something went wrong. Please try again, or{" "}
              <a href={CONTACT.WA_URL} target="_blank" rel="noreferrer" className="underline">
                message us on WhatsApp
              </a>
              .
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3 sm:p-4">
        <PromptInput
          onSubmit={(message: PromptInputMessage) => submit(message.text ?? input)}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a product, price, delivery or warranty…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() && !busy} />
          </PromptInputFooter>
        </PromptInput>

        {messages.some((m) => m.role === "user") && (
          <button
            type="button"
            onClick={openHandoff}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-transform duration-200 hover:brightness-110 active:scale-[0.98] motion-reduce:transform-none"
            style={{ backgroundColor: "var(--whatsapp)" }}
          >
            <WaGlyph />
            Continue this chat on WhatsApp
          </button>
        )}

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Answers are AI-generated. Confirm today&apos;s price on{" "}
          <a href={CONTACT.WA_URL} target="_blank" rel="noreferrer" className="underline">
            WhatsApp
          </a>
          .
        </p>
      </div>

      <HandoffDialog
        open={handoffOpen}
        onOpenChange={setHandoffOpen}
        text={handoffText}
        onTextChange={setHandoffText}
      />
    </div>
  );

}

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
function buildHandoffSummary(messages: UIMessage[]): string {
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
function HandoffDialog({
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
            We&apos;ll pass along what you asked so our team can pick up right where the
            assistant left off. Edit anything before you send.
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
