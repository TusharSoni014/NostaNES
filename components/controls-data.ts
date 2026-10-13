export type ControlItem = {
  label: string
  keys: string[]
  detail?: string
}

export const GAMEPAD_LIBRARY_CONTROLS: ControlItem[] = [
  { label: "Scroll Cartridges", keys: ["D-Pad", "L-Stick"] },
  { label: "Jump 10 Games", keys: ["LB", "RB"], detail: "Page up / down" },
  { label: "Start Game", keys: ["A", "✕"], detail: "Launch cartridge" },
  { label: "Toggle Controls", keys: ["Y", "△"] },
]

export const GAMEPAD_NES_CONTROLS: ControlItem[] = [
  { label: "D-Pad / Movement", keys: ["D-Pad", "L-Stick"] },
  { label: "NES B (Run / Attack)", keys: ["A", "✕"], detail: "Standard B" },
  { label: "NES A (Jump / Action)", keys: ["B", "○"], detail: "Standard A" },
  { label: "Turbo B (Rapid-fire)", keys: ["X", "□"], detail: "Turbo B" },
  { label: "Turbo A (Rapid-fire)", keys: ["Y", "△"], detail: "Turbo A" },
  { label: "Start", keys: ["Menu", "Options"] },
  { label: "Select", keys: ["View", "Share"] },
  { label: "Fullscreen", keys: ["L3"], detail: "Press Left Stick" },
  { label: "Hold to Exit (5s)", keys: ["Select"], detail: "Hold 5s to leave" },
]

export const KEYBOARD_LIBRARY_CONTROLS: ControlItem[] = [
  { label: "Scroll Cartridges", keys: ["↑", "↓"] },
  { label: "Start Game", keys: ["Enter"] },
]

export const KEYBOARD_NES_CONTROLS: ControlItem[] = [
  { label: "D-Pad", keys: ["Arrows"] },
  { label: "NES B button", keys: ["Z"], detail: "Standard B" },
  { label: "NES A button", keys: ["X"], detail: "Standard A" },
  { label: "Turbo B button", keys: ["A"], detail: "Rapid-fire B" },
  { label: "Turbo A button", keys: ["S"], detail: "Rapid-fire A" },
  { label: "Start", keys: ["Enter"] },
  { label: "Select", keys: ["Shift"] },
  { label: "Fullscreen", keys: ["F"] },
  { label: "Pause / Exit", keys: ["Esc"] },
]
