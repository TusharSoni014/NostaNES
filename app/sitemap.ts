import type { MetadataRoute } from "next"
import { absoluteUrl, INFO_PAGES } from "@/lib/site"

// Static list, built once at build time. Games are not listed: the library
// lives on the home page and has no per-game URLs.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...INFO_PAGES.map((page) => ({
      url: absoluteUrl(page.path),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
