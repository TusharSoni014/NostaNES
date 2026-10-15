"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export type SwitchProps = {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      data-slot="switch"
      onClick={(event) => {
        event.stopPropagation()
        if (disabled) return
        onCheckedChange?.(!checked)
      }}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "bg-blue-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]"
          : "bg-white/20 hover:bg-white/25",
        className,
      )}
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="pointer-events-none block size-4 rounded-full bg-white shadow-md ring-0"
      />
    </button>
  )
}
