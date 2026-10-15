"use client"

import { useCallback, useEffect, useRef } from "react"
import type { Nostalgist } from "nostalgist"
import { preventScreenSleep } from "@/lib/display/wake-lock"
import { ensureSafeResizeObserver } from "@/lib/display/safe-resize-observer"
import { getRetroArchCoreConfig, getRetroArchInputConfig } from "@/lib/gamepad/retroarch-gamepad-config"
import { applyCheatSession } from "@/lib/cheats/apply-cheat-session"
import type { AppliedCheat, EmulatorCheatControls } from "@/lib/cheats/emulator-cheats"
import type { Game } from "@/lib/games"
import { getCheatSession } from "@/lib/storage/cheat-storage"
import { loadGameState } from "@/lib/storage/save-state-storage"

type UseNostalgistOptions = {
  game: Game
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onPhaseChange: (phase: "loading" | "ready" | "error") => void
  reloadKey?: number
  isPaused?: boolean
  initialSlot?: number
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
  game, canvasRef, onPhaseChange, reloadKey = 0, isPaused = false, initialSlot,
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

  const pressDown = useCallback((action: string, player = 1) => {
    try { instanceRef.current?.pressDown?.({ button: action, player }) } catch {}
  }, [])

  const pressUp = useCallback((action: string, player = 1) => {
    try { instanceRef.current?.pressUp?.({ button: action, player }) } catch {}
  }, [])

  const loadCheats = useCallback(async (content: string) => {
    const emu = instanceRef.current
    if (!emu) return false
    try {
      return await emu.loadCheats(content)
    } catch {
      return false
    }
  }, [])

  const enableCheat = useCallback((index: number) => {
    try { return instanceRef.current?.enableCheat(index) ?? false } catch { return false }
  }, [])

  const disableCheat = useCallback((index: number) => {
    try { return instanceRef.current?.disableCheat(index) ?? false } catch { return false }
  }, [])

  const clearCheats = useCallback(() => {
    try { return instanceRef.current?.clearCheats() ?? false } catch { return false }
  }, [])

  const getCheats = useCallback((): AppliedCheat[] => {
    try { return instanceRef.current?.getCheats() ?? [] } catch { return [] }
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
    ensureSafeResizeObserver()
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

        const rom = game.customRom
          ? { fileName: game.file, fileContent: game.customRom }
          : new URL(
              `/api/rom?file=${encodeURIComponent(game.file)}`,
              window.location.origin,
            ).href

        const emulator = await Nostalgist.nes({
          rom,
          element: canvas,
          signal: controller.signal,
          cache: game.customRom ? { core: true, rom: false } : { core: true, rom: true },
          size: { width: 256 * scale, height: 240 * scale },
          style: { width: "100%", height: "100%", display: "block", backgroundColor: "black" },
          retroarchConfig: getRetroArchInputConfig(),
          retroarchCoreConfig: getRetroArchCoreConfig(),
          onLaunch(emu) {
            if (stoppedRef.current) return
            instanceRef.current = emu

            void (async () => {
              const saved = getCheatSession(game.file)
              if (saved && !stoppedRef.current) {
                const controls: EmulatorCheatControls = {
                  loadCheats: (content) => emu.loadCheats(content),
                  enableCheat: (index) => Boolean(emu.enableCheat(index)),
                  disableCheat: (index) => Boolean(emu.disableCheat(index)),
                  clearCheats: () => Boolean(emu.clearCheats()),
                  getCheats: () => emu.getCheats() ?? [],
                }
                try {
                  await applyCheatSession(controls, saved.text, saved.rows)
                } catch {}
              }
              if (stoppedRef.current) return

              if (initialSlot && !stoppedRef.current) {
                try {
                  const saveRecord = await loadGameState(game.file, initialSlot)
                  if (saveRecord?.stateBlob && !stoppedRef.current) {
                    await emu.loadState(saveRecord.stateBlob)
                  }
                } catch (err) {
                  console.error("Failed to load initial save state slot", initialSlot, err)
                }
              }
              if (stoppedRef.current) return

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
            })()
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
  }, [canvasRef, game.file, game.customRom, initialSlot, onPhaseChange, reloadKey, unload])

  return {
    pause, resume, saveState, loadState, unload, pressDown, pressUp,
    loadCheats, enableCheat, disableCheat, clearCheats, getCheats,
  }
}
