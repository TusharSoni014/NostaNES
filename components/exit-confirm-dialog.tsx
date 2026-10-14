"use client"

import { PauseIcon } from "lucide-react"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"

type ExitConfirmDialogProps = {
  open: boolean
  onResume: () => void
  onConfirmExit: () => void
}

export function ExitConfirmDialog({
  open,
  onResume,
  onConfirmExit,
}: ExitConfirmDialogProps) {
  return (
    <ResponsiveConfirmDialog
      open={open}
      badgeText="GAME PAUSED"
      badgeIcon={<PauseIcon className="size-3 text-amber-400 fill-amber-400" />}
      title="Exit to Game Library?"
      description="Your current game is paused. Any unsaved progress will be lost if you return to the shelf."
      cancelText="Resume Playing"
      confirmText="Exit to Library"
      variant="destructive"
      onCancel={onResume}
      onConfirm={onConfirmExit}
    />
  )
}
