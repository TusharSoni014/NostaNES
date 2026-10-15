"use client"

import { GameHub } from "@/components/game-hub/game-hub"
import type { Game, GameGroup } from "@/lib/games"

export type GameDetailsPanelProps = {
  game: Game | GameGroup
  onLaunch: () => void
}

/**
 * Backwards-compatible wrapper delegating to the interactive GameHub.
 */
export const GameDetailsPanel = ({ game, onLaunch }: GameDetailsPanelProps) => {
  return <GameHub game={game} onLaunch={() => onLaunch()} />
}
