"use client"

import { ShuffleIcon } from "lucide-react"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"

type RandomGameConfirmDialogProps = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function RandomGameConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: RandomGameConfirmDialogProps) {
  return (
    <ResponsiveConfirmDialog
      open={open}
      badgeText="RANDOM PLAY"
      badgeIcon={<ShuffleIcon className="size-3 text-amber-400" />}
      title="Play a Random Game?"
      description="A random game you haven't played yet will start. Any unsaved progress in this game will be lost."
      cancelText="Keep Playing"
      confirmText="Play Random"
      variant="default"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
