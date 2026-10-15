export const FAVORITES_STORAGE_KEY = "nostanes_favorites"
export const FAVORITES_EVENT = "nostanes:favorites_changed"

import type { Game, GameGroup } from "@/lib/games"

export function getFavoriteKey(game: Game | GameGroup | string): string {
  if (typeof game === "string") return game.trim().toLowerCase()
  const raw = game.title || game.file || game.id || ""
  return raw.trim().toLowerCase()
}

export function loadFavorites(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim().toLowerCase()) : []
  } catch {
    return []
  }
}

export function saveFavorites(favorites: string[]): void {
  if (typeof window === "undefined") return
  try {
    const clean = Array.from(new Set(favorites.map((f) => f.trim().toLowerCase()))).filter(Boolean)
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(clean))
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: clean }))
  } catch (err) {
    console.error("Failed to save favorites to localStorage:", err)
  }
}

export function isGameFavorited(
  favorites: readonly string[],
  game: Game | GameGroup | string | null | undefined,
): boolean {
  if (!game || !favorites || favorites.length === 0) return false
  if (typeof game === "string") {
    const k = game.trim().toLowerCase()
    return favorites.includes(k)
  }

  const keysToCheck = [
    game.title ? game.title.trim().toLowerCase() : null,
    game.id ? game.id.trim().toLowerCase() : null,
    game.file ? game.file.trim().toLowerCase() : null,
  ].filter(Boolean) as string[]

  if ("versions" in game && Array.isArray(game.versions)) {
    for (const v of game.versions) {
      if (v.title) keysToCheck.push(v.title.trim().toLowerCase())
      if (v.file) keysToCheck.push(v.file.trim().toLowerCase())
      if (v.id) keysToCheck.push(v.id.trim().toLowerCase())
    }
  }

  return keysToCheck.some((k) => favorites.includes(k))
}

export function toggleFavoriteInStorage(game: Game | GameGroup | string): boolean {
  const current = loadFavorites()
  const currentlyFav = isGameFavorited(current, game)
  const key = getFavoriteKey(game)

  let next: string[]
  if (currentlyFav) {
    // Remove all related keys for this game
    const keysToRemove = new Set([
      key,
      typeof game !== "string" && game.title ? game.title.trim().toLowerCase() : null,
      typeof game !== "string" && game.file ? game.file.trim().toLowerCase() : null,
      typeof game !== "string" && game.id ? game.id.trim().toLowerCase() : null,
    ].filter(Boolean) as string[])

    if (typeof game !== "string" && "versions" in game && Array.isArray(game.versions)) {
      for (const v of game.versions) {
        if (v.title) keysToRemove.add(v.title.trim().toLowerCase())
        if (v.file) keysToRemove.add(v.file.trim().toLowerCase())
        if (v.id) keysToRemove.add(v.id.trim().toLowerCase())
      }
    }

    next = current.filter((k) => !keysToRemove.has(k))
  } else {
    next = [...current, key]
  }

  saveFavorites(next)
  return !currentlyFav
}

export function addFavoriteInStorage(game: Game | GameGroup | string): void {
  const current = loadFavorites()
  if (isGameFavorited(current, game)) return
  const key = getFavoriteKey(game)
  saveFavorites([...current, key])
}

export function removeFavoriteInStorage(game: Game | GameGroup | string): void {
  const current = loadFavorites()
  if (!isGameFavorited(current, game)) return
  toggleFavoriteInStorage(game)
}
