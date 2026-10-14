import { animate, type AnimationPlaybackControls } from "motion"

const EDGE = 8

let playback: AnimationPlaybackControls | null = null
let releaseGesture: (() => void) | null = null

function findScrollParent(node: HTMLElement): HTMLElement | null {
  let parent = node.parentElement
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const overflowY = getComputedStyle(parent).overflowY
    if (overflowY === "auto" || overflowY === "scroll") return parent
    parent = parent.parentElement
  }
  return null
}

function watchGesture(container: HTMLElement) {
  releaseGesture?.()
  const stop = () => playback?.stop()
  container.addEventListener("wheel", stop, { passive: true })
  container.addEventListener("touchmove", stop, { passive: true })
  const release = () => {
    container.removeEventListener("wheel", stop)
    container.removeEventListener("touchmove", stop)
    if (releaseGesture === release) releaseGesture = null
  }
  releaseGesture = release
  return release
}

export function scrollNearestIntoView(target: HTMLElement): () => void {
  const container = findScrollParent(target)
  if (!container) return () => {}

  const containerRect = container.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const above = targetRect.top - containerRect.top - EDGE
  const below = targetRect.bottom - containerRect.bottom + EDGE

  let delta = 0
  if (above < 0) delta = above
  else if (below > 0) delta = below
  else return () => {}

  const max = Math.max(0, container.scrollHeight - container.clientHeight)
  const next = Math.min(max, Math.max(0, container.scrollTop + delta))
  if (Math.abs(next - container.scrollTop) < 1) return () => {}

  playback?.stop()
  releaseGesture?.()

  const release = watchGesture(container)
  playback = animate(container.scrollTop, next, {
    type: "spring",
    bounce: 0,
    visualDuration: 0.32,
    restDelta: 0.5,
    onUpdate: (value) => {
      container.scrollTop = value
    },
  })
  void playback.finished.finally(release)

  return () => {
    playback?.stop()
    release()
  }
}
