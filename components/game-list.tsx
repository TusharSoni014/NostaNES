"use client"

import { useEffect, useRef } from "react"
import { Gamepad2Icon } from "lucide-react"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { cn } from "@/lib/utils"
import type { Game, GameGroup } from "@/lib/games"

type GameListProps = {
  games: (Game | GameGroup)[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  onLaunch: (index: number) => void
}

export const GameList = ({
  games,
  selectedIndex,
  onSelectIndex,
  onLaunch,
}: GameListProps) => {
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const lastScrollTimeRef = useRef(0)

  // Smoothly center the active item within the listbox container with zero parent jitter
  useEffect(() => {
    const listEl = listRef.current
    const itemEl = itemRefs.current[selectedIndex]
    if (!listEl || !itemEl) return

    const now = performance.now()
    const isRapid = now - lastScrollTimeRef.current < 130
    lastScrollTimeRef.current = now

    const containerHeight = listEl.clientHeight
    const itemTop = itemEl.offsetTop
    const itemHeight = itemEl.clientHeight
    const targetScrollTop = itemTop - (containerHeight - itemHeight) / 2

    listEl.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: isRapid ? "auto" : "smooth",
    })
  }, [selectedIndex])

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="NES Cartridges Library"
      className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-8 sm:px-6 md:px-7 [scrollbar-gutter:stable] focus:outline-none [perspective:1200px] [transform-style:preserve-3d]"
      tabIndex={-1}
    >
      {games.map((game, i) => {
        const isSelected = i === selectedIndex
        const delta = i - selectedIndex
        const absDelta = Math.abs(delta)

        // Refined 3D depth curve: subtle tilt, anti-aliased, zero font shimmering
        const rotateX =
          delta === 0 ? 0 : -Math.sign(delta) * Math.min(8, Math.pow(absDelta, 0.7) * 2.2)
        const translateZ =
          delta === 0 ? 14 : -Math.min(45, Math.pow(absDelta, 0.9) * 5)
        const scale =
          delta === 0 ? 1.02 : Math.max(0.95, 1 - absDelta * 0.008)
        const opacity =
          delta === 0 ? 1 : Math.max(0.42, 1 - absDelta * 0.07)
        const zIndex = delta === 0 ? 30 : Math.max(1, 20 - absDelta)

        return (
          <div
            key={game.id}
            ref={(node) => {
              itemRefs.current[i] = node
            }}
            role="option"
            aria-selected={isSelected}
            onClick={() => {
              if (isSelected) onLaunch(i)
              else onSelectIndex(i)
            }}
            onDoubleClick={() => onLaunch(i)}
            style={{
              transform: `perspective(1200px) translate3d(0, 0, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
              opacity,
              zIndex,
            }}
            className={cn(
              "group relative flex cursor-pointer items-center justify-between gap-3.5 rounded-2xl border px-4 py-3 select-none [transform-style:preserve-3d] [backface-visibility:hidden] will-change-transform transition-[transform,background-color,border-color,box-shadow,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isSelected
                ? "border-white bg-white text-zinc-950 shadow-[0_12px_36px_rgba(255,255,255,0.22),0_4px_16px_rgba(0,0,0,0.6)] ring-1 ring-white/70"
                : "border-white/10 bg-white/[0.04] backdrop-blur-md text-white/90 hover:border-white/25 hover:bg-white/[0.08] hover:text-white",
            )}
          >
            {/* Left: Index + Icon + Title */}
            <div className="flex min-w-0 flex-1 items-center gap-3.5">
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

              <div
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-xl border transition-colors",
                  isSelected
                    ? "border-zinc-900 bg-zinc-950 text-white"
                    : "border-white/10 bg-white/[0.05] text-white/60 group-hover:border-white/20 group-hover:text-white group-hover:bg-white/10",
                )}
              >
                <Gamepad2Icon className="size-4" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
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
              </div>
            </div>

            {/* Right: Region & Year Badges */}
            <div className="flex shrink-0 items-center gap-1.5">
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
  )
}
