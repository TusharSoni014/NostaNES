import { fetchGamesFromBucket } from "@/lib/r2"

export async function GET() {
  try {
    const games = await fetchGamesFromBucket()
    return Response.json(
      { games },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
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
