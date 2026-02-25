import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyQuestsProps {
  userId: string;
  compact?: boolean;
}

const DailyQuests = ({ userId, compact = false }: DailyQuestsProps) => {
  const quests = useQuery(api.gamification.getActiveQuests, { userId });
  const userProgress = useQuery(api.gamification.getUserProgress, { userId });

  if (!quests || quests.length === 0) {
    return null;
  }

  if (compact) {
    // Compact view for dashboard
    const activeQuest = quests.find(q => !q.completedAt) || quests[0];
    
    return (
      <Card className="glass-card border-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Daily Quest
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              {userProgress?.xp || 0} XP
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{activeQuest.name}</span>
              {activeQuest.completedAt ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <span className="text-muted-foreground text-xs">
                  {activeQuest.progress}/{activeQuest.target}
                </span>
              )}
            </div>
            <Progress value={activeQuest.progressPercent} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">{activeQuest.description}</p>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold">Daily Quests</h3>
        </div>
        {userProgress && (
          <Badge variant="secondary">
            Level {userProgress.level} • {userProgress.xp} XP
          </Badge>
        )}
      </div>

      <div className="grid gap-4">
        {quests.map((quest) => (
          <Card key={quest._id} className="glass-card border-none">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {quest.name}
                    {quest.completedAt && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription>{quest.description}</CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  +{quest.xpReward} XP
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {quest.progress}/{quest.target}
                </span>
              </div>
              <Progress 
                value={quest.progressPercent} 
                className={`h-2 ${quest.completedAt ? 'bg-green-100' : ''}`}
              />
              {quest.completedAt && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed! XP awarded
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {userProgress && (
        <Card className="glass-card border-none bg-gradient-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Level Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Level {userProgress.level}</span>
              <span className="font-medium">
                {userProgress.xpProgress || 0}/{userProgress.xpNeeded || 1000} XP
              </span>
            </div>
            <Progress value={userProgress.progressPercent || 0} className="h-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyQuests;
