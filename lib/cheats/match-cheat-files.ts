export type CheatFileMatch = {
  name: string
  exactFile: boolean
  similar: boolean
}

function normalizeTitle(name: string): string {
  return name
    .replace(/\.(cht|nes)$/i, "")
    .replace(/['’]/g, "")
    .replace(/\s*\[[^\]]*\]/g, " ")
    .replace(/\s*\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function sameWords(a: string, b: string): boolean {
  const left = a.split(" ").filter(Boolean)
  const right = b.split(" ").filter(Boolean)
  if (left.length === 0 || left.length !== right.length) return false
  const words = new Set(left)
  return right.every((word) => words.has(word))
}

function titlesMatch(left: string, right: string): boolean {
  if (!left || !right) return false
  return left === right || sameWords(left, right)
}

function similarNames(names: readonly string[], title: string): string[] {
  const wanted = new Set(title.split(" ").filter(Boolean))
  if (wanted.size === 0) return []

  return names
    .map((name) => {
      const words = normalizeTitle(name).split(" ").filter(Boolean)
      const have = new Set(words)
      let shared = 0
      for (const word of wanted) if (have.has(word)) shared += 1
      const extra = have.size - shared
      const coversTitle = shared === wanted.size
      return { name, coversTitle, extra }
    })
    .filter((entry) => entry.coversTitle && entry.extra <= 1)
    .sort((a, b) => a.extra - b.extra || a.name.localeCompare(b.name))
    .slice(0, 40)
    .map((entry) => entry.name)
}

export function matchCheatFiles(
  names: readonly string[],
  title: string,
  romFile = "",
): CheatFileMatch[] {
  const titleKey = normalizeTitle(title)
  const romKey = normalizeTitle(romFile)
  const romBase = romFile.replace(/\.nes$/i, "")

  const exact = names.filter((name) => {
    const key = normalizeTitle(name)
    return titlesMatch(key, titleKey) || titlesMatch(key, romKey)
  })
  const chosen = exact.length > 0 ? exact : similarNames(names, titleKey || romKey)
  const similar = exact.length === 0

  return chosen
    .map((name) => ({
      name,
      exactFile: name.replace(/\.cht$/i, "") === romBase,
      similar,
    }))
    .sort((a, b) => {
      if (a.exactFile !== b.exactFile) return a.exactFile ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

export function searchCheatFiles(names: readonly string[], query: string): CheatFileMatch[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []
  return names
    .filter((name) => name.toLowerCase().includes(needle))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 50)
    .map((name) => ({ name, exactFile: false, similar: true }))
}
