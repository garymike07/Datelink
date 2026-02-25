import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ProfileCard } from "./ProfileCard";

interface Photo {
  _id?: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

interface Profile {
  userId: string;
  name: string;
  age: number;
  location?: string;
  jobTitle?: string;
  bio?: string;
  photos: Photo[];
  interests: string[];
  isPremium?: boolean;
  distanceKm?: number | null;
  distanceCity?: string | null;
  passportMode?: boolean;
}

interface CardStackProps {
  profiles: Profile[];
  currentIndex: number;
  currentUserId?: string;
  onSwipeLeft: (profile: Profile) => void;
  onSwipeRight: (profile: Profile) => void;
  onSwipeUp: (profile: Profile) => void;
  onInfoClick?: (profile: Profile) => void;
}

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 15;

export const CardStack = ({
  profiles,
  currentIndex,
  currentUserId,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onInfoClick,
}: CardStackProps) => {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Rotation based on horizontal drag
  const rotate = useTransform(x, [-200, 200], [-ROTATION_FACTOR, ROTATION_FACTOR]);
  
  // Opacity overlays for visual feedback
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);
  const superLikeOpacity = useTransform(y, [-100, 0], [1, 0]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    // Super Like (swipe up)
    if (info.offset.y < -SWIPE_THRESHOLD) {
      setExitDirection('up');
      onSwipeUp(currentProfile);
      return;
    }

    // Like (swipe right)
    if (info.offset.x > SWIPE_THRESHOLD) {
      setExitDirection('right');
      onSwipeRight(currentProfile);
      return;
    }

    // Pass (swipe left)
    if (info.offset.x < -SWIPE_THRESHOLD) {
      setExitDirection('left');
      onSwipeLeft(currentProfile);
      return;
    }

    // Reset if not enough swipe
    x.set(0);
    y.set(0);
  };

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];
  const afterNextProfile = profiles[currentIndex + 2];

  if (!currentProfile) {
    return null;
  }

  return (
    <div className="relative w-full h-[65vh] md:h-[75vh] max-w-md mx-auto perspective-1000">
      {/* Card stack with 3 cards visible */}
      
      {/* Third card (background) */}
      {afterNextProfile && (
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 0.9, y: 30, opacity: 0.5 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full h-full rounded-3xl bg-white shadow-xl opacity-50 border border-white/50" />
        </motion.div>
      )}

      {/* Second card (middle) */}
      {nextProfile && (
        <motion.div
          className="absolute inset-0 z-10"
          initial={{ scale: 0.95, y: 15, opacity: 0.8 }}
          animate={{ scale: 0.95, y: 15, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <ProfileCard profile={nextProfile} currentUserId={currentUserId} />
        </motion.div>
      )}

      {/* Current card (top) */}
      <motion.div
        className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
        style={{
          x,
          y,
          rotate,
        }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        initial={{ scale: 1, opacity: 1 }}
        animate={
          exitDirection
            ? {
                x: exitDirection === 'left' ? -1000 : exitDirection === 'right' ? 1000 : 0,
                y: exitDirection === 'up' ? -1000 : 0,
                opacity: 0,
                rotate: exitDirection === 'left' ? -45 : exitDirection === 'right' ? 45 : 0,
              }
            : { scale: 1, opacity: 1, x: 0, y: 0 }
        }
        transition={{ duration: 0.4, ease: "easeInOut" }}
        onAnimationComplete={() => {
          if (exitDirection) {
            setExitDirection(null);
            x.set(0);
            y.set(0);
          }
        }}
      >
        <div className="w-full h-full shadow-2xl rounded-3xl overflow-hidden bg-card border-4 border-white/50">
            <ProfileCard 
              profile={currentProfile}
              currentUserId={currentUserId}
              onInfoClick={onInfoClick ? () => onInfoClick(currentProfile) : undefined}
            />
        </div>

        {/* Like Overlay (right swipe feedback) */}
        <motion.div
          className="absolute top-10 left-8 z-30 pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <div className="border-4 border-green-500 text-green-500 font-extrabold text-4xl px-4 py-2 rounded-xl -rotate-12 bg-white/20 backdrop-blur-sm shadow-lg">
            LIKE
          </div>
        </motion.div>

        {/* Pass Overlay (left swipe feedback) */}
        <motion.div
          className="absolute top-10 right-8 z-30 pointer-events-none"
          style={{ opacity: passOpacity }}
        >
          <div className="border-4 border-red-500 text-red-500 font-extrabold text-4xl px-4 py-2 rounded-xl rotate-12 bg-white/20 backdrop-blur-sm shadow-lg">
            NOPE
          </div>
        </motion.div>

        {/* Super Like Overlay (up swipe feedback) */}
        <motion.div
          className="absolute bottom-32 left-0 right-0 z-30 pointer-events-none flex justify-center"
          style={{ opacity: superLikeOpacity }}
        >
          <div className="border-4 border-blue-500 text-blue-500 font-extrabold text-4xl px-4 py-2 rounded-xl -rotate-6 bg-white/20 backdrop-blur-sm shadow-lg">
            SUPER LIKE
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
