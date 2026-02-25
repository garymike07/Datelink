import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function submitReportImpl(
    ctx: any,
    args: {
        reporterId: any;
        reportedUserId: any;
        category: string;
        subcategory: string;
        description?: string;
        screenshots?: string[];
        autoBlock?: boolean;
    }
) {
    const now = Date.now();

    const recentReports = await ctx.db
        .query("reports")
        .withIndex("reporterId", (q: any) => q.eq("reporterId", args.reporterId))
        .collect();

    const alreadyReported = recentReports.some(
        (r: any) => r.reportedUserId === args.reportedUserId && now - r.createdAt < 24 * 60 * 60 * 1000
    );

    if (alreadyReported) {
        throw new Error("You have already reported this user recently");
    }

    const reportId = await ctx.db.insert("reports", {
        reporterId: args.reporterId,
        reportedUserId: args.reportedUserId,

        category: args.category,
        subcategory: args.subcategory,
        description: args.description,
        screenshots: args.screenshots,
        status: "pending",
        createdAt: now,
    });

    if (args.autoBlock) {
        const existing = await ctx.db
            .query("blocks")
            .withIndex("pair", (q: any) => q.eq("blockerId", args.reporterId).eq("blockedUserId", args.reportedUserId))
            .first();
        if (!existing) {
            await ctx.db.insert("blocks", {
                blockerId: args.reporterId,
                blockedUserId: args.reportedUserId,
                createdAt: now,
            });
        }
    }

    return reportId;
}

export const submitReport = mutation({
    args: {
        reporterId: v.id("users"),
        reportedUserId: v.id("users"),
        category: v.string(),
        subcategory: v.string(),
        description: v.optional(v.string()),
        screenshots: v.optional(v.array(v.string())),
        autoBlock: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        return await submitReportImpl(ctx, {
            reporterId: args.reporterId,
            reportedUserId: args.reportedUserId,
            category: args.category,
            subcategory: args.subcategory,
            description: args.description,
            screenshots: args.screenshots,
            autoBlock: args.autoBlock,
        });
    },
});

// Backwards-compatible alias
export const reportUser = mutation({
    args: {
        reporterId: v.id("users"),
        reportedUserId: v.id("users"),
        reason: v.string(),
        details: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await submitReportImpl(ctx, {
            reporterId: args.reporterId,
            reportedUserId: args.reportedUserId,
            category: "other",
            subcategory: args.reason,
            description: args.details,
            autoBlock: false,
        });
    },
});

// Block a user
export const blockUser = mutation({
    args: {
        blockerId: v.id("users"),
        blockedUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Check if already blocked
        const existing = await ctx.db
            .query("blocks")
            .withIndex("pair", (q) => q.eq("blockerId", args.blockerId).eq("blockedUserId", args.blockedUserId))
            .first();

        if (existing) {
            return existing._id; // Already blocked
        }

        const blockId = await ctx.db.insert("blocks", {
            blockerId: args.blockerId,
            blockedUserId: args.blockedUserId,
            createdAt: Date.now(),
        });

        return blockId;
    },
});

// Unblock a user
export const unblockUser = mutation({
    args: {
        blockerId: v.id("users"),
        blockedUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const block = await ctx.db
            .query("blocks")
            .withIndex("pair", (q) => q.eq("blockerId", args.blockerId).eq("blockedUserId", args.blockedUserId))
            .first();

        if (block) {
            await ctx.db.delete(block._id);
        }
    },
});

// Get blocked users
export const getBlockedUsers = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const blocks = await ctx.db
            .query("blocks")
            .withIndex("blockerId", (q) => q.eq("blockerId", args.userId))
            .collect();

        const blockedUsers = [];
        for (const block of blocks) {
            const profile = await ctx.db
                .query("profiles")
                .withIndex("userId", (q) => q.eq("userId", block.blockedUserId))
                .first();

            if (profile) {
                blockedUsers.push({
                    userId: block.blockedUserId,
                    age: profile.age,
                    location: profile.location,
                    blockedAt: block.createdAt,
                });
            }
        }

        return blockedUsers;
    },
});

export const getMyReports = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const reports = await ctx.db
            .query("reports")
            .withIndex("reporterId", (q) => q.eq("reporterId", args.userId))
            .collect();

        reports.sort((a, b) => b.createdAt - a.createdAt);
        return reports;
    },
});

// Get reports (admin only - placeholder)
export const getReports = query({
    args: {
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // TODO: Add admin authentication check

        let reports;
        
        if (args.status) {
            const status = args.status;
            reports = await ctx.db
                .query("reports")
                .withIndex("status", (q) => q.eq("status", status))
                .collect();
        } else {
            reports = await ctx.db
                .query("reports")
                .collect();
        }

        // Sort by most recent
        reports.sort((a, b) => b.createdAt - a.createdAt);

        return reports;
    },
});
