"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type GamepadButtonName =
  | "A"
  | "B"
  | "X"
  | "Y"
  | "✕"
  | "○"
  | "□"
  | "△"
  | "LB"
  | "RB"
  | "LT"
  | "RT"
  | "L1"
  | "R1"
  | "L2"
  | "R2"
  | "ZL"
  | "ZR"
  | "D-Pad"
  | "D-Pad Up"
  | "D-Pad Down"
  | "D-Pad Left"
  | "D-Pad Right"
  | "D-Pad ↑↓"
  | "D-Pad ▲▼"
  | "L-Stick"
  | "R-Stick"
  | "LS"
  | "RS"
  | "L3"
  | "R3"
  | "Start"
  | "Select"
  | "Menu"
  | "Options"
  | "View"
  | "Share"
  | "Guide"
  | "Home"
  | string

export interface GamepadKeyProps extends React.ComponentProps<"span"> {
  button: GamepadButtonName
  size?: "sm" | "default" | "lg"
  variant?: "accent" | "monochrome" | "outline"
}

// Minimalistic SVG icon for D-Pad
export const DPadGlyph = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    className={cn("size-3 shrink-0", className)}
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M6 1.5A.5.5 0 0 1 6.5 1h3a.5.5 0 0 1 .5.5V5h3.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H10v3.5a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V9H2.5A.5.5 0 0 1 2 8.5v-3a.5.5 0 0 1 .5-.5H6V1.5z"
      opacity="0.85"
    />
  </svg>
)

