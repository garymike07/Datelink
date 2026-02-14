import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, MapPin, Briefcase, GraduationCap, Ruler, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MatchListSkeleton } from "@/components/ui/skeletons/MatchListSkeleton";
import { NoMatchesEmptyState } from "@/components/empty-states/NoMatchesEmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { PaymentModal } from "@/components/premium/PaymentModal";

const Matches = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?._id;

    const matches = useQuery(api.matching.getMatches, userId ? { userId } : "skip");
    const likes = useQuery(api.matching.getLikes, userId ? { userId } : "skip");
    const ensureConversation = useMutation(api.messages.ensureConversation);

    const [unlockModalOpen, setUnlockModalOpen] = useState(false);
    const [unlockTargetId, setUnlockTargetId] = useState<string | null>(null);

    if (!matches || !likes) {
        return (
            <div className="max-w-4xl mx-auto px-2 py-4">
                <MatchListSkeleton />
            </div>
        );
    }

    const ProfileCard = ({ profileItem, onChat, showChat }: { profileItem: any; onChat?: () => void; showChat?: boolean }) => (
        <Card className={`overflow-hidden glass-panel border-white/40 hover:shadow-elevated transition-all duration-300 ${profileItem.isLocked ? 'relative' : ''}`}>
            <CardContent className="p-0">
                <div className="relative">
                    {profileItem.isLocked && (
                        <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center text-white">
                            <Lock className="w-8 h-8 mb-2 text-amber-500" />
                            <p className="text-xs font-bold mb-3">Match Locked</p>
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0" onClick={(e) => {
                                e.stopPropagation();
                                setUnlockTargetId(profileItem.matchId);
                                setUnlockModalOpen(true);
                            }}>Unlock for KES 10</Button>
                        </div>
                    )}
                    <div className={`grid grid-cols-3 gap-1 bg-black/5 ${profileItem.isLocked ? 'filter blur-sm grayscale' : ''}`}>
                        {(profileItem.profile?.photos || []).map((p: any) => (
                            <div key={p._id} className="aspect-[3/4] overflow-hidden">
                                <img src={p.url} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <div className="p-4">
                        <h3 className="font-heading font-bold text-xl truncate">{profileItem.name}{profileItem.profile?.age ? `, ${profileItem.profile.age}` : ""}</h3>
                        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                            {profileItem.profile?.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{profileItem.profile.location}</div>}
                            {profileItem.profile?.jobTitle && <div className="flex items-center gap-2"><Briefcase className="w-4 h-4" />{profileItem.profile.jobTitle}</div>}
                        </div>
                        {showChat && !profileItem.isLocked && (
                            <div className="mt-5">
                                <Button className="w-full bg-gradient-love shadow-lg" onClick={onChat}>
                                    <MessageCircle className="w-4 h-4 mr-2" /> Message
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-3xl font-heading font-bold mb-8">Your Matches</h1>
            {matches.length === 0 && likes.length === 0 ? (
                <NoMatchesEmptyState onStartDiscovering={() => navigate("/discover")} />
            ) : (
                <div className="space-y-10">
                    {matches.length > 0 && (
                        <div>
                            <h2 className="text-xl font-heading font-bold mb-4">Matches</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {matches.map((m: any) => <ProfileCard key={m.matchId} profileItem={m} showChat onChat={() => navigate(`/chat/${m.matchId}`)} />)}
                            </div>
                        </div>
                    )}
                    {likes.length > 0 && (
                        <div>
                            <h2 className="text-xl font-heading font-bold mb-4">Likes Sent</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {likes.map((l: any) => (
                                    <ProfileCard key={l.userId} profileItem={l} showChat onChat={async () => {
                                        if (!userId) return;
                                        try {
                                            if (l.matchId) navigate(`/chat/${l.matchId}`);
                                            else {
                                                const { matchId } = await ensureConversation({ userId, otherUserId: l.userId });
                                                navigate(`/chat/${matchId}`);
                                            }
                                        } catch (error: any) {
                                            const msg = error?.message || "";
                                            if (msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("pay")) {
                                                setUnlockTargetId(l.matchId || l.userId);
                                                setUnlockModalOpen(true);
                                                toast.error("Match quota reached. Please unlock to message.");
                                            } else toast.error(msg || "Error");
                                        }
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {userId && unlockTargetId && <PaymentModal userId={userId} isOpen={unlockModalOpen} onClose={() => setUnlockModalOpen(false)} mode="unlock" itemType="match" targetId={unlockTargetId} />}
        </div>
    );
};

export default Matches;
