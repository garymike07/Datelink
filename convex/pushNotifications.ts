import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Save a push notification subscription for a user
 */
export const savePushSubscription = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    platform: v.union(v.literal("web"), v.literal("android"), v.literal("ios")),
    browser: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if subscription already exists
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        isActive: true,
        lastUsedAt: Date.now(),
        platform: args.platform,
        browser: args.browser,
      });
      return existing._id;
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint: args.endpoint,
      keys: args.keys,
      platform: args.platform,
      browser: args.browser,
      isActive: true,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    });

    return subscriptionId;
  },
});

/**
 * Remove a push notification subscription
 */
export const removePushSubscription = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (subscription) {
      await ctx.db.delete(subscription._id);
    }
  },
});

/**
 * Get all active push subscriptions for a user
 */
export const getUserPushSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return subscriptions;
  },
});

/**
 * Internal query to get push subscriptions for a specific user ID
 * Used by actions that need to send notifications
 */
export const getUserPushSubscriptionsByUserId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return subscriptions;
  },
});

/**
 * Get notification preferences for current user
 */
export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();

    return preferences;
  },
});

/**
 * Update notification preferences
 */
export const updatePreferences = mutation({
  args: {
    pushEnabled: v.optional(v.boolean()),
    pushMatches: v.optional(v.boolean()),
    pushMessages: v.optional(v.boolean()),
    pushLikes: v.optional(v.boolean()),
    pushSuperLikes: v.optional(v.boolean()),
    pushCalls: v.optional(v.boolean()),
    quietHoursEnabled: v.optional(v.boolean()),
    quietHoursStart: v.optional(v.string()),
    quietHoursEnd: v.optional(v.string()),
    batchNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new preferences with defaults - map old fields to new schema
    const now = Date.now();
    const preferencesId = await ctx.db.insert("notificationPreferences", {
      userId: user._id,
      enabled: true,
      pushEnabled: args.pushEnabled ?? true,
      emailEnabled: true,
      quietHoursEnabled: args.quietHoursEnabled ?? false,
      quietHoursStart: args.quietHoursStart,
      quietHoursEnd: args.quietHoursEnd,
      
      // Category preferences
      socialEnabled: true,
      callEnabled: true,
      paymentEnabled: true,
      engagementEnabled: true,
      systemEnabled: true,
      
      // Type-specific preferences - map from old push* fields
      matchNotifications: args.pushMatches ?? true,
      messageNotifications: args.pushMessages ?? true,
      likeNotifications: args.pushLikes ?? true,
      superLikeNotifications: args.pushSuperLikes ?? true,
      profileViewNotifications: true,
      callNotifications: args.pushCalls ?? true,
      paymentNotifications: true,
      
      // Batching preferences
      batchLikes: args.batchNotifications ?? false,
      batchProfileViews: args.batchNotifications ?? false,
      
      // Sound preferences
      soundEnabled: true,
      vibrationEnabled: true,
      
      createdAt: now,
      updatedAt: now,
    });

    return preferencesId;
  },
});

/**
 * Internal function to check if user is in quiet hours
 */
async function isInQuietHours(
  ctx: any,
  userId: Id<"users">
): Promise<boolean> {
  const preferences = await ctx.db
    .query("notificationPreferences")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .first();

  if (!preferences || !preferences.quietHoursEnabled) {
    return false;
  }

  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = preferences.quietHoursStart.split(":").map(Number);
  const [endHour, endMinute] = preferences.quietHoursEnd.split(":").map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  if (startTime <= endTime) {
    // Same day (e.g., 22:00 to 23:00)
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Crosses midnight (e.g., 22:00 to 08:00)
    return currentTime >= startTime || currentTime < endTime;
  }
}

/**
 * Send a push notification to a specific user
 * Note: This creates a notification record. Actual push sending would be done via a webhook/action
 */
