import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Request data export for GDPR compliance
 */
export const requestDataExport = mutation({
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

    // Check if there's already a recent export
    const recentExport = await ctx.db
      .query("dataExports")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    if (
      recentExport &&
      recentExport.status === "processing" &&
      Date.now() - recentExport.requestedAt < 5 * 60 * 1000 // 5 minutes
    ) {
      return {
        message: "Export already in progress",
        exportId: recentExport._id,
      };
    }

    // Collect all user data
    const profile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();

    const photos = await ctx.db
      .query("photos")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const matches = await ctx.db
      .query("matches")
      .collect();
    const userMatches = matches.filter(
      (m) => m.user1Id === user._id || m.user2Id === user._id
    );

    const messages = await ctx.db
      .query("messages")
      .collect();
    const userMessages = messages.filter(
      (m) => m.senderId === user._id || m.receiverId === user._id
    );

    const likes = await ctx.db
      .query("likes")
      .collect();
    const sentLikes = likes.filter((l) => l.userId === user._id);
    const receivedLikes = likes.filter((l) => l.likedUserId === user._id);

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const payments = await ctx.db
      .query("payments")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const activityLog = await ctx.db
      .query("activityLog")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const userProgress = await ctx.db
      .query("userProgress")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();

    const calls = await ctx.db
      .query("calls")
      .collect();
    const userCalls = calls.filter(
      (c) => c.callerId === user._id || c.receiverId === user._id
    );

    const quests = await ctx.db
      .query("quests")
      .withIndex("userId", (q) => q.eq("userId", user._id)).collect();
    // Create sanitized export data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportFormat: "JSON",
      privacyNotice:
        "This export contains all personal data we have collected about you.",

      account: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        verificationStatus: user.verificationStatus,
        accountStatus: user.accountStatus || "active",
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: new Date(user.updatedAt).toISOString(),
        lastSeenAt: user.lastSeenAt
          ? new Date(user.lastSeenAt).toISOString()
          : null,
      },

      profile: profile
        ? {
            age: profile.age,
            gender: profile.gender,
            bio: profile.bio,
            location: profile.location,
            height: profile.height,
            education: profile.education,
            jobTitle: profile.jobTitle,
            company: profile.company,
            relationshipGoal: profile.relationshipGoal,
            religion: profile.religion,
            drinking: profile.drinking,
            smoking: profile.smoking,
            exercise: profile.exercise,
            diet: profile.diet,
            hasKids: profile.hasKids,
            wantsKids: profile.wantsKids,
            languages: profile.languages,
            pets: profile.pets,
            createdAt: new Date(profile.createdAt).toISOString(),
            updatedAt: new Date(profile.updatedAt).toISOString(),
          }
        : null,

      photos: photos.map((p) => ({
        url: p.url,
        order: p.order,
        isPrimary: p.isPrimary,
        uploadedAt: new Date(p.createdAt).toISOString(),
      })),

      statistics: {
        totalMatches: userMatches.length,
        totalMessages: userMessages.length,
        likesSent: sentLikes.length,
        likesReceived: receivedLikes.length,
        totalCalls: userCalls.length,
      },

      matches: userMatches.map((m) => ({
        matchedAt: new Date(m.matchedAt).toISOString(),
        lastMessageAt: m.lastMessageAt ? new Date(m.lastMessageAt).toISOString() : null,
      })),

      messages: userMessages.map((m) => ({
        type: m.type || "text",
        sentAt: new Date(m.createdAt).toISOString(),
        wasIamSender: m.senderId === user._id,
        body: m.body,
        isRead: m.isRead,
      })),

      likes: {
        sent: sentLikes.map((l) => ({
          likedAt: new Date(l.createdAt).toISOString(),
        })),
        received: receivedLikes.map((l) => ({
          receivedAt: new Date(l.createdAt).toISOString(),
        })),
      },

      settings: settings
        ? {
            showOnlineStatus: settings.showOnlineStatus,
            readReceipts: settings.readReceipts,
            emailNotifications: settings.emailNotifications,
            matchNotifications: settings.matchNotifications,
            messageNotifications: settings.messageNotifications,
          }
        : null,

      subscriptions: subscriptions.map((s) => ({
        plan: s.plan,
        status: s.status,
        amount: s.amount,
        currency: s.currency,
        billingCycle: s.billingCycle,
        startedAt: new Date(s.startedAt).toISOString(),
        endsAt: s.endsAt ? new Date(s.endsAt).toISOString() : null,
      })),

      payments: payments.map((p) => ({
        amount: p.amount,
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        status: p.status,
        productType: p.productType,
        createdAt: new Date(p.createdAt).toISOString(),
        completedAt: p.completedAt
          ? new Date(p.completedAt).toISOString()
          : null,
      })),

      notifications: notifications.map((n) => ({
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        createdAt: new Date(n.createdAt).toISOString(),
      })),

      activityLog: activityLog.map((a) => ({
        activityType: a.activityType,
        timestamp: new Date(a.timestamp).toISOString(),
      })),

      gamification: userProgress
        ? {
            level: userProgress.level,
            xp: userProgress.xp,
            badges: userProgress.badges,
          }
        : null,

      quests: quests.map((q) => ({
        questType: q.questType,
        progress: q.progress,
        target: q.target,
        completedAt: q.completedAt
          ? new Date(q.completedAt).toISOString()
          : null,
      })),
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    const fileSize = new Blob([jsonString]).size;

    // Create export record
    const exportId = await ctx.db.insert("dataExports", {
      userId: user._id,
      status: "completed",
      fileUrl: `data:application/json;base64,${Buffer.from(jsonString).toString("base64")}`,
      fileSize,
      requestedAt: Date.now(),
      completedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "profile_created",
      title: "Data Export Ready",
      body:
        "Your personal data export is ready for download. It will be available for 7 days.",
      isRead: false,
      createdAt: Date.now(),
    });

    return {
      exportId,
      message: "Data export completed",
      fileSize,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
  },
});

/**
 * Get data export status and download URL
 */
export const getDataExport = query({
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

    const dataExport = await ctx.db
      .query("dataExports")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    if (!dataExport) return null;

    // Check if export has expired (note: cannot patch in query, just return status)
    if (
      dataExport.expiresAt &&
      dataExport.expiresAt < Date.now() &&
      dataExport.status !== "expired"
    ) {
      return { ...dataExport, status: "expired" as const };
    }

    return dataExport;
  },
});

/**
 * Mark export as downloaded
 */
export const markExportDownloaded = mutation({
  args: { exportId: v.id("dataExports"), token: v.optional(v.string()) },
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

    const dataExport = await ctx.db.get(args.exportId);
    if (!dataExport) throw new Error("Export not found");

    if (dataExport.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.exportId, {
      downloadedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete old exports (can be called by cron)
 */
export const cleanupExpiredExports = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const allExports = await ctx.db.query("dataExports").collect();

    let deleted = 0;
    for (const exp of allExports) {
      if (exp.expiresAt && exp.expiresAt < now && exp.status !== "expired") {
        await ctx.db.patch(exp._id, { status: "expired", fileUrl: undefined });
        deleted++;
      }
    }

    return { expired: deleted };
  },
});
