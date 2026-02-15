import { X, Sparkles, Heart, RotateCcw, Zap, Sliders } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface PaywallModalProps {
  feature: "super_like" | "rewind" | "likes" | "boost" | "filters";
  isOpen: boolean;
  onClose: () => void;
}

const featureConfig = {
  super_like: {
    icon: Sparkles,
    title: "Unlock Super Likes",
    description: "Stand out and get 3x more matches by sending Super Likes!",
    benefits: [
      "Get noticed first in their stack",
      "Show you're really interested",
      "5 Super Likes per day with Premium",
    ],
    gradient: "from-blue-500 to-purple-600",
    price: "KES 100/week • KES 350/month",
  },
  rewind: {
    icon: RotateCcw,
    title: "Undo Your Last Swipe",
    description: "Made a mistake? Rewind lets you take back your last action!",
    benefits: [
      "Unlimited rewinds with Premium",
      "Never miss a potential match",
      "Go back up to 5 minutes",
    ],
    gradient: "from-yellow-500 to-orange-600",
    price: "KES 100/week • KES 350/month",
  },
  likes: {
    icon: Heart,
    title: "See Who Likes You",
    description: "Skip the guessing game and match instantly!",
    benefits: [
      "See all your likes at once",
      "Match with people who already like you",
      "Sort by distance, recent, or match score",
    ],
    gradient: "from-purple-600 to-emerald-500",
    price: "KES 100/week • KES 350/month",
  },
  boost: {
    icon: Zap,
    title: "Boost Your Profile",
    description: "Be the top profile in your area for 30 minutes!",
    benefits: [
      "Get 10x more profile views",
      "Appear first for 30 minutes",
      "1 free boost per month with Premium",
    ],
    gradient: "from-purple-600 to-emerald-500",
    price: "KES 100/week • KES 350/month",
  },
  filters: {
    icon: Sliders,
    title: "Advanced Filters",
    description: "Find exactly who you're looking for with precision filters!",
    benefits: [
      "Filter by education, religion, lifestyle",
      "Set specific relationship goals",
      "Filter by height, languages, and more",
    ],
    gradient: "from-green-500 to-teal-600",
    price: "KES 100/week • KES 350/month",
  },
};

export function PaywallModal({ feature, isOpen, onClose }: PaywallModalProps) {
  const navigate = useNavigate();
  const config = featureConfig[feature];
  const Icon = config.icon;

  const handleUpgrade = () => {
    onClose();
    navigate("/upgrade");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="flex flex-col items-center text-center space-y-4 py-4">
          {/* Icon with gradient background */}
          <div className={`bg-gradient-to-br ${config.gradient} p-4 rounded-full`}>
            <Icon className="h-8 w-8 text-white" />
          </div>

          {/* Title */}
          <DialogTitle className="text-2xl font-bold">{config.title}</DialogTitle>

          {/* Description */}
          <DialogDescription>{config.description}</DialogDescription>

          {/* Benefits */}
          <div className="w-full space-y-2 py-2">
            {config.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2 text-left">
                <div className={`bg-gradient-to-br ${config.gradient} p-1 rounded-full mt-0.5`}>
                  <div className="h-2 w-2 bg-white rounded-full" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Premium Badge */}
          <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0`}>
            Premium Feature
          </Badge>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2 w-full pt-2">
            <Button
              onClick={handleUpgrade}
              className={`bg-gradient-to-r ${config.gradient} hover:opacity-90 hover:scale-105 transition-all duration-300 text-white w-full shadow-lg`}
            >
              Upgrade to Premium
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full hover:bg-muted/50">
              Maybe Later
            </Button>
          </div>

          {/* Pricing Info */}
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <p className="text-sm font-semibold text-center">
              {config.price} • Pay via M-Pesa
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Simple pricing: KES 100/week or KES 350/month
            </p>
          </div>

          {/* Social Proof */}
          <p className="text-xs text-muted-foreground">
            Join 5,000+ Premium members finding love faster
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
