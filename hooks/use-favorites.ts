"use client"

import { useCallback, useSyncExternalStore } from "react"
import {
  FAVORITES_EVENT,
  FAVORITES_STORAGE_KEY,
  addFavoriteInStorage,
  isGameFavorited,
  loadFavorites,
  removeFavoriteInStorage,
  toggleFavoriteInStorage,
} from "@/lib/storage/favorites-storage"
import type { Game, GameGroup } from "@/lib/games"

const EMPTY_FAVORITES: readonly string[] = []

let memoryFavorites: readonly string[] = EMPTY_FAVORITES
let hydrated = false
const listeners = new Set<() => void>()
let windowListenersBound = false

function sameFavorites(left: readonly string[], right: readonly string[]) {
  if (left === right) return true
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

function emit(next: readonly string[]) {
  if (sameFavorites(memoryFavorites, next)) return
  memoryFavorites = next
  hydrated = true
  for (const listener of [...listeners]) listener()
}

function bindWindowListeners() {
  if (windowListenersBound || typeof window === "undefined") return
  windowListenersBound = true

  window.addEventListener(FAVORITES_EVENT, (event: Event) => {
    const detail = (event as CustomEvent<string[] | undefined>).detail
    emit(detail ?? loadFavorites())
  })

  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_KEY) emit(loadFavorites())
  })
}

function hydrateFavorites() {
  if (hydrated || typeof window === "undefined") return
  hydrated = true
  memoryFavorites = loadFavorites()
}

function subscribe(listener: () => void) {
  bindWindowListeners()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getFavoritesSnapshot(): readonly string[] {
  hydrateFavorites()
  return memoryFavorites
}

function getServerSnapshot(): readonly string[] {
  return EMPTY_FAVORITES
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getFavoritesSnapshot, getServerSnapshot)

  const isFavorite = useCallback(
    (game: Game | GameGroup | string | null | undefined): boolean => {
      return isGameFavorited(favorites, game)
    },
    [favorites],
  )

  const toggleFavorite = useCallback((game: Game | GameGroup | string): boolean => {
    return toggleFavoriteInStorage(game)
  }, [])

  const addFavorite = useCallback((game: Game | GameGroup | string): void => {
    addFavoriteInStorage(game)
  }, [])

  const removeFavorite = useCallback((game: Game | GameGroup | string): void => {
    removeFavoriteInStorage(game)
  }, [])

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    favoritesCount: favorites.length,
  }
}
