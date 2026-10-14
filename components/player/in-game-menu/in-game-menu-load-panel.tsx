"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle2Icon, HardDriveDownloadIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteGameState, listGameSaves, type SavedStateRecord } from "@/lib/storage/save-state-storage"
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

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

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
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selectedSlot, isFocused])

  const handleLoad = async (slot: number) => {
    setLoadingSlot(slot)
    setStatusMessage(null)
    playUiSound("option_selected")
    try {
      const success = await onLoadState(slot)
      if (success) {
        playUiSound("game_start")
        setStatusMessage(`State from Slot ${slot} loaded! Resuming game...`)
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
      setStatusMessage(`Slot ${slot} was deleted.`)
    } catch {
      playUiSound("error")
      setStatusMessage("Failed to delete slot.")
    }
  }

  useMenuNavigation<number>({
    enabled: isFocused,
    items: SLOTS,
    activeItem: selectedSlot,
    onSelect: (slot) => setSelectedSlot(slot),
    onConfirm: (slot) => {
      const existing = saves.find((s) => s.slot === slot)
      if (existing) handleLoad(slot)
    },
    onCancel,
    onNavigateLeft,
  })

  const getSaveForSlot = (slot: number) => saves.find((s) => s.slot === slot)

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HardDriveDownloadIcon className="size-5 text-blue-400" />
          Load Game State
        </h3>
        <p className="text-xs text-muted-foreground">
          Restore previous gameplay from browser storage for {game.title}.
        </p>
      </div>

      {statusMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs text-blue-200">
          <CheckCircle2Icon className="size-4 shrink-0 text-blue-400" />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      <div ref={listRef} className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1.5 focus:outline-none">
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
                "flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all cursor-pointer",
                isSelected
                  ? "border-blue-400 bg-blue-600/20 shadow-[0_0_24px_rgba(59,130,246,0.3)] ring-1 ring-blue-400"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              )}
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-400">SLOT {slot}</span>
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
                    ? `Saved on ${new Date(existing.timestamp).toLocaleString()} (${Math.round(existing.sizeBytes / 1024)} KB)`
                    : "No state saved yet in this slot."}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {existing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(slot)
                    }}
                    className="text-white/60 hover:text-rose-400 hover:bg-rose-500/10 px-2"
                    title="Delete state"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  disabled={!existing || isLoading}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLoad(slot)
                  }}
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
