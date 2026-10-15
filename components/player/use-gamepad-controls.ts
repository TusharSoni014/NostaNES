"use client"

import { useEffect, useRef } from "react"
import {
  getControlsProfile,
  type CustomGamepadMap,
  type NesActionKey,
  type PlayerSlot,
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

type PressFn = (action: string, player?: number) => void

type UseGamepadControlsOptions = {
  enabled: boolean
  pressDown: PressFn
  pressUp: PressFn
}

function connectedGamepads(): Gamepad[] {
  return Array.from(navigator.getGamepads?.() ?? []).filter(
    (pad): pad is Gamepad => Boolean(pad?.connected),
  )
}

function actionsFromPad(pad: Gamepad, custom: CustomGamepadMap): Set<string> {
  const currentActions = new Set<string>()
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

  return currentActions
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
    const active: Record<PlayerSlot, Set<string>> = { 1: new Set(), 2: new Set() }

    const release = (player: PlayerSlot, onUp: PressFn) => {
      for (const action of active[player]) onUp(action, player)
      active[player].clear()
    }

    const sync = (player: PlayerSlot, current: Set<string>, onDown: PressFn, onUp: PressFn) => {
      for (const action of current) {
        if (!active[player].has(action)) {
          active[player].add(action)
          onDown(action, player)
        }
      }
      for (const action of active[player]) {
        if (!current.has(action)) {
          active[player].delete(action)
          onUp(action, player)
        }
      }
    }

    const poll = () => {
      const { enabled: isEnabled, pressDown: onDown, pressUp: onUp } = handlersRef.current
      if (!isEnabled) {
        release(1, onUp)
        release(2, onUp)
        return
      }

      const pads = connectedGamepads()
      const profile = getControlsProfile()
      const assignments: Array<{ pad: Gamepad; player: PlayerSlot; map: CustomGamepadMap }> = []
      if (pads[0]) assignments.push({ pad: pads[0], player: 1, map: profile.player1.gamepad })
      if (pads[1]) assignments.push({ pad: pads[1], player: 2, map: profile.player2.gamepad })

      const present = new Set(assignments.map((entry) => entry.player))
      for (const player of [1, 2] as const) {
        if (!present.has(player)) release(player, onUp)
      }

      for (const { pad, player, map } of assignments) {
        // Select+Start on the first controller opens the menu. The second
        // controller's Select and Start stay in the game.
        const selectPressed = pad.buttons[8]?.pressed ?? false
        const startPressed = pad.buttons[9]?.pressed ?? false
        if (player === 1 && selectPressed && startPressed) {
          release(1, onUp)
          continue
        }
        sync(player, actionsFromPad(pad, map), onDown, onUp)
      }

      animId = requestAnimationFrame(poll)
    }

    animId = requestAnimationFrame(poll)

    return () => {
      cancelAnimationFrame(animId)
      const { pressUp: onUp } = handlersRef.current
      release(1, onUp)
      release(2, onUp)
    }
  }, [enabled])
}
