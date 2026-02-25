import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isUserPremium } from "./subscriptions";
import { insertNotification } from "./notifications";

// Create initial profile after signup
export const createProfile = mutation({
    args: {
        userId: v.id("users"),
        age: v.number(),
        gender: v.string(),
        location: v.string(),
        bio: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
        education: v.optional(v.string()),
        relationshipGoal: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Check if profile already exists
        const existing = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (existing) {
            return existing._id; // Return existing profile instead of throwing error
        }

        const profileId = await ctx.db.insert("profiles", {
            userId: args.userId,
            age: args.age,
            gender: args.gender,
            location: args.location,
            bio: args.bio,
            jobTitle: args.jobTitle,
            education: args.education,
            relationshipGoal: args.relationshipGoal,
            completeness: 30, // Basic info only
            createdAt: now,
            updatedAt: now,
        });

        // Create default preferences
        await ctx.db.insert("preferences", {
            userId: args.userId,
            profileId,
            minAge: Math.max(18, args.age - 5),
            maxAge: args.age + 5,
            maxDistance: 50, // 50km default
            genderPreference: args.gender === "man" ? ["woman"] : ["man"],
            updatedAt: now,
        });

        // Send welcome notification
        await insertNotification(ctx, {
            userId: args.userId,
            type: "profile_created",
            title: "Welcome to the app! 🎉",
            body: "Your profile has been created. Complete it to start matching!",
            priority: "medium",
            category: "system",
            icon: "👋",
            link: "/profile-setup",
        });

        return profileId;
    },
});

// Update profile information
export const updateProfile = mutation({
    args: {
        userId: v.id("users"),
        age: v.optional(v.number()),
        gender: v.optional(v.string()),
        location: v.optional(v.string()),
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),
        bio: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
        company: v.optional(v.string()),
        education: v.optional(v.string()),
        height: v.optional(v.number()),
        religion: v.optional(v.string()),
        drinking: v.optional(v.string()),
        smoking: v.optional(v.string()),
        hasKids: v.optional(v.boolean()),
        wantsKids: v.optional(v.string()),
        relationshipGoal: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) {
            throw new Error("Profile not found");
        }

        const updates: any = { updatedAt: Date.now() };

        // Only update provided fields
        if (args.age !== undefined) updates.age = args.age;
        if (args.gender !== undefined) updates.gender = args.gender;
        if (args.location !== undefined) updates.location = args.location;
        if (args.latitude !== undefined) updates.latitude = args.latitude;
        if (args.longitude !== undefined) updates.longitude = args.longitude;
        if (args.bio !== undefined) updates.bio = args.bio;
        if (args.jobTitle !== undefined) updates.jobTitle = args.jobTitle;
        if (args.company !== undefined) updates.company = args.company;
        if (args.education !== undefined) updates.education = args.education;
        if (args.height !== undefined) updates.height = args.height;
        if (args.religion !== undefined) updates.religion = args.religion;
        if (args.drinking !== undefined) updates.drinking = args.drinking;
        if (args.smoking !== undefined) updates.smoking = args.smoking;
        if (args.hasKids !== undefined) updates.hasKids = args.hasKids;
        if (args.wantsKids !== undefined) updates.wantsKids = args.wantsKids;
        if (args.relationshipGoal !== undefined) updates.relationshipGoal = args.relationshipGoal;

        // Calculate completeness
        const updatedProfile = { ...profile, ...updates };
        updates.completeness = calculateCompleteness(updatedProfile);

        await ctx.db.patch(profile._id, updates);
        return profile._id;
    },
});

// Get user's own profile
export const getMyProfile = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) {
            return null;
        }

        // Get photos
        const photos = await ctx.db
            .query("photos")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        // Get preferences
        const preferences = await ctx.db
            .query("preferences")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        // Get interests
        const interests = await ctx.db
            .query("interests")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        const premium = await isUserPremium(ctx, args.userId);

        return {
            ...profile,
            photos: photos.sort((a, b) => a.order - b.order),
            preferences,
            interests: interests.map((i) => i.interest),
            isPremium: premium,
        };
    },
});

// Get another user's profile by ID
export const getProfileById = query({
    args: {
        userId: v.id("users"),
        viewerId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Check if viewer has blocked or been blocked by this user
        const block1 = await ctx.db
            .query("blocks")
            .withIndex("pair", (q) => q.eq("blockerId", args.viewerId).eq("blockedUserId", args.userId))
            .first();

        const block2 = await ctx.db
            .query("blocks")
            .withIndex("pair", (q) => q.eq("blockerId", args.userId).eq("blockedUserId", args.viewerId))
            .first();

        if (block1 || block2) {
            return null; // Don't show blocked profiles
        }

        const profile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) {
            return null;
        }

        // Get photos
        const photos = await ctx.db
            .query("photos")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        // Get interests
        const interests = await ctx.db
            .query("interests")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        return {
            ...profile,
            photos: photos.sort((a, b) => a.order - b.order),
            interests: interests.map((i) => i.interest),
        };
    },
});

