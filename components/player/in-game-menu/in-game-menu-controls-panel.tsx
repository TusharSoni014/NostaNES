"use client"

import { useEffect, useState } from "react"
import { CheckCircle2Icon, RotateCcwIcon, SaveIcon, SlidersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  ACTION_LABELS,
  getCustomControls,
  resetCustomControls,
  saveCustomControls,
  type CustomControlsConfig,
  type NesActionKey,
} from "@/lib/storage/controls-storage"
import { playUiSound } from "@/lib/ui-sounds"

const ACTION_KEYS: NesActionKey[] = [
  "up",
  "down",
  "left",
  "right",
  "b",
  "a",
  "turboB",
  "turboA",
  "select",
  "start",
]

export const InGameMenuControlsPanel = () => {
  const [config, setConfig] = useState<CustomControlsConfig>(getCustomControls())
  const [activeTab, setActiveTab] = useState<"keyboard" | "gamepad">("keyboard")
  const [listeningKey, setListeningKey] = useState<NesActionKey | null>(null)
  const [savedNotice, setSavedNotice] = useState(false)

  // Listen for keyboard input when rebinding
  useEffect(() => {
    if (!listeningKey || activeTab !== "keyboard") return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const keyName = e.key.toLowerCase()
      setConfig((prev) => ({
        ...prev,
        keyboard: {
          ...prev.keyboard,
          [listeningKey]: keyName,
        },
      }))
      setListeningKey(null)
      playUiSound("option_selected")
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [activeTab, listeningKey])

  // Listen for gamepad input when rebinding
  useEffect(() => {
    if (!listeningKey || activeTab !== "gamepad") return

    let animId = 0
    const pollGamepad = () => {
      const pads = navigator.getGamepads?.() ?? []
      const pad = Array.from(pads).find((p): p is Gamepad => Boolean(p && p.connected))

      if (pad) {
        for (let i = 0; i < pad.buttons.length; i++) {
          const btn = pad.buttons[i]
          const isPressed = typeof btn === "object" ? btn.pressed : Boolean(btn)
          if (isPressed) {
            setConfig((prev) => ({
              ...prev,
              gamepad: {
                ...prev.gamepad,
                [listeningKey]: String(i),
              },
            }))
            setListeningKey(null)
            playUiSound("option_selected")
            return
          }
        }
      }
      animId = requestAnimationFrame(pollGamepad)
    }

    animId = requestAnimationFrame(pollGamepad)
    return () => cancelAnimationFrame(animId)
  }, [activeTab, listeningKey])

  const handleSave = () => {
    saveCustomControls(config)
    setSavedNotice(true)
    playUiSound("game_start")
    window.setTimeout(() => setSavedNotice(false), 3000)
  }

  const handleReset = () => {
    const defaults = resetCustomControls()
    setConfig(defaults)
    setSavedNotice(true)
    playUiSound("navigation")
    window.setTimeout(() => setSavedNotice(false), 3000)
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0 max-h-[70vh] overflow-y-auto pr-1">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <SlidersIcon className="size-5 text-blue-400" />
            Customize Controls
          </h3>
          <p className="text-xs text-muted-foreground">
            Remap controls and save them to browser local storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "keyboard" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("keyboard")}
          >
            Keyboard
          </Button>
          <Button
            variant={activeTab === "gamepad" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("gamepad")}
          >
            Gamepad
          </Button>
        </div>
      </div>

      {savedNotice ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs text-blue-200">
          <CheckCircle2Icon className="size-4 shrink-0 text-blue-400" />
          <span>Controls saved to browser local storage!</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ACTION_KEYS.map((action) => {
          const { label, desc } = ACTION_LABELS[action]
          const isListening = listeningKey === action
          const val =
            activeTab === "keyboard" ? config.keyboard[action] : config.gamepad[action]

          return (
            <div
              key={action}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-white/20 hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white">{label}</span>
                <span className="text-[10px] text-muted-foreground truncate">{desc}</span>
              </div>

              <Button
                variant={isListening ? "default" : "outline"}
                size="sm"
                onClick={() => setListeningKey(isListening ? null : action)}
                className="h-8 px-2.5 min-w-20 font-mono text-xs"
              >
                {isListening ? (
                  <span className="animate-pulse text-amber-300">Press input...</span>
                ) : (
                  <Kbd className="uppercase">{val}</Kbd>
                )}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-white/60 hover:text-white gap-2"
        >
          <RotateCcwIcon className="size-3.5" />
          <span>Reset Defaults</span>
        </Button>

        <Button size="sm" onClick={handleSave} className="gap-2">
          <SaveIcon className="size-3.5" />
          <span>Save to Browser Storage</span>
        </Button>
      </div>
    </div>
  )
}
