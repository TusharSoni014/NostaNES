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

export function getCustomControls(): CustomControlsConfig {
  if (typeof window === "undefined") {
    return {
      keyboard: { ...DEFAULT_KEYBOARD_CONTROLS },
      gamepad: { ...DEFAULT_GAMEPAD_CONTROLS },
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        keyboard: { ...DEFAULT_KEYBOARD_CONTROLS },
        gamepad: { ...DEFAULT_GAMEPAD_CONTROLS },
      }
    }
    const parsed = JSON.parse(raw) as Partial<CustomControlsConfig>
    const keyboard = { ...DEFAULT_KEYBOARD_CONTROLS }
    const gamepad = { ...DEFAULT_GAMEPAD_CONTROLS }

    if (parsed.keyboard && typeof parsed.keyboard === "object") {
      for (const k of Object.keys(DEFAULT_KEYBOARD_CONTROLS) as NesActionKey[]) {
        if (typeof parsed.keyboard[k] === "string" && parsed.keyboard[k].trim() !== "") {
          keyboard[k] = parsed.keyboard[k].trim()
        }
      }
    }

    if (parsed.gamepad && typeof parsed.gamepad === "object") {
      for (const k of Object.keys(DEFAULT_GAMEPAD_CONTROLS) as NesActionKey[]) {
        if (typeof parsed.gamepad[k] === "string" && parsed.gamepad[k].trim() !== "") {
          gamepad[k] = parsed.gamepad[k].trim()
        }
      }
    }

    return { keyboard, gamepad }
  } catch {
    return {
      keyboard: { ...DEFAULT_KEYBOARD_CONTROLS },
      gamepad: { ...DEFAULT_GAMEPAD_CONTROLS },
    }
  }
}

export function saveCustomControls(config: CustomControlsConfig): void {
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
