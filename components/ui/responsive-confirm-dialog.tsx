"use client"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { ResponsiveModal } from "./responsive-modal"

export type ResponsiveConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "default"
  badgeText?: string
  badgeIcon?: React.ReactNode
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
  onConfirm,
  onCancel,
}: ResponsiveConfirmDialogProps) {
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
        <div className="flex w-full flex-col sm:flex-row items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            className="w-full sm:w-auto sm:flex-1 justify-between gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white"
          >
            <span>{cancelText}</span>
            <span className="flex items-center gap-1">
              <Kbd className="text-[10px]">Esc</Kbd>
              <Kbd className="text-[10px]">B</Kbd>
            </span>
          </Button>

          <Button
            type="button"
            variant={variant}
            size="lg"
            onClick={onConfirm}
            className="w-full sm:w-auto sm:flex-1 justify-between gap-2 shadow-lg"
          >
            <span>{confirmText}</span>
            <span className="flex items-center gap-1">
              <Kbd className="text-[10px] bg-black/30 border-white/20">Enter</Kbd>
              <Kbd className="text-[10px] bg-black/30 border-white/20">A</Kbd>
            </span>
          </Button>
        </div>
      }
    />
  )
}
