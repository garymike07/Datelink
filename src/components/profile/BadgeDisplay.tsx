import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface BadgeData {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
}

interface BadgeDisplayProps {
  badges: BadgeData[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const BadgeDisplay = ({ badges, maxDisplay = 3, size = "md", showTooltip = true }: BadgeDisplayProps) => {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = Math.max(0, badges.length - maxDisplay);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "legendary":
        return "bg-gradient-to-r from-amber-400 to-orange-500 text-white";
      case "epic":
        return "bg-gradient-to-r from-purple-400 to-pink-500 text-white";
      case "rare":
        return "bg-gradient-to-r from-blue-400 to-cyan-500 text-white";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-0.5";
      case "lg":
        return "text-base px-4 py-2";
      default:
        return "text-sm px-3 py-1";
    }
  };

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <TooltipProvider>
        {displayBadges.map((badge) => {
          const BadgeContent = (
            <Badge
              className={`${getRarityColor(badge.rarity)} ${getSizeClasses()} border-none shadow-sm`}
            >
              <span className="mr-1">{badge.icon}</span>
              <span>{badge.name}</span>
            </Badge>
          );

          if (!showTooltip) {
            return <div key={badge.badgeId}>{BadgeContent}</div>;
          }

          return (
            <Tooltip key={badge.badgeId}>
              <TooltipTrigger asChild>
                {BadgeContent}
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  <p className="text-xs text-muted-foreground capitalize">Rarity: {badge.rarity}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>

      {remainingCount > 0 && (
        <Badge variant="outline" className={getSizeClasses()}>
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
};

export default BadgeDisplay;
