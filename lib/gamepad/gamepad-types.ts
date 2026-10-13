export type GamepadFamily = "xbox" | "playstation" | "nintendo" | "generic"

export type GamepadButtonCode =
  | "A"
  | "B"
  | "X"
  | "Y"
  | "LB"
  | "RB"
  | "LT"
  | "RT"
  | "SELECT"
  | "START"
  | "L3"
  | "R3"
  | "DPAD_UP"
  | "DPAD_DOWN"
  | "DPAD_LEFT"
  | "DPAD_RIGHT"
  | "GUIDE"

export const STANDARD_BUTTON_MAP: Record<number, GamepadButtonCode> = {
  0: "A",
  1: "B",
  2: "X",
  3: "Y",
  4: "LB",
  5: "RB",
  6: "LT",
  7: "RT",
  8: "SELECT",
  9: "START",
  10: "L3",
  11: "R3",
  12: "DPAD_UP",
  13: "DPAD_DOWN",
  14: "DPAD_LEFT",
  15: "DPAD_RIGHT",
  16: "GUIDE",
}

export type GamepadAction =
  | "NAV_UP"
  | "NAV_DOWN"
  | "NAV_LEFT"
  | "NAV_RIGHT"
  | "CONFIRM"
  | "CANCEL"
  | "PAGE_UP"
  | "PAGE_DOWN"
  | "TOGGLE_CONTROLS"
  | "TOGGLE_FULLSCREEN"
  | "MENU"
  | "IN_GAME_MENU"

export type GamepadProfile = {
  family: GamepadFamily
  name: string
  confirmButton: string
  cancelButton: string
  extraAction: string
  menuButton: string
}
