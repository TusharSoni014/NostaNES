"use client"

import { PlayIcon } from "lucide-react"
import { GameCover } from "@/components/game-cover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import type { Game, GameGroup } from "@/lib/games"

type GameDetailsPanelProps = {
  game: Game | GameGroup
  onLaunch: () => void
}

export const GameDetailsPanel = ({ game, onLaunch }: GameDetailsPanelProps) => (
  <div className="flex w-full flex-col justify-between gap-3 sm:gap-4 rounded-2xl border border-foreground/15 bg-background/40 p-4 sm:p-5 backdrop-blur-xl shadow-xl md:w-72 lg:w-80 max-h-[calc(100dvh-12rem)] overflow-y-auto [scrollbar-width:none] transition-all">
    {/* Visual Cartridge Box Preview - viewport-aware and fluid */}
    <div className="relative mx-auto aspect-square w-24 sm:w-28 md:w-32 lg:w-36 max-h-[16vh] shrink-0 overflow-hidden rounded-xl shadow-xl ring-1 ring-foreground/20 transition-all">
      <GameCover game={game} selected />
    </div>

    {/* Title & Metadata */}
    <div className="flex flex-col gap-1.5 shrink-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="text-[11px] py-0 px-2">NES</Badge>
        <Badge variant="outline" className="text-[11px] py-0 px-2">
          {game.region}
        </Badge>
        {"versions" in game && game.versions.length > 1 ? (
          <Badge
            variant="outline"
            className="text-[11px] py-0 px-2 border-sky-400/40 bg-sky-500/10 text-sky-300 font-semibold"
          >
            {game.versions.length} Releases
          </Badge>
        ) : null}
        {game.year ? (
          <Badge variant="secondary" className="text-[11px] py-0 px-2">
            {game.year}
          </Badge>
        ) : null}
      </div>

      <h3
        title={game.title}
        className="text-base sm:text-lg font-bold leading-snug tracking-tight text-foreground line-clamp-2"
      >
        {game.title}
      </h3>

      <p className="font-mono text-[11px] text-muted-foreground truncate" title={game.file}>
        {"versions" in game && game.versions.length > 1
          ? `${game.versions.length} versions (${game.regions.join(", ")})`
          : game.file}
      </p>

      {game.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {game.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] text-muted-foreground border border-foreground/10"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>

    <Separator className="shrink-0" />

    {/* Launch Action */}
    <div className="flex flex-col gap-1.5 shrink-0">
      <Button
        className="w-full h-9 sm:h-10 gap-2 text-xs sm:text-sm font-semibold shadow-lg"
        onClick={onLaunch}
      >
        <PlayIcon className="size-3.5 fill-current" />
        {"versions" in game && game.versions.length > 1
          ? `Choose Version (${game.versions.length})`
          : "Start Game"}
        <Kbd className="ml-auto text-[11px]">Enter</Kbd>
      </Button>
      <p className="text-center text-[10px] text-muted-foreground">
        {"versions" in game && game.versions.length > 1
          ? "Press Enter to select version"
          : "Press Enter or click to play"}
      </p>
    </div>
  </div>
)
