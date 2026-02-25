import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isUserPremium } from "./subscriptions";

const defaultSettings = {
  showOnlineStatus: true,
  readReceipts: true,
  emailNotifications: true,
  matchNotifications: true,
  messageNotifications: true,
};

export const getMySettings = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!settings) {
      return {
        ...defaultSettings,
        userId: args.userId,
      };
    }

    return settings;
  },
});

export const updateMySettings = mutation({
  args: {
    userId: v.id("users"),
    showOnlineStatus: v.optional(v.boolean()),
    readReceipts: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),
    matchNotifications: v.optional(v.boolean()),
    messageNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    const updates: any = {
      updatedAt: now,
    };

    if (args.showOnlineStatus !== undefined) updates.showOnlineStatus = args.showOnlineStatus;
    if (args.readReceipts !== undefined) {
      const premium = await isUserPremium(ctx, args.userId);
      if (!premium) {
        throw new Error("Read receipts are a Premium feature");
      }
      updates.readReceipts = args.readReceipts;
    }
    if (args.emailNotifications !== undefined) updates.emailNotifications = args.emailNotifications;
    if (args.matchNotifications !== undefined) updates.matchNotifications = args.matchNotifications;
    if (args.messageNotifications !== undefined) updates.messageNotifications = args.messageNotifications;

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    const id = await ctx.db.insert("userSettings", {
      userId: args.userId,
      ...defaultSettings,
      ...updates,
    });

    return id;
  },
});
