"use client"

import { useQuery } from "@tanstack/react-query"
import type { Game } from "@/lib/games"

async function fetchLibrary(): Promise<Game[]> {
  const response = await fetch("/api/library", { cache: "no-store" })
  if (!response.ok) throw new Error("Failed to load library from server")
  const data = (await response.json()) as { games?: Game[] }
  return data.games ?? []
}

export function useLibrary(initialGames?: Game[]) {
  const seeded = initialGames && initialGames.length > 0 ? initialGames : undefined

  return useQuery({
    queryKey: ["library"],
    queryFn: fetchLibrary,
    initialData: seeded,
    initialDataUpdatedAt: seeded ? 0 : undefined,
    staleTime: 60_000,
  })
}
