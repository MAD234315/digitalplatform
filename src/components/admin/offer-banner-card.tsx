import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Save, Trash2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getAdminOfferBanner, upsertOfferBanner } from "@/lib/admin.functions";
import { offerBannerSchema, validateBannerFile, type OfferBannerInput } from "@/lib/offer-banner";

const empty: OfferBannerInput = { enabled: false, mediaType: "image", mediaPath: null, headline: null, subline: null, ctaText: null, ctaLink: null };

export function OfferBannerCard() {
  const read = useServerFn(getAdminOfferBanner);
  const save = useServerFn(upsertOfferBanner);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin-offer-banner"], queryFn: () => read() });
  const [draft, setDraft] = useState<OfferBannerInput>(empty);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.data) {
      const { enabled, mediaType, mediaPath, headline, subline, ctaText, ctaLink } = query.data;
      setDraft({ enabled, mediaType, mediaPath, headline, subline, ctaText, ctaLink });
    }
  }, [query.data]);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    let uploaded: string | null = null;
    let committed = false;
    setBusy(true);
    try {
      // Validate before uploading, so invalid fields do not create orphan media.
      let mediaPath = removed ? null : draft.mediaPath;
      offerBannerSchema.parse({ ...draft, mediaPath: file ? "pending-upload" : mediaPath });
      if (file) {
        const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm" };
        validateBannerFile(file);
        const path = `offers/${crypto.randomUUID()}.${extensions[file.type]}`;
        const { error } = await supabase.storage.from("offer-banners").upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        uploaded = path;
        mediaPath = path;
      }
      await save({ data: { ...draft, mediaPath } });
      committed = true;
      setDraft((current) => ({ ...current, mediaPath }));
      setFile(null);
      setRemoved(false);
      if (input.current) input.current.value = "";
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-offer-banner"] }),
        qc.invalidateQueries({ queryKey: ["offer-banner"] }),
      ]);
      toast.success(draft.enabled ? "Offer banner is live" : "Offer banner saved — hidden from visitors");
    } catch (error) {
      if (uploaded && !committed) await supabase.storage.from("offer-banners").remove([uploaded]);
      const message = error instanceof Error ? error.message : "Could not save the offer banner";
      toast.error(message.startsWith("[") ? "Check your banner settings and link before saving." : message);
    } finally { setBusy(false); }
  }

  const mediaUrl = preview ?? (removed ? null : query.data?.mediaUrl);

  return (
    <section className="rounded-lg border border-border bg-card/60 p-4 sm:p-6" aria-labelledby="offer-banner-heading">
      <div className="flex items-center gap-3">
        <ImagePlus className="h-6 w-6 shrink-0 text-amber" />
        <h2 id="offer-banner-heading" className="font-display text-2xl">Homepage Offer Banner</h2>
      </div>
      {query.isPending ? <p role="status" className="mt-5 text-sm text-muted-foreground">Loading banner…</p> : query.isError ? (
        <div className="mt-5"><p role="alert" className="text-sm text-destructive">Could not load the banner settings.</p><Button variant="outline" className="mt-3 min-h-11" onClick={() => query.refetch()}>Retry</Button></div>
      ) : (
        <form onSubmit={onSave} className="mt-5 space-y-5">
          <label className="flex min-h-11 items-center justify-between gap-4 text-sm font-medium">
            Show banner on homepage
            <Switch aria-label="Show banner on homepage" checked={draft.enabled} disabled={busy} onCheckedChange={(enabled) => setDraft((current) => ({ ...current, enabled }))} />
          </label>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-3">
              {mediaUrl ? (
                <div className="aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                  {draft.mediaType === "video" ? <video src={mediaUrl} controls muted playsInline className="h-full w-full object-contain" /> : <img src={mediaUrl} alt="Offer banner preview" className="h-full w-full object-contain" />}
                </div>
              ) : <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-muted text-sm text-muted-foreground">No photo or video selected</div>}
              <label className="block text-sm font-medium" htmlFor="offer-banner-file">Photo or video</label>
              <input id="offer-banner-file" ref={input} type="file" disabled={busy} accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" className="w-full min-w-0 text-sm file:mr-3 file:min-h-11 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:text-foreground" onChange={(event) => {
                const selected = event.target.files?.[0];
                if (!selected) return;
                try {
                  const mediaType = validateBannerFile(selected);
                  setFile(selected);
                  setRemoved(false);
                  setDraft((current) => ({ ...current, mediaType }));
                } catch (error) {
                  event.target.value = "";
                  toast.error(error instanceof Error ? error.message : "Unsupported file");
                }
              }} />
              {(file || draft.mediaPath) && !removed && <Button type="button" variant="outline" disabled={busy} className="min-h-11" onClick={() => {
                setFile(null); setRemoved(true);
                setDraft((current) => ({ ...current, enabled: false, mediaPath: null }));
                if (input.current) input.current.value = "";
              }}><Trash2 />Remove media</Button>}
            </div>
            <div className="min-w-0 space-y-4">
              {([
                ["headline", "Headline", 120], ["subline", "Supporting text", 240],
                ["ctaText", "Button text", 60], ["ctaLink", "Button link", 500],
              ] as const).map(([key, label, max]) => <label key={key} className="block space-y-1.5 text-sm font-medium">
                <span>{label}</span>
                <Input value={draft[key] ?? ""} maxLength={max} disabled={busy} className="min-h-11" placeholder={key === "ctaLink" ? "/products or https://…" : undefined} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value || null }))} />
              </label>)}
            </div>
          </div>
          <Button type="submit" disabled={busy} className="min-h-11 w-full sm:w-auto">{busy ? <LoaderCircle className="animate-spin" /> : <Save />}{busy ? "Saving banner…" : "Save banner"}</Button>
        </form>
      )}
    </section>
  );
}