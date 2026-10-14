"use client"

import { useRef, useState } from "react"
import { CheckIcon, SparklesIcon, TvIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  type GameShader,
  type ShaderOption,
  SHADER_OPTIONS,
} from "@/lib/storage/shader-storage"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { playUiSound } from "@/lib/ui-sounds"
import { cn } from "@/lib/utils"

type InGameMenuShadersPanelProps = {
  activeShader: GameShader
  onSelectShader: (shader: GameShader) => void
  isFocused?: boolean
  onCancel?: () => void
  onNavigateLeft?: () => void
}

export function InGameMenuShadersPanel({
  activeShader,
  onSelectShader,
  isFocused = false,
  onCancel,
  onNavigateLeft,
}: InGameMenuShadersPanelProps) {
  const [selectedId, setSelectedId] = useState<GameShader>(activeShader)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const currentOption =
    SHADER_OPTIONS.find((opt) => opt.id === selectedId) ?? SHADER_OPTIONS[0]

  const handleApply = (opt: ShaderOption) => {
    onSelectShader(opt.id)
    playUiSound("game_start")
  }

  useMenuNavigation<ShaderOption>({
    enabled: isFocused,
    items: SHADER_OPTIONS,
    activeItem: currentOption,
    onSelect: (opt, idx) => {
      setSelectedId(opt.id)
      itemRefs.current[idx]?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    },
    onConfirm: (opt) => handleApply(opt),
    onCancel,
    onNavigateLeft,
  })

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full min-w-0 gap-4 select-none">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <TvIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Shaders & Display</h2>
            <p className="text-xs text-white/60">Choose CRT scanlines and retro display filters</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs border-blue-400/40 bg-blue-500/10 text-blue-300">
          <SparklesIcon className="mr-1 size-3" />
          Live Preview
        </Badge>
      </div>

      {/* Preset List */}
      <div
        role="listbox"
        aria-label="Available CRT and display shaders"
        className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto p-1 focus:outline-none [scrollbar-gutter:stable]"
      >
        {SHADER_OPTIONS.map((opt, idx) => {
          const isCursor = isFocused && selectedId === opt.id
          const isActive = activeShader === opt.id

          return (
            <div
              key={opt.id}
              ref={(el) => {
                itemRefs.current[idx] = el
              }}
              role="option"
              aria-selected={isCursor}
              onClick={() => {
                setSelectedId(opt.id)
                handleApply(opt)
              }}
              className={cn(
                "group relative flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3.5 transition-all duration-150",
                isCursor
                  ? "border-blue-400 bg-blue-500/15 text-white ring-2 ring-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                  : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white tracking-tight">{opt.label}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] py-0 px-2 font-mono",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                        : "bg-white/5 text-white/50 border-white/10",
                    )}
                  >
                    {isActive ? "ACTIVE" : opt.badge}
                  </Badge>
                </div>
                <p className="text-xs text-white/50 leading-relaxed line-clamp-1">{opt.description}</p>
              </div>

              <div
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md border transition-colors",
                  isActive
                    ? "border-emerald-400 bg-emerald-500 text-black font-bold shadow-sm"
                    : isCursor
                      ? "border-blue-400 bg-blue-500/30 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/20",
                )}
              >
                {isActive ? <CheckIcon className="size-3.5 stroke-[3]" /> : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer action bar */}
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/10 text-xs text-white/60">
        <span>Press <Kbd className="text-[10px]">A / Enter</Kbd> to activate shader</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const opt = SHADER_OPTIONS.find((o) => o.id === selectedId)
            if (opt) handleApply(opt)
          }}
          className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border-0"
        >
          Apply Preset
        </Button>
      </div>
    </div>
  )
}
