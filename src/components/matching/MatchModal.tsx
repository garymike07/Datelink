import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useNavigate } from "react-router-dom";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    photo?: string;
  };
  matchedUser: {
    name: string;
    photo?: string;
    userId: string;
  };
  matchId?: string;
}

const MatchModal = ({ isOpen, onClose, currentUser, matchedUser, matchId }: MatchModalProps) => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Stop confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (matchId) {
      navigate(`/chat/${matchId}`);
    }
    onClose();
  };

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20">
          <DialogTitle className="sr-only">Match</DialogTitle>
          <DialogDescription className="sr-only">
            You matched with {matchedUser.name}
          </DialogDescription>
          <div className="text-center space-y-6 p-8">
            {/* Sparkles Animation */}
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-amber-500 animate-pulse-soft absolute -top-2 -left-2" />
                <Heart className="w-12 h-12 text-primary animate-pulse fill-primary" />
                <Sparkles className="w-16 h-16 text-amber-500 animate-pulse-soft absolute -bottom-2 -right-2" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-4xl font-heading font-bold bg-gradient-love bg-clip-text text-transparent">
                It's a Match!
              </h2>
              <p className="text-muted-foreground">
                You and {matchedUser.name} liked each other
              </p>
            </div>

            {/* Profile Photos */}
            <div className="flex justify-center items-center gap-4 py-4">
              {/* Current User Photo */}
              <div className="relative animate-slide-in-left">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {currentUser.photo ? (
                    <img
                      src={currentUser.photo}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-primary opacity-50" />
                    </div>
                  )}
                </div>
              </div>

              {/* Heart Icon */}
              <div className="animate-bounce-soft">
                <Heart className="w-8 h-8 text-primary fill-primary" />
              </div>

              {/* Matched User Photo */}
              <div className="relative animate-slide-in-right">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {matchedUser.photo ? (
                    <img
                      src={matchedUser.photo}
                      alt={matchedUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-primary opacity-50" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleSendMessage}
                size="lg"
                className="w-full bg-gradient-love shadow-lg hover:shadow-xl transition-all"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Send a Message
              </Button>
              <Button
                onClick={onClose}
                size="lg"
                variant="ghost"
                className="w-full"
              >
                Keep Swiping
              </Button>
            </div>

            {/* Pro Tip */}
            <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 rounded-lg p-3">
              💡 <span className="font-medium">Pro tip:</span> Break the ice with a comment about
              something you have in common!
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MatchModal;
