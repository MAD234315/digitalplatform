import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery } from "@tanstack/react-query";
import { getSheetProducts } from "@/lib/sheet-products.functions";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Plus, Trash2, History, Sparkle } from "lucide-react";
import { CONTACT } from "@/components/site-chrome";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
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
import {
  ChatFrame,
  CHAT_DESC,
  CHAT_QUICK_PROMPTS,
  CHAT_TITLE,
  CHAT_URL,
} from "@/components/chat/chat-frame";
import { HandoffDialog, buildHandoffSummary } from "@/components/chat/handoff";
import { getVisitorId } from "@/lib/chat-visitor";
import {
  createChatThread,
  deleteChatThread,
  getChatThread,
  listChatThreads,
  saveChatMessages,
  type ChatThreadSummary,
  type StoredChatMessage,
} from "@/lib/chat-threads.functions";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: CHAT_TITLE },
      { name: "description", content: CHAT_DESC },
      { property: "og:title", content: CHAT_TITLE },
      { property: "og:description", content: CHAT_DESC },
      { property: "og:url", content: CHAT_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: CHAT_TITLE },
      { name: "twitter:description", content: CHAT_DESC },
    ],
    links: [{ rel: "canonical", href: CHAT_URL }],
  }),
  component: ChatThreadPage,
});

function toUiMessages(stored: StoredChatMessage[]): UIMessage[] {
  return stored.map((m) => ({ id: m.id, role: m.role, parts: m.parts })) as UIMessage[];
}

function toStored(messages: UIMessage[]): StoredChatMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role as StoredChatMessage["role"],
    parts: m.parts as StoredChatMessage["parts"],
  }));
}

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();

  const [visitorId, setVisitorId] = useState("");
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => setVisitorId(getVisitorId()), []);

  const refreshThreads = useCallback(async (vid: string) => {
    try {
      setThreads(await listChatThreads({ data: { visitorId: vid } }));
    } catch {
      /* history list is best-effort */
    }
  }, []);

  // Load the thread named in the URL. Unknown/foreign threads bounce to /chat.
  useEffect(() => {
    if (!visitorId) return;
    let cancelled = false;
    setInitial(null);
    void (async () => {
      try {
        const result = await getChatThread({ data: { visitorId, threadId } });
        if (cancelled) return;
        if (!result) {
          void navigate({ to: "/chat", replace: true });
          return;
        }
        setInitial(toUiMessages(result.messages));
      } catch {
        if (!cancelled) setInitial([]);
      }
      void refreshThreads(visitorId);
    })();
    return () => {
      cancelled = true;
    };
  }, [visitorId, threadId, navigate, refreshThreads]);

  const newThread = async () => {
    if (!visitorId) return;
    const { id } = await createChatThread({ data: { visitorId } });
    await refreshThreads(visitorId);
    void navigate({ to: "/chat/$threadId", params: { threadId: id } });
  };

  const removeThread = async (id: string) => {
    if (!visitorId) return;
    await deleteChatThread({ data: { visitorId, threadId: id } });
    const remaining = await listChatThreads({ data: { visitorId } });
    setThreads(remaining);
    if (id === threadId) {
      const next = remaining[0]?.id ?? (await createChatThread({ data: { visitorId } })).id;
      void navigate({ to: "/chat/$threadId", params: { threadId: next }, replace: true });
    }
  };

  return (
    <ChatFrame>
      <div className="relative flex h-[min(850px,calc(100dvh-120px))] w-full min-w-0 max-w-7xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-gold-lg">
        <ThreadList
          threads={threads}
          activeId={threadId}
          onNew={newThread}
          onDelete={removeThread}
        />
        {initial === null ? (
          <div className="flex flex-1 items-center justify-center rounded-xl text-sm text-muted-foreground">
            Loading your conversation…
          </div>
        ) : (
          <ChatWindow
            key={threadId}
            threadId={threadId}
            visitorId={visitorId}
            initialMessages={initial}
            onNew={newThread}
            onSaved={() => void refreshThreads(visitorId)}
          />
        )}
      </div>
    </ChatFrame>
  );
}

