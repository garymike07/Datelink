import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export function NoMatchesEmptyState({ onStartDiscovering }: { onStartDiscovering: () => void }) {
  return (
    <div className="text-center py-20 glass-card rounded-3xl">
      <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
      <h2 className="text-xl font-semibold mb-2">No matches yet</h2>
      <p className="text-muted-foreground mb-6">Keep swiping to find your match!</p>
      <Button onClick={onStartDiscovering} variant="hero">
        Start Discovering
      </Button>
    </div>
  );
}
