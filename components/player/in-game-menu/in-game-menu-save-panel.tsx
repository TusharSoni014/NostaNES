"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle2Icon, DownloadIcon, HardDriveIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  listGameSaves,
  type SavedStateRecord,
} from "@/lib/storage/save-state-storage"
import { scrollNearestIntoView } from "@/lib/motion/scroll-into-view"
import { playUiSound } from "@/lib/ui-sounds"
import type { Game } from "@/lib/games"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { cn } from "@/lib/utils"

type InGameMenuSavePanelProps = {
  game: Game
  onSaveState: (slot: number) => Promise<boolean>
  isFocused?: boolean
  onCancel?: () => void
  onNavigateLeft?: () => void
}

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const InGameMenuSavePanel = ({
  game,
  onSaveState,
  isFocused = false,
  onCancel,
  onNavigateLeft,
}: InGameMenuSavePanelProps) => {
  const [saves, setSaves] = useState<SavedStateRecord[]>([])
  const [selectedSlot, setSelectedSlot] = useState<number>(1)
  const [savingSlot, setSavingSlot] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isFocused) return
    const el = listRef.current?.querySelector(`[data-slot-card="${selectedSlot}"]`)
    if (el instanceof HTMLElement) return scrollNearestIntoView(el)
  }, [selectedSlot, isFocused])

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

  useMenuNavigation<number>({
    enabled: isFocused,
    items: SLOTS,
    activeItem: selectedSlot,
    onSelect: (slot) => setSelectedSlot(slot),
    onConfirm: (slot) => handleSave(slot),
    onCancel,
    onNavigateLeft,
  })

  const getSaveForSlot = (slot: number) => saves.find((s) => s.slot === slot)

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full min-w-0 gap-4">
      <div className="shrink-0 flex flex-col gap-1">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HardDriveIcon className="size-5 text-blue-400" />
          Save Game State
        </h3>
        <p className="text-xs text-muted-foreground">
          Snapshot your current gameplay and store it securely in your browser storage.
        </p>
      </div>

      {statusMessage ? (
        <div className="shrink-0 flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs text-blue-200">
          <CheckCircle2Icon className="size-4 shrink-0 text-blue-400" />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      <div ref={listRef} className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-1.5 focus:outline-none">
        {SLOTS.map((slot) => {
          const existing = getSaveForSlot(slot)
          const isSaving = savingSlot === slot
          const isSelected = isFocused && selectedSlot === slot

          return (
            <div
              key={slot}
              data-slot-card={slot}
              onClick={() => {
                setSelectedSlot(slot)
                handleSave(slot)
              }}
              className={cn(
                "flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all cursor-pointer",
                isSelected
                  ? "border-blue-400 bg-blue-600/20 shadow-[0_0_24px_rgba(59,130,246,0.3)] ring-1 ring-blue-400"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              )}
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
