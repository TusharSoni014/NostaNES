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
  exitToBlack?: boolean
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  exitToBlack = false,
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
        <DrawerContent
          className={cn(
            "p-4 text-white bg-[#030716] border-t border-blue-500/30",
            className,
          )}
        >
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-lg font-bold text-white tracking-tight">{title}</DrawerTitle>
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
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          key="responsive-modal-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: exitToBlack ? 1 : 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Dark Console Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={
              exitToBlack
                ? { opacity: 1, backgroundColor: "#000000" }
                : { opacity: 0 }
            }
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* PS4 Styled Modal Box */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 8,
              transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
            }}
            transition={{ type: "spring", damping: 28, stiffness: 380, mass: 0.85 }}
            className={cn(
              "relative z-50 w-full max-w-lg rounded-2xl border border-blue-500/30 bg-[#040817]/95 p-6 text-white shadow-[0_32px_96px_rgba(0,10,35,0.95)] ring-1 ring-blue-400/20 backdrop-blur-3xl",
              className,
            )}
          >
            {/* Top Light Accent Sheen */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

            <div className="flex flex-col gap-1 pb-3 border-b border-white/10">
              <div className="text-base sm:text-lg font-bold tracking-tight text-white">{title}</div>
              {description ? (
                <div className="text-xs text-white/60 leading-relaxed">{description}</div>
              ) : null}
            </div>

            <div className="py-2.5">{children}</div>

            {footer ? (
              <div className="mt-3 flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
