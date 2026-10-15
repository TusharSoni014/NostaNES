"use client"

import { useEffect, useState } from "react"
import { PlayIcon, RotateCcwIcon } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { listGameSaves, type SavedStateRecord } from "@/lib/storage/save-state-storage"
import { playUiSound } from "@/lib/ui-sounds"
import { cn } from "@/lib/utils"
import type { Game, GameGroup } from "@/lib/games"

export type GameInfoDrawerProps = {
  game: Game | GameGroup | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlay: (game: Game, slot?: number) => void
}

function formatRelativeTime(timestamp: number): string {
  try {
    const diffMs = Date.now() - timestamp
    if (diffMs < 60_000) return "just now"
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  } catch {
    return "saved"
  }
}

export function GameInfoDrawer({
  game,
  open,
  onOpenChange,
  onPlay,
}: GameInfoDrawerProps) {
  const [selectedVersionOverride, setSelectedVersionOverride] = useState<Game | null>(null)
  const [prevGameId, setPrevGameId] = useState<string | null>(null)
  const [latestSave, setLatestSave] = useState<SavedStateRecord | null>(null)

  if (game && game.id !== prevGameId) {
    setPrevGameId(game.id)
    setSelectedVersionOverride(null)
  }

  const primaryVersion: Game | null = game
    ? "versions" in game && game.versions.length > 0
      ? game.versions[0]
      : (game as Game)
    : null

  const activeVersion = selectedVersionOverride ?? primaryVersion
  const versions: Game[] = game ? ("versions" in game ? game.versions : [game as Game]) : []
  const hasMultipleVersions = versions.length > 1

  useEffect(() => {
    if (!activeVersion || !open) return
    let active = true
    listGameSaves(activeVersion.file)
      .then((saves) => {
        if (!active) return
        if (saves.length > 0) {
          const sorted = [...saves].sort((a, b) => b.timestamp - a.timestamp)
          setLatestSave(sorted[0] ?? null)
        } else {
          setLatestSave(null)
        }
      })
      .catch(() => {
        if (active) setLatestSave(null)
      })
    return () => {
      active = false
    }
  }, [activeVersion, open])

  if (!game || !activeVersion) return null

  const handleSelectVersion = (ver: Game) => {
    playUiSound("navigation")
    setSelectedVersionOverride(ver)
  }

  const handleStartPlay = (ver: Game, slot?: number) => {
    playUiSound("game_start")
    onOpenChange(false)
    onPlay(ver, slot)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) playUiSound("back_cancel")
        onOpenChange(next)
      }}
      showSwipeHandle
    >
      <DrawerContent className="bg-[#030716] text-white border-t border-blue-500/30 max-h-[90dvh] overflow-y-auto px-4 pb-6 pt-2">
        <DrawerHeader className="p-0 text-left space-y-1.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className="text-[10px] py-0 px-2 font-mono">NES</Badge>
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-2 border-white/15 text-white/80"
            >
              {activeVersion.region}
            </Badge>
            {activeVersion.year ? (
              <Badge
                variant="secondary"
                className="text-[10px] py-0 px-2 bg-white/10 text-white/70"
              >
                {activeVersion.year}
              </Badge>
            ) : null}
          </div>

          <DrawerTitle className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-white">
            {activeVersion.title}
          </DrawerTitle>

          <DrawerDescription className="text-xs font-mono text-white/50 truncate">
            {activeVersion.file}
          </DrawerDescription>
        </DrawerHeader>

        {/* Version Switcher if group has multiple releases */}
        {hasMultipleVersions ? (
          <div className="mt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-white/60">
              Select Release Version
            </span>
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-white/[0.03] p-1.5 border border-white/10">
              {versions.map((ver) => {
                const isCurrent = ver.file === activeVersion.file
                return (
                  <button
                    key={ver.id}
                    type="button"
                    onClick={() => handleSelectVersion(ver)}
                    className={cn(
                      "py-2 px-2.5 rounded-lg text-xs font-medium transition-all text-left truncate flex items-center justify-between border cursor-pointer",
                      isCurrent
                        ? "bg-white text-zinc-950 font-bold border-white shadow-sm"
                        : "border-transparent text-white/70 hover:text-white hover:bg-white/[0.08]",
                    )}
                  >
                    <span className="truncate">{ver.region}</span>
                    {ver.year ? (
                      <span className={cn("text-[10px] ml-1 shrink-0", isCurrent ? "text-zinc-600 font-mono" : "text-white/40 font-mono")}>
                        {ver.year}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Tags */}
        {activeVersion.tags && activeVersion.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {activeVersion.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/60 border border-white/10 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* Quick Resume Button if saves exist */}
        {latestSave ? (
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full h-10 gap-2 text-xs font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
              onClick={() => handleStartPlay(activeVersion, latestSave.slot)}
            >
              <RotateCcwIcon className="size-3.5" />
              <span>Resume Slot {latestSave.slot}</span>
              <span className="text-[10px] text-emerald-400/70 ml-auto font-mono">
                {formatRelativeTime(latestSave.timestamp)}
              </span>
            </Button>
          </div>
        ) : null}

        {/* Action Footer */}
        <DrawerFooter className="mt-5 p-0 flex flex-row items-center gap-2.5">
          <Button
            size="lg"
            onClick={() => handleStartPlay(activeVersion)}
            className="flex-1 h-12 gap-2 text-base font-bold bg-white text-zinc-950 hover:bg-white/90 shadow-lg active:scale-[0.99] rounded-xl cursor-pointer"
          >
            <PlayIcon className="size-5 fill-current" />
            Play Game
          </Button>

          <FavoriteButton
            game={activeVersion}
            variant="icon"
            size="lg"
            className="size-12 shrink-0 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10"
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
