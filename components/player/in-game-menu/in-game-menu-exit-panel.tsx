"use client"

import { useState } from "react"
import { LogOutIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Game } from "@/lib/games"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { cn } from "@/lib/utils"

type InGameMenuExitPanelProps = {
  game: Game
  onRequestExit: () => void
  onResume: () => void
  onCancel?: () => void
  isFocused?: boolean
  onNavigateLeft?: () => void
}

const EXIT_OPTIONS = ["cancel", "exit"] as const
type ExitOption = (typeof EXIT_OPTIONS)[number]

export const InGameMenuExitPanel = ({
  game,
  onRequestExit,
  onResume,
  onCancel,
  isFocused = false,
  onNavigateLeft,
}: InGameMenuExitPanelProps) => {
  const [selectedBtn, setSelectedBtn] = useState<ExitOption>("cancel")
  const handleCancel = onCancel ?? onResume

  useMenuNavigation<ExitOption>({
    enabled: isFocused,
    items: EXIT_OPTIONS,
    activeItem: selectedBtn,
    onSelect: setSelectedBtn,
    onConfirm: (item) => (item === "exit" ? onRequestExit() : handleCancel()),
    onCancel: handleCancel,
    onNavigateLeft: (item) => (item === "exit" ? setSelectedBtn("cancel") : onNavigateLeft?.()),
    onNavigateRight: () => setSelectedBtn("exit"),
  })

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 flex-1 h-full w-full min-h-0">
      <div className="flex size-10 sm:size-14 items-center justify-center rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-400 mb-2 sm:mb-4 border border-rose-500/20">
        <LogOutIcon className="size-5 sm:size-7" />
      </div>

      <h3 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2">Leave to Cartridge Shelf?</h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm">
        Your emulation session for {game.title} will stop. Make sure your progress has been saved.
      </p>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <Button
          variant={isFocused && selectedBtn === "cancel" ? "default" : "outline"}
          onClick={handleCancel}
          className={cn("h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4", isFocused && selectedBtn === "cancel" && "ring-2 ring-blue-400")}
        >
          Cancel
        </Button>

        <Button
          variant="destructive"
          onClick={onRequestExit}
          className={cn("gap-2 h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4", isFocused && selectedBtn === "exit" && "ring-2 ring-rose-400")}
        >
          <LogOutIcon className="size-3.5 sm:size-4" />
          <span>Exit Game</span>
        </Button>
      </div>
    </div>
  )
}
