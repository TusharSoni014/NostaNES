"use client"

import { cn } from "@/lib/utils"
import type { TouchElementPlacement } from "./types"

export type TouchSystemButtonType = "select" | "start"

export type TouchSystemButtonProps = {
  type: TouchSystemButtonType
  pos: TouchElementPlacement
  isCustomizing: boolean
  isSelected: boolean
  /** Layout-editor drag handlers. Only attached while customizing. */
  onPointerDown?: (e: React.PointerEvent) => void
  onPointerMove?: (e: React.PointerEvent) => void
  onPointerUp?: (e: React.PointerEvent) => void
  onPointerCancel?: (e: React.PointerEvent) => void
}

/**
 * Select / Start pill. During play the TouchInputEngine owns input: it finds
 * the element through `data-touch-zone` and flips `data-pressed`.
 */
export function TouchSystemButton({
  type,
  pos,
  isCustomizing,
  isSelected,
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
        transform: `translate3d(-50%, -50%, 0) scale(${pos.scale})`,
        touchAction: "none",
      }}
      className={cn(
        "absolute pointer-events-auto select-none touch-none",
        isCustomizing && "cursor-grab active:cursor-grabbing",
      )}
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

      <div
        data-touch-zone={type}
        data-pressed="false"
        role="button"
        aria-label={`${label} button`}
        onPointerDown={isCustomizing ? onPointerDown : undefined}
        onPointerMove={isCustomizing ? onPointerMove : undefined}
        onPointerUp={isCustomizing ? onPointerUp : undefined}
        onPointerCancel={isCustomizing ? onPointerCancel : undefined}
        className={cn(
          "group flex flex-col items-center gap-1 px-3 py-2 select-none touch-none [transform:translateZ(0)]",
          isCustomizing && isSelected && "ring-2 ring-blue-400 ring-offset-2 ring-offset-black rounded-lg",
          isCustomizing && !isSelected && "border border-dashed border-zinc-600/70 rounded-lg",
        )}
      >
        <div className="w-11 sm:w-13 h-4 sm:h-5 rounded-full border -rotate-12 flex items-center justify-center bg-zinc-800 border-zinc-700 group-data-[pressed=true]:bg-blue-600 group-data-[pressed=true]:border-blue-400">
          <div className="w-6 sm:w-7 h-1 rounded-full bg-zinc-600" />
        </div>
        <span className="font-mono text-[9px] sm:text-[10px] font-bold text-zinc-400 tracking-widest uppercase group-data-[pressed=true]:text-blue-300">
          {label}
        </span>
      </div>
    </div>
  )
}
