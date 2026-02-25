import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, MapPin, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface TopCompatibleCarouselProps {
  userId: string;
  limit?: number;
}

const TopCompatibleCarousel: React.FC<TopCompatibleCarouselProps> = ({
  userId,
  limit = 10,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const compatibleProfiles = useQuery(api.compatibility.getTopCompatibleThisWeek, {
    userId,
    limit,
  });

  const recalculateScores = useMutation(api.compatibility.recalculateWeeklyScores);

  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      const result = await recalculateScores({ userId });
      toast({
        title: "Compatibility scores updated",
        description: `Calculated ${result.calculated} new compatibility scores`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    const newPosition =
      direction === "left"
        ? scrollPosition - scrollAmount
        : scrollPosition + scrollAmount;
    scrollRef.current.scrollTo({ left: newPosition, behavior: "smooth" });
    setScrollPosition(newPosition);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-gray-500";
  };

  if (!compatibleProfiles) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Most Compatible This Week</h2>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-64 h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (compatibleProfiles.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            No compatibility scores calculated yet.
          </p>
          <Button onClick={handleRecalculate} disabled={isCalculating}>
            {isCalculating ? "Calculating..." : "Calculate Compatibility Scores"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Most Compatible This Week</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Your best matches based on shared interests and values
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRecalculate}
            disabled={isCalculating}
          >
            {isCalculating ? "Calculating..." : "Refresh"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            disabled={scrollPosition <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {compatibleProfiles.map((profile: any) => {
          const primaryPhoto = profile.photos.find((p: any) => p.isPrimary) || profile.photos[0];
          const scoreColor = getScoreColor(profile.compatibilityScore);
          
          return (
            <Card
              key={profile._id}
              className="w-64 flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/profile/${profile.userId}`)}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={primaryPhoto?.url || "/placeholder.svg"}
                    alt={profile.name}
                    className="w-full h-80 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 bg-white dark:bg-gray-900 rounded-full p-2">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${scoreColor.replace('bg-', 'text-')}`}>
                        {profile.compatibilityScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Match</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {profile.name}, {profile.age}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {profile.location}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Compatibility</span>
                      <span className="font-semibold">{profile.compatibilityScore}%</span>
                    </div>
                    <Progress value={profile.compatibilityScore} className={scoreColor} />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary">
                      <Heart className="h-3 w-3 inline mr-1" />
                      {profile.matchReason}
                    </p>
                    {profile.compatibilityFactors && (
                      <div className="flex flex-wrap gap-1">
                        {profile.compatibilityFactors.interestOverlap > 15 && (
                          <Badge variant="secondary" className="text-xs">
                            Shared interests
                          </Badge>
                        )}
                        {profile.compatibilityFactors.goalAlignment > 15 && (
                          <Badge variant="secondary" className="text-xs">
                            Similar goals
                          </Badge>
                        )}
                        {profile.compatibilityFactors.lifestyleMatch > 12 && (
                          <Badge variant="secondary" className="text-xs">
                            Lifestyle match
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {profile.jobTitle && (
                    <p className="text-sm text-muted-foreground truncate">
                      {profile.jobTitle}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TopCompatibleCarousel;
