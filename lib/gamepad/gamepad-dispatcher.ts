import type { GamepadAction } from "./gamepad-types"

type GamepadListenerCallback = (action: GamepadAction) => void

export type GamepadHoldState = {
  active: boolean
  remainingSeconds: number
  progress: number
}

import { GAMEPAD_TIMING } from "./gamepad-timing"

export type GamepadDispatcherOptions = {
  onSelectHold?: (state: GamepadHoldState) => void
  onSelectHoldComplete?: () => void
}

const AXIS_ENGAGE_THRESHOLD = 0.55
const AXIS_RELEASE_THRESHOLD = 0.25

export class GamepadDispatcher {
  private frameId = 0
  private running = false
  private callback: GamepadListenerCallback
  private onSelectHold?: (state: GamepadHoldState) => void
  private onSelectHoldComplete?: () => void
  private buttonPreviousStates = new Map<number, boolean>()
  private activeDirection: GamepadAction | null = null
  private pressStartTime = 0
  private nextRepeatTime = 0
  private selectHoldStartTime = 0
  private selectHoldCompleted = false
  private selectStartComboActive = false

  constructor(callback: GamepadListenerCallback, options?: GamepadDispatcherOptions) {
    this.callback = callback
    this.onSelectHold = options?.onSelectHold
    this.onSelectHoldComplete = options?.onSelectHoldComplete
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
    this.selectHoldStartTime = 0
    this.selectHoldCompleted = false
    this.selectStartComboActive = false
  }

  private tick = (time: number): void => {
    if (!this.running) return

    const pads = navigator.getGamepads?.() ?? []
    const pad = Array.from(pads).find((p): p is Gamepad => Boolean(p && p.connected))

    if (!pad) {
      this.frameId = requestAnimationFrame(this.tick)
      return
    }

    this.processButtons(pad, time)
    this.processAxesAndDpad(pad, time)

    this.frameId = requestAnimationFrame(this.tick)
  }

  private isButtonPressed = (pad: Gamepad, index: number): boolean => {
    const btn = pad.buttons[index]
    if (!btn) return false
    return typeof btn === "object" ? btn.pressed : Boolean(btn)
  }

  private checkSinglePress = (pad: Gamepad, btnIndex: number, action: GamepadAction): void => {
    const isPressed = this.isButtonPressed(pad, btnIndex)
    const wasPressed = this.buttonPreviousStates.get(btnIndex) ?? false
    if (isPressed && !wasPressed) this.callback(action)
    this.buttonPreviousStates.set(btnIndex, isPressed)
  }

  private processButtons = (pad: Gamepad, time: number): void => {
    // Simultaneous Select (8) and Start (9) toggles in-game menu
    const isCombo = this.processSelectStartCombo(pad)

    this.checkSinglePress(pad, 0, "CONFIRM")
    this.checkSinglePress(pad, 1, "CANCEL")
    this.checkSinglePress(pad, 3, "TOGGLE_CONTROLS")
    this.checkSinglePress(pad, 4, "PAGE_UP")
    this.checkSinglePress(pad, 5, "PAGE_DOWN")
    // 10: L3 (Left Stick click) - single press toggles fullscreen for gamepad
    this.checkSinglePress(pad, 10, "TOGGLE_FULLSCREEN")
    this.checkSinglePress(pad, 16, "MENU")

    if (!isCombo) {
      this.processSelectHold(pad, time)
    }
  }

  private processSelectStartCombo = (pad: Gamepad): boolean => {
    const isSelectPressed = this.isButtonPressed(pad, 8)
    const isStartPressed = this.isButtonPressed(pad, 9)

    if (isSelectPressed && isStartPressed) {
      if (!this.selectStartComboActive) {
        this.selectStartComboActive = true
        // Cancel any pending Select hold so exit modal does not trigger
        this.selectHoldStartTime = 0
        this.selectHoldCompleted = false
        this.onSelectHold?.({ active: false, remainingSeconds: 5, progress: 0 })
        this.callback("IN_GAME_MENU")
      }
      return true
    } else if (!isSelectPressed && !isStartPressed) {
      this.selectStartComboActive = false
    }
    return this.selectStartComboActive
  }

  private processSelectHold = (pad: Gamepad, time: number): void => {
    if (!this.onSelectHold && !this.onSelectHoldComplete) return
    if (this.selectStartComboActive || this.isButtonPressed(pad, 9)) return

    const isSelectPressed = this.isButtonPressed(pad, 8)
    const HOLD_DURATION_MS = 5000

    if (isSelectPressed) {
      if (this.selectHoldStartTime === 0) {
        this.selectHoldStartTime = time
        this.selectHoldCompleted = false
      }
      if (this.selectHoldCompleted) return

      const elapsed = time - this.selectHoldStartTime
      const remainingSeconds = Math.max(0, Math.ceil((HOLD_DURATION_MS - elapsed) / 1000))
      const progress = Math.min(1, elapsed / HOLD_DURATION_MS)

      if (elapsed >= HOLD_DURATION_MS) {
        this.selectHoldCompleted = true
        this.onSelectHold?.({ active: false, remainingSeconds: 0, progress: 1 })
        this.onSelectHoldComplete?.()
        return
      }
      if (elapsed >= 250) this.onSelectHold?.({ active: true, remainingSeconds, progress })
    } else if (this.selectHoldStartTime !== 0) {
      this.selectHoldStartTime = 0
      this.selectHoldCompleted = false
      this.onSelectHold?.({ active: false, remainingSeconds: 5, progress: 0 })
    }
  }

  private detectCurrentNav = (pad: Gamepad): GamepadAction | null => {
    if (this.isButtonPressed(pad, 12)) return "NAV_UP"
    if (this.isButtonPressed(pad, 13)) return "NAV_DOWN"
    if (this.isButtonPressed(pad, 14)) return "NAV_LEFT"
    if (this.isButtonPressed(pad, 15)) return "NAV_RIGHT"

    const axisX = pad.axes[0] ?? 0
    const axisY = pad.axes[1] ?? 0
    const threshold = this.activeDirection ? AXIS_RELEASE_THRESHOLD : AXIS_ENGAGE_THRESHOLD
    const absX = Math.abs(axisX)
    const absY = Math.abs(axisY)

    if (absY >= absX && absY > threshold) return axisY < 0 ? "NAV_UP" : "NAV_DOWN"
    if (absX > absY && absX > threshold) return axisX < 0 ? "NAV_LEFT" : "NAV_RIGHT"
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
      this.nextRepeatTime = time + GAMEPAD_TIMING.INITIAL_REPEAT_DELAY_MS
      this.callback(currentNav)
      return
    }

    // Direction continuously held: step at steady pace, then turbo after 2.5s
    if (time >= this.nextRepeatTime) {
      this.callback(currentNav)
      const heldDuration = time - this.pressStartTime
      const repeatInterval =
        heldDuration >= GAMEPAD_TIMING.FAST_SCROLL_HOLD_THRESHOLD_MS
          ? GAMEPAD_TIMING.TURBO_REPEAT_INTERVAL_MS
          : GAMEPAD_TIMING.STEADY_REPEAT_INTERVAL_MS
      this.nextRepeatTime = time + repeatInterval
    }
  }
}
