import { X, Heart, Star, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SwipeActionsProps {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onInfo?: () => void;
  onRewind?: () => void;  canRewind?: boolean;
  isPremium?: boolean;
  disabled?: boolean;}

export const SwipeActions = ({
  onPass,
  onLike,
  onSuperLike,
  onInfo,
  onRewind,
  canRewind = false,
  isPremium = false,
  disabled = false,
}: SwipeActionsProps) => {
  return (
    <div className="flex items-center justify-center gap-3 w-full px-4">
      <TooltipProvider>

        {/* Rewind Button - Premium only */}
        {onRewind && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                disabled={!canRewind || disabled}
                className="w-12 h-12 rounded-full bg-white text-yellow-500 shadow-elevated border-2 border-transparent hover:border-yellow-500 hover:bg-white transition-all hover:scale-110 disabled:opacity-40 disabled:hover:scale-100"
                onClick={onRewind}
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{canRewind ? "Undo last swipe" : isPremium ? "No recent swipes" : "Premium feature"}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Pass Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              disabled={disabled}
              className="w-16 h-16 rounded-full bg-white text-destructive shadow-elevated border-2 border-transparent hover:border-destructive hover:bg-white transition-all hover:scale-110 active:scale-95 disabled:opacity-40 group"
              onClick={onPass}
            >
              <X className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pass</p>
          </TooltipContent>
        </Tooltip>

        {/* Like Button - Main CTA Enhanced */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              disabled={disabled}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-primary via-rose-500 to-pink-600 text-white shadow-glow-strong hover:shadow-glow-strong transition-all hover:scale-110 hover:-translate-y-1 active:scale-95 disabled:opacity-40 relative overflow-hidden group"
              onClick={onLike}
            >
              <Heart className="w-10 h-10 fill-current animate-pulse-soft group-hover:scale-110 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Like</p>
          </TooltipContent>
        </Tooltip>

        {/* Super Like Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              disabled={disabled}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all hover:scale-110 active:scale-95 disabled:opacity-40 group"
              onClick={onSuperLike}
            >
              <Star className="w-8 h-8 fill-current group-hover:rotate-[360deg] group-hover:scale-110 transition-all duration-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPremium ? "Super Like (stand out!)" : "Super Like (Premium)"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Info Button */}
        {onInfo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                disabled={disabled}
                className="w-12 h-12 rounded-full bg-white text-primary shadow-elevated border-2 border-transparent hover:border-primary hover:bg-white transition-all hover:scale-110 disabled:opacity-40"
                onClick={onInfo}
              >
                <Info className="w-6 h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View full profile</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};
