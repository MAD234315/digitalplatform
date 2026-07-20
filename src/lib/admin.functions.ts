import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

async function assertPermission(supabase: any, userId: string, permission: string) {
  const { data, error } = await supabase.rpc("has_permission", {
    _user_id: userId,
    _permission: permission,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Forbidden: missing permission ${permission}`);
}

/** Best-effort audit trail entry. Never blocks the caller on failure. */
async function audit(
  supabase: any,
  actorUserId: string,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    const ip = (() => { try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; } })();
    const ua = (() => { try { return getRequestHeader("user-agent") ?? null; } catch { return null; } })();
    await supabase.from("admin_audit_log").insert({
      actor_user_id: actorUserId,
      action,
      metadata,
      ip,
      user_agent: ua,
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}

/** Check current user's admin status. */
export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rolesRows, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const { count } = await context.supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .in("role", ["super_admin", "admin", "editor", "viewer"] as any);
    const roles = (rolesRows ?? []).map((r: any) => r.role as string);
    return {
      isAdmin: roles.some((r) => ["super_admin", "admin", "editor", "viewer"].includes(r)),
      adminCount: count ?? 0,
      roles,
    };
  });

const settingSchema = z.object({
  key: z.enum(["site_status", "spreadsheet_url"]),
  value: z.any(),
});

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPermission(context.supabase, context.userId, "settings.manage");
    const { data, error } = await context.supabase
      .from("site_settings")
      .select("key, value, updated_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => settingSchema.parse(raw))
  .handler(async ({ data, context }) => {
    await assertPermission(
      context.supabase,
      context.userId,
      data.key === "site_status" ? "status.manage" : "settings.manage",
    );
    const { data: prev } = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", data.key)
      .maybeSingle();
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    await audit(context.supabase, context.userId, `setting.${data.key}.updated`, {
      key: data.key,
      previous_value: prev?.value ?? null,
      new_value: data.value,
    });
    return { ok: true };
  });


/** Admin: list all proofs with fresh signed URLs. */
export const listProofsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPermission(context.supabase, context.userId, "proofs.manage");
    const { data, error } = await context.supabase
      .from("proofs")
      .select("id, title, description, image_path, published, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const signed = await Promise.all(
      rows.map(async (r) => {
        const { data: s } = await context.supabase.storage
          .from("proofs")
          .createSignedUrl(r.image_path, 60 * 60 * 24 * 7);
        const version = new Date(r.updated_at ?? r.created_at).getTime() || Date.now();
        const url = s?.signedUrl
          ? `${s.signedUrl}${s.signedUrl.includes("?") ? "&" : "?"}v=${version}`
          : null;
        return { ...r, image_url: url };
      })
    );
    return signed;
  });

const createProofSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  image_path: z.string().trim().min(1).max(500),
  published: z.boolean().optional().default(true),
});

export const createProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => createProofSchema.parse(raw))
  .handler(async ({ data, context }) => {
    await assertPermission(context.supabase, context.userId, "proofs.manage");
    // Verify the object actually exists in storage before saving DB row.
    const { data: signed, error: signErr } = await context.supabase.storage
      .from("proofs")
      .createSignedUrl(data.image_path, 60);
    if (signErr || !signed?.signedUrl) {
      throw new Error("Uploaded image not found in storage. Please retry.");
    }
    const { data: row, error } = await context.supabase
      .from("proofs")
      .insert({
        title: data.title,
        description: data.description,
        image_path: data.image_path,
        published: data.published ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await audit(context.supabase, context.userId, "proof.created", {
      proof_id: row.id,
      title: row.title,
      published: row.published,
    });
    return row;
  });

const updateProofSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  image_path: z.string().trim().min(1).max(500).optional(),
  published: z.boolean().optional(),
});

export const updateProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => updateProofSchema.parse(raw))
  .handler(async ({ data, context }) => {
    await assertPermission(context.supabase, context.userId, "proofs.manage");
    const { id, ...patch } = data;
    const { data: prev } = await context.supabase
      .from("proofs")
      .select("title, description, image_path, published")
      .eq("id", id)
      .single();
    const { error } = await context.supabase.from("proofs").update(patch).eq("id", id);
    if (error) throw new Error(error.message);

    // Compute what actually changed for a compact audit trail.
    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const k of Object.keys(patch) as (keyof typeof patch)[]) {
      const before = (prev as any)?.[k];
      const after = (patch as any)[k];
      if (before !== after) changed[k] = { from: before, to: after };
    }

    if ("published" in patch && prev && prev.published !== patch.published) {
      await audit(
        context.supabase,
        context.userId,
        patch.published ? "proof.published" : "proof.hidden",
        { proof_id: id, title: prev.title },
      );
    }
    if ("image_path" in patch && prev && prev.image_path !== patch.image_path) {
      await audit(context.supabase, context.userId, "proof.image_replaced", {
        proof_id: id,
        title: prev.title,
        from: prev.image_path,
        to: patch.image_path,
      });
    }
    const nonToggleChanges = Object.keys(changed).filter(
      (k) => k !== "published" && k !== "image_path",
    );
    if (nonToggleChanges.length > 0) {
      const subset: Record<string, unknown> = {};
      for (const k of nonToggleChanges) subset[k] = changed[k];
      await audit(context.supabase, context.userId, "proof.edited", {
        proof_id: id,
        title: prev?.title ?? null,
        changes: subset,
      });
    }
    return { ok: true };
  });

export const deleteProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertPermission(context.supabase, context.userId, "proofs.manage");
    const { data: row } = await context.supabase
      .from("proofs")
      .select("title, image_path")
      .eq("id", data.id)
      .single();
    if (row?.image_path) {
      await context.supabase.storage.from("proofs").remove([row.image_path]);
    }
    const { error } = await context.supabase.from("proofs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(context.supabase, context.userId, "proof.deleted", {
      proof_id: data.id,
      title: row?.title ?? null,
    });
    return { ok: true };

  });
