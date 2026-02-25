import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Activity Tracking System
 * Tracks user activity, response rates, and generates activity badges
 */

// Update user's last active timestamp
export const updateLastActive = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    // Update user's lastActive timestamp
    await ctx.db.patch(args.userId, {
      lastActive: Date.now(),
    });

    // Update or create activity stats
    const stats = await ctx.db
      .query("activityStats")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();
    const today = new Date(now).toDateString();

    if (stats) {
      const lastActiveDate = new Date(stats.lastActiveAt).toDateString();
      
      // If it's a new day, increment daily active count
      if (lastActiveDate !== today) {
        await ctx.db.patch(stats._id, {
          lastActiveAt: now,
          totalActiveDays: stats.totalActiveDays + 1,
        });
      } else {
        await ctx.db.patch(stats._id, {
          lastActiveAt: now,
        });
      }
    } else {
      // Create new activity stats
      await ctx.db.insert("activityStats", {
        userId: args.userId,
        lastActiveAt: now,
        totalActiveDays: 1,
        totalMessagesReceived: 0,
        totalMessagesResponded: 0,
        averageResponseTimeMinutes: 0,
      });
    }
  },
});

// Track message response for response rate calculation
export const trackMessageResponse = mutation({
  args: {
    userId: v.id("users"),
    wasResponded: v.boolean(),
    responseTimeMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("activityStats")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!stats) {
      // Create new stats if doesn't exist
      await ctx.db.insert("activityStats", {
        userId: args.userId,
        lastActiveAt: Date.now(),
        totalActiveDays: 1,
        totalMessagesReceived: 1,
        totalMessagesResponded: args.wasResponded ? 1 : 0,
        averageResponseTimeMinutes: args.responseTimeMinutes || 0,
      });
      return;
    }

    const newTotalReceived = stats.totalMessagesReceived + 1;
    const newTotalResponded = stats.totalMessagesResponded + (args.wasResponded ? 1 : 0);

    // Calculate new average response time
    let newAverageResponseTime = stats.averageResponseTimeMinutes;
    if (args.wasResponded && args.responseTimeMinutes !== undefined) {
      const totalResponseTime = stats.averageResponseTimeMinutes * stats.totalMessagesResponded;
      newAverageResponseTime = (totalResponseTime + args.responseTimeMinutes) / newTotalResponded;
    }

    await ctx.db.patch(stats._id, {
      totalMessagesReceived: newTotalReceived,
      totalMessagesResponded: newTotalResponded,
      averageResponseTimeMinutes: newAverageResponseTime,
    });
  },
});

// Get activity badge for a user
export const getActivityBadge = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const stats = await ctx.db
      .query("activityStats")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();
    const lastActive = user.lastActive || 0;
    const minutesSinceActive = (now - lastActive) / (1000 * 60);
    const hoursSinceActive = minutesSinceActive / 60;

    let activityStatus: "active_now" | "active_today" | "active_week" | "inactive" | null = null;
    let activityLabel = "";
    let activityColor = "";

    // Determine activity status
    if (minutesSinceActive < 5) {
      activityStatus = "active_now";
      activityLabel = "Active now";
      activityColor = "bg-green-500";
    } else if (hoursSinceActive < 24) {
      activityStatus = "active_today";
      activityLabel = "Active today";
      activityColor = "bg-blue-500";
    } else if (hoursSinceActive < 168) { // 7 days
      activityStatus = "active_week";
      activityLabel = "Active this week";
      activityColor = "bg-gray-500";
    } else {
      activityStatus = "inactive";
      activityLabel = "";
      activityColor = "";
    }

    // Calculate response rate
    let responseRate = 0;
    let responseLabel = "";
    let respondsQuickly = false;

    if (stats && stats.totalMessagesReceived > 0) {
      responseRate = Math.round((stats.totalMessagesResponded / stats.totalMessagesReceived) * 100);
      
      if (responseRate >= 80) {
        responseLabel = "Replies often";
      } else if (responseRate >= 50) {
        responseLabel = "Sometimes replies";
      }

      // Check if responds quickly (average < 60 minutes)
      if (stats.averageResponseTimeMinutes < 60 && stats.totalMessagesResponded >= 5) {
        respondsQuickly = true;
      }
    }

    return {
      activityStatus,
      activityLabel,
      activityColor,
      responseRate,
      responseLabel,
      respondsQuickly,
      averageResponseTimeMinutes: stats?.averageResponseTimeMinutes || 0,
      lastActiveAt: lastActive,
      minutesSinceActive: Math.round(minutesSinceActive),
      hoursSinceActive: Math.round(hoursSinceActive),
    };
  },
});

