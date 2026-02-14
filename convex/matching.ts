import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { consumeSuperLike, isUserPremium } from "./subscriptions";
import { insertNotification } from "./notifications";
import { unlockItem, canAccessItem } from "./profileUnlocks";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const sLat = toRad(lat1);
    const eLat = toRad(lat2);
    const h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(sLat) * Math.cos(eLat) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
}

function getEffectiveLocation(profile: any): { lat?: number; lon?: number; city?: string; isPassport: boolean } {
    const now = Date.now();
    const passportActive =
        profile.passportLat !== undefined &&
        profile.passportLon !== undefined &&
        profile.passportExpiresAt !== undefined &&
        profile.passportExpiresAt > now;

    if (passportActive) {
        return {
            lat: profile.passportLat,
            lon: profile.passportLon,
            city: profile.passportCity || profile.location,
            isPassport: true,
        };
    }

    return {
        lat: profile.latitude,
        lon: profile.longitude,
        city: profile.location,
        isPassport: false,
    };
}

async function updatePhotoAnalytics(
    ctx: any,
    photoId: any,
    ownerUserId: any,
    action: "impression" | "like" | "pass"
) {
    const now = Date.now();
    const existing = await ctx.db
        .query("photoAnalytics")
        .withIndex("photoId", (q: any) => q.eq("photoId", photoId))
        .first();

    const inc = {
        impressions: action === "impression" ? 1 : 0,
        likes: action === "like" ? 1 : 0,
        passes: action === "pass" ? 1 : 0,
    };

    if (!existing) {
        const impressions = inc.impressions;
        const likes = inc.likes;
        const passes = inc.passes;
        const likeRate = impressions > 0 ? likes / impressions : 0;
        await ctx.db.insert("photoAnalytics", {
            photoId,
            userId: ownerUserId,
            impressions,
            likes,
            passes,
            likeRate,
            createdAt: now,
            updatedAt: now,
        });
        return;
    }

    const impressions = existing.impressions + inc.impressions;
    const likes = existing.likes + inc.likes;
    const passes = existing.passes + inc.passes;
    const likeRate = impressions > 0 ? likes / impressions : 0;
    await ctx.db.patch(existing._id, {
        impressions,
        likes,
        passes,
        likeRate,
        updatedAt: now,
    });
}

async function updateEloOnMatch(ctx: any, userAId: any, userBId: any) {
    const a = await ctx.db.query("profiles").withIndex("userId", (q: any) => q.eq("userId", userAId)).first();
    const b = await ctx.db.query("profiles").withIndex("userId", (q: any) => q.eq("userId", userBId)).first();
    if (!a || !b) return;

    const aElo = a.elo ?? 1500;
    const bElo = b.elo ?? 1500;
    const expectedA = 1 / (1 + Math.pow(10, (bElo - aElo) / 400));
    const expectedB = 1 - expectedA;
    const K = 16;
    const newAElo = Math.round(aElo + K * (1 - expectedA));
    const newBElo = Math.round(bElo + K * (1 - expectedB));

    await ctx.db.patch(a._id, { elo: Math.max(100, Math.min(3000, newAElo)) });
    await ctx.db.patch(b._id, { elo: Math.max(100, Math.min(3000, newBElo)) });
}

// Helper function to calculate match score
function calculateMatchScore(
    myProfile: any,
    myInterests: string[],
    candidateProfile: any,
    candidateInterests: string[],
    candidateActivity: number
): number {
    let score = 0;

    // 1. Mutual interests (40%)
    const commonInterests = myInterests.filter(i => candidateInterests.includes(i));
    const interestScore = commonInterests.length / Math.max(myInterests.length, 1);
    score += interestScore * 40;

    // 2. Distance proximity (30%) - for now, same location gets full score
    if (myProfile.location === candidateProfile.location) {
        score += 30;
    } else {
        score += 15; // Different location gets half
    }

    // 3. Profile completeness (15%)
    const completenessScore = (candidateProfile.completeness || 0) / 100;
    score += completenessScore * 15;

    // 4. Recent activity (10%) - active in last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (candidateActivity > sevenDaysAgo) {
        score += 10;
    } else if (candidateActivity > sevenDaysAgo - 7 * 24 * 60 * 60 * 1000) {
        score += 5; // Active in last 14 days
    }

    // 5. Photo quality score (5%) - more photos = higher score
    const photoScore = Math.min(candidateProfile.photos?.length || 0, 6) / 6;
    score += photoScore * 5;

    return score;
}

