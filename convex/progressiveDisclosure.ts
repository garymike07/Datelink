import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get personalized upgrade prompts based on user behavior
 */
export const getUpgradeRecommendation = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Check if premium
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    if (sub?.status === "active") return null; // Already premium

    const now = Date.now();

    // Get user activity
    const unlocks = await ctx.db
      .query("profileUnlocks")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    const matches = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(
          q.eq(q.field("user1Id"), args.userId),
          q.eq(q.field("user2Id"), args.userId)
        )
      )
      .collect();

    const likes = await ctx.db
      .query("likes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    // People who liked them back
    const likedByOthers = await ctx.db
      .query("likes")
      .withIndex("likedUserId", (q) => q.eq("likedUserId", args.userId))
      .collect();

    // Analyze behavior patterns
    const trialUnlocks = unlocks.filter((u) => u.unlockMethod === "free_trial").length;
    const paidUnlocks = unlocks.filter((u) => u.unlockMethod === "paid_unlock").length;
    const hasMatches = matches.length > 0;
    const hasBeenLiked = likedByOthers.length > 0;
    const likesGiven = likes.length;

    // Check trial status
    const inTrial = user.freeTrialEndsAt && user.freeTrialEndsAt > now;
    const trialExpired = user.freeTrialUsed && (!user.freeTrialEndsAt || user.freeTrialEndsAt <= now);

    // Recommendation logic
    let recommendation = null;

    if (inTrial && trialUnlocks >= 4) {
      // About to run out of free unlocks
      recommendation = {
        type: "trial_almost_done",
        urgency: "high",
        title: "Only 1 Free Unlock Left! 🔥",
        message: "You're loving DateLink254! Upgrade now to unlock unlimited profiles.",
        cta: "Get Unlimited Unlocks",
        discount: null,
      };
    } else if (trialExpired && hasMatches && trialUnlocks === 5) {
      // Had good trial experience with matches
      recommendation = {
        type: "post_trial_success",
        urgency: "medium",
        title: "Keep the Momentum Going! 💕",
        message: `You have ${matches.length} match${matches.length > 1 ? 'es' : ''}! Don't lose them - upgrade to continue chatting.`,
        cta: "Upgrade to Premium",
        discount: null,
      };
    } else if (hasBeenLiked && !inTrial && !sub) {
      // Someone likes them but they can't see
      recommendation = {
        type: "likes_waiting",
        urgency: "high",
        title: `${likedByOthers.length} ${likedByOthers.length > 1 ? 'People' : 'Person'} Liked You! 😍`,
        message: "See who's interested and match instantly with Premium.",
        cta: "See Who Likes Me",
        discount: null,
      };
    } else if (paidUnlocks >= 3) {
      // Spending on individual unlocks - better to subscribe
      recommendation = {
        type: "frequent_buyer",
        urgency: "medium",
        title: "Save Money with Premium! 💰",
        message: `You've spent KES ${paidUnlocks * 10} on unlocks. Get unlimited for KES 100/week!`,
        cta: "Save with Premium",
        discount: "SAVE_NOW",
      };
    } else if (likesGiven >= 8 && !hasMatches) {
      // Active user without matches - needs boost
      recommendation = {
        type: "boost_visibility",
        urgency: "low",
        title: "Get More Matches! 🚀",
        message: "Premium users get 10x more profile views. Start matching today!",
        cta: "Boost My Profile",
        discount: null,
      };
    }

    return recommendation;
  },
});

/**
 * Get trial status for a user (helper for calculating hours remaining)
 */
export const getTrialTimeRemaining = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.freeTrialEndsAt) return null;

    const now = Date.now();
    const timeRemaining = user.freeTrialEndsAt - now;

    if (timeRemaining <= 0) {
      return { expired: true, hoursRemaining: 0 };
    }

    const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));

    return {
      expired: false,
      hoursRemaining,
      endsAt: user.freeTrialEndsAt,
      shouldShowUrgentPrompt: hoursRemaining <= 2,
    };
  },
});