export const sendPushNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    priority: v.optional(v.union(v.literal("high"), v.literal("normal"), v.literal("low"))),
  },
  handler: async (ctx, args) => {
    // Check preferences
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!preferences || !preferences.pushEnabled) {
      return { sent: false, reason: "push_disabled" };
    }

    // Check type-specific preference - use new schema fields
    const typeMap: Record<string, keyof typeof preferences> = {
      match: "matchNotifications",
      message: "messageNotifications",
      like: "likeNotifications",
      super_like: "superLikeNotifications",
      call_incoming: "callNotifications",
      call_missed: "callNotifications",
      call_ended: "callNotifications",
      call_declined: "callNotifications",
    };

    const prefKey = typeMap[args.type];
    if (prefKey && !preferences[prefKey]) {
      return { sent: false, reason: "type_disabled" };
    }

    // Check quiet hours (but allow calls through)
    const isCallNotification = args.type.startsWith('call_');
    if (!isCallNotification && await isInQuietHours(ctx, args.userId)) {
      return { sent: false, reason: "quiet_hours" };
    }

    // Get active subscriptions
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (subscriptions.length === 0) {
      return { sent: false, reason: "no_subscriptions" };
    }

    // Create notification record
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type as any,
      title: args.title,
      body: args.body,
      isRead: false,
      createdAt: Date.now(),
    });

    // In a real implementation, you would:
    // 1. Use a Convex action to call an external push service (web-push, FCM, APNs)
    // 2. Send the notification to all active subscriptions
    // 3. Handle failures and remove invalid subscriptions

    // Schedule the actual push notification via action
    // This allows calling external services (web-push, FCM, APNs)
    try {
      await ctx.scheduler.runAfter(0, "pushNotificationsActions:sendWebPushNotification" as any, {
        userId: args.userId,
        type: args.type,
        title: args.title,
        body: args.body,
        data: args.data,
        priority: args.priority || "normal",
      });
    } catch (error) {
      console.error("Failed to schedule push notification:", error);
    }

    return {
      sent: true,
      notificationId,
      subscriptionCount: subscriptions.length,
    };
  },
});

/**
 * Send push notification when a new match is created
 */
export const notifyNewMatch = mutation({
  args: {
    matchId: v.id("matches"),
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the other user's name
    const otherUser = await ctx.db.get(args.otherUserId);
    if (!otherUser) return;

    await ctx.runMutation(api.pushNotifications.sendPushNotification, {
      userId: args.userId,
      type: "match",
      title: "New Match! 🎉",
      body: `You matched with ${otherUser.name}!`,
      data: {
        matchId: args.matchId,
        userId: args.otherUserId,
        url: `/matches`,
      },
      priority: "high",
    });
  },
});

/**
 * Send push notification for new message
 */
export const notifyNewMessage = mutation({
  args: {
    messageId: v.id("messages"),
    recipientId: v.id("users"),
    senderId: v.id("users"),
    preview: v.string(),
    matchId: v.optional(v.id("matches")),
  },
  handler: async (ctx, args) => {
    const sender = await ctx.db.get(args.senderId);
    if (!sender) return;

    const chatUrl = args.matchId ? `/chat/${args.matchId}` : `/messages`;

    await ctx.runMutation(api.pushNotifications.sendPushNotification, {
      userId: args.recipientId,
      type: "message",
      title: sender.name,
      body: args.preview,
      data: {
        messageId: args.messageId,
        senderId: args.senderId,
        matchId: args.matchId,
        url: chatUrl,
      },
      priority: "high",
    });
  },
});

/**
 * Send push notification for incoming call
 */

/**
 * Send push notification for like received
 */
export const notifyLikeReceived = mutation({
  args: {
    recipientId: v.id("users"),
    likerId: v.id("users"),
    isUndo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.isUndo) return; // Don't notify on undo

    const liker = await ctx.db.get(args.likerId);
    if (!liker) return;

    await ctx.runMutation(api.pushNotifications.sendPushNotification, {
      userId: args.recipientId,
      type: "like",
      title: "Someone likes you! 💖",
      body: "See who's interested in you",
      data: {
        likerId: args.likerId,
        url: `/likes`,
      },
      priority: "normal",
    });
  },
});

/**
 * Send push notification for super like received
 */
export const notifySuperLikeReceived = mutation({
  args: {
    recipientId: v.id("users"),
    superLikerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const superLiker = await ctx.db.get(args.superLikerId);
    if (!superLiker) return;

    await ctx.runMutation(api.pushNotifications.sendPushNotification, {
      userId: args.recipientId,
      type: "super_like",
      title: "Super Like! ⭐",
      body: `${superLiker.name} super liked you!`,
      data: {
        superLikerId: args.superLikerId,
        url: `/discover`,
      },
      priority: "high",
    });
  },
});

/**
 * Update subscription last used timestamp
 */
export const updateSubscriptionLastUsed = mutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      lastUsedAt: Date.now(),
    });
  },
});

/**
 * Deactivate a push subscription (e.g., when it's invalid)
 */
export const deactivatePushSubscription = mutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      isActive: false,
    });
  },
});

/**
 * Clean up inactive subscriptions (scheduled job)
 */
export const cleanupInactiveSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const inactiveSubscriptions = await ctx.db
      .query("pushSubscriptions")
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.lt(q.field("lastUsedAt"), thirtyDaysAgo)
        )
      )
      .collect();

    for (const subscription of inactiveSubscriptions) {
      await ctx.db.patch(subscription._id, { isActive: false });
    }

    return { cleaned: inactiveSubscriptions.length };
  },
});
