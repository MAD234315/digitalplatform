import { z } from "zod";

export const offerBannerSchema = z.object({
  enabled: z.boolean(),
  mediaType: z.enum(["image", "video"]),
  mediaPath: z.string().min(1).nullable(),
  headline: z.string().max(120).nullable(),
  subline: z.string().max(240).nullable(),
  ctaText: z.string().max(60).nullable(),
  ctaLink: z.string().max(500).nullable().refine((value) => {
    if (!value) return true;
    if (value.startsWith("/") && !value.startsWith("//") && !/[\\\s]/.test(value)) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch { return false; }
  }, "Use a website path or an HTTPS link."),
}).refine((value) => !value.enabled || Boolean(value.mediaPath), "Upload a photo or video before enabling the banner.");

export type OfferBannerInput = z.infer<typeof offerBannerSchema>;

export function validateBannerFile(file: Pick<File, "type" | "size">): "image" | "video" {
  if (file.size <= 0 || file.size > 50 * 1024 * 1024) throw new Error("Choose a non-empty file under 50 MB.");
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) return "image";
  if (["video/mp4", "video/webm"].includes(file.type)) return "video";
  throw new Error("Choose a JPG, PNG, WebP, GIF, MP4 or WebM file.");
}