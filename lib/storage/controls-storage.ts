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

export type PlayerSlot = 1 | 2

export type CustomKeyboardMap = Record<NesActionKey, string>
export type CustomGamepadMap = Record<NesActionKey, string>

export type CustomControlsConfig = {
  keyboard: CustomKeyboardMap
  gamepad: CustomGamepadMap
}

export type ControlsProfile = {
  player1: CustomControlsConfig
  player2: CustomControlsConfig
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

/**
 * Player 2 keyboard defaults sit on the number pad so they never overlap
 * player 1's arrows. 5/2/1/3 is the direction diamond, and 7/8/+/- is A/B/X/Y.
 * 0 and Num Enter are Select and Start.
 */
export const DEFAULT_KEYBOARD_CONTROLS_P2: CustomKeyboardMap = {
  up: "num5",
  down: "num2",
  left: "num1",
  right: "num3",
  a: "num7",
  b: "num8",
  turboA: "kp_plus",
  turboB: "kp_minus",
  select: "num0",
  start: "kp_enter",
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
const ACTION_KEYS = Object.keys(DEFAULT_KEYBOARD_CONTROLS) as NesActionKey[]

export function controlsSlot(player: PlayerSlot): keyof ControlsProfile {
  return player === 1 ? "player1" : "player2"
}

/** Assign `code` to `action` and clear it from every other action in this map. */
export function assignControlInput(
  map: Record<NesActionKey, string>,
  action: NesActionKey,
  code: string,
): Record<NesActionKey, string> {
  const next = { ...map }
  for (const key of ACTION_KEYS) {
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
    for (const key of ACTION_KEYS) {
      const value = stored[key]
      if (typeof value === "string") map[key] = value.trim()
    }
  }
  return map
}

export function createDefaultProfile(): ControlsProfile {
  return {
    player1: {
      keyboard: { ...DEFAULT_KEYBOARD_CONTROLS },
      gamepad: { ...DEFAULT_GAMEPAD_CONTROLS },
    },
    player2: {
      keyboard: { ...DEFAULT_KEYBOARD_CONTROLS_P2 },
      gamepad: { ...DEFAULT_GAMEPAD_CONTROLS },
    },
  }
}

function readConfig(defaults: CustomControlsConfig, stored: unknown): CustomControlsConfig {
  const source =
    stored && typeof stored === "object"
      ? (stored as Partial<CustomControlsConfig>)
      : {}
  return {
    keyboard: readStoredMap(defaults.keyboard, source.keyboard),
    gamepad: readStoredMap(defaults.gamepad, source.gamepad),
  }
}

/** One physical key drives one player. Player 1 keeps the key if both claim it. */
function clearKeyboardOverlaps(profile: ControlsProfile): ControlsProfile {
  const usedByPlayer1 = new Set(
    Object.values(profile.player1.keyboard).filter((code) => code.length > 0),
  )
  const keyboard = { ...profile.player2.keyboard }
  let changed = false
  for (const key of ACTION_KEYS) {
    if (keyboard[key] && usedByPlayer1.has(keyboard[key])) {
      keyboard[key] = ""
      changed = true
    }
  }
  if (!changed) return profile
  return { ...profile, player2: { ...profile.player2, keyboard } }
}

function parseStored(raw: string): ControlsProfile {
  const defaults = createDefaultProfile()
  const parsed = JSON.parse(raw) as Record<string, unknown>
  if (parsed.player1 || parsed.player2) {
    return clearKeyboardOverlaps({
      player1: readConfig(defaults.player1, parsed.player1),
      player2: readConfig(defaults.player2, parsed.player2),
    })
  }
  return clearKeyboardOverlaps({
    player1: readConfig(defaults.player1, parsed),
    player2: defaults.player2,
  })
}

let cachedProfile: ControlsProfile | null = null

export function getControlsProfile(): ControlsProfile {
  if (cachedProfile) return cachedProfile
  if (typeof window === "undefined") return createDefaultProfile()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cachedProfile = raw ? parseStored(raw) : createDefaultProfile()
    return cachedProfile
  } catch {
    cachedProfile = createDefaultProfile()
    return cachedProfile
  }
}

export function getPlayerControls(player: PlayerSlot): CustomControlsConfig {
  return getControlsProfile()[controlsSlot(player)]
}

export function saveControlsProfile(profile: ControlsProfile): void {
  cachedProfile = profile
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch (err) {
    console.error("Failed to save controls to localStorage:", err)
  }
}

export function assignKeyboardBinding(
  profile: ControlsProfile,
  player: PlayerSlot,
  action: NesActionKey,
  code: string,
): ControlsProfile {
  const slot = controlsSlot(player)
  const other = controlsSlot(player === 1 ? 2 : 1)
  const keyboard = assignControlInput(profile[slot].keyboard, action, code)
  const otherKeyboard = { ...profile[other].keyboard }
  if (code) {
    for (const key of ACTION_KEYS) {
      if (otherKeyboard[key] === code) otherKeyboard[key] = ""
    }
  }
  return {
    ...profile,
    [slot]: { ...profile[slot], keyboard },
    [other]: { ...profile[other], keyboard: otherKeyboard },
  }
}

export function assignGamepadBinding(
  profile: ControlsProfile,
  player: PlayerSlot,
  action: NesActionKey,
  code: string,
): ControlsProfile {
  const slot = controlsSlot(player)
  return {
    ...profile,
    [slot]: {
      ...profile[slot],
      gamepad: assignControlInput(profile[slot].gamepad, action, code),
    },
  }
}

export function resetPlayerControls(player: PlayerSlot): ControlsProfile {
  const defaults = createDefaultProfile()
  const slot = controlsSlot(player)
  const next = clearKeyboardOverlaps({
    ...getControlsProfile(),
    [slot]: defaults[slot],
  })
  saveControlsProfile(next)
  return next
}
