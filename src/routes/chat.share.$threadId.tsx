import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bot, Loader2, User } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { MessageResponse } from "@/components/ai-elements/message";
import { getSharedChatThread, type StoredChatMessage } from "@/lib/chat-threads.functions";

const TITLE = "Shared conversation — Digital Platform AI";
const DESC = "Read-only transcript of a Digital Platform AI assistant conversation.";

type Search = { t?: string };

export const Route = createFileRoute("/chat/share/$threadId")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    t: typeof search.t === "string" ? search.t : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
  }),
  component: SharedChatPage,
});

function text(message: StoredChatMessage): string {
  return message.parts
    .map((p) => (p.type === "text" ? (p.text ?? "") : ""))
    .join("")
    .trim();
}

function SharedChatPage() {
  const { threadId } = Route.useParams();
  const { t } = Route.useSearch();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["shared-chat", threadId, t],
    enabled: Boolean(t),
    queryFn: () => getSharedChatThread({ data: { threadId, token: t as string } }),
    staleTime: 15_000,
  });

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-3xl px-4 pb-16 pt-20 sm:pt-24 lg:px-8">
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber">Read-only transcript</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            {data?.thread.title ?? "Shared conversation"}
          </h1>
          {data ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Last updated {new Date(data.thread.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </header>

        {!t ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            This link is missing its access code. Please ask the customer to resend it.
          </p>
        ) : isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Loading conversation…
          </p>
        ) : isError || !data ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            This conversation link is invalid or has expired.
          </p>
        ) : (
          <ol className="space-y-3">
            {data.messages.map((m) => {
              const body = text(m);
              if (!body) return null;
              const mine = m.role === "user";
              return (
                <li
                  key={m.id}
                  className={`flex gap-3 rounded-2xl border p-4 ${
                    mine ? "border-border bg-card/60" : "border-amber/25 bg-card"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                      mine ? "bg-muted text-foreground" : "bg-amber/15 text-amber"
                    }`}
                    aria-hidden
                  >
                    {mine ? <User className="size-4" /> : <Bot className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {mine ? "Customer" : "Digital Platform AI"}
                    </p>
                    <div className="prose-sm max-w-none break-words text-sm leading-relaxed">
                      <MessageResponse>{body}</MessageResponse>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </PageShell>
  );
}
