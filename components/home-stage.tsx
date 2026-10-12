"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Gamepad2Icon, PlayIcon, SearchIcon } from "lucide-react"
import { GameShelf } from "@/components/game-shelf"
import { PlayerStage } from "@/components/player-stage"
import { WaveField } from "@/components/wave-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Game } from "@/lib/games"

export function HomeStage() {
  const [games, setGames] = useState<Game[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState<Game | null>(null)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("All")

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/library", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("library")
        return response.json() as Promise<{ games: Game[] }>
      })
      .then((data) => setGames(data.games))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setFailed(true)
      })
    return () => controller.abort()
  }, [])

  const regions = useMemo(() => {
    const found = new Set<string>()
    for (const game of games ?? []) found.add(game.region)
    return ["All", ...[...found].sort()]
  }, [games])

  const visible = useMemo(() => {
    if (!games) return []
    const needle = query.trim().toLowerCase()
    return games.filter((game) => {
      const regionMatches = region === "All" || game.region === region
      const text = `${game.title} ${game.tags.join(" ")}`.toLowerCase()
      return regionMatches && (needle.length === 0 || text.includes(needle))
    })
  }, [games, query, region])

  const count = visible.length
  const selected = visible[index] ?? null

  const move = useCallback(
    (direction: -1 | 1) => {
      setIndex((current) => {
        const next = current + direction
        if (next < 0 || next > count - 1) return current
        return next
      })
    },
    [count],
  )

  const launch = useCallback(() => {
    if (!selected) return
    setPlaying(selected)
  }, [selected])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (playing) {
        if (event.key === "Escape") {
          event.preventDefault()
          event.stopPropagation()
          setPlaying(null)
        }
        return
      }
      if (controlsOpen) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, [data-slot=toggle-group]")
      ) {
        return
      }
      const onControl =
        target instanceof HTMLElement &&
        Boolean(target.closest("button, a, input, textarea"))
      if (event.key === "ArrowRight") {
        event.preventDefault()
        move(1)
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        move(-1)
      } else if (event.key === "Enter" && !onControl) {
        event.preventDefault()
        launch()
      }
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [controlsOpen, launch, move, playing])

  useEffect(() => {
    if (playing || count === 0) return
    let frame = 0
    let lockUntil = 0
    let previousCross = false

    const loop = (time: number) => {
      const pads = navigator.getGamepads?.() ?? []
      const pad = [...pads].find((item) => item !== null)
      if (pad) {
        const left = (pad.axes[0] ?? 0) < -0.55 || Boolean(pad.buttons[14]?.pressed)
        const right = (pad.axes[0] ?? 0) > 0.55 || Boolean(pad.buttons[15]?.pressed)
        if (time > lockUntil && (left || right)) {
          move(left ? -1 : 1)
          lockUntil = time + 260
        }
        const cross = Boolean(pad.buttons[0]?.pressed)
        if (cross && !previousCross) launch()
        previousCross = cross
      }
      frame = window.requestAnimationFrame(loop)
    }

    frame = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(frame)
  }, [count, launch, move, playing])

  useEffect(() => {
    let lockUntil = 0
    const onWheel = (event: WheelEvent) => {
      if (playing || controlsOpen) return
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY
      if (Math.abs(delta) < 8) return
      event.preventDefault()
      const now = performance.now()
      if (now < lockUntil) return
      lockUntil = now + 280
      move(delta > 0 ? 1 : -1)
    }
    window.addEventListener("wheel", onWheel, { passive: false })
    return () => window.removeEventListener("wheel", onWheel)
  }, [controlsOpen, move, playing])

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <WaveField shift={count === 0 ? 0 : (index % 4) / 3} />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 px-5 pt-6 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              N
            </span>
            <div className="flex flex-col">
              <p className="text-sm font-medium tracking-wide">NostaNES</p>
              <p className="text-xs text-muted-foreground">
                Nintendo Entertainment System
              </p>
            </div>
          </div>
          <Clock />
        </header>

        <div className="flex flex-col gap-3 px-4 pt-5 sm:px-10">
          <Field className="max-w-sm">
            <FieldLabel htmlFor="library-search" className="sr-only">
              Search cartridges
            </FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                id="library-search"
                value={query}
                placeholder="Search cartridges"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setIndex(0)
                }}
              />
            </InputGroup>
          </Field>
          <ToggleGroup
            variant="outline"
            size="sm"
            spacing={1}
            value={[region]}
            onValueChange={(next) => {
              setRegion(next.at(-1) ?? "All")
              setIndex(0)
            }}
            className="max-w-full flex-wrap"
          >
            {regions.map((item) => (
              <ToggleGroupItem key={item} value={item}>
                {item}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <main className="flex min-h-0 flex-1 flex-col justify-end">
          {failed ? (
            <div className="px-6 pb-16">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Gamepad2Icon />
                  </EmptyMedia>
                  <EmptyTitle>The library did not load</EmptyTitle>
                  <EmptyDescription>
                    Refresh the page to try the cartridge list again.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : games === null ? (
            <ShelfSkeleton />
          ) : games.length === 0 ? (
            <div className="px-6 pb-16">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Gamepad2Icon />
                  </EmptyMedia>
                  <EmptyTitle>No cartridges yet</EmptyTitle>
                  <EmptyDescription>
                    Add NES files to the library list and they will appear on
                    this shelf.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : visible.length === 0 ? (
            <div className="px-6 pb-16">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchIcon />
                  </EmptyMedia>
                  <EmptyTitle>Nothing matches</EmptyTitle>
                  <EmptyDescription>
                    Try another title or clear the region filter.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : selected ? (
            <div className="flex flex-col gap-2">
              <div
                key={selected.id}
                className="nostanes-rise flex flex-col items-center gap-3 px-6 text-center"
              >
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge>NES</Badge>
                  <Badge variant="outline">{selected.region}</Badge>
                  {selected.year ? (
                    <Badge variant="secondary">{selected.year}</Badge>
                  ) : null}
                </div>
                <h1 className="max-w-4xl text-4xl font-medium tracking-tight text-balance sm:text-6xl">
                  {selected.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selected.tags.length > 0
                    ? selected.tags.join(" · ")
                    : "Cartridge"}
                  <span className="px-2 text-foreground/30">/</span>
                  <span className="font-mono tracking-[0.18em]">
                    {String(index + 1).padStart(2, "0")}
                    {" · "}
                    {String(visible.length).padStart(2, "0")}
                  </span>
                </p>
              </div>
              <GameShelf
                games={visible}
                index={index}
                onIndex={setIndex}
                onLaunch={(next) => {
                  const game = visible[next]
                  if (game) setPlaying(game)
                }}
              />
            </div>
          ) : null}
        </main>

        <footer className="flex items-center justify-between gap-3 px-4 pb-5 sm:px-10">
          <div className="hidden flex-wrap items-center gap-3 text-sm text-muted-foreground sm:flex">
            <span className="flex items-center gap-1">
              <Kbd>←</Kbd>
              <Kbd>→</Kbd>
              Move
            </span>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <span className="flex items-center gap-1">
              <Kbd>Enter</Kbd>
              Start
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Dialog open={controlsOpen} onOpenChange={setControlsOpen}>
              <DialogTrigger render={<Button variant="outline" size="lg" />}>
                Controls
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Controls</DialogTitle>
                  <DialogDescription>
                    Move along the shelf, then play with the NES layout.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <ControlRow label="Move on the shelf" keys={["←", "→"]} />
                  <ControlRow label="Start the game" keys={["Enter"]} />
                  <Separator />
                  <ControlRow label="D-pad" keys={["Arrows"]} />
                  <ControlRow label="B button" keys={["Z"]} />
                  <ControlRow label="A button" keys={["X"]} />
                  <ControlRow label="Start" keys={["Enter"]} />
                  <ControlRow label="Select" keys={["Shift"]} />
                  <ControlRow label="Leave the game" keys={["Esc"]} />
                </div>
              </DialogContent>
            </Dialog>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button size="lg" disabled={!selected} onClick={launch} />
                }
              >
                <PlayIcon data-icon="inline-start" />
                Start
              </TooltipTrigger>
              <TooltipContent>Play the selected cartridge</TooltipContent>
            </Tooltip>
          </div>
        </footer>
      </div>

      {playing ? (
        <PlayerStage game={playing} onExit={() => setPlaying(null)} />
      ) : null}
    </div>
  )
}

function ControlRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </span>
    </div>
  )
}

function ShelfSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 px-6 pb-10">
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-12 w-64" />
      </div>
      <div className="flex items-center gap-6">
        <Skeleton className="size-36 rounded-2xl opacity-60 sm:size-48" />
        <Skeleton className="size-44 rounded-2xl sm:size-56" />
        <Skeleton className="size-36 rounded-2xl opacity-60 sm:size-48" />
      </div>
    </div>
  )
}

function Clock() {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date())

    const update = () => setLabel(format())
    update()
    const id = window.setInterval(update, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <p className="font-mono text-sm text-muted-foreground tabular-nums">
      {label ?? "––"}
    </p>
  )
}
