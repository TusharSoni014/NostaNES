"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2Icon, DownloadIcon, HardDriveIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  listGameSaves,
  type SavedStateRecord,
} from "@/lib/storage/save-state-storage"
import { playUiSound } from "@/lib/ui-sounds"
import type { Game } from "@/lib/games"

type InGameMenuSavePanelProps = {
  game: Game
  onSaveState: (slot: number) => Promise<boolean>
}

const SLOTS = [1, 2, 3]

export const InGameMenuSavePanel = ({
  game,
  onSaveState,
}: InGameMenuSavePanelProps) => {
  const [saves, setSaves] = useState<SavedStateRecord[]>([])
  const [savingSlot, setSavingSlot] = useState<number | null>(null)
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

  const handleSave = async (slot: number) => {
    setSavingSlot(slot)
    setStatusMessage(null)
    playUiSound("option_selected")

    try {
      const success = await onSaveState(slot)
      if (success) {
        await reloadSaves()
        playUiSound("game_start")
        setStatusMessage(`State successfully saved to Slot ${slot}!`)
      } else {
        playUiSound("error")
        setStatusMessage("Failed to capture save state. Please try again.")
      }
    } catch {
      playUiSound("error")
      setStatusMessage("An unexpected error occurred while saving.")
    } finally {
      setSavingSlot(null)
    }
  }

  const getSaveForSlot = (slot: number) => saves.find((s) => s.slot === slot)

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HardDriveIcon className="size-5 text-blue-400" />
          Save Game State
        </h3>
        <p className="text-xs text-muted-foreground">
          Snapshot your current gameplay and store it securely in your browser storage.
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
          const isSaving = savingSlot === slot

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
                    <span className="text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5">
                      Occupied
                    </span>
                  ) : (
                    <span className="text-[10px] rounded-full bg-white/5 text-white/50 border border-white/10 px-2 py-0.5">
                      Empty Slot
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {existing
                    ? `Saved on ${new Date(existing.timestamp).toLocaleString()} (${Math.round(
                        existing.sizeBytes / 1024,
                      )} KB)`
                    : "No saved state in this slot."}
                </p>
              </div>

              <Button
                variant={existing ? "outline" : "default"}
                size="sm"
                disabled={isSaving}
                onClick={() => handleSave(slot)}
                className="shrink-0 gap-2 min-w-28"
              >
                {isSaving ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <DownloadIcon className="size-3.5" />
                    <span>{existing ? "Overwrite" : "Save State"}</span>
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
