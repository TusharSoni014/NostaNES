"use client"

import { useState } from "react"
import {
  RotateCcwIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react"
import { TOUCH_ELEMENT_METADATA, type TouchElementKey } from "@/lib/storage/touch-controls-storage"
import { cn } from "@/lib/utils"

export type TouchControlsEditorBarProps = {
  orientation: "portrait" | "landscape"
  gameTitle?: string
  selectedKey: TouchElementKey | null
  currentScale: number
  onScaleChange: (newScale: number) => void
  onResetSelected: () => void
  onResetAll: () => void
  onDone: () => void
  saveStatus: string | null
}

export function TouchControlsEditorBar({
  orientation,
  gameTitle,
  selectedKey,
  currentScale,
  onScaleChange,
  onResetSelected,
  onResetAll,
  onDone,
  saveStatus,
}: TouchControlsEditorBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const selectedMeta = selectedKey ? TOUCH_ELEMENT_METADATA[selectedKey] : null

  // Collapsed compact floating pill
  if (isCollapsed) {
    return (
      <div
        className={cn(
          "pointer-events-auto z-50 flex items-center justify-center select-none px-2",
          orientation === "portrait"
            ? "fixed top-[max(0.5rem,env(safe-area-inset-top,0.5rem))] inset-x-0"
            : "absolute top-2 inset-x-0",
        )}
        onPointerDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/95 border border-zinc-700/80 shadow-2xl backdrop-blur-md text-white max-w-sm">
          <span className="text-[11px] font-semibold text-zinc-200 truncate">
            {selectedMeta ? selectedMeta.label : "Controls Layout"}
          </span>

          {saveStatus ? (
            <span className="text-[10px] text-emerald-400 font-medium truncate">
              {saveStatus}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400 hidden xs:inline">Auto-saved</span>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            title="Expand settings panel"
            className="flex items-center gap-1 text-[11px] font-medium text-blue-300 hover:text-white px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-700/50 cursor-pointer active:scale-95 transition-transform"
          >
            <span>Edit</span>
            <ChevronDownIcon className="size-3" />
          </button>

          <button
            type="button"
            onClick={onDone}
            title="Finish layout editing"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer active:scale-95 transition-transform shadow-sm shrink-0"
          >
            <CheckIcon className="size-3" />
            <span>Done</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "pointer-events-auto z-50 flex flex-col gap-1.5 p-2 sm:p-2.5 rounded-xl bg-zinc-950/95 border border-zinc-700/80 backdrop-blur-md shadow-2xl select-none text-white max-w-xl mx-auto",
        orientation === "portrait"
          ? "fixed top-[max(0.5rem,env(safe-area-inset-top,0.5rem))] inset-x-2 sm:inset-x-6"
          : "absolute top-2 inset-x-2 sm:inset-x-6",
      )}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/70 shrink-0 font-bold">
            {orientation}
          </span>
          <span className="text-xs font-semibold truncate text-zinc-200">
            {gameTitle || "Touch Controls"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {saveStatus ? (
            <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
              <CheckIcon className="size-3" />
              <span>{saveStatus}</span>
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400 hidden sm:inline">
              Auto-saves to all games
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            title="Minimize settings panel"
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 cursor-pointer active:scale-95 transition-transform"
          >
            <ChevronUpIcon className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={onDone}
            title="Finish layout editing"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors active:scale-95 shadow-sm"
          >
            <CheckIcon className="size-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>

      {/* Controls & Size Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        {/* Selected Button & Size Adjuster */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">
            {selectedMeta ? (
              <span className="text-blue-300 font-bold">{selectedMeta.label}</span>
            ) : (
              <span className="italic text-zinc-500">Tap button to resize</span>
            )}
          </span>

          {selectedKey && (
            <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
              <button
                type="button"
                onClick={() => onScaleChange(Math.max(0.5, currentScale - 0.05))}
                disabled={currentScale <= 0.5}
                title="Decrease size"
                className="size-6 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center border border-zinc-700 cursor-pointer active:scale-90"
              >
                <MinusIcon className="size-3" />
              </button>

              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.05"
                value={currentScale}
                onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                className="w-20 sm:w-28 accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />

              <button
                type="button"
                onClick={() => onScaleChange(Math.min(1.8, currentScale + 0.05))}
                disabled={currentScale >= 1.8}
                title="Increase size"
                className="size-6 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center border border-zinc-700 cursor-pointer active:scale-90"
              >
                <PlusIcon className="size-3" />
              </button>

              <span className="text-[11px] font-mono font-bold text-zinc-300 w-9 text-right">
                {Math.round(currentScale * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {selectedKey && (
            <button
              type="button"
              onClick={onResetSelected}
              title="Reset selected button position & scale"
              className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 cursor-pointer transition-colors"
            >
              Reset Btn
            </button>
          )}

          <button
            type="button"
            onClick={onResetAll}
            title="Reset all buttons to defaults"
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 cursor-pointer transition-colors"
          >
            <RotateCcwIcon className="size-3 text-amber-400" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* Helper text row */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
        <span>Drag buttons to reposition. Tap to select & scale.</span>
        <span className="text-zinc-500 hidden xs:inline">Auto-saves automatically</span>
      </div>
    </div>
  )
}
