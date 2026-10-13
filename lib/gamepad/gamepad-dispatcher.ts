import type { GamepadAction } from "./gamepad-types"

type GamepadListenerCallback = (action: GamepadAction) => void

const AXIS_ENGAGE_THRESHOLD = 0.55
const AXIS_RELEASE_THRESHOLD = 0.25
const INITIAL_REPEAT_DELAY_MS = 380 // Initial hold delay before stepping begins
const STEADY_REPEAT_INTERVAL_MS = 160 // Console-grade steady stepping (~6 items/sec)
const FAST_SCROLL_HOLD_THRESHOLD_MS = 2500 // Hold 2.5s to unlock turbo scrubbing
const TURBO_REPEAT_INTERVAL_MS = 70 // Turbo scrubbing interval

export class GamepadDispatcher {
  private frameId = 0
  private running = false
  private callback: GamepadListenerCallback
  private buttonPreviousStates = new Map<number, boolean>()

  // Directional navigation state
  private activeDirection: GamepadAction | null = null
  private pressStartTime = 0
  private nextRepeatTime = 0

  constructor(callback: GamepadListenerCallback) {
    this.callback = callback
  }

  start = (): void => {
    if (this.running) return
    this.running = true
    this.tick(performance.now())
  }

  stop = (): void => {
    this.running = false
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = 0
    }
    this.buttonPreviousStates.clear()
    this.activeDirection = null
    this.pressStartTime = 0
    this.nextRepeatTime = 0
  }

  private tick = (time: number): void => {
    if (!this.running) return

    const pads = navigator.getGamepads?.() ?? []
    const pad = Array.from(pads).find((p): p is Gamepad => Boolean(p && p.connected))

    if (!pad) {
      this.frameId = requestAnimationFrame(this.tick)
      return
    }

    this.processButtons(pad)
    this.processAxesAndDpad(pad, time)

    this.frameId = requestAnimationFrame(this.tick)
  }

  private isButtonPressed = (pad: Gamepad, index: number): boolean => {
    const btn = pad.buttons[index]
    if (!btn) return false
    return typeof btn === "object" ? btn.pressed : Boolean(btn)
  }

  private checkSinglePress = (
    pad: Gamepad,
    btnIndex: number,
    action: GamepadAction,
  ): void => {
    const isPressed = this.isButtonPressed(pad, btnIndex)
    const wasPressed = this.buttonPreviousStates.get(btnIndex) ?? false

    if (isPressed && !wasPressed) {
      this.callback(action)
    }

    this.buttonPreviousStates.set(btnIndex, isPressed)
  }

  private processButtons = (pad: Gamepad): void => {
    // 0: A (Confirm), 1: B (Cancel), 2: X (Fullscreen), 3: Y (Controls)
    this.checkSinglePress(pad, 0, "CONFIRM")
    this.checkSinglePress(pad, 1, "CANCEL")
    this.checkSinglePress(pad, 2, "TOGGLE_FULLSCREEN")
    this.checkSinglePress(pad, 3, "TOGGLE_CONTROLS")

    // 4: LB (Page Up), 5: RB (Page Down)
    this.checkSinglePress(pad, 4, "PAGE_UP")
    this.checkSinglePress(pad, 5, "PAGE_DOWN")

    // 8: Back/View, 9: Start/Menu, 16: Guide/Home
    this.checkSinglePress(pad, 8, "MENU")
    this.checkSinglePress(pad, 9, "MENU")
    this.checkSinglePress(pad, 16, "MENU")
  }

  private detectCurrentNav = (pad: Gamepad): GamepadAction | null => {
    // 1. Digital D-pad buttons take absolute priority over analog sticks
    if (this.isButtonPressed(pad, 12)) return "NAV_UP"
    if (this.isButtonPressed(pad, 13)) return "NAV_DOWN"
    if (this.isButtonPressed(pad, 14)) return "NAV_LEFT"
    if (this.isButtonPressed(pad, 15)) return "NAV_RIGHT"

    // 2. Analog thumbstick with hysteresis and dominant-axis resolution
    const axisX = pad.axes[0] ?? 0
    const axisY = pad.axes[1] ?? 0
    const threshold = this.activeDirection ? AXIS_RELEASE_THRESHOLD : AXIS_ENGAGE_THRESHOLD

    const absX = Math.abs(axisX)
    const absY = Math.abs(axisY)

    if (absY >= absX && absY > threshold) {
      return axisY < 0 ? "NAV_UP" : "NAV_DOWN"
    }

    if (absX > absY && absX > threshold) {
      return axisX < 0 ? "NAV_LEFT" : "NAV_RIGHT"
    }

    return null
  }

  private processAxesAndDpad = (pad: Gamepad, time: number): void => {
    const currentNav = this.detectCurrentNav(pad)

    // Direction fully released
    if (!currentNav) {
      this.activeDirection = null
      this.pressStartTime = 0
      this.nextRepeatTime = 0
      return
    }

    // Direction newly pressed: step once immediately and start initial delay
    if (this.activeDirection !== currentNav) {
      this.activeDirection = currentNav
      this.pressStartTime = time
      this.nextRepeatTime = time + INITIAL_REPEAT_DELAY_MS
      this.callback(currentNav)
      return
    }

    // Direction continuously held: step at steady pace, then turbo after 2.5s
    if (time >= this.nextRepeatTime) {
      this.callback(currentNav)

      const heldDuration = time - this.pressStartTime
      const repeatInterval =
        heldDuration >= FAST_SCROLL_HOLD_THRESHOLD_MS
          ? TURBO_REPEAT_INTERVAL_MS
          : STEADY_REPEAT_INTERVAL_MS

      this.nextRepeatTime = time + repeatInterval
    }
  }
}
