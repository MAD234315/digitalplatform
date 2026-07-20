import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

const IDLE_MS = 30 * 60 * 1000; // 30 minutes

export function useSessionTimeout(enabled: boolean) {
  const navigate = useNavigate();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const reset = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(async () => {
        await supabase.auth.signOut();
        toast.info("Signed out due to inactivity");
        navigate({ to: "/admin/login" });
      }, IDLE_MS);
    };
    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [enabled, navigate]);
}
