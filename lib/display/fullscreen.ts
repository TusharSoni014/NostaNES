"use client"

let simulatedFullscreenElement: Element | null = null
const customListeners = new Set<() => void>()

function notifySubscribers() {
  for (const cb of customListeners) {
    try {
      cb()
    } catch {}
  }
}

function getNativeFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null
  const doc = document as unknown as {
    fullscreenElement?: Element | null
    webkitFullscreenElement?: Element | null
    webkitCurrentFullScreenElement?: Element | null
    mozFullScreenElement?: Element | null
    msFullscreenElement?: Element | null
  }
  return (
    doc.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.webkitCurrentFullScreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  )
}

export function isFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false
  // On iOS Chrome & Safari iPhone, the standard Fullscreen API is disabled by Apple for DOM elements,
  // but simulated fullscreen is fully supported and enabled.
  return true
}

export function isNativeFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false
  const doc = document as unknown as {
    fullscreenEnabled?: boolean
    webkitFullscreenEnabled?: boolean
    mozFullScreenEnabled?: boolean
    msFullscreenEnabled?: boolean
  }
  return Boolean(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled ||
    document.documentElement.requestFullscreen ||
    (document.documentElement as unknown as { webkitRequestFullscreen?: unknown }).webkitRequestFullscreen,
  )
}

export function isSimulatedFullscreen(): boolean {
  return Boolean(simulatedFullscreenElement)
}

export function getActiveFullscreenElement(): Element | null {
  return getNativeFullscreenElement() || simulatedFullscreenElement
}

export async function requestAppFullscreen(element?: HTMLElement | null): Promise<boolean> {
  if (typeof document === "undefined") return false
  const target = (element || document.documentElement) as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>
    webkitRequestFullScreen?: () => Promise<void>
    mozRequestFullScreen?: () => Promise<void>
    msRequestFullscreen?: () => Promise<void>
  }

  // 1. Try native browser Fullscreen API first (works on Android, Desktop, iPadOS)
  try {
    if (typeof target.requestFullscreen === "function") {
      await target.requestFullscreen()
      simulatedFullscreenElement = null
      notifySubscribers()
      return true
    }
    if (typeof target.webkitRequestFullscreen === "function") {
      await target.webkitRequestFullscreen()
      simulatedFullscreenElement = null
      notifySubscribers()
      return true
    }
    if (typeof target.webkitRequestFullScreen === "function") {
      await target.webkitRequestFullScreen()
      simulatedFullscreenElement = null
      notifySubscribers()
      return true
    }
    if (typeof target.mozRequestFullScreen === "function") {
      await target.mozRequestFullScreen()
      simulatedFullscreenElement = null
      notifySubscribers()
      return true
    }
    if (typeof target.msRequestFullscreen === "function") {
      await target.msRequestFullscreen()
      simulatedFullscreenElement = null
      notifySubscribers()
      return true
    }
  } catch {
    // Native fullscreen failed, blocked without user gesture, or unsupported on iOS WebKit
  }

  // 2. Fallback to simulated fullscreen mode (essential for iOS Chrome & Safari on iPhone)
  simulatedFullscreenElement = target || document.documentElement
  if (typeof document !== "undefined") {
    document.documentElement.classList.add("simulated-fullscreen")
    try {
      window.scrollTo(0, 0)
    } catch {}
  }
  notifySubscribers()
  return true
}

export async function exitAppFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>
    webkitCancelFullScreen?: () => Promise<void>
    mozCancelFullScreen?: () => Promise<void>
    msExitFullscreen?: () => Promise<void>
  }

  let nativeSuccess = false
  try {
    if (typeof doc.exitFullscreen === "function") {
      await doc.exitFullscreen()
      nativeSuccess = true
    } else if (typeof doc.webkitExitFullscreen === "function") {
      await doc.webkitExitFullscreen()
      nativeSuccess = true
    } else if (typeof doc.webkitCancelFullScreen === "function") {
      await doc.webkitCancelFullScreen()
      nativeSuccess = true
    } else if (typeof doc.mozCancelFullScreen === "function") {
      await doc.mozCancelFullScreen()
      nativeSuccess = true
    } else if (typeof doc.msExitFullscreen === "function") {
      await doc.msExitFullscreen()
      nativeSuccess = true
    }
  } catch {}

  if (simulatedFullscreenElement) {
    simulatedFullscreenElement = null
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("simulated-fullscreen")
    }
  }

  notifySubscribers()
  return nativeSuccess || true
}

export function subscribeFullscreenChange(callback: () => void): () => void {
  if (typeof document === "undefined") return () => {}

  customListeners.add(callback)

  const handleNativeChange = () => {
    if (!getNativeFullscreenElement() && !simulatedFullscreenElement) {
      document.documentElement.classList.remove("simulated-fullscreen")
    }
    callback()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && simulatedFullscreenElement) {
      void exitAppFullscreen()
    }
  }

  document.addEventListener("fullscreenchange", handleNativeChange)
  document.addEventListener("webkitfullscreenchange", handleNativeChange)
  document.addEventListener("mozfullscreenchange", handleNativeChange)
  document.addEventListener("MSFullscreenChange", handleNativeChange)
  window.addEventListener("keydown", handleKeyDown)

  return () => {
    customListeners.delete(callback)
    document.removeEventListener("fullscreenchange", handleNativeChange)
    document.removeEventListener("webkitfullscreenchange", handleNativeChange)
    document.removeEventListener("mozfullscreenchange", handleNativeChange)
    document.removeEventListener("MSFullscreenChange", handleNativeChange)
    window.removeEventListener("keydown", handleKeyDown)
  }
}