// Minimalistic SVG icon for Thumbstick
export const StickGlyph = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    className={cn("size-3 shrink-0", className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="6" strokeOpacity="0.8" />
    <circle cx="8" cy="8" r="2.5" fill="currentColor" fillOpacity="0.8" />
  </svg>
)

// Helper to determine button classification
const FACE_BUTTON_CONFIG: Record<
  string,
  { label: string; accentClass: string; playstation?: boolean }
> = {
  // Xbox / Standard / Nintendo Face buttons
  A: {
    label: "A",
    accentClass:
      "text-emerald-400 bg-emerald-500/15 border-emerald-500/40 border-b-emerald-500/60 shadow-[0_1px_2px_rgba(16,185,129,0.15)]",
  },
  B: {
    label: "B",
    accentClass:
      "text-rose-400 bg-rose-500/15 border-rose-500/40 border-b-rose-500/60 shadow-[0_1px_2px_rgba(244,63,94,0.15)]",
  },
  X: {
    label: "X",
    accentClass:
      "text-sky-400 bg-sky-500/15 border-sky-500/40 border-b-sky-500/60 shadow-[0_1px_2px_rgba(14,165,233,0.15)]",
  },
  Y: {
    label: "Y",
    accentClass:
      "text-amber-400 bg-amber-500/15 border-amber-500/40 border-b-amber-500/60 shadow-[0_1px_2px_rgba(245,158,11,0.15)]",
  },

  // PlayStation Shapes
  "✕": {
    label: "✕",
    accentClass:
      "text-sky-400 bg-sky-500/15 border-sky-500/40 border-b-sky-500/60 shadow-[0_1px_2px_rgba(14,165,233,0.15)]",
    playstation: true,
  },
  "○": {
    label: "○",
    accentClass:
      "text-rose-400 bg-rose-500/15 border-rose-500/40 border-b-rose-500/60 shadow-[0_1px_2px_rgba(244,63,94,0.15)]",
    playstation: true,
  },
  "□": {
    label: "□",
    accentClass:
      "text-pink-400 bg-pink-500/15 border-pink-500/40 border-b-pink-500/60 shadow-[0_1px_2px_rgba(236,72,153,0.15)]",
    playstation: true,
  },
  "△": {
    label: "△",
    accentClass:
      "text-emerald-400 bg-emerald-500/15 border-emerald-500/40 border-b-emerald-500/60 shadow-[0_1px_2px_rgba(16,185,129,0.15)]",
    playstation: true,
  },
}

export function GamepadKey({
  button,
  size = "default",
  variant = "accent",
  className,
  ...props
}: GamepadKeyProps) {
  const normalized = (button ?? "").trim()
  const faceConfig = FACE_BUTTON_CONFIG[normalized]

  // Sizing definitions
  const circleSize = {
    sm: "size-4.5 text-[10px]",
    default: "size-5 text-[11px]",
    lg: "size-6 text-xs",
  }[size]

  const pillSize = {
    sm: "h-4.5 min-w-[22px] px-1.25 text-[10px] rounded-[4px]",
    default: "h-5 min-w-[26px] px-1.5 text-[10px] rounded-[5px]",
    lg: "h-6 min-w-[30px] px-2 text-xs rounded-md",
  }[size]

  // If it's a circular face button (A, B, X, Y or ✕, ○, □, △)
  if (faceConfig) {
    const isMonochrome = variant === "monochrome"
    const styleClass = isMonochrome
      ? "text-zinc-200 bg-zinc-800/90 border-white/20 border-b-white/30 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
      : faceConfig.accentClass

    return (
      <span
        data-slot="gamepad-key"
        data-button={normalized}
        className={cn(
          "inline-flex items-center justify-center shrink-0 rounded-full border border-b-[1.5px] font-sans font-bold select-none leading-none tracking-tight transition-all",
          circleSize,
          styleClass,
          className
        )}
        {...props}
      >
        {faceConfig.label}
      </span>
    )
  }

  // D-Pad representations
  if (
    normalized.toLowerCase() === "d-pad" ||
    normalized.toLowerCase().startsWith("d-pad")
  ) {
    const extraDirection = normalized.replace(/d-pad/i, "").trim()
    return (
      <span
        data-slot="gamepad-key"
        data-button="dpad"
        className={cn(
          "inline-flex items-center justify-center gap-1 shrink-0 font-sans font-semibold tracking-tight select-none border border-border/80 border-b-[2px] border-b-border bg-muted/60 dark:bg-zinc-800/90 dark:border-zinc-700/80 dark:border-b-zinc-600 text-foreground dark:text-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
          pillSize,
          className
        )}
        {...props}
      >
        <DPadGlyph className={size === "sm" ? "size-2.5" : "size-3"} />
        {extraDirection ? <span>{extraDirection}</span> : <span>D-Pad</span>}
      </span>
    )
  }

  // Thumbsticks (L-Stick, R-Stick, L3, R3, LS, RS)
  if (
    normalized === "L-Stick" ||
    normalized === "R-Stick" ||
    normalized === "LS" ||
    normalized === "RS" ||
    normalized === "L3" ||
    normalized === "R3" ||
    normalized.toLowerCase().includes("stick")
  ) {
    const stickLabel =
      normalized === "L-Stick" || normalized === "Left Stick"
        ? "LS"
        : normalized === "R-Stick" || normalized === "Right Stick"
          ? "RS"
          : normalized

    return (
      <span
        data-slot="gamepad-key"
        data-button={stickLabel}
        className={cn(
          "inline-flex items-center justify-center gap-1 shrink-0 font-mono font-semibold tracking-tight select-none border border-border/80 border-b-[2px] border-b-border bg-muted/60 dark:bg-zinc-800/90 dark:border-zinc-700/80 dark:border-b-zinc-600 text-foreground dark:text-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
          pillSize,
          className
        )}
        {...props}
      >
        <StickGlyph className={size === "sm" ? "size-2.5" : "size-3"} />
        <span>{stickLabel}</span>
      </span>
    )
  }

  // Bumpers, Triggers, and System buttons (LB, RB, LT, RT, Start, Select, Menu, View, etc.)
  const isBumperOrTrigger = /^(LB|RB|LT|RT|L1|R1|L2|R2|ZL|ZR)$/i.test(normalized)

  return (
    <span
      data-slot="gamepad-key"
      data-button={normalized}
      className={cn(
        "inline-flex items-center justify-center shrink-0 font-mono font-semibold tracking-tight select-none border border-border/80 border-b-[2px] border-b-border bg-muted/60 dark:bg-zinc-800/90 dark:border-zinc-700/80 dark:border-b-zinc-600 text-foreground dark:text-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
        isBumperOrTrigger ? "font-mono uppercase font-bold" : "font-sans",
        pillSize,
        className
      )}
      {...props}
    >
      {normalized}
    </span>
  )
}