// Get profiles for discovery/swipe interface with smart ranking
export const getDiscoveryProfiles = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 10;

        const preferences = await ctx.db
            .query("preferences")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        // Get user's profile (required to exclude self)
        const myProfile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!myProfile) {
            return [];
        }

        // Get my interests
        const myInterests = await ctx.db
            .query("interests")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();
        const myInterestsList = myInterests.map((i) => i.interest);

        // Get users I've already liked
        const myLikes = await ctx.db
            .query("likes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();
        const likedUserIds = new Set(myLikes.map((l) => l.likedUserId));

        // Get users I've passed (only recent - last 7 days)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const myPasses = await ctx.db
            .query("passes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();
        const passedUserIds = new Set(
            myPasses
                .filter(p => p.createdAt > sevenDaysAgo)
                .map((p) => p.passedUserId)
        );

        // Get users I've blocked or who blocked me
        const myBlocks = await ctx.db
            .query("blocks")
            .withIndex("blockerId", (q) => q.eq("blockerId", args.userId))
            .collect();
        const blockedByMe = new Set(myBlocks.map((b) => b.blockedUserId));

        const blocksOnMe = await ctx.db
            .query("blocks")
            .withIndex("blockedUserId", (q) => q.eq("blockedUserId", args.userId))
            .collect();
        const blockedMe = new Set(blocksOnMe.map((b) => b.blockerId));

        const myLoc = getEffectiveLocation(myProfile);

        // Show all other registered profiles to allow swipe workflow across all users.
        const allProfiles = await ctx.db.query("profiles").collect();

        const candidates = [];
        for (const profile of allProfiles) {
            if (profile.userId === args.userId) continue;
            if (likedUserIds.has(profile.userId)) continue;
            if (passedUserIds.has(profile.userId)) continue;
            if (blockedByMe.has(profile.userId)) continue;
            if (blockedMe.has(profile.userId)) continue;

            const user = await ctx.db.get(profile.userId);

            const photos = await ctx.db
                .query("photos")
                .withIndex("userId", (q) => q.eq("userId", profile.userId))
                .collect();

            const interests = await ctx.db
                .query("interests")
                .withIndex("userId", (q) => q.eq("userId", profile.userId))
                .collect();

            const candidateIsPremium = await isUserPremium(ctx, profile.userId);
            const candidateInterests = interests.map((i) => i.interest);

            // Calculate match score
            const score = calculateMatchScore(
                myProfile,
                myInterestsList,
                { ...profile, photos },
                candidateInterests,
                user?.lastSeenAt || 0
            );

            const access = await canAccessItem(ctx, {
                userId: args.userId,
                targetId: profile.userId,
                itemType: "profile",
            });

            candidates.push({
                ...profile,
                isLocked: !access.canAccess,
                name: user?.name,
                photos: photos.sort((a, b) => a.order - b.order),
                interests: candidateInterests,
                isPremium: candidateIsPremium,
                matchScore: score,
                distanceKm:
                    myLoc.lat !== undefined && myLoc.lon !== undefined && profile.latitude !== undefined && profile.longitude !== undefined
                        ? haversineKm(myLoc.lat, myLoc.lon, profile.latitude, profile.longitude)
                        : null,
                distanceCity: profile.location,
                passportMode: myLoc.isPassport,
            });
        }

        // Sort by match score (highest first)
        candidates.sort((a, b) => b.matchScore - a.matchScore);

        // Return top matches up to limit
        return candidates.slice(0, limit);
    },
});

