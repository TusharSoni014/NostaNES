import type { Game } from "@/lib/games"
import type {
  TouchElementKey,
  TouchElementPlacement,
  TouchOrientationLayout,
  GameTouchLayout,
} from "@/lib/storage/touch-controls-storage"

export type {
  TouchElementKey,
  TouchElementPlacement,
  TouchOrientationLayout,
  GameTouchLayout,
}

export type MobileTouchControlsProps = {
  pressDown: (action: string) => void
  pressUp: (action: string) => void
  onToggleMenu: () => void
  gamepadConnected?: boolean
  isPortrait?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  game?: Game
}

export type DragState = {
  key: TouchElementKey
  pointerId: number
  startX: number
  startY: number
  initialX: number
  initialY: number
}
