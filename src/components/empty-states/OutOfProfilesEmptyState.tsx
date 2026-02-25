import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export function OutOfProfilesEmptyState({
  onViewMatches,
  onChangePreferences,
}: {
  onViewMatches: () => void;
  onChangePreferences: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <div className="glass-card p-12 rounded-3xl max-w-md w-full">
        <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-heading font-bold mb-2">You've seen everyone in your area</h2>
        <p className="text-muted-foreground mb-8">
          Try expanding your preferences or check back later for new profiles.
        </p>
        <div className="space-y-3">
          <Button onClick={onViewMatches} variant="hero" className="w-full">
            View Your Matches
          </Button>
          <Button onClick={onChangePreferences} variant="outline" className="w-full">
            Change Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
