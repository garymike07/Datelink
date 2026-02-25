import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Zap } from "lucide-react";

interface TrialExpiredGateProps {
  children: React.ReactNode;
  feature?: string; // e.g. "messaging" | "discover"
}

/**
 * Wraps a feature and shows a paywall overlay when:
 * - The user is not premium AND
 * - The free trial has expired AND
 * - No daily unlock is active
 */
export function TrialExpiredGate({ children, feature = "this feature" }: TrialExpiredGateProps) {
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

  // Allow access if premium or has full access
  if (!status || isPremium || status.hasFullAccess) {
    return <>{children}</>;
  }

  // Only block if trial was used and has expired
  if (!status.trialUsed) {
    return <>{children}</>;
  }

  // Show paywall overlay
  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl z-10 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">Your Free Trial Has Ended</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          Upgrade to Premium or pay KES 10 for 24-hour access to continue using {feature}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 hover:opacity-90"
            onClick={() => navigate("/subscription")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade — KES 100/wk
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/subscription?daily=1")}
          >
            <Zap className="w-4 h-4 mr-2" />
            KES 10 / Day
          </Button>
        </div>
      </div>
    </div>
  );
}
