"use client"

import { useEffect, useRef, useState } from "react"
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
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import {
  GAMEPAD_LIBRARY_CONTROLS,
  GAMEPAD_NES_CONTROLS,
  KEYBOARD_LIBRARY_CONTROLS,
  KEYBOARD_NES_CONTROLS,
  type ControlItem,
} from "@/components/controls-data"
import { GamepadDispatcher } from "@/lib/gamepad/gamepad-dispatcher"
import { cn } from "@/lib/utils"

type ControlsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ControlRow = ({ label, keys, detail }: ControlItem) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="flex flex-col">
      <span className="text-sm font-medium">{label}</span>
      {detail ? <span className="text-[11px] text-muted-foreground">{detail}</span> : null}
    </div>
    <span className="flex items-center gap-1.5 shrink-0">
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </span>
  </div>
)

export const ControlsDialog = ({ open, onOpenChange }: ControlsDialogProps) => {
  const [tab, setTab] = useState<"gamepad" | "keyboard">("gamepad")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Gamepad navigation for modal: D-Pad / Stick scrolls, LB/RB or Left/Right switches tabs, B/Y closes
  useEffect(() => {
    if (!open) return

    const dispatcher = new GamepadDispatcher((action) => {
      if (action === "NAV_UP") scrollRef.current?.scrollBy({ top: -70, behavior: "smooth" })
      else if (action === "NAV_DOWN") scrollRef.current?.scrollBy({ top: 70, behavior: "smooth" })
      else if (action === "NAV_LEFT" || action === "PAGE_UP") setTab("gamepad")
      else if (action === "NAV_RIGHT" || action === "PAGE_DOWN") setTab("keyboard")
      else if (action === "CANCEL" || action === "TOGGLE_CONTROLS") onOpenChange(false)
    })

    dispatcher.start()
    return () => dispatcher.stop()
  }, [open, onOpenChange])

  // Keyboard Left / Right arrow navigation between tabs
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setTab("gamepad")
      else if (e.key === "ArrowRight") setTab("keyboard")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="lg" />}>
        Controls
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden sm:max-w-md ring-1 ring-white/10 shadow-2xl">
        {/* Modal Header & Tabs (Pinned at top) */}
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

          {/* Tab Switcher */}
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-foreground/5 p-1 border border-foreground/10">
            <button
              type="button"
              onClick={() => setTab("gamepad")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-all",
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
              onClick={() => setTab("keyboard")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-all",
                tab === "keyboard"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <KeyboardIcon className="size-4" />
              Keyboard
            </button>
          </div>
        </div>

        {/* Scrollable Content Body (Rest is scrollable within max-h-[90dvh]) */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 overscroll-contain focus:outline-none"
        >
          {tab === "gamepad" ? (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Library Navigation
              </p>
              {GAMEPAD_LIBRARY_CONTROLS.map((ctrl) => (
                <ControlRow key={ctrl.label} {...ctrl} />
              ))}

              <Separator className="my-1" />

              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                In-Game NES Layout
              </p>
              {GAMEPAD_NES_CONTROLS.map((ctrl) => (
                <ControlRow key={ctrl.label} {...ctrl} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Library Navigation
              </p>
              {KEYBOARD_LIBRARY_CONTROLS.map((ctrl) => (
                <ControlRow key={ctrl.label} {...ctrl} />
              ))}

              <Separator className="my-1" />

              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                In-Game NES Layout
              </p>
              {KEYBOARD_NES_CONTROLS.map((ctrl) => (
                <ControlRow key={ctrl.label} {...ctrl} />
              ))}
            </div>
          )}
        </div>

        {/* Gamepad & Keyboard Navigation Hints */}
        <div className="shrink-0 flex items-center justify-between border-t border-border/50 px-5 py-2.5 bg-muted/20 text-xs text-muted-foreground select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Kbd className="text-[10px]">LB/RB</Kbd>
              <span>Tabs</span>
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1">
              <Kbd className="text-[10px]">D-Pad ↑↓</Kbd>
              <span>Scroll</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Kbd className="text-[10px]">B / Y</Kbd>
            <Kbd className="text-[10px]">Esc</Kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
