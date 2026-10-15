"use client"

import { useQuery } from "@tanstack/react-query"
import type { Game } from "@/lib/games"

const STORAGE_KEY = "nostanes:library_cache:v1"

function getCachedLibrary(): Game[] | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {
    // Ignore storage parse issues
  }
  return undefined
}

function setCachedLibrary(games: Game[]): void {
  if (typeof window === "undefined" || !games.length) return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(games))
  } catch {
    // Ignore quota issues
  }
}

async function fetchLibrary(): Promise<Game[]> {
  const response = await fetch("/api/library")
  if (!response.ok) throw new Error("Failed to load library from server")
  const data = (await response.json()) as { games?: Game[] }
  const games = data.games ?? []
  if (games.length > 0) {
    setCachedLibrary(games)
  }
  return games
}

export function useLibrary(initialGames?: Game[]) {
  const seeded =
    initialGames && initialGames.length > 0
      ? initialGames
      : getCachedLibrary()

  return useQuery({
    queryKey: ["library"],
    queryFn: fetchLibrary,
    initialData: seeded,
    initialDataUpdatedAt: seeded ? 0 : undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
