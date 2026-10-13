"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { InGameMenuCheatsPanel } from "./in-game-menu-cheats-panel"
import { InGameMenuControlsPanel } from "./in-game-menu-controls-panel"
import { InGameMenuHeader } from "./in-game-menu-header"
import { InGameMenuLoadPanel } from "./in-game-menu-load-panel"
import { InGameMenuSavePanel } from "./in-game-menu-save-panel"
import { InGameMenuSidebar } from "./in-game-menu-sidebar"
import type { InGameMenuProps, InGameMenuTab } from "./types"
import { GamepadDispatcher } from "@/lib/gamepad/gamepad-dispatcher"
import { playUiSound } from "@/lib/ui-sounds"

export const InGameMenu = ({
  open,
  game,
  onResume,
  onRequestExit,
  onSaveState,
  onLoadState,
}: InGameMenuProps) => {
  const [activeTab, setActiveTab] = useState<InGameMenuTab>("resume")

  const handleSelectTab = useCallback(
    (tab: InGameMenuTab) => {
      if (tab === "resume") {
        onResume()
        return
      }
      setActiveTab(tab)
      playUiSound("option_selected")
    },
    [onResume],
  )

  // Gamepad navigation inside the menu
  useEffect(() => {
    if (!open) return

    const dispatcher = new GamepadDispatcher((action) => {
      const tabs: InGameMenuTab[] = ["resume", "save", "load", "controls", "cheats", "exit"]
      const currentIndex = tabs.indexOf(activeTab)

      if (action === "NAV_UP") {
        playUiSound("navigation")
        const next = tabs[Math.max(0, currentIndex - 1)]
        setActiveTab(next)
      } else if (action === "NAV_DOWN") {
        playUiSound("navigation")
        const next = tabs[Math.min(tabs.length - 1, currentIndex + 1)]
        setActiveTab(next)
      } else if (action === "CONFIRM") {
        if (activeTab === "resume") onResume()
        else if (activeTab === "exit") onRequestExit()
      } else if (action === "CANCEL") {
        onResume()
      }
    })

    dispatcher.start()
    return () => dispatcher.stop()
  }, [activeTab, open, onRequestExit, onResume])

  // Keyboard navigation inside the menu
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      const tabs: InGameMenuTab[] = ["resume", "save", "load", "controls", "cheats", "exit"]
      const currentIndex = tabs.indexOf(activeTab)

      if (e.key === "ArrowUp") {
        e.preventDefault()
        playUiSound("navigation")
        setActiveTab(tabs[Math.max(0, currentIndex - 1)])
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        playUiSound("navigation")
        setActiveTab(tabs[Math.min(tabs.length - 1, currentIndex + 1)])
      } else if (e.key === "Enter" && activeTab === "resume") {
        e.preventDefault()
        onResume()
      } else if (e.key === "Enter" && activeTab === "exit") {
        e.preventDefault()
        onRequestExit()
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [activeTab, open, onRequestExit, onResume])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="In-Game Menu"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex flex-col bg-[#030716]/92 backdrop-blur-2xl text-white select-none overflow-hidden"
      >
        {/* Subtle radial ambient blue glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />

        <InGameMenuHeader gameTitle={game.title} onResume={onResume} />

        <div className="flex min-h-0 flex-1 flex-col md:flex-row gap-6 p-4 sm:p-8 max-w-6xl mx-auto w-full overflow-hidden">
          <InGameMenuSidebar activeTab={activeTab} onSelectTab={handleSelectTab} />

          <main className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 backdrop-blur-md overflow-hidden">
            {activeTab === "resume" ? (
              <div className="flex flex-col items-center justify-center text-center p-8 flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Game Paused</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Ready to jump back into {game.title}? Press Resume or hit F1 / Select+Start.
                </p>
                <Button size="lg" onClick={onResume} className="gap-2">
                  Resume Gameplay
                </Button>
              </div>
            ) : activeTab === "save" ? (
              <InGameMenuSavePanel game={game} onSaveState={onSaveState} />
            ) : activeTab === "load" ? (
              <InGameMenuLoadPanel
                game={game}
                onLoadState={onLoadState}
                onResume={onResume}
              />
            ) : activeTab === "controls" ? (
              <InGameMenuControlsPanel />
            ) : activeTab === "cheats" ? (
              <InGameMenuCheatsPanel />
            ) : activeTab === "exit" ? (
              <div className="flex flex-col items-center justify-center text-center p-8 flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Leave to Cartridge Shelf?</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Your current emulation session will stop. Make sure you have saved your state first.
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={onResume}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={onRequestExit}>
                    Exit Game
                  </Button>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
