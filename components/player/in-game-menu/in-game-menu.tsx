"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { Kbd, GamepadKey } from "@/components/ui/kbd"
import { InGameMenuCheatsPanel } from "./in-game-menu-cheats-panel"
import { InGameMenuControlsPanel } from "./in-game-menu-controls-panel"
import { InGameMenuExitPanel } from "./in-game-menu-exit-panel"
import { InGameMenuHeader } from "./in-game-menu-header"
import { InGameMenuLoadPanel } from "./in-game-menu-load-panel"
import { InGameMenuResetPanel } from "./in-game-menu-reset-panel"
import { InGameMenuSavePanel } from "./in-game-menu-save-panel"
import { InGameMenuShadersPanel } from "./in-game-menu-shaders-panel"
import { InGameMenuSidebar } from "./in-game-menu-sidebar"
import type { InGameMenuProps, InGameMenuTab } from "./types"
import { useInputMode } from "@/hooks/use-input-mode"
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { playUiSound } from "@/lib/ui-sounds"

const MENU_TABS: readonly InGameMenuTab[] = [
  "resume", "save", "load", "shaders", "controls", "cheats", "reset", "exit",
] as const

export const InGameMenu = ({
  open,
  game,
  onResume,
  onRequestExit,
  onResetGame,
  onSaveState,
  onLoadState,
  activeShader = "none",
  onSelectShader,
  cheats,
}: InGameMenuProps) => {
  const inputMode = useInputMode()
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

  const backToSidebar = useCallback(() => {
    setFocusPane("sidebar")
    playUiSound("back_cancel")
  }, [])

  const handleSelectTab = useCallback(
    (tab: InGameMenuTab) => {
      if (tab === "resume") {
        onResume()
        return
      }
      setActiveTab(tab)
      setFocusPane("sidebar")
      playUiSound("navigation")
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
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.985 }}
        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex flex-col bg-[#030716]/92 backdrop-blur-2xl text-white select-none overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />

        <InGameMenuHeader game={game} onResume={onResume} />

        <div className="flex min-h-0 flex-1 flex-col md:flex-row gap-3 sm:gap-4 md:gap-6 p-2.5 sm:p-4 md:p-6 max-w-7xl mx-auto w-full overflow-hidden">
          <InGameMenuSidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            isFocused={focusPane === "sidebar"}
          />

          <main className="flex min-h-0 flex-1 flex-col rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 md:p-6 backdrop-blur-md overflow-hidden relative h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="flex min-h-0 flex-1 flex-col h-full w-full"
              >
                {activeTab === "resume" ? (
                  <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 flex-1 h-full w-full min-h-0">
                    <h3 className="text-base sm:text-xl font-bold text-white mb-1.5">Game Paused</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm">
                      Ready to jump back into {game.title}? Press Resume or hit Menu.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                      <Button onClick={onResume} className="gap-2 h-8 sm:h-10 px-4 text-xs sm:text-sm">
                        Resume Gameplay
                      </Button>
                      <FavoriteButton game={game} variant="button" className="h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm" showLabel />
                    </div>
                  </div>
                ) : activeTab === "save" ? (
                  <InGameMenuSavePanel
                    game={game} onSaveState={onSaveState}
                    isFocused={focusPane === "content"} onCancel={backToSidebar} onNavigateLeft={backToSidebar}
                  />
                ) : activeTab === "load" ? (
                  <InGameMenuLoadPanel
                    game={game} onLoadState={onLoadState} onResume={onResume}
                    isFocused={focusPane === "content"} onCancel={backToSidebar} onNavigateLeft={backToSidebar}
                  />
                ) : activeTab === "shaders" ? (
                  <InGameMenuShadersPanel
                    activeShader={activeShader} onSelectShader={onSelectShader ?? (() => {})}
                    isFocused={focusPane === "content"} onCancel={backToSidebar} onNavigateLeft={backToSidebar}
                  />
                ) : activeTab === "controls" ? (
                  <InGameMenuControlsPanel
                    isFocused={focusPane === "content"}
                    onCancel={backToSidebar}
                    onNavigateLeft={backToSidebar}
                  />
                ) : activeTab === "cheats" ? (
                  <InGameMenuCheatsPanel
                    game={game}
                    cheats={cheats}
                    isFocused={focusPane === "content"}
                    onCancel={backToSidebar}
                    onNavigateLeft={backToSidebar}
                  />
                ) : activeTab === "reset" ? (
                  <InGameMenuResetPanel
                    game={game} onResetGame={onResetGame}
                    isFocused={focusPane === "content"} onCancel={backToSidebar} onNavigateLeft={backToSidebar}
                  />
                ) : activeTab === "exit" ? (
                  <InGameMenuExitPanel
                    game={game} onRequestExit={onRequestExit} onResume={onResume}
                    isFocused={focusPane === "content"} onCancel={backToSidebar} onNavigateLeft={backToSidebar}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Global Navigation Hints Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-white/10 px-6 py-2.5 bg-black/40 text-xs text-white/60 select-none">
          {inputMode === "gamepad" ? (
            <>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <GamepadKey button="D-Pad" size="sm" />
                  <span className="text-[11px] text-white/80">Navigate</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <GamepadKey button="A" size="sm" />
                  <span className="text-[11px] text-white/80">Select</span>
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1.5">
                  <GamepadKey button="B" size="sm" />
                  <span className="text-[11px] text-white/80">Back / Resume</span>
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1">
                    <Kbd size="sm">↑</Kbd>
                    <Kbd size="sm">↓</Kbd>
                  </span>
                  <span className="text-[11px] text-white/80">Navigate</span>
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1">
                    <Kbd size="sm">←</Kbd>
                    <Kbd size="sm">→</Kbd>
                  </span>
                  <span className="text-[11px] text-white/80">Switch Pane</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <Kbd size="sm">Enter</Kbd>
                  <span className="text-[11px] text-white/80">Select</span>
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1.5">
                  <Kbd size="sm">Esc</Kbd>
                  <span className="text-[11px] text-white/80">Back / Resume</span>
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
