import { cacheLife } from "next/cache"
import raw from "@/data/roms.json"
import {
  CATALOG_URL,
  mergeLibrary,
  normalizeCatalog,
  type RomEntry,
} from "@/lib/games"

export async function GET() {
  const games = await loadLibrary()
  return Response.json({ games })
}

async function loadLibrary() {
  "use cache"
  cacheLife("minutes")

  const local = raw as RomEntry[]
  let remote: RomEntry[] = []

  try {
    const response = await fetch(CATALOG_URL, { cache: "no-store" })
    if (response.ok) {
      remote = normalizeCatalog(await response.json())
    }
  } catch {
    remote = []
  }

  return mergeLibrary(local, remote)
}
