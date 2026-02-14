import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Sparkles, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CardStack } from "@/components/discovery/CardStack";
import { SwipeActions } from "@/components/discovery/SwipeActions";
import { Badge } from "@/components/ui/badge";
import { AdvancedFilters } from "@/components/discovery/AdvancedFilters";
import { PassportMode } from "@/components/premium/PassportMode";
import { PaywallModal } from "@/components/premium/PaywallModal";
import { ProfileCardSkeleton } from "@/components/ui/skeletons/ProfileCardSkeleton";
import { OutOfProfilesEmptyState } from "@/components/empty-states/OutOfProfilesEmptyState";
import SavedSearches from "@/components/discovery/SavedSearches";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradePromptBanner } from "@/components/premium/UpgradePromptBanner";
import { PaymentModal } from "@/components/premium/PaymentModal";

const Discover = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [matchModalOpen, setMatchModalOpen] = useState(false);
    const [matchedProfile, setMatchedProfile] = useState<any>(null);
    const [matchedMatchId, setMatchedMatchId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);
    const [unlockItemType, setUnlockItemType] = useState<"profile" | "match" | "like">("profile");
    const [unlockTargetId, setUnlockTargetId] = useState<string | null>(null);

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [passportOpen, setPassportOpen] = useState(false);
    const [paywallFiltersOpen, setPaywallFiltersOpen] = useState(false);
    const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);

    const { user } = useAuth();
    const userId = user?._id;

    const savedSearchId = searchParams.get('savedSearchId');

    const profiles = useQuery(
        savedSearchId
            ? api.discovery.runSavedSearch
            : api.matching.getDiscoveryProfiles,
        savedSearchId
            ? { userId, searchId: savedSearchId as any, limit: 20 }
            : { userId, limit: 20 }
    );
    const entitlements = useQuery(api.subscriptions.getMyEntitlements, userId ? { userId } : "skip");
    const likeProfile = useMutation(api.matching.likeProfile);
    const passProfile = useMutation(api.matching.passProfile);
    const superLikeProfile = useMutation(api.matching.superLikeProfile);
    const rewindMutation = useMutation(api.matching.rewindLastAction);
    const rewindAvailability = useQuery(api.matching.getRewindAvailability, userId ? { userId } : "skip");
    const recordPhotoImpression = useMutation(api.analytics.recordPhotoImpression);

    const currentProfile = profiles?.[currentIndex];

    const handleSwipeRight = useCallback(async (profile: any) => {
        if (isProcessing || !userId) return;

        if (profile.isLocked) {
            setUnlockItemType("profile");
            setUnlockTargetId(profile.userId);
            setUnlockModalOpen(true);
            return;
        }

        setIsProcessing(true);

        try {
            const result = await likeProfile({ userId, likedUserId: profile.userId });
            setCurrentIndex((prev) => prev + 1);
            if (result.matched) {
                setMatchedProfile(profile);
                setMatchedMatchId(result.matchId);
                setMatchModalOpen(true);
            } else {
                toast.success("Liked! 💖");
            }
        } catch (error: any) {
            const msg = error?.message || "Error";
            if (typeof msg === "string" && (msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("pay"))) {
                setUnlockItemType("like");
                setUnlockTargetId(profile.userId);
                setUnlockModalOpen(true);
            } else {
                toast.error(msg);
                if (typeof msg === "string" && msg.toLowerCase().includes("upgrade")) {
                    setTimeout(() => navigate("/upgrade"), 1000);
                }
                setCurrentIndex((prev) => prev + 1);
            }
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, likeProfile, navigate, userId]);

    const handleSwipeLeft = useCallback(async (profile: any) => {
        if (isProcessing || !userId) return;
        setIsProcessing(true);
        setCurrentIndex((prev) => prev + 1);

        try {
            await passProfile({ userId, passedUserId: profile.userId });
        } catch (error: any) {
            toast.error(error.message || "Error");
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, passProfile, userId]);

    const handleSwipeUp = useCallback(async (profile: any) => {
        if (isProcessing || !userId) return;
        setIsProcessing(true);

        try {
            const result = await superLikeProfile({ userId, superLikedUserId: profile.userId });
            setCurrentIndex((prev) => prev + 1);
            if (result.matched) {
                setMatchedProfile(profile);
                setMatchedMatchId(result.matchId);
                setMatchModalOpen(true);
            } else {
                toast.success("Super Liked! 🌟");
            }
        } catch (error: any) {
            const msg = error?.message || "Error";
            toast.error(msg);
            if (typeof msg === "string" && msg.toLowerCase().includes("premium")) {
                setTimeout(() => navigate("/upgrade"), 1000);
            }
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, navigate, superLikeProfile, userId]);

    const handleInfoClick = useCallback((profile: any) => {
        if (profile.isLocked) {
            setUnlockItemType("profile");
            setUnlockTargetId(profile.userId);
            setUnlockModalOpen(true);
            return;
        }
        navigate(`/profile/${profile.userId}`);
    }, [navigate]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isTyping =
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    (target as any).isContentEditable);
            if (isTyping) return;
            if (!currentProfile) return;

            if (e.key === "ArrowRight") {
                e.preventDefault();
                void handleSwipeRight(currentProfile);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                void handleSwipeLeft(currentProfile);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                void handleSwipeUp(currentProfile);
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                handleInfoClick(currentProfile);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [currentProfile, handleInfoClick, handleSwipeLeft, handleSwipeRight, handleSwipeUp]);

    useEffect(() => {
        const primary = currentProfile?.photos?.find((p: any) => p.isPrimary) || currentProfile?.photos?.[0];
        if (!primary?._id || !currentProfile?.userId) return;

        recordPhotoImpression({
            photoId: primary._id,
            ownerUserId: currentProfile.userId,
            action: "impression",
        } as any).catch(() => {});
    }, [currentProfile?.userId, currentProfile?.photos, recordPhotoImpression]);

    const handleRewind = useCallback(async () => {
        if (!rewindAvailability?.canRewind || !userId) return;

        try {
            await rewindMutation({ userId });
            setCurrentIndex((prev) => Math.max(0, prev - 1));
            toast.success("Undid last swipe");
        } catch (error: any) {
            toast.error(error.message || "Failed to rewind");
        }
    }, [rewindAvailability?.canRewind, rewindMutation, userId]);

    const openFilters = () => {
        if (entitlements?.isPremium) return setFiltersOpen(true);
        setPaywallFiltersOpen(true);
    };

    const openPassport = () => {
        if (entitlements?.isPremium) return setPassportOpen(true);
        toast.error("Passport mode is a Premium feature");
        setTimeout(() => navigate("/upgrade"), 800);
    };

    if (!profiles || !entitlements) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] p-6">
                <ProfileCardSkeleton />
            </div>
        );
    }

    if (profiles.length === 0 || currentIndex >= profiles.length) {
        return (
            <OutOfProfilesEmptyState
                onViewMatches={() => navigate("/matches")}
                onChangePreferences={() => navigate("/settings")}
            />
        );
    }

    const likesLimitText = `${entitlements.dailyLikesUsed}/${entitlements.dailyLikesLimit}`;

    return (
        <div className="flex flex-col items-center w-full max-w-lg mx-auto h-full py-1 sm:py-2 gap-2 sm:gap-3 md:gap-4 relative">
            <div className="glass-panel rounded-3xl p-4 sm:p-5 md:p-6 shadow-glass-sm w-full">
                {userId && (
                    <div className="w-full px-2 sm:px-3 md:px-4 pt-1 sm:pt-2">
                        <UpgradePromptBanner userId={userId} />
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex items-center justify-between px-2 sm:px-3 md:px-4 pt-1 sm:pt-2 z-10"
                >
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={openFilters} className="rounded-full bg-white/70 backdrop-blur-md border-white/40 shadow-sm gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-foreground/80" />
                            <span className="text-xs font-semibold">Filters</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={openPassport} className="rounded-full bg-white/70 backdrop-blur-md border-white/40 shadow-sm gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-semibold">Passport</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSavedSearchesOpen(true)} className="rounded-full bg-white/70 backdrop-blur-md border-white/40 shadow-sm gap-2">
                            <Bookmark className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-semibold">Saved</span>
                        </Button>
                    </div>

                    <Badge variant="secondary" className="bg-white/90 backdrop-blur border-0 shadow-sm gap-1 px-3 py-1" title="Likes Quota">
                        <span className="text-primary">❤️</span>
                        {likesLimitText}
                    </Badge>
                </motion.div>

                <div className="flex-1 w-full relative flex items-center justify-center px-2 sm:px-3 md:px-4 min-h-[350px] sm:min-h-[400px]">
                    <CardStack
                        profiles={profiles}
                        currentIndex={currentIndex}
                        currentUserId={userId}
                        onSwipeLeft={handleSwipeLeft}
                        onSwipeRight={handleSwipeRight}
                        onSwipeUp={handleSwipeUp}
                        onInfoClick={handleInfoClick}
                    />
                </div>

                <div className="w-full px-4 sm:px-6 md:px-8 pb-2 sm:pb-3 md:pb-4 relative z-20">
                    <SwipeActions
                        onPass={() => currentProfile && handleSwipeLeft(currentProfile)}
                        onLike={() => currentProfile && handleSwipeRight(currentProfile)}
                        onSuperLike={() => currentProfile && handleSwipeUp(currentProfile)}
                        onInfo={() => currentProfile && handleInfoClick(currentProfile)}
                        onRewind={handleRewind}
                        canRewind={rewindAvailability?.canRewind || false}
                        isPremium={entitlements.isPremium}
                        disabled={isProcessing}
                    />
                </div>

                <Dialog open={matchModalOpen} onOpenChange={setMatchModalOpen}>
                    <DialogContent className="sm:max-w-md bg-transparent border-0 shadow-none text-white p-0 overflow-hidden">
                        <DialogDescription className="sr-only">You matched with {matchedProfile?.name}</DialogDescription>
                        <div className="absolute inset-0 bg-gradient-love opacity-95 backdrop-blur-xl rounded-3xl" />
                        <div className="relative p-8 flex flex-col items-center text-center">
                            <DialogHeader>
                                <DialogTitle className="text-center text-4xl font-heading font-extrabold text-white mb-2">It's a Match!</DialogTitle>
                                <p className="text-white/90 text-lg font-medium">You and {matchedProfile?.name} like each other</p>
                            </DialogHeader>
                            <div className="flex flex-col gap-3 w-full mt-10">
                                <Button className="w-full bg-white text-primary font-bold h-14 rounded-full" onClick={() => {
                                    setMatchModalOpen(false);
                                    navigate(matchedMatchId ? `/chat/${matchedMatchId}` : "/messages");
                                }}>Send a Message</Button>
                                <Button variant="ghost" className="w-full text-white h-12 rounded-full" onClick={() => setMatchModalOpen(false)}>Keep Swiping</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <AdvancedFilters userId={userId as any} isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />
                <PassportMode userId={userId as any} isOpen={passportOpen} onClose={() => setPassportOpen(false)} />
                <PaywallModal feature="filters" isOpen={paywallFiltersOpen} onClose={() => setPaywallFiltersOpen(false)} />

                {userId && unlockTargetId && (
                    <PaymentModal
                        userId={userId}
                        isOpen={unlockModalOpen}
                        onClose={() => setUnlockModalOpen(false)}
                        mode="unlock"
                        itemType={unlockItemType}
                        targetId={unlockTargetId}
                    />
                )}

                <Dialog open={savedSearchesOpen} onOpenChange={setSavedSearchesOpen}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Saved Searches</DialogTitle>
                            <DialogDescription>Manage your saved searches</DialogDescription>
                        </DialogHeader>
                        <SavedSearches userId={userId as any} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default Discover;
