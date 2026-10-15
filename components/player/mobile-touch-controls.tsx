"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { SlidersIcon } from "lucide-react"
import { VirtualJoystick } from "./virtual-joystick"
import { cn } from "@/lib/utils"

export type MobileTouchControlsProps = {
  pressDown: (action: string) => void
  pressUp: (action: string) => void
  onToggleMenu: () => void
  gamepadConnected?: boolean
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
}: MobileTouchControlsProps) {
  // If gamepad is connected, default to false; user tapping screen can override to true; gamepad input overrides to false.
  const [showOverride, setShowOverride] = useState<boolean | null>(null)
  const visible = showOverride !== null ? showOverride : !gamepadConnected

  const [activeButtons, setActiveButtons] = useState<Set<string>>(new Set())

  // Polling loop: If user presses any gamepad button or stick, hide touch controls.
  useEffect(() => {
    if (!visible) return

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
  }, [visible])

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

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-30 select-none overflow-hidden touch-none"
          style={{ touchAction: "none" }}
        >
          {/* Top Bar Quick Controls: Menu & Controls visibility indicator */}
          <div className="pointer-events-auto absolute top-2 inset-x-0 flex items-center justify-between px-4 z-40">
            <button
              type="button"
              onClick={onToggleMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <SlidersIcon className="size-3.5 text-blue-400" />
              <span>MENU</span>
            </button>

            {gamepadConnected ? (
              <button
                type="button"
                onClick={() => setShowOverride(false)}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-black/50 text-white/70 border border-white/10 backdrop-blur-md cursor-pointer"
              >
                Gamepad Connected (Tap to hide)
              </button>
            ) : null}
          </div>

          {/* Bottom Left: Select Button (above) + Virtual Joystick (below) */}
          <div className="pointer-events-auto absolute bottom-2 left-2 sm:bottom-5 sm:left-5 z-40 flex flex-col items-center gap-1.5 sm:gap-2">
            {/* SELECT BUTTON above Joystick Controller */}
            <button
              type="button"
              aria-label="Select button"
              onPointerDown={(e) => handleButtonDown("select", "select", e)}
              onPointerUp={(e) => handleButtonUp("select", "select", e)}
              onPointerCancel={(e) => handleButtonUp("select", "select", e)}
              className="group flex flex-col items-center gap-0.5 cursor-pointer active:scale-95 transition-transform p-1 select-none"
            >
              <div
                className={cn(
                  "w-12 sm:w-14 h-4 sm:h-5 rounded-full border transition-all -rotate-12 flex items-center justify-center shadow-md",
                  activeButtons.has("select")
                    ? "bg-blue-500 border-blue-300 shadow-[0_0_14px_#3b82f6] scale-95"
                    : "bg-zinc-800/90 border-zinc-600/80 hover:border-zinc-500 backdrop-blur-sm",
                )}
              >
                <div className="w-6 sm:w-8 h-1 rounded-full bg-white/20" />
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] font-bold text-white/70 tracking-widest uppercase">
                SELECT
              </span>
            </button>

            {/* VIRTUAL JOYSTICK */}
            <VirtualJoystick pressDown={pressDown} pressUp={pressUp} />
          </div>

          {/* Bottom Right: Start Button (above) + Action Buttons Cluster (below) */}
          <div className="pointer-events-auto absolute bottom-2 right-2 sm:bottom-5 sm:right-5 z-40 flex flex-col items-center gap-1.5 sm:gap-2">
            {/* START BUTTON above Turbo buttons */}
            <button
              type="button"
              aria-label="Start button"
              onPointerDown={(e) => handleButtonDown("start", "start", e)}
              onPointerUp={(e) => handleButtonUp("start", "start", e)}
              onPointerCancel={(e) => handleButtonUp("start", "start", e)}
              className="group flex flex-col items-center gap-0.5 cursor-pointer active:scale-95 transition-transform p-1 select-none"
            >
              <div
                className={cn(
                  "w-12 sm:w-14 h-4 sm:h-5 rounded-full border transition-all -rotate-12 flex items-center justify-center shadow-md",
                  activeButtons.has("start")
                    ? "bg-blue-500 border-blue-300 shadow-[0_0_14px_#3b82f6] scale-95"
                    : "bg-zinc-800/90 border-zinc-600/80 hover:border-zinc-500 backdrop-blur-sm",
                )}
              >
                <div className="w-6 sm:w-8 h-1 rounded-full bg-white/20" />
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] font-bold text-white/70 tracking-widest uppercase">
                START
              </span>
            </button>

            {/* ACTION & TURBO BUTTONS CLUSTER */}
            <div className="relative size-38 sm:size-44 bg-black/45 backdrop-blur-md rounded-full border border-white/15 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
              {/* Turbo B (top-left) */}
              <button
                type="button"
                onPointerDown={(e) => handleButtonDown("y", "turboB", e)}
                onPointerUp={(e) => handleButtonUp("y", "turboB", e)}
                onPointerCancel={(e) => handleButtonUp("y", "turboB", e)}
                aria-label="Turbo B"
                className={cn(
                  "absolute top-2 left-5 sm:left-6 size-12 sm:size-14 rounded-full border-2 flex flex-col items-center justify-center font-bold text-xs select-none transition-all cursor-pointer active:scale-90",
                  activeButtons.has("turboB")
                    ? "bg-amber-500 border-amber-300 text-black shadow-[0_0_16px_#f59e0b] scale-95"
                    : "bg-amber-950/70 border-amber-500/50 text-amber-200 shadow-md",
                )}
              >
                <span className="leading-none text-[9px] sm:text-[10px] font-mono text-amber-400">TURBO</span>
                <span className="leading-none text-sm sm:text-base font-black">B</span>
              </button>

              {/* Turbo A (top-right) */}
              <button
                type="button"
                onPointerDown={(e) => handleButtonDown("x", "turboA", e)}
                onPointerUp={(e) => handleButtonUp("x", "turboA", e)}
                onPointerCancel={(e) => handleButtonUp("x", "turboA", e)}
                aria-label="Turbo A"
                className={cn(
                  "absolute top-4 sm:top-5 right-2 size-12 sm:size-14 rounded-full border-2 flex flex-col items-center justify-center font-bold text-xs select-none transition-all cursor-pointer active:scale-90",
                  activeButtons.has("turboA")
                    ? "bg-amber-500 border-amber-300 text-black shadow-[0_0_16px_#f59e0b] scale-95"
                    : "bg-amber-950/70 border-amber-500/50 text-amber-200 shadow-md",
                )}
              >
                <span className="leading-none text-[9px] sm:text-[10px] font-mono text-amber-400">TURBO</span>
                <span className="leading-none text-sm sm:text-base font-black">A</span>
              </button>

              {/* Normal B (bottom-left) */}
              <button
                type="button"
                onPointerDown={(e) => handleButtonDown("b", "b", e)}
                onPointerUp={(e) => handleButtonUp("b", "b", e)}
                onPointerCancel={(e) => handleButtonUp("b", "b", e)}
                aria-label="Button B"
                className={cn(
                  "absolute bottom-4 sm:bottom-5 left-2 size-13 sm:size-15 rounded-full border-2 flex items-center justify-center font-black text-lg sm:text-xl select-none transition-all cursor-pointer active:scale-90",
                  activeButtons.has("b")
                    ? "bg-rose-600 border-rose-300 text-white shadow-[0_0_18px_#e11d48] scale-95"
                    : "bg-rose-950/70 border-rose-500/60 text-rose-200 shadow-md",
                )}
              >
                B
              </button>

              {/* Normal A (bottom-right) */}
              <button
                type="button"
                onPointerDown={(e) => handleButtonDown("a", "a", e)}
                onPointerUp={(e) => handleButtonUp("a", "a", e)}
                onPointerCancel={(e) => handleButtonUp("a", "a", e)}
                aria-label="Button A"
                className={cn(
                  "absolute bottom-2 right-5 sm:right-6 size-13 sm:size-15 rounded-full border-2 flex items-center justify-center font-black text-lg sm:text-xl select-none transition-all cursor-pointer active:scale-90",
                  activeButtons.has("a")
                    ? "bg-rose-600 border-rose-300 text-white shadow-[0_0_18px_#e11d48] scale-95"
                    : "bg-rose-950/70 border-rose-500/60 text-rose-200 shadow-md",
                )}
              >
                A
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
