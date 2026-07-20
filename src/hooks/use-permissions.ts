import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyPermissions } from "@/lib/admins.functions";
import { supabase } from "@/integrations/supabase/client";


export type PermissionsState = {
  loading: boolean;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  profile: {
    user_id: string;
    full_name: string;
    email: string;
    mobile: string | null;
    status: string;
  } | null;
  has: (perm: string) => boolean;
  refresh: () => Promise<void>;
};

export function usePermissions(): PermissionsState {
  const fetchPerms = useServerFn(getMyPermissions);
  const [state, setState] = useState<Omit<PermissionsState, "has" | "refresh">>({
    loading: true,
    roles: [],
    permissions: [],
    isSuperAdmin: false,
    profile: null,
  });

  const load = useCallback(async () => {
    try {
      // Skip the auth-required RPC when there is no session (e.g. on
      // /admin/setup or /admin/login) — otherwise it 401s and surfaces
      // as a runtime error in the overlay.
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setState({ loading: false, roles: [], permissions: [], isSuperAdmin: false, profile: null });
        return;
      }
      const r = await fetchPerms();
      setState({
        loading: false,
        roles: r.roles,
        permissions: r.permissions,
        isSuperAdmin: r.isSuperAdmin,
        profile: (r.profile as any) ?? null,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [fetchPerms]);


  useEffect(() => { load(); }, [load]);

  return {
    ...state,
    has: (perm: string) => state.isSuperAdmin || state.permissions.includes(perm),
    refresh: load,
  };
}
