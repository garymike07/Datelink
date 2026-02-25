import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user preferences
export const getPreferences = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
    
    // Return defaults if not found
    if (!prefs) {
      return getDefaultPreferences();
    }
    
    return prefs;
  },
});

// Update preferences
export const updatePreferences = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      enabled: v.optional(v.boolean()),
      quietHoursEnabled: v.optional(v.boolean()),
      quietHoursStart: v.optional(v.string()),
      quietHoursEnd: v.optional(v.string()),
      socialEnabled: v.optional(v.boolean()),
      callEnabled: v.optional(v.boolean()),
      paymentEnabled: v.optional(v.boolean()),
      engagementEnabled: v.optional(v.boolean()),
      systemEnabled: v.optional(v.boolean()),
      matchNotifications: v.optional(v.boolean()),
      messageNotifications: v.optional(v.boolean()),
      likeNotifications: v.optional(v.boolean()),
      superLikeNotifications: v.optional(v.boolean()),
      profileViewNotifications: v.optional(v.boolean()),
      callNotifications: v.optional(v.boolean()),
      paymentNotifications: v.optional(v.boolean()),
      pushEnabled: v.optional(v.boolean()),
      emailEnabled: v.optional(v.boolean()),
      batchLikes: v.optional(v.boolean()),
      batchProfileViews: v.optional(v.boolean()),
      soundEnabled: v.optional(v.boolean()),
      vibrationEnabled: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
    
    const now = Date.now();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.updates,
        updatedAt: now,
      });
      return { success: true, preferencesId: existing._id };
    } else {
      const preferencesId = await ctx.db.insert("notificationPreferences", {
        userId: args.userId,
        ...getDefaultPreferences(),
        ...args.updates,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, preferencesId };
    }
  },
});

// Initialize default preferences for new user
export const initializePreferences = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (existing) return { preferencesId: existing._id };
    
    const now = Date.now();
    const preferencesId = await ctx.db.insert("notificationPreferences", {
      userId: args.userId,
      ...getDefaultPreferences(),
      createdAt: now,
      updatedAt: now,
    });
    
    return { preferencesId };
  },
});

function getDefaultPreferences() {
  return {
    enabled: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    
    socialEnabled: true,
    callEnabled: true,
    paymentEnabled: true,
    engagementEnabled: true,
    systemEnabled: true,
    
    matchNotifications: true,
    messageNotifications: true,
    likeNotifications: true,
    superLikeNotifications: true,
    profileViewNotifications: true,
    callNotifications: true,
    paymentNotifications: true,
    
    pushEnabled: true,
    emailEnabled: true,
    
    batchLikes: true,
    batchProfileViews: true,
    batchFrequency: "hourly",
    
    soundEnabled: true,
    vibrationEnabled: true,
  };
}
