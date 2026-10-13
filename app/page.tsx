import { Suspense } from "react"
import { connection } from "next/server"
import { HomeStage } from "@/components/home-stage"
import { fetchGamesFromBucket } from "@/lib/r2"
import type { Game } from "@/lib/games"

async function DynamicHome() {
  await connection()
  let initialGames: Game[] = []
  try {
    initialGames = await fetchGamesFromBucket()
  } catch (error) {
    console.error("Failed to load games from bucket during SSR:", error)
  }

  return <HomeStage initialGames={initialGames} />
}

export default function Home() {
  return (
    <Suspense fallback={<HomeStage />}>
      <DynamicHome />
    </Suspense>
  )
}
