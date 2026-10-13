"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ExitConfirmDialog } from "@/components/exit-confirm-dialog"
import { GamepadExitHud } from "@/components/player/gamepad-exit-hud"
import { InGameMenu } from "@/components/player/in-game-menu/in-game-menu"
import { PlayerFooter } from "@/components/player/player-footer"
import { PlayerHeader } from "@/components/player/player-header"
import { PlayerOverlay } from "@/components/player/player-overlay"
import { useNostalgistEmulator } from "@/components/player/use-nostalgist-emulator"
import { useSaveLoadState } from "@/components/player/use-save-load-state"
import { GamepadDispatcher, type GamepadHoldState } from "@/lib/gamepad/gamepad-dispatcher"
import { motion } from "motion/react"
import { playUiSound } from "@/lib/ui-sounds"
import { cn } from "@/lib/utils"
import type { Game } from "@/lib/games"

type PlayerStageProps = {
  game: Game
  onExit: () => void
}

export const PlayerStage = ({ game, onExit }: PlayerStageProps) => {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [isFullscreen, setIsFullscreen] = useState(true)
  const [confirmingExit, setConfirmingExit] = useState(false)
  const [inGameMenuOpen, setInGameMenuOpen] = useState(false)
  const [exitHud, setExitHud] = useState<GamepadHoldState>({
    active: false,
    remainingSeconds: 5,
    progress: 0,
  })

  useEffect(() => {
    if (phase === "error") playUiSound("error")
  }, [phase])

  useEffect(() => {
    if (confirmingExit) playUiSound("game_paused")
  }, [confirmingExit])

  const { pause, resume, saveState, loadState } = useNostalgistEmulator({
    game,
    canvasRef,
    onPhaseChange: setPhase,
  })

  const { handleSaveState, handleLoadState } = useSaveLoadState(game.file, saveState, loadState)

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFullscreenChange)
    if (typeof document !== "undefined" && !document.fullscreenElement) {
      stageRef.current?.requestFullscreen().catch(() => {})
    }
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) stageRef.current?.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
  }, [])

  const openInGameMenu = useCallback(() => {
    pause()
    playUiSound("game_paused")
    setInGameMenuOpen(true)
  }, [pause])

  const closeInGameMenu = useCallback(() => {
    setInGameMenuOpen(false)
    resume()
  }, [resume])

  const toggleInGameMenu = useCallback(() => {
    if (inGameMenuOpen) {
      closeInGameMenu()
    } else {
      openInGameMenu()
    }
  }, [inGameMenuOpen, closeInGameMenu, openInGameMenu])

  const handleRequestExit = useCallback(() => {
    setConfirmingExit(true)
    pause()
  }, [pause])

  const handleResume = useCallback(() => {
    setConfirmingExit(false)
    closeInGameMenu()
  }, [closeInGameMenu])

  const handleConfirmExit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    onExit()
  }, [onExit])

  // Keyboard navigation & F1 menu toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault()
        e.stopPropagation()
        toggleInGameMenu()
      } else if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        if (inGameMenuOpen) handleResume()
        else if (confirmingExit) handleResume()
        else handleRequestExit()
      } else if ((e.key === "f" || e.key === "F") && !confirmingExit && !inGameMenuOpen) {
        if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === "Enter" && confirmingExit) {
        e.preventDefault()
        handleConfirmExit()
      }
    }

    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [confirmingExit, inGameMenuOpen, handleConfirmExit, handleRequestExit, handleResume, toggleFullscreen, toggleInGameMenu])

  const playerActionsRef = useRef({
    confirmingExit,
    inGameMenuOpen,
    handleConfirmExit,
    handleResume,
    handleRequestExit,
    toggleFullscreen,
    toggleInGameMenu,
  })

  useEffect(() => {
    playerActionsRef.current = {
      confirmingExit,
      inGameMenuOpen,
      handleConfirmExit,
      handleResume,
      handleRequestExit,
      toggleFullscreen,
      toggleInGameMenu,
    }
  })

  // Gamepad dispatcher
  useEffect(() => {
    const dispatcher = new GamepadDispatcher(
      (action) => {
        const actions = playerActionsRef.current
        if (action === "IN_GAME_MENU") {
          actions.toggleInGameMenu()
          return
        }
        if (actions.inGameMenuOpen) return
        if (actions.confirmingExit) {
          if (action === "CONFIRM") actions.handleConfirmExit()
          else if (action === "CANCEL") actions.handleResume()
          return
        }
        if (action === "MENU") actions.handleRequestExit()
        else if (action === "TOGGLE_FULLSCREEN") actions.toggleFullscreen()
      },
      {
        onSelectHold: (holdState) => {
          if (!playerActionsRef.current.confirmingExit && !playerActionsRef.current.inGameMenuOpen) {
            setExitHud(holdState)
          }
        },
        onSelectHoldComplete: () => {
          playerActionsRef.current.handleConfirmExit()
        },
      },
    )

    dispatcher.start()
    return () => dispatcher.stop()
  }, [])

  return (
    <motion.div
      ref={stageRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 z-40 flex flex-col bg-black will-change-opacity select-none"
    >
      <GamepadExitHud
        active={exitHud.active}
        remainingSeconds={exitHud.remainingSeconds}
        progress={exitHud.progress}
      />

      <ExitConfirmDialog
        open={confirmingExit}
        onResume={handleResume}
        onConfirmExit={handleConfirmExit}
      />

      <InGameMenu
        open={inGameMenuOpen}
        game={game}
        onResume={handleResume}
        onRequestExit={handleConfirmExit}
        onSaveState={handleSaveState}
        onLoadState={handleLoadState}
      />

      <PlayerHeader
        title={game.title}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onRequestExit={handleRequestExit}
      />

      {/* Game Stage: Unrounded, zero-lag, arcade CRT 4:3 display */}
      <div className="flex min-h-0 flex-1 items-center justify-center p-0 bg-black">
        <div
          className={cn(
            "relative aspect-[4/3] h-full max-h-screen w-full max-w-[min(100%,calc(100dvh*4/3))] overflow-hidden bg-black rounded-none shadow-none ring-0",
            !isFullscreen && "max-h-[calc(100dvh-8rem)]",
          )}
        >
          <canvas
            ref={canvasRef}
            tabIndex={-1}
            className="size-full rounded-none [image-rendering:pixelated] outline-none"
            aria-label={`${game.title} display`}
          />
          <PlayerOverlay game={game} phase={phase} onExit={handleConfirmExit} />
        </div>
      </div>

      <PlayerFooter isFullscreen={isFullscreen} />
    </motion.div>
  )
}
