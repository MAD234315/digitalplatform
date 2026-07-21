/**
 * Client-side helpers for the Proof Gallery upload flow.
 *
 * We upload directly from the browser to the `proofs` storage bucket using
 * the authenticated Supabase client — this is the only path that works
 * reliably across mobile browsers (Android Chrome/Edge/Firefox, Samsung
 * Internet, iPhone Safari/Chrome). Base64 round-tripping through server
 * functions inflates payloads by ~33 % and hits Worker request-size limits,
 * and it also loses the correct Content-Type on browsers that report an
 * empty `File.type` for screenshots.
 */
import { supabase } from "@/integrations/supabase/client";

/** Formats we accept from the file picker / camera. */
export const ALLOWED_IMAGE_EXT =
  /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
};

/** Max size per file. Screenshots comfortably fit. */
export const MAX_IMAGE_MB = 15;

/**
 * Resolve the MIME type for a File. Some Android browsers (notably Samsung
 * Internet and Firefox for Android) report `f.type === ""` for screenshots
 * picked from the gallery; falling back to the extension keeps the object
 * in storage tagged with a real content-type so browsers actually render it.
 */
export function resolveMime(file: File): string {
  if (file.type && /^image\//i.test(file.type)) return file.type;
  const m = /\.([a-z0-9]+)$/i.exec(file.name);
  const ext = m?.[1]?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "application/octet-stream";
}

/**
 * True if the browser can actually decode this file as an image. This
 * catches HEIC on Chrome/Firefox, corrupt captures, and 0-byte "file"
 * objects that some Android intents hand back, BEFORE we upload and
 * commit a proof row that would render as a blank card.
 */
export function canDecodeImage(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

/** Validation error surfaced to the user without uploading anything. */
export type UploadValidationError = {
  filename: string;
  reason: string;
};

export type ValidatedFile = {
  file: File;
  mime: string;
  previewUrl: string;
};

export async function validateImageFile(
  file: File,
): Promise<{ ok: true; value: ValidatedFile } | { ok: false; reason: string }> {
  if (!ALLOWED_IMAGE_EXT.test(file.name) && !/^image\//i.test(file.type)) {
    return { ok: false, reason: "unsupported format (JPG, PNG, WEBP, GIF, BMP, HEIC)" };
  }
  if (file.size === 0) {
    return { ok: false, reason: "file is empty" };
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return { ok: false, reason: `exceeds ${MAX_IMAGE_MB} MB` };
  }
  const mime = resolveMime(file);
  const decodable = await canDecodeImage(file);
  if (!decodable) {
    return {
      ok: false,
      reason: /heic|heif/i.test(mime)
        ? "HEIC can't be shown by all browsers — please share as JPG or PNG"
        : "file couldn't be opened as an image",
    };
  }
  return { ok: true, value: { file, mime, previewUrl: URL.createObjectURL(file) } };
}

/**
 * Build the storage path the server schema accepts: `<uuid>.<ext>`.
 * Never trust the original filename — it may contain spaces, unicode,
 * or path separators.
 */
export function buildStoragePath(file: File): string {
  const m = /\.([a-z0-9]{1,8})$/i.exec(file.name);
  const ext = (m?.[1] ?? "").toLowerCase() || extFromMime(resolveMime(file));
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${id}.${ext || "bin"}`;
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    case "image/bmp": return "bmp";
    case "image/heic": return "heic";
    case "image/heif": return "heif";
    default: return "bin";
  }
}

/**
 * Upload one file directly to the `proofs` bucket as the signed-in admin.
 * Returns the storage path on success. The admin RLS policy on
 * `storage.objects` gates access.
 */
export async function uploadProofFile(vf: ValidatedFile): Promise<string> {
  const path = buildStoragePath(vf.file);
  const { error } = await supabase.storage
    .from("proofs")
    .upload(path, vf.file, {
      contentType: vf.mime,
      cacheControl: "3600",
      upsert: false,
    });
  if (error) {
    throw new Error(error.message || "Upload failed");
  }
  return path;
}
