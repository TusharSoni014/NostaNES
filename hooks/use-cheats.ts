"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export type CheatFileMatch = {
  name: string
  exactFile: boolean
  similar: boolean
}

const HOUR = 60 * 60 * 1000

async function readCheatFiles(response: Response): Promise<CheatFileMatch[]> {
  const body = (await response.json()) as { files?: CheatFileMatch[]; error?: string }
  if (!response.ok) throw new Error(body.error || "Could not look up cheat files")
  return body.files ?? []
}

export function useGameCheatFiles(game: { title: string; file: string }, enabled: boolean) {
  return useQuery({
    queryKey: ["cheats", "files", game.file],
    enabled,
    staleTime: HOUR,
    queryFn: async () => {
      const params = new URLSearchParams({ title: game.title, file: game.file })
      const response = await fetch(`/api/cheats?${params}`)
      return readCheatFiles(response)
    },
  })
}

export function useCheatFileSearch(query: string, enabled: boolean) {
  const q = query.trim()

  return useQuery({
    queryKey: ["cheats", "search", q.toLowerCase()],
    enabled: enabled && q.length >= 2,
    staleTime: HOUR,
    queryFn: async () => {
      const response = await fetch(`/api/cheats?q=${encodeURIComponent(q)}`)
      return readCheatFiles(response)
    },
  })
}

export function useCheatFileText() {
  const client = useQueryClient()

  return useCallback(async (name: string, fresh = false) => {
    if (fresh) await client.invalidateQueries({ queryKey: ["cheats", "file", name] })

    return client.fetchQuery({
      queryKey: ["cheats", "file", name],
      staleTime: 24 * HOUR,
      queryFn: async () => {
        const response = await fetch(`/api/cheats?name=${encodeURIComponent(name)}`)
        const text = await response.text()
        if (!response.ok) {
          let message = "Could not download that cheat file"
          try {
            const body = JSON.parse(text) as { error?: string }
            if (body.error) message = body.error
          } catch {}
          throw new Error(message)
        }
        return text
      },
    })
  }, [client])
}
