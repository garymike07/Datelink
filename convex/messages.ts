import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { isUserPremium } from "./subscriptions";
import { insertNotification } from "./notifications";

// Resolve an existing conversation (match thread) between two users.
// Creates a match if user has liked the other user, allowing messaging even without mutual match.
export const ensureConversation = mutation({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.userId === args.otherUserId) {
      throw new Error("Cannot open conversation with yourself");
    }

    // Check for existing match
    const [user1, user2] = [args.userId, args.otherUserId].sort();
    
    const matchDirect = await ctx.db
      .query("matches")
      .withIndex("users", (q) => q.eq("user1Id", user1).eq("user2Id", user2))
      .first();

    if (matchDirect) {
      return { matchId: matchDirect._id };
    }

    // No existing match - check if user has liked the other user
    const hasLiked = await ctx.db
      .query("likes")
      .withIndex("pair", (q) => q.eq("userId", args.userId).eq("likedUserId", args.otherUserId))
      .first();

    if (!hasLiked) {
      throw new Error("You can only message users you have liked");
    }

    // User has liked them - create a match to enable messaging
    const now = Date.now();
    const matchId = await ctx.db.insert("matches", {
      user1Id: user1,
      user2Id: user2,
      matchedAt: now,
      user1Unread: 0,
      user2Unread: 0,
    });

    return { matchId };
  },
});

// Send a message (only if matched)
export const sendMessage = mutation({
  args: {
    matchId: v.id("matches"),
    senderId: v.id("users"),
    body: v.string(),
    type: v.optional(v.union(v.literal("text"), v.literal("gif"), v.literal("voice"), v.literal("photo"), v.literal("system"), v.literal("attachment"))),
    replyToId: v.optional(v.id("messages")),
    metadata: v.optional(
      v.object({
        gifUrl: v.optional(v.string()),
        voiceUrl: v.optional(v.string()),
        voiceDuration: v.optional(v.number()),
        photoUrl: v.optional(v.string()),
        attachmentId: v.optional(v.id("_storage")),
        attachmentUrl: v.optional(v.string()),
        attachmentName: v.optional(v.string()),
        attachmentType: v.optional(v.string()),
        attachmentSize: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify match exists and user is part of it
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Cannot send message: match not found");
    }

    if (match.user1Id !== args.senderId && match.user2Id !== args.senderId) {
      throw new Error("Cannot send message: unauthorized");
    }

    const messageType = args.type ?? "text";
    const premium = await isUserPremium(ctx, args.senderId);

    // Access check: user needs premium, active trial, or daily unlock to send messages
    if (!premium) {
      const sender = await ctx.db.get(args.senderId);
      const now = Date.now();
      const inTrial = sender?.freeTrialEndsAt && sender.freeTrialEndsAt > now;
      const hasDailyUnlock = sender?.dailyUnlockEndsAt && sender.dailyUnlockEndsAt > now;
      if (!inTrial && !hasDailyUnlock) {
        throw new Error(
          "Your free trial has expired. Upgrade to Premium (KES 100/week) or pay KES 10 for 24-hour access to continue messaging."
        );
      }
    }

    const receiverId = match.user1Id === args.senderId ? match.user2Id : match.user1Id;

    // Create message
    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      matchId: match._id,
      senderId: args.senderId,
      receiverId,
      body: args.body,
      type: messageType,
      replyToId: args.replyToId,
      metadata: args.metadata,
      deliveredAt: now,
      isRead: false,
      readAt: undefined,
      isDeleted: false,
      createdAt: now,
    });

    // Update match with last message time and increment unread count
    const isUser1 = match.user1Id === args.senderId;
    await ctx.db.patch(match._id, {
      lastMessageAt: now,
      user1Unread: isUser1 ? match.user1Unread : match.user1Unread + 1,
      user2Unread: isUser1 ? match.user2Unread + 1 : match.user2Unread,
    });

    // Phase 7: In-app notification with enhanced fields
    const sender = await ctx.db.get(args.senderId);
    const senderName = sender?.name || "Someone";
    
    const preview =
      messageType === "text"
        ? args.body
        : messageType === "gif"
          ? "Sent you a GIF 🎬"
          : messageType === "photo"
            ? "Sent you a photo 📷"
            : messageType === "voice"
              ? "Sent you a voice message 🎤"
              : messageType === "attachment"
                ? `Sent you a file 📎`
                : "Sent you a message";
    
    await insertNotification(ctx, {
      userId: receiverId,
      type: "message",
      title: `New message from ${senderName}`,
      body: preview.slice(0, 140),
      priority: "high",
      category: "social",
      icon: "💬",
      relatedUserId: args.senderId,
      relatedMatchId: match._id,
      relatedMessageId: messageId,
      link: `/chat/${match._id}`,
      actionButtons: [
        { label: "Reply", action: "navigate", link: `/chat/${match._id}` },
      ],
    });

    // Phase 3: Send push notification for new message
    await ctx.scheduler.runAfter(0, "pushNotifications:notifyNewMessage" as any, {
      messageId,
      recipientId: receiverId,
      senderId: args.senderId,
      preview: preview.slice(0, 100),
      matchId: match._id,
    });

    return messageId;
  },
});

