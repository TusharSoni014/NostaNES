"use client"

import { Gamepad2Icon } from "lucide-react"
import { useEffect } from "react"
import { useGamepadStatus } from "@/hooks/use-gamepad-status"
import { playUiSound } from "@/lib/ui-sounds"
import { Badge } from "@/components/ui/badge"
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
        initial={{ opacity: 0, scale: 0.9, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -4 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <div
                className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-foreground transition-colors cursor-default shadow-sm backdrop-blur-md"
                tabIndex={-1}
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <Gamepad2Icon className="size-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-medium text-[11px]">
                  {profile.name}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] py-0 px-1.5 font-semibold bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                >
                  Ready
                </Badge>
              </div>
            }
          >
            <span>{profile.name} detected and ready</span>
          </TooltipTrigger>
          <TooltipContent>
            {profile.name} connected. Native controller navigation active.
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </AnimatePresence>
  )
}
