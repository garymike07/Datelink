import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles, MessageCircle, Eye } from "lucide-react";

/**
 * TrialBanner — shown on the Subscription page and other key pages.
 * Displays:
 *   - Active trial countdown with upgrade CTA
 *   - Upgrade CTA when trial has expired (with daily usage stats)
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
    userId && status?.trialUsed && !status?.trialActive && !isPremium
      ? { userId }
      : "skip"
  );

  // Don't show banner for premium users
  if (!status || isPremium) return null;

  // Active trial
  if (status?.trialActive) {
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

  // Trial expired — show upgrade CTA with daily usage stats
  if (status && status.trialUsed) {
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
          <Button
            size="sm"
            className="text-xs h-7 bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 hover:opacity-90 shrink-0"
            onClick={() => navigate("/subscription")}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Upgrade Now
          </Button>
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
