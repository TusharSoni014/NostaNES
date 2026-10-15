"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2Icon, RotateCcwIcon, SaveIcon, SlidersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GamepadKey, Kbd } from "@/components/ui/kbd"
import { ACTION_LABELS, type NesActionKey, type PlayerSlot } from "@/lib/storage/controls-storage"
import { scrollNearestIntoView } from "@/lib/motion/scroll-into-view"
import { playUiSound } from "@/lib/ui-sounds"
import { useInputMode } from "@/hooks/use-input-mode"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { InGameMenuControlRow } from "./in-game-menu-control-row"
import { ControlRebindDialog } from "./control-rebind-dialog"
import { ACTION_CATEGORIES } from "./controls-helpers"
import { useControlRebinding } from "./use-control-rebinding"
import { cn } from "@/lib/utils"

const ACTION_KEYS: NesActionKey[] = [
  "up", "down", "left", "right",
  "b", "a", "turboB", "turboA",
  "select", "start",
]

const PANEL_ITEMS = [...ACTION_KEYS, "reset_btn", "save_btn"] as const
type PanelItem = (typeof PANEL_ITEMS)[number]

type InGameMenuControlsPanelProps = {
  isFocused?: boolean
  onCancel?: () => void
  onNavigateLeft?: () => void
}

export const InGameMenuControlsPanel = ({
  isFocused = false,
  onCancel,
  onNavigateLeft,
}: InGameMenuControlsPanelProps) => {
  const inputMode = useInputMode()
  const [player, setPlayerSlot] = useState<PlayerSlot>(1)
  const [activeTab, setActiveTab] = useState<"keyboard" | "gamepad">(inputMode)
  const [selectedItem, setSelectedItem] = useState<PanelItem>("up")
  const listRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerSlot>(1)
  playerRef.current = player

  const { config, listeningKey, setListeningKey, savedNotice, handleSave, handleReset } =
    useControlRebinding(player, activeTab)

  const setPlayer = (next: PlayerSlot) => {
    setListeningKey(null)
    if (playerRef.current === next) return
    playerRef.current = next
    setPlayerSlot(next)
    playUiSound("navigation")
  }

  // Auto-scroll selected row into view
  useEffect(() => {
    if (!isFocused) return
    const el = listRef.current?.querySelector(`[data-control-row="${selectedItem}"]`)
    if (el instanceof HTMLElement) return scrollNearestIntoView(el)
  }, [selectedItem, isFocused])

  const setTab = (tab: "keyboard" | "gamepad") => {
    setActiveTab(tab)
    playUiSound("navigation")
  }

  useMenuNavigation<PanelItem>({
    enabled: isFocused && !listeningKey,
    items: PANEL_ITEMS,
    activeItem: selectedItem,
    onSelect: (item) => setSelectedItem(item),
    onConfirm: (item) => {
      if (item === "reset_btn") handleReset()
      else if (item === "save_btn") handleSave()
      else setListeningKey(item as NesActionKey)
    },
    onCancel: () => {
      if (listeningKey) setListeningKey(null)
      else onCancel?.()
    },
    onNavigateLeft: () => {
      if (!listeningKey) onNavigateLeft?.()
    },
    onPageUp: () => setTab("keyboard"),
    onPageDown: () => setTab("gamepad"),
    onAux: () => setPlayer(playerRef.current === 1 ? 2 : 1),
  })

  useEffect(() => {
    if (!isFocused || listeningKey) return

    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.code.startsWith("Numpad")) return
      if (event.key !== "[" && event.key !== "]") return
      event.preventDefault()
      event.stopPropagation()
      setPlayer(event.key === "[" ? 1 : 2)
    }

    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [isFocused, listeningKey])

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full min-w-0 gap-3.5">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <SlidersIcon className="size-4 text-blue-400" />
            Remap Controls
          </h3>
          <p className="text-xs text-white/60">
            {player === 1
              ? "Arrows and the first controller. Only Player 1 moves menus."
              : "Number pad and the second controller. Player 2 does not move menus."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            <Button
              variant={player === 1 ? "default" : "ghost"}
              size="sm"
              onClick={() => setPlayer(1)}
              className="text-xs h-7 px-2.5 gap-1.5"
            >
              Player 1
              {inputMode === "gamepad" ? null : <Kbd size="sm">[</Kbd>}
            </Button>
            <Button
              variant={player === 2 ? "default" : "ghost"}
              size="sm"
              onClick={() => setPlayer(2)}
              className="text-xs h-7 px-2.5 gap-1.5"
            >
              Player 2
              {inputMode === "gamepad" ? (
                <GamepadKey button="Y" size="sm" className="hidden sm:inline-flex" />
              ) : (
                <Kbd size="sm">]</Kbd>
              )}
            </Button>
          </div>

        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          <Button
            variant={activeTab === "keyboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("keyboard")}
            className="text-xs h-7 px-2.5 gap-1.5"
          >
            Keyboard
            {inputMode === "gamepad" ? (
              <GamepadKey button="LB" size="sm" className="hidden sm:inline-flex" />
            ) : null}
          </Button>
          <Button
            variant={activeTab === "gamepad" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("gamepad")}
            className="text-xs h-7 px-2.5 gap-1.5"
          >
            Gamepad
            {inputMode === "gamepad" ? (
              <GamepadKey button="RB" size="sm" className="hidden sm:inline-flex" />
            ) : null}
          </Button>
        </div>
        </div>
      </div>

      {savedNotice ? (
        <div className="shrink-0 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">
          <CheckCircle2Icon className="size-4 shrink-0 text-emerald-400" />
          <span>Controls saved & applied to active game profile!</span>
        </div>
      ) : null}

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3 focus:outline-none">
        {ACTION_CATEGORIES.map((cat) => (
          <div key={cat.name} className="flex flex-col gap-1.5">
            <h4 className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider px-1">
              {cat.name}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cat.keys.map((action) => {
                const { label, desc } = ACTION_LABELS[action]
                const val = activeTab === "keyboard" ? config.keyboard[action] : config.gamepad[action]
                const isSelected = isFocused && selectedItem === action

                return (
                  <InGameMenuControlRow
                    key={action}
                    action={action}
                    label={label}
                    desc={desc}
                    val={val}
                    mode={activeTab}
                    isListening={listeningKey === action}
                    isSelected={isSelected}
                    onClick={() => setListeningKey(action)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <Button
          variant="ghost"
          size="sm"
          data-control-row="reset_btn"
          onClick={handleReset}
          className={cn(
            "gap-2 text-xs",
            isFocused && selectedItem === "reset_btn" && "ring-2 ring-blue-400 bg-white/10",
          )}
        >
          <RotateCcwIcon className="size-3.5" />
          <span>Reset Player {player}</span>
        </Button>

        <Button
          size="sm"
          data-control-row="save_btn"
          onClick={handleSave}
          className={cn(
            "gap-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md",
            isFocused && selectedItem === "save_btn" && "ring-2 ring-blue-300 ring-offset-2 ring-offset-zinc-950",
          )}
        >
          <SaveIcon className="size-3.5" />
          <span>Save & Apply Controls</span>
        </Button>
      </div>

      <ControlRebindDialog
        actionKey={listeningKey}
        activeTab={activeTab}
        player={player}
        onCancel={() => setListeningKey(null)}
      />
    </div>
  )
}
