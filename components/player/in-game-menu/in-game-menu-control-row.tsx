"use client"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { getGamepadButtonName, getKeyboardKeyName } from "./controls-helpers"
import type { NesActionKey } from "@/lib/storage/controls-storage"

type ControlRowProps = {
  action: NesActionKey
  label: string
  desc: string
  val: string
  mode: "keyboard" | "gamepad"
  isListening: boolean
  isSelected: boolean
  onClick: () => void
}

export const InGameMenuControlRow = ({
  action,
  label,
  desc,
  val,
  mode,
  isListening,
  isSelected,
  onClick,
}: ControlRowProps) => {
  const displayVal = mode === "gamepad" ? getGamepadButtonName(val) : getKeyboardKeyName(val)

  return (
    <div
      role="button"
      tabIndex={0}
      data-control-row={action}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "group relative flex items-center justify-between gap-3 rounded-xl border p-3 transition-all cursor-pointer select-none",
        isSelected
          ? "border-blue-400 bg-blue-600/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-blue-400"
          : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
      )}
    >
      <div className="flex flex-col min-w-0 pr-2">
        <span
          className={cn(
            "text-xs font-semibold tracking-tight transition-colors",
            isSelected ? "text-white font-bold" : "text-white/90 group-hover:text-white",
          )}
        >
          {label}
        </span>
        <span className="text-[11px] text-white/50 truncate group-hover:text-white/70">
          {desc}
        </span>
      </div>

      <Button
        type="button"
        variant={isSelected ? "default" : "outline"}
        size="sm"
        className={cn(
          "h-8 px-3 shrink-0 font-medium text-xs transition-colors",
          isSelected
            ? "border-blue-300 bg-blue-500 text-zinc-950 font-bold shadow-sm"
            : "border-white/15 bg-white/[0.05] text-white hover:bg-white/10",
        )}
      >
        {isListening ? (
          <span className="animate-pulse text-amber-300 font-bold">Pressing...</span>
        ) : (
          <Kbd className="font-semibold">{displayVal}</Kbd>
        )}
      </Button>
    </div>
  )
}
