import { Skeleton } from "@/components/ui/skeleton";

export function ProfileCardSkeleton() {
  return (
    <div className="w-full max-w-[400px] mx-auto">
      <div className="relative overflow-hidden rounded-3xl glass-card border-none">
        <div className="aspect-[2/3]">
          <Skeleton className="h-full w-full rounded-none" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-40 bg-white/20" />
              <Skeleton className="h-4 w-24 bg-white/20" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full bg-white/20" />
            <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
            <Skeleton className="h-6 w-14 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-14 w-14 rounded-full" />
      </div>
    </div>
  );
}
