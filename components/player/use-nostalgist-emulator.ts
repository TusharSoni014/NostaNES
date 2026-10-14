"use client"

import { useCallback, useEffect, useRef } from "react"
import type { Nostalgist } from "nostalgist"
import { preventScreenSleep } from "@/lib/display/wake-lock"
import {
  getRetroArchCoreConfig,
  getRetroArchInputConfig,
} from "@/lib/gamepad/retroarch-gamepad-config"
import type { Game } from "@/lib/games"

type UseNostalgistOptions = {
  game: Game
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onPhaseChange: (phase: "loading" | "ready" | "error") => void
  reloadKey?: number
  isPaused?: boolean
}

// Guarantee NES loader displays for at least one second
const MIN_LOADER_DURATION_MS = 1000

function setAudioContextState(emu: Nostalgist | null, state: "suspend" | "resume" | "close") {
  if (!emu) return
  try {
    const target = emu as unknown as {
      getEmscriptenAL?: () => { currentCtx?: { audioCtx?: AudioContext } }
      getEmscriptenModule?: () => { SDL2?: { audio?: { audioCtx?: AudioContext } } }
    }
    const alP = target.getEmscriptenAL?.()?.currentCtx?.audioCtx?.[state]?.()
    if (alP && typeof alP.catch === "function") alP.catch(() => {})
    const sdlP = target.getEmscriptenModule?.()?.SDL2?.audio?.audioCtx?.[state]?.()
    if (sdlP && typeof sdlP.catch === "function") sdlP.catch(() => {})
  } catch {}
}

export function useNostalgistEmulator({
  game, canvasRef, onPhaseChange, reloadKey = 0, isPaused = false,
}: UseNostalgistOptions) {
  const instanceRef = useRef<Nostalgist | null>(null)
  const isPausedRef = useRef(Boolean(isPaused))

  useEffect(() => {
    isPausedRef.current = Boolean(isPaused)
  }, [isPaused])

  const pause = () => {
    try {
      const emu = instanceRef.current
      if (!emu) return
      if (emu.getStatus?.() === "running") emu.pause()
      else emu.pause?.()
      setAudioContextState(emu, "suspend")
    } catch {}
  }

  const resume = () => {
    try {
      const emu = instanceRef.current
      if (!emu) return
      setAudioContextState(emu, "resume")
      if (emu.getStatus?.() === "paused") emu.resume()
      else emu.resume?.()
    } catch {}
  }

  const saveState = async (): Promise<Blob | null> => {
    if (!instanceRef.current) return null
    try {
      const result = await instanceRef.current.saveState()
      return result.state
    } catch {
      return null
    }
  }

  const loadState = async (blob: Blob): Promise<boolean> => {
    if (!instanceRef.current) return false
    try {
      await instanceRef.current.loadState(blob)
      return true
    } catch {
      return false
    }
  }

  const pressDown = useCallback((action: string) => {
    try { instanceRef.current?.pressDown?.(action as any) } catch {}
  }, [])

  const pressUp = useCallback((action: string) => {
    try { instanceRef.current?.pressUp?.(action as any) } catch {}
  }, [])

  const controllerRef = useRef<AbortController | null>(null)
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelWakeLockRef = useRef<(() => void) | null>(null)
  const stoppedRef = useRef(false)

  const unload = useCallback(() => {
    stoppedRef.current = true
    if (readyTimerRef.current) clearTimeout(readyTimerRef.current)
    if (cancelWakeLockRef.current) cancelWakeLockRef.current()
    if (controllerRef.current) controllerRef.current.abort()
    const emu = instanceRef.current
    if (emu) {
      setAudioContextState(emu, "close")
      try {
        emu.exit({ removeCanvas: false })
      } catch {}
      instanceRef.current = null
    }
  }, [])

  useEffect(() => {
    onPhaseChange("loading")
    const canvas = canvasRef.current
    const frame = canvas?.parentElement
    if (!canvas || !frame) return

    stoppedRef.current = false
    const controller = new AbortController()
    controllerRef.current = controller
    cancelWakeLockRef.current = preventScreenSleep()
    const loadStartTime = performance.now()

    const rect = frame.getBoundingClientRect()
    const scale = Math.max(
      1,
      Math.floor(Math.min((rect.width || 768) / 256, (rect.height || 576) / 240)),
    )

    ;(async () => {
      try {
        const { Nostalgist } = await import("nostalgist")
        if (stoppedRef.current) return

        const rom = new URL(
          `/api/rom?file=${encodeURIComponent(game.file)}`,
          window.location.origin,
        ).href

        const emulator = await Nostalgist.nes({
          rom,
          element: canvas,
          signal: controller.signal,
          cache: { core: true, rom: true },
          size: { width: 256 * scale, height: 240 * scale },
          style: { width: "100%", height: "100%", display: "block", backgroundColor: "black" },
          retroarchConfig: getRetroArchInputConfig(),
          retroarchCoreConfig: getRetroArchCoreConfig(),
          onLaunch(emu) {
            if (stoppedRef.current) return
            instanceRef.current = emu

            if (isPausedRef.current) {
              try {
                emu.pause()
                setAudioContextState(emu, "suspend")
              } catch {}
            }

            const isInitial = reloadKey === 0
            const elapsed = performance.now() - loadStartTime
            const delayRemaining = isInitial ? Math.max(0, MIN_LOADER_DURATION_MS - elapsed) : 0

            readyTimerRef.current = setTimeout(() => {
              if (!stoppedRef.current) {
                onPhaseChange("ready")
                if (!isPausedRef.current) canvas.focus()
              }
            }, delayRemaining)
          },
        })

        if (stoppedRef.current) {
          setAudioContextState(emulator, "close")
          try {
            emulator.exit({ removeCanvas: false })
          } catch {}
          return
        }
        instanceRef.current = emulator
      } catch (error) {
        if (!stoppedRef.current && !controller.signal.aborted) {
          console.error(error)
          onPhaseChange("error")
        }
      }
    })()

    return () => {
      unload()
    }
  }, [canvasRef, game.file, onPhaseChange, reloadKey, unload])

  return { pause, resume, saveState, loadState, unload, pressDown, pressUp }
}
