import { useCallback } from "react"
import { loadGameState, saveGameState } from "@/lib/storage/save-state-storage"

export function useSaveLoadState(
  gameFile: string,
  saveState: () => Promise<Blob | null>,
  loadState: (blob: Blob) => Promise<boolean>,
) {
  const handleSaveState = useCallback(
    async (slot: number) => {
      const blob = await saveState()
      if (!blob) return false
      try {
        await saveGameState(gameFile, slot, blob)
        return true
      } catch {
        return false
      }
    },
    [gameFile, saveState],
  )

  const handleLoadState = useCallback(
    async (slot: number) => {
      try {
        const record = await loadGameState(gameFile, slot)
        if (!record?.stateBlob) return false
        return await loadState(record.stateBlob)
      } catch {
        return false
      }
    },
    [gameFile, loadState],
  )

  return { handleSaveState, handleLoadState }
}
