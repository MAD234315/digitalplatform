import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, History, Plus, User, WifiOff } from "lucide-react";


import { getSheetProducts } from "@/lib/sheet-products.functions";
import { CONTACT } from "@/components/site-chrome";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { WaGlyph } from "@/components/products/wa-glyph";
import {
  ChatFrame,
  CHAT_DESC,
  CHAT_QUICK_PROMPTS,
  CHAT_SUGGESTION_CHIPS,
  CHAT_TITLE,
  CHAT_URL,
} from "@/components/chat/chat-frame";
import { ChatHistorySheet } from "@/components/chat/chat-history-sheet";
import { HandoffDialog, buildHandoffSummary } from "@/components/chat/handoff";
import { getVisitorId } from "@/lib/chat-visitor";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  createChatThread,
  deleteChatThread,
  getChatThread,
  listChatThreads,
  renameChatThread,
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

function messageText(message: UIMessage): string {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

/** Buying intent — the only time the WhatsApp CTA appears. */
const INTENT_RE =
  /\b(price|pricing|cost|how much|buy|purchase|order|pay|payment|interested|admin|contact|subscribe|activate)\b/i;

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();

  const [visitorId, setVisitorId] = useState("");
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => setVisitorId(getVisitorId()), []);


  const refreshThreads = useCallback(async (vid: string) => {
    if (!vid) return;
    try {
      setThreads(await listChatThreads({ data: { visitorId: vid } }));
    } catch {
      /* history list is best-effort */
    }
  }, []);

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

  const newThread = useCallback(async () => {
    if (!visitorId) return;
    const { id } = await createChatThread({ data: { visitorId } });
    await refreshThreads(visitorId);
    void navigate({ to: "/chat/$threadId", params: { threadId: id } });
  }, [visitorId, refreshThreads, navigate]);

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

  const rename = async (id: string, title: string) => {
    if (!visitorId) return;
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    try {
      await renameChatThread({ data: { visitorId, threadId: id, title } });
    } finally {
      void refreshThreads(visitorId);
    }
  };

  return (
    <ChatFrame>
      <div className="relative flex h-[calc(100dvh-64px)] w-full min-w-0 max-w-4xl flex-col overflow-hidden border-border bg-card shadow-gold-lg sm:h-[min(760px,calc(100dvh-128px))] sm:rounded-[1.75rem] sm:border">
        <ChatHeader onNew={newThread} onHistory={() => setHistoryOpen(true)} />

        {initial === null ? (
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading your conversation…
          </div>
        ) : (
          <ChatWindow
            key={threadId}
            threadId={threadId}
            visitorId={visitorId}
            initialMessages={initial}
            isOnline={isOnline}
            onNew={newThread}
            onSaved={() => void refreshThreads(visitorId)}
          />

        )}

        <ChatHistorySheet
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          threads={threads}
          activeId={threadId}
          onNew={() => void newThread()}
          onDelete={(id) => void removeThread(id)}
          onRename={(id, title) => void rename(id, title)}
        />
      </div>
    </ChatFrame>
  );
}

/** Compact sticky header: identity + status on the left, actions on the right. */
function ChatHeader({ onNew, onHistory }: { onNew: () => void; onHistory: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur-xl sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-200 text-black">
          <Bot className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Digital Platform AI</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Online
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onNew}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-amber-200 transition-colors hover:border-amber/40 hover:bg-amber/5"
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden xs:inline sm:inline">New chat</span>
        </button>
        <button
          type="button"
          onClick={onHistory}
          aria-label="Open chat history"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-amber/40 hover:text-foreground"
        >
          <History className="size-4" aria-hidden />
          <span className="hidden sm:inline">History</span>
        </button>
      </div>
    </header>
  );
}

const PAGE_SIZE = 20;

