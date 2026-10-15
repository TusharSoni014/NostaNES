"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Gamepad2Icon, KeyboardIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Kbd, GamepadKey, KeyBadge } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import {
  GAMEPAD_LIBRARY_CONTROLS,
  GAMEPAD_NES_CONTROLS,
  KEYBOARD_LIBRARY_CONTROLS,
  KEYBOARD_NES_CONTROLS,
  KEYBOARD_P2_CONTROLS,
  type ControlItem,
} from "@/components/controls-data"
import { GamepadDispatcher } from "@/lib/gamepad/gamepad-dispatcher"
import { useInputMode } from "@/hooks/use-input-mode"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { playUiSound } from "@/lib/ui-sounds"
import { cn } from "@/lib/utils"

type ControlsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ControlRow = ({
  label,
  keys,
  detail,
  mode,
}: ControlItem & { mode: "gamepad" | "keyboard" }) => (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <div className="flex flex-col">
      <span className="text-sm font-medium">{label}</span>
      {detail ? <span className="text-[11px] text-muted-foreground">{detail}</span> : null}
    </div>
    <span className="flex items-center gap-1.5 shrink-0">
      {keys.map((key) => (
        <KeyBadge key={key} combo={key} mode={mode} />
      ))}
    </span>
  </div>
)

