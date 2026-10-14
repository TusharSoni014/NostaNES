"use client"

import { useEffect, useState } from "react"
import {
  getCustomControls,
  resetCustomControls,
  saveCustomControls,
  type CustomControlsConfig,
  type NesActionKey,
} from "@/lib/storage/controls-storage"
import { playUiSound } from "@/lib/ui-sounds"

export function useControlRebinding(activeTab: "keyboard" | "gamepad") {
  const [config, setConfig] = useState<CustomControlsConfig>(getCustomControls())
  const [listeningKey, setListeningKey] = useState<NesActionKey | null>(null)
  const [savedNotice, setSavedNotice] = useState(false)

  // Listen for keyboard input when rebinding
  useEffect(() => {
    if (!listeningKey || activeTab !== "keyboard") return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === "Escape") {
        setListeningKey(null)
        return
      }
      setConfig((prev) => ({
        ...prev,
        keyboard: { ...prev.keyboard, [listeningKey]: e.key.toLowerCase() },
      }))
      setListeningKey(null)
      playUiSound("option_selected")
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [activeTab, listeningKey])

  // Listen for gamepad input when rebinding
  useEffect(() => {
    if (!listeningKey || activeTab !== "gamepad") return
    let animId = 0
    const poll = () => {
      const pad = Array.from(navigator.getGamepads?.() ?? []).find((p): p is Gamepad => Boolean(p?.connected))
      if (pad) {
        for (let i = 0; i < pad.buttons.length; i++) {
          const btn = pad.buttons[i]
          if (typeof btn === "object" ? btn.pressed : Boolean(btn)) {
            setConfig((prev) => ({
              ...prev,
              gamepad: { ...prev.gamepad, [listeningKey]: String(i) },
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
    setSavedNotice(true)
    playUiSound("game_start")
    window.setTimeout(() => setSavedNotice(false), 3000)
  }

  const handleReset = () => {
    setConfig(resetCustomControls())
    setSavedNotice(true)
    playUiSound("navigation")
    window.setTimeout(() => setSavedNotice(false), 3000)
  }

  return { config, listeningKey, setListeningKey, savedNotice, handleSave, handleReset }
}
