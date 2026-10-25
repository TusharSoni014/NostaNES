"use client"

import { useEffect, useState } from "react"
import { PlayIcon, RotateCcwIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { Kbd, GamepadKey } from "@/components/ui/kbd"
import { useInputMode } from "@/hooks/use-input-mode"
import { useGamepadStatus } from "@/hooks/use-gamepad-status"
import { formatSlotLabel, listGameSaves, type SavedStateRecord } from "@/lib/storage/save-state-storage"
import { playUiSound } from "@/lib/ui-sounds"
import { cn } from "@/lib/utils"
import type { Game } from "@/lib/games"
import type { GameHubProps } from "./types"

function formatRelativeTime(timestamp: number): string {
  try {
    const diffMs = Date.now() - timestamp
    if (diffMs < 60_000) return "just now"
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`
    return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return "saved"
  }
}

export const GameHub = ({ game, onLaunch, onSelectVersion }: GameHubProps) => {
  const inputMode = useInputMode()
  const { profile } = useGamepadStatus()
  const isGamepad = inputMode === "gamepad"
  const isPS = profile.family === "playstation"

  const primaryVersion: Game = "versions" in game && game.versions.length > 0 ? game.versions[0] : game
  const [selectedVersionOverride, setSelectedVersionOverride] = useState<Game | null>(null)
  const [prevGameId, setPrevGameId] = useState(game.id)

  if (game.id !== prevGameId) {
    setPrevGameId(game.id)
    setSelectedVersionOverride(null)
  }

  const activeVersion = selectedVersionOverride ?? primaryVersion
  const [latestSave, setLatestSave] = useState<SavedStateRecord | null>(null)

  const versions: Game[] = "versions" in game ? game.versions : [game]
  const hasMultipleVersions = versions.length > 1

  // Look up latest save state for quick resume
  useEffect(() => {
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
  }, [activeVersion.file])

  const handleSelectVersion = (ver: Game) => {
    playUiSound("navigation")
    setSelectedVersionOverride(ver)
    onSelectVersion?.(ver)
  }

  return (
    <aside
      aria-label="Selected game details"
      className="flex h-full w-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 backdrop-blur-xl shadow-xl md:w-80 lg:w-96 select-none transition-all"
    >
      {/* Top Section: Title, Badges, Versions & Metadata */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className="text-[10px] py-0 px-2 font-mono">NES</Badge>
            <Badge variant="outline" className="text-[10px] py-0 px-2 border-white/15 text-white/80">
              {activeVersion.region}
            </Badge>
            {activeVersion.year ? (
              <Badge variant="secondary" className="text-[10px] py-0 px-2 bg-white/10 text-white/70">
                {activeVersion.year}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <h2
              title={activeVersion.title}
              className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-white line-clamp-2"
            >
              {activeVersion.title}
            </h2>
            <p className="font-mono text-xs text-white/40 truncate" title={activeVersion.file}>
              {activeVersion.file}
            </p>
          </div>
        </div>

        {/* Regional Version Switcher */}
        {hasMultipleVersions ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-white/50">Releases</span>
            <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/10">
              {versions.slice(0, 4).map((ver) => {
                const isCurrent = ver.file === activeVersion.file
                return (
                  <button
                    key={ver.id}
                    type="button"
                    onClick={() => handleSelectVersion(ver)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center truncate",
                      isCurrent
                        ? "bg-white text-zinc-950 font-bold shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/[0.06]",
                    )}
                    title={ver.file}
                  >
                    {ver.region}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Tags & Dump Info */}
        {activeVersion.tags && activeVersion.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activeVersion.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/60 border border-white/10 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Bottom Section: Launch, Resume & Controls Legend */}
      <div className="flex flex-col gap-3 pt-4">
        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              className="flex-1 h-11 gap-2 text-sm font-semibold shadow-lg bg-white text-zinc-950 hover:bg-white/90"
              onClick={() => onLaunch(activeVersion)}
            >
              <PlayIcon className="size-4 fill-current" />
              <span>Play Game</span>
              <span className="ml-auto flex items-center gap-1 shrink-0">
                {isGamepad ? (
                  <GamepadKey button="A" size="sm" />
                ) : (
                  <Kbd size="sm" variant="solid">Enter</Kbd>
                )}
              </span>
            </Button>

            <FavoriteButton
              game={activeVersion}
              variant="icon"
              size="lg"
              className="size-11 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10"
            />
          </div>

          {/* Quick Resume Button (Only visible if saved progress exists) */}
          {latestSave ? (
            <Button
              variant="outline"
              className="w-full h-9 gap-2 text-xs font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
              onClick={() => onLaunch(activeVersion, latestSave.slot)}
            >
              <RotateCcwIcon className="size-3.5" />
              <span>Resume {formatSlotLabel(latestSave.slot)}</span>
              <span className="text-[10px] text-emerald-400/70 ml-auto font-mono">
                {formatRelativeTime(latestSave.timestamp)}
              </span>
            </Button>
          ) : null}
        </div>

        {/* Minimalist Controls Legend Footer */}
        <div className="flex items-center justify-between text-[11px] text-white/50 border-t border-white/10 pt-3">
          <span className="flex items-center gap-1">
            {isGamepad ? <GamepadKey button={isPS ? "✕" : "A"} size="sm" /> : <Kbd size="sm">Z</Kbd>}
            <span className="text-white/70">Attack</span>
          </span>
          <span className="flex items-center gap-1">
            {isGamepad ? <GamepadKey button={isPS ? "○" : "B"} size="sm" /> : <Kbd size="sm">X</Kbd>}
            <span className="text-white/70">Jump</span>
          </span>
          <span className="flex items-center gap-1">
            {isGamepad ? <GamepadKey button="Start" size="sm" /> : <Kbd size="sm">Enter</Kbd>}
            <span className="text-white/70">Start</span>
          </span>
        </div>
      </div>
    </aside>
  )
}
