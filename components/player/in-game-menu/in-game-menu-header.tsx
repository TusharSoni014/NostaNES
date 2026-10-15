"use client"

import Image from "next/image"
import { PlayIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd, GamepadKey } from "@/components/ui/kbd"
import { useInputMode } from "@/hooks/use-input-mode"

type InGameMenuHeaderProps = {
  gameTitle: string
  onResume: () => void
}

export const InGameMenuHeader = ({ gameTitle, onResume }: InGameMenuHeaderProps) => {
  const inputMode = useInputMode()
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-transparent p-0">
          <Image
            src="/nostanes.png"
            alt="Nostanes"
            width={36}
            height={36}
            className="size-full object-contain"
            priority
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-widest text-blue-400">
              NOSTANES
            </span>
            <Badge className="bg-blue-600/30 text-blue-300 border-blue-500/30 text-[10px] px-1.5 py-0">
              PAUSED
            </Badge>
          </div>
          <h2 className="text-sm font-semibold truncate text-white/90" title={gameTitle}>
            {gameTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onResume}
          className="border-white/15 bg-white/5 hover:bg-white/10 text-white gap-2"
        >
          <PlayIcon className="size-3.5 fill-current" />
          <span>Resume</span>
          <span className="hidden sm:inline-flex items-center gap-1 opacity-70">
            {inputMode === "gamepad" ? (
              <GamepadKey button="B" size="sm" />
            ) : (
              <Kbd size="sm">Esc</Kbd>
            )}
          </span>
        </Button>
      </div>
    </header>
  )
}
