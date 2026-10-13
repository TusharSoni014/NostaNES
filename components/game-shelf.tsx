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
          "flex w-max items-end gap-6 [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:gap-8",
          metrics.step === 0 && "opacity-0",
        )}
        style={{ transform: `translate3d(${offset}px, 0, 0)` }}
      >
        {games.map((game, gameIndex) => {
          const selected = gameIndex === index
          const delta = gameIndex - index
          const absDelta = Math.abs(delta)
          const isOffscreen = absDelta > 12

          // Parabolic / Bezier 3D arc offsets
          const arcY = Math.min(36, Math.pow(absDelta, 1.35) * 3.6)
          const arcZ = -Math.min(260, Math.pow(absDelta, 1.25) * 32)
          const rotateY = -Math.sign(delta) * Math.min(35, Math.pow(absDelta, 0.72) * 13)
          const scale = selected ? 1.08 : Math.max(0.74, 1 - Math.pow(absDelta, 0.8) * 0.075)
          const opacity = selected ? 1 : Math.max(0.38, 1 - Math.pow(absDelta, 0.7) * 0.18)
          const zIndex = selected ? 30 : Math.max(1, 20 - absDelta)

          return (
            <div
              key={game.id}
              ref={gameIndex === 0 ? tileRef : undefined}
              className={cn(
                "flex w-[148px] shrink-0 flex-col gap-3 [transform-style:preserve-3d] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:w-[188px] lg:w-[210px]",
                isOffscreen && "pointer-events-none invisible",
              )}
              style={{
                transform: `translate3d(0, ${arcY}px, ${arcZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
              }}
            >
              {isOffscreen ? (
                <div className="aspect-square w-full rounded-2xl" />
              ) : (
                <>
                  <button
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    aria-label={
                      selected ? `Play ${game.title}` : `Focus ${game.title}`
                    }
                    className={cn(
                      "aspect-square w-full rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
                      selected &&
                        "shadow-[0_20px_60px_oklch(0.62_0.14_245/0.45)] ring-2 ring-primary/80 ring-offset-2 ring-offset-background",
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
                    className="h-16 overflow-hidden opacity-50 transition-opacity duration-700"
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
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
