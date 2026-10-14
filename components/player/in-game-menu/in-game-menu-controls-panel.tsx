"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2Icon, RotateCcwIcon, SaveIcon, SlidersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { ACTION_LABELS, type NesActionKey } from "@/lib/storage/controls-storage"
import { playUiSound } from "@/lib/ui-sounds"
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
  onControlsSaved?: () => void
}

export const InGameMenuControlsPanel = ({
  isFocused = false,
  onCancel,
  onNavigateLeft,
  onControlsSaved,
}: InGameMenuControlsPanelProps) => {
  const [activeTab, setActiveTab] = useState<"keyboard" | "gamepad">("keyboard")
  const [selectedItem, setSelectedItem] = useState<PanelItem>("up")
  const listRef = useRef<HTMLDivElement>(null)

  const { config, listeningKey, setListeningKey, savedNotice, handleSave, handleReset } =
    useControlRebinding(activeTab, onControlsSaved)

  // Auto-scroll selected row into view
  useEffect(() => {
    if (!isFocused) return
    const el = listRef.current?.querySelector(`[data-control-row="${selectedItem}"]`)
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selectedItem, isFocused])

  const setTab = (tab: "keyboard" | "gamepad") => {
    setActiveTab(tab)
    playUiSound("option_selected")
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
  })

  return (
    <div className="flex flex-col gap-3.5 flex-1 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <SlidersIcon className="size-4 text-blue-400" />
            Remap Controls
          </h3>
          <p className="text-xs text-white/60">
            Customize controls for this game. Changes apply immediately upon save.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          <Button
            variant={activeTab === "keyboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("keyboard")}
            className="text-xs h-7 px-2.5 gap-1.5"
          >
            Keyboard
            <Kbd className="text-[9px] hidden sm:inline-block">LB</Kbd>
          </Button>
          <Button
            variant={activeTab === "gamepad" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("gamepad")}
            className="text-xs h-7 px-2.5 gap-1.5"
          >
            Gamepad
            <Kbd className="text-[9px] hidden sm:inline-block">RB</Kbd>
          </Button>
        </div>
      </div>

      {savedNotice ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-xs text-blue-200">
          <CheckCircle2Icon className="size-4 shrink-0 text-blue-400" />
          <span>Controls saved and applied to gameplay!</span>
        </div>
      ) : null}

      <div ref={listRef} className="flex-1 max-h-[50vh] overflow-y-auto pr-1 flex flex-col gap-3">
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

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
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
            <span>Reset Defaults</span>
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
      </div>

      <ControlRebindDialog
        actionKey={listeningKey}
        activeTab={activeTab}
        onCancel={() => setListeningKey(null)}
      />
    </div>
  )
}
