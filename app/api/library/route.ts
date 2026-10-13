import { fetchGamesFromBucket } from "@/lib/r2"

export async function GET() {
  try {
    const games = await fetchGamesFromBucket()
    return Response.json(
      { games },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
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