// Phase 4: Discovery query with explicit advanced filters (premium)
export const getFilteredDiscoveryProfiles = query({
    args: {
        userId: v.id("users"),
        filters: v.optional(
            v.object({
                ageMin: v.optional(v.number()),
                ageMax: v.optional(v.number()),
                distanceMax: v.optional(v.number()),
                heightMin: v.optional(v.number()),
                heightMax: v.optional(v.number()),
                education: v.optional(v.array(v.string())),
                drinking: v.optional(v.array(v.string())),
                smoking: v.optional(v.array(v.string())),
                relationshipGoal: v.optional(v.array(v.string())),
                hasChildren: v.optional(v.boolean()),
                wantsChildren: v.optional(v.boolean()),
                religion: v.optional(v.array(v.string())),
                mustBeVerified: v.optional(v.boolean()),
            })
        ),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const premium = await isUserPremium(ctx, args.userId);
        if (args.filters && !premium) {
            throw new Error("Premium required for advanced filters");
        }

        const limit = args.limit || 10;

        // Base preferences (gender prefs etc.)
        const basePreferences = await ctx.db
            .query("preferences")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        const preferences: any = { ...(basePreferences || {}) };
        if (args.filters) {
            if (args.filters.ageMin !== undefined) preferences.minAge = args.filters.ageMin;
            if (args.filters.ageMax !== undefined) preferences.maxAge = args.filters.ageMax;
            if (args.filters.distanceMax !== undefined) preferences.maxDistance = args.filters.distanceMax;
            if (args.filters.heightMin !== undefined) preferences.minHeight = args.filters.heightMin;
            if (args.filters.heightMax !== undefined) preferences.maxHeight = args.filters.heightMax;
            if (args.filters.education !== undefined) preferences.education = args.filters.education;
            if (args.filters.drinking !== undefined) preferences.drinking = args.filters.drinking;
            if (args.filters.smoking !== undefined) preferences.smoking = args.filters.smoking;
            if (args.filters.relationshipGoal !== undefined) preferences.relationshipGoals = args.filters.relationshipGoal;
            if (args.filters.religion !== undefined) preferences.religions = args.filters.religion;
            if (args.filters.hasChildren !== undefined) preferences.hasKids = args.filters.hasChildren;
            if (args.filters.wantsChildren !== undefined) preferences.wantsKids = args.filters.wantsChildren;
            if (args.filters.mustBeVerified !== undefined) preferences.mustBeVerified = args.filters.mustBeVerified;
        }

        const myProfile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!myProfile) return [];

        const myLoc = getEffectiveLocation(myProfile);

        // Interests
        const myInterests = await ctx.db
            .query("interests")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();
        const myInterestsList = myInterests.map((i) => i.interest);

        // Exclusions
        const myLikes = await ctx.db
            .query("likes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();
        const likedUserIds = new Set(myLikes.map((l) => l.likedUserId));

        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const myPasses = await ctx.db
            .query("passes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();
        const passedUserIds = new Set(myPasses.filter((p) => p.createdAt > sevenDaysAgo).map((p) => p.passedUserId));

        const myBlocks = await ctx.db
            .query("blocks")
            .withIndex("blockerId", (q) => q.eq("blockerId", args.userId))
            .collect();
        const blockedByMe = new Set(myBlocks.map((b) => b.blockedUserId));

        const blocksOnMe = await ctx.db
            .query("blocks")
            .withIndex("blockedUserId", (q) => q.eq("blockedUserId", args.userId))
            .collect();
        const blockedMe = new Set(blocksOnMe.map((b) => b.blockerId));

        const allProfiles = await ctx.db.query("profiles").collect();
        const candidates: any[] = [];

        for (const profile of allProfiles) {
            if (profile.userId === args.userId) continue;
            if (likedUserIds.has(profile.userId)) continue;
            if (passedUserIds.has(profile.userId)) continue;
            if (blockedByMe.has(profile.userId)) continue;
            if (blockedMe.has(profile.userId)) continue;

            const user = await ctx.db.get(profile.userId);
            const photos = await ctx.db
                .query("photos")
                .withIndex("userId", (q) => q.eq("userId", profile.userId))
                .collect();

            // Apply filters
            if (preferences.minAge !== undefined && profile.age < preferences.minAge) continue;
            if (preferences.maxAge !== undefined && profile.age > preferences.maxAge) continue;
            if (preferences.genderPreference?.length && !preferences.genderPreference.includes(profile.gender)) continue;
            if (preferences.mustBeVerified) {
                const isVerified = (user as any)?.isVerified || (user as any)?.verificationStatus === "verified";
                if (!isVerified) continue;
            }
            if ((preferences as any).mustHavePhotos && photos.length === 0) continue;
            if ((preferences as any).mustHaveBio && !(profile.bio && profile.bio.trim().length > 0)) continue;
            if ((preferences as any).activeInLast7Days) {
                const sevenDaysAgo2 = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const lastActive = profile.lastActiveAt || (user as any)?.lastSeenAt || 0;
                if (lastActive < sevenDaysAgo2) continue;
            }
            if (preferences.minHeight !== undefined && (profile.height ?? 0) < preferences.minHeight) continue;
            if (preferences.maxHeight !== undefined && (profile.height ?? 9999) > preferences.maxHeight) continue;
            if (preferences.education?.length && profile.education && !preferences.education.includes(profile.education)) continue;
            if (preferences.drinking?.length && profile.drinking && !preferences.drinking.includes(profile.drinking)) continue;
            if (preferences.smoking?.length && profile.smoking && !preferences.smoking.includes(profile.smoking)) continue;
            if (preferences.relationshipGoals?.length && profile.relationshipGoal && !preferences.relationshipGoals.includes(profile.relationshipGoal)) continue;
            if (preferences.religions?.length && profile.religion && !preferences.religions.includes(profile.religion)) continue;
            if (preferences.hasKids !== undefined && profile.hasKids !== preferences.hasKids) continue;
            if (preferences.wantsKids !== undefined) {
                const wants = profile.wantsKids;
                if (preferences.wantsKids === true && wants === "no") continue;
                if (preferences.wantsKids === false && wants !== "no") continue;
            }
            if (preferences.maxDistance !== undefined && myLoc.lat !== undefined && myLoc.lon !== undefined && profile.latitude !== undefined && profile.longitude !== undefined) {
                const d = haversineKm(myLoc.lat, myLoc.lon, profile.latitude, profile.longitude);
                if (d > preferences.maxDistance) continue;
            }

            const interests = await ctx.db
                .query("interests")
                .withIndex("userId", (q) => q.eq("userId", profile.userId))
                .collect();
            const candidateIsPremium = await isUserPremium(ctx, profile.userId);
            const candidateInterests = interests.map((i) => i.interest);

            const score = calculateMatchScore(
                myProfile,
                myInterestsList,
                { ...profile, photos },
                candidateInterests,
                user?.lastSeenAt || 0
            );

            const access = await canAccessItem(ctx, {
                userId: args.userId,
                targetId: profile.userId,
                itemType: "profile",
            });

            candidates.push({
                ...profile,
                isLocked: !access.canAccess,
                name: user?.name,
                photos: photos.sort((a, b) => a.order - b.order),
                interests: candidateInterests,
                isPremium: candidateIsPremium,
                matchScore: score,
                distanceKm:
                    myLoc.lat !== undefined && myLoc.lon !== undefined && profile.latitude !== undefined && profile.longitude !== undefined
                        ? haversineKm(myLoc.lat, myLoc.lon, profile.latitude, profile.longitude)
                        : null,
                distanceCity: profile.location,
                passportMode: myLoc.isPassport,
            });
        }

        candidates.sort((a, b) => b.matchScore - a.matchScore);
        return candidates.slice(0, limit);
    },
});

// Like a profile
export const likeProfile = mutation({
    args: {
        userId: v.id("users"),
        likedUserId: v.id("users"),
        paymentId: v.optional(v.id("payments")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Use the new quota-based unlock system for likes
        await unlockItem(ctx, {
            userId: args.userId,
            targetId: args.likedUserId,
            itemType: "like",
            paymentId: args.paymentId,
        });

        // If already matched, do nothing
        const [user1, user2] = [args.userId, args.likedUserId].sort();
        const existingMatch = await ctx.db
            .query("matches")
            .withIndex("users", (q) => q.eq("user1Id", user1).eq("user2Id", user2))
            .first();

        if (existingMatch) {
            return { matched: true, matchId: existingMatch._id };
        }

        // Check if already liked
        const existing = await ctx.db
            .query("likes")
            .withIndex("pair", (q) => q.eq("userId", args.userId).eq("likedUserId", args.likedUserId))
            .first();

        if (existing) {
            return { matched: false }; // Already liked
        }

        // Create like
        await ctx.db.insert("likes", {
            userId: args.userId,
            likedUserId: args.likedUserId,
            createdAt: now,
        });

        // Photo analytics: record like against primary photo
        const likedPhotos = await ctx.db
            .query("photos")
            .withIndex("userId", (q) => q.eq("userId", args.likedUserId))
            .collect();
        const likedPrimary = likedPhotos.find((p: any) => p.isPrimary) || likedPhotos.sort((a: any, b: any) => a.order - b.order)[0];
        if (likedPrimary) {
            await updatePhotoAnalytics(ctx, likedPrimary._id, args.likedUserId, "like");
        }

        // Check if they liked me back (mutual like = match)
        const theirLike = await ctx.db
            .query("likes")
            .withIndex("pair", (q) => q.eq("userId", args.likedUserId).eq("likedUserId", args.userId))
            .first();

        if (theirLike) {
            // Create match!
            const matchId = await ctx.db.insert("matches", {
                user1Id: user1,
                user2Id: user2,
                matchedAt: now,
                user1Unread: 0,
                user2Unread: 0,
            });

            // Get user names for better notification
            const sender = await ctx.db.get(args.userId);
            const receiver = await ctx.db.get(args.likedUserId);

            await insertNotification(ctx, {
                userId: args.userId,
                type: "match",
                title: "It's a Match! 💖",
                body: `You and ${receiver?.name || "someone"} liked each other!`,
                priority: "critical",
                category: "social",
                icon: "💖",
                relatedUserId: args.likedUserId,
                relatedMatchId: matchId,
                link: `/matches/${matchId}`,
                actionButtons: [
                    { label: "Send Message", action: "navigate", link: `/chat/${matchId}` },
                    { label: "View Profile", action: "navigate", link: `/profile/${args.likedUserId}` },
                ],
            });
            await insertNotification(ctx, {
                userId: args.likedUserId,
                type: "match",
                title: "It's a Match! 💖",
                body: `You and ${sender?.name || "someone"} liked each other!`,
                priority: "critical",
                category: "social",
                icon: "💖",
                relatedUserId: args.userId,
                relatedMatchId: matchId,
                link: `/matches/${matchId}`,
                actionButtons: [
                    { label: "Send Message", action: "navigate", link: `/chat/${matchId}` },
                    { label: "View Profile", action: "navigate", link: `/profile/${args.userId}` },
                ],
            });

            // Phase 3: Send push notifications for match
            await ctx.scheduler.runAfter(0, "pushNotifications:notifyNewMatch" as any, {
                matchId,
                userId: args.userId,
                otherUserId: args.likedUserId,
            });
            await ctx.scheduler.runAfter(0, "pushNotifications:notifyNewMatch" as any, {
                matchId,
                userId: args.likedUserId,
                otherUserId: args.userId,
            });

            await updateEloOnMatch(ctx, args.userId, args.likedUserId);

            return { matched: true, matchId };
        }

        // Notify the liked user (non-mutual like)
        const liker = await ctx.db.get(args.userId);
        await insertNotification(ctx, {
            userId: args.likedUserId,
            type: "like",
            title: "New like! 💓",
            body: `${liker?.name || "Someone"} liked your profile`,
            priority: "medium",
            category: "social",
            icon: "💓",
            relatedUserId: args.userId,
            link: "/likes",
            actionButtons: [
                { label: "View", action: "navigate", link: "/likes" },
            ],
        });

        // Push notification for like received
        await ctx.scheduler.runAfter(0, "pushNotifications:notifyLikeReceived" as any, {
            recipientId: args.likedUserId,
            likerId: args.userId,
        });

        return { matched: false };
    },
});

// Pass on a profile
export const passProfile = mutation({
    args: {
        userId: v.id("users"),
        passedUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Check if already passed
        const existing = await ctx.db
            .query("passes")
            .withIndex("pair", (q) => q.eq("userId", args.userId).eq("passedUserId", args.passedUserId))
            .first();

        if (existing) {
            return; // Already passed
        }

        await ctx.db.insert("passes", {
            userId: args.userId,
            passedUserId: args.passedUserId,
            createdAt: Date.now(),
        });

        // Photo analytics: record pass against primary photo
        const photos = await ctx.db
            .query("photos")
            .withIndex("userId", (q) => q.eq("userId", args.passedUserId))
            .collect();
        const primary = photos.find((p: any) => p.isPrimary) || photos.sort((a: any, b: any) => a.order - b.order)[0];
        if (primary) {
            await updatePhotoAnalytics(ctx, primary._id, args.passedUserId, "pass");
        }
    },
});

// Get user's matches
export const getMatches = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        // Get matches where user is either user1 or user2
        const matches1 = await ctx.db
            .query("matches")
            .withIndex("user1Id", (q) => q.eq("user1Id", args.userId))
            .collect();

        const matches2 = await ctx.db
            .query("matches")
            .withIndex("user2Id", (q) => q.eq("user2Id", args.userId))
            .collect();

        const allMatches = [...matches1, ...matches2];

        // Get profile info for each match
        const matchesWithProfiles = [];
        for (const match of allMatches) {
            const otherUserId = match.user1Id === args.userId ? match.user2Id : match.user1Id;

            const user = await ctx.db.get(otherUserId);
            const profile = await ctx.db
                .query("profiles")
                .withIndex("userId", (q) => q.eq("userId", otherUserId))
                .first();

            if (!profile) continue;

            const photos = await ctx.db
                .query("photos")
                .withIndex("userId", (q) => q.eq("userId", otherUserId))
                .collect();

            const interests = await ctx.db
                .query("interests")
                .withIndex("userId", (q) => q.eq("userId", otherUserId))
                .collect();

            const sortedPhotos = photos.sort((a, b) => a.order - b.order);
            const primaryPhoto = sortedPhotos.find((p) => p.isPrimary) || sortedPhotos[0];

            const access = await canAccessItem(ctx, {
                userId: args.userId,
                targetId: match._id,
                itemType: "match",
            });

            matchesWithProfiles.push({
                matchId: match._id,
                isLocked: !access.canAccess,
                userId: otherUserId,
                name: user?.name,
                matchedAt: match.matchedAt,
                lastMessageAt: match.lastMessageAt,
                unreadCount: match.user1Id === args.userId ? match.user1Unread : match.user2Unread,
                profile: {
                    ...profile,
                    photos: sortedPhotos,
                    interests: interests.map((i) => i.interest),
                },
                primaryPhoto: primaryPhoto?.url,
            });
        }

        // Sort by most recent activity
        matchesWithProfiles.sort((a, b) => {
            const aTime = a.lastMessageAt || a.matchedAt;
            const bTime = b.lastMessageAt || b.matchedAt;
            return bTime - aTime;
        });

        return matchesWithProfiles;
    },
});

