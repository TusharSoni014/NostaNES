"use client"

import { GameCover } from "@/components/game-cover"
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
}

export const PlayerOverlay = ({ game, phase, onExit }: PlayerOverlayProps) => (
  <>
    <AnimatePresence mode="wait">
      {phase === "loading" && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-background/95 to-background/85 p-6 backdrop-blur-xl"
        >
          <motion.div
            animate={{ scale: [0.97, 1.02, 0.97] }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
            className="size-48 sm:size-60 drop-shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
          >
            <GameCover game={game} selected />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 rounded-full border border-foreground/15 bg-background/80 px-5 py-2 text-xs text-muted-foreground backdrop-blur-xl shadow-2xl"
          >
            <Spinner className="size-3.5 text-primary" />
            <span className="font-mono text-sm tracking-wide text-foreground">
              Loading Cartridge...
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {phase === "error" ? (
      <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>The cartridge did not start</EmptyTitle>
            <EmptyDescription>
              The ROM could not be loaded from the server. Close this screen and try again.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onExit}>Back to the shelf</Button>
          </EmptyContent>
        </Empty>
      </div>
    ) : null}
  </>
)
