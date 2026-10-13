"use client"

import { useEffect, useRef } from "react"
import { GamepadDispatcher } from "@/lib/gamepad/gamepad-dispatcher"

type ShelfNavigationOptions = {
  count: number
  isPlaying: boolean
  controlsOpen: boolean
  move: (direction: -1 | 1) => void
  jump?: (step: number) => void
  launch: () => void
  onToggleControls?: () => void
}

const KEY_STEADY_INTERVAL_MS = 160
const KEY_TURBO_INTERVAL_MS = 70
const KEY_FAST_HOLD_THRESHOLD_MS = 2500

/**
 * Handles keyboard arrows, Enter, Gamepad (Xbox/PlayStation/generic), and mouse wheel
 * navigation for browsing the cartridge library.
 *
 * Persists dispatcher instances and event listeners across renders using options ref
 * so state and repeat timers are never wiped out by component re-renders.
 */
export const useShelfNavigation = ({
  count,
  isPlaying,
  controlsOpen,
  move,
  jump,
  launch,
  onToggleControls,
}: ShelfNavigationOptions) => {
  const optionsRef = useRef({
    count,
    isPlaying,
    controlsOpen,
    move,
    jump,
    launch,
    onToggleControls,
  })

  const lastKeyTimeRef = useRef(0)
  const keyHoldStartRef = useRef(0)

  useEffect(() => {
    optionsRef.current = {
      count,
      isPlaying,
      controlsOpen,
      move,
      jump,
      launch,
      onToggleControls,
    }
  })

  // Keyboard navigation matching console pacing
  useEffect(() => {
    if (isPlaying) return

    const onKey = (event: KeyboardEvent) => {
      const opts = optionsRef.current
      if (opts.isPlaying || opts.controlsOpen) return

      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, [data-slot=toggle-group]")
      ) {
        return
      }

      const onControl =
        target instanceof HTMLElement &&
        Boolean(target.closest("button, a, input, textarea"))

      const isNavKey =
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"

      if (isNavKey) {
        event.preventDefault()
        const now = performance.now()

        if (event.repeat) {
          const holdDuration = now - keyHoldStartRef.current
          const interval =
            holdDuration >= KEY_FAST_HOLD_THRESHOLD_MS
              ? KEY_TURBO_INTERVAL_MS
              : KEY_STEADY_INTERVAL_MS

          if (now - lastKeyTimeRef.current < interval) {
            return
          }
        } else {
          keyHoldStartRef.current = now
        }

        lastKeyTimeRef.current = now
        const dir =
          event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1
        opts.move(dir)
        return
      }

      if (event.key === "Enter" && !onControl) {
        event.preventDefault()
        opts.launch()
      } else if (event.key === "PageDown" && opts.jump) {
        event.preventDefault()
        opts.jump(10)
      } else if (event.key === "PageUp" && opts.jump) {
        event.preventDefault()
        opts.jump(-10)
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.startsWith("Arrow")) {
        keyHoldStartRef.current = 0
      }
    }

    window.addEventListener("keydown", onKey, true)
    window.addEventListener("keyup", onKeyUp, true)
    return () => {
      window.removeEventListener("keydown", onKey, true)
      window.removeEventListener("keyup", onKeyUp, true)
    }
  }, [isPlaying])

  // Native Gamepad navigation dispatcher
  // Runs continuously across list index changes without resetting timers
  useEffect(() => {
    if (isPlaying) return

    const dispatcher = new GamepadDispatcher((action) => {
      const opts = optionsRef.current
      if (opts.isPlaying || opts.count === 0) return

      // While controls modal is open, the modal handles its own scrolling, tabs, and dismiss
      if (opts.controlsOpen) return

      if (action === "NAV_UP") {
        opts.move(-1)
      } else if (action === "NAV_DOWN") {
        opts.move(1)
      } else if (action === "PAGE_UP" && opts.jump) {
        opts.jump(-10)
      } else if (action === "PAGE_DOWN" && opts.jump) {
        opts.jump(10)
      } else if (action === "CONFIRM") {
        opts.launch()
      } else if (action === "TOGGLE_CONTROLS" && opts.onToggleControls) {
        opts.onToggleControls()
      }
    })

    dispatcher.start()
    return () => dispatcher.stop()
  }, [isPlaying])

  // Mouse wheel navigation
  useEffect(() => {
    if (isPlaying) return

    let lockUntil = 0
    const onWheel = (event: WheelEvent) => {
      const opts = optionsRef.current
      if (opts.isPlaying || opts.controlsOpen) return

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY
      if (Math.abs(delta) < 8) return

      event.preventDefault()
      const now = performance.now()
      if (now < lockUntil) return
      lockUntil = now + 280
      opts.move(delta > 0 ? 1 : -1)
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    return () => window.removeEventListener("wheel", onWheel)
  }, [isPlaying])
}
