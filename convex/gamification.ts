import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// XP levels configuration
const XP_PER_LEVEL = 1000; // Base XP needed for level 2
const LEVEL_MULTIPLIER = 1.5; // Each level requires 1.5x more XP

// Calculate XP needed for a specific level
function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, i - 2));
  }
  return totalXP;
}

// Calculate level from XP
function getLevelFromXP(xp: number): number {
  let level = 1;
  while (xp >= getXPForLevel(level + 1)) {
    level++;
  }
  return level;
}

async function awardXP(
  ctx: MutationCtx,
  args: { userId: Id<"users">; amount: number; reason: string }
) {
  // Get or create user progress
  let progress = await ctx.db
    .query("userProgress")
    .withIndex("userId", (q) => q.eq("userId", args.userId))
    .first();

  if (!progress) {
    const progressId = await ctx.db.insert("userProgress", {
      userId: args.userId,
      level: 1,
      xp: 0,
      badges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    progress = await ctx.db.get(progressId);
  }

  if (!progress) throw new Error("Failed to create user progress");

  const oldLevel = progress.level;
  const newXP = progress.xp + args.amount;
  const newLevel = getLevelFromXP(newXP);
  const leveledUp = newLevel > oldLevel;

  await ctx.db.patch(progress._id, {
    xp: newXP,
    level: newLevel,
    updatedAt: Date.now(),
  });

  // Log activity
  await ctx.db.insert("activityLog", {
    userId: args.userId,
    activityType: "xp_earned",
    metadata: { amount: args.amount, reason: args.reason },
    timestamp: Date.now(),
  });

  return {
    newXP,
    leveledUp,
    newLevel,
    oldLevel,
    xpForNextLevel: getXPForLevel(newLevel + 1),
  };
}

// Initialize user progress
export const initializeUserProgress = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProgress")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return existing;

    const now = Date.now();
    return await ctx.db.insert("userProgress", {
      userId: args.userId,
      level: 1,
      xp: 0,
      badges: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Add XP to user
export const addXP = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    return await awardXP(ctx, args);
  },
});

// Get user progress
export const getUserProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!progress) {
      return {
        level: 1,
        xp: 0,
        badges: [],
        xpForNextLevel: getXPForLevel(2),
        xpProgress: 0,
      };
    }

    const xpForNextLevel = getXPForLevel(progress.level + 1);
    const xpForCurrentLevel = getXPForLevel(progress.level);
    const xpProgress = progress.xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercent = (xpProgress / xpNeeded) * 100;

    return {
      ...progress,
      xpForNextLevel,
      xpProgress,
      xpNeeded,
      progressPercent,
    };
  },
});

// Quest types and configurations
const QUEST_TYPES = {
  complete_profile: {
    name: "Complete Your Profile",
    description: "Add 3 more photos to your profile",
    target: 3,
    xpReward: 50,
  },
  send_messages: {
    name: "Be Sociable",
    description: "Send 5 messages today",
    target: 5,
    xpReward: 100,
  },
  swipe_profiles: {
    name: "Make Connections",
    description: "Swipe on 50 profiles",
    target: 50,
    xpReward: 75,
  },
  get_replies: {
    name: "Conversation Starter",
    description: "Get 3 replies to your messages",
    target: 3,
    xpReward: 150,
  },
  update_photo: {
    name: "First Impression",
    description: "Update your profile photo",
    target: 1,
    xpReward: 25,
  },
};

// Generate daily quests
export const generateDailyQuests = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const expiresAt = endOfDay.getTime();

    // Check if user already has active quests for today
    const existingQuests = await ctx.db
      .query("quests")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    if (existingQuests.length > 0) {
      return existingQuests;
    }

    // Generate 3 random quests
    const questTypeKeys = Object.keys(QUEST_TYPES) as (keyof typeof QUEST_TYPES)[];
    const selectedQuests = questTypeKeys
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const quests = [];
    for (const questType of selectedQuests) {
      const config = QUEST_TYPES[questType];
      const questId = await ctx.db.insert("quests", {
        userId: args.userId,
        questType,
        progress: 0,
        target: config.target,
        xpReward: config.xpReward,
        expiresAt,
        createdAt: now,
      });
      quests.push({
        _id: questId,
        questType,
        ...config,
        progress: 0,
        expiresAt,
      });
    }

    return quests;
  },
});

// Get active quests for user
export const getActiveQuests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quests = await ctx.db
      .query("quests")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    return quests.map((quest) => {
      const config = QUEST_TYPES[quest.questType as keyof typeof QUEST_TYPES];
      return {
        ...quest,
        name: config?.name || "Quest",
        description: config?.description || "",
        progressPercent: (quest.progress / quest.target) * 100,
      };
    });
  },
});

// Update quest progress
export const updateQuestProgress = mutation({
  args: {
    userId: v.id("users"),
    questType: v.string(),
    increment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quest = await ctx.db
      .query("quests")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("questType"), args.questType),
          q.gt(q.field("expiresAt"), now),
          q.eq(q.field("completedAt"), undefined)
        )
      )
      .first();

    if (!quest) return null;

    const newProgress = quest.progress + (args.increment || 1);
    const isCompleted = newProgress >= quest.target;

    await ctx.db.patch(quest._id, {
      progress: Math.min(newProgress, quest.target),
      ...(isCompleted ? { completedAt: now } : {}),
    });

    // Award XP if completed
    if (isCompleted) {
      await awardXP(ctx, {
        userId: args.userId,
        amount: quest.xpReward,
        reason: `Completed quest: ${args.questType}`,
      });
    }

    return {
      quest,
      completed: isCompleted,
      progress: newProgress,
    };
  },
});

// Complete a quest manually
export const completeQuest = mutation({
  args: {
    questId: v.id("quests"),
  },
  handler: async (ctx, args) => {
    const quest = await ctx.db.get(args.questId);
    if (!quest || quest.completedAt) return null;

    const now = Date.now();
    await ctx.db.patch(args.questId, {
      completedAt: now,
      progress: quest.target,
    });

    // Award XP
    await awardXP(ctx, {
      userId: quest.userId,
      amount: quest.xpReward,
      reason: `Completed quest: ${quest.questType}`,
    });

    return quest;
  },
});
