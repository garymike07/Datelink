import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";

export function PlanBadge({ userId }: { userId: string }) {
  const subscription = useQuery(api.subscriptions.getMySubscription, { userId: userId as any });
  const isPremium = subscription?.status === "active";

  return (
    <Badge
      className={
        isPremium
          ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0"
          : ""
      }
      variant={isPremium ? "default" : "secondary"}
    >
      {isPremium ? "Premium" : "Free"}
    </Badge>
  );
}
