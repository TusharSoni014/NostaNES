"use client"

import { AlertTriangleIcon, PlayIcon, LogOutIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

type ExitConfirmDialogProps = {
  open: boolean
  countdown: number
  totalDuration?: number
  onResume: () => void
  onConfirmExit: () => void
}

export function ExitConfirmDialog({
  open,
  countdown,
  totalDuration = 5,
  onResume,
  onConfirmExit,
}: ExitConfirmDialogProps) {
  if (!open) return null

  const progressFraction = Math.max(0, Math.min(1, countdown / totalDuration))
  const circumference = 2 * Math.PI * 26
  const strokeOffset = circumference * (1 - progressFraction)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-dialog-title"
      aria-describedby="exit-dialog-desc"
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-foreground/20 bg-background/95 p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.85)] ring-1 ring-primary/30 backdrop-blur-2xl animate-in zoom-in-95 duration-200">
        {/* Animated Circular Countdown Ring */}
        <div className="relative flex size-20 items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-foreground/15"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="text-primary transition-all duration-300 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {countdown}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              sec
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangleIcon className="size-5 text-amber-400" />
            <h2 id="exit-dialog-title" className="text-xl font-semibold tracking-tight">
              Exit Game?
            </h2>
          </div>
          <p id="exit-dialog-desc" className="text-sm text-muted-foreground text-balance">
            Game paused. Auto-returning to the shelf in{" "}
            <span className="font-mono font-medium text-foreground">{countdown}s</span>.
            Confirm exit or resume playing.
          </p>
        </div>

        {/* Linear progress bar */}
        <div className="w-full overflow-hidden rounded-full bg-foreground/10 h-1.5">
          <div
            className="h-full bg-primary transition-all duration-200 ease-linear"
            style={{ width: `${progressFraction * 100}%` }}
          />
        </div>

        <div className="flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onResume}
            autoFocus
          >
            <PlayIcon className="size-4" />
            Resume
            <Kbd className="ml-1.5 hidden sm:inline-block">Esc</Kbd>
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="flex-1"
            onClick={onConfirmExit}
          >
            <LogOutIcon className="size-4" />
            Confirm Exit
            <Kbd className="ml-1.5 hidden sm:inline-block">Enter</Kbd>
          </Button>
        </div>
      </div>
    </div>
  )
}
