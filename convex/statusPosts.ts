import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new status post
export const createStatusPost = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
    content: v.optional(v.string()),
    textContent: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    font: v.optional(v.string()),
    duration: v.optional(v.number()),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    const statusId = await ctx.db.insert("statusPosts", {
      userId: args.userId,
      type: args.type,
      content: args.content,
      textContent: args.textContent,
      backgroundColor: args.backgroundColor,
      font: args.font,
      duration: args.duration,
      mediaUrl: args.mediaUrl,
      createdAt: now,
      expiresAt,
    });

    return statusId;
  },
});

// Get all active status posts from matches (contacts)
export const getMatchesStatusPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get user's matches
    const matches1 = await ctx.db
      .query("matches")
      .withIndex("user1Id", (q) => q.eq("user1Id", args.userId))
      .collect();

    const matches2 = await ctx.db
      .query("matches")
      .withIndex("user2Id", (q) => q.eq("user2Id", args.userId))
      .collect();

    // Get all matched user IDs
    const matchedUserIds = [
      ...matches1.map((m) => m.user2Id),
      ...matches2.map((m) => m.user1Id),
    ];

    // Get active status posts from matched users
    const statusPostsPromises = matchedUserIds.map(async (userId) => {
      const posts = await ctx.db
        .query("statusPosts")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .filter((q) => q.gt(q.field("expiresAt"), now))
        .order("desc")
        .collect();

      if (posts.length === 0) return null;

      // Get user info
      const user = await ctx.db.get(userId);
      const profile = await ctx.db
        .query("profiles")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .first();

      const primaryPhoto = await ctx.db
        .query("photos")
        .withIndex("primary", (q) => q.eq("userId", userId).eq("isPrimary", true))
        .first();

      // Check if current user has viewed all posts
      const viewedPosts = await ctx.db
        .query("statusViews")
        .withIndex("viewerId", (q) => q.eq("viewerId", args.userId))
        .filter((q) => q.eq(q.field("statusOwnerId"), userId))
        .collect();

      const viewedPostIds = new Set(viewedPosts.map((v) => v.statusId));
      const hasUnviewed = posts.some((p) => !viewedPostIds.has(p._id));

      return {
        userId,
        userName: user?.name || "Unknown",
        userPhoto: primaryPhoto?.url,
        posts: posts.map((p) => ({
          _id: p._id,
          type: p.type,
          content: p.content,
          textContent: p.textContent,
          backgroundColor: p.backgroundColor,
          font: p.font,
          duration: p.duration,
          mediaUrl: p.mediaUrl,
          createdAt: p.createdAt,
          expiresAt: p.expiresAt,
        })),
        hasUnviewed,
        latestPostAt: posts[0].createdAt,
      };
    });

    const statusPosts = (await Promise.all(statusPostsPromises)).filter(
      (s) => s !== null
    );

    // Sort by hasUnviewed first, then by latest post time
    return statusPosts.sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return b.latestPostAt - a.latestPostAt;
    });
  },
});

// Get user's own status posts
export const getMyStatusPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const posts = await ctx.db
      .query("statusPosts")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .order("desc")
      .collect();

    // Get views and likes for each post
    const postsWithStats = await Promise.all(
      posts.map(async (post) => {
        const views = await ctx.db
          .query("statusViews")
          .withIndex("statusId", (q) => q.eq("statusId", post._id))
          .collect();

        const likes = await ctx.db
          .query("statusLikes")
          .withIndex("statusId", (q) => q.eq("statusId", post._id))
          .collect();

        // Get viewer details
        const viewerDetails = await Promise.all(
          views.map(async (view) => {
            const user = await ctx.db.get(view.viewerId);
            const primaryPhoto = await ctx.db
              .query("photos")
              .withIndex("primary", (q) =>
                q.eq("userId", view.viewerId).eq("isPrimary", true)
              )
              .first();

            return {
              userId: view.viewerId,
              userName: user?.name || "Unknown",
              userPhoto: primaryPhoto?.url,
              viewedAt: view.viewedAt,
            };
          })
        );

        // Get liker details
        const likerDetails = await Promise.all(
          likes.map(async (like) => {
            const user = await ctx.db.get(like.userId);
            const primaryPhoto = await ctx.db
              .query("photos")
              .withIndex("primary", (q) =>
                q.eq("userId", like.userId).eq("isPrimary", true)
              )
              .first();

            return {
              userId: like.userId,
              userName: user?.name || "Unknown",
              userPhoto: primaryPhoto?.url,
              likedAt: like.createdAt,
            };
          })
        );

        return {
          ...post,
          viewCount: views.length,
          likeCount: likes.length,
          viewers: viewerDetails,
          likers: likerDetails,
        };
      })
    );

    return postsWithStats;
  },
});

