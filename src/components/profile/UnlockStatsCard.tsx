import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, TrendingUp } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface UnlockStatsCardProps {
  userId: Id<"users">;
}

export function UnlockStatsCard({ userId }: UnlockStatsCardProps) {
  const stats = useQuery(api.profileUnlocks.getUnlockStats, { userId });
  const trialStatus = useQuery(api.freeTrial.getFreeTrialStatus, { userId });

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Unlock className="w-4 h-4" />
          Profile Unlocks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{stats.freeTrialUnlocks}</div>
            <div className="text-xs text-muted-foreground">Free Trial</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{stats.premiumUnlocks}</div>
            <div className="text-xs text-muted-foreground">Premium</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded">
            <div className="text-2xl font-bold text-purple-600">{stats.paidUnlocks}</div>
            <div className="text-xs text-muted-foreground">Paid</div>
          </div>
        </div>

        {stats.totalSpent > 0 && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Spent on Unlocks:</span>
              <Badge variant="secondary">KES {stats.totalSpent}</Badge>
            </div>
            {stats.totalSpent >= 35 && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Tip: You could save with a monthly subscription (KES 350)!
              </p>
            )}
          </div>
        )}

        {trialStatus?.trialActive && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Free Trial Active</span>
              <Badge className="bg-green-600">
                {trialStatus.profileUnlocksRemaining} left
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Expires in {Math.ceil((trialStatus.trialEnds! - Date.now()) / (60 * 60 * 1000))} hours
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
