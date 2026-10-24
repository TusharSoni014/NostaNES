"use client"

import { useCallback, useEffect, useRef } from "react"
import type { Nostalgist } from "nostalgist"
import { preventScreenSleep } from "@/lib/display/wake-lock"
import { ensureSafeResizeObserver } from "@/lib/display/safe-resize-observer"
import { dispatchEmulatorKey } from "@/lib/emulator/emulator-key-events"
import { installFrameScheduler, type EmscriptenBrowser } from "@/lib/emulator/frame-scheduler"
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
  isMobile?: boolean
}

// Guarantee NES loader displays for at least one second
const MIN_LOADER_DURATION_MS = 1000

// The DOM key codes RetroArch derives from our keyboard map
// (getRetroArchInputConfig). Presses go straight to RetroArch's key handlers
// with these, so a press never reads the config from the WASM filesystem.
const EMULATOR_KEY_CODES: Record<1 | 2, Record<string, string>> = {
  1: {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    b: "KeyZ",
    a: "KeyX",
    y: "KeyA",
    x: "KeyS",
    start: "Enter",
    select: "ShiftLeft",
  },
  2: {
    up: "KeyI",
    down: "KeyK",
    left: "KeyJ",
    right: "KeyL",
    a: "KeyU",
    b: "KeyO",
    x: "NumpadAdd",
    y: "NumpadSubtract",
    start: "KeyH",
    select: "KeyN",
  },
}

function getEmscriptenBrowser(emu: Nostalgist): EmscriptenBrowser | null {
  try {
    const browser = (emu.getEmscripten() as { Browser?: EmscriptenBrowser | null }).Browser
    return browser ?? null
  } catch {
    return null
  }
}

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
  game, canvasRef, onPhaseChange, reloadKey = 0, isPaused = false, initialSlot, isMobile,
}: UseNostalgistOptions) {
  const instanceRef = useRef<Nostalgist | null>(null)
  const isPausedRef = useRef(Boolean(isPaused))

  useEffect(() => {
    isPausedRef.current = Boolean(isPaused)
  }, [isPaused])

  const activeButtonsRef = useRef<Set<string>>(new Set())
  // Disposes the requestAnimationFrame main-loop scheduler (see lib/emulator/frame-scheduler.ts).
  const disposeSchedulerRef = useRef<(() => void) | null>(null)

  const pause = () => {
    try {
      const emu = instanceRef.current
      if (!emu) return
      for (const key of activeButtonsRef.current) {
        const [playerStr, action] = key.split(":")
        const player = parseInt(playerStr, 10) || 1
        try {
          if (player === 1) emu.pressUp?.(action)
          else emu.pressUp?.({ button: action, player })
        } catch {}
      }
      activeButtonsRef.current.clear()
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
    const key = `${player}:${action}`
    if (activeButtonsRef.current.has(key)) return
    activeButtonsRef.current.add(key)
    try {
      const emu = instanceRef.current
      if (!emu) return
      const slot = player === 2 ? 2 : 1
      const code = EMULATOR_KEY_CODES[slot][action]
      if (code && dispatchEmulatorKey(emu, "keydown", code, canvasRef.current)) return
      if (player === 1) emu.pressDown?.(action)
      else emu.pressDown?.({ button: action, player })
    } catch {}
  }, [canvasRef])

  const pressUp = useCallback((action: string, player = 1) => {
    const key = `${player}:${action}`
    if (!activeButtonsRef.current.has(key)) return
    activeButtonsRef.current.delete(key)
    try {
      const emu = instanceRef.current
      if (!emu) return
      const slot = player === 2 ? 2 : 1
      const code = EMULATOR_KEY_CODES[slot][action]
      if (code && dispatchEmulatorKey(emu, "keyup", code, canvasRef.current)) return
      if (player === 1) emu.pressUp?.(action)
      else emu.pressUp?.({ button: action, player })
    } catch {}
  }, [canvasRef])

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
      for (const key of activeButtonsRef.current) {
        const [playerStr, action] = key.split(":")
        const player = parseInt(playerStr, 10) || 1
        try {
          if (player === 1) emu.pressUp?.(action)
          else emu.pressUp?.({ button: action, player })
        } catch {}
      }
      activeButtonsRef.current.clear()
      setAudioContextState(emu, "close")
      try {
        emu.exit({ removeCanvas: false })
      } catch {}
      instanceRef.current = null
    }
    // After exit: Emscripten has cancelled its main loop, so nothing re-schedules it.
    disposeSchedulerRef.current?.()
    disposeSchedulerRef.current = null
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

    const isMobileDevice = Boolean(
      isMobile ??
      (typeof window !== "undefined" &&
        (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768))
    )

    const rect = frame.getBoundingClientRect()
    const scale = Math.max(
      1,
      Math.floor(Math.min((rect.width || 768) / 256, (rect.height || 576) / 240)),
    )
    // On mobile devices, native 256x240 lets hardware GPU scale crisply at minimum VRAM & fill-rate
    const effectiveScale = isMobileDevice ? 1 : scale

    const handleFirstTouch = () => {
      if (instanceRef.current) {
        setAudioContextState(instanceRef.current, "resume")
      }
    }
    window.addEventListener("pointerdown", handleFirstTouch, { once: true, passive: true })

    const ensureFrameScheduler = (emu: Nostalgist) => {
      if (disposeSchedulerRef.current) return
      disposeSchedulerRef.current = installFrameScheduler(getEmscriptenBrowser(emu))
    }

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
          size: { width: 256 * effectiveScale, height: 240 * effectiveScale },
          style: { width: "100%", height: "100%", display: "block", backgroundColor: "black" },
          retroarchConfig: getRetroArchInputConfig(isMobileDevice),
          retroarchCoreConfig: getRetroArchCoreConfig(isMobileDevice),
          // Runs after the core is instantiated and before its main loop starts, so the
          // very first iteration is already scheduled from requestAnimationFrame.
          beforeLaunch(emu) {
            if (stoppedRef.current) return
            ensureFrameScheduler(emu)
          },
          onLaunch(emu) {
            if (stoppedRef.current) return
            instanceRef.current = emu
            ensureFrameScheduler(emu)

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
                  // Pay the first-call cost of the input path and audio resume now,
                  // behind the loader, instead of on the player's first tap.
                  // Down and up inside one task, so the core never polls the key as held.
                  for (const code of ["KeyZ", "ArrowLeft", "Enter"]) {
                    dispatchEmulatorKey(emu, "keydown", code, canvas)
                    dispatchEmulatorKey(emu, "keyup", code, canvas)
                  }
                  setAudioContextState(emu, "resume")
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
          disposeSchedulerRef.current?.()
          disposeSchedulerRef.current = null
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
      window.removeEventListener("pointerdown", handleFirstTouch)
      unload()
    }
  }, [canvasRef, game.file, game.customRom, initialSlot, isMobile, onPhaseChange, reloadKey, unload])

  return {
    pause, resume, saveState, loadState, unload, pressDown, pressUp,
    loadCheats, enableCheat, disableCheat, clearCheats, getCheats,
  }
}