// Get specific user's status posts (for viewing)
export const getUserStatusPosts = query({
  args: {
    userId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const posts = await ctx.db
      .query("statusPosts")
      .withIndex("userId", (q) => q.eq("userId", args.targetUserId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .order("desc")
      .collect();

    // Get user info
    const user = await ctx.db.get(args.targetUserId);
    const primaryPhoto = await ctx.db
      .query("photos")
      .withIndex("primary", (q) =>
        q.eq("userId", args.targetUserId).eq("isPrimary", true)
      )
      .first();

    // Check which posts current user has viewed
    const viewedPosts = await ctx.db
      .query("statusViews")
      .withIndex("viewerId", (q) => q.eq("viewerId", args.userId))
      .filter((q) => q.eq(q.field("statusOwnerId"), args.targetUserId))
      .collect();

    const viewedPostIds = new Set(viewedPosts.map((v) => v.statusId));

    // Check which posts current user has liked
    const likedPosts = await ctx.db
      .query("statusLikes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    const likedPostIds = new Set(likedPosts.map((l) => l.statusId));

    const isOwnStatus = args.userId === args.targetUserId;

    const postsWithMetadata = await Promise.all(
      posts.map(async (post) => {
        const views = await ctx.db
          .query("statusViews")
          .withIndex("statusId", (q) => q.eq("statusId", post._id))
          .collect();

        const likes = await ctx.db
          .query("statusLikes")
          .withIndex("statusId", (q) => q.eq("statusId", post._id))
          .collect();

        // If viewing own status, include viewer and liker details
        let viewerDetails = undefined;
        let likerDetails = undefined;

        if (isOwnStatus) {
          // Get viewer details
          viewerDetails = await Promise.all(
            views.map(async (view) => {
              const user = await ctx.db.get(view.viewerId);
              const primaryPhoto = await ctx.db
                .query("photos")
                .withIndex("primary", (q) =>
                  q.eq("userId", view.viewerId).eq("isPrimary", true)
                )
                .first();

              return {
                userId: view.viewerId,
                userName: user?.name || "Unknown",
                userPhoto: primaryPhoto?.url,
                viewedAt: view.viewedAt,
              };
            })
          );

          // Get liker details
          likerDetails = await Promise.all(
            likes.map(async (like) => {
              const user = await ctx.db.get(like.userId);
              const primaryPhoto = await ctx.db
                .query("photos")
                .withIndex("primary", (q) =>
                  q.eq("userId", like.userId).eq("isPrimary", true)
                )
                .first();

              return {
                userId: like.userId,
                userName: user?.name || "Unknown",
                userPhoto: primaryPhoto?.url,
                likedAt: like.createdAt,
              };
            })
          );
        }

        return {
          ...post,
          viewCount: views.length,
          likeCount: likes.length,
          isViewed: viewedPostIds.has(post._id),
          isLiked: likedPostIds.has(post._id),
          ...(isOwnStatus && { viewers: viewerDetails, likers: likerDetails }),
        };
      })
    );

    return {
      userId: args.targetUserId,
      userName: user?.name || "Unknown",
      userPhoto: primaryPhoto?.url,
      posts: postsWithMetadata,
    };
  },
});

// Mark a status post as viewed
export const viewStatusPost = mutation({
  args: {
    userId: v.id("users"),
    statusId: v.id("statusPosts"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const status = await ctx.db.get(args.statusId);
    if (!status) throw new Error("Status not found");

    // Don't record view if user is viewing their own status
    if (status.userId === args.userId) return;

    // Check if already viewed
    const existingView = await ctx.db
      .query("statusViews")
      .withIndex("statusViewer", (q) =>
        q.eq("statusId", args.statusId).eq("viewerId", args.userId)
      )
      .first();

    if (existingView) return; // Already viewed

    // Record the view
    await ctx.db.insert("statusViews", {
      statusId: args.statusId,
      viewerId: args.userId,
      statusOwnerId: status.userId,
      viewedAt: Date.now(),
    });

    // Create notification for status owner
    await ctx.db.insert("notifications", {
      userId: status.userId,
      type: "profile_view",
      title: "Status viewed",
      body: `${user.name} viewed your status`,
      relatedUserId: args.userId,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Like a status post
export const likeStatusPost = mutation({
  args: {
    userId: v.id("users"),
    statusId: v.id("statusPosts"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const status = await ctx.db.get(args.statusId);
    if (!status) throw new Error("Status not found");

    // Check if already liked
    const existingLike = await ctx.db
      .query("statusLikes")
      .withIndex("statusUser", (q) =>
        q.eq("statusId", args.statusId).eq("userId", args.userId)
      )
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("statusLikes", {
        statusId: args.statusId,
        userId: args.userId,
        statusOwnerId: status.userId,
        createdAt: Date.now(),
      });

      // Create notification for status owner (only if not own status)
      if (status.userId !== args.userId) {
        await ctx.db.insert("notifications", {
          userId: status.userId,
          type: "like",
          title: "Status liked",
          body: `${user.name} liked your status`,
          relatedUserId: args.userId,
          isRead: false,
          createdAt: Date.now(),
        });
      }

      return { liked: true };
    }
  },
});

// Delete a status post
export const deleteStatusPost = mutation({
  args: {
    userId: v.id("users"),
    statusId: v.id("statusPosts"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const status = await ctx.db.get(args.statusId);
    if (!status) throw new Error("Status not found");

    // Check if user owns this status
    if (status.userId !== args.userId) {
      throw new Error("Not authorized to delete this status");
    }

    // Delete the status post
    await ctx.db.delete(args.statusId);

    // Delete associated views
    const views = await ctx.db
      .query("statusViews")
      .withIndex("statusId", (q) => q.eq("statusId", args.statusId))
      .collect();

    for (const view of views) {
      await ctx.db.delete(view._id);
    }

    // Delete associated likes
    const likes = await ctx.db
      .query("statusLikes")
      .withIndex("statusId", (q) => q.eq("statusId", args.statusId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }
  },
});
