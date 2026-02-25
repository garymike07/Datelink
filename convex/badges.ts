import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Badge definitions
export const BADGE_CONFIGS = {
  // Verification Badges
  verified_profile: {
    name: "Verified Profile",
    description: "Identity verified with selfie",
    icon: "✅",
    category: "verification",
    rarity: "common",
  },
  photo_verified: {
    name: "Photo Verified",
    description: "All photos approved",
    icon: "📸",
    category: "verification",
    rarity: "common",
  },
  email_verified: {
    name: "Email Verified",
    description: "Email address confirmed",
    icon: "📧",
    category: "verification",
    rarity: "common",
  },
  phone_verified: {
    name: "Phone Verified",
    description: "Phone number verified",
    icon: "📱",
    category: "verification",
    rarity: "common",
  },

  // Activity Badges
  popular: {
    name: "Popular",
    description: "50+ profile views this week",
    icon: "🔥",
    category: "activity",
    rarity: "rare",
  },
  quick_responder: {
    name: "Quick Responder",
    description: "Replies within 1 hour on average",
    icon: "⚡",
    category: "activity",
    rarity: "rare",
  },
  great_conversationalist: {
    name: "Great Conversationalist",
    description: "Long engaging conversations",
    icon: "💬",
    category: "activity",
    rarity: "rare",
  },
  serious_dater: {
    name: "Serious Dater",
    description: "Looking for a serious relationship",
    icon: "🎯",
    category: "activity",
    rarity: "common",
  },

  // Achievement Badges
  profile_complete: {
    name: "Profile Complete",
    description: "100% profile completion",
    icon: "🌟",
    category: "achievement",
    rarity: "common",
  },
  premium_member: {
    name: "Premium Member",
    description: "Active premium subscription",
    icon: "💎",
    category: "achievement",
    rarity: "rare",
  },
  top_tier: {
    name: "Top Tier",
    description: "High match quality score",
    icon: "🏆",
    category: "achievement",
    rarity: "epic",
  },
  vip: {
    name: "VIP",
    description: "Premium Plus member",
    icon: "👑",
    category: "achievement",
    rarity: "legendary",
  },
  early_adopter: {
    name: "Early Adopter",
    description: "Joined in the first month",
    icon: "🚀",
    category: "achievement",
    rarity: "epic",
  },
  matchmaker: {
    name: "Matchmaker",
    description: "50+ successful matches",
    icon: "💘",
    category: "achievement",
    rarity: "epic",
  },
};

// Internal helper to award a badge. Safe to call from other server functions.
async function awardBadgeInternal(
  ctx: MutationCtx,
  userId: Id<"users">,
  badgeId: string
) {
  // Get user progress
  let progress = await ctx.db
    .query("userProgress")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .first();

  if (!progress) {
    // Create progress if it doesn't exist
    const progressId = await ctx.db.insert("userProgress", {
      userId,
      level: 1,
      xp: 0,
      badges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    progress = await ctx.db.get(progressId);
  }

  if (!progress) throw new Error("Failed to create user progress");

  // Check if badge already awarded
  if (progress.badges.includes(badgeId)) {
    return { alreadyHas: true as const };
  }

  // Add badge
  const newBadges = [...progress.badges, badgeId];
  await ctx.db.patch(progress._id, {
    badges: newBadges,
    updatedAt: Date.now(),
  });

  // Log activity
  await ctx.db.insert("activityLog", {
    userId,
    activityType: "badge_earned",
    metadata: { badgeId },
    timestamp: Date.now(),
  });

  return {
    success: true as const,
    badgeId,
    badgeConfig: BADGE_CONFIGS[badgeId as keyof typeof BADGE_CONFIGS],
  };
}

// Initialize badge definitions in database
export const initializeBadges = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    
    for (const [badgeId, config] of Object.entries(BADGE_CONFIGS)) {
      const existing = await ctx.db
        .query("badgeDefinitions")
        .withIndex("badgeId", (q) => q.eq("badgeId", badgeId))
        .first();

      if (!existing) {
        await ctx.db.insert("badgeDefinitions", {
          badgeId,
          name: config.name,
          description: config.description,
          icon: config.icon,
          category: config.category,
          rarity: config.rarity,
          isActive: true,
          createdAt: now,
        });
      }
    }
  },
});

