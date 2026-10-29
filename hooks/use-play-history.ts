"use client"

import { useSyncExternalStore } from "react"
import {
  PLAY_HISTORY_EVENT,
  PLAY_HISTORY_STORAGE_KEY,
  clearPlayHistory,
  loadPlayHistory,
  type PlayHistoryEntry,
} from "@/lib/storage/play-history-storage"

const EMPTY_HISTORY: readonly PlayHistoryEntry[] = []

let memoryHistory: readonly PlayHistoryEntry[] = EMPTY_HISTORY
let hydrated = false
const listeners = new Set<() => void>()
let windowListenersBound = false

function emit(next: readonly PlayHistoryEntry[]) {
  memoryHistory = next
  hydrated = true
  for (const listener of [...listeners]) listener()
}

function bindWindowListeners() {
  if (windowListenersBound || typeof window === "undefined") return
  windowListenersBound = true

  window.addEventListener(PLAY_HISTORY_EVENT, (event: Event) => {
    const detail = (event as CustomEvent<PlayHistoryEntry[] | undefined>).detail
    emit(detail ?? loadPlayHistory())
  })

  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key === PLAY_HISTORY_STORAGE_KEY) emit(loadPlayHistory())
  })
}

function subscribe(listener: () => void) {
  bindWindowListeners()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getHistorySnapshot(): readonly PlayHistoryEntry[] {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true
    memoryHistory = loadPlayHistory()
  }
  return memoryHistory
}

function getServerSnapshot(): readonly PlayHistoryEntry[] {
  return EMPTY_HISTORY
}

export function usePlayHistory() {
  const history = useSyncExternalStore(subscribe, getHistorySnapshot, getServerSnapshot)
  return { history, clearHistory: clearPlayHistory }
}
