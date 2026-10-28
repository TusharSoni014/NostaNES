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

  if (isFullscreen) return null

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
        <span className="flex items-center gap-1">
          {inputMode === "gamepad" ? (
            <>
              <GamepadKey button={isPS ? "L2" : "LT"} size="sm" />
              <GamepadKey button={isPS ? "R2" : "RT"} size="sm" />
            </>
          ) : (
            <>
              <Kbd size="sm">[</Kbd>
              <Kbd size="sm">]</Kbd>
            </>
          )}
        </span>
        <span className="text-foreground/85 font-medium ml-0.5">Speed</span>
      </span>

      <span className="flex items-center gap-1.5 text-xs shrink-0">
        <span className="text-[11px] text-muted-foreground font-mono">Hold</span>
        {inputMode === "gamepad" ? (
          <span className="flex items-center gap-1">
            <GamepadKey button={isPS ? "R1" : "RB"} size="sm" />
            <span className="text-muted-foreground text-[10px]">/</span>
            <GamepadKey button={isPS ? "L1" : "LB"} size="sm" />
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Kbd size="sm">.</Kbd>
            <span className="text-muted-foreground text-[10px]">/</span>
            <Kbd size="sm">,</Kbd>
          </span>
        )}
        <span className="text-foreground/85 font-medium ml-0.5">Quick Save / Load</span>
      </span>

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      {/* In-Game Menu Tip */}
      <span className="flex items-center gap-1.5 text-xs shrink-0 font-medium">
        {inputMode === "gamepad" ? (
          <span className="flex items-center gap-1">
            <GamepadKey button={isPS ? "Share" : "View"} size="sm" />
            <span className="text-muted-foreground text-[10px]">+</span>
            <GamepadKey button={isPS ? "Options" : "Menu"} size="sm" />
          </span>
        ) : (
          <Kbd size="sm" className="border-blue-500/50 text-blue-300 bg-blue-950/40">F1</Kbd>
        )}
        <span className="text-blue-200 font-semibold ml-0.5">In-Game Menu</span>
      </span>

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      <span className="flex items-center gap-1.5 text-xs shrink-0">
        {inputMode === "gamepad" ? (
          <span className="text-[11px] text-muted-foreground font-mono">Hold Select 2s</span>
        ) : (
          <Kbd size="sm">Esc</Kbd>
        )}
        <span className="text-foreground/85 font-medium ml-0.5">Exit</span>
      </span>

      <Separator orientation="vertical" className="hidden h-3.5 sm:block" />

      <span className="text-[11px] text-foreground/70 shrink-0">
        {inputMode === "gamepad"
          ? "P2: second controller"
          : "P2: Numpad 5·2·1·3 / 7 A · 8 B · + −"}
      </span>
    </motion.footer>
  )
}
