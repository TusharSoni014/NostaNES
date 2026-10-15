import type { Game, GameGroup } from "@/lib/games"

export type GameHubProps = {
  game: Game | GameGroup
  onLaunch: (specificGame?: Game, slot?: number) => void
  onSelectVersion?: (version: Game) => void
}
