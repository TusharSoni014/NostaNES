"use client"

import { useEffect, useRef } from "react"
import {
  DEFAULT_KEYBOARD_CONTROLS,
  getCustomControls,
  type NesActionKey,
} from "@/lib/storage/controls-storage"
import { normalizeKeyboardEvent } from "./in-game-menu/controls-helpers"

type UseKeyboardControlsOptions = {
  enabled: boolean
  pressDown: (action: string) => void
  pressUp: (action: string) => void
}

const CANONICAL_KEYS = new Set(Object.values(DEFAULT_KEYBOARD_CONTROLS))

export function useKeyboardControls({
  enabled,
  pressDown,
  pressUp,
}: UseKeyboardControlsOptions) {
  const handlersRef = useRef({ enabled, pressDown, pressUp })

  useEffect(() => {
    handlersRef.current = { enabled, pressDown, pressUp }
  })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const { enabled: isEnabled, pressDown: onDown, pressUp: onUp } = handlersRef.current
      if (!isEnabled) return

      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return
      if (e.key === "F1" || e.key === "Escape") return

      const norm = normalizeKeyboardEvent(e)
      if (!norm) return

      const custom = getCustomControls().keyboard
      const boundAction = (Object.keys(custom) as NesActionKey[]).find(
        (k) => custom[k] === norm.retroarchKey,
      )

      if (boundAction) {
        const canonical = DEFAULT_KEYBOARD_CONTROLS[boundAction]
        if (norm.retroarchKey === canonical) return

        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        if (e.type === "keydown") {
          if (!e.repeat) onDown(boundAction)
        } else if (e.type === "keyup") {
          onUp(boundAction)
        }
        return
      }

      // If user unmapped this canonical key from its default action, block it
      if (CANONICAL_KEYS.has(norm.retroarchKey)) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }
    }

    const handleBlur = () => {
      const { pressUp: onUp } = handlersRef.current
      for (const action of Object.keys(DEFAULT_KEYBOARD_CONTROLS)) {
        onUp(action)
      }
    }

    window.addEventListener("keydown", handleKey, true)
    window.addEventListener("keyup", handleKey, true)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("keydown", handleKey, true)
      window.removeEventListener("keyup", handleKey, true)
      window.removeEventListener("blur", handleBlur)
    }
  }, [])
}