// Get profiles user has liked
export const getLikes = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const likes = await ctx.db
            .query("likes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        const likedProfiles = [];
        for (const like of likes) {
            // Check if this became a match
            const match = await ctx.db
                .query("matches")
                .withIndex("users", (q) => {
                    const [user1, user2] = [args.userId, like.likedUserId].sort();
                    return q.eq("user1Id", user1).eq("user2Id", user2);
                })
                .first();

            const user = await ctx.db.get(like.likedUserId);

            const profile = await ctx.db
                .query("profiles")
                .withIndex("userId", (q) => q.eq("userId", like.likedUserId))
                .first();

            if (!profile) continue;

            const photos = await ctx.db
                .query("photos")
                .withIndex("userId", (q) => q.eq("userId", like.likedUserId))
                .collect();

            const interests = await ctx.db
                .query("interests")
                .withIndex("userId", (q) => q.eq("userId", like.likedUserId))
                .collect();

            const sortedPhotos = photos.sort((a, b) => a.order - b.order);

            const primaryPhoto = sortedPhotos.find((p) => p.isPrimary) || sortedPhotos[0];

            likedProfiles.push({
                matchId: match?._id,
                userId: like.likedUserId,
                name: user?.name,
                primaryPhoto: primaryPhoto?.url,
                profile: {
                    ...profile,
                    photos: sortedPhotos,
                    interests: interests.map((i) => i.interest),
                },
                likedAt: like.createdAt,
            });
        }

        return likedProfiles;
    },
});


