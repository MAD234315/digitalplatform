import { WifiOff, Signal } from "lucide-react";
import { useOnline, useConnectionQuality } from "@/lib/network";

export function NetworkBanner() {
  const online = useOnline();
  const { slow, effectiveType, saveData } = useConnectionQuality();

  if (online && !slow) return null;

  const offline = !online;
  const label = offline
    ? "You're offline. Actions will fail until your connection returns."
    : `Slow connection detected${effectiveType ? ` (${effectiveType.toUpperCase()})` : ""}${
        saveData ? " · Data Saver on" : ""
      }. Uploads and saves may take longer or need a retry.`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sticky top-[52px] sm:top-[57px] z-30 border-b ${
        offline ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-amber/40 bg-amber/10 text-amber"
      }`}
    >
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2 flex items-center gap-2 text-xs sm:text-sm">
        {offline ? <WifiOff className="h-4 w-4 shrink-0" /> : <Signal className="h-4 w-4 shrink-0" />}
        <span className="min-w-0">{label}</span>
      </div>
    </div>
  );
}
