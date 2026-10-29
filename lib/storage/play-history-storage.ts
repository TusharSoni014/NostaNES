export const PLAY_HISTORY_STORAGE_KEY = "nostanes_play_history"
export const PLAY_HISTORY_EVENT = "nostanes:play_history_changed"

import type { Game } from "@/lib/games"

/** One played title, newest first. Keyed like groupGames so every release of a title shares one entry. */
export type PlayHistoryEntry = {
  key: string
  title: string
  file: string
  playedAt: number
}

export function getHistoryKey(game: Pick<Game, "title">): string {
  return game.title.trim().toLowerCase()
}

function isEntry(value: unknown): value is PlayHistoryEntry {
  if (!value || typeof value !== "object") return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.key === "string" &&
    typeof entry.title === "string" &&
    typeof entry.file === "string" &&
    typeof entry.playedAt === "number"
  )
}

export function loadPlayHistory(): PlayHistoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(PLAY_HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isEntry) : []
  } catch {
    return []
  }
}

function savePlayHistory(history: PlayHistoryEntry[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PLAY_HISTORY_STORAGE_KEY, JSON.stringify(history))
    window.dispatchEvent(new CustomEvent(PLAY_HISTORY_EVENT, { detail: history }))
  } catch (err) {
    console.error("Failed to save play history to localStorage:", err)
  }
}

/** Moves the game to the front of the history. Local ROMs are skipped: they cannot be relaunched after a reload. */
export function recordPlayInHistory(game: Game): void {
  if (game.customRom) return
  const key = getHistoryKey(game)
  if (!key) return
  const rest = loadPlayHistory().filter((entry) => entry.key !== key)
  savePlayHistory([{ key, title: game.title, file: game.file, playedAt: Date.now() }, ...rest])
}

export function clearPlayHistory(): void {
  savePlayHistory([])
}
