"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { GameCover } from "@/components/game-cover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Game } from "@/lib/games"

type GameShelfProps = {
  games: Game[]
  index: number
  onIndex: (index: number) => void
  onLaunch: (index: number) => void
}

export function GameShelf({ games, index, onIndex, onLaunch }: GameShelfProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const tileRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number } | null>(null)
  const ignoreClickRef = useRef(false)
  const [metrics, setMetrics] = useState({ step: 0, tile: 0, view: 0 })

  useLayoutEffect(() => {
    const view = viewportRef.current
    const tile = tileRef.current
    if (!view || !tile) return

    const measure = () => {
      const parent = tile.parentElement
      const gap = parent
        ? Number.parseFloat(getComputedStyle(parent).columnGap || "0")
        : 0
      setMetrics({
        step: tile.offsetWidth + gap,
        tile: tile.offsetWidth,
        view: view.clientWidth,
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(view)
    observer.observe(tile)
    return () => observer.disconnect()
  }, [games.length])

  const offset =
    metrics.view / 2 - metrics.tile / 2 - index * metrics.step

  return (
    <div
      ref={viewportRef}
      className="relative py-8 [perspective:1400px]"
      onPointerDown={(event) => {
        dragRef.current = { x: event.clientX }
      }}
      onPointerUp={(event) => {
        const start = dragRef.current
        dragRef.current = null
        if (!start) return
        const delta = event.clientX - start.x
        if (Math.abs(delta) < 56) return
        ignoreClickRef.current = true
        onIndex(
          delta > 0
            ? Math.max(0, index - 1)
            : Math.min(games.length - 1, index + 1),
        )
      }}
    >
      <div className="pointer-events-none absolute inset-y-8 left-3 z-20 flex items-center sm:left-8">
        <Button
          variant="outline"
          size="icon-lg"
          className="pointer-events-auto"
          aria-label="Previous game"
          disabled={index === 0}
          onClick={() => onIndex(Math.max(0, index - 1))}
        >
          <ChevronLeftIcon />
        </Button>
      </div>
      <div className="pointer-events-none absolute inset-y-8 right-3 z-20 flex items-center sm:right-8">
        <Button
          variant="outline"
          size="icon-lg"
          className="pointer-events-auto"
          aria-label="Next game"
          disabled={index === games.length - 1}
          onClick={() => onIndex(Math.min(games.length - 1, index + 1))}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <div
        className={cn(
          "flex w-max items-end gap-6 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:gap-8",
          metrics.step === 0 && "opacity-0",
        )}
        style={{ transform: `translate3d(${offset}px, 0, 0)` }}
      >
        {games.map((game, gameIndex) => {
          const selected = gameIndex === index
          const delta = gameIndex - index
          const rotate = Math.max(-26, Math.min(26, delta * -12))
          return (
            <div
              key={game.id}
              ref={gameIndex === 0 ? tileRef : undefined}
              className="flex w-[148px] shrink-0 flex-col gap-3 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:w-[188px] lg:w-[210px]"
              style={{
                transform: `rotateY(${rotate * 0.45}deg) scale(${selected ? 1.04 : 0.9})`,
                opacity: selected ? 1 : Math.max(0.42, 1 - Math.abs(delta) * 0.22),
                zIndex: selected ? 2 : 1,
              }}
            >
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                aria-label={
                  selected ? `Play ${game.title}` : `Focus ${game.title}`
                }
                className={cn(
                  "aspect-square w-full rounded-2xl transition-shadow duration-700 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
                  selected &&
                    "shadow-[0_18px_50px_oklch(0.62_0.12_245/0.35)] ring-1 ring-foreground/80",
                )}
                onClick={() => {
                  if (ignoreClickRef.current) {
                    ignoreClickRef.current = false
                    return
                  }
                  if (selected) onLaunch(gameIndex)
                  else onIndex(gameIndex)
                }}
              >
                <GameCover game={game} selected={selected} />
              </button>
              <div
                aria-hidden
                className="h-16 overflow-hidden opacity-50"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, oklch(1 0 0 / 70%), transparent)",
                }}
              >
                <div className="origin-top -scale-y-100">
                  <div className="aspect-square w-full">
                    <GameCover game={game} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
