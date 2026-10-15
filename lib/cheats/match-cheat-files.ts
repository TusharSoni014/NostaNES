export type CheatFileMatch = {
  name: string
  exactFile: boolean
  similar: boolean
}

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "and", "in", "to", "for", "on", "with", "at", "by", "from",
])

const META_TOKENS = new Set([
  "usa", "europe", "japan", "world", "australia", "italy", "france", "germany",
  "spain", "korea", "asia", "brazil", "sweden", "canada", "netherlands", "china",
  "beta", "proto", "prototype", "sample", "demo", "alpha",
  "rev", "revision", "unl", "hack", "pirate", "earlier", "later",
  "genie", "action", "replay",
])

const ROMAN_NUMERALS: Record<string, string> = {
  ii: "2",
  iii: "3",
  iv: "4",
  vi: "6",
  vii: "7",
  viii: "8",
  ix: "9",
  xi: "11",
  xii: "12",
  xiii: "13",
}

const REGION_PATTERNS: Record<string, RegExp> = {
  japan: /\((?:[^)]*\bjapan\b[^)]*|j)\)/,
  usa: /\((?:[^)]*\busa\b[^)]*|u)\)/,
  europe: /\((?:[^)]*\beurope\b[^)]*|e)\)/,
  world: /\((?:[^)]*\bworld\b[^)]*|w)\)/,
}

const REGION_LETTERS = new Set(["j", "u", "e", "w"])

export function cleanForSearch(name: string): string {
  return name
    .replace(/\.(cht|nes|zip)$/i, "")
    .replace(/\s*\((?:rev|revision|ver|version)\s*[^)]*\)/gi, " ")
    .replace(/\s*\((?:game genie|action replay)\)/gi, " ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function contentTokens(name: string): string[] {
  return cleanForSearch(name)
    .split(" ")
    .map((word) => ROMAN_NUMERALS[word] ?? word)
    .filter((word) => Boolean(word) && !STOP_WORDS.has(word) && !META_TOKENS.has(word) && !REGION_LETTERS.has(word))
}

function leadingTitle(name: string): string {
  const stripped = name
    .replace(/\.(cht|nes|zip)$/i, "")
    .replace(/\s*(\([^)]*\)|\[[^\]]*\])/g, "")
    .trim()
  return stripped.split(/\s+-\s+|:\s+/)[0]?.trim() ?? stripped
}

function startsWithTokens(tokens: string[], prefix: string[]): boolean {
  if (prefix.length === 0 || prefix.length > tokens.length) return false
  return prefix.every((token, index) => tokens[index] === token)
}

function containsEvery(tokens: string[], needed: string[]): boolean {
  if (needed.length === 0) return false
  const remaining = new Map<string, number>()
  for (const token of tokens) remaining.set(token, (remaining.get(token) ?? 0) + 1)
  return needed.every((token) => {
    const count = remaining.get(token) ?? 0
    if (count < 1) return false
    remaining.set(token, count - 1)
    return true
  })
}

function sharedCount(left: string[], right: string[]): number {
  const remaining = new Map<string, number>()
  for (const token of right) remaining.set(token, (remaining.get(token) ?? 0) + 1)
  let shared = 0
  for (const token of left) {
    const count = remaining.get(token) ?? 0
    if (count < 1) continue
    remaining.set(token, count - 1)
    shared += 1
  }
  return shared
}

function detectRegion(value: string): string {
  const lower = value.toLowerCase()
  for (const [region, pattern] of Object.entries(REGION_PATTERNS)) {
    if (pattern.test(lower)) return region
  }
  return ""
}

function mentionsRegion(name: string, region: string): boolean {
  const pattern = REGION_PATTERNS[region]
  return pattern ? pattern.test(name.toLowerCase()) : false
}

function tokenMatches(token: string, query: string): boolean {
  if (token === query) return true
  if (query.length < 3) return false
  return token.startsWith(query) || (query.length >= 4 && token.includes(query))
}

export function matchSearchQuery(name: string, query: string): boolean {
  const cleanQuery = cleanForSearch(query)
  if (!cleanQuery) return true
  const cleanName = cleanForSearch(name)
  if (cleanName.includes(cleanQuery)) return true

  const queryTokens = cleanQuery.split(" ").filter((word) => word && !STOP_WORDS.has(word))
  if (queryTokens.length === 0) return true
  const nameTokens = cleanName.split(" ").filter(Boolean)
  return queryTokens.every((token) => nameTokens.some((nameToken) => tokenMatches(nameToken, token)))
}

