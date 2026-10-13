import { Skeleton } from "@/components/ui/skeleton"

export function ShelfSkeleton() {
  return (
    <div
      className="flex flex-col items-center gap-8 px-6 pb-10"
      aria-busy="true"
      aria-label="Loading cartridges"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-12 w-64" />
      </div>
      <div className="flex items-center gap-6">
        <Skeleton className="size-36 rounded-2xl opacity-60 sm:size-48" />
        <Skeleton className="size-44 rounded-2xl sm:size-56" />
        <Skeleton className="size-36 rounded-2xl opacity-60 sm:size-48" />
      </div>
    </div>
  )
}
