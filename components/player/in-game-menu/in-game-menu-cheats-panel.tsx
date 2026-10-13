"use client"

import { Wand2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const InGameMenuCheatsPanel = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-white/10 rounded-2xl bg-white/[0.02] flex-1 min-h-[300px]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
        <Wand2Icon className="size-7" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-bold text-white">Game Genie Cheats</h3>
        <Badge variant="outline" className="text-[10px] border-blue-400/40 text-blue-300">
          Coming Soon
        </Badge>
      </div>

      <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
        Cheat code engine and custom Game Genie passcodes are currently empty for this cartridge.
        Support for live memory patching and invincibility codes will arrive in an upcoming release.
      </p>
    </div>
  )
}
