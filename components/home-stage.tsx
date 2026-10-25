"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FolderOpenIcon,
  Gamepad2Icon,
  HeartIcon,
  PlayIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { BootScreen } from "@/components/boot-screen";
import { Clock } from "@/components/clock";
import { ControlsDialog } from "@/components/controls-dialog";
import { GameHub } from "@/components/game-hub/game-hub";
import { GameList } from "@/components/game-list";
import { GameListSkeleton } from "@/components/game-list-skeleton";
import { GamepadStatusIndicator } from "@/components/gamepad-status-indicator";
import { PlayerStage } from "@/components/player-stage";
import { useShelfNavigation } from "@/components/use-shelf-navigation";
import { WaveField } from "@/components/wave-field";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd, GamepadKey } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "motion/react";
import { useLibrary } from "@/hooks/use-library";
import { useInputMode } from "@/hooks/use-input-mode";
import { useFavorites } from "@/hooks/use-favorites";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useGamepadStatus } from "@/hooks/use-gamepad-status";
import { enableUiSounds, playUiSound } from "@/lib/ui-sounds";
import {
  type Game,
  type GameGroup,
  groupGames,
  parseRomFile,
} from "@/lib/games";
import { GameInfoDrawer } from "@/components/game-info-drawer";
import { VersionSelectDialog } from "@/components/version-select-dialog";
import { requestAppFullscreen } from "@/lib/display/fullscreen";
import { cn } from "@/lib/utils";

function isGameGroup(game: Game | GameGroup): game is GameGroup {
  return "versions" in game && Array.isArray((game as GameGroup).versions);
}

export type HomeStageProps = {
  initialGames?: Game[];
};

