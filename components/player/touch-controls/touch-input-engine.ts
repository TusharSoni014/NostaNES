/**
 * Touch input engine for the on-screen NES controller.
 *
 * One set of native pointer listeners on the controls layer tracks every
 * active finger, turns the set of fingers into a 10-bit button mask, and
 * reports only the bits that changed. No React state is involved, no DOM
 * focus moves (nothing here is focusable), and the only layout read is one
 * `getBoundingClientRect` pass per control when a new touch sequence starts
 * or the layer resizes.
 *
 * - A finger that lands on the D-pad owns the D-pad until it lifts, even when
 *   it rolls past the pad's edge. Directions come from the angle to the pad's
 *   centre: 8 sectors with wider cardinal sectors, a deadzone, and angular
 *   hysteresis so a thumb resting on a boundary does not flicker between
 *   "right" and "down-right" (that flicker is what NES games read as
 *   repeated presses).
 * - A finger that lands on an action button presses it and can slide onto the
 *   neighbouring buttons; it releases a button only after moving clearly away
 *   from it (enter radius < leave radius).
 * - Releases are emitted before presses, so opposite D-pad directions are
 *   never held at the same time.
 */

export type TouchZoneId = "dpad" | "a" | "b" | "turboA" | "turboB" | "select" | "start"
export type ActionZoneId = Exclude<TouchZoneId, "dpad">
export type DpadArmId = "up" | "down" | "left" | "right"

export const BUTTON_BIT = {
  up: 1,
  down: 2,
  left: 4,
  right: 8,
  a: 16,
  b: 32,
  turboA: 64,
  turboB: 128,
  select: 256,
  start: 512,
} as const

export type ButtonId = keyof typeof BUTTON_BIT

/** Bit, RetroArch action name, visual id. Turbo buttons are RetroArch X/Y. */
export const BUTTON_TABLE: ReadonlyArray<readonly [bit: number, action: string, id: ButtonId]> = [
  [BUTTON_BIT.up, "up", "up"],
  [BUTTON_BIT.down, "down", "down"],
  [BUTTON_BIT.left, "left", "left"],
  [BUTTON_BIT.right, "right", "right"],
  [BUTTON_BIT.a, "a", "a"],
  [BUTTON_BIT.b, "b", "b"],
  [BUTTON_BIT.turboA, "x", "turboA"],
  [BUTTON_BIT.turboB, "y", "turboB"],
  [BUTTON_BIT.select, "select", "select"],
  [BUTTON_BIT.start, "start", "start"],
]

export const ACTION_ZONE_BIT: Record<ActionZoneId, number> = {
  a: BUTTON_BIT.a,
  b: BUTTON_BIT.b,
  turboA: BUTTON_BIT.turboA,
  turboB: BUTTON_BIT.turboB,
  select: BUTTON_BIT.select,
  start: BUTTON_BIT.start,
}

const ACTION_ZONE_IDS: ActionZoneId[] = ["a", "b", "turboA", "turboB", "select", "start"]
const ROUND_ZONES = new Set<ActionZoneId>(["a", "b", "turboA", "turboB"])

// D-pad geometry, as fractions of the pad's half size.
const DEADZONE_ENTER = 0.2
const DEADZONE_EXIT = 0.12
const CARDINAL_HALF_DEG = 25
const DIAGONAL_HALF_DEG = 20
const HYSTERESIS_DEG = 8

// Action button geometry. Round buttons scale their radius; pills add pixels.
const ROUND_ENTER_SCALE = 1.15
const ROUND_LEAVE_SCALE = 1.6
const PILL_ENTER_SLOP_PX = 10
const PILL_LEAVE_SLOP_PX = 26

const MEASURE_STALE_MS = 1000

type Sector = { mask: number; centerDeg: number; halfDeg: number }

