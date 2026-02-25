import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, MessageCircle, CheckCheck } from "lucide-react";

interface ActivityBadgeProps {
  userId: Id<"users">;
  showResponseRate?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ActivityBadge({ userId, showResponseRate = true, size = "md" }: ActivityBadgeProps) {
  const activityBadge = useQuery(api.activityTracking.getActivityBadge, { userId });

  if (!activityBadge) {
    return null;
  }

  const { activityStatus, activityLabel, activityColor, responseLabel, respondsQuickly, averageResponseTimeMinutes } = activityBadge;

  const badgeSize = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  }[size];

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Activity Status Badge */}
      {activityLabel && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className={`${badgeSize} flex items-center gap-1.5`}
                style={{
                  backgroundColor: activityColor === "bg-green-500" ? "#22c55e15" : 
                                   activityColor === "bg-blue-500" ? "#3b82f615" : "#6b728015",
                  color: activityColor === "bg-green-500" ? "#22c55e" :
                         activityColor === "bg-blue-500" ? "#3b82f6" : "#6b7280",
                  borderColor: activityColor === "bg-green-500" ? "#22c55e50" :
                               activityColor === "bg-blue-500" ? "#3b82f650" : "#6b728050",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: activityColor === "bg-green-500" ? "#22c55e" :
                                     activityColor === "bg-blue-500" ? "#3b82f6" : "#6b7280",
                  }}
                />
                {activityLabel}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {activityStatus === "active_now" && "Online right now"}
                {activityStatus === "active_today" && "Active within the last 24 hours"}
                {activityStatus === "active_week" && "Active within the last week"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Response Rate Badge */}
      {showResponseRate && responseLabel && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={`${badgeSize} flex items-center gap-1.5`}>
                <MessageCircle className="w-3 h-3" />
                {responseLabel}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Usually replies to messages</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Responds Quickly Badge */}
      {showResponseRate && respondsQuickly && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className={`${badgeSize} flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800`}>
                <CheckCheck className="w-3 h-3" />
                Quick Reply
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Responds in under {Math.round(averageResponseTimeMinutes)} minutes on average
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// Batch version for rendering multiple badges efficiently
interface BatchActivityBadgesProps {
  userIds: Id<"users">[];
  showResponseRate?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BatchActivityBadges({ userIds, showResponseRate = true, size = "md" }: BatchActivityBadgesProps) {
  const badges = useQuery(api.activityTracking.getBatchActivityBadges, { userIds });

  if (!badges) {
    return null;
  }

  return (
    <>
      {userIds.map((userId) => {
        const badge = badges[userId];
        if (!badge) return null;

        return (
          <div key={userId}>
            <ActivityBadge userId={userId} showResponseRate={showResponseRate} size={size} />
          </div>
        );
      })}
    </>
  );
}
