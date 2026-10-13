"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ExitConfirmDialog } from "@/components/exit-confirm-dialog"
import { GamepadExitHud } from "@/components/player/gamepad-exit-hud"
import { PlayerFooter } from "@/components/player/player-footer"
import { PlayerHeader } from "@/components/player/player-header"
import { PlayerOverlay } from "@/components/player/player-overlay"
import { useNostalgistEmulator } from "@/components/player/use-nostalgist-emulator"
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

  const { pause, resume } = useNostalgistEmulator({
    game,
    canvasRef,
    onPhaseChange: setPhase,
  })

  // Sync fullscreen state and attempt fullscreen by default on mount
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    if (typeof document !== "undefined" && !document.fullscreenElement) {
      stageRef.current?.requestFullscreen().catch(() => {})
    }
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      stageRef.current?.requestFullscreen().catch(() => {})
      return
    }
    document.exitFullscreen().catch(() => {})
  }, [])

  const handleRequestExit = useCallback(() => {
    setConfirmingExit(true)
    pause()
  }, [pause])

  const handleResume = useCallback(() => {
    setConfirmingExit(false)
    resume()
  }, [resume])

  const handleConfirmExit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    onExit()
  }, [onExit])

  // Keyboard controls: Esc immediately triggers exit confirmation
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        if (confirmingExit) handleResume()
        else handleRequestExit()
      } else if ((event.key === "f" || event.key === "F") && !confirmingExit) {
        if (event.target instanceof HTMLElement && event.target.closest("input, textarea")) return
        event.preventDefault()
        toggleFullscreen()
      } else if (event.key === "Enter" && confirmingExit) {
        event.preventDefault()
        handleConfirmExit()
      }
    }

    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [confirmingExit, handleConfirmExit, handleRequestExit, handleResume, toggleFullscreen])

  const playerActionsRef = useRef({
    confirmingExit,
    handleConfirmExit,
    handleResume,
    handleRequestExit,
    toggleFullscreen,
  })

  useEffect(() => {
    playerActionsRef.current = {
      confirmingExit,
      handleConfirmExit,
      handleResume,
      handleRequestExit,
      toggleFullscreen,
    }
  })

  // Gamepad dispatcher: Start and Select never trigger immediate exit modal
  // Holding Select for 5s triggers direct exit with HUD feedback
  useEffect(() => {
    const dispatcher = new GamepadDispatcher(
      (action) => {
        const actions = playerActionsRef.current
        if (actions.confirmingExit) {
          if (action === "CONFIRM") actions.handleConfirmExit()
          else if (action === "CANCEL") actions.handleResume()
          return
        }

        if (action === "MENU") {
          actions.handleRequestExit()
        } else if (action === "TOGGLE_FULLSCREEN") {
          actions.toggleFullscreen()
        }
      },
      {
        onSelectHold: (holdState) => {
          if (!playerActionsRef.current.confirmingExit) {
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
