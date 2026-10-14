export type GameShader =
  | "none"
  | "crt-scanlines"
  | "crt-arcade"
  | "crt-warm"
  | "smooth"
  | "gameboy"

export type ShaderOption = {
  id: GameShader
  label: string
  subtitle: string
  description: string
  badge: string
}

export const SHADER_OPTIONS: readonly ShaderOption[] = [
  {
    id: "none",
    label: "Crisp Pixel (Off)",
    subtitle: "Raw 1:1 NES rendering",
    description: "Sharp, unfiltered pixels with authentic retro NES aspect ratio.",
    badge: "1:1 RAW",
  },
  {
    id: "crt-scanlines",
    label: "CRT Scanlines",
    subtitle: "Classic 90s TV tube grid",
    description: "Fine horizontal phosphor scanlines for authentic CRT television feel.",
    badge: "RECOMMENDED",
  },
  {
    id: "crt-arcade",
    label: "Arcade Cabinet",
    subtitle: "Curved glass & corner vignette",
    description: "CRT monitor curvature with aperture grille scanlines and vignette falloff.",
    badge: "ARCADE",
  },
  {
    id: "crt-warm",
    label: "Warm Vintage NTSC",
    subtitle: "Warm retro phosphor glow",
    description: "NTSC television color grading with subtle amber warmth and soft scanlines.",
    badge: "NTSC",
  },
  {
    id: "smooth",
    label: "Smooth Bilinear",
    subtitle: "Bilinear pixel interpolation",
    description: "Interpolated pixel edges that eliminate hard aliasing for a smoother look.",
    badge: "SMOOTH",
  },
  {
    id: "gameboy",
    label: "Monochrome Dot Matrix",
    subtitle: "Classic DMG greenish phosphor",
    description: "Retro handheld monochrome green phosphor palette with subtle LCD grid.",
    badge: "RETRO",
  },
] as const

const STORAGE_KEY = "nostanes_shader_preset"

export function getSavedShader(): GameShader {
  if (typeof window === "undefined") return "none"
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    if (val && SHADER_OPTIONS.some((opt) => opt.id === val)) {
      return val as GameShader
    }
  } catch {}
  return "none"
}

export function saveShader(shader: GameShader): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, shader)
  } catch {}
}
