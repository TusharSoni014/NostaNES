"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  SlidersIcon,
  Maximize2Icon,
  Minimize2Icon,
} from "lucide-react"
import { MobileDpad } from "./mobile-dpad"
import { useIsPortrait } from "@/hooks/use-is-mobile"
import {
  DEFAULT_TOUCH_LAYOUT,
  getTouchLayout,
  saveTouchLayout,
  applyLayoutToAllGames,
  type TouchElementKey,
  type TouchOrientationLayout,
  type GameTouchLayout,
} from "@/lib/storage/touch-controls-storage"
import { TouchActionButton } from "./touch-controls/touch-action-button"
import { TouchSystemButton } from "./touch-controls/touch-system-button"
import { TouchControlsEditorBar } from "./touch-controls/touch-controls-editor-bar"
import type { DragState, MobileTouchControlsProps } from "./touch-controls/types"
import { cn } from "@/lib/utils"

function triggerHaptic(duration = 10) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(duration)
    }
  } catch {}
}

export function MobileTouchControls({
  pressDown,
  pressUp,
  onToggleMenu,
  gamepadConnected = false,
  isPortrait: propIsPortrait,
  isFullscreen = false,
  onToggleFullscreen,
  game,
  isCustomizing: propIsCustomizing,
  onDoneCustomizing,
}: MobileTouchControlsProps) {
  const detectedPortrait = useIsPortrait()
  const isPortrait = propIsPortrait !== undefined ? propIsPortrait : detectedPortrait
  const orientation = isPortrait ? "portrait" : "landscape"
  const gameKey = game?.file || game?.id || "default"

  const containerRef = useRef<HTMLDivElement>(null)

  // Layout storage state per game
  const [gameLayout, setGameLayout] = useState<GameTouchLayout>(() => getTouchLayout(gameKey))
  const [internalIsCustomizing, setInternalIsCustomizing] = useState(false)
  const isCustomizing = propIsCustomizing !== undefined ? propIsCustomizing : internalIsCustomizing
  const [selectedKey, setSelectedKey] = useState<TouchElementKey | null>("dpad")
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const gameLayoutRef = useRef(gameLayout)
  gameLayoutRef.current = gameLayout

  // Reload layout when game changes
  useEffect(() => {
    const loaded = getTouchLayout(gameKey)
    setGameLayout(loaded)
    gameLayoutRef.current = loaded
  }, [gameKey])

  // Current active orientation layout
  const currentLayout = gameLayout[orientation]

  // Gamepad override state
  const [showOverride, setShowOverride] = useState<boolean | null>(null)
  const visible = showOverride !== null ? showOverride : !gamepadConnected
  const [activeButtons, setActiveButtons] = useState<Set<string>>(new Set())

  // Hide touch controls if gamepad input detected
  useEffect(() => {
    if (!visible || !gamepadConnected || isCustomizing) return

    let animId = 0
    const pollGamepad = () => {
      if (typeof navigator !== "undefined" && "getGamepads" in navigator) {
        const pads = navigator.getGamepads()
        for (const pad of pads) {
          if (!pad || !pad.connected) continue
          const hasBtn = pad.buttons.some((b) => (typeof b === "object" ? b.pressed : Boolean(b)))
          const hasAxis = pad.axes.some((a) => Math.abs(a) > 0.45)
          if (hasBtn || hasAxis) {
            setShowOverride(false)
            return
          }
        }
      }
      animId = requestAnimationFrame(pollGamepad)
    }

    animId = requestAnimationFrame(pollGamepad)
    return () => cancelAnimationFrame(animId)
  }, [visible, gamepadConnected, isCustomizing])

  // Global screen tap restores controls if hidden by gamepad
  useEffect(() => {
    const handleScreenTap = (e: PointerEvent) => {
      if (!visible && (e.pointerType === "touch" || e.pointerType === "pen" || e.pointerType === "mouse")) {
        setShowOverride(true)
      }
    }

    window.addEventListener("pointerdown", handleScreenTap, { passive: true })
    return () => window.removeEventListener("pointerdown", handleScreenTap)
  }, [visible])

  // Gameplay Button Down/Up
  const handleButtonDown = useCallback(
    (action: string, btnKey: string, e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {}

      pressDown(action)
      triggerHaptic(12)
      setActiveButtons((prev) => new Set(prev).add(btnKey))
    },
    [pressDown],
  )

  const handleButtonUp = useCallback(
    (action: string, btnKey: string, e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {}

      pressUp(action)
      setActiveButtons((prev) => {
        const next = new Set(prev)
        next.delete(btnKey)
        return next
      })
    },
    [pressUp],
  )

  // Drag & drop handlers for customization
  const handleElementPointerDown = (key: TouchElementKey, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isCustomizing) {
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {}

      setSelectedKey(key)
      setDragState({
        key,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        initialX: currentLayout[key].x,
        initialY: currentLayout[key].y,
      })
      triggerHaptic(15)
    }
  }

  const handleElementPointerMove = (key: TouchElementKey, e: React.PointerEvent) => {
    if (!isCustomizing || !dragState || dragState.key !== key || dragState.pointerId !== e.pointerId) return
    e.preventDefault()
    e.stopPropagation()

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const deltaX = ((e.clientX - dragState.startX) / rect.width) * 100
    const deltaY = ((e.clientY - dragState.startY) / rect.height) * 100

    const newX = Math.max(5, Math.min(95, Math.round((dragState.initialX + deltaX) * 10) / 10))
    const newY = Math.max(5, Math.min(95, Math.round((dragState.initialY + deltaY) * 10) / 10))

    setGameLayout((prev) => ({
      ...prev,
      [orientation]: {
        ...prev[orientation],
        [key]: {
          ...prev[orientation][key],
          x: newX,
          y: newY,
        },
      },
    }))
  }

  // Auto-save layout across all games automatically
  const autoSaveLayout = useCallback(
    (orientationLayout: TouchOrientationLayout) => {
      saveTouchLayout(gameKey, orientation, orientationLayout)
      applyLayoutToAllGames(orientation, orientationLayout)
      setSaveStatus("Saved ✓")
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => setSaveStatus(null), 1800)
    },
    [gameKey, orientation],
  )

  const handleElementPointerUp = (key: TouchElementKey, e: React.PointerEvent) => {
    if (isCustomizing) {
      if (dragState && dragState.key === key && dragState.pointerId === e.pointerId) {
        try {
          ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
        } catch {}
        setDragState(null)
        triggerHaptic(8)
        autoSaveLayout(gameLayoutRef.current[orientation])
      }
    }
  }

  // Customization Toolbar Actions
  const handleScaleChange = (newScale: number) => {
    if (!selectedKey) return
    const roundedScale = Math.round(newScale * 100) / 100
    const updated = {
      ...gameLayoutRef.current[orientation],
      [selectedKey]: {
        ...gameLayoutRef.current[orientation][selectedKey],
        scale: roundedScale,
      },
    }
    setGameLayout((prev) => ({
      ...prev,
      [orientation]: updated,
    }))
    autoSaveLayout(updated)
  }

  const handleResetSelected = () => {
    if (!selectedKey) return
    const defaultItem = DEFAULT_TOUCH_LAYOUT[orientation][selectedKey]
    const updated = {
      ...gameLayoutRef.current[orientation],
      [selectedKey]: { ...defaultItem },
    }
    setGameLayout((prev) => ({
      ...prev,
      [orientation]: updated,
    }))
    triggerHaptic(10)
    autoSaveLayout(updated)
  }

  const handleResetAll = () => {
    const defaultOrientationLayout = { ...DEFAULT_TOUCH_LAYOUT[orientation] }
    setGameLayout((prev) => ({
      ...prev,
      [orientation]: defaultOrientationLayout,
    }))
    triggerHaptic(15)
    autoSaveLayout(defaultOrientationLayout)
  }

  const handleDone = () => {
    autoSaveLayout(gameLayoutRef.current[orientation])
    setInternalIsCustomizing(false)
    onDoneCustomizing?.()
    triggerHaptic(15)
  }

  if (!visible) return null

  // Fullscreen toggle button - icon only (no text labels)
  const renderFullscreenButton = () => {
    if (!onToggleFullscreen) return null
    return (
      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        className={cn(
          "size-8 flex items-center justify-center rounded-full border text-xs font-semibold active:scale-95 transition-transform cursor-pointer shadow-sm select-none",
          isFullscreen
            ? "bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900/70"
            : "bg-zinc-900/90 border-zinc-700 text-blue-400 hover:bg-zinc-800",
        )}
      >
        {isFullscreen ? (
          <Minimize2Icon className="size-4 text-amber-400 shrink-0" />
        ) : (
          <Maximize2Icon className="size-4 text-blue-400 shrink-0" />
        )}
      </button>
    )
  }

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      className={cn(
        "relative select-none touch-none overflow-hidden",
        isPortrait
          ? "size-full flex flex-col bg-zinc-950 border-t border-zinc-800"
          : "pointer-events-none absolute inset-0 z-30",
        isCustomizing && "ring-1 ring-inset ring-blue-500/40 bg-zinc-950/90",
      )}
      style={{ touchAction: "none" }}
    >
      {/* Customization Toolbar HUD */}
      {isCustomizing && (
        <TouchControlsEditorBar
          orientation={orientation}
          gameTitle={game?.title}
          selectedKey={selectedKey}
          currentScale={selectedKey ? currentLayout[selectedKey].scale : 1.0}
          onScaleChange={handleScaleChange}
          onResetSelected={handleResetSelected}
          onResetAll={handleResetAll}
          onDone={handleDone}
          saveStatus={saveStatus}
        />
      )}

      {/* Top Utility Bar (Portrait) */}
      {isPortrait && !isCustomizing && (
        <div className="flex items-center justify-between w-full px-3 pt-2 z-20 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold active:scale-95 transition-transform cursor-pointer shadow-sm select-none"
            >
              <SlidersIcon className="size-3.5 text-blue-400" />
              <span>MENU</span>
            </button>
            <span className="text-[10px] text-zinc-400 font-mono tracking-tight hidden xs:inline">
              Saves, Shaders & Controls
            </span>
          </div>

          <div className="flex items-center gap-2">
            {renderFullscreenButton()}
          </div>
        </div>
      )}

      {/* Top Utility Bar (Landscape) */}
      {!isPortrait && !isCustomizing && (
        <div className="pointer-events-auto absolute top-2 inset-x-0 flex items-center justify-between px-3 sm:px-6 pt-[env(safe-area-inset-top,0px)] z-40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold active:scale-95 transition-transform cursor-pointer shadow-md select-none"
            >
              <SlidersIcon className="size-3.5 text-blue-400" />
              <span>MENU</span>
            </button>
            <span className="text-[10px] text-zinc-400 font-mono hidden md:inline">
              In-Game Menu (Saves, CRT, Layout)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {gamepadConnected ? (
              <button
                type="button"
                onClick={() => setShowOverride(false)}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-zinc-900 text-white/70 border border-zinc-700 cursor-pointer"
              >
                Gamepad: Select + Start for Menu
              </button>
            ) : null}

            {renderFullscreenButton()}
          </div>
        </div>
      )}

      {/* Subtle guide grid in customization mode */}
      {isCustomizing && (
        <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* CUSTOMIZABLE BUTTONS (Positioned via percentage coordinates)           */}
      {/* --------------------------------------------------------------------- */}

      {/* 1. D-PAD */}
      <div
        style={{
          left: `${currentLayout.dpad.x}%`,
          top: `${currentLayout.dpad.y}%`,
          transform: `translate(-50%, -50%) scale(${currentLayout.dpad.scale})`,
          touchAction: "none",
        }}
        className={cn(
          "absolute pointer-events-auto select-none touch-none",
          isCustomizing && "cursor-grab active:cursor-grabbing z-30",
        )}
        onPointerDown={(e) => handleElementPointerDown("dpad", e)}
        onPointerMove={(e) => handleElementPointerMove("dpad", e)}
        onPointerUp={(e) => handleElementPointerUp("dpad", e)}
        onPointerCancel={(e) => handleElementPointerUp("dpad", e)}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {isCustomizing && (
          <div
            className={cn(
              "absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight pointer-events-none select-none z-20 shadow-sm",
              selectedKey === "dpad"
                ? "bg-blue-600 text-white border border-blue-400"
                : "bg-zinc-900/90 text-zinc-300 border border-zinc-700",
            )}
          >
            D-PAD
          </div>
        )}

        <div
          className={cn(
            "transition-all",
            isCustomizing && selectedKey === "dpad" && "ring-2 ring-blue-400 ring-offset-2 ring-offset-black rounded-xl",
            isCustomizing && selectedKey !== "dpad" && "ring-1 ring-dashed ring-zinc-500 rounded-xl",
          )}
        >
          <MobileDpad
            pressDown={pressDown}
            pressUp={pressUp}
            disabled={isCustomizing}
          />
        </div>
      </div>

      {/* 2. NES BUTTON A */}
      <TouchActionButton
        type="a"
        pos={currentLayout.a}
        isCustomizing={isCustomizing}
        isSelected={selectedKey === "a"}
        isPressed={activeButtons.has("a")}
        onPointerDown={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerDown("a", e)
          else handleButtonDown("a", "a", e)
        }}
        onPointerMove={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerMove("a", e)
        }}
        onPointerUp={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("a", e)
          else handleButtonUp("a", "a", e)
        }}
        onPointerCancel={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("a", e)
          else handleButtonUp("a", "a", e)
        }}
      />

      {/* 3. NES BUTTON B */}
      <TouchActionButton
        type="b"
        pos={currentLayout.b}
        isCustomizing={isCustomizing}
        isSelected={selectedKey === "b"}
        isPressed={activeButtons.has("b")}
        onPointerDown={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerDown("b", e)
          else handleButtonDown("b", "b", e)
        }}
        onPointerMove={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerMove("b", e)
        }}
        onPointerUp={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("b", e)
          else handleButtonUp("b", "b", e)
        }}
        onPointerCancel={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("b", e)
          else handleButtonUp("b", "b", e)
        }}
      />

      {/* 4. TURBO A */}
      <TouchActionButton
        type="turboA"
        pos={currentLayout.turboA}
        isCustomizing={isCustomizing}
        isSelected={selectedKey === "turboA"}
        isPressed={activeButtons.has("turboA")}
        onPointerDown={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerDown("turboA", e)
          else handleButtonDown("x", "turboA", e)
        }}
        onPointerMove={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerMove("turboA", e)
        }}
        onPointerUp={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("turboA", e)
          else handleButtonUp("x", "turboA", e)
        }}
        onPointerCancel={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("turboA", e)
          else handleButtonUp("x", "turboA", e)
        }}
      />

      {/* 5. TURBO B */}
      <TouchActionButton
        type="turboB"
        pos={currentLayout.turboB}
        isCustomizing={isCustomizing}
        isSelected={selectedKey === "turboB"}
        isPressed={activeButtons.has("turboB")}
        onPointerDown={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerDown("turboB", e)
          else handleButtonDown("y", "turboB", e)
        }}
        onPointerMove={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerMove("turboB", e)
        }}
        onPointerUp={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("turboB", e)
          else handleButtonUp("y", "turboB", e)
        }}
        onPointerCancel={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("turboB", e)
          else handleButtonUp("y", "turboB", e)
        }}
      />

      {/* 6. SELECT */}
      <TouchSystemButton
        type="select"
        pos={currentLayout.select}
        isCustomizing={isCustomizing}
        isSelected={selectedKey === "select"}
        isPressed={activeButtons.has("select")}
        onPointerDown={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerDown("select", e)
          else handleButtonDown("select", "select", e)
        }}
        onPointerMove={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerMove("select", e)
        }}
        onPointerUp={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("select", e)
          else handleButtonUp("select", "select", e)
        }}
        onPointerCancel={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("select", e)
          else handleButtonUp("select", "select", e)
        }}
      />

      {/* 7. START */}
      <TouchSystemButton
        type="start"
        pos={currentLayout.start}
        isCustomizing={isCustomizing}
        isSelected={selectedKey === "start"}
        isPressed={activeButtons.has("start")}
        onPointerDown={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerDown("start", e)
          else handleButtonDown("start", "start", e)
        }}
        onPointerMove={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerMove("start", e)
        }}
        onPointerUp={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("start", e)
          else handleButtonUp("start", "start", e)
        }}
        onPointerCancel={(e: React.PointerEvent) => {
          if (isCustomizing) handleElementPointerUp("start", e)
          else handleButtonUp("start", "start", e)
        }}
      />

      {/* In-Game Menu Tip Footer for On-Screen Controls */}
      {isPortrait && !isCustomizing && (
        <div className="absolute bottom-1 inset-x-0 flex items-center justify-center pointer-events-none select-none px-4 z-10">
          <span className="text-[10px] font-mono text-zinc-400/80 bg-zinc-950/80 px-2.5 py-0.5 rounded-full border border-zinc-800/80 backdrop-blur-sm shadow-sm">
            Tip: Tap <strong className="text-blue-400 font-bold">MENU</strong> above for Save States, CRT Filters & Layout
          </span>
        </div>
      )}
    </div>
  )
}
