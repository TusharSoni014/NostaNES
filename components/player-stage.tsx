"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ExitConfirmDialog } from "@/components/exit-confirm-dialog"
import { HoldActionHud, type ActiveHold } from "@/components/player/hold-action-hud"
import { InGameMenu } from "@/components/player/in-game-menu/in-game-menu"
import { PlayerFooter } from "@/components/player/player-footer"
import { PlayerHeader } from "@/components/player/player-header"
import { PlayerNotice, type PlayerNoticeData, type PlayerNoticeInput } from "@/components/player/player-notice"
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
import { clampGameSpeed } from "@/lib/emulator/game-speed"
import { QUICK_SAVE_SLOT } from "@/lib/storage/save-state-storage"
import { motion } from "motion/react"
import { playUiSound } from "@/lib/ui-sounds"
import {
  getActiveFullscreenElement,
  requestAppFullscreen,
  exitAppFullscreen,
  subscribeFullscreenChange,
} from "@/lib/display/fullscreen"
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
  const isMobilePortrait = isMobile && isPortrait
  const { connected: gamepadConnected } = useGamepadStatus()

  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(getActiveFullscreenElement()))
  const [confirmingExit, setConfirmingExit] = useState(false)
  const [inGameMenuOpen, setInGameMenuOpen] = useState(false)
  const [activeShader, setActiveShader] = useState<GameShader>(getSavedShader)
  const [romKey, setRomKey] = useState(0)
  const [hold, setHold] = useState<ActiveHold | null>(null)
  const [speed, setSpeed] = useState(1)
  const speedRef = useRef(1)
  const [notice, setNotice] = useState<PlayerNoticeData | null>(null)
  const noticeIdRef = useRef(0)
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showNotice = useCallback((data: PlayerNoticeInput) => {
    noticeIdRef.current += 1
    setNotice({ ...data, id: noticeIdRef.current })
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    // A pending notice stays up until its result replaces it; the timeout is only a backstop.
    noticeTimerRef.current = setTimeout(() => setNotice(null), data.kind === "pending" ? 10000 : 1400)
  }, [])

  useEffect(() => () => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
  }, [])

  const handleSelectSpeed = useCallback((next: number, { announce = true } = {}) => {
    const clamped = clampGameSpeed(next)
    speedRef.current = clamped
    setSpeed(clamped)
    if (announce) showNotice({ kind: "speed", speed: clamped })
  }, [showNotice])

  const changeSpeedBy = useCallback((delta: number) => {
    handleSelectSpeed(speedRef.current + delta)
  }, [handleSelectSpeed])

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
    isMobile,
    speed,
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

  const quickStateBusyRef = useRef(false)

  const quickSave = useCallback(async () => {
    if (quickStateBusyRef.current) return
    quickStateBusyRef.current = true
    showNotice({ kind: "pending", text: "Quick saving…" })
    try {
      const saved = await handleSaveState(QUICK_SAVE_SLOT)
      playUiSound(saved ? "game_start" : "error")
      showNotice(saved ? { kind: "success", text: "Quick saved" } : { kind: "error", text: "Quick save failed" })
    } finally {
      quickStateBusyRef.current = false
    }
  }, [handleSaveState, showNotice])

  const quickLoad = useCallback(async () => {
    if (quickStateBusyRef.current) return
    quickStateBusyRef.current = true
    showNotice({ kind: "pending", text: "Quick loading…" })
    try {
      const result = await handleLoadState(QUICK_SAVE_SLOT)
      playUiSound(result === "loaded" ? "game_start" : "error")
      showNotice(
        result === "loaded"
          ? { kind: "success", text: "Quick save loaded" }
          : { kind: "error", text: result === "empty" ? "No quick save yet" : "Quick load failed" },
      )
    } finally {
      quickStateBusyRef.current = false
    }
  }, [handleLoadState, showNotice])

  const handleResetGame = useCallback(() => {
    setInGameMenuOpen(false)
    setPhase("loading")
    setRomKey((prev) => prev + 1)
    playUiSound("game_start")
  }, [])

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }
    window.addEventListener("contextmenu", handleContextMenu, { capture: true })
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true })
    }
  }, [])

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(getActiveFullscreenElement()))
    const unsubscribe = subscribeFullscreenChange(onFs)

    // Automatically enter fullscreen on phone & desktop when game starts if not already active
    if (!getActiveFullscreenElement()) {
      void requestAppFullscreen(
        stageRef.current ?? (typeof document !== "undefined" ? document.documentElement : null),
      )
    }

    return () => {
      unsubscribe()
      if (getActiveFullscreenElement()) {
        void exitAppFullscreen()
      }
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!getActiveFullscreenElement()) {
      void requestAppFullscreen(
        stageRef.current ?? (typeof document !== "undefined" ? document.documentElement : null),
      )
    } else {
      void exitAppFullscreen()
    }
  }, [])

  const [isCustomizingTouch, setIsCustomizingTouch] = useState(false)

  const openInGameMenu = useCallback(() => {
    setIsCustomizingTouch(false)
    pause()
    playUiSound("game_paused")
    setInGameMenuOpen(true)
  }, [pause])

  const closeInGameMenu = useCallback(() => {
    setInGameMenuOpen(false)
    resume()
    playUiSound("back_cancel")
  }, [resume])

  const handleOpenTouchLayout = useCallback(() => {
    setInGameMenuOpen(false)
    resume()
    setIsCustomizingTouch(true)
    playUiSound("option_selected")
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
    setIsCustomizingTouch(false)
    setInGameMenuOpen(false)
    setConfirmingExit(false)
    if (getActiveFullscreenElement()) {
      void exitAppFullscreen()
    }
    playUiSound("navigation")
    onExit()
  }, [unload, onExit])

  usePlayerInput({
    shortcutsEnabled: phase === "ready",
    inGameMenuOpen, confirmingExit, toggleInGameMenu, handleResume,
    handleRequestExit, handleConfirmExit, toggleFullscreen, setHold,
    changeSpeedBy,
    quickSave: () => void quickSave(),
    quickLoad: () => void quickLoad(),
  })

  return (
    <motion.div
      ref={stageRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 z-40 flex flex-col bg-black w-screen h-dvh select-none overflow-hidden touch-none"
    >
      <PlayerNotice notice={hold ? null : notice} />
      <HoldActionHud hold={hold} />
      <ExitConfirmDialog open={confirmingExit} onResume={handleResume} onConfirmExit={handleConfirmExit} />

      <InGameMenu
        key={inGameMenuOpen ? "open" : "closed"}
        open={inGameMenuOpen}
        game={game}
        onResume={handleResume}
        onRequestExit={handleConfirmExit}
        onResetGame={handleResetGame}
        onSaveState={handleSaveState}
        onLoadState={async (slot) => (await handleLoadState(slot)) === "loaded"}
        speed={speed}
        onSelectSpeed={(next) => handleSelectSpeed(next, { announce: false })}
        activeShader={activeShader}
        onSelectShader={handleSelectShader}
        cheats={{ loadCheats, enableCheat, disableCheat, clearCheats, getCheats }}
        onOpenTouchLayout={handleOpenTouchLayout}
      />

      <PlayerHeader
        title={game.title}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onRequestExit={handleRequestExit}
        isMobile={isMobile}
        onToggleMenu={toggleInGameMenu}
      />

      {/* Game Stage: Unrounded, zero-lag, arcade CRT 4:3 display */}
      <div
        className={cn(
          "relative flex w-full items-center justify-center p-0 bg-black overflow-hidden",
          isMobilePortrait
            ? "shrink-0 pt-[env(safe-area-inset-top,0px)]"
            : "min-h-0 flex-1 [container-type:size]",
        )}
      >
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden bg-black flex items-center justify-center",
            isMobilePortrait
              ? "w-full max-w-md border-b border-zinc-900"
              : "max-w-full max-h-full",
          )}
          style={
            isMobilePortrait
              ? {
                  width: "100%",
                  maxHeight: "45dvh",
                }
              : {
                  width: "min(100cqw, calc(100cqh * 4 / 3))",
                  height: "min(100cqh, calc(100cqw * 3 / 4))",
                }
          }
        >
          <canvas
            key={romKey}
            ref={canvasRef}
            tabIndex={-1}
            aria-label={`${game.title} display`}
            className={cn(
              "size-full outline-none",
              activeShader === "smooth"
                ? "[image-rendering:auto]"
                : "[image-rendering:pixelated]",
            )}
          />
          <ShaderOverlay shader={activeShader} />
          <PlayerOverlay game={game} phase={phase} onExit={handleConfirmExit} />
        </div>

        {/* On-screen controls on mobile landscape */}
        {!isMobilePortrait && isMobile && !inGameMenuOpen ? (
          <MobileTouchControls
            game={game}
            pressDown={pressDown}
            pressUp={pressUp}
            onToggleMenu={toggleInGameMenu}
            gamepadConnected={gamepadConnected}
            isPortrait={false}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isCustomizing={isCustomizingTouch}
            onDoneCustomizing={() => setIsCustomizingTouch(false)}
          />
        ) : null}
      </div>

      {/* On-screen controls on mobile portrait: Strictly BELOW the game screen. No intersection! */}
      {isMobilePortrait && !inGameMenuOpen ? (
        <div className="relative flex min-h-0 flex-1 w-full bg-zinc-950">
          <MobileTouchControls
            game={game}
            pressDown={pressDown}
            pressUp={pressUp}
            onToggleMenu={toggleInGameMenu}
            gamepadConnected={gamepadConnected}
            isPortrait={true}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isCustomizing={isCustomizingTouch}
            onDoneCustomizing={() => setIsCustomizingTouch(false)}
          />
        </div>
      ) : null}

      <PlayerFooter isFullscreen={isFullscreen || isMobile} />
    </motion.div>
  )
}
