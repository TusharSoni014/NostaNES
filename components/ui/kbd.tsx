import * as React from "react"
import { cn } from "@/lib/utils"
export { GamepadKey, type GamepadKeyProps, type GamepadButtonName } from "./gamepad-key"
export { KeyBadge, type KeyBadgeProps } from "./key-badge"

export interface KbdProps extends React.ComponentProps<"kbd"> {
  variant?: "default" | "subtle" | "outline" | "solid"
  size?: "sm" | "default" | "lg"
}

function Kbd({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: KbdProps) {
  const sizeClasses = {
    sm: "h-4.5 min-w-[18px] px-1 text-[10px] rounded-[4px]",
    default: "h-5 min-w-5 px-1.5 text-[11px] rounded-[5px]",
    lg: "h-6 min-w-6 px-2 text-xs rounded-md",
  }[size]

  const variantClasses = {
    default:
      "border border-border/80 border-b-[2px] border-b-border bg-muted/60 dark:bg-zinc-800/90 dark:border-zinc-700/80 dark:border-b-zinc-600 text-foreground dark:text-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
    subtle:
      "border border-border/50 dark:border-white/10 bg-foreground/[0.04] dark:bg-white/[0.05] text-foreground/90 dark:text-zinc-300",
    outline:
      "border border-border dark:border-white/20 bg-transparent text-foreground/80 dark:text-zinc-300",
    solid:
      "border border-zinc-700/80 border-b-[2px] border-b-zinc-950 bg-zinc-900/95 dark:bg-zinc-950/90 text-white shadow-sm",
  }[variant]

  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex items-center justify-center gap-1 font-mono font-medium tracking-tight select-none transition-colors",
        "in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
        sizeClasses,
        variantClasses,
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