export function HomeStage({ initialGames }: HomeStageProps = {}) {
  const isMobile = useIsMobile();
  const { connected: gamepadConnected } = useGamepadStatus();
  const inputMode = useInputMode();
  const { isFavorite, favoritesCount } = useFavorites();
  const library = useLibrary(initialGames);
  const games = library.data ?? null;
  const failed = library.isError && !library.isFetching;
  const [customGames, setCustomGames] = useState<Game[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const [playing, setPlaying] = useState<{ game: Game; slot?: number } | null>(null);
  const [shaderReady, setShaderReady] = useState(false);
  const [presented, setPresented] = useState(false);
  const [bootMounted, setBootMounted] = useState(true);
  const [entrance, setEntrance] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [versionSelectGroup, setVersionSelectGroup] =
    useState<GameGroup | null>(null);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [shaderPaused, setShaderPaused] = useState(false);

  const handleLoadRomFile = useCallback((file: File) => {
    const name = file.name;
    const isNes = name.toLowerCase().endsWith(".nes");
    const isZip = name.toLowerCase().endsWith(".zip");

    if (!isNes && !isZip) {
      setLoadError("Please select a valid NES ROM file (.nes or .zip)");
      playUiSound("error");
      return;
    }

    setLoadError(null);
    const parsed = parseRomFile(name);
    const customGame: Game = {
      ...parsed,
      id: `custom-${Date.now()}-${name}`,
      file: name,
      tags: [...parsed.tags, "Local ROM"],
      customRom: file,
    };

    setCustomGames((prev) => {
      const filtered = prev.filter((g) => g.file !== name);
      return [customGame, ...filtered];
    });

    playUiSound("game_start");
    void requestAppFullscreen(document.documentElement);
    setPlaying({ game: customGame });
  }, []);

  useEffect(() => {
    if (!loadError) return;
    const timer = window.setTimeout(() => setLoadError(null), 4000);
    return () => window.clearTimeout(timer);
  }, [loadError]);

  useEffect(() => {
    if (failed) playUiSound("error");
  }, [failed]);

  useEffect(() => {
    const id = window.setTimeout(() => setShaderReady(true), 2500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!presented) return;
    const trimmed = query.trim();
    if (!trimmed) return;
    const id = window.setTimeout(() => playUiSound("navigation"), 450);
    return () => window.clearTimeout(id);
  }, [presented, query]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setShaderPaused(true), 300);
    return () => window.clearTimeout(timer);
  }, [playing]);

  const allGames = useMemo(() => {
    if (!games) return customGames.length > 0 ? customGames : null;
    return [...customGames, ...games];
  }, [customGames, games]);

  const groupedGames = useMemo(() => {
    if (!allGames) return null;
    return groupGames(allGames);
  }, [allGames]);

  const regions = useMemo(() => {
    const found = new Set<string>();
    for (const group of groupedGames ?? []) {
      for (const r of group.regions) found.add(r);
    }
    return ["All", ...[...found].sort()];
  }, [groupedGames]);

  const visible = useMemo(() => {
    if (!groupedGames) return [];
    const needle = query.trim().toLowerCase();
    return groupedGames.filter((group) => {
      if (favoritesOnly && !isFavorite(group)) return false;
      const regionMatches = region === "All" || group.regions.includes(region);
      const versionFiles = group.versions
        .map((v) => `${v.file} ${v.tags.join(" ")}`)
        .join(" ");
      const text =
        `${group.title} ${group.tags.join(" ")} ${versionFiles}`.toLowerCase();
      return regionMatches && (needle.length === 0 || text.includes(needle));
    });
  }, [groupedGames, query, region, favoritesOnly, isFavorite]);

  const count = visible.length;
  const selected = visible[index] ?? null;

  const move = useCallback(
    (direction: -1 | 1) => {
      const current = indexRef.current;
      const next = current + direction;
      if (next < 0 || next > count - 1) return;
      indexRef.current = next;
      setIndex(next);
      playUiSound("navigation");
    },
    [count],
  );

  const jump = useCallback(
    (step: number) => {
      const current = indexRef.current;
      const next = Math.max(0, Math.min(count - 1, current + step));
      if (next === current) return;
      indexRef.current = next;
      setIndex(next);
      playUiSound("navigation");
    },
    [count],
  );

  const launch = useCallback(
    (targetIndex?: number, specificGame?: Game, slot?: number) => {
      const target =
        specificGame ??
        (targetIndex !== undefined ? visible[targetIndex] : selected);
      if (!target) return;

      if (!specificGame && isGameGroup(target) && target.versions.length > 1 && slot === undefined) {
        playUiSound("option_selected");
        setVersionSelectGroup(target);
        return;
      }

      playUiSound("game_start");
      void requestAppFullscreen(document.documentElement);
      const gameToPlay = isGameGroup(target) ? (target.versions[0] ?? target) : target;
      setPlaying({ game: specificGame ?? gameToPlay, slot });
    },
    [visible, selected],
  );

  const revealShelf = useCallback(() => {
    enableUiSounds();
    setPresented(true);
  }, []);

  const toggleControls = useCallback(() => {
    setControlsOpen((prev) => !prev);
  }, []);

  // Hook handles Keyboard, Gamepad (Xbox/PlayStation/generic), and mouse wheel
  useShelfNavigation({
    count,
    isPlaying: Boolean(playing) || !presented,
    controlsOpen:
      controlsOpen || Boolean(versionSelectGroup) || infoDrawerOpen,
    move,
    jump,
    launch,
    onToggleControls: toggleControls,
  });

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleLoadRomFile(file);
      }}
      className="relative flex h-dvh flex-col overflow-hidden outline-none"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".nes,.zip,application/zip,application/x-zip-compressed"
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLoadRomFile(file);
          e.target.value = "";
        }}
      />

      <AnimatePresence>
        {isDragging ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md border-2 border-dashed border-primary/50 m-4 sm:m-8 rounded-3xl pointer-events-none select-none shadow-2xl"
          >
            <FolderOpenIcon className="size-14 text-primary animate-bounce mb-3" />
            <p className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              Drop your NES ROM here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .nes and .zip files • Temporary local play
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <WaveField
        shift={count === 0 ? 0 : (index % 4) / 3}
        paused={shaderPaused}
        onReady={() => setShaderReady(true)}
      />

      {/* Console Transition Foundation:
          Prevents WebGL shader light burst during game launch, version selection, and exit.
          Holds a dark console base behind the crossfading layers so background waves never bleed through. */}
      <motion.div
        initial={false}
        animate={{
          opacity: playing ? 1 : 0,
        }}
        transition={{
          duration: playing ? 0.25 : 0.45,
          delay: playing ? 0 : 0.15,
          ease: "easeOut",
        }}
        className="pointer-events-none fixed inset-0 z-10 bg-[#020712]"
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
          if (presented) setEntrance(false);
        }}
        aria-hidden={!presented}
        className={cn(
          "relative z-20 flex min-h-0 flex-1 origin-center flex-col",
          playing
            ? "pointer-events-none"
            : "will-change-[opacity,transform]",
          playing && isMobile && "[content-visibility:hidden]",
          !presented && "pointer-events-none",
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 px-3 pt-3 pb-1 sm:gap-4 sm:px-10 sm:pt-6 sm:pb-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Image
              src="/nostanes.png"
              alt="NostaNES"
              width={40}
              height={40}
              priority
              className="h-8 w-auto sm:h-10 object-contain shrink-0 select-none"
            />
            <div className="flex flex-col">
              <p className="text-sm sm:text-base font-semibold tracking-wide leading-tight">NostaNES</p>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Nintendo Entertainment System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <GamepadStatusIndicator />
            <div className="hidden sm:block">
              <Clock />
            </div>
          </div>
        </header>

        <div className="flex shrink-0 flex-col gap-2 px-3 pt-2 sm:gap-3 sm:px-10 sm:pt-4 z-20">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <Field className="max-w-sm flex-1">
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
                    setQuery(event.target.value);
                    indexRef.current = 0;
                    setIndex(0);
                  }}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
                {query.length > 0 ? (
                  <InputGroupAddon align="inline-end">
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => {
                        setQuery("");
                        indexRef.current = 0;
                        setIndex(0);
                        playUiSound("navigation");
                      }}
                      className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
            </Field>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-medium border-border/80 bg-foreground/[0.03] hover:bg-foreground/[0.08] shadow-xs cursor-pointer shrink-0"
              title="Load Local ROM"
            >
              <FolderOpenIcon className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Load Local ROM</span>
              <span className="sm:hidden">Load ROM</span>
            </Button>
          </div>

          <AnimatePresence>
            {loadError ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive select-none"
              >
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={() => setLoadError(null)}
                  className="font-semibold underline hover:opacity-80 cursor-pointer"
                >
                  Dismiss
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex items-center gap-1.5 max-w-full overflow-x-auto no-scrollbar scroll-smooth flex-nowrap py-0.5 [touch-action:pan-x] [-webkit-overflow-scrolling:touch]">
            <Button
              variant={favoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFavoritesOnly((prev) => !prev);
                indexRef.current = 0;
                setIndex(0);
                playUiSound("option_selected");
              }}
              className={cn(
                "h-7 sm:h-8 gap-1.5 px-2.5 sm:px-3 text-xs font-semibold shrink-0 transition-all duration-200 cursor-pointer border",
                favoritesOnly
                  ? "border-rose-500 bg-rose-600 text-white shadow-[0_0_18px_rgba(244,63,94,0.4)] hover:bg-rose-500"
                  : "border-white/10 bg-white/[0.04] text-white/75 hover:border-white/20 hover:text-white hover:bg-white/[0.08]",
              )}
            >
              <HeartIcon
                className={cn(
                  "size-3.5 transition-colors",
                  favoritesOnly ? "fill-current text-white" : "text-rose-400",
                )}
              />
              <span>Favorites</span>
              {favoritesCount > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none",
                    favoritesOnly
                      ? "bg-white/25 text-white"
                      : "bg-white/10 text-white/70",
                  )}
                >
                  {favoritesCount}
                </span>
              ) : null}
            </Button>

            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={1}
              value={[region]}
              onValueChange={(next) => {
                const value = next.at(-1) ?? "All";
                if (value === region) return;
                setRegion(value);
                indexRef.current = 0;
                setIndex(0);
                playUiSound("navigation");
              }}
              className="flex-nowrap shrink-0"
            >
              {regions.map((item) => (
                <ToggleGroupItem
                  key={item}
                  value={item}
                  className="shrink-0 h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-medium"
                >
                  {item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden py-3">
          <AnimatePresence mode="wait">
            {failed && (!allGames || allGames.length === 0) ? (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="my-auto px-6 pb-16"
              >
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Gamepad2Icon />
                    </EmptyMedia>
                    <EmptyTitle>The library did not load</EmptyTitle>
                    <EmptyDescription>
                      Could not fetch cartridges from the server. You can still
                      load and play local ROMs.
                    </EmptyDescription>
                  </EmptyHeader>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        void library.refetch();
                      }}
                    >
                      Retry
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 cursor-pointer"
                    >
                      <FolderOpenIcon className="size-4" />
                      Load Local ROM
                    </Button>
                  </div>
                </Empty>
              </motion.div>
            ) : allGames === null ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex min-h-0 flex-1 overflow-hidden"
              >
                <GameListSkeleton />
              </motion.div>
            ) : allGames.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="my-auto px-6 pb-16"
              >
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Gamepad2Icon />
                    </EmptyMedia>
                    <EmptyTitle>No cartridges yet</EmptyTitle>
                    <EmptyDescription>
                      Upload NES ROM files to the R2 bucket or load your own ROM
                      locally to play immediately.
                    </EmptyDescription>
                  </EmptyHeader>
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 cursor-pointer"
                    >
                      <FolderOpenIcon className="size-4" />
                      Load Local ROM
                    </Button>
                  </div>
                </Empty>
              </motion.div>
            ) : visible.length === 0 ? (
              <motion.div
                key={favoritesOnly ? "no-favorites" : "no-matches"}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="my-auto px-6 pb-16"
              >
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      {favoritesOnly ? (
                        <HeartIcon className="text-rose-400 fill-rose-500/20" />
                      ) : (
                        <SearchIcon />
                      )}
                    </EmptyMedia>
                    <EmptyTitle>
                      {favoritesOnly
                        ? "No favorite cartridges"
                        : "Nothing matches"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {favoritesOnly
                        ? "You haven't added any cartridges to your favorites yet. Click the heart on any cartridge to pin it here."
                        : "Try another title or clear the region filter."}
                    </EmptyDescription>
                  </EmptyHeader>
                  {favoritesOnly ? (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFavoritesOnly(false);
                          playUiSound("navigation");
                        }}
                        className="gap-2"
                      >
                        Show All Cartridges
                      </Button>
                    </div>
                  ) : null}
                </Empty>
              </motion.div>
            ) : selected ? (
              <motion.div
                key="games-list"
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex min-h-0 flex-1 flex-col md:flex-row gap-6 lg:gap-8 overflow-hidden px-3 sm:px-8"
              >
                {/* Left Column: Scrollable list of games */}
                <div className="flex min-h-0 flex-1 flex-col">
                  <GameList
                    games={visible}
                    selectedIndex={index}
                    onSelectIndex={(next) => {
                      if (next === indexRef.current) return;
                      indexRef.current = next;
                      setIndex(next);
                      playUiSound("navigation");
                    }}
                    onOpenDetails={(next) => {
                      indexRef.current = next;
                      setIndex(next);
                      setInfoDrawerOpen(true);
                    }}
                    onLaunch={(next) => {
                      if (isMobile && !gamepadConnected) {
                        if (next !== undefined) {
                          indexRef.current = next;
                          setIndex(next);
                        }
                        setInfoDrawerOpen(true);
                      } else {
                        launch(next);
                      }
                    }}
                    isMobile={isMobile}
                    gamepadConnected={gamepadConnected}
                  />
                </div>

                {/* Right Column: Interactive Game Hub (Desktop/Large screens only, hidden on mobile) */}
                {!isMobile ? (
                  <div className="hidden shrink-0 lg:flex flex-col h-full min-h-0">
                    <GameHub
                      game={selected}
                      onLaunch={(ver, slot) => launch(undefined, ver, slot)}
                    />
                  </div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>

        <footer className="flex shrink-0 items-center justify-between gap-3 px-4 pb-5 sm:px-10">
          <div className="hidden flex-wrap items-center gap-3 text-sm text-muted-foreground sm:flex">
            {inputMode === "gamepad" ? (
              <>
                <span className="flex items-center gap-1.5">
                  <GamepadKey button="D-Pad" size="sm" />
                  <span className="text-xs font-medium text-foreground/80">
                    Navigate
                  </span>
                </span>
                <Separator
                  orientation="vertical"
                  className="hidden h-4 sm:block"
                />
                <span className="flex items-center gap-1.5">
                  <GamepadKey button="A" size="sm" />
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <GamepadKey button="Start" size="sm" />
                  <span className="text-xs font-medium text-foreground/80">
                    Play
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1">
                    <Kbd size="sm">↑</Kbd>
                    <Kbd size="sm">↓</Kbd>
                  </span>
                  <span className="text-xs font-medium text-foreground/80">
                    Navigate
                  </span>
                </span>
                <Separator
                  orientation="vertical"
                  className="hidden h-4 sm:block"
                />
                <span className="flex items-center gap-1.5">
                  <Kbd size="sm">Enter</Kbd>
                  <span className="text-xs font-medium text-foreground/80">
                    Play
                  </span>
                </span>
              </>
            )}
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <span className="text-xs text-muted-foreground/80">
              {allGames === null
                ? "Reading cartridges..."
                : favoritesOnly
                  ? `${visible.length} ${visible.length === 1 ? "favorite cartridge" : "favorite cartridges"}`
                  : `${visible.length} ${visible.length === 1 ? "game" : "games"} available`}
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
                  <Button
                    size="lg"
                    disabled={!selected || allGames === null}
                    onClick={() => {
                      if (isMobile && !gamepadConnected) {
                        setInfoDrawerOpen(true);
                      } else {
                        launch();
                      }
                    }}
                  />
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

      <GameInfoDrawer
        game={selected}
        open={infoDrawerOpen && Boolean(selected)}
        onOpenChange={setInfoDrawerOpen}
        onPlay={(chosenGame, slot) => {
          setInfoDrawerOpen(false);
          playUiSound("game_start");
          void requestAppFullscreen(document.documentElement);
          setPlaying({ game: chosenGame, slot });
        }}
      />

      <VersionSelectDialog
        group={versionSelectGroup}
        open={Boolean(versionSelectGroup)}
        onOpenChange={(openState) => {
          if (!openState) setVersionSelectGroup(null);
        }}
        onSelectVersion={(version) => {
          setVersionSelectGroup(null);
          playUiSound("game_start");
          void requestAppFullscreen(document.documentElement);
          setPlaying({ game: version });
        }}
      />

      <AnimatePresence>
        {playing ? (
          <PlayerStage
            key={(playing.game.id || playing.game.file) + (playing.slot !== undefined ? `_slot${playing.slot}` : "")}
            game={playing.game}
            initialSlot={playing.slot}
            onExit={() => {
              setPlaying(null);
              setShaderPaused(false);
            }}
          />
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
  );
}
