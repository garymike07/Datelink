import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileViewsCounterProps {
  userId: Id<"users">;
  variant?: "card" | "compact" | "stat";
}

export function ProfileViewsCounter({ userId, variant = "card" }: ProfileViewsCounterProps) {
  const viewsToday = useQuery(api.activityTracking.getProfileViewStats, {
    userId,
    timeframe: "today",
  });

  const viewsWeek = useQuery(api.activityTracking.getProfileViewStats, {
    userId,
    timeframe: "week",
  });

  const viewsMonth = useQuery(api.activityTracking.getProfileViewStats, {
    userId,
    timeframe: "month",
  });

  if (!viewsToday || !viewsWeek || !viewsMonth) {
    return null;
  }

  // Stat variant - just the number
  if (variant === "stat") {
    return (
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-muted-foreground" />
        <span className="text-2xl font-bold">{viewsWeek.totalViews}</span>
        <span className="text-sm text-muted-foreground">views this week</span>
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Profile Views</p>
                <p className="text-xs text-muted-foreground">
                  {viewsToday.todayViews} today • {viewsWeek.totalViews} this week
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{viewsWeek.totalViews}</p>
              {viewsToday.todayViews > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {viewsToday.todayViews} today
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full card variant
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Profile Views
        </CardTitle>
        <CardDescription>See who's interested in your profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Highlight */}
        {viewsToday.todayViews > 0 && (
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-3xl font-bold text-blue-600">{viewsToday.todayViews}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {viewsToday.uniqueViewers} unique visitor{viewsToday.uniqueViewers !== 1 ? 's' : ''}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        )}

        {/* Timeframe Tabs */}
        <Tabs defaultValue="week" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4 mt-4">
            <ViewStats stats={viewsToday} />
          </TabsContent>

          <TabsContent value="week" className="space-y-4 mt-4">
            <ViewStats stats={viewsWeek} />
          </TabsContent>

          <TabsContent value="month" className="space-y-4 mt-4">
            <ViewStats stats={viewsMonth} />
          </TabsContent>
        </Tabs>

        {/* Recent Viewers */}
        {viewsWeek.recentViewers && viewsWeek.recentViewers.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">RECENT VIEWERS</p>
            <div className="space-y-2">
              {viewsWeek.recentViewers.slice(0, 5).map((viewer: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={viewer.viewerPhoto} />
                      <AvatarFallback>
                        <Users className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium">Anonymous Viewer</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(viewer.viewedAt)}
                      </p>
                    </div>
                  </div>
                  {viewer.viewCount > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {viewer.viewCount}x
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Upgrade to Premium to see who viewed your profile
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ViewStats({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1">Total Views</p>
        <p className="text-2xl font-bold">{stats.totalViews}</p>
      </div>
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1">Unique Viewers</p>
        <p className="text-2xl font-bold">{stats.uniqueViewers}</p>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
