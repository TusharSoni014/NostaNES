import { Skeleton } from "@/components/ui/skeleton"

export function GameListSkeleton() {
  return (
    <div
      className="flex flex-1 flex-col gap-2 overflow-hidden px-1 pr-2"
      aria-busy="true"
      aria-label="Loading library list"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-background/20 p-3"
        >
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-4 w-7" />
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-4 w-48 sm:w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
