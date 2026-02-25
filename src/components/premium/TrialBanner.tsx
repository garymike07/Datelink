import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles, Zap, MessageCircle, Eye } from "lucide-react";

/**
 * TrialBanner — shown on Discover, Messages, and Chat pages.
 * Displays:
 *   - Active trial countdown
 *   - Active daily-unlock countdown
 *   - Upgrade CTA when both have expired (with daily usage stats)
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

  const dailyUsage = useQuery(
    api.subscriptions.getDailyUsageStats,
    userId && status?.trialUsed && !status?.trialActive && !status?.dailyUnlockActive && !isPremium
      ? { userId }
      : "skip"
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

  // Trial expired — show upgrade CTA with daily usage stats
  if (status.trialUsed) {
    const msgRemaining = dailyUsage?.messagesRemaining ?? 0;
    const viewsRemaining = dailyUsage?.profileViewsRemaining ?? 0;
    const msgLimit = dailyUsage?.dailyMessageLimit ?? 20;
    const viewLimit = dailyUsage?.dailyProfileViewLimit ?? 10;

    return (
      <div className="rounded-lg mb-3 bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Free trial ended. Limited access active.</span>
          </span>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 border-amber-400 text-amber-700 hover:bg-amber-100"
              onClick={() => navigate("/subscription?daily=1")}
            >
              <Zap className="w-3 h-3 mr-1" />
              KES 10/day
            </Button>
            <Button
              size="sm"
              className="text-xs h-7 bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 hover:opacity-90"
              onClick={() => navigate("/subscription")}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          </div>
        </div>
        {dailyUsage && (
          <div className="flex gap-4 px-4 pb-2 text-xs text-amber-600 dark:text-amber-400">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {msgRemaining}/{msgLimit} messages today
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {viewsRemaining}/{viewLimit} profile views today
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
}
