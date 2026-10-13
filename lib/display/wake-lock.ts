/**
 * Safely guards against screen dimming during gameplay while gracefully ignoring browser permission denials.
 */
export const preventScreenSleep = (): (() => void) => {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
    return () => {}
  }

  let sentinel: WakeLockSentinel | null = null
  let released = false

  const requestLock = async () => {
    try {
      sentinel = await navigator.wakeLock.request("screen")
      sentinel.addEventListener("release", () => {
        if (!released) {
          // Attempt re-acquisition on visibility changes
          requestLock().catch(() => {})
        }
      })
    } catch {
      // Gracefully handle denied or unsupported wake lock
    }
  }

  requestLock().catch(() => {})

  return () => {
    released = true
    if (sentinel) {
      sentinel.release().catch(() => {})
      sentinel = null
    }
  }
}
