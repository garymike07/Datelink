import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { insertNotification } from "./notifications";

/**
 * Daily Login Streak & Rewards System
 * Gamification feature to boost daily engagement
 */

export interface DailyReward {
  day: number;
  type: "boost" | "unlock" | "premium_trial" | "badge";
  amount: number;
  description: string;
  icon: string;
}

// Reward tiers for consecutive days
const STREAK_REWARDS: DailyReward[] = [
  { day: 1, type: "boost", amount: 1, description: "Welcome! 1 free profile boost", icon: "🎉" },
  { day: 3, type: "unlock", amount: 1, description: "3-day streak! 1 free profile unlock", icon: "🔥" },
  { day: 7, type: "boost", amount: 2, description: "Week strong! 2 free boosts", icon: "⭐" },
  { day: 14, type: "unlock", amount: 2, description: "Two weeks! 2 free unlocks", icon: "💎" },
  { day: 30, type: "premium_trial", amount: 1, description: "Month milestone! 1 day premium trial", icon: "👑" },
  { day: 60, type: "unlock", amount: 5, description: "60 days! 5 free unlocks", icon: "🏆" },
  { day: 90, type: "premium_trial", amount: 3, description: "90 days! 3 days premium", icon: "🌟" },
  { day: 180, type: "badge", amount: 1, description: "Half year! Legendary badge", icon: "🎖️" },
];

// Check and claim daily login reward
export const claimDailyLogin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Get or create streak record
    let streak = await ctx.db
      .query("loginStreaks")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Check if already claimed today
    if (streak && streak.lastClaimDate >= todayTimestamp) {
      return {
        alreadyClaimed: true,
        currentStreak: streak.currentStreak,
        nextReward: getNextReward(streak.currentStreak),
      };
    }

    let newStreak = 1;
    let isNewRecord = false;
    let rewardClaimed: DailyReward | null = null;

    if (streak) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayTimestamp = yesterday.getTime();

      // Check if last claim was yesterday (continue streak)
      if (streak.lastClaimDate >= yesterdayTimestamp && streak.lastClaimDate < todayTimestamp) {
        newStreak = streak.currentStreak + 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }

      // Check if new record
      if (newStreak > streak.longestStreak) {
        isNewRecord = true;
      }

      // Update streak
      await ctx.db.patch(streak._id, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        totalLogins: streak.totalLogins + 1,
        lastClaimDate: todayTimestamp,
      });
    } else {
      // Create new streak
      const streakId = await ctx.db.insert("loginStreaks", {
        userId: args.userId,
        currentStreak: 1,
        longestStreak: 1,
        totalLogins: 1,
        lastClaimDate: todayTimestamp,
      });
      // Fetch the created streak
      const newStreakDoc = await ctx.db.get(streakId);
      streak = newStreakDoc;
      newStreak = 1;
    }

    // Check if user earned a reward
    const reward = STREAK_REWARDS.find(r => r.day === newStreak);
    if (reward) {
      rewardClaimed = reward;
      await grantStreakReward(ctx, args.userId, reward);

      // Send notification
      await insertNotification(ctx, {
        userId: args.userId,
        type: "daily_reward",
        title: `${reward.icon} ${newStreak}-Day Streak Reward!`,
        body: reward.description,
        priority: "high",
        category: "system",
        icon: reward.icon,
        actionButtons: [
          { label: "View Rewards", action: "navigate", link: "/dashboard" },
        ],
      });
    }

    return {
      alreadyClaimed: false,
      currentStreak: newStreak,
      longestStreak: streak?.longestStreak || newStreak,
      isNewRecord,
      rewardClaimed,
      nextReward: getNextReward(newStreak),
      totalLogins: streak?.totalLogins || 1,
    };
  },
});

// Get current streak status
export const getStreakStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const streak = await ctx.db
      .query("loginStreaks")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalLogins: 0,
        canClaimToday: true,
        nextReward: getNextReward(0),
        upcomingRewards: STREAK_REWARDS.slice(0, 5),
      };
    }

    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Check if can claim today
    const canClaimToday = streak.lastClaimDate < todayTimestamp;

    // Check if streak is still active (claimed yesterday or today)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayTimestamp = yesterday.getTime();

    const isStreakActive = streak.lastClaimDate >= yesterdayTimestamp;
    const currentStreak = isStreakActive ? streak.currentStreak : 0;

    return {
      currentStreak,
      longestStreak: streak.longestStreak,
      totalLogins: streak.totalLogins,
      canClaimToday,
      lastClaimDate: streak.lastClaimDate,
      nextReward: getNextReward(currentStreak),
      upcomingRewards: STREAK_REWARDS.filter(r => r.day > currentStreak).slice(0, 5),
    };
  },
});

// Get leaderboard of longest streaks
export const getStreakLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const streaks = await ctx.db
      .query("loginStreaks")
      .order("desc")
      .take(limit * 2); // Take more to filter out inactive streaks

    // Sort by longest streak
    const sortedStreaks = streaks
      .sort((a, b) => b.longestStreak - a.longestStreak)
      .slice(0, limit);

    // Get user profiles
    const leaderboard = await Promise.all(
      sortedStreaks.map(async (streak) => {
        const user = await ctx.db.get(streak.userId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("userId", (q) => q.eq("userId", streak.userId))
          .first();

        return {
          userId: streak.userId,
          userName: user?.name || "Anonymous",
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          totalLogins: streak.totalLogins,
          profilePhoto: undefined, // Profile photos will be handled differently
        };
      })
    );

    return leaderboard;
  },
});

// Helper: Get next reward for given streak
function getNextReward(currentStreak: number): DailyReward | null {
  const nextReward = STREAK_REWARDS.find(r => r.day > currentStreak);
  return nextReward || null;
}

// Helper: Grant reward to user
async function grantStreakReward(ctx: any, userId: any, reward: DailyReward) {
  const now = Date.now();

  switch (reward.type) {
    case "boost":
      // Grant boost credits
      const boostCredits = await ctx.db
        .query("boostCredits")
        .withIndex("userId", (q: any) => q.eq("userId", userId))
        .first();

      if (boostCredits) {
        await ctx.db.patch(boostCredits._id, {
          credits: boostCredits.credits + reward.amount,
        });
      } else {
        await ctx.db.insert("boostCredits", {
          userId,
          credits: reward.amount,
          lastGranted: now,
        });
      }
      break;

    case "unlock":
      // Grant unlock credits
      const unlockCredits = await ctx.db
        .query("unlockCredits")
        .withIndex("userId", (q: any) => q.eq("userId", userId))
        .first();

      if (unlockCredits) {
        await ctx.db.patch(unlockCredits._id, {
          credits: unlockCredits.credits + reward.amount,
        });
      } else {
        await ctx.db.insert("unlockCredits", {
          userId,
          credits: reward.amount,
          lastGranted: now,
        });
      }
      break;

    case "premium_trial":
      // Grant premium trial days
      // This would integrate with your subscription system
      break;

    case "badge":
      // Grant special badge
      const badgeId = `streak_${reward.day}_days`;
      await ctx.db.insert("userBadges", {
        userId,
        badgeId,
        name: `${reward.day} Day Streak`,
        description: `Logged in for ${reward.day} consecutive days`,
        icon: reward.icon,
        category: "achievement",
        rarity: "legendary",
        earnedAt: now,
      });
      break;
  }
}
