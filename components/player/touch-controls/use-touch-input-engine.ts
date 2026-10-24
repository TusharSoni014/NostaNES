"use client"

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react"
import { TouchInputEngine } from "./touch-input-engine"

type UseTouchInputEngineOptions = {
  layerRef: RefObject<HTMLElement | null>
  enabled: boolean
  pressDown: (action: string) => void
  pressUp: (action: string) => void
  /** Anything that moves or resizes the controls (layout edits, orientation). */
  layoutKey: unknown
}

/**
 * Mounts a TouchInputEngine on the controls layer while `enabled`.
 * Nothing here causes React re-renders during play.
 */
export function useTouchInputEngine({ layerRef, enabled, pressDown, pressUp, layoutKey }: UseTouchInputEngineOptions) {
  const handlersRef = useRef({ pressDown, pressUp })
  const engineRef = useRef<TouchInputEngine | null>(null)

  useEffect(() => {
    handlersRef.current = { pressDown, pressUp }
  }, [pressDown, pressUp])

  useEffect(() => {
    const layer = layerRef.current
    if (!enabled || !layer) return
    const engine = new TouchInputEngine({
      layer,
      onPress: (action) => handlersRef.current.pressDown(action),
      onRelease: (action) => handlersRef.current.pressUp(action),
    })
    engine.attach()
    engineRef.current = engine
    return () => {
      engineRef.current = null
      engine.detach()
    }
  }, [enabled, layerRef])

  useLayoutEffect(() => {
    engineRef.current?.measure()
  }, [layoutKey])
}
