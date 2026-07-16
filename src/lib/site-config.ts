/**
 * Canonical site URLs and shared SEO assets.
 * Keeping one source prevents drift across route files, JSON-LD, and the sitemap.
 */
export const SITE_URL = "https://digitalplatform13.lovable.app";

/**
 * Sitewide social preview image. Currently a hosted screenshot preview — swap to
 * a purpose-built 1200×630 cover when one is designed.
 */
export const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9020bb4c-4fbb-4a1f-952c-73595881f781/id-preview-e6e1751c--d4bb26a2-c52c-4106-b5f5-124547e11859.lovable.app-1784176439112.png";

export const ORG_ID = SITE_URL + "/#organization";
export const WEBSITE_ID = SITE_URL + "/#website";
