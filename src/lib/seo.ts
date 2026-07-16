import { OG_IMAGE, SITE_URL } from "@/lib/site-config";

/**
 * Build the standard head() payload for a content route — title, description,
 * Open Graph + Twitter tags, canonical link, and a BreadcrumbList JSON-LD.
 *
 * Every editorial route (about, contact, faq, …) used to hand-roll these
 * ~40 lines of meta; this helper keeps them consistent and lets us tweak
 * the tag set (e.g. add `og:site_name`) in a single place.
 *
 * Pass extra JSON-LD blocks via `extraJsonLd` — they are appended AFTER the
 * breadcrumb script so ordering stays predictable in devtools.
 */
export function buildRouteHead({
  path,
  title,
  description,
  imageAlt,
  extraJsonLd = [],
}: {
  /** Path with leading slash, e.g. "/about". */
  path: string;
  title: string;
  description: string;
  /** Alt text for og:image. Defaults to the page title. */
  imageAlt?: string;
  /** Additional JSON-LD objects to inline (already plain objects, not strings). */
  extraJsonLd?: object[];
}) {
  const url = SITE_URL + path;
  const alt = imageAlt ?? title;
  const crumbs = crumbsFor(path, title);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: alt },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs,
        }),
      },
      ...extraJsonLd.map((obj) => ({
        type: "application/ld+json",
        children: JSON.stringify(obj),
      })),
    ],
  };
}

/**
 * Build a BreadcrumbList itemListElement array from a single path.
 * "/foo/bar" → [Home, Foo (segment-title), Bar (leaf-title)].
 */
function crumbsFor(path: string, leafTitle: string) {
  const segments = path.split("/").filter(Boolean);
  const items: { "@type": "ListItem"; position: number; name: string; item: string }[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
  ];
  let acc = "";
  segments.forEach((seg, i) => {
    acc += "/" + seg;
    const isLeaf = i === segments.length - 1;
    items.push({
      "@type": "ListItem",
      position: i + 2,
      name: isLeaf ? leafTitle : seg[0].toUpperCase() + seg.slice(1),
      item: SITE_URL + acc,
    });
  });
  return items;
}
