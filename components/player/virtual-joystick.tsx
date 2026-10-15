"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export type Direction = "up" | "down" | "left" | "right"

export type VirtualJoystickProps = {
  pressDown: (action: string) => void
  pressUp: (action: string) => void
  className?: string
}

const MAX_RADIUS = 38
const DEADZONE = 10

function triggerHaptic(duration = 10) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(duration)
    }
  } catch {}
}

export function VirtualJoystick({
  pressDown,
  pressUp,
  className,
}: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null)
  const pointerIdRef = useRef<number | null>(null)
  const centerRef = useRef<{ x: number; y: number } | null>(null)
  const activeDirectionsRef = useRef<Set<Direction>>(new Set())

  const [activeDirections, setActiveDirections] = useState<Set<Direction>>(new Set())
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0, isDragging: false })

  const updatePosition = useCallback(
    (dx: number, dy: number) => {
      const dist = Math.hypot(dx, dy)
      const clampedDist = Math.min(dist, MAX_RADIUS)
      const knobX = dist > 0 ? (dx / dist) * clampedDist : 0
      const knobY = dist > 0 ? (dy / dist) * clampedDist : 0

      setKnobPos({ x: knobX, y: knobY, isDragging: true })

      const nextDirs = new Set<Direction>()
      if (dist >= DEADZONE) {
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI
        // 8-way directional sectors
        if (angle >= -67.5 && angle <= 67.5) nextDirs.add("right")
        if (angle >= 112.5 || angle <= -112.5) nextDirs.add("left")
        if (angle >= -157.5 && angle <= -22.5) nextDirs.add("up")
        if (angle >= 22.5 && angle <= 157.5) nextDirs.add("down")
      }

      const current = activeDirectionsRef.current

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

  const resetJoystick = useCallback(() => {
    for (const dir of activeDirectionsRef.current) {
      pressUp(dir)
    }
    activeDirectionsRef.current = new Set()
    setActiveDirections(new Set())
    setKnobPos({ x: 0, y: 0, isDragging: false })
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

    updatePosition(e.clientX - cx, e.clientY - cy)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId || !centerRef.current) return
    e.preventDefault()
    e.stopPropagation()
    updatePosition(e.clientX - centerRef.current.x, e.clientY - centerRef.current.y)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return
    e.preventDefault()
    e.stopPropagation()
    pointerIdRef.current = null
    centerRef.current = null

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    resetJoystick()
  }

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Directional Joystick Controller"
      role="group"
      tabIndex={-1}
      className={cn(
        "relative size-36 sm:size-40 rounded-full bg-black/50 backdrop-blur-md border border-white/20 p-2 shadow-[0_12px_36px_rgba(0,0,0,0.7)] ring-1 ring-white/10 select-none touch-none",
        className,
      )}
      style={{ touchAction: "none" }}
    >
      {/* Concentric subtle guide rings */}
      <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute inset-7 rounded-full border border-white/5 pointer-events-none" />

      {/* Up Indicator */}
      <div
        className={cn(
          "absolute top-2.5 left-1/2 -translate-x-1/2 text-[11px] font-bold transition-all select-none pointer-events-none",
          activeDirections.has("up")
            ? "text-blue-400 drop-shadow-[0_0_8px_#3b82f6] scale-110"
            : "text-white/30",
        )}
      >
        ▲
      </div>

      {/* Down Indicator */}
      <div
        className={cn(
          "absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[11px] font-bold transition-all select-none pointer-events-none",
          activeDirections.has("down")
            ? "text-blue-400 drop-shadow-[0_0_8px_#3b82f6] scale-110"
            : "text-white/30",
        )}
      >
        ▼
      </div>

      {/* Left Indicator */}
      <div
        className={cn(
          "absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold transition-all select-none pointer-events-none",
          activeDirections.has("left")
            ? "text-blue-400 drop-shadow-[0_0_8px_#3b82f6] scale-110"
            : "text-white/30",
        )}
      >
        ◀
      </div>

      {/* Right Indicator */}
      <div
        className={cn(
          "absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold transition-all select-none pointer-events-none",
          activeDirections.has("right")
            ? "text-blue-400 drop-shadow-[0_0_8px_#3b82f6] scale-110"
            : "text-white/30",
        )}
      >
        ▶
      </div>

      {/* Analog Thumbstick Knob */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 size-16 sm:size-17 -mt-8 -ml-8 sm:-mt-[34px] sm:-ml-[34px] rounded-full pointer-events-none flex items-center justify-center select-none shadow-[0_4px_16px_rgba(0,0,0,0.8)] border-2 border-white/30 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900",
          !knobPos.isDragging && "transition-transform duration-100 ease-out",
        )}
        style={{
          transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
        }}
      >
        {/* Inner concave thumb dish */}
        <div className="size-11 sm:size-12 rounded-full border border-zinc-700 bg-zinc-950/80 shadow-inner flex items-center justify-center">
          {/* Center tactile dot */}
          <div
            className={cn(
              "size-3 rounded-full transition-colors",
              activeDirections.size > 0
                ? "bg-blue-400 shadow-[0_0_10px_#3b82f6]"
                : "bg-zinc-600",
            )}
          />
        </div>
      </div>
    </div>
  )
}