// Screen coordinates: +y points down, so 90 degrees is "down".
const SECTORS: readonly Sector[] = [
  { mask: BUTTON_BIT.right, centerDeg: 0, halfDeg: CARDINAL_HALF_DEG },
  { mask: BUTTON_BIT.right | BUTTON_BIT.down, centerDeg: 45, halfDeg: DIAGONAL_HALF_DEG },
  { mask: BUTTON_BIT.down, centerDeg: 90, halfDeg: CARDINAL_HALF_DEG },
  { mask: BUTTON_BIT.down | BUTTON_BIT.left, centerDeg: 135, halfDeg: DIAGONAL_HALF_DEG },
  { mask: BUTTON_BIT.left, centerDeg: 180, halfDeg: CARDINAL_HALF_DEG },
  { mask: BUTTON_BIT.left | BUTTON_BIT.up, centerDeg: 225, halfDeg: DIAGONAL_HALF_DEG },
  { mask: BUTTON_BIT.up, centerDeg: 270, halfDeg: CARDINAL_HALF_DEG },
  { mask: BUTTON_BIT.up | BUTTON_BIT.right, centerDeg: 315, halfDeg: DIAGONAL_HALF_DEG },
]

function angularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * Direction bits for a finger at (dx, dy) from the pad centre.
 * `previous` is the mask this finger produced last time (for hysteresis).
 */
export function dpadDirectionMask(dx: number, dy: number, halfSize: number, previous: number): number {
  const radius = Math.max(1, halfSize)
  const distance = Math.hypot(dx, dy)
  const deadzone = radius * (previous ? DEADZONE_EXIT : DEADZONE_ENTER)
  if (distance < deadzone) return 0

  let angle = (Math.atan2(dy, dx) * 180) / Math.PI
  if (angle < 0) angle += 360

  if (previous) {
    for (const sector of SECTORS) {
      if (sector.mask === previous) {
        if (angularDistance(angle, sector.centerDeg) <= sector.halfDeg + HYSTERESIS_DEG) return previous
        break
      }
    }
  }
  for (const sector of SECTORS) {
    if (angularDistance(angle, sector.centerDeg) <= sector.halfDeg) return sector.mask
  }
  return previous
}

export type ZoneRect = {
  cx: number
  cy: number
  halfW: number
  halfH: number
}

export function actionZoneHit(zoneId: ActionZoneId, zone: ZoneRect, x: number, y: number, held: boolean): boolean {
  const dx = x - zone.cx
  const dy = y - zone.cy
  if (ROUND_ZONES.has(zoneId)) {
    const radius = Math.max(zone.halfW, zone.halfH) * (held ? ROUND_LEAVE_SCALE : ROUND_ENTER_SCALE)
    return dx * dx + dy * dy <= radius * radius
  }
  const slop = held ? PILL_LEAVE_SLOP_PX : PILL_ENTER_SLOP_PX
  return Math.abs(dx) <= zone.halfW + slop && Math.abs(dy) <= zone.halfH + slop
}

type PointerState = {
  kind: "dpad" | "action"
  x: number
  y: number
  order: number
  /** Bits this finger currently contributes. */
  held: number
}

export type TouchInputEngineOptions = {
  layer: HTMLElement
  onPress: (action: string) => void
  onRelease: (action: string) => void
}

export class TouchInputEngine {
  private readonly layer: HTMLElement
  private readonly onPress: (action: string) => void
  private readonly onRelease: (action: string) => void

  private readonly zoneElements = new Map<TouchZoneId, HTMLElement>()
  private readonly armElements = new Map<DpadArmId, HTMLElement>()
  private readonly zoneRects = new Map<TouchZoneId, ZoneRect>()
  private readonly pointers = new Map<number, PointerState>()

  private mask = 0
  private pointerOrder = 0
  private lastMeasure = 0
  private attached = false
  private resizeObserver: ResizeObserver | null = null

  constructor({ layer, onPress, onRelease }: TouchInputEngineOptions) {
    this.layer = layer
    this.onPress = onPress
    this.onRelease = onRelease
  }

