import { useEffect, useState } from "react";

export function useOnline() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/**
 * Effective connection info from the Network Information API, when available.
 * Returns a stable object even on browsers without support.
 */
export function useConnectionQuality() {
  const [info, setInfo] = useState<{ slow: boolean; effectiveType: string | null; saveData: boolean }>(
    () => readConn()
  );
  useEffect(() => {
    const conn: any = (navigator as any).connection;
    if (!conn) return;
    const onChange = () => setInfo(readConn());
    conn.addEventListener?.("change", onChange);
    return () => conn.removeEventListener?.("change", onChange);
  }, []);
  return info;
}

function readConn() {
  const conn: any = typeof navigator !== "undefined" ? (navigator as any).connection : null;
  const eff = conn?.effectiveType ?? null;
  const saveData = !!conn?.saveData;
  const slow = eff === "slow-2g" || eff === "2g" || saveData;
  return { slow, effectiveType: eff, saveData };
}

/** Reject a promise after `ms` unless it settles first. */
export function withTimeout<T>(p: Promise<T>, ms: number, label = "Request"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s. Check your connection and retry.`)),
      ms
    );
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

/** Simple exponential backoff retry for transient network errors. */
export async function retry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseMs?: number; onAttempt?: (n: number) => void } = {}
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseMs = opts.baseMs ?? 800;
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      opts.onAttempt?.(i);
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i === attempts || !isTransient(e)) break;
      await new Promise((r) => setTimeout(r, baseMs * Math.pow(2, i - 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Request failed");
}

export function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("timed out") ||
    msg.includes("timeout") ||
    msg.includes("load failed") ||
    msg.includes("temporarily") ||
    msg.includes("fetch") ||
    msg.includes("offline")
  );
}
