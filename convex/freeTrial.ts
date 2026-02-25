import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { insertNotification } from "./notifications";

/**
 * Activate 2-day free trial for new user.
 * Called automatically at the end of onboarding.
 */
export const activateFreeTrial = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Idempotent: if trial already used, return existing data
    if (user.freeTrialUsed) {
      return {
        trialStarted: user.freeTrialStartedAt ?? Date.now(),
        trialEnds: user.freeTrialEndsAt ?? Date.now(),
        message: "Your 2-day free trial is already active.",
        alreadyUsed: true,
      };
    }

    const now = Date.now();
    const trialEnd = now + 48 * 60 * 60 * 1000; // 48 hours

    // Update user with trial info
    await ctx.db.patch(args.userId, {
      freeTrialStartedAt: now,
      freeTrialEndsAt: trialEnd,
      freeTrialUsed: true,
    });

    // Send welcome notification
    await insertNotification(ctx, {
      userId: args.userId,
      type: "subscription_active",
      title: "Your 2-Day Free Trial Has Started!",
      body: "Enjoy unlimited profile views and messaging for the next 48 hours. Upgrade before it ends to keep full access!",
      priority: "high",
      category: "system",
      icon: "gift",
      link: "/subscription",
      actionButtons: [
        { label: "Explore Now", action: "navigate", link: "/discover" },
        { label: "View Plans", action: "navigate", link: "/subscription" },
      ],
    });

    return {
      trialStarted: now,
      trialEnds: trialEnd,
      message: "Your 2-day free trial is now active! Enjoy unlimited access for 48 hours.",
      alreadyUsed: false,
    };
  },
});

/**
 * Check if user is in free trial period
 */
export const isInFreeTrial = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { isActive: false };
    const now = Date.now();

    if (
      user.freeTrialStartedAt &&
      user.freeTrialEndsAt &&
      user.freeTrialEndsAt > now
    ) {
      return {
        isActive: true,
        endsAt: user.freeTrialEndsAt,
        hoursRemaining: Math.ceil((user.freeTrialEndsAt - now) / (60 * 60 * 1000)),
      };
    }
    return { isActive: false };
  },
});

/**
 * Get full trial + daily unlock status for the current user
 */
export const getFreeTrialStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    const now = Date.now();

    const trialActive =
      !!user.freeTrialStartedAt &&
      !!user.freeTrialEndsAt &&
      user.freeTrialEndsAt > now;

    const dailyUnlockActive =
      !!user.dailyUnlockEndsAt && user.dailyUnlockEndsAt > now;

    return {
      trialActive,
      trialStarted: user.freeTrialStartedAt,
      trialEnds: user.freeTrialEndsAt,
      trialUsed: user.freeTrialUsed || false,
      trialHoursRemaining: trialActive
        ? Math.ceil((user.freeTrialEndsAt! - now) / (60 * 60 * 1000))
        : 0,
      // Daily unlock
      dailyUnlockActive,
      dailyUnlockEndsAt: user.dailyUnlockEndsAt,
      dailyUnlockHoursRemaining: dailyUnlockActive
        ? Math.ceil((user.dailyUnlockEndsAt! - now) / (60 * 60 * 1000))
        : 0,
      // Has any form of full access
      hasFullAccess: trialActive || dailyUnlockActive,
    };
  },
});

/**
 * Notify when trial is ending (called when < 6 hours remain)
 */
export const notifyTrialEnding = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user?.freeTrialEndsAt) return null;
    const hoursLeft = Math.ceil((user.freeTrialEndsAt - Date.now()) / (60 * 60 * 1000));
    if (hoursLeft <= 6 && hoursLeft > 0) {
      return await insertNotification(ctx, {
        userId: args.userId,
        type: "trial_ending",
        title: `Trial Ending in ${hoursLeft} Hour${hoursLeft > 1 ? "s" : ""}!`,
        body: "Upgrade now to keep unlimited access. Or pay KES 10 for another 24 hours.",
        priority: "high",
        category: "system",
        icon: "warning",
        link: "/subscription",
        actionButtons: [
          { label: "Upgrade — KES 100/week", action: "navigate", link: "/subscription" },
          { label: "Daily Unlock — KES 10", action: "navigate", link: "/subscription" },
        ],
      });
    }
    return null;
  },
});

/**
 * Comprehensive trial notification check — called from the frontend periodically.
 * Sends notifications at 24h, 6h, and 1h remaining.
 * Uses a deduplication key to avoid sending the same notification twice.
 */
