import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Track notification events
export const trackNotificationEvent = mutation({
  args: {
    userId: v.id("users"),
    notificationId: v.id("notifications"),
    eventType: v.union(
      v.literal("delivered"),
      v.literal("viewed"),
      v.literal("clicked"),
      v.literal("dismissed")
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    await ctx.db.insert("activityLog", {
      userId: args.userId,
      activityType: `notification_${args.eventType}`,
      metadata: {
        notificationId: args.notificationId,
        ...args.metadata,
      },
      timestamp: now,
    });
    
    return { success: true };
  },
});

// Get notification performance metrics
export const getNotificationMetrics = query({
  args: {
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startDate = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
    const endDate = args.endDate || Date.now();
    
    // Query notifications in date range
    let notifications;
    
    if (args.userId) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("userCreatedAt", (q: any) => 
          q.eq("userId", args.userId)
        )
        .collect();
    } else {
      notifications = await ctx.db.query("notifications").collect();
    }
    
    const filtered = notifications.filter((n: any) => 
      n.createdAt >= startDate && n.createdAt <= endDate
    );
    
    // Calculate metrics
    const total = filtered.length;
    const delivered = filtered.filter((n: any) => n.deliveredAt).length;
    const read = filtered.filter((n: any) => n.isRead).length;
    const clicked = filtered.filter((n: any) => n.clickedAt).length;
    
    const byType = filtered.reduce((acc: any, n: any) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {});
    
    const byPriority = filtered.reduce((acc: any, n: any) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {});
    
    const byCategory = filtered.reduce((acc: any, n: any) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      delivered,
      read,
      clicked,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      readRate: delivered > 0 ? (read / delivered) * 100 : 0,
      clickRate: read > 0 ? (clicked / read) * 100 : 0,
      byType,
      byPriority,
      byCategory,
    };
  },
});

// Log user activity
export const logActivity = mutation({
  args: {
    userId: v.id("users"),
    activityType: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    await ctx.db.insert("activityLog", {
      userId: args.userId,
      activityType: args.activityType,
      metadata: args.metadata,
      timestamp,
    });

    // Update last active timestamp on profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastActiveAt: timestamp,
      });
    }

    return { success: true, timestamp };
  },
});

// Get profile stats for dashboard
export const getProfileStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get profile views (today and this week)
    const allViews = await ctx.db
      .query("activityLog")
      .withIndex("userTimestamp", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("activityType"), "profile_viewed"))
      .collect();

    const viewsToday = allViews.filter((v) => v.timestamp >= oneDayAgo).length;
    const viewsWeek = allViews.filter((v) => v.timestamp >= oneWeekAgo).length;

    // Get likes received
    const likesReceived = await ctx.db
      .query("likes")
      .withIndex("likedUserId", (q) => q.eq("likedUserId", args.userId))
      .collect();

    const likesReceivedToday = likesReceived.filter(
      (l) => l.createdAt >= oneDayAgo
    ).length;

    // Get matches this week
    const matches = await ctx.db
      .query("matches")
      .withIndex("user1Id", (q) => q.eq("user1Id", args.userId))
      .collect();

    const matchesUser2 = await ctx.db
      .query("matches")
      .withIndex("user2Id", (q) => q.eq("user2Id", args.userId))
      .collect();

    const allMatches = [...matches, ...matchesUser2];
    const matchesThisWeek = allMatches.filter(
      (m) => m.matchedAt >= oneWeekAgo
    ).length;

    // Get response rate (messages sent vs received in last 10 conversations)
    const messagesSent = await ctx.db
      .query("messages")
      .withIndex("senderId", (q) => q.eq("senderId", args.userId))
      .collect();

    const messagesReceived = await ctx.db
      .query("messages")
      .withIndex("receiverId", (q) => q.eq("receiverId", args.userId))
      .collect();

    const recentSent = messagesSent.filter((m) => m.createdAt >= oneWeekAgo);
    const recentReceived = messagesReceived.filter(
      (m) => m.createdAt >= oneWeekAgo
    );

    const responseRate =
      recentReceived.length > 0
        ? Math.round((recentSent.length / recentReceived.length) * 100)
        : 100;

    // Get profile completeness
    const profile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    return {
      viewsToday,
      viewsWeek,
      likesReceivedToday,
      likesReceivedTotal: likesReceived.length,
      matchesThisWeek,
      matchesTotal: allMatches.length,
      responseRate: Math.min(responseRate, 100),
      profileCompleteness: profile?.completeness || 0,
    };
  },
});