function ChatWindow({
  threadId,
  visitorId,
  initialMessages,
  isOnline,
  onNew,
  onSaved,
}: {
  threadId: string;
  visitorId: string;
  initialMessages: UIMessage[];
  isOnline: boolean;
  onNew: () => void;
  onSaved: () => void;
}) {

  const [input, setInput] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // Persist the transcript once a turn settles.
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

  // Keep the newest message in view without locking the scroll container.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setInput("");
      setVisibleCount((c) => c + 2);
      void sendMessage({ text: trimmed });
      focusInput();
    },
    [busy, sendMessage, focusInput],
  );

  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffText, setHandoffText] = useState("");

  const { data: catalogue } = useQuery({
    queryKey: ["sheet-products"],
    queryFn: () => getSheetProducts(),
    staleTime: 60_000,
  });

  const products = useMemo(
    () =>
      (catalogue?.products ?? []).map((p) => ({
        name: p.name,
        plan: p.plan,
        validity: p.validity,
        availability: p.availability,
        category: p.category,
      })),
    [catalogue],
  );

  const openHandoff = () => {
    setHandoffText(buildHandoffSummary(messages, products));
    setHandoffOpen(true);
  };

  const hasMessages = messages.length > 0;
  const visible = messages.slice(Math.max(0, messages.length - visibleCount));
  const hiddenCount = messages.length - visible.length;

  // WhatsApp CTA only appears when the conversation shows buying intent.
  const showWhatsapp = useMemo(() => {
    const recent = messages.slice(-4).map(messageText).join(" ");
    return messages.some((m) => m.role === "user") && INTENT_RE.test(recent);
  }, [messages]);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {!isOnline && (
        <div className="shrink-0 border-b border-amber/20 bg-amber/10 px-3 py-2.5 sm:px-4">
          <p className="flex items-center justify-center gap-2 text-center text-xs font-medium text-amber">
            <WifiOff className="size-4" aria-hidden />
            You&apos;re offline. Reconnect to continue chatting with Digital AI.
          </p>
        </div>
      )}
      {/* Single vertical scroll container */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-16 pt-3 [-webkit-overflow-scrolling:touch] sm:px-5 sm:pb-16 sm:pt-4"
        >
          {!hasMessages ? (
            <WelcomeScreen onPick={submit} busy={busy} online={isOnline} />
          ) : (

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="mx-auto inline-flex min-h-11 items-center rounded-full border border-border px-4 text-xs text-muted-foreground transition-colors hover:border-amber/40 hover:text-foreground"
                >
                  Load {Math.min(hiddenCount, PAGE_SIZE)} earlier messages
                </button>
              )}

              {visible.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}


              {status === "submitted" && <TypingIndicator />}

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  Something went wrong. Please try again, or{" "}
                  <a href={CONTACT.WA_URL} target="_blank" rel="noreferrer" className="underline">
                    message us on WhatsApp
                  </a>
                  .
                </p>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Floating new-chat button (welcome screen already has one in the header) */}
        {hasMessages && (
          <button
            type="button"
            onClick={onNew}
            aria-label="Start a new chat"
            className="absolute bottom-3 right-3 z-20 inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-b from-amber to-amber-600 text-black shadow-[0_8px_24px_rgba(245,158,11,0.35)] transition-transform hover:brightness-110 active:scale-95 motion-reduce:transform-none"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        )}

      </div>


      {/* Composer pinned to the bottom */}
      <div className="shrink-0 border-t border-border bg-card px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-5 sm:pt-3">
        {showWhatsapp && (
          <button
            type="button"
            onClick={openHandoff}
            className="mb-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-[filter] hover:brightness-110 active:scale-[0.99] motion-reduce:transform-none"
            style={{ backgroundColor: "var(--whatsapp)" }}
          >
            <WaGlyph />
            Continue on WhatsApp
          </button>
        )}

        <div
          className={`mx-auto w-full max-w-3xl rounded-3xl border border-border bg-background/70 p-1.5 focus-within:border-amber/40 ${!isOnline ? "opacity-70" : ""}`}
        >
          <PromptInput onSubmit={(m: PromptInputMessage) => submit(m.text ?? input)}>
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              disabled={!isOnline}
              placeholder={
                isOnline ? "Ask about any product..." : "You're offline. Reconnect to chat..."
              }
              className="!min-h-[44px] max-h-32 border-0 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm"
            />
            <PromptInputFooter className="justify-end pt-0">
              <PromptInputSubmit
                status={status}
                disabled={(!input.trim() && !busy) || !isOnline}
                className="size-10 rounded-2xl bg-gradient-to-b from-amber to-amber-600 text-black transition-[filter] hover:brightness-110"
              />
            </PromptInputFooter>
          </PromptInput>
        </div>


        <p className="mt-1.5 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
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
    </div>
  );
}

function ChatBubble({
  message,
}: {
  message: UIMessage;
}) {
  const isUser = message.role === "user";


  return (
    <div className={`flex w-full gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <span
        aria-hidden
        className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "border border-border bg-background text-muted-foreground"
            : "bg-gradient-to-tr from-amber-600 to-amber-200 text-black"
        }`}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </span>

      <div className={`flex min-w-0 max-w-[86%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <span className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {isUser ? "You" : "Digital Platform AI"}
        </span>
        <div
          className={`min-w-0 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed [overflow-wrap:anywhere] ${
            isUser
              ? "rounded-tr-md bg-amber/15 text-foreground ring-1 ring-amber/25"
              : "rounded-tl-md bg-background/70 text-foreground ring-1 ring-border"
          }`}
        >
          {message.parts.map((part, i) =>
            part.type === "text" ? <MessageResponse key={i}>{part.text}</MessageResponse> : null,
          )}
        </div>

      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-200 text-black">
        <Bot className="size-4" aria-hidden />
      </span>
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-background/70 px-3.5 py-2.5 ring-1 ring-border">
        <span className="text-xs text-muted-foreground">Digital Platform AI is typing</span>
        <span className="flex gap-1" aria-hidden>
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-1.5 animate-bounce rounded-full bg-amber"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function WelcomeScreen({
  onPick,
  busy,
  online,
}: {
  onPick: (prompt: string) => void;
  busy: boolean;
  online: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col py-4">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
        👋 Welcome to <span className="text-amber">Digital Platform AI</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">I can help you with:</p>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground sm:grid-cols-3">
        {["Products", "Prices", "AI Tools", "Subscriptions", "Orders", "Support"].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-amber" aria-hidden />
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {CHAT_QUICK_PROMPTS.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => onPick(q.prompt)}
            disabled={busy || !online}
            className="min-h-11 rounded-2xl border border-border bg-background/50 px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-amber/40 hover:bg-amber/5 disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-amber/70">
        Suggested questions
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CHAT_SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onPick(`Tell me about ${chip}.`)}
            disabled={busy || !online}
            className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-xs text-muted-foreground transition-colors hover:border-amber/40 hover:text-foreground disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

