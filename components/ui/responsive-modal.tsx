"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

export type ResponsiveModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: ResponsiveModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Handle escape key on desktop
  React.useEffect(() => {
    if (!open || isMobile) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, isMobile, onOpenChange])

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
        <DrawerContent className={cn("p-4 text-white bg-zinc-950 border-t border-white/10", className)}>
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-lg font-bold text-white">{title}</DrawerTitle>
            {description ? (
              <DrawerDescription className="text-xs text-white/60">{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>
          <div className="py-2">{children}</div>
          {footer ? <DrawerFooter className="pt-2 px-0">{footer}</DrawerFooter> : null}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, rotateX: 6, y: 16 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, rotateX: -6, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 360 }}
            style={{ transformPerspective: 1000 }}
            className={cn(
              "relative z-50 w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950/95 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.95)] ring-1 ring-white/10 backdrop-blur-xl",
              className,
            )}
          >
            <div className="flex flex-col gap-1.5 pb-3">
              <h3 className="text-lg font-bold tracking-tight text-white">{title}</h3>
              {description ? (
                <p className="text-xs text-white/60 leading-relaxed">{description}</p>
              ) : null}
            </div>

            <div className="py-2">{children}</div>

            {footer ? <div className="mt-4 flex items-center justify-end gap-2.5 pt-2">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
