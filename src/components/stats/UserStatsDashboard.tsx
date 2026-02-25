import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Heart, MessageCircle, Users, TrendingUp, Zap, Award, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface UserStatsDashboardProps {
  userId: Id<"users">;
}

export function UserStatsDashboard({ userId }: UserStatsDashboardProps) {
  const profileTier = useQuery(api.profileScore.getProfileTier, { userId });
  const activityBadge = useQuery(api.activityTracking.getActivityBadge, { userId });
  const profileViews = useQuery(api.activityTracking.getProfileViewStats, { userId, timeframe: "week" });
  const streakStatus = useQuery(api.dailyRewards.getStreakStatus, { userId });

  if (!profileTier || !activityBadge || !profileViews || !streakStatus) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      icon: Eye,
      label: "Profile Views",
      value: profileViews.totalViews,
      subtext: `${profileViews.uniqueViewers} unique viewers`,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      icon: Heart,
      label: "Profile Score",
      value: `${profileTier.percentage}%`,
      subtext: profileTier.tierMessage,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-950",
    },
    {
      icon: MessageCircle,
      label: "Response Rate",
      value: `${activityBadge.responseRate}%`,
      subtext: activityBadge.responseLabel || "Keep messaging!",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      icon: Zap,
      label: "Login Streak",
      value: streakStatus.currentStreak,
      subtext: `Best: ${streakStatus.longestStreak} days`,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Dating Stats
          </CardTitle>
          <CardDescription>
            Track your progress and see how you're doing
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="engagement" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Engagement</CardTitle>
              <CardDescription>How users are interacting with your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Views Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profile Views (This Week)</span>
                  <span className="text-2xl font-bold text-blue-600">{profileViews.totalViews}</span>
                </div>
                <Progress value={Math.min((profileViews.totalViews / 50) * 100, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {profileViews.totalViews < 50 ? `${50 - profileViews.totalViews} more views to reach 50!` : "Great visibility! 🎉"}
                </p>
              </div>

              {/* Today's Activity */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Today's Views</p>
                    <p className="text-xs text-muted-foreground">People who viewed your profile today</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {profileViews.todayViews}
                  </Badge>
                </div>
              </div>

              {/* Engagement Tips */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">💡 Boost Your Engagement</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Complete your profile to {profileTier.percentage}% for better visibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Log in daily to maintain your streak and earn rewards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Reply to messages quickly to improve your response rate</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Activity</CardTitle>
              <CardDescription>Your engagement patterns and consistency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Response Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Message Response Rate</span>
                  <span className="text-2xl font-bold text-green-600">{activityBadge.responseRate}%</span>
                </div>
                <Progress value={activityBadge.responseRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {activityBadge.responseRate >= 80 && "Excellent! You reply to most messages 🎉"}
                  {activityBadge.responseRate >= 50 && activityBadge.responseRate < 80 && "Good! Keep it up"}
                  {activityBadge.responseRate < 50 && "Try to reply more to increase matches"}
                </p>
              </div>

              {/* Response Time */}
              {activityBadge.respondsQuickly && (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-600">Quick Responder Badge</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You respond to messages in under {Math.round(activityBadge.averageResponseTimeMinutes)} minutes on average!
                  </p>
                </div>
              )}

              {/* Login Streak */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Streak</span>
                  <span className="text-2xl font-bold text-orange-600">{streakStatus.currentStreak} days</span>
                </div>
                <Progress value={(streakStatus.currentStreak / streakStatus.longestStreak) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Personal best: {streakStatus.longestStreak} days
                  {streakStatus.nextReward && ` • Next reward in ${streakStatus.nextReward.day - streakStatus.currentStreak} days`}
                </p>
              </div>

              {/* Activity Status */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Activity Status</p>
                    <p className="text-xs text-muted-foreground">How others see your status</p>
                  </div>
                  <Badge variant="secondary">
                    {activityBadge.activityLabel || "Offline"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personalized Insights</CardTitle>
              <CardDescription>AI-powered tips to improve your dating success</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Strength Insight */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold mb-1">Profile Strength: {profileTier.tier}</p>
                    <p className="text-xs text-muted-foreground">
                      {profileTier.percentage < 70 && "Complete your profile to attract 10x more matches. Users with complete profiles get significantly more attention."}
                      {profileTier.percentage >= 70 && profileTier.percentage < 90 && "Your profile is looking good! Add a few more details to make it perfect."}
                      {profileTier.percentage >= 90 && "Amazing profile! You're all set to find great matches."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Best Time to Be Active */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold mb-1">Peak Activity Times</p>
                    <p className="text-xs text-muted-foreground">
                      Most users are active between 7 PM - 10 PM on weekdays and 2 PM - 11 PM on weekends. 
                      Being online during these times increases your chances of getting matches!
                    </p>
                  </div>
                </div>
              </div>

              {/* Success Factors */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold mb-1">What's Working</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {profileViews.totalViews > 10 && (
                        <li>✓ Your profile is getting good visibility ({profileViews.totalViews} views this week)</li>
                      )}
                      {activityBadge.responseRate >= 70 && (
                        <li>✓ Your response rate is excellent - keep engaging with matches</li>
                      )}
                      {streakStatus.currentStreak >= 3 && (
                        <li>✓ Great consistency with your {streakStatus.currentStreak} day login streak</li>
                      )}
                      {profileTier.percentage >= 80 && (
                        <li>✓ Your profile completion is strong ({profileTier.percentage}%)</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Areas to Improve */}
              {(profileTier.percentage < 80 || activityBadge.responseRate < 70 || streakStatus.currentStreak < 3) && (
                <div className="p-4 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1 text-orange-600">Quick Wins</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {profileTier.percentage < 80 && (
                          <li>→ Complete your profile to {100 - profileTier.percentage}% more (+{100 - profileTier.percentage} points)</li>
                        )}
                        {activityBadge.responseRate < 70 && (
                          <li>→ Reply to more messages to boost your response rate</li>
                        )}
                        {streakStatus.currentStreak < 3 && (
                          <li>→ Log in daily to build your streak and earn rewards</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
