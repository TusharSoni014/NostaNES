"use client"

import { Maximize2Icon, Minimize2Icon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

type PlayerHeaderProps = {
  title: string
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onRequestExit: () => void
}

export const PlayerHeader = ({
  title,
  isFullscreen,
  onToggleFullscreen,
  onRequestExit,
}: PlayerHeaderProps) => (
  <motion.header
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    className={cn(
      "flex shrink-0 items-center justify-between gap-4 px-6 py-4 transition-all sm:px-10",
      isFullscreen && "bg-background/80 backdrop-blur-md",
    )}
  >
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
        Now playing
      </p>
      <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
        {title}
      </h2>
    </div>
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={onToggleFullscreen}
            />
          }
        >
          {isFullscreen ? (
            <Minimize2Icon className="size-4" />
          ) : (
            <Maximize2Icon className="size-4" />
          )}
        </TooltipTrigger>
        <TooltipContent>
          {isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              onClick={onRequestExit}
              aria-label="Exit game"
            />
          }
        >
          <XIcon className="size-4" />
          <span className="hidden sm:inline">Close</span>
        </TooltipTrigger>
        <TooltipContent>Leave the game (Esc)</TooltipContent>
      </Tooltip>
    </div>
  </motion.header>
)
