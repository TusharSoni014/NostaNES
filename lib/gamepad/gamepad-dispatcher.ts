import type { GamepadAction } from "./gamepad-types"

type GamepadListenerCallback = (action: GamepadAction) => void

/**
 * A button that does something when held. `onStart` fires once the hold has
 * lasted HOLD_ANNOUNCE_DELAY_MS (so a tap never flashes a HUD) and receives the
 * hold's start time on the performance.now() clock. `onCancel` fires when an
 * announced hold is released early.
 */
export type GamepadButtonHold = {
  button: number
  durationMs: number
  onStart?: (startedAt: number) => void
  onCancel?: () => void
  onComplete: () => void
}

import { GAMEPAD_TIMING } from "./gamepad-timing"
import { getRawGamepads } from "./gamepad-remapper"

export type GamepadDispatcherOptions = {
  holds?: GamepadButtonHold[]
}

type HoldProgress = {
  startTime: number
  announced: boolean
  completed: boolean
}

const HOLD_ANNOUNCE_DELAY_MS = 250
const LB_BUTTON = 4
const RB_BUTTON = 5
const SELECT_BUTTON = 8
const START_BUTTON = 9

const AXIS_ENGAGE_THRESHOLD = 0.55
const AXIS_RELEASE_THRESHOLD = 0.25

import { setInputMode } from "@/hooks/use-input-mode"

export class GamepadDispatcher {
  private frameId = 0
  private running = false
  private callback: GamepadListenerCallback
  private holds: GamepadButtonHold[]
  private holdProgress = new Map<number, HoldProgress>()
  private buttonPreviousStates = new Map<number, boolean>()
  private activeDirection: GamepadAction | null = null
  private pressStartTime = 0
  private nextRepeatTime = 0
  private selectStartComboActive = false
  // Stays true from the LB+RB combo until both shoulders are released, so the
  // shoulders' own page / hold actions don't also fire.
  private shoulderComboActive = false
  private isPolling = false

  constructor(callback: GamepadListenerCallback, options?: GamepadDispatcherOptions) {
    this.callback = (action) => {
      setInputMode("gamepad")
      callback(action)
    }
    this.holds = options?.holds ?? []
  }

  private onGamepadConnected = (): void => {
    if (!this.running) return
    this.startPollingIfNeeded()
  }

  private onGamepadDisconnected = (): void => {
    if (!this.running) return
    const pads = getRawGamepads()
    const pad = Array.from(pads).find((p): p is Gamepad => Boolean(p && p.connected))
    if (!pad) {
      this.stopPolling()
    }
  }

  private startPollingIfNeeded = (): void => {
    if (this.isPolling) return
    const pads = getRawGamepads()
    const pad = Array.from(pads).find((p): p is Gamepad => Boolean(p && p.connected))
    if (!pad) return

    this.isPolling = true
    pad.buttons.forEach((btn, idx) => {
      const isPressed = typeof btn === "object" ? btn.pressed : Boolean(btn)
      if (isPressed) this.buttonPreviousStates.set(idx, true)
    })
    // A shoulder already held when polling starts (e.g. the LB+RB that just
    // launched a random game) must not fire the combo or a page jump again.
    if (this.isButtonPressed(pad, LB_BUTTON) || this.isButtonPressed(pad, RB_BUTTON)) {
      this.shoulderComboActive = true
    }
    this.frameId = requestAnimationFrame(this.tick)
  }

