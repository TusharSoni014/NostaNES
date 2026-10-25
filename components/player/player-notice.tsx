"use client"

import { AlertCircleIcon, CheckCircle2Icon, FastForwardIcon, Loader2Icon } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { MAX_GAME_SPEED } from "@/lib/emulator/game-speed"
import { cn } from "@/lib/utils"

export type PlayerNoticeInput =
  | { kind: "speed"; speed: number }
  | { kind: "pending" | "success" | "error"; text: string }

export type PlayerNoticeData = PlayerNoticeInput & { id: number }

type PlayerNoticeProps = {
  notice: PlayerNoticeData | null
}

function SpeedNotice({ speed }: { speed: number }) {
  return (
    <>
      <FastForwardIcon className={cn("size-4", speed > 1 ? "text-sky-400" : "text-white/60")} />
      <span className="font-mono text-sm font-bold tabular-nums">{speed}x</span>
      <div className="flex items-end gap-0.5" aria-hidden="true">
        {Array.from({ length: MAX_GAME_SPEED }, (_, i) => (
          <span
            key={i}
            className={cn(
              "w-1 rounded-full transition-colors",
              i < speed ? "bg-sky-400" : "bg-white/15",
            )}
            style={{ height: 6 + i }}
          />
        ))}
      </div>
      <span className="text-[11px] text-white/60">{speed > 1 ? "Fast Forward" : "Normal Speed"}</span>
    </>
  )
}

/** A short-lived pill at the top of the player: game speed, quick save results. */
export const PlayerNotice = ({ notice }: PlayerNoticeProps) => {
  return (
    <AnimatePresence>
      {notice ? (
        <motion.div
          // Status notices share a key, so "Quick saving…" turns into its result in place.
          key={notice.kind === "speed" ? "speed" : "status"}
          role="status"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="pointer-events-none absolute top-6 inset-x-0 z-50 flex justify-center px-4"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-white/20 bg-zinc-950/90 px-4 py-2 text-white shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl ring-1 ring-white/10">
            {notice.kind === "speed" ? (
              <SpeedNotice speed={notice.speed} />
            ) : (
              <>
                {notice.kind === "pending" ? (
                  <Loader2Icon className="size-4 animate-spin text-blue-400" />
                ) : notice.kind === "success" ? (
                  <CheckCircle2Icon className="size-4 text-emerald-400" />
                ) : (
                  <AlertCircleIcon className="size-4 text-red-400" />
                )}
                <span className="text-xs font-semibold">{notice.text}</span>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
