"use client"

import { useRef, useState } from "react"
import { CheckIcon, FastForwardIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Kbd, GamepadKey } from "@/components/ui/kbd"
import { useInputMode } from "@/hooks/use-input-mode"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { MAX_GAME_SPEED, MIN_GAME_SPEED } from "@/lib/emulator/game-speed"
import { scrollNearestIntoView } from "@/lib/motion/scroll-into-view"
import { playUiSound } from "@/lib/ui-sounds"
import { cn } from "@/lib/utils"

type InGameMenuSpeedPanelProps = {
  speed: number
  onSelectSpeed: (speed: number) => void
  isFocused?: boolean
  onCancel?: () => void
  onNavigateLeft?: () => void
}

const SPEEDS = Array.from(
  { length: MAX_GAME_SPEED - MIN_GAME_SPEED + 1 },
  (_, i) => MIN_GAME_SPEED + i,
)

function describeSpeed(speed: number) {
  if (speed === MIN_GAME_SPEED) return "Original speed with sound"
  if (speed === MAX_GAME_SPEED) return "Maximum fast forward, sound muted"
  return "Fast forward, sound muted"
}

export function InGameMenuSpeedPanel({
  speed,
  onSelectSpeed,
  isFocused = false,
  onCancel,
  onNavigateLeft,
}: InGameMenuSpeedPanelProps) {
  const inputMode = useInputMode()
  const [selectedSpeed, setSelectedSpeed] = useState(speed)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const handleApply = (next: number) => {
    onSelectSpeed(next)
    playUiSound("game_start")
  }

  useMenuNavigation<number>({
    enabled: isFocused,
    items: SPEEDS,
    activeItem: selectedSpeed,
    onSelect: (next, idx) => {
      setSelectedSpeed(next)
      const row = itemRefs.current[idx]
      if (row) scrollNearestIntoView(row)
    },
    onConfirm: (next) => handleApply(next),
    onCancel,
    onNavigateLeft,
  })

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full min-w-0 gap-2.5 sm:gap-4 select-none">
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 pb-2.5 sm:pb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="grid size-7 sm:size-10 place-items-center rounded-lg sm:rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <FastForwardIcon className="size-3.5 sm:size-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight">Game Speed</h2>
            <p className="text-[11px] sm:text-xs text-white/60">
              Fast forward from 1x up to {MAX_GAME_SPEED}x
            </p>
          </div>
        </div>
        <span className="font-mono text-lg sm:text-2xl font-bold text-sky-300 tabular-nums">{speed}x</span>
      </div>

      <div
        role="listbox"
        aria-label="Game speed"
        className="flex-1 min-h-0 flex flex-col gap-1.5 sm:gap-2 overflow-y-auto p-0.5 sm:p-1 focus:outline-none [scrollbar-gutter:stable]"
      >
        {SPEEDS.map((option, idx) => {
          const isCursor = isFocused && selectedSpeed === option
          const isActive = speed === option

          return (
            <div
              key={option}
              ref={(el) => {
                itemRefs.current[idx] = el
              }}
              role="option"
              aria-selected={isActive}
              onClick={() => {
                setSelectedSpeed(option)
                handleApply(option)
              }}
              className={cn(
                "group relative flex cursor-pointer items-center justify-between gap-2.5 sm:gap-4 rounded-xl border px-2.5 py-2 sm:px-3.5 sm:py-2.5 transition-all duration-150",
                isCursor
                  ? "border-blue-400 bg-blue-500/15 text-white ring-2 ring-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                  : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                <span className="w-9 font-mono text-sm sm:text-base font-bold text-white tabular-nums">
                  {option}x
                </span>
                <div className="flex items-end gap-0.5" aria-hidden="true">
                  {SPEEDS.map((bar) => (
                    <span
                      key={bar}
                      className={cn("w-1 rounded-full", bar <= option ? "bg-sky-400" : "bg-white/10")}
                      style={{ height: 5 + bar }}
                    />
                  ))}
                </div>
                <span className="text-[10px] sm:text-xs text-white/50 truncate">{describeSpeed(option)}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isActive ? (
                  <Badge
                    variant="outline"
                    className="text-[9px] sm:text-[10px] py-0 px-1.5 font-mono bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                  >
                    ACTIVE
                  </Badge>
                ) : null}
                <div
                  className={cn(
                    "grid size-5 sm:size-6 place-items-center rounded-md border transition-colors",
                    isActive
                      ? "border-emerald-400 bg-emerald-500 text-black font-bold shadow-sm"
                      : isCursor
                        ? "border-blue-400 bg-blue-500/30 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/20",
                  )}
                >
                  {isActive ? <CheckIcon className="size-3 sm:size-3.5 stroke-[3]" /> : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="shrink-0 mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 sm:pt-3 border-t border-white/10 text-[10px] sm:text-xs text-white/60">
        <span className="flex items-center gap-1">
          <span>In game:</span>
          {inputMode === "gamepad" ? (
            <>
              <GamepadKey button="RT" size="sm" />
              <span>faster,</span>
              <GamepadKey button="LT" size="sm" />
              <span>slower</span>
            </>
          ) : (
            <>
              <Kbd size="sm">]</Kbd>
              <span>faster,</span>
              <Kbd size="sm">[</Kbd>
              <span>slower</span>
            </>
          )}
        </span>
        <span className="flex items-center gap-1">
          <span>Press</span>
          {inputMode === "gamepad" ? <GamepadKey button="A" size="sm" /> : <Kbd size="sm">Enter</Kbd>}
          <span>to set speed</span>
        </span>
      </div>
    </div>
  )
}
