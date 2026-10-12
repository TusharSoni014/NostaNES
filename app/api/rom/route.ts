import type { NextRequest } from "next/server"
import { isSafeNesFile, R2_NES_PREFIX } from "@/lib/games"

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file") ?? ""
  if (!isSafeNesFile(file)) {
    return Response.json({ error: "Unknown ROM" }, { status: 400 })
  }

  const upstream = `${R2_NES_PREFIX}/${encodeURIComponent(file)}`
  const response = await fetch(upstream)

  if (!response.ok || !response.body) {
    return Response.json({ error: "ROM not found" }, { status: 404 })
  }

  const headers = new Headers({
    "Content-Type": "application/octet-stream",
    "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  })
  const length = response.headers.get("Content-Length")
  if (length) headers.set("Content-Length", length)

  return new Response(response.body, { headers })
}
