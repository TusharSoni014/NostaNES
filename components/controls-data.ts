export type ControlItem = {
  label: string
  keys: string[]
  detail?: string
}

export const GAMEPAD_LIBRARY_CONTROLS: ControlItem[] = [
  { label: "Scroll Cartridges", keys: ["D-Pad", "L-Stick"] },
  { label: "Jump 10 Games", keys: ["LB", "RB"], detail: "Page up / down" },
  { label: "Random Game", keys: ["LB + RB"], detail: "Press both shoulders together" },
  { label: "Start Game", keys: ["A", "✕"], detail: "Launch cartridge (Start works too)" },
  { label: "Toggle Controls", keys: ["Y", "△"] },
  { label: "Player 2 pad", keys: ["2nd Pad"], detail: "Plays in-game only. Does not move menus." },
]

export const GAMEPAD_NES_CONTROLS: ControlItem[] = [
  { label: "D-Pad / Movement", keys: ["D-Pad", "L-Stick"] },
  { label: "NES B (Run / Attack)", keys: ["A", "✕"], detail: "Standard B" },
  { label: "NES A (Jump / Action)", keys: ["B", "○"], detail: "Standard A" },
  { label: "Turbo B (Rapid-fire)", keys: ["X", "□"], detail: "Turbo B" },
  { label: "Turbo A (Rapid-fire)", keys: ["Y", "△"], detail: "Turbo A" },
  { label: "Start", keys: ["Menu", "Options"] },
  { label: "Select", keys: ["View", "Share"] },
  { label: "Fullscreen", keys: ["R3"], detail: "Press Right Stick" },
  { label: "In-Game Menu", keys: ["Select + Start"], detail: "Save, load, controls" },
  { label: "Hold to Exit (2s)", keys: ["Select"], detail: "Hold 2s to leave" },
  { label: "Game Speed", keys: ["RT / LT", "R2 / L2"], detail: "Faster / slower, 1x to 10x" },
  { label: "Quick Save (hold 2s)", keys: ["RB", "R1"], detail: "Separate quick save slot" },
  { label: "Quick Load (hold 2s)", keys: ["LB", "L1"], detail: "Loads the quick save" },
  { label: "Random Game", keys: ["LB + RB", "L1 + R1"], detail: "Press both shoulders together" },
  { label: "Player 2", keys: ["2nd Pad"], detail: "Same face buttons. Menus stay on the first pad." },
]

export const KEYBOARD_LIBRARY_CONTROLS: ControlItem[] = [
  { label: "Scroll Cartridges", keys: ["↑", "↓"] },
  { label: "Start Game", keys: ["Enter"] },
  { label: "Player 2", keys: ["Numpad"], detail: "Plays in-game only. Does not move the library." },
]

export const KEYBOARD_NES_CONTROLS: ControlItem[] = [
  { label: "D-Pad", keys: ["Arrows"] },
  { label: "NES B button", keys: ["Z"], detail: "Standard B" },
  { label: "NES A button", keys: ["X"], detail: "Standard A" },
  { label: "Turbo B button", keys: ["A"], detail: "Rapid-fire B" },
  { label: "Turbo A button", keys: ["S"], detail: "Rapid-fire A" },
  { label: "Start", keys: ["Enter"] },
  { label: "Select", keys: ["Shift"] },
  { label: "In-Game Menu", keys: ["F1"], detail: "Save, load, controls" },
  { label: "Fullscreen", keys: ["F"] },
  { label: "Pause / Exit", keys: ["Esc"] },
  { label: "Game Speed", keys: ["] / ["], detail: "Faster / slower, 1x to 10x" },
  { label: "Quick Save (hold 2s)", keys: ["."], detail: "Separate quick save slot" },
  { label: "Quick Load (hold 2s)", keys: [","], detail: "Loads the quick save" },
]

export const KEYBOARD_P2_CONTROLS: ControlItem[] = [
  { label: "D-Pad", keys: ["Num 5", "Num 2", "Num 1", "Num 3"], detail: "Up, down, left, right" },
  { label: "NES A button", keys: ["Num 7"], detail: "Jump / Action" },
  { label: "NES B button", keys: ["Num 8"], detail: "Run / Attack" },
  { label: "Turbo A", keys: ["Num Add"], detail: "Number pad +" },
  { label: "Turbo B", keys: ["Num Minus"], detail: "Number pad −" },
  { label: "Start", keys: ["Num Enter"] },
  { label: "Select", keys: ["Num 0"] },
]