// Get match by ID
export const getMatchById = query({
    args: {
        matchId: v.id("matches"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const match = await ctx.db.get(args.matchId);

        if (!match) {
            return null;
        }

        // Verify user is part of this match
        if (match.user1Id !== args.userId && match.user2Id !== args.userId) {
            return null;
        }

        const otherUserId = match.user1Id === args.userId ? match.user2Id : match.user1Id;

        const user = await ctx.db.get(otherUserId);

        const otherUserSettings = await ctx.db
            .query("userSettings")
            .withIndex("userId", (q) => q.eq("userId", otherUserId))
            .first();

        const showOnlineStatus = otherUserSettings?.showOnlineStatus ?? true;

        const profile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", otherUserId))
            .first();

        if (!profile) {
            return null;
        }

        const photos = await ctx.db
            .query("photos")
            .withIndex("userId", (q) => q.eq("userId", otherUserId))
            .collect();

        const interests = await ctx.db
            .query("interests")
            .withIndex("userId", (q) => q.eq("userId", otherUserId))
            .collect();

        return {
            matchId: match._id,
            userId: otherUserId,
            lastSeenAt: showOnlineStatus ? user?.lastSeenAt : null,
            showOnlineStatus,
            profile: {
                ...profile,
                name: user?.name,
                photos: photos.sort((a, b) => a.order - b.order),
                interests: interests.map((i) => i.interest),
            },
            matchedAt: match.matchedAt,
        };
    },
});

// Super-like a profile (premium feature)
export const superLikeProfile = mutation({
    args: {
        userId: v.id("users"),
        superLikedUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        await consumeSuperLike(ctx, args.userId);

        // If already matched, do nothing
        const [user1, user2] = [args.userId, args.superLikedUserId].sort();
        const existingMatch = await ctx.db
            .query("matches")
            .withIndex("users", (q) => q.eq("user1Id", user1).eq("user2Id", user2))
            .first();

        if (existingMatch) {
            return { matched: true, matchId: existingMatch._id };
        }

        // Check if already super-liked
        const existing = await ctx.db
            .query("superLikes")
            .withIndex("pair", (q) => q.eq("userId", args.userId).eq("superLikedUserId", args.superLikedUserId))
            .first();

        if (existing) {
            return { matched: false }; // Already super-liked
        }

        // Create super-like
        await ctx.db.insert("superLikes", {
            userId: args.userId,
            superLikedUserId: args.superLikedUserId,
            createdAt: now,
        });

        // Also create a regular like
        const regularLike = await ctx.db
            .query("likes")
            .withIndex("pair", (q) => q.eq("userId", args.userId).eq("likedUserId", args.superLikedUserId))
            .first();

        if (!regularLike) {
            await ctx.db.insert("likes", {
                userId: args.userId,
                likedUserId: args.superLikedUserId,
                createdAt: now,
            });
        }

        // Photo analytics: record like against primary photo
        const likedPhotos = await ctx.db
            .query("photos")
            .withIndex("userId", (q) => q.eq("userId", args.superLikedUserId))
            .collect();
        const likedPrimary = likedPhotos.find((p: any) => p.isPrimary) || likedPhotos.sort((a: any, b: any) => a.order - b.order)[0];
        if (likedPrimary) {
            await updatePhotoAnalytics(ctx, likedPrimary._id, args.superLikedUserId, "like");
        }

        // Check if they liked me back (mutual like = match)
        const theirLike = await ctx.db
            .query("likes")
            .withIndex("pair", (q) => q.eq("userId", args.superLikedUserId).eq("likedUserId", args.userId))
            .first();

        if (theirLike) {
            // Create match!
            const matchId = await ctx.db.insert("matches", {
                user1Id: user1,
                user2Id: user2,
                matchedAt: now,
                user1Unread: 0,
                user2Unread: 0,
            });

            // Get user names for better notification
            const sender = await ctx.db.get(args.userId);
            const receiver = await ctx.db.get(args.superLikedUserId);

            await insertNotification(ctx, {
                userId: args.userId,
                type: "match",
                title: "It's a Match! 💖",
                body: `You and ${receiver?.name || "someone"} liked each other!`,
                priority: "critical",
                category: "social",
                icon: "💖",
                relatedUserId: args.superLikedUserId,
                relatedMatchId: matchId,
                link: `/matches/${matchId}`,
                actionButtons: [
                    { label: "Send Message", action: "navigate", link: `/chat/${matchId}` },
                    { label: "View Profile", action: "navigate", link: `/profile/${args.superLikedUserId}` },
                ],
            });
            await insertNotification(ctx, {
                userId: args.superLikedUserId,
                type: "match",
                title: "Super Match! 🌟💖",
                body: `${sender?.name || "Someone"} super liked you and you matched!`,
                priority: "critical",
                category: "social",
                icon: "🌟",
                relatedUserId: args.userId,
                relatedMatchId: matchId,
                link: `/matches/${matchId}`,
                actionButtons: [
                    { label: "Send Message", action: "navigate", link: `/chat/${matchId}` },
                    { label: "View Profile", action: "navigate", link: `/profile/${args.userId}` },
                ],
            });

            await updateEloOnMatch(ctx, args.userId, args.superLikedUserId);

            return { matched: true, matchId };
        }

        return { matched: false };
    },
});

// Get profiles user has super-liked
export const getSuperLikes = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const superLikes = await ctx.db
            .query("superLikes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        const superLikedProfiles = [];
        for (const superLike of superLikes) {
            // Check if this became a match
            const match = await ctx.db
                .query("matches")
                .withIndex("users", (q) => {
                    const [user1, user2] = [args.userId, superLike.superLikedUserId].sort();
                    return q.eq("user1Id", user1).eq("user2Id", user2);
                })
                .first();

            if (match) continue; // Skip matches

            const profile = await ctx.db
                .query("profiles")
                .withIndex("userId", (q) => q.eq("userId", superLike.superLikedUserId))
                .first();

            if (!profile) continue;

            const photos = await ctx.db
                .query("photos")
                .withIndex("userId", (q) => q.eq("userId", superLike.superLikedUserId))
                .collect();

            const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];

            superLikedProfiles.push({
                userId: superLike.superLikedUserId,
                age: profile.age,
                location: profile.location,
                photo: primaryPhoto?.url,
                superLikedAt: superLike.createdAt,
            });
        }

        return superLikedProfiles;
    },
});