function scoreCheatFile(
  name: string,
  gameTokens: string[],
  cleanTitle: string,
  cleanRom: string,
  romBase: string,
): number {
  const nameWithoutExt = name.replace(/\.cht$/i, "")
  if (nameWithoutExt === romBase) return 1000

  const cheatTokens = contentTokens(name)
  if (cheatTokens.length === 0 || gameTokens.length === 0) return 0

  const cleanName = cleanForSearch(name)
  if (cleanName === cleanTitle || cleanName === cleanRom) return 960
  if (cheatTokens.join(" ") === gameTokens.join(" ")) return 940

  const leadingTokens = contentTokens(leadingTitle(name))
  const hasSubtitle = /\s+-\s+|:\s+/.test(nameWithoutExt)
  if (hasSubtitle && leadingTokens.join(" ") === gameTokens.join(" ")) return 910

  if (startsWithTokens(cheatTokens, gameTokens)) {
    return 860 - (cheatTokens.length - gameTokens.length) * 8
  }

  if (startsWithTokens(gameTokens, cheatTokens)) {
    return 760 - (gameTokens.length - cheatTokens.length) * 8
  }

  if (containsEvery(cheatTokens, gameTokens)) return 700

  if (gameTokens.length >= 2 && cheatTokens[0] === gameTokens[0]) {
    const shared = sharedCount(gameTokens, cheatTokens)
    const sharedWords = sharedCount(
      gameTokens.filter((token) => !/^\d+$/.test(token)),
      cheatTokens.filter((token) => !/^\d+$/.test(token)),
    )
    if (sharedWords >= 2 && shared / gameTokens.length >= 0.5) return 520 + shared * 20
  }

  return 0
}

function applyRankAdjustments(name: string, score: number, romRegion: string): number {
  let next = score
  const lower = name.toLowerCase()
  if (romRegion && mentionsRegion(name, romRegion)) next += 30
  else if (mentionsRegion(name, "usa")) next += 15
  else if (mentionsRegion(name, "world")) next += 10
  else if (mentionsRegion(name, "europe")) next += 5

  if (/\((beta|proto|sample)\)/.test(lower)) next -= 25
  if (lower.includes("game genie") || lower.includes("action replay")) next -= 12
  if (lower.includes("rumbles")) next -= 40
  return next
}

export function matchCheatFiles(
  names: readonly string[],
  title: string,
  romFile = "",
): CheatFileMatch[] {
  const source = title || romFile
  const gameTokens = contentTokens(source)
  const cleanTitle = cleanForSearch(title)
  const cleanRom = cleanForSearch(romFile)
  const romBase = romFile.replace(/\.(nes|zip)$/i, "")
  const romRegion = detectRegion(`${romFile} ${title}`)

  const scored: { name: string; score: number; exactFile: boolean }[] = []

  for (const name of names) {
    const baseScore = scoreCheatFile(name, gameTokens, cleanTitle, cleanRom, romBase)
    if (baseScore < 500) continue
    const nameWithoutExt = name.replace(/\.cht$/i, "")
    scored.push({
      name,
      score: applyRankAdjustments(name, baseScore, romRegion),
      exactFile: nameWithoutExt === romBase,
    })
  }

  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  return scored.slice(0, 80).map(({ name, score, exactFile }) => ({
    name,
    exactFile,
    similar: score < 800,
  }))
}

export function searchCheatFiles(
  names: readonly string[],
  query: string,
): CheatFileMatch[] {
  const cleanQuery = cleanForSearch(query)
  const queryTokens = cleanQuery.split(" ").filter((word) => word && !STOP_WORDS.has(word))
  if (queryTokens.length === 0 || cleanQuery.length < 2) return []
  const compactQuery = cleanQuery.replace(/ /g, "")

  const scored: { name: string; score: number }[] = []

  for (const name of names) {
    const cleanName = cleanForSearch(name)
    const nameTokens = cleanName.split(" ").filter(Boolean)
    const compactName = cleanName.replace(/ /g, "")
    let score = 0

    if (cleanName === cleanQuery) score = 1000
    else if (cleanName.startsWith(`${cleanQuery} `) || cleanName.startsWith(cleanQuery)) score = 860
    else if (compactQuery.length >= 3 && compactName.includes(compactQuery)) score = 740
    else if (queryTokens.every((token) => nameTokens.some((nameToken) => tokenMatches(nameToken, token)))) {
      score = 620
      if (nameTokens[0] && tokenMatches(nameTokens[0], queryTokens[0])) score += 40
    } else if (queryTokens.length >= 2) {
      const matched = queryTokens.filter((token) =>
        nameTokens.some((nameToken) => tokenMatches(nameToken, token)),
      )
      if (matched.length >= 2 && matched.length / queryTokens.length >= 0.5) {
        score = 380 + matched.length * 40
      }
    }

    if (score > 0) scored.push({ name, score })
  }

  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  return scored.slice(0, 80).map(({ name, score }) => ({
    name,
    exactFile: false,
    similar: score < 800,
  }))
}
