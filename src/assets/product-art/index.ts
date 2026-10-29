import aiCredits from "./ai-credits.webp";
import aiNew from "./ai-new.webp";
import aiProductivity from "./ai-productivity.webp";
import developer from "./developer.webp";
import editing from "./editing.webp";
import entertainment from "./entertainment.webp";
import giftCards from "./gift-cards.webp";
import miniPacks from "./mini-packs.webp";
import music from "./music.webp";
import newOffers from "./new-offers.webp";
import type { ArtworkKey } from "@/lib/product-artwork";

/** Branded backdrops, one per themed section of the catalogue. */
export const BACKDROPS: Record<ArtworkKey, string> = {
  entertainment,
  "gift-cards": giftCards,
  editing,
  "ai-productivity": aiProductivity,
  "new-offers": newOffers,
  developer,
  "ai-credits": aiCredits,
  music,
  "mini-packs": miniPacks,
  "ai-new": aiNew,
};
