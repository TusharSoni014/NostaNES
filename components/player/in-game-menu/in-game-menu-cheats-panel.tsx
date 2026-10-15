"use client"

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { BanIcon, RotateCcwIcon, SearchIcon, Trash2Icon, UploadIcon, Wand2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { useCheatFileSearch, useCheatFileText, useGameCheatFiles, type CheatFileMatch } from "@/hooks/use-cheats"
import { matchSearchQuery } from "@/lib/cheats/match-cheat-files"
import { applyCheatSession } from "@/lib/cheats/apply-cheat-session"
import type { EmulatorCheatControls } from "@/lib/cheats/emulator-cheats"
import type { Game } from "@/lib/games"
import { getCheatSession, saveCheatSession, type StoredCheat, type StoredCheatSession } from "@/lib/storage/cheat-storage"
import { scrollNearestIntoView } from "@/lib/motion/scroll-into-view"
import { playUiSound } from "@/lib/ui-sounds"
import { cn } from "@/lib/utils"

type CheatRow = StoredCheat

type InGameMenuCheatsPanelProps = {
  game: Game
  cheats: EmulatorCheatControls
  isFocused?: boolean
  onCancel?: () => void
  onNavigateLeft?: () => void
}

const EMPTY_ROWS: CheatRow[] = []
const EMPTY_FILES: CheatFileMatch[] = []

function toRow(cheat: { code: string; description?: string; enabled?: boolean }, index: number): CheatRow {
  return {
    index,
    description: cheat.description?.trim() || `Cheat ${index + 1}`,
    code: cheat.code,
    enabled: Boolean(cheat.enabled),
  }
}

function fileTitle(name: string) {
  return name.replace(/\.cht$/i, "")
}

function fileRegion(name: string) {
  return name.match(/\(([^)]+)\)/)?.[1] ?? ""
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export const InGameMenuCheatsPanel = ({
  game,
  cheats,
  isFocused = false,
  onCancel,
  onNavigateLeft,
}: InGameMenuCheatsPanelProps) => {
  const [boundFile, setBoundFile] = useState(game.file)
  const [fileQuery, setFileQuery] = useState("")
  const [cheatQuery, setCheatQuery] = useState("")
  const [loadedName, setLoadedName] = useState(() => getCheatSession(game.file)?.fileName ?? "")
  const [loadedText, setLoadedText] = useState(() => getCheatSession(game.file)?.text ?? "")
  const [customFile, setCustomFile] = useState(() => Boolean(getCheatSession(game.file)?.custom))
  const [rows, setRows] = useState<CheatRow[]>(() => getCheatSession(game.file)?.rows ?? EMPTY_ROWS)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState("")
  const [actionError, setActionError] = useState("")
  const [selected, setSelected] = useState("")
  const loadSeq = useRef(0)
  const fetchCheatFile = useCheatFileText()

  if (boundFile !== game.file) {
    const next = getCheatSession(game.file)
    setBoundFile(game.file)
    setFileQuery("")
    setCheatQuery("")
    setLoadedName(next?.fileName ?? "")
    setLoadedText(next?.text ?? "")
    setCustomFile(Boolean(next?.custom))
    setRows(next?.rows ?? [])
    setActionError("")
    setSelected("")
  }

  const stored = boundFile === game.file ? null : getCheatSession(game.file)
  const viewName = boundFile === game.file ? loadedName : (stored?.fileName ?? "")
  const viewText = boundFile === game.file ? loadedText : (stored?.text ?? "")
  const viewCustom = boundFile === game.file ? customFile : Boolean(stored?.custom)
  const viewRows = boundFile === game.file ? rows : (stored?.rows ?? EMPTY_ROWS)
  const showingCheats = viewRows.length > 0
  const deferredFileQuery = useDeferredValue(fileQuery.trim())

  const filesQuery = useGameCheatFiles(game, !showingCheats)
  const files = filesQuery.data ?? EMPTY_FILES
  const localFiles = useMemo(() => {
    const query = fileQuery.trim()
    if (!query) return files
    return files.filter((file) => matchSearchQuery(file.name, query))
  }, [fileQuery, files])
  const wantsRepoSearch = !showingCheats && deferredFileQuery.length >= 2
  const searchQuery = useCheatFileSearch(deferredFileQuery, wantsRepoSearch)
  const repoReady = wantsRepoSearch && deferredFileQuery === fileQuery.trim() && searchQuery.isSuccess
  const visibleFiles = useMemo(() => {
    if (!fileQuery.trim()) return files
    if (repoReady && searchQuery.data) {
      const seen = new Set<string>()
      const merged: CheatFileMatch[] = []
      for (const file of localFiles) {
        if (!seen.has(file.name)) {
          seen.add(file.name)
          merged.push(file)
        }
      }
      for (const file of searchQuery.data) {
        if (!seen.has(file.name)) {
          seen.add(file.name)
          merged.push(file)
        }
      }
      return merged
    }
    return localFiles
  }, [fileQuery, files, localFiles, repoReady, searchQuery.data])

  const visibleCheats = useMemo(() => {
    const query = cheatQuery.trim().toLowerCase()
    if (!query) return viewRows
    return viewRows.filter((row) =>
      row.description.toLowerCase().includes(query) || row.code.toLowerCase().includes(query),
    )
  }, [cheatQuery, viewRows])

  const itemIds = useMemo(() => {
    if (showingCheats) {
      return [
        "disable",
        "remove",
        "reload",
        ...visibleCheats.map((row) => `cheat:${row.index}`),
      ]
    }
    return ["upload", ...visibleFiles.map((file) => `file:${file.name}`)]
  }, [showingCheats, visibleCheats, visibleFiles])

  const firstCheatId = visibleCheats[0] ? `cheat:${visibleCheats[0].index}` : ""
  const activeItem = itemIds.includes(selected)
    ? selected
    : (showingCheats && firstCheatId ? firstCheatId : (itemIds[0] ?? ""))

  const remember = useCallback((next: StoredCheatSession) => {
    saveCheatSession(game.file, next.fileName && next.rows.length > 0 ? next : null)
  }, [game.file])

  const installFile = useCallback(async (text: string, previous: CheatRow[]) => {
    const applied = await applyCheatSession(cheats, text, previous)
    if (!applied) return null
    return applied.map(toRow)
  }, [cheats])

  const runCheats = useCallback(async (
    name: string,
    readText: () => Promise<string>,
    previous: CheatRow[],
    custom: boolean,
  ) => {
    const seq = loadSeq.current + 1
    loadSeq.current = seq
    setBusy(name)
    setActionError("")
    try {
      const text = await readText()
      if (seq !== loadSeq.current) return
      const nextRows = await installFile(text, previous)
      if (seq !== loadSeq.current) return
      if (!nextRows) throw new Error("This game could not apply those cheats")
      if (nextRows.length === 0) setActionError("That file has no cheats this emulator can run.")
      const keep = nextRows.length > 0
      setLoadedName(keep ? name : "")
      setLoadedText(keep ? text : "")
      setRows(nextRows)
      setCustomFile(keep && custom)
      setCheatQuery("")
      remember({ fileName: keep ? name : "", text: keep ? text : "", rows: nextRows, custom: keep && custom })
      setSelected(nextRows[0] ? `cheat:${nextRows[0].index}` : "upload")
      if (keep) playUiSound("game_start")
    } catch (error) {
      setActionError(errorMessage(error, "Could not load cheats"))
      playUiSound("error")
    } finally {
      if (seq === loadSeq.current) setBusy("")
    }
  }, [installFile, remember])

  const loadFile = useCallback((name: string, previous: CheatRow[], fresh = false) => {
    return runCheats(name, () => fetchCheatFile(name, fresh), previous, false)
  }, [fetchCheatFile, runCheats])

  const uploadCheatFile = useCallback((file: File) => {
    const name = file.name.split(/[/\\]/).pop() ?? ""
    if (!name.toLowerCase().endsWith(".cht")) {
      setActionError("Choose a .cht cheat file.")
      playUiSound("error")
      return
    }
    if (file.size > 1024 * 1024) {
      setActionError("That cheat file is too large.")
      playUiSound("error")
      return
    }
    void runCheats(name, () => file.text(), [], true)
  }, [runCheats])

  const openUpload = useCallback(() => {
    if (busy) return
    const input = uploadRef.current
    if (!input) return
    input.value = ""
    input.click()
  }, [busy])

  const toggleCheat = useCallback(async (index: number) => {
    if (busy) return
    const current = viewRows.find((row) => row.index === index)
    if (!current) return
    const enabled = !current.enabled
    const applied = cheats.getCheats()
    let next = viewRows.map((row) => (row.index === index ? { ...row, enabled } : row))
    let ok = applied.length === viewRows.length && (enabled ? cheats.enableCheat(index) : cheats.disableCheat(index))
    if (!ok && viewText) {
      const reloaded = await installFile(viewText, next)
      if (reloaded) next = reloaded
      ok = Boolean(reloaded)
    }
    if (!ok) {
      setActionError("Could not update that cheat")
      playUiSound("error")
      return
    }
    setActionError("")
    setRows(next)
    remember({ fileName: viewName, text: viewText, rows: next, custom: viewCustom })
    playUiSound("option_selected")
  }, [busy, cheats, installFile, remember, viewCustom, viewName, viewRows, viewText])

  const disableAll = useCallback(async () => {
    if (!viewRows.length || busy) return
    const applied = cheats.getCheats()
    if (applied.length === viewRows.length) {
      for (const row of viewRows) {
        if (row.enabled) cheats.disableCheat(row.index)
      }
    } else if (viewText) {
      const reloaded = await installFile(viewText, [])
      if (!reloaded) {
        setActionError("Could not disable cheats")
        playUiSound("error")
        return
      }
      setRows(reloaded)
      remember({ fileName: viewName, text: viewText, rows: reloaded, custom: viewCustom })
      playUiSound("navigation")
      return
    }
    const next = viewRows.map((row) => ({ ...row, enabled: false }))
    setRows(next)
    remember({ fileName: viewName, text: viewText, rows: next, custom: viewCustom })
    setActionError("")
    playUiSound("navigation")
  }, [busy, cheats, installFile, remember, viewCustom, viewName, viewRows, viewText])

  const removeAll = useCallback(() => {
    if (busy) return
    cheats.clearCheats()
    setRows([])
    setLoadedName("")
    setLoadedText("")
    setCustomFile(false)
    setCheatQuery("")
    remember({ fileName: "", text: "", rows: [] })
    setActionError("")
    setSelected("")
    playUiSound("back_cancel")
  }, [busy, cheats, remember])

  const reloadFile = useCallback(() => {
    if (!viewName || busy) return
    if (viewCustom && viewText) {
      void runCheats(viewName, async () => viewText, viewRows, true)
      return
    }
    void loadFile(viewName, viewRows, true)
  }, [busy, loadFile, runCheats, viewCustom, viewName, viewRows, viewText])

  useMenuNavigation<string>({
    enabled: isFocused,
    items: itemIds.length > 0 ? itemIds : [""],
    activeItem,
    onSelect: (item) => setSelected(item),
    onConfirm: (item) => {
      if (item === "upload") openUpload()
      else if (item.startsWith("file:")) {
        const name = item.slice(5)
        void loadFile(name, name === viewName ? viewRows : [])
      }
      else if (item.startsWith("cheat:")) void toggleCheat(Number(item.slice(6)))
      else if (item === "disable") void disableAll()
      else if (item === "remove") removeAll()
      else if (item === "reload") reloadFile()
    },
    onCancel,
    onNavigateLeft,
  })

  useEffect(() => {
    if (!isFocused || !activeItem) return
    const node = document.querySelector(`[data-cheat-row="${CSS.escape(activeItem)}"]`)
    if (!(node instanceof HTMLElement)) return
    return scrollNearestIntoView(node)
  }, [activeItem, isFocused])

  const enabledCount = viewRows.filter((row) => row.enabled).length
  const showingSimilar = !repoReady && visibleFiles.length > 0 && visibleFiles.every((file) => file.similar)
  const filesError = filesQuery.isError ? errorMessage(filesQuery.error, "Could not look up cheat files") : ""
  const regionLabel = game.region && game.region !== "NES" ? game.region : "Unknown region"

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full min-w-0 gap-3 select-none">
      <div className="shrink-0 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Wand2Icon className="size-4 text-blue-400" />
            Cheats
          </h3>
          <span className="rounded-full border border-blue-300/40 bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-100">
            {regionLabel}
          </span>
          {showingCheats ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/80">
              <span className={enabledCount > 0 ? "font-semibold text-emerald-400" : "text-white/60"}>
                {enabledCount}
              </span>
              <span className="mx-1 text-white/30">/</span>
              <span>{viewRows.length} active</span>
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-white/70">
          Running {game.title} · {regionLabel}
        </p>
        <p className="truncate font-mono text-[10px] text-white/40">{game.file}</p>
      </div>

      {showingCheats ? (
        <CheatCodes
          fileName={viewName}
          enabledCount={enabledCount}
          totalCount={viewRows.length}
          busy={busy}
          isFocused={isFocused}
          activeItem={activeItem}
          actionError={actionError}
          cheatQuery={cheatQuery}
          visibleCheats={visibleCheats}
          onCheatQuery={setCheatQuery}
          onToggle={(index) => void toggleCheat(index)}
          onDisable={() => void disableAll()}
          onRemove={removeAll}
          onReload={reloadFile}
        />
      ) : (
        <CheatFiles
          files={visibleFiles}
          loading={filesQuery.isPending}
          searching={wantsRepoSearch && !repoReady}
          error={filesError || (wantsRepoSearch && searchQuery.isError ? errorMessage(searchQuery.error, "Could not search cheat files") : "")}
          actionError={actionError}
          showingSimilar={showingSimilar}
          repoResults={repoReady}
          fileQuery={fileQuery}
          loadedName={viewName}
          busy={busy}
          isFocused={isFocused}
          activeItem={activeItem}
          onFileQuery={setFileQuery}
          onOpen={(name) => void loadFile(name, name === viewName ? viewRows : [])}
          onUpload={openUpload}
          uploading={Boolean(busy) && !visibleFiles.some((file) => file.name === busy)}
        />
      )}
      <input
        ref={uploadRef}
        type="file"
        accept=".cht"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.currentTarget.blur()
          if (file) uploadCheatFile(file)
        }}
      />
    </div>
  )
}

