import { Badge } from "@/components/ui/badge"
import { coverPalette, type Game } from "@/lib/games"

type GameCoverProps = {
  game: Game
  selected?: boolean
}

export function GameCover({ game, selected = false }: GameCoverProps) {
  const palette = coverPalette(game.title)

  return (
    <div
      className="relative flex size-full flex-col justify-between overflow-hidden rounded-2xl border border-foreground/15 bg-background/20 p-4 backdrop-blur-xl"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.95 0.02 230 / 16%), transparent 28%), radial-gradient(90% 70% at 15% 0%, ${palette.glow}, transparent 55%), linear-gradient(160deg, ${palette.a}cc, ${palette.c}ee)`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-foreground/50"
      />
      {selected ? (
        <span
          aria-hidden
          className="nostanes-sheen pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-foreground/15"
        />
      ) : null}
      <div className="relative flex items-center justify-between gap-2">
        <Badge variant="secondary">NES</Badge>
        <Badge variant="outline">{game.region}</Badge>
      </div>
      <div className="relative flex flex-col gap-1">
        <p className="text-base leading-tight font-medium tracking-tight text-balance text-foreground">
          {game.title}
        </p>
        {game.year ? (
          <p className="text-xs text-foreground/65">{game.year}</p>
        ) : null}
      </div>
    </div>
  )
}
