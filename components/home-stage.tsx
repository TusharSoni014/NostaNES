"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Gamepad2Icon, PlayIcon, SearchIcon } from "lucide-react"
import Image from "next/image"
import { BootScreen } from "@/components/boot-screen"
import { Clock } from "@/components/clock"
import { ControlsDialog } from "@/components/controls-dialog"
import { GameDetailsPanel } from "@/components/game-details-panel"
import { GameList } from "@/components/game-list"
import { GameListSkeleton } from "@/components/game-list-skeleton"
import { GamepadStatusIndicator } from "@/components/gamepad-status-indicator"
import { PlayerStage } from "@/components/player-stage"
import { useShelfNavigation } from "@/components/use-shelf-navigation"
import { WaveField } from "@/components/wave-field"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "motion/react"
import { enableUiSounds, playUiSound } from "@/lib/ui-sounds"
import type { Game } from "@/lib/games"

export type HomeStageProps = {
  initialGames?: Game[]
}

export function HomeStage({ initialGames }: HomeStageProps = {}) {
  const [fetchedGames, setFetchedGames] = useState<Game[] | null>(null)
  const games = fetchedGames ?? (initialGames && initialGames.length > 0 ? initialGames : null)
  const [failed, setFailed] = useState(false)
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  const [playing, setPlaying] = useState<Game | null>(null)
  const [shaderReady, setShaderReady] = useState(false)
  const [presented, setPresented] = useState(false)
  const [bootMounted, setBootMounted] = useState(true)
  const [entrance, setEntrance] = useState(true)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("All")
  const [reloadKey, setReloadKey] = useState(0)

  // Auto-refresh library when returning to tab or window focus
  useEffect(() => {
    const onRefreshNeeded = () => {
      if (document.visibilityState === "visible") {
        setReloadKey((prev) => prev + 1)
      }
    }
    document.addEventListener("visibilitychange", onRefreshNeeded)
    window.addEventListener("focus", onRefreshNeeded)
    return () => {
      document.removeEventListener("visibilitychange", onRefreshNeeded)
      window.removeEventListener("focus", onRefreshNeeded)
    }
  }, [])

  // Fetch games dynamically from server if not pre-populated or if reloaded
  useEffect(() => {
    if (initialGames && initialGames.length > 0 && reloadKey === 0) {
      return
    }

    const controller = new AbortController()
    fetch(`/api/library?t=${Date.now()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load library from server")
        return response.json() as Promise<{ games: Game[] }>
      })
      .then((data) => {
        setFetchedGames(data.games)
        setFailed(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setFailed(true)
      })

    return () => controller.abort()
  }, [initialGames, reloadKey])

  useEffect(() => {
    if (failed) playUiSound("error")
  }, [failed])

  useEffect(() => {
    const id = window.setTimeout(() => setShaderReady(true), 8000)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!presented) return
    const trimmed = query.trim()
    if (!trimmed) return
    const id = window.setTimeout(() => playUiSound("option_selected"), 450)
    return () => window.clearTimeout(id)
  }, [presented, query])

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
      const current = indexRef.current
      const next = current + direction
      if (next < 0 || next > count - 1) return
      indexRef.current = next
      setIndex(next)
      playUiSound("navigation")
    },
    [count],
  )

  const jump = useCallback(
    (step: number) => {
      const current = indexRef.current
      const next = Math.max(0, Math.min(count - 1, current + step))
      if (next === current) return
      indexRef.current = next
      setIndex(next)
      playUiSound("navigation")
    },
    [count],
  )

  const launch = useCallback(() => {
    if (!selected) return
    playUiSound("game_start")
    setPlaying(selected)
  }, [selected])

  const revealShelf = useCallback(() => {
    enableUiSounds()
    setPresented(true)
  }, [])

  const toggleControls = useCallback(() => {
    setControlsOpen((prev) => !prev)
  }, [])

  // Hook handles Keyboard, Gamepad (Xbox/PlayStation/generic), and mouse wheel
  useShelfNavigation({
    count,
    isPlaying: Boolean(playing) || !presented,
    controlsOpen,
    move,
    jump,
    launch,
    onToggleControls: toggleControls,
  })

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <WaveField
        shift={count === 0 ? 0 : (index % 4) / 3}
        onReady={() => setShaderReady(true)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={
          !presented
            ? { opacity: 0, scale: 0.6 }
            : playing
              ? { opacity: 0, scale: 0.96 }
              : { opacity: 1, scale: 1 }
        }
        transition={{
          duration: !presented ? 0 : entrance ? 0.9 : 0.25,
          ease: [0.16, 1, 0.3, 1],
        }}
        onAnimationComplete={() => {
          if (presented) setEntrance(false)
        }}
        aria-hidden={!presented}
        className={`relative z-10 flex min-h-0 flex-1 origin-center flex-col will-change-[opacity,transform] ${
          presented ? "" : "pointer-events-none"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 px-5 pt-6 sm:px-10">
          <div className="flex items-center gap-3">
            <Image
              src="/nostanes.png"
              alt="NostaNES"
              width={40}
              height={40}
              priority
              className="h-10 w-auto object-contain shrink-0 select-none"
            />
            <div className="flex flex-col">
              <p className="text-sm font-semibold tracking-wide">NostaNES</p>
              <p className="text-xs text-muted-foreground">
                Nintendo Entertainment System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GamepadStatusIndicator />
            <Clock />
          </div>
        </header>

        <div className="flex shrink-0 flex-col gap-3 px-4 pt-5 sm:px-10 z-20">
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
                  indexRef.current = 0
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
              const value = next.at(-1) ?? "All"
              if (value === region) return
              setRegion(value)
              indexRef.current = 0
              setIndex(0)
              playUiSound("option_selected")
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

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden py-3">
          {failed ? (
            <div className="my-auto px-6 pb-16">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Gamepad2Icon />
                  </EmptyMedia>
                  <EmptyTitle>The library did not load</EmptyTitle>
                  <EmptyDescription>
                    Could not fetch cartridges from the server.
                  </EmptyDescription>
                </EmptyHeader>
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFailed(false)
                      setReloadKey((k) => k + 1)
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </Empty>
            </div>
          ) : games === null ? (
            <div className="flex min-h-0 flex-1 px-4 sm:px-10">
              <GameListSkeleton />
            </div>
          ) : games.length === 0 ? (
            <div className="my-auto px-6 pb-16">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Gamepad2Icon />
                  </EmptyMedia>
                  <EmptyTitle>No cartridges yet</EmptyTitle>
                  <EmptyDescription>
                    Upload NES ROM files to the R2 bucket and they will appear
                    automatically on this shelf.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : visible.length === 0 ? (
            <div className="my-auto px-6 pb-16">
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
            <div className="flex min-h-0 flex-1 flex-col md:flex-row gap-6 lg:gap-8 overflow-hidden px-3 sm:px-8">
              {/* Left Column: Scrollable list of games */}
              <div className="flex min-h-0 flex-1 flex-col">
                <GameList
                  games={visible}
                  selectedIndex={index}
                  onSelectIndex={(next) => {
                    if (next === indexRef.current) return
                    indexRef.current = next
                    setIndex(next)
                    playUiSound("option_selected")
                  }}
                  onLaunch={(next) => {
                    const game = visible[next]
                    if (!game) return
                    playUiSound("game_start")
                    setPlaying(game)
                  }}
                />
              </div>

              {/* Right Column: Selected game preview and details (Tablet/Desktop) */}
              <div className="hidden shrink-0 md:flex flex-col justify-center min-h-0 max-h-full">
                <GameDetailsPanel
                  game={selected}
                  onLaunch={launch}
                />
              </div>
            </div>
          ) : null}
        </main>

        <footer className="flex shrink-0 items-center justify-between gap-3 px-4 pb-5 sm:px-10">
          <div className="hidden flex-wrap items-center gap-3 text-sm text-muted-foreground sm:flex">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span className="text-[11px] text-muted-foreground/75">(D-Pad)</span>
              Navigate
            </span>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <span className="flex items-center gap-1">
              <Kbd>Enter</Kbd>
              <span className="text-[11px] text-muted-foreground/75">(A/✕)</span>
              Play
            </span>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <span className="text-xs text-muted-foreground/80">
              {visible.length} {visible.length === 1 ? "game" : "games"} available
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ControlsDialog
              open={controlsOpen}
              onOpenChange={setControlsOpen}
            />
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
      </motion.div>

      <AnimatePresence>
        {playing ? (
          <PlayerStage game={playing} onExit={() => setPlaying(null)} />
        ) : null}
      </AnimatePresence>

      {bootMounted ? (
        <BootScreen
          shaderReady={shaderReady}
          onReveal={revealShelf}
          onHidden={() => setBootMounted(false)}
        />
      ) : null}
    </div>
  )
}
