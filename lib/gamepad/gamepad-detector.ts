import type { GamepadFamily, GamepadProfile } from "./gamepad-types"

const XBOX_PATTERNS = ["xbox", "045e", "x-box", "xinput"]
const PLAYSTATION_PATTERNS = ["sony", "dualshock", "dualsense", "054c", "playstation"]
const NINTENDO_PATTERNS = ["nintendo", "057e", "switch", "pro controller", "joy-con"]

export const detectGamepadFamily = (id: string): GamepadFamily => {
  const normalized = id.toLowerCase()

  if (XBOX_PATTERNS.some((pat) => normalized.includes(pat))) {
    return "xbox"
  }

  if (PLAYSTATION_PATTERNS.some((pat) => normalized.includes(pat))) {
    return "playstation"
  }

  if (NINTENDO_PATTERNS.some((pat) => normalized.includes(pat))) {
    return "nintendo"
  }

  return "generic"
}

export const getGamepadProfile = (gamepad: Gamepad | null): GamepadProfile => {
  if (!gamepad) {
    return {
      family: "generic",
      name: "Gamepad",
      confirmButton: "A",
      cancelButton: "B",
      extraAction: "X",
      menuButton: "Menu",
    }
  }

  const family = detectGamepadFamily(gamepad.id)

  if (family === "xbox") {
    return {
      family: "xbox",
      name: "Xbox Controller",
      confirmButton: "A",
      cancelButton: "B",
      extraAction: "X",
      menuButton: "Menu",
    }
  }

  if (family === "playstation") {
    return {
      family: "playstation",
      name: "PlayStation Controller",
      confirmButton: "✕",
      cancelButton: "○",
      extraAction: "□",
      menuButton: "Options",
    }
  }

  if (family === "nintendo") {
    return {
      family: "nintendo",
      name: "Nintendo Controller",
      confirmButton: "B",
      cancelButton: "A",
      extraAction: "Y",
      menuButton: "+",
    }
  }

  return {
    family: "generic",
    name: "Gamepad",
    confirmButton: "Button 0",
    cancelButton: "Button 1",
    extraAction: "Button 2",
    menuButton: "Start",
  }
}
