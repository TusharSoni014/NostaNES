"use client"

import { cn } from "@/lib/utils"
import type { TouchElementPlacement } from "./types"

export type TouchActionButtonType = "a" | "b" | "turboA" | "turboB"

export type TouchActionButtonProps = {
  type: TouchActionButtonType
  pos: TouchElementPlacement
  isCustomizing: boolean
  isSelected: boolean
  /** Layout-editor drag handlers. Only attached while customizing. */
  onPointerDown?: (e: React.PointerEvent) => void
  onPointerMove?: (e: React.PointerEvent) => void
  onPointerUp?: (e: React.PointerEvent) => void
  onPointerCancel?: (e: React.PointerEvent) => void
}

const LABELS: Record<TouchActionButtonType, { name: string; isTurbo: boolean; letter: string }> = {
  a: { name: "NES A", isTurbo: false, letter: "A" },
  b: { name: "NES B", isTurbo: false, letter: "B" },
  turboA: { name: "TURBO A", isTurbo: true, letter: "A" },
  turboB: { name: "TURBO B", isTurbo: true, letter: "B" },
}

/**
 * Round action button. During play the TouchInputEngine owns input: it finds
 * the element through `data-touch-zone` and flips `data-pressed`. The zone is
 * a little larger than the visible disc so a thumb can land slightly off it.
 */
export function TouchActionButton({
  type,
  pos,
  isCustomizing,
  isSelected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: TouchActionButtonProps) {
  const { name, isTurbo, letter } = LABELS[type]

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
          {name}
        </div>
      )}

      <div
        data-touch-zone={type}
        data-pressed="false"
        role="button"
        aria-label={name}
        onPointerDown={isCustomizing ? onPointerDown : undefined}
        onPointerMove={isCustomizing ? onPointerMove : undefined}
        onPointerUp={isCustomizing ? onPointerUp : undefined}
        onPointerCancel={isCustomizing ? onPointerCancel : undefined}
        className="group size-16 flex items-center justify-center select-none touch-none"
      >
        <div
          className={cn(
            "size-13 rounded-full border flex flex-col items-center justify-center select-none shadow-md [transform:translateZ(0)]",
            isCustomizing && isSelected && "ring-2 ring-blue-400 ring-offset-2 ring-offset-black scale-105",
            isCustomizing && !isSelected && "border-dashed border-zinc-500/80",
            isTurbo
              ? "bg-amber-950 border-amber-600/70 text-amber-200 group-data-[pressed=true]:bg-amber-500 group-data-[pressed=true]:border-amber-300 group-data-[pressed=true]:text-black"
              : "bg-rose-900 border-rose-600/80 text-rose-100 group-data-[pressed=true]:bg-rose-500 group-data-[pressed=true]:border-white group-data-[pressed=true]:text-white",
          )}
        >
          {isTurbo ? (
            <>
              <span className="leading-none text-[8px] font-mono font-bold tracking-tighter">TURBO</span>
              <span className="leading-none text-xs font-black">{letter}</span>
            </>
          ) : (
            <span className="leading-none text-lg font-black">{letter}</span>
          )}
        </div>
      </div>
    </div>
  )
}
