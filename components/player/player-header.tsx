"use client"

import Image from "next/image"
import { Maximize2Icon, Minimize2Icon, RotateCcwIcon, SlidersIcon, XIcon } from "lucide-react"
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
  isMobile?: boolean
  onToggleRotate?: () => void
  isRotated?: boolean
  onToggleMenu?: () => void
}

export const PlayerHeader = ({
  title,
  isFullscreen,
  onToggleFullscreen,
  onRequestExit,
  isMobile = false,
  onToggleRotate,
  isRotated = false,
  onToggleMenu,
}: PlayerHeaderProps) => {
  // Mobile requirement: when the game is full-screened, the header should not be there
  if (isMobile && isFullscreen) {
    return null
  }

  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 sm:gap-4 px-3 py-2 sm:px-10 sm:py-3 transition-opacity duration-200 z-30",
        isMobile
          ? "bg-zinc-950 border-b border-zinc-800"
          : isFullscreen
            ? "absolute top-0 inset-x-0 opacity-0 hover:opacity-100 focus-within:opacity-100 bg-gradient-to-b from-black/90 via-black/40 to-transparent"
            : "bg-black/90 border-b border-white/10",
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
    <div className="flex items-center gap-1.5 sm:gap-2">
      {onToggleRotate ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label={isRotated ? "Restore Portrait" : "Rotate Landscape"}
                onClick={onToggleRotate}
                className={cn(
                  "size-8 sm:size-9 border-white/20 text-white hover:bg-white/10",
                  isRotated ? "bg-blue-600/40 text-blue-300 border-blue-400/50" : "bg-black/40",
                )}
              />
            }
          >
            <RotateCcwIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent>{isRotated ? "Restore normal orientation" : "Rotate into landscape"}</TooltipContent>
        </Tooltip>
      ) : null}

      {onToggleMenu ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="In-Game Menu (F1)"
                onClick={onToggleMenu}
                className="size-8 sm:size-9 bg-black/40 border-white/20 text-white hover:bg-white/10"
              />
            }
          >
            <SlidersIcon className="size-4 text-blue-400" />
          </TooltipTrigger>
          <TooltipContent>In-Game Menu (F1)</TooltipContent>
        </Tooltip>
      ) : null}

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={onToggleFullscreen}
              className="size-8 sm:size-9 bg-black/40 border-white/20 text-white hover:bg-white/10"
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
              className="h-8 sm:h-9 px-2 sm:px-3 bg-black/40 border-white/20 text-white hover:bg-white/10 gap-1.5"
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
}

