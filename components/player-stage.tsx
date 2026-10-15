"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ExitConfirmDialog } from "@/components/exit-confirm-dialog"
import { GamepadExitHud } from "@/components/player/gamepad-exit-hud"
import { InGameMenu } from "@/components/player/in-game-menu/in-game-menu"
import { PlayerFooter } from "@/components/player/player-footer"
import { PlayerHeader } from "@/components/player/player-header"
import { PlayerOverlay } from "@/components/player/player-overlay"
import { ShaderOverlay } from "@/components/player/shader-overlay"
import { useNostalgistEmulator } from "@/components/player/use-nostalgist-emulator"
import { useSaveLoadState } from "@/components/player/use-save-load-state"
import { usePlayerInput } from "@/components/player/use-player-input"
import { useKeyboardControls } from "@/components/player/use-keyboard-controls"
import { useGamepadControls } from "@/components/player/use-gamepad-controls"
import { MobileTouchControls } from "@/components/player/mobile-touch-controls"
import { useIsMobile, useIsPortrait } from "@/hooks/use-is-mobile"
import { useGamepadStatus } from "@/hooks/use-gamepad-status"
import { getSavedShader, saveShader, type GameShader } from "@/lib/storage/shader-storage"
import type { GamepadHoldState } from "@/lib/gamepad/gamepad-dispatcher"
import { motion } from "motion/react"
import { playUiSound } from "@/lib/ui-sounds"
import { cn } from "@/lib/utils"
import type { Game } from "@/lib/games"

type PlayerStageProps = {
  game: Game
  initialSlot?: number
  onExit: () => void
}

