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
  isFocused?: boolean
  onNavigateLeft?: () => void
}

const EXIT_OPTIONS = ["cancel", "exit"] as const
type ExitOption = (typeof EXIT_OPTIONS)[number]

export const InGameMenuExitPanel = ({
  game,
  onRequestExit,
  onResume,
  isFocused = false,
  onNavigateLeft,
}: InGameMenuExitPanelProps) => {
  const [selectedBtn, setSelectedBtn] = useState<ExitOption>("cancel")

  useMenuNavigation<ExitOption>({
    enabled: isFocused,
    items: EXIT_OPTIONS,
    activeItem: selectedBtn,
    onSelect: setSelectedBtn,
    onConfirm: (item) => (item === "exit" ? onRequestExit() : onResume()),
    onCancel: onResume,
    onNavigateLeft: (item) => (item === "exit" ? setSelectedBtn("cancel") : onNavigateLeft?.()),
    onNavigateRight: () => setSelectedBtn("exit"),
  })

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 flex-1 min-h-0">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
        <LogOutIcon className="size-7" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Leave to Cartridge Shelf?</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Your emulation session for {game.title} will stop. Make sure your progress has been saved.
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant={isFocused && selectedBtn === "cancel" ? "default" : "outline"}
          onClick={onResume}
          className={cn(isFocused && selectedBtn === "cancel" && "ring-2 ring-blue-400")}
        >
          Cancel
        </Button>

        <Button
          variant="destructive"
          onClick={onRequestExit}
          className={cn("gap-2", isFocused && selectedBtn === "exit" && "ring-2 ring-rose-400")}
        >
          <LogOutIcon className="size-4" />
          <span>Exit Game</span>
        </Button>
      </div>
    </div>
  )
}
