export type AppliedCheat = {
  code: string
  description?: string
  enabled?: boolean
}

export type EmulatorCheatControls = {
  loadCheats: (content: string) => Promise<boolean>
  enableCheat: (index: number) => boolean
  disableCheat: (index: number) => boolean
  clearCheats: () => boolean
  getCheats: () => AppliedCheat[]
}