export const PlayerStage = ({ game, initialSlot, onExit }: PlayerStageProps) => {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const isMobile = useIsMobile()
  const isPortrait = useIsPortrait()
  const { connected: gamepadConnected } = useGamepadStatus()
  const [forceLandscape, setForceLandscape] = useState(true)

  // Screen orientation lock for mobile devices
  useEffect(() => {
    if (!isMobile) return

    const lockOrientation = async () => {
      try {
        const orientation = screen.orientation as unknown as { lock?: (type: string) => Promise<void> } | undefined
        const legacyScreen = screen as unknown as { lockOrientation?: (type: string) => boolean }
        if (orientation && typeof orientation.lock === "function") {
          await orientation.lock("landscape")
        } else if (typeof legacyScreen.lockOrientation === "function") {
          legacyScreen.lockOrientation("landscape")
        }
      } catch {}
    }
    void lockOrientation()

    return () => {
      try {
        const orientation = screen.orientation as unknown as { unlock?: () => void } | undefined
        const legacyScreen = screen as unknown as { unlockOrientation?: () => boolean }
        if (orientation && typeof orientation.unlock === "function") {
          orientation.unlock()
        } else if (typeof legacyScreen.unlockOrientation === "function") {
          legacyScreen.unlockOrientation()
        }
      } catch {}
    }
  }, [isMobile])

  const shouldRotate = isMobile && isPortrait && forceLandscape

  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [isFullscreen, setIsFullscreen] = useState(true)
  const [confirmingExit, setConfirmingExit] = useState(false)
  const [inGameMenuOpen, setInGameMenuOpen] = useState(false)
  const [activeShader, setActiveShader] = useState<GameShader>(getSavedShader)
  const [romKey, setRomKey] = useState(0)
  const [exitHud, setExitHud] = useState<GamepadHoldState>({
    active: false, remainingSeconds: 5, progress: 0,
  })

  const handleSelectShader = useCallback((shader: GameShader) => {
    setActiveShader(shader)
    saveShader(shader)
  }, [])

  useEffect(() => {
    if (phase === "error") playUiSound("error")
    else if (confirmingExit) playUiSound("game_paused")
  }, [phase, confirmingExit])

  const {
    pause, resume, saveState, loadState, unload, pressDown, pressUp,
    loadCheats, enableCheat, disableCheat, clearCheats, getCheats,
  } = useNostalgistEmulator({
    game, canvasRef, onPhaseChange: setPhase, reloadKey: romKey,
    isPaused: inGameMenuOpen || confirmingExit,
    initialSlot,
  })

  useKeyboardControls({
    enabled: phase === "ready" && !inGameMenuOpen && !confirmingExit,
    pressDown,
    pressUp,
  })

  useGamepadControls({
    enabled: phase === "ready" && !inGameMenuOpen && !confirmingExit,
    pressDown,
    pressUp,
  })

  const { handleSaveState, handleLoadState } = useSaveLoadState(game.file, saveState, loadState)

  const handleResetGame = useCallback(() => {
    setInGameMenuOpen(false)
    setPhase("loading")
    setRomKey((prev) => prev + 1)
    playUiSound("game_start")
  }, [])

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFs)
    if (!document.fullscreenElement) stageRef.current?.requestFullscreen().catch(() => {})
    return () => {
      document.removeEventListener("fullscreenchange", onFs)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
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
    playUiSound("back_cancel")
  }, [resume])

  const toggleInGameMenu = useCallback(() => {
    if (inGameMenuOpen) closeInGameMenu()
    else openInGameMenu()
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
    unload()
    setInGameMenuOpen(false)
    setConfirmingExit(false)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    playUiSound("navigation")
    onExit()
  }, [unload, onExit])

  usePlayerInput({
    inGameMenuOpen, confirmingExit, toggleInGameMenu, handleResume,
    handleRequestExit, handleConfirmExit, toggleFullscreen, setExitHud,
  })

  return (
    <motion.div
      ref={stageRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "z-40 flex flex-col bg-black will-change-transform select-none overflow-hidden",
        shouldRotate
          ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100dvh] h-[100dvw] rotate-90 origin-center"
          : "fixed inset-0 w-full h-full will-change-opacity",
      )}
    >
      <GamepadExitHud active={exitHud.active} remainingSeconds={exitHud.remainingSeconds} progress={exitHud.progress} />
      <ExitConfirmDialog open={confirmingExit} onResume={handleResume} onConfirmExit={handleConfirmExit} />

      <InGameMenu
        key={inGameMenuOpen ? "open" : "closed"}
        open={inGameMenuOpen} game={game}
        onResume={handleResume} onRequestExit={handleConfirmExit}
        onResetGame={handleResetGame}
        onSaveState={handleSaveState} onLoadState={handleLoadState}
        activeShader={activeShader} onSelectShader={handleSelectShader}
        cheats={{ loadCheats, enableCheat, disableCheat, clearCheats, getCheats }}
      />

      <PlayerHeader
        title={game.title}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onRequestExit={handleRequestExit}
        isMobile={isMobile}
        onToggleRotate={isMobile ? () => setForceLandscape((prev) => !prev) : undefined}
        isRotated={shouldRotate}
      />

      {/* Game Stage: Unrounded, zero-lag, arcade CRT 4:3 display */}
      <div className="flex min-h-0 flex-1 items-center justify-center p-0 bg-black relative">
        <div
          className={cn(
            "relative aspect-[4/3] h-full max-h-screen w-full max-w-[min(100%,calc(100dvh*4/3))] overflow-hidden bg-black rounded-none shadow-none ring-0",
            !isFullscreen && !isMobile && "max-h-[calc(100dvh-8rem)]",
          )}
        >
          <canvas
            key={romKey} ref={canvasRef} tabIndex={-1} aria-label={`${game.title} display`}
            className={cn(
              "size-full rounded-none outline-none",
              activeShader === "smooth" ? "[image-rendering:auto]" : "[image-rendering:pixelated]",
            )}
          />
          <ShaderOverlay shader={activeShader} />
          <PlayerOverlay game={game} phase={phase} onExit={handleConfirmExit} />
        </div>

        {/* On-screen controls on mobile */}
        {isMobile && !inGameMenuOpen ? (
          <MobileTouchControls
            pressDown={pressDown}
            pressUp={pressUp}
            onToggleMenu={toggleInGameMenu}
            gamepadConnected={gamepadConnected}
          />
        ) : null}
      </div>

      <PlayerFooter isFullscreen={isFullscreen || isMobile} />
    </motion.div>
  )
}
