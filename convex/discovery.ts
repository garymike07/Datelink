import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isUserPremium } from "./subscriptions";
import { insertNotification } from "./notifications";

// ============================================================================
// SAVED SEARCHES
// ============================================================================

export const saveSearch = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    filters: v.object({
      minAge: v.number(),
      maxAge: v.number(),
      maxDistance: v.number(),
      genderPreference: v.array(v.string()),
      minHeight: v.optional(v.number()),
      maxHeight: v.optional(v.number()),
      relationshipGoals: v.optional(v.array(v.string())),
      religions: v.optional(v.array(v.string())),
      education: v.optional(v.array(v.string())),
      verified: v.optional(v.boolean()),
    }),
    notificationsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const isPremium = await isUserPremium(ctx, args.userId);
    
    // Check existing saved searches count
    const existingSearches = await ctx.db
      .query("savedSearches")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Free users: max 3 searches, Premium: unlimited
    if (!isPremium && existingSearches.length >= 3) {
      throw new Error("Free users can save up to 3 searches. Upgrade to Premium for unlimited.");
    }

    const now = Date.now();
    const searchId = await ctx.db.insert("savedSearches", {
      userId: args.userId,
      name: args.name,
      filters: args.filters,
      notificationsEnabled: args.notificationsEnabled ?? false,
      newMatchesCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { searchId, message: "Search saved successfully" };
  },
});

export const getSavedSearches = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const searches = await ctx.db
      .query("savedSearches")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return searches;
  },
});

export const deleteSavedSearch = mutation({
  args: {
    userId: v.id("users"),
    searchId: v.id("savedSearches"),
  },
  handler: async (ctx, args) => {
    const search = await ctx.db.get(args.searchId);
    if (!search || search.userId !== args.userId) {
      throw new Error("Search not found or unauthorized");
    }

    await ctx.db.delete(args.searchId);
    return { message: "Search deleted successfully" };
  },
});

export const updateSavedSearch = mutation({
  args: {
    userId: v.id("users"),
    searchId: v.id("savedSearches"),
    name: v.optional(v.string()),
    filters: v.optional(v.object({
      minAge: v.number(),
      maxAge: v.number(),
      maxDistance: v.number(),
      genderPreference: v.array(v.string()),
      minHeight: v.optional(v.number()),
      maxHeight: v.optional(v.number()),
      relationshipGoals: v.optional(v.array(v.string())),
      religions: v.optional(v.array(v.string())),
      education: v.optional(v.array(v.string())),
      verified: v.optional(v.boolean()),
    })),
    notificationsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const search = await ctx.db.get(args.searchId);
    if (!search || search.userId !== args.userId) {
      throw new Error("Search not found or unauthorized");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name) updates.name = args.name;
    if (args.filters) updates.filters = args.filters;
    if (args.notificationsEnabled !== undefined) {
      updates.notificationsEnabled = args.notificationsEnabled;
    }

    await ctx.db.patch(args.searchId, updates);
    return { message: "Search updated successfully" };
  },
});

