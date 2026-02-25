import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, Heart, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Id } from "../../../convex/_generated/dataModel";

interface UpgradePromptBannerProps {
  userId: Id<"users">;
}

export function UpgradePromptBanner({ userId }: UpgradePromptBannerProps) {
  const navigate = useNavigate();
  const recommendation = useQuery(
    api.progressiveDisclosure.getUpgradeRecommendation,
    { userId }
  );

  if (!recommendation) return null;

  const getIcon = () => {
    switch (recommendation.type) {
      case "likes_waiting":
        return <Heart className="w-5 h-5" />;
      case "trial_almost_done":
        return <Sparkles className="w-5 h-5" />;
      case "frequent_buyer":
        return <TrendingUp className="w-5 h-5" />;
      case "boost_visibility":
        return <Zap className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getColor = () => {
    switch (recommendation.urgency) {
      case "high":
        return "border-red-500 bg-red-50 text-red-900";
      case "medium":
        return "border-amber-500 bg-amber-50 text-amber-900";
      default:
        return "border-blue-500 bg-blue-50 text-blue-900";
    }
  };

  return (
    <Alert className={`${getColor()} border-2 mb-4`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{recommendation.title}</h4>
          <AlertDescription className="text-sm mb-3">
            {recommendation.message}
          </AlertDescription>
          <Button
            size="sm"
            onClick={() => navigate("/upgrade")}
            className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
          >
            {recommendation.cta}
          </Button>
        </div>
      </div>
    </Alert>
  );
}
