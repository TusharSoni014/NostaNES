"use client"

import { useState } from "react"
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
import { cn } from "@/lib/utils"

type ControlsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ControlRow = ({
  label,
  keys,
  detail,
}: {
  label: string
  keys: string[]
  detail?: string
}) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="flex flex-col">
      <span className="text-sm font-medium">{label}</span>
      {detail ? (
        <span className="text-[11px] text-muted-foreground">{detail}</span>
      ) : null}
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="lg" />}>
        Controls
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Controls & Gamepad Support</DialogTitle>
          <DialogDescription>
            Seamless native support for Xbox, PlayStation, Switch, and keyboards.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-foreground/5 p-1 border border-foreground/10">
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

        {tab === "gamepad" ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Library Navigation
            </p>
            <ControlRow label="Scroll Cartridges" keys={["D-Pad", "L-Stick"]} />
            <ControlRow label="Jump 10 Games" keys={["LB", "RB"]} detail="Page up / down" />
            <ControlRow label="Start Game" keys={["A", "✕"]} detail="Launch cartridge" />
            <ControlRow label="Toggle Controls" keys={["Y", "△"]} />

            <Separator className="my-1" />

            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              In-Game NES Layout
            </p>
            <ControlRow label="D-Pad / Movement" keys={["D-Pad", "L-Stick"]} />
            <ControlRow label="NES B (Run / Attack)" keys={["A", "✕"]} detail="Standard B" />
            <ControlRow label="NES A (Jump / Action)" keys={["B", "○"]} detail="Standard A" />
            <ControlRow label="Turbo B (Rapid-fire)" keys={["X", "□"]} detail="Turbo B" />
            <ControlRow label="Turbo A (Rapid-fire)" keys={["Y", "△"]} detail="Turbo A" />
            <ControlRow label="Start" keys={["Menu", "Options"]} />
            <ControlRow label="Select" keys={["View", "Share"]} />
            <ControlRow label="Hold to Exit (5s)" keys={["Select"]} detail="Hold 5s to leave" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Library Navigation
            </p>
            <ControlRow label="Scroll Cartridges" keys={["↑", "↓"]} />
            <ControlRow label="Start Game" keys={["Enter"]} />

            <Separator className="my-1" />

            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              In-Game NES Layout
            </p>
            <ControlRow label="D-Pad" keys={["Arrows"]} />
            <ControlRow label="NES B button" keys={["Z"]} detail="Standard B" />
            <ControlRow label="NES A button" keys={["X"]} detail="Standard A" />
            <ControlRow label="Turbo B button" keys={["A"]} detail="Rapid-fire B" />
            <ControlRow label="Turbo A button" keys={["S"]} detail="Rapid-fire A" />
            <ControlRow label="Start" keys={["Enter"]} />
            <ControlRow label="Select" keys={["Shift"]} />
            <ControlRow label="Fullscreen" keys={["F"]} />
            <ControlRow label="Pause / Exit" keys={["Esc"]} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
