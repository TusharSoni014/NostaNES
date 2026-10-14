"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { InGameMenuCheatsPanel } from "./in-game-menu-cheats-panel"
import { InGameMenuControlsPanel } from "./in-game-menu-controls-panel"
import { InGameMenuExitPanel } from "./in-game-menu-exit-panel"
import { InGameMenuHeader } from "./in-game-menu-header"
import { InGameMenuLoadPanel } from "./in-game-menu-load-panel"
import { InGameMenuResetPanel } from "./in-game-menu-reset-panel"
import { InGameMenuSavePanel } from "./in-game-menu-save-panel"
import { InGameMenuSidebar } from "./in-game-menu-sidebar"
import type { InGameMenuProps, InGameMenuTab } from "./types"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { playUiSound } from "@/lib/ui-sounds"

const MENU_TABS: readonly InGameMenuTab[] = [
  "resume", "save", "load", "controls", "cheats", "reset", "exit",
] as const

export const InGameMenu = ({
  open,
  game,
  onResume,
  onRequestExit,
  onResetGame,
  onSaveState,
  onLoadState,
  onReloadControls,
}: InGameMenuProps) => {
  const [activeTab, setActiveTab] = useState<InGameMenuTab>("resume")
  const [focusPane, setFocusPane] = useState<"sidebar" | "content">("sidebar")
  const [prevOpen, setPrevOpen] = useState(open)

  // Reset tab selection and pane focus back to initial screen whenever menu closes
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setActiveTab("resume")
      setFocusPane("sidebar")
    }
  }

  const handleSelectTab = useCallback(
    (tab: InGameMenuTab) => {
      if (tab === "resume") {
        onResume()
        return
      }
      setActiveTab(tab)
      setFocusPane("sidebar")
      playUiSound("option_selected")
    },
    [onResume],
  )

  // Sidebar navigation via reusable hook
  useMenuNavigation<InGameMenuTab>({
    enabled: open && focusPane === "sidebar",
    items: MENU_TABS,
    activeItem: activeTab,
    onSelect: (tab) => setActiveTab(tab),
    onConfirm: (tab) => {
      if (tab === "resume") onResume()
      else {
        setFocusPane("content")
        playUiSound("option_selected")
      }
    },
    onCancel: onResume,
    onNavigateRight: (tab) => {
      if (tab !== "resume") {
        setFocusPane("content")
        playUiSound("option_selected")
      }
    },
  })

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
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />

        <InGameMenuHeader gameTitle={game.title} onResume={onResume} />

        <div className="flex min-h-0 flex-1 flex-col md:flex-row gap-6 p-4 sm:p-8 max-w-6xl mx-auto w-full overflow-hidden">
          <InGameMenuSidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            isFocused={focusPane === "sidebar"}
          />

          <main className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 backdrop-blur-md overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex min-h-0 flex-1 flex-col"
              >
                {activeTab === "resume" ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 flex-1 min-h-0">
                    <h3 className="text-xl font-bold text-white mb-2">Game Paused</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                      Ready to jump back into {game.title}? Press Resume or hit F1 / Select+Start.
                    </p>
                    <Button size="lg" onClick={onResume} className="gap-2">
                      Resume Gameplay
                    </Button>
                  </div>
                ) : activeTab === "save" ? (
                  <InGameMenuSavePanel
                    game={game}
                    onSaveState={onSaveState}
                    isFocused={focusPane === "content"}
                    onCancel={() => setFocusPane("sidebar")}
                    onNavigateLeft={() => setFocusPane("sidebar")}
                  />
                ) : activeTab === "load" ? (
                  <InGameMenuLoadPanel
                    game={game}
                    onLoadState={onLoadState}
                    onResume={onResume}
                    isFocused={focusPane === "content"}
                    onCancel={() => setFocusPane("sidebar")}
                    onNavigateLeft={() => setFocusPane("sidebar")}
                  />
                ) : activeTab === "controls" ? (
                  <InGameMenuControlsPanel
                    isFocused={focusPane === "content"}
                    onCancel={() => setFocusPane("sidebar")}
                    onNavigateLeft={() => setFocusPane("sidebar")}
                    onControlsSaved={onReloadControls}
                  />
                ) : activeTab === "cheats" ? (
                  <InGameMenuCheatsPanel />
                ) : activeTab === "reset" ? (
                  <InGameMenuResetPanel
                    game={game}
                    onResetGame={onResetGame}
                    onCancel={() => setFocusPane("sidebar")}
                    isFocused={focusPane === "content"}
                    onNavigateLeft={() => setFocusPane("sidebar")}
                  />
                ) : activeTab === "exit" ? (
                  <InGameMenuExitPanel
                    game={game}
                    onRequestExit={onRequestExit}
                    onResume={onResume}
                    onCancel={() => setFocusPane("sidebar")}
                    isFocused={focusPane === "content"}
                    onNavigateLeft={() => setFocusPane("sidebar")}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Global Navigation Hints Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-white/10 px-6 py-2.5 bg-black/40 text-xs text-white/60 select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><Kbd className="text-[10px]">D-Pad ▲▼</Kbd><span>Navigate</span></span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1"><Kbd className="text-[10px]">◄ ►</Kbd><span>Switch Pane</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><Kbd className="text-[10px]">A / Enter</Kbd><span>Select</span></span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1"><Kbd className="text-[10px]">B / Esc</Kbd><span>Back / Resume</span></span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
