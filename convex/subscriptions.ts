import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function getDayKeyUtc(nowMs: number) {
  const d = new Date(nowMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function isUserPremium(ctx: any, userId: any) {
  const now = Date.now();
  const sub = await ctx.db
    .query("subscriptions")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .order("desc")
    .first();

  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (sub.plan !== "premium") return false;
  if (typeof sub.endsAt === "number" && sub.endsAt <= now) return false;
  return true;
}

// Query version of isUserPremium for use in actions
export const checkUserHasPremium = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await isUserPremium(ctx, args.userId);
  },
});

async function ensureDailyUsage(ctx: any, userId: any, nowMs: number) {
  const dayKey = getDayKeyUtc(nowMs);
  const existing = await ctx.db
    .query("dailyUsage")
    .withIndex("userDay", (q: any) => q.eq("userId", userId).eq("dayKey", dayKey))
    .first();

  if (existing) return existing;

  // If called from a mutation context, insert new record
  if (ctx.db.insert) {
    const id = await ctx.db.insert("dailyUsage", {
      userId,
      dayKey,
      likes: 0,
      superLikes: 0,
      updatedAt: nowMs,
    });

    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Failed to initialize daily usage");
    return doc;
  }

  // If called from a query context, return default values
  return {
    userId,
    dayKey,
    likes: 0,
    superLikes: 0,
    updatedAt: nowMs,
  };
}

// NOTE: consumeLike is now deprecated in favor of quota-based likes in matching.ts
export async function consumeLike(ctx: any, userId: any) {
  const now = Date.now();
  const usage = await ensureDailyUsage(ctx, userId, now);
  await ctx.db.patch(usage._id, {
    likes: usage.likes + 1,
    updatedAt: now,
  });
}

export async function consumeSuperLike(ctx: any, userId: any) {
  const now = Date.now();
  const premium = await isUserPremium(ctx, userId);
  if (!premium) {
    throw new Error("Super Likes are a Premium feature. Upgrade to continue.");
  }

  const limits = {
    dailySuperLikesLimit: 5,
  };

  const usage = await ensureDailyUsage(ctx, userId, now);
  if (usage.superLikes >= limits.dailySuperLikesLimit) {
    throw new Error("Daily Super Like limit reached. Try again tomorrow.");
  }

  await ctx.db.patch(usage._id, {
    superLikes: usage.superLikes + 1,
    updatedAt: now,
  });
}

export const getMyEntitlements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const premium = await isUserPremium(ctx, args.userId);
    const now = Date.now();
    const usage = await ensureDailyUsage(ctx, args.userId, now);

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    const plan = premium ? (sub?.plan ?? "premium") : "free";

    // Get global quota stats
    const FREE_QUOTA = 10;
    const PREMIUM_EXTRA_QUOTA = 10;
    const totalQuota = FREE_QUOTA + (premium ? PREMIUM_EXTRA_QUOTA : 0);

    const unlocks = await ctx.db
      .query("itemUnlocks")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    const likeUnlocks = unlocks.filter((u) => u.itemType === "like" && u.unlockMethod !== "paid_unlock");

    return {
      plan,
      isPremium: premium,
      dailyLikesLimit: totalQuota, // Reuse field name but use global quota
      dailyLikesUsed: likeUnlocks.length,
      dailySuperLikesLimit: premium ? 5 : 0,
      dailySuperLikesUsed: usage.superLikes,
      canSuperLike: premium,
      canRewind: premium,
    };
  },
});

export const getMySubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
    return sub ?? null;
  },
});

export const cancelSubscription = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
    immediate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
    if (!sub) throw new Error("No subscription found");
    if (sub.status !== "active") return { status: sub.status, endsAt: sub.endsAt ?? sub.currentPeriodEnds ?? null };

    const endsAt = args.immediate ? now : (sub.currentPeriodEnds ?? sub.endsAt ?? now);
    await ctx.db.patch(sub._id, {
      status: "canceled",
      autoRenew: false,
      canceledAt: now,
      cancellationReason: args.reason,
      endsAt: endsAt,
      updatedAt: now,
    });

    return { status: "canceled", endsAt: endsAt };
  },
});

/**
 * Get daily usage stats for the current user (messages sent, profile views today)
 * Used by the frontend to show remaining quota to restricted users.
 */
export const getDailyUsageStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const d = new Date(now);
    const dayKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const usage = await ctx.db
      .query("dailyUsage")
      .withIndex("userDay", (q) => q.eq("userId", args.userId).eq("dayKey", dayKey))
      .first();
    const DAILY_MESSAGE_LIMIT = 20;
    const DAILY_PROFILE_VIEW_LIMIT = 10;
    const messagesSent = usage?.messages ?? 0;
    const profileViewsToday = usage?.profileViews ?? 0;
    return {
      dayKey,
      messagesSent,
      messagesRemaining: Math.max(0, DAILY_MESSAGE_LIMIT - messagesSent),
      dailyMessageLimit: DAILY_MESSAGE_LIMIT,
      profileViewsToday,
      profileViewsRemaining: Math.max(0, DAILY_PROFILE_VIEW_LIMIT - profileViewsToday),
      dailyProfileViewLimit: DAILY_PROFILE_VIEW_LIMIT,
    };
  },
});
