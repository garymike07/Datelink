import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NewInAreaCarouselProps {
  userId: string;
  daysBack?: number;
  limit?: number;
}

const NewInAreaCarousel: React.FC<NewInAreaCarouselProps> = ({
  userId,
  daysBack = 7,
  limit = 10,
}) => {
  const navigate = useNavigate();
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const newProfiles = useQuery(api.discovery.getNewInArea, {
    userId,
    daysBack,
    limit,
  });

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

  if (!newProfiles) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">New in Your Area</h2>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-48 h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (newProfiles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">New in Your Area</h2>
          <p className="text-sm text-muted-foreground">
            {newProfiles.length} new {newProfiles.length === 1 ? "person" : "people"} joined recently
          </p>
        </div>
        <div className="flex gap-2">
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
        {newProfiles.map((profile: any) => {
          const primaryPhoto = profile.photos.find((p: any) => p.isPrimary) || profile.photos[0];
          
          return (
            <Card
              key={profile._id}
              className="w-48 flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/profile/${profile.userId}`)}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={primaryPhoto?.url || "/placeholder.svg"}
                    alt={profile.name}
                    className="w-full h-64 object-cover rounded-t-lg"
                  />
                  <Badge
                    className="absolute top-2 right-2 bg-green-500"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {profile.joinedDaysAgo === 0 ? "Today" : `${profile.joinedDaysAgo}d ago`}
                  </Badge>
                </div>
                <div className="p-4 space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {profile.name}, {profile.age}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {profile.location}
                    </div>
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

export default NewInAreaCarousel;
