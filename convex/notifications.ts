import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const notificationType = v.union(
  // Existing
  v.literal("match"),
  v.literal("message"),
  v.literal("like"),
  v.literal("super_like"),
  v.literal("profile_view"),
  v.literal("quest_complete"),
  v.literal("badge_unlock"),
  v.literal("boost_active"),
  v.literal("boost_ending"),
  v.literal("verification_complete"),
  
  // NEW - Core Features
  v.literal("profile_created"),
  v.literal("payment_success"),
  v.literal("payment_failed"),
  v.literal("subscription_active"),
  v.literal("subscription_expiring"),

  // NEW - Auth
  v.literal("login_success"),
  
  // NEW - Engagement
  v.literal("likes_received_batch"),
  v.literal("super_like_received"),
  v.literal("profile_viewed"),
  v.literal("top_picks_ready"),
  v.literal("new_match_potential"),
  
  // NEW - Premium Features
  v.literal("boost_started"),
  v.literal("boost_results"),
  v.literal("rewind_available"),
  
  // NEW - Safety & Verification
  v.literal("verification_pending"),
  v.literal("verification_rejected"),
  v.literal("account_warning"),
  
  // NEW - Profile Unlock / Free Trial
  v.literal("trial_ending"),
  v.literal("unlock_limit"),
  v.literal("daily_reward")
);

export const priorityType = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

export const categoryType = v.union(
  v.literal("social"),
  v.literal("call"),
  v.literal("payment"),
  v.literal("engagement"),
  v.literal("system")
);

export const categoryTypeWithAll = v.union(
  v.literal("social"),
  v.literal("call"),
  v.literal("payment"),
  v.literal("engagement"),
  v.literal("system"),
  v.literal("all")
);

// Helper function to get default category for notification type
function getDefaultCategory(type: string): "social" | "call" | "payment" | "engagement" | "system" {
  const categoryMap: Record<string, "social" | "call" | "payment" | "engagement" | "system"> = {
    match: "social",
    message: "social",
    like: "social",
    super_like: "social",
    super_like_received: "social",
    profile_view: "engagement",
    profile_viewed: "engagement",
    likes_received_batch: "engagement",
    top_picks_ready: "engagement",
    new_match_potential: "engagement",    payment_success: "payment",
    payment_failed: "payment",
    subscription_active: "payment",
    subscription_expiring: "payment",

    login_success: "system",
    profile_created: "system",
    quest_complete: "system",
    badge_unlock: "system",
    boost_active: "system",
    boost_started: "system",
    boost_ending: "system",
    boost_results: "system",
    verification_complete: "system",
    verification_pending: "system",
    verification_rejected: "system",
    account_warning: "system",
    rewind_available: "system",
    trial_ending: "system",
    unlock_limit: "system",
    daily_reward: "system", 
  };
  return categoryMap[type] || "system";
}

// Helper function to check if current time is in quiet hours
function isInQuietHours(current: string, start: string, end: string): boolean {
  const [currH, currM] = current.split(":").map(Number);
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  
  const currMins = currH * 60 + currM;
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  
  if (startMins <= endMins) {
    return currMins >= startMins && currMins < endMins;
  } else {
    // Quiet hours span midnight
    return currMins >= startMins || currMins < endMins;
  }
}

export async function insertNotification(
  ctx: any,
  args: {
    userId: any;
    type: any;
    title: string;
    body: string;
    priority?: "critical" | "high" | "medium" | "low";
    category?: "social" | "call" | "payment" | "engagement" | "system";
    icon?: string;
    imageUrl?: string;
    actionButtons?: Array<{
      label: string;
      action: string;
      link?: string;
    }>;
    relatedUserId?: any;
    relatedMatchId?: any;
    relatedMessageId?: any;    relatedPaymentId?: any;
    link?: string;
    groupKey?: string;
    aggregatedCount?: number;
    expiresAt?: number;
  }
) {
  // Get user preferences
  const prefs = await ctx.db
    .query("notificationPreferences")
    .withIndex("userId", (q: any) => q.eq("userId", args.userId))
    .first();
  
  // Check if notifications are enabled
  if (prefs && !prefs.enabled) {
    return null; // Don't create notification
  }
  
  // Check category preferences
  const category = args.category || getDefaultCategory(args.type);
  const categoryEnabled = prefs?.[`${category}Enabled`] ?? true;
  if (!categoryEnabled) {
    return null;
  }
  
  // Check type-specific preferences
  const typePreferenceMap: Record<string, string> = {
    match: "matchNotifications",
    message: "messageNotifications",
    like: "likeNotifications",
    super_like_received: "superLikeNotifications",
    profile_viewed: "profileViewNotifications",
    profile_view: "profileViewNotifications",    payment_success: "paymentNotifications",
    payment_failed: "paymentNotifications",
    subscription_active: "paymentNotifications",
    subscription_expiring: "paymentNotifications",
  };
  
  const prefKey = typePreferenceMap[args.type];
  if (prefKey && prefs && !prefs[prefKey as keyof typeof prefs]) {
    return null;
  }
  
  // Check quiet hours
  if (prefs?.quietHoursEnabled) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const start = prefs.quietHoursStart || "22:00";
    const end = prefs.quietHoursEnd || "08:00";
    
    if (isInQuietHours(currentTime, start, end)) {
      // Only allow critical notifications during quiet hours
      if (args.priority !== "critical") {
        return null;
      }
    }
  }
  
  // All checks passed - create the notification
  const now = Date.now();
  return await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    priority: args.priority || "medium",
    category: category,
    icon: args.icon,
    imageUrl: args.imageUrl,
    actionButtons: args.actionButtons,
    relatedUserId: args.relatedUserId,
    relatedMatchId: args.relatedMatchId,
    relatedMessageId: args.relatedMessageId,
    relatedPaymentId: args.relatedPaymentId,
    link: args.link,
    groupKey: args.groupKey,
    aggregatedCount: args.aggregatedCount,
    isRead: false,
    createdAt: now,
    deliveredAt: now,
    expiresAt: args.expiresAt,
  });
}

