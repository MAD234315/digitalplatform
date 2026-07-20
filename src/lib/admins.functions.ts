import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

// ---------- helpers ----------

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super admin only");
}

async function assertPermission(supabase: any, userId: string, perm: string) {
  const { data, error } = await supabase.rpc("has_permission", {
    _user_id: userId,
    _permission: perm,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Forbidden: missing permission ${perm}`);
}

async function audit(
  actorId: string,
  action: string,
  targetUserId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_user_id: actorId,
      action,
      target_user_id: targetUserId ?? null,
      metadata: metadata as any,
      ip: (() => { try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; } })(),
      user_agent: (() => { try { return getRequestHeader("user-agent") ?? null; } catch { return null; } })(),
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }

}

// ---------- roles / permissions ----------

export const getMyPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rolesRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (rolesRows ?? []).map((r: any) => r.role as string);
    if (!roles.length) return { roles: [], permissions: [], isSuperAdmin: false, profile: null };
    const { data: permRows } = await context.supabase
      .from("role_permissions")
      .select("permission")
      .in("role", roles as any);
    const permissions = Array.from(new Set((permRows ?? []).map((r: any) => r.permission as string)));
    const { data: profile } = await context.supabase
      .from("admin_profiles")
      .select("user_id, full_name, email, mobile, status, last_login_at, created_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    return {
      roles,
      permissions,
      isSuperAdmin: roles.includes("super_admin"),
      profile: profile ?? null,
    };
  });

export const listRolePermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("role_permissions")
      .select("role, permission")
      .order("role");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateRolePermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        role: z.enum(["super_admin", "admin", "editor", "viewer"]),
        permissions: z.array(z.string().min(1).max(64)).max(50),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.role === "super_admin") throw new Error("Super admin permissions are fixed and cannot be changed");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("role_permissions").delete().eq("role", data.role);
    if (data.permissions.length) {
      const rows = data.permissions.map((p) => ({ role: data.role, permission: p }));
      const { error } = await supabaseAdmin.from("role_permissions").insert(rows);
      if (error) throw new Error(error.message);
    }
    await audit(context.userId, "permission.changed", null, { role: data.role, permissions: data.permissions });
    return { ok: true };
  });

// ---------- admin request submission ----------

const requestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  mobile: z.string().trim().min(6).max(30),
  password: z.string().min(8).max(128),
  reason: z.string().trim().min(10).max(1000),
});

export const submitAdminRequest = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => requestSchema.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userAgent = (() => { try { return getRequestHeader("user-agent") ?? null; } catch { return null; } })();
    const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; } })();

    // Reject if a request from this email is already pending
    const { data: existing } = await supabaseAdmin
      .from("admin_requests")
      .select("id, status")
      .eq("email", data.email)
      .in("status", ["pending"])
      .maybeSingle();
    if (existing) throw new Error("A request from this email is already pending review.");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, mobile: data.mobile },
    });
    if (createErr || !created?.user) {
      throw new Error(createErr?.message || "Could not create account. The email may already be in use.");
    }
    const uid = created.user.id;

    const { error: profErr } = await supabaseAdmin.from("admin_profiles").insert({
      user_id: uid,
      full_name: data.fullName,
      email: data.email,
      mobile: data.mobile,
      status: "pending",
    });
    if (profErr) {
      await supabaseAdmin.auth.admin.deleteUser(uid).catch(() => {});
      throw new Error(profErr.message);
    }

    const { error: reqErr } = await supabaseAdmin.from("admin_requests").insert({
      user_id: uid,
      full_name: data.fullName,
      email: data.email,
      mobile: data.mobile,
      reason: data.reason,
      device_info: userAgent,
      status: "pending",
    });
    if (reqErr) throw new Error(reqErr.message);

    // Best-effort audit (no actor).
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_user_id: uid,
      action: "admin.requested",
      target_user_id: uid,
      metadata: { email: data.email },
      ip,
      user_agent: userAgent,
    });

    return { ok: true };
  });

// ---------- admin requests management ----------

export const listAdminRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
        search: z.string().trim().max(120).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(20),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = context.supabase
      .from("admin_requests")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.search) q = q.or(`full_name.ilike.%${data.search}%,email.ilike.%${data.search}%,mobile.ilike.%${data.search}%`);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const approveAdminRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        role: z.enum(["admin", "editor", "viewer"]).default("admin"),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req, error: reqErr } = await supabaseAdmin
      .from("admin_requests")
      .select("*")
      .eq("id", data.id)
      .single();
    if (reqErr || !req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Request is not pending");
    if (!req.user_id) throw new Error("Request has no associated user");

    await supabaseAdmin.from("user_roles").insert({ user_id: req.user_id, role: data.role });
    await supabaseAdmin.from("admin_profiles").update({ status: "active" }).eq("user_id", req.user_id);
    await supabaseAdmin
      .from("admin_requests")
      .update({ status: "approved", reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.id);
    await supabaseAdmin.from("admin_notifications").insert({
      kind: "admin_approved",
      proof_id: null,
      proof_title: req.full_name,
      message: `${req.full_name} approved as ${data.role}`,
    });
    await audit(context.userId, "admin.approved", req.user_id, { role: data.role, email: req.email });
    return { ok: true };
  });

export const rejectAdminRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({ id: z.string().uuid(), reason: z.string().trim().max(500).optional() })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req, error } = await supabaseAdmin
      .from("admin_requests")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Request is not pending");

    if (req.user_id) {
      await supabaseAdmin
        .from("admin_profiles")
        .update({ status: "rejected" })
        .eq("user_id", req.user_id);
    }

    await supabaseAdmin
      .from("admin_requests")
      .update({
        status: "rejected",
        rejection_reason: data.reason ?? null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (req.user_id) {
      await supabaseAdmin.auth.admin.deleteUser(req.user_id).catch(() => {});
    }
    await supabaseAdmin.from("admin_notifications").insert({
      kind: "admin_rejected",
      proof_id: null,
      proof_title: req.full_name,
      message: `${req.full_name} was rejected${data.reason ? `: ${data.reason}` : ""}`,
    });
    await audit(context.userId, "admin.rejected", req.user_id, { email: req.email, reason: data.reason });
    return { ok: true };
  });

// ---------- admin list & management ----------

export const listAdmins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(20),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context.supabase, context.userId, "users.manage");
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = context.supabase
      .from("admin_profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.search) q = q.or(`full_name.ilike.%${data.search}%,email.ilike.%${data.search}%,mobile.ilike.%${data.search}%`);
    const { data: profiles, error, count } = await q;
    if (error) throw new Error(error.message);
    const ids = (profiles ?? []).map((p: any) => p.user_id);
    let rolesByUser = new Map<string, string[]>();
    if (ids.length) {
      const { data: roles } = await context.supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      for (const r of roles ?? []) {
        const arr = rolesByUser.get((r as any).user_id) ?? [];
        arr.push((r as any).role);
        rolesByUser.set((r as any).user_id, arr);
      }
    }
    return {
      rows: (profiles ?? []).map((p: any) => ({ ...p, roles: rolesByUser.get(p.user_id) ?? [] })),
      total: count ?? 0,
    };
  });

export const suspendAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ userId: z.string().uuid(), reason: z.string().trim().max(500).optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("admin_profiles")
      .update({ status: "suspended", suspended_at: new Date().toISOString(), suspended_reason: data.reason ?? null })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    // Revoke all sessions
    await supabaseAdmin.auth.admin.signOut(data.userId, "global").catch(() => {});
    await supabaseAdmin.from("admin_notifications").insert({
      kind: "admin_suspended",
      proof_id: null,
      proof_title: data.userId,
      message: `Admin suspended${data.reason ? `: ${data.reason}` : ""}`,
    });
    await audit(context.userId, "admin.suspended", data.userId, { reason: data.reason });
    return { ok: true };
  });

export const reactivateAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ userId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("admin_profiles")
      .update({ status: "active", suspended_at: null, suspended_reason: null })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    await audit(context.userId, "admin.reactivated", data.userId);
    return { ok: true };
  });

export const updateAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "editor", "viewer"]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Cannot change your own role");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Refuse if target is a super admin
    const { data: sa } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .eq("role", "super_admin")
      .maybeSingle();
    if (sa) throw new Error("Cannot modify a super admin's role");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).neq("role", "super_admin");
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    await audit(context.userId, "admin.role_changed", data.userId, { role: data.role });
    return { ok: true };
  });

export const resetAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ userId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Generate a strong temporary password
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const temp = `Tmp!${Array.from(bytes).map((b) => b.toString(36)).join("").slice(0, 14)}`;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: temp });
    if (error) throw new Error(error.message);
    await audit(context.userId, "admin.password_reset", data.userId);
    return { ok: true, temporaryPassword: temp };
  });

export const deleteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ userId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sa } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .eq("role", "super_admin")
      .maybeSingle();
    if (sa) throw new Error("Cannot delete a super admin");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("admin_profiles").delete().eq("user_id", data.userId);
    await supabaseAdmin.auth.admin.deleteUser(data.userId).catch(() => {});
    await supabaseAdmin.from("admin_notifications").insert({
      kind: "admin_deleted",
      proof_id: null,
      proof_title: data.userId,
      message: `Admin account deleted`,
    });
    await audit(context.userId, "admin.deleted", data.userId);
    return { ok: true };
  });

// ---------- audit log ----------

export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(30),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context.supabase, context.userId, "audit.view");
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = context.supabase
      .from("admin_audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.search) q = q.ilike("action", `%${data.search}%`);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

// ---------- login lifecycle ----------

export const checkLoginLockout = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ email: z.string().email() }).parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", data.email)
      .eq("success", false)
      .gte("created_at", cutoff);
    const locked = (count ?? 0) >= 5;
    return { locked, failedCount: count ?? 0 };
  });

export const recordLoginAttempt = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ email: z.string().email(), success: z.boolean() }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; } })();
    const ua = (() => { try { return getRequestHeader("user-agent") ?? null; } catch { return null; } })();
    await supabaseAdmin
      .from("login_attempts")
      .insert({ email: data.email, success: data.success, ip, user_agent: ua });
    return { ok: true };
  });

// Post-login: verify profile status, update last_login_at, return authorization result.
export const postLoginCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("admin_profiles")
      .select("status, full_name, email")
      .eq("user_id", context.userId)
      .maybeSingle();
    const { data: rolesRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (rolesRows ?? []).map((r: any) => r.role as string);
    const isSuper = roles.includes("super_admin");
    const isAdmin = roles.some((r) => ["super_admin", "admin", "editor", "viewer"].includes(r));

    if (!profile && !isAdmin) {
      return { ok: false, reason: "no_profile" as const };
    }
    if (profile?.status === "pending") return { ok: false, reason: "pending" as const };
    if (profile?.status === "rejected") return { ok: false, reason: "rejected" as const };
    if (profile?.status === "suspended") return { ok: false, reason: "suspended" as const };
    if (!isAdmin) return { ok: false, reason: "no_role" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("admin_profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("user_id", context.userId);
    return { ok: true, isSuperAdmin: isSuper, roles };
  });

// ---------- first-time super admin bootstrap (public, one-shot) ----------

/** Public: returns whether a super admin already exists. Safe read (count only). */
export const hasSuperAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "super_admin");
  if (error) throw new Error(error.message);
  return { exists: (count ?? 0) > 0 };
});

const bootstrapSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
  mobile: z.string().trim().min(6, "Mobile number is required").max(30),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  setupToken: z.string().trim().min(1, "Setup token is required").max(256),
});

// Constant-time string comparison to avoid leaking token length/prefix via timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Public one-shot: creates the very first Super Admin account.
 * Requires the server-side ADMIN_BOOTSTRAP_TOKEN secret to prevent
 * random visitors from seizing admin access before the real owner
 * completes setup. Refuses to run once any super admin exists.
 */
export const bootstrapSuperAdmin = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => bootstrapSchema.parse(raw))
  .handler(async ({ data }) => {
    // Never log or persist the setup token, password, or their lengths.
    // Emails and mobile numbers are logged since they identify the actor
    // in an audit trail; add masking later if the compliance bar changes.
    const attemptedAt = new Date().toISOString();
    const baseMeta: Record<string, unknown> = {
      email: data.email,
      full_name: data.fullName,
      mobile: data.mobile,
      attempted_at: attemptedAt,
    };

    // `audit()` requires an actor id; before the auth user exists we use
    // a fixed sentinel so failure rows still land in the audit table
    // rather than being silently dropped by NOT-NULL constraints upstream.
    const ANONYMOUS_ACTOR = "00000000-0000-0000-0000-000000000000";

    const logFailure = (reason: string, extra: Record<string, unknown> = {}) =>
      audit(ANONYMOUS_ACTOR, "super_admin.bootstrap_failed", null, {
        ...baseMeta,
        reason,
        ...extra,
      });

    try {
      const expected = process.env.ADMIN_BOOTSTRAP_TOKEN;
      // Deliberately generic to the caller (see admin.setup.tsx), but the
      // audit row distinguishes the two so operators can tell "no secret
      // configured" from "wrong token submitted".
      if (!expected || expected.length < 16) {
        await logFailure("setup_token_not_configured");
        throw new Error("Invalid setup token.");
      }
      if (!safeEqual(data.setupToken, expected)) {
        await logFailure("invalid_setup_token");
        throw new Error("Invalid setup token.");
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Hard guard: refuse if a super admin already exists.
      const { count, error: countErr } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin");
      if (countErr) {
        await logFailure("count_check_failed", { error: countErr.message });
        throw new Error(countErr.message);
      }
      if ((count ?? 0) > 0) {
        await logFailure("super_admin_already_exists");
        throw new Error("Super Admin already exists. Setup is disabled.");
      }

      // Create the auth user (email confirmed so they can sign in immediately).
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName, mobile: data.mobile },
      });
      if (createErr || !created?.user) {
        await logFailure("auth_user_create_failed", { error: createErr?.message ?? null });
        throw new Error(createErr?.message || "Could not create account. The email may already be in use.");
      }
      const uid = created.user.id;

      // Re-check the guard atomically before granting the role.
      const { count: recount } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin");
      if ((recount ?? 0) > 0) {
        await supabaseAdmin.auth.admin.deleteUser(uid).catch(() => {});
        await audit(uid, "super_admin.bootstrap_failed", uid, {
          ...baseMeta,
          reason: "race_lost_super_admin_exists",
        });
        throw new Error("Super Admin was created by another session. Please sign in.");
      }

      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: uid, role: "super_admin" });
      if (roleErr) {
        await supabaseAdmin.auth.admin.deleteUser(uid).catch(() => {});
        await audit(uid, "super_admin.bootstrap_failed", uid, {
          ...baseMeta,
          reason: "role_grant_failed",
          error: roleErr.message,
        });
        throw new Error(roleErr.message);
      }

      const { error: profErr } = await supabaseAdmin.from("admin_profiles").upsert(
        {
          user_id: uid,
          full_name: data.fullName,
          email: data.email,
          mobile: data.mobile,
          status: "active",
        },
        { onConflict: "user_id" },
      );
      if (profErr) {
        // Roll back role + user so setup remains available on retry.
        await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
        await supabaseAdmin.auth.admin.deleteUser(uid).catch(() => {});
        await audit(uid, "super_admin.bootstrap_failed", uid, {
          ...baseMeta,
          reason: "profile_upsert_failed",
          error: profErr.message,
        });
        throw new Error(profErr.message);
      }

      await audit(uid, "super_admin.bootstrapped", uid, {
        ...baseMeta,
        created_auth_user_id: uid,
        completed_at: new Date().toISOString(),
      });

      return { ok: true, email: data.email };
    } catch (err) {
      // Any un-tagged failure (transport, unexpected throw) still gets a
      // row so operators aren't blind to it. Known failures above already
      // logged with a specific reason and will not double-log here.
      if (!(err instanceof Error) || !/Invalid setup token\.|Super Admin (already exists|was created)|Could not create account/.test(err.message)) {
        await logFailure("unexpected_error", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
      throw err;
    }
  });


