import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface ProfileCompletionScoreProps {
  userId: Id<"users">;
  variant?: "card" | "compact" | "inline";
}

export function ProfileCompletionScore({ userId, variant = "card" }: ProfileCompletionScoreProps) {
  const [showDetails, setShowDetails] = useState(false);
  const profileTier = useQuery(api.profileScore.getProfileTier, { userId });

  if (!profileTier) {
    return null;
  }

  const { percentage, totalScore, maxScore, completedItems, missingItems, tier, tierColor, tierMessage } = profileTier;

  // Compact inline variant for small spaces
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Progress value={percentage} className="h-2" />
        </div>
        <span className={`text-sm font-semibold ${tierColor}`}>{percentage}%</span>
      </div>
    );
  }

  // Compact variant for dashboard widgets
  if (variant === "compact") {
    return (
      <Card className="border-l-4" style={{ borderLeftColor: getColorFromTier(tier) }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Profile Strength</CardTitle>
              <CardDescription className="text-xs mt-1">{tierMessage}</CardDescription>
            </div>
            <div className={`text-3xl font-bold ${tierColor}`}>{percentage}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={percentage} className="h-2 mb-3" />
          {missingItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick wins:</p>
              {missingItems.slice(0, 2).map((item, idx) => (
                <div key={idx} className="text-xs flex items-start gap-2">
                  <Circle className="w-3 h-3 mt-0.5 text-muted-foreground" />
                  <span>{item.suggestion}</span>
                </div>
              ))}
              {missingItems.length > 2 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Show less" : `+${missingItems.length - 2} more suggestions`}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full card variant with all details
  return (
    <Card className="border-l-4" style={{ borderLeftColor: getColorFromTier(tier) }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Profile Completion</CardTitle>
            <CardDescription className="mt-1">{tierMessage}</CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${tierColor}`}>{percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalScore}/{maxScore} points
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div>
          <Progress value={percentage} className="h-3" />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {tier === "incomplete" && "Let's get started!"}
              {tier === "basic" && "Good start!"}
              {tier === "good" && "Keep going!"}
              {tier === "great" && "Almost there!"}
              {tier === "excellent" && "Perfect!"}
            </span>
            <span className="text-xs font-medium">{completedItems.length} items completed</span>
          </div>
        </div>

        {/* Missing Items - Top Priority */}
        {missingItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <span>Complete Your Profile</span>
              <span className="text-xs text-muted-foreground font-normal">
                (+{missingItems.reduce((sum, item) => sum + item.points, 0)} points)
              </span>
            </h4>
            <div className="space-y-2">
              {missingItems.slice(0, showDetails ? undefined : 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Circle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.item}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.suggestion}</p>
                  </div>
                  <div className="text-xs font-semibold text-primary">+{item.points}</div>
                </div>
              ))}
            </div>
            {missingItems.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Show less" : `Show ${missingItems.length - 5} more`}
                <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${showDetails ? "rotate-90" : ""}`} />
              </Button>
            )}
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && showDetails && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-green-600 dark:text-green-400">
              ✓ Completed ({completedItems.length})
            </h4>
            <div className="space-y-1">
              {completedItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="capitalize">{item.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        {percentage < 100 && (
          <div className="pt-4 border-t">
            <Link to="/profile-setup">
              <Button className="w-full" size="lg">
                Complete Profile
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Complete profiles get <strong>10x more matches!</strong>
            </p>
          </div>
        )}

        {percentage === 100 && (
          <div className="text-center py-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              🎉 Perfect Profile!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You're all set to find amazing matches
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getColorFromTier(tier: string): string {
  switch (tier) {
    case "incomplete":
      return "#ef4444"; // red
    case "basic":
      return "#f97316"; // orange
    case "good":
      return "#eab308"; // yellow
    case "great":
      return "#3b82f6"; // blue
    case "excellent":
      return "#22c55e"; // green
    default:
      return "#6b7280"; // gray
  }
}
