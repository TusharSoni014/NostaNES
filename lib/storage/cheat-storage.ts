export type StoredCheat = {
  index: number
  description: string
  code: string
  enabled: boolean
}

export type StoredCheatSession = {
  fileName: string
  text: string
  rows: StoredCheat[]
  custom?: boolean
}

const STORAGE_KEY = "nostanes_cheats"

let cache: Record<string, StoredCheatSession> | null = null

function isCheat(value: unknown): value is StoredCheat {
  if (!value || typeof value !== "object") return false
  const row = value as StoredCheat
  return (
    typeof row.index === "number" &&
    typeof row.description === "string" &&
    typeof row.code === "string" &&
    typeof row.enabled === "boolean"
  )
}

function isSession(value: unknown): value is StoredCheatSession {
  if (!value || typeof value !== "object") return false
  const session = value as StoredCheatSession
  return (
    typeof session.fileName === "string" &&
    session.fileName.length > 0 &&
    typeof session.text === "string" &&
    session.text.length > 0 &&
    Array.isArray(session.rows) &&
    session.rows.length > 0 &&
    session.rows.every(isCheat)
  )
}

function readAll(): Record<string, StoredCheatSession> {
  if (cache) return cache
  cache = {}
  if (typeof window === "undefined") return cache

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cache
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return cache
    for (const [file, value] of Object.entries(parsed)) {
      if (isSession(value)) cache[file] = value
    }
  } catch (err) {
    console.error("Failed to read cheats from localStorage:", err)
  }

  return cache
}

function persist() {
  if (!cache || typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch (err) {
    console.error("Failed to save cheats to localStorage:", err)
  }
}

export function getCheatSession(gameFile: string): StoredCheatSession | null {
  return readAll()[gameFile] ?? null
}

export function saveCheatSession(gameFile: string, session: StoredCheatSession | null) {
  const all = readAll()
  if (!session || !isSession(session)) delete all[gameFile]
  else all[gameFile] = session
  persist()
}
