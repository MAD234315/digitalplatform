import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Loader2, WifiOff } from "lucide-react";
import { ChatFrame, CHAT_DESC, CHAT_TITLE, CHAT_URL } from "@/components/chat/chat-frame";

import { getVisitorId } from "@/lib/chat-visitor";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { createChatThread, listChatThreads } from "@/lib/chat-threads.functions";


export const Route = createFileRoute("/chat/")({
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
  component: ChatIndex,
});

/**
 * /chat resumes the visitor's most recent conversation, or starts a fresh
 * one when they've never chatted before, then hands off to /chat/$threadId.
 */
function ChatIndex() {
  const navigate = useNavigate();
  const started = useRef(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline || started.current) return;
    started.current = true;

    let cancelled = false;
    void (async () => {
      const visitorId = getVisitorId();
      try {
        const threads = await listChatThreads({ data: { visitorId } });
        const latest = threads[0];
        const id = latest ? latest.id : (await createChatThread({ data: { visitorId } })).id;
        if (!cancelled) void navigate({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
      } catch {
        // History unavailable — keep the user on a usable page.
        if (!cancelled) started.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, isOnline]);

  return (
    <ChatFrame>
      <div className="relative flex h-[calc(100dvh-64px)] w-full max-w-4xl items-center justify-center overflow-hidden border-border bg-card shadow-gold-lg sm:h-[min(760px,calc(100dvh-128px))] sm:rounded-[1.75rem] sm:border">
        {!isOnline ? (
          <div className="flex max-w-xs flex-col items-center gap-3 px-6 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-amber/10 text-amber">
              <WifiOff className="size-6" aria-hidden />
            </span>
            <p className="text-sm font-medium text-foreground">You&apos;re offline</p>
            <p className="text-xs text-muted-foreground">
              Please reconnect to the internet to chat with Digital Platform AI.
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-amber" aria-hidden />
            Opening your conversation…
          </p>
        )}
      </div>
    </ChatFrame>
  );
}