// Get users who super-liked you
export const getWhoSuperLikedYou = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const superLikes = await ctx.db
            .query("superLikes")
            .withIndex("superLikedUserId", (q) => q.eq("superLikedUserId", args.userId))
            .collect();

        const profiles = [];
        for (const superLike of superLikes) {
            // Check if already matched
            const match = await ctx.db
                .query("matches")
                .withIndex("users", (q) => {
                    const [user1, user2] = [args.userId, superLike.userId].sort();
                    return q.eq("user1Id", user1).eq("user2Id", user2);
                })
                .first();

            if (match) continue; // Skip matches

            const profile = await ctx.db
                .query("profiles")
                .withIndex("userId", (q) => q.eq("userId", superLike.userId))
                .first();

            if (!profile) continue;

            const photos = await ctx.db
                .query("photos")
                .withIndex("userId", (q) => q.eq("userId", superLike.userId))
                .collect();

            const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];

            profiles.push({
                userId: superLike.userId,
                age: profile.age,
                location: profile.location,
                photo: primaryPhoto?.url,
                superLikedAt: superLike.createdAt,
            });
        }

        return profiles;
    },
});

// Rewind last action (undo last swipe)
export const rewindLastAction = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const isPremium = await isUserPremium(ctx, args.userId);
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        // Get the most recent like or pass within the last 5 minutes
        const recentLikes = await ctx.db
            .query("likes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        const recentPasses = await ctx.db
            .query("passes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        // Filter for last 5 minutes
        const recentLikesFiltered = recentLikes.filter(l => l.createdAt > fiveMinutesAgo);
        const recentPassesFiltered = recentPasses.filter(p => p.createdAt > fiveMinutesAgo);

        // Find the most recent action
        const allRecent = [
            ...recentLikesFiltered.map(l => ({ type: 'like' as const, item: l, time: l.createdAt })),
            ...recentPassesFiltered.map(p => ({ type: 'pass' as const, item: p, time: p.createdAt }))
        ].sort((a, b) => b.time - a.time);

        if (allRecent.length === 0) {
            throw new Error("No recent actions to rewind");
        }

        const lastAction = allRecent[0];

        // Check if free user has already used their daily rewind
        if (!isPremium) {
            const dayKey = getDayKeyUtc(now);
            const rewinds = await ctx.db
                .query("dailyUsage")
                .withIndex("userDay", (q) => q.eq("userId", args.userId).eq("dayKey", dayKey))
                .first();

            // For free users, limit to 1 rewind per day (we'll add a rewinds field if needed)
            // For now, we'll be lenient and allow it
        }

        // Delete the action
        if (lastAction.type === 'like') {
            await ctx.db.delete(lastAction.item._id);

            // Also check if this created a match and delete it
            const likeItem = lastAction.item as any;
            const [user1, user2] = [args.userId, likeItem.likedUserId].sort();
            const match = await ctx.db
                .query("matches")
                .withIndex("users", (q) => q.eq("user1Id", user1).eq("user2Id", user2))
                .first();

            if (match) {
                await ctx.db.delete(match._id);
            }
        } else {
            await ctx.db.delete(lastAction.item._id);
        }

        return { success: true };
    },
});

