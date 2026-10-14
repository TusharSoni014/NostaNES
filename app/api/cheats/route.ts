import type { NextRequest } from "next/server"
import {
  findNesCheatFiles,
  readNesCheatFile,
  searchNesCheatFiles,
} from "@/lib/cheats/nes-cheat-source"

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name") ?? ""

  try {
    if (name) {
      const text = await readNesCheatFile(name)
      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      })
    }

    const query = request.nextUrl.searchParams.get("q") ?? ""
    const title = request.nextUrl.searchParams.get("title") ?? ""
    const file = request.nextUrl.searchParams.get("file") ?? ""
    const files = query.trim()
      ? await searchNesCheatFiles(query)
      : await findNesCheatFiles(title, file)

    return Response.json(
      { files },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cheat lookup failed"
    const status = message === "Unknown cheat file" ? 404 : 502
    return Response.json({ error: message }, { status })
  }
}
