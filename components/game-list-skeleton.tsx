import { Skeleton } from "@/components/ui/skeleton"

export function GameListSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col md:flex-row gap-6 lg:gap-8 overflow-hidden px-3 sm:px-8 w-full"
      aria-busy="true"
      aria-label="Loading NES cartridge library"
    >
      {/* Left Column: Cartridges list skeleton */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-8 sm:px-6 md:px-7">
        <div className="flex items-center gap-2 px-1 text-xs text-white/50 font-mono tracking-wider">
          <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
          <span>READING CARTRIDGE ROMS...</span>
        </div>

        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-4 py-3"
            style={{ opacity: Math.max(0.35, 1 - i * 0.1) }}
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <Skeleton className="h-3 w-6 rounded bg-white/10 shrink-0 font-mono" />
              <Skeleton className="size-9 rounded-xl bg-white/10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-40 sm:w-56 rounded bg-white/10" />
                <Skeleton className="h-3 w-28 rounded bg-white/5" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Skeleton className="h-5 w-12 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-10 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>

      {/* Right Column: Cartridge preview panel skeleton (Tablet/Desktop) */}
      <div className="hidden shrink-0 md:flex flex-col justify-center min-h-0 max-h-full">
        <div className="flex w-full flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl shadow-xl md:w-72 lg:w-80 max-h-[calc(100dvh-12rem)]">
          <Skeleton className="mx-auto aspect-square w-24 sm:w-28 md:w-32 lg:w-36 rounded-xl bg-white/10 shadow-lg" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-5 w-10 rounded-md bg-white/10" />
              <Skeleton className="h-5 w-14 rounded-md bg-white/10" />
            </div>
            <Skeleton className="h-5 w-44 rounded bg-white/10" />
            <Skeleton className="h-3 w-32 rounded bg-white/5" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
        </div>
      </div>
    </div>
  )
}
