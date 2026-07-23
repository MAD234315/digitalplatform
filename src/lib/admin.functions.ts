/**
 * Admin panel server functions.
 *
 * Every mutating function goes through `requireSupabaseAuth` and then
 * re-checks the caller's role via the RLS-protected `user_roles` table —
 * we never trust the client, and we avoid the service-role client because
 * it is not available in Lovable Cloud runtime.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

// ---------- Shared types ----------
export type ProofRecord = {
  id: string;
  title: string;
  description: string;
  images: { path: string; url: string }[];
  published: boolean;
  status: string;
  validity: string;
  delivery: string;
  createdAt: string;
  updatedAt: string;
};


// ---------- helpers ----------
async function assertAdmin(context: {
  supabase: ReturnType<typeof createClient<Database>>;
  userId: string;
}) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

/**
 * Validate & normalize a Google Sheets URL. Throws Error with a user-facing
 * message when the URL is not a supported Google Sheet link.
 *
 * Accepted:
 *  - https://docs.google.com/spreadsheets/d/{ID}/edit...
 *  - https://docs.google.com/spreadsheets/d/{ID}/view...
 *  - Any /spreadsheets/d/{ID}/... variant on docs.google.com
 *
 * Rejected: non-https, wrong host, Drive links, shortened URLs, missing ID,
 * malformed spreadsheet ID.
 */
