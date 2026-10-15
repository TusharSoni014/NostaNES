import {
  S3Client,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3"
import { isSafeNesFile, parseRomFile, type Game } from "@/lib/games"

const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  "https://a0597f9fc5b865c8086918a23f47f44b.r2.cloudflarestorage.com"
const R2_ACCESS_KEY_ID =
  process.env.R2_ACCESS_KEY_ID || "fccef914d73aad55329c2e853bc989c9"
const R2_SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY ||
  "5505aa933d65d545be29344c7bc0f2b32f53776e48c1b8bbd58fa2a1bccfb6d4"
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "nostanes"

const KNOWN_YEARS: { match: string; year: number }[] = [
  { match: "Mega Man 6", year: 1993 },
  { match: "Mega Man 5", year: 1992 },
  { match: "Mega Man 4", year: 1991 },
  { match: "Mega Man 3", year: 1990 },
  { match: "Mega Man 2", year: 1988 },
  { match: "Mega Man", year: 1987 },
  { match: "Adventures of Lolo 3", year: 1991 },
  { match: "Adventures of Lolo 2", year: 1990 },
  { match: "Adventures of Lolo", year: 1989 },
  { match: "Adventure Island 3", year: 1992 },
  { match: "Adventure Island III", year: 1992 },
  { match: "Adventure Island II", year: 1991 },
  { match: "Adventure Island Classic", year: 1992 },
  { match: "Adventure Island", year: 1986 },
  { match: "1945", year: 1993 },
  { match: "1944", year: 1993 },
  { match: "1943", year: 1988 },
  { match: "1942", year: 1985 },
  { match: "10-Yard Fight", year: 1985 },
  { match: "100 Man Dollar Kid", year: 1989 },
  { match: "1999 - Hore", year: 1991 },
  { match: "2010 Street Fighter", year: 1990 },
  { match: "3-D WorldRunner", year: 1987 },
  { match: "4 Nin Uchi Mahjong", year: 1984 },
  { match: "720 Degrees", year: 1989 },
  { match: "8 Eyes", year: 1988 },
  { match: "Abadox", year: 1989 },
  { match: "Abarenbou Tengu", year: 1990 },
  { match: "Aces - Iron Eagle III", year: 1992 },
  { match: "Action in New York", year: 1992 },
  { match: "Addams Family", year: 1992 },
  { match: "Advanced Dungeons & Dragons", year: 1989 },
  { match: "Adventures in the Magic Kingdom", year: 1990 },
  { match: "Adventures of Bayou Billy", year: 1989 },
  { match: "Adventures of Dino Riki", year: 1989 },
  { match: "Adventures of Gilligan", year: 1990 },
  { match: "Adventures of Rad Gravity", year: 1990 },
  { match: "Adventures of Rocky and Bullwinkle", year: 1992 },
  { match: "Adventures of Tom Sawyer", year: 1989 },
  { match: "After Burner", year: 1989 },
  { match: "Air Fortress", year: 1987 },
  { match: "Airwolf", year: 1988 },
  { match: "Akira", year: 1988 },
  { match: "Akumajou Densetsu", year: 1989 },
  { match: "Akumajou Dracula", year: 1986 },
]

function guessYear(filename: string): number | undefined {
  for (const item of KNOWN_YEARS) {
    if (filename.includes(item.match)) return item.year
  }
  return undefined
}

export function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

let cachedGames: { data: Game[]; timestamp: number } | null = null
const CACHE_TTL_MS = 60_000 // 60 seconds in-memory cache

/**
 * Dynamically fetches all game ROMs directly from the Cloudflare R2 bucket.
 * No static JSON files required; newly uploaded games appear automatically.
 * Cached in-memory for 60 seconds to prevent blocking during page reloads.
 */
export async function fetchGamesFromBucket(forceRefresh = false): Promise<Game[]> {
  const now = Date.now()
  if (!forceRefresh && cachedGames && now - cachedGames.timestamp < CACHE_TTL_MS) {
    return cachedGames.data
  }

  const client = getR2Client()
  let continuationToken: string | undefined = undefined
  const seen = new Set<string>()
  const games: Game[] = []

  do {
    const res: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
      }),
    )

    if (res.Contents) {
      for (const obj of res.Contents) {
        if (!obj.Key) continue
        const key = obj.Key
        // Strip folder prefix if present (e.g. "NES/Mega Man.nes" or "nes/Mega Man.nes" -> "Mega Man.nes")
        const file = key.replace(/^nes\//i, "")
        if (!isSafeNesFile(file) || seen.has(file)) continue

        seen.add(file)
        const year = guessYear(file)
        games.push(parseRomFile(file, year))
      }
    }

    continuationToken = res.NextContinuationToken
  } while (continuationToken)

  // Sort games alphabetically by title
  games.sort((a, b) => a.title.localeCompare(b.title))
  cachedGames = { data: games, timestamp: now }

  return games
}