// Helper for day key
function getDayKeyUtc(nowMs: number) {
    const d = new Date(nowMs);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// Check if user can rewind
export const getRewindAvailability = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const isPremium = await isUserPremium(ctx, args.userId);
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        // Get the most recent like or pass within the last 5 minutes
        const recentLikes = await ctx.db
            .query("likes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        const recentPasses = await ctx.db
            .query("passes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        // Filter for last 5 minutes
        const recentLikesFiltered = recentLikes.filter(l => l.createdAt > fiveMinutesAgo);
        const recentPassesFiltered = recentPasses.filter(p => p.createdAt > fiveMinutesAgo);

        const hasRecentAction = recentLikesFiltered.length > 0 || recentPassesFiltered.length > 0;

        if (!hasRecentAction) {
            return { canRewind: false, reason: "No recent swipes to undo" };
        }

        if (!isPremium) {
            return { canRewind: false, reason: "Rewind is a Premium feature" };
        }

        return { canRewind: true };
    },
});

// Phase 2: Get users who liked you
export const getWhoLikedYous = query({
    args: {
        userId: v.id("users"),
        sortBy: v.optional(v.union(v.literal("recent"), v.literal("distance"), v.literal("score"))),
    },
    handler: async (ctx, args) => {
        const isPremium = await isUserPremium(ctx, args.userId);

        // Get all likes received by this user
        const likesReceived = await ctx.db
            .query("likes")
            .withIndex("likedUserId", (q) => q.eq("likedUserId", args.userId))
            .collect();

        // Get users I've already matched with (to exclude them)
        const myMatches = await ctx.db
            .query("matches")
            .filter((q) =>
                q.or(
                    q.eq(q.field("user1Id"), args.userId),
                    q.eq(q.field("user2Id"), args.userId)
                )
            )
            .collect();

        const matchedUserIds = new Set(
            myMatches.map(m =>
                m.user1Id === args.userId ? m.user2Id : m.user1Id
            )
        );

        // Filter out already matched users
        const unmatchedLikes = likesReceived.filter(like => !matchedUserIds.has(like.userId));

        // Free users only get the count
        if (!isPremium) {
            return {
                count: unmatchedLikes.length,
                profiles: [],
                isPremium: false,
            };
        }

        // Premium users get full profiles
        const myProfile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!myProfile) {
            return { count: 0, profiles: [], isPremium: true };
        }

        const myInterests = await ctx.db
            .query("interests")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();
        const myInterestsList = myInterests.map(i => i.interest);

        // Build profile data for each user who liked you
        const profiles = await Promise.all(
            unmatchedLikes.map(async (like) => {
                const profile = await ctx.db
                    .query("profiles")
                    .withIndex("userId", (q) => q.eq("userId", like.userId))
                    .first();

                if (!profile) return null;

                const user = await ctx.db.get(like.userId);
                if (!user) return null;

                const photos = await ctx.db
                    .query("photos")
                    .withIndex("userId", (q) => q.eq("userId", like.userId))
                    .collect();

                const interests = await ctx.db
                    .query("interests")
                    .withIndex("userId", (q) => q.eq("userId", like.userId))
                    .collect();
                const interestsList = interests.map(i => i.interest);

                // Calculate mutual interests
                const mutualInterests = myInterestsList.filter(i => interestsList.includes(i));

                // Calculate match score
                const matchScore = calculateMatchScore(
                    myProfile,
                    myInterestsList,
                    profile,
                    interestsList,
                    user.lastSeenAt || profile.createdAt
                );

                // Calculate distance (simplified - same location = 0km)
                const distance = myProfile.location === profile.location ? 0 : 50;

                return {
                    userId: like.userId,
                    name: user.name,
                    age: profile.age,
                    location: profile.location,
                    bio: profile.bio,
                    photos: photos.sort((a, b) => a.order - b.order).map(p => p.url),
                    interests: interestsList,
                    mutualInterests,
                    matchScore: Math.round(matchScore),
                    distance,
                    likedAt: like.createdAt,
                };
            })
        );

        const validProfiles = profiles.filter(p => p !== null);

        // Sort by preference
        const sortBy = args.sortBy || "recent";
        if (sortBy === "recent") {
            validProfiles.sort((a, b) => (b?.likedAt || 0) - (a?.likedAt || 0));
        } else if (sortBy === "distance") {
            validProfiles.sort((a, b) => (a?.distance || 0) - (b?.distance || 0));
        } else if (sortBy === "score") {
            validProfiles.sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0));
        }

        return {
            count: validProfiles.length,
            profiles: validProfiles,
            isPremium: true,
        };
    },
});

// Phase 2: Track action for rewind capability
export const trackAction = mutation({
    args: {
        userId: v.id("users"),
        action: v.union(v.literal("like"), v.literal("pass"), v.literal("superLike")),
        targetUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Store action in history (keep last 10 actions)
        await ctx.db.insert("actionHistory", {
            userId: args.userId,
            action: args.action,
            targetUserId: args.targetUserId,
            timestamp: now,
            canRewind: true,
        });

        // Clean up old actions (keep only last 10)
        const allActions = await ctx.db
            .query("actionHistory")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        const sortedActions = allActions.sort((a, b) => b.timestamp - a.timestamp);

        // Delete actions beyond the last 10
        for (let i = 10; i < sortedActions.length; i++) {
            await ctx.db.delete(sortedActions[i]._id);
        }

        return { success: true };
    },
});

