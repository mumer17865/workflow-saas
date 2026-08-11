export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-black/10 dark:bg-white/10 ${className}`}
    />
  );
}

/** A card-shaped skeleton block, used for grid/list loading states. */
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  );
}

/** A row of stat-tile skeletons. */
export function StatTilesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-black/10 p-4 dark:border-white/10"
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-7 w-12" />
        </div>
      ))}
    </div>
  );
}
