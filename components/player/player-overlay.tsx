"use client"

import { NesControllerIcon } from "@/components/player/nes-controller-icon"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { motion, AnimatePresence } from "motion/react"
import type { Game } from "@/lib/games"

type PlayerOverlayProps = {
  game: Game
  phase: "loading" | "ready" | "error"
  onExit: () => void
  onRetry: () => void
}

export const PlayerOverlay = ({ game, phase, onExit, onRetry }: PlayerOverlayProps) => (
  <>
    <AnimatePresence mode="wait">
      {phase === "loading" && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black p-6 will-change-opacity rounded-none"
        >
          {/* NES Emulator Controller Icon */}
          <div className="flex flex-col items-center gap-4">
            <NesControllerIcon className="w-52 sm:w-64 h-auto drop-shadow-[0_12px_32px_rgba(239,68,68,0.3)] animate-pulse" />
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-xs font-mono font-medium uppercase tracking-[0.2em] text-red-400">
                NES Emulator
              </span>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white max-w-sm truncate">
                {game.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/80 shadow-xl">
            <Spinner className="size-3 text-red-500" />
            <span className="font-mono text-xs tracking-wider uppercase text-white/90">
              Initializing Core & ROM...
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {phase === "error" ? (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black p-6 rounded-none">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>The cartridge did not start</EmptyTitle>
            <EmptyDescription>
              The ROM could not be loaded from the server. Try again, or go back to the shelf.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={onRetry}>Try again</Button>
              <Button variant="outline" onClick={onExit}>Back to the shelf</Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    ) : null}
  </>
)
