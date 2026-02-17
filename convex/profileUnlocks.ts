import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isUserPremium } from "./subscriptions";

export const FREE_QUOTA = 10;
export const PREMIUM_EXTRA_QUOTA = 10;
export const UNLOCK_COST = 10; // KES

/**
 * Get quota statistics for a user
 */
export const getQuotaStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const isPremium = await isUserPremium(ctx, args.userId);
    // 10 free profiles + 10 more after payment (premium)
    const totalQuota = FREE_QUOTA + (isPremium ? PREMIUM_EXTRA_QUOTA : 0);

    const unlocks = await ctx.db
      .query("itemUnlocks")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    const profileUnlocks = unlocks.filter((u) => u.itemType === "profile");
    const likeUnlocks = unlocks.filter((u) => u.itemType === "like");
    const matchUnlocks = unlocks.filter((u) => u.itemType === "match");

    return {
      isPremium,
      totalQuota,
      profiles: {
        used: profileUnlocks.length,
        remaining: Math.max(0, totalQuota - profileUnlocks.length),
      },
      likes: {
        used: likeUnlocks.length,
        remaining: Math.max(0, totalQuota - likeUnlocks.length),
      },
      matches: {
        used: matchUnlocks.length,
        remaining: Math.max(0, totalQuota - matchUnlocks.length),
      },
    };
  },
});

/**
 * Check if user can access an item
 */
export const canAccessItem = query({
  args: {
    userId: v.id("users"),
    targetId: v.string(),
    itemType: v.union(v.literal("profile"), v.literal("match"), v.literal("like")),
  },
  handler: async (ctx, args) => {
    // 1. Check if already unlocked
    const existing = await ctx.db
      .query("itemUnlocks")
      .withIndex("userItem", (q) =>
        q.eq("userId", args.userId)
         .eq("itemType", args.itemType)
         .eq("targetId", args.targetId)
      )
      .first();

    if (existing) {
      return { canAccess: true, reason: "already_unlocked" };
    }

    // 2. Check quota
    const isPremium = await isUserPremium(ctx, args.userId);
    // 10 free profiles + 10 more after payment (premium)
    const totalQuota = FREE_QUOTA + (isPremium ? PREMIUM_EXTRA_QUOTA : 0);

    const usedUnlocks = await ctx.db
      .query("itemUnlocks")
      .withIndex("userType", (q) =>
        q.eq("userId", args.userId)
         .eq("itemType", args.itemType)
      )
      .collect();

    // Only count quota-based unlocks (not paid ones)
    const quotaUsed = usedUnlocks.filter(u => u.unlockMethod !== "paid_unlock").length;

    if (quotaUsed < totalQuota) {
      return {
        canAccess: false,
        needsUnlock: true,
        reason: "quota_available",
        remainingQuota: totalQuota - quotaUsed
      };
    }

    // 3. Quota exceeded, requires payment
    return {
      canAccess: false,
      needsUnlock: true,
      reason: "payment_required",
      cost: UNLOCK_COST,
    };
  },
});

/**
 * Unlock an item (profile, match, or like)
 */
export const unlockItem = mutation({
  args: {
    userId: v.id("users"),
    targetId: v.string(),
    itemType: v.union(v.literal("profile"), v.literal("match"), v.literal("like")),
    paymentId: v.optional(v.id("payments")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if already unlocked
    const existing = await ctx.db
      .query("itemUnlocks")
      .withIndex("userItem", (q) =>
        q.eq("userId", args.userId)
         .eq("itemType", args.itemType)
         .eq("targetId", args.targetId)
      )
      .first();

    if (existing) {
      return { success: true, alreadyUnlocked: true };
    }

    // If paymentId is provided, it's a paid unlock
    if (args.paymentId) {
      await ctx.db.insert("itemUnlocks", {
        userId: args.userId,
        targetId: args.targetId,
        itemType: args.itemType,
        unlockedAt: now,
        unlockMethod: "paid_unlock",
        cost: UNLOCK_COST,
        paymentId: args.paymentId,
      });
      return { success: true, method: "paid_unlock" };
    }

    // Check quota
    const isPremium = await isUserPremium(ctx, args.userId);
    // 10 free profiles + 10 more after payment (premium)
    const totalQuota = FREE_QUOTA + (isPremium ? PREMIUM_EXTRA_QUOTA : 0);

    const usedUnlocks = await ctx.db
      .query("itemUnlocks")
      .withIndex("userType", (q) =>
        q.eq("userId", args.userId)
         .eq("itemType", args.itemType)
      )
      .collect();

    const quotaUsed = usedUnlocks.filter(u => u.unlockMethod !== "paid_unlock").length;

    if (quotaUsed < totalQuota) {
      const unlockMethod = quotaUsed < FREE_QUOTA ? "free_quota" : "subscription_quota";
      await ctx.db.insert("itemUnlocks", {
        userId: args.userId,
        targetId: args.targetId,
        itemType: args.itemType,
        unlockedAt: now,
        unlockMethod,
      });
      return { success: true, method: unlockMethod };
    }

    throw new Error("Quota exceeded. Please pay 10 KES to unlock this item.");
  },
});

// Legacy aliases for backward compatibility if needed
export const canViewProfile = canAccessItem;
export const unlockProfile = unlockItem;
