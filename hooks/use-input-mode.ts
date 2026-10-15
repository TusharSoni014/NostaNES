"use client"

import { useSyncExternalStore } from "react"
import { getRawGamepads } from "@/lib/gamepad/gamepad-remapper"

export type InputMode = "gamepad" | "keyboard"

let currentMode: InputMode = "keyboard"
const listeners = new Set<() => void>()

export function setInputMode(mode: InputMode) {
  if (currentMode === mode) return
  currentMode = mode
  listeners.forEach((listener) => listener())
}

export function getInputMode(): InputMode {
  return currentMode
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): InputMode {
  return currentMode
}

function getServerSnapshot(): InputMode {
  return "keyboard"
}

// Global browser listeners for input device activity
if (typeof window !== "undefined") {
  // Any keyboard interaction immediately switches to keyboard mode
  window.addEventListener(
    "keydown",
    () => {
      setInputMode("keyboard")
    },
    { passive: true, capture: true },
  )

  // Mouse or touch click switches to keyboard/desktop mode
  window.addEventListener(
    "pointerdown",
    () => {
      setInputMode("keyboard")
    },
    { passive: true, capture: true },
  )

  // Gamepad connection
  window.addEventListener("gamepadconnected", () => {
    setInputMode("gamepad")
  })

  // Gamepad disconnection
  window.addEventListener("gamepaddisconnected", () => {
    const pads = getRawGamepads()
    const hasConnectedPad = Array.from(pads).some((p) => p && p.connected)
    if (!hasConnectedPad) {
      setInputMode("keyboard")
    }
  })

  // Polling loop for active gamepad button presses and axis movements
  const pollGamepadActivity = () => {
    const pads = getRawGamepads()
    for (const pad of pads) {
      if (!pad || !pad.connected) continue

      const hasButton = pad.buttons.some((btn) =>
        typeof btn === "object" ? btn.pressed : Boolean(btn),
      )
      if (hasButton) {
        setInputMode("gamepad")
        break
      }

      const hasAxis = pad.axes.some((axis) => Math.abs(axis) > 0.4)
      if (hasAxis) {
        setInputMode("gamepad")
        break
      }
    }
    requestAnimationFrame(pollGamepadActivity)
  }
  requestAnimationFrame(pollGamepadActivity)
}

/**
 * Hook to access current active input mode ("gamepad" | "keyboard").
 * Reactively updates whenever user touches either device.
 */
export function useInputMode(): InputMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
