"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2Icon,
  HardDriveDownloadIcon,
  Loader2Icon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  deleteGameState,
  listGameSaves,
  type SavedStateRecord,
} from "@/lib/storage/save-state-storage"
import { playUiSound } from "@/lib/ui-sounds"
import type { Game } from "@/lib/games"

type InGameMenuLoadPanelProps = {
  game: Game
  onLoadState: (slot: number) => Promise<boolean>
  onResume: () => void
}

const SLOTS = [1, 2, 3]

export const InGameMenuLoadPanel = ({
  game,
  onLoadState,
  onResume,
}: InGameMenuLoadPanelProps) => {
  const [saves, setSaves] = useState<SavedStateRecord[]>([])
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const reloadSaves = useCallback(async () => {
    try {
      const records = await listGameSaves(game.file)
      setSaves(records)
    } catch (err) {
      console.error(err)
    }
  }, [game.file])

  useEffect(() => {
    let active = true
    listGameSaves(game.file)
      .then((records) => {
        if (active) setSaves(records)
      })
      .catch((err) => console.error(err))
    return () => {
      active = false
    }
  }, [game.file])

  const handleLoad = async (slot: number) => {
    setLoadingSlot(slot)
    setStatusMessage(null)
    playUiSound("option_selected")

    try {
      const success = await onLoadState(slot)
      if (success) {
        playUiSound("game_start")
        setStatusMessage(`State from Slot ${slot} loaded! Resuming game...`)
        window.setTimeout(() => onResume(), 700)
      } else {
        playUiSound("error")
        setStatusMessage("Failed to restore save state. The file might be corrupted.")
      }
    } catch {
      playUiSound("error")
      setStatusMessage("An error occurred while restoring state.")
    } finally {
      setLoadingSlot(null)
    }
  }

  const handleDelete = async (slot: number) => {
    try {
      playUiSound("navigation")
      await deleteGameState(game.file, slot)
      await reloadSaves()
      setStatusMessage(`Slot ${slot} was deleted.`)
    } catch {
      playUiSound("error")
      setStatusMessage("Failed to delete slot.")
    }
  }

  const getSaveForSlot = (slot: number) => saves.find((s) => s.slot === slot)

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HardDriveDownloadIcon className="size-5 text-blue-400" />
          Load Game State
        </h3>
        <p className="text-xs text-muted-foreground">
          Restore previous gameplay from browser storage and jump right back in.
        </p>
      </div>

      {statusMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs text-blue-200">
          <CheckCircle2Icon className="size-4 shrink-0 text-blue-400" />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {SLOTS.map((slot) => {
          const existing = getSaveForSlot(slot)
          const isLoading = loadingSlot === slot

          return (
            <div
              key={slot}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-400">
                    SLOT {slot}
                  </span>
                  {existing ? (
                    <span className="text-[10px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5">
                      Ready to Load
                    </span>
                  ) : (
                    <span className="text-[10px] rounded-full bg-white/5 text-white/40 border border-white/10 px-2 py-0.5">
                      Empty
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {existing
                    ? `Saved on ${new Date(existing.timestamp).toLocaleString()} (${Math.round(
                        existing.sizeBytes / 1024,
                      )} KB)`
                    : "No state saved yet in this slot."}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {existing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(slot)}
                    className="text-white/60 hover:text-rose-400 hover:bg-rose-500/10 px-2"
                    title="Delete state"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  disabled={!existing || isLoading}
                  onClick={() => handleLoad(slot)}
                  className="gap-2 min-w-28"
                >
                  {isLoading ? (
                    <>
                      <Loader2Icon className="size-3.5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="size-3.5" />
                      <span>Load State</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