// Get basic profile info by userId (for notifications, calls, etc.)
export const getProfileByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) {
            return null;
        }

        // Get photos
        const photos = await ctx.db
            .query("photos")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        return {
            ...profile,
            photos: photos.sort((a, b) => a.order - b.order),
        };
    },
});

// Upload photo
export const uploadPhoto = mutation({
    args: {
        userId: v.id("users"),
        url: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) {
            throw new Error("Profile not found");
        }

        // Check if this is the first photo
        const existingPhotos = await ctx.db
            .query("photos")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        const isPrimary = existingPhotos.length === 0;

        const photoId = await ctx.db.insert("photos", {
            userId: args.userId,
            profileId: profile._id,
            url: args.url,
            order: args.order,
            isPrimary,
            createdAt: Date.now(),
        });

        // Update profile completeness
        const completeness = calculateCompleteness({ ...profile, hasPhotos: true });
        await ctx.db.patch(profile._id, { completeness, updatedAt: Date.now() });

        return photoId;
    },
});

// Delete photo
export const deletePhoto = mutation({
    args: {
        photoId: v.id("photos"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const photo = await ctx.db.get(args.photoId);

        if (!photo || photo.userId !== args.userId) {
            throw new Error("Photo not found or unauthorized");
        }

        await ctx.db.delete(args.photoId);

        // If this was primary, set another photo as primary
        if (photo.isPrimary) {
            const otherPhoto = await ctx.db
                .query("photos")
                .withIndex("userId", (q) => q.eq("userId", args.userId))
                .first();

            if (otherPhoto) {
                await ctx.db.patch(otherPhoto._id, { isPrimary: true });
            }
        }
    },
});

// Set primary photo
export const setPrimaryPhoto = mutation({
    args: {
        photoId: v.id("photos"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const photo = await ctx.db.get(args.photoId);

        if (!photo || photo.userId !== args.userId) {
            throw new Error("Photo not found or unauthorized");
        }

        // Unset all other primary photos
        const allPhotos = await ctx.db
            .query("photos")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        for (const p of allPhotos) {
            if (p._id !== args.photoId && p.isPrimary) {
                await ctx.db.patch(p._id, { isPrimary: false });
            }
        }

        // Set this photo as primary
        await ctx.db.patch(args.photoId, { isPrimary: true });
    },
});

// Update preferences
export const updatePreferences = mutation({
    args: {
        userId: v.id("users"),
        minAge: v.optional(v.number()),
        maxAge: v.optional(v.number()),
        maxDistance: v.optional(v.number()),
        genderPreference: v.optional(v.array(v.string())),
        // Phase 4: Advanced filters (premium)
        minHeight: v.optional(v.number()),
        maxHeight: v.optional(v.number()),
        relationshipGoals: v.optional(v.array(v.string())),
        religions: v.optional(v.array(v.string())),
        education: v.optional(v.array(v.string())),
        drinking: v.optional(v.array(v.string())),
        smoking: v.optional(v.array(v.string())),
        exercise: v.optional(v.array(v.string())),
        diet: v.optional(v.array(v.string())),
        hasKids: v.optional(v.boolean()),
        wantsKids: v.optional(v.boolean()),
        mustBeVerified: v.optional(v.boolean()),
        mustHavePhotos: v.optional(v.boolean()),
        mustHaveBio: v.optional(v.boolean()),
        activeInLast7Days: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const preferences = await ctx.db
            .query("preferences")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!preferences) {
            throw new Error("Preferences not found");
        }

        const isPremiumUser = await isUserPremium(ctx, args.userId);

        const advancedKeys: (keyof typeof args)[] = [
            "minHeight",
            "maxHeight",
            "education",
            "drinking",
            "smoking",
            "exercise",
            "diet",
            "relationshipGoals",
            "religions",
            "hasKids",
            "wantsKids",
            "mustBeVerified",
            "mustHavePhotos",
            "mustHaveBio",
            "activeInLast7Days",
        ];

        const isTryingToSetAdvanced = advancedKeys.some((k) => (args as any)[k] !== undefined);
        if (isTryingToSetAdvanced && !isPremiumUser) {
            throw new Error("Premium required for advanced filters");
        }

        const updates: any = { updatedAt: Date.now() };

        if (args.minAge !== undefined) updates.minAge = args.minAge;
        if (args.maxAge !== undefined) updates.maxAge = args.maxAge;
        if (args.maxDistance !== undefined) updates.maxDistance = args.maxDistance;
        if (args.genderPreference !== undefined) updates.genderPreference = args.genderPreference;
        if (args.minHeight !== undefined) updates.minHeight = args.minHeight;
        if (args.maxHeight !== undefined) updates.maxHeight = args.maxHeight;
        if (args.relationshipGoals !== undefined) updates.relationshipGoals = args.relationshipGoals;
        if (args.religions !== undefined) updates.religions = args.religions;
        if (args.education !== undefined) updates.education = args.education;
        if (args.drinking !== undefined) updates.drinking = args.drinking;
        if (args.smoking !== undefined) updates.smoking = args.smoking;
        if (args.exercise !== undefined) updates.exercise = args.exercise;
        if (args.diet !== undefined) updates.diet = args.diet;
        if (args.hasKids !== undefined) updates.hasKids = args.hasKids;
        if (args.wantsKids !== undefined) updates.wantsKids = args.wantsKids;
        if (args.mustBeVerified !== undefined) updates.mustBeVerified = args.mustBeVerified;

        // Dealbreakers (stored as booleans in preferences doc metadata)
        if (args.mustHavePhotos !== undefined) (updates as any).mustHavePhotos = args.mustHavePhotos;
        if (args.mustHaveBio !== undefined) (updates as any).mustHaveBio = args.mustHaveBio;
        if (args.activeInLast7Days !== undefined) (updates as any).activeInLast7Days = args.activeInLast7Days;

        await ctx.db.patch(preferences._id, updates);
        return preferences._id;
    },
});

// Phase 4: Passport mode (premium) - set temporary discovery location
export const setPassportLocation = mutation({
    args: {
        userId: v.id("users"),
        latitude: v.number(),
        longitude: v.number(),
        city: v.string(),
        expiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        const premium = await isUserPremium(ctx, args.userId);
        if (!premium) {
            throw new Error("Premium required for Passport mode");
        }

        const profile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) throw new Error("Profile not found");

        await ctx.db.patch(profile._id, {
            passportLat: args.latitude,
            passportLon: args.longitude,
            passportCity: args.city,
            passportExpiresAt: args.expiresAt,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

export const clearPassportLocation = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) throw new Error("Profile not found");

        await ctx.db.patch(profile._id, {
            passportLat: undefined,
            passportLon: undefined,
            passportCity: undefined,
            passportExpiresAt: undefined,
            updatedAt: Date.now(),
        } as any);

        return { success: true };
    },
});

// Phase 4: Smart photo ordering helpers
export const reorderPhotos = mutation({
    args: {
        userId: v.id("users"),
        orderedPhotoIds: v.array(v.id("photos")),
    },
    handler: async (ctx, args) => {
        const photos = await ctx.db
            .query("photos")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        const ownedIds = new Set(photos.map((p) => p._id));
        for (const id of args.orderedPhotoIds) {
            if (!ownedIds.has(id)) throw new Error("Unauthorized photo reorder");
        }

        for (let i = 0; i < args.orderedPhotoIds.length; i++) {
            await ctx.db.patch(args.orderedPhotoIds[i], { order: i });
        }

        return { success: true };
    },
});

// Add interest
export const addInterest = mutation({
    args: {
        userId: v.id("users"),
        interest: v.string(),
    },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("profiles")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first();

        if (!profile) {
            throw new Error("Profile not found");
        }

        // Check if interest already exists
        const existing = await ctx.db
            .query("interests")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        if (existing.some((i) => i.interest === args.interest)) {
            return; // Already exists
        }

        await ctx.db.insert("interests", {
            userId: args.userId,
            profileId: profile._id,
            interest: args.interest,
            createdAt: Date.now(),
        });
    },
});