// Get messages for a specific match
export const getMessages = query({
  args: {
    matchId: v.id("matches"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is part of this match
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.user1Id !== args.userId && match.user2Id !== args.userId) {
      throw new Error("Unauthorized: not part of this match");
    }

    // Get all messages for this match
    const messages = await ctx.db
      .query("messages")
      .withIndex("matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    const enriched = await Promise.all(
      messages.map(async (m) => {
        const metadata = (m as any).metadata;
        if (metadata?.attachmentId) {
          const attachmentUrl = await ctx.storage.getUrl(metadata.attachmentId);
          return {
            ...m,
            metadata: {
              ...metadata,
              attachmentUrl: attachmentUrl ?? metadata.attachmentUrl,
            },
          };
        }
        return m;
      })
    );

    return enriched
      .filter((m) => {
        const deletedFor = (m as any).deletedForUserIds as string[] | undefined;
        return !deletedFor?.includes(args.userId);
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Frontend alias
export const getConversation = getMessages;

// Delete all messages in a chat thread for the current user (keeps match intact)
export const deleteChat = mutation({
  args: {
    matchId: v.id("matches"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.user1Id !== args.userId && match.user2Id !== args.userId) {
      throw new Error("Unauthorized: not part of this match");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    for (const message of messages) {
      const deletedFor = new Set<Id<"users">>((message as any).deletedForUserIds ?? []);
      deletedFor.add(args.userId);
      await ctx.db.patch(message._id, { deletedForUserIds: Array.from(deletedFor) });
    }

    await ctx.db.patch(args.matchId, {
      user1Unread: 0,
      user2Unread: 0,
    });

    return { deletedCount: messages.length };
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    deleteForEveryone: v.boolean(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const match = await ctx.db.get(message.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const isParticipant = match.user1Id === args.userId || match.user2Id === args.userId;
    if (!isParticipant) {
      throw new Error("Unauthorized: not part of this match");
    }

    if (args.deleteForEveryone) {
      if (message.senderId !== args.userId) {
        throw new Error("Only the sender can delete this message for everyone");
      }

      const now = Date.now();
      await ctx.db.patch(message._id, {
        isDeleted: true,
        deletedAt: now,
        body: "",
        metadata: undefined,
      });
    } else {
      const deletedFor = new Set<Id<"users">>((message as any).deletedForUserIds ?? []);
      deletedFor.add(args.userId);
      await ctx.db.patch(message._id, { deletedForUserIds: Array.from(deletedFor) });
    }

    return { success: true };
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    matchId: v.id("matches"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is part of this match
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.user1Id !== args.userId && match.user2Id !== args.userId) {
      throw new Error("Unauthorized: not part of this match");
    }

    // Get unread messages sent to this user
    const messages = await ctx.db
      .query("messages")
      .withIndex("matchId", (q) => q.eq("matchId", args.matchId))
      .filter((q) =>
        q.and(
          q.eq(q.field("receiverId"), args.userId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect();

    const now = Date.now();

    // Mark all as read
    for (const message of messages) {
      await ctx.db.patch(message._id, { isRead: true, readAt: now });
    }

    // Reset unread count for this user
    const isUser1 = match.user1Id === args.userId;
    await ctx.db.patch(args.matchId, {
      user1Unread: isUser1 ? 0 : match.user1Unread,
      user2Unread: isUser1 ? match.user2Unread : 0,
    });

    return { markedCount: messages.length };
  },
});

// Phase 5: Mark a single message as read (for per-message read receipts)
export const markMessageAsRead = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");

    const match = await ctx.db.get(msg.matchId);
    if (!match) throw new Error("Match not found");

    if (match.user1Id !== args.userId && match.user2Id !== args.userId) {
      throw new Error("Unauthorized: not part of this match");
    }

    if (msg.receiverId !== args.userId) {
      return { success: false };
    }

    if (msg.isRead) return { success: true };

    const now = Date.now();
    await ctx.db.patch(msg._id, { isRead: true, readAt: now });

    // Also ensure unread count is reduced to 0 in this thread if needed
    const isUser1 = match.user1Id === args.userId;
    await ctx.db.patch(match._id, {
      user1Unread: isUser1 ? 0 : match.user1Unread,
      user2Unread: isUser1 ? match.user2Unread : 0,
    });

    return { success: true };
  },
});

// Phase 5: Read receipts (Premium) - returns read status for messages in a conversation
export const getReadReceipts = query({
  args: {
    matchId: v.id("matches"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const premium = await isUserPremium(ctx, args.userId);
    if (!premium) throw new Error("Premium required for read receipts");

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");
    if (match.user1Id !== args.userId && match.user2Id !== args.userId) {
      throw new Error("Unauthorized: not part of this match");
    }

    const otherUserId = match.user1Id === args.userId ? match.user2Id : match.user1Id;
    const mySettings = await ctx.db
      .query("userSettings")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
    const otherSettings = await ctx.db
      .query("userSettings")
      .withIndex("userId", (q) => q.eq("userId", otherUserId))
      .first();

    // Privacy rule: if either party has read receipts disabled, don't show receipts.
    if (mySettings?.readReceipts === false) return {};
    if (otherSettings?.readReceipts === false) return {};

    const messages = await ctx.db
      .query("messages")
      .withIndex("matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    const receipts: Record<string, { deliveredAt?: number; readAt?: number }> = {};
    for (const m of messages) {
      if ((m as any).isDeleted) continue;
      const deletedFor = (m as any).deletedForUserIds as string[] | undefined;
      if (deletedFor?.includes(args.userId)) continue;
      if (m.senderId !== args.userId) continue;
      receipts[m._id] = {
        deliveredAt: (m as any).deliveredAt,
        readAt: (m as any).readAt,
      };
    }

    return receipts;
  },
});

// Frontend alias
export const markAsRead = markMessagesAsRead;

// Get conversations (matches with last message preview)
export const getConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all matches for this user
    const matches1 = await ctx.db
      .query("matches")
      .withIndex("user1Id", (q) => q.eq("user1Id", args.userId))
      .collect();

    const matches2 = await ctx.db
      .query("matches")
      .withIndex("user2Id", (q) => q.eq("user2Id", args.userId))
      .collect();

    const allMatches = [...matches1, ...matches2];

    // Enrich with last message and profile data
    const conversations = await Promise.all(
      allMatches.map(async (match) => {
        const otherUserId =
          match.user1Id === args.userId ? match.user2Id : match.user1Id;
        const unreadCount =
          match.user1Id === args.userId ? match.user1Unread : match.user2Unread;

        // Get other user's profile
        const profile = await ctx.db
          .query("profiles")
          .withIndex("userId", (q) => q.eq("userId", otherUserId))
          .first();

        if (!profile) return null;

        // Get primary photo
        const photos = await ctx.db
          .query("photos")
          .withIndex("userId", (q) => q.eq("userId", otherUserId))
          .collect();

        const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];

        // Get last message
        const messages = await ctx.db
          .query("messages")
          .withIndex("matchId", (q) => q.eq("matchId", match._id))
          .order("desc")
          .take(10);

        const lastMessage = messages.find((message) => {
          if ((message as any).isDeleted) return false;
          const deletedFor = (message as any).deletedForUserIds as string[] | undefined;
          return !deletedFor?.includes(args.userId);
        });

        // Get user name
        const user = await ctx.db.get(otherUserId);

        return {
          matchId: match._id,
          userId: otherUserId,
          name: user?.name,
          age: profile.age,
          primaryPhoto: primaryPhoto?.url,
          lastMessage: lastMessage
            ? {
              body: lastMessage.body,
              createdAt: lastMessage.createdAt,
              isFromMe: lastMessage.senderId === args.userId,
            }
            : null,
          unreadCount,
          matchedAt: match.matchedAt,
        };
      })
    );

    return conversations
      .filter((c) => c !== null)
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.matchedAt;
        const bTime = b.lastMessage?.createdAt || b.matchedAt;
        return bTime - aTime;
      });
  },
});

// Set typing status
export const setTypingStatus = mutation({
  args: {
    matchId: v.id("matches"),
    userId: v.id("users"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if typing status exists
    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("matchUser", (q) =>
        q.eq("matchId", args.matchId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      // Update existing status
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        updatedAt: now,
      });
    } else {
      // Create new status
      await ctx.db.insert("typingStatus", {
        matchId: args.matchId,
        userId: args.userId,
        isTyping: args.isTyping,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Get typing status for a match
export const getTypingStatus = query({
  args: {
    matchId: v.id("matches"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get match to find other user
    const match = await ctx.db.get(args.matchId);
    if (!match) return { isTyping: false };

    const otherUserId = match.user1Id === args.userId ? match.user2Id : match.user1Id;

    // Get other user's typing status
    const status = await ctx.db
      .query("typingStatus")
      .withIndex("matchUser", (q) =>
        q.eq("matchId", args.matchId).eq("userId", otherUserId)
      )
      .first();

    if (!status) return { isTyping: false };

    // Consider status stale after 5 seconds
    const isRecent = Date.now() - status.updatedAt < 5000;

    return {
      isTyping: status.isTyping && isRecent,
      userId: otherUserId,
    };
  },
});

// Add reaction to a message
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already reacted to this message
    const existing = await ctx.db
      .query("messageReactions")
      .withIndex("messageUser", (q) =>
        q.eq("messageId", args.messageId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      // Update existing reaction
      await ctx.db.patch(existing._id, {
        emoji: args.emoji,
      });
      return existing._id;
    } else {
      // Create new reaction
      const reactionId = await ctx.db.insert("messageReactions", {
        messageId: args.messageId,
        userId: args.userId,
        emoji: args.emoji,
        createdAt: Date.now(),
      });
      return reactionId;
    }
  },
});

// Remove reaction from a message
export const removeReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const reaction = await ctx.db
      .query("messageReactions")
      .withIndex("messageUser", (q) =>
        q.eq("messageId", args.messageId).eq("userId", args.userId)
      )
      .first();

    if (reaction) {
      await ctx.db.delete(reaction._id);
      return { success: true };
    }

    return { success: false };
  },
});

// Get reactions for messages
export const getMessageReactions = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    // Get all messages for this match
    const messages = await ctx.db
      .query("messages")
      .withIndex("matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    // Get reactions for each message using the index
    const reactions = [];
    for (const message of messages) {
      const messageReactions = await ctx.db
        .query("messageReactions")
        .withIndex("messageId", (q) => q.eq("messageId", message._id))
        .collect();
      reactions.push(...messageReactions);
    }

    // Group by message ID
    const reactionsByMessage: Record<string, any[]> = {};
    for (const reaction of reactions) {
      const msgId = reaction.messageId;
      if (!reactionsByMessage[msgId]) {
        reactionsByMessage[msgId] = [];
      }
      reactionsByMessage[msgId].push({
        userId: reaction.userId,
        emoji: reaction.emoji,
        createdAt: reaction.createdAt,
      });
    }

    return reactionsByMessage;
  },
});


