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
  onControlsChanged?: () => void,
) {
  const [config, setConfig] = useState<CustomControlsConfig>(getCustomControls())
  const [listeningKey, setListeningKey] = useState<NesActionKey | null>(null)
  const [savedNotice, setSavedNotice] = useState(false)
  const onSavedRef = useRef(onControlsSaved)
  const onChangedRef = useRef(onControlsChanged)

  useEffect(() => {
    onSavedRef.current = onControlsSaved
    onChangedRef.current = onControlsChanged
  }, [onControlsSaved, onControlsChanged])

  // Listen for keyboard input when rebinding
  useEffect(() => {
    if (!listeningKey || activeTab !== "keyboard") return

    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === "Escape") {
        setListeningKey(null)
        playUiSound("back_cancel")
        return
      }

      const normalized = normalizeKeyboardEvent(e)
      if (normalized) {
        const nextKb = { ...config.keyboard }
        const conflict = (Object.keys(nextKb) as NesActionKey[]).find(
          (k) => k !== listeningKey && nextKb[k] === normalized.retroarchKey,
        )
        if (conflict) nextKb[conflict] = config.keyboard[listeningKey]
        nextKb[listeningKey] = normalized.retroarchKey

        const newConfig: CustomControlsConfig = { ...config, keyboard: nextKb }
        setConfig(newConfig)
        saveCustomControls(newConfig)
        onChangedRef.current?.()
        setListeningKey(null)
        setSavedNotice(true)
        playUiSound("option_selected")
        window.setTimeout(() => setSavedNotice(false), 2500)
      }
    }

    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [activeTab, config, listeningKey])

  // Listen for gamepad input when rebinding with edge-detection
  useEffect(() => {
    if (!listeningKey || activeTab !== "gamepad") return

    let animId = 0
    let heldAtStart: Set<number> | null = null

    const commitGamepadBind = (code: string) => {
      const nextPad = { ...config.gamepad }
      const conflict = (Object.keys(nextPad) as NesActionKey[]).find(
        (k) => k !== listeningKey && nextPad[k] === code,
      )
      if (conflict) nextPad[conflict] = config.gamepad[listeningKey]
      nextPad[listeningKey] = code

      const newConfig: CustomControlsConfig = { ...config, gamepad: nextPad }
      setConfig(newConfig)
      saveCustomControls(newConfig)
      onChangedRef.current?.()
      setListeningKey(null)
      setSavedNotice(true)
      playUiSound("option_selected")
      window.setTimeout(() => setSavedNotice(false), 2500)
    }

    const poll = () => {
      const pads = navigator.getGamepads?.() ?? []
      const pad = Array.from(pads).find((p): p is Gamepad => Boolean(p?.connected))

      if (pad) {
        if (heldAtStart === null) {
          heldAtStart = new Set<number>()
          pad.buttons.forEach((btn, idx) => {
            const isPressed = typeof btn === "object" ? btn.pressed : Boolean(btn)
            if (isPressed) heldAtStart?.add(idx)
          })
        } else {
          const btnSelect = pad.buttons[8]?.pressed ?? false
          const btnStart = pad.buttons[9]?.pressed ?? false
          if (btnSelect && btnStart) {
            setListeningKey(null)
            playUiSound("back_cancel")
            return
          }

          pad.buttons.forEach((btn, idx) => {
            const isPressed = typeof btn === "object" ? btn.pressed : Boolean(btn)
            if (!isPressed && heldAtStart?.has(idx)) heldAtStart.delete(idx)
          })

          for (let i = 0; i < pad.buttons.length; i++) {
            const btn = pad.buttons[i]
            const isPressed = typeof btn === "object" ? btn.pressed : Boolean(btn)
            if (isPressed && !heldAtStart.has(i)) {
              commitGamepadBind(String(i))
              return
            }
          }

          const axisX = pad.axes[0] ?? 0
          const axisY = pad.axes[1] ?? 0
          let axisCode: string | null = null
          if (axisY < -0.65) axisCode = "12"
          else if (axisY > 0.65) axisCode = "13"
          else if (axisX < -0.65) axisCode = "14"
          else if (axisX > 0.65) axisCode = "15"

          if (axisCode) {
            commitGamepadBind(axisCode)
            return
          }
        }
      }

      animId = requestAnimationFrame(poll)
    }

    animId = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(animId)
  }, [activeTab, config, listeningKey])

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
    onChangedRef.current?.()
    setSavedNotice(true)
    playUiSound("navigation")
    window.setTimeout(() => setSavedNotice(false), 3000)
  }

  return { config, listeningKey, setListeningKey, savedNotice, handleSave, handleReset }
}
