import { HomeStage } from "@/components/home-stage"
import { fetchGamesFromBucket } from "@/lib/r2"

export default async function Home() {
  let initialGames: import("@/lib/games").Game[] = []
  try {
    initialGames = await fetchGamesFromBucket()
  } catch (error) {
    console.error("Failed to load games from bucket during SSR:", error)
  }

  return <HomeStage initialGames={initialGames} />
}
