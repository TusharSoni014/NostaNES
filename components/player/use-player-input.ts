"use client"

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react"
import { GamepadDispatcher } from "@/lib/gamepad/gamepad-dispatcher"
import { getControlsProfile } from "@/lib/storage/controls-storage"
import type { ActiveHold, HoldAction } from "./hold-action-hud"

type UsePlayerInputOptions = {
  /** Speed and quick save/load shortcuts only work while the game is running. */
  shortcutsEnabled: boolean
  inGameMenuOpen: boolean
  confirmingExit: boolean
  toggleInGameMenu: () => void
  handleResume: () => void
  handleRequestExit: () => void
  handleConfirmExit: () => void
  toggleFullscreen: () => void
  setHold: Dispatch<SetStateAction<ActiveHold | null>>
  changeSpeedBy: (delta: number) => void
  quickSave: () => void
  quickLoad: () => void
}

const EXIT_HOLD_MS = 2000
const QUICK_STATE_HOLD_MS = 2000
/** Keyboard holds show their HUD after the same grace period as gamepad holds. */
const KEY_HOLD_ANNOUNCE_DELAY_MS = 250

const GAMEPAD_LB = 4
const GAMEPAD_RB = 5
const GAMEPAD_LT = 6
const GAMEPAD_RT = 7
const GAMEPAD_SELECT = 8

// Keyboard shortcuts, by KeyboardEvent.code. A key the player has bound to a NES
// button never reaches these: useKeyboardControls stops it first.
const SPEED_KEYS: Record<string, number> = { BracketRight: 1, BracketLeft: -1 }
const QUICK_STATE_KEYS: Record<string, { action: HoldAction; label: string }> = {
  Period: { action: "quick-save", label: "." },
  Comma: { action: "quick-load", label: "," },
}

/** A shoulder button the player mapped to a NES button belongs to the game. */
function isBoundToGame(button: number) {
  return Object.values(getControlsProfile().player1.gamepad).includes(String(button))
}

function clearHold(action: HoldAction): SetStateAction<ActiveHold | null> {
  return (current) => (current?.action === action ? null : current)
}

