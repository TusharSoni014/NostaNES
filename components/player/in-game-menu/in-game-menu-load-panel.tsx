"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle2Icon, HardDriveDownloadIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  deleteGameState,
  formatSlotLabel,
  listGameSaves,
  QUICK_SAVE_SLOT,
  type SavedStateRecord,
} from "@/lib/storage/save-state-storage"
import { scrollNearestIntoView } from "@/lib/motion/scroll-into-view"
import { playUiSound } from "@/lib/ui-sounds"
import type { Game } from "@/lib/games"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { cn } from "@/lib/utils"

type InGameMenuLoadPanelProps = {
  game: Game
  onLoadState: (slot: number) => Promise<boolean>
  onResume: () => void
  isFocused?: boolean
  onCancel?: () => void
  onNavigateLeft?: () => void
}

const SLOTS = [QUICK_SAVE_SLOT, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const InGameMenuLoadPanel = ({
  game,
  onLoadState,
  onResume,
  isFocused = false,
  onCancel,
  onNavigateLeft,
}: InGameMenuLoadPanelProps) => {
  const [saves, setSaves] = useState<SavedStateRecord[]>([])
  const [selectedSlot, setSelectedSlot] = useState<number>(1)
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const reloadSaves = useCallback(async () => {
    try {
      setSaves(await listGameSaves(game.file))
    } catch (err) {
      console.error(err)
    }
  }, [game.file])

  useEffect(() => {
    let active = true
    listGameSaves(game.file).then((r) => active && setSaves(r)).catch(console.error)
    return () => { active = false }
  }, [game.file])

  useEffect(() => {
    if (!isFocused) return
    const el = listRef.current?.querySelector(`[data-slot-card="${selectedSlot}"]`)
    if (el instanceof HTMLElement) return scrollNearestIntoView(el)
  }, [selectedSlot, isFocused])

  const handleLoad = async (slot: number) => {
    if (loadingSlot !== null) return
    setLoadingSlot(slot)
    setStatusMessage(null)
    playUiSound("option_selected")
    try {
      const success = await onLoadState(slot)
      if (success) {
        playUiSound("game_start")
        setStatusMessage(`State from ${formatSlotLabel(slot)} loaded! Resuming game...`)
        window.setTimeout(onResume, 700)
      } else {
        playUiSound("error")
        setStatusMessage("Failed to restore save state.")
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
      setStatusMessage(`${formatSlotLabel(slot)} was deleted.`)
    } catch {
      playUiSound("error")
      setStatusMessage("Failed to delete slot.")
    }
  }

  useMenuNavigation<number>({
    enabled: isFocused, items: SLOTS, activeItem: selectedSlot,
    onSelect: (slot) => setSelectedSlot(slot),
    onConfirm: (slot) => {
      const existing = saves.find((s) => s.slot === slot)
      if (existing) handleLoad(slot)
    },
    onCancel, onNavigateLeft,
  })

  const getSaveForSlot = (slot: number) => saves.find((s) => s.slot === slot)

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full min-w-0 gap-2.5 sm:gap-4">
      <div className="shrink-0 flex flex-col gap-0.5 sm:gap-1">
        <h3 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2">
          <HardDriveDownloadIcon className="size-4 sm:size-5 text-blue-400" />
          Load Game State
        </h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          Restore previous gameplay from browser storage for {game.title}.
        </p>
      </div>

      {statusMessage ? (
        <div className="shrink-0 flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-[11px] sm:text-xs text-blue-200">
          <CheckCircle2Icon className="size-3.5 sm:size-4 shrink-0 text-blue-400" />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      <div ref={listRef} className="flex-1 min-h-0 flex flex-col gap-2 sm:gap-3 overflow-y-auto pr-1 sm:pr-1.5 focus:outline-none">
        {SLOTS.map((slot) => {
          const existing = getSaveForSlot(slot)
          const isLoading = loadingSlot === slot
          const isSelected = isFocused && selectedSlot === slot

          return (
            <div
              key={slot}
              data-slot-card={slot}
              onClick={() => {
                setSelectedSlot(slot)
                if (existing) handleLoad(slot)
              }}
              className={cn(
                "flex items-center justify-between gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl border p-2.5 sm:p-3.5 transition-all cursor-pointer",
                isSelected
                  ? "border-blue-400 bg-blue-600/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-blue-400"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              )}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-mono text-xs sm:text-sm font-bold text-blue-400 uppercase">{formatSlotLabel(slot)}</span>
                  {existing ? (
                    <span className="text-[9px] sm:text-[10px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2">Ready</span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] rounded-full bg-white/5 text-white/40 border border-white/10 px-1.5 py-0.2">Empty</span>
                  )}
                </div>

                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {existing
                    ? `Saved ${new Date(existing.timestamp).toLocaleDateString()} (${Math.round(existing.sizeBytes / 1024)} KB)`
                    : slot === QUICK_SAVE_SLOT
                      ? "Hold LB or , for 2s in game to quick load."
                      : "No state saved yet in this slot."}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {existing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(slot)
                    }}
                    className="text-white/60 hover:text-rose-400 hover:bg-rose-500/10 h-7 sm:h-8 px-1.5 sm:px-2"
                    title="Delete state"
                  >
                    <Trash2Icon className="size-3.5 sm:size-4" />
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  disabled={!existing || isLoading}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLoad(slot)
                  }}
                  className="gap-1.5 h-7 sm:h-8 px-2.5 sm:px-3 text-xs min-w-16 sm:min-w-24"
                >
                  {isLoading ? <Loader2Icon className="size-3 animate-spin" /> : <UploadIcon className="size-3" />}
                  <span>{isLoading ? "Loading..." : "Load"}</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
