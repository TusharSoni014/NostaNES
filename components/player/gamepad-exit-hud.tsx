"use client"

import { LogOutIcon } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

type GamepadExitHudProps = {
  active: boolean
  remainingSeconds: number
  progress: number
}

export const GamepadExitHud = ({
  active,
  remainingSeconds,
  progress,
}: GamepadExitHudProps) => {
  const circumference = 2 * Math.PI * 18
  const strokeOffset = circumference * (1 - Math.max(0, Math.min(1, progress)))

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-none absolute top-6 inset-x-0 z-50 flex justify-center px-4"
        >
          <div className="flex items-center gap-3.5 rounded-2xl border border-white/20 bg-zinc-950/90 px-4 py-2.5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl ring-1 ring-white/10">
            {/* Circular Hold Progress Ring */}
            <div className="relative flex size-10 shrink-0 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-white/15"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-[stroke-dashoffset] duration-75 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-white">
                  {remainingSeconds}s
                </span>
              </div>
            </div>

            {/* Hold Text Description */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <LogOutIcon className="size-3.5 text-red-400" />
                <span className="text-xs font-semibold text-white">
                  Hold <span className="font-mono text-red-400">SELECT</span> to Exit
                </span>
              </div>
              <span className="text-[10px] text-white/50">
                Release to continue playing
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
