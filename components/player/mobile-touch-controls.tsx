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
import { useTouchInputEngine } from "./touch-controls/use-touch-input-engine"
import type { DragState, MobileTouchControlsProps } from "./touch-controls/types"
import { cn } from "@/lib/utils"

/**
 * On-screen NES controller.
 *
 * During play, all input goes through the TouchInputEngine attached to the
 * controls layer (see touch-controls/touch-input-engine.ts): native pointer
 * listeners, multi-touch, sliding between buttons, no React re-renders and no
 * focusable elements. React only renders the layout and runs the layout
 * editor (drag to move, scale), which is active while `isCustomizing`.
 */
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
  const layerRef = useRef<HTMLDivElement>(null)

  // Layout storage state per game
  const [prevGameKey, setPrevGameKey] = useState(gameKey)
  const [gameLayout, setGameLayout] = useState<GameTouchLayout>(() => getTouchLayout(gameKey))
  const [internalIsCustomizing, setInternalIsCustomizing] = useState(false)
  const isCustomizing = propIsCustomizing !== undefined ? propIsCustomizing : internalIsCustomizing
  const [selectedKey, setSelectedKey] = useState<TouchElementKey | null>("dpad")
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const gameLayoutRef = useRef(gameLayout)

  useEffect(() => {
    gameLayoutRef.current = gameLayout
  }, [gameLayout])

  // Reload layout when game changes
  if (prevGameKey !== gameKey) {
    setPrevGameKey(gameKey)
    const loaded = getTouchLayout(gameKey)
    setGameLayout(loaded)
  }

  // Current active orientation layout
  const currentLayout = gameLayout[orientation]

  // Gamepad override state
  const [showOverride, setShowOverride] = useState<boolean | null>(null)
  const visible = showOverride !== null ? showOverride : !gamepadConnected

  useTouchInputEngine({
    layerRef,
    enabled: visible && !isCustomizing,
    pressDown,
    pressUp,
    layoutKey: currentLayout,
  })

  // Hide touch controls if gamepad input detected
  useEffect(() => {
    if (!visible || !gamepadConnected || isCustomizing) return

    const pollGamepad = () => {
      if (typeof navigator === "undefined" || !("getGamepads" in navigator)) return
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

    // A frame-rate poll here runs on the same thread as the emulator and hitches it.
    const intervalId = window.setInterval(pollGamepad, 250)
    return () => window.clearInterval(intervalId)
  }, [visible, gamepadConnected, isCustomizing])

  // Global screen tap restores controls if hidden by gamepad
  useEffect(() => {
    if (visible) return
    const handleScreenTap = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.pointerType === "pen" || e.pointerType === "mouse") {
        setShowOverride(true)
      }
    }

    window.addEventListener("pointerdown", handleScreenTap, { passive: true })
    return () => window.removeEventListener("pointerdown", handleScreenTap)
  }, [visible])

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
    autoSaveLayout(updated)
  }

  const handleResetAll = () => {
    const defaultOrientationLayout = { ...DEFAULT_TOUCH_LAYOUT[orientation] }
    setGameLayout((prev) => ({
      ...prev,
      [orientation]: defaultOrientationLayout,
    }))
    autoSaveLayout(defaultOrientationLayout)
  }

  const handleDone = () => {
    autoSaveLayout(gameLayoutRef.current[orientation])
    setInternalIsCustomizing(false)
    onDoneCustomizing?.()
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
          ? "size-full flex flex-col bg-zinc-950 border-t border-zinc-800 [transform:translateZ(0)]"
          : "pointer-events-none absolute inset-0 z-30 [transform:translateZ(0)]",
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
      {/* CONTROLS LAYER: the TouchInputEngine listens here during play.        */}
      {/* Elements are positioned via percentage coordinates of this layer.     */}
      {/* --------------------------------------------------------------------- */}
      <div
        ref={layerRef}
        role="group"
        aria-label="On-screen NES controller"
        className="absolute inset-0 pointer-events-none select-none touch-none"
        style={{ touchAction: "none" }}
      >
        {/* 1. D-PAD */}
        <div
          style={{
            left: `${currentLayout.dpad.x}%`,
            top: `${currentLayout.dpad.y}%`,
            transform: `translate3d(-50%, -50%, 0) scale(${currentLayout.dpad.scale})`,
            touchAction: "none",
          }}
          className={cn(
            "absolute pointer-events-auto select-none touch-none",
            isCustomizing && "cursor-grab active:cursor-grabbing z-30",
          )}
          onPointerDown={isCustomizing ? (e) => handleElementPointerDown("dpad", e) : undefined}
          onPointerMove={isCustomizing ? (e) => handleElementPointerMove("dpad", e) : undefined}
          onPointerUp={isCustomizing ? (e) => handleElementPointerUp("dpad", e) : undefined}
          onPointerCancel={isCustomizing ? (e) => handleElementPointerUp("dpad", e) : undefined}
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
              isCustomizing && "transition-all",
              isCustomizing && selectedKey === "dpad" && "ring-2 ring-blue-400 ring-offset-2 ring-offset-black rounded-xl",
              isCustomizing && selectedKey !== "dpad" && "ring-1 ring-dashed ring-zinc-500 rounded-xl",
            )}
          >
            <MobileDpad />
          </div>
        </div>

        {/* 2. NES BUTTON A */}
        <TouchActionButton
          type="a"
          pos={currentLayout.a}
          isCustomizing={isCustomizing}
          isSelected={selectedKey === "a"}
          onPointerDown={isCustomizing ? (e) => handleElementPointerDown("a", e) : undefined}
          onPointerMove={isCustomizing ? (e) => handleElementPointerMove("a", e) : undefined}
          onPointerUp={isCustomizing ? (e) => handleElementPointerUp("a", e) : undefined}
          onPointerCancel={isCustomizing ? (e) => handleElementPointerUp("a", e) : undefined}
        />

        {/* 3. NES BUTTON B */}
        <TouchActionButton
          type="b"
          pos={currentLayout.b}
          isCustomizing={isCustomizing}
          isSelected={selectedKey === "b"}
          onPointerDown={isCustomizing ? (e) => handleElementPointerDown("b", e) : undefined}
          onPointerMove={isCustomizing ? (e) => handleElementPointerMove("b", e) : undefined}
          onPointerUp={isCustomizing ? (e) => handleElementPointerUp("b", e) : undefined}
          onPointerCancel={isCustomizing ? (e) => handleElementPointerUp("b", e) : undefined}
        />

        {/* 4. TURBO A */}
        <TouchActionButton
          type="turboA"
          pos={currentLayout.turboA}
          isCustomizing={isCustomizing}
          isSelected={selectedKey === "turboA"}
          onPointerDown={isCustomizing ? (e) => handleElementPointerDown("turboA", e) : undefined}
          onPointerMove={isCustomizing ? (e) => handleElementPointerMove("turboA", e) : undefined}
          onPointerUp={isCustomizing ? (e) => handleElementPointerUp("turboA", e) : undefined}
          onPointerCancel={isCustomizing ? (e) => handleElementPointerUp("turboA", e) : undefined}
        />

        {/* 5. TURBO B */}
        <TouchActionButton
          type="turboB"
          pos={currentLayout.turboB}
          isCustomizing={isCustomizing}
          isSelected={selectedKey === "turboB"}
          onPointerDown={isCustomizing ? (e) => handleElementPointerDown("turboB", e) : undefined}
          onPointerMove={isCustomizing ? (e) => handleElementPointerMove("turboB", e) : undefined}
          onPointerUp={isCustomizing ? (e) => handleElementPointerUp("turboB", e) : undefined}
          onPointerCancel={isCustomizing ? (e) => handleElementPointerUp("turboB", e) : undefined}
        />

        {/* 6. SELECT */}
        <TouchSystemButton
          type="select"
          pos={currentLayout.select}
          isCustomizing={isCustomizing}
          isSelected={selectedKey === "select"}
          onPointerDown={isCustomizing ? (e) => handleElementPointerDown("select", e) : undefined}
          onPointerMove={isCustomizing ? (e) => handleElementPointerMove("select", e) : undefined}
          onPointerUp={isCustomizing ? (e) => handleElementPointerUp("select", e) : undefined}
          onPointerCancel={isCustomizing ? (e) => handleElementPointerUp("select", e) : undefined}
        />

        {/* 7. START */}
        <TouchSystemButton
          type="start"
          pos={currentLayout.start}
          isCustomizing={isCustomizing}
          isSelected={selectedKey === "start"}
          onPointerDown={isCustomizing ? (e) => handleElementPointerDown("start", e) : undefined}
          onPointerMove={isCustomizing ? (e) => handleElementPointerMove("start", e) : undefined}
          onPointerUp={isCustomizing ? (e) => handleElementPointerUp("start", e) : undefined}
          onPointerCancel={isCustomizing ? (e) => handleElementPointerUp("start", e) : undefined}
        />
      </div>

      {/* In-Game Menu Tip Footer for On-Screen Controls */}
      {isPortrait && !isCustomizing && (
        <div className="absolute bottom-1 inset-x-0 flex items-center justify-center pointer-events-none select-none px-4 z-10">
          <span className="text-[10px] font-mono text-zinc-400/80 bg-zinc-950/80 px-2.5 py-0.5 rounded-full border border-zinc-800/80 shadow-sm">
            Tip: Tap <strong className="text-blue-400 font-bold">MENU</strong> above for Save States, CRT Filters & Layout
          </span>
        </div>
      )}
    </div>
  )
}
