"use client"

import {
  DownloadIcon,
  Gamepad2Icon,
  LogOutIcon,
  PlayIcon,
  RotateCcwIcon,
  TvIcon,
  UploadIcon,
  Wand2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { InGameMenuTab } from "./types"

type MenuItem = {
  id: InGameMenuTab
  label: string
  subtitle: string
  icon: typeof PlayIcon
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "resume",
    label: "Resume Game",
    subtitle: "Return to gameplay",
    icon: PlayIcon,
  },
  {
    id: "save",
    label: "Save State",
    subtitle: "Save progress to browser storage",
    icon: DownloadIcon,
  },
  {
    id: "load",
    label: "Load State",
    subtitle: "Restore previous game save",
    icon: UploadIcon,
  },
  {
    id: "shaders",
    label: "Shaders & Display",
    subtitle: "CRT scanlines, arcade & filters",
    icon: TvIcon,
  },
  {
    id: "controls",
    label: "Controls",
    subtitle: "Remap keyboard and gamepad",
    icon: Gamepad2Icon,
  },
  {
    id: "cheats",
    label: "Cheats",
    subtitle: "Libretro NES cheat files",
    icon: Wand2Icon,
  },
  {
    id: "reset",
    label: "Reset Game",
    subtitle: "Restart ROM from beginning",
    icon: RotateCcwIcon,
  },
  {
    id: "exit",
    label: "Exit Game",
    subtitle: "Leave to cartridge shelf",
    icon: LogOutIcon,
  },
]

type InGameMenuSidebarProps = {
  activeTab: InGameMenuTab
  onSelectTab: (tab: InGameMenuTab) => void
  isFocused?: boolean
}

export const InGameMenuSidebar = ({
  activeTab,
  onSelectTab,
  isFocused = true,
}: InGameMenuSidebarProps) => {
  return (
    <nav
      role="tablist"
      aria-label="In-Game Menu Navigation"
      className="flex flex-col gap-2 w-full md:w-72 lg:w-80 shrink-0"
    >
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id

        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            onClick={() => onSelectTab(item.id)}
            className={cn(
              "group relative flex items-center gap-3.5 rounded-2xl border px-4 py-3 text-left transition-all duration-200 outline-none",
              isActive && isFocused
                ? "border-blue-400 bg-blue-600/25 text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] ring-1 ring-blue-400/60"
                : isActive
                  ? "border-blue-400/40 bg-blue-600/10 text-white/90 ring-1 ring-blue-400/20"
                  : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
              item.id === "reset" && !isActive && "text-amber-400/80 hover:text-amber-300 hover:border-amber-500/30",
              item.id === "exit" && !isActive && "text-rose-400/80 hover:text-rose-300 hover:border-rose-500/30",
            )}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                isActive
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white",
                item.id === "reset" && !isActive && "bg-amber-500/10 text-amber-400",
                item.id === "exit" && !isActive && "bg-rose-500/10 text-rose-400",
              )}
            >
              <Icon className="size-5" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold tracking-wide text-foreground">
                {item.label}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {item.subtitle}
              </span>
            </div>

            {isActive ? (
              <span className="size-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa] shrink-0" />
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
