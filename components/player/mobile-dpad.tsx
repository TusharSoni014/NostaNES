"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export type DpadDirection = "up" | "down" | "left" | "right"

export type MobileDpadProps = {
  pressDown: (action: string) => void
  pressUp: (action: string) => void
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
}

const DEADZONE = 10

function triggerHaptic(duration = 10) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(duration)
    }
  } catch {}
}

export function MobileDpad({
  pressDown,
  pressUp,
  className,
  style,
  disabled = false,
}: MobileDpadProps) {
  const baseRef = useRef<HTMLDivElement>(null)
  const pointerIdRef = useRef<number | null>(null)
  const centerRef = useRef<{ x: number; y: number } | null>(null)
  const activeDirectionsRef = useRef<Set<DpadDirection>>(new Set())

  const [activeDirections, setActiveDirections] = useState<Set<DpadDirection>>(new Set())

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!centerRef.current) return
      const dx = clientX - centerRef.current.x
      const dy = clientY - centerRef.current.y
      const dist = Math.hypot(dx, dy)

      const nextDirs = new Set<DpadDirection>()
      if (dist >= DEADZONE) {
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI
        // 8-way directional sectors matching authentic NES diagonals
        if (angle >= -67.5 && angle <= 67.5) nextDirs.add("right")
        if (angle >= 112.5 || angle <= -112.5) nextDirs.add("left")
        if (angle >= -157.5 && angle <= -22.5) nextDirs.add("up")
        if (angle >= 22.5 && angle <= 157.5) nextDirs.add("down")
      }

      const current = activeDirectionsRef.current

      // Check if directions changed to prevent wasteful re-renders on continuous drag
      let hasChanges = current.size !== nextDirs.size
      if (!hasChanges) {
        for (const dir of nextDirs) {
          if (!current.has(dir)) {
            hasChanges = true
            break
          }
        }
      }

      if (!hasChanges) return

      // Trigger newly pressed directions
      for (const dir of nextDirs) {
        if (!current.has(dir)) {
          pressDown(dir)
          triggerHaptic(8)
        }
      }

      // Release inactive directions
      for (const dir of current) {
        if (!nextDirs.has(dir)) {
          pressUp(dir)
        }
      }

      activeDirectionsRef.current = nextDirs
      setActiveDirections(nextDirs)
    },
    [pressDown, pressUp],
  )

  const resetDpad = useCallback(() => {
    for (const dir of activeDirectionsRef.current) {
      pressUp(dir)
    }
    activeDirectionsRef.current = new Set()
    setActiveDirections(new Set())
  }, [pressUp])

  // Clean up if component unmounts while actively pressed
  useEffect(() => {
    return () => {
      for (const dir of activeDirectionsRef.current) {
        pressUp(dir)
      }
    }
  }, [pressUp])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    pointerIdRef.current = e.pointerId

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}

    const rect = e.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    centerRef.current = { x: cx, y: cy }

    updatePosition(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || pointerIdRef.current !== e.pointerId || !centerRef.current) return
    e.preventDefault()
    e.stopPropagation()
    updatePosition(e.clientX, e.clientY)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || pointerIdRef.current !== e.pointerId) return
    e.preventDefault()
    e.stopPropagation()
    pointerIdRef.current = null
    centerRef.current = null

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    resetDpad()
  }

  const isUp = activeDirections.has("up")
  const isDown = activeDirections.has("down")
  const isLeft = activeDirections.has("left")
  const isRight = activeDirections.has("right")

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      aria-label="NES Directional D-Pad"
      role="group"
      tabIndex={-1}
      className={cn(
        "relative size-36 sm:size-40 select-none touch-none flex items-center justify-center",
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

        {/* UP ARM */}
        <div
          className={cn(
            "absolute top-0 w-11 sm:w-12 h-11 sm:h-12 rounded-t-sm flex items-start justify-center pt-1.5 transition-colors",
            isUp ? "bg-zinc-600 text-white" : "text-zinc-400",
          )}
        >
          <span className="text-xs font-bold leading-none select-none">▲</span>
        </div>

        {/* DOWN ARM */}
        <div
          className={cn(
            "absolute bottom-0 w-11 sm:w-12 h-11 sm:h-12 rounded-b-sm flex items-end justify-center pb-1.5 transition-colors",
            isDown ? "bg-zinc-600 text-white" : "text-zinc-400",
          )}
        >
          <span className="text-xs font-bold leading-none select-none">▼</span>
        </div>

        {/* LEFT ARM */}
        <div
          className={cn(
            "absolute left-0 w-11 sm:w-12 h-11 sm:h-12 rounded-l-sm flex items-center justify-start pl-1.5 transition-colors",
            isLeft ? "bg-zinc-600 text-white" : "text-zinc-400",
          )}
        >
          <span className="text-xs font-bold leading-none select-none">◀</span>
        </div>

        {/* RIGHT ARM */}
        <div
          className={cn(
            "absolute right-0 w-11 sm:w-12 h-11 sm:h-12 rounded-r-sm flex items-center justify-end pr-1.5 transition-colors",
            isRight ? "bg-zinc-600 text-white" : "text-zinc-400",
          )}
        >
          <span className="text-xs font-bold leading-none select-none">▶</span>
        </div>

        {/* Center Pivot Inset */}
        <div className="relative size-7 sm:size-8 rounded-full bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-inner z-10">
          <div className="size-2 rounded-full bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}
