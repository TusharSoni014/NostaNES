"use client"

import { useEffect, useState } from "react"
import { getGamepadProfile } from "@/lib/gamepad/gamepad-detector"
import type { GamepadProfile } from "@/lib/gamepad/gamepad-types"

export type GamepadStatusState = {
  connected: boolean
  gamepad: Gamepad | null
  profile: GamepadProfile
}

const isValidGamepad = (p: Gamepad | null): p is Gamepad => {
  if (!p) return false
  if (!p.connected) return false
  if (!p.id || p.id.trim().length === 0) return false
  return Boolean((p.buttons && p.buttons.length > 0) || (p.axes && p.axes.length > 0))
}

export const useGamepadStatus = (): GamepadStatusState => {
  const [state, setState] = useState<GamepadStatusState>({
    connected: false,
    gamepad: null,
    profile: getGamepadProfile(null),
  })

  useEffect(() => {
    if (typeof window === "undefined" || !("getGamepads" in navigator)) return

    const updateStatus = () => {
      const pads = navigator.getGamepads?.() ?? []
      const primary = Array.from(pads).find(isValidGamepad) ?? null

      if (primary) {
        setState((prev) => {
          if (prev.connected && prev.gamepad?.id === primary.id) return prev
          return {
            connected: true,
            gamepad: primary,
            profile: getGamepadProfile(primary),
          }
        })
      } else {
        setState((prev) => {
          if (!prev.connected && prev.gamepad === null) return prev
          return {
            connected: false,
            gamepad: null,
            profile: getGamepadProfile(null),
          }
        })
      }
    }

    const onConnected = () => updateStatus()
    const onDisconnected = () => updateStatus()

    window.addEventListener("gamepadconnected", onConnected)
    window.addEventListener("gamepaddisconnected", onDisconnected)

    updateStatus()
    const interval = setInterval(updateStatus, 500)

    return () => {
      window.removeEventListener("gamepadconnected", onConnected)
      window.removeEventListener("gamepaddisconnected", onDisconnected)
      clearInterval(interval)
    }
  }, [])

  return state
}