// Remove interest
export const removeInterest = mutation({
    args: {
        userId: v.id("users"),
        interest: v.string(),
    },
    handler: async (ctx, args) => {
        const interests = await ctx.db
            .query("interests")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .collect();

        const toDelete = interests.find((i) => i.interest === args.interest);
        if (toDelete) {
            await ctx.db.delete(toDelete._id);
        }
    },
});

// Helper function to calculate profile completeness
function calculateCompleteness(profile: any): number {
    let score = 0;
    const weights = {
        basic: 30, // age, gender, location
        photos: 25,
        bio: 15,
        job: 10,
        education: 10,
        lifestyle: 10, // religion, drinking, smoking, kids
    };

    // Basic info (always present if profile exists)
    score += weights.basic;

    // Photos
    if (profile.hasPhotos || profile.photos?.length > 0) {
        score += weights.photos;
    }

    // Bio
    if (profile.bio && profile.bio.trim().length > 0) {
        score += weights.bio;
    }

    // Job
    if (profile.jobTitle) {
        score += weights.job;
    }

    // Education
    if (profile.education) {
        score += weights.education;
    }

    // Lifestyle (at least 2 filled)
    const lifestyleFields = [
        profile.religion,
        profile.drinking,
        profile.smoking,
        profile.wantsKids,
    ].filter(Boolean);

    if (lifestyleFields.length >= 2) {
        score += weights.lifestyle;
    }

    return Math.min(100, score);
}
