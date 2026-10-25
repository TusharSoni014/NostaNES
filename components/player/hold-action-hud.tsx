"use client"

import { useEffect, useState } from "react"
import { DownloadIcon, LogOutIcon, UploadIcon } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

export type HoldAction = "exit" | "quick-save" | "quick-load"

export type ActiveHold = {
  action: HoldAction
  /** Hold start on the performance.now() clock. */
  startedAt: number
  durationMs: number
  /** The key or button being held, as shown to the player. */
  inputLabel: string
}

type HoldActionHudProps = {
  hold: ActiveHold | null
}

const RING_RADIUS = 18
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const HOLD_COPY: Record<HoldAction, { title: string; hint: string; color: string; textClass: string }> = {
  exit: { title: "to Exit", hint: "Release to continue playing", color: "#EF4444", textClass: "text-red-400" },
  "quick-save": { title: "to Quick Save", hint: "Release to cancel", color: "#3B82F6", textClass: "text-blue-400" },
  "quick-load": { title: "to Quick Load", hint: "Release to cancel", color: "#F59E0B", textClass: "text-amber-400" },
}

const HOLD_ICONS = { exit: LogOutIcon, "quick-save": DownloadIcon, "quick-load": UploadIcon } as const

function remainingSecondsAt(hold: ActiveHold, now: number) {
  return Math.max(0, Math.ceil((hold.startedAt + hold.durationMs - now) / 1000))
}

function CountdownLabel({ hold }: { hold: ActiveHold }) {
  const [seconds, setSeconds] = useState(() => remainingSecondsAt(hold, performance.now()))

  useEffect(() => {
    const id = window.setInterval(() => setSeconds(remainingSecondsAt(hold, performance.now())), 100)
    return () => window.clearInterval(id)
  }, [hold])

  return <span className="font-mono text-xs font-bold text-white">{seconds}s</span>
}

/**
 * The ring is animated on its own clock from the hold's start time, so it fills
 * smoothly without the input loop re-rendering the player every frame.
 */
function HoldRing({ hold }: { hold: ActiveHold }) {
  const [initialProgress] = useState(() =>
    Math.max(0, Math.min(1, (performance.now() - hold.startedAt) / hold.durationMs)),
  )
  const remainingMs = hold.durationMs * (1 - initialProgress)
  const Icon = HOLD_ICONS[hold.action]

  return (
    <div className="relative flex size-10 shrink-0 items-center justify-center">
      <svg className="size-full -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-white/15"
        />
        <motion.circle
          cx="22"
          cy="22"
          r={RING_RADIUS}
          fill="none"
          stroke={HOLD_COPY[hold.action].color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          initial={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - initialProgress) }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: remainingMs / 1000, ease: "linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {hold.action === "exit" ? (
          <CountdownLabel hold={hold} />
        ) : (
          <Icon className={cn("size-3.5", HOLD_COPY[hold.action].textClass)} />
        )}
      </div>
    </div>
  )
}

export const HoldActionHud = ({ hold }: HoldActionHudProps) => {
  return (
    <AnimatePresence>
      {hold ? (
        <motion.div
          key={`${hold.action}-${hold.startedAt}`}
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-none absolute top-6 inset-x-0 z-50 flex justify-center px-4"
        >
          <div className="flex items-center gap-3.5 rounded-2xl border border-white/20 bg-zinc-950/90 px-4 py-2.5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl ring-1 ring-white/10">
            <HoldRing hold={hold} />

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">
                  Hold{" "}
                  <span className={cn("font-mono", HOLD_COPY[hold.action].textClass)}>{hold.inputLabel}</span>{" "}
                  {HOLD_COPY[hold.action].title}
                </span>
              </div>
              <span className="text-[10px] text-white/50">{HOLD_COPY[hold.action].hint}</span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