export const runSavedSearch = query({
  args: {
    userId: v.id("users"),
    searchId: v.id("savedSearches"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const search = await ctx.db.get(args.searchId);
    if (!search || search.userId !== args.userId) {
      throw new Error("Search not found or unauthorized");
    }

    const limit = args.limit || 20;
    const filters = search.filters;

    // Get user's profile for location-based filtering
    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Get users I've already liked or passed
    const myLikes = await ctx.db
      .query("likes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    const myPasses = await ctx.db
      .query("passes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    const myMatches = await ctx.db
      .query("matches")
      .withIndex("user1Id", (q) => q.eq("user1Id", args.userId))
      .collect();
    const myMatches2 = await ctx.db
      .query("matches")
      .withIndex("user2Id", (q) => q.eq("user2Id", args.userId))
      .collect();

    const seenUserIds = new Set([
      ...myLikes.map((l) => l.likedUserId),
      ...myPasses.map((p) => p.passedUserId),
      ...myMatches.map((m) => m.user2Id),
      ...myMatches2.map((m) => m.user1Id),
    ]);

    // Query profiles based on filters
    const allProfiles = await ctx.db
      .query("profiles")
      .collect();

    const candidates = [];

    for (const profile of allProfiles) {
      // Skip self and already seen
      if (profile.userId === args.userId || seenUserIds.has(profile.userId)) {
        continue;
      }

      // Basic filters
      if (profile.age < filters.minAge || profile.age > filters.maxAge) {
        continue;
      }

      if (!filters.genderPreference.includes(profile.gender)) {
        continue;
      }

      // Distance filter (simple approximation)
      if (userProfile.latitude && userProfile.longitude && profile.latitude && profile.longitude) {
        const distance = calculateDistance(
          userProfile.latitude,
          userProfile.longitude,
          profile.latitude,
          profile.longitude
        );
        if (distance > filters.maxDistance) {
          continue;
        }
      }

      // Advanced filters
      if (filters.minHeight && profile.height && profile.height < filters.minHeight) {
        continue;
      }
      if (filters.maxHeight && profile.height && profile.height > filters.maxHeight) {
        continue;
      }

      if (filters.relationshipGoals && filters.relationshipGoals.length > 0) {
        if (!profile.relationshipGoal || !filters.relationshipGoals.includes(profile.relationshipGoal)) {
          continue;
        }
      }

      if (filters.religions && filters.religions.length > 0) {
        if (!profile.religion || !filters.religions.includes(profile.religion)) {
          continue;
        }
      }

      if (filters.education && filters.education.length > 0) {
        if (!profile.education || !filters.education.includes(profile.education)) {
          continue;
        }
      }

      if (filters.verified) {
        const verification = await ctx.db
          .query("verifications")
          .withIndex("userId", (q) => q.eq("userId", profile.userId))
          .filter((q) => q.eq(q.field("status"), "approved"))
          .first();
        if (!verification) continue;
      }

      // Get user info and photos
      const user = await ctx.db.get(profile.userId);
      const photos = await ctx.db
        .query("photos")
        .withIndex("userId", (q) => q.eq("userId", profile.userId))
        .collect();

      if (user && photos.length > 0) {
        candidates.push({
          ...profile,
          name: user.name,
          photos: photos.sort((a, b) => a.order - b.order),
        });
      }
    }

    return candidates.slice(0, limit);
  },
});

// ============================================================================
// NEW IN YOUR AREA
// ============================================================================

export const getNewInArea = query({
  args: {
    userId: v.id("users"),
    daysBack: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack || 7;
    const limit = args.limit || 10;
    const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

    // Get user's profile and preferences
    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userProfile || !preferences) {
      return [];
    }

    // Get users I've already interacted with
    const myLikes = await ctx.db
      .query("likes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    const myPasses = await ctx.db
      .query("passes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    const myMatches = await ctx.db
      .query("matches")
      .withIndex("user1Id", (q) => q.eq("user1Id", args.userId))
      .collect();
    const myMatches2 = await ctx.db
      .query("matches")
      .withIndex("user2Id", (q) => q.eq("user2Id", args.userId))
      .collect();

    const seenUserIds = new Set([
      ...myLikes.map((l) => l.likedUserId),
      ...myPasses.map((p) => p.passedUserId),
      ...myMatches.map((m) => m.user2Id),
      ...myMatches2.map((m) => m.user1Id),
    ]);

    // Find new profiles in the area
    const allProfiles = await ctx.db
      .query("profiles")
      .collect();

    const newProfiles = [];

    for (const profile of allProfiles) {
      // Skip self and already seen
      if (profile.userId === args.userId || seenUserIds.has(profile.userId)) {
        continue;
      }

      // Check if profile is new
      if (profile.createdAt < cutoffDate) {
        continue;
      }

      // Check age preference
      if (profile.age < preferences.minAge || profile.age > preferences.maxAge) {
        continue;
      }

      // Check gender preference
      if (!preferences.genderPreference.includes(profile.gender)) {
        continue;
      }

      // Check distance
      if (userProfile.latitude && userProfile.longitude && profile.latitude && profile.longitude) {
        const distance = calculateDistance(
          userProfile.latitude,
          userProfile.longitude,
          profile.latitude,
          profile.longitude
        );
        if (distance > preferences.maxDistance) {
          continue;
        }
      }

      // Get user info and photos
      const user = await ctx.db.get(profile.userId);
      const photos = await ctx.db
        .query("photos")
        .withIndex("userId", (q) => q.eq("userId", profile.userId))
        .collect();

      if (user && photos.length > 0) {
        newProfiles.push({
          ...profile,
          name: user.name,
          photos: photos.sort((a, b) => a.order - b.order),
          joinedDaysAgo: Math.floor((Date.now() - profile.createdAt) / (24 * 60 * 60 * 1000)),
        });
      }
    }

    // Sort by most recent first
    newProfiles.sort((a, b) => b.createdAt - a.createdAt);

    return newProfiles.slice(0, limit);
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
