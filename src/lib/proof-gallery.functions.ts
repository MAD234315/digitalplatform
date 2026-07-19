import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function isNewKey(v: string) {
  return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_");
}

function createPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (isNewKey(key) && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Public: list published proofs with signed image URLs (1 hour). */
export const listPublicProofs = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("proofs")
    .select("id, title, description, image_path, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const signed = await Promise.all(
    rows.map(async (r) => {
      const { data: s } = await supabase.storage
        .from("proofs")
        .createSignedUrl(r.image_path, 60 * 60);
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        created_at: r.created_at,
        image_url: s?.signedUrl ?? null,
      };
    })
  );
  return signed.filter((p) => p.image_url);
});

export const getSiteStatus = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site_status")
    .maybeSingle();
  const val = data?.value;
  const status = typeof val === "string" ? val : "online";
  return { status: status === "offline" ? "offline" : "online" };
});
