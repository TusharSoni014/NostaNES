import {
  getCustomControls,
  type CustomGamepadMap,
  type NesActionKey,
} from "@/lib/storage/controls-storage"

const ACTION_TO_CANONICAL_SLOT: Record<NesActionKey, number> = {
  b: 0,
  a: 1,
  turboB: 2,
  turboA: 3,
  select: 8,
  start: 9,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
}

const CANONICAL_SLOTS = new Set([0, 1, 2, 3, 8, 9, 12, 13, 14, 15])

function remapSingleGamepad(realPad: Gamepad, config: CustomGamepadMap): Gamepad {
  if (!realPad || !realPad.buttons || realPad.buttons.length === 0) return realPad

  const newButtons: GamepadButton[] = []
  for (let i = 0; i < realPad.buttons.length; i++) {
    const orig = realPad.buttons[i]
    if (CANONICAL_SLOTS.has(i)) {
      newButtons.push({ pressed: false, touched: false, value: 0 })
    } else {
      newButtons.push({ pressed: orig.pressed, touched: orig.touched, value: orig.value })
    }
  }

  for (const [action, slot] of Object.entries(ACTION_TO_CANONICAL_SLOT)) {
    const boundPhysicalCode = config[action as NesActionKey]
    const physicalIdx = boundPhysicalCode ? parseInt(boundPhysicalCode, 10) : NaN
    if (!isNaN(physicalIdx) && realPad.buttons[physicalIdx]) {
      const physicalBtn = realPad.buttons[physicalIdx]
      if (newButtons[slot]) {
        newButtons[slot] = {
          pressed: physicalBtn.pressed,
          touched: physicalBtn.touched,
          value: physicalBtn.value,
        }
      }
    }
  }

  // Map analog stick to D-Pad directional slots as fallback
  const axisX = realPad.axes[0] ?? 0
  const axisY = realPad.axes[1] ?? 0
  if (axisY < -0.55 && newButtons[12]) newButtons[12] = { pressed: true, touched: true, value: 1 }
  if (axisY > 0.55 && newButtons[13]) newButtons[13] = { pressed: true, touched: true, value: 1 }
  if (axisX < -0.55 && newButtons[14]) newButtons[14] = { pressed: true, touched: true, value: 1 }
  if (axisX > 0.55 && newButtons[15]) newButtons[15] = { pressed: true, touched: true, value: 1 }

  return new Proxy(realPad, {
    get(target, prop) {
      if (prop === "buttons") return newButtons
      const val = Reflect.get(target, prop, target)
      return typeof val === "function" ? val.bind(target) : val
    },
  })
}

let originalGetGamepads: (() => (Gamepad | null)[]) | null = null
let activeInstallCount = 0

export function getRawGamepads(): (Gamepad | null)[] {
  if (originalGetGamepads) return originalGetGamepads()
  if (typeof navigator !== "undefined" && navigator.getGamepads) {
    return Array.from(navigator.getGamepads())
  }
  return []
}

export function installGamepadRemapping(): () => void {
  if (typeof window === "undefined" || !navigator.getGamepads) return () => {}

  activeInstallCount++
  if (activeInstallCount === 1) {
    originalGetGamepads = navigator.getGamepads.bind(navigator)
    navigator.getGamepads = function () {
      const pads = originalGetGamepads!()
      if (!pads || pads.length === 0) return pads
      const custom = getCustomControls()
      return Array.from(pads).map((pad) => (pad ? remapSingleGamepad(pad, custom.gamepad) : null))
    }
  }

  return () => {
    activeInstallCount = Math.max(0, activeInstallCount - 1)
    if (activeInstallCount === 0 && originalGetGamepads) {
      navigator.getGamepads = originalGetGamepads
      originalGetGamepads = null
    }
  }
}
