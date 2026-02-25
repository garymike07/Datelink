import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles, Zap } from "lucide-react";

/**
 * TrialBanner — shown on Discover, Messages, and Chat pages.
 * Displays:
 *   - Active trial countdown
 *   - Active daily-unlock countdown
 *   - Upgrade CTA when both have expired
 */
export function TrialBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?._id;

  const status = useQuery(
    api.freeTrial.getFreeTrialStatus,
    userId ? { userId } : "skip"
  );

  const isPremium = useQuery(
    api.subscriptions.checkUserHasPremium,
    userId ? { userId } : "skip"
  );

  // Don't show banner for premium users
  if (!status || isPremium) return null;

  // Active trial
  if (status.trialActive) {
    const h = status.trialHoursRemaining ?? 0;
    const urgency = h <= 6;
    return (
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium rounded-lg mb-3 ${
          urgency
            ? "bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
            : "bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
        }`}
      >
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {urgency
              ? `Free trial expires in ${h}h — upgrade to keep access!`
              : `Free trial active — ${h}h remaining`}
          </span>
        </span>
        <Button
          size="sm"
          variant={urgency ? "destructive" : "outline"}
          className="shrink-0 text-xs h-7"
          onClick={() => navigate("/subscription")}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      </div>
    );
  }

  // Active daily unlock
  if (status.dailyUnlockActive) {
    const h = status.dailyUnlockHoursRemaining ?? 0;
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium rounded-lg mb-3 bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300">
        <span className="flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0" />
          <span>Daily access active — {h}h remaining</span>
        </span>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 text-xs h-7"
          onClick={() => navigate("/subscription")}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      </div>
    );
  }

  // Trial expired — show upgrade CTA
  if (status.trialUsed) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium rounded-lg mb-3 bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>Your free trial has ended. Upgrade to continue.</span>
        </span>
        <Button
          size="sm"
          className="shrink-0 text-xs h-7 bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0"
          onClick={() => navigate("/subscription")}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      </div>
    );
  }

  return null;
}
