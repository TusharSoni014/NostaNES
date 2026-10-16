"use client"

import { cn } from "@/lib/utils"
import type { TouchElementPlacement } from "./types"

export type TouchSystemButtonType = "select" | "start"

export type TouchSystemButtonProps = {
  type: TouchSystemButtonType
  pos: TouchElementPlacement
  isCustomizing: boolean
  isSelected: boolean
  isPressed: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove?: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
}

export function TouchSystemButton({
  type,
  pos,
  isCustomizing,
  isSelected,
  isPressed,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: TouchSystemButtonProps) {
  const label = type === "select" ? "SELECT" : "START"

  if (pos.visible === false) return null

  return (
    <div
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `translate(-50%, -50%) scale(${pos.scale})`,
        touchAction: "none",
      }}
      className={cn(
        "absolute pointer-events-auto select-none touch-none",
        isCustomizing && "cursor-grab active:cursor-grabbing",
      )}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* Label Badge shown during customization */}
      {isCustomizing && (
        <div
          className={cn(
            "absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight pointer-events-none select-none z-20 shadow-sm",
            isSelected
              ? "bg-blue-600 text-white border border-blue-400"
              : "bg-zinc-900/90 text-zinc-300 border border-zinc-700",
          )}
        >
          {label}
        </div>
      )}

      <button
        type="button"
        aria-label={`${label} button`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        className={cn(
          "group flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all p-1 select-none",
          isCustomizing && isSelected && "ring-2 ring-blue-400 ring-offset-2 ring-offset-black rounded-lg",
          isCustomizing && !isSelected && "border border-dashed border-zinc-600/70 rounded-lg",
        )}
      >
        <div
          className={cn(
            "w-11 sm:w-13 h-4 sm:h-5 rounded-full border transition-colors -rotate-12 flex items-center justify-center",
            isPressed
              ? "bg-blue-600 border-blue-400"
              : "bg-zinc-800 border-zinc-700",
          )}
        >
          <div className="w-6 sm:w-7 h-1 rounded-full bg-zinc-600" />
        </div>
        <span className="font-mono text-[9px] sm:text-[10px] font-bold text-zinc-400 tracking-widest uppercase">
          {label}
        </span>
      </button>
    </div>
  )
}
