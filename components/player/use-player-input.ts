"use client"

import { useEffect, useRef } from "react"
import { GamepadDispatcher, type GamepadHoldState } from "@/lib/gamepad/gamepad-dispatcher"

type UsePlayerInputOptions = {
  inGameMenuOpen: boolean
  confirmingExit: boolean
  toggleInGameMenu: () => void
  handleResume: () => void
  handleRequestExit: () => void
  handleConfirmExit: () => void
  toggleFullscreen: () => void
  setExitHud: (state: GamepadHoldState) => void
}

export function usePlayerInput({
  inGameMenuOpen,
  confirmingExit,
  toggleInGameMenu,
  handleResume,
  handleRequestExit,
  handleConfirmExit,
  toggleFullscreen,
  setExitHud,
}: UsePlayerInputOptions) {
  const actionsRef = useRef({
    inGameMenuOpen,
    confirmingExit,
    toggleInGameMenu,
    handleResume,
    handleRequestExit,
    handleConfirmExit,
    toggleFullscreen,
    setExitHud,
  })

  useEffect(() => {
    actionsRef.current = {
      inGameMenuOpen,
      confirmingExit,
      toggleInGameMenu,
      handleResume,
      handleRequestExit,
      handleConfirmExit,
      toggleFullscreen,
      setExitHud,
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

  // Gamepad dispatcher
  useEffect(() => {
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
      },
      {
        onSelectHold: (holdState) => {
          const actions = actionsRef.current
          if (!actions.confirmingExit && !actions.inGameMenuOpen) {
            actions.setExitHud(holdState)
          }
        },
        onSelectHoldComplete: () => {
          actionsRef.current.handleConfirmExit()
        },
      },
    )

    dispatcher.start()
    return () => dispatcher.stop()
  }, [])
}
