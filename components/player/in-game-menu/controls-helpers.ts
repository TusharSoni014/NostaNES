import type { NesActionKey } from "@/lib/storage/controls-storage"

export type GamepadButtonInfo = {
  label: string
  xbox: string
  ps: string
}

export const GAMEPAD_BUTTON_LABELS: Record<string, GamepadButtonInfo> = {
  "0": { label: "A / ✕", xbox: "A", ps: "✕ Cross" },
  "1": { label: "B / ○", xbox: "B", ps: "○ Circle" },
  "2": { label: "X / □", xbox: "X", ps: "□ Square" },
  "3": { label: "Y / △", xbox: "Y", ps: "△ Triangle" },
  "4": { label: "LB / L1", xbox: "LB", ps: "L1" },
  "5": { label: "RB / R1", xbox: "RB", ps: "R1" },
  "6": { label: "LT / L2", xbox: "LT", ps: "L2" },
  "7": { label: "RT / R2", xbox: "RT", ps: "R2" },
  "8": { label: "Select / Share", xbox: "View", ps: "Share" },
  "9": { label: "Start / Options", xbox: "Menu", ps: "Options" },
  "10": { label: "L3 / Left Stick", xbox: "LS", ps: "L3" },
  "11": { label: "R3 / Right Stick", xbox: "RS", ps: "R3" },
  "12": { label: "D-Pad Up", xbox: "D-Pad ↑", ps: "D-Pad ↑" },
  "13": { label: "D-Pad Down", xbox: "D-Pad ↓", ps: "D-Pad ↓" },
  "14": { label: "D-Pad Left", xbox: "D-Pad ←", ps: "D-Pad ←" },
  "15": { label: "D-Pad Right", xbox: "D-Pad →", ps: "D-Pad →" },
}

export function getGamepadButtonName(btnCode: string): string {
  if (!btnCode) return "None"
  return GAMEPAD_BUTTON_LABELS[btnCode]?.label ?? `Btn ${btnCode}`
}

export function getKeyboardKeyName(key: string): string {
  if (!key) return "None"
  const k = key.toLowerCase()
  const names: Record<string, string> = {
    up: "↑ Arrow Up",
    down: "↓ Arrow Down",
    left: "← Arrow Left",
    right: "→ Arrow Right",
    space: "Space",
    enter: "Enter",
    shift: "Shift",
    rshift: "Right Shift",
    ctrl: "Ctrl",
    rctrl: "Right Ctrl",
    alt: "Alt",
    tab: "Tab",
    backspace: "Backspace",
    capslock: "Caps Lock",
    escape: "Esc",
  }
  return names[k] ?? key.toUpperCase()
}

export function normalizeKeyboardEvent(e: KeyboardEvent): { retroarchKey: string; label: string } | null {
  if (e.key === "Escape") return null

  // Arrow keys
  if (e.code === "ArrowUp" || e.key === "ArrowUp") return { retroarchKey: "up", label: "↑ Arrow Up" }
  if (e.code === "ArrowDown" || e.key === "ArrowDown") return { retroarchKey: "down", label: "↓ Arrow Down" }
  if (e.code === "ArrowLeft" || e.key === "ArrowLeft") return { retroarchKey: "left", label: "← Arrow Left" }
  if (e.code === "ArrowRight" || e.key === "ArrowRight") return { retroarchKey: "right", label: "→ Arrow Right" }

  // Modifiers & special
  if (e.code === "Space" || e.key === " ") return { retroarchKey: "space", label: "Space" }
  if (e.code === "Enter" || e.key === "Enter") return { retroarchKey: "enter", label: "Enter" }
  if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.key === "Shift") return { retroarchKey: "shift", label: "Shift" }
  if (e.code === "ControlLeft" || e.code === "ControlRight" || e.key === "Control") return { retroarchKey: "ctrl", label: "Ctrl" }
  if (e.code === "AltLeft" || e.code === "AltRight" || e.key === "Alt") return { retroarchKey: "alt", label: "Alt" }
  if (e.code === "Tab" || e.key === "Tab") return { retroarchKey: "tab", label: "Tab" }
  if (e.code === "Backspace" || e.key === "Backspace") return { retroarchKey: "backspace", label: "Backspace" }

  // Standard letter keys
  if (e.code.startsWith("Key") && e.code.length === 4) {
    const char = e.code.slice(3).toLowerCase()
    return { retroarchKey: char, label: char.toUpperCase() }
  }

  // Digit keys
  if (e.code.startsWith("Digit") && e.code.length === 6) {
    const digit = e.code.slice(5)
    return { retroarchKey: digit, label: digit }
  }

  // Fallback single character
  if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
    const char = e.key.toLowerCase()
    return { retroarchKey: char, label: char.toUpperCase() }
  }

  return null
}

export type ActionCategory = {
  name: string
  keys: NesActionKey[]
}

export const ACTION_CATEGORIES: ActionCategory[] = [
  {
    name: "Directional Controls (D-Pad)",
    keys: ["up", "down", "left", "right"],
  },
  {
    name: "Action & Turbo Buttons",
    keys: ["b", "a", "turboB", "turboA"],
  },
  {
    name: "System",
    keys: ["select", "start"],
  },
]
