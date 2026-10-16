"use client"

import { useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export type DpadDirection = "up" | "down" | "left" | "right"

export type MobileDpadProps = {
  pressDown: (action: string) => void
  pressUp: (action: string) => void
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
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
  const rectRef = useRef<DOMRect | null>(null)
  const activeDirectionsRef = useRef<Set<DpadDirection>>(new Set())

  // Arm element references for direct, zero-latency DOM updates without React re-renders
  const upArmRef = useRef<HTMLDivElement>(null)
  const downArmRef = useRef<HTMLDivElement>(null)
  const leftArmRef = useRef<HTMLDivElement>(null)
  const rightArmRef = useRef<HTMLDivElement>(null)

  const updateVisuals = useCallback((dirs: Set<DpadDirection>) => {
    const isUp = dirs.has("up")
    const isDown = dirs.has("down")
    const isLeft = dirs.has("left")
    const isRight = dirs.has("right")

    if (upArmRef.current) upArmRef.current.dataset.active = isUp ? "true" : "false"
    if (downArmRef.current) downArmRef.current.dataset.active = isDown ? "true" : "false"
    if (leftArmRef.current) leftArmRef.current.dataset.active = isLeft ? "true" : "false"
    if (rightArmRef.current) rightArmRef.current.dataset.active = isRight ? "true" : "false"
  }, [])

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!centerRef.current || !rectRef.current) return
      const dx = clientX - centerRef.current.x
      const dy = clientY - centerRef.current.y

      // Compute geometric dimensions based on actual cross geometry:
      // The visual cross has arms of width/height ~44-48px on a 144-160px base (~30% thickness).
      // Center pivot disk is ~28-32px (~20% diameter).
      const baseWidth = rectRef.current.width || 144
      const deadzone = Math.max(14, baseWidth * 0.11)
      const halfArmWidth = Math.max(20, baseWidth * 0.155)

      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      const nextDirs = new Set<DpadDirection>()

      // 1. HORIZONTAL ARM (Running forward & backward)
      // When within the horizontal bar's vertical band (|dy| <= halfArmWidth),
      // the player is physically on the horizontal arm: UP and DOWN are strictly suppressed,
      // completely eliminating accidental ducking, crouching, or jumping while running.
      if (absY <= halfArmWidth) {
        if (absX >= deadzone) {
          if (dx > 0) nextDirs.add("right")
          else nextDirs.add("left")
        }
      }
      // 2. VERTICAL ARM (Climbing & ducking)
      // When within the vertical bar's horizontal band (|dx| <= halfArmWidth),
      // the player is physically on the vertical arm: LEFT and RIGHT are strictly suppressed.
      else if (absX <= halfArmWidth) {
        if (absY >= deadzone) {
          if (dy > 0) nextDirs.add("down")
          else nextDirs.add("up")
        }
      }
      // 3. DIAGONAL CORNERS (Intentional 8-way diagonal input)
      // Outside both cardinal arm bands: thumb is pushed intentionally into the diagonal corners.
      else {
        if (dx > 0) nextDirs.add("right")
        else nextDirs.add("left")

        if (dy > 0) nextDirs.add("down")
        else nextDirs.add("up")
      }

      const current = activeDirectionsRef.current

      // Check if directions changed
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

      // CRITICAL FOR ZERO STUTTER & ZERO LATENCY:
      // 1. Release inactive directions FIRST so opposite directions (e.g. left and right)
      // are NEVER registered simultaneously in the NES emulator core.
      for (const dir of current) {
        if (!nextDirs.has(dir)) {
          pressUp(dir)
        }
      }

      // 2. Press new directions SECOND
      for (const dir of nextDirs) {
        if (!current.has(dir)) {
          pressDown(dir)
        }
      }

      activeDirectionsRef.current = nextDirs
      updateVisuals(nextDirs)
    },
    [pressDown, pressUp, updateVisuals],
  )

  const resetDpad = useCallback(() => {
    for (const dir of activeDirectionsRef.current) {
      pressUp(dir)
    }
    activeDirectionsRef.current = new Set()
    updateVisuals(new Set())
  }, [pressUp, updateVisuals])

  // Native event listeners with { passive: false } for absolute 0ms input latency
  useEffect(() => {
    const el = baseRef.current
    if (!el || disabled) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      rectRef.current = rect
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)

    let lastX = 0
    let lastY = 0

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return
      e.preventDefault()
      e.stopPropagation()

      pointerIdRef.current = e.pointerId
      if (!centerRef.current) measure()

      lastX = e.clientX
      lastY = e.clientY
      updatePosition(e.clientX, e.clientY)

      // Listen on window during active drag so sliding slightly outside bounds never drops input
      window.addEventListener("pointermove", handlePointerMove, { passive: false })
      window.addEventListener("pointerup", handlePointerUp, { passive: false })
      window.addEventListener("pointercancel", handlePointerUp, { passive: false })
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return
      e.preventDefault()
      e.stopPropagation()

      // Skip micro-movements to reduce event handling pressure during 120Hz/240Hz touch sampling
      if (Math.abs(e.clientX - lastX) < 1.5 && Math.abs(e.clientY - lastY) < 1.5) return
      lastX = e.clientX
      lastY = e.clientY
      updatePosition(e.clientX, e.clientY)
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return
      e.preventDefault()
      e.stopPropagation()

      pointerIdRef.current = null

      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)

      resetDpad()
    }

    el.addEventListener("pointerdown", handlePointerDown, { passive: false })

    return () => {
      observer.disconnect()
      el.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
      resetDpad()
    }
  }, [disabled, updatePosition, resetDpad])

  return (
    <div
      ref={baseRef}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      aria-label="NES Directional D-Pad"
      role="group"
      tabIndex={-1}
      className={cn(
        "relative size-36 sm:size-40 select-none touch-none flex items-center justify-center pointer-events-auto",
        className,
      )}
      style={{ touchAction: "none", ...style }}
    >
      {/* Cross D-Pad Housing */}
      <div className="relative size-32 sm:size-36 flex items-center justify-center pointer-events-none">
        {/* Horizontal bar */}
        <div className="absolute inset-x-0 h-11 sm:h-12 bg-zinc-800 border-y border-zinc-700 rounded-sm pointer-events-none" />

        {/* Vertical bar */}
        <div className="absolute inset-y-0 w-11 sm:w-12 bg-zinc-800 border-x border-zinc-700 rounded-sm pointer-events-none" />

        {/* UP ARM */}
        <div
          ref={upArmRef}
          data-active="false"
          className="absolute top-0 w-11 sm:w-12 h-11 sm:h-12 rounded-t-sm flex items-start justify-center pt-1.5 text-zinc-400 data-[active=true]:bg-zinc-600 data-[active=true]:text-white select-none pointer-events-none"
        >
          <span className="text-xs font-bold leading-none select-none">▲</span>
        </div>

        {/* DOWN ARM */}
        <div
          ref={downArmRef}
          data-active="false"
          className="absolute bottom-0 w-11 sm:w-12 h-11 sm:h-12 rounded-b-sm flex items-end justify-center pb-1.5 text-zinc-400 data-[active=true]:bg-zinc-600 data-[active=true]:text-white select-none pointer-events-none"
        >
          <span className="text-xs font-bold leading-none select-none">▼</span>
        </div>

        {/* LEFT ARM */}
        <div
          ref={leftArmRef}
          data-active="false"
          className="absolute left-0 w-11 sm:w-12 h-11 sm:h-12 rounded-l-sm flex items-center justify-start pl-1.5 text-zinc-400 data-[active=true]:bg-zinc-600 data-[active=true]:text-white select-none pointer-events-none"
        >
          <span className="text-xs font-bold leading-none select-none">◀</span>
        </div>

        {/* RIGHT ARM */}
        <div
          ref={rightArmRef}
          data-active="false"
          className="absolute right-0 w-11 sm:w-12 h-11 sm:h-12 rounded-r-sm flex items-center justify-end pr-1.5 text-zinc-400 data-[active=true]:bg-zinc-600 data-[active=true]:text-white select-none pointer-events-none"
        >
          <span className="text-xs font-bold leading-none select-none">▶</span>
        </div>

        {/* Center Pivot Inset */}
        <div className="relative size-7 sm:size-8 rounded-full bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-inner z-10 pointer-events-none">
          <div className="size-2 rounded-full bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}
