"use client"

import { useEffect, useRef, useState } from "react"
import {
  getCustomControls,
  resetCustomControls,
  saveCustomControls,
  type CustomControlsConfig,
  type NesActionKey,
} from "@/lib/storage/controls-storage"
import { playUiSound } from "@/lib/ui-sounds"
import { normalizeKeyboardEvent } from "./controls-helpers"

export function useControlRebinding(
  activeTab: "keyboard" | "gamepad",
  onControlsSaved?: () => void,
) {
  const [config, setConfig] = useState<CustomControlsConfig>(getCustomControls())
  const [listeningKey, setListeningKey] = useState<NesActionKey | null>(null)
  const [savedNotice, setSavedNotice] = useState(false)
  const onSavedRef = useRef(onControlsSaved)

  useEffect(() => {
    onSavedRef.current = onControlsSaved
  }, [onControlsSaved])

  // Listen for keyboard input when rebinding
  useEffect(() => {
    if (!listeningKey || activeTab !== "keyboard") return

    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === "Escape") {
        setListeningKey(null)
        playUiSound("navigation")
        return
      }

      const normalized = normalizeKeyboardEvent(e)
      if (normalized) {
        setConfig((prev) => ({
          ...prev,
          keyboard: { ...prev.keyboard, [listeningKey]: normalized.retroarchKey },
        }))
        setListeningKey(null)
        playUiSound("option_selected")
      }
    }

    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [activeTab, listeningKey])

  // Listen for gamepad input when rebinding with edge-detection
  useEffect(() => {
    if (!listeningKey || activeTab !== "gamepad") return

    let animId = 0
    let heldAtStart: Set<number> | null = null

    const poll = () => {
      const pads = navigator.getGamepads?.() ?? []
      const pad = Array.from(pads).find((p): p is Gamepad => Boolean(p?.connected))

      if (pad) {
        // Record all buttons currently held down on the first frame to prevent instant-firing
        if (heldAtStart === null) {
          heldAtStart = new Set<number>()
          pad.buttons.forEach((btn, idx) => {
            const isPressed = typeof btn === "object" ? btn.pressed : Boolean(btn)
            if (isPressed) heldAtStart?.add(idx)
          })
        } else {
          // Check for Select + Start combo to cancel
          const btnSelect = pad.buttons[8]?.pressed ?? false
          const btnStart = pad.buttons[9]?.pressed ?? false
          if (btnSelect && btnStart) {
            setListeningKey(null)
            playUiSound("navigation")
            return
          }

          // Check if any button was released
          pad.buttons.forEach((btn, idx) => {
            const isPressed = typeof btn === "object" ? btn.pressed : Boolean(btn)
            if (!isPressed && heldAtStart?.has(idx)) {
              heldAtStart.delete(idx)
            }
          })

          // Check for newly pressed button
          for (let i = 0; i < pad.buttons.length; i++) {
            const btn = pad.buttons[i]
            const isPressed = typeof btn === "object" ? btn.pressed : Boolean(btn)
            if (isPressed && !heldAtStart.has(i)) {
              setConfig((prev) => ({
                ...prev,
                gamepad: { ...prev.gamepad, [listeningKey]: String(i) },
              }))
              setListeningKey(null)
              playUiSound("option_selected")
              return
            }
          }

          // Check D-Pad axes if analog moved
          const axisX = pad.axes[0] ?? 0
          const axisY = pad.axes[1] ?? 0
          let axisCode: string | null = null
          if (axisY < -0.65) axisCode = "12" // Up
          else if (axisY > 0.65) axisCode = "13" // Down
          else if (axisX < -0.65) axisCode = "14" // Left
          else if (axisX > 0.65) axisCode = "15" // Right

          if (axisCode) {
            setConfig((prev) => ({
              ...prev,
              gamepad: { ...prev.gamepad, [listeningKey]: axisCode },
            }))
            setListeningKey(null)
            playUiSound("option_selected")
            return
          }
        }
      }

      animId = requestAnimationFrame(poll)
    }

    animId = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(animId)
  }, [activeTab, listeningKey])

  const handleSave = () => {
    saveCustomControls(config)
    onSavedRef.current?.()
    setSavedNotice(true)
    playUiSound("game_start")
    window.setTimeout(() => setSavedNotice(false), 3000)
  }

  const handleReset = () => {
    const defaults = resetCustomControls()
    setConfig(defaults)
    onSavedRef.current?.()
    setSavedNotice(true)
    playUiSound("navigation")
    window.setTimeout(() => setSavedNotice(false), 3000)
  }

  return { config, listeningKey, setListeningKey, savedNotice, handleSave, handleReset }
}
