export type TouchElementKey =
  | "dpad"
  | "a"
  | "b"
  | "turboA"
  | "turboB"
  | "select"
  | "start"
  | "menu"

export type TouchElementPlacement = {
  /** Horizontal position as percentage of controls area (5% to 95%) */
  x: number
  /** Vertical position as percentage of controls area (5% to 95%) */
  y: number
  /** Scale factor (0.6x to 1.8x, default 1.0) */
  scale: number
  /** Whether the element is visible on screen */
  visible?: boolean
}

export type TouchOrientationLayout = Record<TouchElementKey, TouchElementPlacement>

export type GameTouchLayout = {
  portrait: TouchOrientationLayout
  landscape: TouchOrientationLayout
}

export const DEFAULT_PORTRAIT_LAYOUT: TouchOrientationLayout = {
  menu: { x: 16, y: 10, scale: 1.0, visible: true },
  select: { x: 42, y: 10, scale: 1.0, visible: true },
  start: { x: 58, y: 10, scale: 1.0, visible: true },
  dpad: { x: 25, y: 65, scale: 1.0, visible: true },
  turboA: { x: 72, y: 53, scale: 1.0, visible: true },
  b: { x: 88, y: 53, scale: 1.0, visible: true },
  turboB: { x: 72, y: 77, scale: 1.0, visible: true },
  a: { x: 88, y: 77, scale: 1.0, visible: true },
}

export const DEFAULT_LANDSCAPE_LAYOUT: TouchOrientationLayout = {
  menu: { x: 10, y: 8, scale: 1.0, visible: true },
  select: { x: 16, y: 54, scale: 1.0, visible: true },
  start: { x: 84, y: 54, scale: 1.0, visible: true },
  dpad: { x: 16, y: 78, scale: 1.0, visible: true },
  turboA: { x: 78, y: 72, scale: 1.0, visible: true },
  b: { x: 90, y: 72, scale: 1.0, visible: true },
  turboB: { x: 78, y: 86, scale: 1.0, visible: true },
  a: { x: 90, y: 86, scale: 1.0, visible: true },
}

export const DEFAULT_TOUCH_LAYOUT: GameTouchLayout = {
  portrait: DEFAULT_PORTRAIT_LAYOUT,
  landscape: DEFAULT_LANDSCAPE_LAYOUT,
}

export const TOUCH_ELEMENT_METADATA: Record<
  TouchElementKey,
  { label: string; desc: string; category: "direction" | "action" | "system" }
> = {
  dpad: { label: "D-Pad", desc: "8-Way Directional Pad", category: "direction" },
  a: { label: "Button A", desc: "Jump / Primary Action", category: "action" },
  b: { label: "Button B", desc: "Run / Secondary Action", category: "action" },
  turboA: { label: "Turbo A", desc: "Rapid-fire A", category: "action" },
  turboB: { label: "Turbo B", desc: "Rapid-fire B", category: "action" },
  select: { label: "Select", desc: "Select / Mode", category: "system" },
  start: { label: "Start", desc: "Start / Pause", category: "system" },
  menu: { label: "Menu", desc: "In-game Menu", category: "system" },
}

const STORAGE_PREFIX = "nostanes_touch_layout_v1_"
const GLOBAL_DEFAULT_KEY = "nostanes_touch_layout_v1_default"

export function sanitizeGameKey(gameKey?: string): string {
  if (!gameKey) return "default"
  return gameKey.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()
}

function cloneLayout<T>(val: T): T {
  return JSON.parse(JSON.stringify(val)) as T
}

function normalizeOrientationLayout(
  raw: Partial<TouchOrientationLayout> | undefined,
  fallback: TouchOrientationLayout,
): TouchOrientationLayout {
  const result: TouchOrientationLayout = { ...fallback }
  if (!raw || typeof raw !== "object") return result

  const keys: TouchElementKey[] = [
    "dpad",
    "a",
    "b",
    "turboA",
    "turboB",
    "select",
    "start",
    "menu",
  ]

  for (const k of keys) {
    const item = raw[k]
    if (
      item &&
      typeof item.x === "number" &&
      typeof item.y === "number" &&
      typeof item.scale === "number"
    ) {
      result[k] = {
        x: Math.max(2, Math.min(98, item.x)),
        y: Math.max(2, Math.min(98, item.y)),
        scale: Math.max(0.5, Math.min(2.0, item.scale)),
        visible: item.visible !== false,
      }
    }
  }

  return result
}

function normalizeGameLayout(
  raw: Partial<GameTouchLayout> | undefined,
): GameTouchLayout {
  return {
    portrait: normalizeOrientationLayout(raw?.portrait, DEFAULT_PORTRAIT_LAYOUT),
    landscape: normalizeOrientationLayout(raw?.landscape, DEFAULT_LANDSCAPE_LAYOUT),
  }
}

