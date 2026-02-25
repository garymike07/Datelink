import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Request account deletion with 30-day grace period
 */
export const requestAccountDeletion = mutation({
  args: {
    reason: v.optional(v.string()),
    feedback: v.optional(v.string()),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email!))
          .first()
      : args.token
        ? await (async () => {
            const session = await ctx.db
              .query("sessions")
              .withIndex("token", (q) => q.eq("token", args.token!))
              .first();
            if (!session) return null;
            if (session.expiresAt < Date.now()) return null;
            return await ctx.db.get(session.userId);
          })()
        : null;

    if (!user) throw new Error("Not authenticated");

    const now = Date.now();
    const gracePeriod = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Check if there's already a pending deletion
    const existingDeletion = await ctx.db
      .query("accountDeletions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingDeletion) {
      return {
        message: "Account deletion already pending",
        cancelBy: existingDeletion.scheduledFor,
        deletionId: existingDeletion._id,
      };
    }

    // Create deletion request
    const deletionId = await ctx.db.insert("accountDeletions", {
      userId: user._id,
      requestedAt: now,
      scheduledFor: now + gracePeriod,
      reason: args.reason,
      feedback: args.feedback,
      status: "pending",
    });

    // Deactivate account immediately
    await ctx.db.patch(user._id, {
      accountStatus: "deactivated",
      deactivatedAt: now,
    });

    // Hide profile from discovery
    const profile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastActiveAt: 0, // Set to 0 to hide from discovery
      });
    }

    // Send notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "account_warning",
      title: "Account Deletion Scheduled",
      body: `Your account will be permanently deleted in 30 days. You can cancel this anytime before ${new Date(now + gracePeriod).toLocaleDateString()}.`,
      isRead: false,
      createdAt: now,
    });

    return {
      message: "Account scheduled for deletion in 30 days",
      cancelBy: now + gracePeriod,
      deletionId,
    };
  },
});

/**
 * Cancel pending account deletion
 */
export const cancelAccountDeletion = mutation({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email!))
          .first()
      : args.token
        ? await (async () => {
            const session = await ctx.db
              .query("sessions")
              .withIndex("token", (q) => q.eq("token", args.token!))
              .first();
            if (!session) return null;
            if (session.expiresAt < Date.now()) return null;
            return await ctx.db.get(session.userId);
          })()
        : null;

    if (!user) throw new Error("Not authenticated");

    const deletion = await ctx.db
      .query("accountDeletions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (!deletion) throw new Error("No pending deletion found");

    // Cancel the deletion
    await ctx.db.patch(deletion._id, { status: "cancelled" });

    // Reactivate account
    await ctx.db.patch(user._id, {
      accountStatus: "active",
      deactivatedAt: undefined,
    });

    // Restore profile visibility
    const profile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastActiveAt: Date.now(), // Restore visibility
      });
    }

    // Send notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "profile_created",
      title: "Account Deletion Cancelled",
      body: "Your account deletion has been cancelled. Welcome back!",
      isRead: false,
      createdAt: Date.now(),
    });

    return { message: "Account deletion cancelled successfully" };
  },
});

/**
 * Get pending deletion status for current user
 */
export const getDeletionStatus = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email!))
          .first()
      : args.token
        ? await (async () => {
            const session = await ctx.db
              .query("sessions")
              .withIndex("token", (q) => q.eq("token", args.token!))
              .first();
            if (!session) return null;
            if (session.expiresAt < Date.now()) return null;
            return await ctx.db.get(session.userId);
          })()
        : null;

    if (!user) return null;

    const deletion = await ctx.db
      .query("accountDeletions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    return deletion;
  },
});

/**
 * Deactivate account (pause without deletion)
 */
export const deactivateAccount = mutation({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email!))
          .first()
      : args.token
        ? await (async () => {
            const session = await ctx.db
              .query("sessions")
              .withIndex("token", (q) => q.eq("token", args.token!))
              .first();
            if (!session) return null;
            if (session.expiresAt < Date.now()) return null;
            return await ctx.db.get(session.userId);
          })()
        : null;

    if (!user) throw new Error("Not authenticated");

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      accountStatus: "deactivated",
      deactivatedAt: Date.now(),
    });

    // Hide profile from discovery
    const profile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastActiveAt: 0, // Set to 0 to hide from discovery
      });
    }

    return { message: "Account deactivated successfully" };
  },
});

/**
 * Reactivate account
 */
export const reactivateAccount = mutation({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email!))
          .first()
      : args.token
        ? await (async () => {
            const session = await ctx.db
              .query("sessions")
              .withIndex("token", (q) => q.eq("token", args.token!))
              .first();
            if (!session) return null;
            if (session.expiresAt < Date.now()) return null;
            return await ctx.db.get(session.userId);
          })()
        : null;

    if (!user) throw new Error("Not authenticated");

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      accountStatus: "active",
      deactivatedAt: undefined,
    });

    // Restore profile visibility
    const profile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastActiveAt: Date.now(), // Restore visibility
      });
    }

    return { message: "Account reactivated successfully" };
  },
});

