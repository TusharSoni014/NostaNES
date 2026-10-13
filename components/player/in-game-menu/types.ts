import type { Game } from "@/lib/games"

export type InGameMenuTab =
  | "resume"
  | "save"
  | "load"
  | "controls"
  | "cheats"
  | "exit"

export type InGameMenuProps = {
  open: boolean
  game: Game
  onResume: () => void
  onRequestExit: () => void
  onSaveState: (slot: number) => Promise<boolean>
  onLoadState: (slot: number) => Promise<boolean>
}