// Helper function to get or create a grouped notification
export async function insertOrUpdateGroupedNotification(
  ctx: any,
  args: {
    userId: any;
    type: any;
    groupKey: string;
    title: string;
    body: string;
    priority?: "critical" | "high" | "medium" | "low";
    category?: "social" | "call" | "payment" | "engagement" | "system";
    icon?: string;
    imageUrl?: string;
    link?: string;
    expiresAt?: number;
  }
) {
  // Check if there's an existing unread notification with the same groupKey
  const existing = await ctx.db
    .query("notifications")
    .withIndex("groupKey", (q: any) => 
      q.eq("userId", args.userId).eq("groupKey", args.groupKey)
    )
    .filter((q: any) => q.eq(q.field("isRead"), false))
    .first();

  if (existing) {
    // Update existing notification
    const newCount = (existing.aggregatedCount || 1) + 1;
    await ctx.db.patch(existing._id, {
      aggregatedCount: newCount,
      body: args.body.replace("{count}", String(newCount)),
      createdAt: Date.now(), // Bump to top
    });
    return existing._id;
  } else {
    // Create new notification
    return await insertNotification(ctx, {
      ...args,
      aggregatedCount: 1,
    });
  }
}

export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: notificationType,
    title: v.string(),
    body: v.string(),
    priority: v.optional(priorityType),
    category: v.optional(categoryType),
    icon: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    actionButtons: v.optional(v.array(
      v.object({
        label: v.string(),
        action: v.string(),
        link: v.optional(v.string()),
      })
    )),
    relatedUserId: v.optional(v.id("users")),
    relatedMatchId: v.optional(v.id("matches")),
    relatedMessageId: v.optional(v.id("messages")),
    relatedPaymentId: v.optional(v.id("payments")),
    link: v.optional(v.string()),
    groupKey: v.optional(v.string()),
    aggregatedCount: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await insertNotification(ctx, args);
  },
});

export const getNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
    category: v.optional(categoryType),
  },
  handler: async (ctx, args) => {
    // Increase maximum limit to 200 to handle more notifications
    const limit = Math.max(1, Math.min(args.limit ?? 50, 200));
    const unreadOnly = args.unreadOnly ?? false;

    // Build the query with proper index usage
    const query = ctx.db
      .query("notifications")
      .withIndex(unreadOnly ? "userRead" : "userId", (q: any) =>
        unreadOnly 
          ? q.eq("userId", args.userId).eq("isRead", false)
          : q.eq("userId", args.userId)
      );

    // Collect all matching notifications for this user
    let rows = await query.collect();
    
    // Filter by category if specified
    if (args.category) {
      rows = rows.filter((n: any) => n.category === args.category);
    }
    
    // Filter out expired notifications
    const now = Date.now();
    rows = rows.filter((n: any) => !n.expiresAt || n.expiresAt > now);
    
    // Sort by priority first (critical > high > medium > low), then by createdAt descending
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    rows.sort((a: any, b: any) => {
      const aPriority = priorityOrder[a.priority || "medium"] ?? 2;
      const bPriority = priorityOrder[b.priority || "medium"] ?? 2;
      
      // Sort by priority first
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Then by creation time (newest first)
      return b.createdAt - a.createdAt;
    });
    
    // Apply limit and return
    return rows.slice(0, limit);
  },
});

export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("userRead", (q: any) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();
    return { count: unread.length };
  },
});

