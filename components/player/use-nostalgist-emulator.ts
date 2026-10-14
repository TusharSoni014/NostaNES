"use client"

import { useEffect, useRef } from "react"
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
}

// Guarantee NES loader displays for at least one second
const MIN_LOADER_DURATION_MS = 1000

function setAudioContextState(emu: Nostalgist | null, state: "suspend" | "resume" | "close") {
  if (!emu) return
  try {
    const al = (emu as unknown as { getEmscriptenAL?: () => { currentCtx?: { audioCtx?: AudioContext } } }).getEmscriptenAL?.()
    al?.currentCtx?.audioCtx?.[state]?.()
  } catch {}
  try {
    const mod = (emu as unknown as { getEmscriptenModule?: () => { SDL2?: { audio?: { audioCtx?: AudioContext } } } }).getEmscriptenModule?.()
    mod?.SDL2?.audio?.audioCtx?.[state]?.()
  } catch {}
}

export function useNostalgistEmulator({
  game,
  canvasRef,
  onPhaseChange,
  reloadKey = 0,
}: UseNostalgistOptions) {
  const instanceRef = useRef<Nostalgist | null>(null)

  const pause = () => {
    try {
      const emu = instanceRef.current
      if (!emu) return
      if (emu.getStatus?.() === "running") emu.pause()
      else emu.pause?.()
      setAudioContextState(emu, "suspend")
    } catch (err) {
      console.error("Failed to pause emulator:", err)
    }
  }

  const resume = () => {
    try {
      const emu = instanceRef.current
      if (!emu) return
      setAudioContextState(emu, "resume")
      if (emu.getStatus?.() === "paused") emu.resume()
      else emu.resume?.()
    } catch (err) {
      console.error("Failed to resume emulator:", err)
    }
  }

  const saveState = async (): Promise<Blob | null> => {
    if (!instanceRef.current) return null
    try {
      const result = await instanceRef.current.saveState()
      return result.state
    } catch (err) {
      console.error("Failed to save state:", err)
      return null
    }
  }

  const loadState = async (blob: Blob): Promise<boolean> => {
    if (!instanceRef.current) return false
    try {
      await instanceRef.current.loadState(blob)
      return true
    } catch (err) {
      console.error("Failed to load state:", err)
      return false
    }
  }

  useEffect(() => {
    onPhaseChange("loading")
    const canvas = canvasRef.current
    const frame = canvas?.parentElement
    if (!canvas || !frame) return

    const controller = new AbortController()
    let stopped = false
    let readyTimer: ReturnType<typeof setTimeout> | null = null
    const cancelWakeLock = preventScreenSleep()
    const loadStartTime = performance.now()

    const rect = frame.getBoundingClientRect()
    const scale = Math.max(
      1,
      Math.floor(Math.min((rect.width || 768) / 256, (rect.height || 576) / 240)),
    )

    ;(async () => {
      try {
        const { Nostalgist } = await import("nostalgist")
        if (stopped) return

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
          style: {
            width: "100%",
            height: "100%",
            display: "block",
            backgroundColor: "black",
          },
          retroarchConfig: getRetroArchInputConfig(),
          retroarchCoreConfig: getRetroArchCoreConfig(),
          onLaunch() {
            if (stopped) return

            // Even when the game is already loaded/cached, keep loader visible for at least 1s
            const elapsed = performance.now() - loadStartTime
            const delayRemaining = Math.max(0, MIN_LOADER_DURATION_MS - elapsed)

            readyTimer = setTimeout(() => {
              if (!stopped) {
                onPhaseChange("ready")
                canvas.focus()
              }
            }, delayRemaining)
          },
        })

        if (stopped) {
          setAudioContextState(emulator, "close")
          try {
            emulator.exit()
          } catch {}
          return
        }
        instanceRef.current = emulator
      } catch (error) {
        if (!stopped && !controller.signal.aborted) {
          console.error(error)
          onPhaseChange("error")
        }
      }
    })()

    return () => {
      stopped = true
      if (readyTimer) clearTimeout(readyTimer)
      cancelWakeLock()
      controller.abort()
      const emu = instanceRef.current
      if (emu) {
        setAudioContextState(emu, "close")
        try {
          emu.exit()
        } catch {}
        instanceRef.current = null
      }
    }
  }, [canvasRef, game.file, onPhaseChange, reloadKey])

  return { pause, resume, saveState, loadState }
}
