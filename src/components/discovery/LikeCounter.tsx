import { Heart, Infinity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LikeCounterProps {
  used: number;
  limit: number;
  isPremium: boolean;
  className?: string;
}

export function LikeCounter({ used, limit, isPremium, className }: LikeCounterProps) {
  const remaining = limit - used;
  const percentage = (used / limit) * 100;
  
  // Determine color based on remaining likes
  const getColorClass = () => {
    if (isPremium) return "bg-gradient-to-r from-purple-500 to-pink-500";
    if (remaining <= 0) return "bg-red-500";
    if (remaining <= 5) return "bg-orange-500";
    if (remaining <= 10) return "bg-yellow-500";
    return "bg-green-500";
  };

  const shouldAnimate = remaining <= 5 && !isPremium;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "flex items-center gap-2 text-white border-0 px-3 py-1.5",
        getColorClass(),
        shouldAnimate && "animate-pulse",
        className
      )}
    >
      {isPremium ? (
        <>
          <Infinity className="h-4 w-4" />
          <span className="font-semibold">Unlimited Likes</span>
        </>
      ) : (
        <>
          <Heart className="h-4 w-4" fill="currentColor" />
          <span className="font-semibold">
            {remaining} {remaining === 1 ? "like" : "likes"} left today
          </span>
        </>
      )}
    </Badge>
  );
}

interface LikeCounterProgressProps {
  used: number;
  limit: number;
  isPremium: boolean;
}

export function LikeCounterProgress({ used, limit, isPremium }: LikeCounterProgressProps) {
  if (isPremium) {
    return (
      <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
        <Infinity className="h-5 w-5 text-purple-500" />
        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
          Unlimited Likes
        </span>
      </div>
    );
  }

  const remaining = limit - used;
  const percentage = (used / limit) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Daily Likes</span>
        <span className="font-semibold">
          {used}/{limit}
        </span>
      </div>
      <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute top-0 left-0 h-full transition-all duration-300",
            remaining <= 0 && "bg-red-500",
            remaining > 0 && remaining <= 5 && "bg-orange-500",
            remaining > 5 && remaining <= 10 && "bg-yellow-500",
            remaining > 10 && "bg-green-500"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {remaining <= 5 && remaining > 0 && (
        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
          Only {remaining} {remaining === 1 ? "like" : "likes"} remaining today!
        </p>
      )}
      {remaining <= 0 && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          Daily limit reached. Resets at midnight or upgrade to Premium!
        </p>
      )}
    </div>
  );
}