export const getUnreadCountByCategory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("userRead", (q: any) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();
    
    const counts = {
      total: unread.length,
      social: 0,
      call: 0,
      payment: 0,
      engagement: 0,
      system: 0,
    };
    
    for (const n of unread) {
      if (n.category) {
        counts[n.category as keyof typeof counts] = (counts[n.category as keyof typeof counts] || 0) + 1;
      }
    }
    
    return counts;
  },
});

export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notif = await ctx.db.get(args.notificationId);
    if (!notif || notif.userId !== args.userId) {
      return { success: false, message: "Notification not found" };
    }
    if (notif.isRead) return { success: true };
    await ctx.db.patch(args.notificationId, { isRead: true, readAt: Date.now() });
    return { success: true };
  },
});

export const markAllNotificationsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("userRead", (q: any) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();

    const now = Date.now();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true, readAt: now });
    }

    return { markedCount: unread.length };
  },
});

export const markNotificationClicked = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notif = await ctx.db.get(args.notificationId);
    if (!notif || notif.userId !== args.userId) {
      throw new Error("Notification not found");
    }
    await ctx.db.patch(args.notificationId, { 
      clickedAt: Date.now(),
      isRead: true,
      readAt: notif.readAt || Date.now(),
    });
    return { success: true };
  },
});

export const deleteExpiredNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("notifications")
      .withIndex("expiresAt", (q: any) => q.lt("expiresAt", now))
      .take(500);

    for (const n of expired) {
      await ctx.db.delete(n._id);
    }

    if (expired.length === 500) {
      await ctx.scheduler.runAfter(0, "notifications:deleteExpiredNotifications" as any, {});
    }

    return { deletedCount: expired.length };
  },
});

// Paginated notifications query
export const getNotificationsPaginated = query({
  args: {
    userId: v.id("users"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    category: v.optional(categoryTypeWithAll),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 25, 100);
    
    const query = ctx.db
      .query("notifications")
      .withIndex("userCreatedAt", (q: any) => q.eq("userId", args.userId));
    
    const results = await query.collect();
    
    // Filter by category
    let filtered = results;
    if (args.category && args.category !== "all") {
      filtered = filtered.filter((n: any) => n.category === args.category);
    }
    
    // Sort by priority and time
    filtered.sort((a: any, b: any) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.createdAt - a.createdAt;
    });
    
    // Apply pagination
    const startIndex = args.cursor ? parseInt(args.cursor, 10) : 0;
    const endIndex = startIndex + limit;
    const page = filtered.slice(startIndex, endIndex);
    
    const hasMore = endIndex < filtered.length;
    const nextCursor = hasMore ? String(endIndex) : null;
    
    return {
      notifications: page,
      nextCursor,
      hasMore,
      total: filtered.length,
    };
  },
});

// Cleanup old read notifications (to be called by cron)
export const cleanupOldNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    // Delete read notifications older than 30 days
    const oldNotifications = await ctx.db
      .query("notifications")
      .filter((q: any) => q.and(
        q.eq(q.field("isRead"), true),
        q.lt(q.field("createdAt"), thirtyDaysAgo)
      ))
      .take(500);
    
    for (const notif of oldNotifications) {
      await ctx.db.delete(notif._id);
    }

    if (oldNotifications.length === 500) {
      await ctx.scheduler.runAfter(0, "notifications:cleanupOldNotifications" as any, {});
    }
    
    return { deletedCount: oldNotifications.length };
  },
});

/**
 * Notify when trial is ending (2 hours before expiry)
 */
export const notifyTrialEnding = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user?.freeTrialEndsAt) return null;

    const hoursLeft = Math.ceil((user.freeTrialEndsAt - Date.now()) / (60 * 60 * 1000));

    if (hoursLeft <= 2 && hoursLeft > 0) {
      return await insertNotification(ctx, {
        userId: args.userId,
        type: "trial_ending",
        title: `Trial Ending in ${hoursLeft} Hour${hoursLeft > 1 ? 's' : ''}! ⏰`,
        body: "Upgrade now to keep unlimited access to all profiles!",
        priority: "high",
        category: "system",
        icon: "⚠️",
        link: "/upgrade",
        actionButtons: [
          { label: "Upgrade Now", action: "navigate", link: "/upgrade" },
        ],
      });
    }
    
    return null;
  },
});

/**
 * Notify when unlock limit reached
 */
export const notifyUnlockLimitReached = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await insertNotification(ctx, {
      userId: args.userId,
      type: "unlock_limit",
      title: "Free Unlocks Used Up! 🔒",
      body: "You've used all 5 free profile unlocks. Upgrade for unlimited access!",
      priority: "high",
      category: "system",
      icon: "🔓",
      link: "/upgrade",
      actionButtons: [
        { label: "See Plans", action: "navigate", link: "/upgrade" },
        { label: "Unlock One (KES 10)", action: "custom", link: "/discover" },
      ],
    });
  },
});
