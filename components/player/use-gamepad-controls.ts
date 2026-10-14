"use client"

import { useEffect, useRef } from "react"
import {
  getCustomControls,
  type NesActionKey,
} from "@/lib/storage/controls-storage"

export const NES_TO_RETROARCH_ACTION: Record<NesActionKey, string> = {
  b: "b",
  a: "a",
  turboB: "y",
  turboA: "x",
  select: "select",
  start: "start",
  up: "up",
  down: "down",
  left: "left",
  right: "right",
}

type UseGamepadControlsOptions = {
  enabled: boolean
  pressDown: (action: string) => void
  pressUp: (action: string) => void
}

export function useGamepadControls({
  enabled,
  pressDown,
  pressUp,
}: UseGamepadControlsOptions) {
  const handlersRef = useRef({ enabled, pressDown, pressUp })

  useEffect(() => {
    handlersRef.current = { enabled, pressDown, pressUp }
  })

  useEffect(() => {
    if (!enabled) return

    let animId = 0
    const activeActions = new Set<string>()

    const poll = () => {
      const { enabled: isEnabled, pressDown: onDown, pressUp: onUp } = handlersRef.current
      if (!isEnabled) {
        for (const action of activeActions) onUp(action)
        activeActions.clear()
        return
      }

      const pads = navigator.getGamepads?.() ?? []
      const pad = Array.from(pads).find((p): p is Gamepad => Boolean(p && p.connected))

      if (!pad) {
        if (activeActions.size > 0) {
          for (const action of activeActions) onUp(action)
          activeActions.clear()
        }
        animId = requestAnimationFrame(poll)
        return
      }

      // If Select (8) and Start (9) are pressed together, ignore game controls
      // (GamepadDispatcher handles in-game menu toggle)
      const selectPressed = pad.buttons[8]?.pressed ?? false
      const startPressed = pad.buttons[9]?.pressed ?? false
      if (selectPressed && startPressed) {
        if (activeActions.size > 0) {
          for (const action of activeActions) onUp(action)
          activeActions.clear()
        }
        animId = requestAnimationFrame(poll)
        return
      }

      const currentActions = new Set<string>()
      const custom = getCustomControls().gamepad
      const claimed = new Set<string>()

      const activate = (code: string) => {
        if (!code || claimed.has(code)) return
        claimed.add(code)
        for (const [actionKey, physicalCode] of Object.entries(custom)) {
          if (physicalCode !== code) continue
          const raAction = NES_TO_RETROARCH_ACTION[actionKey as NesActionKey]
          if (raAction) currentActions.add(raAction)
          return
        }
      }

      for (const physicalCode of Object.values(custom)) {
        if (!physicalCode) continue
        const btnIdx = parseInt(physicalCode, 10)
        if (!isNaN(btnIdx) && pad.buttons[btnIdx]?.pressed) activate(physicalCode)
      }

      // Stick axes share the D-pad codes the rebind screen writes (12–15).
      const axisX = pad.axes[0] ?? 0
      const axisY = pad.axes[1] ?? 0
      if (axisY < -0.55) activate("12")
      else if (axisY > 0.55) activate("13")
      if (axisX < -0.55) activate("14")
      else if (axisX > 0.55) activate("15")

      // 3. Dispatch pressDown for newly activated actions
      for (const action of currentActions) {
        if (!activeActions.has(action)) {
          activeActions.add(action)
          onDown(action)
        }
      }

      // 4. Dispatch pressUp for released actions
      for (const action of activeActions) {
        if (!currentActions.has(action)) {
          activeActions.delete(action)
          onUp(action)
        }
      }

      animId = requestAnimationFrame(poll)
    }

    animId = requestAnimationFrame(poll)

    return () => {
      cancelAnimationFrame(animId)
      const { pressUp: onUp } = handlersRef.current
      for (const action of activeActions) onUp(action)
      activeActions.clear()
    }
  }, [enabled])
}
