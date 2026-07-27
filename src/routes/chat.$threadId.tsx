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
  CHAT_SUGGESTIONS,
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
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ThreadList
          threads={threads}
          activeId={threadId}
          onNew={newThread}
          onDelete={removeThread}
        />
        {initial === null ? (
          <div className="order-first flex min-h-60 min-w-0 items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground lg:order-none">
            Loading your conversation…
          </div>
        ) : (

          <ChatWindow
            key={threadId}
            threadId={threadId}
            visitorId={visitorId}
            initialMessages={initial}
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
      className="min-w-0 rounded-2xl border border-border bg-card p-3 lg:sticky lg:top-24 lg:self-start"
    >

      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <History className="size-3.5" aria-hidden />
          Your chats
        </span>
        <button
          type="button"
          onClick={onNew}
          aria-label="Start a new conversation"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-amber/40 hover:text-foreground"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>

      <ul className="max-h-64 space-y-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] lg:max-h-[420px]">
        {threads.length === 0 && (
          <li className="px-2 py-3 text-xs text-muted-foreground">No saved conversations yet.</li>
        )}
        {threads.map((t) => {
          const active = t.id === activeId;
          return (
            <li
              key={t.id}
              className={`flex items-center gap-1 rounded-xl border px-1 transition-colors ${
                active ? "border-amber/40 bg-background" : "border-transparent hover:bg-background"
              }`}
            >
              <Link
                to="/chat/$threadId"
                params={{ threadId: t.id }}
                aria-current={active ? "page" : undefined}
                className="min-h-11 flex-1 truncate px-2 py-2 text-left text-sm"
              >
                {t.title}
              </Link>
              <button
                type="button"
                onClick={() => onDelete(t.id)}
                aria-label={`Delete conversation: ${t.title}`}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function ChatWindow({
  threadId,
  visitorId,
  initialMessages,
  onSaved,
}: {
  threadId: string;
  visitorId: string;
  initialMessages: UIMessage[];
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


  return (
    <div className="order-first flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:order-none">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-amber/15 text-amber">
            <MessageSquare className="size-3.5" aria-hidden />
          </span>
          <span className="truncate font-medium">Digital Platform assistant</span>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">Saved automatically</span>
      </div>

      <Conversation className="h-[clamp(320px,56svh,540px)] overscroll-contain [-webkit-overflow-scrolling:touch]">

        <ConversationContent className="gap-6 p-4 sm:p-5">
          {messages.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Ask about any product, price, delivery time or warranty.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {CHAT_SUGGESTIONS.map((s) => (
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

      <div className="shrink-0 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          aria-label="Quick questions"
          className="-mx-1 mb-3 flex snap-x gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

        >
          {CHAT_QUICK_PROMPTS.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => submit(q.prompt)}
              disabled={busy}
              title={q.prompt}
              className="inline-flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-amber/40 hover:text-foreground disabled:opacity-50"
            >
              <Sparkle className="size-3 shrink-0 text-amber" aria-hidden />
              {q.label}
            </button>
          ))}
        </div>

        <PromptInput onSubmit={(message: PromptInputMessage) => submit(message.text ?? input)}>
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a product, price, delivery or warranty…"
            className="text-base sm:text-sm"
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
