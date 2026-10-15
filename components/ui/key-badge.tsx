"use client"

import * as React from "react"
import { Kbd, type KbdProps } from "@/components/ui/kbd"
import { GamepadKey, type GamepadButtonName } from "@/components/ui/gamepad-key"
import { cn } from "@/lib/utils"

export interface KeyBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  combo?: string
  mode?: "auto" | "keyboard" | "gamepad"
  size?: "sm" | "default" | "lg"
  variant?: KbdProps["variant"]
}

const KNOWN_GAMEPAD_BUTTONS = new Set([
  "A",
  "B",
  "X",
  "Y",
  "✕",
  "○",
  "□",
  "△",
  "LB",
  "RB",
  "LT",
  "RT",
  "L1",
  "R1",
  "L2",
  "R2",
  "ZL",
  "ZR",
  "L3",
  "R3",
  "LS",
  "RS",
  "D-PAD",
  "L-STICK",
  "R-STICK",
  "SELECT",
  "START",
  "MENU",
  "OPTIONS",
  "VIEW",
  "SHARE",
  "GUIDE",
  "HOME",
])

export function isGamepadIdentifier(token: string): boolean {
  const upper = token.trim().toUpperCase()
  if (KNOWN_GAMEPAD_BUTTONS.has(upper)) return true
  if (upper.startsWith("D-PAD")) return true
  if (upper.includes("STICK")) return true
  return false
}

export function KeyBadge({
  combo,
  mode = "auto",
  size = "default",
  variant = "default",
  className,
  children,
  ...props
}: KeyBadgeProps) {
  const text = combo ?? (typeof children === "string" ? children : "")

  if (!text) {
    return (
      <span className={cn("inline-flex items-center gap-1", className)} {...props}>
        {children}
      </span>
    )
  }

  // Tokenize combo by ` + ` or ` / ` or `/`
  // We keep the delimiters to render them nicely
  const parts = text.split(/(\s*\+\s*|\s*\/\s*)/g).filter(Boolean)

  return (
    <span
      data-slot="key-badge"
      className={cn("inline-flex items-center gap-1 shrink-0", className)}
      {...props}
    >
      {parts.map((part, index) => {
        const trimmed = part.trim()
        if (trimmed === "+" || trimmed === "/") {
          return (
            <span
              key={index}
              className="text-muted-foreground/40 dark:text-zinc-500 text-[10px] font-mono select-none px-0.5 leading-none"
              aria-hidden="true"
            >
              {trimmed}
            </span>
          )
        }

        const isGamepad =
          mode === "gamepad" || (mode === "auto" && isGamepadIdentifier(trimmed))

        if (isGamepad) {
          return (
            <GamepadKey
              key={index}
              button={trimmed as GamepadButtonName}
              size={size}
            />
          )
        }

        return (
          <Kbd key={index} size={size} variant={variant}>
            {trimmed}
          </Kbd>
        )
      })}
    </span>
  )
}
