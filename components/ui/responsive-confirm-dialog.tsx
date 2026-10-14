"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { cn } from "@/lib/utils"
import { ResponsiveModal } from "./responsive-modal"

const DIALOG_OPTIONS = ["cancel", "confirm"] as const
type DialogOption = (typeof DIALOG_OPTIONS)[number]

export type ResponsiveConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "default"
  badgeText?: string
  badgeIcon?: React.ReactNode
  defaultOption?: DialogOption
  onConfirm: () => void
  onCancel: () => void
}

export function ResponsiveConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  badgeText,
  badgeIcon,
  defaultOption = "confirm",
  onConfirm,
  onCancel,
}: ResponsiveConfirmDialogProps) {
  const [selectedOption, setSelectedOption] = useState<DialogOption>(defaultOption)
  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setSelectedOption(defaultOption)
  }

  useMenuNavigation<DialogOption>({
    enabled: open,
    items: DIALOG_OPTIONS,
    activeItem: selectedOption,
    onSelect: setSelectedOption,
    onConfirm: (item) => {
      if (item === "confirm") onConfirm()
      else onCancel()
    },
    onCancel,
    onNavigateLeft: () => setSelectedOption("cancel"),
    onNavigateRight: () => setSelectedOption("confirm"),
  })

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
      title={
        <div className="flex flex-col gap-2">
          {badgeText ? (
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-mono font-medium text-amber-400">
              {badgeIcon}
              <span>{badgeText}</span>
            </div>
          ) : null}
          <span>{title}</span>
        </div>
      }
      description={description}
      footer={
        <div className="flex w-full flex-col sm:flex-row items-center gap-2.5 select-none">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            onMouseEnter={() => setSelectedOption("cancel")}
            className={cn(
              "w-full sm:w-auto sm:flex-1 justify-between gap-2 border-white/10 bg-white/5 text-white transition-all duration-150",
              selectedOption === "cancel"
                ? "ring-2 ring-blue-400 border-blue-400/80 bg-blue-500/25 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] scale-[1.02]"
                : "hover:bg-white/10 text-white/70",
            )}
          >
            <span className="font-semibold">{cancelText}</span>
            <span className="flex items-center gap-1">
              <Kbd className={cn("text-[10px]", selectedOption === "cancel" && "bg-blue-400 text-black font-bold")}>Esc</Kbd>
              <Kbd className={cn("text-[10px]", selectedOption === "cancel" && "bg-blue-400 text-black font-bold")}>B</Kbd>
            </span>
          </Button>

          <Button
            type="button"
            variant={variant}
            size="lg"
            onClick={onConfirm}
            onMouseEnter={() => setSelectedOption("confirm")}
            className={cn(
              "w-full sm:w-auto sm:flex-1 justify-between gap-2 shadow-lg transition-all duration-150",
              selectedOption === "confirm"
                ? "ring-2 ring-rose-400 border-rose-400 bg-rose-600 text-white shadow-[0_0_24px_rgba(244,63,94,0.45)] scale-[1.02]"
                : "opacity-80 hover:opacity-100",
            )}
          >
            <span className="font-semibold">{confirmText}</span>
            <span className="flex items-center gap-1">
              <Kbd className={cn("text-[10px] bg-black/40 border-white/20", selectedOption === "confirm" && "bg-white text-black font-bold")}>Enter</Kbd>
              <Kbd className={cn("text-[10px] bg-black/40 border-white/20", selectedOption === "confirm" && "bg-white text-black font-bold")}>A</Kbd>
            </span>
          </Button>
        </div>
      }
    />
  )
}
