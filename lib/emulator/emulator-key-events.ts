import type { Nostalgist } from "nostalgist"

/**
 * Delivers a key press straight to RetroArch's keyboard handlers.
 *
 * Emscripten's handler copies the event fields into WASM memory, calls the
 * RetroArch callback, and then calls `event.preventDefault()` because the
 * callback returns true. A bare `{ code }` object (what Nostalgist passes)
 * therefore throws after the key has already been queued, which leaves
 * `JSEvents.inEventHandler` incremented forever and made our fast path fall
 * back to Nostalgist's slower one, delivering every press twice.
 */

type EmscriptenEventHandler = {
  eventTypeString: string
  eventListenerFunc?: (event: object) => void
}

type EmscriptenWithEvents = {
  JSEvents?: { eventHandlers?: EmscriptenEventHandler[] }
}

export type EmulatorKeyEventType = "keydown" | "keyup"

export function createEmulatorKeyEvent(type: EmulatorKeyEventType, code: string, target: EventTarget | null) {
  return {
    type,
    code,
    key: "",
    keyCode: 0,
    which: 0,
    charCode: 0,
    location: 0,
    repeat: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    isTrusted: false,
    timeStamp: typeof performance !== "undefined" ? performance.now() : Date.now(),
    target,
    currentTarget: target,
    preventDefault() {},
    stopPropagation() {},
    stopImmediatePropagation() {},
  }
}

/** Returns true when at least one RetroArch handler received the event. */
export function dispatchEmulatorKey(
  emu: Nostalgist,
  type: EmulatorKeyEventType,
  code: string,
  target: EventTarget | null,
): boolean {
  let handlers: EmscriptenEventHandler[] | undefined
  try {
    handlers = (emu.getEmscripten() as EmscriptenWithEvents).JSEvents?.eventHandlers
  } catch {
    return false
  }
  if (!handlers || handlers.length === 0) return false

  const event = createEmulatorKeyEvent(type, code, target)
  let delivered = false
  for (let i = 0; i < handlers.length; i++) {
    const handler = handlers[i]
    if (handler.eventTypeString !== type || typeof handler.eventListenerFunc !== "function") continue
    try {
      handler.eventListenerFunc(event)
      delivered = true
    } catch {}
  }
  return delivered
}
