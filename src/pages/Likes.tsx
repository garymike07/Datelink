import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Heart, Sparkles, Lock, ArrowUpRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Likes() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"recent" | "distance" | "score">("recent");

  const { user } = useAuth();
  const userId = user._id;

  // Get who liked you data
  const likesData = useQuery(
    api.matching.getWhoLikedYou,
    userId ? { userId, sortBy } : "skip"
  );

  const likeUser = useMutation(api.matching.likeProfile);

  const isPremium = likesData?.isPremium || false;
  const count = likesData?.count || 0;
  const profiles = likesData?.profiles || [];

  const handleLikeBack = async (targetUserId: string) => {
    if (!userId) return;
    try {
      await likeUser({ userId, likedUserId: targetUserId });
      toast.success("Liked! You've matched!");
    } catch (error: any) {
      console.error("Error liking profile:", error);
      toast.error(error.message || "Failed to like profile");
    }
  };

  if (!userId) {
    return (
      <div className="container max-w-6xl mx-auto py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-3 md:px-4">
        <p>Please sign in to view who likes you.</p>
      </div>
    );
  }

  if (!likesData) {
    return (
      <div className="container max-w-6xl mx-auto py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-3 md:px-4">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500" fill="currentColor" />
            Who Likes You
          </h1>
          <p className="text-muted-foreground mt-1">
            {count === 0
              ? "No one has liked you yet"
              : count === 1
              ? "1 person likes you"
              : `${count} people like you`}
          </p>
        </div>

        {isPremium && count > 0 && (
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="distance">Closest</SelectItem>
              <SelectItem value="score">Best Match</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Free User View - Blurred Grid */}
      {!isPremium && count > 0 && (
        <div className="space-y-6">
          {/* Teaser - Show first profile */}
          {count > 0 && (
            <Card className="border-2 border-yellow-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold text-lg">Someone Special Likes You!</h3>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Premium to see who it is
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/upgrade")}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90"
                >
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Blurred Grid */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: Math.min(count, 9) }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg blur-lg" />
              ))}
            </div>

            {/* Overlay with CTA */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
              <div className="text-center space-y-4 p-6">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <Lock className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {count} {count === 1 ? "Person Likes" : "People Like"} You!
                  </h2>
                  <p className="text-white/90 mb-4">
                    Match instantly with people who already like you
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/upgrade")}
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white font-semibold"
                >
                  See Who Likes You
                  <ArrowUpRight className="h-5 w-5 ml-2" />
                </Button>
                <p className="text-white/80 text-sm">
                  Join 5,000+ Premium members
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium User View - Full Grid */}
      {isPremium && count > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile: any) => (
            <Card key={profile.userId} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-[3/4]">
                <img
                  src={profile.photos[0] || "/placeholder.svg"}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
                {/* Match Score Badge */}
                {profile.matchScore >= 70 && (
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                    {profile.matchScore}% Match
                  </Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {profile.name}, {profile.age}
                  </h3>
                  <p className="text-sm text-muted-foreground">{profile.location}</p>
                </div>

                {profile.bio && (
                  <p className="text-sm line-clamp-2">{profile.bio}</p>
                )}

                {profile.mutualInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {profile.mutualInterests.slice(0, 3).map((interest: string) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {profile.mutualInterests.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{profile.mutualInterests.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleLikeBack(profile.userId)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:opacity-90"
                  >
                    <Heart className="h-4 w-4 mr-2" fill="currentColor" />
                    Like Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/profile/${profile.userId}`)}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {count === 0 && (
        <div className="text-center py-12">
          <div className="bg-muted p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No Likes Yet</h2>
          <p className="text-muted-foreground mb-6">
            Keep swiping! Your perfect match might be just around the corner.
          </p>
          <Button onClick={() => navigate("/discover")}>
            Start Swiping
            <ArrowUpRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
