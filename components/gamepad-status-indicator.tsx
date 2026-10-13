"use client"

import { Gamepad2Icon } from "lucide-react"
import { useEffect } from "react"
import { useGamepadStatus } from "@/hooks/use-gamepad-status"
import { playUiSound } from "@/lib/ui-sounds"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "motion/react"

export const GamepadStatusIndicator = () => {
  const { connected, profile } = useGamepadStatus()

  useEffect(() => {
    if (connected) playUiSound("notification")
  }, [connected])

  // Only render when an actual gamepad is detected
  if (!connected) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: -4 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <div
                className="relative flex size-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm backdrop-blur-md cursor-default select-none transition-colors hover:bg-emerald-500/15"
                tabIndex={-1}
                aria-label={`${profile.name} connected`}
              >
                <Gamepad2Icon className="size-4 text-emerald-400" />
                <span className="absolute top-1 right-1 flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
              </div>
            }
          />
          <TooltipContent>
            {profile.name} connected. Native controller navigation active.
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </AnimatePresence>
  )
}
