"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Nostalgist } from "nostalgist"
import { ExitConfirmDialog } from "@/components/exit-confirm-dialog"
import { PlayerFooter } from "@/components/player/player-footer"
import { PlayerHeader } from "@/components/player/player-header"
import { PlayerOverlay } from "@/components/player/player-overlay"
import { preventScreenSleep } from "@/lib/display/wake-lock"
import { GamepadDispatcher } from "@/lib/gamepad/gamepad-dispatcher"
import { getRetroArchInputConfig } from "@/lib/gamepad/retroarch-gamepad-config"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import type { Game } from "@/lib/games"

type PlayerStageProps = {
  game: Game
  onExit: () => void
}

export const PlayerStage = ({ game, onExit }: PlayerStageProps) => {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const instanceRef = useRef<Nostalgist | null>(null)

  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [confirmingExit, setConfirmingExit] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange)
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
    setCountdown(5)
    try {
      instanceRef.current?.pause?.()
    } catch {
      // Graceful fallback
    }
  }, [])

  const handleResume = useCallback(() => {
    setConfirmingExit(false)
    try {
      instanceRef.current?.resume?.()
    } catch {
      // Graceful fallback
    }
  }, [])

  const handleConfirmExit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    onExit()
  }, [onExit])

  // 5-second countdown timer effect
  useEffect(() => {
    if (!confirmingExit) return

    const startTime = performance.now()
    const totalMs = 5000

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime
      const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000))
      setCountdown(remaining)

      if (elapsed >= totalMs) {
        clearInterval(interval)
        handleConfirmExit()
      }
    }, 250)

    return () => clearInterval(interval)
  }, [confirmingExit, handleConfirmExit])

  // Keyboard controls
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        if (confirmingExit) handleResume()
        else handleRequestExit()
      } else if ((event.key === "f" || event.key === "F") && !confirmingExit) {
        if (event.target instanceof HTMLElement && event.target.closest("input, textarea")) {
          return
        }
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

  // Gamepad dispatcher for UI actions (Exit timer confirmation, Fullscreen, Menu)
  useEffect(() => {
    const dispatcher = new GamepadDispatcher((action) => {
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
    })

    dispatcher.start()
    return () => dispatcher.stop()
  }, [])

  // Emulator lifecycle
  useEffect(() => {
    const canvas = canvasRef.current
    const frame = canvas?.parentElement
    if (!canvas || !frame) return

    const controller = new AbortController()
    let stopped = false
    const cancelWakeLock = preventScreenSleep()

    const rect = frame.getBoundingClientRect()
    const scale = Math.max(1, Math.floor(Math.min((rect.width || 768) / 256, (rect.height || 576) / 240)))

    ;(async () => {
      try {
        const { Nostalgist } = await import("nostalgist")
        if (stopped) return

        const rom = new URL(`/api/rom?file=${encodeURIComponent(game.file)}`, window.location.origin).href

        const emulator = await Nostalgist.nes({
          rom,
          element: canvas,
          signal: controller.signal,
          cache: { core: true, rom: true },
          size: { width: 256 * scale, height: 240 * scale },
          style: { width: "100%", height: "100%", display: "block", backgroundColor: "black" },
          retroarchConfig: getRetroArchInputConfig(),
          onLaunch() {
            if (!stopped) {
              setPhase("ready")
              canvas.focus()
            }
          },
        })

        if (stopped) {
          emulator.exit({ removeCanvas: false })
          return
        }
        instanceRef.current = emulator
      } catch (error) {
        if (!stopped && !controller.signal.aborted) {
          console.error(error)
          setPhase("error")
        }
      }
    })()

    return () => {
      stopped = true
      cancelWakeLock()
      controller.abort()
      instanceRef.current?.exit({ removeCanvas: false })
      instanceRef.current = null
    }
  }, [game.file])

  return (
    <motion.div
      ref={stageRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("fixed inset-0 z-40 flex flex-col bg-black/90 backdrop-blur-2xl", isFullscreen && "bg-black")}
    >
      <ExitConfirmDialog
        open={confirmingExit}
        countdown={countdown}
        totalDuration={5}
        onResume={handleResume}
        onConfirmExit={handleConfirmExit}
      />

      <PlayerHeader
        title={game.title}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onRequestExit={handleRequestExit}
      />

      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ scale: 0.45, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.6, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 180, damping: 24, mass: 0.9 }}
          className={cn(
            "relative aspect-[4/3] w-full max-w-[min(100%,calc((100dvh-10rem)*4/3))] overflow-hidden rounded-2xl bg-black shadow-[0_40px_100px_rgba(0,0,0,0.95)] ring-1 ring-foreground/20",
            isFullscreen && "max-w-none h-full max-h-screen rounded-none ring-0 shadow-none",
          )}
        >
          <canvas
            ref={canvasRef}
            tabIndex={-1}
            className="size-full [image-rendering:pixelated] outline-none"
            aria-label={`${game.title} display`}
          />
          <PlayerOverlay game={game} phase={phase} onExit={handleConfirmExit} />
        </motion.div>
      </div>

      <PlayerFooter isFullscreen={isFullscreen} />
    </motion.div>
  )
}
