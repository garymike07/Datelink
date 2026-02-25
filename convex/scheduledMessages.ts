import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isUserPremium } from "./subscriptions";

export const scheduleMessage = mutation({
  args: {
    matchId: v.id("matches"),
    senderId: v.id("users"),
    body: v.string(),
    scheduledFor: v.number(),
    type: v.optional(v.union(v.literal("text"), v.literal("gif"), v.literal("voice"), v.literal("photo"))),
    metadata: v.optional(
      v.object({
        gifUrl: v.optional(v.string()),
        voiceUrl: v.optional(v.string()),
        voiceDuration: v.optional(v.number()),
        photoUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const premium = await isUserPremium(ctx, args.senderId);
    if (!premium) throw new Error("Premium required to schedule messages");

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");
    if (match.user1Id !== args.senderId && match.user2Id !== args.senderId) {
      throw new Error("Unauthorized: not part of this match");
    }

    const now = Date.now();
    if (args.scheduledFor <= now) throw new Error("scheduledFor must be in the future");

    const id = await ctx.db.insert("scheduledMessages", {
      matchId: args.matchId,
      senderId: args.senderId,
      body: args.body,
      type: args.type ?? "text",
      metadata: args.metadata,
      scheduledFor: args.scheduledFor,
      sent: false,
      sentAt: undefined,
      createdAt: now,
    });

    return { scheduledMessageId: id };
  },
});

// Best-effort sender-side delivery: client can call periodically to deliver due messages.
export const sendDueScheduledMessages = mutation({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const premium = await isUserPremium(ctx, args.userId);
    if (!premium) throw new Error("Premium required");

    const now = Date.now();
    const limit = args.limit ?? 25;

    const due = await ctx.db
      .query("scheduledMessages")
      .withIndex("due", (q) => q.eq("sent", false).lt("scheduledFor", now))
      .take(limit);

    let sentCount = 0;
    for (const item of due) {
      if (item.senderId !== args.userId) continue;

      const match = await ctx.db.get(item.matchId);
      if (!match) continue;
      if (match.user1Id !== args.userId && match.user2Id !== args.userId) continue;

      const receiverId = match.user1Id === args.userId ? match.user2Id : match.user1Id;
      const createdAt = item.scheduledFor;

      await ctx.db.insert("messages", {
        matchId: item.matchId,
        senderId: args.userId,
        receiverId,
        body: item.body,
        type: item.type ?? "text",
        metadata: item.metadata,
        deliveredAt: createdAt,
        isRead: false,
        readAt: undefined,
        isDeleted: false,
        createdAt,
      } as any);

      await ctx.db.patch(match._id, {
        lastMessageAt: createdAt,
        user1Unread: match.user1Id === args.userId ? match.user1Unread : match.user1Unread + 1,
        user2Unread: match.user1Id === args.userId ? match.user2Unread + 1 : match.user2Unread,
      });

      await ctx.db.patch(item._id, { sent: true, sentAt: now });
      sentCount++;
    }

    return { sentCount };
  },
});

export const getScheduledMessagesForMatch = query({
  args: { matchId: v.id("matches"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const premium = await isUserPremium(ctx, args.userId);
    if (!premium) throw new Error("Premium required");

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");
    if (match.user1Id !== args.userId && match.user2Id !== args.userId) {
      throw new Error("Unauthorized: not part of this match");
    }

    const items = await ctx.db
      .query("scheduledMessages")
      .withIndex("matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    return items
      .filter((i) => i.senderId === args.userId)
      .sort((a, b) => a.scheduledFor - b.scheduledFor);
  },
});
