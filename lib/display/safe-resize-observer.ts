"use client"

/**
 * Installs a protective wrapper around window.ResizeObserver to safely absorb
 * transient WebAssembly memory traps (such as Emscripten canvas size watcher errors
 * during component unmounting, variant switching, or fast layout transitions).
 */
export function ensureSafeResizeObserver(): void {
  if (typeof window === "undefined" || !("ResizeObserver" in window)) return

  const win = window as typeof window & { __nostanes_safe_ro_installed__?: boolean }
  if (win.__nostanes_safe_ro_installed__) return
  win.__nostanes_safe_ro_installed__ = true

  const NativeResizeObserver = window.ResizeObserver

  class SafeResizeObserver extends NativeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => {
        try {
          callback(entries, observer)
        } catch (err: unknown) {
          const isWasmTrap =
            err instanceof Error &&
            (err.name === "RuntimeError" ||
              String(err.message || "").toLowerCase().includes("bounds"))
          if (!isWasmTrap) {
            throw err
          }
        }
      })
    }
  }

  window.ResizeObserver = SafeResizeObserver

  window.addEventListener("error", (event) => {
    const err = event.error
    if (
      err instanceof Error &&
      err.name === "RuntimeError" &&
      String(err.message || "").toLowerCase().includes("bounds")
    ) {
      event.preventDefault()
    }
  })
}
