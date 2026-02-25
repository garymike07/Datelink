import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const presenceStatus = v.union(v.literal("online"), v.literal("away"), v.literal("offline"));

export const updatePresence = mutation({
  args: {
    userId: v.id("users"),
    status: presenceStatus,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("presence")
      .withIndex("userId", (q: any) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { status: args.status, lastActiveAt: now, updatedAt: now });
    } else {
      await ctx.db.insert("presence", {
        userId: args.userId,
        status: args.status,
        lastActiveAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

export const getPresenceStatus = query({
  args: {
    targetUserId: v.id("users"),
    viewerUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const viewerIsTarget = args.viewerUserId && args.viewerUserId === args.targetUserId;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("userId", (q: any) => q.eq("userId", args.targetUserId))
      .first();

    if (!viewerIsTarget && settings && settings.showOnlineStatus === false) {
      return { status: "hidden" as const, lastActiveAt: null as number | null };
    }

    const presence = await ctx.db
      .query("presence")
      .withIndex("userId", (q: any) => q.eq("userId", args.targetUserId))
      .first();

    const lastActiveAt = presence?.lastActiveAt ?? null;
    if (!lastActiveAt) return { status: "offline" as const, lastActiveAt };

    const secondsSinceActive = (Date.now() - lastActiveAt) / 1000;
    if (secondsSinceActive < 45) return { status: "online" as const, lastActiveAt };
    if (secondsSinceActive < 5 * 60) return { status: "away" as const, lastActiveAt };
    return { status: "offline" as const, lastActiveAt };
  },
});
