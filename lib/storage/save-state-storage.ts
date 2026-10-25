export type SavedStateRecord = {
  id: string
  gameFile: string
  slot: number
  stateBlob: Blob
  timestamp: number
  sizeBytes: number
}

/** The quick save slot (RB / "." held). It sits beside the ten numbered slots. */
export const QUICK_SAVE_SLOT = 0

export function formatSlotLabel(slot: number): string {
  return slot === QUICK_SAVE_SLOT ? "Quick Save" : `Slot ${slot}`
}

const DB_NAME = "nostanes_save_states"
const STORE_NAME = "states"
const DB_VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("gameFile", "gameFile", { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function makeSaveId(gameFile: string, slot: number): string {
  return `${gameFile}::slot_${slot}`
}

export async function saveGameState(
  gameFile: string,
  slot: number,
  stateBlob: Blob,
): Promise<SavedStateRecord> {
  const db = await openDatabase()
  const record: SavedStateRecord = {
    id: makeSaveId(gameFile, slot),
    gameFile,
    slot,
    stateBlob,
    timestamp: Date.now(),
    sizeBytes: stateBlob.size,
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(record)

    request.onsuccess = () => resolve(record)
    request.onerror = () => reject(request.error)
  })
}

export async function loadGameState(
  gameFile: string,
  slot: number,
): Promise<SavedStateRecord | null> {
  const db = await openDatabase()
  const id = makeSaveId(gameFile, slot)

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      resolve((request.result as SavedStateRecord) ?? null)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function listGameSaves(
  gameFile: string,
): Promise<SavedStateRecord[]> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const index = store.index("gameFile")
    const request = index.getAll(gameFile)

    request.onsuccess = () => {
      const records = (request.result as SavedStateRecord[]) || []
      records.sort((a, b) => a.slot - b.slot)
      resolve(records)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteGameState(
  gameFile: string,
  slot: number,
): Promise<void> {
  const db = await openDatabase()
  const id = makeSaveId(gameFile, slot)

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