// Get activity feed for dashboard
export const getActivityFeed = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Get recent matches
    const matches = await ctx.db
      .query("matches")
      .withIndex("user1Id", (q) => q.eq("user1Id", args.userId))
      .order("desc")
      .take(5);

    const matchesUser2 = await ctx.db
      .query("matches")
      .withIndex("user2Id", (q) => q.eq("user2Id", args.userId))
      .order("desc")
      .take(5);

    const allMatches = [...matches, ...matchesUser2]
      .sort((a, b) => b.matchedAt - a.matchedAt)
      .slice(0, 3);

    // Get new likes count
    const newLikes = await ctx.db
      .query("likes")
      .withIndex("likedUserId", (q) => q.eq("likedUserId", args.userId))
      .filter((q) => q.gt(q.field("createdAt"), oneDayAgo))
      .collect();

    // Get boost results if any
    const activeBoost = await ctx.db
      .query("boosts")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "expired"))
      .order("desc")
      .first();

    const feed = [];

    // Add matches to feed
    for (const match of allMatches) {
      const otherUserId =
        match.user1Id === args.userId ? match.user2Id : match.user1Id;
      const otherUser = await ctx.db.get(otherUserId);
      
      feed.push({
        type: "match",
        message: `${otherUser?.name} liked you back! 💚`,
        timestamp: match.matchedAt,
        userId: otherUserId,
      });
    }

    // Add new likes
    if (newLikes.length > 0) {
      feed.push({
        type: "likes",
        message: `You have ${newLikes.length} new ${
          newLikes.length === 1 ? "like" : "likes"
        }`,
        timestamp: newLikes[0].createdAt,
      });
    }

    // Add boost results
    if (activeBoost && activeBoost.impressions > 0) {
      feed.push({
        type: "boost",
        message: `Your boost got ${activeBoost.impressions} views!`,
        timestamp: activeBoost.expiresAt,
      });
    }

    // Sort by timestamp
    feed.sort((a, b) => b.timestamp - a.timestamp);

    return feed.slice(0, limit);
  },
});

// Get profile strength meter data
export const getProfileStrength = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      return {
        score: 0,
        breakdown: {},
        tips: ["Create your profile to get started"],
      };
    }

    const breakdown: Record<string, boolean> = {
      hasPhotos: false,
      hasBio: false,
      hasJobEducation: false,
      hasInterests: false,
      hasPrompts: false,
      isVerified: false,
    };

    const tips: string[] = [];

    // Check photos (25%)
    const photos = await ctx.db
      .query("photos")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    breakdown.hasPhotos = photos.length >= 4;
    if (!breakdown.hasPhotos) {
      tips.push(`Add ${4 - photos.length} more photo${4 - photos.length > 1 ? 's' : ''}`);
    }

    // Check bio (15%)
    breakdown.hasBio = (profile.bio?.length || 0) >= 50;
    if (!breakdown.hasBio) {
      tips.push("Write a longer bio (at least 50 characters)");
    }

    // Check job/education (15%)
    breakdown.hasJobEducation = !!(profile.jobTitle || profile.education);
    if (!breakdown.hasJobEducation) {
      tips.push("Add your job title or education");
    }

    // Check interests (15%)
    const interests = await ctx.db
      .query("interests")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    breakdown.hasInterests = interests.length >= 5;
    if (!breakdown.hasInterests) {
      tips.push(`Select ${5 - interests.length} more interest${5 - interests.length > 1 ? 's' : ''}`);
    }

    // Check prompts (15%)
    const prompts = await ctx.db
      .query("promptAnswers")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    breakdown.hasPrompts = prompts.length >= 3;
    if (!breakdown.hasPrompts) {
      tips.push(`Answer ${3 - prompts.length} more prompt${3 - prompts.length > 1 ? 's' : ''}`);
    }

    // Check verification (15%)
    const verification = await ctx.db
      .query("verifications")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .first();
    breakdown.isVerified = !!verification;
    if (!breakdown.isVerified) {
      tips.push("Verify your profile with a selfie");
    }

    // Calculate score
    const weights = {
      hasPhotos: 25,
      hasBio: 15,
      hasJobEducation: 15,
      hasInterests: 15,
      hasPrompts: 15,
      isVerified: 15,
    };

    let score = 0;
    for (const [key, value] of Object.entries(breakdown)) {
      if (value) {
        score += weights[key as keyof typeof weights];
      }
    }

    return {
      score,
      breakdown,
      tips: tips.slice(0, 3), // Show top 3 tips
    };
  },
});

// Phase 4: Photo performance tracking
export const recordPhotoImpression = mutation({
  args: {
    photoId: v.id("photos"),
    ownerUserId: v.id("users"),
    action: v.optional(v.union(v.literal("impression"), v.literal("like"), v.literal("pass"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("photoAnalytics")
      .withIndex("photoId", (q) => q.eq("photoId", args.photoId))
      .first();

    const action = args.action ?? "impression";

    const inc = {
      impressions: action === "impression" ? 1 : 0,
      likes: action === "like" ? 1 : 0,
      passes: action === "pass" ? 1 : 0,
    };

    if (!existing) {
      const impressions = inc.impressions;
      const likes = inc.likes;
      const passes = inc.passes;
      const likeRate = impressions > 0 ? likes / impressions : 0;
      await ctx.db.insert("photoAnalytics", {
        photoId: args.photoId,
        userId: args.ownerUserId,
        impressions,
        likes,
        passes,
        likeRate,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }

    const impressions = existing.impressions + inc.impressions;
    const likes = existing.likes + inc.likes;
    const passes = existing.passes + inc.passes;
    const likeRate = impressions > 0 ? likes / impressions : 0;

    await ctx.db.patch(existing._id, {
      impressions,
      likes,
      passes,
      likeRate,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const getPhotoAnalyticsForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    const analytics = await ctx.db
      .query("photoAnalytics")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    const byPhotoId = new Map(analytics.map((a) => [a.photoId, a]));

    return photos
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        photo: p,
        analytics: byPhotoId.get(p._id) || {
          impressions: 0,
          likes: 0,
          passes: 0,
          likeRate: 0,
        },
      }));
  },
});