function ThreadList({
  threads,
  activeId,
  onNew,
  onDelete,
}: {
  threads: ChatThreadSummary[];
  activeId: string;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside
      aria-label="Saved conversations"
      className="hidden w-72 flex-col border-r border-border bg-black/40 backdrop-blur-xl lg:flex"
    >
      <div className="p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="inline-flex size-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-200">
            <div className="size-7 rounded-full bg-black" />
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-amber/80">Digital AI</span>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Your chats</h3>
          <button
            type="button"
            onClick={onNew}
            aria-label="Start a new conversation"
            className="inline-flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-amber/40 hover:text-foreground"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>

        <ul className="space-y-1 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:max-h-[420px]">
          {threads.length === 0 && (
            <li className="px-2 py-2 text-xs text-muted-foreground">No saved conversations yet.</li>
          )}
          {threads.map((t) => {
            const active = t.id === activeId;
            return (
              <li
                key={t.id}
                className={`flex items-center gap-1 rounded-xl border px-1 transition-colors ${
                  active ? "border-amber/20 bg-amber/5" : "border-transparent hover:bg-background"
                }`}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  aria-current={active ? "page" : undefined}
                  className="min-h-10 flex-1 truncate px-2 py-1.5 text-left text-sm"
                >
                  {t.title}
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(t.id)}
                  aria-label={`Delete conversation: ${t.title}`}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto border-t border-border p-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full border border-border bg-muted">
            <div className="size-full rounded-full bg-gradient-to-b from-amber/20 to-transparent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Guest visitor</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-amber/70">AI concierge</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ChatWindow({
  threadId,
  visitorId,
  initialMessages,
  onNew,
  onSaved,
}: {
  threadId: string;
  visitorId: string;
  initialMessages: UIMessage[];
  onNew: () => void;
  onSaved: () => void;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // Persist the transcript to the visitor's saved history once a turn settles.
  const savedRef = useRef("");
  useEffect(() => {
    if (!visitorId || status === "streaming" || status === "submitted") return;
    if (!messages.length) return;
    const signature = `${messages.length}:${messages[messages.length - 1]?.id ?? ""}`;
    if (savedRef.current === signature) return;
    savedRef.current = signature;
    void saveChatMessages({ data: { visitorId, threadId, messages: toStored(messages) } })
      .then(onSaved)
      .catch(() => {
        savedRef.current = "";
      });
  }, [messages, status, visitorId, threadId, onSaved]);

  const focusInput = useCallback(() => textareaRef.current?.focus(), []);
  useEffect(() => {
    focusInput();
  }, [focusInput, threadId]);
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

  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffText, setHandoffText] = useState("");

  // Catalogue names let the handoff note list the products the assistant recommended.
  const { data: catalogue } = useQuery({
    queryKey: ["sheet-products"],
    queryFn: () => getSheetProducts(),
    staleTime: 60_000,
  });

  const openHandoff = () => {
    setHandoffText(
      buildHandoffSummary(
        messages,
        (catalogue?.products ?? []).map((p) => ({
          name: p.name,
          plan: p.plan,
          validity: p.validity,
          availability: p.availability,
        })),
      ),
    );
    setHandoffOpen(true);
  };

  const hasMessages = messages.length > 0;

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-950/10 via-transparent to-transparent">

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="size-2.5 rounded-full bg-amber shadow-[0_0_10px_rgba(245,158,11,0.6)]" aria-hidden />
            <span className="absolute inset-0 size-2.5 animate-ping rounded-full bg-amber opacity-50" aria-hidden />
          </div>
          <span className="text-xs font-medium uppercase tracking-widest text-amber/80">AI Assistant Online</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-amber/5 px-4 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber/10"
          >
            <Plus className="size-3.5" aria-hidden />
            New dialogue
          </button>
        </div>
      </header>

      {/* Empty state hero */}
      {!hasMessages && (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-4 text-center sm:px-8 lg:px-24">
          <div className="mb-6 max-w-full sm:mb-10">
            <h1 className="max-w-full break-words font-display text-3xl font-normal text-foreground sm:text-5xl lg:text-6xl">
              Ask us <span className="italic text-amber">anything.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-full text-sm leading-relaxed text-muted-foreground sm:max-w-md sm:text-base">
              Ask about products, prices, delivery, warranty or support. Our AI assistant is ready to help you find the right digital product.
            </p>
          </div>

          <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {CHAT_QUICK_PROMPTS.slice(0, 3).map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => submit(q.prompt)}
                disabled={busy}
                className="group rounded-2xl border border-border bg-white/[0.02] p-4 text-left transition-colors hover:border-amber/30 hover:bg-amber/[0.03] disabled:opacity-50 sm:p-5"
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber">{q.label}</p>
                <p className="text-sm text-muted-foreground group-hover:text-foreground">{q.prompt}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {hasMessages && (
        <Conversation className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-8 [-webkit-overflow-scrolling:touch] [contain:layout_paint]">
          <ConversationContent className="gap-4 py-4">
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent className="min-w-0 max-w-full [overflow-wrap:anywhere]">
                  {message.parts.map((part, i) =>
                    part.type === "text" ? <MessageResponse key={i}>{part.text}</MessageResponse> : null,
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
      )}

      {/* Composer + quick prompts + WhatsApp */}
      <div className="shrink-0 border-t border-border p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          aria-label="Quick questions"
          className="mb-3 flex snap-x gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CHAT_QUICK_PROMPTS.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => submit(q.prompt)}
              disabled={busy}
              title={q.prompt}
              className="inline-flex min-h-8 shrink-0 snap-start items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-amber/40 hover:text-foreground disabled:opacity-50"
            >
              <Sparkle className="size-3 shrink-0 text-amber" aria-hidden />
              {q.label}
            </button>
          ))}
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber/20 to-amber-950/20 opacity-25 blur transition duration-1000 group-focus-within:opacity-100" />
          <div className="relative flex items-end rounded-3xl border border-border bg-[#0a0a0a] p-3 shadow-2xl sm:p-4">
            <PromptInput
              onSubmit={(message: PromptInputMessage) => submit(message.text ?? input)}
              className="flex-1"
            >
              <PromptInputTextarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a product, price, delivery or warranty…"
                className="min-h-[60px] border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:ring-0"
              />
              <PromptInputFooter className="justify-end pt-1">
                <PromptInputSubmit
                  status={status}
                  disabled={!input.trim() && !busy}
                  className="size-11 rounded-2xl bg-gradient-to-b from-amber to-amber-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:brightness-110"
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>

        {messages.some((m) => m.role === "user") && (
          <button
            type="button"
            onClick={openHandoff}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-transform duration-200 hover:brightness-110 active:scale-[0.98] motion-reduce:transform-none"
            style={{ backgroundColor: "var(--whatsapp)" }}
          >
            <WaGlyph />
            Continue this chat on WhatsApp
          </button>
        )}

        <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          AI-generated. Confirm today&apos;s price on{" "}
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
        messages={messages}
      />
    </main>
  );
}
