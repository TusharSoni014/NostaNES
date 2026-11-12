import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

// Built once at build time (no request-time APIs), so it costs no function calls.
const DISALLOW = ["/api/"]

// AI search and training crawlers are welcomed explicitly, as on lazee.dev.
const AI_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_BOTS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
