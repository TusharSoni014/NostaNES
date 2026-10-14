import type { AppliedCheat, EmulatorCheatControls } from "@/lib/cheats/emulator-cheats"

type CheatFlag = {
  code: string
  description: string
  enabled: boolean
}

function cheatKey(code: string, description: string) {
  return `${code}\n${description}`
}

export async function applyCheatSession(
  cheats: EmulatorCheatControls,
  text: string,
  previous: readonly CheatFlag[],
): Promise<AppliedCheat[] | null> {
  const loaded = await cheats.loadCheats(text)
  if (!loaded) return null

  const enabled = new Set(
    previous.filter((row) => row.enabled).map((row) => cheatKey(row.code, row.description)),
  )

  cheats.getCheats().forEach((cheat, index) => {
    const description = cheat.description?.trim() || `Cheat ${index + 1}`
    if (enabled.has(cheatKey(cheat.code, description))) cheats.enableCheat(index)
  })

  return cheats.getCheats()
}
