"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { getBootAudio, preloadUiSounds } from "@/lib/ui-sounds"

const BOOT_MS = 5000
const SOUND_TAIL_MS = 2000
const MIN_LOADER_MS = 1400
const FALLBACK_SOUND_MS = 3832

type BootPhase = "loader" | "logo" | "exit"

type BootScreenProps = {
  shaderReady: boolean
  onReveal: () => void
  onHidden: () => void
}

const ease = [0.16, 1, 0.3, 1] as const

export const BootScreen = ({
  shaderReady,
  onReveal,
  onHidden,
}: BootScreenProps) => {
  const [phase, setPhase] = useState<BootPhase>("loader")
  const reduce = useReducedMotion()
  const onRevealRef = useRef(onReveal)
  const onHiddenRef = useRef(onHidden)
  const startedRef = useRef(0)

  useEffect(() => {
    onRevealRef.current = onReveal
  }, [onReveal])

  useEffect(() => {
    onHiddenRef.current = onHidden
  }, [onHidden])

  useEffect(() => {
    startedRef.current = performance.now()
    preloadUiSounds()
  }, [])

  useEffect(() => {
    if (!shaderReady) return

    let cancelled = false
    let scheduled = false
    const timers: number[] = []
    const later = (delay: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, Math.max(0, delay)))
    }

    const started = startedRef.current || performance.now()

    if (reduce) {
      later(240, () => {
        if (cancelled) return
        setPhase("exit")
        onRevealRef.current()
        onHiddenRef.current()
      })
      return () => {
        cancelled = true
        for (const timer of timers) window.clearTimeout(timer)
      }
    }

    const audio = getBootAudio()
    let retryBoot: (() => void) | null = null

    const schedule = (durationMs: number) => {
      if (cancelled || scheduled) return
      scheduled = true

      const elapsed = performance.now() - started
      const logoAt = Math.max(elapsed, MIN_LOADER_MS)
      const tail = Math.min(SOUND_TAIL_MS, durationMs)
      const lead = Math.max(0, durationMs - tail)
      // Keep the splash up for 5s, and start the sting so its last 2s
      // sit on top of the shelf as it scales in.
      const soundAt = Math.max(logoAt, BOOT_MS - lead)
      const revealAt = Math.max(BOOT_MS, soundAt + lead)

      later(logoAt - elapsed, () => {
        if (!cancelled) setPhase("logo")
      })

      const soundDelay = soundAt - elapsed
      later(soundDelay, () => {
        if (cancelled) return
        audio.currentTime = 0
        const pending = audio.play()
        if (!pending) return
        void pending.catch(() => {
          if (cancelled) return
          retryBoot = () => {
            audio.currentTime = 0
            void audio.play().catch(() => {})
          }
          window.addEventListener("pointerdown", retryBoot, { once: true })
          window.addEventListener("keydown", retryBoot, { once: true })
        })
      })

      later(revealAt - elapsed, () => {
        if (cancelled) return
        setPhase("exit")
        onRevealRef.current()
      })

      later(revealAt - elapsed + 780, () => {
        if (!cancelled) onHiddenRef.current()
      })
    }

    const readDuration = () => {
      const durationMs =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration * 1000
          : FALLBACK_SOUND_MS
      schedule(durationMs)
    }

    if (audio.readyState >= 1) readDuration()
    else {
      audio.addEventListener("loadedmetadata", readDuration, { once: true })
      later(600, readDuration)
    }

    return () => {
      cancelled = true
      audio.removeEventListener("loadedmetadata", readDuration)
      if (retryBoot) {
        window.removeEventListener("pointerdown", retryBoot)
        window.removeEventListener("keydown", retryBoot)
      }
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [reduce, shaderReady])

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center ${
        phase === "exit" ? "pointer-events-none" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label={
        phase === "loader"
          ? "Loading NostaNES"
          : "NostaNES, online open source emulator"
      }
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0c4f93_0%,#08386e_38%,#041833_78%)] transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ opacity: phase === "loader" ? 1 : 0 }}
      />

      <div className="relative z-10 grid min-h-72 w-full place-items-center">
        <AnimatePresence>
          {phase === "loader" ? <BootLoader key="loader" /> : null}
          {phase === "logo" ? <BootLogo key="logo" /> : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

const BootLoader = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.96 }}
    transition={{ duration: 0.45, ease }}
    className="col-start-1 row-start-1 flex flex-col items-center gap-5"
  >
    <div className="relative size-16">
      <div className="absolute inset-0 rounded-full border border-white/15" />
      <div
        className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-sky-100 border-r-sky-300/50"
        style={{ animationDuration: "1.05s" }}
      />
      <div
        className="absolute inset-[7px] animate-spin rounded-full border-2 border-transparent border-b-white/80"
        style={{ animationDuration: "0.72s", animationDirection: "reverse" }}
      />
    </div>
    <p className="font-mono text-[11px] tracking-[0.32em] text-sky-100/80 uppercase">
      Loading
    </p>
  </motion.div>
)

const BootLogo = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.88, y: 18 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 1.04, y: -10 }}
    transition={{ duration: 0.72, ease }}
    className="col-start-1 row-start-1 flex flex-col items-center gap-5 px-6 text-center"
  >
    <Image
      src="/nostanes.png"
      alt=""
      width={220}
      height={220}
      priority
      className="h-32 w-auto object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)] select-none sm:h-36"
    />
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.16, ease }}
      className="flex flex-col items-center gap-1.5"
    >
      <h1 className="text-3xl font-semibold tracking-[0.22em] text-white sm:text-4xl">
        NostaNES
      </h1>
      <p className="text-sm tracking-[0.16em] text-sky-100/75 lowercase">
        online open source emulator
      </p>
    </motion.div>
  </motion.div>
)