// Get multiple users' activity badges (for discovery/matches)
export const getBatchActivityBadges = query({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const badges: Record<string, any> = {};

    for (const userId of args.userIds) {
      // Inline the activity badge logic instead of calling the query
      const user = await ctx.db.get(userId);
      if (!user) continue;

      const stats = await ctx.db
        .query("activityStats")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .first();

      const now = Date.now();
      const lastActive = user.lastActive || 0;
      const minutesSinceActive = (now - lastActive) / (1000 * 60);
      const hoursSinceActive = minutesSinceActive / 60;

      let activityStatus: "active_now" | "active_today" | "active_week" | "inactive" | null = null;
      let activityLabel = "";
      let activityColor = "";

      if (minutesSinceActive < 5) {
        activityStatus = "active_now";
        activityLabel = "Active now";
        activityColor = "bg-green-500";
      } else if (hoursSinceActive < 24) {
        activityStatus = "active_today";
        activityLabel = "Active today";
        activityColor = "bg-blue-500";
      } else if (hoursSinceActive < 168) {
        activityStatus = "active_week";
        activityLabel = "Active this week";
        activityColor = "bg-gray-500";
      } else {
        activityStatus = "inactive";
        activityLabel = "";
        activityColor = "";
      }

      let responseRate = 0;
      let responseLabel = "";
      let respondsQuickly = false;

      if (stats && stats.totalMessagesReceived > 0) {
        responseRate = Math.round((stats.totalMessagesResponded / stats.totalMessagesReceived) * 100);
        
        if (responseRate >= 80) {
          responseLabel = "Replies often";
        } else if (responseRate >= 50) {
          responseLabel = "Sometimes replies";
        }

        if (stats.averageResponseTimeMinutes < 60 && stats.totalMessagesResponded >= 5) {
          respondsQuickly = true;
        }
      }

      badges[userId] = {
        activityStatus,
        activityLabel,
        activityColor,
        responseRate,
        responseLabel,
        respondsQuickly,
        averageResponseTimeMinutes: stats?.averageResponseTimeMinutes || 0,
        lastActiveAt: lastActive,
        minutesSinceActive: Math.round(minutesSinceActive),
        hoursSinceActive: Math.round(hoursSinceActive),
      };
    }

    return badges;
  },
});

// Track profile view
export const trackProfileView = mutation({
  args: {
    viewerUserId: v.id("users"),
    viewedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Don't track if viewing own profile
    if (args.viewerUserId === args.viewedUserId) return;

    const now = Date.now();
    const today = new Date(now).toDateString();

    // Check if already viewed today
    const todayStart = new Date(today).getTime();
    const existingView = await ctx.db
      .query("profileViews")
      .withIndex("viewedUser_viewer", (q) => 
        q.eq("viewedUserId", args.viewedUserId).eq("viewerUserId", args.viewerUserId)
      )
      .filter((q) => q.gte(q.field("viewedAt"), todayStart))
      .first();

    if (existingView) {
      // Update view count
      await ctx.db.patch(existingView._id, {
        viewCount: existingView.viewCount + 1,
        viewedAt: now,
      });
    } else {
      // Create new view record
      await ctx.db.insert("profileViews", {
        viewerUserId: args.viewerUserId,
        viewedUserId: args.viewedUserId,
        viewedAt: now,
        viewCount: 1,
      });
      // Also track in dailyUsage for restricted-user quota enforcement
      const d = new Date(now);
      const dayKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const usage = await ctx.db
        .query("dailyUsage")
        .withIndex("userDay", (q) => q.eq("userId", args.viewerUserId).eq("dayKey", dayKey))
        .first();
      if (usage) {
        await ctx.db.patch(usage._id, { profileViews: (usage.profileViews ?? 0) + 1, updatedAt: now });
      } else {
        await ctx.db.insert("dailyUsage", {
          userId: args.viewerUserId,
          dayKey,
          likes: 0,
          superLikes: 0,
          profileViews: 1,
          updatedAt: now,
        });
      }
    }
  },
});