function CheatFiles({
  files,
  loading,
  searching,
  error,
  actionError,
  showingSimilar,
  repoResults,
  fileQuery,
  loadedName,
  busy,
  isFocused,
  activeItem,
  onFileQuery,
  onOpen,
  onUpload,
  uploading,
}: {
  files: CheatFileMatch[]
  loading: boolean
  searching: boolean
  error: string
  actionError: string
  showingSimilar: boolean
  repoResults: boolean
  fileQuery: string
  loadedName: string
  busy: string
  isFocused: boolean
  activeItem: string
  onFileQuery: (value: string) => void
  onOpen: (name: string) => void
  onUpload: () => void
  uploading: boolean
}) {
  const uploadSelected = isFocused && activeItem === "upload"

  return (
    <>
      <button
        type="button"
        data-cheat-row="upload"
        onClick={onUpload}
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors duration-200",
          uploadSelected
            ? "border-blue-400 bg-blue-600/20"
            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <UploadIcon className="size-3.5 shrink-0 text-blue-300" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium text-white">Upload .cht file</span>
            <span className="block text-[11px] text-white/45">Custom cheat file for this game</span>
          </span>
        </span>
        <span className="shrink-0 text-[11px] font-semibold text-blue-300">
          {uploading ? "Loading..." : "Upload"}
        </span>
      </button>
      <label className="shrink-0 relative block">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
        <Input
          value={fileQuery}
          onChange={(event) => onFileQuery(event.target.value)}
          placeholder="Search cheat files"
          aria-label="Search cheat files"
          className="h-8 border-white/15 bg-white/5 pl-8 text-xs text-white placeholder:text-white/40"
        />
      </label>
      {actionError ? <p className="shrink-0 text-xs text-red-300">{actionError}</p> : null}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <p className="px-1 text-xs text-white/50">Looking up cheat files...</p>
        ) : error ? (
          <p className="px-1 text-xs text-red-300">{error}</p>
        ) : searching ? (
          <p className="px-1 text-xs text-white/50">Searching the cheat database...</p>
        ) : files.length === 0 ? (
          <p className="px-1 text-xs text-white/50">No cheat files match this game.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {showingSimilar ? (
              <p className="px-1 text-[11px] text-amber-200/80">Showing similar cheat file names.</p>
            ) : null}
            {repoResults ? (
              <p className="px-1 text-[11px] text-white/45">Results from the full cheat database.</p>
            ) : null}
            {files.map((file) => {
              const id = `file:${file.name}`
              const isSelected = isFocused && activeItem === id
              const region = fileRegion(file.name)
              return (
                <button
                  key={file.name}
                  type="button"
                  data-cheat-row={id}
                  onClick={() => onOpen(file.name)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors duration-200",
                    isSelected
                      ? "border-blue-400 bg-blue-600/20"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-white">{fileTitle(file.name)}</span>
                    <span className="block text-[11px] text-white/45">
                      {file.exactFile ? "Matches this ROM" : file.similar ? "Related game" : "Cheat file"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {region ? (
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/70">
                        {region}
                      </span>
                    ) : null}
                    <span className="text-[11px] font-semibold text-blue-300">
                      {busy === file.name ? "Loading..." : loadedName === file.name ? "Loaded" : "Load"}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function CheatCodes({
  fileName,
  enabledCount,
  totalCount,
  busy,
  isFocused,
  activeItem,
  actionError,
  cheatQuery,
  visibleCheats,
  onCheatQuery,
  onToggle,
  onDisable,
  onRemove,
  onReload,
}: {
  fileName: string
  enabledCount: number
  totalCount: number
  busy: string
  isFocused: boolean
  activeItem: string
  actionError: string
  cheatQuery: string
  visibleCheats: CheatRow[]
  onCheatQuery: (value: string) => void
  onToggle: (index: number) => void
  onDisable: () => void
  onRemove: () => void
  onReload: () => void
}) {
  const locked = Boolean(busy)

  return (
    <>
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1">
          <span className="block truncate font-semibold text-xs text-white">
            {fileTitle(fileName)}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                enabledCount > 0
                  ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border border-white/10 bg-white/5 text-white/50",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  enabledCount > 0 ? "bg-emerald-400 animate-pulse" : "bg-white/30",
                )}
              />
              <span>{enabledCount} activated</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
              <span className="font-semibold text-white">{totalCount}</span> available
            </span>
            {cheatQuery.trim() && visibleCheats.length !== totalCount ? (
              <span className="text-[11px] text-white/40">
                ({visibleCheats.length} matching search)
              </span>
            ) : null}
            {busy ? (
              <span className="text-[11px] text-blue-300 animate-pulse">
                Loading...
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-cheat-row="disable"
            disabled={locked}
            onClick={onDisable}
            className={cn("h-7 gap-1.5 text-xs", isFocused && activeItem === "disable" && "ring-2 ring-blue-400")}
          >
            <BanIcon className="size-3.5" />
            Disable all
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-cheat-row="remove"
            disabled={locked}
            onClick={onRemove}
            className={cn("h-7 gap-1.5 text-xs", isFocused && activeItem === "remove" && "ring-2 ring-blue-400")}
          >
            <Trash2Icon className="size-3.5" />
            Remove all
          </Button>
          <Button
            type="button"
            size="sm"
            data-cheat-row="reload"
            disabled={locked}
            onClick={onReload}
            className={cn(
              "h-7 gap-1.5 bg-blue-600 text-xs text-white hover:bg-blue-500",
              isFocused && activeItem === "reload" && "ring-2 ring-blue-300",
            )}
          >
            <RotateCcwIcon className="size-3.5" />
            Load again
          </Button>
        </div>
      </div>

      <label className="shrink-0 relative block">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
        <Input
          value={cheatQuery}
          onChange={(event) => onCheatQuery(event.target.value)}
          placeholder="Search cheats"
          aria-label="Search cheats"
          className="h-8 border-white/15 bg-white/5 pl-8 text-xs text-white placeholder:text-white/40"
        />
      </label>
      {actionError ? <p className="shrink-0 text-xs text-red-300">{actionError}</p> : null}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {visibleCheats.length === 0 ? (
          <p className="px-1 text-xs text-white/50">No cheats match that search.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {visibleCheats.map((row) => {
              const id = `cheat:${row.index}`
              const isSelected = isFocused && activeItem === id
              return (
                <div
                  key={id}
                  data-cheat-row={id}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("[data-slot=switch]")) return
                    onToggle(row.index)
                  }}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors duration-200",
                    isSelected
                      ? "border-blue-400 bg-blue-600/20"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-white">{row.description}</span>
                    <span className="block truncate font-mono text-[10px] text-white/40">{row.code}</span>
                  </span>
                  <Switch
                    checked={row.enabled}
                    disabled={locked}
                    aria-label={row.description}
                    onCheckedChange={() => onToggle(row.index)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
