export type NesActionKey =
  | "up"
  | "down"
  | "left"
  | "right"
  | "b"
  | "a"
  | "turboB"
  | "turboA"
  | "select"
  | "start"

export type CustomKeyboardMap = Record<NesActionKey, string>
export type CustomGamepadMap = Record<NesActionKey, string>

export type CustomControlsConfig = {
  keyboard: CustomKeyboardMap
  gamepad: CustomGamepadMap
}

export const DEFAULT_KEYBOARD_CONTROLS: CustomKeyboardMap = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
  b: "z",
  a: "x",
  turboB: "a",
  turboA: "s",
  select: "shift",
  start: "enter",
}

export const DEFAULT_GAMEPAD_CONTROLS: CustomGamepadMap = {
  up: "12",
  down: "13",
  left: "14",
  right: "15",
  b: "0", // Xbox A / PS ✕ -> NES B
  a: "1", // Xbox B / PS ○ -> NES A
  turboB: "2", // Xbox X / PS □ -> Turbo B
  turboA: "3", // Xbox Y / PS △ -> Turbo A
  select: "8",
  start: "9",
}

export const ACTION_LABELS: Record<NesActionKey, { label: string; desc: string }> = {
  up: { label: "D-Pad Up", desc: "Move Up" },
  down: { label: "D-Pad Down", desc: "Move Down" },
  left: { label: "D-Pad Left", desc: "Move Left" },
  right: { label: "D-Pad Right", desc: "Move Right" },
  b: { label: "NES B", desc: "Standard B (Run / Attack)" },
  a: { label: "NES A", desc: "Standard A (Jump / Action)" },
  turboB: { label: "Turbo B", desc: "Rapid-fire B" },
  turboA: { label: "Turbo A", desc: "Rapid-fire A" },
  select: { label: "Select", desc: "Select / Mode" },
  start: { label: "Start", desc: "Start / Pause" },
}

const STORAGE_KEY = "nostanes_custom_controls_v1"

/** Assign `code` to `action` and clear it from every other action. */
export function assignControlInput(
  map: Record<NesActionKey, string>,
  action: NesActionKey,
  code: string,
): Record<NesActionKey, string> {
  const next = { ...map }
  for (const key of Object.keys(next) as NesActionKey[]) {
    if (key !== action && next[key] === code) next[key] = ""
  }
  next[action] = code
  return next
}

function readStoredMap(
  defaults: Record<NesActionKey, string>,
  stored: Partial<Record<NesActionKey, string>> | undefined,
): Record<NesActionKey, string> {
  const map = { ...defaults }
  if (stored && typeof stored === "object") {
    for (const key of Object.keys(defaults) as NesActionKey[]) {
      const value = stored[key]
      if (typeof value === "string") map[key] = value.trim()
    }
  }
  return map
}

let cachedControls: CustomControlsConfig | null = null

export function getCustomControls(): CustomControlsConfig {
  if (cachedControls) return cachedControls
  if (typeof window === "undefined") {
    return {
      keyboard: { ...DEFAULT_KEYBOARD_CONTROLS },
      gamepad: { ...DEFAULT_GAMEPAD_CONTROLS },
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      cachedControls = {
        keyboard: { ...DEFAULT_KEYBOARD_CONTROLS },
        gamepad: { ...DEFAULT_GAMEPAD_CONTROLS },
      }
      return cachedControls
    }
    const parsed = JSON.parse(raw) as Partial<CustomControlsConfig>
    cachedControls = {
      keyboard: readStoredMap(DEFAULT_KEYBOARD_CONTROLS, parsed.keyboard),
      gamepad: readStoredMap(DEFAULT_GAMEPAD_CONTROLS, parsed.gamepad),
    }
    return cachedControls
  } catch {
    cachedControls = {
      keyboard: { ...DEFAULT_KEYBOARD_CONTROLS },
      gamepad: { ...DEFAULT_GAMEPAD_CONTROLS },
    }
    return cachedControls
  }
}

export function saveCustomControls(config: CustomControlsConfig): void {
  cachedControls = config
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (err) {
    console.error("Failed to save controls to localStorage:", err)
  }
}

export function resetCustomControls(): CustomControlsConfig {
  const defaults: CustomControlsConfig = {
    keyboard: { ...DEFAULT_KEYBOARD_CONTROLS },
    gamepad: { ...DEFAULT_GAMEPAD_CONTROLS },
  }
  saveCustomControls(defaults)
  return defaults
}
