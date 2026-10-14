export const R2_PUBLIC_BASE =
  process.env.NEXT_PUBLIC_BUCKET_URL ||
  process.env.R2_PUBLIC_BASE ||
  "https://pub-703c32454a66472bbf4e8546b6c0894f.r2.dev"

export const R2_NES_PREFIX =
  process.env.R2_NES_PREFIX || `${R2_PUBLIC_BASE}/NES`

export type Game = {
  id: string
  file: string
  title: string
  region: string
  tags: string[]
  year?: number
}

export type GameGroup = Game & {
  versions: Game[]
  regions: string[]
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

  const detectedYear =
    year ??
    (() => {
      const found = tags.find((t) => /^(19\d\d|20\d\d)$/.test(t))
      return found ? parseInt(found, 10) : undefined
    })()

  return {
    id: file,
    file,
    title: title || file,
    region,
    tags,
    year: detectedYear,
  }
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

function getRegionPriority(region: string): number {
  if (region === "USA") return 1
  if (region === "World") return 2
  if (region.includes("USA")) return 3
  if (region.includes("Europe")) return 4
  if (region.includes("Japan")) return 5
  return 6
}

export function groupGames(games: Game[]): GameGroup[] {
  const groupsMap = new Map<string, Game[]>()

  for (const game of games) {
    const key = game.title.trim().toLowerCase()
    const existing = groupsMap.get(key)
    if (existing) {
      existing.push(game)
    } else {
      groupsMap.set(key, [game])
    }
  }

  const result: GameGroup[] = []

  for (const versions of groupsMap.values()) {
    // Sort versions: regional priority > verified/clean over beta/bad > alphabetical
    versions.sort((a, b) => {
      const prioA = getRegionPriority(a.region)
      const prioB = getRegionPriority(b.region)
      if (prioA !== prioB) return prioA - prioB

      const aHasBadOrBeta = a.tags.some((t) => /beta|bad|dump|hack/i.test(t))
      const bHasBadOrBeta = b.tags.some((t) => /beta|bad|dump|hack/i.test(t))
      if (aHasBadOrBeta !== bHasBadOrBeta) return aHasBadOrBeta ? 1 : -1

      return a.file.localeCompare(b.file)
    })

    const primary = versions[0]
    const regions = Array.from(new Set(versions.map((v) => v.region)))
    const year = primary.year ?? versions.find((v) => v.year)?.year

    result.push({
      ...primary,
      year,
      versions,
      regions,
    })
  }

  result.sort((a, b) => a.title.localeCompare(b.title))
  return result
}
