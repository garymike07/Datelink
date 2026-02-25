import { Skeleton } from "@/components/ui/skeleton";

function MatchCardSkeleton() {
  return (
    <div className="overflow-hidden glass-card border-none rounded-2xl">
      <div className="grid grid-cols-3 gap-1 bg-black/5">
        <Skeleton className="aspect-[3/4] w-full rounded-none" />
        <Skeleton className="aspect-[3/4] w-full rounded-none" />
        <Skeleton className="aspect-[3/4] w-full rounded-none" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-14" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function MatchListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-10">
      <div>
        <Skeleton className="h-6 w-28 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: count }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
