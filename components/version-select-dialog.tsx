"use client"

import { useEffect, useRef, useState } from "react"
import { CheckIcon, PlayIcon } from "lucide-react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { cn } from "@/lib/utils"
import { scrollNearestIntoView } from "@/lib/motion/scroll-into-view"
import { playUiSound } from "@/lib/ui-sounds"
import type { Game, GameGroup } from "@/lib/games"

export type VersionSelectDialogProps = {
  group: GameGroup | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectVersion: (version: Game) => void
}

export function VersionSelectDialog({
  group,
  open,
  onOpenChange,
  onSelectVersion,
}: VersionSelectDialogProps) {
  // Preserve last group during close transition so modal animates out cleanly
  const [cachedGroup, setCachedGroup] = useState<GameGroup | null>(group)
  if (group && group !== cachedGroup) setCachedGroup(group)
  const activeGroup = group ?? cachedGroup

  const versions = activeGroup?.versions ?? []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const listboxRef = useRef<HTMLDivElement>(null)
  const [isLaunching, setIsLaunching] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setIsLaunching(false)
      setSelectedId(group?.versions[0]?.id ?? null)
    }
  }

  useEffect(() => {
    if (open) {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      listboxRef.current?.focus()
    }
  }, [open])

  const selected = (selectedId ? versions.find((v) => v.id === selectedId) : null) ?? versions[0] ?? null

  const dismiss = () => {
    playUiSound("back_cancel")
    onOpenChange(false)
  }

  const handleConfirm = (version: Game) => {
    playUiSound("game_start")
    setIsLaunching(true)
    onOpenChange(false)
    onSelectVersion(version)
  }

  useMenuNavigation({
    enabled: open && Boolean(activeGroup) && versions.length > 0,
    items: versions,
    activeItem: selected,
    onSelect: (ver, idx) => {
      setSelectedId(ver.id)
      const row = itemRefs.current[idx]
      if (row) scrollNearestIntoView(row)
    },
    onConfirm: (ver) => { if (ver) handleConfirm(ver) },
    onCancel: dismiss,
  })

  if (!activeGroup && !open) return null
  if (!activeGroup) return null

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      exitToBlack={isLaunching}
      title={
        <div className="flex items-center justify-between gap-3 pr-2">
          <span className="truncate text-base sm:text-lg font-bold text-white tracking-tight">{activeGroup.title}</span>
          <span className="text-xs text-white/50 font-normal shrink-0">{versions.length} versions</span>
        </div>
      }
      description="Choose a release version to play"
      className="max-w-md"
      footer={
        <div className="flex w-full items-center justify-between gap-2 select-none">
          <Button variant="ghost" size="sm" onClick={dismiss} className="text-xs text-white/60 hover:text-white gap-1">
            Cancel <Kbd className="text-[10px] bg-white/10">Esc / B</Kbd>
          </Button>

          <Button
            size="sm"
            disabled={!selected}
            onClick={() => selected && handleConfirm(selected)}
            className="gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md"
          >
            <PlayIcon className="size-3.5 fill-current" />
            Play Version
            <Kbd className="text-[10px] bg-black/40 text-white">Enter / A</Kbd>
          </Button>
        </div>
      }
    >
      <div
        ref={listboxRef}
        tabIndex={0}
        role="listbox"
        aria-label="Available editions"
        onKeyDown={(e) => {
          if (e.key === "Enter" && selected) {
            e.preventDefault()
            e.stopPropagation()
            handleConfirm(selected)
          }
        }}
        className="flex max-h-[46vh] flex-col gap-2 overflow-y-auto p-1 focus:outline-none [scrollbar-gutter:stable]"
      >
        {versions.map((ver, idx) => {
          const isCurrent = selected?.id === ver.id
          return (
            <div
              key={ver.id}
              tabIndex={-1}
              ref={(el) => { itemRefs.current[idx] = el }}
              role="option"
              aria-selected={isCurrent}
              onClick={() => {
                setSelectedId(ver.id)
                playUiSound("option_selected")
              }}
              onDoubleClick={() => handleConfirm(ver)}
              className={cn(
                "group relative flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 select-none transition-colors duration-150",
                isCurrent
                  ? "border-blue-500/80 bg-blue-600/15 text-white ring-1 ring-blue-500/50 shadow-[0_0_16px_rgba(59,130,246,0.15)]"
                  : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] py-0 px-2 font-semibold transition-colors",
                      isCurrent
                        ? "bg-blue-500 text-white border-blue-400"
                        : "border-white/15 bg-white/5 text-white/80",
                    )}
                  >
                    {ver.region}
                  </Badge>
                  {ver.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-mono",
                        isCurrent ? "bg-blue-400/20 text-blue-200" : "bg-white/5 text-white/50",
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                  {ver.year ? <span className="text-[11px] text-white/40">{ver.year}</span> : null}
                </div>
                <p className="truncate font-mono text-[11px] text-white/40 group-hover:text-white/60">
                  {ver.file}
                </p>
              </div>

              <div
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md border transition-colors",
                  isCurrent
                    ? "border-blue-400 bg-blue-500 text-white shadow-sm"
                    : "border-white/10 bg-white/[0.03] text-white/20 group-hover:text-white/50",
                )}
              >
                {isCurrent ? <CheckIcon className="size-3.5 stroke-[3]" /> : <PlayIcon className="size-2.5" />}
              </div>
            </div>
          )
        })}
      </div>
    </ResponsiveModal>
  )
}
