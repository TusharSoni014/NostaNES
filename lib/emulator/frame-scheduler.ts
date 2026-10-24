/**
 * Drives Emscripten's main loop from requestAnimationFrame.
 *
 * RetroArch's web build (single-threaded, no asyncify) paces the core with its
 * audio buffer: it runs frames from requestAnimationFrame, and while the audio
 * buffer is full it "fake blocks" by re-scheduling the loop with setTimeout(1)
 * until there is room again. On 90/120 Hz screens the loop spends most of its
 * time in that timer-driven wait.
 *
 * Chrome's main-thread scheduler disables every deferrable task queue (timers,
 * postMessage) during the touchstart use case, up to 100 ms after a touch
 * begins, and defers them again after discrete input until the next frame is
 * rendered. Each new touch on the on-screen controls therefore froze the loop,
 * after which the core caught up at double speed: the "stutter on press" that
 * never happened while a finger was merely dragging.
 *
 * requestAnimationFrame callbacks run in the compositor's BeginMainFrame task,
 * which keeps top priority during input, so a loop driven only by rAF is never
 * deferred. The scheduler below replaces every scheduler Emscripten installs
 * (`Browser.mainLoop.scheduler`) with one that always waits for the next
 * animation frame. RetroArch's own pacing still decides what each iteration
 * does: in the "timeout" mode the iteration only checks the audio buffer.
 * When ticks arrive late (a long task, a throttled tab) the loop may run a few
 * extra iterations per tick until the audio buffer is full again, so a stall
 * is absorbed instead of turning into an audio underrun.
 */

export type EmscriptenMainLoop = {
  runner?: () => void
  scheduler?: (() => void) | null
  timingMode?: number
  timingValue?: number
  running?: boolean
}

export type EmscriptenBrowser = {
  mainLoop: EmscriptenMainLoop
}

/** Emscripten's EM_TIMING_SETTIMEOUT. RetroArch uses it while the audio buffer is full. */
const TIMING_SETTIMEOUT = 0

const FRAME_MS = 1000 / 60
/** Never try to catch up more than this; beyond it the audio has already dropped out. */
const MAX_DEBT_MS = 100
const MAX_ITERATIONS_PER_TICK = 4
const TICK_BUDGET_MS = 10

const noop = () => {}

/**
 * Installs the rAF scheduler on an Emscripten `Browser` object. Safe to call
 * before or after the main loop has started. Returns a dispose function, or
 * null when nothing was installed (no Browser object, or already installed).
 */
export function installFrameScheduler(browser: EmscriptenBrowser | null | undefined): (() => void) | null {
  const mainLoop = browser?.mainLoop
  if (!mainLoop || typeof window === "undefined") return null

  const existing = Object.getOwnPropertyDescriptor(mainLoop, "scheduler")
  if (existing && !("value" in existing)) return null // already installed

  let disposed = false
  let pending = false
  let wanted = false
  let inTick = false
  let rafId = 0
  let lastTick = 0
  let debt = 0

  const request = () => {
    if (pending || disposed) return
    pending = true
    rafId = window.requestAnimationFrame(tick)
  }

  // Emscripten calls `Browser.mainLoop.scheduler()` after every iteration.
  const scheduler = () => {
    wanted = true
    if (!inTick) request()
  }

  const tick = (now: number) => {
    rafId = 0
    pending = false
    if (disposed) return
    const runner = mainLoop.runner
    if (typeof runner !== "function") return

    const gap = lastTick ? now - lastTick : FRAME_MS
    lastTick = now
    debt = Math.min(MAX_DEBT_MS, Math.max(0, debt + gap - FRAME_MS))

    const start = performance.now()
    let iterations = 0
    inTick = true
    try {
      do {
        wanted = false
        runner()
        iterations += 1
        if (iterations > 1) debt = Math.max(0, debt - FRAME_MS)
      } while (
        wanted &&
        !disposed &&
        // In the timeout mode the audio buffer is full: nothing to do until it drains.
        mainLoop.timingMode !== TIMING_SETTIMEOUT &&
        debt >= FRAME_MS &&
        iterations < MAX_ITERATIONS_PER_TICK &&
        performance.now() - start < TICK_BUDGET_MS
      )
    } finally {
      inTick = false
    }
    if (wanted && !disposed) request()
  }

  Object.defineProperty(mainLoop, "scheduler", {
    configurable: true,
    enumerable: true,
    get: () => scheduler,
    // Emscripten re-assigns the scheduler on every timing change; keep ours.
    set: noop,
  })

  return () => {
    if (disposed) return
    disposed = true
    if (rafId) window.cancelAnimationFrame(rafId)
    rafId = 0
    delete (mainLoop as { scheduler?: unknown }).scheduler
    // Restore a plain scheduler so a late Emscripten call cannot hit `undefined()`.
    mainLoop.scheduler = () => {
      const runner = mainLoop.runner
      if (typeof runner === "function") window.requestAnimationFrame(() => runner())
    }
  }
}
