/**
 * Anonymous visitor identity for saved chat history.
 *
 * Visitors of the public site are not signed in, so each browser gets an
 * opaque random id. It is the only key that links a person to their saved
 * conversations, so it never leaves this browser except as an argument to
 * the chat server functions.
 */
const VISITOR_KEY = "dp-chat-visitor-v1";

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    const fresh = randomId();
    window.localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    // Private mode / storage blocked: fall back to a session-only id so the
    // chat still works, it just won't resume after a reload.
    return randomId();
  }
}