  private stopPolling = (): void => {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = 0
    }
    this.isPolling = false
  }

  start = (): void => {
    if (this.running) return
    this.running = true

    if (typeof window !== "undefined") {
      window.addEventListener("gamepadconnected", this.onGamepadConnected)
      window.addEventListener("gamepaddisconnected", this.onGamepadDisconnected)
    }

    this.startPollingIfNeeded()
  }

  stop = (): void => {
    this.running = false
    if (typeof window !== "undefined") {
      window.removeEventListener("gamepadconnected", this.onGamepadConnected)
      window.removeEventListener("gamepaddisconnected", this.onGamepadDisconnected)
    }
    this.stopPolling()
    this.buttonPreviousStates.clear()
    this.activeDirection = null
    this.pressStartTime = 0
    this.nextRepeatTime = 0
    this.cancelHolds()
    this.selectStartComboActive = false
    this.shoulderComboActive = false
  }

  private tick = (time: number): void => {
    if (!this.running) return

    const pads = getRawGamepads()
    const pad = Array.from(pads).find((p): p is Gamepad => Boolean(p && p.connected))

    if (!pad) {
      this.stopPolling()
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

  private checkSinglePress = (pad: Gamepad, btnIndex: number, action: GamepadAction | null): void => {
    const isPressed = this.isButtonPressed(pad, btnIndex)
    const wasPressed = this.buttonPreviousStates.get(btnIndex) ?? false
    if (isPressed && !wasPressed && action) this.callback(action)
    this.buttonPreviousStates.set(btnIndex, isPressed)
  }

  private checkRelease = (pad: Gamepad, btnIndex: number, action: GamepadAction | null): void => {
    const isPressed = this.isButtonPressed(pad, btnIndex)
    const wasPressed = this.buttonPreviousStates.get(btnIndex) ?? false
    if (!isPressed && wasPressed && action) this.callback(action)
    this.buttonPreviousStates.set(btnIndex, isPressed)
  }

  private processShoulderCombo = (pad: Gamepad): boolean => {
    const isLbPressed = this.isButtonPressed(pad, LB_BUTTON)
    const isRbPressed = this.isButtonPressed(pad, RB_BUTTON)

    if (isLbPressed && isRbPressed) {
      if (!this.shoulderComboActive) {
        this.shoulderComboActive = true
        this.callback("RANDOM_GAME")
      }
      return true
    } else if (!isLbPressed && !isRbPressed) {
      this.shoulderComboActive = false
    }
    return this.shoulderComboActive
  }

  private processButtons = (pad: Gamepad, time: number): void => {
    // Simultaneous Select (8) and Start (9) toggles in-game menu
    const isCombo = this.processSelectStartCombo(pad)

    this.checkSinglePress(pad, 0, "CONFIRM")
    this.checkSinglePress(pad, 1, "CANCEL")
    this.checkSinglePress(pad, 3, "TOGGLE_CONTROLS")
    // LB + RB together plays a random game. On their own, LB / RB page on release
    // so that pressing both doesn't jump a page first.
    const shoulderComboWasActive = this.shoulderComboActive
    const isShoulderCombo = this.processShoulderCombo(pad)
    const suppressShoulders = shoulderComboWasActive || isShoulderCombo
    this.checkRelease(pad, LB_BUTTON, suppressShoulders ? null : "PAGE_UP")
    this.checkRelease(pad, RB_BUTTON, suppressShoulders ? null : "PAGE_DOWN")
    this.checkSinglePress(pad, 6, "SPEED_DOWN")
    this.checkSinglePress(pad, 7, "SPEED_UP")
    // 11: R3 (Right Stick click) - single press toggles fullscreen for gamepad
    this.checkSinglePress(pad, 11, "TOGGLE_FULLSCREEN")
    this.checkSinglePress(pad, 16, "MENU")
    // Start on its own; while Select is down it is part of the menu combo.
    this.checkSinglePress(pad, START_BUTTON, isCombo || this.isButtonPressed(pad, SELECT_BUTTON) ? null : "START")

    this.processHolds(pad, time)
  }

  private processSelectStartCombo = (pad: Gamepad): boolean => {
    const isSelectPressed = this.isButtonPressed(pad, 8)
    const isStartPressed = this.isButtonPressed(pad, 9)

    if (isSelectPressed && isStartPressed) {
      if (!this.selectStartComboActive) {
        this.selectStartComboActive = true
        this.callback("IN_GAME_MENU")
      }
      return true
    } else if (!isSelectPressed && !isStartPressed) {
      this.selectStartComboActive = false
    }
    return this.selectStartComboActive
  }

  private cancelHolds = (): void => {
    for (const hold of this.holds) {
      const progress = this.holdProgress.get(hold.button)
      if (progress?.announced && !progress.completed) hold.onCancel?.()
    }
    this.holdProgress.clear()
  }

  private processHolds = (pad: Gamepad, time: number): void => {
    for (const hold of this.holds) {
      // Select is also half of the Select+Start menu combo, which cancels its hold
      // until both buttons are released. LB / RB are likewise half of the LB+RB combo.
      const isShoulder = hold.button === LB_BUTTON || hold.button === RB_BUTTON
      const blocked =
        (hold.button === SELECT_BUTTON &&
          (this.selectStartComboActive || this.isButtonPressed(pad, START_BUTTON))) ||
        (isShoulder && this.shoulderComboActive)
      const isPressed = !blocked && this.isButtonPressed(pad, hold.button)
      let progress = this.holdProgress.get(hold.button)

      if (!isPressed) {
        if (progress) {
          this.holdProgress.delete(hold.button)
          if (progress.announced && !progress.completed) hold.onCancel?.()
        }
        continue
      }

      if (!progress) {
        progress = { startTime: time, announced: false, completed: false }
        this.holdProgress.set(hold.button, progress)
      }
      if (progress.completed) continue

      const elapsed = time - progress.startTime
      if (elapsed >= hold.durationMs) {
        progress.completed = true
        hold.onComplete()
      } else if (!progress.announced && elapsed >= HOLD_ANNOUNCE_DELAY_MS) {
        progress.announced = true
        hold.onStart?.(progress.startTime)
      }
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