export const ControlsDialog = ({ open, onOpenChange }: ControlsDialogProps) => {
  const inputMode = useInputMode()
  const [tab, setTab] = useState<"gamepad" | "keyboard">(inputMode)
  const [prevOpen, setPrevOpen] = useState(open)
  const scrollRef = useRef<HTMLDivElement>(null)

  if (open && !prevOpen) {
    setPrevOpen(true)
    setTab(inputMode)
  } else if (!open && prevOpen) {
    setPrevOpen(false)
  }

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next !== open) playUiSound(next ? "option_selected" : "back_cancel")
      onOpenChange(next)
    },
    [open, onOpenChange],
  )

  const chooseTab = useCallback((next: "gamepad" | "keyboard") => {
    setTab((prev) => {
      if (prev === next) return prev
      playUiSound("navigation")
      return next
    })
  }, [])

  const scrollBody = useCallback((amount: number) => {
    const el = scrollRef.current
    if (!el) return
    const canScrollUp = amount < 0 && el.scrollTop > 0
    const canScrollDown = amount > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 2
    if (canScrollUp || canScrollDown) {
      playUiSound("navigation")
      el.scrollBy({ top: amount, behavior: "smooth" })
    }
  }, [])

  // Gamepad navigation for modal: D-Pad / Stick scrolls, LB/RB or Left/Right switches tabs, B/Y closes
  useEffect(() => {
    if (!open) return

    const dispatcher = new GamepadDispatcher((action) => {
      if (action === "NAV_UP") scrollBody(-70)
      else if (action === "NAV_DOWN") scrollBody(70)
      else if (action === "NAV_LEFT" || action === "PAGE_UP") chooseTab("gamepad")
      else if (action === "NAV_RIGHT" || action === "PAGE_DOWN") chooseTab("keyboard")
      else if (action === "CANCEL" || action === "TOGGLE_CONTROLS") handleOpenChange(false)
    })

    dispatcher.start()
    return () => dispatcher.stop()
  }, [chooseTab, handleOpenChange, open, scrollBody])

  // Keyboard navigation for dialog
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") chooseTab("gamepad")
      else if (e.key === "ArrowRight") chooseTab("keyboard")
      else if (e.key === "ArrowUp") { e.preventDefault(); scrollBody(-70) }
      else if (e.key === "ArrowDown") { e.preventDefault(); scrollBody(70) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [chooseTab, open, scrollBody])

  const isMobile = useIsMobile()
  const libraryControls = tab === "gamepad" ? GAMEPAD_LIBRARY_CONTROLS : KEYBOARD_LIBRARY_CONTROLS
  const nesControls = tab === "gamepad" ? GAMEPAD_NES_CONTROLS : KEYBOARD_NES_CONTROLS

  const tabSelector = (
    <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-foreground/5 p-1 border border-foreground/10">
      <button
        type="button"
        onClick={() => chooseTab("gamepad")}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-all cursor-pointer",
          tab === "gamepad"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Gamepad2Icon className="size-4" />
        Gamepad
      </button>
      <button
        type="button"
        onClick={() => chooseTab("keyboard")}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-all cursor-pointer",
          tab === "keyboard"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <KeyboardIcon className="size-4" />
        Keyboard
      </button>
    </div>
  )

  const controlsBody = (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
        Library Navigation
      </p>
      {libraryControls.map((ctrl) => (
        <ControlRow key={ctrl.label} {...ctrl} mode={tab} />
      ))}

      <Separator className="my-1" />

      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
        In-Game NES Layout
      </p>
      {nesControls.map((ctrl) => (
        <ControlRow key={ctrl.label} {...ctrl} mode={tab} />
      ))}

      {tab === "keyboard" ? (
        <>
          <Separator className="my-1" />
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Player 2 Keyboard
          </p>
          {KEYBOARD_P2_CONTROLS.map((ctrl) => (
            <ControlRow key={ctrl.label} {...ctrl} mode={tab} />
          ))}
        </>
      ) : null}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
        <DrawerTrigger render={<Button variant="outline" size="lg" />}>
          Controls
        </DrawerTrigger>
        <DrawerContent className="max-h-[85dvh] flex flex-col p-0 gap-0 overflow-hidden bg-background text-foreground border-t border-border/80">
          <DrawerHeader className="shrink-0 p-5 pb-3 border-b border-border/50 text-left">
            <div className="flex items-center gap-2.5">
              <Image
                src="/nostanes.png"
                alt="NostaNES"
                width={28}
                height={28}
                className="h-7 w-auto object-contain shrink-0 select-none"
              />
              <DrawerTitle className="text-base font-bold tracking-tight">
                Controls & Gamepad Support
              </DrawerTitle>
            </div>
            <DrawerDescription className="text-xs text-muted-foreground">
              Seamless native support for touch, gamepad, and keyboards.
            </DrawerDescription>
            {tabSelector}
          </DrawerHeader>

          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 overscroll-contain focus:outline-none"
          >
            {controlsBody}
          </div>

          <DrawerFooter className="p-3 border-t border-border/50 bg-muted/20">
            <DrawerClose
              render={
                <Button
                  variant="outline"
                  className="w-full h-10 cursor-pointer"
                />
              }
            >
              Close
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger render={<Button variant="outline" size="lg" />}>
        Controls
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden sm:max-w-md ring-1 ring-white/10 shadow-2xl">
        <div className="shrink-0 p-5 pb-3 border-b border-border/50">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <Image
                src="/nostanes.png"
                alt="NostaNES"
                width={28}
                height={28}
                className="h-7 w-auto object-contain shrink-0 select-none"
              />
              <DialogTitle>Controls & Gamepad Support</DialogTitle>
            </div>
            <DialogDescription>
              Seamless native support for Xbox, PlayStation, Switch, and keyboards.
            </DialogDescription>
          </DialogHeader>

          {tabSelector}
        </div>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 overscroll-contain focus:outline-none"
        >
          {controlsBody}
        </div>

        <div className="shrink-0 flex items-center justify-between border-t border-border/50 px-5 py-2.5 bg-muted/20 text-xs text-muted-foreground select-none">
          {inputMode === "gamepad" ? (
            <>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <GamepadKey button="LB" size="sm" />
                  <span className="text-muted-foreground/40 text-[10px]">/</span>
                  <GamepadKey button="RB" size="sm" />
                  <span className="text-xs">Tabs</span>
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span className="flex items-center gap-1.5">
                  <GamepadKey button="D-Pad" size="sm" />
                  <span className="text-xs">Scroll</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <GamepadKey button="B" size="sm" />
                <span className="text-muted-foreground/40 text-[10px]">/</span>
                <GamepadKey button="Y" size="sm" />
                <span className="text-xs">Close</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1">
                    <Kbd size="sm">←</Kbd>
                    <Kbd size="sm">→</Kbd>
                  </span>
                  <span className="text-xs">Tabs</span>
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1">
                    <Kbd size="sm">↑</Kbd>
                    <Kbd size="sm">↓</Kbd>
                  </span>
                  <span className="text-xs">Scroll</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Kbd size="sm">Esc</Kbd>
                <span className="text-xs">Close</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
