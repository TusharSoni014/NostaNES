export const R2_PUBLIC_BASE =
  "https://pub-703c32454a66472bbf4e8546b6c0894f.r2.dev"

export const R2_NES_PREFIX = `${R2_PUBLIC_BASE}/NES`

export const CATALOG_URL = `${R2_NES_PREFIX}/catalog.json`

export type RomEntry = {
  file: string
  year?: number
}

export type Game = {
  id: string
  file: string
  title: string
  region: string
  tags: string[]
  year?: number
}

const REGION_LABELS: Record<string, string> = {
  U: "USA",
  USA: "USA",
  E: "Europe",
  Europe: "Europe",
  J: "Japan",
  Japan: "Japan",
  W: "World",
  World: "World",
  UE: "USA · Europe",
  EU: "Europe",
  JU: "Japan · USA",
  Unl: "Unlicensed",
}

const BRACKET_LABELS: Record<string, string> = {
  "!": "Verified",
  b: "Bad dump",
  h: "Hack",
  o: "Overdump",
  a: "Alternate",
  t: "Trainer",
}

export function isSafeNesFile(file: string) {
  return (
    file.length > 4 &&
    file.length < 240 &&
    !file.includes("/") &&
    !file.includes("\\") &&
    !file.includes("..") &&
    !file.includes("\0") &&
    file.toLowerCase().endsWith(".nes")
  )
}

export function parseRomFile(file: string, year?: number): Game {
  const base = file.replace(/\.nes$/i, "")
  const tags: string[] = []
  let region = "NES"

  const title = base
    .replace(/\s*(\([^)]*\)|\[[^\]]*\])/g, (_match, group: string) => {
      const inner = group.slice(1, -1).trim()
      if (group.startsWith("[")) {
        tags.push(BRACKET_LABELS[inner] ?? inner)
      } else if (REGION_LABELS[inner]) {
        region = REGION_LABELS[inner]
      } else {
        tags.push(inner)
      }
      return ""
    })
    .replace(/\s+/g, " ")
    .trim()

  return {
    id: file,
    file,
    title: title || file,
    region,
    tags,
    year,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function normalizeCatalog(input: unknown): RomEntry[] {
  const list = Array.isArray(input)
    ? input
    : isRecord(input) && Array.isArray(input.games)
      ? input.games
      : []

  return list.flatMap((item) => {
    if (typeof item === "string") return [{ file: item }]
    if (isRecord(item) && typeof item.file === "string") {
      return [
        {
          file: item.file,
          year: typeof item.year === "number" ? item.year : undefined,
        },
      ]
    }
    return []
  })
}

export function mergeLibrary(local: RomEntry[], remote: RomEntry[]): Game[] {
  const map = new Map<string, RomEntry>()

  for (const entry of [...local, ...remote]) {
    if (!isSafeNesFile(entry.file)) continue
    const previous = map.get(entry.file)
    map.set(entry.file, {
      file: entry.file,
      year: entry.year ?? previous?.year,
    })
  }

  return [...map.values()].map((entry) => parseRomFile(entry.file, entry.year))
}

export function coverPalette(title: string) {
  const palettes = [
    {
      a: "#071a3d",
      b: "#0c4ea3",
      c: "#04101f",
      glow: "rgba(150, 210, 255, 0.85)",
    },
    {
      a: "#04182c",
      b: "#0a6d9c",
      c: "#020910",
      glow: "rgba(170, 230, 255, 0.8)",
    },
    {
      a: "#081433",
      b: "#18448a",
      c: "#050b16",
      glow: "rgba(190, 215, 255, 0.75)",
    },
    {
      a: "#031526",
      b: "#0a58b5",
      c: "#02060e",
      glow: "rgba(210, 236, 255, 0.8)",
    },
  ]

  let hash = 2166136261
  for (let i = 0; i < title.length; i += 1) {
    hash ^= title.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return palettes[(hash >>> 0) % palettes.length]
}
