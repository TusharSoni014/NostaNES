"use client"

import { Kbd, GamepadKey } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useGamepadStatus } from "@/hooks/use-gamepad-status"

type PlayerFooterProps = {
  isFullscreen: boolean
}

type HintItemProps = {
  kbd: string
  gamepad: string
  label: string
}

const HintItem = ({ kbd, gamepad, label }: HintItemProps) => (
  <span className="flex items-center gap-1.5 text-xs shrink-0">
    <Kbd size="sm">{kbd}</Kbd>
    <span className="text-muted-foreground/30 text-[10px] font-mono select-none">/</span>
    <GamepadKey button={gamepad} size="sm" />
    <span className="text-foreground/85 font-medium ml-0.5">{label}</span>
  </span>
)

export const PlayerFooter = ({ isFullscreen }: PlayerFooterProps) => {
  const { profile } = useGamepadStatus()
  const isPS = profile.family === "playstation"

  return (
    <motion.footer
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-center gap-x-3.5 gap-y-2 px-6 py-3.5 text-xs text-muted-foreground select-none transition-all",
        isFullscreen && "hidden",
      )}
    >
      <span className="flex items-center gap-1.5 text-xs shrink-0">
        <Kbd size="sm">Arrows</Kbd>
        <span className="text-muted-foreground/30 text-[10px] font-mono select-none">/</span>
        <GamepadKey button="D-Pad" size="sm" />
        <span className="text-foreground/85 font-medium ml-0.5">Move</span>
      </span>

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      <HintItem kbd="Z" gamepad={isPS ? "✕" : "A"} label="B" />
      <HintItem kbd="X" gamepad={isPS ? "○" : "B"} label="A" />
      <HintItem kbd="A" gamepad={isPS ? "□" : "X"} label="Turbo B" />
      <HintItem kbd="S" gamepad={isPS ? "△" : "Y"} label="Turbo A" />

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      <HintItem kbd="Enter" gamepad={isPS ? "Options" : "Menu"} label="Start" />
      <HintItem kbd="Shift" gamepad={isPS ? "Share" : "View"} label="Select" />

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      <HintItem kbd="F" gamepad="R3" label="Fullscreen" />

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      <span className="flex items-center gap-1.5 text-xs shrink-0">
        <Kbd size="sm">Esc</Kbd>
        <span className="text-muted-foreground/30 text-[10px] font-mono select-none">/</span>
        <GamepadKey button="Guide" size="sm" />
        <span className="text-foreground/85 font-medium ml-0.5">Menu</span>
      </span>
    </motion.footer>
  )
}
