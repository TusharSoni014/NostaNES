import type { EmulatorCheatControls } from "@/lib/cheats/emulator-cheats"
import type { Game } from "@/lib/games"
import type { GameShader } from "@/lib/storage/shader-storage"

export type InGameMenuTab =
  | "resume"
  | "save"
  | "load"
  | "speed"
  | "shaders"
  | "controls"
  | "cheats"
  | "reset"
  | "exit"

export type InGameMenuProps = {
  open: boolean
  game: Game
  onResume: () => void
  onRequestExit: () => void
  onResetGame?: () => void
  onSaveState: (slot: number) => Promise<boolean>
  onLoadState: (slot: number) => Promise<boolean>
  speed: number
  onSelectSpeed: (speed: number) => void
  activeShader?: GameShader
  onSelectShader?: (shader: GameShader) => void
  cheats: EmulatorCheatControls
  onOpenTouchLayout?: () => void
  onRandomGame?: () => void
  randomAvailable?: boolean
}