export const checkAndNotifyTrialStatus = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user?.freeTrialEndsAt || !user.freeTrialUsed) return null;

    const now = Date.now();
    const hoursLeft = (user.freeTrialEndsAt - now) / (60 * 60 * 1000);

    // Trial already expired
    if (hoursLeft <= 0) {
      // Check if we already sent trial_expired notification
      const existing = await ctx.db
        .query("notifications")
        .withIndex("groupKey", (q) =>
          q.eq("userId", args.userId).eq("groupKey", "trial_expired_final")
        )
        .first();
      if (!existing) {
        await insertNotification(ctx, {
          userId: args.userId,
          type: "trial_expired",
          title: "Your Free Trial Has Ended",
          body: "Your 2-day free trial has expired. Upgrade to Premium (KES 100/week) or pay KES 10 for 24-hour access to continue.",
          priority: "high",
          category: "system",
          icon: "🔒",
          link: "/subscription",
          actionButtons: [
            { label: "Upgrade — KES 100/week", action: "navigate", link: "/subscription" },
            { label: "Daily Unlock — KES 10", action: "navigate", link: "/subscription?daily=1" },
          ],
        });
        // Mark as sent using groupKey
        await ctx.db.patch(
          (await ctx.db.query("notifications")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .first())!._id,
          { groupKey: "trial_expired_final" }
        );
      }
      return { notified: "expired" };
    }

    // 24 hours remaining
    if (hoursLeft <= 24 && hoursLeft > 23) {
      const existing = await ctx.db
        .query("notifications")
        .withIndex("groupKey", (q) =>
          q.eq("userId", args.userId).eq("groupKey", "trial_ending_24h")
        )
        .first();
      if (!existing) {
        await insertNotification(ctx, {
          userId: args.userId,
          type: "trial_ending",
          title: "Free Trial Ending in 24 Hours!",
          body: "Your free trial expires tomorrow. Upgrade now to keep unlimited access to profiles and messaging.",
          priority: "high",
          category: "system",
          icon: "⏰",
          link: "/subscription",
          actionButtons: [
            { label: "Upgrade — KES 100/week", action: "navigate", link: "/subscription" },
            { label: "Daily Unlock — KES 10", action: "navigate", link: "/subscription?daily=1" },
          ],
        });
        await ctx.db.patch(
          (await ctx.db.query("notifications")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .first())!._id,
          { groupKey: "trial_ending_24h" }
        );
      }
      return { notified: "24h" };
    }

    // 6 hours remaining
    if (hoursLeft <= 6 && hoursLeft > 5) {
      const existing = await ctx.db
        .query("notifications")
        .withIndex("groupKey", (q) =>
          q.eq("userId", args.userId).eq("groupKey", "trial_ending_6h")
        )
        .first();
      if (!existing) {
        await insertNotification(ctx, {
          userId: args.userId,
          type: "trial_ending",
          title: "Free Trial Ending in 6 Hours!",
          body: "Only 6 hours left on your free trial. Upgrade now or pay KES 10 for another 24 hours of full access.",
          priority: "high",
          category: "system",
          icon: "⚠️",
          link: "/subscription",
          actionButtons: [
            { label: "Upgrade — KES 100/week", action: "navigate", link: "/subscription" },
            { label: "Daily Unlock — KES 10", action: "navigate", link: "/subscription?daily=1" },
          ],
        });
        await ctx.db.patch(
          (await ctx.db.query("notifications")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .first())!._id,
          { groupKey: "trial_ending_6h" }
        );
      }
      return { notified: "6h" };
    }

    // 1 hour remaining
    if (hoursLeft <= 1 && hoursLeft > 0) {
      const existing = await ctx.db
        .query("notifications")
        .withIndex("groupKey", (q) =>
          q.eq("userId", args.userId).eq("groupKey", "trial_ending_1h")
        )
        .first();
      if (!existing) {
        await insertNotification(ctx, {
          userId: args.userId,
          type: "trial_ending",
          title: "Free Trial Ending in 1 Hour!",
          body: "Your free trial expires in less than 1 hour! Upgrade now to avoid losing access.",
          priority: "critical",
          category: "system",
          icon: "🚨",
          link: "/subscription",
          actionButtons: [
            { label: "Upgrade Now — KES 100/week", action: "navigate", link: "/subscription" },
            { label: "KES 10 for 24h", action: "navigate", link: "/subscription?daily=1" },
          ],
        });
        await ctx.db.patch(
          (await ctx.db.query("notifications")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .first())!._id,
          { groupKey: "trial_ending_1h" }
        );
      }
      return { notified: "1h" };
    }

    return null;
  },
});

/**
 * Notify when daily unlock expires
 */
export const notifyDailyUnlockExpired = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user?.dailyUnlockEndsAt) return null;

    const now = Date.now();
    if (user.dailyUnlockEndsAt <= now) {
      // Check if we already sent this notification today
      const today = new Date(now);
      const dayKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
      const groupKey = `daily_unlock_expired_${dayKey}`;

      const existing = await ctx.db
        .query("notifications")
        .withIndex("groupKey", (q) =>
          q.eq("userId", args.userId).eq("groupKey", groupKey)
        )
        .first();

      if (!existing) {
        await insertNotification(ctx, {
          userId: args.userId,
          type: "daily_unlock_expired",
          title: "Your 24-Hour Access Has Expired",
          body: "Your daily unlock has expired. Purchase another KES 10 unlock or upgrade to a subscription plan.",
          priority: "high",
          category: "system",
          icon: "🔒",
          link: "/subscription",
          actionButtons: [
            { label: "Unlock Again — KES 10", action: "navigate", link: "/subscription?daily=1" },
            { label: "Upgrade — KES 100/week", action: "navigate", link: "/subscription" },
          ],
        });
        await ctx.db.patch(
          (await ctx.db.query("notifications")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .first())!._id,
          { groupKey }
        );
      }
      return { notified: true };
    }
    return null;
  },
});
