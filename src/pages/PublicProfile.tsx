import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Briefcase, GraduationCap, Heart, MapPin, Ruler, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileUnlockModal } from "@/components/profile/ProfileUnlockModal";
import { Badge } from "@/components/ui/badge";

const PublicProfile = () => {
    const navigate = useNavigate();
    const { userId: profileUserId } = useParams();

    const { user: viewer } = useAuth();
    const viewerId = viewer?._id;
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    const profile = useQuery(
        api.profiles.getProfileById,
        profileUserId && viewerId
            ? { userId: profileUserId as any, viewerId }
            : "skip"
    );

    // Check if user can view this profile
    const canView = useQuery(
        api.profileUnlocks.canViewProfile,
        profileUserId && viewerId
            ? { userId: viewerId, targetUserId: profileUserId as any }
            : "skip"
    );

    if (profile === undefined) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-center animate-pulse-soft">
                    <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (profile === null) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">Profile not available</h2>
                <p className="text-muted-foreground mb-6">This profile may be unavailable or blocked.</p>
                <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
            </div>
        );
    }

    const photos = profile.photos || [];
    const primaryPhoto = photos.find((p: any) => p.isPrimary) || photos[0];

    // Check if profile needs to be unlocked
    const needsUnlock = canView && !canView.canView && canView.needsUnlock;
    const isBlurred = needsUnlock;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-heading font-bold text-foreground">Profile</h1>
                    <p className="text-sm text-muted-foreground">Read-only</p>
                </div>
            </div>

            <Card className="overflow-hidden glass-card border-none">
                <CardContent className="p-0">
                    <div className="relative">
                        {/* Unlock Overlay */}
                        {needsUnlock && (
                            <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center text-white p-6">
                                    <Lock className="w-16 h-16 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold mb-2">Profile Locked</h3>
                                    <p className="text-sm mb-4 max-w-md">
                                        {canView.reason === "free_trial_available" 
                                            ? `Unlock this profile using your free trial (${canView.unlocksRemaining} remaining)`
                                            : "Unlock this profile to view full details"}
                                    </p>
                                    <Button onClick={() => setShowUnlockModal(true)} size="lg">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Unlock Profile
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center py-6">
                            <div className={`w-32 h-32 rounded-full overflow-hidden bg-black/5 ${isBlurred ? 'blur-xl' : ''}`}>
                                {primaryPhoto ? (
                                    <img src={primaryPhoto.url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Heart className="w-12 h-12 text-primary/30" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`p-5 ${isBlurred ? 'blur-lg' : ''}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-2xl font-heading font-bold truncate flex items-center gap-2">
                                        {profile.name || "Unknown"}{profile.age ? `, ${profile.age}` : ""}
                                        {needsUnlock && (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                <Lock className="w-3 h-3 mr-1" />
                                                Locked
                                            </Badge>
                                        )}
                                    </h2>
                                    <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                                        {profile.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span className="truncate">{profile.location}</span>
                                            </div>
                                        )}
                                        {profile.jobTitle && (
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                <span className="truncate">
                                                    {profile.jobTitle}{profile.company ? ` at ${profile.company}` : ""}
                                                </span>
                                            </div>
                                        )}
                                        {profile.education && (
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4" />
                                                <span className="truncate">{profile.education}</span>
                                            </div>
                                        )}
                                        {profile.height && (
                                            <div className="flex items-center gap-2">
                                                <Ruler className="w-4 h-4" />
                                                <span>{profile.height} cm</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {profile.bio && (
                                <p className="mt-4 text-sm text-foreground/90 whitespace-pre-line">{profile.bio}</p>
                            )}

                            {profile.interests && profile.interests.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {profile.interests.map((interest: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                                        >
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-6">
                                <h3 className="text-sm font-semibold mb-3">Photos</h3>
                                {photos.length === 0 ? (
                                    <div className="h-32 bg-secondary/10 rounded-lg flex items-center justify-center">
                                        <Heart className="w-10 h-10 text-secondary/30" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {photos.map((p: any) => (
                                            <div key={p._id} className="aspect-[3/4] overflow-hidden rounded-lg bg-black/5">
                                                <img src={p.url} alt="Photo" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Unlock Modal */}
            {profileUserId && (
                <ProfileUnlockModal
                    isOpen={showUnlockModal}
                    onClose={() => setShowUnlockModal(false)}
                    targetUserId={profileUserId}
                    targetUserName={profile?.name}
                    onUnlockSuccess={() => {
                        // Refresh the page or just close modal - canView query will auto-refresh
                        setShowUnlockModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default PublicProfile;