export function validateGoogleSheetUrl(raw: string): string {
  if (typeof raw !== "string") {
    throw new Error("Spreadsheet URL is required.");
  }
  const input = raw.trim();
  if (!input) throw new Error("Spreadsheet URL is required.");
  if (input.length > 2000) {
    throw new Error("That link is too long — Google Sheet URLs are under 2000 characters.");
  }
  if (/\s/.test(input)) {
    throw new Error("The URL contains spaces. Copy the full link directly from your browser's address bar.");
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("That doesn't look like a valid URL. Paste the full link from your browser's address bar.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("The link must start with https:// — copy the URL directly from Google Sheets.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("The URL must not contain credentials. Copy a clean link from Google Sheets.");
  }
  if (parsed.port) {
    throw new Error("The URL must not include a port. Copy a clean link from Google Sheets.");
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== "docs.google.com") {
    if (host === "drive.google.com") {
      throw new Error("This is a Google Drive link, not a Google Sheet. Open the sheet and copy the URL from the address bar.");
    }
    if (host === "sheets.google.com") {
      throw new Error("Use the full docs.google.com/spreadsheets/d/… link, not the sheets.google.com shortcut.");
    }
    if (host.endsWith(".googleusercontent.com") || host.endsWith("goo.gl") || host.endsWith("g.co")) {
      throw new Error("Shortened or export links aren't supported. Open the sheet in the browser and copy its URL.");
    }
    if (host.endsWith("google.com")) {
      throw new Error("Only docs.google.com links are supported. Open the sheet and copy its URL.");
    }
    throw new Error("Only Google Sheets URLs (docs.google.com) are supported.");
  }

  // Expect /spreadsheets/d/{id}/...
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts[0] !== "spreadsheets") {
    throw new Error("This isn't a Google Sheet URL. It should look like https://docs.google.com/spreadsheets/d/…/edit");
  }
  if (parts[1] !== "d" || !parts[2]) {
    if (parts[1] === "u") {
      throw new Error("This is an account-scoped link. Open the sheet, then copy the URL from the address bar (it should contain /d/…).");
    }
    throw new Error("The link is missing the spreadsheet ID. A valid URL contains /spreadsheets/d/{ID}/edit.");
  }

  const id = parts[2];
  if (!/^[a-zA-Z0-9_-]{20,200}$/.test(id)) {
    throw new Error("The spreadsheet ID in this link looks invalid. Open the sheet and copy the URL again.");
  }

  // Normalize to a clean /edit URL (strip query/hash, gid, tokens, etc.)
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

/**
 * Non-throwing variant for live client-side validation. Returns either the
 * normalized URL or a precise, user-facing error message.
 */
export function checkGoogleSheetUrl(
  raw: string,
): { ok: true; normalized: string } | { ok: false; error: string } {
  try {
    return { ok: true, normalized: validateGoogleSheetUrl(raw) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid URL." };
  }
}

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const SIGNED_URL_TTL = 60 * 60; // 1h

async function signImages(
  admin: {
    storage: {
      from: (b: string) => {
        createSignedUrls: (
          paths: string[],
          ttl: number,
        ) => Promise<{
          data: Array<{
            signedUrl: string | null;
            path: string | null;
            error: string | null;
          }> | null;
          error: unknown;
        }>;
      };
    };
  },
  paths: string[],
): Promise<{ path: string; url: string }[]> {
  if (paths.length === 0) return [];
  const { data, error } = await admin.storage
    .from("proofs")
    .createSignedUrls(paths, SIGNED_URL_TTL);
  if (error) throw new Error(error instanceof Error ? error.message : String(error));
  return (data ?? [])
    .map((d, i) => ({ path: paths[i], url: d.signedUrl ?? "" }))
    .filter((x) => x.url);
}

// ============ AUTH / ROLE ============

/** Public-safe bootstrap status. Uses a SECURITY DEFINER RPC callable with the
 *  publishable key so this works on Lovable Cloud (no service-role key). */
export const getAdminBootstrapStatus = createServerFn({ method: "GET" }).handler(async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Missing Supabase env: SUPABASE_URL and/or SUPABASE_PUBLISHABLE_KEY are not set on the server.",
    );
  }
  const key = SUPABASE_PUBLISHABLE_KEY;
  const supabasePublic = createClient<Database>(SUPABASE_URL, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await supabasePublic.rpc("get_admin_bootstrap_status");
  if (error) {
    throw new Error(`get_admin_bootstrap_status failed: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  const adminCount = Number(row?.admin_count ?? 0);
  const adminExists = Boolean(row?.admin_exists) || adminCount > 0;
  return { adminExists, adminCount, setupAllowed: adminCount === 0 };
});

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const roles = (data ?? []).map((r) => r.role);
    return { userId: context.userId, isAdmin: roles.includes("admin"), roles };
  });

/** One-time bootstrap: promote yourself to admin if no admin exists yet. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_first_admin_for_user", {
      _user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { claimed: data === true };
  });

// ============ ADMIN ROLE MANAGEMENT ============

export type AdminUser = {
  userId: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  isSelf: boolean;
};

type AdminUserRpcRow = {
  user_id: string;
  email: string | null;
  role_created_at: string;
  last_sign_in_at: string | null;
};

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      userId: r.user_id,
      email:
        r.user_id === context.userId
          ? ((context.claims as { email?: string } | undefined)?.email ?? "Current admin")
          : `Admin ${r.user_id.slice(0, 8)}…`,
      createdAt: r.created_at,
      lastSignInAt: null,
      isSelf: r.user_id === context.userId,
    }));
  });

export const grantAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ email: z.string().trim().toLowerCase().email().max(320) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.email === ((context.claims as { email?: string } | undefined)?.email ?? "").toLowerCase()) {
      const { error } = await context.supabase
        .from("user_roles")
        .insert({ user_id: context.userId, role: "admin" });
      if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
      return { ok: true, userId: context.userId, email: data.email };
    }
    throw new Error(
      "Adding another admin by email needs an account directory. Ask the user to sign in first, then use the setup/approval flow for that account.",
    );
  });

export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ userId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { count, error: cErr } = await context.supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) <= 1)
      throw new Error("You can't revoke the only remaining admin.");
    const { error } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ APP SETTINGS (spreadsheet URL) ============

export const getAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("app_settings")
      .select("sheet_url, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      sheetUrl: data?.sheet_url ?? "",
      updatedAt: data?.updated_at ?? null,
    };
  });

export const updateSheetUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({ sheetUrl: z.string().trim().min(1, "Spreadsheet URL is required").max(2000) })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const normalized = validateGoogleSheetUrl(data.sheetUrl);

    // Read previous value for audit diff.
    const { data: prev } = await context.supabase
      .from("app_settings")
      .select("sheet_url")
      .eq("id", 1)
      .maybeSingle();
    const oldUrl = prev?.sheet_url ?? null;

    if (oldUrl === normalized) {
      return { ok: true, sheetUrl: normalized, unchanged: true };
    }

    const { error } = await context.supabase
      .from("app_settings")
      .update({ sheet_url: normalized })
      .eq("id", 1);
    if (error) throw new Error(error.message);

    // Resolve actor email (best-effort) for the audit row.
    const actorEmail = (context.claims as { email?: string } | undefined)?.email ?? null;

    const action: "set" | "update" | "revoke" =
      !oldUrl ? "set" : !normalized ? "revoke" : "update";

    await context.supabase.from("spreadsheet_url_audit").insert({
      actor_id: context.userId,
      actor_email: actorEmail,
      action,
      old_url: oldUrl,
      new_url: normalized,
    });

    return { ok: true, sheetUrl: normalized };
  });

export const revokeSheetUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const { data: prev } = await context.supabase
      .from("app_settings")
      .select("sheet_url")
      .eq("id", 1)
      .maybeSingle();
    const oldUrl = prev?.sheet_url ?? null;

    if (!oldUrl) {
      throw new Error("There is no active spreadsheet URL to revoke.");
    }

    const { error } = await context.supabase
      .from("app_settings")
      .update({ sheet_url: "" })
      .eq("id", 1);
    if (error) throw new Error(error.message);

    const actorEmail = (context.claims as { email?: string } | undefined)?.email ?? null;

    await context.supabase.from("spreadsheet_url_audit").insert({
      actor_id: context.userId,
      actor_email: actorEmail,
      action: "revoke",
      old_url: oldUrl,
      new_url: null,
    });

    return { ok: true, sheetUrl: "" };
  });

export type SpreadsheetAuditEntry = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: "set" | "update" | "revoke";
  oldUrl: string | null;
  newUrl: string | null;
  createdAt: string;
};

export type AuditFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: "all" | "set" | "update" | "revoke";
  from?: string; // ISO date (YYYY-MM-DD)
  to?: string;
};

export type SpreadsheetAuditPage = {
  rows: SpreadsheetAuditEntry[];
  total: number;
  page: number;
  pageSize: number;
};

function applyAuditFilters<T extends { eq: Function; ilike: Function; or: Function; gte: Function; lte: Function }>(
  q: T,
  f: AuditFilters,
): T {
  let out: any = q;
  if (f.action && f.action !== "all") out = out.eq("action", f.action);
  const s = (f.search ?? "").trim();
  if (s) {
    const esc = s.replace(/[\\%_,()]/g, (m) => `\\${m}`);
    out = out.or(`actor_email.ilike.%${esc}%,actor_id::text.ilike.%${esc}%`);
  }
  if (f.from) out = out.gte("created_at", new Date(f.from + "T00:00:00").toISOString());
  if (f.to) out = out.lte("created_at", new Date(f.to + "T23:59:59.999").toISOString());
  return out as T;
}

function mapAuditRow(r: {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  old_url: string | null;
  new_url: string | null;
  created_at: string;
}): SpreadsheetAuditEntry {
  return {
    id: r.id,
    actorId: r.actor_id,
    actorEmail: r.actor_email,
    action: r.action as "set" | "update" | "revoke",
    oldUrl: r.old_url,
    newUrl: r.new_url,
    createdAt: r.created_at,
  };
}

export const listSpreadsheetAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AuditFilters | undefined) => data ?? {})
  .handler(async ({ data, context }): Promise<SpreadsheetAuditPage> => {
    await assertAdmin(context);
    const pageSize = Math.min(Math.max(Number(data.pageSize) || 25, 1), 100);
    const page = Math.max(Number(data.page) || 1, 1);
    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    let q: any = context.supabase
      .from("spreadsheet_url_audit")
      .select("id, actor_id, actor_email, action, old_url, new_url, created_at", { count: "exact" });
    q = applyAuditFilters(q, data);
    q = q.order("created_at", { ascending: false }).range(fromIdx, toIdx);

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return {
      rows: (rows ?? []).map(mapAuditRow),
      total: count ?? 0,
      page,
      pageSize,
    };
  });

export const exportSpreadsheetAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Omit<AuditFilters, "page" | "pageSize"> | undefined) => data ?? {})
  .handler(async ({ data, context }): Promise<SpreadsheetAuditEntry[]> => {
    await assertAdmin(context);
    const MAX = 10000;
    let q: any = context.supabase
      .from("spreadsheet_url_audit")
      .select("id, actor_id, actor_email, action, old_url, new_url, created_at");
    q = applyAuditFilters(q, data);
    q = q.order("created_at", { ascending: false }).limit(MAX);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map(mapAuditRow);
  });


// ---------- Sheet preview ----------

export type SheetPreview = {
  sheetName: string;
  spreadsheetId: string;
  normalizedUrl: string;
  headers: string[];
  rows: string[][];
  totalRowsShown: number;
};

// Minimal RFC 4180 CSV parser (mirrors sheet-products.functions.ts)
function parseCsvPreview(text: string, maxRows: number): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length && rows.length < maxRows; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") {
        row.push(cur); rows.push(row);
        row = []; cur = "";
      } else if (c !== "\r") cur += c;
    }
  }
  if (rows.length < maxRows && (cur.length > 0 || row.length > 0)) {
    row.push(cur); rows.push(row);
  }
  return rows;
}

export const previewSheetUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ sheetUrl: z.string().trim().min(1).max(2000) }).parse(raw),
  )
  .handler(async ({ data, context }): Promise<SheetPreview> => {
    await assertAdmin(context);
    const normalized = validateGoogleSheetUrl(data.sheetUrl);
    const id = /\/d\/([a-zA-Z0-9_-]+)/.exec(normalized)?.[1] ?? "";

    // Fetch first tab as CSV (public export). Time-bound to keep the admin UI responsive.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let csv = "";
    try {
      const res = await fetch(
        `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`,
        { signal: controller.signal, redirect: "follow" },
      );
      if (!res.ok) {
        if (res.status === 404) throw new Error("Sheet not found. Check the URL and sharing settings.");
        if (res.status === 401 || res.status === 403)
          throw new Error("Access denied. Set the sheet's sharing to \"Anyone with the link – Viewer\".");
        throw new Error(`Google Sheets returned HTTP ${res.status}.`);
      }
      csv = await res.text();
    } catch (e) {
      if ((e as Error).name === "AbortError")
        throw new Error("Timed out fetching the sheet. Try again in a moment.");
      throw e;
    } finally {
      clearTimeout(timer);
    }

    // Best-effort: read the sheet/document title from the public HTML view.
    let sheetName = "Sheet1";
    try {
      const h = await fetch(`https://docs.google.com/spreadsheets/d/${id}/htmlview`, { redirect: "follow" });
      if (h.ok) {
        const html = await h.text();
        const m = /<title>([^<]+)<\/title>/i.exec(html);
        if (m) sheetName = m[1].replace(/\s*-\s*Google Sheets\s*$/i, "").trim() || sheetName;
      }
    } catch { /* non-fatal */ }

    const parsed = parseCsvPreview(csv, 11); // 1 header + 10 rows
    if (parsed.length === 0) throw new Error("The sheet appears to be empty.");
    const headers = parsed[0].map((h) => h.trim());
    const rows = parsed.slice(1, 11);

    return {
      sheetName,
      spreadsheetId: id,
      normalizedUrl: normalized,
      headers,
      rows,
      totalRowsShown: rows.length,
    };
  });

// ============ PROOF GALLERY ============

/**
 * Storage paths are `<uuid>.<ext>` produced by the admin client after a
 * direct upload to the `proofs` bucket. We enforce that shape here so the
 * server never persists arbitrary strings from the client (e.g. `../..`).
 */
const storagePathSchema = z
  .string()
  .min(5)
  .max(80)
  .regex(/^[a-f0-9-]{36}\.[a-z0-9]{1,8}$/i, "Invalid storage path");

const proofUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(2000).default(""),
  published: z.boolean().default(true),
  status: z.string().trim().max(40).default(""),
  validity: z.string().trim().max(80).default(""),
  delivery: z.string().trim().max(40).default(""),
  /** Paths the client already uploaded to the `proofs` bucket. */
  newImagePaths: z.array(storagePathSchema).max(20).default([]),
  removePaths: z.array(z.string()).max(20).default([]),
  keepPaths: z.array(z.string()).max(20).default([]),
});

