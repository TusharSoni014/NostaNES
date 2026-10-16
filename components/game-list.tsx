"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Gamepad2Icon } from "lucide-react"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { cn } from "@/lib/utils"
import type { Game, GameGroup } from "@/lib/games"

type GameListProps = {
  games: (Game | GameGroup)[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  onLaunch: (index: number) => void
  onOpenDetails?: (index: number) => void
  isMobile?: boolean
  gamepadConnected?: boolean
}

const ROW_GAP = 12
const FALLBACK_ROW_HEIGHT = 67
const OVERSCAN = 8

type Range = { start: number; end: number }

export const GameList = ({
  games,
  selectedIndex,
  onSelectIndex,
  onLaunch,
  onOpenDetails,
  isMobile = false,
  gamepadConnected = false,
}: GameListProps) => {
  const isMobileTouchMode = isMobile && !gamepadConnected
  const listRef = useRef<HTMLDivElement>(null)
  const [stride, setStride] = useState(FALLBACK_ROW_HEIGHT + ROW_GAP)
  const strideRef = useRef(FALLBACK_ROW_HEIGHT + ROW_GAP)
  const rangeRef = useRef<Range>({ start: 0, end: 24 })
  const lastScrollTimeRef = useRef(0)
  const frameRef = useRef(0)
  const measuredRef = useRef(false)
  const [range, setRange] = useState<Range>({ start: 0, end: 24 })

  const publishRange = useCallback((next: Range) => {
    const current = rangeRef.current
    if (current.start === next.start && current.end === next.end) return
    rangeRef.current = next
    setRange(next)
  }, [])

  const syncRange = useCallback(() => {
    const listEl = listRef.current
    if (!listEl) return
    const currentStride = strideRef.current
    const padding = Number.parseFloat(getComputedStyle(listEl).paddingTop) || 0
    const start = Math.max(0, Math.floor((listEl.scrollTop - padding) / currentStride) - OVERSCAN)
    const end = Math.min(
      games.length,
      Math.ceil((listEl.scrollTop - padding + listEl.clientHeight) / currentStride) + OVERSCAN,
    )
    publishRange({ start, end: Math.max(end, start) })
  }, [games.length, publishRange])

  useEffect(() => {
    if (isMobileTouchMode) return
    const listEl = listRef.current
    if (!listEl) return

    const currentStride = strideRef.current
    const padding = Number.parseFloat(getComputedStyle(listEl).paddingTop) || 0
    const rowHeight = currentStride - ROW_GAP
    const itemTop = padding + selectedIndex * currentStride
    const targetScrollTop = itemTop - (listEl.clientHeight - rowHeight) / 2
    const now = performance.now()
    const isRapid = now - lastScrollTimeRef.current < 130
    lastScrollTimeRef.current = now

    listEl.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: isRapid ? "auto" : "smooth",
    })
    syncRange()
  }, [selectedIndex, games.length, syncRange, isMobileTouchMode])

  useEffect(() => {
    const listEl = listRef.current
    if (!listEl) return

    const onScroll = () => {
      if (frameRef.current) return
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0
        syncRange()
      })
    }

    syncRange()
    listEl.addEventListener("scroll", onScroll, { passive: true })
    const observer = new ResizeObserver(() => syncRange())
    observer.observe(listEl)
    return () => {
      observer.disconnect()
      listEl.removeEventListener("scroll", onScroll)
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current)
    }
  }, [syncRange])

  useEffect(() => {
    measuredRef.current = false
  }, [isMobileTouchMode])

  useEffect(() => {
    if (measuredRef.current) return
    const row = listRef.current?.querySelector("[data-game-row]")
    if (!(row instanceof HTMLElement)) return
    const next = row.offsetHeight + ROW_GAP
    if (next <= ROW_GAP) return
    measuredRef.current = true
    if (next === strideRef.current) return
    strideRef.current = next
    setStride(next)
    syncRange()
  }, [syncRange])

  const start = range.start
  const end = range.end

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="NES Cartridges Library"
      className={cn(
        "relative flex-1 overflow-y-auto overscroll-y-contain focus:outline-none",
        isMobileTouchMode
          ? "px-2 py-3 sm:px-6 md:px-7 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]"
          : "px-4 py-8 sm:px-6 md:px-7 [scrollbar-gutter:stable] [perspective:1200px] [transform-style:preserve-3d]",
      )}
      tabIndex={-1}
    >
      <div style={{ position: "relative", height: Math.max(0, games.length * stride - ROW_GAP) }}>
        {games.slice(start, end).map((game, offset) => {
          const i = start + offset
          const isSelected = i === selectedIndex
          const delta = i - selectedIndex
          const absDelta = Math.abs(delta)

          const rotateX =
            delta === 0 ? 0 : -Math.sign(delta) * Math.min(8, Math.pow(absDelta, 0.7) * 2.2)
          const translateZ =
            delta === 0 ? 14 : -Math.min(45, Math.pow(absDelta, 0.9) * 5)
          const scale =
            delta === 0 ? 1.02 : Math.max(0.95, 1 - absDelta * 0.008)
          const opacity =
            isMobileTouchMode ? 1 : delta === 0 ? 1 : Math.max(0.42, 1 - absDelta * 0.07)
          const zIndex = isMobileTouchMode
            ? isSelected
              ? 10
              : 1
            : delta === 0
              ? 30
              : Math.max(1, 20 - absDelta)

          return (
            <div
              key={game.id}
              data-game-row=""
              role="option"
              aria-selected={isSelected}
              aria-setsize={games.length}
              aria-posinset={i + 1}
              onClick={() => {
                onSelectIndex(i)
                if (isMobileTouchMode && onOpenDetails) {
                  onOpenDetails(i)
                } else if (isSelected) {
                  onLaunch(i)
                }
              }}
              onDoubleClick={() => onLaunch(i)}
              style={{
                position: "absolute",
                top: i * stride,
                left: 0,
                right: 0,
                transform: isMobileTouchMode
                  ? "none"
                  : `perspective(1200px) translate3d(0, 0, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
                opacity,
                zIndex,
              }}
              className={cn(
                "group relative flex cursor-pointer items-center justify-between gap-2.5 sm:gap-3.5 rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 select-none will-change-transform transition-[transform,background-color,border-color,box-shadow,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                !isMobileTouchMode && "[transform-style:preserve-3d] [backface-visibility:hidden]",
                isSelected
                  ? "border-white bg-white text-zinc-950 shadow-[0_12px_36px_rgba(255,255,255,0.22),0_4px_16px_rgba(0,0,0,0.6)] ring-1 ring-white/70"
                  : "border-white/10 bg-white/[0.04] backdrop-blur-md text-white/90 hover:border-white/25 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3.5">
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums w-7 shrink-0 transition-colors",
                    isSelected
                      ? "font-bold text-zinc-950"
                      : "text-white/40 group-hover:text-white/70",
                  )}
                >
                  {String(i + 1).padStart(3, "0")}
                </span>

                {!isMobile && (
                  <div
                    className={cn(
                      "hidden sm:grid size-8 shrink-0 place-items-center rounded-xl border transition-colors",
                      isSelected
                        ? "border-zinc-900 bg-zinc-950 text-white"
                        : "border-white/10 bg-white/[0.05] text-white/60 group-hover:border-white/20 group-hover:text-white group-hover:bg-white/10",
                    )}
                  >
                    <Gamepad2Icon className="size-4" />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <span
                    title={game.title}
                    className={cn(
                      "truncate text-sm sm:text-base tracking-tight transition-colors",
                      isSelected
                        ? "font-bold text-zinc-950"
                        : "font-medium text-white/90 group-hover:text-white",
                    )}
                  >
                    {game.title}
                  </span>
                  {!isMobileTouchMode ? (
                    <span
                      className={cn(
                        "truncate font-mono text-[11px] transition-colors",
                        isSelected
                          ? "font-medium text-zinc-600"
                          : "text-white/40 group-hover:text-white/60",
                      )}
                    >
                      {"versions" in game && game.versions.length > 1
                        ? `${game.versions.length} versions available`
                        : game.file}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {!isMobileTouchMode ? (
                  <>
                    {"versions" in game && game.versions.length > 1 ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs border font-semibold transition-colors",
                          isSelected
                            ? "border-zinc-800 bg-zinc-950 text-sky-400"
                            : "border-sky-400/30 bg-sky-500/10 text-sky-300",
                        )}
                      >
                        {game.versions.length} Ver
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs border font-medium transition-colors",
                        isSelected
                          ? "border-zinc-800 bg-zinc-950 text-white"
                          : "border-white/10 bg-white/[0.06] text-white/70",
                      )}
                    >
                      {game.region}
                    </span>
                    {game.year ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs border transition-colors",
                          isSelected
                            ? "border-zinc-300 bg-zinc-200 text-zinc-900 font-medium"
                            : "border-white/10 bg-white/[0.04] text-white/50",
                        )}
                      >
                        {game.year}
                      </span>
                    ) : null}
                  </>
                ) : null}
                <FavoriteButton
                  game={game}
                  variant="badge"
                  size="sm"
                  className="ml-0.5"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
