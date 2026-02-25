import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get onboarding progress for a user
export const getProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    return progress;
  },
});

// Initialize or update onboarding progress
export const updateProgress = mutation({
  args: {
    userId: v.id("users"),
    currentStep: v.number(),
    completedSteps: v.optional(v.array(v.number())),
    skippedSteps: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("onboardingProgress")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing progress
      await ctx.db.patch(existing._id, {
        currentStep: args.currentStep,
        completedSteps: args.completedSteps ?? existing.completedSteps,
        skippedSteps: args.skippedSteps ?? existing.skippedSteps,
        lastUpdatedAt: now,
      });
      return existing._id;
    } else {
      // Create new progress record
      const progressId = await ctx.db.insert("onboardingProgress", {
        userId: args.userId,
        currentStep: args.currentStep,
        completedSteps: args.completedSteps ?? [],
        skippedSteps: args.skippedSteps ?? [],
        startedAt: now,
        lastUpdatedAt: now,
      });
      return progressId;
    }
  },
});

// Mark a step as completed
export const completeStep = mutation({
  args: {
    userId: v.id("users"),
    stepNumber: v.number(),
  },
  handler: async (ctx, args) => {
    let progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    // If no progress exists, create it
    if (!progress) {
      const progressId = await ctx.db.insert("onboardingProgress", {
        userId: args.userId,
        currentStep: args.stepNumber,
        completedSteps: [],
        skippedSteps: [],
        startedAt: now,
        lastUpdatedAt: now,
      });
      
      // Fetch the newly created progress
      progress = await ctx.db.get(progressId);
      if (!progress) {
        throw new Error("Failed to create onboarding progress");
      }
    }

    // Add step to completed steps if not already there
    const completedSteps = progress.completedSteps.includes(args.stepNumber)
      ? progress.completedSteps
      : [...progress.completedSteps, args.stepNumber];

    // Remove from skipped steps if it was there
    const skippedSteps = progress.skippedSteps.filter(
      (s) => s !== args.stepNumber
    );

    await ctx.db.patch(progress._id, {
      completedSteps,
      skippedSteps,
      lastUpdatedAt: now,
    });

    return { success: true };
  },
});

// Skip a step
export const skipStep = mutation({
  args: {
    userId: v.id("users"),
    stepNumber: v.number(),
  },
  handler: async (ctx, args) => {
    let progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    // If no progress exists, create it
    if (!progress) {
      const progressId = await ctx.db.insert("onboardingProgress", {
        userId: args.userId,
        currentStep: args.stepNumber,
        completedSteps: [],
        skippedSteps: [],
        startedAt: now,
        lastUpdatedAt: now,
      });
      
      // Fetch the newly created progress
      progress = await ctx.db.get(progressId);
      if (!progress) {
        throw new Error("Failed to create onboarding progress");
      }
    }

    // Add step to skipped steps if not already there
    const skippedSteps = progress.skippedSteps.includes(args.stepNumber)
      ? progress.skippedSteps
      : [...progress.skippedSteps, args.stepNumber];

    await ctx.db.patch(progress._id, {
      skippedSteps,
      lastUpdatedAt: now,
    });

    return { success: true };
  },
});

// Complete entire onboarding
export const completeOnboarding = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    let progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    // If no progress exists, create it (edge case)
    if (!progress) {
      const progressId = await ctx.db.insert("onboardingProgress", {
        userId: args.userId,
        currentStep: 5,
        completedSteps: [1, 2, 3, 4, 5],
        skippedSteps: [],
        startedAt: now,
        lastUpdatedAt: now,
        completedAt: now,
      });
      
      progress = await ctx.db.get(progressId);
      if (!progress) {
        throw new Error("Failed to create onboarding progress");
      }
    } else {
      await ctx.db.patch(progress._id, {
        completedAt: now,
        lastUpdatedAt: now,
      });
    }

    // Create a welcome notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "profile_created",
      title: "Welcome to DateLink! 🎉",
      body: "Your profile is all set. Start discovering amazing people!",
      priority: "high",
      category: "system",
      isRead: false,
      createdAt: now,
    });

    return { success: true, completedAt: now };
  },
});

// Check if onboarding is complete
export const isOnboardingComplete = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    return {
      isComplete: !!progress?.completedAt,
      currentStep: progress?.currentStep ?? 1,
      completedSteps: progress?.completedSteps ?? [],
    };
  },
});