// Get profile view stats
export const getProfileViewStats = query({
  args: {
    userId: v.id("users"),
    timeframe: v.optional(v.union(v.literal("today"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeframe = args.timeframe || "week";
    
    let startTime: number;
    if (timeframe === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startTime = today.getTime();
    } else if (timeframe === "week") {
      startTime = now - 7 * 24 * 60 * 60 * 1000;
    } else {
      startTime = now - 30 * 24 * 60 * 60 * 1000;
    }

    const views = await ctx.db
      .query("profileViews")
      .withIndex("viewedUser_time", (q) => 
        q.eq("viewedUserId", args.userId).gt("viewedAt", startTime)
      )
      .collect();

    const totalViews = views.reduce((sum, view) => sum + view.viewCount, 0);
    const uniqueViewers = new Set(views.map(v => v.viewerUserId)).size;

    // Get today's views
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    
    const todayViews = views.filter(v => v.viewedAt >= todayStart);
    const todayTotal = todayViews.reduce((sum, view) => sum + view.viewCount, 0);

    return {
      totalViews,
      uniqueViewers,
      todayViews: todayTotal,
      timeframe,
      recentViewers: views.slice(-5).reverse(), // Last 5 viewers
    };
  },
});

// Internal mutation to track message sent (for response time calculation)
export const trackMessageSent = internalMutation({
  args: {
    matchId: v.id("matches"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Store pending message for response time tracking
    await ctx.db.insert("pendingResponses", {
      matchId: args.matchId,
      senderId: args.senderId,
      receiverId: args.receiverId,
      sentAt: Date.now(),
      responded: false,
    });
  },
});

// Internal mutation to mark message as responded
export const markMessageResponded = internalMutation({
  args: {
    matchId: v.id("matches"),
    responderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find pending responses for this user
    const pendingResponses = await ctx.db
      .query("pendingResponses")
      .withIndex("matchId_receiver", (q) => 
        q.eq("matchId", args.matchId).eq("receiverId", args.responderId)
      )
      .filter((q) => q.eq(q.field("responded"), false))
      .collect();

    const now = Date.now();

    for (const pending of pendingResponses) {
      const responseTimeMinutes = (now - pending.sentAt) / (1000 * 60);
      
      // Mark as responded
      await ctx.db.patch(pending._id, {
        responded: true,
        respondedAt: now,
      });

      // Update activity stats inline
      const stats = await ctx.db
        .query("activityStats")
        .withIndex("userId", (q) => q.eq("userId", args.responderId))
        .first();

      if (!stats) {
        await ctx.db.insert("activityStats", {
          userId: args.responderId,
          lastActiveAt: now,
          totalActiveDays: 1,
          totalMessagesReceived: 1,
          totalMessagesResponded: 1,
          averageResponseTimeMinutes: responseTimeMinutes,
        });
      } else {
        const newTotalReceived = stats.totalMessagesReceived + 1;
        const newTotalResponded = stats.totalMessagesResponded + 1;
        const totalResponseTime = stats.averageResponseTimeMinutes * stats.totalMessagesResponded;
        const newAverageResponseTime = (totalResponseTime + responseTimeMinutes) / newTotalResponded;

        await ctx.db.patch(stats._id, {
          totalMessagesReceived: newTotalReceived,
          totalMessagesResponded: newTotalResponded,
          averageResponseTimeMinutes: newAverageResponseTime,
        });
      }
    }
  },
});