// Award a badge to a user
export const awardBadge = mutation({
  args: {
    userId: v.id("users"),
    badgeId: v.string(),
  },
  handler: async (ctx, args) => {
    return await awardBadgeInternal(ctx, args.userId, args.badgeId);
  },
});

// Get user's badges
export const getUserBadges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!progress || !progress.badges.length) {
      return [];
    }

    // Get badge definitions
    const badges = await Promise.all(
      progress.badges.map(async (badgeId) => {
        const definition = await ctx.db
          .query("badgeDefinitions")
          .withIndex("badgeId", (q) => q.eq("badgeId", badgeId))
          .first();
        
        return definition || {
          badgeId,
          ...(BADGE_CONFIGS[badgeId as keyof typeof BADGE_CONFIGS] || {}),
        };
      })
    );

    return badges;
  },
});

// Check and award automatic badges
export const checkAndAwardBadges = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const awarded: string[] = [];

    // Get user data
    const user = await ctx.db.get(args.userId);
    if (!user) return awarded;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const progress = await ctx.db
      .query("userProgress")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const existingBadges = progress?.badges || [];

    // Check Email Verified
    if (user.emailVerified && !existingBadges.includes("email_verified")) {
      await awardBadgeInternal(ctx, args.userId, "email_verified");
      awarded.push("email_verified");
    }

    // Check Profile Verified
    const verification = await ctx.db
      .query("verifications")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .first();

    if (verification && !existingBadges.includes("verified_profile")) {
      await awardBadgeInternal(ctx, args.userId, "verified_profile");
      awarded.push("verified_profile");
    }

    // Check Profile Complete
    if (profile && profile.completeness >= 100 && !existingBadges.includes("profile_complete")) {
      await awardBadgeInternal(ctx, args.userId, "profile_complete");
      awarded.push("profile_complete");
    }

    // Check Premium Member
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("plan"), "premium")
        )
      )
      .first();

    if (subscription && !existingBadges.includes("premium_member")) {
      await awardBadgeInternal(ctx, args.userId, "premium_member");
      awarded.push("premium_member");
    }

    // Check Serious Dater
    if (profile?.relationshipGoal === "serious" && !existingBadges.includes("serious_dater")) {
      await awardBadgeInternal(ctx, args.userId, "serious_dater");
      awarded.push("serious_dater");
    }

    // Check Matchmaker (50+ matches)
    const matchesUser1 = await ctx.db
      .query("matches")
      .withIndex("user1Id", (q) => q.eq("user1Id", args.userId))
      .collect();

    const matchesUser2 = await ctx.db
      .query("matches")
      .withIndex("user2Id", (q) => q.eq("user2Id", args.userId))
      .collect();

    const totalMatches = matchesUser1.length + matchesUser2.length;
    if (totalMatches >= 50 && !existingBadges.includes("matchmaker")) {
      await awardBadgeInternal(ctx, args.userId, "matchmaker");
      awarded.push("matchmaker");
    }

    // Check Popular (50+ views this week)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentViews = await ctx.db
      .query("activityLog")
      .withIndex("userTimestamp", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("activityType"), "profile_viewed"),
          q.gt(q.field("timestamp"), oneWeekAgo)
        )
      )
      .collect();

    if (recentViews.length >= 50 && !existingBadges.includes("popular")) {
      await awardBadgeInternal(ctx, args.userId, "popular");
      awarded.push("popular");
    }

    // Check Top Tier (high ELO)
    if (profile && (profile.elo || 0) >= 1500 && !existingBadges.includes("top_tier")) {
      await awardBadgeInternal(ctx, args.userId, "top_tier");
      awarded.push("top_tier");
    }

    return awarded;
  },
});

// Get all badge definitions
export const getAllBadges = query({
  handler: async (ctx) => {
    const badges = await ctx.db
      .query("badgeDefinitions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return badges;
  },
});
