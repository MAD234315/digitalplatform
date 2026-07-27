import { createServerFn } from "@tanstack/react-start";
import type { Json } from "@/integrations/supabase/types";

/**
 * Saved chat history for the public AI assistant.
 *
 * Visitors are not signed in, so each browser gets an opaque `visitorId`
 * (generated client-side, stored in localStorage). These tables are locked
 * down — no anon/authenticated grants — so every read/write goes through
 * these server functions with the service-role client and is always scoped
 * to the caller's visitor id.
 */

/** Serializable message shape crossing the server-fn boundary. */
export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: { type: string; text?: string }[];
};

export type ChatThreadSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

const VISITOR_RE = /^[A-Za-z0-9_-]{8,64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertVisitor(id: unknown): string {
  if (typeof id !== "string" || !VISITOR_RE.test(id)) throw new Error("Invalid visitor id");
  return id;
}

function assertThreadId(id: unknown): string {
  if (typeof id !== "string" || !UUID_RE.test(id)) throw new Error("Invalid thread id");
  return id;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** First line of the first user message, used as the thread label. */
function titleFrom(messages: StoredChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New conversation";
  const text = first.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "New conversation";
  return text.length > 60 ? `${text.slice(0, 59).trimEnd()}…` : text;
}

/** Threads for this visitor, most recently updated first. */
export const listChatThreads = createServerFn({ method: "POST" })
  .inputValidator((input: { visitorId: string }) => ({ visitorId: assertVisitor(input.visitorId) }))
  .handler(async ({ data }): Promise<ChatThreadSummary[]> => {
    const db = await admin();
    const { data: rows, error } = await db
      .from("chat_threads")
      .select("id, title, updated_at")
      .eq("visitor_id", data.visitorId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({ id: r.id, title: r.title, updatedAt: r.updated_at }));
  });

/** Create an empty thread for this visitor. */
export const createChatThread = createServerFn({ method: "POST" })
  .inputValidator((input: { visitorId: string }) => ({ visitorId: assertVisitor(input.visitorId) }))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const db = await admin();
    const { data: row, error } = await db
      .from("chat_threads")
      .insert({ visitor_id: data.visitorId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

/** Load one thread (verified against the visitor) with its messages. */
export const getChatThread = createServerFn({ method: "POST" })
  .inputValidator((input: { visitorId: string; threadId: string }) => ({
    visitorId: assertVisitor(input.visitorId),
    threadId: assertThreadId(input.threadId),
  }))
  .handler(async ({ data }): Promise<{ thread: ChatThreadSummary; messages: StoredChatMessage[] } | null> => {
    const db = await admin();
    const { data: thread, error } = await db
      .from("chat_threads")
      .select("id, title, updated_at, visitor_id")
      .eq("id", data.threadId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!thread || thread.visitor_id !== data.visitorId) return null;

    const { data: rows, error: msgError } = await db
      .from("chat_messages")
      .select("client_id, role, parts, seq")
      .eq("thread_id", data.threadId)
      .order("seq", { ascending: true });
    if (msgError) throw new Error(msgError.message);

    return {
      thread: { id: thread.id, title: thread.title, updatedAt: thread.updated_at },
      messages: (rows ?? []).map((r) => ({
        id: r.client_id,
        role: r.role as StoredChatMessage["role"],
        parts: (r.parts ?? []) as StoredChatMessage["parts"],
      })),
    };
  });

/** Persist the full transcript of a thread (idempotent upsert by message id). */
export const saveChatMessages = createServerFn({ method: "POST" })
  .inputValidator((input: { visitorId: string; threadId: string; messages: StoredChatMessage[] }) => ({
    visitorId: assertVisitor(input.visitorId),
    threadId: assertThreadId(input.threadId),
    messages: Array.isArray(input.messages) ? input.messages.slice(0, 200) : [],
  }))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!data.messages.length) return { ok: true };
    const db = await admin();

    const { data: thread, error } = await db
      .from("chat_threads")
      .select("id, visitor_id")
      .eq("id", data.threadId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!thread || thread.visitor_id !== data.visitorId) throw new Error("Thread not found");

    const rows = data.messages.map((m, i) => ({
      thread_id: data.threadId,
      client_id: String(m.id ?? `msg-${i}`),
      role: m.role,
      parts: (m.parts ?? []) as unknown as Json,
      seq: i,
    }));

    const { error: upsertError } = await db
      .from("chat_messages")
      .upsert(rows, { onConflict: "thread_id,client_id" });
    if (upsertError) throw new Error(upsertError.message);

    const { error: touchError } = await db
      .from("chat_threads")
      .update({ title: titleFrom(data.messages), updated_at: new Date().toISOString() })
      .eq("id", data.threadId);
    if (touchError) throw new Error(touchError.message);

    return { ok: true };
  });

/** Delete a thread (and its messages) owned by this visitor. */
export const deleteChatThread = createServerFn({ method: "POST" })
  .inputValidator((input: { visitorId: string; threadId: string }) => ({
    visitorId: assertVisitor(input.visitorId),
    threadId: assertThreadId(input.threadId),
  }))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const db = await admin();
    const { error } = await db
      .from("chat_threads")
      .delete()
      .eq("id", data.threadId)
      .eq("visitor_id", data.visitorId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
