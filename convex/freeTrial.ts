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
