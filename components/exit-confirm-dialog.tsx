"use client"

import { PauseIcon, PlayIcon, LogOutIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

type ExitConfirmDialogProps = {
  open: boolean
  onResume: () => void
  onConfirmExit: () => void
}

export function ExitConfirmDialog({
  open,
  onResume,
  onConfirmExit,
}: ExitConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-dialog-title"
      aria-describedby="exit-dialog-desc"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="relative flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-white/15 bg-zinc-950 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.95)] ring-1 ring-white/10 animate-in zoom-in-95 duration-150">
        {/* Pause Badge */}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
          <PauseIcon className="size-3 text-amber-400 fill-amber-400" />
          <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-amber-400">
            Game Paused
          </span>
        </div>

        {/* Dialog Header */}
        <div className="flex flex-col gap-1.5">
          <h2 id="exit-dialog-title" className="text-lg font-bold tracking-tight text-white sm:text-xl">
            Exit to Game Library?
          </h2>
          <p id="exit-dialog-desc" className="text-xs text-white/60 text-balance leading-relaxed">
            Your current game is paused. Any unsaved progress will be lost if you return to the shelf.
          </p>
        </div>

        {/* Clear Action Buttons with Keyboard and Gamepad Badges */}
        <div className="flex w-full flex-col gap-2.5 pt-1">
          <Button
            size="lg"
            className="w-full gap-2 text-xs sm:text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-200 shadow-md"
            onClick={onResume}
            autoFocus
          >
            <PlayIcon className="size-3.5 fill-current" />
            Resume Playing
            <span className="ml-auto flex items-center gap-1">
              <Kbd className="bg-zinc-200 text-zinc-900 border-zinc-300 text-[10px]">Esc</Kbd>
              <Kbd className="bg-zinc-200 text-zinc-900 border-zinc-300 text-[10px]">B / ○</Kbd>
            </span>
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="w-full gap-2 text-xs sm:text-sm font-semibold border border-red-500/30"
            onClick={onConfirmExit}
          >
            <LogOutIcon className="size-3.5" />
            Exit to Library
            <span className="ml-auto flex items-center gap-1">
              <Kbd className="bg-red-950 text-red-200 border-red-800 text-[10px]">Enter</Kbd>
              <Kbd className="bg-red-950 text-red-200 border-red-800 text-[10px]">A / ✕</Kbd>
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
