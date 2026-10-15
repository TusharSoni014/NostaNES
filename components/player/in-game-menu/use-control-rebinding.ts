"use client"

import { useEffect, useState } from "react"
import {
  assignGamepadBinding,
  assignKeyboardBinding,
  controlsSlot,
  getControlsProfile,
  resetPlayerControls,
  saveControlsProfile,
  type ControlsProfile,
  type NesActionKey,
  type PlayerSlot,
} from "@/lib/storage/controls-storage"
import { playUiSound } from "@/lib/ui-sounds"
import { normalizeKeyboardEvent } from "./controls-helpers"
import { getRawGamepads } from "@/lib/gamepad/gamepad-remapper"

function connectedGamepads(): Gamepad[] {
  return Array.from(getRawGamepads()).filter((pad): pad is Gamepad => Boolean(pad?.connected))
}

/** Player 2 prefers the second pad. One connected pad can still pick button indexes. */
function padForPlayer(player: PlayerSlot): Gamepad | undefined {
  const pads = connectedGamepads()
  return pads[player - 1] ?? (player === 2 ? pads[0] : undefined)
}

export function useControlRebinding(player: PlayerSlot, activeTab: "keyboard" | "gamepad") {
  const [profile, setProfile] = useState<ControlsProfile>(getControlsProfile())
  const [listeningKey, setListeningKey] = useState<NesActionKey | null>(null)
  const [savedNotice, setSavedNotice] = useState(false)

  const config = profile[controlsSlot(player)]

  const markSaved = () => {
    setSavedNotice(true)
    window.setTimeout(() => setSavedNotice(false), 2500)
  }

  useEffect(() => {
    if (!listeningKey || activeTab !== "keyboard") return

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      if (e.key === "Escape" && !e.code.startsWith("Numpad")) {
        setListeningKey(null)
        playUiSound("back_cancel")
        return
      }

      const normalized = normalizeKeyboardEvent(e)
      if (!normalized) return

      const next = assignKeyboardBinding(profile, player, listeningKey, normalized.retroarchKey)
      setProfile(next)
      saveControlsProfile(next)
      setListeningKey(null)
      markSaved()
      playUiSound("option_selected")
    }

    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [activeTab, listeningKey, player, profile])

  useEffect(() => {
    if (!listeningKey || activeTab !== "gamepad") return

    let animId = 0
    let heldAtStart: Set<number> | null = null

    const commitGamepadBind = (code: string) => {
      const next = assignGamepadBinding(profile, player, listeningKey, code)
      setProfile(next)
      saveControlsProfile(next)
      setListeningKey(null)
      markSaved()
      playUiSound("option_selected")
    }

    const poll = () => {
      const pad = padForPlayer(player)

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
  }, [activeTab, listeningKey, player, profile])

  const handleSave = () => {
    saveControlsProfile(profile)
    setSavedNotice(true)
    playUiSound("game_start")
    window.setTimeout(() => setSavedNotice(false), 3000)
  }

  const handleReset = () => {
    setProfile(resetPlayerControls(player))
    setSavedNotice(true)
    playUiSound("navigation")
    window.setTimeout(() => setSavedNotice(false), 3000)
  }

  return { config, listeningKey, setListeningKey, savedNotice, handleSave, handleReset }
}
