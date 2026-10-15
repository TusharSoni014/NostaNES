"use client"

import { Gamepad2Icon, KeyboardIcon, XIcon } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Kbd, GamepadKey } from "@/components/ui/kbd"
import { useInputMode } from "@/hooks/use-input-mode"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { ACTION_LABELS, type NesActionKey, type PlayerSlot } from "@/lib/storage/controls-storage"
import { playUiSound } from "@/lib/ui-sounds"

type ControlRebindDialogProps = {
  actionKey: NesActionKey | null
  activeTab: "keyboard" | "gamepad"
  player: PlayerSlot
  onCancel: () => void
}

export function ControlRebindDialog({
  actionKey,
  activeTab,
  player,
  onCancel,
}: ControlRebindDialogProps) {
  const isMobile = useIsMobile()
  const inputMode = useInputMode()
  if (!actionKey) return null

  const { label, desc } = ACTION_LABELS[actionKey]

  const cancel = () => {
    playUiSound("back_cancel")
    onCancel()
  }

  if (isMobile) {
    return (
      <Drawer
        open={Boolean(actionKey)}
        onOpenChange={(next) => {
          if (!next) cancel()
        }}
        showSwipeHandle
      >
        <DrawerContent className="p-4 bg-zinc-950 text-white border-t border-blue-500/40 max-h-[85dvh] overflow-y-auto">
          <DrawerHeader className="text-center items-center pb-2">
            <div className="relative mx-auto flex size-12 items-center justify-center rounded-2xl border border-blue-400/40 bg-blue-500/10 text-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.25)] mb-2">
              {activeTab === "gamepad" ? (
                <Gamepad2Icon className="size-6 animate-pulse" />
              ) : (
                <KeyboardIcon className="size-6 animate-pulse" />
              )}
            </div>
            <DrawerTitle className="text-base font-bold text-white tracking-tight">
              Rebind Player {player}: {label}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-white/60">
              {desc}
            </DrawerDescription>
          </DrawerHeader>

          <div className="my-2 rounded-xl border border-blue-400/30 bg-blue-500/5 p-3 flex flex-col items-center gap-1.5 text-center">
            <p className="text-xs font-semibold text-blue-300 animate-pulse">
              {activeTab === "gamepad"
                ? player === 2
                  ? "Press a button on controller 2..."
                  : "Press a button on controller 1..."
                : player === 2
                  ? "Press a key on the number pad..."
                  : "Press any key on your keyboard..."}
            </p>
            <p className="text-[11px] text-white/40">
              {activeTab === "keyboard"
                ? "Taken off every other action, including the other player."
                : "Taken off every other action on this player."}
            </p>
          </div>

          <DrawerFooter className="pt-2">
            <DrawerClose
              render={
                <Button
                  variant="outline"
                  className="w-full h-10 border-white/15 text-white hover:bg-white/10 cursor-pointer"
                />
              }
            >
              Cancel
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Rebind ${label}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative w-full max-w-sm rounded-2xl border border-blue-500/40 bg-zinc-950 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9)] ring-1 ring-blue-500/20"
      >
        <button
          type="button"
          onClick={cancel}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          aria-label="Cancel rebinding"
        >
          <XIcon className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-blue-400/40 bg-blue-500/10 text-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.25)]">
            {activeTab === "gamepad" ? (
              <Gamepad2Icon className="size-7 animate-pulse" />
            ) : (
              <KeyboardIcon className="size-7 animate-pulse" />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-base font-bold text-white tracking-tight">
              Rebind Player {player}: {label}
            </h4>
            <p className="text-xs text-white/60">{desc}</p>
          </div>

          <div className="w-full my-2 rounded-xl border border-blue-400/30 bg-blue-500/5 p-3.5 flex flex-col items-center gap-1.5">
            <p className="text-xs font-semibold text-blue-300 animate-pulse">
              {activeTab === "gamepad"
                ? player === 2
                  ? "Press a button on the second controller..."
                  : "Press a button on the first controller..."
                : player === 2
                  ? "Press a key. Player 2 defaults are on the number pad."
                  : "Press any key on your keyboard..."}
            </p>
            <p className="text-[11px] text-white/40">
              {activeTab === "keyboard"
                ? "Taken off every other action, including the other player."
                : "Taken off every other action on this player."}
            </p>
          </div>

          <div className="flex w-full items-center justify-between pt-2 border-t border-white/10 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              {inputMode === "gamepad" ? (
                <GamepadKey button="B" size="sm" />
              ) : (
                <Kbd size="sm">Esc</Kbd>
              )}
              <span>to Cancel</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancel}
              className="text-xs h-8 text-white/70 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
