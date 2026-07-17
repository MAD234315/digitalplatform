/**
 * Canonical site URLs and shared SEO assets.
 * Keeping one source prevents drift across route files, JSON-LD, and the sitemap.
 */
export const SITE_URL = "https://digitalplatform.lovable.app";

/**
 * Sitewide social preview image. Currently a hosted screenshot preview — swap to
 * a purpose-built 1200×630 cover when one is designed.
 */
export const OG_IMAGE = SITE_URL + "/og-cover.jpg";

export const ORG_ID = SITE_URL + "/#organization";
export const WEBSITE_ID = SITE_URL + "/#website";
