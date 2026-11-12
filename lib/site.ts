import type { Metadata } from "next"

// Site-wide constants for metadata, the sitemap, robots and JSON-LD.
// Everything SEO-related reads from here so the URL and copy stay in one place.

/** Public origin of the site, without a trailing slash. Set NEXT_PUBLIC_SITE_URL
 *  when a custom domain is connected; the Vercel URL is the fallback. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://nosta-nes.vercel.app"
).replace(/\/+$/, "")

export const SITE_NAME = "NostaNES"

export const SITE_TITLE = "Play NES Games Online in Your Browser | NostaNES"

export const SITE_DESCRIPTION =
  "Play classic 8-bit NES games online for free, right in your browser. No download or sign-up. Gamepad and touch controls, save states, cheats, CRT filters and 2-player local play."

export const GITHUB_URL = "https://github.com/TusharSoni014/NostaNES"

export const THEME_COLOR = "#071422"

/** Static info pages, used by the sitemap, the info-page nav and llms.txt. */
export const INFO_PAGES = [
  { path: "/about", label: "About" },
  { path: "/controls", label: "Controls" },
  { path: "/faq", label: "FAQ" },
] as const

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path === "/" ? "" : path}`
}

/** The shared Open Graph image (app/opengraph-image.tsx, built at build time). */
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "NostaNES - play classic NES games online in your browser",
}

/** Full metadata for a static page. A page's `openGraph` / `twitter` objects
 *  replace the root ones instead of merging, so every field is repeated here. */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  }
}

/** Serializes JSON-LD so a value can never close the surrounding script tag. */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}
