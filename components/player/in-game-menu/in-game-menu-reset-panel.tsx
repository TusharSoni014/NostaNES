"use client"

import { useState } from "react"
import { RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Game } from "@/lib/games"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { cn } from "@/lib/utils"

type InGameMenuResetPanelProps = {
  game: Game
  onResetGame?: () => void
  onCancel: () => void
  isFocused?: boolean
  onNavigateLeft?: () => void
}

const RESET_OPTIONS = ["cancel", "reset"] as const
type ResetOption = (typeof RESET_OPTIONS)[number]

export const InGameMenuResetPanel = ({
  game,
  onResetGame,
  onCancel,
  isFocused = false,
  onNavigateLeft,
}: InGameMenuResetPanelProps) => {
  const [selectedBtn, setSelectedBtn] = useState<ResetOption>("cancel")

  useMenuNavigation<ResetOption>({
    enabled: isFocused,
    items: RESET_OPTIONS,
    activeItem: selectedBtn,
    onSelect: setSelectedBtn,
    onConfirm: (item) => {
      if (item === "reset") onResetGame?.()
      else onCancel()
    },
    onCancel,
    onNavigateLeft: (item) => (item === "reset" ? setSelectedBtn("cancel") : onNavigateLeft?.()),
    onNavigateRight: () => setSelectedBtn("reset"),
  })

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 flex-1 min-h-0">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
        <RotateCcwIcon className="size-7" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Restart {game.title}?</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        This will reload the ROM and restart the game from the title screen. Make sure your progress has been saved.
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant={isFocused && selectedBtn === "cancel" ? "default" : "outline"}
          onClick={onCancel}
          className={cn(isFocused && selectedBtn === "cancel" && "ring-2 ring-blue-400")}
        >
          Cancel
        </Button>

        <Button
          variant="destructive"
          onClick={onResetGame}
          className={cn("gap-2", isFocused && selectedBtn === "reset" && "ring-2 ring-amber-400")}
        >
          <RotateCcwIcon className="size-4" />
          <span>Restart ROM</span>
        </Button>
      </div>
    </div>
  )
}
