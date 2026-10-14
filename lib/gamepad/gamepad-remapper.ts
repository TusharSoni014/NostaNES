/**
 * Gamepad utility helpers.
 * Native Gamepad instances are accessed directly without proxies to guarantee
 * full compliance with browser Web IDL GamepadEvent specifications.
 */

export function getRawGamepads(): (Gamepad | null)[] {
  if (typeof navigator !== "undefined" && navigator.getGamepads) {
    return Array.from(navigator.getGamepads())
  }
  return []
}

/**
 * Backward-compatible lifecycle stub (no-op now that live remapping runs via
 * high-performance direct action dispatching without brittle DOM proxying).
 */
export function installGamepadRemapping(): () => void {
  return () => {}
}