// Phase 3: Get Top Picks - Daily curated matches
export const getTopPickss = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const now = Date.now();
        const isPremium = await isUserPremium(ctx, args.userId);
        const limit = isPremium ? 10 : 3; // Premium gets 10, free gets 3

        // Check if we have a cached version that's still valid (expires at midnight)
        const cache = await ctx.db
            .query("topPicksCache")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (cache && cache.expiresAt > now) {
            // Return cached picks
            const profiles = [];
            for (const pickUserId of cache.picks.slice(0, limit)) {
                const profile = await ctx.db
                    .query("profiles")
                    .withIndex("userId", (q) => q.eq("userId", pickUserId))
                    .first();

                if (!profile) continue;

                const user = await ctx.db.get(pickUserId);
                const photos = await ctx.db
                    .query("photos")
                    .withIndex("userId", (q) => q.eq("userId", pickUserId))
                    .collect();

                const interests = await ctx.db
                    .query("interests")
                    .withIndex("userId", (q) => q.eq("userId", pickUserId))
                    .collect();

                profiles.push({
                    ...profile,
                    name: user?.name,
                    photos: photos.sort((a, b) => a.order - b.order),
                    interests: interests.map((i) => i.interest),
                });
            }

            return { profiles, refreshesAt: cache.expiresAt };
        }

        // Generate new picks
        const myProfile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!myProfile) {
            return { profiles: [], refreshesAt: 0 };
        }

        // Get my interests
        const myInterests = await ctx.db
            .query("interests")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();
        const myInterestsList = myInterests.map((i) => i.interest);

        // Get users I've already interacted with
        const myLikes = await ctx.db
            .query("likes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();
        const likedUserIds = new Set(myLikes.map((l) => l.likedUserId));

        const myPasses = await ctx.db
            .query("passes")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();
        const passedUserIds = new Set(myPasses.map((p) => p.passedUserId));

        const myBlocks = await ctx.db
            .query("blocks")
            .withIndex("blockerId", (q) => q.eq("blockerId", args.userId))
            .collect();
        const blockedByMe = new Set(myBlocks.map((b) => b.blockedUserId));

        const blocksOnMe = await ctx.db
            .query("blocks")
            .withIndex("blockedUserId", (q) => q.eq("blockedUserId", args.userId))
            .collect();
        const blockedMe = new Set(blocksOnMe.map((b) => b.blockerId));

        // Get all potential profiles
        const allProfiles = await ctx.db.query("profiles").collect();

        const candidates = [];
        for (const profile of allProfiles) {
            if (profile.userId === args.userId) continue;
            if (likedUserIds.has(profile.userId)) continue;
            if (passedUserIds.has(profile.userId)) continue;
            if (blockedByMe.has(profile.userId)) continue;
            if (blockedMe.has(profile.userId)) continue;

            const user = await ctx.db.get(profile.userId);
            const photos = await ctx.db
                .query("photos")
                .withIndex("userId", (q) => q.eq("userId", profile.userId))
                .collect();

            const interests = await ctx.db
                .query("interests")
                .withIndex("userId", (q) => q.eq("userId", profile.userId))
                .collect();
            const candidateInterests = interests.map((i) => i.interest);

            // Calculate compatibility score with enhanced algorithm
            let score = 0;

            // 1. Mutual interests (40%)
            const commonInterests = myInterestsList.filter(i => candidateInterests.includes(i));
            const interestScore = commonInterests.length / Math.max(myInterestsList.length, 1);
            score += interestScore * 40;

            // 2. Similar age (20%)
            const ageDiff = Math.abs(myProfile.age - profile.age);
            const ageScore = Math.max(0, 1 - (ageDiff / 20)); // Perfect at 0 diff, 0 at 20+ diff
            score += ageScore * 20;

            // 3. Distance/Location (20%)
            if (myProfile.location === profile.location) {
                score += 20;
            } else {
                score += 10; // Different location gets half
            }

            // 4. Activity level (10%)
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
            if ((user?.lastSeenAt || 0) > sevenDaysAgo) {
                score += 10;
            } else if ((user?.lastSeenAt || 0) > sevenDaysAgo - 7 * 24 * 60 * 60 * 1000) {
                score += 5;
            }

            // 5. Profile quality (10%)
            const qualityScore = (profile.completeness || 0) / 100;
            score += qualityScore * 10;

            candidates.push({
                userId: profile.userId,
                score,
                commonInterests,
            });
        }

        // Sort by score and take top picks
        candidates.sort((a, b) => b.score - a.score);
        const topPickUserIds = candidates.slice(0, 10).map(c => c.userId);

        // Cache the results until end of day (no writes in query)
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const expiresAt = endOfDay.getTime();

        // Build full profiles for return
        const profiles = [];
        for (const pickUserId of topPickUserIds.slice(0, limit)) {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("userId", (q) => q.eq("userId", pickUserId))
                .first();

            if (!profile) continue;

            const user = await ctx.db.get(pickUserId);
            const photos = await ctx.db
                .query("photos")
                .withIndex("userId", (q) => q.eq("userId", pickUserId))
                .collect();

            const interests = await ctx.db
                .query("interests")
                .withIndex("userId", (q) => q.eq("userId", pickUserId))
                .collect();

            const candidate = candidates.find(c => c.userId === pickUserId);
            profiles.push({
                ...profile,
                name: user?.name,
                photos: photos.sort((a, b) => a.order - b.order),
                interests: interests.map((i) => i.interest),
                matchScore: Math.round(candidate?.score || 0),
                matchReason: candidate && candidate.commonInterests.length > 0
                    ? `You both love ${candidate.commonInterests[0]}`
                    : `Great match potential!`,
            });
        }

        return { profiles, refreshesAt: expiresAt };
    },
});