export function usePlayerInput({
  shortcutsEnabled,
  inGameMenuOpen,
  confirmingExit,
  toggleInGameMenu,
  handleResume,
  handleRequestExit,
  handleConfirmExit,
  toggleFullscreen,
  setHold,
  changeSpeedBy,
  quickSave,
  quickLoad,
}: UsePlayerInputOptions) {
  const actionsRef = useRef({
    shortcutsEnabled,
    inGameMenuOpen,
    confirmingExit,
    toggleInGameMenu,
    handleResume,
    handleRequestExit,
    handleConfirmExit,
    toggleFullscreen,
    setHold,
    changeSpeedBy,
    quickSave,
    quickLoad,
  })

  useEffect(() => {
    actionsRef.current = {
      shortcutsEnabled,
      inGameMenuOpen,
      confirmingExit,
      toggleInGameMenu,
      handleResume,
      handleRequestExit,
      handleConfirmExit,
      toggleFullscreen,
      setHold,
      changeSpeedBy,
      quickSave,
      quickLoad,
    }
  })

  // Keyboard navigation & F1 menu toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const actions = actionsRef.current
      if (e.key === "F1") {
        e.preventDefault()
        e.stopPropagation()
        actions.toggleInGameMenu()
      } else if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        if (actions.inGameMenuOpen) actions.handleResume()
        else if (actions.confirmingExit) actions.handleResume()
        else actions.handleRequestExit()
      } else if ((e.key === "f" || e.key === "F") && !actions.confirmingExit && !actions.inGameMenuOpen) {
        if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return
        e.preventDefault()
        actions.toggleFullscreen()
      }
    }

    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [])

  // Keyboard game shortcuts: [ ] change speed, hold . / , to quick save / load
  useEffect(() => {
    let keyHold: { code: string; action: HoldAction; timers: number[] } | null = null

    const cancelKeyHold = () => {
      if (!keyHold) return
      keyHold.timers.forEach((timer) => window.clearTimeout(timer))
      actionsRef.current.setHold(clearHold(keyHold.action))
      keyHold = null
    }

    const shortcutsAllowed = (e: KeyboardEvent) => {
      const actions = actionsRef.current
      if (!actions.shortcutsEnabled || actions.inGameMenuOpen || actions.confirmingExit) return false
      if (e.ctrlKey || e.metaKey || e.altKey) return false
      return !(e.target instanceof HTMLElement && e.target.closest("input, textarea"))
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const speedDelta = SPEED_KEYS[e.code]
      const quickState = QUICK_STATE_KEYS[e.code]
      if (!speedDelta && !quickState) return
      if (!shortcutsAllowed(e)) return
      e.preventDefault()
      if (e.repeat) return

      if (speedDelta) {
        actionsRef.current.changeSpeedBy(speedDelta)
        return
      }

      cancelKeyHold()
      const startedAt = performance.now()
      const { action, label } = quickState
      const announce = window.setTimeout(() => {
        actionsRef.current.setHold({ action, startedAt, durationMs: QUICK_STATE_HOLD_MS, inputLabel: label })
      }, KEY_HOLD_ANNOUNCE_DELAY_MS)
      const complete = window.setTimeout(() => {
        keyHold = null
        const actions = actionsRef.current
        actions.setHold(clearHold(action))
        if (!actions.shortcutsEnabled || actions.inGameMenuOpen || actions.confirmingExit) return
        if (action === "quick-save") actions.quickSave()
        else actions.quickLoad()
      }, QUICK_STATE_HOLD_MS)
      keyHold = { code: e.code, action, timers: [announce, complete] }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (keyHold && e.code === keyHold.code) cancelKeyHold()
    }

    window.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("keyup", onKeyUp, true)
    window.addEventListener("blur", cancelKeyHold)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("keyup", onKeyUp, true)
      window.removeEventListener("blur", cancelKeyHold)
      cancelKeyHold()
    }
  }, [])

  // Gamepad dispatcher
  useEffect(() => {
    const shortcutsAllowed = (button: number) => {
      const actions = actionsRef.current
      return (
        actions.shortcutsEnabled &&
        !actions.inGameMenuOpen &&
        !actions.confirmingExit &&
        !isBoundToGame(button)
      )
    }

    const quickStateHold = (button: number, action: HoldAction, inputLabel: string) => ({
      button,
      durationMs: QUICK_STATE_HOLD_MS,
      onStart: (startedAt: number) => {
        if (!shortcutsAllowed(button)) return
        actionsRef.current.setHold({ action, startedAt, durationMs: QUICK_STATE_HOLD_MS, inputLabel })
      },
      onCancel: () => actionsRef.current.setHold(clearHold(action)),
      onComplete: () => {
        actionsRef.current.setHold(clearHold(action))
        if (!shortcutsAllowed(button)) return
        if (action === "quick-save") actionsRef.current.quickSave()
        else actionsRef.current.quickLoad()
      },
    })

    const dispatcher = new GamepadDispatcher(
      (action) => {
        const actions = actionsRef.current
        if (action === "IN_GAME_MENU") {
          actions.toggleInGameMenu()
          return
        }
        if (actions.inGameMenuOpen || actions.confirmingExit) return
        if (action === "MENU") actions.handleRequestExit()
        else if (action === "TOGGLE_FULLSCREEN") actions.toggleFullscreen()
        else if (action === "SPEED_UP" && shortcutsAllowed(GAMEPAD_RT)) actions.changeSpeedBy(1)
        else if (action === "SPEED_DOWN" && shortcutsAllowed(GAMEPAD_LT)) actions.changeSpeedBy(-1)
      },
      {
        holds: [
          {
            button: GAMEPAD_SELECT,
            durationMs: EXIT_HOLD_MS,
            onStart: (startedAt) => {
              const actions = actionsRef.current
              if (actions.confirmingExit || actions.inGameMenuOpen) return
              actions.setHold({ action: "exit", startedAt, durationMs: EXIT_HOLD_MS, inputLabel: "SELECT" })
            },
            onCancel: () => actionsRef.current.setHold(clearHold("exit")),
            onComplete: () => {
              actionsRef.current.setHold(clearHold("exit"))
              actionsRef.current.handleConfirmExit()
            },
          },
          quickStateHold(GAMEPAD_RB, "quick-save", "RB"),
          quickStateHold(GAMEPAD_LB, "quick-load", "LB"),
        ],
      },
    )

    dispatcher.start()
    return () => dispatcher.stop()
  }, [])
}
