"use client"

import { Kbd, GamepadKey } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useGamepadStatus } from "@/hooks/use-gamepad-status"
import { useInputMode, type InputMode } from "@/hooks/use-input-mode"

type PlayerFooterProps = {
  isFullscreen: boolean
}

type HintItemProps = {
  kbd: string
  gamepad: string
  label: string
  mode: InputMode
}

const HintItem = ({ kbd, gamepad, label, mode }: HintItemProps) => (
  <span className="flex items-center gap-1.5 text-xs shrink-0">
    {mode === "gamepad" ? (
      <GamepadKey button={gamepad} size="sm" />
    ) : (
      <Kbd size="sm">{kbd}</Kbd>
    )}
    <span className="text-foreground/85 font-medium ml-0.5">{label}</span>
  </span>
)

export const PlayerFooter = ({ isFullscreen }: PlayerFooterProps) => {
  const inputMode = useInputMode()
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
        {inputMode === "gamepad" ? (
          <GamepadKey button="D-Pad" size="sm" />
        ) : (
          <Kbd size="sm">Arrows</Kbd>
        )}
        <span className="text-foreground/85 font-medium ml-0.5">Move</span>
      </span>

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      <HintItem mode={inputMode} kbd="Z" gamepad={isPS ? "✕" : "A"} label="B" />
      <HintItem mode={inputMode} kbd="X" gamepad={isPS ? "○" : "B"} label="A" />
      <HintItem mode={inputMode} kbd="A" gamepad={isPS ? "□" : "X"} label="Turbo B" />
      <HintItem mode={inputMode} kbd="S" gamepad={isPS ? "△" : "Y"} label="Turbo A" />

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      <HintItem mode={inputMode} kbd="Enter" gamepad={isPS ? "Options" : "Menu"} label="Start" />
      <HintItem mode={inputMode} kbd="Shift" gamepad={isPS ? "Share" : "View"} label="Select" />

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      <HintItem mode={inputMode} kbd="F" gamepad="R3" label="Fullscreen" />

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      <span className="flex items-center gap-1.5 text-xs shrink-0">
        {inputMode === "gamepad" ? (
          <GamepadKey button="Guide" size="sm" />
        ) : (
          <Kbd size="sm">Esc</Kbd>
        )}
        <span className="text-foreground/85 font-medium ml-0.5">Menu</span>
      </span>
    </motion.footer>
  )
}
