"use client"

import { useSyncExternalStore } from "react"

const MOBILE_MEDIA_QUERY = "(max-width: 768px), ((max-height: 500px) and (orientation: landscape)), (pointer: coarse)"

function checkIsMobile(): boolean {
  if (typeof window === "undefined") return false
  const matchMedia = window.matchMedia(MOBILE_MEDIA_QUERY).matches
  const isTouchDevice =
    "ontouchstart" in window ||
    (typeof navigator !== "undefined" && (navigator.maxTouchPoints > 0 || (navigator as unknown as { msMaxTouchPoints?: number }).msMaxTouchPoints! > 0))
  const isMobileUserAgent =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  return matchMedia || (isTouchDevice && isMobileUserAgent)
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  const media = window.matchMedia(MOBILE_MEDIA_QUERY)
  media.addEventListener("change", callback)
  window.addEventListener("resize", callback)
  window.addEventListener("orientationchange", callback)

  return () => {
    media.removeEventListener("change", callback)
    window.removeEventListener("resize", callback)
    window.removeEventListener("orientationchange", callback)
  }
}

/**
 * Hook to detect whether the user is on a mobile device
 * (smartphone, tablet, small screen or touch-based mobile viewport).
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, checkIsMobile, () => false)
}

/**
 * Hook to detect whether the viewport is currently in portrait orientation.
 */
export function useIsPortrait(): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {}
      const media = window.matchMedia("(orientation: portrait)")
      media.addEventListener("change", callback)
      window.addEventListener("resize", callback)
      window.addEventListener("orientationchange", callback)
      return () => {
        media.removeEventListener("change", callback)
        window.removeEventListener("resize", callback)
        window.removeEventListener("orientationchange", callback)
      }
    },
    () => {
      if (typeof window === "undefined") return false
      return window.matchMedia("(orientation: portrait)").matches || window.innerHeight > window.innerWidth
    },
    () => false,
  )
}