  attach() {
    if (this.attached) return
    this.attached = true
    this.collectElements()
    this.measure()

    const layer = this.layer
    layer.addEventListener("pointerdown", this.handlePointerDown, { passive: false })
    layer.addEventListener("pointermove", this.handlePointerMove, { passive: true })
    layer.addEventListener("pointerup", this.handlePointerEnd, { passive: true })
    layer.addEventListener("pointercancel", this.handlePointerEnd, { passive: true })
    layer.addEventListener("lostpointercapture", this.handlePointerEnd, { passive: true })
    // iOS: stops callouts, the magnifier, double-tap zoom and pinch recognition
    // (which would end our pointers with pointercancel). Android: no compat
    // mouse events, no click synthesis.
    layer.addEventListener("touchstart", preventDefault, { passive: false })
    layer.addEventListener("touchmove", preventDefault, { passive: false })
    layer.addEventListener("touchend", preventDefault, { passive: false })
    layer.addEventListener("contextmenu", preventDefault)

    window.addEventListener("blur", this.releaseAll)
    window.addEventListener("pagehide", this.releaseAll)
    document.addEventListener("visibilitychange", this.handleVisibility)
    window.addEventListener("resize", this.invalidate)
    window.addEventListener("orientationchange", this.invalidate)
    window.visualViewport?.addEventListener("resize", this.invalidate)
    window.visualViewport?.addEventListener("scroll", this.invalidate)

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.measure())
      this.resizeObserver.observe(layer)
    }
  }

  detach() {
    if (!this.attached) return
    this.attached = false
    const layer = this.layer
    layer.removeEventListener("pointerdown", this.handlePointerDown)
    layer.removeEventListener("pointermove", this.handlePointerMove)
    layer.removeEventListener("pointerup", this.handlePointerEnd)
    layer.removeEventListener("pointercancel", this.handlePointerEnd)
    layer.removeEventListener("lostpointercapture", this.handlePointerEnd)
    layer.removeEventListener("touchstart", preventDefault)
    layer.removeEventListener("touchmove", preventDefault)
    layer.removeEventListener("touchend", preventDefault)
    layer.removeEventListener("contextmenu", preventDefault)

    window.removeEventListener("blur", this.releaseAll)
    window.removeEventListener("pagehide", this.releaseAll)
    document.removeEventListener("visibilitychange", this.handleVisibility)
    window.removeEventListener("resize", this.invalidate)
    window.removeEventListener("orientationchange", this.invalidate)
    window.visualViewport?.removeEventListener("resize", this.invalidate)
    window.visualViewport?.removeEventListener("scroll", this.invalidate)

    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.releaseAll()
  }

  /** Re-reads control positions. Cheap: one rect per control. */
  measure = () => {
    this.lastMeasure = performance.now()
    for (const [id, element] of this.zoneElements) {
      const rect = element.getBoundingClientRect()
      this.zoneRects.set(id, {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
        halfW: rect.width / 2,
        halfH: rect.height / 2,
      })
    }
  }

  /** Lifts every finger and releases every held button. */
  releaseAll = () => {
    this.pointers.clear()
    this.apply(0)
  }

  getMask() {
    return this.mask
  }

  private invalidate = () => {
    this.lastMeasure = 0
  }

  private handleVisibility = () => {
    if (document.visibilityState === "hidden") this.releaseAll()
  }

  private collectElements() {
    this.zoneElements.clear()
    this.armElements.clear()
    for (const element of this.layer.querySelectorAll<HTMLElement>("[data-touch-zone]")) {
      const id = element.dataset.touchZone as TouchZoneId | undefined
      if (id && (id === "dpad" || id in ACTION_ZONE_BIT)) this.zoneElements.set(id, element)
    }
    for (const element of this.layer.querySelectorAll<HTMLElement>("[data-dpad-arm]")) {
      const id = element.dataset.dpadArm as DpadArmId | undefined
      if (id) this.armElements.set(id, element)
    }
  }

  private handlePointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return
    const target = event.target as Element | null
    const zoneElement = target?.closest?.("[data-touch-zone]") as HTMLElement | null
    if (!zoneElement || !this.layer.contains(zoneElement)) return
    const zoneId = zoneElement.dataset.touchZone as TouchZoneId
    if (!this.zoneElements.has(zoneId)) return

    // No focus change, no text selection, no compatibility mouse events.
    event.preventDefault()

    if (this.pointers.size === 0 || performance.now() - this.lastMeasure > MEASURE_STALE_MS) this.measure()

    try {
      zoneElement.setPointerCapture(event.pointerId)
    } catch {}

    this.pointers.set(event.pointerId, {
      kind: zoneId === "dpad" ? "dpad" : "action",
      x: event.clientX,
      y: event.clientY,
      order: ++this.pointerOrder,
      held: zoneId === "dpad" ? 0 : ACTION_ZONE_BIT[zoneId as ActionZoneId],
    })
    this.recompute()
  }

  private handlePointerMove = (event: PointerEvent) => {
    const pointer = this.pointers.get(event.pointerId)
    if (!pointer) return
    pointer.x = event.clientX
    pointer.y = event.clientY
    this.recompute()
  }

  private handlePointerEnd = (event: PointerEvent) => {
    if (!this.pointers.delete(event.pointerId)) return
    this.recompute()
  }

  private recompute() {
    let mask = 0
    let dpadPointer: PointerState | null = null

    for (const pointer of this.pointers.values()) {
      if (pointer.kind === "dpad") {
        if (!dpadPointer || pointer.order > dpadPointer.order) dpadPointer = pointer
        continue
      }
      pointer.held = this.actionBitsFor(pointer)
      mask |= pointer.held
    }

    // Only the most recent finger on the pad steers; an older one never fights it.
    for (const pointer of this.pointers.values()) {
      if (pointer.kind === "dpad" && pointer !== dpadPointer) pointer.held = 0
    }
    if (dpadPointer) {
      const pad = this.zoneRects.get("dpad")
      dpadPointer.held = pad
        ? dpadDirectionMask(dpadPointer.x - pad.cx, dpadPointer.y - pad.cy, Math.min(pad.halfW, pad.halfH), dpadPointer.held)
        : 0
      mask |= dpadPointer.held
    }

    this.apply(mask)
  }

  private actionBitsFor(pointer: PointerState): number {
    let bits = 0
    for (const zoneId of ACTION_ZONE_IDS) {
      const rect = this.zoneRects.get(zoneId)
      if (!rect) continue
      const bit = ACTION_ZONE_BIT[zoneId]
      if (actionZoneHit(zoneId, rect, pointer.x, pointer.y, (pointer.held & bit) !== 0)) bits |= bit
    }
    return bits
  }

  private apply(mask: number) {
    const previous = this.mask
    if (previous === mask) return
    this.mask = mask
    const released = previous & ~mask
    const pressed = mask & ~previous

    // Release first: the core must never see left+right or up+down together.
    for (const [bit, action, id] of BUTTON_TABLE) {
      if (released & bit) {
        this.setVisual(id, false)
        this.onRelease(action)
      }
    }
    for (const [bit, action, id] of BUTTON_TABLE) {
      if (pressed & bit) {
        this.setVisual(id, true)
        this.onPress(action)
      }
    }
  }

  private setVisual(id: ButtonId, active: boolean) {
    const value = active ? "true" : "false"
    if (id === "up" || id === "down" || id === "left" || id === "right") {
      const arm = this.armElements.get(id)
      if (arm && arm.dataset.active !== value) arm.dataset.active = value
      return
    }
    const zone = this.zoneElements.get(id)
    if (zone && zone.dataset.pressed !== value) zone.dataset.pressed = value
  }
}

function preventDefault(event: Event) {
  if (event.cancelable) event.preventDefault()
}
