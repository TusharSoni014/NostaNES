"use client"

import Image from "next/image"
import { Maximize2Icon, Minimize2Icon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type PlayerHeaderProps = {
  title: string
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onRequestExit: () => void
}

export const PlayerHeader = ({
  title,
  isFullscreen,
  onToggleFullscreen,
  onRequestExit,
}: PlayerHeaderProps) => (
  <header
    className={cn(
      "flex shrink-0 items-center justify-between gap-4 px-6 py-3 transition-opacity duration-200 z-30 sm:px-10",
      isFullscreen
        ? "absolute top-0 inset-x-0 opacity-0 hover:opacity-100 focus-within:opacity-100 bg-gradient-to-b from-black/90 via-black/40 to-transparent"
        : "bg-black/90",
    )}
  >
    <div className="flex min-w-0 items-center gap-3">
      <Image
        src="/nostanes.png"
        alt="NostaNES"
        width={36}
        height={36}
        className="h-8 w-auto object-contain shrink-0 select-none"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">
          Now playing
        </p>
        <h2 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
          {title}
        </h2>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={onToggleFullscreen}
              className="bg-black/40 border-white/20 text-white hover:bg-white/10"
            />
          }
        >
          {isFullscreen ? (
            <Minimize2Icon className="size-4" />
          ) : (
            <Maximize2Icon className="size-4" />
          )}
        </TooltipTrigger>
        <TooltipContent>
          {isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              onClick={onRequestExit}
              aria-label="Exit game"
              className="bg-black/40 border-white/20 text-white hover:bg-white/10"
            />
          }
        >
          <XIcon className="size-4" />
          <span className="hidden sm:inline">Close</span>
        </TooltipTrigger>
        <TooltipContent>Leave the game (Esc)</TooltipContent>
      </Tooltip>
    </div>
  </header>
)
