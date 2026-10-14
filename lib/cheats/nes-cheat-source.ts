import { matchCheatFiles, searchCheatFiles, type CheatFileMatch } from "@/lib/cheats/match-cheat-files"

const CATALOG_DIR = "Nintendo - Nintendo Entertainment System"
const CHT_URL = "https://api.github.com/repos/libretro/libretro-database/contents/cht?ref=master"
const TREE_URL = "https://api.github.com/repos/libretro/libretro-database/git/trees/"
const RAW_BASE =
  "https://raw.githubusercontent.com/libretro/libretro-database/master/cht/" +
  `${encodeURIComponent(CATALOG_DIR)}`
const CATALOG_TTL_MS = 6 * 60 * 60 * 1000

type Catalog = {
  names: string[]
  fetchedAt: number
}

let catalog: Catalog | null = null

export function isSafeCheatFileName(name: string): boolean {
  return (
    name.length > 4 &&
    name.length < 240 &&
    !name.includes("/") &&
    !name.includes("\\") &&
    !name.includes("..") &&
    !name.includes("\0") &&
    name.toLowerCase().endsWith(".cht")
  )
}

async function loadCatalog(): Promise<string[]> {
  if (catalog && Date.now() - catalog.fetchedAt < CATALOG_TTL_MS) return catalog.names

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "nostanes",
  }
  const folderResponse = await fetch(CHT_URL, { headers, cache: "no-store" })
  if (!folderResponse.ok) {
    throw new Error(`Cheat catalog request failed (${folderResponse.status})`)
  }
  const folders = (await folderResponse.json()) as unknown
  if (!Array.isArray(folders)) throw new Error("Cheat catalog response was not a file list")
  const nesFolder = folders.find((entry) => {
    if (!entry || typeof entry !== "object") return false
    const record = entry as { name?: unknown; type?: unknown; sha?: unknown }
    return record.type === "dir" && record.name === CATALOG_DIR && typeof record.sha === "string"
  }) as { sha: string } | undefined
  if (!nesFolder) throw new Error("NES cheat folder was not found")

  const treeResponse = await fetch(`${TREE_URL}${nesFolder.sha}`, { headers, cache: "no-store" })
  if (!treeResponse.ok) {
    throw new Error(`Cheat catalog request failed (${treeResponse.status})`)
  }
  const tree = (await treeResponse.json()) as { tree?: unknown; truncated?: boolean }
  if (!Array.isArray(tree.tree) || tree.truncated) {
    throw new Error("Cheat catalog response was not a file list")
  }

  const names = tree.tree.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return []
    const record = entry as { path?: unknown; type?: unknown }
    if (record.type !== "blob" || typeof record.path !== "string") return []
    if (!isSafeCheatFileName(record.path)) return []
    return [record.path]
  })

  if (names.length === 0) throw new Error("Cheat catalog was empty")
  catalog = { names, fetchedAt: Date.now() }
  return names
}

export async function findNesCheatFiles(title: string, romFile: string): Promise<CheatFileMatch[]> {
  const names = await loadCatalog()
  return matchCheatFiles(names, title, romFile)
}

export async function searchNesCheatFiles(query: string): Promise<CheatFileMatch[]> {
  const names = await loadCatalog()
  return searchCheatFiles(names, query)
}

export async function readNesCheatFile(name: string): Promise<string> {
  if (!isSafeCheatFileName(name)) throw new Error("Unknown cheat file")
  const names = await loadCatalog()
  if (!names.includes(name)) throw new Error("Unknown cheat file")

  const response = await fetch(`${RAW_BASE}/${encodeURIComponent(name)}`, {
    headers: { "User-Agent": "nostanes" },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Cheat download failed (${response.status})`)
  return response.text()
}
