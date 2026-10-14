"use client"

import { useEffect, useRef } from "react"
import { GamepadDispatcher } from "@/lib/gamepad/gamepad-dispatcher"
import { GAMEPAD_TIMING } from "@/lib/gamepad/gamepad-timing"
import { playUiSound } from "@/lib/ui-sounds"

export type MenuNavigationOptions<T> = {
  enabled: boolean
  items: readonly T[]
  activeItem: T
  onSelect: (item: T, index: number) => void
  onConfirm?: (item: T, index: number) => void
  onCancel?: () => void
  onNavigateLeft?: (item: T, index: number) => void
  onNavigateRight?: (item: T, index: number) => void
  onPageUp?: () => void
  onPageDown?: () => void
  loop?: boolean
  soundEnabled?: boolean
}

/**
 * Reusable, console-grade menu navigation hook for Gamepad and Keyboard.
 *
 * Keeps GamepadDispatcher and keyboard listeners alive across render cycles using
 * a stable ref to prevent repeat timer wipes (eliminating the "spinning tabs" bug).
 */
export function useMenuNavigation<T>({
  enabled,
  items,
  activeItem,
  onSelect,
  onConfirm,
  onCancel,
  onNavigateLeft,
  onNavigateRight,
  onPageUp,
  onPageDown,
  loop = false,
  soundEnabled = true,
}: MenuNavigationOptions<T>) {
  const optionsRef = useRef({
    enabled,
    items,
    activeItem,
    onSelect,
    onConfirm,
    onCancel,
    onNavigateLeft,
    onNavigateRight,
    onPageUp,
    onPageDown,
    loop,
    soundEnabled,
  })

  const lastKeyTimeRef = useRef(0)
  const keyHoldStartRef = useRef(0)

  // Keep latest callbacks and items without triggering effect recreation
  useEffect(() => {
    optionsRef.current = {
      enabled,
      items,
      activeItem,
      onSelect,
      onConfirm,
      onCancel,
      onNavigateLeft,
      onNavigateRight,
      onPageUp,
      onPageDown,
      loop,
      soundEnabled,
    }
  })

  // Directional step handler
  const stepDirection = (dir: -1 | 1) => {
    const opts = optionsRef.current
    if (!opts.enabled || opts.items.length === 0) return

    const currentIndex = opts.items.indexOf(opts.activeItem)
    let nextIndex = currentIndex + dir

    if (opts.loop) {
      nextIndex = (nextIndex + opts.items.length) % opts.items.length
    } else {
      nextIndex = Math.max(0, Math.min(opts.items.length - 1, nextIndex))
    }

    if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < opts.items.length) {
      if (opts.soundEnabled) playUiSound("navigation")
      opts.onSelect(opts.items[nextIndex], nextIndex)
    }
  }

  // Keyboard navigation with console-grade repeat pacing
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      const opts = optionsRef.current
      if (!opts.enabled) return

      const target = event.target
      const inModal =
        target instanceof HTMLElement &&
        Boolean(target.closest("[role=dialog], [role=menu]"))
      const inInput =
        target instanceof HTMLElement &&
        Boolean(target.closest("input, textarea, [data-slot=toggle-group]"))

      // If an input is focused inside the modal, allow typing; ignore outside inputs
      if (inInput && inModal) return

      const isVertical = event.key === "ArrowUp" || event.key === "ArrowDown"
      const isHorizontal = event.key === "ArrowLeft" || event.key === "ArrowRight"

      if (isVertical) {
        event.preventDefault()
        const now = performance.now()

        if (event.repeat) {
          const holdDuration = now - keyHoldStartRef.current
          const interval =
            holdDuration >= GAMEPAD_TIMING.FAST_SCROLL_HOLD_THRESHOLD_MS
              ? GAMEPAD_TIMING.TURBO_REPEAT_INTERVAL_MS
              : GAMEPAD_TIMING.STEADY_REPEAT_INTERVAL_MS

          if (now - lastKeyTimeRef.current < interval) return
        } else {
          keyHoldStartRef.current = now
        }

        lastKeyTimeRef.current = now
        stepDirection(event.key === "ArrowDown" ? 1 : -1)
        return
      }

      if (isHorizontal) {
        event.preventDefault()
        const idx = opts.items.indexOf(opts.activeItem)
        if (event.key === "ArrowLeft") opts.onNavigateLeft?.(opts.activeItem, idx)
        else opts.onNavigateRight?.(opts.activeItem, idx)
        return
      }

      if (event.key === "Enter") {
        event.preventDefault()
        event.stopPropagation()
        const idx = opts.items.indexOf(opts.activeItem)
        opts.onConfirm?.(opts.activeItem, idx)
      } else if (event.key === "Escape") {
        event.preventDefault()
        opts.onCancel?.()
      } else if (event.key === "PageUp") {
        event.preventDefault()
        opts.onPageUp?.()
      } else if (event.key === "PageDown") {
        event.preventDefault()
        opts.onPageDown?.()
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.startsWith("Arrow")) {
        keyHoldStartRef.current = 0
      }
    }

    window.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("keyup", onKeyUp, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("keyup", onKeyUp, true)
    }
  }, [enabled])

  // Native Gamepad navigation dispatcher
  // Runs continuously across active item changes without resetting repeat timers
  useEffect(() => {
    if (!enabled) return

    const dispatcher = new GamepadDispatcher((action) => {
      const opts = optionsRef.current
      if (!opts.enabled) return

      const idx = opts.items.indexOf(opts.activeItem)

      if (action === "NAV_UP") {
        stepDirection(-1)
      } else if (action === "NAV_DOWN") {
        stepDirection(1)
      } else if (action === "NAV_LEFT") {
        opts.onNavigateLeft?.(opts.activeItem, idx)
      } else if (action === "NAV_RIGHT") {
        opts.onNavigateRight?.(opts.activeItem, idx)
      } else if (action === "CONFIRM") {
        opts.onConfirm?.(opts.activeItem, idx)
      } else if (action === "CANCEL") {
        opts.onCancel?.()
      } else if (action === "PAGE_UP") {
        opts.onPageUp?.()
      } else if (action === "PAGE_DOWN") {
        opts.onPageDown?.()
      }
    })

    dispatcher.start()
    return () => dispatcher.stop()
  }, [enabled])
}
