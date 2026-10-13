export type UiSound =
  | "navigation"
  | "option_selected"
  | "game_start"
  | "notification"
  | "game_paused"
  | "error"

const FILES: Record<UiSound | "booting", string> = {
  navigation: "/sounds/navigation.mp3",
  option_selected: "/sounds/option_selected.mp3",
  game_start: "/sounds/game_start.mp3",
  notification: "/sounds/notification.mp3",
  game_paused: "/sounds/game_paused.mp3",
  error: "/sounds/error.mp3",
  booting: "/sounds/booting.mp3",
}

const VOLUME: Record<UiSound | "booting", number> = {
  navigation: 0.42,
  option_selected: 0.55,
  game_start: 0.74,
  notification: 0.58,
  game_paused: 0.62,
  error: 0.64,
  booting: 0.9,
}

/** Ignore retriggers closer than this so holds and Strict Mode don't stack. */
const MIN_GAP_MS: Record<UiSound, number> = {
  navigation: 50,
  option_selected: 80,
  game_start: 350,
  notification: 350,
  game_paused: 350,
  error: 350,
}

const clips = new Map<string, HTMLAudioElement>()
const lastPlayed = new Map<string, number>()
const queued: UiSound[] = []

let uiSoundsEnabled = false
let bootAudio: HTMLAudioElement | null = null

const clip = (name: UiSound | "booting") => {
  const existing = clips.get(name)
  if (existing) return existing
  const audio = new Audio(FILES[name])
  audio.preload = "auto"
  clips.set(name, audio)
  return audio
}

export const preloadUiSounds = () => {
  if (typeof window === "undefined") return
  for (const name of Object.keys(FILES) as Array<UiSound | "booting">) {
    if (name === "booting") getBootAudio()
    else clip(name)
  }
}

export const getBootAudio = () => {
  if (!bootAudio) {
    bootAudio = new Audio(FILES.booting)
    bootAudio.preload = "auto"
    bootAudio.volume = VOLUME.booting
  }
  return bootAudio
}

export const enableUiSounds = () => {
  uiSoundsEnabled = true
  const pending = queued.splice(0)
  for (const name of pending) playUiSound(name)
}

export const playUiSound = (name: UiSound) => {
  if (typeof window === "undefined") return
  if (!uiSoundsEnabled) {
    if (name === "error" || name === "notification" || name === "game_paused") {
      queued.push(name)
    }
    return
  }

  const now = performance.now()
  const previous = lastPlayed.get(name) ?? 0
  if (now - previous < MIN_GAP_MS[name]) return
  lastPlayed.set(name, now)

  if (name === "game_start") {
    const nav = clips.get("navigation")
    if (nav) {
      nav.pause()
      nav.currentTime = 0
    }
  }

  const audio = clip(name)
  audio.volume = VOLUME[name]
  audio.pause()
  audio.currentTime = 0
  void audio.play().catch(() => {})
}
