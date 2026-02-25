import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
          <div className="flex justify-start">
            <Skeleton className="h-16 w-[65%] rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-[55%] rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-20 w-[70%] rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-14 w-[50%] rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-12 w-[40%] rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="bg-card border-t border-border sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
