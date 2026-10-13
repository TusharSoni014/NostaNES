"use client"

import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

type PlayerFooterProps = {
  isFullscreen: boolean
}

export const PlayerFooter = ({ isFullscreen }: PlayerFooterProps) => (
  <motion.footer
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
    className={cn(
      "flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 py-4 text-xs text-muted-foreground transition-all sm:text-sm",
      isFullscreen && "hidden",
    )}
  >
    <span className="flex items-center gap-1">
      <Kbd>Arrows / Stick</Kbd>
      Move
    </span>
    <Separator orientation="vertical" className="hidden h-3.5 sm:block" />
    <span className="flex items-center gap-1">
      <Kbd>Z</Kbd>
      <span className="text-[11px] text-muted-foreground/80">(A)</span>
      B
    </span>
    <span className="flex items-center gap-1">
      <Kbd>X</Kbd>
      <span className="text-[11px] text-muted-foreground/80">(B)</span>
      A
    </span>
    <span className="flex items-center gap-1">
      <Kbd>A</Kbd>
      <span className="text-[11px] text-muted-foreground/80">(X)</span>
      Turbo B
    </span>
    <span className="flex items-center gap-1">
      <Kbd>S</Kbd>
      <span className="text-[11px] text-muted-foreground/80">(Y)</span>
      Turbo A
    </span>
    <span className="flex items-center gap-1">
      <Kbd>Enter</Kbd>
      <span className="text-[11px] text-muted-foreground/80">(Menu)</span>
      Start
    </span>
    <span className="flex items-center gap-1">
      <Kbd>Shift</Kbd>
      <span className="text-[11px] text-muted-foreground/80">(View)</span>
      Select
    </span>
    <Separator orientation="vertical" className="hidden h-3.5 sm:block" />
    <span className="flex items-center gap-1">
      <Kbd>F</Kbd>
      <span className="text-[11px] text-muted-foreground/80">(L3)</span>
      Fullscreen
    </span>
    <Separator orientation="vertical" className="hidden h-3.5 sm:block" />
    <span className="flex items-center gap-1">
      <Kbd>Esc / Guide</Kbd>
      Exit
    </span>
  </motion.footer>
)
