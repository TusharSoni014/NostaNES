import { connection } from "next/server"
import { fetchGamesFromBucket } from "@/lib/r2"

export async function GET() {
  await connection()
  try {
    const games = await fetchGamesFromBucket()
    return Response.json(
      { games },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    )
  } catch (error) {
    console.error("Failed to fetch games from bucket:", error)
    return Response.json(
      { games: [], error: "Failed to load library from server" },
      { status: 500 },
    )
  }
}