/**
 * Retrieve the saved touch layout for a specific game, falling back to user's global default,
 * then system defaults.
 */
export function getTouchLayout(gameKey?: string): GameTouchLayout {
  if (typeof window === "undefined" || !window.localStorage) {
    return cloneLayout(DEFAULT_TOUCH_LAYOUT)
  }

  const sanitized = sanitizeGameKey(gameKey)

  try {
    // 1. Try game-specific config
    if (sanitized !== "default") {
      const savedGame = window.localStorage.getItem(STORAGE_PREFIX + sanitized)
      if (savedGame) {
        const parsed = JSON.parse(savedGame) as Partial<GameTouchLayout>
        return normalizeGameLayout(parsed)
      }
    }

    // 2. Try global custom default
    const savedGlobal = window.localStorage.getItem(GLOBAL_DEFAULT_KEY)
    if (savedGlobal) {
      const parsed = JSON.parse(savedGlobal) as Partial<GameTouchLayout>
      return normalizeGameLayout(parsed)
    }
  } catch (err) {
    console.warn("Failed to load custom touch controls layout:", err)
  }

  return cloneLayout(DEFAULT_TOUCH_LAYOUT)
}

/**
 * Retrieve the layout for a single orientation (portrait or landscape).
 */
export function getOrientationTouchLayout(
  gameKey: string | undefined,
  orientation: "portrait" | "landscape",
): TouchOrientationLayout {
  const full = getTouchLayout(gameKey)
  return full[orientation]
}

/**
 * Save touch layout for a specific game and orientation.
 */
export function saveTouchLayout(
  gameKey: string | undefined,
  orientation: "portrait" | "landscape",
  layout: TouchOrientationLayout,
): void {
  if (typeof window === "undefined" || !window.localStorage) return

  const sanitized = sanitizeGameKey(gameKey)
  const full = getTouchLayout(gameKey)
  full[orientation] = normalizeOrientationLayout(layout, DEFAULT_TOUCH_LAYOUT[orientation])

  try {
    const key = sanitized === "default" ? GLOBAL_DEFAULT_KEY : STORAGE_PREFIX + sanitized
    window.localStorage.setItem(key, JSON.stringify(full))
  } catch (err) {
    console.error("Failed to save touch controls layout:", err)
  }
}

/**
 * Save complete touch layout (portrait & landscape) for a specific game.
 */
export function saveFullTouchLayout(
  gameKey: string | undefined,
  layout: GameTouchLayout,
): void {
  if (typeof window === "undefined" || !window.localStorage) return

  const sanitized = sanitizeGameKey(gameKey)
  const normalized = normalizeGameLayout(layout)

  try {
    const key = sanitized === "default" ? GLOBAL_DEFAULT_KEY : STORAGE_PREFIX + sanitized
    window.localStorage.setItem(key, JSON.stringify(normalized))
  } catch (err) {
    console.error("Failed to save touch controls layout:", err)
  }
}

/**
 * Apply the current orientation layout as the default for all games.
 */
export function applyLayoutToAllGames(
  orientation: "portrait" | "landscape",
  layout: TouchOrientationLayout,
): void {
  if (typeof window === "undefined" || !window.localStorage) return

  const globalLayout = getTouchLayout("default")
  globalLayout[orientation] = normalizeOrientationLayout(
    layout,
    DEFAULT_TOUCH_LAYOUT[orientation],
  )

  try {
    window.localStorage.setItem(GLOBAL_DEFAULT_KEY, JSON.stringify(globalLayout))

    // Also update any existing per-game configurations for this orientation
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const item = window.localStorage.getItem(key)
          if (item) {
            const parsed = JSON.parse(item) as GameTouchLayout
            parsed[orientation] = cloneLayout(globalLayout[orientation])
            window.localStorage.setItem(key, JSON.stringify(parsed))
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error("Failed to apply touch layout to all games:", err)
  }
}

/**
 * Reset a game's layout for one orientation back to system default.
 */
export function resetOrientationTouchLayout(
  gameKey: string | undefined,
  orientation: "portrait" | "landscape",
): TouchOrientationLayout {
  const defaultLayout = cloneLayout(DEFAULT_TOUCH_LAYOUT[orientation])
  saveTouchLayout(gameKey, orientation, defaultLayout)
  return defaultLayout
}

/**
 * Reset all orientations for a game back to system defaults.
 */
export function resetAllTouchLayoutForGame(gameKey: string | undefined): GameTouchLayout {
  const defaultLayout = cloneLayout(DEFAULT_TOUCH_LAYOUT)
  saveFullTouchLayout(gameKey, defaultLayout)
  return defaultLayout
}
