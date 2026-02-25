import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Heart, Eye, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { StatusViewersDialog } from "./StatusViewersDialog";

interface StatusViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: Id<"users">;
  initialPostIndex?: number;
}

export function StatusViewer({
  open,
  onOpenChange,
  targetUserId,
  initialPostIndex = 0,
}: StatusViewerProps) {
  const { user } = useAuth();
  const [currentPostIndex, setCurrentPostIndex] = useState(initialPostIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewersDialogOpen, setViewersDialogOpen] = useState(false);

  const statusData = useQuery(
    api.statusPosts.getUserStatusPosts,
    user?._id && targetUserId
      ? { userId: user._id, targetUserId }
      : "skip"
  );

  const viewStatus = useMutation(api.statusPosts.viewStatusPost);
  const likeStatus = useMutation(api.statusPosts.likeStatusPost);
  const deleteStatus = useMutation(api.statusPosts.deleteStatusPost);

  const isOwnStatus = user?._id === targetUserId;
  const currentPost = statusData?.posts[currentPostIndex];
  const totalPosts = statusData?.posts.length || 0;
  const userId = user?._id;
  const currentStatusId = currentPost?._id;

  const handleNext = useCallback(() => {
    if (currentPostIndex < totalPosts - 1) {
      setCurrentPostIndex(currentPostIndex + 1);
    } else {
      onOpenChange(false);
    }
  }, [currentPostIndex, onOpenChange, totalPosts]);

  const handlePrevious = useCallback(() => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1);
    }
  }, [currentPostIndex]);

  const handleLike = useCallback(async () => {
    if (currentPost && user) {
      await likeStatus({ userId: user._id, statusId: currentPost._id });
    }
  }, [currentPost, likeStatus, user]);

  const handleDelete = useCallback(async () => {
    if (currentPost && isOwnStatus && user) {
      await deleteStatus({ userId: user._id, statusId: currentPost._id });
      if (totalPosts > 1) {
        if (currentPostIndex === totalPosts - 1) {
          setCurrentPostIndex(currentPostIndex - 1);
        }
      } else {
        onOpenChange(false);
      }
    }
  }, [currentPost, currentPostIndex, deleteStatus, isOwnStatus, onOpenChange, totalPosts, user]);

  // Auto-advance timer
  useEffect(() => {
    // For your own status we don't auto-advance/auto-close so View/Like controls stay available.
    if (!open || !currentPost || isPaused || isOwnStatus) return;

    const duration = currentPost.type === "video" ? (currentPost.duration || 15) * 1000 : 5000;
    const interval = 50; // Update every 50ms for smooth progress
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const newProgress = (elapsed / duration) * 100;
      setProgress(newProgress);

      if (elapsed >= duration) {
        handleNext();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [open, isPaused, currentPost, isOwnStatus, handleNext]);

  // Mark as viewed when opening
  useEffect(() => {
    if (open && currentStatusId && !isOwnStatus && userId) {
      viewStatus({ userId, statusId: currentStatusId });
    }
  }, [open, currentStatusId, isOwnStatus, userId, viewStatus]);

  // Reset progress when post changes
  useEffect(() => {
    setProgress(0);
  }, [currentPostIndex]);

  if (!statusData || !currentPost) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="max-w-md h-[90vh] p-0 bg-black border-none overflow-hidden"
      >
        <DialogTitle className="sr-only">Status</DialogTitle>
        <DialogDescription className="sr-only">
          Viewing status from {statusData.userName}
        </DialogDescription>
        <div
          className="relative h-full w-full flex flex-col"
          onClick={() => setIsPaused(!isPaused)}
        >
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-50 flex gap-1">
            {statusData.posts.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all"
                  style={{
                    width:
                      index < currentPostIndex
                        ? "100%"
                        : index === currentPostIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10 border-2 border-white">
                <AvatarImage src={statusData.userPhoto} />
                <AvatarFallback>{statusData.userName[0]}</AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="font-semibold text-sm">{statusData.userName}</p>
                <p className="text-xs opacity-80">
                  {formatDistanceToNow(currentPost.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPost._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full flex items-center justify-center"
              >
                {currentPost.type === "text" ? (
                  <div
                    className="w-full h-full flex items-center justify-center p-8"
                    style={{
                      backgroundColor: currentPost.backgroundColor || "#667eea",
                    }}
                  >
                    <p
                      className="text-white text-2xl font-bold text-center"
                      style={{ fontFamily: currentPost.font || "inherit" }}
                    >
                      {currentPost.content}
                    </p>
                  </div>
                ) : currentPost.type === "image" ? (
                  <div className="relative w-full h-full">
                    <img
                      src={currentPost.mediaUrl}
                      alt="Status"
                      className="w-full h-full object-contain"
                    />
                    {currentPost.textContent && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-white text-lg font-semibold">
                          {currentPost.textContent}
                        </p>
                      </div>
                    )}
                  </div>
                ) : currentPost.type === "video" ? (
                  <div className="relative w-full h-full">
                    <video
                      src={currentPost.mediaUrl}
                      className="w-full h-full object-contain"
                      autoPlay
                      muted
                      playsInline
                    />
                    {currentPost.textContent && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-white text-lg font-semibold">
                          {currentPost.textContent}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            {currentPostIndex > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            {currentPostIndex < totalPosts - 1 && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
          </div>

          {/* Footer actions */}
          <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/60 to-transparent">
            {isOwnStatus ? (
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <button
                    className="flex items-center gap-1 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewersDialogOpen(true);
                    }}
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-sm font-semibold">{currentPost.viewCount}</span>
                  </button>
                  <button
                    className="flex items-center gap-1 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewersDialogOpen(true);
                    }}
                  >
                    <Heart className="w-5 h-5" />
                    <span className="text-sm font-semibold">{currentPost.likeCount}</span>
                  </button>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Button
                  size="lg"
                  variant="ghost"
                  className={`text-white hover:bg-white/20 ${
                    currentPost.isLiked ? "text-red-500" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike();
                  }}
                >
                  <Heart
                    className={`w-6 h-6 ${currentPost.isLiked ? "fill-current" : ""}`}
                  />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Viewers and Likers Dialog */}
      {isOwnStatus && currentPost && (
        <StatusViewersDialog
          open={viewersDialogOpen}
          onOpenChange={setViewersDialogOpen}
          viewers={currentPost.viewers || []}
          likers={currentPost.likers || []}
          viewCount={currentPost.viewCount || 0}
          likeCount={currentPost.likeCount || 0}
        />
      )}
    </Dialog>
  );
}
