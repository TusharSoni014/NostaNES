"use client"

export function isFullscreenSupported(): boolean {
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

export function getActiveFullscreenElement(): Element | null {
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

export async function requestAppFullscreen(element?: HTMLElement | null): Promise<boolean> {
  if (typeof document === "undefined") return false
  const target = (element || document.documentElement) as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>
    webkitRequestFullScreen?: () => Promise<void>
    mozRequestFullScreen?: () => Promise<void>
    msRequestFullscreen?: () => Promise<void>
  }

  try {
    if (typeof target.requestFullscreen === "function") {
      await target.requestFullscreen()
      return true
    }
    if (typeof target.webkitRequestFullscreen === "function") {
      await target.webkitRequestFullscreen()
      return true
    }
    if (typeof target.webkitRequestFullScreen === "function") {
      await target.webkitRequestFullScreen()
      return true
    }
    if (typeof target.mozRequestFullScreen === "function") {
      await target.mozRequestFullScreen()
      return true
    }
    if (typeof target.msRequestFullscreen === "function") {
      await target.msRequestFullscreen()
      return true
    }
  } catch {
    // Browser may require user gesture or block request
  }
  return false
}

export async function exitAppFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>
    webkitCancelFullScreen?: () => Promise<void>
    mozCancelFullScreen?: () => Promise<void>
    msExitFullscreen?: () => Promise<void>
  }

  try {
    if (typeof doc.exitFullscreen === "function") {
      await doc.exitFullscreen()
      return true
    }
    if (typeof doc.webkitExitFullscreen === "function") {
      await doc.webkitExitFullscreen()
      return true
    }
    if (typeof doc.webkitCancelFullScreen === "function") {
      await doc.webkitCancelFullScreen()
      return true
    }
    if (typeof doc.mozCancelFullScreen === "function") {
      await doc.mozCancelFullScreen()
      return true
    }
    if (typeof doc.msExitFullscreen === "function") {
      await doc.msExitFullscreen()
      return true
    }
  } catch {}
  return false
}

export function subscribeFullscreenChange(callback: () => void): () => void {
  if (typeof document === "undefined") return () => {}

  document.addEventListener("fullscreenchange", callback)
  document.addEventListener("webkitfullscreenchange", callback)
  document.addEventListener("mozfullscreenchange", callback)
  document.addEventListener("MSFullscreenChange", callback)

  return () => {
    document.removeEventListener("fullscreenchange", callback)
    document.removeEventListener("webkitfullscreenchange", callback)
    document.removeEventListener("mozfullscreenchange", callback)
    document.removeEventListener("MSFullscreenChange", callback)
  }
}
