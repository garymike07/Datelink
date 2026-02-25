import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Star, Sparkles, Clock } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const TopPicks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?._id;

  const topPicks = useQuery(api.matching.getTopPicks, userId ? { userId } : "skip");
  const likeProfile = useMutation(api.matching.likeProfile);
  const passProfile = useMutation(api.matching.passProfile);
  const superLikeProfile = useMutation(api.matching.superLikeProfile);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Please log in to see your top picks</p>
      </div>
    );
  }

  if (!topPicks) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center animate-pulse-soft">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your top picks...</p>
        </div>
      </div>
    );
  }

  const profiles = topPicks.profiles || [];
  const currentProfile = profiles[currentIndex];

  const handleLike = async () => {
    if (!currentProfile || isAnimating) return;
    setIsAnimating(true);

    try {
      const result = await likeProfile({
        userId,
        likedUserId: currentProfile.userId,
      });

      if (result.matched) {
        toast.success("It's a Match! 🎉", {
          description: `You and ${currentProfile.name} liked each other!`,
        });
      } else {
        toast.success(`You liked ${currentProfile.name}!`);
      }

      // Move to next profile
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsAnimating(false);
      }, 300);
    } catch (error: any) {
      toast.error("Error", { description: error.message });
      setIsAnimating(false);
    }
  };

  const handlePass = async () => {
    if (!currentProfile || isAnimating) return;
    setIsAnimating(true);

    try {
      await passProfile({
        userId,
        passedUserId: currentProfile.userId,
      });

      // Move to next profile
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsAnimating(false);
      }, 300);
    } catch (error: any) {
      toast.error("Error", { description: error.message });
      setIsAnimating(false);
    }
  };

  const handleSuperLike = async () => {
    if (!currentProfile || isAnimating) return;
    setIsAnimating(true);

    try {
      const result = await superLikeProfile({
        userId,
        superLikedUserId: currentProfile.userId,
      });

      if (result.matched) {
        toast.success("It's a Match! 🎉", {
          description: `You and ${currentProfile.name} liked each other!`,
        });
      } else {
        toast.success(`You super liked ${currentProfile.name}! ⭐`);
      }

      // Move to next profile
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsAnimating(false);
      }, 300);
    } catch (error: any) {
      toast.error("Error", { description: error.message });
      setIsAnimating(false);
    }
  };

  const getRefreshTime = () => {
    if (!topPicks.refreshesAt) return "";
    const refreshDate = new Date(topPicks.refreshesAt);
    return refreshDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (profiles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:py-8">
        <div className="text-center space-y-4 sm:space-y-5 md:space-y-6">
          <div className="flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-primary animate-pulse-soft" />
          </div>
          <h1 className="text-3xl font-heading font-bold">No Top Picks Yet</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            We're working on finding your perfect matches. Check back later or start swiping to
            help us understand your preferences better.
          </p>
          <Button onClick={() => navigate("/discover")} size="lg" className="bg-gradient-love">
            Start Discovering
          </Button>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="max-w-4xl mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:py-8">
        <div className="text-center space-y-4 sm:space-y-5 md:space-y-6">
          <div className="flex items-center justify-center">
            <Clock className="w-16 h-16 text-primary animate-pulse-soft" />
          </div>
          <h1 className="text-3xl font-heading font-bold">You've Seen All Your Top Picks!</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            New picks will be available tomorrow at midnight. In the meantime, keep swiping in
            Discover!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/discover")} size="lg" className="bg-gradient-love">
              Continue Discovering
            </Button>
            <Button onClick={() => navigate("/matches")} size="lg" variant="outline">
              View Matches
            </Button>
          </div>
          {topPicks.refreshesAt && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              New picks refresh at {getRefreshTime()}
            </p>
          )}
        </div>
      </div>
    );
  }

  const primaryPhoto = currentProfile.photos?.[0];

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-5 md:mb-6 text-center space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary animate-pulse-soft" />
          <h1 className="text-3xl font-heading font-bold bg-gradient-love bg-clip-text text-transparent">
            Today's Top Picks
          </h1>
          <Sparkles className="w-6 h-6 text-primary animate-pulse-soft" />
        </div>
        <p className="text-muted-foreground">
          High-quality matches curated just for you
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>
            {currentIndex + 1} of {profiles.length}
          </span>
          {topPicks.refreshesAt && (
            <>
              <span>•</span>
              <Clock className="w-4 h-4" />
              <span>Refreshes at {getRefreshTime()}</span>
            </>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-md mx-auto">
        <Card
          className={`glass-card border-none overflow-hidden transition-all duration-300 ${
            isAnimating ? "scale-95 opacity-50" : "scale-100 opacity-100"
          }`}
        >
          {/* Photo */}
          <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/20 to-secondary/20">
            {primaryPhoto ? (
              <img
                src={primaryPhoto.url}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Heart className="w-16 h-16 text-muted-foreground opacity-20" />
              </div>
            )}

            {/* Match Score Badge */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                {currentProfile.matchScore}% Match
              </Badge>
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Profile Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">
                  {currentProfile.name}, {currentProfile.age}
                </h2>
                <p className="text-sm opacity-90">{currentProfile.location}</p>
                
                {/* Match Reason */}
                {currentProfile.matchReason && (
                  <div className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
                    <Sparkles className="w-3 h-3" />
                    <span>{currentProfile.matchReason}</span>
                  </div>
                )}

                {/* Bio Preview */}
                {currentProfile.bio && (
                  <p className="text-sm opacity-90 line-clamp-2 mt-2">
                    {currentProfile.bio}
                  </p>
                )}

                {/* Interests */}
                {currentProfile.interests && currentProfile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {currentProfile.interests.slice(0, 3).map((interest: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-none">
                        {interest}
                      </Badge>
                    ))}
                    {currentProfile.interests.length > 3 && (
                      <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-none">
                        +{currentProfile.interests.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              {/* Pass Button */}
              <Button
                onClick={handlePass}
                disabled={isAnimating}
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16 p-0 border-2 border-red-500 hover:bg-red-50 hover:border-red-600 transition-all"
              >
                <X className="w-8 h-8 text-red-500" />
              </Button>

              {/* Super Like Button */}
              <Button
                onClick={handleSuperLike}
                disabled={isAnimating}
                size="lg"
                className="rounded-full w-14 h-14 p-0 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all"
              >
                <Star className="w-6 h-6 text-white fill-white" />
              </Button>

              {/* Like Button */}
              <Button
                onClick={handleLike}
                disabled={isAnimating}
                size="lg"
                className="rounded-full w-16 h-16 p-0 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all"
              >
                <Heart className="w-8 h-8 text-white" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopPicks;
