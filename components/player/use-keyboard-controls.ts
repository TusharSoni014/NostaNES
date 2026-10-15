"use client"

import { useEffect, useRef } from "react"
import {
  DEFAULT_KEYBOARD_CONTROLS,
  DEFAULT_KEYBOARD_CONTROLS_P2,
  getControlsProfile,
  type NesActionKey,
  type PlayerSlot,
} from "@/lib/storage/controls-storage"
import { PLAYER2_KEYBOARD_WIRES } from "@/lib/gamepad/retroarch-gamepad-config"
import { normalizeKeyboardEvent } from "./in-game-menu/controls-helpers"
import { NES_TO_RETROARCH_ACTION } from "./use-gamepad-controls"

type PressFn = (action: string, player?: number) => void

type UseKeyboardControlsOptions = {
  enabled: boolean
  pressDown: PressFn
  pressUp: PressFn
}

const CANONICAL_KEYS = new Set<string>([
  ...Object.values(DEFAULT_KEYBOARD_CONTROLS),
  ...Object.values(DEFAULT_KEYBOARD_CONTROLS_P2),
  ...PLAYER2_KEYBOARD_WIRES,
])

function findAction(
  map: Record<NesActionKey, string>,
  retroarchKey: string,
): NesActionKey | undefined {
  return (Object.keys(map) as NesActionKey[]).find((key) => map[key] === retroarchKey)
}

export function useKeyboardControls({
  enabled,
  pressDown,
  pressUp,
}: UseKeyboardControlsOptions) {
  const handlersRef = useRef({ enabled, pressDown, pressUp })
  const activeActionsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    handlersRef.current = { enabled, pressDown, pressUp }
  })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Synthetic events dispatched by Nostalgist must reach RetroArch as-is.
      if (!e.isTrusted) return

      const { enabled: isEnabled, pressDown: onDown, pressUp: onUp } = handlersRef.current
      if (!isEnabled) return

      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return
      if (e.key === "F1" || e.key === "Escape") return

      const norm = normalizeKeyboardEvent(e)
      if (!norm) return

      const profile = getControlsProfile()
      const player1Action = findAction(profile.player1.keyboard, norm.retroarchKey)
      const player2Action = findAction(profile.player2.keyboard, norm.retroarchKey)
      const match: { action: NesActionKey; player: PlayerSlot } | null = player1Action
        ? { action: player1Action, player: 1 }
        : player2Action
          ? { action: player2Action, player: 2 }
          : null

      if (match) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        const raAction = NES_TO_RETROARCH_ACTION[match.action]
        const id = `${match.player}:${raAction}`
        if (e.type === "keydown") {
          if (!activeActionsRef.current.has(id)) {
            activeActionsRef.current.add(id)
            onDown(raAction, match.player)
          }
        } else if (e.type === "keyup") {
          if (activeActionsRef.current.has(id)) {
            activeActionsRef.current.delete(id)
            onUp(raAction, match.player)
          }
        }
        return
      }

      // An unbound default key must not leak through as a raw RetroArch binding.
      if (CANONICAL_KEYS.has(norm.retroarchKey)) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }
    }

    const releaseAll = () => {
      const { pressUp: onUp } = handlersRef.current
      for (const id of activeActionsRef.current) {
        const splitAt = id.indexOf(":")
        const player = Number(id.slice(0, splitAt))
        const action = id.slice(splitAt + 1)
        onUp(action, player)
      }
      activeActionsRef.current.clear()
    }

    window.addEventListener("keydown", handleKey, true)
    window.addEventListener("keyup", handleKey, true)
    window.addEventListener("blur", releaseAll)

    return () => {
      window.removeEventListener("keydown", handleKey, true)
      window.removeEventListener("keyup", handleKey, true)
      window.removeEventListener("blur", releaseAll)
      releaseAll()
    }
  }, [])
}
