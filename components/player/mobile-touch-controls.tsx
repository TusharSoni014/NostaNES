"use client"

import { useEffect, useState } from "react"
import { SlidersIcon, Maximize2Icon, Minimize2Icon } from "lucide-react"
import { MobileDpad } from "./mobile-dpad"
import { useIsPortrait } from "@/hooks/use-is-mobile"
import { cn } from "@/lib/utils"

export type MobileTouchControlsProps = {
  pressDown: (action: string) => void
  pressUp: (action: string) => void
  onToggleMenu: () => void
  gamepadConnected?: boolean
  isPortrait?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

function triggerHaptic(duration = 10) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(duration)
    }
  } catch {}
}

export function MobileTouchControls({
  pressDown,
  pressUp,
  onToggleMenu,
  gamepadConnected = false,
  isPortrait: propIsPortrait,
  isFullscreen = false,
  onToggleFullscreen,
}: MobileTouchControlsProps) {
  const detectedPortrait = useIsPortrait()
  const isPortrait = propIsPortrait !== undefined ? propIsPortrait : detectedPortrait

  // If gamepad is connected, default to false; user tapping screen can override to true; gamepad input overrides to false.
  const [showOverride, setShowOverride] = useState<boolean | null>(null)
  const visible = showOverride !== null ? showOverride : !gamepadConnected

  const [activeButtons, setActiveButtons] = useState<Set<string>>(new Set())

  // Polling loop: If user presses any gamepad button or stick, hide touch controls.
  useEffect(() => {
    if (!visible || !gamepadConnected) return

    let animId = 0
    const pollGamepad = () => {
      if (typeof navigator !== "undefined" && "getGamepads" in navigator) {
        const pads = navigator.getGamepads()
        for (const pad of pads) {
          if (!pad || !pad.connected) continue
          const hasBtn = pad.buttons.some((b) => (typeof b === "object" ? b.pressed : Boolean(b)))
          const hasAxis = pad.axes.some((a) => Math.abs(a) > 0.45)
          if (hasBtn || hasAxis) {
            setShowOverride(false)
            return
          }
        }
      }
      animId = requestAnimationFrame(pollGamepad)
    }

    animId = requestAnimationFrame(pollGamepad)
    return () => cancelAnimationFrame(animId)
  }, [visible, gamepadConnected])

  // Global screen tap listener: tapping anywhere on the screen shows the controls again
  useEffect(() => {
    const handleScreenTap = (e: PointerEvent) => {
      if (!visible && (e.pointerType === "touch" || e.pointerType === "pen" || e.pointerType === "mouse")) {
        setShowOverride(true)
      }
    }

    window.addEventListener("pointerdown", handleScreenTap, { passive: true })
    return () => window.removeEventListener("pointerdown", handleScreenTap)
  }, [visible])

  // Action Button handling (A, B, Turbo A, Turbo B, Select, Start)
  const handleButtonDown = (action: string, btnKey: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {}

    pressDown(action)
    triggerHaptic(12)
    setActiveButtons((prev) => new Set(prev).add(btnKey))
  }

  const handleButtonUp = (action: string, btnKey: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}

    pressUp(action)
    setActiveButtons((prev) => {
      const next = new Set(prev)
      next.delete(btnKey)
      return next
    })
  }

  if (!visible) return null

  // Reusable Select Button
  const renderSelectButton = () => (
    <button
      type="button"
      aria-label="Select button"
      onPointerDown={(e) => handleButtonDown("select", "select", e)}
      onPointerUp={(e) => handleButtonUp("select", "select", e)}
      onPointerCancel={(e) => handleButtonUp("select", "select", e)}
      className="group flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform p-1 select-none"
    >
      <div
        className={cn(
          "w-11 sm:w-13 h-4 sm:h-5 rounded-full border transition-colors -rotate-12 flex items-center justify-center",
          activeButtons.has("select")
            ? "bg-blue-600 border-blue-400"
            : "bg-zinc-800 border-zinc-700",
        )}
      >
        <div className="w-6 sm:w-7 h-1 rounded-full bg-zinc-600" />
      </div>
      <span className="font-mono text-[9px] sm:text-[10px] font-bold text-zinc-400 tracking-widest uppercase">
        SELECT
      </span>
    </button>
  )

  // Reusable Start Button
  const renderStartButton = () => (
    <button
      type="button"
      aria-label="Start button"
      onPointerDown={(e) => handleButtonDown("start", "start", e)}
      onPointerUp={(e) => handleButtonUp("start", "start", e)}
      onPointerCancel={(e) => handleButtonUp("start", "start", e)}
      className="group flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform p-1 select-none"
    >
      <div
        className={cn(
          "w-11 sm:w-13 h-4 sm:h-5 rounded-full border transition-colors -rotate-12 flex items-center justify-center",
          activeButtons.has("start")
            ? "bg-blue-600 border-blue-400"
            : "bg-zinc-800 border-zinc-700",
        )}
      >
        <div className="w-6 sm:w-7 h-1 rounded-full bg-zinc-600" />
      </div>
      <span className="font-mono text-[9px] sm:text-[10px] font-bold text-zinc-400 tracking-widest uppercase">
        START
      </span>
    </button>
  )

  // Reusable Action Cluster (Turbo B, Turbo A, B, A) - Crisp, Non-Blurred
  // Reusable Action Cluster (Top line: Turbo A, B; Bottom line: Turbo B, A; closer spacing)
  const renderActionCluster = () => (
    <div className="relative size-34 sm:size-38 bg-zinc-950 border border-zinc-800 rounded-full p-2 select-none touch-none shadow-md">
      {/* Top Line - Left: Turbo A */}
      <button
        type="button"
        onPointerDown={(e) => handleButtonDown("x", "turboA", e)}
        onPointerUp={(e) => handleButtonUp("x", "turboA", e)}
        onPointerCancel={(e) => handleButtonUp("x", "turboA", e)}
        aria-label="Turbo A"
        className={cn(
          "absolute top-2.5 left-3 sm:top-3 sm:left-3.5 size-12 sm:size-13 rounded-full border flex flex-col items-center justify-center select-none transition-transform cursor-pointer active:scale-90",
          activeButtons.has("turboA")
            ? "bg-amber-500 border-amber-300 text-black scale-95"
            : "bg-amber-950 border-amber-600/70 text-amber-200",
        )}
      >
        <span className="leading-none text-[8px] sm:text-[9px] font-mono font-bold tracking-tighter">TURBO</span>
        <span className="leading-none text-xs sm:text-sm font-black">A</span>
      </button>

      {/* Top Line - Right: Normal B */}
      <button
        type="button"
        onPointerDown={(e) => handleButtonDown("b", "b", e)}
        onPointerUp={(e) => handleButtonUp("b", "b", e)}
        onPointerCancel={(e) => handleButtonUp("b", "b", e)}
        aria-label="Button B"
        className={cn(
          "absolute top-2.5 right-3 sm:top-3 sm:right-3.5 size-12 sm:size-13 rounded-full border flex items-center justify-center font-black text-base sm:text-lg select-none transition-transform cursor-pointer active:scale-90",
          activeButtons.has("b")
            ? "bg-rose-500 border-white text-white scale-95"
            : "bg-rose-900 border-rose-600/80 text-rose-100",
        )}
      >
        B
      </button>

      {/* Bottom Line - Left: Turbo B */}
      <button
        type="button"
        onPointerDown={(e) => handleButtonDown("y", "turboB", e)}
        onPointerUp={(e) => handleButtonUp("y", "turboB", e)}
        onPointerCancel={(e) => handleButtonUp("y", "turboB", e)}
        aria-label="Turbo B"
        className={cn(
          "absolute bottom-2.5 left-3 sm:bottom-3 sm:left-3.5 size-12 sm:size-13 rounded-full border flex flex-col items-center justify-center select-none transition-transform cursor-pointer active:scale-90",
          activeButtons.has("turboB")
            ? "bg-amber-500 border-amber-300 text-black scale-95"
            : "bg-amber-950 border-amber-600/70 text-amber-200",
        )}
      >
        <span className="leading-none text-[8px] sm:text-[9px] font-mono font-bold tracking-tighter">TURBO</span>
        <span className="leading-none text-xs sm:text-sm font-black">B</span>
      </button>

      {/* Bottom Line - Right: Normal A */}
      <button
        type="button"
        onPointerDown={(e) => handleButtonDown("a", "a", e)}
        onPointerUp={(e) => handleButtonUp("a", "a", e)}
        onPointerCancel={(e) => handleButtonUp("a", "a", e)}
        aria-label="Button A"
        className={cn(
          "absolute bottom-2.5 right-3 sm:bottom-3 sm:right-3.5 size-12 sm:size-13 rounded-full border flex items-center justify-center font-black text-base sm:text-lg select-none transition-transform cursor-pointer active:scale-90",
          activeButtons.has("a")
            ? "bg-rose-500 border-white text-white scale-95"
            : "bg-rose-900 border-rose-600/80 text-rose-100",
        )}
      >
        A
      </button>
    </div>
  )

  // --------------------------------------------------------------------------
  // PORTRAIT MODE: Controllers strictly BELOW the game screen. No intersection!
  // --------------------------------------------------------------------------
  if (isPortrait) {
    return (
      <div
        className="size-full flex flex-col justify-between p-3 pb-[max(env(safe-area-inset-bottom,12px),16px)] select-none touch-none bg-zinc-950 border-t border-zinc-800"
        style={{ touchAction: "none" }}
      >
        {/* Top bar of controllers area: Menu, Select, Start */}
        <div className="flex items-center justify-between w-full px-2 pt-1">
          <button
            type="button"
            onClick={onToggleMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold active:scale-95 transition-transform cursor-pointer"
          >
            <SlidersIcon className="size-3.5 text-blue-400" />
            <span>MENU</span>
          </button>

          {/* Centered Select & Start */}
          <div className="flex items-center gap-4">
            {renderSelectButton()}
            {renderStartButton()}
          </div>

          {/* Right action / Fullscreen toggle */}
          {onToggleFullscreen ? (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold active:scale-95 transition-transform cursor-pointer shadow-sm min-h-[32px]",
                isFullscreen
                  ? "bg-amber-950/50 border-amber-500/60 text-amber-300 hover:bg-amber-900/50"
                  : "bg-blue-950/50 border-blue-500/60 text-blue-300 hover:bg-blue-900/50",
              )}
            >
              {isFullscreen ? (
                <>
                  <Minimize2Icon className="size-3.5 text-amber-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs tracking-wider uppercase font-mono text-amber-200">Exit FS</span>
                </>
              ) : (
                <>
                  <Maximize2Icon className="size-3.5 text-blue-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs tracking-wider uppercase font-mono text-blue-200">Full</span>
                </>
              )}
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>

        {/* Lower row: D-Pad on Left, Action cluster on Right */}
        <div className="flex items-center justify-between w-full px-1 sm:px-4">
          <MobileDpad pressDown={pressDown} pressUp={pressUp} />
          {renderActionCluster()}
        </div>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // LANDSCAPE MODE: D-pad instead of joystick, non-blurred buttons on sides
  // --------------------------------------------------------------------------
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden touch-none"
      style={{ touchAction: "none" }}
    >
      {/* Top Bar: Menu & Gamepad Status Indicator */}
      <div className="pointer-events-auto absolute top-2 inset-x-0 flex items-center justify-between px-3 sm:px-6 pt-[env(safe-area-inset-top,0px)] z-40">
        <button
          type="button"
          onClick={onToggleMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold active:scale-95 transition-transform cursor-pointer shadow-md"
        >
          <SlidersIcon className="size-3.5 text-blue-400" />
          <span>MENU</span>
        </button>

        <div className="flex items-center gap-2">
          {gamepadConnected ? (
            <button
              type="button"
              onClick={() => setShowOverride(false)}
              className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-zinc-900 text-white/70 border border-zinc-700 cursor-pointer"
            >
              Gamepad Connected (Tap to hide)
            </button>
          ) : null}

          {onToggleFullscreen ? (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold active:scale-95 transition-transform cursor-pointer shadow-md min-h-[32px]",
                isFullscreen
                  ? "bg-amber-950/50 border-amber-500/60 text-amber-300 hover:bg-amber-900/50"
                  : "bg-blue-950/50 border-blue-500/60 text-blue-300 hover:bg-blue-900/50",
              )}
            >
              {isFullscreen ? (
                <>
                  <Minimize2Icon className="size-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs font-mono tracking-wider uppercase text-amber-200">Exit FS</span>
                </>
              ) : (
                <>
                  <Maximize2Icon className="size-3.5 text-blue-400 shrink-0" />
                  <span className="text-xs font-mono tracking-wider uppercase text-blue-200">Fullscreen</span>
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Bottom Left: Select Button (above) + Mobile D-Pad (below) */}
      <div className="pointer-events-auto absolute bottom-2 left-2 sm:bottom-4 sm:left-4 pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] z-40 flex flex-col items-center gap-1.5">
        {renderSelectButton()}
        <MobileDpad pressDown={pressDown} pressUp={pressUp} />
      </div>

      {/* Bottom Right: Start Button (above) + Action Buttons Cluster (below) */}
      <div className="pointer-events-auto absolute bottom-2 right-2 sm:bottom-4 sm:right-4 pb-[env(safe-area-inset-bottom,0px)] pr-[env(safe-area-inset-right,0px)] z-40 flex flex-col items-center gap-1.5">
        {renderStartButton()}
        {renderActionCluster()}
      </div>
    </div>
  )
}
