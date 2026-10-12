"use client"

import { useEffect, useRef, useState } from "react"
import type { Nostalgist } from "nostalgist"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { Game } from "@/lib/games"

type PlayerStageProps = {
  game: Game
  onExit: () => void
}

function ignoreWakeLockDenial() {
  const locks = navigator.wakeLock
  if (!locks) return

  const request = locks.request.bind(locks)
  const guarded = (type: WakeLockType) =>
    request(type).catch(() => {
      const sentinel = new EventTarget()
      return Object.assign(sentinel, {
        released: false,
        type,
        onrelease: null,
        release: async () => {
          sentinel.dispatchEvent(new Event("release"))
        },
      })
    })

  try {
    locks.request = guarded
  } catch {
    window.addEventListener("unhandledrejection", (event) => {
      if (String(event.reason).includes("Wake Lock")) event.preventDefault()
    })
  }
}

export function PlayerStage({ game, onExit }: PlayerStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    const canvas = canvasRef.current
    const frame = canvas?.parentElement
    if (!canvas || !frame) return

    const controller = new AbortController()
    let stopped = false
    let instance: Nostalgist | null = null
    ignoreWakeLockDenial()

    const rect = frame.getBoundingClientRect()
    const scale = Math.max(
      1,
      Math.floor(
        Math.min(
          (rect.width || 768) / 256,
          (rect.height || 576) / 240,
        ),
      ),
    )

    ;(async () => {
      try {
        const { Nostalgist } = await import("nostalgist")
        if (stopped) return

        const rom = new URL(
          `/api/rom?file=${encodeURIComponent(game.file)}`,
          window.location.origin,
        ).href

        const emulator = await Nostalgist.nes({
          rom,
          element: canvas,
          signal: controller.signal,
          cache: { core: true, rom: true },
          size: { width: 256 * scale, height: 240 * scale },
          style: {
            width: "100%",
            height: "100%",
            display: "block",
            backgroundColor: "black",
          },
          retroarchConfig: {
            video_smooth: false,
            video_force_aspect: true,
            audio_enable: true,
            input_exit_emulator: "nul",
            input_menu_toggle: "f1",
            input_player1_up: "up",
            input_player1_down: "down",
            input_player1_left: "left",
            input_player1_right: "right",
            input_player1_a: "x",
            input_player1_b: "z",
            input_player1_start: "enter",
            input_player1_select: "shift",
          },
          onLaunch() {
            if (!stopped) {
              setPhase("ready")
              canvas.focus()
            }
          },
        })

        if (stopped) {
          emulator.exit({ removeCanvas: false })
          return
        }
        instance = emulator
      } catch (error) {
        if (!stopped && !controller.signal.aborted) {
          console.error(error)
          setPhase("error")
        }
      }
    })()

    return () => {
      stopped = true
      controller.abort()
      instance?.exit({ removeCanvas: false })
    }
  }, [game.file])

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background/55 backdrop-blur-md">
      <header className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
            Now playing
          </p>
          <h2 className="truncate text-xl font-medium tracking-tight">
            {game.title}
          </h2>
        </div>
        <Button variant="outline" onClick={onExit}>
          Close
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <div className="relative aspect-[4/3] w-full max-w-[min(100%,calc((100dvh-11rem)*4/3))] overflow-hidden rounded-2xl bg-black shadow-[0_30px_90px_oklch(0.45_0.18_255/0.45)] ring-1 ring-foreground/20">
          <canvas
            ref={canvasRef}
            tabIndex={-1}
            className="size-full [image-rendering:pixelated] outline-none"
            aria-label={`${game.title} display`}
          />
          {phase === "loading" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/75">
              <Spinner className="size-8" />
              <p className="text-sm text-muted-foreground">Loading emulator</p>
            </div>
          ) : null}
          {phase === "error" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/85 p-6">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>The cartridge did not start</EmptyTitle>
                  <EmptyDescription>
                    The ROM could not be loaded from the library. Close this
                    screen and try again.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={onExit}>Back to the shelf</Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 py-5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Kbd>Arrows</Kbd>
          Move
        </span>
        <Separator orientation="vertical" className="hidden h-4 sm:block" />
        <span className="flex items-center gap-1">
          <Kbd>Z</Kbd>
          B
        </span>
        <span className="flex items-center gap-1">
          <Kbd>X</Kbd>
          A
        </span>
        <span className="flex items-center gap-1">
          <Kbd>Enter</Kbd>
          Start
        </span>
        <span className="flex items-center gap-1">
          <Kbd>Shift</Kbd>
          Select
        </span>
        <Separator orientation="vertical" className="hidden h-4 sm:block" />
        <span className="flex items-center gap-1">
          <Kbd>Esc</Kbd>
          Close
        </span>
      </footer>
    </div>
  )
}
