import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Gift, Trophy, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";
import confetti from "react-confetti";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DailyStreakWidgetProps {
  userId: Id<"users">;
  variant?: "card" | "compact" | "banner";
}

export function DailyStreakWidget({ userId, variant = "card" }: DailyStreakWidgetProps) {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimedReward, setClaimedReward] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const streakStatus = useQuery(api.dailyRewards.getStreakStatus, { userId });
  const claimDaily = useMutation(api.dailyRewards.claimDailyLogin);

  const handleClaimDaily = async () => {
    try {
      const result = await claimDaily({ userId });

      if (result.alreadyClaimed) {
        toast.info("Already claimed today!", {
          description: `Current streak: ${result.currentStreak} days`,
        });
        return;
      }

      if (result.rewardClaimed) {
        setClaimedReward(result.rewardClaimed);
        setShowRewardModal(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        toast.success(`Day ${result.currentStreak} claimed!`, {
          description: `Keep it up! ${result.nextReward ? `Next reward at ${result.nextReward.day} days` : ""}`,
        });
      }
    } catch (error: any) {
      toast.error("Failed to claim daily login", {
        description: error.message,
      });
    }
  };

  if (!streakStatus) {
    return null;
  }

  const { currentStreak, longestStreak, canClaimToday, nextReward, upcomingRewards } = streakStatus;

  // Compact banner variant for top of dashboard
  if (variant === "banner" && canClaimToday) {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Daily Login Reward</h3>
              <p className="text-sm opacity-90">
                {currentStreak > 0 ? `${currentStreak} day streak!` : "Start your streak today"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleClaimDaily}
            size="lg"
            className="bg-white text-orange-600 hover:bg-white/90"
          >
            <Gift className="w-5 h-5 mr-2" />
            Claim Now
          </Button>
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <Card className="border-l-4 border-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {currentStreak > 0 ? `${currentStreak} Day Streak` : "Start Your Streak"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {canClaimToday ? "Claim your daily reward" : "Come back tomorrow"}
                </p>
              </div>
            </div>
            {canClaimToday && (
              <Button onClick={handleClaimDaily} size="sm" variant="default">
                Claim
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full card variant
  return (
    <>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600" />
                Daily Login Streak
              </CardTitle>
              <CardDescription className="mt-1">
                Log in daily to earn rewards and boost your profile
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              <Flame className="w-4 h-4 mr-1 text-orange-600" />
              {currentStreak}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Streak Display */}
          <div className="text-center py-6 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className="w-8 h-8 text-orange-600" />
              <span className="text-5xl font-bold text-orange-600">{currentStreak}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStreak === 1 ? "Day Streak" : "Days Streak"}
            </p>
            {longestStreak > currentStreak && (
              <p className="text-xs text-muted-foreground mt-2">
                <Trophy className="w-3 h-3 inline mr-1" />
                Personal best: {longestStreak} days
              </p>
            )}
          </div>

          {/* Claim Button */}
          {canClaimToday ? (
            <Button
              onClick={handleClaimDaily}
              size="lg"
              className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
            >
              <Gift className="w-5 h-5 mr-2" />
              Claim Today's Reward
            </Button>
          ) : (
            <div className="text-center py-3 bg-muted rounded-lg">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">Already claimed today!</p>
              <p className="text-xs text-muted-foreground mt-1">Come back tomorrow</p>
            </div>
          )}

          {/* Next Reward */}
          {nextReward && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">NEXT REWARD</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{nextReward.icon}</div>
                  <div>
                    <p className="font-semibold text-sm">Day {nextReward.day}</p>
                    <p className="text-xs text-muted-foreground">{nextReward.description}</p>
                  </div>
                </div>
              </div>
              {nextReward.day > currentStreak && (
                <div className="mt-3">
                  <Progress 
                    value={(currentStreak / nextReward.day) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {nextReward.day - currentStreak} days to go
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Rewards */}
          {upcomingRewards && upcomingRewards.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">UPCOMING REWARDS</p>
              <div className="space-y-2">
                {upcomingRewards.slice(0, 4).map((reward) => (
                  <div
                    key={reward.day}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{reward.icon}</span>
                      <div>
                        <p className="text-xs font-medium">Day {reward.day}</p>
                        <p className="text-xs text-muted-foreground">{reward.description}</p>
                      </div>
                    </div>
                    {reward.day <= currentStreak + 5 && (
                      <Badge variant="secondary" className="text-xs">Soon</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reward Modal */}
      <Dialog open={showRewardModal} onOpenChange={setShowRewardModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              🎉 Reward Unlocked!
            </DialogTitle>
            <DialogDescription className="text-center">
              You've earned a special reward for your {claimedReward?.day}-day streak!
            </DialogDescription>
          </DialogHeader>
          {claimedReward && (
            <div className="py-6 text-center">
              <div className="text-6xl mb-4">{claimedReward.icon}</div>
              <h3 className="text-xl font-bold mb-2">{claimedReward.description}</h3>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                {claimedReward.type === "boost" && `${claimedReward.amount} Boost${claimedReward.amount > 1 ? 's' : ''}`}
                {claimedReward.type === "unlock" && `${claimedReward.amount} Unlock${claimedReward.amount > 1 ? 's' : ''}`}
                {claimedReward.type === "premium_trial" && `${claimedReward.amount} Day Premium`}
                {claimedReward.type === "badge" && "Special Badge"}
              </Badge>
            </div>
          )}
          <Button onClick={() => setShowRewardModal(false)} size="lg">
            Awesome!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
