"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2Icon, RotateCcwIcon, SaveIcon, SlidersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ACTION_LABELS, type NesActionKey } from "@/lib/storage/controls-storage"
import { playUiSound } from "@/lib/ui-sounds"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { InGameMenuControlRow } from "./in-game-menu-control-row"
import { useControlRebinding } from "./use-control-rebinding"
import { cn } from "@/lib/utils"

const ACTION_KEYS: NesActionKey[] = [
  "up",
  "down",
  "left",
  "right",
  "b",
  "a",
  "turboB",
  "turboA",
  "select",
  "start",
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
  const [activeTab, setActiveTab] = useState<"keyboard" | "gamepad">("keyboard")
  const [selectedItem, setSelectedItem] = useState<PanelItem>("up")
  const listRef = useRef<HTMLDivElement>(null)

  const { config, listeningKey, setListeningKey, savedNotice, handleSave, handleReset } =
    useControlRebinding(activeTab)

  // Auto-scroll to selected control
  useEffect(() => {
    if (!isFocused) return
    const el = listRef.current?.querySelector(`[data-control-row="${selectedItem}"]`)
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selectedItem, isFocused])

  const toggleTab = () => {
    setActiveTab((prev) => (prev === "keyboard" ? "gamepad" : "keyboard"))
    playUiSound("option_selected")
  }

  // Full gamepad navigation inside the controls panel
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
    onNavigateRight: toggleTab,
    onPageUp: toggleTab,
    onPageDown: toggleTab,
  })

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <SlidersIcon className="size-5 text-blue-400" />
            Customize Controls
          </h3>
          <p className="text-xs text-muted-foreground">
            Remap controls for this game and save them to browser storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "keyboard" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("keyboard")}
          >
            Keyboard
          </Button>
          <Button
            variant={activeTab === "gamepad" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("gamepad")}
          >
            Gamepad
          </Button>
        </div>
      </div>

      {savedNotice ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs text-blue-200">
          <CheckCircle2Icon className="size-4 shrink-0 text-blue-400" />
          <span>Controls saved to browser storage!</span>
        </div>
      ) : null}

      <div ref={listRef} className="flex-1 max-h-[52vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ACTION_KEYS.map((action) => {
            const { label, desc } = ACTION_LABELS[action]
            const isListening = listeningKey === action
            const val = activeTab === "keyboard" ? config.keyboard[action] : config.gamepad[action]
            const isSelected = isFocused && selectedItem === action

            return (
              <InGameMenuControlRow
                key={action}
                action={action}
                label={label}
                desc={desc}
                val={val}
                isListening={isListening}
                isSelected={isSelected}
                onClick={() => setListeningKey(isListening ? null : action)}
              />
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <Button
            variant={isFocused && selectedItem === "reset_btn" ? "default" : "ghost"}
            size="sm"
            data-control-row="reset_btn"
            onClick={handleReset}
            className={cn(
              "gap-2",
              isFocused && selectedItem === "reset_btn" && "ring-2 ring-blue-400",
            )}
          >
            <RotateCcwIcon className="size-3.5" />
            <span>Reset Defaults</span>
          </Button>

          <Button
            size="sm"
            data-control-row="save_btn"
            onClick={handleSave}
            className={cn(
              "gap-2",
              isFocused && selectedItem === "save_btn" && "ring-2 ring-blue-400 bg-blue-600",
            )}
          >
            <SaveIcon className="size-3.5" />
            <span>Save to Storage</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
