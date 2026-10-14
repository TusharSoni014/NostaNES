"use client"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

type ControlRowProps = {
  action: string
  label: string
  desc: string
  val: string
  isListening: boolean
  isSelected: boolean
  onClick: () => void
}

export const InGameMenuControlRow = ({
  action,
  label,
  desc,
  val,
  isListening,
  isSelected,
  onClick,
}: ControlRowProps) => {
  return (
    <div
      data-control-row={action}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border p-3 transition-all cursor-pointer",
        isSelected
          ? "border-blue-400 bg-blue-600/20 shadow-[0_0_20px_rgba(59,130,246,0.25)] ring-1 ring-blue-400"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
      )}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-white">{label}</span>
        <span className="text-[10px] text-muted-foreground truncate">{desc}</span>
      </div>

      <Button
        type="button"
        variant={isListening || isSelected ? "default" : "outline"}
        size="sm"
        className={cn(
          "h-8 px-2.5 min-w-20 font-mono text-xs",
          isSelected && !isListening && "border-blue-300 bg-blue-500 text-white",
        )}
      >
        {isListening ? (
          <span className="animate-pulse text-amber-300 font-bold">Press input...</span>
        ) : (
          <Kbd className="uppercase">{val}</Kbd>
        )}
      </Button>
    </div>
  )
}
