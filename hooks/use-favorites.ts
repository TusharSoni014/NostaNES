"use client"

import { useSyncExternalStore, useCallback, useEffect } from "react"
import {
  FAVORITES_EVENT,
  FAVORITES_STORAGE_KEY,
  isGameFavorited,
  loadFavorites,
  toggleFavoriteInStorage,
  addFavoriteInStorage,
  removeFavoriteInStorage,
} from "@/lib/storage/favorites-storage"
import type { Game, GameGroup } from "@/lib/games"

let memoryFavorites: string[] = []
let isHydrated = false

const SERVER_SNAPSHOT: string[] = []

function getFavoritesSnapshot(): string[] {
  return isHydrated ? memoryFavorites : SERVER_SNAPSHOT
}

function getServerSnapshot(): string[] {
  return SERVER_SNAPSHOT
}

const listeners = new Set<() => void>()

function notifyListeners(next?: string[]) {
  if (next) memoryFavorites = next
  else memoryFavorites = loadFavorites()
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  if (typeof window !== "undefined") {
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>
      notifyListeners(customEvent.detail ?? undefined)
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_STORAGE_KEY) {
        notifyListeners()
      }
    }

    window.addEventListener(FAVORITES_EVENT, handleCustom)
    window.addEventListener("storage", handleStorage)

    return () => {
      listeners.delete(listener)
      window.removeEventListener(FAVORITES_EVENT, handleCustom)
      window.removeEventListener("storage", handleStorage)
    }
  }

  return () => {
    listeners.delete(listener)
  }
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getFavoritesSnapshot, getServerSnapshot)

  useEffect(() => {
    if (!isHydrated) {
      isHydrated = true
      memoryFavorites = loadFavorites()
      notifyListeners()
    }
  }, [])

  const isFavorite = useCallback(
    (game: Game | GameGroup | string | null | undefined): boolean => {
      return isGameFavorited(favorites, game)
    },
    [favorites],
  )

  const toggleFavorite = useCallback(
    (game: Game | GameGroup | string): boolean => {
      return toggleFavoriteInStorage(game)
    },
    [],
  )

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
