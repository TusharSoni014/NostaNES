import type { NextRequest } from "next/server"
import { isSafeNesFile, R2_NES_PREFIX, R2_PUBLIC_BASE } from "@/lib/games"

// An upstream that has not answered by now is skipped, so a hung request never
// leaves the player on its loader. Only the wait for headers is limited.
const UPSTREAM_TIMEOUT_MS = 8000

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file") ?? ""
  if (!isSafeNesFile(file)) {
    return Response.json({ error: "Unknown ROM" }, { status: 400 })
  }

  const urlsToTry = [
    `${R2_NES_PREFIX}/${encodeURIComponent(file)}`,
    `${R2_PUBLIC_BASE}/${encodeURIComponent(file)}`,
  ]

  let upstreamResponse: Response | null = null

  for (const upstream of urlsToTry) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
    try {
      const response = await fetch(upstream, { signal: controller.signal })
      if (response.ok && response.body) {
        upstreamResponse = response
        break
      }
    } catch {
      // Continue to next candidate
    } finally {
      clearTimeout(timer)
    }
  }

  if (!upstreamResponse || !upstreamResponse.body) {
    return Response.json({ error: "ROM not found" }, { status: 404 })
  }

  const response = upstreamResponse

  const headers = new Headers({
    "Content-Type": "application/octet-stream",
    "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  })
  const length = response.headers.get("Content-Length")
  if (length) headers.set("Content-Length", length)

  return new Response(response.body, { headers })
}
