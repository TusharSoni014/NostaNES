"use client"

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

export type DpadDirection = "up" | "down" | "left" | "right"

export type MobileDpadProps = {
  className?: string
  style?: CSSProperties
}

const ARMS: ReadonlyArray<{
  arm: DpadDirection
  glyph: string
  position: string
  shape: string
  align: string
}> = [
  { arm: "up", glyph: "▲", position: "top-0", shape: "rounded-t-sm", align: "items-start justify-center pt-1.5" },
  { arm: "down", glyph: "▼", position: "bottom-0", shape: "rounded-b-sm", align: "items-end justify-center pb-1.5" },
  { arm: "left", glyph: "◀", position: "left-0", shape: "rounded-l-sm", align: "items-center justify-start pl-1.5" },
  { arm: "right", glyph: "▶", position: "right-0", shape: "rounded-r-sm", align: "items-center justify-end pr-1.5" },
]

/**
 * Visual D-pad. Input is handled by the TouchInputEngine on the controls
 * layer: it finds this element through `data-touch-zone="dpad"` and lights
 * the arms through `data-dpad-arm` / `data-active`. Nothing here is focusable,
 * so a press never moves focus away from the game canvas.
 */
export function MobileDpad({ className, style }: MobileDpadProps) {
  return (
    <div
      data-touch-zone="dpad"
      role="group"
      aria-label="NES Directional D-Pad"
      className={cn(
        "relative size-36 sm:size-40 select-none touch-none flex items-center justify-center pointer-events-auto",
        className,
      )}
      style={{ touchAction: "none", ...style }}
    >
      {/* Cross D-Pad Housing */}
      <div className="relative size-32 sm:size-36 flex items-center justify-center pointer-events-none">
        {/* Horizontal bar */}
        <div className="absolute inset-x-0 h-11 sm:h-12 bg-zinc-800 border-y border-zinc-700 rounded-sm" />
        {/* Vertical bar */}
        <div className="absolute inset-y-0 w-11 sm:w-12 bg-zinc-800 border-x border-zinc-700 rounded-sm" />

        {ARMS.map(({ arm, glyph, position, shape, align }) => (
          <div
            key={arm}
            data-dpad-arm={arm}
            data-active="false"
            className={cn("group absolute w-11 sm:w-12 h-11 sm:h-12 flex text-zinc-400 select-none", position, shape, align)}
          >
            <span className="text-xs font-bold leading-none select-none">{glyph}</span>
            <div
              aria-hidden
              className={cn(
                "absolute inset-0 flex bg-zinc-600 text-white opacity-0 group-data-[active=true]:opacity-100",
                shape,
                align,
              )}
            >
              <span className="text-xs font-bold leading-none select-none">{glyph}</span>
            </div>
          </div>
        ))}

        {/* Center Pivot Inset */}
        <div className="relative size-7 sm:size-8 rounded-full bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-inner z-10">
          <div className="size-2 rounded-full bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}