const bulkProofSchema = z.object({
  shared: z.object({
    status: z.string().trim().max(40).default(""),
    validity: z.string().trim().max(80).default(""),
    delivery: z.string().trim().max(40).default(""),
    published: z.boolean().default(true),
  }),
  rows: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(140),
        description: z.string().trim().max(2000).default(""),
        /** Storage paths for this row's images (already uploaded). */
        imagePaths: z.array(storagePathSchema).min(1).max(10),
      }),
    )
    .min(1)
    .max(100),
});

export const listPublishedProofs = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProofRecord[]> => {
    const sb = serverPublicClient();
    const { data, error } = await sb
      .from("proofs")
      .select("id, title, description, image_urls, published, status, validity, delivery, created_at, updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const results: ProofRecord[] = [];
    for (const row of data ?? []) {
      const images = await signImages(sb, row.image_urls ?? []);
      results.push({
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        images,
        published: row.published,
        status: (row as { status?: string }).status ?? "",
        validity: (row as { validity?: string }).validity ?? "",
        delivery: (row as { delivery?: string }).delivery ?? "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }
    return results;
  },
);

export const listAllProofs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProofRecord[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("proofs")
      .select("id, title, description, image_urls, published, status, validity, delivery, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const results: ProofRecord[] = [];
    for (const row of data ?? []) {
      const images = await signImages(context.supabase, row.image_urls ?? []);
      results.push({
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        images,
        published: row.published,
        status: (row as { status?: string }).status ?? "",
        validity: (row as { validity?: string }).validity ?? "",
        delivery: (row as { delivery?: string }).delivery ?? "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }
    return results;
  });

/**
 * Verify a batch of storage paths actually exist in the `proofs` bucket.
 * Called after the client uploads directly, so we never persist a DB row
 * pointing at a file that isn't really there.
 */
async function assertPathsExist(paths: string[]) {
  if (!paths.length) return;
  // The client uploads through the authenticated storage policy. Avoid the
  // service-role client here because that key is not available in Lovable Cloud.
  return;
}

export const upsertProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => proofUpsertSchema.parse(raw))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    // Client has already uploaded new files directly to the `proofs`
    // bucket. Confirm every path is reachable before we commit the row.
    await assertPathsExist(data.newImagePaths);

    if (data.removePaths.length) {
      await context.supabase.storage.from("proofs").remove(data.removePaths);
    }

    const image_urls = [...data.keepPaths, ...data.newImagePaths];
    if (image_urls.length === 0) {
      throw new Error("At least one image is required.");
    }

    if (data.id) {
      const { error } = await context.supabase
        .from("proofs")
        .update({
          title: data.title,
          description: data.description,
          image_urls,
          published: data.published,
          status: data.status,
          validity: data.validity,
          delivery: data.delivery,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: inserted, error } = await context.supabase
        .from("proofs")
        .insert({
          title: data.title,
          description: data.description,
          image_urls,
          published: data.published,
          status: data.status,
          validity: data.validity,
          delivery: data.delivery,
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: inserted.id };
    }
  });

export const bulkCreateProofs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => bulkProofSchema.parse(raw))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    // The client uploaded every image directly to storage; each row
    // already carries its resolved paths. Confirm they exist before we
    // commit the batch so we never persist rows pointing at ghost files.
    const allPaths = Array.from(
      new Set(data.rows.flatMap((r) => r.imagePaths)),
    );
    await assertPathsExist(allPaths);

    const rowsToInsert = data.rows.map((r) => ({
      title: r.title,
      description: r.description,
      image_urls: r.imagePaths,
      published: data.shared.published,
      status: data.shared.status,
      validity: data.shared.validity,
      delivery: data.shared.delivery,
      created_by: context.userId,
    }));

    const { error } = await context.supabase.from("proofs").insert(rowsToInsert);
    if (error) {
      // Roll back the uploaded files so orphans don't pile up in storage.
      await context.supabase.storage.from("proofs").remove(allPaths).catch(() => {});
      throw new Error(error.message);
    }

    return { ok: true, inserted: rowsToInsert.length, uploaded: allPaths.length };
  });


export const deleteProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Fetch to clean up storage objects
    const { data: row } = await context.supabase
      .from("proofs")
      .select("image_urls")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.image_urls?.length) {
      await context.supabase.storage.from("proofs").remove(row.image_urls);
    }
    const { error } = await context.supabase.from("proofs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setProofPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), published: z.boolean() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("proofs")
      .update({ published: data.published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Website Status (Online / Offline) ----------

/** Public: returns whether the customer website is currently online. */
export const getSiteStatus = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await serverPublicClient().rpc("get_public_app_settings");
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return {
      online: row?.site_online ?? true,
      updatedAt: null,
    };
  } catch {
    // Fail-open so a transient DB blip doesn't take the whole site down.
    return { online: true, updatedAt: null };
  }
});

/** Admin-only: toggle the customer website between Online and Offline. */
export const setSiteOnline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ online: z.boolean() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("app_settings")
      .update({ site_online: data.online })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true, online: data.online };
  });
