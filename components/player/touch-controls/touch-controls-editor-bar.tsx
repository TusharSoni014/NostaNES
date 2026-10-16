"use client"

import {
  RotateCcwIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  LayersIcon,
  SaveIcon,
} from "lucide-react"
import { TOUCH_ELEMENT_METADATA, type TouchElementKey } from "@/lib/storage/touch-controls-storage"

export type TouchControlsEditorBarProps = {
  orientation: "portrait" | "landscape"
  gameTitle?: string
  selectedKey: TouchElementKey | null
  currentScale: number
  onScaleChange: (newScale: number) => void
  onResetSelected: () => void
  onResetAll: () => void
  onSave: () => void
  onApplyAll: () => void
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
  onSave,
  onApplyAll,
  onDone,
  saveStatus,
}: TouchControlsEditorBarProps) {
  const selectedMeta = selectedKey ? TOUCH_ELEMENT_METADATA[selectedKey] : null

  return (
    <div
      className="pointer-events-auto absolute top-2 inset-x-2 sm:inset-x-6 z-50 flex flex-col gap-1.5 p-2 sm:p-2.5 rounded-xl bg-zinc-950/95 border border-zinc-700/80 backdrop-blur-md shadow-2xl select-none text-white max-w-xl mx-auto"
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
            {gameTitle || "Default Controls"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onSave}
            title="Save for this game"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer transition-colors active:scale-95"
          >
            <SaveIcon className="size-3.5 text-blue-400" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            type="button"
            onClick={onDone}
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
              title="Reset selected button"
              className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 cursor-pointer transition-colors"
            >
              Reset Btn
            </button>
          )}

          <button
            type="button"
            onClick={onResetAll}
            title="Reset layout to default"
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 cursor-pointer transition-colors"
          >
            <RotateCcwIcon className="size-3 text-amber-400" />
            <span>Reset All</span>
          </button>

          <button
            type="button"
            onClick={onApplyAll}
            title="Apply this layout as default for all games"
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 cursor-pointer transition-colors"
          >
            <LayersIcon className="size-3 text-blue-400" />
            <span>All Games</span>
          </button>
        </div>
      </div>

      {/* Helper text or notification banner */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
        <span>Drag buttons to reposition anywhere. Tap to select & scale.</span>
        {saveStatus && (
          <span className="font-semibold text-emerald-400 animate-pulse">
            {saveStatus}
          </span>
        )}
      </div>
    </div>
  )
}
