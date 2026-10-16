"use client"

import Image from "next/image"
import { PlayIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { Kbd, GamepadKey } from "@/components/ui/kbd"
import { useInputMode } from "@/hooks/use-input-mode"
import { useIsMobile } from "@/hooks/use-is-mobile"
import type { Game } from "@/lib/games"

type InGameMenuHeaderProps = {
  game: Game
  gameTitle?: string
  onResume: () => void
}

export const InGameMenuHeader = ({ game, gameTitle = game.title, onResume }: InGameMenuHeaderProps) => {
  const inputMode = useInputMode()
  const isMobile = useIsMobile()

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950/90 px-3 sm:px-6 py-2 sm:py-3 pt-[max(env(safe-area-inset-top,0px),8px)] z-10 select-none">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
          <Image
            src="/nostanes.png"
            alt="Nostanes"
            width={32}
            height={32}
            className="size-full object-contain select-none"
            priority
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
            <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-widest text-blue-400 uppercase">
              PAUSED
            </span>
          </div>
          <h2
            className="text-xs sm:text-sm font-semibold truncate text-white/90 max-w-[140px] xs:max-w-[180px] sm:max-w-xs md:max-w-md"
            title={gameTitle}
          >
            {gameTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <FavoriteButton
          game={game}
          variant="icon"
          size="sm"
          className="size-7 sm:size-8 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 rounded-lg"
        />
        <Button
          variant="default"
          size="sm"
          onClick={onResume}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs shadow-sm cursor-pointer active:scale-95 transition-transform"
        >
          <PlayIcon className="size-3 fill-current" />
          <span>Resume</span>
          {!isMobile && (
            <span className="hidden sm:inline-flex items-center gap-1 opacity-80 text-[10px] ml-0.5">
              {inputMode === "gamepad" ? (
                <GamepadKey button="B" size="sm" />
              ) : (
                <Kbd size="sm">Esc</Kbd>
              )}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}
