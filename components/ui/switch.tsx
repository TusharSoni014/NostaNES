"use client"

import { motion } from "motion/react"
import { cn } from "cn"

type SwitchProps = {
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
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-300 disabled:pointer-events-none disabled:opacity-50",
        checked ? "border-blue-300 bg-blue-500" : "border-white/20 bg-white/10",
        className,
      )}
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ x: checked ? 16 : 2 }}
        transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.6 }}
        style={{ willChange: "transform" }}
        className="block size-3.5 rounded-full bg-white shadow-sm"
      />
    </button>
  )
}