/**
 * Internal: Execute account deletion (called by cron job)
 */
export const executeAccountDeletion = internalMutation({
  args: { deletionId: v.id("accountDeletions") },
  handler: async (ctx, args) => {
    const deletion = await ctx.db.get(args.deletionId);
    if (!deletion || deletion.status !== "pending") return;
    if (deletion.scheduledFor > Date.now()) return; // Not yet time

    const userId = deletion.userId;

    // Delete all user-related data
    try {
      // Delete photos
      const photos = await ctx.db
        .query("photos")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const photo of photos) {
        await ctx.db.delete(photo._id);
      }

      // Delete photo analytics
      const photoAnalytics = await ctx.db
        .query("photoAnalytics")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const analytics of photoAnalytics) {
        await ctx.db.delete(analytics._id);
      }

      // Delete profile
      const profile = await ctx.db
        .query("profiles")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .first();
      if (profile) await ctx.db.delete(profile._id);

      // Delete messages (both sent and received)
      const messages = await ctx.db
        .query("messages")
        .collect();
      for (const message of messages) {
        if (message.senderId === userId || message.receiverId === userId) {
          await ctx.db.delete(message._id);
        }
      }

      // Delete matches
      const matches = await ctx.db
        .query("matches")
        .collect();
      for (const match of matches) {
        if (match.user1Id === userId || match.user2Id === userId) {
          await ctx.db.delete(match._id);
        }
      }

      // Delete likes (both given and received)
      const likes = await ctx.db
        .query("likes")
        .collect();
      for (const like of likes) {
        if (like.userId === userId || like.likedUserId === userId) {
          await ctx.db.delete(like._id);
        }
      }

      // Delete notifications
      const notifications = await ctx.db
        .query("notifications")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const notification of notifications) {
        await ctx.db.delete(notification._id);
      }

      // Delete settings
      const settings = await ctx.db
        .query("userSettings")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .first();
      if (settings) await ctx.db.delete(settings._id);

      // Delete subscriptions
      const subscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const subscription of subscriptions) {
        await ctx.db.delete(subscription._id);
      }

      // Delete payments
      const payments = await ctx.db
        .query("payments")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const payment of payments) {
        await ctx.db.delete(payment._id);
      }

      // Delete daily usage
      const dailyUsage = await ctx.db
        .query("dailyUsage")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const usage of dailyUsage) {
        await ctx.db.delete(usage._id);
      }

      // Delete sessions
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const session of sessions) {
        await ctx.db.delete(session._id);
      }

      // Delete push subscriptions
      const pushSubs = await ctx.db
        .query("pushSubscriptions")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const sub of pushSubs) {
        await ctx.db.delete(sub._id);
      }

      // Delete activity log
      const activityLogs = await ctx.db
        .query("activityLog")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const log of activityLogs) {
        await ctx.db.delete(log._id);
      }

      // Delete user progress (gamification)
      const userProgress = await ctx.db
        .query("userProgress")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .first();
      if (userProgress) await ctx.db.delete(userProgress._id);

      // Delete quests
      const quests = await ctx.db
        .query("quests")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const quest of quests) {
        await ctx.db.delete(quest._id);
      }

      // Delete data exports
      const dataExports = await ctx.db
        .query("dataExports")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();
      for (const dataExport of dataExports) {
        await ctx.db.delete(dataExport._id);
      }


      // Finally delete user account
      await ctx.db.delete(userId);

      // Mark deletion as complete
      await ctx.db.patch(args.deletionId, {
        status: "completed",
        completedAt: Date.now(),
      });

      console.log(`Successfully deleted account for user ${userId}`);
    } catch (error) {
      console.error(`Error deleting account for user ${userId}:`, error);
      throw error;
    }
  },
});

/**
 * Internal: Process all scheduled deletions (called by cron)
 */
export const processScheduledDeletions = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const pendingDeletions = await ctx.db
      .query("accountDeletions")
      .withIndex("status", (q) => q.eq("status", "pending"))
      .collect();

    const readyForDeletion = pendingDeletions.filter(
      (d) => d.scheduledFor <= now
    );

    for (const deletion of readyForDeletion) {
      try {
        await ctx.scheduler.runAfter(0, internal.accountManagement.executeAccountDeletion, { deletionId: deletion._id });
      } catch (error) {
        console.error(`Failed to execute deletion ${deletion._id}:`, error);
      }
    }

    return { processed: readyForDeletion.length };
  },
});
